import test from 'node:test';
import assert from 'node:assert/strict';
import { createPitchTracker, findNotes, decideNotes, createSpectrumAnalyzer, thresholdsFromSensitivity } from '../js/pitch.js';
import { createSession } from '../js/engine.js';
import { buildSteps, keyToMidi } from '../js/model.js';
import { demoScore } from '../js/demo.js';
import { renderEvents, feed, rng, addNoise } from './synth.mjs';

/** Corre el tracker sobre `buf`; getExpected puede ser una función o un arreglo fijo. */
function run(buf, expected, { sr = 44100, seed = 1, sens } = {}) {
  const out = [];
  const tr = createPitchTracker({ sampleRate: sr, getExpected: typeof expected === 'function' ? expected : () => expected.slice(), onNote: (m) => out.push(m), sensitivity: sens });
  feed(tr, buf, seed);
  return out;
}

test('FFT/espectro: una senoide da un pico con su amplitud', () => {
  const n = 8192, sr = 44100, an = createSpectrumAnalyzer(n);
  const f = 20 * sr / n; // centrada en bin
  const x = new Float32Array(n); for (let i = 0; i < n; i++) x[i] = 0.25 * Math.sin(2 * Math.PI * f * i / sr);
  const mag = an.magnitude(x);
  let k = 0; for (let i = 1; i < mag.length; i++) if (mag[i] > mag[k]) k = i;
  assert.equal(k, 20);
  assert.ok(Math.abs(mag[20] - 0.25) < 0.005, String(mag[20]));
});

test('nota sola correcta en La1–Do7: se emite exactamente esa nota (>=95%)', (t) => {
  let ok = 0, tot = 0; const bad = [];
  for (const sr of [44100, 48000]) {
    for (let m = 33; m <= 96; m++) {
      if (sr === 48000 && m % 3) continue; // 48 kHz: submuestra
      const seed = m * 7 + (sr === 48000 ? 5 : 1);
      const buf = renderEvents([{ t: 0.5, notes: [m], dur: 1.2, vel: 0.35 + (m % 5) * 0.15 }], { sr, seed, total: 2.2 });
      const out = run(buf, [m], { sr, seed });
      tot++; if (out.length === 1 && out[0] === m) ok++; else bad.push([m, sr, out]);
    }
  }
  t.diagnostic(`notas solas: ${ok}/${tot} (${(100 * ok / tot).toFixed(1)}%) fallos=${JSON.stringify(bad)}`);
  assert.ok(ok / tot >= 0.95, `${ok}/${tot}`);
});

test('nota equivocada (±1, ±2, ±5): se emite un error y NUNCA la esperada (>=90%)', (t) => {
  let err = 0, tot = 0, expHit = 0; const miss = [];
  for (let ex = 36; ex <= 90; ex += 2) {
    for (const d of [-5, -2, -1, 1, 2, 5]) {
      const p = ex + d; if (p < 33 || p > 96) continue;
      const seed = ex * 13 + d + 50;
      const buf = renderEvents([{ t: 0.5, notes: [p], dur: 1.2, vel: 0.4 + ((ex + d) % 4) * 0.2 }], { seed, total: 2.2 });
      const out = run(buf, [ex], { seed });
      tot++;
      if (out.includes(ex)) expHit++;
      if (out.some((x) => x !== ex)) err++; else miss.push([ex, d, out]);
    }
  }
  t.diagnostic(`errores emitidos: ${err}/${tot} (${(100 * err / tot).toFixed(1)}%), esperada emitida por error: ${expHit}, sin emitir=${JSON.stringify(miss)}`);
  assert.equal(expHit, 0);
  assert.ok(err / tot >= 0.9, `${err}/${tot}`);
});

const CHORDS = [
  [48, 55], [60, 67], [36, 43], [33, 40], [84, 91], [72, 79],            // quintas
  [36, 48], [45, 57], [60, 72], [72, 84], [76, 88], [96, 84],            // octavas
  [60, 64, 67], [65, 69, 72], [72, 76, 79], [41, 48, 53], [48, 60, 67],  // tríadas
  [40, 47, 52, 56], [60, 64, 67, 72], [48, 52, 55, 60], [72, 76, 79, 84], [55, 59, 62, 67], [36, 43, 48, 55], [50, 57, 62, 66],
];
test('acordes de 2, 3 y 4 notas: se emiten todas, una vez cada una', (t) => {
  let ok = 0, tot = 0; const bad = [];
  for (const c of CHORDS) {
    for (let s = 0; s < 3; s++) {
      const seed = c[0] * 3 + c.length + s * 101;
      const buf = renderEvents([{ t: 0.5, notes: c, dur: 1.2, vel: 0.8, offs: c.map((_, i) => i * 0.004) }], { seed, total: 2.2 });
      const out = run(buf, c, { seed });
      tot++;
      const good = out.length === c.length && c.every((x) => out.filter((y) => y === x).length === 1);
      if (good) ok++; else bad.push([c.join('+'), s, out.join(',')]);
    }
  }
  t.diagnostic(`acordes: ${ok}/${tot} (${(100 * ok / tot).toFixed(1)}%) fallos=${JSON.stringify(bad)}`);
  assert.ok(ok / tot >= 0.95, `${ok}/${tot}`);
});

test('acorde incompleto: no se emite error por la nota que falta', () => {
  let bad = 0, tot = 0;
  for (const [c, played] of [[[60, 64, 67], [60, 67]], [[48, 55, 64], [48, 64]], [[72, 76, 79, 84], [72, 79, 84]]]) {
    for (let s = 0; s < 3; s++) {
      const buf = renderEvents([{ t: 0.5, notes: played, dur: 1.2, vel: 0.8 }], { seed: 900 + s + c[0], total: 2.2 });
      const out = run(buf, c, { seed: s });
      tot++;
      if (out.some((x) => !played.includes(x)) || out.includes(c.find((x) => !played.includes(x)))) bad++;
    }
  }
  assert.equal(bad, 0);
});

test('nota sostenida de un paso anterior + nueva nota: sólo se emite la nueva', (t) => {
  let ok = 0, tot = 0; const bad = [];
  const pairs = [[60, 64], [60, 67], [48, 52], [72, 76], [55, 62], [64, 60], [67, 59], [40, 47], [60, 62], [84, 79]];
  for (const [a, b] of pairs) for (let s = 0; s < 2; s++) {
    const seed = a * 11 + b + s * 31;
    const buf = renderEvents([{ t: 0.4, notes: [a], dur: 2.6 }, { t: 1.4, notes: [b], dur: 1.2 }], { seed, total: 3.2 });
    let exp = [a]; const out = [];
    const tr = createPitchTracker({ sampleRate: 44100, getExpected: () => exp.slice(), onNote: (m) => { out.push(m); if (m === exp[0]) exp = exp[0] === a ? [b] : []; } });
    feed(tr, buf, seed);
    tot++; if (out.length === 2 && out[0] === a && out[1] === b) ok++; else bad.push([a, b, s, out]);
  }
  t.diagnostic(`sostenida+nueva: ${ok}/${tot} fallos=${JSON.stringify(bad)}`);
  assert.ok(ok / tot >= 0.95, `${ok}/${tot}`);
});

test('nota sostenida con pedal (varias notas sonando) + nueva: sólo la nueva', () => {
  const buf = renderEvents([{ t: 0.3, notes: [48, 55, 60], dur: 3.0 }, { t: 1.5, notes: [64], dur: 1.2 }], { seed: 4, total: 3.4 });
  let exp = [48, 55, 60]; const out = [];
  const tr = createPitchTracker({ getExpected: () => exp.slice(), onNote: (m) => { out.push(m); exp = exp.filter((x) => x !== m); if (!exp.length && out.length === 3) exp = [64]; } });
  feed(tr, buf, 3);
  assert.deepEqual(out, [48, 55, 60, 64]);
});

test('misma nota repetida: se emite dos veces (y tres a tempo rápido)', (t) => {
  let ok = 0, tot = 0; const bad = [];
  for (const m of [45, 52, 60, 64, 72, 79, 84]) for (const gap of [0.7, 0.45]) {
    const seed = m * 5 + Math.round(gap * 100);
    const buf = renderEvents([{ t: 0.4, notes: [m], dur: 1.5 }, { t: 0.4 + gap, notes: [m], dur: 1.5 }, { t: 0.4 + 2 * gap, notes: [m], dur: 1.2 }], { seed, total: 0.4 + 2 * gap + 1.4 });
    const out = run(buf, [m], { seed });
    tot++; if (out.length === 3 && out.every((x) => x === m)) ok++; else bad.push([m, gap, out]);
  }
  t.diagnostic(`repetida x3: ${ok}/${tot} fallos=${JSON.stringify(bad)}`);
  assert.ok(ok / tot >= 0.9, `${ok}/${tot}`);
});

test('click, ruido blanco breve, golpe grave, silencio y metrónomo: no se emite nada', () => {
  const sr = 44100;
  const rand = rng(99);
  // silencio con ruido de fondo
  assert.deepEqual(run(renderEvents([], { total: 3, seed: 2 }), [60]), []);
  // clicks de ruido blanco de 3–30 ms a distintos niveles
  for (const [dur, lvl] of [[0.003, 0.5], [0.01, 0.3], [0.03, 0.2], [0.03, 0.6]]) {
    const buf = renderEvents([], { total: 2.4, seed: 5 });
    const n = Math.round(dur * sr), i0 = Math.round(0.6 * sr);
    for (let i = 0; i < n; i++) buf[i0 + i] += lvl * (rand() * 2 - 1) * (1 - i / n);
    assert.deepEqual(run(buf, [60]), [], `ruido ${dur}s ${lvl}`);
    assert.deepEqual(run(buf, [48, 55]), [], `ruido ${dur}s ${lvl} (acorde)`);
  }
  // golpe grave (thump): ráfaga de ruido filtrada pasa-bajos
  { const buf = renderEvents([], { total: 2.4, seed: 6 }); let y = 0;
    for (let i = 0; i < 0.12 * sr; i++) { y += 0.02 * ((rand() * 2 - 1) - y); buf[Math.round(0.5 * sr) + i] += 6 * y * Math.exp(-i / (0.03 * sr)); }
    assert.deepEqual(run(buf, [60]), [], 'thump'); }
  // click del metrónomo de la app: onda cuadrada 1000 y 1600 Hz, 40 ms
  for (const f of [1000, 1600]) {
    const buf = renderEvents([], { total: 3, seed: 7 });
    for (const t0 of [0.5, 1.2, 1.9]) for (let i = 0; i < 0.04 * sr; i++) { const t = i / sr; buf[Math.round(t0 * sr) + i] += 0.4 * (Math.sin(2 * Math.PI * f * t) >= 0 ? 1 : -1) * Math.exp(-t / 0.012); }
    assert.deepEqual(run(buf, [60]), [], `metrónomo ${f}`);
    assert.deepEqual(run(buf, [83]), [], `metrónomo ${f} (esperando Si5)`);
  }
});

test('sin notas esperadas: el tracker no emite nada', () => {
  const buf = renderEvents([{ t: 0.5, notes: [60], dur: 1.2 }], { seed: 3, total: 2.2 });
  assert.deepEqual(run(buf, []), []);
});

test('equivalente de octava: no se marca error sin evidencia fuerte; la nota correcta sigue válida', () => {
  // esperada Do4; se toca Do4 + eco de Do5 débil → válida, sin error
  const buf = renderEvents([{ t: 0.5, notes: [60], dur: 1.2 }, { t: 0.5, notes: [72], dur: 1.2, vel: 0.15 }], { seed: 8, total: 2.2 });
  assert.deepEqual(run(buf, [60], { seed: 1 }), [60]);
});

test('sensibilidad: baja no detecta una nota muy suave; alta sí', () => {
  const buf = renderEvents([{ t: 0.5, notes: [64], dur: 1.2, vel: 0.02 }], { seed: 12, total: 2.2, noiseDb: -70 });
  const lo = run(buf, [64], { sens: 0.0 }), hi = run(buf, [64], { sens: 1.0 });
  assert.deepEqual(lo, []);
  assert.deepEqual(hi, [64]);
  const th = thresholdsFromSensitivity(1), tl = thresholdsFromSensitivity(0);
  assert.ok(th.absScore < tl.absScore && th.minLevelDb < tl.minLevelDb);
});

test('decideNotes: ambiguo (dos alturas parecidas) no emite error; hit manda sobre error', () => {
  const thr = thresholdsFromSensitivity(0.5);
  assert.deepEqual(decideNotes([{ midi: 61, s: 1 }, { midi: 66, s: 0.9 }], [60], thr), { hits: [], error: null });
  assert.deepEqual(decideNotes([{ midi: 61, s: 1 }, { midi: 60, s: 0.5 }], [60], thr), { hits: [60], error: null });
  assert.deepEqual(decideNotes([{ midi: 61, s: 1 }], [60], thr), { hits: [], error: 61 });
  assert.deepEqual(decideNotes([{ midi: 72, s: 0.4 }], [60], thr), { hits: [], error: null }); // octava con poca evidencia
});

/** Notas de la demo: [{t (s), midi[]}] a partir de los pasos reales. */
function demoEvents(bpm, { wrongAt = [] } = {}) {
  const steps = buildSteps(demoScore, 'both');
  const spb = 60 / bpm;
  const evs = steps.map((st, i) => {
    let notes = st.midi.slice();
    if (wrongAt.includes(i)) notes = notes.map((m) => m + 1); // semitono arriba: error deliberado
    return { t: 1.0 + st.t * spb, notes, dur: 1.3, vel: 0.9, i };
  });
  return { steps, evs };
}

test('melodía de la demo sintetizada completa, con createSession real → 100%', (t) => {
  const { steps, evs } = demoEvents(70);
  const buf = renderEvents(evs, { seed: 21, total: evs[evs.length - 1].t + 2.2 });
  const session = createSession(steps);
  const log = [];
  const tr = createPitchTracker({
    getExpected: () => { const st = session.state; if (st.status !== 'playing') return []; return steps[st.index].midi.filter((m) => !st.pressed.includes(m)); },
    onNote: (m) => { const r = session.noteOn(m); log.push([m, r.type]); },
  });
  feed(tr, buf, 5);
  t.diagnostic(`demo: ${session.state.accuracy}% pasos=${session.state.cleanSteps}/${steps.length} erradas=${session.state.wrongNotes}`);
  assert.equal(session.state.status, 'finished', JSON.stringify(session.state));
  assert.equal(session.state.accuracy, 100);
  assert.equal(session.state.wrongNotes, 0);
});

test('demo con errores deliberados: se marcan y la sesión sigue', (t) => {
  const wrongAt = [3, 9];
  const { steps, evs } = demoEvents(70, { wrongAt });
  // tras cada error el pianista toca la nota correcta ~0.8 s después
  // tras cada error el pianista toca la nota correcta ~0.8 s después; los pasos siguientes se corren otro tanto
  let shift = 0; const shifted = [];
  for (const e of evs) {
    shifted.push({ ...e, t: e.t + shift });
    if (wrongAt.includes(e.i)) { shifted.push({ t: e.t + shift + 0.8, notes: steps[e.i].midi, dur: 1.0, vel: 0.9 }); shift += 0.8; }
  }
  const buf = renderEvents(shifted, { seed: 22, total: shifted[shifted.length - 1].t + 2.2 });
  const session = createSession(steps);
  const tr = createPitchTracker({
    getExpected: () => { const st = session.state; if (st.status !== 'playing') return []; return steps[st.index].midi.filter((m) => !st.pressed.includes(m)); },
    onNote: (m) => session.noteOn(m),
  });
  feed(tr, buf, 6);
  const st = session.state;
  t.diagnostic(`demo con errores: ${st.accuracy}% limpios=${st.cleanSteps} sucios=${st.dirtySteps} erradas=${st.wrongNotes}`);
  assert.equal(st.status, 'finished');
  assert.equal(st.dirtySteps, wrongAt.length);
  assert.equal(st.wrongNotes, wrongAt.length);
});

test('piano desafinado (−25 y +20 cents): notas sueltas >=95% y las equivocadas no validan la esperada', (t) => {
  let ok = 0, tot = 0, expHit = 0, err = 0, etot = 0;
  for (const cents of [-25, 20]) {
    for (let m = 36; m <= 93; m += 3) {
      const seed = m * 17 + cents + 500;
      const out = run(renderEvents([{ t: 0.5, notes: [m], dur: 1.2, vel: 0.7 }], { seed, total: 2.2, cents }), [m], { seed });
      tot++; if (out.length === 1 && out[0] === m) ok++;
      const o2 = run(renderEvents([{ t: 0.5, notes: [m + 2], dur: 1.2, vel: 0.7 }], { seed: seed + 1, total: 2.2, cents }), [m], { seed });
      etot++; if (o2.includes(m)) expHit++; if (o2.some((x) => x !== m)) err++;
    }
  }
  t.diagnostic(`desafinado: notas ${ok}/${tot}; errores +2 st: ${err}/${etot}, esperada validada por error: ${expHit}`);
  assert.ok(ok / tot >= 0.95);
  assert.equal(expHit, 0);
  assert.ok(err / etot >= 0.9);
});
