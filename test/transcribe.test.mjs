import test from 'node:test';
import assert from 'node:assert/strict';

// transcribe.js se importa sin tocar el navegador: el motor (TF.js + modelo) sólo se carga al transcribir.
const mod = await import('../js/transcribe.js');

function withGlobals(patch, fn) {
  const saved = {};
  for (const k of Object.keys(patch)) saved[k] = Object.getOwnPropertyDescriptor(globalThis, k);
  for (const [k, v] of Object.entries(patch)) Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
  const restore = () => { for (const k of Object.keys(patch)) { if (saved[k]) Object.defineProperty(globalThis, k, saved[k]); else delete globalThis[k]; } };
  return Promise.resolve().then(fn).finally(restore);
}

test('importar transcribe.js no carga el motor ni toca el DOM', () => {
  assert.equal(typeof mod.transcribeAudio, 'function');
  assert.equal(typeof mod.recordFromMic, 'function');
  assert.equal(typeof mod.isSupported, 'function');
});

test('isSupported: falso sin WebAudio, verdadero con él', async () => {
  assert.equal(mod.isSupported(), false);
  await withGlobals({ AudioContext: class {}, OfflineAudioContext: class {} }, () => assert.equal(mod.isSupported(), true));
  assert.equal(mod.isSupported(), false);
});

test('transcribeAudio rechaza con mensajes claros en español', async () => {
  await assert.rejects(() => mod.transcribeAudio(null), /Falta el audio/);
  await assert.rejects(() => mod.transcribeAudio(new Blob([new Uint8Array(10)])), /WebAudio/);
});

test('recordFromMic: sin soporte, sin permiso y sin micrófono dan errores en español', async () => {
  await assert.rejects(() => mod.recordFromMic(), /no permite grabar/);
  const mk = (name) => ({ mediaDevices: { getUserMedia: async () => { const e = new Error('x'); e.name = name; throw e; } } });
  const base = { AudioContext: class {}, MediaRecorder: class {} };
  await withGlobals({ ...base, navigator: mk('NotAllowedError') }, () => assert.rejects(() => mod.recordFromMic(), /No hay permiso para usar el micrófono/));
  await withGlobals({ ...base, navigator: mk('NotFoundError') }, () => assert.rejects(() => mod.recordFromMic(), /No se encontró ningún micrófono/));
  await withGlobals({ ...base, navigator: mk('NotReadableError') }, () => assert.rejects(() => mod.recordFromMic(), /otra aplicación/));
});

test('recordFromMic pide el audio SIN cancelación de eco, supresión de ruido ni AGC, y devuelve un Blob', async () => {
  let asked = null, stopped = 0;
  class FakeRecorder {
    static isTypeSupported(t) { return t === 'audio/webm;codecs=opus'; }
    constructor(stream, o) { this.state = 'inactive'; this.mimeType = (o && o.mimeType) || ''; }
    start() { this.state = 'recording'; setTimeout(() => this.ondataavailable({ data: new Blob([new Uint8Array(8)]) }), 0); }
    stop() { this.state = 'inactive'; setTimeout(() => this.onstop(), 0); }
  }
  const stream = { getTracks: () => [{ stop: () => { stopped++; } }] };
  const nav = { mediaDevices: { getUserMedia: async (c) => { asked = c; return stream; } } };
  await withGlobals({ AudioContext: class {}, MediaRecorder: FakeRecorder, navigator: nav }, async () => {
    const h = await mod.recordFromMic({ maxSeconds: 5 });
    assert.deepEqual(asked.audio, { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 });
    await new Promise((r) => setTimeout(r, 5));
    const blob = await h.stop();
    assert.ok(blob instanceof Blob);
    assert.equal(blob.type, 'audio/webm;codecs=opus');
    assert.equal(stopped, 1, 'se suelta el micrófono');
  });
  // cancelar libera el micrófono y no entrega audio
  stopped = 0;
  await withGlobals({ AudioContext: class {}, MediaRecorder: FakeRecorder, navigator: nav }, async () => {
    const h = await mod.recordFromMic({ maxSeconds: 5 });
    h.cancel();
    await assert.rejects(() => h.done, (e) => e.name === 'AbortError');
    assert.equal(stopped, 1);
  });
});

test('toMono22k: remuestrea a 22050 Hz mono y recorta a maxSeconds avisando', async () => {
  const fakeBuf = { duration: 10, numberOfChannels: 2, sampleRate: 44100, getChannelData: () => new Float32Array(1) };
  class FakeOffline {
    constructor(ch, len, sr) { this.len = len; this.sr = sr; this.destination = {}; assert.equal(ch, 1); }
    createBufferSource() { return { connect() {}, start() {}, set buffer(b) { assert.equal(b, fakeBuf); } }; }
    async startRendering() { return { getChannelData: () => new Float32Array(this.len).fill(0.1) }; }
  }
  await withGlobals({ AudioContext: class {}, OfflineAudioContext: FakeOffline }, async () => {
    const r = await mod.toMono22k(fakeBuf, { maxSeconds: 4 });
    assert.equal(r.pcm.length, 4 * 22050);
    assert.equal(r.seconds, 4);
    assert.ok(r.warnings.some((w) => /primeros 4 s/.test(w)));
    const ctl = new AbortController(); ctl.abort();
    await assert.rejects(() => mod.toMono22k(fakeBuf, { signal: ctl.signal }), (e) => e.name === 'AbortError');
  });
});
