// Entrada MIDI: Web MIDI (USB) y BLE-MIDI (Web Bluetooth). Seguro de importar en Node.

export const BLE_MIDI_SERVICE = '03b80e5a-ede8-4b33-a751-6ce34ec4c700';
export const BLE_MIDI_CHAR = '7772e5db-3868-4112-a1a9-f2669d106bf3';

function toBytes(data) {
  if (data instanceof Uint8Array) return data;
  if (data && ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  return new Uint8Array(0);
}

function dataLen(status) {
  const hi = status & 0xf0;
  if (hi === 0xc0 || hi === 0xd0) return 1;
  if (status === 0xf1 || status === 0xf3) return 1;
  if (status === 0xf2) return 2;
  return 2;
}

/**
 * Parser de paquetes BLE-MIDI. Soporta timestamps, running status y varios mensajes por paquete.
 * Devuelve [{status, data1, data2}] (status crudo con canal; data2 = 0 si el mensaje tiene un solo dato).
 * SysEx y mensajes de tiempo real se ignoran.
 */
export function parseBleMidi(data) {
  const b = toBytes(data);
  const out = [];
  if (b.length < 2) return out;
  let i = 1; // b[0] = cabecera con timestamp alto
  let running = 0;
  while (i < b.length) {
    let status = 0;
    const cur = b[i];
    if (cur & 0x80) {
      const next = i + 1 < b.length ? b[i + 1] : -1;
      if (next >= 0x80) {
        // cur = timestamp, next = status
        status = next;
        i += 2;
      } else if (next >= 0 && running) {
        // cur = timestamp, siguen datos con running status
        status = running;
        i += 1;
      } else if (next >= 0) {
        // estado sin timestamp (tolerante)
        status = cur;
        i += 1;
      } else {
        break; // byte suelto al final
      }
    } else {
      if (!running) { i++; continue; }
      status = running; // datos con running status sin timestamp
    }

    if (status >= 0xf8) { continue; } // tiempo real: sin datos
    if (status === 0xf0) { // SysEx: saltar hasta 0xF7
      running = 0;
      while (i < b.length && b[i] !== 0xf7) i++;
      i++;
      continue;
    }
    if (status >= 0xf0) running = 0; else running = status;
    const n = dataLen(status);
    if (i + n > b.length) break;
    const d1 = b[i];
    const d2 = n === 2 ? b[i + 1] : 0;
    if (d1 & 0x80 || (n === 2 && (d2 & 0x80))) { // datos corruptos: resincronizar
      running = 0;
      continue;
    }
    i += n;
    if (status < 0xf0) out.push({ status, data1: d1, data2: d2 });
  }
  return out;
}

export function createMidiInput({ onNoteOn, onNoteOff, onStatus } = {}) {
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const supported = {
    usb: !!(nav && typeof nav.requestMIDIAccess === 'function'),
    ble: !!(nav && nav.bluetooth && typeof nav.bluetooth.requestDevice === 'function'),
  };
  const status = (s) => { try { onStatus && onStatus(s); } catch (e) { /* ignorar */ } };

  let access = null;
  let usbActive = false;
  let bleDevice = null;
  let bleChar = null;
  let bleHandler = null;
  let bleWanted = false;
  let reconnecting = false;

  function handleMsg(st, d1, d2) {
    const hi = st & 0xf0;
    if (hi === 0x90 && d2 > 0) onNoteOn && onNoteOn(d1, d2);
    else if (hi === 0x80 || hi === 0x90) onNoteOff && onNoteOff(d1);
  }

  // ---------- USB ----------
  function usbInputs() {
    const arr = [];
    if (access && access.inputs) access.inputs.forEach((inp) => arr.push(inp));
    return arr;
  }
  function usbRefresh() {
    const inputs = usbInputs();
    const live = inputs.filter((i) => i.state !== 'disconnected');
    inputs.forEach((inp) => {
      inp.onmidimessage = (e) => {
        const d = e.data;
        if (d && d.length >= 3) handleMsg(d[0], d[1], d[2]);
      };
    });
    if (live.length) status({ connected: true, name: live.map((i) => i.name).join(', '), via: 'usb' });
    else status({ connected: false, name: null, via: 'usb' });
  }
  async function connectUsb() {
    if (!supported.usb) {
      const error = 'Este navegador no soporta Web MIDI';
      status({ connected: false, name: null, via: null, error });
      throw new Error(error);
    }
    try {
      access = await nav.requestMIDIAccess({ sysex: false });
    } catch (e) {
      const error = 'No se pudo acceder a MIDI: ' + (e && e.message ? e.message : e);
      status({ connected: false, name: null, via: null, error });
      throw e;
    }
    usbActive = true;
    access.onstatechange = () => { if (usbActive) usbRefresh(); };
    usbRefresh();
    return access;
  }

  // ---------- BLE ----------
  function onBleValue(ev) {
    const v = ev.target && ev.target.value;
    if (!v) return;
    for (const m of parseBleMidi(v)) handleMsg(m.status, m.data1, m.data2);
  }
  async function bleSetup(device) {
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(BLE_MIDI_SERVICE);
    const ch = await service.getCharacteristic(BLE_MIDI_CHAR);
    if (bleChar && bleHandler) { try { bleChar.removeEventListener('characteristicvaluechanged', bleHandler); } catch (e) { /* */ } }
    bleChar = ch;
    bleHandler = onBleValue;
    ch.addEventListener('characteristicvaluechanged', bleHandler);
    await ch.startNotifications();
    status({ connected: true, name: device.name || 'Bluetooth MIDI', via: 'ble' });
  }
  async function bleReconnect(device) {
    if (reconnecting) return;
    reconnecting = true;
    status({ connected: false, name: device.name || null, via: 'ble', error: 'Conexión perdida, reconectando…' });
    const delays = [500, 1000, 2000, 4000, 8000, 15000];
    for (const wait of delays) {
      if (!bleWanted || bleDevice !== device) break;
      await new Promise((r) => setTimeout(r, wait));
      if (!bleWanted || bleDevice !== device) break;
      try {
        await bleSetup(device);
        reconnecting = false;
        return;
      } catch (e) { /* reintentar */ }
    }
    reconnecting = false;
    if (bleWanted && bleDevice === device) {
      status({ connected: false, name: device.name || null, via: 'ble', error: 'No se pudo reconectar el piano por Bluetooth' });
    }
  }
  async function connectBle() {
    if (!supported.ble) {
      const error = 'Este navegador no soporta Web Bluetooth';
      status({ connected: false, name: null, via: null, error });
      throw new Error(error);
    }
    let device;
    try {
      device = await nav.bluetooth.requestDevice({
        filters: [{ services: [BLE_MIDI_SERVICE] }],
        optionalServices: [BLE_MIDI_SERVICE],
      });
    } catch (e) {
      const error = e && e.name === 'NotFoundError' ? 'Selección de dispositivo cancelada' : 'No se pudo buscar el piano: ' + (e && e.message ? e.message : e);
      status({ connected: false, name: null, via: null, error });
      throw e;
    }
    if (bleDevice && bleDevice !== device) {
      try { bleDevice.removeEventListener('gattserverdisconnected', onGattDisc); } catch (e) { /* */ }
    }
    bleDevice = device;
    bleWanted = true;
    device.addEventListener('gattserverdisconnected', onGattDisc);
    try {
      await bleSetup(device);
    } catch (e) {
      const error = 'No se pudo conectar por Bluetooth: ' + (e && e.message ? e.message : e);
      status({ connected: false, name: device.name || null, via: 'ble', error });
      throw e;
    }
    return device;
  }
  function onGattDisc(ev) {
    const dev = (ev && ev.target) || bleDevice;
    if (bleWanted && dev) bleReconnect(dev);
  }

  function disconnect() {
    bleWanted = false;
    usbActive = false;
    if (access) {
      usbInputs().forEach((inp) => { inp.onmidimessage = null; });
      access.onstatechange = null;
    }
    if (bleChar && bleHandler) {
      try { bleChar.removeEventListener('characteristicvaluechanged', bleHandler); } catch (e) { /* */ }
    }
    if (bleDevice) {
      try { bleDevice.removeEventListener('gattserverdisconnected', onGattDisc); } catch (e) { /* */ }
      try { if (bleDevice.gatt && bleDevice.gatt.connected) bleDevice.gatt.disconnect(); } catch (e) { /* */ }
    }
    bleChar = null; bleHandler = null; bleDevice = null;
    status({ connected: false, name: null, via: null });
  }

  return { supported, connectUsb, connectBle, disconnect };
}
