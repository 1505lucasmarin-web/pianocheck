import test from 'node:test';
import assert from 'node:assert/strict';
import { notesToScore, cleanNotes, estimateTempo, detectKey, spell, splitSpan, segmentsToMeasures, framesToNotes, extractMelody, separateHands, handBeats, frameToTime, MODEL } from '../js/transcribe-core.js';
import { validateScore, keyToMidi, durBeats } from '../js/model.js';
import { demoScore } from '../js/demo.js';

// azar reproducible
function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

/** Partitura → notas "tocadas" (con jitter y duraciones imperfectas) como las dejaría un transcriptor. */
function scoreToNotes(sc, bpm, { jit = 0.03, hands = ['rh', 'lh'], seed = 3, legato = 0.9, drift = 0, t0 = 0.4 } = {}) {
  const r = rng(seed), spb = 60 / bpm, out = [];
  let base = 0;
  const warp = (b) => b * spb * (1 + drift * Math.sin(b / 40));
  for (const m of sc.measures) {
    let len = 0;
    for (const h of hands) {
      let t = 0;
      for (const ev of m[h]) {
        const d = durBeats(ev);
        if (ev.k.length && !ev.tie) {
          const j0 = (r() * 2 - 1) * jit, j1 = (r() * 2 - 1) * jit;   // el jitter es del golpe; cada nota del acorde se corre ±6 ms
          for (const k of ev.k) {
            out.push({ midi: keyToMidi(k), start: t0 + warp(base + t) + j0 + (r() * 2 - 1) * 0.006, end: t0 + warp(base + t + d * legato) + j1, velocity: 0.55 + 0.25 * r() });
          }
        }
        t += d;
      }
      len = Math.max(len, t);
    }
    base += len;
  }
  return out;
}
const fig = (ev) => `${ev.k.join('+')}:${ev.d}${ev.dots || ''}${ev.tie ? '~' : ''}`;
const bar = (sc) => (sc.timeSig[0] * 4) / sc.timeSig[1];
function assertSums(sc) {
  sc.measures.forEach((m, i) => {
    for (const h of ['rh', 'lh']) assert.ok(Math.abs(handBeats(m[h]) - bar(sc)) < 1e-9, `compás ${i + 1} ${h} suma ${handBeats(m[h])} != ${bar(sc)}`);
  });
}

test('Oda a la alegría con jitter ±30 ms: mismas alturas y figuras que la demo (mano derecha)', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const { score, info } = notesToScore(scoreToNotes(demoScore, 80, { hands: ['rh'], seed }), {});
    assert.ok(Math.abs(info.bpm - 80) <= 3, `bpm ${info.bpm}`);
    assert.deepEqual(score.timeSig, [4, 4]);
    assert.equal(score.keySig, 'C');
    assert.equal(score.measures.length, 8);
    demoScore.measures.forEach((m, i) => assert.deepEqual(score.measures[i].rh.map(fig), m.rh.map(fig), `seed ${seed} compás ${i + 1}`));
    assertSums(score);
  }
});

test('Oda a la alegría a dos manos: manos separadas y mismas alturas', () => {
  const { score, info } = notesToScore(scoreToNotes(demoScore, 80, { seed: 7 }), {});
  assert.deepEqual(score.timeSig, [4, 4]);
  assert.ok(Math.abs(info.bpm - 80) <= 3);
  demoScore.measures.forEach((m, i) => {
    assert.deepEqual(score.measures[i].rh.map(fig), m.rh.map(fig), `rh compás ${i + 1}`);
    const lhGot = score.measures[i].lh.filter((e) => e.k.length).map((e) => e.k.slice().sort().join('+'));
    const lhWant = m.lh.map((e) => e.k.slice().sort().join('+'));
    assert.deepEqual(lhGot, lhWant, `lh compás ${i + 1}`);
  });
  assertSums(score);
  assert.ok(validateScore(score).ok);
});

function waltz(seed) {
  // 3/4, oom-pah-pah: bajo en 1, acorde en 2 y 3; melodía en negras y blanca
  const C = ['c/3', 'e/3', 'g/3'], bass = (k) => ({ k: [k], d: 'q' }), ch = (k) => ({ k, d: 'q' });
  const mel = [['e/5', 'd/5', 'c/5'], ['d/5', 'e/5', 'g/5'], ['a/5', 'g/5', 'e/5'], ['d/5', 'd/5', 'd/5']];
  const bars = [];
  for (let r = 0; r < 2; r++) mel.forEach((m, i) => {
    const bs = i % 2 ? 'g/2' : 'c/2', cc = i % 2 ? ['b/2', 'd/3', 'g/3'] : C;
    bars.push({ rh: m.map((k) => ({ k: [k], d: 'q' })), lh: [bass(bs), ch(cc), ch(cc)] });
  });
  bars.push({ rh: [{ k: ['c/5'], d: 'h', dots: 1 }], lh: [{ k: ['c/3', 'e/3', 'g/3'], d: 'h', dots: 1 }] });
  return { id: 'w', title: 'vals', bpm: 150, timeSig: [3, 4], keySig: 'C', measures: bars };
}

test('vals en 3/4', () => {
  for (const seed of [1, 2, 3]) {
    const w = waltz();
    const { score, info } = notesToScore(scoreToNotes(w, 150, { seed }), {});
    assert.deepEqual(score.timeSig, [3, 4], `seed ${seed}`);
    assert.ok(Math.abs(info.bpm - 150) <= 4, `bpm ${info.bpm}`);
    assert.equal(score.measures.length, w.measures.length);
    assert.deepEqual(score.measures[0].rh.map(fig), ['e/5:q', 'd/5:q', 'c/5:q']);
    assertSums(score);
  }
});

test('anacrusa: el primer compás lleva silencio + la nota de arranque', () => {
  // 4/4 a 100 bpm; una negra de anacrusa y luego compases con bajo en el 1
  const q = (k, d = 'q') => ({ k: [k], d });
  const bars = [
    { rh: [{ k: [], d: 'h', dots: 1 }, q('g/4')], lh: [{ k: [], d: 'w' }] },
    { rh: [q('c/5', 'h'), q('c/5'), q('d/5')], lh: [q('c/2', 'h'), q('g/3', 'h')] },
    { rh: [q('e/5', 'h'), q('d/5'), q('c/5')], lh: [q('c/2', 'h'), q('g/3', 'h')] },
    { rh: [q('d/5', 'h'), q('e/5'), q('d/5')], lh: [q('g/1', 'h'), q('g/3', 'h')] },
    { rh: [q('c/5', 'w')], lh: [q('c/2', 'w')] },
  ];
  const sc = { id: 'a', title: 'a', bpm: 100, timeSig: [4, 4], keySig: 'C', measures: bars };
  for (const seed of [1, 2, 3]) {
    const { score, info } = notesToScore(scoreToNotes(sc, 100, { seed }), {});
    assert.deepEqual(score.timeSig, [4, 4]);
    assert.ok(Math.abs(info.pickupBeats - 1) < 0.01, `pickup ${info.pickupBeats}`);
    assert.equal(score.measures.length, 5);
    const m0 = score.measures[0].rh.filter((e) => e.k.length);
    assert.deepEqual(m0.map(fig), ['g/4:q']);
    assert.equal(score.measures[0].rh[0].k.length, 0, 'empieza con silencio');
    assert.deepEqual(score.measures[1].rh.map(fig), ['c/5:h', 'c/5:q', 'd/5:q']);
    assertSums(score);
  }
});

test('ligaduras entre compases y todos los compases suman', () => {
  // una nota de 6 negras que arranca en el tiempo 2 de un 4/4 + acompañamiento marcando el pulso
  const spb = 0.5; // 120 bpm
  const notes = [];
  for (let b = 0; b < 16; b++) notes.push({ midi: 36 + (b % 4 === 0 ? 0 : 7), start: b * spb, end: b * spb + 0.42, velocity: b % 4 === 0 ? 0.8 : 0.55 });
  notes.push({ midi: 72, start: 1 * spb, end: 7 * spb - 0.05, velocity: 0.7 });
  notes.push({ midi: 74, start: 9 * spb, end: 10 * spb - 0.05, velocity: 0.7 });
  const { score } = notesToScore(notes, { bpm: 120, timeSig: [4, 4] });
  assertSums(score);
  const tied = score.measures.flatMap((m) => m.rh).filter((e) => e.k.includes('c/6') || e.k.includes('c/5') || e.k.includes('d/5'));
  const c6 = score.measures.flatMap((m) => m.rh).filter((e) => e.k.join() === 'c/5');
  assert.ok(c6.length >= 2, 'la nota larga se parte en ' + c6.length);
  assert.ok(c6.slice(1).every((e) => e.tie), 'las partes siguientes están ligadas');
  assert.ok(!c6[0].tie);
  assert.ok(tied.length > 0);
  const total = c6.reduce((a, e) => a + durBeats(e), 0);
  assert.ok(Math.abs(total - 6) < 1e-9, 'suma 6 negras: ' + total);
});

test('notas fantasma: armónicos débiles, fantasma una octava abajo, fragmentos y notas muy cortas se eliminan', () => {
  const base = [{ midi: 60, start: 1, end: 2, velocity: 0.8 }, { midi: 64, start: 2, end: 3, velocity: 0.8 }, { midi: 67, start: 3, end: 4, velocity: 0.8 }];
  const ghosts = [
    { midi: 72, start: 1.01, end: 1.9, velocity: 0.3 },     // octava arriba, débil
    { midi: 83, start: 3.0, end: 3.8, velocity: 0.28 },     // quinta+octava arriba, débil
    { midi: 52, start: 2.0, end: 2.95, velocity: 0.78 },    // una octava abajo de 64, empieza a la vez
    { midi: 70, start: 2.5, end: 2.53, velocity: 0.7 },     // 30 ms: muy corta
    { midi: 65, start: 3.5, end: 3.9, velocity: 0.05 },     // casi inaudible
    { midi: 60, start: 2.02, end: 2.4, velocity: 0.2 },     // fragmento? (no es continuación: queda como débil)
  ];
  const out = cleanNotes([...base, ...ghosts]);
  assert.deepEqual(out.map((n) => n.midi), [60, 64, 67]);
  assert.ok(out.stats.ghosts + out.stats.weak + out.stats.short >= 5);
  // un doble en octava de la misma fuerza en graves se conserva (bajo real)
  const keep = cleanNotes([{ midi: 36, start: 0, end: 1, velocity: 0.8 }, { midi: 48, start: 0, end: 1, velocity: 0.8 }]);
  assert.equal(keep.length, 2);
});

test('fragmentos de la misma nota se fusionan; una repetición fuerte no', () => {
  const frag = cleanNotes([{ midi: 60, start: 0, end: 0.5, velocity: 0.8 }, { midi: 60, start: 0.52, end: 1.0, velocity: 0.5 }]);
  assert.equal(frag.length, 1);
  assert.ok(Math.abs(frag[0].end - 1.0) < 1e-9);
  const rep = cleanNotes([{ midi: 60, start: 0, end: 0.5, velocity: 0.7 }, { midi: 60, start: 0.52, end: 1.0, velocity: 0.8 }]);
  assert.equal(rep.length, 2);
});

test('polifonía máxima por instante', () => {
  const ns = [];
  for (let i = 0; i < 14; i++) ns.push({ midi: 40 + i * 3, start: 0, end: 2, velocity: 0.4 + i * 0.03 });
  assert.equal(cleanNotes(ns, { maxPoly: 8, ghosts: false }).length, 8);
});

test('modo "melodia": sólo la línea superior, mano izquierda vacía, aun con banda', () => {
  const sc = {
    id: 'b', title: 'b', bpm: 100, timeSig: [4, 4], keySig: 'C', measures: [0, 1, 2, 3].map((i) => ({
      rh: [{ k: ['e/5'], d: 'q' }, { k: ['d/5'], d: 'q' }, { k: ['c/5'], d: 'h' }],
      lh: [{ k: ['c/2'], d: 'q' }, { k: ['c/3', 'e/3', 'g/3'], d: 'q' }, { k: ['c/2'], d: 'q' }, { k: ['c/3', 'e/3', 'g/3'], d: 'q' }],
    })),
  };
  const notes = scoreToNotes(sc, 100, { seed: 4 });
  const mel = notesToScore(notes, { mode: 'melodia' });
  const all = mel.score.measures.flatMap((m) => m.rh).filter((e) => e.k.length && !e.tie);
  assert.deepEqual([...new Set(all.map((e) => e.k[0]))].sort(), ['c/5', 'd/5', 'e/5']);
  assert.ok(all.every((e) => e.k.length === 1));
  assert.ok(mel.score.measures.every((m) => m.lh.every((e) => e.k.length === 0)));
  assertSums(mel.score);
  assert.equal(mel.info.mode, 'melodia');
  const two = notesToScore(notes, {});
  assert.ok(two.score.measures.some((m) => m.lh.some((e) => e.k.length > 1)));
});

test('simplificar: máximo 3 notas por mano y extensión de a lo sumo una octava', () => {
  const ns = [];
  for (let b = 0; b < 8; b++) for (const m of [36, 43, 48, 52, 55, 67, 71, 74, 79]) ns.push({ midi: m, start: b * 0.5, end: b * 0.5 + 0.45, velocity: 0.6 });
  const { score } = notesToScore(ns, { bpm: 120, timeSig: [4, 4], simplify: true, maxPoly: 12 });
  for (const m of score.measures) for (const h of ['rh', 'lh']) for (const e of m[h]) {
    if (e.k.length) {
      assert.ok(e.k.length <= 3);
      const ms = e.k.map(keyToMidi);
      assert.ok(Math.max(...ms) - Math.min(...ms) <= 12);
    }
  }
});

test('tempo dado por el usuario y compás forzado', () => {
  const notes = scoreToNotes(demoScore, 80, { hands: ['rh'], seed: 2 });
  const r = notesToScore(notes, { bpm: 80, timeSig: [4, 4] });
  assert.equal(r.score.bpm, 80);
  assert.equal(r.info.bpm, 80);
  const f = notesToScore(notes, { timeSig: [3, 4] });
  assert.deepEqual(f.score.timeSig, [3, 4]);
  assertSums(f.score);
});

test('pulso con rubato leve (±3 % lento) sigue dando las mismas figuras', () => {
  const { score } = notesToScore(scoreToNotes(demoScore, 80, { hands: ['rh'], seed: 9, drift: 0.03 }), {});
  let same = 0, total = 0;
  demoScore.measures.forEach((m, i) => { total += m.rh.length; same += m.rh.filter((e, j) => score.measures[i] && fig(score.measures[i].rh[j] || { k: [], d: '' }) === fig(e)).length; });
  assert.ok(same / total >= 0.85, `figuras iguales ${same}/${total}`);
});

test('tonalidad y ortografía', () => {
  const g = [67, 69, 71, 72, 74, 71, 66, 67].map((m, i) => ({ midi: m, start: i, end: i + 0.9, velocity: 0.7 }));
  const k = detectKey(g);
  assert.equal(k.keySig, 'G');
  assert.equal(spell(66, k), 'f#/4');
  const f = detectKey([65, 67, 69, 70, 72, 70, 69, 65].map((m, i) => ({ midi: m, start: i, end: i + 0.9, velocity: 0.7 })));
  assert.equal(f.keySig, 'F');
  assert.equal(spell(70, f), 'bb/4');
  const am = detectKey([69, 71, 72, 74, 76, 72, 71, 69, 68, 69].map((m, i) => ({ midi: m, start: i, end: i + 0.9, velocity: 0.7 })));
  assert.equal(am.keySig, 'Am');
  assert.ok(validateScore({ keySig: k.keySig, measures: [] }).score.keySig === 'G');
});

test('splitSpan: formas legales alineadas al compás', () => {
  const sum = (seq) => seq.reduce((a, s) => a + s.u, 0);
  assert.deepEqual(splitSpan(0, 16, 16).map((s) => s.d), ['w']);
  assert.deepEqual(splitSpan(4, 8, 16).map((s) => s.d + s.dots), ['q0', 'q0']);        // blanca en el 2: dos negras ligadas
  assert.deepEqual(splitSpan(0, 6, 16).map((s) => s.d + s.dots), ['q1']);
  assert.deepEqual(splitSpan(0, 12, 16).map((s) => s.d + s.dots), ['h1']);
  for (let p = 0; p < 16; p++) for (let l = 1; l <= 16 - p; l++) assert.equal(sum(splitSpan(p, l, 16)), l);
  for (let p = 0; p < 12; p++) for (let l = 1; l <= 12 - p; l++) assert.equal(sum(splitSpan(p, l, 12, true)), l);
  for (let p = 0; p < 12; p++) for (let l = 1; l <= 12 - p; l++) assert.equal(sum(splitSpan(p, l, 12, false)), l);
});

test('segmentsToMeasures: huecos y barras', () => {
  const ms = segmentsToMeasures([{ s: 2, e: 20, keys: ['c/4'] }], 16, 2);
  assert.equal(ms.length, 2);
  for (const m of ms) assert.equal(handBeats(m), 4);
  assert.equal(ms[0][0].k.length, 0);
  assert.ok(ms[1].find((e) => e.k.length).tie);
});

test('6/8: una giga se reconoce como 6/8', () => {
  // grupos de tres corcheas: negra-corchea / corchea x3, a 66 bpm de negra con puntillo
  const E = 60 / 66 / 3, notes = [];
  const pat = [[0, 2], [2, 1], [3, 1], [4, 1], [5, 1], [6, 3], [9, 3]];  // (corchea de inicio, duración) dentro de 12 corcheas (2 compases)
  const pitches = [67, 69, 71, 72, 71, 69, 67, 74];
  for (let rep = 0; rep < 6; rep++) for (const [s, d] of pat) {
    const i = rep * 12 + s;
    notes.push({ midi: pitches[(rep * 3 + s) % pitches.length], start: 0.3 + i * E + (((i * 7) % 5) - 2) * 0.006, end: 0.3 + (i + d) * E - 0.03, velocity: s % 6 === 0 ? 0.8 : 0.55 });
    if (s % 6 === 0) notes.push({ midi: 43, start: 0.3 + i * E, end: 0.3 + (i + 3) * E, velocity: 0.6 });
  }
  const { score, info } = notesToScore(notes, {});
  assert.deepEqual(score.timeSig, [6, 8], JSON.stringify(info.stages.tempo));
  assertSums(score);
});

test('framesToNotes: reconstruye notas a partir de cuadros sintéticos', () => {
  const P = MODEL.nPitches, T = 120;
  const frames = new Float32Array(T * P), onsets = new Float32Array(T * P);
  const put = (midi, t0, len) => { const p = midi - 21; onsets[t0 * P + p] = 0.9; for (let t = t0; t < t0 + len; t++) frames[t * P + p] = 0.8; };
  put(60, 10, 30); put(64, 50, 20); put(72, 80, 25);
  frames[100 * P + 40] = 0.6; for (let t = 100; t < 112; t++) frames[t * P + 40] = 0.6;   // nota sin onset (melodia)
  const ns = framesToNotes(frames, onsets, T, {});
  const by = (m) => ns.filter((n) => n.midi === m);
  assert.equal(by(60).length, 1);
  assert.equal(by(64).length, 1);
  assert.equal(by(72).length, 1);
  assert.ok(Math.abs(by(60)[0].start - frameToTime(10)) < 1e-9);
  assert.ok(Math.abs(by(60)[0].end - by(60)[0].start - 30 * 256 / 22050) < 0.02);
  assert.equal(by(61).length, 1);
  assert.deepEqual(framesToNotes(new Float32Array(0), new Float32Array(0), 0), []);
});

test('extractMelody / separateHands: la línea saliente y el punto de división', () => {
  const ns = [];
  for (let i = 0; i < 8; i++) {
    ns.push({ midi: 72 + (i % 3), start: i, end: i + 0.9, velocity: 0.7 });
    ns.push({ midi: 48, start: i, end: i + 0.9, velocity: 0.7 }, { midi: 55, start: i, end: i + 0.9, velocity: 0.7 }, { midi: 67, start: i, end: i + 0.9, velocity: 0.45 });
  }
  const mel = extractMelody(ns);
  assert.deepEqual(mel.map((n) => n.midi), [72, 73, 74, 72, 73, 74, 72, 73]);
  const h = separateHands(ns, {});
  assert.ok(h.lh.every((n) => n.midi <= 55));
  assert.ok(h.rh.every((n) => n.midi >= 67));
});

test('entradas degeneradas: sin notas, una sola nota, notas inválidas', () => {
  const e = notesToScore([], {});
  assert.ok(e.info.warnings.length > 0);
  assert.ok(e.score.measures.length >= 1);
  const one = notesToScore([{ midi: 60, start: 0, end: 1, velocity: 0.7 }], {});
  assert.ok(validateScore(one.score).ok);
  assert.ok(one.info.warnings.some((w) => /Tempo dudoso/.test(w)));
  const bad = notesToScore([{ midi: NaN, start: 0, end: 1 }, null, { midi: 60, start: 2, end: 1 }, { midi: 200, start: 0, end: 1 }], {});
  assert.equal(bad.info.noteCount, 0);
});

test('aviso de percusión: muchas notas muy cortas', () => {
  const ns = [];
  for (let i = 0; i < 80; i++) ns.push({ midi: 50 + (i * 7) % 30, start: i * 0.25, end: i * 0.25 + 0.08, velocity: 0.7 });
  const { info } = notesToScore(ns, {});
  assert.ok(info.warnings.some((w) => /percusi/.test(w)), info.warnings.join('|'));
});

test('rendimiento: 5 minutos de notas en menos de 3 s', () => {
  const ns = [];
  for (let i = 0; i < 4000; i++) ns.push({ midi: 48 + ((i * 5) % 36), start: i * 0.075, end: i * 0.075 + 0.2, velocity: 0.5 + ((i * 3) % 5) / 10 });
  const t = Date.now();
  const r = notesToScore(ns, {});
  assert.ok(Date.now() - t < 3000, `${Date.now() - t} ms`);
  assert.ok(r.score.measures.length > 10);
});
