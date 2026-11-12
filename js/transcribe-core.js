// Transcripción de audio a partitura: núcleo PURO (sin DOM, sin WebAudio, sin TF.js). Seguro de importar en Node.
// Entrada: eventos de nota crudos [{midi, start, end, velocity}] (segundos, velocity 0..1) — típicamente la salida de Basic Pitch.
// Etapas: cleanNotes → estimateTempo → chooseMeter → separateHands/extractMelody → cuantización → keySig → compases con ligaduras → validateScore.
import { validateScore } from './model.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const mod = (a, n) => ((a % n) + n) % n;
const EPS = 1e-9;

/* ================================================================== 1. de cuadros del modelo a notas */

export const MODEL = { sampleRate: 22050, hop: 256, framesPerWindow: 172, midiOffset: 21, nPitches: 88 };
const WINDOW_OFFSET = (MODEL.hop / MODEL.sampleRate) * (MODEL.framesPerWindow - (MODEL.sampleRate * 2 - MODEL.hop) / MODEL.hop) + 0.0018;
/** Tiempo (s) del cuadro de salida del modelo (corrige el recorte de cada ventana de 2 s, igual que Basic Pitch). */
export const frameToTime = (f) => (f * MODEL.hop) / MODEL.sampleRate - WINDOW_OFFSET * Math.floor(f / MODEL.framesPerWindow);

/**
 * Convierte las salidas del modelo (frames y onsets, T×88 aplanadas) en eventos de nota.
 * Es el algoritmo de Basic Pitch (outputToNotesPoly) reescrito sobre Float32Array para que escale a minutos de audio.
 */
export function framesToNotes(frames, onsets, nFrames, o = {}) {
  const P = MODEL.nPitches;
  const onsetThresh = o.onsetThresh ?? 0.5, frameThresh = o.frameThresh ?? 0.3;
  const minLen = o.minNoteLen ?? 5, tol = o.energyTolerance ?? 11, melodia = o.melodia !== false;
  if (!nFrames || frames.length < nFrames * P || onsets.length < nFrames * P) return [];
  const rem = Float32Array.from(frames.subarray(0, nFrames * P));
  // onsets inferidos de la subida de energía entre cuadros
  const on = Float32Array.from(onsets.subarray(0, nFrames * P));
  if (o.inferOnsets !== false) {
    const diff = new Float32Array(nFrames * P);
    let dmax = 0, omax = 0;
    for (let i = 0; i < on.length; i++) if (on[i] > omax) omax = on[i];
    for (let t = 2; t < nFrames; t++) {
      for (let p = 0; p < P; p++) {
        const c = frames[t * P + p];
        const d = Math.max(0, Math.min(c - frames[(t - 1) * P + p], c - frames[(t - 2) * P + p]));
        diff[t * P + p] = d; if (d > dmax) dmax = d;
      }
    }
    if (dmax > 0) for (let i = 0; i < on.length; i++) { const v = (omax * diff[i]) / dmax; if (v > on[i]) on[i] = v; }
  }
  const peaks = [];
  for (let t = 1; t < nFrames - 1; t++) {
    for (let p = 0; p < P; p++) {
      const v = on[t * P + p];
      if (v > onsetThresh && v > on[(t - 1) * P + p] && v > on[(t + 1) * P + p]) peaks.push([t, p]);
    }
  }
  const notes = [];
  const kill = (t, p) => { rem[t * P + p] = 0; if (p < P - 1) rem[t * P + p + 1] = 0; if (p > 0) rem[t * P + p - 1] = 0; };
  const push = (t0, len, p) => {
    let sum = 0; for (let t = t0; t < t0 + len; t++) sum += frames[t * P + p];
    notes.push({
      midi: p + MODEL.midiOffset, start: frameToTime(t0), end: frameToTime(t0 + len),
      velocity: clamp(sum / len, 0, 1),
    });
  };
  for (let k = peaks.length - 1; k >= 0; k--) {          // de atrás hacia adelante, como el original
    const [t0, p] = peaks[k];
    let i = t0 + 1, c = 0;
    while (i < nFrames - 1 && c < tol) { if (rem[i * P + p] < frameThresh) c++; else c = 0; i++; }
    i -= c;
    if (i - t0 <= minLen) continue;
    for (let j = t0; j < i; j++) kill(j, p);
    push(t0, i - t0, p);
  }
  if (melodia) {                                          // trick "melodia": notas sin onset claro, de mayor a menor energía
    const cand = [];
    for (let t = 0; t < nFrames; t++) for (let p = 0; p < P; p++) if (rem[t * P + p] > frameThresh) cand.push(t * P + p);
    cand.sort((a, b) => rem[b] - rem[a]);
    for (const idx of cand) {
      if (rem[idx] <= frameThresh) continue;
      const iMid = Math.floor(idx / P), p = idx % P;
      rem[idx] = 0;
      let i = iMid + 1, c = 0;
      while (i < nFrames - 1 && c < tol) { if (rem[i * P + p] < frameThresh) c++; else c = 0; kill(i, p); i++; }
      const iEnd = i - 1 - c;
      i = iMid - 1; c = 0;
      while (i > 0 && c < tol) { if (rem[i * P + p] < frameThresh) c++; else c = 0; kill(i, p); i--; }
      const iStart = i + 1 + c;
      if (iEnd - iStart <= minLen) continue;
      push(iStart, iEnd - iStart, p);
    }
  }
  return notes.sort((a, b) => a.start - b.start || a.midi - b.midi);
}

/* ================================================================== 2. limpieza */

function percentile(arr, q) {
  if (!arr.length) return 0;
  const s = arr.slice().sort((a, b) => a - b);
  return s[clamp(Math.floor(q * (s.length - 1)), 0, s.length - 1)];
}

/**
 * Limpia notas crudas: fusiona fragmentos, quita notas muy cortas/débiles y armónicos fantasma, alinea acordes arpegiados
 * y limita la polifonía por instante. Devuelve notas nuevas (no muta la entrada) ordenadas por inicio.
 */
export function cleanNotes(raw, o = {}) {
  const opt = { minDur: 0.06, minVelAbs: 0.05, minVelRel: 0.45, subOctave: true, mergeGap: 0.05, ghosts: true, chordRoll: 0.035, maxPoly: 10, ...o };
  const stats = { input: 0, merged: 0, short: 0, weak: 0, ghosts: 0, poly: 0 };
  let ns = (Array.isArray(raw) ? raw : []).map((n) => ({
    midi: Math.round(Number(n && n.midi)), start: Number(n && n.start), end: Number(n && n.end),
    velocity: n && Number.isFinite(Number(n.velocity)) ? clamp(Number(n.velocity), 0, 1) : 0.6,
  })).filter((n) => Number.isFinite(n.midi) && n.midi >= 21 && n.midi <= 108 && Number.isFinite(n.start) && Number.isFinite(n.end) && n.end > n.start);
  stats.input = ns.length;
  // 1) fusionar fragmentos de la misma nota (continuación débil de una nota que seguía sonando)
  const byPitch = new Map();
  ns.sort((a, b) => a.start - b.start);
  for (const n of ns) { if (!byPitch.has(n.midi)) byPitch.set(n.midi, []); byPitch.get(n.midi).push(n); }
  const kept = [];
  for (const list of byPitch.values()) {
    let cur = null;
    for (const n of list) {
      if (cur && n.start - cur.end <= opt.mergeGap && (n.velocity <= cur.velocity * 0.65 || (n.end - n.start < 0.12 && n.velocity <= cur.velocity))) {
        cur.end = Math.max(cur.end, n.end); cur.velocity = Math.max(cur.velocity, n.velocity); stats.merged++;
      } else { if (cur) kept.push(cur); cur = { ...n }; }
    }
    if (cur) kept.push(cur);
  }
  ns = kept.sort((a, b) => a.start - b.start || a.midi - b.midi);
  // 2) cortas y débiles (la fuerza se compara con la de su entorno de ±2,5 s)
  ns = ns.filter((n) => { if (n.end - n.start < opt.minDur) { stats.short++; return false; } return true; });
  {
    const starts = ns.map((n) => n.start);
    let lo = 0, hi = 0;
    const dropW = new Set();
    for (let i = 0; i < ns.length; i++) {
      while (starts[lo] < ns[i].start - 2.5) lo++;
      while (hi < ns.length && starts[hi] <= ns[i].start + 2.5) hi++;
      const ref = percentile(ns.slice(lo, hi).map((x) => x.velocity), 0.9);
      if (ns[i].velocity < Math.max(opt.minVelAbs, opt.minVelRel * ref)) dropW.add(ns[i]);
      else if (ns[i].midi < 36 && ns[i].velocity < 0.45 && ns[i].end - ns[i].start < 0.4) dropW.add(ns[i]);   // graves dudosos
    }
    stats.weak = dropW.size;
    ns = ns.filter((n) => !dropW.has(n));
  }
  // 3) armónicos fantasma: una nota más débil que otra más grave que suena a la vez y está a una octava, quinta+octava, etc.;
  //    y el fantasma una octava ABAJO de una nota fuerte que empieza a la vez (típico de Basic Pitch en piano).
  if (opt.ghosts) {
    const HARM = new Set([12, 19, 24, 28, 31, 36]);
    const drop = new Set();
    for (let i = 0; i < ns.length; i++) {
      const n = ns[i];
      for (let j = i - 1; j >= 0 && n.start - ns[j].start <= 4; j--) {
        const l = ns[j];
        const d = n.midi - l.midi;
        if (!HARM.has(d) || drop.has(l) || n.start >= l.end || n.end > l.end + 0.15) continue;
        const sim = Math.abs(n.start - l.start) <= 0.08;
        if (n.velocity < (sim ? (d === 12 ? 0.55 : 0.5) : 0.45) * l.velocity) { drop.add(n); break; }
      }
      for (let j = i + 1; j < ns.length && ns[j].start - n.start <= 0.08; j++) {
        const h = ns[j];
        const d = h.midi - n.midi;
        if (HARM.has(d) && h.end <= n.end + 0.15 && h.velocity < (d === 12 ? 0.55 : 0.5) * n.velocity) drop.add(h);
      }
      if (opt.subOctave && n.midi >= 45) {      // sólo si está "solo": una octava doble dentro de un acorde de la izquierda es real
        let up = false, below = false;
        for (let j = i - 1; j >= 0 && n.start - ns[j].start <= 0.05; j--) { if (ns[j].midi === n.midi + 12 && n.velocity <= 1.05 * ns[j].velocity) up = true; if (ns[j].midi !== n.midi + 12 && Math.abs(ns[j].midi - n.midi) <= 12) below = true; }
        for (let j = i + 1; j < ns.length && ns[j].start - n.start <= 0.05; j++) { if (ns[j].midi === n.midi + 12 && n.velocity <= 1.05 * ns[j].velocity) up = true; if (ns[j].midi !== n.midi + 12 && Math.abs(ns[j].midi - n.midi) <= 12) below = true; }
        if (up && !below) drop.add(n);
      }
    }
    stats.ghosts = drop.size;
    ns = ns.filter((n) => !drop.has(n));
  }
  // 4) acordes arpegiados: las notas con inicio casi igual pasan a empezar juntas
  if (opt.chordRoll > 0) {
    let i = 0;
    while (i < ns.length) {
      let j = i + 1;
      while (j < ns.length && ns[j].start - ns[i].start <= opt.chordRoll) j++;
      if (j - i > 1) {
        let s = 0; for (let k = i; k < j; k++) s += ns[k].start;
        const m = s / (j - i);
        for (let k = i; k < j; k++) ns[k].start = Math.min(m, ns[k].end - 0.02);
      }
      i = j;
    }
    ns.sort((a, b) => a.start - b.start || a.midi - b.midi);
  }
  // 5) polifonía máxima por instante
  if (opt.maxPoly > 0) {
    const active = [];
    const dropP = new Set();
    for (const n of ns) {
      for (let k = active.length - 1; k >= 0; k--) if (active[k].end <= n.start + EPS) active.splice(k, 1);
      active.push(n);
      if (active.length > opt.maxPoly) {
        let w = 0;
        for (let k = 1; k < active.length; k++) if (active[k].velocity < active[w].velocity) w = k;
        dropP.add(active[w]); active.splice(w, 1);
      }
    }
    stats.poly = dropP.size;
    ns = ns.filter((n) => !dropP.has(n));
  }
  ns.stats = stats;
  return ns;
}

/* ================================================================== 3. tempo */

/** Une ataques casi simultáneos (<60 ms: manos que no tocan exactamente a la vez) en "instantes" con peso. */
export function onsetClusters(notes, win = 0.06) {
  const ns = notes.slice().sort((a, b) => a.start - b.start);
  const out = [];
  for (const n of ns) {
    const c = out[out.length - 1];
    if (c && n.start - c.t0 <= win) {
      c.w += n.velocity; c.dur = Math.max(c.dur, n.end - n.start); c.low = Math.min(c.low, n.midi); c.vmax = Math.max(c.vmax, n.velocity);
      c.n++; c.sum += n.start;
      c.t = c.sum / c.n;
    } else out.push({ t0: n.start, t: n.start, sum: n.start, n: 1, w: n.velocity, vmax: n.velocity, dur: n.end - n.start, low: n.midi });
  }
  return out;
}

function coherence(cl, period) {              // |Σ w e^{2πi t/period}| / Σ w, y la fase
  let re = 0, im = 0, sw = 0;
  const k = (2 * Math.PI) / period;
  for (const c of cl) { re += c.w * Math.cos(k * c.t); im += c.w * Math.sin(k * c.t); sw += c.w; }
  return { r: sw > 0 ? Math.hypot(re, im) / sw : 0, phase: Math.atan2(im, re) };
}

/**
 * Estima la corchea (E, segundos) y su fase. Elige el pulso por autocorrelación de ataques (con prior hacia ~100 bpm),
 * decide si la subdivisión es binaria o ternaria y afina por coherencia de fase.
 * @returns {{E:number, t0:number, bpm:number, confidence:number, triple:boolean, pulse:number, given:boolean}}
 */
export function estimateTempo(notes, o = {}) {
  const cl = onsetClusters(notes);
  const minBpm = o.minBpm ?? 45, maxBpm = o.maxBpm ?? 200;
  const out = { E: 0.3, t0: cl.length ? cl[0].t : 0, bpm: 100, confidence: 0, triple: false, pulse: 0.6, given: false };
  if (cl.length < 2) return out;
  const given = Number(o.bpm) > 0;
  let P0;
  if (given) {
    P0 = 60 / clamp(Number(o.bpm), 20, 300); out.given = true;
  } else {
    // envolvente de ataques a 10 ms y su autocorrelación
    const step = 0.01, T = cl[cl.length - 1].t + 0.2;
    const n = Math.ceil(T / step) + 2;
    const env = new Float32Array(n);
    const sig = 2;                                         // σ = 20 ms
    for (const c of cl) {
      const b = Math.round(c.t / step);
      for (let d = -3 * sig; d <= 3 * sig; d++) { const i = b + d; if (i >= 0 && i < n) env[i] += c.w * Math.exp(-0.5 * (d / sig) ** 2); }
    }
    const maxLag = Math.min(n - 1, Math.round(4.2 / step));
    const acf = new Float32Array(maxLag + 2);
    let e0 = 0; for (let i = 0; i < n; i++) e0 += env[i] * env[i];
    for (let l = 1; l <= maxLag; l++) { let s = 0; for (let i = 0; i + l < n; i++) s += env[i] * env[i + l]; acf[l] = s / (e0 || 1); }
    const at = (sec) => { const x = sec / step, i = Math.floor(x), f = x - i; if (i < 1 || i >= maxLag) return 0; return acf[i] * (1 - f) + acf[i + 1] * f; };
    let best = -1, bestP = 0.6;
    for (let bpm = minBpm; bpm <= maxBpm; bpm *= 1.01) {
      const P = 60 / bpm;
      const prior = Math.exp(-0.5 * (Math.log2(bpm / 100) / 0.8) ** 2);
      const s = (at(P) + 0.5 * at(2 * P) + 0.25 * at(3 * P)) * prior;
      if (s > best) { best = s; bestP = P; }
    }
    P0 = bestP;
    // octava de tempo: si la mitad del pulso sigue siendo un tempo razonable (≤170) y la mayoría de los intervalos entre ataques
    // ya mide esa mitad, el pulso real es el más rápido (si no, todo se escribiría en corcheas)
    const P2 = P0 / 2;
    if (60 / P2 <= 170 && cl.length >= 6) {
      let hit = 0, tot = 0;
      for (let i = 1; i < cl.length; i++) { const d = cl[i].t - cl[i - 1].t; if (d < P0 * 1.6) { tot++; if (Math.abs(d - P2) <= 0.25 * P2) hit++; } }
      if (tot >= 4 && hit / tot >= 0.5) P0 = P2;
    }
  }
  // afinar P0 por coherencia (±6 %), salvo que el usuario haya dado el tempo
  let P = P0;
  if (!given) {
    let bestR = -1;
    for (let r = 0.94; r <= 1.0601; r += 0.001) { const c = coherence(cl, P0 * r); if (c.r > bestR + 1e-9) { bestR = c.r; P = P0 * r; } }
  }
  // ¿subdivisión binaria o ternaria?
  const R2 = coherence(cl, P / 2).r, R3 = coherence(cl, P / 3).r;
  let triple = false;
  if (!given && R3 > 1.25 * R2 && R3 > 0.45) triple = true;
  if (given && o.timeSig && o.timeSig[1] === 8 && o.timeSig[0] % 3 === 0) triple = false;
  let E = given ? P / 2 : (triple ? P / 3 : P / 2);
  if (!given) {                                           // afinar E (±3 %)
    let bestR = -1, bE = E;
    for (let r = 0.97; r <= 1.0301; r += 0.0005) { const c = coherence(cl, E * r); if (c.r > bestR + 1e-9) { bestR = c.r; bE = E * r; } }
    E = bE;
  }
  const ce = coherence(cl, E);
  const t0 = mod((ce.phase / (2 * Math.PI)) * E, E);
  // con pocas notas la coherencia es optimista: se castiga
  const sizeFactor = clamp(cl.length / 12, 0.2, 1);
  return { E, t0, bpm: clamp(30 / E, 20, 300), confidence: clamp(ce.r * sizeFactor, 0, 1), triple, pulse: P, given };
}

/**
 * Seguimiento de pulso (rubato leve): lazo de fase sobre la grilla de semicorcheas.
 * Devuelve warp(t) = desplazamiento (s) de la grilla en el instante t.
 */
export function trackWarp(notes, tempo, o = {}) {
  const alpha = o.alpha ?? 0.25;
  const cl = onsetClusters(notes);
  const q = tempo.E / 2;
  const ts = [], offs = [];
  let off = 0;
  for (const c of cl) {
    const x = (c.t - off - tempo.t0) / q;
    const res = (x - Math.round(x)) * q;                  // residuo contra la grilla de semicorcheas
    if (Math.abs(res) < q * 0.45) off += alpha * res * Math.min(1, 0.5 + c.w);
    ts.push(c.t); offs.push(off);
  }
  if (!ts.length || o.track === false) return () => 0;
  return (t) => {
    if (t <= ts[0]) return offs[0];
    if (t >= ts[ts.length - 1]) return offs[offs.length - 1];
    let lo = 0, hi = ts.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ts[m] <= t) lo = m; else hi = m; }
    const f = (t - ts[lo]) / (ts[hi] - ts[lo] || 1);
    return offs[lo] * (1 - f) + offs[hi] * f;
  };
}

/* ================================================================== 4. compás */

const W_SIMPLE = { 4: [1, 0.35, 0.7, 0.35], 3: [1, 0.5, 0.5], 2: [1, 0.4], 5: [1, 0.3, 0.6, 0.3, 0.5], 6: [1, 0.3, 0.3, 0.8, 0.3, 0.3] };
const barEighths = (ts) => (ts[0] * 8) / ts[1];

/**
 * Tamaño del efecto de acento para N tiempos por compás: cuánto más fuerte es el tiempo 1 que el resto, en desvíos estándar de la fuerza
 * de los tiempos. Devuelve el mejor desfase (con una pequeña preferencia por que la primera nota sea el tiempo 1).
 */
function accentEffect(beats, N, firstBeat) {
  const vals = beats.vals, b0 = beats.b0;
  const n = vals.length;
  const mean = vals.reduce((a, b) => a + b, 0) / (n || 1);
  const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / (n || 1));
  let best = null;
  for (let o = 0; o < N; o++) {
    let sa = 0, na = 0, sb = 0, nb = 0;
    for (let i = 0; i < n; i++) { if (mod(b0 + i - o, N) === 0) { sa += vals[i]; na++; } else { sb += vals[i]; nb++; } }
    if (!na || !nb || sa / na < sb / nb) continue;          // el tiempo 1 tiene que ser el MÁS fuerte
    const e = (sa / na - sb / nb) / (sd + 0.15 * mean + 1e-9);
    const r2 = sd > 1e-9 ? ((na * nb) / (n * n)) * ((sa / na - sb / nb) ** 2) / (sd * sd) : 0;   // varianza explicada por "tiempo 1 vs resto"
    const sc = r2 + (mod(firstBeat - o, N) === 0 ? 0.2 : 0);
    if (!best || sc > best.score + 1e-9) best = { o, e, r2, score: sc };
  }
  return best || { o: mod(firstBeat, N), e: 0, score: 0 };
}

/**
 * Elige compás y desfase del primer compás a partir de los ataques sobre la grilla de corcheas.
 * Binario (4/4, 3/4) por contraste de acento entre tiempos; 6/8 si los ataques se agrupan de a tres corcheas.
 * @returns {{timeSig:number[], B:number, offset:number, first:number, scores:object}} offset: corchea (mod B) donde empieza un compás
 */
export function chooseMeter(clusters, E, t0, warp, o = {}) {
  const byX = new Map();                                  // manos que no tocan a la vez (±40 ms) caen en la misma corchea
  for (const c of clusters) {
    const x = (c.t - warp(c.t) - t0) / E;
    const r = Math.round(x);
    if (Math.abs(x - r) > 0.25) continue;
    const cur = byX.get(r) || { vmax: 0, dur: 0, low: 200, n: 0 };
    cur.vmax = Math.max(cur.vmax, c.vmax); cur.dur = Math.max(cur.dur, c.dur); cur.low = Math.min(cur.low, c.low); cur.n += c.n;
    byX.set(r, cur);
  }
  const pts = [...byX.entries()].sort((a, b) => a[0] - b[0]).map(([x, c]) => ({
    x, s: c.vmax * (0.7 + 0.3 * Math.min(c.dur / (2 * E), 2)) * (c.low < 45 ? 1.6 : 1),
  }));
  const first = pts.length ? pts[0].x : 0;
  const forced = Array.isArray(o.timeSig) && o.timeSig.length === 2 ? o.timeSig : null;
  const total = pts.reduce((a, p) => a + p.s, 0) || 1;
  const scores = {};

  // --- compuesto (6/8): grupos de 3 corcheas
  const groupShare = [0, 0, 0];
  for (const p of pts) groupShare[mod(p.x, 3)] += p.s;
  let rg = 0; for (let r = 1; r < 3; r++) if (groupShare[r] > groupShare[rg]) rg = r;
  const share = groupShare[rg] / total;
  scores['6/8'] = share;
  const compoundWanted = forced ? (forced[1] === 8 && forced[0] % 3 === 0) : (o.triple || (share >= 0.62 && pts.length >= 12));
  const compound = () => {
    const nG = forced ? forced[0] / 3 : 2;
    const grp = new Float64Array(nG);
    for (const p of pts) if (mod(p.x - rg, 3) === 0) grp[mod(Math.round((p.x - rg) / 3), nG)] += p.s;
    let bo = 0, bs = -Infinity;
    for (let g = 0; g < nG; g++) {
      let sc = grp[g] / total;
      if (mod(Math.round((first - rg) / 3) - g, nG) === 0 && mod(first - rg, 3) === 0) sc += 0.2;
      if (sc > bs) { bs = sc; bo = g; }
    }
    const ts = forced || [6, 8];
    return { timeSig: ts, B: nG * 3, offset: mod(rg + 3 * bo, nG * 3), first, scores };
  };
  if (compoundWanted && (!forced || (forced[1] === 8 && forced[0] % 3 === 0))) return compound();

  // --- simple: pulso = corchea par/impar con más peso; 3 ó 4 (o los tiempos pedidos) por compás
  const par = [0, 0];
  for (const p of pts) par[mod(p.x, 2)] += p.s;
  let pi = par[1] > par[0] * 1.1 ? 1 : par[0] > par[1] * 1.1 ? 0 : mod(first, 2);
  const onBeat = pts.filter((p) => mod(p.x - pi, 2) === 0);
  const beatOf = (p) => (p.x - pi) / 2;
  const firstBeat = onBeat.length ? beatOf(onBeat[0]) : 0;
  const bs = onBeat.map(beatOf);
  const b0 = bs.length ? Math.min(...bs) : 0, b1 = bs.length ? Math.max(...bs) : 0;
  const vals = new Array(Math.max(1, b1 - b0 + 1)).fill(0);
  for (const p of onBeat) vals[beatOf(p) - b0] += p.s;
  const beats = { vals, b0 };
  let pick = null;
  if (forced) {
    const N = forced[1] === 4 || forced[1] === 2 ? forced[0] : 0;
    if (N >= 2) pick = { N, r: accentEffect(beats, N, firstBeat) };
  } else {
    const r4 = accentEffect(beats, 4, firstBeat), r3 = accentEffect(beats, 3, firstBeat);
    scores['4/4'] = r4.r2; scores['3/4'] = r3.r2;
    pick = r3.r2 > r4.r2 + 0.12 && r3.r2 > 0.25 ? { N: 3, r: r3 } : { N: 4, r: r4 };
    pick.ambiguous = Math.abs(r3.r2 - r4.r2) < 0.05 && Math.max(r3.r2, r4.r2) > 0.2;
  }
  if (!pick) {                                            // compás pedido sin plantilla: bar de ts[0]/ts[1], desfase por la primera nota
    const ts = forced || [4, 4];
    const B = barEighths(ts);
    return { timeSig: ts, B, offset: mod(first, B), first, scores };
  }
  const ts = forced || (pick.N === 4 ? [4, 4] : [3, 4]);
  const B = barEighths(ts);
  return { timeSig: ts, B, offset: mod(pi + 2 * pick.r.o, B), first, scores, ambiguous: !!pick.ambiguous };
}

/* ================================================================== 5. melodía y manos */

/**
 * Línea melódica saliente: para cada instante de ataque elige una nota (Viterbi) priorizando la más aguda y fuerte,
 * penalizando los saltos grandes. Devuelve las notas elegidas.
 */
export function extractMelody(notes, o = {}) {
  const lo = o.lo ?? 45, hi = o.hi ?? 100;
  const ns = notes.filter((n) => n.midi >= lo && n.midi <= hi).sort((a, b) => a.start - b.start || b.midi - a.midi);
  if (!ns.length) return [];
  const groups = [];
  for (const n of ns) {
    const g = groups[groups.length - 1];
    if (g && n.start - g.t <= 0.07) g.c.push(n); else groups.push({ t: n.start, c: [n] });
  }
  // un grupo cuyas notas están todas por debajo de una nota más aguda que sigue sonando no es un ataque de la melodía
  let from = 0;
  for (const g of groups) {
    const top = Math.max(...g.c.map((x) => x.midi));
    while (from < ns.length && ns[from].start < g.t - 6) from++;
    g.masked = false;
    for (let k = from; k < ns.length && ns[k].start < g.t - 0.04; k++) {
      if (ns[k].end > g.t + 0.1 && ns[k].midi > top) { g.masked = true; break; }
    }
  }
  const live = groups.filter((g) => !g.masked);
  if (live.length) { groups.length = 0; groups.push(...live); }
  const maxV = Math.max(...ns.map((n) => n.velocity)) || 1;
  const score = (n, g) => {
    const top = Math.max(...g.c.map((x) => x.midi));
    return n.velocity / maxV + (n.midi === top ? 0.35 : 0) + 0.004 * clamp(n.midi - 60, -12, 24);
  };
  const dp = groups.map(() => []);
  groups.forEach((g, gi) => {
    g.c.forEach((n, ci) => {
      const own = score(n, g);
      if (gi === 0) { dp[gi][ci] = { s: own, from: -1 }; return; }
      let bs = -Infinity, bf = 0;
      groups[gi - 1].c.forEach((pn, pi) => {
        const s = dp[gi - 1][pi].s - 0.025 * Math.min(Math.abs(n.midi - pn.midi), 14);
        if (s > bs) { bs = s; bf = pi; }
      });
      dp[gi][ci] = { s: bs + own, from: bf };
    });
  });
  let ci = 0;
  const last = dp[groups.length - 1];
  for (let i = 1; i < last.length; i++) if (last[i].s > last[ci].s) ci = i;
  const out = [];
  for (let gi = groups.length - 1; gi >= 0; gi--) { out.push(groups[gi].c[ci]); ci = dp[gi][ci].from; }
  out.reverse();
  // dos "ataques de melodía" a menos de 90 ms: uno es el otro lado del mismo golpe (manos desparejas); queda el más agudo
  const res = [];
  for (const n of out) {
    const last = res[res.length - 1];
    if (last && n.start - last.start < 0.09) { if (n.midi > last.midi) res[res.length - 1] = n; } else res.push(n);
  }
  return res;
}

/**
 * Separa en mano derecha / izquierda. mode "melodia": sólo la línea saliente a la derecha. "dos-manos": punto de división adaptable
 * (percentil bajo de la melodía en una ventana ±6 s menos una cuarta, acotado a [50, 66]); la nota más aguda de cada instante va siempre a la derecha.
 */
export function separateHands(notes, o = {}) {
  const mode = o.mode === 'melodia' ? 'melodia' : 'dos-manos';
  const melody = extractMelody(notes);
  if (mode === 'melodia') return { rh: melody, lh: [], melody, splits: [] };
  const mset = new Set(melody);
  const mt = melody.map((n) => n.start);
  const splitAt = (t) => {
    const ps = [];
    for (let i = 0; i < melody.length; i++) if (Math.abs(mt[i] - t) <= 6) ps.push(melody[i].midi);
    if (!ps.length) return 60;
    return clamp(percentile(ps, 0.1) - 5, 50, 66);
  };
  const rh = [], lh = [], splits = [];
  let cacheT = -1e9, cacheS = 60;
  for (const n of notes) {
    if (Math.abs(n.start - cacheT) > 1) { cacheT = n.start; cacheS = splitAt(n.start); splits.push(cacheS); }
    if (mset.has(n) || n.midi > cacheS) rh.push(n); else lh.push(n);
  }
  return { rh, lh, melody, splits };
}

/* ================================================================== 6. tonalidad y ortografía */

const KS_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KS_MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
const MAJOR_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const MINOR_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'Bb', 'B'];
const FIFTHS_MAJOR = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5 };
const FIFTHS_MINOR = { A: 0, E: 1, B: 2, 'F#': 3, 'C#': 4, 'G#': 5, 'D#': 6, D: -1, G: -2, C: -3, F: -4, Bb: -5 };

/** Perfil de Krumhansl sobre duración×fuerza por clase de altura. */
export function detectKey(notes) {
  const pc = new Float64Array(12);
  for (const n of notes) pc[mod(n.midi, 12)] += Math.min(n.end - n.start, 2) * (0.3 + n.velocity);
  const tot = pc.reduce((a, b) => a + b, 0);
  if (tot <= 0) return { keySig: 'C', fifths: 0, minor: false, confidence: 0 };
  const corr = (prof, tonic) => {
    const x = Array.from({ length: 12 }, (_, i) => pc[mod(i + tonic, 12)]);
    const mx = x.reduce((a, b) => a + b, 0) / 12, my = prof.reduce((a, b) => a + b, 0) / 12;
    let sxy = 0, sxx = 0, syy = 0;
    for (let i = 0; i < 12; i++) { sxy += (x[i] - mx) * (prof[i] - my); sxx += (x[i] - mx) ** 2; syy += (prof[i] - my) ** 2; }
    return sxy / (Math.sqrt(sxx * syy) || 1);
  };
  const all = [];
  for (let t = 0; t < 12; t++) { all.push({ t, minor: false, r: corr(KS_MAJOR, t) }); all.push({ t, minor: true, r: corr(KS_MINOR, t) }); }
  all.sort((a, b) => b.r - a.r);
  const b = all[0];
  const name = (b.minor ? MINOR_NAMES : MAJOR_NAMES)[b.t];
  const fifths = (b.minor ? FIFTHS_MINOR : FIFTHS_MAJOR)[name] ?? 0;
  return { keySig: name + (b.minor ? 'm' : ''), fifths, minor: b.minor, tonic: b.t, confidence: clamp(b.r - all[1].r, 0, 1), r: b.r };
}

const SHARP_N = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
const FLAT_N = ['c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b'];
const C_MAJ_N = ['c', 'c#', 'd', 'eb', 'e', 'f', 'f#', 'g', 'ab', 'a', 'bb', 'b'];
const A_MIN_N = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'bb', 'b'];

/** 61 en "Eb mayor" → "db/4" (ortografía según la armadura). */
export function spell(midi, key) {
  const f = key ? key.fifths : 0;
  const names = f === 0 ? (key && key.minor ? A_MIN_N : C_MAJ_N) : f < 0 ? FLAT_N : SHARP_N;
  return names[mod(midi, 12)] + '/' + (Math.floor(midi / 12) - 1);
}

/* ================================================================== 7. cuantización y compases */

// formas legales en unidades de semicorchea
const SHAPES = [
  { u: 16, d: 'w', dots: 0, base: 16 }, { u: 14, d: 'h', dots: 2, base: 8 }, { u: 12, d: 'h', dots: 1, base: 8 }, { u: 8, d: 'h', dots: 0, base: 8 },
  { u: 7, d: 'q', dots: 2, base: 4 }, { u: 6, d: 'q', dots: 1, base: 4 }, { u: 4, d: 'q', dots: 0, base: 4 },
  { u: 3, d: '8', dots: 1, base: 2 }, { u: 2, d: '8', dots: 0, base: 2 }, { u: 1, d: '16', dots: 0, base: 1 },
];

function shapeAllowed(sh, p, bar, compound) {
  const end = p + sh.u;
  if (end > bar) return false;
  if (compound) {                                          // 6/8: grupos de 6 semicorcheas... (3 corcheas = 6 unidades)
    const G = 6;
    if (sh.u === 12 || sh.u === 6) return p % G === 0;
    if (sh.u === 8 || sh.u === 7 || sh.u === 14 || sh.u === 16) return false;
    if (sh.base >= 4) return p % 2 === 0 && Math.floor(p / G) === Math.floor((end - 1) / G);
    return p % sh.base === 0 && (sh.dots ? true : true) && (Math.floor(p / G) === Math.floor((end - 1) / G) || p % G === 0);
  }
  if (sh.dots === 2) return false;                         // doble puntillo: no se usa
  if (sh.base < 4) return p % sh.base === 0;
  if (sh.base === 4) return p % 4 === 0;
  // blanca/redonda: alineadas a negra y sin cruzar la mitad del compás de 4/4
  if (p % 4 !== 0) return false;
  if (bar === 16 && p !== 0 && p < 8 && end > 8) return false;
  return true;
}

const splitCache = new Map();
/** Descompone una duración en formas legales según la posición dentro del compás (mínimo de piezas). */
export function splitSpan(p, len, bar, compound = false) {
  const key = `${p}|${len}|${bar}|${compound ? 1 : 0}`;
  if (splitCache.has(key)) return splitCache.get(key);
  const memo = new Map();
  const solve = (pos) => {
    if (pos >= p + len) return { cost: 0, seq: [] };
    if (memo.has(pos)) return memo.get(pos);
    let best = null;
    for (const sh of SHAPES) {
      if (pos + sh.u > p + len || !shapeAllowed(sh, pos, bar, compound)) continue;
      const r = solve(pos + sh.u);
      if (!r) continue;
      const cost = r.cost + 1 + (sh.dots ? 0.01 : 0);
      if (!best || cost < best.cost - 1e-9) best = { cost, seq: [sh, ...r.seq] };
    }
    memo.set(pos, best);
    return best;
  };
  let r = solve(p);
  if (!r) { r = { seq: [] }; for (let i = 0; i < len; i++) r.seq.push(SHAPES[SHAPES.length - 1]); }
  if (splitCache.size > 5000) splitCache.clear();
  splitCache.set(key, r.seq);
  return r.seq;
}

/**
 * Convierte una mano (segmentos {s,e,keys[]} en unidades de semicorchea; keys vacío = silencio) en compases.
 * Cada compás suma exacto; lo que cruza la barra se liga.
 */
export function segmentsToMeasures(segs, bar, nMeasures, compound = false) {
  const res = Array.from({ length: nMeasures }, () => []);
  // línea sin huecos
  const line = [];
  let cur = 0;
  for (const sg of segs) {
    if (sg.s > cur) line.push({ s: cur, e: sg.s, keys: [] });
    if (sg.e > sg.s) line.push(sg);
    cur = Math.max(cur, sg.e);
  }
  const total = nMeasures * bar;
  if (cur < total) line.push({ s: cur, e: total, keys: [] });
  for (const sg of line) {
    let s = sg.s, first = true;
    while (s < sg.e) {
      const mi = Math.floor(s / bar);
      if (mi >= nMeasures) break;
      const e = Math.min(sg.e, (mi + 1) * bar);
      const seq = splitSpan(s - mi * bar, e - s, bar, compound);
      seq.forEach((sh, idx) => {
        const ev = { k: sg.keys.slice(), d: sh.d };
        if (sh.dots) ev.dots = sh.dots;
        if (sg.keys.length && !(first && idx === 0)) ev.tie = true;
        res[mi].push(ev);
      });
      first = false;
      s = e;
    }
  }
  return res;
}

/** Notas (s) → unidades de semicorchea relativas al inicio del primer compás. */
export function quantizeNotes(notes, grid) {
  const { E, t0, warp, xb, gu } = grid;
  const toU = (t) => (2 * ((t - warp(t) - t0) / E - xb));
  return notes.map((n) => {
    let s = Math.round(toU(n.start) / gu) * gu;
    let e = Math.round(toU(n.end) / gu) * gu;
    if (s < 0) s = 0;
    if (e < s + gu) e = s + gu;
    return { s, e, midi: n.midi, vel: n.velocity };
  });
}

/**
 * Agrupa por inicio y arma segmentos de una mano: cada acorde dura hasta el siguiente ataque de esa mano;
 * si la nota terminó bastante antes (más que `fill` unidades) queda un silencio.
 */
export function handSegments(qn, o = {}) {
  const fill = o.fill ?? 2, gu = o.gu ?? 1;
  const by = new Map();
  for (const n of qn) { if (!by.has(n.s)) by.set(n.s, []); by.get(n.s).push(n); }
  const starts = [...by.keys()].sort((a, b) => a - b);
  const segs = [];
  starts.forEach((s, i) => {
    const grp = by.get(s);
    const ends = grp.map((n) => n.e).sort((a, b) => a - b);
    const medEnd = ends[Math.floor(ends.length / 2)];
    const next = i + 1 < starts.length ? starts[i + 1] : Infinity;
    let e = Math.min(medEnd, next);
    if (next !== Infinity && next - e <= Math.max(fill, gu)) e = next;
    if (e < s + gu) e = s + gu;
    const midis = [...new Set(grp.map((n) => n.midi))].sort((a, b) => a - b);
    segs.push({ s, e, midis, vel: Math.max(...grp.map((n) => n.vel)) });
  });
  return segs;
}

/** Que sea tocable: máx. notas por mano, extensión máxima del acorde y sin saltos imposibles (plegando octavas). */
export function simplifySegments(segs, hand, o = {}) {
  const maxNotes = o.maxNotes ?? (hand === 'rh' ? 3 : 3);
  const maxSpan = o.maxSpan ?? 12;
  let changed = 0;
  const out = segs.map((sg) => {
    let m = sg.midis.slice();
    const before = m.length;
    while (m.length > maxNotes || (m.length > 1 && m[m.length - 1] - m[0] > maxSpan)) {
      // quitar la interior más cercana a otra; si no hay interiores, la extrema menos importante
      if (m.length > 2) {
        let w = 1, bd = Infinity;
        for (let i = 1; i < m.length - 1; i++) { const d = Math.min(m[i] - m[i - 1], m[i + 1] - m[i]); if (d < bd) { bd = d; w = i; } }
        m.splice(w, 1);
      } else m = hand === 'rh' ? [m[1]] : [m[0]];
    }
    if (m.length !== before) changed++;
    return { ...sg, midis: m };
  });
  let leaps = 0;
  for (let i = 1; i < out.length; i++) {          // saltos de más de dos octavas en menos de una negra: plegar por octavas
    const a = out[i - 1], b = out[i];
    if (b.s - a.s > 4 || !a.midis.length || !b.midis.length) continue;
    const ref = hand === 'rh' ? a.midis[a.midis.length - 1] : a.midis[0];
    const cur = hand === 'rh' ? b.midis[b.midis.length - 1] : b.midis[0];
    let sh = 0;
    while (Math.abs(cur + sh - ref) > 19 && Math.abs(sh) < 36) sh += cur > ref ? -12 : 12;
    if (sh) { b.midis = b.midis.map((x) => x + sh); leaps++; }
  }
  out.simplified = changed; out.folded = leaps;
  return out;
}

/* ================================================================== 8. de notas a Score */

const quantile = (a, q) => percentile(a, q);

/**
 * Notas crudas → Score. Etapas visibles en `info.stages`.
 * opts: {bpm, timeSig:[n,d], mode:'melodia'|'dos-manos', grid:'auto'|'16'|'8', simplify, title, maxPoly, track, keySig}
 */
export function notesToScore(rawNotes, opts = {}) {
  const warnings = [];
  const mode = opts.mode === 'melodia' ? 'melodia' : 'dos-manos';
  const notes = cleanNotes(rawNotes, { maxPoly: opts.maxPoly ?? 10, ...(opts.clean || {}) });
  const cstats = notes.stats;
  const info = { seconds: 0, bpm: opts.bpm || 100, bpmConfidence: 0, key: 'C', noteCount: 0, warnings, timeSig: [4, 4], pickupBeats: 0, grid: '16', mode, measures: 0, stages: { clean: cstats } };
  if (!notes.length) {
    warnings.push('No se detectaron notas en el audio: probá con un volumen mayor o más cerca del instrumento.');
    const r = validateScore({ id: opts.id, title: opts.title || 'Transcripción', bpm: info.bpm, timeSig: [4, 4], keySig: 'C', measures: [{ rh: [{ k: [], d: 'w' }], lh: [{ k: [], d: 'w' }] }], origin: 'ia' });
    return { score: r.score, info };
  }
  info.seconds = Math.max(...notes.map((n) => n.end)) - Math.min(...notes.map((n) => n.start));

  // --- tempo
  let timeSigIn = Array.isArray(opts.timeSig) && opts.timeSig.length === 2 ? opts.timeSig.map(Number) : null;
  const tempo = estimateTempo(notes, { bpm: opts.bpm, timeSig: timeSigIn });
  info.bpm = Math.round(tempo.bpm * 10) / 10;
  info.bpmConfidence = Math.round(tempo.confidence * 100) / 100;
  if (!tempo.given && (tempo.confidence < 0.55 || notes.length < 8)) warnings.push('Tempo dudoso: el pulso no es claro. Si conocés el tempo, indicalo y volvé a transcribir.');
  const warp = trackWarp(notes, tempo, { track: opts.track });
  const clusters = onsetClusters(notes);
  info.stages.tempo = tempo;

  // --- compás
  const meter = chooseMeter(clusters, tempo.E, tempo.t0, warp, { triple: tempo.triple, timeSig: timeSigIn });
  const ts = meter.timeSig;
  info.stages.meter = { scores: meter.scores, offset: meter.offset, first: meter.first };
  const bar = barEighths(ts) * 2;                           // semicorcheas por compás
  const compound = ts[1] === 8 && ts[0] % 3 === 0;
  info.timeSig = ts;
  const xb = meter.first - mod(meter.first - meter.offset, meter.B);   // corchea (entera) del inicio del primer compás
  const firstPos = (meter.first - xb) / 2;                 // negras desde el inicio del compás hasta la primera nota
  const barBeatsQ = (ts[0] * 4) / ts[1];
  if (firstPos > 0.49 && firstPos >= barBeatsQ / 2 - 1e-6) info.pickupBeats = Math.round((barBeatsQ - firstPos) * 100) / 100;
  if (meter.ambiguous && !timeSigIn) warnings.push('Compás dudoso: 3/4 y 4/4 puntúan parecido; si no es el correcto, indicá el compás y volvé a transcribir.');

  // --- grilla: semicorchea o corchea
  const q16 = (t) => 2 * ((t - warp(t) - tempo.t0) / tempo.E);
  let odd = 0, tot = 0, res2 = 0;
  for (const c of clusters) { const x = q16(c.t); tot += c.w; if (Math.abs(mod(x, 2) - 1) < 0.5) odd += c.w; res2 += c.w * (x - Math.round(x)) ** 2; }
  const rms = Math.sqrt(res2 / (tot || 1));
  let gu = 1;
  if (opts.grid === '8' || (opts.grid !== '16' && tot > 0 && odd / tot < 0.06)) gu = 2;
  info.grid = gu === 2 ? '8' : '16';
  if (rms > 0.3 && !tempo.given) warnings.push('Ritmo irregular: muchas notas caen lejos de la grilla; la cuantización puede ser imprecisa.');

  // --- tonalidad
  const key = opts.keySig ? { keySig: opts.keySig, fifths: 0, minor: /m$/.test(opts.keySig) } : detectKey(notes);
  if (opts.keySig) {
    const nm = opts.keySig.replace(/m$/, '');
    key.fifths = (key.minor ? FIFTHS_MINOR : FIFTHS_MAJOR)[nm] ?? 0;
  } else if (key.confidence < 0.04) warnings.push('Tonalidad dudosa: las alteraciones pueden estar mal escritas.');
  info.key = key.keySig;

  // --- manos
  const sep = separateHands(notes, { mode });
  const grid = { E: tempo.E, t0: tempo.t0, warp, xb, gu };
  const doSimplify = opts.simplify === true;
  const hands = {};
  let simp = 0, fold = 0;
  for (const h of ['rh', 'lh']) {
    const hn = h === 'rh' ? sep.rh : sep.lh;
    let segs = handSegments(quantizeNotes(hn, grid), { gu });
    if (doSimplify) { segs = simplifySegments(segs, h, opts.simplifyOpts || {}); simp += segs.simplified; fold += segs.folded; }
    hands[h] = segs.map((sg) => ({ s: sg.s, e: sg.e, keys: sg.midis.map((m) => spell(m, key)) }));
  }
  info.stages.simplified = { chords: simp, octaveFolds: fold };
  if (doSimplify && (simp || fold)) warnings.push(`Se simplificó para que sea tocable: ${simp} acordes reducidos y ${fold} saltos plegados.`);
  const lastU = Math.max(1, ...['rh', 'lh'].map((h) => Math.max(0, ...hands[h].map((sg) => sg.e))));
  const nMeasures = Math.max(1, Math.ceil(lastU / bar));
  const measures = Array.from({ length: nMeasures }, () => ({ rh: [], lh: [] }));
  for (const h of ['rh', 'lh']) {
    const ms = segmentsToMeasures(hands[h], bar, nMeasures, compound);
    ms.forEach((evs, i) => { measures[i][h] = evs; });
  }
  info.measures = nMeasures;
  info.noteCount = (mode === 'melodia' ? sep.rh.length : notes.length);

  // --- avisos de calidad
  const short = notes.filter((n) => n.end - n.start < 0.12).length;
  if (notes.length > 40 && short / notes.length > 0.4) warnings.push('Audio con mucha percusión o ruido: la transcripción puede tener notas de más.');
  const low = notes.filter((n) => n.midi < 36).length;
  if (low / notes.length > 0.15) warnings.push('Hay muchas notas muy graves: los graves suelen transcribirse peor.');
  if (mode === 'dos-manos' && notes.length > 60 && quantile(notes.map((n) => n.end - n.start), 0.5) < 0.1) warnings.push('Las notas son muy cortas: puede ser una canción con batería; probá el modo "sólo melodía".');

  const raw = {
    id: opts.id, title: opts.title || 'Transcripción', bpm: Math.round(tempo.bpm), timeSig: ts, keySig: key.keySig,
    origin: 'ia', measures,
  };
  const v = validateScore(raw);
  v.errors.forEach((e) => warnings.push('Validación: ' + e));
  if (!v.ok) warnings.push('La partitura resultante no tiene notas tocables.');
  return { score: v.score, info };
}

/** Suma en negras de una lista de eventos (para tests y chequeos). */
export function handBeats(evs) {
  const B = { w: 4, h: 2, q: 1, '8': 0.5, '16': 0.25, '32': 0.125 };
  return evs.reduce((a, e) => a + B[e.d] * (e.dots === 2 ? 1.75 : e.dots === 1 ? 1.5 : 1), 0);
}
