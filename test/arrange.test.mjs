import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeScore, melodyOnly, addAccompaniment, harmonize } from '../js/arrange.js';
import { PIECES } from '../js/pieces.js';
import { validateScore, durBeats, keyToMidi } from '../js/model.js';

const total = (evs) => evs.reduce((a, e) => a + durBeats(e), 0);
const piece = (id) => PIECES.find((p) => p.id === id);
const oda = () => piece('oda-a-la-alegria').versions[0].score;
const scaleOf = { C: [0, 2, 4, 5, 7, 9, 11], G: [7, 9, 11, 0, 2, 4, 6], D: [2, 4, 6, 7, 9, 11, 1], F: [5, 7, 9, 10, 0, 2, 4], Am: [9, 11, 0, 2, 4, 5, 7, 8] };

test('addAccompaniment: Oda a la alegría — compases suman, la derecha no cambia, los acordes son de la tonalidad', () => {
  for (const pattern of ['bajo', 'acordes']) {
    const src = oda();
    const before = JSON.stringify(src);
    const out = addAccompaniment(src, { pattern });
    assert.equal(JSON.stringify(src), before, 'no modifica el original');
    assert.deepEqual(out.measures.map((m) => m.rh), src.measures.map((m) => m.rh));
    assert.equal(validateScore(out).errors.length, 0);
    out.measures.forEach((m, i) => {
      assert.equal(total(m.lh), 4, `compás ${i + 1}`);
      assert.ok(m.lh.every((e) => e.k.length > 0), 'la izquierda tiene notas');
      for (const e of m.lh) for (const k of e.k) assert.ok(scaleOf.C.includes(keyToMidi(k) % 12), `${k} no es de Do mayor`);
    });
    // empieza y termina en Do
    const first = out.measures[0].lh[0].k.map((k) => keyToMidi(k) % 12);
    const last = out.measures[15].lh.at(-1).k.map((k) => keyToMidi(k) % 12);
    assert.ok(first.includes(0)); assert.ok(last.includes(0));
    if (pattern === 'acordes') assert.equal(out.measures[0].lh[0].k.length, 3);
    else assert.equal(out.measures[0].lh[0].k.length, 1);
  }
  const bajo = addAccompaniment(oda());
  assert.equal(bajo.measures[0].lh[0].d, 'h');                 // medio compás = blanca
});

test('addAccompaniment: tríadas en posición fundamental (I, IV, V, vi) y registro de mano izquierda', () => {
  const out = addAccompaniment(oda(), { pattern: 'acordes' });
  const triads = new Set(['0,4,7', '5,9,0', '7,11,2', '9,0,4']);
  for (const m of out.measures) for (const e of m.lh) {
    const mids = e.k.map(keyToMidi);
    assert.ok(Math.min(...mids) >= 43 && Math.max(...mids) <= 66, e.k.join());
    assert.ok(triads.has(mids.map((x) => x % 12).join()), e.k.join());
  }
});

test('addAccompaniment: otras tonalidades, compases y anacrusa', () => {
  for (const id of ['minueto-en-sol', 'canon-de-pachelbel', 'noche-de-paz', 'greensleeves', 'cumpleanos-feliz', 'para-elisa', 'estrellita']) {
    const s = piece(id).versions[0].score;
    const out = addAccompaniment(s, { pattern: 'acordes' });
    assert.deepEqual(out.measures.map((m) => m.rh), s.measures.map((m) => m.rh), id);
    const scale = scaleOf[s.keySig] || [{ G: 7, D: 2 }[s.keySig]].flatMap((t) => [0, 2, 4, 5, 7, 9, 11].map((x) => (x + t) % 12));
    out.measures.forEach((m, i) => {
      assert.equal(total(m.lh), total(m.rh), `${id} compás ${i + 1}`);
      for (const e of m.lh) for (const k of e.k) assert.ok(scale.includes(keyToMidi(k) % 12), `${id}: ${k}`);
    });
  }
  // la anacrusa queda en silencio
  const cb = addAccompaniment(piece('cumpleanos-feliz').versions[0].score);
  assert.deepEqual(cb.measures[0].lh, [{ k: [], d: 'q' }]);
  // tonalidad con bemoles: ortografía con bemoles
  const f = { id: 'f', title: 'F', bpm: 80, timeSig: [4, 4], keySig: 'Bb', measures: [
    { rh: [{ k: ['bb/4'], d: 'h' }, { k: ['d/5'], d: 'h' }], lh: [] }, { rh: [{ k: ['eb/5'], d: 'h' }, { k: ['bb/4'], d: 'h' }], lh: [] }] };
  const o = addAccompaniment(f, { pattern: 'acordes' });
  assert.ok(o.measures.flatMap((m) => m.lh).flatMap((e) => e.k).every((k) => !k.includes('#')));
});

test('harmonize: un acorde por compás o medio compás, con grado, raíz y notas', () => {
  const h = harmonize(oda());
  assert.equal(h.length, 32);
  assert.ok(h.every((c) => ['I', 'IV', 'V', 'vi'].includes(c.degree) && c.pcs.length === 3 && c.beats === 2));
  assert.equal(h[0].degree, 'I');
  assert.equal(h.at(-1).degree, 'I');
  const w = harmonize(piece('minueto-en-sol').versions[0].score);       // 3/4: uno por compás
  assert.equal(w.length, 16);
  assert.ok(w.every((c) => c.beats === 3));
  const m = harmonize(piece('greensleeves').versions[0].score);
  assert.equal(m.length, 15);                                           // la anacrusa no lleva acorde
  assert.equal(m[0].measure, 1);
  assert.ok(m.every((c) => ['i', 'iv', 'V', 'VI'].includes(c.degree)));
  assert.deepEqual(harmonize({ measures: [] }), []);
});

test('melodyOnly: deja la derecha (voz superior), izquierda en silencios, idempotente', () => {
  const s = {
    id: 'x', title: 'X', bpm: 80, timeSig: [4, 4], keySig: 'C', measures: [
      { rh: [{ k: ['c/4', 'e/4', 'g/4'], d: 'h', f: [1, 3, 5] }, { k: ['d/4', 'f/4'], d: 'q' }, { k: [], d: 'q' }], lh: [{ k: ['c/3'], d: 'w' }] },
      { rh: [{ k: ['e/4'], d: 'w' }], lh: [{ k: ['c/3', 'g/3'], d: 'h' }, { k: ['c/3'], d: 'h' }] },
    ],
  };
  const m = melodyOnly(s);
  assert.deepEqual(m.measures[0].rh, [{ k: ['g/4'], d: 'h', f: [5] }, { k: ['f/4'], d: 'q' }, { k: [], d: 'q' }]);
  assert.deepEqual(m.measures[0].lh, [{ k: [], d: 'w' }]);
  assert.deepEqual(m.measures[1].lh, [{ k: [], d: 'w' }]);
  assert.equal(s.measures[0].rh[0].k.length, 3, 'no modifica el original');
  assert.deepEqual(melodyOnly(m), m);
  assert.equal(validateScore(m).errors.length, 0);
  // sobre una pieza con acompañamiento: vuelve a la versión de sólo melodía
  const p = piece('noche-de-paz');
  assert.deepEqual(melodyOnly(p.versions[1].score).measures, p.versions[0].score.measures);
  assert.deepEqual(melodyOnly(piece('cumpleanos-feliz').versions[1].score).measures, piece('cumpleanos-feliz').versions[0].score.measures);
});

test('analyzeScore sobre las piezas incluidas', () => {
  const a = analyzeScore(oda());
  assert.equal(a.estimated, 'sencilla');
  assert.equal(a.hands, 'rh');
  assert.equal(a.chordDensity, 0);
  assert.equal(a.accidentals, 0);
  assert.equal(a.shortestDur, 0.5);
  assert.deepEqual(a.range.rh, { min: 55, max: 67 });
  assert.equal(a.range.lh, null);
  assert.equal(a.range.span, 12);
  assert.equal(a.maxLeap, 9);                                            // 8vo compás -> sol grave
  const acc = analyzeScore(piece('oda-a-la-alegria').versions[1].score);
  assert.equal(acc.hands, 'both');
  assert.ok(acc.chordDensity > 0.3 && acc.chordDensity < 0.4);
  assert.equal(acc.range.lh.min, 43);
  const fe = analyzeScore(piece('para-elisa').versions[0].score);
  assert.equal(fe.shortestDur, 0.25);
  assert.ok(fe.accidentals >= 1);                                        // re# fuera de la tonalidad
  assert.notEqual(fe.estimated, 'sencilla');
  assert.equal(analyzeScore(piece('estrellita').versions[0].score).estimated, 'sencilla');
  assert.equal(analyzeScore(piece('greensleeves').versions[0].score).keySigCount, 0);
  assert.equal(analyzeScore(piece('canon-de-pachelbel').versions[0].score).keySigCount, 2);
});

test('analyzeScore: partitura exigente = elaborada; entradas raras no lanzan', () => {
  const hard = { timeSig: [4, 4], keySig: 'F#', measures: Array.from({ length: 4 }, () => ({
    rh: Array.from({ length: 16 }, (_, i) => ({ k: [i % 2 ? 'c/3' : 'c/6', i % 2 ? 'e/3' : 'e/6'], d: '16' })),
    lh: Array.from({ length: 16 }, () => ({ k: ['c/2', 'g/2', 'e/3'], d: '16' })),
  })) };
  assert.equal(analyzeScore(hard).estimated, 'elaborada');
  assert.equal(analyzeScore(null).hands, 'none');
  assert.equal(analyzeScore({}).range.min, null);
  assert.equal(analyzeScore({ measures: [{ rh: [], lh: [] }] }).estimated, 'sencilla');
});
