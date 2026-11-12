import test from 'node:test';
import assert from 'node:assert/strict';
import { demoScore } from '../js/demo.js';
import { buildSteps } from '../js/model.js';
import {
  windowFor, reachFor, classify, beatMs, measureStarts, buildTimeline, scoreTimeline, summarize, trendText, timingAction, createPulse, normMode, devText,
} from '../js/timing.js';

const BPM = 80;
const steps = buildSteps(demoScore, 'both');
const win = windowFor(BPM), reach = reachFor(BPM, win);
const tl = buildTimeline(steps, { bpm: BPM, origin: 0, lapBeats: 32 });
const play = (dev = 0, skip = () => false) => tl.flatMap((e, j) => (skip(j) ? [] : e.midi.map((m) => ({ midi: m, t: e.at + (typeof dev === 'function' ? dev(j, m) : dev) }))));
const run = (events) => { const sc = scoreTimeline(tl, events, { win, reach }); return { sc, sum: summarize(sc, { win }) }; };

test('ventana: ±120 ms por defecto y proporcional en tempos lentos', () => {
  assert.equal(windowFor(80), 120);
  assert.equal(windowFor(120), 120);
  assert.equal(windowFor(40), 240);
  assert.equal(windowFor(20), 240);                      // tope: el doble
  assert.equal(windowFor(56), 171);
  assert.equal(windowFor(80, 80), 80);
  assert.equal(windowFor(80, 180), 180);
  assert.ok(reachFor(80, 120) > 120 && reachFor(80, 120) <= 700);
  assert.equal(beatMs(60), 1000);
  assert.equal(normMode('x'), 'espera'); assert.equal(normMode('pulso'), 'pulso');
});

test('classify: a tiempo / adelantado / atrasado', () => {
  assert.equal(classify(0, 120), 'ontime'); assert.equal(classify(120, 120), 'ontime'); assert.equal(classify(-120, 120), 'ontime');
  assert.equal(classify(121, 120), 'late'); assert.equal(classify(-150, 120), 'early');
  assert.equal(devText(-60), '−60 ms'); assert.equal(devText(80), '+80 ms');
});

test('measureStarts coincide con los pasos de la demo', () => {
  const ms = measureStarts(demoScore);
  assert.deepEqual(ms.starts, [0, 4, 8, 12, 16, 20, 24, 28]);
  assert.equal(ms.total, 32);
  assert.equal(tl.length, steps.length);
  assert.equal(tl[0].at, 0);
  assert.equal(tl[1].at, 750);                           // 80 BPM = 750 ms por negra
});

test('todo a tiempo (con pequeñas variaciones) → 100% correctas y 100% a tiempo', () => {
  const { sum, sc } = run(play((j) => ((j * 37) % 81) - 40));
  assert.equal(sum.total, 30);
  assert.equal(sum.hit, 30); assert.equal(sum.pctCorrect, 100); assert.equal(sum.pctOnTime, 100);
  assert.equal(sum.wrongNotes, 0); assert.equal(sum.missed, 0);
  assert.ok(Math.abs(sum.trendMs) < 20);
  assert.match(trendText(sum), /parejo/);
  assert.ok(sc.steps.every((s) => s.timing === 'ontime'));
});

test('todo 150 ms tarde → atrasado, 0% a tiempo y tendencia +150', () => {
  const { sum, sc } = run(play(150));
  assert.equal(sum.pctCorrect, 100); assert.equal(sum.pctOnTime, 0);
  assert.ok(sc.steps.every((s) => s.status === 'hit' && s.timing === 'late' && s.dev === 150));
  assert.equal(sum.trendMs, 150); assert.equal(sum.late, 30);
  assert.equal(trendText(sum), 'Tendés a atrasarte ~150 ms');
});

test('todo 60 ms adelantado → a tiempo pero la tendencia dice adelantarte ~60', () => {
  const { sum } = run(play(-60));
  assert.equal(sum.pctOnTime, 100);
  assert.equal(trendText(sum), 'Tendés a adelantarte ~60 ms');
});

test('un paso omitido se cuenta como omitido', () => {
  const { sum, sc } = run(play(0, (j) => j === 7));
  assert.equal(sum.missed, 1); assert.equal(sum.hit, 29); assert.equal(sum.wrong, 0);
  assert.equal(sc.steps[7].status, 'missed');
  assert.equal(sum.pctCorrect, 97); assert.equal(sum.pctOnTime, 100);
  assert.deepEqual(sum.weak.map((w) => w.measure), [sc.steps[7].measure]);
});

test('una nota fuera de ventana cerca de un paso vecino se asigna al más próximo', () => {
  const ev = play(0, (j) => j === 2);
  tl[2].midi.forEach((m) => ev.push({ midi: m, t: tl[2].at - 200 }));   // 200 ms antes del paso 2 (el paso 1 está 550 ms antes)
  const { sc } = run(ev);
  assert.equal(sc.steps[2].status, 'hit'); assert.equal(sc.steps[2].timing, 'early'); assert.equal(sc.steps[2].dev, -200);
  assert.equal(sc.steps[1].status, 'hit'); assert.equal(sc.steps[1].dev, 0);
});

test('misma nota en pasos seguidos: un solo toque va al paso más próximo y no se reutiliza', () => {
  assert.ok(tl[0].midi.includes(64) && tl[1].midi.includes(64));   // Mi4 en los dos primeros pasos
  const ev = play(0, (j) => j <= 1);
  ev.push({ midi: 64, t: 400 });                          // 350 ms del paso 1, 400 ms del paso 0
  const { sc } = run(ev);
  assert.equal(sc.steps[1].status, 'hit'); assert.equal(sc.steps[1].dev, -350);
  assert.equal(sc.steps[0].status, 'missed');
});

test('acorde levemente arpegiado sigue a tiempo; una nota equivocada cuenta como errada', () => {
  const t0 = tl[0], chord = t0.midi;                     // [52, 60?]… acorde de la demo en el primer tiempo
  assert.ok(chord.length >= 2);
  const ev = play(0, (j) => j === 0);
  chord.forEach((m, i) => ev.push({ midi: m, t: t0.at - 30 + i * 50 }));
  const ok = run(ev).sc.steps[0];
  assert.equal(ok.status, 'hit'); assert.equal(ok.timing, 'ontime');
  const bad = play(0, (j) => j === 3); bad.push({ midi: 61, t: tl[3].at + 10 });
  const r = run(bad);
  assert.equal(r.sc.steps[3].status, 'wrong'); assert.deepEqual(r.sc.steps[3].extra.map((x) => x.midi), [61]);
  assert.equal(r.sum.wrongNotes, 1); assert.equal(r.sum.wrong, 1);
});

test('notas sueltas muy lejos de cualquier paso (antes de la toma) se ignoran', () => {
  const ev = play(0); ev.push({ midi: 70, t: -5000 }); ev.push({ midi: 70, t: 60000 });
  const { sum } = run(ev);
  assert.equal(sum.wrongNotes, 0); assert.equal(sum.pctCorrect, 100);
});

test('timingAction: bajar el tempo 10–15% si cuesta, practicar el compás flojo si no, subir si está firme', () => {
  const poor = run(play(200, (j) => j % 3 === 0)).sum;
  const a = timingAction(poor, { bpm: 80, measures: 8 });
  assert.equal(a.type, 'slower'); assert.ok(a.bpm >= 68 && a.bpm <= 72, String(a.bpm));
  const one = run(play(0, (j) => j === 25)).sum;          // sólo un paso omitido, el resto perfecto
  const b = timingAction(one, { bpm: 80, measures: 8 });
  assert.equal(b.type, 'fix'); assert.equal(b.measure, tl[25].measure);
  assert.deepEqual(b.range, { from: tl[25].measure, to: tl[25].measure + 1 });
  const good = run(play(0)).sum;
  assert.deepEqual(timingAction(good, { bpm: 80, measures: 8 }), { type: 'faster', bpm: 84, title: 'Pulso firme. Probá un poco más rápido', cta: 'Subir el tempo a ♩ 84' });
});

test('trendText sin datos suficientes devuelve null', () => {
  assert.equal(trendText(run([]).sum), null);
});

test('toma en vivo: aciertos, desvíos y omitidos al cerrar el plazo', () => {
  const p = createPulse(steps, { bpm: BPM, win, origin: 0, lapBeats: 32 });
  const r0 = p.noteOn(tl[0].midi[0], tl[0].at - 90);
  assert.equal(r0.kind, 'hit'); assert.equal(r0.timing, 'ontime'); assert.equal(r0.done, false);
  assert.equal(tl[0].midi.length, 3);
  assert.equal(p.noteOn(tl[0].midi[1], tl[0].at - 90).done, false);
  assert.equal(p.noteOn(tl[0].midi[2], tl[0].at - 90).done, true);
  const r1 = p.noteOn(tl[1].midi[0], tl[1].at + 160);   // el paso 1 es una sola nota
  assert.equal(r1.timing, 'late'); assert.equal(r1.dev, 160);
  assert.equal(p.noteOn(61, tl[2].at).kind, 'wrong');
  assert.equal(p.noteOn(61, -9000).kind, 'ignored');
  const closed = p.tick(tl[2].at + p.reach + 1);
  assert.deepEqual(closed.map((c) => c.status), ['hit', 'hit', 'wrong']);
  assert.equal(closed[0].timing, 'ontime');
  const closed2 = p.tick(tl[3].at + p.reach + 1);
  assert.deepEqual(closed2.map((c) => c.status), ['missed']);            // el paso 3 nunca se tocó
  assert.equal(p.finished, false);
  const res = p.result();
  assert.equal(res.summary.total, 4); assert.equal(res.summary.missed, 1);
});

test('toma en vivo con bucle: la vuelta 2 se puntúa con su propio reloj', () => {
  const sub = steps.filter((s) => s.measure === 4 || s.measure === 5);    // compases 5–6
  const origin = 16, lapBeats = 8;
  const p = createPulse(sub, { bpm: BPM, win, origin, lapBeats, loop: true });
  const lapMs = lapBeats * beatMs(BPM);
  assert.equal(p.lapMs, lapMs);
  const first = [];
  for (let lap = 0; lap < 3; lap++) sub.forEach((s, k) => s.midi.forEach((m) => first.push(p.noteOn(m, p.idealAt(k, lap) + (lap === 1 ? 140 : 0)))));
  assert.ok(first.every((r) => r.kind === 'hit'));
  assert.ok(first.filter((r, i) => i >= sub.reduce((a, s) => a + s.midi.length, 0) && i < 2 * sub.reduce((a, s) => a + s.midi.length, 0)).every((r) => r.timing === 'late'));
  const out = p.tick(3 * lapMs);
  assert.equal(out.filter((o) => o.lapDone).length, 3);
  const res = p.result();
  assert.equal(res.laps, 3);
  assert.equal(res.summary.total, sub.length * 3);
  assert.equal(res.summary.late, sub.length);
  assert.equal(res.summary.ontime, sub.length * 2);
});

test('mano sola: la línea de tiempo usa los pasos de esa mano pero el mismo origen', () => {
  const lh = buildSteps(demoScore, 'lh');
  const t = buildTimeline(lh, { bpm: BPM, origin: 0, lapBeats: 32 });
  assert.equal(t.length, lh.length);
  assert.deepEqual(t.slice(0, 3).map((e) => e.at), [0, 1500, 3000]);
});

test('measureStates y lapResult', async () => {
  const { measureStates } = await import('../js/timing.js');
  const ev = play(0, (j) => tl[j].measure === 2).filter((e) => !(e.t === tl.find((x) => x.measure === 3).at));   // compás 3 omitido, el primer paso del compás 4 también
  const sc = scoreTimeline(tl.filter((e) => e.measure <= 4), ev, { win, reach });
  const st = measureStates(sc, steps, 8);
  assert.equal(st[0], 'clean'); assert.equal(st[2], 'dirty'); assert.equal(st[3], 'dirty'); assert.equal(st[4], 'clean'); assert.equal(st[5], 'none');
  const late = measureStates(scoreTimeline(tl, play(150), { win, reach }), steps, 8);
  assert.ok(late.every((x) => x === 'off'));
  assert.equal(measureStates(scoreTimeline(tl, play(0), { win, reach }), steps, 10)[9], 'empty');
  const sub = steps.filter((s) => s.measure === 4);
  const p = createPulse(sub, { bpm: BPM, win, origin: 16, lapBeats: 4, loop: true });
  sub.forEach((s, k) => s.midi.forEach((m) => p.noteOn(m, p.idealAt(k, 0) + 10)));
  p.tick(5000);
  const lr = p.lapResult(0);
  assert.equal(lr.summary.pctCorrect, 100); assert.equal(lr.summary.pctOnTime, 100);
  assert.equal(p.lapResult(1).summary.pctCorrect, 0);
});
