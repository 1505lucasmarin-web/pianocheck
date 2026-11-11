import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession } from '../js/engine.js';

const mk = (...mids) => mids.map((m, i) => ({ i, t: i, measure: 0, midi: [].concat(m), refs: [] }));

test('camino feliz: notas sueltas hasta finished', () => {
  const s = createSession(mk(60, 62, 64));
  assert.equal(s.noteOn(60).type, 'step');
  assert.equal(s.noteOn(62).type, 'step');
  const r = s.noteOn(64);
  assert.equal(r.type, 'finished');
  assert.deepEqual(s.state, { index: 3, total: 3, cleanSteps: 3, dirtySteps: 0, wrongNotes: 0, streak: 0, accuracy: 100, status: 'finished', pressed: [] });
  assert.deepEqual(s.stepResults, ['clean', 'clean', 'clean']);
});

test('estado inicial', () => {
  const s = createSession(mk(60));
  assert.deepEqual(s.state, { index: 0, total: 1, cleanSteps: 0, dirtySteps: 0, wrongNotes: 0, streak: 0, accuracy: 0, status: 'playing', pressed: [] });
  assert.deepEqual(s.stepResults, [null]);
});

test('acordes: partial hasta completar, en cualquier orden; repetida → ignored', () => {
  const s = createSession(mk([60, 64, 67], 72));
  assert.equal(s.noteOn(67).type, 'partial');
  assert.deepEqual(s.state.pressed, [67]);
  assert.equal(s.noteOn(67).type, 'ignored');
  assert.equal(s.state.wrongNotes, 0);
  assert.equal(s.noteOn(60).type, 'partial');
  const r = s.noteOn(64);
  assert.equal(r.type, 'step');
  assert.deepEqual(s.state.pressed, []);
  assert.equal(s.state.index, 1);
  assert.equal(s.noteOn(72).type, 'finished');
});

test('nota equivocada: miss, paso dirty, streak se reinicia al completar', () => {
  const s = createSession(mk(60, 62));
  const m = s.noteOn(61);
  assert.equal(m.type, 'miss');
  assert.equal(m.midi, 61);
  assert.deepEqual(m.expected, [60]);
  assert.equal(s.state.wrongNotes, 1);
  assert.equal(s.state.streak, 1);
  assert.equal(s.stepResults[0], 'dirty');
  s.noteOn(63);
  assert.equal(s.state.streak, 2);
  assert.equal(s.noteOn(60).type, 'step');
  assert.equal(s.state.streak, 0);
  assert.equal(s.stepResults[0], 'dirty');
  assert.equal(s.state.dirtySteps, 1);
  s.noteOn(62);
  assert.equal(s.state.accuracy, 50);
  assert.equal(s.state.status, 'finished');
});

test('el estado dirty no se arrastra al paso siguiente', () => {
  const s = createSession(mk(60, 62, 64));
  s.noteOn(1); s.noteOn(60); s.noteOn(62); s.noteOn(64);
  assert.deepEqual(s.stepResults, ['dirty', 'clean', 'clean']);
});

test('miss dentro de un acorde parcial: acorde queda dirty', () => {
  const s = createSession(mk([60, 64], 67));
  s.noteOn(60);
  const m = s.noteOn(62);
  assert.equal(m.type, 'miss');
  assert.deepEqual(m.expected, [64]);
  assert.equal(s.noteOn(64).type, 'step');
  assert.equal(s.stepResults[0], 'dirty');
});

test('detención al 6.º error seguido (maxStreak=5 por defecto)', () => {
  const s = createSession(mk(60, 62));
  for (let i = 0; i < 5; i++) assert.equal(s.noteOn(1).type, 'miss');
  assert.equal(s.state.status, 'playing');
  assert.equal(s.state.streak, 5);
  const r = s.noteOn(1);
  assert.equal(r.type, 'stopped');
  assert.equal(s.state.status, 'stopped');
  assert.equal(s.state.wrongNotes, 6);
  assert.equal(s.stepResults[0], 'dirty');
  // luego todo ignorado
  assert.equal(s.noteOn(60).type, 'ignored');
  assert.equal(s.noteOn(1).type, 'ignored');
  assert.equal(s.state.wrongNotes, 6);
  assert.equal(s.state.index, 0);
});

test('5 errores seguidos y un acierto reinician la racha', () => {
  const s = createSession(mk(60, 62, 64));
  for (let i = 0; i < 5; i++) s.noteOn(1);
  assert.equal(s.noteOn(60).type, 'step');
  assert.equal(s.state.streak, 0);
  for (let i = 0; i < 5; i++) assert.equal(s.noteOn(1).type, 'miss');
  assert.equal(s.state.status, 'playing');
  assert.equal(s.noteOn(1).type, 'stopped');
});

test('maxStreak configurable', () => {
  const s = createSession(mk(60), { maxStreak: 1 });
  assert.equal(s.noteOn(1).type, 'miss');
  assert.equal(s.noteOn(1).type, 'stopped');
});

test('tras finished todo es ignored', () => {
  const s = createSession(mk(60));
  assert.equal(s.noteOn(60).type, 'finished');
  assert.equal(s.noteOn(60).type, 'ignored');
  assert.equal(s.noteOn(1).type, 'ignored');
  assert.equal(s.state.wrongNotes, 0);
});

test('accuracy al detenerse cuenta pasos recorridos; sesión vacía', () => {
  const s = createSession(mk(60, 62, 64));
  s.noteOn(60);
  for (let i = 0; i < 6; i++) s.noteOn(1);
  assert.equal(s.state.status, 'stopped');
  assert.equal(s.state.cleanSteps, 1);
  assert.equal(s.state.accuracy, 50);
  const e = createSession([]);
  assert.equal(e.state.status, 'finished');
  assert.equal(e.noteOn(60).type, 'ignored');
});

test('state devuelve copia de pressed', () => {
  const s = createSession(mk([60, 64]));
  s.noteOn(60);
  s.state.pressed.push(99);
  assert.deepEqual(s.state.pressed, [60]);
});
