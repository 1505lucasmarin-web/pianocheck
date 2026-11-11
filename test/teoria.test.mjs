import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTheory, moveText } from '../js/teoria.js';
import { diatonicTriads } from '../js/theory.js';

const el = () => ({ innerHTML: '', textContent: '', className: '', hidden: false, style: {}, dataset: {}, contains: () => false, querySelector: () => ({ setAttribute() {} }), setAttribute() {}, scrollTop: 0 });
function make() {
  globalThis.document = { activeElement: null };
  const els = {}; const saved = [];
  const kb = { setRange() {}, setTargets() {}, setSteps() {}, setHint() {}, flash() {}, focus() {} };
  const t = createTheory({ $: (id) => (els[id] ||= el()), kb, player: { stop() {}, play() {} }, toast() {}, inputReady: () => true, enableOnscreen() {},
    loadProgress: async () => ({ lessons: {} }), saveResult: async (...a) => { saved.push(a); return { lessons: {} }; }, onProgress() {} });
  return { t, saved };
}

test('moveText usa la ortografía de la tonalidad', () => {
  assert.equal(moveText(76, 77, 'F#'), 'Movete medio tono a la derecha → Mi♯5');
  assert.equal(moveText(62, 60, 'C'), 'Movete 1 tono a la izquierda → Do4');
});

test('expected() para el micrófono y flujo completo de Tocala', async () => {
  const { t, saved } = make();
  await t.open('escala');
  assert.deepEqual(t.expected(), []);                        // Mirar: nada
  t.onBodyClick({ target: { closest: () => ({ dataset: { act: 'mode', v: 'tocala' } }) } });
  assert.deepEqual(t.expected(), [60]);
  t.noteOn(60); assert.deepEqual(t.expected(), [62]);
  for (const m of [62, 64, 65, 67, 69, 71, 72]) t.noteOn(m);
  assert.deepEqual(t.expected(), []);
  assert.deepEqual(saved[0], ['escala', 'tocala', 'C', 8, 8]);
});

test('expected() en "Tocá el grado": clases faltantes en el registro central', async () => {
  const { t } = make();
  await t.open('grados');
  t.onBodyClick({ target: { closest: () => ({ dataset: { act: 'mode', v: 'grado' } }) } });
  const task = t.state.tasks[0].triad;
  assert.deepEqual(t.expected(), task.pcs.map((pc) => 60 + pc));
  t.noteOn(task.midi[1] + 12);                                // una nota en otra octava
  assert.deepEqual(t.expected(), task.pcs.filter((pc) => pc !== task.midi[1] % 12).map((pc) => 60 + pc));
  void diatonicTriads;
});
