import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeMistakes, measuresToPractice, groupRanges } from '../js/mistakes.js';

// midi: Mi4 = 64, Re♯4 = 63, Re♯5 = 75, Mi5 = 76, Do4 = 60, Fa#4 = 66
const miss = (measure, expected, played) => ({ measure, expected, played });

test('agrupa por clase de altura sin importar la octava', () => {
  const items = summarizeMistakes([
    miss(1, 64, 63),   // Mi4 → Re♯4
    miss(4, 76, 75),   // Mi5 → Re♯5
    miss(2, 64, 75),   // Mi4 → Re♯5
  ]);
  assert.equal(items.length, 1);
  assert.equal(items[0].count, 3);
  assert.equal(items[0].expected, 4);
  assert.equal(items[0].played, 3);
});

test('no incluye pares que ocurrieron una sola vez', () => {
  assert.deepEqual(summarizeMistakes([miss(0, 64, 63), miss(3, 60, 61)]), []);
});

test('orden por cantidad descendente y empate por el que apareció primero', () => {
  const items = summarizeMistakes([
    miss(0, 60, 61), miss(1, 64, 63), miss(2, 60, 61), miss(3, 64, 63), miss(4, 67, 66), miss(5, 67, 66), miss(6, 67, 66),
  ]);
  assert.deepEqual(items.map((i) => [i.expected, i.played, i.count]), [[7, 6, 3], [0, 1, 2], [4, 3, 2]]);
  const tie = summarizeMistakes([miss(0, 64, 63), miss(1, 64, 63), miss(2, 60, 61), miss(3, 60, 61)]);
  assert.deepEqual(tie.map((i) => i.expected), [4, 0]);
});

test('respeta el límite (por defecto 3)', () => {
  const misses = [];
  for (const [e, p] of [[0, 1], [2, 3], [4, 5], [6, 7]]) { misses.push(miss(0, 60 + e, 60 + p), miss(1, 60 + e, 60 + p)); }
  assert.equal(summarizeMistakes(misses).length, 3);
  assert.equal(summarizeMistakes(misses, { limit: 1 }).length, 1);
});

test('texto con varios compases', () => {
  const items = summarizeMistakes([miss(1, 64, 63), miss(4, 64, 63), miss(1, 64, 63)]);
  assert.equal(items[0].text, 'Tocás Re♯ en lugar de Mi (3 veces, compases 2 y 5)');
  const many = summarizeMistakes([miss(6, 64, 63), miss(1, 64, 63), miss(4, 76, 75), miss(4, 64, 63)]);
  assert.equal(many[0].text, 'Tocás Re♯ en lugar de Mi (4 veces, compases 2, 5 y 7)');
  assert.deepEqual(many[0].measures, [2, 5, 7]);
});

test('texto con un solo compás', () => {
  const items = summarizeMistakes([miss(3, 66, 65), miss(3, 66, 65)]);
  assert.equal(items[0].text, 'Tocás Fa en lugar de Fa♯ (2 veces, compás 4)');
  assert.deepEqual(items[0].measures, [4]);
});

test('texto con dos compases', () => {
  const items = summarizeMistakes([miss(0, 60, 61), miss(1, 60, 61)]);
  assert.equal(items[0].text, 'Tocás Do♯ en lugar de Do (2 veces, compases 1 y 2)');
});

test('hint constante cuando todas las distancias son iguales', () => {
  assert.equal(summarizeMistakes([miss(1, 64, 63), miss(4, 76, 75)])[0].hint, 'Te vas medio tono abajo');
  assert.equal(summarizeMistakes([miss(1, 60, 62), miss(4, 72, 74)])[0].hint, 'Te vas un tono arriba');
  assert.equal(summarizeMistakes([miss(1, 72, 60), miss(4, 84, 72)])[0].hint, 'Te vas una octava abajo');
  assert.equal(summarizeMistakes([miss(1, 60, 65), miss(4, 60, 65)])[0].hint, 'Te vas 5 semitonos arriba');
  assert.equal(summarizeMistakes([miss(1, 60, 55), miss(4, 60, 55)])[0].hint, 'Te vas 5 semitonos abajo');
});

test('hint vacío cuando las distancias varían', () => {
  assert.equal(summarizeMistakes([miss(1, 64, 63), miss(4, 64, 75)])[0].hint, '');
});

test('lista vacía devuelve []', () => {
  assert.deepEqual(summarizeMistakes([]), []);
  assert.deepEqual(summarizeMistakes(undefined), []);
});

test('measuresToPractice pasa de base 1 a base 0, sin repetidos y ordenado', () => {
  const items = summarizeMistakes([miss(4, 64, 63), miss(1, 64, 63), miss(4, 64, 63), miss(6, 60, 61), miss(6, 60, 61)]);
  assert.deepEqual(measuresToPractice(items), [1, 4, 6]);
  assert.deepEqual(measuresToPractice([]), []);
});

test('groupRanges agrupa compases consecutivos', () => {
  assert.deepEqual(groupRanges([1, 2, 3, 7]), [{ from: 1, to: 3 }, { from: 7, to: 7 }]);
  assert.deepEqual(groupRanges([4, 1, 1, 2]), [{ from: 1, to: 2 }, { from: 4, to: 4 }]);
  assert.deepEqual(groupRanges([]), []);
});
