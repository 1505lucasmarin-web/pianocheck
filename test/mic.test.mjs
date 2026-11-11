import test from 'node:test';
import assert from 'node:assert/strict';
import { createMicInput, micErrorMessage } from '../js/mic.js';
import { renderEvents } from './synth.mjs';

function fakeEnv({ fail } = {}) {
  const log = { stopped: 0, closed: 0, constraints: null };
  let proc = null;
  const track = { onended: null, stop() { log.stopped++; } };
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
  class FakeAC {
    constructor() { this.sampleRate = 44100; this.state = 'running'; this.destination = {}; }
    resume() { return Promise.resolve(); }
    createMediaStreamSource() { return { connect() {}, disconnect() {} }; }
    createGain() { return { gain: { value: 1 }, connect() {}, disconnect() {} }; }
    createScriptProcessor() { proc = { connect() {}, disconnect() {}, onaudioprocess: null }; return proc; }
    close() { this.state = 'closed'; log.closed++; return Promise.resolve(); }
  }
  globalThis.AudioContext = FakeAC;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { mediaDevices: { getUserMedia: async (c) => { log.constraints = c; if (fail) { const e = new Error('x'); e.name = fail; throw e; } return stream; } } } });
  return { log, track, feed: (buf) => { for (let i = 0; i + 2048 <= buf.length; i += 2048) proc.onaudioprocess({ inputBuffer: { getChannelData: () => buf.subarray(i, i + 2048) } }); } };
}

test('mic: pide audio sin procesado, detecta una nota y libera el micrófono al detener', async () => {
  const env = fakeEnv();
  const notes = [], sts = [];
  const mic = createMicInput({ onNoteOn: (m) => notes.push(m), onStatus: (s) => sts.push(s), getExpected: () => [64] });
  assert.equal(mic.supported, true);
  await mic.start();
  assert.deepEqual([env.log.constraints.audio.echoCancellation, env.log.constraints.audio.noiseSuppression, env.log.constraints.audio.autoGainControl], [false, false, false]);
  env.feed(renderEvents([{ t: 0.5, notes: [64], dur: 1.2 }], { seed: 3, total: 2.2 }));
  assert.deepEqual(notes, [64]);
  const withLevel = sts.filter((s) => s.connected && typeof s.level === 'number');
  assert.ok(withLevel.length > 2 && withLevel.some((s) => s.level > 0.2), 'reporta nivel');
  assert.ok(sts.every((s) => s.via === 'mic' && s.name === 'Micrófono'));
  mic.stop();
  assert.equal(env.log.stopped, 1);
  assert.equal(env.log.closed, 1);
  assert.equal(sts.at(-1).connected, false);
});

test('mic: errores en español (permiso denegado, sin micrófono)', async () => {
  fakeEnv({ fail: 'NotAllowedError' });
  let st = null;
  let mic = createMicInput({ onStatus: (s) => { st = s; } });
  await assert.rejects(mic.start(), /Permiso de micrófono denegado/);
  assert.equal(st.connected, false); assert.match(st.error, /denegado/);
  fakeEnv({ fail: 'NotFoundError' });
  mic = createMicInput({ onStatus: (s) => { st = s; } });
  await assert.rejects(mic.start(), /No se encontró ningún micrófono/);
  assert.match(micErrorMessage({ name: 'NotReadableError' }), /otra aplicación/);
});

test('mic: stop() mientras se espera el permiso no deja el micrófono abierto', async () => {
  const env = fakeEnv();
  const mic = createMicInput({});
  const p = mic.start();
  mic.stop();
  await p;
  assert.equal(env.log.stopped, 1);
  assert.equal(mic.running, false);
});

test('mic: sin API de audio, supported=false', () => {
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} });
  delete globalThis.AudioContext;
  assert.equal(createMicInput({}).supported, false);
});
