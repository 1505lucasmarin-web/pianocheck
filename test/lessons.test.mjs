import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createScaleRun, createTriadTask, scoreOf } from '../js/lessons.js';
import { diatonicTriads, scaleMidi } from '../js/theory.js';
import { recordTheory, theorySummary, normalizeTheory, THEORY_PASS } from '../js/store.js';

test('scoreOf acota y redondea', () => {
  assert.deepEqual(scoreOf(7, 8), { correct: 7, total: 8, pct: 88 });
  assert.deepEqual(scoreOf(9, 8), { correct: 8, total: 8, pct: 100 });
  assert.deepEqual(scoreOf(0, 0), { correct: 0, total: 0, pct: 0 });
});

test('escala guiada de Do: 8 notas, todas a la primera', () => {
  const r = createScaleRun('C');
  assert.deepEqual(r.sequence, [60, 62, 64, 65, 67, 69, 71, 72]);
  const evs = r.sequence.map((m) => r.noteOn(m));
  assert.deepEqual(evs.slice(0, 7).map((e) => e.type), Array(7).fill('ok'));
  assert.equal(evs[7].type, 'done');
  assert.deepEqual(evs[7].result, { correct: 8, total: 8, pct: 100 });
  assert.equal(r.noteOn(60).type, 'ignored');
  assert.equal(r.expected(), null);
});

test('escala guiada: error no avanza, informa delta y baja el puntaje', () => {
  const r = createScaleRun('C');
  r.noteOn(60); r.noteOn(62);
  const w = r.noteOn(63);                       // esperaba Mi (64): medio tono a la derecha
  assert.equal(w.type, 'wrong');
  assert.equal(w.expected, 64);
  assert.equal(w.prev, 62);
  assert.equal(w.delta, 2);
  assert.equal(r.index, 2);
  assert.equal(r.mistakes, 1);
  for (const m of [64, 65, 67, 69, 71]) r.noteOn(m);
  const last = r.noteOn(72);
  assert.equal(last.type, 'done');
  assert.deepEqual(last.result, { correct: 7, total: 8, pct: 88 });
});

test('Fa♯ mayor: la 7ª nota es 77 (Mi♯) y la octava 78', () => {
  const r = createScaleRun('F#');
  assert.deepEqual(r.sequence, [66, 68, 70, 71, 73, 75, 77, 78]);
});

test('ida y vuelta: 15 notas, el pico no se repite', () => {
  const r = createScaleRun('G', { direction: 'updown' });
  assert.equal(r.total, 15);
  const s = r.sequence;
  assert.equal(s[7], 79);
  assert.equal(s[8], 78);
  let last;
  for (const m of s) last = r.noteOn(m);
  assert.equal(last.type, 'done');
});

test('modo libre: la fundamental en cualquier octava fija el desplazamiento', () => {
  const r = createScaleRun('D', { free: true });
  assert.equal(r.noteOn(63).type, 'wrong');     // no es Re
  assert.equal(r.noteOn(50).type, 'ok');        // Re3 (una octava más grave que Re4=62)
  assert.equal(r.expected(), 52);
  const w = r.noteOn(64);                        // Mi4: octava equivocada
  assert.equal(w.type, 'wrong');
  assert.equal(w.delta, 2);
  for (const m of [52, 54, 55, 57, 59, 61]) assert.equal(r.noteOn(m).type, 'ok');
  assert.equal(r.noteOn(62).type, 'done');
  assert.equal(r.result().correct, 6);          // falló la 1ª (Re) y la 2ª (Mi)
});

test('tríada: de a una, juntas, inversión y octavas', () => {
  const C = diatonicTriads('C')[0];
  const a = createTriadTask(C);
  assert.equal(a.noteOn(64).type, 'partial');
  assert.deepEqual(a.missingPcs(), [0, 7]);
  assert.equal(a.noteOn(79).type, 'partial');
  const e = a.noteOn(48);
  assert.equal(e.type, 'ok');
  assert.equal(e.clean, true);
  assert.equal(a.noteOn(60).type, 'ignored');
  const b = createTriadTask(C);                  // 2ª inversión, juntas
  assert.deepEqual([67, 72, 76].map((m) => b.noteOn(m).type), ['partial', 'partial', 'ok']);
});

test('tríada: nota ajena es error, no se acumula y la tarea sigue', () => {
  const C = diatonicTriads('C')[0];
  const t = createTriadTask(C);
  t.noteOn(60);
  const w = t.noteOn(66);
  assert.deepEqual(w, { type: 'wrong', midi: 66, wrongCount: 1 });
  assert.equal(t.noteOn(61).wrongCount, 2);
  assert.deepEqual(t.accepted, [60]);
  t.noteOn(64);
  const ok = t.noteOn(67);
  assert.equal(ok.type, 'ok');
  assert.equal(ok.clean, false);
  assert.equal(t.clean, false);
});

test('progreso de teoría: mejor puntaje, tonalidades y pureza', () => {
  const p0 = {};
  const p1 = recordTheory(p0, 'escala', 'tocala', 'C', 8, 8, 1);
  assert.deepEqual(p0, {});
  const p2 = recordTheory(p1, 'escala', 'tocala', 'C', 5, 8, 2);          // peor: no pisa el mejor
  const p3 = recordTheory(p2, 'escala', 'armala', 'G', 6, 8, 3);          // 75% < THEORY_PASS: no completa G
  const p4 = recordTheory(p3, 'escala', 'armala', 'G', 7, 8, 4);          // 88%: completa G
  const s = theorySummary(p4, 'escala');
  assert.equal(THEORY_PASS, 80);
  assert.equal(s.byExercise.tocala.pct, 100);
  assert.equal(s.byExercise.armala.pct, 88);
  assert.equal(s.best, 100);
  assert.deepEqual(s.keys, ['C', 'G']);
  assert.equal(s.runs, 4);
  assert.deepEqual(theorySummary(p4, 'grados'), { best: null, keys: [], byExercise: {}, runs: 0 });
  assert.deepEqual(normalizeTheory(null), { lessons: {} });
  assert.deepEqual(normalizeTheory(JSON.parse(JSON.stringify(p4))), p4);
});
