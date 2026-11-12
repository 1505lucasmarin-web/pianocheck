// Reproductor: agenda de eventos (PURA: compases, ligaduras, manos, rango, metrónomo), planificador con ventana de anticipación
// sobre el reloj del AudioContext (pausa / seek / velocidad en caliente) y el reproductor Web Audio que une ambos con js/synth.js.
import { keyToMidi, durBeats } from "./model.js";
import { createSynth } from "./synth.js";

/** Duración en negras de la nota de un paso, sumando las ligaduras que la continúan en la misma mano. */
function tiedBeats(score, ref, key) {
  const evs = (score.measures[ref.measure] || {})[ref.hand] || [];
  let beats = durBeats(evs[ref.idx]);
  let m = ref.measure, i = ref.idx + 1;
  for (;;) {
    let list = (score.measures[m] || {})[ref.hand] || [];
    if (i >= list.length) { m++; i = 0; list = (score.measures[m] || {})[ref.hand] || []; if (m >= score.measures.length) break; }
    const ev = list[i];
    if (!ev || !ev.tie || !Array.isArray(ev.k) || !ev.k.includes(key)) break;
    beats += durBeats(ev); i++;
  }
  return beats;
}

/**
 * Notas a sonar para una lista de pasos (los del pasaje, con t en negras desde el inicio de la pieza).
 * → [{ step (índice del paso), beat (negras desde el inicio de la pieza), at (seg), dur (seg), midi, hand }] ordenadas. `speed` 1 = tempo actual; 0,6 = lento.
 */
export function buildEvents(score, steps, { bpm = 80, speed = 1 } = {}) {
  const list = Array.isArray(steps) ? steps : [];
  if (!list.length) return [];
  const sec = 60 / (Math.max(20, bpm) * Math.max(0.2, speed));
  const t0 = list[0].t;
  const out = [];
  for (const st of list) {
    const seen = new Set();
    for (const r of st.refs || []) {
      const ev = ((score.measures[r.measure] || {})[r.hand] || [])[r.idx];
      const key = ev && ev.k && ev.k[r.keyIdx];
      const midi = keyToMidi(key);
      if (midi === null || seen.has(midi)) continue;
      seen.add(midi);
      const beats = Math.max(0.25, tiedBeats(score, r, key));
      out.push({ step: st.i, beat: st.t, at: (st.t - t0) * sec, dur: beats * sec, midi, hand: r.hand });
    }
  }
  return out.sort((a, b) => a.at - b.at || a.midi - b.midi);
}

/** Duración total en segundos de una lista de eventos. */
export const totalSeconds = (events) => events.reduce((m, e) => Math.max(m, e.at + e.dur), 0);


/* ============================================================ agenda pura (en negras, sin tiempo absoluto) */

/** Largo y comienzo de cada compás (mismo criterio que buildSteps / measureStarts: el compás dura lo que dura su mano más larga; vacío = compás completo). */
export function measureLayout(score) {
  const ms = (score && score.measures) || [];
  const ts = (score && score.timeSig) || [4, 4];
  const barLen = (ts[0] * 4) / ts[1];
  const starts = [], lens = [];
  let base = 0;
  for (const m of ms) {
    starts.push(base);
    let mx = 0;
    for (const hand of ["rh", "lh"]) mx = Math.max(mx, ((m && m[hand]) || []).reduce((a, ev) => a + durBeats(ev), 0));
    const len = mx > 0 ? mx : barLen;
    lens.push(len); base += len;
  }
  return { starts, lens, total: base, barLen };
}

/** Compás (base 0) que contiene ese instante (en negras desde el inicio de la pieza). */
export function measureAtBeat(lay, beat) {
  const st = lay.starts; if (!st.length) return 0;
  let lo = 0, hi = st.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (st[mid] <= beat + 1e-9) lo = mid; else hi = mid - 1; }
  return lo;
}

/** Negras que dura una nota sumando las ligaduras que la continúan en la misma mano (hasta el final de la pieza). */
function chainBeats(score, mi, hand, idx, key) {
  const evs = (score.measures[mi] || {})[hand] || [];
  let beats = durBeats(evs[idx]);
  let m = mi, i = idx + 1;
  for (;;) {
    let list = (score.measures[m] || {})[hand] || [];
    if (i >= list.length) { m++; i = 0; if (m >= score.measures.length) break; list = (score.measures[m] || {})[hand] || []; }
    const ev = list[i];
    if (!ev || !ev.tie || !Array.isArray(ev.k) || !ev.k.includes(key)) break;
    beats += durBeats(ev); i++;
  }
  return beats;
}

/** Distancia entre clics del metrónomo, en negras (compuestos 6/8, 9/8… a la negra con puntillo). */
export function clickUnit(timeSig) {
  const [n, d] = timeSig || [4, 4];
  return d === 8 && n >= 6 && n % 3 === 0 ? 1.5 : 4 / d;
}

/**
 * Agenda de reproducción de una partitura.
 * opts: { from, to (compases base 0, inclusive; por defecto toda la pieza), hands: "both"|"rh"|"lh"|["rh","lh"] }
 * → { events:[{ id, beat, dur (negras), midi, hand, measure }], clicks:[{ click, beat, accent, measure, countin? }], startBeat, endBeat, from, to, lay }
 * Las ligaduras suenan como UNA nota sostenida; los silencios no generan eventos; la anacrusa es el primer compás tal como está escrito.
 * Los clics de la cuenta de entrada (un compás antes de startBeat) van aparte en `countIn`.
 */
export function buildSchedule(score, opts = {}) {
  const lay = measureLayout(score);
  const n = lay.starts.length;
  const empty = { events: [], clicks: [], countIn: [], startBeat: 0, endBeat: 0, from: 0, to: -1, lay };
  if (!n) return empty;
  const from = Math.max(0, Math.min(n - 1, Math.round(opts.from == null ? 0 : opts.from)));
  const to = Math.max(from, Math.min(n - 1, Math.round(opts.to == null ? n - 1 : opts.to)));
  const hs = Array.isArray(opts.hands) ? opts.hands : opts.hands === "rh" ? ["rh"] : opts.hands === "lh" ? ["lh"] : ["rh", "lh"];
  const startBeat = lay.starts[from], endBeat = lay.starts[to] + lay.lens[to];
  const events = [], seen = new Map();
  let id = 0;
  for (let mi = from; mi <= to; mi++) {
    for (const hand of hs) {
      let t = 0;
      (score.measures[mi][hand] || []).forEach((ev, idx) => {
        const beat = lay.starts[mi] + t;
        t += durBeats(ev);
        if (!ev || ev.tie || !Array.isArray(ev.k) || !ev.k.length) return;
        for (const key of ev.k) {
          const midi = keyToMidi(key); if (midi === null) continue;
          const dur = Math.min(chainBeats(score, mi, hand, idx, key), endBeat - beat);
          if (!(dur > 0)) continue;
          const dk = Math.round(beat * 1e6) + ":" + midi;     // misma nota en las dos manos al mismo tiempo: una sola
          const prev = seen.get(dk);
          if (prev) { if (dur > prev.dur) prev.dur = dur; continue; }
          const e = { id: id++, beat, dur, midi, hand, measure: mi };
          seen.set(dk, e); events.push(e);
        }
      });
    }
  }
  events.sort((a, b) => a.beat - b.beat || a.midi - b.midi);
  const ts = score.timeSig || [4, 4], unit = clickUnit(ts);
  const clicks = [];
  for (let mi = from; mi <= to; mi++) {
    const L = lay.lens[mi], full = Math.abs(L - lay.barLen) < 1e-6;
    for (let j = 0; j * unit < L - 1e-6; j++) clicks.push({ click: true, beat: lay.starts[mi] + j * unit, accent: full && j === 0 || (!full && mi !== 0 && j === 0), measure: mi });
  }
  const countIn = [];
  const nIn = Math.max(1, Math.round(lay.barLen / unit));
  for (let j = 0; j < nIn; j++) countIn.push({ click: true, countin: true, beat: startBeat - (nIn - j) * unit, accent: j === 0, measure: from });
  return { events, clicks, countIn, startBeat, endBeat, from, to, lay, unit };
}

export const secPerBeat = (bpm, speed = 1) => 60 / (Math.max(20, Number(bpm) || 80) * Math.max(0.2, Number(speed) || 1));
/** Duración total (segundos) de una agenda al tempo y velocidad dados. */
export const scheduleSeconds = (sc, bpm, speed = 1) => (sc.endBeat - sc.startBeat) * secPerBeat(bpm, speed);
/** Instante (segundos desde el comienzo del rango) de un compás. */
export const measureSeconds = (sc, measure, bpm, speed = 1) => (sc.lay.starts[measure] - sc.startBeat) * secPerBeat(bpm, speed);

/* ============================================================ planificador (puro: reloj y salida inyectados) */

/**
 * createTransport({ clock: () => seg, sink: { note(item, when, durSeg) → { cancel(now), release(now) } }, lookahead })
 * Programa las notas con `lookahead` segundos de anticipación sobre el reloj; un tick() las va entregando.
 * El tiempo es música (negras): `rate` = negras por segundo, así que cambiar velocidad, pausar o saltar sólo reubica el ancla (B0, T0)
 * y re-programa lo que todavía no sonaba (sin duplicar ni dejar notas colgadas).
 */
export function createTransport({ clock, sink, lookahead = 1.5, onEnd, onState } = {}) {
  let items = [], startBeat = 0, endBeat = 0, loop = false, firstReal = 0;
  let state = "stopped", rate = 1, T0 = 0, B0 = 0, cycle = 0, idx = 0, pausedBeat = 0;
  let fut = [], past = [];
  const len = () => Math.max(0, endBeat - startBeat);
  const virt = (now) => B0 + Math.max(0, now - T0) * rate;
  const beatOf = (v) => (v < startBeat ? v : loop && len() > 0 ? startBeat + ((v - startBeat) % len()) : Math.min(v, endBeat));
  const lower = (beat) => { let lo = 0, hi = items.length; while (lo < hi) { const m = (lo + hi) >> 1; if (items[m].beat >= beat) hi = m; else lo = m + 1; } return lo; };
  const setState = (s) => { if (s !== state) { state = s; onState && onState(s); } };

  function settle(now) {
    const v = virt(now);
    const keep = [];
    for (const e of fut) (e.vb < v ? past : keep).push(e);
    fut = keep;
    past = past.filter((e) => e.until > now);
  }
  /** Mueve el ancla a `beat` (ahora). Lo programado que aún no sonaba se descarta; lo que ya sonaba sigue (o se suelta si release). */
  function reanchor(beat, release, nr) {
    const now = clock(), v = virt(now);
    for (const e of fut) { if (e.vb >= v) e.h.cancel(now); else past.push(e); }
    fut = [];
    if (release) { past.forEach((e) => e.h.release(now)); past = []; }
    if (nr) rate = nr;
    T0 = now; B0 = beat; cycle = 0; idx = lower(beat);
  }

  const api = {
    load(o) {
      items = (o.events || []).slice().sort((a, b) => a.beat - b.beat);
      startBeat = o.startBeat || 0; endBeat = o.endBeat == null ? (items.length ? items[items.length - 1].beat : 0) : o.endBeat;
      loop = !!o.loop;
      firstReal = lower(startBeat - 1e-9);
      pausedBeat = Math.max(startBeat, Math.min(endBeat, o.position == null ? startBeat : o.position));
      if (state === "playing") reanchor(pausedBeat, true);
    },
    get state() { return state; },
    get playing() { return state === "playing"; },
    get rate() { return rate; },
    get range() { return { startBeat, endBeat }; },
    position() { return state === "playing" ? beatOf(virt(clock())) : pausedBeat; },
    /** Empieza (o sigue) desde `from` (por defecto, donde quedó; si estaba al final, desde el inicio). lead = negras de cuenta de entrada antes de startBeat. */
    play(from, { lead = 0 } = {}) {
      if (state === "playing") return;
      let b = from == null ? pausedBeat : from;
      if (b >= endBeat - 1e-9 || b < startBeat) b = startBeat;
      const now = clock();
      const withLead = lead > 0 && b <= startBeat + 1e-9;
      fut = []; past = [];
      T0 = now + 0.06; B0 = withLead ? startBeat - lead : b; cycle = 0; idx = lower(B0);
      setState("playing");
      api.tick();
    },
    pause() {
      if (state !== "playing") return pausedBeat;
      const pos = api.position(), now = clock(), v = virt(now);
      for (const e of fut) { if (e.vb >= v) e.h.cancel(now); else e.h.release(now); }
      past.forEach((e) => e.h.release(now));
      fut = []; past = [];
      pausedBeat = Math.max(startBeat, Math.min(endBeat, pos));
      setState("paused");
      return pausedBeat;
    },
    stop() {
      if (state === "playing") api.pause();
      pausedBeat = startBeat;
      setState("stopped");
    },
    seek(beat) {
      const b = Math.max(startBeat, Math.min(endBeat, beat));
      if (state === "playing") reanchor(b, true); else pausedBeat = b;
      if (b >= endBeat) { if (state === "playing") { /* al final exacto: tick() lo cierra */ } }
    },
    /** Negras por segundo (bpm × velocidad / 60). En caliente: la posición no se mueve. */
    setRate(r) {
      const nr = Math.max(0.05, Number(r) || 1);
      if (state === "playing") { reanchor(api.position(), false, nr); api.tick(); } else rate = nr;
    },
    setLoop(b) { const was = loop; loop = !!b; if (state === "playing" && was !== loop) reanchorKeep(api.position()); },
    /** Re-programa lo futuro con la configuración actual (p. ej. al prender o apagar el metrónomo). */
    resync() { if (state === "playing") reanchorKeep(api.position()); },
    tick() {
      if (state !== "playing") return;
      const now = clock();
      settle(now);
      const horizon = now + lookahead, L = len();
      for (;;) {
        if (idx >= items.length) {
          if (loop && L > 0 && items.length > firstReal) { cycle++; idx = firstReal; } else break;
        }
        const it = items[idx];
        const vb = it.beat + cycle * L;
        const when = T0 + (vb - B0) / rate;
        if (when > horizon) break;
        idx++;
        if (when < now - 0.25) continue;                       // se perdió por una demora larga: no se toca tarde
        const h = sink.note(it, Math.max(when, now), (it.dur || 0) / rate);
        if (h) fut.push({ vb, h, until: when + (it.dur || 0) / rate + 1.2 });
      }
      if (!loop && now >= T0 + (endBeat - B0) / rate) {
        past = past.concat(fut); fut = [];
        pausedBeat = startBeat;
        setState("stopped");
        onEnd && onEnd();
      }
    },
  };
  function reanchorKeep(beat) { reanchor(beat, false); api.tick(); }
  return api;
}

/* ============================================================ reproductor Web Audio */

/**
 * createPlayer({ AudioContext?, timbre?, volume?, onInterrupt? })
 *   .transport          planificador compartido (usarlo después de await unlock())
 *   .unlock()           crea/reanuda el AudioContext (llamar desde un gesto); true si quedó sonando
 *   .play(events, { onStep, onEnd })   compatibilidad: eventos { at, dur (seg), midi, step } de "Escuchar pasaje" y de Teoría
 *   .stop(), .playing, .voices (notas iniciadas), .active (sonando ahora), .setTimbre(), .setVolume(), .setMetronome()
 */
export function createPlayer(opts = {}) {
  let ctx = null, synth = null, timer = 0, legacy = null;
  let timbre = opts.timbre || "piano", volume = opts.volume == null ? 0.8 : opts.volume, metro = false;
  const transport = createTransport({
    clock: () => (ctx ? ctx.currentTime : 0),
    sink: { note: (it, when, dur) => synth.note(it, when, dur) },
    lookahead: opts.lookahead || 1.5,
    onState: (s) => { clearInterval(timer); timer = 0; if (s === "playing") timer = setInterval(() => transport.tick(), 40); },
    onEnd: () => { const l = legacy; if (l) { legacy = null; l.stopPoll(); l.onEnd && l.onEnd(true); } else if (api.onEnd) api.onEnd(); },
  });

  function ensure() {
    const AC = opts.AudioContext || (typeof globalThis !== "undefined" && (globalThis.AudioContext || globalThis.webkitAudioContext));
    if (!AC) throw new Error("Este navegador no puede reproducir audio.");
    if (!ctx) {
      ctx = new AC();
      synth = createSynth(ctx, { timbre, volume });
      synth.setMetro(metro);
      try { ctx.onstatechange = () => { if (ctx.state !== "running" && transport.playing) { transport.pause(); legacy && legacy.stopPoll(); api.onInterrupt && api.onInterrupt(ctx.state); } }; } catch (e) { /* nada */ }
    }
    return ctx;
  }
  const api = {
    transport, onInterrupt: opts.onInterrupt || null, onEnd: null,
    ensure,
    get ctx() { return ctx; },
    get synth() { return synth; },
    async unlock() {
      const c = ensure();
      if (c.state !== "running" && c.resume) {
        try { await Promise.race([c.resume(), new Promise((r) => setTimeout(r, 700))]); } catch (e) { /* bloqueado */ }
      }
      return c.state === "running" || c.state === undefined;
    },
    get playing() { return transport.playing; },
    get voices() { return synth ? synth.started : 0; },
    get active() { return synth && ctx ? synth.active(ctx.currentTime) : 0; },
    setTimbre(t) { timbre = t; synth && synth.setTimbre(t); },
    setVolume(v) { volume = v; synth && synth.setVolume(v); },
    setMetronome(on) { metro = !!on; synth && synth.setMetro(on); },
    /** Compatibilidad ("Escuchar pasaje", Teoría): eventos con `at`/`dur` en segundos. Devuelve la duración total. */
    play(events, { onStep, onEnd } = {}) {
      this.stop();
      const c = ensure();
      if (c.state === "suspended" && c.resume) c.resume();
      if (!events.length) { onEnd && onEnd(); return 0; }
      const total = totalSeconds(events);
      const items = events.map((e, i) => ({ id: i, beat: e.at, dur: e.dur, midi: e.midi, hand: e.hand, step: e.step, ev: e }));
      transport.load({ events: items, startBeat: 0, endBeat: total, loop: false });
      transport.setRate(1);
      const seen = new Set(), steps = [];
      events.forEach((e) => { if (!seen.has(e.step)) { seen.add(e.step); steps.push(e); } });
      let k = 0;
      const poll = setInterval(() => { const pos = transport.position() + 0.02; while (k < steps.length && steps[k].at <= pos) { const e = steps[k++]; onStep && onStep(e); } }, 25);
      legacy = { onEnd, stopPoll: () => clearInterval(poll) };
      transport.play(0);
      return total;
    },
    stop() {
      const was = transport.playing;
      if (legacy) { legacy.stopPoll(); legacy = null; }
      transport.stop();
      if (synth && ctx) synth.allOff(ctx.currentTime);
      return was;
    },
  };
  return api;
}
