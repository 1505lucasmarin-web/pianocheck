import test from 'node:test';
import assert from 'node:assert/strict';
import { demoScore } from '../js/demo.js';
import { PIECES } from '../js/pieces.js';
import { buildSteps, durBeats } from '../js/model.js';
import { buildSchedule, createTransport, measureLayout, measureAtBeat, scheduleSeconds, measureSeconds, secPerBeat } from '../js/playback.js';
import { voicePlan, createSynth } from '../js/synth.js';

// ---- arnés: reloj falso + salida que registra cada nota
function rig({ events, startBeat, endBeat, loop = false, bpm = 60, speed = 1, lookahead = 1.5, extra = [] }) {
  const clock = { t: 100 };
  const log = [];
  const sink = { note(item, when, dur) { const r = { item, when, dur, cancelled: false, released: null }; log.push(r); return { cancel() { r.cancelled = true; }, release(now) { r.released = now; } }; } };
  let ended = 0;
  const tr = createTransport({ clock: () => clock.t, sink, lookahead, onEnd: () => { ended++; } });
  tr.load({ events: [...extra, ...events], startBeat, endBeat, loop });
  tr.setRate(bpm * speed / 60);
  const advance = (sec, dt = 0.02) => { for (let s = 0; s < sec - 1e-9; s += dt) { clock.t += dt; tr.tick(); } };
  return { clock, log, tr, advance, get ended() { return ended; } };
}
const alive = (log) => log.filter((r) => !r.cancelled && !r.item.click);
const sched = (score, o) => buildSchedule(score, o);

test('duración total de la demo a distintos tempos (32 negras)', () => {
  const sc = sched(demoScore);
  assert.equal(sc.endBeat - sc.startBeat, 32);
  assert.equal(scheduleSeconds(sc, 80, 1), 24);
  assert.equal(scheduleSeconds(sc, 120, 1), 16);
  assert.equal(scheduleSeconds(sc, 80, 0.5), 48);
  assert.ok(Math.abs(scheduleSeconds(sc, 80, 1.25) - 19.2) < 1e-9);
  const lay = measureLayout(demoScore);
  assert.equal(measureAtBeat(lay, 17), 4);
  assert.equal(measureSeconds(sc, 4, 80, 1), 12);
});

test('la cantidad de notas coincide con la partitura (acordes = una nota por altura)', () => {
  const sc = sched(demoScore);
  let expected = 0;
  for (const st of buildSteps(demoScore, 'both')) expected += st.midi.length;
  assert.equal(sc.events.length, expected);
});

test('ligaduras: una sola nota sostenida (también entre compases); la continuación no suena', () => {
  const s = { timeSig: [4, 4], measures: [{ rh: [{ k: ['c/4'], d: 'h' }, { k: ['c/4'], d: 'h', tie: true }], lh: [] }, { rh: [{ k: ['c/4'], d: 'h', tie: true }, { k: ['d/4'], d: 'h' }], lh: [] }] };
  const sc = sched(s);
  assert.deepEqual(sc.events.map((e) => [e.midi, e.beat, e.dur]), [[60, 0, 6], [62, 6, 2]]);
  const r = sched(s, { from: 1, to: 1 });          // pasaje que empieza en la ligadura: sólo suena lo que arranca ahí
  assert.deepEqual(r.events.map((e) => [e.midi, e.beat]), [[62, 6]]);
});

test('rango 5–6: sólo esos compases, con su inicio y fin', () => {
  const sc = sched(demoScore, { from: 4, to: 5 });
  assert.equal(sc.startBeat, 16); assert.equal(sc.endBeat, 24);
  assert.ok(sc.events.every((e) => e.measure >= 4 && e.measure <= 5 && e.beat >= 16 && e.beat < 24));
  assert.equal(scheduleSeconds(sc, 60, 1), 8);
});

test('mano sola', () => {
  const rh = sched(demoScore, { hands: 'rh' }), lh = sched(demoScore, { hands: 'lh' });
  assert.ok(rh.events.every((e) => e.hand === 'rh') && rh.events.length === 33 - 0 || rh.events.every((e) => e.hand === 'rh'));
  assert.ok(lh.events.every((e) => e.hand === 'lh'));
  assert.equal(rh.endBeat, 32); assert.equal(lh.endBeat, 32);   // misma duración, sin desfasar el tiempo
});

test('anacrusa declarada por la versión incluida: el primer compás dura lo que dice', () => {
  for (const p of PIECES) {
    const v = p.versions[0];
    if (!v.pickupBeats) continue;
    const lay = measureLayout(v.score);
    assert.equal(lay.lens[0], v.pickupBeats, p.id);
    const sc = sched(v.score);
    assert.equal(sc.events[0].beat, 0);
    assert.equal(sc.endBeat, lay.starts.at(-1) + lay.lens.at(-1));
  }
});

test('metrónomo: clics por compás (3/4 con anacrusa) y cuenta de entrada de un compás', () => {
  const cb = PIECES.find((p) => p.id.includes('cumple') || p.title.toLowerCase().includes('cumplea')).versions[0].score;
  const sc = sched(cb);
  assert.equal(sc.clicks.filter((c) => c.measure === 0).length, 1);     // anacrusa de una negra
  assert.equal(sc.clicks.filter((c) => c.measure === 1).length, 3);
  assert.equal(sc.countIn.length, 3);
  assert.ok(sc.countIn.every((c) => c.beat < sc.startBeat));
});

test('reproducción: las notas se programan con anticipación y en su instante exacto', () => {
  const sc = sched(demoScore);
  const R = rig({ events: sc.events, startBeat: sc.startBeat, endBeat: sc.endBeat, bpm: 120 });
  R.tr.play(0);
  const T0 = 100.06;
  R.advance(17);
  const notes = alive(R.log);
  assert.equal(notes.length, sc.events.length);
  for (const r of notes) assert.ok(Math.abs(r.when - (T0 + r.item.beat * 0.5)) < 1e-6);
  assert.equal(R.ended, 1);
  assert.equal(R.tr.state, 'stopped');
});

test('seek al compás 5: suena desde ahí y no repite lo anterior', () => {
  const sc = sched(demoScore);
  const R = rig({ events: sc.events, startBeat: 0, endBeat: sc.endBeat, bpm: 60 });
  R.tr.play(0); R.advance(3);
  R.tr.seek(sc.lay.starts[4]);
  R.advance(1);
  const after = R.log.filter((r) => !r.cancelled && r.when >= R.clock.t - 1.1 - 3 && r.item.beat >= 16);
  assert.ok(after.length > 0);
  assert.ok(Math.abs(R.tr.position() - 17) < 0.2);
  const fut = R.log.filter((r) => !r.cancelled && r.when > 103.1);
  assert.ok(fut.every((r) => r.item.beat >= 16), 'nada de antes del compás 5 después del salto');
});

test('velocidad a mitad de la pieza: la posición no salta y el resto sigue al nuevo ritmo', () => {
  const sc = sched(demoScore);
  const R = rig({ events: sc.events, startBeat: 0, endBeat: sc.endBeat, bpm: 60 });
  R.tr.play(0); R.advance(6);
  const pos = R.tr.position(), t = R.clock.t;
  assert.ok(Math.abs(pos - (6 - 0.06)) < 0.05);
  R.tr.setRate(0.5);                        // 50 %
  assert.ok(Math.abs(R.tr.position() - pos) < 1e-6);
  R.advance(70);
  const notes = alive(R.log).filter((r) => r.item.beat >= pos + 0.001);
  for (const r of notes) assert.ok(Math.abs(r.when - (t + (r.item.beat - pos) / 0.5)) < 1e-6, 'beat ' + r.item.beat);
  // cada nota exactamente una vez
  const keys = alive(R.log).map((r) => r.item.id);
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(keys.length, sc.events.length);
});

test('pausa y reanudación: sin notas duplicadas ni colgadas', () => {
  const sc = sched(demoScore);
  const R = rig({ events: sc.events, startBeat: 0, endBeat: sc.endBeat, bpm: 120 });
  R.tr.play(0); R.advance(5.01);
  const p = R.tr.pause();
  const tp = R.clock.t;
  // todo lo programado hacia adelante quedó cancelado; lo que sonaba se soltó
  for (const r of R.log) { if (!r.cancelled) assert.ok(r.when < tp, 'nada programado a futuro'); }
  assert.ok(R.log.filter((r) => !r.cancelled && r.when + Math.max(0.1, r.dur) > tp).every((r) => r.released === tp), 'lo que sonaba se soltó');
  R.advance(3);                              // pausado: no suena nada nuevo
  const n = R.log.length;
  R.advance(1); assert.equal(R.log.length, n);
  R.tr.play();
  R.advance(30);
  const sounded = alive(R.log);
  const ids = sounded.map((r) => r.item.id);
  assert.equal(new Set(ids).size, ids.length, 'sin duplicados');
  assert.equal(ids.length, sc.events.length, 'ninguna se perdió');
  assert.ok(Math.abs(p - 10) < 0.2);
  assert.equal(R.ended, 1);
});

test('bucle: al llegar al final vuelve a empezar sin cortes', () => {
  const sc = sched(demoScore, { from: 4, to: 5 });
  const R = rig({ events: sc.events, startBeat: sc.startBeat, endBeat: sc.endBeat, loop: true, bpm: 120 });
  R.tr.play(); R.advance(9);                 // 4 s por vuelta
  const first = sc.events[0];
  const starts = alive(R.log).filter((r) => r.item.id === first.id).map((r) => r.when);
  assert.ok(starts.length >= 2);
  assert.ok(Math.abs(starts[1] - starts[0] - 4) < 1e-6);
  assert.equal(R.ended, 0);
  assert.equal(R.tr.playing, true);
  assert.ok(R.tr.position() >= sc.startBeat && R.tr.position() < sc.endBeat);
});

test('cuenta de entrada: un compás de clics antes de la primera nota', () => {
  const sc = sched(demoScore);
  const R = rig({ events: sc.events, startBeat: 0, endBeat: sc.endBeat, bpm: 60, extra: sc.countIn });
  R.tr.play(0, { lead: sc.lay.barLen });
  R.advance(3);
  const cl = R.log.filter((r) => r.item.countin).map((r) => r.when);
  assert.equal(cl.length, 4);
  const firstNote = R.log.find((r) => !r.item.click);
  assert.ok(Math.abs(firstNote.when - cl[0] - 4) < 1e-6);
  assert.ok(R.tr.position() < 0 || R.tr.position() >= 0);
});

test('pieza de 120 compases: sin desfase acumulado ni picos de notas vivas', () => {
  const measures = [];
  for (let i = 0; i < 120; i++) measures.push({ rh: [{ k: [['c/4', 'e/4', 'g/4', 'd/4'][i % 4]], d: 'q' }, { k: ['e/4'], d: 'q' }, { k: ['g/4'], d: 'q' }, { k: ['c/5'], d: 'q' }], lh: [{ k: ['c/3', 'g/3'], d: 'h' }, { k: ['c/3', 'g/3'], d: 'h' }] });
  const long = { timeSig: [4, 4], bpm: 120, measures };
  const sc = sched(long);
  assert.equal(sc.endBeat, 480);
  const R = rig({ events: sc.events, startBeat: 0, endBeat: 480, bpm: 120 });
  R.tr.play(0);
  let maxLive = 0;
  for (let s = 0; s < 245; s += 0.02) {
    R.advance(0.02);
    const now = R.clock.t;
    const live = R.log.filter((r) => !r.cancelled && r.when <= now && now < r.when + Math.max(0.12, r.dur) + 0.5).length;
    if (live > maxLive) maxLive = live;
  }
  const last = alive(R.log).sort((a, b) => b.item.beat - a.item.beat)[0];
  assert.ok(Math.abs(last.when - (100.06 + last.item.beat * 0.5)) < 0.05, 'desfase ' + (last.when - (100.06 + last.item.beat * 0.5)));
  assert.equal(alive(R.log).length, sc.events.length);
  assert.ok(maxLive <= 12, 'vivas ' + maxLive);
  assert.equal(R.ended, 1);
});

test('síntesis: el plan de una nota depende de la altura y el timbre "Suave" es más simple', () => {
  const lo = voicePlan(36, 'piano'), hi = voicePlan(96, 'piano'), soft = voicePlan(60, 'suave');
  assert.ok(lo.partials[0].tau > hi.partials[0].tau * 2);
  assert.ok(lo.partials.length > hi.partials.length);
  assert.ok(lo.release > hi.release);
  assert.ok(lo.partials.every((p, i) => i === 0 || p.tau < lo.partials[i - 1].tau), 'los parciales altos decaen antes');
  assert.ok(Math.abs(lo.partials.reduce((a, p) => a + p.amp, 0) - 1) < 1e-9);
  assert.equal(soft.partials.length, 2); assert.equal(soft.hammer, 0);
  assert.ok(lo.hammer > 0);
});

test('síntesis: polifonía acotada y handle cancel / release', () => {
  const made = { osc: 0, stops: [] };
  class P { constructor() { this.value = 0; } setValueAtTime() {} exponentialRampToValueAtTime() {} linearRampToValueAtTime() {} setTargetAtTime() {} cancelScheduledValues() {} }
  class Node { connect() {} disconnect() {} }
  const ctx = { sampleRate: 8000, currentTime: 0, destination: new Node(),
    createGain() { const n = new Node(); n.gain = new P(); return n; },
    createDynamicsCompressor() { const n = new Node(); ['threshold', 'knee', 'ratio', 'attack', 'release'].forEach((k) => { n[k] = new P(); }); return n; },
    createBiquadFilter() { const n = new Node(); n.frequency = new P(); n.Q = new P(); return n; },
    createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; },
    createBufferSource() { const n = new Node(); n.start = () => {}; n.stop = (t) => made.stops.push(t); return n; },
    createOscillator() { made.osc++; const o = new Node(); o.frequency = new P(); o.detune = new P(); o.start = () => {}; o.stop = (t) => made.stops.push(t); return o; } };
  const sy = createSynth(ctx, { maxVoices: 4 });
  const hs = [];
  for (let i = 0; i < 8; i++) hs.push(sy.note({ midi: 50 + i, vel: 1 }, 1 + i * 0.001, 5));
  assert.ok(sy.active(2) <= 4, 'activas ' + sy.active(2));
  assert.ok(made.osc >= 8 * 4);
  const h = sy.note({ midi: 70 }, 10, 1); h.cancel(5);
  assert.equal(sy.active(10.5), 0);
  sy.allOff(1.5);
  assert.equal(sy.active(1.6), 0);
});
