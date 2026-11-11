// Detección de notas de piano por micrófono. Núcleo PURO (sin DOM ni WebAudio): seguro de importar en Node.
// Pipeline: PCM → detector de ataques (flujo espectral) → asentamiento → espectro NUEVO (actual − previo)
// → saliencia por nota (armónicos) con cancelación iterativa → decisión guiada por las notas esperadas.

export const MIDI_LO = 21;
export const MIDI_HI = 108;
export const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12);

const BIG_N = 8192;       // ventana de análisis de altura
const ONSET_N = 2048;     // ventana del detector de ataques
const ONSET_HOP = 512;
const PRE_GAP = 2560;
const REATTACK_RATIO = 1.35;
const OCTAVE_RATIO = 0.5;     // el espectro "previo" termina así de antes del instante de detección
const MAX_PARTIAL_HZ = 8000;

/* ---------- FFT ---------- */
export function createFFT(n) {
  const levels = Math.round(Math.log2(n));
  if ((1 << levels) !== n) throw new Error('n debe ser potencia de 2');
  const cos = new Float64Array(n / 2), sin = new Float64Array(n / 2), rev = new Uint32Array(n);
  for (let i = 0; i < n / 2; i++) { cos[i] = Math.cos(2 * Math.PI * i / n); sin[i] = Math.sin(2 * Math.PI * i / n); }
  for (let i = 0; i < n; i++) { let r = 0, x = i; for (let j = 0; j < levels; j++) { r = (r << 1) | (x & 1); x >>= 1; } rev[i] = r; }
  return {
    n,
    forward(re, im) {
      for (let i = 0; i < n; i++) { const j = rev[i]; if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
      for (let size = 2; size <= n; size <<= 1) {
        const half = size >> 1, step = n / size;
        for (let i = 0; i < n; i += size) {
          for (let j = i, k = 0; j < i + half; j++, k += step) {
            const l = j + half;
            const tr = re[l] * cos[k] + im[l] * sin[k];
            const ti = -re[l] * sin[k] + im[l] * cos[k];
            re[l] = re[j] - tr; im[l] = im[j] - ti;
            re[j] += tr; im[j] += ti;
          }
        }
      }
    },
  };
}

export function hannWindow(n) {
  const w = new Float64Array(n);
  for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / n);
  return w;
}

/** Analizador de magnitud (unidades de amplitud: una senoide de amplitud A da un pico ≈ A). */
export function createSpectrumAnalyzer(n) {
  const fft = createFFT(n), win = hannWindow(n);
  let ws = 0; for (let i = 0; i < n; i++) ws += win[i];
  const re = new Float64Array(n), im = new Float64Array(n);
  return {
    n,
    bins: n / 2 + 1,
    /** samples: arreglo de longitud n. Escribe en out (Float64Array n/2+1). */
    magnitude(samples, out = new Float64Array(n / 2 + 1)) {
      for (let i = 0; i < n; i++) { re[i] = samples[i] * win[i]; im[i] = 0; }
      fft.forward(re, im);
      const s = 2 / ws;
      for (let k = 0; k <= n / 2; k++) out[k] = s * Math.sqrt(re[k] * re[k] + im[k] * im[k]);
      return out;
    },
  };
}

/* ---------- sensibilidad ---------- */
/** x ∈ [0,1] (0 = poco sensible, 1 = muy sensible; 0.5 por defecto). */
export function thresholdsFromSensitivity(x) {
  const s = Math.max(0, Math.min(1, Number.isFinite(x) ? x : 0.5));
  const k = Math.pow(10, -(s - 0.5) * 1.2); // ±6 dB aprox. por lado
  return {
    minLevelDb: -52 - (s - 0.5) * 24,   // nivel mínimo RMS de la ventana del ataque (dBFS)
    minPartial: 0.0006 * k,              // amplitud mínima de un parcial "nuevo"
    absScore: 0.15 * k,                  // saliencia mínima absoluta
  };
}

/* ---------- saliencia por nota ---------- */
const WEIGHTS = [0, 1, 0.8, 0.66, 0.56, 0.48, 0.42, 0.38, 0.34];
const MAX_H = 8;
const bMax = (m) => Math.min(0.004, 4e-4 * Math.pow(2, (m - 60) / 10)); // inarmonicidad máxima tolerada

/** Prepara el contexto de saliencia para un espectro `mag` (nuevo) con piso local tomado de `floorSrc`. */
function makeContext(mag, floorSrc, sr, n, thr) {
  const binw = sr / n;
  const kTop = Math.min(mag.length - 2, Math.floor((MAX_PARTIAL_HZ * 1.1) / binw));
  const floor = new Float64Array(mag.length);
  const W = 7, tmp = new Float64Array(2 * W + 1);
  for (let k = 0; k <= kTop; k++) {
    let c = 0;
    for (let j = k - W; j <= k + W; j++) { const v = j < 0 || j >= floorSrc.length ? 0 : floorSrc[j]; let p = c++; while (p > 0 && tmp[p - 1] > v) { tmp[p] = tmp[p - 1]; p--; } tmp[p] = v; }
    floor[k] = tmp[4];
  }
  return { mag, floor, sr, n, binw, kTop, thr };
}

const TOL = 0.016; // tolerancia relativa de afinación/frecuencia (~14 cents) a cada lado
function peakIn(ctx, f, loF, hiF) {
  const { mag, binw, kTop } = ctx;
  const kc = Math.round(f / binw);
  let kl = Math.floor(loF / binw), kh = Math.ceil(hiF / binw);
  if (kh - kl < 2) { kl = Math.min(kl, kc - 1); kh = Math.max(kh, kc + 1); }
  kl = Math.max(1, kl); kh = Math.min(kTop, kh);
  let best = -1, kb = -1;
  for (let k = kl; k <= kh; k++) if (mag[k] > best) { best = mag[k]; kb = k; }
  // debe ser un máximo local: si es la falda de un pico vecino (a más de la ventana), no cuenta
  if (kb < 0 || mag[kb - 1] > best || mag[kb + 1] > best) return { a: 0, k: kc, kb: kc >= 0 ? kc : 0 };
  let a = best, off = 0;
  const l = mag[kb - 1], r = mag[kb + 1], d = l - 2 * best + r;
  if (d < 0) { off = 0.5 * (l - r) / d; if (off > 0.5) off = 0.5; if (off < -0.5) off = -0.5; a = best - 0.25 * (l - r) * off; }
  return { a, k: kb + off, kb };
}

/** Evalúa la saliencia de la nota m sobre el contexto. */
function evalNote(ctx, m, orig) {
  const { thr, floor } = ctx;
  const f0 = midiToHz(m);
  const H = Math.min(MAX_H, Math.floor(MAX_PARTIAL_HZ / f0));
  const Bm = bMax(m);
  const amps = new Float64Array(MAX_H + 1);
  const ks = new Float64Array(MAX_H + 1);
  let score = 0, cover = 0, amax = 0;
  for (let h = 1; h <= H; h++) {
    const f = h * f0;
    const p = peakIn(ctx, f, f * (1 - TOL), f * (1 + TOL + 0.5 * Bm * h * h));
    ks[h] = p.k;
    const fl = floor[p.kb] || 0;
    if (p.a >= thr.minPartial && p.a >= 3 * fl) {
      amps[h] = p.a; cover++; if (p.a > amax) amax = p.a;
      score += WEIGHTS[h] * Math.sqrt(p.a);
    }
  }
  const need = Math.min(3, H);
  const res = { m, s: 0, amps, ks, H, cover };
  if (cover < need || amax <= 0) return res;
  // Chequeos de estructura sobre el espectro ORIGINAL (no el residual tras cancelar otras notas)
  const o = orig || ctx;
  const a1 = peakIn(o, f0, f0 * (1 - TOL), f0 * (1 + TOL + 0.5 * Bm)).a;
  if (H >= 2) {
    const a2 = peakIn(o, 2 * f0, 2 * f0 * (1 - TOL), 2 * f0 * (1 + TOL + 2 * Bm)).a;
    // el 2º parcial casi siempre existe en un piano; puede faltar si lo enmascara una nota sostenida (se exige más cobertura)
    if (a2 < o.thr.minPartial && !(cover >= 4 && a1 >= o.thr.minPartial)) return res;
  }
  if (a1 < 0.03 * amax) return res;                              // sin fundamental propia: lo explica una nota más grave/aguda (subarmónico fantasma)
  // evidencia de la octava inferior: energía en (h−0.5)·f0
  let odd = 0;
  const Bl = bMax(m - 12);
  for (let h = 1; h <= Math.min(H, 4); h++) {
    const f = (h - 0.5) * f0;
    if (f < 30) continue;
    const p = peakIn(ctx, f, f * (1 - TOL), f * (1 + TOL + 0.5 * Bl * (2 * h - 1) * (2 * h - 1)));
    const fl = floor[p.kb] || 0;
    const a = Math.max(0, p.a - 2 * fl);
    if (a >= thr.minPartial) odd += WEIGHTS[h] * Math.sqrt(a);
  }
  res.odd = odd;
  res.s = Math.max(0, score - 1.0 * odd);
  // subarmónico fantasma: si sólo hay parciales pares, la octava superior lo explica por completo
  let oddOwn = 0;
  for (let h = 1; h <= H; h += 2) if (amps[h] > 0) oddOwn += WEIGHTS[h] * Math.sqrt(amps[h]);
  if (score > 0 && oddOwn < 0.25 * score) res.s = 0;
  return res;
}

const OCT_LAMBDA = 0.8, ODD_LAMBDA = 1.0;
function cancelNote(ctx, res, ev) {
  const { mag, kTop } = ctx;
  const f0 = midiToHz(ev.m), Bm = bMax(ev.m);
  const Hc = Math.min(24, Math.floor((MAX_PARTIAL_HZ * 1.05) / f0));
  const a = new Float64Array(Hc + 2), ks = new Float64Array(Hc + 2);
  for (let h = 1; h <= Hc; h++) {
    const f = h * f0;
    const p = peakIn(ctx, f, f * (1 - TOL), f * (1 + TOL + 0.5 * Bm * h * h));
    const fl = ctx.floor[p.kb] || 0;
    a[h] = p.a >= 3 * fl && p.a >= ctx.thr.minPartial * 0.5 ? p.a : 0; ks[h] = p.k;
  }
  for (let h = 1; h <= Hc; h++) {
    if (a[h] <= 0) continue;
    // Todo parcial compartido con otra nota (octava, quinta...) conserva sólo lo que excede a la interpolación de sus vecinos
    const nb = h > 1 ? 0.5 * (a[h - 1] + a[h + 1]) : a[h + 1];
    const keep = Math.max(0, a[h] - (h % 2 === 0 ? OCT_LAMBDA : ODD_LAMBDA) * nb) / a[h];
    const kc = Math.round(ks[h]);
    for (let k = kc - 2; k <= kc + 2; k++) if (k >= 1 && k <= kTop) mag[k] *= keep;
  }
}

/**
 * Busca las notas presentes en `newMag` por cancelación iterativa.
 * @returns {{midi:number, s:number}[]} ordenadas por orden de hallazgo (la más saliente primero).
 */
export function findNotes(newMag, curMag, sr, n, thr, maxNotes = 6) {
  const work = Float64Array.from(newMag);
  const ctx = makeContext(work, curMag, sr, n, thr);
  const orig = makeContext(Float64Array.from(newMag), curMag, sr, n, thr);
  const found = [];
  let s0 = 0;
  for (let it = 0; it < maxNotes; it++) {
    let best = null;
    for (let m = MIDI_LO; m <= MIDI_HI; m++) {
      if (found.some((f) => f.midi === m)) continue;
      const e = evalNote(ctx, m, orig);
      if (e.s > 0 && (!best || e.s > best.s)) best = e;
    }
    if (!best || best.s < thr.absScore) break;
    if (it === 0) s0 = best.s; else if (best.s < 0.28 * s0) break;
    found.push({ midi: best.m, s: best.s });
    cancelNote(ctx, work, best);
  }
  found.ctx = orig; // espectro original, para chequeos posteriores
  return found;
}

/**
 * Decisión guiada por lo esperado. Devuelve {hits:number[], error:number|null}.
 */
export function decideNotes(found, expected, thr) {
  const exp = Array.isArray(expected) ? expected : [];
  const hits = exp.filter((e) => found.some((f) => f.midi === e));
  if (hits.length) return { hits, error: null };
  if (!exp.length || !found.length) return { hits: [], error: null };
  const b = found[0];
  const second = found[1];
  if (second && second.s > 0.5 * b.s) return { hits: [], error: null };      // ambiguo (acorde equivocado, voz, etc.)
  if (b.s < 1.3 * thr.absScore) return { hits: [], error: null };
  const octave = exp.some((e) => (e - b.midi) % 12 === 0);
  if (octave && b.s < 4 * thr.absScore) return { hits: [], error: null };     // equivalente de octava: sólo con evidencia fuerte
  return { hits: [], error: b.midi };
}

/* ---------- detector de ataques ---------- */
function createOnsetDetector(sr, getThr) {
  const an = createSpectrumAnalyzer(ONSET_N);
  const binw = sr / ONSET_N;
  const lo = Math.max(1, Math.floor(60 / binw)), hi = Math.min(ONSET_N / 2, Math.ceil(6000 / binw));
  const mag = new Float64Array(ONSET_N / 2 + 1);
  const prevL = new Float64Array(ONSET_N / 2 + 1);
  const fluxHist = [];
  const HIST = 40;
  const refractory = Math.round(0.08 * sr);
  let sinceLast = refractory, frames = 0;
  return {
    /** frame: últimas ONSET_N muestras. Devuelve {attack, flux, rms}. */
    process(frame) {
      an.magnitude(frame, mag);
      let flux = 0;
      for (let k = lo; k <= hi; k++) {
        const L = Math.log1p(mag[k] * 2000);
        const d = L - prevL[k]; if (d > 0) flux += d;
        prevL[k] = L;
      }
      let e = 0; for (let i = 0; i < ONSET_N; i++) e += frame[i] * frame[i];
      const rms = Math.sqrt(e / ONSET_N);
      frames++;
      sinceLast += ONSET_HOP;
      let mean = 0; for (const v of fluxHist) mean += v; mean = fluxHist.length ? mean / fluxHist.length : 0;
      const thrFlux = 6 + 1.8 * mean;
      const minRms = Math.pow(10, getThr().minLevelDb / 20);
      let attack = false;
      if (frames > 4 && flux > thrFlux && rms >= minRms && sinceLast >= refractory) { attack = true; sinceLast = 0; }
      fluxHist.push(flux); if (fluxHist.length > HIST) fluxHist.shift();
      return { attack, flux, rms };
    },
  };
}

/* ---------- tracker ---------- */
/**
 * createPitchTracker({sampleRate, getExpected, onNote, sensitivity, settleMs})
 * push(Float32Array) con PCM mono. Llama onNote(midi) cuando decide una nota (esperada o error).
 */
export function createPitchTracker({ sampleRate = 44100, getExpected = () => [], onNote = () => {}, sensitivity = 0.5, settleMs = 110, onDebug = null } = {}) {
  const sr = sampleRate;
  const RING = 32768;
  const ring = new Float32Array(RING);
  let total = 0;
  let sinceHop = 0;
  let thr = thresholdsFromSensitivity(sensitivity);
  const big = createSpectrumAnalyzer(BIG_N);
  const SN = 4096;
  const small = createSpectrumAnalyzer(SN);
  const earlyMag = new Float64Array(SN / 2 + 1), lateMag = new Float64Array(SN / 2 + 1);
  const sbw = sr / SN;
  const sbuf = new Float32Array(SN);
  const onset = createOnsetDetector(sr, () => thr);
  const frameBuf = new Float32Array(ONSET_N);
  const winBuf = new Float32Array(BIG_N);
  const pending = [];
  const settle = Math.round(settleMs / 1000 * sr);

  function window(endAbs, n, out) {
    for (let i = 0; i < n; i++) { const a = endAbs - n + i; out[i] = a < 0 || a < total - RING ? 0 : ring[a & (RING - 1)]; }
    return out;
  }

  function analyze(p) {
    window(p.end, BIG_N, winBuf);
    const cur = big.magnitude(winBuf);
    const nw = new Float64Array(cur.length);
    for (let k = 0; k < cur.length; k++) { const d = cur[k] - p.prev[k]; nw[k] = d > 0 ? d : 0; }
    const expected = (getExpected() || []).slice();
    const found = findNotes(nw, cur, sr, BIG_N, thr);
    const d = decideNotes(found, expected, thr);
    const partials = (m, sp) => {
      const f0 = midiToHz(m), cx = { mag: sp, binw: sbw, kTop: SN / 2 - 2 };
      const out = [];
      for (let h = 1; h <= 6 && h * f0 < 8000; h++) { const f = h * f0; out.push(peakIn(cx, f, f * (1 - 0.004), f * (1 + 0.004 + 0.5 * bMax(m) * h * h)).a); }
      return out;
    };
    const energy = (m, sp) => partials(m, sp).reduce((a, b) => a + b, 0);
    // Re-ataque de una nota que ya sonaba (misma nota repetida): la resta de espectros la borra por la fase,
    // así que se mira si sus parciales SUBEN justo después del ataque (un golpe/click no los hace subir).
    const missing = expected.filter((e) => !d.hits.includes(e));
    const probe = [...missing];
    if (d.error != null && !probe.includes(d.error)) probe.push(d.error);
    const rise = new Map(); // nota → {sb, sa, rising}
    if (probe.length) {
      small.magnitude(window(p.T - 1024, SN, sbuf), earlyMag); // previo al ataque
      const bef = probe.map((m) => partials(m, earlyMag));
      const aft = bef.map((b) => b.map(() => 0));
      for (const off of [2048, 4096]) { small.magnitude(window(Math.min(p.end, p.T + off), SN, sbuf), lateMag); probe.forEach((m, i) => { partials(m, lateMag).forEach((v, h) => { if (v > aft[i][h]) aft[i][h] = v; }); }); }
      probe.forEach((m, i) => {
        const sb = bef[i].reduce((a, b) => a + b, 0), sa = aft[i].reduce((a, b) => a + b, 0);
        let rising = 0; bef[i].forEach((b, h) => { if (b >= 3 * thr.minPartial && aft[i][h] >= REATTACK_RATIO * b) rising++; });
        rise.set(m, { sb, sa, rising, n: bef[i].length });
        if (onDebug) onDebug({ reattack: [[m, sb, sa, sa / (sb || 1), rising]] });
      });
      // Re-ataque de una nota que ya sonaba (misma nota repetida): la resta de espectros la borra por la fase,
      // así que se mira si sus parciales SUBEN justo después del ataque (un golpe/click no los hace subir).
      for (const m of missing) {
        const r = rise.get(m);
        if (r.sb >= 6 * thr.minPartial && r.sa >= 0.85 * r.sb && r.rising >= Math.min(2, r.n)) { d.hits.push(m); d.error = null; }
      }
      // Un error no es "nuevo" si esa altura ya sonaba antes del ataque y no subió (resto de una nota anterior, soltar el pedal, etc.)
      if (d.error != null) { const r = rise.get(d.error); if (r.sb >= 6 * thr.minPartial && r.sa < 2 * r.sb && r.rising < Math.min(2, r.n)) d.error = null; }
    }
    // Octava superior de una nota ya hallada: sus parciales son los pares de la inferior. Si los pares superan a los impares
    // (en un piano suelen ser menores) es que suena la octava; con una sola octava presente sería un falso positivo.
    for (const e of expected) {
      if (d.hits.includes(e) || !d.hits.includes(e - 12)) continue;
      const ev = evalNote(found.ctx, e - 12, found.ctx);
      let evn = 0, odd = 0; for (let h = 1; h <= MAX_H; h++) { if (h % 2) odd += ev.amps[h]; else evn += ev.amps[h]; }
      if (onDebug) onDebug({ octave: [e, evn / (odd || 1)] });
      if (odd > 0 && evn / odd >= OCTAVE_RATIO) { d.hits.push(e); d.error = null; }
    }
    let sustained = () => true;
    if (d.hits.length || d.error != null) {
      // un click o golpe se apaga antes del análisis; una nota de piano sigue sonando
      small.magnitude(window(Math.min(p.end - 1024, p.T + 2048), SN, sbuf), earlyMag);
      small.magnitude(window(p.end, SN, sbuf), lateMag);
      sustained = (m) => energy(m, lateMag) >= 0.12 * energy(m, earlyMag);
    }
    if (onDebug) onDebug({ T: p.T, end: p.end, found, expected, decision: d });
    for (const m of d.hits) if (sustained(m)) onNote(m);
    if (d.error != null && sustained(d.error)) onNote(d.error);
  }

  function runPending() {
    while (pending.length && total >= pending[0].end) analyze(pending.shift());
  }

  function hop() {
    window(total, ONSET_N, frameBuf);
    const r = onset.process(frameBuf);
    if (r.attack) {
      // un ataque nuevo corta la espera de los anteriores (no mezclar su energía)
      for (const p of pending) p.end = Math.min(p.end, Math.max(p.T + 2048, total - 1536));
      runPending();
      const prev = big.magnitude(window(total - PRE_GAP, BIG_N, winBuf), new Float64Array(BIG_N / 2 + 1));
      pending.push({ T: total, end: total + settle, prev });
    }
    runPending();
  }

  return {
    push(chunk) {
      for (let i = 0; i < chunk.length; i++) {
        ring[total & (RING - 1)] = chunk[i];
        total++;
        if (++sinceHop >= ONSET_HOP) { sinceHop = 0; hop(); }
      }
    },
    setSensitivity(x) { sensitivity = x; thr = thresholdsFromSensitivity(x); },
    get sensitivity() { return sensitivity; },
    reset() { pending.length = 0; },
  };
}

export const _internals = { makeContext, evalNote, peakIn };
