// "Escuchar pasaje": eventos de reproducción (puro) + sintetizador simple con Web Audio (sin archivos de audio).
import { keyToMidi, durBeats } from "./model.js";

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

const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

/**
 * Reproductor. createPlayer({ AudioContext? }) → { play(events, {onStep,onEnd}), stop(), playing, voices }
 * Cada nota = 3 osciladores (fundamental + 2.º y 3.er armónico) con envolvente tipo piano; se programan por tandas.
 */
export function createPlayer(opts = {}) {
  let ctx = null, master = null, timer = 0, stepTimers = [], active = false, started = 0, voices = 0, endTimer = 0;
  const live = new Set();

  function ensure() {
    const AC = opts.AudioContext || (typeof globalThis !== "undefined" && (globalThis.AudioContext || globalThis.webkitAudioContext));
    if (!AC) throw new Error("Este navegador no puede reproducir audio.");
    if (!ctx) {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = 0.55;
      let out = master;
      try { const comp = ctx.createDynamicsCompressor(); master.connect(comp); out = comp; } catch (e) { /* sin compresor */ }
      out.connect(ctx.destination);
    }
    if (ctx.state === "suspended" && ctx.resume) ctx.resume();
    return ctx;
  }

  function voice(midi, when, dur) {
    const f = hz(midi);
    const vel = 0.5 * (midi < 48 ? 1.15 : midi > 84 ? 0.75 : 1);   // graves un poco más fuertes, agudos más suaves
    const g = ctx.createGain();
    const hold = Math.max(0.12, dur);
    const decay = Math.min(hold, 0.25 + 1.6 / Math.max(1, (midi - 20) / 12));
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(vel, when + 0.006);
    g.gain.exponentialRampToValueAtTime(vel * 0.38, when + decay);
    g.gain.setValueAtTime(vel * 0.38 * Math.pow(0.6, Math.max(0, hold - decay)), when + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, when + hold + 0.22);
    g.connect(master);
    [[1, "triangle", 1], [2, "sine", 0.28], [3, "sine", 0.1]].forEach(([mul, type, amp]) => {
      const o = ctx.createOscillator();
      o.type = type; o.frequency.value = f * mul;
      let node = o;
      if (amp !== 1) { const a = ctx.createGain(); a.gain.value = amp; o.connect(a); node = a; }
      node.connect(g);
      o.start(when); o.stop(when + hold + 0.3);
      voices++;
      live.add(o); o.onended = () => live.delete(o);
    });
  }

  function clearTimers() { clearInterval(timer); timer = 0; clearTimeout(endTimer); endTimer = 0; stepTimers.forEach(clearTimeout); stepTimers = []; }

  return {
    get playing() { return active; },
    get voices() { return voices; },
    /** Empieza a sonar. Devuelve la duración total (seg). */
    play(events, { onStep, onEnd } = {}) {
      this.stop();
      const c = ensure();
      if (!events.length) { onEnd && onEnd(); return 0; }
      active = true; started = c.currentTime + 0.08;
      let i = 0;
      const total = totalSeconds(events);
      const schedule = () => {
        const horizon = c.currentTime - started + 1.2;
        while (i < events.length && events[i].at <= horizon) { const e = events[i++]; voice(e.midi, started + e.at, e.dur); }
      };
      schedule();
      timer = setInterval(schedule, 200);
      const seenSteps = new Set();
      events.forEach((e) => {
        if (seenSteps.has(e.step)) return; seenSteps.add(e.step);
        stepTimers.push(setTimeout(() => { if (active && onStep) onStep(e); }, Math.max(0, (started + e.at - c.currentTime) * 1000)));
      });
      endTimer = setTimeout(() => { if (!active) return; active = false; clearTimers(); onEnd && onEnd(true); }, Math.max(0, (started + total - c.currentTime) * 1000) + 120);
      return total;
    },
    stop() {
      const was = active;
      active = false; clearTimers();
      live.forEach((o) => { try { o.stop(); } catch (e) { /* ya detenido */ } });
      live.clear();
      if (master && ctx) { try { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(0, ctx.currentTime); master.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 0.25); } catch (e) { /* nada */ } }
      return was;
    },
  };
}
