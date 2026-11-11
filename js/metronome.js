// Metrónomo Web Audio con scheduler lookahead. Seguro de importar en Node.

const MIN_BPM = 30;
const MAX_BPM = 240;
const LOOKAHEAD_MS = 25;
const SCHEDULE_AHEAD_S = 0.12;

export function createMetronome() {
  let bpm = 80;
  let beats = 4;
  let running = false;
  let ctx = null;
  let timer = null;
  let nextTime = 0;
  let beatIdx = 0;
  const listeners = new Set();
  const pending = new Set();

  function click(time, accent) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = accent ? 1600 : 1000;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(accent ? 0.5 : 0.3, time + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + 0.05);
  }

  function emit(idx, time) {
    const delay = Math.max(0, (time - ctx.currentTime) * 1000);
    const id = setTimeout(() => {
      pending.delete(id);
      if (!running) return;
      listeners.forEach((cb) => { try { cb(idx); } catch (e) { /* ignorar */ } });
    }, delay);
    pending.add(id);
  }

  function tick() {
    if (!running || !ctx) return;
    while (nextTime < ctx.currentTime + SCHEDULE_AHEAD_S) {
      const idx = beatIdx % beats;
      click(nextTime, idx === 0);
      emit(idx, nextTime);
      nextTime += 60 / bpm;
      beatIdx = (beatIdx + 1) % beats;
    }
  }

  return {
    start() {
      if (running) return;
      const AC = typeof globalThis !== 'undefined' && (globalThis.AudioContext || globalThis.webkitAudioContext);
      if (!AC) return;
      if (!ctx) ctx = new AC();
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      running = true;
      beatIdx = 0;
      nextTime = ctx.currentTime + 0.05;
      tick();
      timer = setInterval(tick, LOOKAHEAD_MS);
    },
    stop() {
      running = false;
      if (timer) { clearInterval(timer); timer = null; }
      pending.forEach((id) => clearTimeout(id));
      pending.clear();
    },
    setBpm(n) {
      const v = Number(n);
      if (!Number.isFinite(v)) return;
      bpm = Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(v)));
    },
    setBeats(n) {
      const v = Math.round(Number(n));
      if (!Number.isFinite(v) || v < 1) return;
      beats = Math.min(32, v);
      if (beatIdx >= beats) beatIdx = 0;
    },
    get isRunning() { return running; },
    get bpm() { return bpm; },
    /** cb(beatIndex) con beatIndex 0..beats-1 (0 = tiempo acentuado). Devuelve función para desuscribir. */
    onBeat(cb) {
      if (typeof cb !== 'function') return () => {};
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}
