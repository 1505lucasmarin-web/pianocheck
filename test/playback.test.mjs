import test from 'node:test';
import assert from 'node:assert/strict';
import { demoScore } from '../js/demo.js';
import { buildSteps } from '../js/model.js';
import { passageSteps } from '../js/passage.js';
import { buildEvents, totalSeconds, createPlayer } from '../js/playback.js';

const all = buildSteps(demoScore, 'both');
const ps = passageSteps(all, { from: 3, to: 4 });   // compás 4 (con negra con puntillo + corchea) y 5

test('buildEvents: tempo, duraciones y notas por paso (60 bpm → 1 negra = 1 s)', () => {
  const ev = buildEvents(demoScore, ps, { bpm: 60, speed: 1 });
  // compás 4: mano derecha = negra con puntillo (1,5), corchea (0,5), blanca (2); mano izquierda = dos blancas
  const m4 = ev.filter((e) => e.at < 4);
  const rh = m4.filter((e) => e.hand === 'rh');
  assert.deepEqual(rh.map((e) => [e.at, e.dur]), [[0, 1.5], [1.5, 0.5], [2, 2]]);
  const uniq = (l) => [...new Set(l.map((e) => e.at + ':' + e.dur))];
  assert.deepEqual(uniq(m4.filter((e) => e.hand === 'lh')), ['0:2', '2:2']);   // acordes de 2 notas: 2 eventos por tiempo
  assert.equal(totalSeconds(ev), 8);
  assert.ok(ev.every((e) => Number.isInteger(e.step) && e.beat >= 12 && e.beat < 20));
});

test('buildEvents: tempo y velocidad lenta escalan', () => {
  const norm = buildEvents(demoScore, ps, { bpm: 120, speed: 1 });
  assert.equal(totalSeconds(norm), 4);
  const slow = buildEvents(demoScore, ps, { bpm: 120, speed: 0.6 });
  assert.ok(Math.abs(totalSeconds(slow) - 4 / 0.6) < 1e-9);
});

test('buildEvents por mano: sólo esa mano, mismo tiempo', () => {
  const lh = buildEvents(demoScore, passageSteps(buildSteps(demoScore, 'lh'), { from: 3, to: 4 }), { bpm: 60 });
  assert.ok(lh.every((e) => e.hand === 'lh'));
  assert.equal(totalSeconds(lh), 8);
});

test('buildEvents: las ligaduras suman a la nota inicial', () => {
  const sc = { timeSig: [4, 4], measures: [{ rh: [{ k: ['c/4'], d: 'h' }, { k: ['c/4'], d: 'h', tie: true }], lh: [] }, { rh: [{ k: ['c/4'], d: 'h', tie: true }, { k: ['d/4'], d: 'h' }], lh: [] }] };
  const ev = buildEvents(sc, buildSteps(sc, 'both'), { bpm: 60 });
  assert.deepEqual(ev.map((e) => [e.midi, e.at, e.dur]), [[60, 0, 6], [62, 6, 2]]);
});

// AudioContext falso: cuenta osciladores y registra stop(); el reloj avanza en tiempo real
function fakeAC() {
  const made = { osc: 0, started: 0, stopped: 0 };
  class P { constructor() { this.value = 0; } setValueAtTime() {} exponentialRampToValueAtTime() {} linearRampToValueAtTime() {} setTargetAtTime() {} cancelScheduledValues() {} }
  class Node { connect() {} disconnect() {} }
  const t0 = performance.now();
  class AC {
    constructor() { this.state = 'running'; this.sampleRate = 8000; this.destination = new Node(); }
    get currentTime() { return (performance.now() - t0) / 1000; }
    createGain() { const n = new Node(); n.gain = new P(); return n; }
    createDynamicsCompressor() { const n = new Node(); ['threshold', 'knee', 'ratio', 'attack', 'release'].forEach((k) => { n[k] = new P(); }); return n; }
    createBiquadFilter() { const n = new Node(); n.frequency = new P(); n.Q = new P(); return n; }
    createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; }
    createBufferSource() { const n = new Node(); n.start = () => {}; n.stop = () => {}; return n; }
    createOscillator() { made.osc++; const o = new Node(); o.frequency = new P(); o.detune = new P(); o.start = () => { made.started++; }; o.stop = () => { made.stopped++; }; return o; }
  }
  return { AC, made };
}

test('createPlayer (compatibilidad): programa las notas, avisa los pasos y se puede detener', async () => {
  const { AC, made } = fakeAC();
  const pl = createPlayer({ AudioContext: AC });
  const ev = buildEvents(demoScore, ps, { bpm: 6000, speed: 1 });   // muy rápido: dura ~40 ms
  const seen = []; let ended = 0;
  const total = pl.play(ev, { onStep: (e) => seen.push(e.step), onEnd: () => { ended++; } });
  assert.ok(total > 0 && pl.playing);
  assert.equal(pl.voices, ev.length);            // todo entra en la primera tanda (varios osciladores por nota: parciales + martillo)
  assert.ok(made.osc >= ev.length * 3);
  await new Promise((r) => setTimeout(r, 600));
  assert.equal(ended, 1); assert.equal(pl.playing, false);
  assert.deepEqual(seen, [...new Set(ev.map((e) => e.step))]);

  const pl2 = createPlayer({ AudioContext: AC });
  let ended2 = 0, steps2 = 0;
  pl2.play(buildEvents(demoScore, ps, { bpm: 60 }), { onStep: () => { steps2++; }, onEnd: () => { ended2++; } });
  assert.ok(pl2.playing);
  assert.equal(pl2.stop(), true);
  assert.equal(pl2.playing, false);
  await new Promise((r) => setTimeout(r, 300));
  assert.equal(ended2, 0);                       // detenido: no hay "fin natural"
  assert.ok(steps2 <= 1);
});
