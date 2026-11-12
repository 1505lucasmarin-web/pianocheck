import test from 'node:test';
import assert from 'node:assert/strict';
import { validateScore, buildSteps, durBeats } from '../js/model.js';
import {
  setDuration, moveHand, setFinger, shiftPitch, deleteNote, insertEvent, setComment, setReviewed, createHistory, restsFor, beatsOf, fingerOfRef,
} from '../js/review.js';
import { detectIssues, needsImportCheck, pendingIssues } from '../js/issues.js';

const q = (k) => ({ k: [k], d: 'q' });
const rest = (d, dots) => ({ k: [], d, ...(dots ? { dots } : {}) });
const base = () => ({
  id: 't1', title: 'Prueba', bpm: 80, timeSig: [4, 4], keySig: 'C',
  measures: [
    { rh: [q('c/4'), q('d/4'), { k: ['e/4'], d: 'h' }], lh: [{ k: ['c/3'], d: 'w' }] },
    { rh: [q('c/5'), q('b/4'), rest('h')], lh: [rest('w')] },
  ],
});
const sums = (sc, mi) => ['rh', 'lh'].map((h) => beatsOf(sc.measures[mi][h]));
const R = (measure, hand, idx, keyIdx = 0) => ({ measure, hand, idx, keyIdx });

test('restsFor descompone en silencios válidos', () => {
  assert.deepEqual(restsFor(3), [{ k: [], d: 'h', dots: 1 }]);
  assert.deepEqual(restsFor(1.5).map((e) => durBeats(e)), [1.5]);
  assert.equal(restsFor(2.75).reduce((a, e) => a + durBeats(e), 0), 2.75);
  assert.deepEqual(restsFor(0), []);
});

test('setDuration: acortar agrega un silencio y el compás sigue sumando 4', () => {
  const r = setDuration(base(), R(0, 'rh', 0), '8');
  assert.ok(r.ok); assert.equal(r.warn, undefined);
  assert.deepEqual(r.score.measures[0].rh.map((e) => e.d + (e.k.length ? '' : 'r')), ['8', '8r', 'q', 'h']);
  assert.deepEqual(sums(r.score, 0), [4, 4]);
  // la partitura original no cambia
  assert.equal(base().measures[0].rh[0].d, 'q');
});

test('setDuration: alargar absorbe silencios o avisa si se pasa', () => {
  const sc = base();
  const ok = setDuration(sc, R(1, 'rh', 0), 'h');              // c/5 negra → blanca; hay un silencio de blanca para absorber
  assert.equal(ok.warn, undefined);
  assert.deepEqual(sums(ok.score, 1), [4, 4]);
  assert.deepEqual(ok.score.measures[1].rh.map((e) => durBeats(e)), [2, 1, 1]);
  const over = setDuration(sc, R(0, 'rh', 0), 'h');             // no hay silencios: 5 tiempos
  assert.ok(over.ok); assert.deepEqual(over.warn, { over: 1 });
  assert.equal(beatsOf(over.score.measures[0].rh), 5);
});

test('setDuration con puntillo', () => {
  const r = setDuration(base(), R(0, 'rh', 1), 'q', 1);         // d/4 negra con puntillo = 1,5
  assert.equal(r.score.measures[0].rh[1].dots, 1);
  assert.equal(r.warn.over, 0.5);
  const r2 = setDuration(r.score, R(0, 'rh', 1), 'q', 0);
  assert.equal(r2.score.measures[0].rh[1].dots, undefined);
  assert.equal(setDuration(base(), R(0, 'rh', 9), 'q').ok, false);
  assert.equal(setDuration(base(), R(0, 'rh', 0), 'zz').ok, false);
});

test('moveHand: pasa la nota a la otra mano en el mismo instante y completa con silencios', () => {
  const r = moveHand(base(), R(1, 'rh', 1));                    // b/4 (tiempo 2) de la derecha → izquierda (compás vacío)
  assert.ok(r.ok);
  const m = r.score.measures[1];
  assert.deepEqual(m.rh.map((e) => e.k.length ? e.k[0] : 'r'), ['c/5', 'r', 'r']);
  assert.deepEqual(m.lh.map((e) => e.k.length ? e.k[0] : 'r'), ['r', 'b/4', 'r']);
  assert.deepEqual(sums(r.score, 1), [4, 4]);
  assert.deepEqual(r.ref, { measure: 1, hand: 'lh', idx: 1, keyIdx: 0 });
  // los pasos de práctica reflejan el cambio: ahora b/4 es de la mano izquierda
  const st = buildSteps(r.score, 'lh');
  assert.ok(st.some((s) => s.measure === 1 && s.midi.includes(71)));
});

test('moveHand: conflicto con notas de la otra mano, y suma al acorde si coincide exacto', () => {
  const sc = base();
  assert.equal(moveHand(sc, R(0, 'rh', 0)).ok, false);          // la izquierda tiene una redonda ahí
  const sc2 = base();
  sc2.measures[1].lh = [q('g/3'), rest('q'), rest('h')];
  const mg = moveHand(sc2, R(1, 'rh', 0));                      // c/5 negra en tiempo 0 ↔ g/3 negra: se suma como acorde
  assert.ok(mg.ok); assert.deepEqual(mg.score.measures[1].lh[0].k, ['g/3', 'c/5']);
});

test('moveHand de una nota de un acorde sólo mueve esa nota', () => {
  const sc = base();
  sc.measures[1].rh[0] = { k: ['c/4', 'e/4'], d: 'q', f: [1, 3] };
  const r = moveHand(sc, R(1, 'rh', 0, 0));
  assert.deepEqual(r.score.measures[1].rh[0].k, ['e/4']); assert.deepEqual(r.score.measures[1].rh[0].f, [3]);
  assert.deepEqual(r.score.measures[1].lh[0].k, ['c/4']); assert.deepEqual(r.score.measures[1].lh[0].f, [1]);
});

test('digitación: va en paralelo a las alturas y la conserva validateScore', () => {
  let sc = setFinger(base(), R(0, 'rh', 0), 3).score;
  assert.deepEqual(sc.measures[0].rh[0].f, [3]); assert.equal(fingerOfRef(sc, R(0, 'rh', 0)), 3);
  sc = insertEvent(sc, R(0, 'rh', 0), 'chord').score;
  assert.deepEqual(sc.measures[0].rh[0].f, [3, 0]);
  sc = setFinger(sc, R(0, 'rh', 0, 1), 5).score;
  assert.deepEqual(sc.measures[0].rh[0].f, [3, 5]);
  const v = validateScore(JSON.parse(JSON.stringify(sc)));
  assert.deepEqual(v.score.measures[0].rh[0].f, [3, 5]);
  sc = deleteNote(sc, R(0, 'rh', 0, 0)).score;                  // sale la primera nota y su dedo
  assert.deepEqual(sc.measures[0].rh[0].f, [5]);
  assert.equal(setFinger(sc, R(0, 'rh', 0), 0).score.measures[0].rh[0].f, undefined);
  assert.equal(setFinger(sc, R(0, 'rh', 0), 9).score.measures[0].rh[0].f, undefined);   // fuera de 1–5 = sin dedo
});

test('insertar nota o silencio antes/después; si no hay lugar, avisa', () => {
  const sc = base();
  const a = insertEvent(sc, R(1, 'rh', 0), 'after');            // c/5 + nueva negra: absorbe parte del silencio de blanca
  assert.deepEqual(sums(a.score, 1), [4, 4]); assert.equal(a.warn, undefined);
  assert.deepEqual(a.ref, { measure: 1, hand: 'rh', idx: 1, keyIdx: 0 });
  assert.deepEqual(a.score.measures[1].rh.map((e) => e.k[0] || 'r'), ['c/5', 'c/5', 'b/4', 'r']);
  const b = insertEvent(sc, R(1, 'rh', 1), 'before');
  assert.deepEqual(b.ref, { measure: 1, hand: 'rh', idx: 1, keyIdx: 0 });
  const full = insertEvent(sc, R(0, 'rh', 1), 'after');          // compás lleno de notas
  assert.deepEqual(full.warn, { over: 1 });
  const r = insertEvent(sc, R(1, 'rh', 0), 'before', { rest: true });
  assert.deepEqual(r.ref, { measure: 1, hand: 'rh', idx: 1, keyIdx: 0 });   // la selección sigue en la misma nota
  assert.equal(r.score.measures[1].rh[0].k.length, 0);
  assert.deepEqual(sums(r.score, 1), [4, 4]);
  assert.equal(insertEvent(sc, R(0, 'rh', 0), 'chord', { rest: true }).ok, false);
});

test('shiftPitch y deleteNote', () => {
  const up = shiftPitch(base(), R(0, 'rh', 0), 1);
  assert.deepEqual(up.score.measures[0].rh[0].k, ['c#/4']);
  assert.equal(shiftPitch(base(), R(0, 'rh', 0), 12).score.measures[0].rh[0].k[0], 'c/5');
  const del = deleteNote(base(), R(0, 'rh', 1));
  assert.deepEqual(del.score.measures[0].rh[1], { k: [], d: 'q' }); assert.equal(del.ref, null);
});

test('comentarios y avisos revisados', () => {
  let sc = setComment(base(), 1, '  Sostené   el bajo  ').score;
  assert.deepEqual(sc.comments, { 1: 'Sostené el bajo' });
  assert.equal(setComment(sc, 1, '').score.comments, undefined);
  assert.equal(setComment(base(), 9, 'x').ok, false);
  assert.equal(setComment(base(), 0, 'x'.repeat(500)).score.comments[0].length, 160);
  sc = setReviewed(sc, 'sum:1:rh', true).score;
  assert.deepEqual(sc.reviewed, ['sum:1:rh']);
  assert.equal(setReviewed(sc, 'sum:1:rh', false).score.reviewed, undefined);
});

test('validateScore conserva digitación, comentarios, avisos revisados y origen; descarta lo inválido; las viejas siguen igual', () => {
  const v = validateScore({
    title: 'X', origin: 'foto', measures: [
      { rh: [{ k: ['c/4', 'e/4'], d: 'q', f: [1, 9] }, { k: ['d/4'], d: 'q', f: [0] }, { k: ['x/9', 'g/4'], d: 'h', f: [2, 5] }], lh: [] },
      { rh: [q('c/4')], lh: [] },
    ],
    comments: { 0: ' hola ', 1: '', 7: 'fuera', x: 'no', 1.5: 'no' }, reviewed: ['sum:0:rh', 'basura', 3, 'norm:2'],
  });
  const m = v.score.measures[0].rh;
  assert.deepEqual(m[0].f, [1, 0]);           // 9 no es dedo válido
  assert.equal(m[1].f, undefined);            // todo en cero: sin campo
  assert.deepEqual(m[2].k, ['g/4']); assert.deepEqual(m[2].f, [5]);   // la altura inválida se saca junto con su dedo
  assert.deepEqual(v.score.comments, { 0: 'hola' });
  assert.deepEqual(v.score.reviewed, ['sum:0:rh', 'norm:2']);
  assert.equal(v.score.origin, 'foto');
  assert.equal(validateScore({ measures: [{ rh: [q('c/4')], lh: [] }], origin: 'otra' }).score.origin, undefined);
  const old = validateScore(base()).score;
  assert.ok(!('comments' in old) && !('reviewed' in old) && !('origin' in old));
  assert.equal(old.measures[0].rh[0].f, undefined);
  assert.deepEqual(validateScore(JSON.parse(JSON.stringify(old))).score.measures, old.measures);
});

test('historial de varios pasos: deshacer y rehacer', () => {
  const h = createHistory();
  let s = base();
  const states = [];
  for (let i = 0; i < 3; i++) { h.push(s); s = shiftPitch(s, R(0, 'rh', 0), 1).score; states.push(s.measures[0].rh[0].k[0]); }
  assert.deepEqual(states, ['c#/4', 'd/4', 'd#/4']);
  assert.ok(h.canUndo && !h.canRedo);
  s = h.undo(s); assert.equal(s.measures[0].rh[0].k[0], 'd/4');
  s = h.undo(s); assert.equal(s.measures[0].rh[0].k[0], 'c#/4');
  s = h.redo(s); assert.equal(s.measures[0].rh[0].k[0], 'd/4');
  assert.ok(h.canRedo);
  h.push(s);                                                      // una edición nueva borra lo que se podía rehacer
  assert.ok(!h.canRedo);
  const h2 = createHistory(2); [1, 2, 3, 4].forEach((n) => h2.push({ n })); assert.equal(h2.size, 2);
  assert.equal(createHistory().undo({}), null);
});

test('avisos de importación: compás que no suma, compás vacío en una mano, salto de registro y compás normalizado', () => {
  const sc = {
    title: 'Foto', origin: 'foto', timeSig: [4, 4], keySig: 'C',
    measures: [
      { rh: [q('c/4'), q('d/4'), q('e/4'), q('f/4')], lh: [{ k: ['c/3'], d: 'w' }] },
      { rh: [q('c/4'), q('d/4'), { k: ['e/4'], d: 'q', dots: 1 }], lh: [{ k: ['c/3'], d: 'w' }] },          // rh suma 3,5
      { rh: [{ k: ['g/4'], d: 'w' }], lh: [rest('w')] },                                                       // lh vacía y rh toca
      { rh: [{ k: ['c/4'], d: 'h' }, { k: ['c/7'], d: 'h' }], lh: [{ k: ['c/3'], d: 'w' }] },                 // salto de 3 octavas
      { rh: [{ k: ['d/7'], d: 'w' }], lh: [{ k: ['c/3'], d: 'w' }] },
    ],
  };
  const list = detectIssues(sc, { warnings: ['Compás 5 rh[1]: duración inválida "x", descartado', 'Aviso suelto'] });
  assert.deepEqual(list.map((x) => [x.kind, x.measure, x.hand || null]), [['sum', 1, 'rh'], ['empty', 2, 'lh'], ['leap', 3, 'rh'], ['norm', 4, null]]);
  assert.match(list[0].text, /Compás 2.*suma 3,5 tiempos.*indica 4 tiempos/);
  assert.deepEqual(list.map((x) => x.key), ['sum:1:rh', 'empty:2:lh', 'leap:3:rh', 'norm:4']);
  assert.ok(list.every((x) => !x.reviewed));
  // revisados
  const rv = detectIssues({ ...sc, reviewed: ['sum:1:rh', 'leap:3:rh'] }, { warnings: [] });
  assert.deepEqual(pendingIssues(rv).map((x) => x.key), ['empty:2:lh']);
  assert.equal(rv.find((x) => x.key === 'sum:1:rh').reviewed, true);
  // una partitura sana no tiene avisos; una pieza sólo de melodía no marca "mano vacía" en todos los compases
  assert.deepEqual(detectIssues({ timeSig: [4, 4], measures: [{ rh: [{ k: ['c/4'], d: 'w' }], lh: [] }, { rh: [{ k: ['d/4'], d: 'w' }], lh: [] }] }), []);
  assert.ok(needsImportCheck({ origin: 'pdf' }) && needsImportCheck({ origin: 'ia' }) && !needsImportCheck({}) && !needsImportCheck({ origin: 'xml' }));
  // 6/8: un compás de 3 negras
  assert.deepEqual(detectIssues({ timeSig: [6, 8], measures: [{ rh: [{ k: ['c/4'], d: 'h', dots: 1 }], lh: [] }] }), []);
});
