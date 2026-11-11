// Entrada por micrófono: captura PCM (AudioWorklet, con ScriptProcessor de respaldo) y lo pasa al detector de notas.
// Seguro de importar en Node (no toca el DOM hasta start()).
import { createPitchTracker } from './pitch.js';

const NAME = 'Micrófono';

export function micErrorMessage(e) {
  const n = e && e.name;
  if (n === 'NotAllowedError' || n === 'SecurityError' || n === 'PermissionDeniedError') return 'Permiso de micrófono denegado. Habilitalo en los ajustes del navegador para este sitio.';
  if (n === 'NotFoundError' || n === 'DevicesNotFoundError' || n === 'OverconstrainedError') return 'No se encontró ningún micrófono en este dispositivo.';
  if (n === 'NotReadableError' || n === 'TrackStartError' || n === 'AbortError') return 'No se pudo usar el micrófono: otra aplicación lo está usando.';
  if (n === 'InsecureContextError') return 'El micrófono sólo funciona en una página segura (HTTPS).';
  return 'No se pudo activar el micrófono' + (e && e.message ? ': ' + e.message : '');
}

/** level: RMS en dBFS (−60..0) → 0..1 */
const dbToLevel = (rms) => { const db = 20 * Math.log10(rms + 1e-9); return Math.max(0, Math.min(1, (db + 60) / 60)); };

export function createMicInput({ onNoteOn, onStatus, getExpected, sensitivity = 0.5 } = {}) {
  const g = globalThis;
  const nav = g.navigator;
  const AC = g.AudioContext || g.webkitAudioContext;
  const supported = !!(nav && nav.mediaDevices && typeof nav.mediaDevices.getUserMedia === 'function' && AC);
  const status = (s) => { try { onStatus && onStatus({ name: NAME, via: 'mic', ...s }); } catch (e) { /* ignorar */ } };

  let sens = sensitivity;
  let stream = null, ctx = null, source = null, node = null, sink = null, tracker = null;
  let running = false, starting = null, sinceLevel = 0, peak = 0, gen = 0;

  function handleChunk(chunk) {
    if (!running || !tracker) return;
    let e = 0;
    for (let i = 0; i < chunk.length; i++) e += chunk[i] * chunk[i];
    const rms = Math.sqrt(e / (chunk.length || 1));
    if (rms > peak) peak = rms;
    sinceLevel += chunk.length;
    if (sinceLevel >= 0.08 * (ctx ? ctx.sampleRate : 44100)) { status({ connected: true, level: dbToLevel(peak) }); sinceLevel = 0; peak = 0; }
    try { tracker.push(chunk); } catch (err) { /* un error de análisis no debe cortar la captura */ }
  }

  function release() {
    running = false;
    try { if (node) { node.port && (node.port.onmessage = null); node.onaudioprocess = null; node.disconnect(); } } catch (e) { /* */ }
    try { source && source.disconnect(); } catch (e) { /* */ }
    try { sink && sink.disconnect(); } catch (e) { /* */ }
    try { stream && stream.getTracks().forEach((t) => { t.onended = null; t.stop(); }); } catch (e) { /* */ }
    try { ctx && ctx.state !== 'closed' && ctx.close(); } catch (e) { /* */ }
    stream = ctx = source = node = sink = tracker = null;
  }

  async function doStart(my) {
    if (!supported) {
      const error = (g.isSecureContext === false) ? micErrorMessage({ name: 'InsecureContextError' }) : 'Este navegador no permite usar el micrófono.';
      status({ connected: false, error });
      throw new Error(error);
    }
    try {
      stream = await nav.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 }, video: false });
    } catch (e) {
      const error = micErrorMessage(e);
      status({ connected: false, error });
      throw new Error(error);
    }
    if (my !== gen) { release(); return; } // se pidió detener mientras se esperaba el permiso
    try {
      ctx = new AC({ latencyHint: 'interactive' });
      if (ctx.state === 'suspended') await ctx.resume();
      tracker = createPitchTracker({
        sampleRate: ctx.sampleRate,
        sensitivity: sens,
        getExpected: () => { try { return (getExpected && getExpected()) || []; } catch (e) { return []; } },
        onNote: (m) => { try { onNoteOn && onNoteOn(m); } catch (e) { /* ignorar */ } },
      });
      source = ctx.createMediaStreamSource(stream);
      sink = ctx.createGain(); sink.gain.value = 0; sink.connect(ctx.destination);
      let usedWorklet = false;
      if (ctx.audioWorklet && typeof g.AudioWorkletNode === 'function') {
        try {
          await ctx.audioWorklet.addModule(new URL('./mic-worklet.js', import.meta.url).href);
          node = new g.AudioWorkletNode(ctx, 'pc-mic-capture', { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1 });
          node.port.onmessage = (ev) => handleChunk(ev.data);
          usedWorklet = true;
        } catch (e) { node = null; }
      }
      if (!usedWorklet) {
        node = ctx.createScriptProcessor(2048, 1, 1);
        node.onaudioprocess = (ev) => handleChunk(new Float32Array(ev.inputBuffer.getChannelData(0)));
      }
      if (my !== gen) { release(); return; }
      source.connect(node);
      node.connect(sink);
      running = true;
      const tr = stream.getAudioTracks && stream.getAudioTracks()[0];
      if (tr) tr.onended = () => { if (running) { release(); status({ connected: false, error: 'Se perdió el micrófono' }); } };
      status({ connected: true, level: 0 });
    } catch (e) {
      release();
      const error = 'No se pudo iniciar la captura de audio' + (e && e.message ? ': ' + e.message : '');
      status({ connected: false, error });
      throw new Error(error);
    }
  }

  return {
    supported,
    /** Llamar desde un gesto del usuario (clic). */
    start() {
      if (running) return Promise.resolve();
      if (!starting) starting = doStart(++gen).finally(() => { starting = null; });
      return starting;
    },
    stop() {
      gen++;
      const was = running || !!stream;
      release();
      if (was) status({ connected: false });
    },
    setSensitivity(x) { sens = x; if (tracker) tracker.setSensitivity(x); },
    get running() { return running; },
  };
}
