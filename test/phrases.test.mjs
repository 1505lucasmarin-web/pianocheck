import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findPhrases, repeatNotice, phraseCaption, phraseAt } from '../js/phrases.js';
import { demoScore } from '../js/demo.js';

const NAMES = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
// compás de 4 negras a partir de una "semilla" (distinta semilla → distinta melodía)
function bar(seed, oct = 4, rhythm = 'q') {
  const rh = [0, 1, 2, 3].map((i) => ({ k: [NAMES[(seed * 3 + i * (seed % 4 + 1)) % 7] + '/' + (oct + (seed % 2))], d: rhythm }));
  return { rh, lh: [{ k: ['c/3'], d: 'w' }] };
}
const score = (measures) => ({ id: 't', title: 't', bpm: 80, timeSig: [4, 4], keySig: 'C', measures });
const shape = (ps) => ps.map((p) => [p.label, p.startMeasure, p.endMeasure, p.repeatOf]);

test('demo (Oda a la Alegría): A y A′', () => {
  const ps = findPhrases(demoScore);
  assert.deepEqual(shape(ps), [['A', 0, 3, null], ['A′', 4, 7, 'p0']]);
  assert.equal(ps[0].exact, true);
  assert.equal(ps[1].exact, false);
  assert.equal(ps[1].variation, 'end');
  assert.equal(repeatNotice(ps[1], ps), 'Esta frase ya la tocaste: es parecida a los compases 1–4, cambia el final');
  assert.equal(repeatNotice(ps[0], ps), null);
  assert.equal(phraseCaption(ps[1], ps), 'A′ (parecida a A)');
  assert.equal(phraseAt(ps, 5).id, 'p1');
});

test('forma AABA de 16 compases: B no se repite y queda sin frase', () => {
  const A = [1, 2, 3, 4].map((s) => bar(s)), B = [5, 6, 9, 10].map((s) => bar(s, 5));
  const ps = findPhrases(score([...A, ...A, ...B, ...A]));
  assert.deepEqual(shape(ps), [['A', 0, 3, null], ['A', 4, 7, 'p0'], ['A', 12, 15, 'p0']]);
  assert.ok(ps.every((p) => p.exact));
  assert.equal(repeatNotice(ps[1], ps), 'Esta frase ya la tocaste: es igual a los compases 1–4');
  assert.equal(phraseCaption(ps[2], ps), 'A (se repite)');
});

test('AABA con A′ en la segunda aparición y B repetido: letras por orden de aparición', () => {
  const A = [1, 2, 3, 4].map((s) => bar(s)), B = [5, 6, 9, 10].map((s) => bar(s, 5));
  const A2 = [...A.slice(0, 3), bar(11)];
  const ps = findPhrases(score([...A, ...A2, ...B, ...B]));
  assert.deepEqual(shape(ps), [['A', 0, 3, null], ['A′', 4, 7, 'p0'], ['B', 8, 11, null], ['B', 12, 15, 'p2']]);
});

test('pieza sin repeticiones → []', () => {
  assert.deepEqual(findPhrases(score([1, 2, 3, 4, 5, 6, 7, 8].map((s) => bar(s)))), []);
  assert.deepEqual(findPhrases(score([])), []);
  assert.deepEqual(findPhrases(score([bar(1)])), []);
});

test('repetición exacta de 2 compases', () => {
  const ps = findPhrases(score([bar(1), bar(2), bar(1), bar(2)]));
  assert.deepEqual(shape(ps), [['A', 0, 1, null], ['A', 2, 3, 'p0']]);
  assert.ok(ps[1].exact);
});

test('transposición: no cuenta como repetición', () => {
  const up = (m) => ({ ...m, rh: m.rh.map((e) => ({ ...e, k: e.k.map((k) => k.replace(/\/(\d)/, (_, o) => '/' + (+o + 1))) })) });
  const base = [1, 2, 3, 4].map((s) => bar(s));
  assert.deepEqual(findPhrases(score([...base, ...base.map(up)])), []);
});

test('un compás sólo es frase si se repite 3 o más veces', () => {
  // 2 apariciones de un compás suelto (con otros compases distintos alrededor): no es frase
  assert.deepEqual(findPhrases(score([bar(1), bar(2), bar(3), bar(1)])), []);
  const ps = findPhrases(score([bar(1), bar(1), bar(1)]));
  assert.deepEqual(shape(ps), [['A', 0, 0, null], ['A', 1, 1, 'p0'], ['A', 2, 2, 'p0']]);
});

test('igual salvo el último compás cuenta como variante (A′) aunque la frase sea de 2 compases', () => {
  const ps = findPhrases(score([bar(1), bar(2), bar(1), bar(3)]));
  assert.deepEqual(shape(ps), [['A', 0, 1, null], ['A′', 2, 3, 'p0']]);
  assert.equal(ps[1].variation, 'end');
});

test('mismo contorno con otro ritmo → variante', () => {
  const a = [1, 2].map((s) => bar(s));
  const b = [1, 2].map((s) => bar(s, 4, 'q')).map((m) => ({ ...m, rh: m.rh.map((e) => ({ ...e, d: 'q', dots: 0 })) }));
  b[0] = { ...b[0], rh: [{ k: b[0].rh[0].k, d: 'h' }, { k: b[0].rh[1].k, d: '8' }, { k: b[0].rh[2].k, d: '8' }, { k: b[0].rh[3].k, d: 'q' }] };
  b[1] = { ...b[1], rh: [{ k: b[1].rh[0].k, d: 'h' }, { k: b[1].rh[1].k, d: '8' }, { k: b[1].rh[2].k, d: '8' }, { k: b[1].rh[3].k, d: 'q' }] };
  const ps = findPhrases(score([...a, ...b]));
  assert.deepEqual(shape(ps), [['A', 0, 1, null], ['A′', 2, 3, 'p0']]);
  assert.equal(ps[1].variation, 'rhythm');
});

test('si la derecha está vacía se usa la izquierda', () => {
  const lh = (s) => ({ rh: [], lh: bar(s).rh.map((e) => ({ ...e, k: e.k.map((k) => k.replace('/4', '/2').replace('/5', '/3')) })) });
  const ps = findPhrases(score([lh(1), lh(2), lh(1), lh(2)]));
  assert.deepEqual(shape(ps), [['A', 0, 1, null], ['A', 2, 3, 'p0']]);
});
