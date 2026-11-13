import test from 'node:test';
import assert from 'node:assert/strict';
import { validateScore, keyToMidi, midiToKey, midiName, durBeats, buildSteps } from '../js/model.js';

test('keyToMidi: naturales, sostenidos, bemoles y dobles', () => {
  assert.equal(keyToMidi('c/4'), 60);
  assert.equal(keyToMidi('a/4'), 69);
  assert.equal(keyToMidi('f#/4'), 66);
  assert.equal(keyToMidi('bb/3'), 58);
  assert.equal(keyToMidi('b/3'), 59);
  assert.equal(keyToMidi('c##/4'), 62);
  assert.equal(keyToMidi('dbb/4'), 60);
  assert.equal(keyToMidi('cb/4'), 59);
  assert.equal(keyToMidi('b#/3'), 60);
  assert.equal(keyToMidi('C/4'), 60);
  assert.equal(keyToMidi('en/4'), 64);
  assert.equal(keyToMidi('c/-1'), 0);
  assert.equal(keyToMidi('g/9'), 127);
});

test('keyToMidi: inválidas → null', () => {
  for (const bad of ['', 'h/4', 'c4', 'c/', null, undefined, 5, 'c/10', 'cb/-1']) {
    assert.equal(keyToMidi(bad), null, String(bad));
  }
});

test('midiToKey y midiName', () => {
  assert.equal(midiToKey(60), 'c/4');
  assert.equal(midiToKey(61), 'c#/4');
  assert.equal(midiToKey(21), 'a/0');
  assert.equal(midiToKey(0), 'c/-1');
  assert.equal(midiToKey(128), null);
  assert.equal(midiName(61), 'Do#4');
  assert.equal(midiName(67), 'Sol4');
  assert.equal(midiName(71), 'Si4');
  assert.equal(midiName(62), 'Re4');
  for (let m = 0; m < 128; m++) assert.equal(keyToMidi(midiToKey(m)), m);
});

test('durBeats con puntillos', () => {
  assert.equal(durBeats({ k: [], d: 'w' }), 4);
  assert.equal(durBeats({ k: [], d: 'h' }), 2);
  assert.equal(durBeats({ k: [], d: 'q' }), 1);
  assert.equal(durBeats({ k: [], d: '8' }), 0.5);
  assert.equal(durBeats({ k: [], d: '16' }), 0.25);
  assert.equal(durBeats({ k: [], d: '32' }), 0.125);
  assert.equal(durBeats({ k: [], d: 'h', dots: 1 }), 3);
  assert.equal(durBeats({ k: [], d: 'q', dots: 2 }), 1.75);
  assert.equal(durBeats({ k: [], d: '8', dots: 1 }), 0.75);
  assert.equal(durBeats({ k: [], d: 'x' }), 0);
});

test('validateScore: normaliza y aplica defaults', () => {
  const r = validateScore({
    title: '  Hola ', keySig: 'f#m',
    measures: [{ rh: [{ k: ['C/4', ' E/4 '], d: 'Q' }], lh: [{ k: [], d: 'h', dots: 1 }] }],
  });
  assert.equal(r.ok, true);
  assert.equal(r.score.title, 'Hola');
  assert.equal(r.score.bpm, 80);
  assert.deepEqual(r.score.timeSig, [4, 4]);
  assert.equal(r.score.keySig, 'F#m');
  assert.ok(r.score.id);
  assert.deepEqual(r.score.measures[0].rh[0], { k: ['c/4', 'e/4'], d: 'q' });
  assert.deepEqual(r.score.measures[0].lh[0], { k: [], d: 'h', dots: 1 });
});

test('validateScore: descarta eventos inválidos sin lanzar', () => {
  const r = validateScore({
    bpm: 'rápido', timeSig: [3, 7], keySig: 'Zz',
    measures: [
      { rh: [{ k: ['c/4'], d: 'q' }, { k: ['c/4'], d: 'zz' }, null, { k: ['h/9'], d: 'q' }, { k: ['c/4', 'x'], d: '8', tie: true }], lh: 'no' },
      null,
    ],
  });
  assert.equal(r.score.bpm, 80);
  assert.deepEqual(r.score.timeSig, [4, 4]);
  assert.equal(r.score.keySig, 'C');
  assert.equal(r.score.measures.length, 2);
  assert.equal(r.score.measures[0].rh.length, 2);
  assert.deepEqual(r.score.measures[0].rh[1], { k: ['c/4'], d: '8', tie: true });
  assert.deepEqual(r.score.measures[0].lh, []);
  assert.deepEqual(r.score.measures[1], { rh: [], lh: [] });
  assert.ok(r.errors.length >= 4);
});

test('validateScore: entradas basura nunca lanzan', () => {
  for (const bad of [null, undefined, 5, 'x', [], '{"measures":[]}', { measures: 3 }, {}]) {
    const r = validateScore(bad);
    assert.equal(r.ok, false);
    assert.ok(r.errors.length > 0);
    assert.ok(Array.isArray(r.score.measures));
  }
  const s = validateScore('{"measures":[{"rh":[{"k":["c/4"],"d":"q"}],"lh":[]}]}');
  assert.equal(s.ok, true);
});

const sc = (measures, extra = {}) => ({ id: 'x', title: 't', bpm: 80, timeSig: [4, 4], keySig: 'C', measures, ...extra });
const E = (k, d = 'q', more = {}) => ({ k: Array.isArray(k) ? k : [k], d, ...more });

test('buildSteps: acordes → midi únicos y ordenados, con refs', () => {
  const steps = buildSteps(sc([{ rh: [E(['g/4', 'c/4', 'e/4', 'c/4'], 'w')], lh: [] }]));
  assert.equal(steps.length, 1);
  assert.deepEqual(steps[0].midi, [60, 64, 67]);
  assert.equal(steps[0].i, 0);
  assert.equal(steps[0].t, 0);
  assert.equal(steps[0].refs.length, 4);
});

test('buildSteps: acorde con refs keyIdx', () => {
  const steps = buildSteps(sc([{ rh: [E(['c/4', 'e/4'], 'q')], lh: [] }]));
  assert.deepEqual(steps[0].refs, [
    { measure: 0, hand: 'rh', idx: 0, keyIdx: 0 },
    { measure: 0, hand: 'rh', idx: 0, keyIdx: 1 },
  ]);
});

test('buildSteps: ambas manos desfasadas se unen por instante', () => {
  const m = {
    rh: [E('e/5', '8'), E('d/5', '8'), E('c/5', 'h'), E('b/4', 'q')],          // t 0,.5,1,3
    lh: [E('c/3', 'h'), E('g/2', 'q'), E('g/2', 'q')],                         // t 0,2,3
  };
  const steps = buildSteps(sc([m]));
  assert.deepEqual(steps.map((s) => s.t), [0, 0.5, 1, 2, 3]);
  assert.deepEqual(steps[0].midi, [48, 76]);
  assert.deepEqual(steps[3].midi, [43]);
  assert.deepEqual(steps[4].midi, [43, 71]);
  assert.deepEqual(steps.map((s) => s.i), [0, 1, 2, 3, 4]);
  assert.deepEqual(steps[4].refs.map((r) => r.hand).sort(), ['lh', 'rh']);
});

test('buildSteps: silencios ocupan tiempo pero no generan paso', () => {
  const steps = buildSteps(sc([{ rh: [E([], 'q'), E('c/4', 'q'), E([], 'h')], lh: [] }, { rh: [E('d/4', 'w')], lh: [] }]));
  assert.deepEqual(steps.map((s) => s.t), [1, 4]);
  assert.deepEqual(steps.map((s) => s.measure), [0, 1]);
});

test('buildSteps: ligaduras omitidas y puntillos suman tiempo', () => {
  const steps = buildSteps(sc([
    { rh: [E('c/4', 'h', { dots: 1 }), E('d/4', 'q')], lh: [] },
    { rh: [E('d/4', 'q', { tie: true }), E('e/4', 'q')], lh: [] },
  ]));
  assert.deepEqual(steps.map((s) => s.midi[0]), [60, 62, 64]);
  assert.deepEqual(steps.map((s) => s.t), [0, 3, 5]);
});

test('buildSteps: filtro por mano conserva el tiempo absoluto', () => {
  const s = sc([{ rh: [E('c/5', 'q'), E('d/5', 'q')], lh: [E('c/3', 'h')] }, { rh: [E('e/5', 'w')], lh: [E('g/2', 'w')] }]);
  const rh = buildSteps(s, 'rh');
  const lh = buildSteps(s, 'lh');
  const both = buildSteps(s, 'both');
  assert.deepEqual(rh.map((x) => x.midi), [[72], [74], [76]]);
  assert.deepEqual(rh.map((x) => x.t), [0, 1, 2]);
  assert.deepEqual(lh.map((x) => x.midi), [[48], [43]]);
  assert.deepEqual(lh.map((x) => x.t), [0, 2]);
  assert.equal(both.length, 3);
  assert.ok(rh.every((x) => x.refs.every((r) => r.hand === 'rh')));
});

test('buildSteps: compás vacío usa el compás de la armadura de tiempo; entradas raras', () => {
  const s = sc([{ rh: [], lh: [] }, { rh: [E('c/4', 'q')], lh: [] }], { timeSig: [3, 4] });
  assert.equal(buildSteps(s)[0].t, 3);
  assert.deepEqual(buildSteps(null), []);
  assert.deepEqual(buildSteps({}), []);
});

test('sourceUrl: se conserva sólo si es http(s) válido', async () => {
  const { validateScore } = await import('../js/model.js');
  const base = { title: 'X', measures: [{ rh: [{ k: ['c/4'], d: 'q' }], lh: [] }] };
  assert.equal(validateScore({ ...base, sourceUrl: ' https://youtu.be/abc?t=1 ' }).score.sourceUrl, 'https://youtu.be/abc?t=1');
  assert.equal(validateScore({ ...base, sourceUrl: 'javascript:alert(1)' }).score.sourceUrl, undefined);
  assert.equal(validateScore({ ...base, sourceUrl: 'https://a b' }).score.sourceUrl, undefined);
  assert.equal(validateScore({ ...base, sourceUrl: 42 }).score.sourceUrl, undefined);
  assert.equal(validateScore(base).score.sourceUrl, undefined);
  assert.equal('sourceUrl' in validateScore(base).score, false);
});

test('validateScore: pickupBeats (anacrusa) se conserva sólo si es > 0 y menor que el compás', () => {
  const base = { timeSig: [3, 8], measures: [{ rh: [{ k: ['c/4'], d: '8' }], lh: [] }] };
  assert.equal(validateScore({ ...base, pickupBeats: 0.5 }).score.pickupBeats, 0.5);
  assert.equal(validateScore({ ...base, pickupBeats: 1.234 }).score.pickupBeats, 1.23);
  assert.equal('pickupBeats' in validateScore(base).score, false);
  for (const bad of [0, -1, 3, 4, '1', null, NaN]) assert.equal('pickupBeats' in validateScore({ ...base, pickupBeats: bad }).score, false, String(bad));
});

import { handSig as _hs } from "../js/model.js";
test("show (voces de la mano izquierda): se conserva si coincide con lo que se toca y se descarta si se edita", () => {
  const lh = [{ k: ["c/4"], d: "h" }];
  const base = { id: "x", title: "t", bpm: 80, timeSig: [2, 4], keySig: "C", measures: [{ rh: [{ k: ["e/5"], d: "h" }], lh, show: { lh: [[{ k: ["c/4"], d: "h", src: 0 }]], sig: _hs(lh) } }] };
  assert.equal(validateScore(base).score.measures[0].show.lh[0][0].src, 0);
  base.measures[0].lh = [{ k: ["d/4"], d: "h" }];
  assert.equal(validateScore(base).score.measures[0].show, undefined);
});
