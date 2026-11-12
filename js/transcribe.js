// Transcripción de audio a partitura EN EL DISPOSITIVO (navegador). El audio nunca sale del equipo.
// Motor: Basic Pitch (Spotify, Apache-2.0) sobre un TF.js recortado (WebGL, con CPU de respaldo). Se carga SÓLO al transcribir.
// La entrada es siempre un archivo/Blob del usuario, un AudioBuffer o una grabación del micrófono.
import { framesToNotes, notesToScore, MODEL } from './transcribe-core.js';

const TF_URL = new URL('../vendor/tfjs-lite.mjs', import.meta.url).href;
const MODEL_URL = new URL('../vendor/basic-pitch/model.json', import.meta.url).href;

const WIN = MODEL.sampleRate * 2 - MODEL.hop;               // 43844 muestras por ventana
const OVERLAP = 30 * MODEL.hop;                             // 7680
const HOP = WIN - OVERLAP;                                  // 36164
const KEEP_FROM = 15, KEEP = MODEL.framesPerWindow - 30;    // cuadros útiles por ventana (142)

const ctxClass = () => (typeof globalThis !== 'undefined' ? (globalThis.AudioContext || globalThis.webkitAudioContext) : null);
const offlineClass = () => (typeof globalThis !== 'undefined' ? (globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext) : null);

/** ¿Puede este navegador transcribir un archivo? (decodificación de audio + WebAssembly/WebGL no se exigen: hay CPU de respaldo). */
export function isSupported() {
  return !!(ctxClass() && offlineClass() && typeof Float32Array !== 'undefined' && typeof fetch === 'function');
}
/** ¿Puede grabar con el micrófono? */
export function isMicSupported() {
  return !!(typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && typeof MediaRecorder !== 'undefined' && ctxClass());
}

const abortError = () => { const e = new Error('Transcripción cancelada.'); e.name = 'AbortError'; return e; };
const check = (signal) => { if (signal && signal.aborted) throw abortError(); };
const tick = () => new Promise((r) => setTimeout(r, 0));

/* ------------------------------------------------------------------ modelo (carga perezosa) */
let loading = null;
let loaded = null;

async function loadEngine(backendPref, onProgress, signal) {
  if (loaded) return loaded;
  if (!loading) {
    loading = (async () => {
      onProgress && onProgress(0.03, 'Cargando el motor de transcripción…');
      const tf = await import(TF_URL);
      const order = backendPref ? [backendPref] : ['webgl', 'cpu'];
      let used = null;
      for (const b of order) {
        try { if (await tf.setBackend(b)) { await tf.ready(); used = tf.getBackend(); break; } } catch (e) { /* probar el siguiente */ }
      }
      if (!used) throw new Error('No se pudo iniciar ningún motor de cálculo (WebGL ni CPU).');
      onProgress && onProgress(0.06, 'Cargando el modelo…');
      const model = await tf.loadGraphModel(MODEL_URL);
      loaded = { tf, model, backend: used };
      return loaded;
    })().catch((e) => { loading = null; throw e; });
  }
  const r = await loading;
  check(signal);
  return r;
}

/** Libera el modelo y la memoria de TF.js (la próxima transcripción lo vuelve a cargar). */
export function disposeEngine() {
  if (loaded) { try { loaded.model.dispose(); } catch (e) { /* ya liberado */ } }
  loaded = null; loading = null;
}

/* ------------------------------------------------------------------ audio */

/** Blob/File/ArrayBuffer/AudioBuffer → Float32Array mono a 22050 Hz (remuestreado por el navegador). */
export async function toMono22k(input, { signal, maxSeconds = 300 } = {}) {
  const warnings = [];
  let buf;
  if (input && typeof input.getChannelData === 'function') buf = input;
  else {
    const Ctx = ctxClass();
    if (!Ctx) throw new Error('Este navegador no puede decodificar audio.');
    const bytes = input instanceof ArrayBuffer ? input : await input.arrayBuffer();
    check(signal);
    const ctx = new Ctx();
    try {
      buf = await ctx.decodeAudioData(bytes.slice ? bytes.slice(0) : bytes);
    } catch (e) {
      throw new Error('No se pudo leer el audio: el formato no es compatible con este navegador. Probá con MP3, M4A/AAC, WAV u OGG.');
    } finally { try { ctx.close(); } catch (e) { /* nada */ } }
  }
  check(signal);
  let seconds = buf.duration;
  const useSec = Math.min(seconds, maxSeconds);
  if (seconds > maxSeconds) warnings.push(`El audio dura ${Math.round(seconds)} s: se transcribieron sólo los primeros ${maxSeconds} s.`);
  const Off = offlineClass();
  const n = Math.max(1, Math.round(useSec * MODEL.sampleRate));
  const off = new Off(1, n, MODEL.sampleRate);
  const src = off.createBufferSource();
  src.buffer = buf;
  src.connect(off.destination);
  src.start(0);
  const rendered = await off.startRendering();
  const pcm = Float32Array.from(rendered.getChannelData(0));
  return { pcm, seconds: pcm.length / MODEL.sampleRate, warnings };
}

function normalize(pcm) {
  let peak = 0;
  for (let i = 0; i < pcm.length; i++) { const a = Math.abs(pcm[i]); if (a > peak) peak = a; }
  if (peak > 0 && peak < 0.5) { const g = Math.min(0.9 / peak, 10); for (let i = 0; i < pcm.length; i++) pcm[i] *= g; return g; }
  return 1;
}

/**
 * Corre el modelo por ventanas de 2 s con solape. Devuelve frames y onsets (T×88, Float32Array) ya unidos.
 */
async function runModel(pcm, eng, { onProgress, signal, p0 = 0.1, p1 = 0.88 }) {
  const { tf, model } = eng;
  const P = MODEL.nPitches;
  const padded = new Float32Array(pcm.length + OVERLAP / 2);
  padded.set(pcm, OVERLAP / 2);
  const nWin = Math.max(1, Math.ceil(padded.length / HOP));
  const totalFrames = Math.floor(pcm.length * (Math.floor(MODEL.sampleRate / MODEL.hop) / MODEL.sampleRate));
  const frames = new Float32Array(totalFrames * P), onsets = new Float32Array(totalFrames * P);
  let done = 0;
  const win = new Float32Array(WIN);
  for (let w = 0; w < nWin && done < totalFrames; w++) {
    check(signal);
    win.fill(0);
    win.set(padded.subarray(w * HOP, Math.min(padded.length, w * HOP + WIN)));
    const x = tf.tensor(win, [1, WIN, 1], 'float32');
    let out;
    try {
      out = model.execute(x, ['Identity_1', 'Identity_2']);          // frames, onsets (Identity = contornos: no se usan)
      const [fr, on] = await Promise.all([out[0].data(), out[1].data()]);
      const take = Math.min(KEEP, totalFrames - done);
      for (let t = 0; t < take; t++) {
        const src = (KEEP_FROM + t) * P, dst = (done + t) * P;
        for (let p = 0; p < P; p++) { frames[dst + p] = fr[src + p]; onsets[dst + p] = on[src + p]; }
      }
      done += take;
    } finally {
      x.dispose();
      if (out) out.forEach((t) => t.dispose());
    }
    onProgress && onProgress(p0 + (p1 - p0) * ((w + 1) / nWin), 'Analizando el audio…');
    await tick();
  }
  return { frames, onsets, nFrames: totalFrames };
}

/**
 * Transcribe un audio a partitura. TODO ocurre en el dispositivo.
 * @param {Blob|File|ArrayBuffer|AudioBuffer} input
 * @param {{onProgress?:(fraction:number,msg:string)=>void, signal?:AbortSignal, maxSeconds?:number,
 *   bpm?:number, timeSig?:number[], mode?:'melodia'|'dos-manos', simplify?:boolean, title?:string, grid?:string, backend?:string}} [opts]
 * @returns {Promise<{score:object, notes:{midi:number,start:number,end:number,velocity:number}[],
 *   info:{seconds:number,bpm:number,bpmConfidence:number,key:string,noteCount:number,warnings:string[]}}>}
 */
export async function transcribeAudio(input, opts = {}) {
  const { onProgress = () => {}, signal, maxSeconds = 300 } = opts;
  if (!input) throw new Error('Falta el audio a transcribir.');
  if (!isSupported()) throw new Error('Este navegador no puede transcribir audio (falta WebAudio).');
  onProgress(0, 'Leyendo el audio…');
  const { pcm, seconds, warnings } = await toMono22k(input, { signal, maxSeconds });
  if (pcm.length < MODEL.sampleRate * 0.3) throw new Error('El audio es demasiado corto para transcribir.');
  const eng = await loadEngine(opts.backend, onProgress, signal);
  const gain = normalize(pcm);
  onProgress(0.1, 'Analizando el audio…');
  const t0 = Date.now();
  const { frames, onsets, nFrames } = await runModel(pcm, eng, { onProgress, signal });
  check(signal);
  onProgress(0.9, 'Armando la partitura…');
  await tick();
  const notes = framesToNotes(frames, onsets, nFrames, {});
  const { score, info } = notesToScore(notes, opts);
  info.seconds = seconds;
  info.warnings.unshift(...warnings);
  if (gain >= 5) info.warnings.push('El audio estaba muy bajo: se amplificó, y puede haber ruido de fondo en la transcripción.');
  info.engine = { name: 'basic-pitch', backend: eng.backend, ms: Date.now() - t0 };
  onProgress(1, 'Listo');
  return { score, notes, info };
}

/* ------------------------------------------------------------------ micrófono */

function micMessage(e) {
  const n = e && e.name;
  if (n === 'NotAllowedError' || n === 'SecurityError') return 'No hay permiso para usar el micrófono. Habilitalo en los ajustes del navegador para este sitio y volvé a intentar.';
  if (n === 'NotFoundError' || n === 'OverconstrainedError') return 'No se encontró ningún micrófono en este dispositivo.';
  if (n === 'NotReadableError' || n === 'AbortError') return 'El micrófono está siendo usado por otra aplicación. Cerrala y volvé a intentar.';
  return 'No se pudo acceder al micrófono: ' + ((e && e.message) || 'error desconocido') + '.';
}

/**
 * Graba con el micrófono SIN cancelación de eco, supresión de ruido ni control automático de ganancia (distorsionan las notas).
 * @returns {Promise<{stop():Promise<Blob>, cancel():void, done:Promise<Blob>}>} rechaza con un mensaje en español si falla el permiso.
 */
export async function recordFromMic({ maxSeconds = 120, onLevel } = {}) {
  if (!isMicSupported()) throw new Error('Este navegador no permite grabar con el micrófono.');
  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 } });
  } catch (e) { throw new Error(micMessage(e)); }
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
  const mimeType = types.find((t) => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || '';
  const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
  const chunks = [];
  let ctx = null, timer = null, auto = null, cancelled = false, finished = false;
  const cleanup = () => {
    finished = true;
    clearInterval(timer); clearTimeout(auto);
    stream.getTracks().forEach((t) => t.stop());
    if (ctx) { try { ctx.close(); } catch (e) { /* nada */ } }
  };
  let resolveDone, rejectDone;
  const done = new Promise((res, rej) => { resolveDone = res; rejectDone = rej; });
  done.catch(() => {});
  rec.ondataavailable = (ev) => { if (ev.data && ev.data.size) chunks.push(ev.data); };
  rec.onerror = (ev) => { cleanup(); rejectDone(new Error('Falló la grabación: ' + ((ev.error && ev.error.message) || 'error desconocido') + '.')); };
  rec.onstop = () => {
    cleanup();
    if (cancelled) { rejectDone(abortError()); return; }
    resolveDone(new Blob(chunks, { type: rec.mimeType || mimeType || 'audio/webm' }));
  };
  if (typeof onLevel === 'function') {
    try {
      const Ctx = ctxClass();
      ctx = new Ctx();
      const an = ctx.createAnalyser();
      an.fftSize = 1024;
      ctx.createMediaStreamSource(stream).connect(an);
      const data = new Float32Array(an.fftSize);
      timer = setInterval(() => {
        an.getFloatTimeDomainData(data);
        let s = 0; for (let i = 0; i < data.length; i++) s += data[i] * data[i];
        try { onLevel(Math.min(1, Math.sqrt(s / data.length) * 4)); } catch (e) { /* callback del usuario */ }
      }, 100);
    } catch (e) { /* sin medidor */ }
  }
  rec.start(1000);
  auto = setTimeout(() => { if (rec.state !== 'inactive') rec.stop(); }, Math.max(1, maxSeconds) * 1000);
  return {
    done,
    stop() { if (!finished && rec.state !== 'inactive') rec.stop(); return done; },
    cancel() { cancelled = true; if (!finished && rec.state !== 'inactive') rec.stop(); else cleanup(); },
  };
}
