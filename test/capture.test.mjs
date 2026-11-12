import test from 'node:test';
import assert from 'node:assert/strict';
import { createTake } from '../js/capture.js';
import { notesToScore } from '../js/transcribe-core.js';
import { keyToMidi } from '../js/model.js';

test('createTake: tiempos relativos a la primera nota sin metrónomo; cierra las notas abiertas', () => {
  const t = createTake();
  t.noteOn(64, 90, 1000); t.noteOff(64, 1600);
  t.noteOn(65, 60, 1750); t.noteOff(65, 2300);
  t.noteOn(67, 127, 2500);                                    // sigue apretada al terminar
  const { notes } = t.finish(3000);
  assert.deepEqual(notes.map((n) => [n.midi, n.start, n.end]), [[64, 0, 0.6], [65, 0.75, 1.3], [67, 1.5, 2]]);
  assert.equal(notes[2].velocity, 1);
});

test('createTake: con metrónomo t0 es el primer tiempo; anacrusa corta se pega al 0 y el ruido de la entrada se descarta', () => {
  const t = createTake(); t.begin(5000);
  t.noteOn(60, 80, 3000); t.noteOff(60, 3100);                // 2 s antes: ruido de la entrada
  t.noteOn(62, 80, 4800); t.noteOff(62, 4900);                // 0,2 s antes: anacrusa
  t.noteOn(64, 80, 5750); t.noteOff(64, 6300);
  const { notes } = t.finish(7000);
  assert.deepEqual(notes.map((n) => [n.midi, n.start]), [[62, 0], [64, 0.75]]);
});

test('createTake: tecla repetida sin soltar, notas demasiado cortas y toma vacía', () => {
  const t = createTake();
  t.noteOn(60, 80, 0); t.noteOn(60, 80, 500); t.noteOff(60, 900);
  t.noteOn(61, 80, 1000); t.noteOff(61, 1005);
  const { notes } = t.finish(2000);
  assert.deepEqual(notes.map((n) => [n.midi, n.start, n.end]), [[60, 0, 0.5], [60, 0.5, 0.9]]);
  assert.deepEqual(createTake().finish(0).notes, []);
});

test('Mi Mi Fa Sol a 80 bpm → una partitura con 4 negras (E4 E4 F4 G4)', () => {
  const t = createTake(); t.begin(0);
  [[64, 0], [64, 750], [65, 1500], [67, 2250]].forEach(([m, ts]) => { t.noteOn(m, 80, ts); t.noteOff(m, ts + 650); });
  const { notes } = t.finish(3000);
  const { score } = notesToScore(notes, { bpm: 80, timeSig: [4, 4], mode: 'melodia' });
  const evs = score.measures[0].rh.filter((e) => e.k.length);
  assert.deepEqual(evs.map((e) => [keyToMidi(e.k[0]), e.d, e.dots || 0]), [[64, 'q', 0], [64, 'q', 0], [65, 'q', 0], [67, 'q', 0]]);
});

import { takeToScore } from '../js/capture.js';
test('takeToScore: grilla exacta; el primer tiempo es t0 aunque el acento sea ambiguo (4 negras iguales, con distintos desfases)', () => {
  for (const off of [0, 0.05, 0.12, 0.18, 0.3]) {
    const notes = [64, 64, 65, 67].map((p, i) => ({ midi: p, start: off + i * 0.75, end: off + i * 0.75 + 0.6, velocity: 0.7 }));
    const r = takeToScore(notes, { bpm: 80, timeSig: [4, 4], t0: 0 });
    assert.equal(r.score.measures.length, 1, 'desfase ' + off);
    assert.deepEqual(r.score.measures[0].rh.filter((e) => e.k.length).map((e) => e.d), ['q', 'q', 'q', 'q']);
    assert.equal(r.score.origin, 'grabada'); assert.equal(r.info.bpm, 80);
  }
  const notes = [64, 64, 65, 67].map((p, i) => ({ midi: p, start: 5 + i * 0.75, end: 5.6 + i * 0.75, velocity: 0.7 }));
  assert.equal(takeToScore(notes, { bpm: 80, t0: null }).score.measures[0].rh[0].k[0], 'e/4');       // sin metrónomo: la primera nota abre el compás
  assert.equal(takeToScore(notes, { bpm: 80, timeSig: [6, 8] }), null);                              // compuestos: se usa notesToScore
  const two = takeToScore([...notes, { midi: 69, start: 5 + 4 * 0.75, end: 5 + 5 * 0.75, velocity: 0.7 }], { bpm: 80, t0: null, mode: 'dos-manos' });
  assert.equal(two.score.measures.length, 2);
});
