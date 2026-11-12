// Reproductor de primera clase: barra de transporte (Play/Pausa, Detener, compás anterior/siguiente, barra de progreso por compás,
// velocidad, repetir, opciones) + controlador que une la agenda pura (playback.js) con el reproductor y con la pantalla anfitriona
// (Práctica o Revisión) mediante un "adapter". No dibuja partituras: sólo avisa en cada cuadro qué compás/paso suena.
import { buildSchedule, measureAtBeat } from "./playback.js";

export const SPEEDS = [0.5, 0.75, 1, 1.25];
const fmt = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
const ico = (n) => `<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;

/** Marcado de la barra. kind "practice": tres filas; "review": compacta (cerrar en vez de "Practicar"). */
export function transportHtml(kind) {
  const back = kind === "practice" ? "Practicar" : "Cerrar";
  const btns = kind === "practice"
    ? `<button class="lt-b lt-prev" aria-label="Compás anterior">${ico("prev")}</button>
       <button class="lt-b lt-stop" aria-label="Detener y volver al inicio">${ico("stop")}</button>
       <button class="lt-b lt-play" aria-label="Reproducir">${ico("play")}</button>
       <button class="lt-b lt-next" aria-label="Compás siguiente">${ico("skip")}</button>
       <button class="lt-b lt-speed" aria-label="Velocidad: 100 %. Tocá para cambiarla">100 %</button>
       <button class="lt-b lt-rep" aria-pressed="false" aria-label="Repetir">${ico("loop")}</button>
       <button class="lt-b lt-opts" id="lt-opts" aria-haspopup="dialog" aria-label="Opciones de escucha: manos, metrónomo, cuenta, volumen">${ico("sliders")}</button>`
    : `<button class="lt-b lt-prev" aria-label="Compás anterior">${ico("prev")}</button>
       <button class="lt-b lt-play" aria-label="Reproducir">${ico("play")}</button>
       <button class="lt-b lt-stop" aria-label="Detener y volver al inicio">${ico("stop")}</button>
       <button class="lt-b lt-next" aria-label="Compás siguiente">${ico("skip")}</button>
       <button class="lt-b lt-speed" aria-label="Velocidad: 100 %. Tocá para cambiarla">100 %</button>
       <button class="lt-b lt-rep" aria-pressed="false" aria-label="Repetir">${ico("loop")}</button>`;
  return `<div class="lt-info"><span class="lt-pos">Compás 1 de 1</span><span class="lt-bpm"></span><button class="btn lt-back">${back}</button></div>
    <div class="lt-scrub"><span class="lt-t0">0:00</span><input class="lt-range" type="range" min="0" max="1" step="any" value="0" aria-label="Posición. Arrastrá para ir a otro compás"><span class="lt-t1">0:00</span></div>
    <div class="lt-btns">${btns}</div><span class="sr lt-live" role="status" aria-live="polite"></span>`;
}

/**
 * createListen({ player, host, adapter, prefs, toast, kind })
 * adapter: { score(), practiceHands(), stepAt(beat) → paso | null, onOpen(), onClose(reason), onFrame({ beat, measure, step, notes, counting, playing }), onPlaying(bool), onPractice() }
 * prefs: { get(key), set(patch) }  (claves listenSpeed, listenRepeat, listenHands, listenMetro, listenCountIn, listenMuteMine, listenAlong, listenVolume)
 */
export function createListen({ player, host, adapter, prefs, toast = () => {}, kind = "practice", title = () => "" }) {
  host.innerHTML = transportHtml(kind);
  host.classList.add("lt", kind);
  host.hidden = true;
  const q = (s) => host.querySelector(s);
  const E = { pos: q(".lt-pos"), bpm: q(".lt-bpm"), t0: q(".lt-t0"), t1: q(".lt-t1"), range: q(".lt-range"), prev: q(".lt-prev"), stop: q(".lt-stop"), play: q(".lt-play"), next: q(".lt-next"), speed: q(".lt-speed"), rep: q(".lt-rep"), opts: q(".lt-opts"), back: q(".lt-back"), live: q(".lt-live") };
  const tr = player.transport;
  const O = { speed: 1, repeat: false, hands: "both", metro: false, countIn: false, muteMine: false, along: false, volume: 0.8 };
  const S = { open: false, sched: null, range: null, bpm: 80, autoExit: false, ui: 0, lastStep: -1, lastMeasure: -1, dragging: false, resumeOnVisible: false, ended: false, token: 0 };

  const loadPrefs = () => {
    const g = (k, d) => { const v = prefs.get(k); return v == null ? d : v; };
    O.speed = SPEEDS.includes(+g("listenSpeed", 1)) ? +g("listenSpeed", 1) : 1;
    O.repeat = !!g("listenRepeat", false); O.hands = ["both", "rh", "lh"].includes(g("listenHands", "both")) ? g("listenHands", "both") : "both";
    O.metro = !!g("listenMetro", false); O.countIn = !!g("listenCountIn", false); O.muteMine = !!g("listenMuteMine", false); O.along = !!g("listenAlong", false);
    O.volume = Math.max(0, Math.min(1, +g("listenVolume", 0.8)));
  };
  const save = (patch) => { if (!S.temp) prefs.set(patch); };
  const rate = () => (S.bpm * O.speed) / 60;
  const nMeasures = () => ((adapter.score() || {}).measures || []).length;
  const effHands = () => {
    let hs = O.hands === "both" ? ["rh", "lh"] : [O.hands];
    const mine = adapter.practiceHands();
    if (O.muteMine && mine !== "both") hs = hs.filter((h) => h !== mine);
    return hs;
  };

  /** (Re)arma la agenda y se la entrega al planificador sin mover la posición. */
  function build() {
    const sc = adapter.score(); if (!sc) return false;
    const r = S.range;
    S.sched = buildSchedule(sc, { from: r ? r.from : 0, to: r ? r.to : undefined, hands: effHands() });
    const s = S.sched;
    S.byBeat = new Map();
    s.events.forEach((e) => { const k = Math.round(e.beat * 1e4); (S.byBeat.get(k) || S.byBeat.set(k, []).get(k)).push(e); });
    const keep = tr.playing || S.loaded ? tr.position() : s.startBeat;
    tr.load({ events: [...s.countIn, ...s.clicks, ...s.events], startBeat: s.startBeat, endBeat: s.endBeat, loop: O.repeat, position: keep });
    tr.setRate(rate());
    player.setMetronome(O.metro); player.setVolume(O.volume);
    S.loaded = true;
    return true;
  }

  function sync() {
    const playing = tr.playing, s = S.sched;
    if (E.play) {
      E.play.querySelector("use").setAttribute("href", playing ? "#i-pause" : "#i-play");
      E.play.setAttribute("aria-label", playing ? "Pausar" : S.ended ? "Reproducir otra vez" : "Reproducir");
      E.play.classList.toggle("on", playing);
    }
    if (E.speed) { E.speed.textContent = `${Math.round(O.speed * 100)} %`; E.speed.setAttribute("aria-label", `Velocidad: ${Math.round(O.speed * 100)} % del tempo, ${Math.round(S.bpm * O.speed)} negras por minuto. Tocá para cambiarla`); }
    if (E.bpm) E.bpm.textContent = `♩ ${Math.round(S.bpm * O.speed)} BPM`;
    if (E.rep) { E.rep.setAttribute("aria-pressed", String(O.repeat)); E.rep.setAttribute("aria-label", O.repeat ? "Repetir: activado" : "Repetir: apagado"); }
    if (E.back) { E.back.textContent = S.ended && kind === "practice" ? "Practicar ahora" : S.autoExit ? "Volver" : kind === "practice" ? "Practicar" : "Cerrar"; E.back.classList.toggle("primary", S.ended && kind === "practice"); }
    if (E.range && s) { E.range.min = s.from; E.range.max = s.to + 1; }
    if (adapter.onPlaying) adapter.onPlaying(playing);
    updateMedia();
  }

  function frame() {
    const s = S.sched; if (!s || !S.open) return;
    const pos = tr.position(), counting = pos < s.startBeat - 1e-6;
    const beat = Math.max(s.startBeat, Math.min(pos, s.endBeat - 1e-6));
    const m = measureAtBeat(s.lay, beat);
    const rt = rate(), tot = (s.endBeat - s.startBeat) / rt;
    if (!S.dragging) {
      if (E.range) E.range.value = String(m + Math.min(0.999, (beat - s.lay.starts[m]) / s.lay.lens[m]));
      if (E.t0) E.t0.textContent = fmt((beat - s.startBeat) / rt);
      if (E.pos) E.pos.textContent = counting ? "Cuenta de entrada" : `Compás ${m + 1} de ${nMeasures()}`;
      if (E.range) E.range.setAttribute("aria-valuetext", `Compás ${m + 1} de ${nMeasures()}, ${fmt((beat - s.startBeat) / rt)} de ${fmt(tot)}`);
    }
    if (E.t1) E.t1.textContent = fmt(tot);
    if (adapter.onSound) {   // notas que suenan ahora (para mantener encendidas las teclas y llenar la barra de duración)
      const act = counting ? [] : s.events.filter((e) => e.beat <= beat + 1e-6 && beat < e.beat + e.dur - 1e-6);
      adapter.onSound({ beat, playing: tr.playing, rate: rt, events: act, counting });
    }
    const step = adapter.stepAt(beat);
    const si = step ? step.i : -1;
    if (si !== S.lastStep || m !== S.lastMeasure || S.forceFrame) {
      S.lastStep = si; S.lastMeasure = m; S.forceFrame = false;
      const notes = step ? S.byBeat.get(Math.round(step.t * 1e4)) || [] : [];
      adapter.onFrame({ beat, measure: m, step, notes, counting, playing: tr.playing });
    }
  }
  const startUi = () => { clearInterval(S.ui); S.ui = setInterval(frame, 40); };
  const stopUi = () => { clearInterval(S.ui); S.ui = 0; };
  const say = (t) => { if (E.live) E.live.textContent = t; };

  /* ---------- transporte ---------- */
  async function play() {
    if (!S.open) return false;
    const my = ++S.token;
    let ok = false;
    try { ok = await player.unlock(); } catch (e) { toast(e.message || "No se pudo reproducir el audio.", 3600); sync(); return false; }
    if (!S.open || my !== S.token) return false;
    if (!ok) { toast("El navegador bloqueó el audio. Tocá Play otra vez para activarlo.", 4200); sync(); return false; }
    if (!S.sched || !S.loaded) build();
    if (!S.sched.events.length) { toast("No hay notas en esa selección de manos."); sync(); return false; }
    const s = S.sched, atStart = tr.position() <= s.startBeat + 1e-6;
    tr.play(undefined, { lead: O.countIn && atStart ? s.unit * s.countIn.length : 0 });
    S.ended = false; S.resumeOnVisible = false; S.forceFrame = true;
    startUi(); frame(); sync(); say("Reproduciendo");
    return true;
  }
  function pause(auto) {
    if (!S.open) return;
    ++S.token;
    if (tr.playing) tr.pause();
    S.forceFrame = true; frame(); sync(); say("En pausa");
    if (auto) S.resumeOnVisible = document.visibilityState !== "visible";
  }
  const toggle = () => (tr.playing ? (pause(), Promise.resolve(false)) : play());
  function stop() {
    if (!S.open) return;
    ++S.token;
    tr.stop(); if (player.synth && player.ctx) player.synth.allOff(player.ctx.currentTime);
    S.ended = false; S.forceFrame = true; frame(); sync(); say("Detenido");
  }
  function seekMeasure(m) {
    const s = S.sched; if (!s || !S.open) return;
    m = Math.max(s.from, Math.min(s.to, Math.round(m)));
    tr.seek(s.lay.starts[m]); S.ended = false; S.forceFrame = true; frame(); sync();
  }
  function step(d) {
    const s = S.sched; if (!s || !S.open) return;
    const pos = tr.position(), m = measureAtBeat(s.lay, Math.max(s.startBeat, pos));
    if (d < 0) seekMeasure(pos - s.lay.starts[m] > 0.75 ? m : m - 1);
    else seekMeasure(m + 1);
  }
  function onEnded() {
    if (!S.open) return;
    S.ended = true; S.forceFrame = true; frame(); sync(); say("Terminó");
    if (S.autoExit) close("end");
  }
  function onInterrupt() {
    if (!S.open) return;
    S.forceFrame = true; frame(); sync(); say("En pausa");
    if (document.visibilityState !== "visible") S.resumeOnVisible = true;
    else toast("El audio se interrumpió. Tocá Play para seguir.", 3600);
  }

  /** Abre el modo escucha. o: { range, bpm, speed, hands, repeat, autoplay, autoExit, temp } (los valores sueltos no se guardan en los ajustes). */
  function open(o = {}) {
    if (S.open) close("silent");
    loadPrefs();
    S.temp = !!o.temp;
    if (o.speed != null) O.speed = o.speed;
    if (o.hands) O.hands = o.hands;
    if (o.repeat != null) O.repeat = !!o.repeat;
    S.range = o.range || null; S.bpm = Math.max(20, Number(o.bpm) || 80); S.autoExit = !!o.autoExit;
    S.ended = false; S.loaded = false; S.lastStep = -2; S.lastMeasure = -1; S.forceFrame = true;
    S.open = true; host.hidden = false;
    player.onEnd = onEnded; player.onInterrupt = onInterrupt;
    if (!build()) { S.open = false; host.hidden = true; return false; }
    adapter.onOpen && adapter.onOpen();
    frame(); sync(); setMedia();
    if (o.autoplay) play();
    return true;
  }
  function close(reason = "stop") {
    if (!S.open) return;
    ++S.token;
    S.open = false; stopUi();
    if (tr.playing) tr.stop(); else tr.stop();
    if (player.synth && player.ctx) player.synth.allOff(player.ctx.currentTime);
    if (player.onEnd === onEnded) player.onEnd = null;
    if (player.onInterrupt === onInterrupt) player.onInterrupt = null;
    host.hidden = true; S.loaded = false; S.resumeOnVisible = false;
    clearMedia();
    adapter.onClose && adapter.onClose(reason);
  }

  /* ---------- opciones ---------- */
  function setSpeed(x) { O.speed = x; save({ listenSpeed: x }); if (S.sched) tr.setRate(rate()); S.forceFrame = true; frame(); sync(); }
  function setRepeat(b) { O.repeat = !!b; save({ listenRepeat: O.repeat }); tr.setLoop(O.repeat); sync(); }
  function setHands(h) { O.hands = h; save({ listenHands: h }); S.open && build(); S.forceFrame = true; sync(); }
  function setMetro(b) { O.metro = !!b; save({ listenMetro: O.metro }); player.setMetronome(O.metro); tr.resync(); }
  function setCountIn(b) { O.countIn = !!b; save({ listenCountIn: O.countIn }); }
  function setMuteMine(b) { O.muteMine = !!b; save({ listenMuteMine: O.muteMine }); S.open && build(); S.forceFrame = true; }
  function setAlong(b) { O.along = !!b; save({ listenAlong: O.along }); }
  function setVolume(v) { O.volume = Math.max(0, Math.min(1, +v || 0)); save({ listenVolume: O.volume }); player.setVolume(O.volume); }
  /** Cambió la partitura (p. ej. se editó una nota): se vuelve a armar la agenda en la próxima reproducción. */
  function invalidate() { if (!S.open) return; if (tr.playing) stop(); S.loaded = false; build(); S.forceFrame = true; frame(); sync(); }

  /* ---------- eventos de la barra ---------- */
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  on(E.play, "click", () => { toggle(); });
  on(E.stop, "click", stop);
  on(E.prev, "click", () => step(-1));
  on(E.next, "click", () => step(1));
  on(E.speed, "click", () => setSpeed(SPEEDS[(SPEEDS.indexOf(O.speed) + 1) % SPEEDS.length]));
  on(E.rep, "click", () => setRepeat(!O.repeat));
  on(E.back, "click", () => { if (kind === "practice" && adapter.onPractice) adapter.onPractice(); else close("stop"); });
  on(E.range, "input", () => {
    const s = S.sched; if (!s) return;
    S.dragging = true;
    const m = Math.max(s.from, Math.min(s.to, Math.floor(+E.range.value)));
    if (E.pos) E.pos.textContent = `Compás ${m + 1} de ${nMeasures()}`;
    if (E.t0) E.t0.textContent = fmt((s.lay.starts[m] - s.startBeat) / rate());
  });
  on(E.range, "change", () => { S.dragging = false; seekMeasure(Math.floor(+E.range.value)); });
  on(E.range, "keydown", (e) => {   // con el teclado la barra salta de a un compás (con step="any" el paso nativo sería minúsculo)
    const k = e.key;
    if (k === "ArrowRight" || k === "ArrowUp") { e.preventDefault(); step(1); }
    else if (k === "ArrowLeft" || k === "ArrowDown") { e.preventDefault(); step(-1); }
    else if (k === "Home") { e.preventDefault(); if (S.sched) seekMeasure(S.sched.from); }
    else if (k === "End") { e.preventDefault(); if (S.sched) seekMeasure(S.sched.to); }
  });
  on(E.range, "pointerup", () => { if (S.dragging) { S.dragging = false; seekMeasure(Math.floor(+E.range.value)); } });

  /* ---------- Media Session (pantalla de bloqueo / auriculares) ---------- */
  function setMedia() {
    const ms = typeof navigator !== "undefined" && navigator.mediaSession;
    if (!ms || kind !== "practice") return;
    try {
      const sc = adapter.score() || {};
      if (typeof MediaMetadata === "function") ms.metadata = new MediaMetadata({ title: title() || sc.title || "PianoCheck", artist: sc.artist || sc.composer || "PianoCheck", album: "PianoCheck" });
      const set = (a, fn) => { try { ms.setActionHandler(a, fn); } catch (e) { /* acción no soportada */ } };
      set("play", () => { play(); }); set("pause", () => pause()); set("stop", () => stop());
      set("previoustrack", () => step(-1)); set("nexttrack", () => step(1));
    } catch (e) { /* sin Media Session */ }
  }
  function updateMedia() { try { if (navigator.mediaSession && S.open && kind === "practice") navigator.mediaSession.playbackState = tr.playing ? "playing" : "paused"; } catch (e) { /* nada */ } }
  function clearMedia() {
    try {
      const ms = navigator.mediaSession; if (!ms || kind !== "practice") return;
      ["play", "pause", "stop", "previoustrack", "nexttrack"].forEach((a) => { try { ms.setActionHandler(a, null); } catch (e) { /* nada */ } });
      ms.playbackState = "none"; ms.metadata = null;
    } catch (e) { /* nada */ }
  }

  /* ---------- segundo plano ---------- */
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (!S.open) return;
      if (document.visibilityState === "visible") {
        // el navegador suspendió el audio mientras no mirábamos: se había pausado limpio, se retoma al volver
        if (S.resumeOnVisible) { S.resumeOnVisible = false; play(); }
        else if (tr.playing && player.ctx && player.ctx.state !== "running") pause(true);
      }
    });
    window.addEventListener("pagehide", () => { if (S.open && tr.playing) pause(); });
  }

  return {
    open, close, play, pause, toggle, stop, seekMeasure, step, invalidate, setSpeed, setRepeat, setHands, setMetro, setCountIn, setMuteMine, setAlong, setVolume,
    get isOpen() { return S.open; },
    get playing() { return tr.playing; },
    get options() { return { ...O }; },
    get speed() { return O.speed; },
    get bpm() { return S.bpm; },
    get along() { return O.along; },
    get schedule() { return S.sched; },
    get range() { return S.range; },
    position: () => tr.position(),
    refreshUi: () => { S.forceFrame = true; frame(); sync(); },
    loadPrefs,
  };
}
