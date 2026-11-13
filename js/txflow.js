// Pantallas de "Transcribir desde un audio" y "Grabar la melodía" (sobre js/transcribe.js, js/transcribe-core.js y js/capture.js).
// Un solo panel (#sheet-tx) con etapas: choose → recording → progress → result; take → taking → result.
// Todo se procesa en el dispositivo: el audio nunca se sube y no se descarga audio de otros servicios.
import { createTake, takeToScore } from "./capture.js";
import { createMetronome } from "./metronome.js";
import { midiName, keyToMidi } from "./model.js";

export const ENGINE_CACHE = "pianocheck-engine-v1";                       // mismo nombre que en sw.js
export const ENGINE_MB = "2";                                              // peso aproximado del motor (se ajusta al cerrar el vendor)
const MODEL_PATH = "vendor/basic-pitch/model.json";
const MAX_RECORD_S = 120;
const TS_OPTIONS = ["4/4", "3/4", "2/4", "6/8", "2/2", "12/8"];

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s) % 60).padStart(2, "0")}`;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/** Primeras notas de la melodía (mano derecha, o la izquierda si no hay) como "Mi4 Mi4 Fa4 Sol4". */
export function firstNotesText(score, n = 8) {
  const out = [];
  for (const m of score.measures || []) {
    for (const hand of ["rh", "lh"]) {
      if (hand === "lh" && out.length) continue;
      for (const ev of m[hand] || []) {
        if (!ev.k || !ev.k.length) continue;
        const mi = keyToMidi(ev.k[ev.k.length - 1]);
        if (mi != null) out.push(midiName(mi));
        if (out.length >= n) return out.join(" ");
      }
    }
    if (out.length) break;
  }
  return out.join(" ");
}

/** ¿El motor de transcripción ya está guardado en este dispositivo? */
export async function engineCached() {
  try {
    if (typeof caches === "undefined") return false;
    if (!(await caches.has(ENGINE_CACHE))) return false;
    const c = await caches.open(ENGINE_CACHE);
    const url = new URL(MODEL_PATH, document.baseURI).href;
    return !!(await c.match(url, { ignoreSearch: true }));
  } catch (e) { return false; }
}

/**
 * deps: { $, toast, getSettings(), lazy(name), midi:{ connected():bool, usb():Promise, ble():Promise, supported:{usb,ble} },
 *   openReview({score, warnings, note, kind}), polish(score, ctx):Promise<score|null>, accompany(score):score, onClose() }
 */
export function createTxFlow(deps) {
  const { $, toast } = deps;
  const root = $("sheet-tx");
  const stages = Array.from(root.querySelectorAll(".tx-stage"));
  const metro = createMetronome();
  let ctx = null;                       // { title, artist, sourceUrl }
  let st = null;                        // estado de la sesión
  let opener = null;
  let tx = null;                        // módulo transcribe.js (carga perezosa)

  const fresh = () => ({ stage: "choose", abort: null, rec: null, notes: null, info: null, origin: "transcrita", mode: "melodia", bpm: 100, ts: [4, 4], edited: { bpm: false, ts: false },
    take: null, takeLive: false, takeTimer: 0, takeT0: 0, takeSrc: "midi", takeMetro: false, takeBpm: 80, token: 0, title: "" });
  st = fresh();

  const showStage = (name) => { st.stage = name; stages.forEach((s) => { s.hidden = s.dataset.stage !== name; }); };
  const setErr = (msg) => { const e = $("tx-err"); e.hidden = !msg; e.textContent = msg || ""; };
  const isOpen = () => !root.hidden;

  async function loadTx() {
    if (tx) return tx;
    tx = await deps.lazy("transcribe");
    return tx;
  }
  const supportedAudio = async () => { try { return (await loadTx()).isSupported(); } catch (e) { return false; } };
  const supportedMic = async () => { try { return (await loadTx()).isMicSupported(); } catch (e) { return false; } };

  function setCtx(c) {
    ctx = c && c.title ? { title: c.title, artist: c.artist || "", sourceUrl: c.sourceUrl || "" } : null;
    const el = $("tx-ctx"); el.hidden = !ctx;
    if (ctx) el.innerHTML = `Para <b>«${esc(ctx.title)}»</b>${ctx.artist ? ` de ${esc(ctx.artist)}` : ""}. La partitura conserva ese título y el artista.`;
  }

  /* ---------------------------------------------------------------- abrir / cerrar */
  function openSheet(c, stage) {
    opener = document.activeElement;
    st = fresh();
    setCtx(c);
    setErr("");
    root.hidden = false;
    showStage(stage);
  }
  function cancelAll() {
    st.token++;
    if (st.abort) { try { st.abort.abort(); } catch (e) { /* nada */ } st.abort = null; }
    if (st.rec) { try { st.rec.cancel(); } catch (e) { /* nada */ } st.rec = null; }
    stopTake(true);
    metro.stop();
  }
  function close() {
    cancelAll();
    root.hidden = true;
    if (opener && opener.focus) { try { opener.focus({ preventScroll: true }); } catch (e) { /* nada */ } }
    deps.onClose && deps.onClose();
  }
  $("tx-close").addEventListener("click", close);
  root.addEventListener("click", (e) => { if (e.target === root) { if (st.stage === "progress" || st.stage === "recording" || st.stage === "taking") return; close(); } });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen() && $("confirm").hidden && $("busy").hidden && !["progress", "recording", "taking"].includes(st.stage)) close(); });

  /* ---------------------------------------------------------------- elegir */
  async function openChoose(c) {
    openSheet(c, "choose");
    $("tx-h").textContent = "Transcribir desde un audio";
    const ok = await supportedAudio(), mic = await supportedMic();
    $("tx-pick").disabled = !ok; $("tx-rec").disabled = !(ok && mic);
    const cached = await engineCached();
    $("tx-engine-note").textContent = !ok ? "Este navegador no puede transcribir audio (falta WebAudio)."
      : cached ? "El motor de transcripción ya está guardado en este dispositivo: funciona sin conexión."
        : `La primera vez se descarga el motor de transcripción (unos ${ENGINE_MB} MB). Queda guardado en el dispositivo y después funciona sin conexión.`;
    $("tx-pick").focus({ preventScroll: true });
  }
  $("tx-pick").addEventListener("click", () => $("file-audio").click());
  $("file-audio").addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0]; e.target.value = "";
    if (!f) return;
    if (!isOpen()) openSheet(ctx, "choose");
    st.title = ctx ? ctx.title : f.name.replace(/\.[^.]+$/, "");
    st.origin = "transcrita";
    runTranscribe(f, { mode: "melodia" });
  });

  /* ---------------------------------------------------------------- micrófono (audio para transcribir) */
  $("tx-rec").addEventListener("click", () => startMicRecord({ forTake: false }));
  async function startMicRecord({ forTake, bpm }) {
    setErr("");
    const t = await loadTx();
    const token = ++st.token;
    let rec;
    try {
      rec = await t.recordFromMic({ maxSeconds: MAX_RECORD_S, onLevel: (v) => { $("tx-level").style.width = `${Math.round(v * 100)}%`; } });
    } catch (e) { if (token === st.token) { setErr(e.message || "No se pudo usar el micrófono."); showStage(forTake ? "take" : "choose"); } return; }
    if (token !== st.token) { rec.cancel(); return; }
    st.rec = rec; st.recT0 = performance.now();
    st.origin = forTake ? "grabada" : "transcrita";
    st.title = ctx ? ctx.title : forTake ? "Melodía grabada" : "Grabación";
    showStage("recording");
    $("tx-rec-hint").textContent = forTake ? "Tocá o cantá la melodía. Con metrónomo, usá auriculares." : "Tocá o cantá la melodía cerca del micrófono, o poné un audio sonando cerca.";
    $("tx-clock").textContent = "0:00";
    clearInterval(st.recTimer);
    st.recTimer = setInterval(() => { const s = (performance.now() - st.recT0) / 1000; $("tx-clock").textContent = clock(s); }, 250);
    st.recOpts = { forTake, bpm };
    rec.done.then(() => { if (st.rec === rec && st.stage === "recording") finishMic(); }).catch(() => { /* cancelado */ });
    if (forTake && bpm) startClicks(bpm, false);
  }
  async function finishMic() {
    const rec = st.rec; if (!rec) return;
    st.rec = null; clearInterval(st.recTimer); metro.stop();
    let blob;
    try { blob = await rec.stop(); } catch (e) { setErr(e && e.name === "AbortError" ? "" : e.message || "La grabación falló."); showStage(st.recOpts && st.recOpts.forTake ? "take" : "choose"); return; }
    const o = st.recOpts || {};
    runTranscribe(blob, { mode: "melodia", bpm: o.bpm });
  }
  $("tx-rec-stop").addEventListener("click", finishMic);
  $("tx-rec-cancel").addEventListener("click", () => { const forTake = st.recOpts && st.recOpts.forTake; cancelAll(); clearInterval(st.recTimer); showStage(forTake ? "take" : "choose"); });

  /* ---------------------------------------------------------------- transcribir */
  async function runTranscribe(input, { mode = "melodia", bpm } = {}) {
    const token = ++st.token;
    const ctl = new AbortController(); st.abort = ctl;
    showStage("progress");
    setProg(0, "Preparando…");
    const cached = await engineCached();
    $("tx-prog-note").textContent = cached ? "" : `Primera vez: se descarga el motor de transcripción (unos ${ENGINE_MB} MB). Queda guardado para usarlo sin conexión.`;
    try {
      const t = await loadTx();
      const opts = { mode, signal: ctl.signal, maxSeconds: 300, onProgress: (f, m) => { if (token === st.token) setProg(f, m); } };
      if (bpm) opts.bpm = bpm;
      const r = await t.transcribeAudio(input, opts);
      if (token !== st.token) return;
      st.abort = null;
      st.notes = r.notes; st.info = r.info;
      st.mode = mode; st.edited = { bpm: !!bpm, ts: false };
      st.bpm = Math.round(bpm || r.info.bpm || 100); st.ts = r.info.timeSig || [4, 4];
      st.seconds = r.info.seconds;
      showResult(r.score, r.info);
    } catch (e) {
      if (token !== st.token) return;
      st.abort = null;
      if (e && e.name === "AbortError") { showStage(st.recOpts && st.recOpts.forTake ? "take" : "choose"); return; }
      console.error(e);
      setErr((e && e.message) || "No se pudo transcribir el audio.");
      showStage(st.recOpts && st.recOpts.forTake ? "take" : "choose");
    }
  }
  function setProg(f, msg) {
    const p = Math.max(0, Math.min(1, Number(f) || 0));
    $("tx-prog-msg").textContent = msg || "";
    $("tx-prog-bar").style.width = `${Math.round(p * 100)}%`;
    $("tx-prog").setAttribute("aria-valuenow", String(Math.round(p * 100)));
  }
  $("tx-cancel").addEventListener("click", () => { const forTake = st.recOpts && st.recOpts.forTake; cancelAll(); showStage(forTake ? "take" : "choose"); });
  $("tx-again").addEventListener("click", () => { cancelAll(); setErr(""); if (st.takeSrc && st.origin === "grabada") showStage("take"); else showStage("choose"); });

  /* ---------------------------------------------------------------- resultado */
  let lastScore = null;
  async function requantize() {
    const core = await deps.lazy("transcribe-core");
    const opts = { mode: st.mode, title: st.title };
    if (st.edited.bpm) opts.bpm = st.bpm;
    if (st.edited.ts) opts.timeSig = st.ts;
    let r = null;
    if (st.stageSrc === "midi" && st.origin === "grabada") {
      // Toma en piano MIDI: grilla exacta (primer tiempo = metrónomo, o la primera nota si no hubo). Sólo falta el tempo si no se indicó.
      let bpm = st.edited.bpm ? st.bpm : 0, conf = 1;
      if (!bpm) { const r0 = core.notesToScore(st.notes, { mode: st.mode }); bpm = Math.round(r0.info.bpm || 80); conf = r0.info.bpmConfidence; }
      r = takeToScore(st.notes, { bpm, timeSig: st.ts, mode: st.mode, title: st.title, t0: st.takeMetro ? 0 : null });
      if (r && !st.edited.bpm) { r.info.bpmConfidence = conf; if (conf < 0.55) r.info.warnings.push("Tempo estimado: si lo conocés, indicalo con − y + (o grabá con metrónomo)."); }
    }
    if (!r) r = core.notesToScore(st.notes, opts);
    if (!st.edited.bpm) st.bpm = Math.round(r.info.bpm || st.bpm);
    if (!st.edited.ts) st.ts = r.info.timeSig || st.ts;
    r.info.seconds = st.seconds || r.info.seconds;
    return r;
  }
  function showResult(score, info) {
    lastScore = score;
    showStage("result");
    $("tx-title").value = st.title || (ctx && ctx.title) || "Transcripción";
    $("tx-polish").hidden = false;   // siempre visible: sin API key muestra la etiqueta y avisa al tocarlo
    $("tx-acc-wrap").hidden = !(st.origin === "grabada") || st.mode !== "melodia";
    renderResult(score, info);
    $("tx-open").focus({ preventScroll: true });
  }
  function renderResult(score, info) {
    document.querySelectorAll("#tx-mode button").forEach((b) => { const on = b.dataset.mode === st.mode; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
    $("tx-bpm").textContent = String(st.bpm);
    $("tx-ts").value = TS_OPTIONS.includes(`${st.ts[0]}/${st.ts[1]}`) ? `${st.ts[0]}/${st.ts[1]}` : "4/4";
    const conf = info.bpmConfidence;
    const confTxt = st.edited.bpm ? "indicado por vos" : conf >= 0.7 ? "confianza alta" : conf >= 0.45 ? "confianza media" : "confianza baja";
    const first = firstNotesText(score);
    $("tx-sum").innerHTML = `<b>${info.noteCount}</b> nota${info.noteCount === 1 ? "" : "s"} · <b>${score.measures.length}</b> ${score.measures.length === 1 ? "compás" : "compases"} · tonalidad <b>${esc(info.key || score.keySig)}</b> · tempo <b>${st.bpm}</b> (${confTxt})${first ? `<br>Primeras notas: <b>${esc(first)}</b>` : ""}`;
    $("tx-warns").innerHTML = (info.warnings || []).slice(0, 6).map((w) => `<li><svg class="ic sm" aria-hidden="true"><use href="#i-warn"/></svg><span>${esc(w)}</span></li>`).join("");
    $("tx-acc-wrap").hidden = !(st.origin === "grabada") || st.mode !== "melodia";
  }
  async function redo() {
    try { const r = await requantize(); lastScore = r.score; renderResult(r.score, r.info); } catch (e) { toast("No se pudo recalcular: " + e.message, 4000); }
  }
  $("tx-mode").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; st.mode = b.dataset.mode; redo(); });
  $("tx-bpm-dn").addEventListener("click", () => { st.bpm = Math.max(30, st.bpm - 1); st.edited.bpm = true; redo(); });
  $("tx-bpm-up").addEventListener("click", () => { st.bpm = Math.min(240, st.bpm + 1); st.edited.bpm = true; redo(); });
  $("tx-ts").addEventListener("change", () => { const [n, d] = $("tx-ts").value.split("/").map(Number); st.ts = [n, d]; st.edited.ts = true; redo(); });

  function finalScore() {
    const sc = JSON.parse(JSON.stringify(lastScore));
    sc.origin = st.origin;
    sc.title = $("tx-title").value.trim() || (ctx && ctx.title) || "Transcripción";
    if (ctx && ctx.artist) sc.artist = ctx.artist;
    if (ctx && /^https?:\/\/\S+$/i.test(ctx.sourceUrl || "")) sc.sourceUrl = ctx.sourceUrl;
    delete sc.id;
    return sc;
  }
  function noteFor(info) {
    const w = (info.warnings || []).length;
    return st.origin === "grabada"
      ? `Melodía grabada por vos${st.stageSrc === "midi" ? " (notas y tiempos exactos del piano)" : " (transcrita del micrófono)"}. Escuchala y corregí lo que haga falta antes de practicar.${w ? ` ${w} aviso${w > 1 ? "s" : ""} del motor.` : ""}`
      : `Transcrita de un audio, en este dispositivo. Escuchala y corregí las notas antes de practicar.${w ? ` El motor dejó ${w} aviso${w > 1 ? "s" : ""}.` : ""}`;
  }
  $("tx-open").addEventListener("click", async () => {
    if (!lastScore) return;
    let sc = finalScore();
    if (st.origin === "grabada" && st.mode === "melodia" && $("tx-acc").checked) { try { sc = deps.accompany(sc); } catch (e) { toast("No pude agregar el acompañamiento: " + e.message, 4000); } }
    const info = st.info || {};
    const warnings = (await requantizeWarnings());
    root.hidden = true; cancelAll();
    deps.openReview({ score: sc, warnings, note: noteFor({ warnings }), kind: st.origin, ctx });
  });
  async function requantizeWarnings() { try { const r = await requantize(); return r.info.warnings || []; } catch (e) { return []; } }
  $("tx-polish").addEventListener("click", async () => {
    if (!lastScore) return;
    const sc = finalScore();
    const out = await deps.polish(sc, ctx, st.mode);
    if (out) { root.hidden = true; cancelAll(); deps.openReview({ score: out, warnings: [], note: "Transcrita de un audio y pulida con IA. La IA puede haber cambiado notas: escuchala y revisala antes de practicar.", kind: st.origin, ctx }); }
  });

  /* ---------------------------------------------------------------- tocarla vos (MIDI o micrófono) */
  function syncTakeUi() {
    document.querySelectorAll("#take-src button").forEach((b) => { const on = b.dataset.src === st.takeSrc; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
    const midi = st.takeSrc === "midi", on = deps.midi.connected();
    $("take-midi-note").textContent = midi ? (on ? "Piano MIDI conectado: se guardan las notas y los tiempos exactos." : "No hay un piano MIDI conectado. Conectalo por USB o Bluetooth, o grabá con el micrófono.") : "Con el micrófono se transcribe lo que suena: tocá o cantá una sola melodía clara.";
    $("take-midi-btns").hidden = !midi || on;
    $("take-usb").disabled = !deps.midi.supported.usb; $("take-ble").disabled = !deps.midi.supported.ble;
    $("take-metro-row").hidden = !$("take-metro").checked;
    $("take-bpm").textContent = String(st.takeBpm);
    $("take-start").disabled = midi && !on;
  }
  async function openTake(c) {
    openSheet(c, "take");
    $("tx-h").textContent = "Grabar la melodía";
    st.takeSrc = deps.midi.connected() ? "midi" : "mic"; st.origin = "grabada";
    if (st.takeSrc === "mic" && !(await supportedMic())) st.takeSrc = "midi";
    syncTakeUi();
    $("take-start").focus({ preventScroll: true });
  }
  $("take-src").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; st.takeSrc = b.dataset.src; st.srcPicked = true; syncTakeUi(); });
  $("take-metro").addEventListener("change", syncTakeUi);
  $("take-bpm-dn").addEventListener("click", () => { st.takeBpm = Math.max(30, st.takeBpm - 5); syncTakeUi(); });
  $("take-bpm-up").addEventListener("click", () => { st.takeBpm = Math.min(200, st.takeBpm + 5); syncTakeUi(); });
  $("take-usb").addEventListener("click", () => deps.midi.usb().catch((e) => toast("USB: " + (e && e.message || e), 4500)));
  $("take-ble").addEventListener("click", () => deps.midi.ble().catch((e) => toast("Bluetooth: " + (e && e.message || e), 4500)));
  /** El estado de conexión MIDI cambió (lo llama la app). */
  function midiChanged() { if (isOpen() && st.stage === "take") { if (deps.midi.connected() && !st.srcPicked) st.takeSrc = "midi"; syncTakeUi(); } }

  function startClicks(bpm, countIn) {
    metro.setBpm(bpm); metro.setBeats(4);
    st.clickOff && st.clickOff();
    st.clickOff = metro.onBeat((i, info) => {
      if (countIn) {
        if (info.n < 4) { $("take-msg").textContent = `Entrada: ${i + 1}`; return; }
        if (info.n === 4 && !st.takeLive) { st.takeLive = true; st.take.begin(info.perf); st.takeT0 = performance.now(); $("take-msg").textContent = "¡Tocá la melodía!"; }
      }
    });
    metro.start();
  }
  $("take-start").addEventListener("click", async () => {
    setErr("");
    const useMetro = $("take-metro").checked;
    if (st.takeSrc === "mic") {
      st.title = ctx ? ctx.title : "Melodía grabada"; st.stageSrc = "mic";
      await startMicRecord({ forTake: true, bpm: useMetro ? st.takeBpm : undefined });
      return;
    }
    if (!deps.midi.connected()) { syncTakeUi(); return; }
    st.stageSrc = "midi"; st.title = ctx ? ctx.title : "Melodía grabada";
    st.take = createTake(); st.takeLive = false; st.takeMetro = useMetro;
    showStage("taking");
    $("take-clock").textContent = "0:00";
    st.takeT0 = performance.now();
    if (useMetro) { $("take-msg").textContent = "Entrada: 1"; startClicks(st.takeBpm, true); } else { st.takeLive = true; $("take-msg").textContent = "Tocá la melodía en el piano. Cuando termines, apretá «Terminar»."; }
    clearInterval(st.takeTimer);
    st.takeTimer = setInterval(() => {
      const s = (performance.now() - st.takeT0) / 1000;
      $("take-clock").textContent = st.takeLive ? clock(Math.max(0, s)) : "0:00";
      if (st.takeLive && st.take.count) $("take-msg").textContent = `${st.take.count} nota${st.take.count === 1 ? "" : "s"} grabada${st.take.count === 1 ? "" : "s"}…`;
    }, 300);
  });
  function stopTake(discard) {
    clearInterval(st.takeTimer); st.takeTimer = 0;
    st.clickOff && st.clickOff(); st.clickOff = null;
    metro.stop();
    if (discard) st.take = null;
  }
  $("take-cancel").addEventListener("click", () => { stopTake(true); showStage("take"); syncTakeUi(); });
  $("take-stop").addEventListener("click", async () => {
    const take = st.take; if (!take) return;
    const { notes } = take.finish(performance.now());
    stopTake(false);
    if (!notes.length) { toast("No se grabó ninguna nota.", 3200); showStage("take"); syncTakeUi(); return; }
    st.notes = notes; st.origin = "grabada"; st.mode = "melodia";
    st.edited = { bpm: st.takeMetro, ts: st.takeMetro }; st.bpm = st.takeBpm; st.ts = [4, 4];
    st.seconds = notes[notes.length - 1].end;
    try {
      const r = await requantize();
      st.info = r.info;
      showResult(r.score, r.info);
    } catch (e) { toast("No se pudo armar la partitura: " + e.message, 4500); showStage("take"); }
  });

  /** Entrada MIDI de la app: mientras se graba una toma, las notas van acá. Devuelve true si las consumió. */
  function midiNoteOn(m, vel, ts) { if (st.stage === "taking" && st.take && isOpen()) { if (st.takeLive || !st.takeMetro) st.take.noteOn(m, vel, ts || performance.now()); return true; } return false; }
  function midiNoteOff(m, ts) { if (st.stage === "taking" && st.take && isOpen()) { st.take.noteOff(m, ts || performance.now()); return true; } return false; }

  return {
    openChoose, openTake, close, midiNoteOn, midiNoteOff, midiChanged,
    get isOpen() { return isOpen(); },
    get capturing() { return isOpen() && st.stage === "taking"; },
    get stage() { return st.stage; },
    get notes() { return st.notes; },
  };
}
