import test from 'node:test';
import assert from 'node:assert/strict';
import { parseBleMidi, createMidiInput } from '../js/midi.js';

const u8 = (...b) => Uint8Array.from(b);

test('un note-on con timestamp', () => {
  assert.deepEqual(parseBleMidi(u8(0x90, 0x80, 0x90, 60, 100)), [{ status: 0x90, data1: 60, data2: 100 }]);
});

test('acepta DataView, incluso con offset', () => {
  const buf = u8(0xff, 0xff, 0x90, 0x80, 0x90, 64, 90, 0xff).buffer;
  const dv = new DataView(buf, 2, 6);
  assert.deepEqual(parseBleMidi(dv), [{ status: 0x90, data1: 64, data2: 90 }]);
  assert.deepEqual(parseBleMidi(new DataView(u8(0x90, 0x80, 0x90, 60, 100).buffer)), [{ status: 0x90, data1: 60, data2: 100 }]);
});

test('varios mensajes por paquete, cada uno con timestamp', () => {
  const r = parseBleMidi(u8(0xa5, 0xa6, 0x90, 60, 100, 0xa7, 0x80, 62, 0, 0xa8, 0x90, 64, 80));
  assert.deepEqual(r, [
    { status: 0x90, data1: 60, data2: 100 },
    { status: 0x80, data1: 62, data2: 0 },
    { status: 0x90, data1: 64, data2: 80 },
  ]);
});

test('running status con timestamp previo', () => {
  const r = parseBleMidi(u8(0x81, 0x82, 0x90, 60, 100, 0x83, 62, 90, 0x84, 64, 70));
  assert.deepEqual(r.map((m) => [m.status, m.data1, m.data2]), [[0x90, 60, 100], [0x90, 62, 90], [0x90, 64, 70]]);
});

test('running status sin timestamp entre mensajes', () => {
  const r = parseBleMidi(u8(0x81, 0x82, 0x90, 60, 100, 62, 90));
  assert.deepEqual(r.map((m) => [m.status, m.data1, m.data2]), [[0x90, 60, 100], [0x90, 62, 90]]);
});

test('mezcla note-on / note-off y cambio de estado', () => {
  const r = parseBleMidi(u8(0x80, 0x80, 0x90, 60, 100, 0x81, 0x80, 60, 64, 0x82, 0x91, 61, 50));
  assert.deepEqual(r.map((m) => [m.status, m.data1, m.data2]), [[0x90, 60, 100], [0x80, 60, 64], [0x91, 61, 50]]);
});

test('mensajes de un solo dato (program change) y tiempo real ignorado', () => {
  const r = parseBleMidi(u8(0x80, 0x81, 0xc0, 5, 0x82, 0xf8, 0x83, 0x90, 60, 100));
  assert.deepEqual(r.map((m) => [m.status, m.data1, m.data2]), [[0xc0, 5, 0], [0x90, 60, 100]]);
});

test('sysex se ignora y no rompe lo que sigue', () => {
  const r = parseBleMidi(u8(0x80, 0x81, 0xf0, 0x7e, 0x01, 0x82, 0xf7, 0x83, 0x90, 60, 100));
  assert.deepEqual(r.map((m) => [m.status, m.data1, m.data2]), [[0x90, 60, 100]]);
});

test('paquetes vacíos, truncados o basura no lanzan', () => {
  assert.deepEqual(parseBleMidi(u8()), []);
  assert.deepEqual(parseBleMidi(u8(0x80)), []);
  assert.deepEqual(parseBleMidi(u8(0x80, 0x81, 0x90, 60)), []);
  assert.deepEqual(parseBleMidi(null), []);
  assert.doesNotThrow(() => parseBleMidi(u8(0x80, 0x90, 0x90, 0x90, 0x90)));
});

test('createMidiInput se puede importar y crear en Node sin APIs', async () => {
  const m = createMidiInput({});
  assert.equal(m.supported.usb, false);
  assert.equal(m.supported.ble, false);
  let st;
  const m2 = createMidiInput({ onStatus: (s) => { st = s; } });
  await assert.rejects(m2.connectUsb());
  assert.equal(st.connected, false);
  assert.ok(st.error);
  await assert.rejects(m2.connectBle());
  assert.doesNotThrow(() => m2.disconnect());
});
