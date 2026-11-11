import test from 'node:test';
import assert from 'node:assert/strict';
import { demoScore } from '../js/demo.js';
import { buildSteps } from '../js/model.js';
import { createSession } from '../js/engine.js';
import {
  normRange, rangeText, passageSteps, stepsForPassage, currentPair, hardestMeasures, suggestPassage, coverage,
  measureSummary, harderHand, handsWithNotes, attemptKey, sameKind, equivalentAttempts, bestEquivalent, nextAction, mergePractice, latestPractice,
} from '../js/passage.js';
import { summarizeAttempts } from '../js/store.js';

const all = buildSteps(demoScore, 'both');     // demo: 8 compases; el 4.º y el 8.º tienen un paso extra (corchea)
const N = demoScore.measures.length;

test('normRange: ordena, limita y rechaza lo inválido', () => {
  assert.deepEqual(normRange({ from: 6, to: 3 }, 8), { from: 3, to: 6 });
  assert.deepEqual(normRange({ from: -2, to: 99 }, 8), { from: 0, to: 7 });
  assert.equal(normRange(null, 8), null);
  assert.equal(normRange({ from: 'a', to: 1 }, 8), null);
  assert.equal(normRange({ from: 0, to: 1 }, 0), null);
  assert.equal(rangeText({ from: 4, to: 5 }), '5–6');
  assert.equal(rangeText({ from: 2, to: 2 }), '3');
});

test('passageSteps conserva i, t, measure y refs originales', () => {
  const ps = passageSteps(all, { from: 4, to: 5 });
  assert.ok(ps.length > 0 && ps.every((s) => s.measure >= 4 && s.measure <= 5));
  ps.forEach((s) => assert.equal(s, all[s.i]));        // mismo objeto, índice global intacto
  assert.equal(ps[0].i, all.findIndex((s) => s.measure === 4));
  assert.deepEqual(stepsForPassage(demoScore, { from: 4, to: 5 }, 'both').map((s) => s.i), ps.map((s) => s.i));
  assert.equal(passageSteps(all, null).length, all.length);
});

test('stepsForPassage con una mano: sólo esa mano, índices de esa construcción', () => {
  const rh = stepsForPassage(demoScore, { from: 4, to: 5 }, 'rh');
  assert.equal(rh.length, 8);
  assert.ok(rh.every((s) => s.refs.every((r) => r.hand === 'rh')));
});

test('currentPair: el siguiente, o el anterior si es el último', () => {
  assert.deepEqual(currentPair(4, 8), { from: 4, to: 5 });
  assert.deepEqual(currentPair(7, 8), { from: 6, to: 7 });
  assert.deepEqual(currentPair(0, 1), { from: 0, to: 0 });
});

// sesión que falla 3 veces en el compás 5 (índice 4) y 1 vez en el 2
function run(failures) {
  const ps = passageSteps(all, null);
  const s = createSession(ps, { maxStreak: 99 });
  for (let k = 0; k < ps.length; k++) {
    const n = failures[ps[k].measure] && !failures._done?.[k] ? 0 : 0; void n;
    const wrongs = (failures[k] || 0);
    for (let w = 0; w < wrongs; w++) s.noteOn(ps[k].midi.includes(1) ? 2 : 1);   // nota inexistente en la partitura
    ps[k].midi.forEach((m) => s.noteOn(m));
  }
  return { ps, s };
}
const firstStepOf = (m) => all.findIndex((s) => s.measure === m);

test('hardestMeasures ordena por errores y expone dirty', () => {
  const { ps, s } = run({ [firstStepOf(4)]: 2, [firstStepOf(4) + 1]: 1, [firstStepOf(1)]: 1 });
  const h = hardestMeasures(s.stepResults, ps, s.stepErrors);
  assert.deepEqual(h, [{ measure: 4, errors: 3, dirty: 2 }, { measure: 1, errors: 1, dirty: 1 }]);
  // sin stepErrors: errors = dirty
  assert.deepEqual(hardestMeasures(s.stepResults, ps), [{ measure: 4, errors: 2, dirty: 2 }, { measure: 1, errors: 1, dirty: 1 }]);
});

test('hardestMeasures: empate por errores → más pasos sucios → compás menor', () => {
  const steps = [{ measure: 0 }, { measure: 0 }, { measure: 1 }, { measure: 2 }];
  assert.deepEqual(hardestMeasures(['dirty', 'dirty', 'dirty', 'dirty'], steps, [1, 1, 2, 2]).map((x) => x.measure), [0, 1, 2]);
  assert.deepEqual(hardestMeasures([null, null, 'clean', null], steps, [0, 0, 0, 0]), []);
});

test('suggestPassage: el compás difícil y el siguiente; el anterior si es el último; null sin errores', () => {
  const a = run({ [firstStepOf(4)]: 2 });
  assert.deepEqual(suggestPassage(a.s.stepResults, a.ps, { stepErrors: a.s.stepErrors, measures: N }), { from: 4, to: 5 });
  const b = run({ [firstStepOf(7)]: 1 });
  assert.deepEqual(suggestPassage(b.s.stepResults, b.ps, { stepErrors: b.s.stepErrors, measures: N }), { from: 6, to: 7 });
  const c = run({});
  assert.equal(suggestPassage(c.s.stepResults, c.ps, { stepErrors: c.s.stepErrors, measures: N }), null);
  // sin opts.measures se deduce de los pasos
  assert.deepEqual(suggestPassage(b.s.stepResults, b.ps), { from: 6, to: 7 });
});

test('coverage: compases completos sobre compases con pasos', () => {
  assert.deepEqual(coverage(all, 0), { measuresDone: 0, measuresTotal: 8 });
  assert.deepEqual(coverage(all, all.length), { measuresDone: 8, measuresTotal: 8 });
  const k = firstStepOf(3);                           // los 3 primeros compases completos
  assert.deepEqual(coverage(all, k), { measuresDone: 3, measuresTotal: 8 });
  assert.deepEqual(coverage(all, k + 1), { measuresDone: 3, measuresTotal: 8 });   // 4.º a medias
  assert.deepEqual(coverage(passageSteps(all, { from: 4, to: 5 }), 4), { measuresDone: 1, measuresTotal: 2 });
  assert.deepEqual(coverage([], 0), { measuresDone: 0, measuresTotal: 0 });
});

test('coverage distingue "limpio pero parcial" de completo (el caso del 100% engañoso)', () => {
  const s = createSession(all);
  all.slice(0, 10).forEach((st) => st.midi.forEach((m) => s.noteOn(m)));
  assert.equal(s.state.accuracy, 100);               // 100% de lo recorrido…
  const cov = coverage(all, s.state.index);
  assert.ok(cov.measuresDone < cov.measuresTotal);   // …pero el avance es parcial
});

test('measureSummary: limpio / con error / no tocado / sin notas', () => {
  const steps = [{ measure: 0 }, { measure: 0 }, { measure: 1 }, { measure: 1 }, { measure: 3 }];
  assert.deepEqual(measureSummary(['clean', 'clean', 'clean', 'dirty', null], steps, 5), ['clean', 'dirty', 'empty', 'none', 'empty']);
  assert.deepEqual(measureSummary(['clean', null, null, null, null], steps, 4), ['none', 'none', 'empty', 'none']);
});

test('harderHand / handsWithNotes', () => {
  assert.equal(harderHand({ rh: 3, lh: 1 }), 'rh');
  assert.equal(harderHand({ rh: 0, lh: 2 }), 'lh');
  assert.equal(harderHand({ rh: 0, lh: 0 }), null);
  assert.equal(harderHand({ rh: 2, lh: 2 }), 'lh');
  assert.deepEqual(handsWithNotes(passageSteps(all, { from: 0, to: 1 })), { rh: true, lh: true });
  assert.deepEqual(handsWithNotes(stepsForPassage(demoScore, { from: 0, to: 1 }, 'lh')), { rh: false, lh: true });
});

test('equivalencia de intentos: mismo rango, mano y modo; datos viejos = pieza entera', () => {
  const old = { accuracy: 80, status: 'finished', hands: 'both' };                      // sin range/loop/bpm
  const whole = { accuracy: 90, status: 'finished', hands: 'both', range: null, loop: false };
  const fullRange = { accuracy: 70, hands: 'both', range: { from: 0, to: 7 } };
  const loop = { accuracy: 100, status: 'finished', hands: 'both', range: { from: 4, to: 5 }, loop: true };
  const loop2 = { accuracy: 60, status: 'finished', hands: 'both', range: { from: 5, to: 4 }, loop: true };
  const rh = { accuracy: 95, status: 'finished', hands: 'rh', range: { from: 4, to: 5 }, loop: true };
  assert.ok(sameKind(old, whole, N));
  assert.ok(sameKind(whole, fullRange, N));            // 0–7 de 8 es la pieza entera
  assert.ok(sameKind(loop, loop2, N));                 // el orden del rango no importa
  assert.ok(!sameKind(loop, rh, N));                   // otra mano
  assert.ok(!sameKind(loop, whole, N));                // otro rango
  assert.ok(!sameKind({ ...loop, loop: false }, loop, N));   // bucle ≠ pasada única
  assert.equal(attemptKey({}, N), 'all|both|once');
  assert.deepEqual(equivalentAttempts([old, loop, rh, whole], whole, N), [old]);
  assert.equal(bestEquivalent([old, loop, rh, { accuracy: 99, status: 'stopped', hands: 'both' }], whole, N), 80);   // el cortado no cuenta
  assert.equal(bestEquivalent([loop, rh], whole, N), null);
});

test('summarizeAttempts: la pieza entera; ignora pasajes/bucles y no premia lo parcial', () => {
  const r = summarizeAttempts([
    { at: 1, accuracy: 100, status: 'playing' },                         // parcial: no es "mejor"
    { at: 2, accuracy: 70, status: 'finished' },
    { at: 3, accuracy: 100, status: 'finished', range: { from: 4, to: 5 }, loop: true },   // bucle: afuera
  ]);
  assert.deepEqual(r, { count: 2, best: 70, last: 70 });
  assert.deepEqual(summarizeAttempts([{ at: 1, accuracy: 100, status: 'stopped' }]), { count: 1, best: null, last: 100 });
});

test('nextAction: errores → practicar compases; limpio incompleto → seguir; perfecto → mano/tempo', () => {
  const a = run({ [firstStepOf(4)]: 3 });
  const fix = nextAction({ stepResults: a.s.stepResults, steps: a.ps, stepErrors: a.s.stepErrors, done: a.ps.length, status: 'finished', hands: 'both', bpm: 56, measures: N, range: null });
  assert.equal(fix.type, 'fix'); assert.equal(fix.measure, 4);
  assert.deepEqual(fix.range, { from: 4, to: 5 });
  assert.equal(fix.title, 'El compás 5 fue el que más te costó');
  assert.equal(fix.cta, 'Practicar compases 5–6');

  const s = createSession(all);
  all.slice(0, firstStepOf(3)).forEach((st) => st.midi.forEach((m) => s.noteOn(m)));   // 3 compases limpios
  const cont = nextAction({ stepResults: s.stepResults, steps: all, stepErrors: s.stepErrors, done: s.state.index, status: 'playing', hands: 'both', bpm: 80, measures: N, range: null });
  assert.deepEqual([cont.type, cont.measure, cont.cta], ['continue', 3, 'Seguir desde el compás 4']);

  const lp = nextAction({ stepResults: s.stepResults, steps: all, stepErrors: s.stepErrors, done: s.state.index, status: 'playing', hands: 'both', bpm: 80, measures: N, range: { from: 0, to: 2 }, loop: true });
  assert.deepEqual([lp.type, lp.loop, lp.cta], ['continue', true, 'Retomar el bucle 1–3']);

  assert.equal(nextAction({ stepResults: [], steps: all, stepErrors: [], done: 0, status: 'playing', hands: 'both', bpm: 80, measures: N }).type, 'none');

  const p = run({});
  const perfect = nextAction({ stepResults: p.s.stepResults, steps: p.ps, stepErrors: p.s.stepErrors, done: p.ps.length, status: 'finished', hands: 'both', bpm: 56, measures: N });
  assert.deepEqual([perfect.type, perfect.bpm], ['faster', 60]);
  const one = nextAction({ stepResults: p.s.stepResults, steps: p.ps, stepErrors: p.s.stepErrors, done: p.ps.length, status: 'finished', hands: 'rh', bpm: 56, measures: N });
  assert.equal(one.type, 'both-hands');
});

test('engine: stepErrors, resetStreak y jumpTo descuentan lo rehecho', () => {
  const ps = passageSteps(all, { from: 4, to: 5 });
  const s = createSession(ps, { maxStreak: 99 });
  ps[0].midi.forEach((m) => s.noteOn(m)); ps[1].midi.forEach((m) => s.noteOn(m));
  s.noteOn(1); s.noteOn(1);
  assert.deepEqual(s.stepErrors.slice(0, 3), [0, 0, 2]);
  assert.equal(s.state.streak, 2);
  s.resetStreak(); assert.equal(s.state.streak, 0);
  assert.equal(s.jumpTo(0), true);
  assert.deepEqual([s.state.index, s.state.cleanSteps, s.state.dirtySteps, s.state.wrongNotes], [0, 0, 0, 2]);
  assert.deepEqual(s.stepResults.slice(0, 3), [null, null, null]);
  assert.deepEqual(s.stepErrors.slice(0, 3), [0, 0, 2]);   // los errores ya ocurridos quedan
  for (const st of ps) st.midi.forEach((m) => s.noteOn(m));
  assert.equal(s.state.status, 'finished');
  assert.equal(s.state.cleanSteps + s.state.dirtySteps, ps.length);   // nada contado dos veces
});

test('mergePractice / latestPractice: último por partitura, tope y existencia', () => {
  let m = mergePractice({}, 'a', { loop: true, from: 4, to: 5, hands: 'rh', bpm: 56, measure: 4, at: 100 });
  m = mergePractice(m, 'b', { loop: false, hands: 'both', bpm: 80, measure: 0, at: 200 });
  assert.equal(latestPractice(m).id, 'b');
  assert.equal(latestPractice(m, (id) => id !== 'b').id, 'a');
  assert.deepEqual(latestPractice(m, (id) => id === 'a'), { id: 'a', loop: true, from: 4, to: 5, hands: 'rh', bpm: 56, measure: 4, at: 100 });
  assert.equal(latestPractice({}, () => true), null);
  let big = {}; for (let i = 0; i < 40; i++) big = mergePractice(big, 'k' + i, { at: i + 1 });
  assert.equal(Object.keys(big).length, 30); assert.ok(!('k0' in big) && 'k39' in big);
});
