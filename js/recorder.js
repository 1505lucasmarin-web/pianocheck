// Toma de audio voluntaria (MediaRecorder). Cada toma pide el micrófono de nuevo y lo suelta al terminar. Nada se sube a ningún lado.
export const MAX_RECORD_MS = 60000;
const MIMES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];

export function recorderSupported(env = globalThis) {
  return !!(env && env.MediaRecorder && env.navigator && env.navigator.mediaDevices && typeof env.navigator.mediaDevices.getUserMedia === "function");
}
export function pickMime(MR) {
  if (!MR || typeof MR.isTypeSupported !== "function") return "";
  return MIMES.find((m) => { try { return MR.isTypeSupported(m); } catch (e) { return false; } }) || "";
}
export const extFor = (mime) => (/mp4/.test(mime) ? "m4a" : /ogg/.test(mime) ? "ogg" : "webm");
export const clock = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };

/**
 * createRecorder({ env, maxMs, onTick(ms), onAutoStop(result) })
 * start() → pide permiso (siempre) y empieza; stop() → { blob, ms, mime }; cancel() descarta. Lanza si el permiso se niega.
 */
export function createRecorder({ env = globalThis, maxMs = MAX_RECORD_MS, onTick, onAutoStop } = {}) {
  let stream = null, rec = null, chunks = [], t0 = 0, timer = 0, mime = "", finishing = null;
  const release = () => { clearInterval(timer); timer = 0; if (stream) { stream.getTracks().forEach((t) => { try { t.stop(); } catch (e) { /* ya parado */ } }); stream = null; } };

  function finish(discard) {
    if (finishing) return finishing;
    finishing = new Promise((resolve) => {
      const done = () => {
        const ms = Math.min(maxMs, Date.now() - t0);
        const blob = new Blob(chunks, { type: mime || (rec && rec.mimeType) || "audio/webm" });
        release(); rec = null; chunks = [];
        resolve(discard ? null : { blob, ms, mime: blob.type });
      };
      if (!rec || rec.state === "inactive") { done(); return; }
      rec.onstop = done;
      try { rec.stop(); } catch (e) { done(); }
    });
    return finishing;
  }

  return {
    get recording() { return !!rec && rec.state === "recording"; },
    async start() {
      if (rec) throw new Error("Ya hay una grabación en curso.");
      const MR = env.MediaRecorder;
      stream = await env.navigator.mediaDevices.getUserMedia({ audio: true });
      try {
        mime = pickMime(MR);
        rec = mime ? new MR(stream, { mimeType: mime }) : new MR(stream);
      } catch (e) { release(); rec = null; throw e; }
      chunks = []; finishing = null; t0 = Date.now();
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.start(250);
      timer = setInterval(() => {
        const ms = Date.now() - t0;
        if (onTick) onTick(Math.min(ms, maxMs));
        if (ms >= maxMs) finish(false).then((r) => onAutoStop && onAutoStop(r));
      }, 200);
    },
    stop() { return finish(false); },
    cancel() { return finish(true); },
  };
}
