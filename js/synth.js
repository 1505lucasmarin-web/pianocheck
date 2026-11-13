// Sintetizador Web Audio sin archivos de audio: timbre "Piano" (parciales con decaimiento propio, golpe de martillo, cuerdas
// levemente desafinadas, envolvente según la altura) o "Suave" (el sonido simple de antes). Limitador/compresor maestro y polifonía acotada.
// Cada nota devuelve un "handle" { cancel(now), release(now) } que usa el planificador para pausar / saltar sin dejar notas colgadas.
export const TIMBRES = ["piano", "suave"];
export const MAX_VOICES = 40;
const LIGHT_BURST = 8, LIGHT_VOICES = 14;
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/**
 * Parámetros de una nota (puro, testeable): parciales [{ n, ratio, amp, tau, hold, tauS }], retardo de liberación y volumen.
 * Envolvente en dos etapas, como un piano real: "sonido inmediato" (cae rápido, `tau` s hasta `hold` de su nivel) y "sonido sostenido"
 * (cae lento, constante `tauS`), así una blanca o una redonda se oye con cuerpo hasta el final de su valor.
 * `release` es el tiempo en que se apaga una nota al soltarla (constante de caída = release / 3).
 */
export function voicePlan(midi, timbre = "piano", vel = 1) {
  const pos = clamp((midi - 21) / 87, 0, 1);                       // 0 = La0, 1 = Do8
  const peak = 0.42 * vel * (1.14 - 0.42 * pos);                    // graves un poco más fuertes, agudos más suaves
  const release = 0.075 + 0.075 * (1 - pos);                        // se corta con claridad: ~-30 dB a los 200 ms de soltar
  if (timbre === "suave") {
    const tauS = 4.4 - 2.2 * pos;
    return { timbre, peak: peak * 0.95, attack: 0.012, release, hammer: 0, pos,
      partials: [{ n: 1, ratio: 1, amp: 1, tau: 0.4, hold: 0.8, tauS, type: "triangle" }, { n: 2, ratio: 2, amp: 0.22, tau: 0.3, hold: 0.6, tauS: tauS * 0.7, type: "sine" }] };
  }
  const tauS = 7.2 - 4.4 * pos;                                      // caída lenta del "sonido sostenido": graves largos, agudos más cortos
  const nP = pos < 0.3 ? 6 : pos < 0.65 ? 5 : pos < 0.85 ? 4 : 3;
  const B = 0.00012 * Math.pow(2, pos * 4);                          // inarmonicidad leve
  const partials = [];
  let sum = 0;
  for (let n = 1; n <= nP; n++) {
    const a = Math.pow(n, -1.05) * (n === 2 ? 1.25 : 1) * (pos < 0.2 && n === 1 ? 0.8 : 1);
    partials.push({ n, ratio: n * Math.sqrt(1 + B * n * n), amp: a, tau: 0.38 / (1 + 0.5 * (n - 1)), hold: n === 1 ? 0.78 : 0.62 - 0.03 * Math.min(n, 5), tauS: tauS / (1 + 0.3 * (n - 1)), type: "sine" });
    sum += a;
  }
  partials.forEach((p) => { p.amp /= sum; });
  return { timbre, peak, attack: 0.003, release, hammer: 0.1 * vel * (0.5 + pos), pos, partials };
}

export function createSynth(ctx, { timbre = "piano", volume = 0.8, maxVoices = MAX_VOICES } = {}) {
  const vol = ctx.createGain();
  vol.gain.value = volume * 0.8;
  let out = vol;
  try {
    const comp = ctx.createDynamicsCompressor();
    if (comp.threshold) { comp.threshold.value = -20; comp.knee.value = 14; comp.ratio.value = 8; comp.attack.value = 0.003; comp.release.value = 0.25; }
    vol.connect(comp); out = comp;
  } catch (e) { /* sin compresor */ }
  out.connect(ctx.destination);
  const clickBus = ctx.createGain(); clickBus.gain.value = 0.55; clickBus.connect(out);

  let noise = null;
  try {
    const n = Math.floor(ctx.sampleRate * 0.04);
    noise = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = noise.getChannelData(0);
    let s = 12345;
    for (let i = 0; i < n; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = (s / 4294967296) * 2 - 1; }
  } catch (e) { noise = null; }

  const st = { timbre, metro: false, started: 0, clicks: 0 };
  let voices = [];     // { start, end, handle, kill(now, tau) }
  let recent = [];     // instantes de inicio de las últimas notas (para detectar ráfagas)
  const rnd = () => Math.random();

  function prune(now) { voices = voices.filter((v) => v.end > now - 0.05); }

  function note(item, when, dur) {
    if (item.click) return click(item, when);
    const plan = voicePlan(item.midi, st.timbre, item.vel == null ? 1 : item.vel);
    // Carga: si hay muchas notas sonando o arrancando casi juntas (pasajes rápidos, acordes, tablets), la nota usa una versión liviana
    // (menos parciales, una sola cuerda, sin golpe de martillo): suena casi igual y evita cortes de audio.
    const nowC = ctx.currentTime;
    recent = recent.filter((t) => t > nowC - 0.25); recent.push(when);
    const light = recent.length > LIGHT_BURST || voices.length > LIGHT_VOICES;
    if (light) { plan.partials = plan.partials.slice(0, 2); plan.hammer = 0; }
    const f = hz(item.midi);
    const hold = Math.max(0.12, dur);
    const g = ctx.createGain();           // envolvente de la nota (liberación)
    g.gain.setValueAtTime(1, when);
    g.gain.setValueAtTime(1, when + hold);
    g.gain.setTargetAtTime(0, when + hold, plan.release / 3);   // al terminar su valor la nota se apaga de verdad (no se arrastra)
    g.connect(vol);
    const end = when + hold + plan.release * 2 + 0.05;
    const oscs = [];
    const extra = [];
    const spread = (rnd() - 0.5) * 4;      // cents de desafinación propia de esa nota
    plan.partials.forEach((p) => {
      const strings = !light && p.n === 1 && st.timbre === "piano" ? [{ dc: -1, w: 0.82 }, { dc: 1, w: 0.18 }] : [{ dc: 0, w: 1 }];   // dos cuerdas en el fundamental: laten apenas (sin anularse)
      strings.forEach(({ dc, w }) => {
        const o = ctx.createOscillator();
        o.type = p.type; o.frequency.value = f * p.ratio;
        if (o.detune) o.detune.value = spread + dc;
        const pg = ctx.createGain();
        const a = plan.peak * p.amp * w;
        const t1 = when + plan.attack, t2 = t1 + p.tau * 2.2;           // etapa 1: del pico a `hold` en ~2 constantes
        pg.gain.setValueAtTime(0.0001, when);
        pg.gain.exponentialRampToValueAtTime(a, t1);
        pg.gain.exponentialRampToValueAtTime(a * p.hold, t2);
        pg.gain.exponentialRampToValueAtTime(a * p.hold * 0.01, t2 + p.tauS * 4.6);   // etapa 2: caída lenta
        o.connect(pg); pg.connect(g);
        o.start(when); o.stop(end);
        oscs.push(o); extra.push(pg);
      });
    });
    if (plan.hammer && noise) {
      try {
        const src = ctx.createBufferSource(); src.buffer = noise;
        const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = clamp(f * 3 + 600, 700, 5200); bp.Q.value = 0.9;
        const hg = ctx.createGain();
        hg.gain.setValueAtTime(0.0001, when);
        hg.gain.exponentialRampToValueAtTime(plan.hammer, when + 0.0015);
        hg.gain.exponentialRampToValueAtTime(0.0001, when + 0.03);
        src.connect(bp); bp.connect(hg); hg.connect(g);
        src.start(when); src.stop(when + 0.05);
        oscs.push(src);
      } catch (e) { /* sin golpe de martillo */ }
    }
    // polifonía acotada: si ya suenan demasiadas a la vez, se apaga la más vieja
    prune(ctx.currentTime);
    const live = voices.filter((v) => !v.killed && v.start <= when && v.end > when);
    if (live.length >= maxVoices) { live.sort((a, b) => a.start - b.start)[0].kill(when, 0.015); }
    const v = { start: when, end, kill, handle: null };
    function kill(now, tau) {
      v.killed = true;
      try { g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.setTargetAtTime(0, now, tau); } catch (e) { /* nada */ }
      const e2 = now + tau * 6 + 0.02;
      oscs.forEach((o) => { try { o.stop(e2); } catch (e) { /* ya detenido */ } });
      v.end = Math.min(v.end, e2);
    }
    v.handle = {
      cancel(now) { 
        try { g.disconnect(); } catch (e) { /* nada */ }
        oscs.forEach((o) => { try { o.stop(now); } catch (e) { /* nada */ } });
        v.end = now - 1;
      },
      release(now) { if (v.end > now) kill(now, 0.025); },
    };
    voices.push(v);
    st.started++;
    return v.handle;
  }

  function click(item, when) {
    if (!item.countin && !st.metro) return { cancel() {}, release() {} };
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "square"; o.frequency.value = item.accent ? 1600 : 1000;
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(item.accent ? 0.5 : 0.32, when + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.045);
    o.connect(g); g.connect(clickBus);
    o.start(when); o.stop(when + 0.06);
    st.clicks++;
    return { cancel(now) { try { g.disconnect(); o.stop(now); } catch (e) { /* nada */ } }, release() {} };
  }

  return {
    note,
    get timbre() { return st.timbre; },
    setTimbre(t) { st.timbre = TIMBRES.includes(t) ? t : "piano"; },
    setMetro(on) { st.metro = !!on; },
    setVolume(v) { try { vol.gain.setTargetAtTime(clamp(Number(v) || 0, 0, 1) * 0.8, ctx.currentTime, 0.02); } catch (e) { vol.gain.value = clamp(Number(v) || 0, 0, 1) * 0.8; } },
    /** Apaga todo lo que suena o está programado (liberación corta). */
    allOff(now) { prune(ctx.currentTime); voices.forEach((v) => { if (v.start >= now) v.handle.cancel(now); else v.kill(now, 0.03); }); voices = []; },
    active(now) { return voices.filter((v) => v.start <= now && v.end > now).length; },
    get started() { return st.started; },
    get clicks() { return st.clicks; },
  };
}
