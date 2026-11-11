// Sintetizador de tonos tipo piano para tests y verificación (no es un test; no coincide con *.test.mjs).
export function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
export const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

/** Agrega una nota a buf (Float32Array/Array) desde el instante t0 (s). Devuelve la nota sintetizada en buf. */
export function addNote(buf, sr, midi, t0, dur, amp, rand, opts = {}) {
  const f0 = hz(midi) * Math.pow(2, (opts.cents || 0) / 1200);
  const B = (opts.B ?? 4e-4 * Math.pow(2, (midi - 60) / 12)) * (0.6 + 0.8 * rand());
  const nPart = opts.partials ?? (8 + Math.floor(rand() * 3));
  const tilt = 0.7 + 0.5 * rand();
  const tau0 = (opts.tau0 ?? (midi < 48 ? 3.0 : midi < 72 ? 2.0 : 1.0)) * (0.8 + 0.4 * rand());
  const parts = [];
  let sum = 0;
  for (let n = 1; n <= nPart; n++) {
    const f = n * f0 * Math.sqrt(1 + B * n * n);
    if (f > sr * 0.45) break;
    let a = Math.pow(n, -tilt) * (0.65 + 0.7 * rand());
    if (f < 120) a *= Math.pow(f / 120, 1.2); // la caja/parlante atenúan los fundamentales graves
    parts.push({ f, a, ph: rand() * 2 * Math.PI, tau: tau0 / (1 + 0.45 * (n - 1)) });
    sum += a;
  }
  const g = amp / sum;
  const i0 = Math.round(t0 * sr), n = Math.round(dur * sr);
  const att = Math.round(0.003 * sr);
  for (let i = 0; i < n; i++) {
    const idx = i0 + i; if (idx < 0 || idx >= buf.length) continue;
    const t = i / sr; let v = 0;
    for (const p of parts) v += p.a * Math.exp(-t / p.tau) * Math.sin(2 * Math.PI * p.f * t + p.ph);
    const env = i < att ? i / att : 1;
    const rel = i > n - 0.05 * sr ? (n - i) / (0.05 * sr) : 1;
    buf[idx] += g * v * env * rel;
  }
}

/** Ruido gaussiano de fondo; noiseDb relativo a amp (p. ej. -50). */
export function addNoise(buf, rand, rms) {
  for (let i = 0; i < buf.length; i++) {
    const u = rand() || 1e-9, v = rand();
    buf[i] += rms * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
}

/** events: [{t, notes:[midi], dur, vel(0..1)}]. Devuelve Float32Array con ruido a noiseDb. */
export function renderEvents(events, { sr = 44100, total, seed = 1, amp = 0.3, noiseDb = -50, cents = 0 } = {}) {
  const rand = rng(seed);
  const end = total ?? (Math.max(...events.map((e) => e.t + (e.dur ?? 1))) + 0.8);
  const buf = new Float32Array(Math.round(end * sr));
  for (const ev of events) {
    const vel = ev.vel ?? 1;
    for (const m of ev.notes) addNote(buf, sr, m, ev.t + (ev.offs ? ev.offs[ev.notes.indexOf(m)] : 0), ev.dur ?? 1, amp * vel * (0.8 + 0.4 * rand()), rand, { cents });
  }
  addNoise(buf, rand, amp * Math.pow(10, noiseDb / 20));
  return buf;
}

/** Empuja en chunks de tamaño variable. */
export function feed(tracker, buf, seed = 7, sizes = [128, 256, 480, 1024]) {
  const rand = rng(seed);
  let i = 0;
  while (i < buf.length) {
    const n = sizes[Math.floor(rand() * sizes.length)];
    tracker.push(buf.subarray(i, Math.min(buf.length, i + n)));
    i += n;
  }
}
