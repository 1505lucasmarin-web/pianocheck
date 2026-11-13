// PianoCheck — UI y cableado de pantallas.
import { validateScore, buildSteps, midiName, midiToKey, keyToMidi } from "./model.js";
import { createSession } from "./engine.js";
import { createMidiInput } from "./midi.js";
import { suggestFingering } from "./fingering.js";
import { errorHand, handMarks } from "./step-feedback.js";
import { createMetronome } from "./metronome.js";
import { createRenderer } from "./render.js";
import { demoScore } from "./demo.js";
import { createKeyboard, describeMove, nearestMissing, computeRange } from "./keyboard.js";
import { findPhrases, phraseAt, repeatNotice, measureRangeText } from "./phrases.js";
import { phraseColor } from "./render.js";
import { buildShareUrl, decodeCfg, extractToken, maskKey, PROVIDER_NAMES } from "./share.js";
import { sameKind, normRange, isWholeRange, rangeText, passageSteps, currentPair, hardestMeasures, coverage, measureSummary, harderHand, handsWithNotes, attemptKey, equivalentAttempts, bestEquivalent, nextAction, mergePractice, latestPractice } from "./passage.js";
import { clickUnit, createPlayer } from "./playback.js";
import { createListen } from "./listen.js";
import { createTheory } from "./teoria.js";
import { parseMusicLink, resolveSong } from "./links.js";
import { searchSong, fetchEditionFile, classifyFailure, buildSearchLinks } from "./catalog.js";
import { PIECES, getPieceScore } from "./pieces.js";
import { analyzeScore, melodyOnly, addAccompaniment } from "./arrange.js";
import { windowFor, DEFAULT_WINDOW, measureStarts, measureStates, createPulse, beatMs, normMode, TIMING_ES, devText, trendText, timingAction, MODE_NAMES } from "./timing.js";
import { setDuration, moveHand, setFinger, shiftPitch, deleteNote, insertEvent, setComment, setReviewed, createHistory } from "./review.js";
import { detectIssues, needsImportCheck } from "./issues.js";
import { buildTaskFile, serializeTask, parseTaskFile, taskFileName, describeTask, MAX_TASK_BYTES, MAX_TASK_TEXT } from "./task.js";
import { buildSummary } from "./summary.js";
import { createAnnotateUI } from "./annotate-ui.js";
import { createRecorder, recorderSupported, extFor, clock, MAX_RECORD_MS } from "./recorder.js";
import { mountWelcome } from "./welcome.js";
import { createPdfProgress } from "./pdf-progress.js";
import { originKind, ORIGIN_NAMES, FILTERS, queryLibrary, filterCounts, draftsOf, isDraft, bestOf, buildLibraryExport, serializeLibrary, parseLibraryExport, planMerge, libraryFileName } from "./mylib.js";
import { createTxFlow } from "./txflow.js";
import { holdInfo, createHoldTracker, summarizeHolds, holdLine, holdWeakText, beatsText, normHoldMode, HOLD_MODE_NAMES, endRefOf } from "./hold.js";

const MAX_STREAK = 5;
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Los módulos de lectura/almacenamiento se cargan bajo demanda para que un fallo en uno no rompa el resto.
const lazy = (() => { const c = {}; return (n) => (c[n] ||= import(`./${n}.js`)); })();
const store = {
  list: async () => (await lazy("store")).listScores(),
  save: async (s) => (await lazy("store")).saveScore(s),
  get: async (id) => (await lazy("store")).getScore(id),
  del: async (id) => (await lazy("store")).deleteScore(id),
  settings: async () => { try { return (await (await lazy("store")).getSettings()) || {}; } catch (e) { return {}; } },
  saveSettings: async (o) => (await lazy("store")).saveSettings(o),
  addAttempt: async (a) => (await lazy("store")).addAttempt(a),
  summaries: async () => { try { return await (await lazy("store")).attemptSummaries(); } catch (e) { return {}; } },
  attempts: async (id) => { try { return await (await lazy("store")).listAttempts(id); } catch (e) { return []; } },
  theory: async () => (await lazy("store")).getTheoryProgress(),
  saveTheory: async (...a) => (await lazy("store")).saveTheoryResult(...a),
};

const DEFAULT_SETTINGS = { provider: "anthropic", apiKey: "", model: "", onscreenKeyboard: false, micSensitivity: 0.5, seenConnectHint: false, guide: true, showPhrases: true, scoreView: "continua", scoreTheme: "hoja", scoreSize: "mediano", countIn: false, lastPractice: {}, pulseWindow: 120, tasks: {}, hideMarks: false, lastSearch: null, timbre: "piano", listenSpeed: 1, listenRepeat: false, listenHands: "both", listenMetro: false, listenCountIn: false, listenMuteMine: false, listenAlong: false, listenVolume: 0.8, holdMode: "mostrar", showPaid: false };
let settings = { ...DEFAULT_SETTINGS };
let current = null;      // partitura en práctica / revisión
let hands = "both";
let session = null, steps = [];
let screen = "library";
let wakeLock = null;
let editState = null;    // {score, selected, history, isNew}
let importToken = 0;

/* ---------- utilidades ---------- */
const clone = (o) => JSON.parse(JSON.stringify(o));
function toast(msg, ms = 2600) {
  const t = $("toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.hidden = true), ms);
}
function newId() { return (crypto.randomUUID ? crypto.randomUUID() : "s" + Date.now() + Math.random().toString(36).slice(2)); }
const HANDS_ES = { rh: "mano derecha", lh: "mano izquierda" };
const LEVEL_ES = { principiante: "Principiante", intermedio: "Intermedio", pro: "Pro" };
const ic = (name, cls = "") => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

/* Diálogo de confirmación propio (en lugar de confirm() nativo). */
function confirmDialog({ title, text, yes = "Eliminar", no = "Cancelar", danger = true }) {
  return new Promise((resolve) => {
    $("confirm-title").textContent = title; $("confirm-text").textContent = text || "";
    $("confirm-yes").textContent = yes; $("confirm-no").textContent = no;
    $("confirm-yes").classList.toggle("danger", danger); $("confirm-yes").classList.toggle("solid", danger); $("confirm-yes").classList.toggle("primary", !danger);
    const opener = document.activeElement;
    const done = (v) => { $("confirm").hidden = true; $("confirm-yes").onclick = $("confirm-no").onclick = null; document.removeEventListener("keydown", onKey, true); opener && opener.focus && opener.focus(); resolve(v); };
    const onKey = (e) => { if (e.key === "Escape") { e.stopPropagation(); done(false); } };
    document.addEventListener("keydown", onKey, true);
    $("confirm-yes").onclick = () => done(true); $("confirm-no").onclick = () => done(false);
    $("confirm").hidden = false; $("confirm-no").focus();
  });
}

/* ---------- navegación ---------- */
const screens = ["library", "mylib", "search", "review", "practice", "result", "settings", "theory"];
const welcome = mountWelcome($("empty-state"));
function show(name, push = true) {
  const prev = screen;
  screen = name;
  screens.forEach((s) => ($("screen-" + s).hidden = s !== name));
  $("app").dataset.screen = name;
  if (prev === "library" && name !== "library") welcome.stop();
  if (prev === "practice" && name !== "practice") leavePractice();
  if (prev === "review" && name !== "review") { annoR.exit(true); lcR.close("silent"); }
  if (prev === "settings" && name !== "settings") { hideShareQr(); stopScan(); }
  if (prev === "theory" && name !== "theory") leaveTheory();
  if (prev === "search" && name === "library" && srch && srch.ctl) srch.ctl.abort();
  if (prev === "settings" && name === "search") resumeSearchAfterSettings();
  if (prev === "result" && name !== "result") discardTake();
  if (push && name !== "library" && prev !== name) history.pushState({ s: name }, "", "");
  if (name === "library") refreshLibrary();
  if (name === "mylib") refreshMyLib();
  if (name === "review") requestAnimationFrame(() => reviewR.redraw());
  if (name === "practice") requestAnimationFrame(() => practiceR.redraw());
}
function goLibrary() {
  if (history.state && history.state.s) { history.back(); return; }
  show("library", false);
}
window.addEventListener("popstate", () => {
  // El botón "atrás" del sistema vuelve a la biblioteca (o a la pantalla anterior lógica).
  if (screen === "settings" && prevBeforeSettings && prevBeforeSettings !== "library") { show(prevBeforeSettings, false); return; }
  if (!$("busy").hidden) { cancelImport(); return; }
  if (!$("sheet-new").hidden) { closeSheet(); return; }
  if (!$("sheet-arrange").hidden) { closeArrange(); return; }
  if (history.state && history.state.s === "search" && srch) { show("search", false); refreshSearchLocal(); return; }
  show("library", false);
});
let prevBeforeSettings = "library";

/* ---------- renderers ---------- */
const reviewR = createRenderer($("review-score"), { mode: "page", lockMode: true });   // Revisión siempre por página
const practiceR = createRenderer($("practice-score"));                               // Práctica: continua o por página (Ajustes)

/* Anotar: marcas a mano ancladas al compás, una capa por pantalla (Práctica y Revisión); el ojo las oculta/muestra en las dos. */
const annoPersist = { get: async (id) => (await lazy("store")).getAnnotations(id), save: async (id, d) => (await lazy("store")).saveAnnotations(id, d) };
const annoHidden = { getHidden: () => !!settings.hideMarks, setHidden: (v) => { settings.hideMarks = !!v; store.saveSettings({ hideMarks: !!v }).catch(() => {}); annoP.refresh(); annoR.refresh(); } };
const annoP = createAnnotateUI({ renderer: practiceR, host: $("practice-anno"), area: $("practice-area"), persist: annoPersist, toast, ...annoHidden, hint: "Dibujá sobre la partitura. Con dos dedos o con los botones de desplazamiento te movés. La evaluación queda en pausa mientras anotás.", onActive: (on, silent) => practiceAnnoMode(on, silent) });
const annoR = createAnnotateUI({ renderer: reviewR, host: $("review-anno"), area: $("review-area"), persist: annoPersist, toast, ...annoHidden, onActive: (on) => { $("review-annotate").setAttribute("aria-pressed", String(on)); if (on) { editState && (editState.selected = null); updateEditUi(); } } });
$("review-annotate").addEventListener("click", () => { if (annoR.isActive()) annoR.exit(); else annoR.enter(); });
/* ---------- reproductor (Play): motor compartido + barra de transporte en Práctica y en Revisión ---------- */
const player = createPlayer({ timbre: "piano" });
const lprefs = { get: (k) => settings[k], set: (p) => { Object.assign(settings, p); store.saveSettings(p).catch(() => {}); } };
/** Último paso (del render) cuyo instante ya pasó. */
function stepAtBeat(list, beat) {
  let lo = 0, hi = list.length - 1, best = null;
  while (lo <= hi) { const mid = (lo + hi) >> 1; if (list[mid].t <= beat + 1e-6) { best = list[mid]; lo = mid + 1; } else hi = mid - 1; }
  return best;
}
let lcLastCursor = -2;
const lcP = createListen({ player, host: $("lt-practice"), kind: "practice", prefs: lprefs, toast, title: () => (current && current.title) || "",
  adapter: {
    score: () => current, practiceHands: () => hands, stepAt: (b) => stepAtBeat(allSteps, b),
    onOpen: () => listenEnter(), onClose: (r) => listenLeave(r), onFrame: (f) => listenFrame(f), onSound: (f) => listenSound(f), onPlaying: (p) => listenPlaying(p),
    onPractice: () => lcP.close("practice"),
  } });
let reviewSteps = [];
const lcR = createListen({ player, host: $("lt-review"), kind: "review", prefs: lprefs, toast, title: () => (editState && editState.score.title) || "",
  adapter: {
    score: () => (editState ? editState.score : null), practiceHands: () => "both", stepAt: (b) => stepAtBeat(reviewSteps, b),
    onOpen: () => { $("review-play").classList.add("on"); },
    onClose: () => { $("review-play").classList.remove("on"); reviewR.setCursor(null); },
    onFrame: (f) => { if (f.step) reviewR.setCursor(f.step.i); },
    onPlaying: (p) => { const b = $("review-play"); b.querySelector("use").setAttribute("href", p ? "#i-pause" : "#i-play"); b.setAttribute("aria-label", p ? "Pausar la escucha" : "Escuchar la partitura (Play)"); if (p) requestWake(); },
  } });
function reviewListen() {
  if (!editState) return;
  if (lcR.isOpen) { lcR.toggle(); return; }
  if (annoR.isActive()) annoR.exit();
  const bpm = Math.max(30, Math.min(240, +$("review-bpm").value || editState.score.bpm || 80));
  lcR.open({ bpm, autoplay: true });
}
$("review-play").addEventListener("click", reviewListen);
let annoPaused = false;
function practiceAnnoMode(on, silent) {
  $("btn-anno").setAttribute("aria-pressed", String(on)); $("practice-pause").disabled = on;
  if (on) {
    stopListening(true); closePSheet(true); hideStuck();
    const live = isPulso() ? !!pulse : !!(session && session.state.status === "playing");
    annoPaused = live && !paused;
    if (annoPaused) setPaused(true);
  } else if (annoPaused) { annoPaused = false; if (!silent) setPaused(false); }
  if (!silent) refreshNext(); else $("practice-pause").disabled = false;
}
$("btn-anno").addEventListener("click", () => { if (annoP.isActive()) annoP.exit(); else annoP.enter(); });

/* Aspecto de la partitura: vista, hoja (tema) y tamaño. Se guardan en los ajustes y se aplican al instante. */
const LOOK_OPTS = { scoreView: ["continua", "pagina"], scoreTheme: ["hoja", "sepia", "oscuro"], scoreSize: ["chico", "mediano", "grande"] };
function normalizeLook() { for (const k in LOOK_OPTS) if (!LOOK_OPTS[k].includes(settings[k])) settings[k] = DEFAULT_SETTINGS[k]; }
function syncWinUi() { document.querySelectorAll("#set-win button").forEach((b) => { const on = +b.dataset.win === (settings.pulseWindow || DEFAULT_WINDOW); b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); }); }
$("set-win").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; settings.pulseWindow = +b.dataset.win; store.saveSettings({ pulseWindow: settings.pulseWindow }).catch(() => {}); syncWinUi(); });
function syncLookUi() {
  const mark = (id, attr, val) => document.querySelectorAll(`#${id} button`).forEach((b) => { const on = b.dataset[attr] === val; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
  mark("look-theme", "theme", settings.scoreTheme); mark("set-theme", "theme", settings.scoreTheme);
  mark("look-size", "size", settings.scoreSize); mark("set-size", "size", settings.scoreSize);
  mark("set-view", "view", settings.scoreView); mark("look-view", "view", settings.scoreView);
}
function applyLook() {
  normalizeLook();
  practiceR.setLook({ view: settings.scoreView === "pagina" ? "page" : "cont", theme: settings.scoreTheme, size: settings.scoreSize });
  reviewR.setLook({ theme: settings.scoreTheme, size: settings.scoreSize });
  syncLookUi(); syncWinUi();
}
function setLookPref(patch) {
  settings = { ...settings, ...patch };
  store.saveSettings(patch).catch(() => {});
  applyLook();
}
for (const [id, attr, key] of [["look-theme", "theme", "scoreTheme"], ["set-theme", "theme", "scoreTheme"], ["look-size", "size", "scoreSize"], ["set-size", "size", "scoreSize"], ["set-view", "view", "scoreView"], ["look-view", "view", "scoreView"]]) {
  $(id).addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setLookPref({ [key]: b.dataset[attr] }); });
}

/* ---------- biblioteca ---------- */
function fmtDate(ts) {
  if (!ts) return "";
  const d = new Date(ts), now = new Date();
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86400000);
  if (diff === 0) return "Hoy"; if (diff === 1) return "Ayer";
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" }).replace(".", "");
}
function cardHtml(s, demo, sum) {
  const n = (s.measures || []).length;
  const ver = s.derivedFrom ? `<span class="tag ver">Versión de «${esc(s.derivedFrom.title || "otra partitura")}»</span>` : "";
  const tags = s.measures ? [`${n} ${n === 1 ? "compás" : "compases"}`, `♩ ${s.bpm || 80}`, (s.timeSig || [4, 4]).join("/"), demo ? "" : fmtDate(s.updatedAt || s.createdAt)].filter(Boolean).map((t) => `<span class="tag">${esc(t)}</span>`).join("") + ver : ver;
  const lvl = LEVEL_ES[s.level] ? `<span class="tag level">${LEVEL_ES[s.level]}</span>` : "";   // sólo partituras viejas: las nuevas (modo auto) no llevan nivel
  const kind = demo ? null : originKind(s, { bundledIds: bundledIds() });
  const orig = kind ? `<span class="tag origin ${kind}">${ORIGIN_NAMES[kind]}</span>` : "";
  const draftTag = isDraft(s) ? `<span class="tag draft">Borrador</span>` : "";
  const art = s.artist ? `<div class="art">${esc(s.artist)}</div>` : "";
  const res = sum && sum.count
    ? `<div class="scores"><div class="sc best"><span>Mejor</span><b>${sum.best == null ? "—" : sum.best + "%"}</b></div><div class="sc"><span>Último</span><b>${sum.last}%</b></div></div><div class="mini" aria-hidden="true"><i style="width:${sum.best || 0}%"></i></div>`
    : `<div class="sc-none">Sin intentos todavía</div>`;
  const title = esc(s.title || "Sin título");
  return `<li class="card${isDraft(s) ? " is-draft" : ""}" data-id="${esc(s.id)}"><div class="card-top"><div class="t">${title}</div>${draftTag}${lvl}</div>${art}<div class="tags">${orig}${tags}</div>${res}
    <div class="row"><button class="btn primary grow" data-act="practice" aria-label="Practicar ${title}">${ic("hand", "sm")}Practicar</button>
    <button class="btn listen-btn" data-act="listen" aria-label="Escuchar ${title}">${ic("play", "sm")}Escuchar</button>
    ${!demo && /^https?:\/\//i.test(s.sourceUrl || "") ? `<a class="btn" href="${esc(s.sourceUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir el original de ${title} (se abre en otra pestaña)">${ic("ext", "sm")}Abrir original</a>` : ""}
    ${demo ? `<button class="btn" data-act="adddemo">${ic("plus", "sm")}Agregar a mi biblioteca</button><button class="btn" data-act="demokb" aria-label="Probar la demo con el teclado de pantalla">${ic("midi", "sm")}Probar con el teclado de pantalla</button>` : `<button class="btn" data-act="edit" aria-label="Editar ${title}">${ic("pencil", "sm")}Editar</button><button class="btn icon" data-act="arrange" aria-label="Arreglo de ${title}: solo melodía o acompañamiento" title="Arreglo">${ic("sliders")}</button><button class="btn icon" data-act="task" aria-label="Crear tarea con ${title}" title="Crear tarea">${ic("clip")}</button><button class="btn icon danger" data-act="del" aria-label="Eliminar ${title}">${ic("trash")}</button>`}</div></li>`;
}
let _bundled = null;
const bundledIds = () => (_bundled ||= new Set([demoScore.id, ...PIECES.flatMap((p) => p.versions.map((v) => v.score.id))]));
let continueInfo = null;
const id2score = (id, list) => (id === demoScore.id ? demoScore : (list || []).find((x) => x.id === id));
async function refreshLibrary() {
  refreshPendingPdf().catch(() => {});
  let list = [], sums = {};
  try { list = (await store.list()) || []; sums = await store.summaries(); } catch (e) { $("library-list").innerHTML = `<li class="empty">No se pudo leer la biblioteca: ${esc(e.message)}</li>`; return; }
  list = list.slice().sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  const isEmpty = list.length === 0;
  $("empty-state").hidden = !isEmpty;
  $("welcome-nav").hidden = !isEmpty;
  $("theory-card").hidden = isEmpty;
  const searchSlot = $(isEmpty ? "welcome-search-slot" : "library-search-slot");
  const searchForm = $("lib-search");
  if (searchForm.parentElement !== searchSlot) searchSlot.append(searchForm);
  $("library-section").hidden = list.length === 0;
  $("demo-section").hidden = list.length === 0;
  $("mylib-n").textContent = String(list.length); $("mylib-n").hidden = !list.length; $("open-mylib").setAttribute("aria-label", `Mi biblioteca: ${list.length} ${list.length === 1 ? "partitura" : "partituras"}`);
  const HOME_MAX = 4;
  $("lib-all").hidden = list.length <= HOME_MAX; $("lib-all-t").textContent = `Ver todas (${list.length})`;
  const dr = draftsOf(list), dc = $("draft-card");
  dc.hidden = !dr.length;
  if (dr.length) { $("draft-title").textContent = dr[0].title || "Sin título"; $("draft-sub").textContent = `${(dr[0].measures || []).length} compases · sin confirmar${dr.length > 1 ? ` · ${dr.length} borradores en total` : ""}`; dc.dataset.id = dr[0].id; }
  const ids = new Set(list.map((x) => x.id)); ids.add(demoScore.id);
  continueInfo = latestPractice(settings.lastPractice, (id) => ids.has(id));
  const cc = $("continue-card");
  cc.hidden = !continueInfo;
  if (continueInfo) {
    const sc = id2score(continueInfo.id, list), c = continueInfo, n = ((sc && sc.measures) || []).length;
    $("continue-title").textContent = (sc && sc.title) || "Sin título";
    const where = c.loop && c.from != null ? `Bucle ${rangeText({ from: c.from, to: c.to })}` : c.measure > 0 ? `Compás ${c.measure + 1}${n ? " de " + n : ""}` : "Desde el inicio";
    $("continue-sub").textContent = [where, c.hands === "rh" ? "Mano derecha" : c.hands === "lh" ? "Mano izquierda" : "Ambas manos", c.bpm ? `♩ ${c.bpm}` : ""].filter(Boolean).join(" · ");
    $("continue-go").setAttribute("aria-label", `Continuar práctica de ${(sc && sc.title) || "la pieza"}: ${$("continue-sub").textContent}`);
  }
  renderSearchCard();
  refreshTheoryCard();
  const tk = settings.tasks || {}, tIds = Object.keys(tk).filter((id) => list.some((x) => x.id === id)).sort((p, q) => (tk[q].at || 0) - (tk[p].at || 0));
  const tHtml = [];
  for (const id of tIds) tHtml.push(taskCardHtml(list.find((x) => x.id === id), tk[id], await store.attempts(id)));
  $("tasks-section").hidden = !tHtml.length;
  $("task-list").innerHTML = tHtml.join("");
  $("demo-list").innerHTML = cardHtml(demoScore, true, sums[demoScore.id]);
  $("library-list").innerHTML = list.slice(0, HOME_MAX).map((s) => cardHtml(s, false, sums[s.id])).join("");
}
async function resolveScore(id) {
  if (id === demoScore.id) return clone(demoScore);
  const s = await store.get(id);
  if (!s) throw new Error("No se encontró la partitura.");
  return validateScore(s).score;
}
async function addDemo() {
  const s = clone(demoScore); s.id = newId(); s.title = "Oda a la Alegría"; s.origin = "incluida";
  return store.save(s);
}
async function onCardClick(e) {
  const btn = e.target.closest("button[data-act]"); if (!btn) return;
  const card = btn.closest(".card"), id = card.dataset.id, act = btn.dataset.act;
  try {
    if (act === "practice") startPractice(await resolveScore(id));
    else if (act === "listen") startPractice(await resolveScore(id), { listen: true });
    else if (act === "demokb") await startOnscreen(await resolveScore(id));
    else if (act === "edit") openReview(await resolveScore(id), false);
    else if (act === "task") openTaskSheet(await resolveScore(id));
    else if (act === "arrange") openArrange(await resolveScore(id), "library");
    else if (act === "del") {
      const name = card.querySelector(".t").textContent;
      if (await confirmDialog({ title: "¿Eliminar esta partitura?", text: `«${name}» se borra de tu biblioteca junto con su historial de resultados. No se puede deshacer.`, yes: "Eliminar" })) { await store.del(id); if (settings.tasks && settings.tasks[id]) { delete settings.tasks[id]; await saveTasks(); } screen === "mylib" ? refreshMyLib() : refreshLibrary(); toast("Partitura eliminada"); }
    } else if (act === "adddemo") {
      await addDemo(); refreshLibrary(); toast("Agregada a tu biblioteca");
    }
  } catch (err) { toast("Error: " + err.message, 4000); }
}
$("library-list").addEventListener("click", onCardClick);
$("ml-list").addEventListener("click", onCardClick);
$("demo-list").addEventListener("click", onCardClick);
function startWelcomePractice(options = {}) {
  startPractice(clone(demoScore), { hands: "rh", ...options });
}
$("welcome-full").addEventListener("click", async () => {
  try {
    if (midiConnected || mic?.running || settings.onscreenKeyboard) startWelcomePractice();
    else await startOnscreen(clone(demoScore), { hands: "rh" });
  } catch (err) { toast("Error: " + err.message, 4000); }
});
$("welcome-listen").addEventListener("click", () => startWelcomePractice({ hands: "both", listen: true }));
$("welcome-connect").addEventListener("click", () => {
  startWelcomePractice();
  openPSheet("input");
});
$("welcome-pulse").addEventListener("click", () => {
  startWelcomePractice();
  openPSheet("tempo");
});
$("welcome-annotate").addEventListener("click", () => {
  startWelcomePractice();
  annoP.enter();
});
/** Entra a Práctica con el teclado de pantalla ya activado (sin pasar por Ajustes). Queda guardado en el ajuste. */
async function startOnscreen(score, options) {
  settings.onscreenKeyboard = true;
  store.saveSettings({ onscreenKeyboard: true }).catch(() => {});
  applyKeyboardSetting();
  startPractice(score, options);
  toast("Teclado de pantalla activado", 2200);
}
$("continue-go").addEventListener("click", async () => {
  const c = continueInfo; if (!c) return;
  try { startPractice(await resolveScore(c.id), { resume: c }); } catch (err) { toast("Error: " + err.message, 4000); }
});

/* ---------- hoja "Nueva partitura" ---------- */
// "Ajustar arreglo" (opcional): el nivel NO se elige; sólo se le puede pedir a la IA que deje la melodía, que agregue acompañamiento o, avanzado, algo más elaborado.
const ARRANGE_MODES = {
  auto: { level: "auto", style: "auto", name: "Automático", desc: "La IA elige la complejidad según lo que pide la pieza (registro, saltos, ritmo y armonía) y arranca de lo más sencillo que siga sonando a la canción." },
  melodia: { level: "auto", style: "melodia", name: "Solo melodía", desc: "Sólo la mano derecha, con el ritmo de la canción." },
  acomp: { level: "auto", style: "acompanamiento", name: "Agregar acompañamiento", desc: "La melodía en la derecha y un acompañamiento sencillo en la izquierda." },
  elaborado: { level: "pro", style: "acompanamiento", name: "Más elaborado", desc: "Arreglo completo, con acordes y un acompañamiento con movimiento. Es más difícil de tocar." },
};
let composeArrange = "auto", sheetOpener = null, importCtx = null;
const arrangeSegHtml = () => Object.entries(ARRANGE_MODES).map(([k, m]) => `<button type="button" data-arrange="${k}" class="${k === composeArrange ? "on" : ""}" aria-pressed="${k === composeArrange}">${m.name}</button>`).join("");
function setArrange(k) {
  if (!ARRANGE_MODES[k]) return;
  composeArrange = k;
  document.querySelectorAll("#adjust-seg button").forEach((b) => { const on = b.dataset.arrange === k; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
  $("adjust-now").textContent = ARRANGE_MODES[k].name; $("adjust-desc").textContent = ARRANGE_MODES[k].desc;
  document.querySelectorAll("#search-body [data-arrange]").forEach((b) => { const on = b.dataset.arrange === k; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
  const d = document.querySelector("#search-body .gen-desc"); if (d) d.textContent = ARRANGE_MODES[k].desc;
}
$("adjust-seg").addEventListener("click", (e) => { const b = e.target.closest("button[data-arrange]"); if (b) setArrange(b.dataset.arrange); });
setArrange("auto");
function setSheetPath(p) {
  document.querySelectorAll("#sheet-paths button").forEach((b) => { const on = b.dataset.path === p; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
  $("path-ai").hidden = p !== "ai"; $("path-import").hidden = p !== "import"; $("path-audio").hidden = p !== "audio";
}
document.querySelectorAll("#sheet-paths button").forEach((b) => b.addEventListener("click", () => setSheetPath(b.dataset.path)));
/** o.path "ai"|"import"; o.query texto inicial; o.importFor {title, artist, sourceUrl}: lo importado se guarda con esos datos. */
function openSheet(o = {}) {
  sheetOpener = document.activeElement;
  importCtx = o.importFor || null;
  setSheetPath(o.path || "ai");
  if (typeof o.query === "string") { $("compose-query").value = o.query; }
  const c = $("import-ctx"); c.hidden = !importCtx;
  if (importCtx) c.innerHTML = `Para <b>«${esc(importCtx.title)}»</b>${importCtx.artist ? ` de ${esc(importCtx.artist)}` : ""}. La partitura que importes conserva ese título, el artista y el enlace de la búsqueda.`;
  $("sheet-new").hidden = false;
  ($("path-import").hidden ? $("compose-query") : $("imp-pdf")).focus();
}
function closeSheet() { $("sheet-new").hidden = true; sheetOpener && sheetOpener.focus && screen === "library" && sheetOpener.focus(); }
$("btn-new").addEventListener("click", () => openSheet());
$("empty-new").addEventListener("click", () => openSheet({ path: "import" }));
$("sheet-close").addEventListener("click", closeSheet);
$("sheet-new").addEventListener("click", (e) => { if (e.target === $("sheet-new")) closeSheet(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("sheet-new").hidden && $("confirm").hidden && $("busy").hidden) closeSheet(); });
$("compose-query").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("compose-go").click(); } });
$("compose-artist").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("compose-go").click(); } });

/* ---------- pedir una canción con enlace ---------- */
// El enlace sólo sirve para saber qué canción es: no se descarga ni se escucha audio.
// link: null | { url, phase: "busy" | "confirm" | "album", warn?, hint? }
let link = null, linkCtl = null, queryTimer = 0;
function renderLink() {
  $("link-box").hidden = !link;
  $("link-busy").hidden = !(link && link.phase === "busy");
  $("link-confirm").hidden = !(link && link.phase === "confirm");
  const w = $("link-warn"); w.hidden = !(link && link.phase === "album"); w.textContent = link && link.phase === "album" ? "Ese enlace es de un álbum o lista: pegá el de una canción puntual." : "";
  $("compose-go").disabled = !!link && (link.phase === "busy" || link.phase === "album");
  $("compose-artist-wrap").hidden = !!link;
}
function resetLink() { if (linkCtl) { linkCtl.abort(); linkCtl = null; } link = null; renderLink(); }
function showConfirm(title, artist, msg, focus) {
  link.phase = "confirm";
  $("link-title").value = title || ""; $("link-artist").value = artist || "";
  $("link-found").innerHTML = msg;
  renderLink();
  if (focus) $("link-title").focus();
}
async function startResolve(text) {
  const parsed = parseMusicLink(text);
  if (!parsed) { resetLink(); return; }
  if (link && link.url === parsed.url) return;   // ya está resolviendo o confirmando ese mismo enlace
  if (linkCtl) linkCtl.abort();
  const ctl = new AbortController(); linkCtl = ctl;
  link = { url: parsed.url, phase: "busy", hint: link && link.hint };
  renderLink();
  let r;
  try { r = await resolveSong(parsed, { signal: ctl.signal }); } catch (e) { r = { title: "", artist: "", source: "none" }; }
  if (ctl !== linkCtl) return;   // cancelado o reemplazado
  linkCtl = null;
  if (r.needsTrack) { link.phase = "album"; renderLink(); return; }
  if (r.source === "none" || !r.title) {
    const other = parsed.service === "otro";
    showConfirm(link.hint || "", "", other ? "Ese enlace no es de un servicio de música que conozca (YouTube, Spotify, Apple Music, Deezer o SoundCloud). Escribí el nombre de la canción." : "No pude saber qué canción es. Escribí el nombre de la canción.", true);
    return;
  }
  showConfirm(r.title, r.artist, `Encontré: <b>«${esc(r.title)}»</b>${r.artist ? ` — ${esc(r.artist)}` : ""}. ¿Armo esta?`, false);
}
$("link-cancel").addEventListener("click", () => {
  if (!link || link.phase !== "busy") return;
  const c = linkCtl; linkCtl = null; if (c) c.abort();
  showConfirm(link.hint || "", "", "Cancelaste la búsqueda. Escribí el nombre de la canción.", true);
});
$("compose-query").addEventListener("input", () => {
  clearTimeout(queryTimer);
  queryTimer = setTimeout(() => { const v = $("compose-query").value; if (parseMusicLink(v)) startResolve(v); else if (link) resetLink(); }, 350);
});
$("compose-paste").addEventListener("click", async () => {
  let t = null;
  try { if (navigator.clipboard && navigator.clipboard.readText) t = await navigator.clipboard.readText(); } catch (e) { t = null; }
  const q = $("compose-query");
  if (t === null) { q.focus(); toast("No pude leer el portapapeles. Mantené apretado el campo y elegí Pegar.", 4500); return; }
  if (!t.trim()) { q.focus(); toast("No hay nada copiado.", 2600); return; }
  q.value = t.trim().slice(0, 400);
  clearTimeout(queryTimer);
  if (parseMusicLink(q.value)) startResolve(q.value); else { if (link) resetLink(); q.focus(); }
});
async function onComposeGo() {
  const raw = $("compose-query").value.trim();
  if (!raw) { toast("Escribí el título de una canción o pegá un enlace."); $("compose-query").focus(); return; }
  const parsed = parseMusicLink(raw);
  if (!parsed) { const artist = $("compose-artist").value.trim(); closeSheet(); $("compose-query").value = ""; $("compose-artist").value = ""; openSearch({ title: raw, artist }); return; }
  if (!link || link.url !== parsed.url) { startResolve(raw); return; }   // primero confirmar qué canción es
  if (link.phase !== "confirm") return;
  const title = $("link-title").value.trim();
  if (!title) { toast("Escribí el título de la canción."); $("link-title").focus(); return; }
  const artist = $("link-artist").value.trim();
  closeSheet(); $("compose-query").value = ""; resetLink();
  openSearch({ title, artist, sourceUrl: parsed.url });
}
/** Compartir desde otras apps (Android, share_target GET): ?title=…&text=…&url=… abre "Pedir una canción" con el enlace. */
function handleIncomingShare() {
  const q = new URLSearchParams(location.search);
  if (!(q.has("url") || q.has("text") || q.has("title"))) return;
  history.replaceState(history.state, "", location.pathname + location.hash);
  const url = q.get("url") || "", text = q.get("text") || "", title = (q.get("title") || "").trim();
  const p = parseMusicLink(url) || parseMusicLink(text) || parseMusicLink(title);
  if (!p) {
    const t = (text || title || url).trim();
    if (t) { openSheet({ query: t.slice(0, 400) }); toast("Recibí el texto que compartiste.", 2600); }
    return;
  }
  link = null; renderLink();
  openSheet({ query: p.url });
  if (title && !parseMusicLink(title)) link = { url: "", phase: "busy", hint: title.slice(0, 120) };
  startResolve(p.url);
}

/* ---------- importación ---------- */
const pdfProgress = createPdfProgress($("pdf-live"));
const busy = { open(title) { pdfProgress.clear(); $("busy-title").textContent = title; $("busy-log").textContent = ""; $("busy-err").hidden = true; $("busy-settings").hidden = true; $("busy-resume-pdf").hidden = true; $("busy-spinner").classList.remove("stop"); $("busy-close").textContent = "Cancelar"; $("busy").hidden = false; },
  log(msg) { $("busy-log").textContent = msg; },
  error(msg, needSettings) { $("busy-log").textContent = ""; $("busy-spinner").classList.add("stop"); $("busy-err").textContent = msg; $("busy-err").hidden = false; $("busy-settings").hidden = !needSettings; $("busy-close").textContent = "Cerrar"; },
  close() { $("busy").hidden = true; } };
let lastImportKind = "";
let pendingPdf = null;
function renderPendingPdf(job) {
  pendingPdf = job;
  $("pdf-resume-card").hidden = !job;
  if (!job) return;
  $("pdf-resume-title").textContent = job.file.name;
  const n = Object.keys(job.completed).length;
  $("pdf-resume-progress").textContent = n ? `${n} ${n === 1 ? "parte guardada" : "partes guardadas"}` : "Archivo listo para leer";
}
async function refreshPendingPdf() {
  renderPendingPdf(await (await lazy("store")).getPendingPdfImport());
}
function cancelImport() { if (composeAbort) { try { composeAbort.abort(); } catch (e) { /* nada */ } }
  importToken++; busy.close(); refreshPendingPdf().catch(() => {}); }
$("busy-close").addEventListener("click", cancelImport);
$("busy-settings").addEventListener("click", () => { cancelImport(); openSettings(); });

let composeAbort = null;
$("compose-go").addEventListener("click", onComposeGo);

const ORIGIN_OF = { photo: "foto", images: "imagenes", pdf: "pdf" };
async function digestPdf(file) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
async function resumePdf() {
  const job = pendingPdf;
  if (job) await runImport("pdf", [job.file], job.context, job);
}
$("pdf-resume-go").addEventListener("click", resumePdf);
$("busy-resume-pdf").addEventListener("click", resumePdf);
$("pdf-resume-discard").addEventListener("click", async () => {
  const job = pendingPdf;
  if (!job) return;
  if (!await confirmDialog({ title: "¿Descartar la importación?", text: "Se borra el avance guardado de este PDF.", yes: "Descartar", no: "Conservar" })) return;
  try { await (await lazy("store")).updatePendingPdfImport(job.id, () => null); await refreshPendingPdf(); }
  catch { toast("No se pudo descartar el avance guardado."); }
});
async function runImport(kind, files, ctxOverride, savedPdf) {
  files = Array.from(files || []); if (!files.length) return;
  if (kind === "task") { await runImportTask(files[0]); return; }
  let ctx = ctxOverride || importCtx; importCtx = null;   // datos de la búsqueda que originó la importación (título, artista, enlace)
  lastImportKind = kind;
  const pdfRange = savedPdf?.range ?? (kind === "pdf" ? $("pdf-pages").value.replace(/\s+/g, "") : "");
  const token = ++importToken;
  const alive = () => token === importToken;
  const needsAi = kind === "photo" || kind === "images" || kind === "pdf";
  let job = savedPdf, pdfStore;
  busy.open(needsAi ? "Leyendo partitura con IA" : "Importando partitura");
  try {
    let score;
    let importWarnings = [];
    if (kind === "pdf") {
      pdfStore = await lazy("store");
      if (!job) {
        busy.log("Guardando el PDF en este dispositivo…");
        const hash = await digestPdf(files[0]);
        const old = await pdfStore.getPendingPdfImport();
        if (!alive()) return;
        if (old && old.hash === hash && old.range === pdfRange) job = old;
        else {
          if (old && Object.keys(old.completed).length) {
            const replace = await confirmDialog({ title: "Hay un PDF pendiente", text: "Empezar otra importación reemplaza el avance guardado. Si querés conservarlo, tocá Retomar PDF en el inicio.", yes: "Empezar otra", no: "Conservar el avance" });
            if (!alive()) return;
            if (!replace) { busy.close(); renderPendingPdf(old); return; }
          }
          const next = { id: newId(), hash, file: files[0], range: pdfRange, context: ctx, completed: {} };
          try { await pdfStore.savePendingPdfImport(next); }
          catch { throw new Error("No se pudo guardar el PDF en este dispositivo. Liberá espacio y reintentá."); }
          job = next;
        }
      }
      ctx = job.context;
      if (!alive()) return;
      renderPendingPdf(job);
    }
    if (needsAi) {
      if (job && !navigator.onLine) {
        busy.error("Sin conexión. El PDF y las partes leídas siguen guardados en este dispositivo.");
        $("busy-resume-pdf").hidden = false;
        return;
      }
      if (!settings.apiKey) {
        busy.error("Falta la API key. Cargala en Ajustes para leer fotos y PDF con IA.", true); return;
      }
      if (!navigator.onLine && !job) { busy.error("Sin conexión a internet: la lectura por IA la necesita."); return; }
      busy.log("Preparando imágenes…");
      const ctl = new AbortController();
      composeAbort = ctl;
      const imp = await lazy("importers"), omr = await lazy("omr");
      let blobs = [];
      if (kind === "pdf") {
        busy.log("Convirtiendo el PDF a imágenes…");
        blobs = await imp.pdfToImages(files[0], {
          range: pdfRange, signal: ctl.signal,
          onPage: (page, total) => alive() && busy.log(`Preparando página ${page} de ${total}…`),
        });
        if (blobs.blank.length) importWarnings.push(`Páginas sin contenido visible: ${blobs.blank.join(", ")}.`);
      } else {
        for (let i = 0; i < files.length; i++) { busy.log(`Preparando imagen ${i + 1} de ${files.length}…`); blobs.push(await imp.prepareImage(files[i])); }
      }
      if (!alive()) return;
      if (!blobs.length) throw new Error("No se obtuvieron imágenes para leer.");
      if (job) {
        busy.log("Leyendo el PDF. Cada parte se guarda al terminar.");
        $("busy-spinner").classList.add("stop");
        pdfProgress.start(blobs.pageNumbers, job.completed);
      }
      const checkpoint = job && {
        completed: job.completed,
        async save(id, parsed) {
          // Guardar una copia de cada resultado antes de dar el fragmento por terminado.
          const updated = await pdfStore.updatePendingPdfImport(job.id, (current) => {
            current.completed[id] = parsed;
            return current;
          });
          if (!updated) throw new Error("La importación cambió en otra pestaña.");
          job.completed[id] = parsed;
        },
      };
      score = await omr.recognizeScore(blobs, {
        provider: settings.provider || "anthropic", apiKey: settings.apiKey, model: settings.model,
        checkpoint, concurrency: job?.serial ? 1 : undefined,
        signal: ctl.signal,
        onPart: (event) => { if (job && alive()) pdfProgress.update(event); },
        onProgress: (m) => { if (alive() && (!job || m === "Armando la partitura…")) busy.log(m); },
      });
      if (!score.title || score.title === "Sin título") score.title = files[0].name.replace(/\.[^.]+$/, "");
    } else {
      busy.log("Leyendo el archivo…");
      const imp = await lazy("importers");
      score = kind === "midi" ? await imp.importMidiFile(files[0]) : await imp.importMusicXml(files[0]);
      if (!score.title) score.title = files[0].name.replace(/\.[^.]+$/, "");
    }
    if (!alive()) return;
    const v = validateScore(score);
    if (!v.ok || !v.score.measures.length) { busy.error("No se pudo leer ninguna nota de la partitura. " + (v.errors || []).slice(0, 2).join(" ")); return; }
    v.score.id = v.score.id || newId();
    v.score.origin = ORIGIN_OF[kind] || "importada";   // foto / imágenes / PDF: se le buscan avisos de importación en Revisión; MusicXML / MIDI: sólo "importada"
    if (ctx) {
      if (ctx.title) v.score.title = ctx.title;
      if (ctx.artist) v.score.artist = ctx.artist;
      if (/^https?:\/\/\S+$/i.test(ctx.sourceUrl || "")) v.score.sourceUrl = ctx.sourceUrl;
    }
    if (job) {
      // Usar el mismo ID al retomar, por si se cerró la app justo después de guardar el borrador.
      v.score.id = job.id;
      v.score.draft = true;
      const existing = await store.get(job.id);
      if (!alive()) return;
      if (!existing) await store.save(v.score);
      if (!alive()) return;
      await pdfStore.updatePendingPdfImport(job.id, () => null);
      if (!alive()) return;
      renderPendingPdf(null);
      if (existing) v.score = existing;
    }
    busy.close();
    openReview(v.score, !job, [...importWarnings, ...v.errors], ctx ? `Importada para «${ctx.title}»${ctx.artist ? " de " + ctx.artist : ""}. Revisá las notas antes de practicar.` : (kind === "pdf" ? "Revisá las notas y la digitación antes de practicar, especialmente donde hay varias voces." : undefined));
    if (ctx && editState) editState.fromSearch = true;
  } catch (err) {
    if (!alive()) return;
    console.error(err);
    if (job && err?.kind === "rate" && !job.serial) {
      job.serial = true;
      await pdfStore.updatePendingPdfImport(job.id, (current) => ({ ...current, serial: true })).catch(() => {});
    }
    if (!alive()) return;
    if (job) renderPendingPdf(job);
    const kept = job ? Object.keys(job.completed).length : 0;
    const detail = kept ? ` Avance guardado: ${kept} ${kept === 1 ? "parte" : "partes"}. Podés retomar este PDF desde el inicio.` : "";
    busy.error((err && err.message ? err.message : String(err)) + detail, ["auth", "model"].includes(err?.kind));
    $("busy-resume-pdf").hidden = !job || !["network", "rate", "server", "storage"].includes(err?.kind);
  } finally { if (alive() && needsAi) composeAbort = null; }
}
const importMap = { "imp-photo": ["file-photo", "photo"], "imp-images": ["file-images", "images"], "imp-pdf": ["file-pdf", "pdf"], "imp-xml": ["file-xml", "xml"], "imp-midi": ["file-midi", "midi"], "imp-task": ["file-task", "task"] };
for (const [btn, [inp, kind]] of Object.entries(importMap)) {
  $(btn).addEventListener("click", () => { closeSheet(); $(inp).click(); });
  $(inp).addEventListener("change", (e) => { const f = e.target.files; runImport(kind, f); e.target.value = ""; });
}

/* ---------- buscar una canción: resultados ---------- */
// Orden (todos gratuitos): tu biblioteca → incluidas en PianoCheck → ediciones gratuitas encontradas (IA con búsqueda web) → Crear con IA → Transcribir desde un audio → Tocarla vos → Importar un archivo.
// srch = { title, artist, sourceUrl, library, local, ai: "idle"|"loading"|"nokey"|"skipped"|"done", res, gen, edit, directFail, ctl, token }
let srch = null, srchToken = 0;
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return ""; } };
const SEARCH_TTL = 14 * 86400000;

function persistSearch() {
  if (!srch) return;
  const ls = { title: srch.title, artist: srch.artist, sourceUrl: srch.sourceUrl, at: Date.now() };
  if (srch.res && srch.res.editions && srch.res.editions.length) { ls.editions = srch.res.editions; ls.kind = srch.res.identified && srch.res.identified.kind; }
  settings.lastSearch = ls;
  store.saveSettings({ lastSearch: ls }).catch(() => {});
}
function clearLastSearch() {
  if (!settings.lastSearch) return;
  settings.lastSearch = null;
  store.saveSettings({ lastSearch: null }).catch(() => {});
  renderSearchCard();
}
function renderSearchCard() {
  const ls = settings.lastSearch, on = !!(ls && ls.title && Date.now() - (ls.at || 0) < SEARCH_TTL);
  $("search-card").hidden = !on;
  if (!on) return;
  $("search-card-title").textContent = ls.artist ? `«${ls.title}» — ${ls.artist}` : `«${ls.title}»`;
  $("search-card-sub").textContent = "Volvé a tus resultados para importar la edición que conseguiste.";
  const go = $("search-card-go"); go.textContent = `Seguir con «${ls.title}»`; go.setAttribute("aria-label", `Seguir con «${ls.title}»`);
}
$("search-card-go").addEventListener("click", () => { const ls = settings.lastSearch; if (ls) openSearch(ls, { cached: true }); });
$("search-card-x").addEventListener("click", clearLastSearch);

/** Abre la pantalla de resultados y lanza la búsqueda. q = {title, artist?, sourceUrl?, editions?}; o.cached reutiliza las ediciones ya encontradas. */
function openSearch(q, o = {}) {
  if (srch && srch.ctl) srch.ctl.abort();
  const s = srch = {
    title: String(q.title || "").trim(), artist: String(q.artist || "").trim(), sourceUrl: String(q.sourceUrl || "").trim(),
    library: [], local: null, ai: "idle", res: null, gen: null, edit: false, directFail: {}, ctl: null, token: ++srchToken, paid: !!settings.showPaid,
  };
  if (!s.title) { toast("Escribí el título de la canción."); return; }
  if (o.cached && Array.isArray(q.editions) && q.editions.length) {
    s.res = { editions: q.editions, errors: [], retryable: false, rejected: 0, identified: { title: s.title, artist: s.artist, kind: q.kind || "unknown" }, cached: true };
    s.ai = "done";
  }
  if (!o.cached) persistSearch();
  show("search");
  renderSearch();
  $("search-body").scrollTop = 0;
  runSearch(s);
}
async function runSearchLocal(s) {
  let lib = [];
  try { lib = (await store.list()) || []; } catch (e) { lib = []; }
  const r = await searchSong({ title: s.title, artist: s.artist, sourceUrl: s.sourceUrl }, { library: lib, freeOnly: !settings.showPaid });   // sin IA: sólo biblioteca, incluidas y enlaces
  if (s !== srch) return;
  s.library = lib; s.local = r;
  renderSearch();
}
async function runSearch(s) {
  await runSearchLocal(s);
  if (s !== srch || s.ai === "done") return;
  await runSearchAi(s, false);
}
function refreshSearchLocal() { if (srch) runSearchLocal(srch); }
function resumeSearchAfterSettings() {
  const s = srch; if (!s) return;
  if (s.paid !== !!settings.showPaid) { s.paid = !!settings.showPaid; runSearchLocal(s); if (settings.apiKey) runSearchAi(s, true); else { s.ai = "nokey"; s.res = null; renderSearch(); } return; }
  if (!settings.apiKey) return;
  if (s.ai === "nokey" || (s.res && s.res.errors.some((e) => e.kind === "auth"))) runSearchAi(s, true);
  else if (s.gen && s.gen.kind === "auth") { s.gen = null; renderSearch(); }
}
async function runSearchAi(s, force) {
  if (!settings.apiKey) { s.ai = "nokey"; renderSearch(); return; }
  if (s.local && (s.local.inLibrary.length || s.local.included.length) && !force) { s.ai = "skipped"; renderSearch(); return; }
  if (s.ctl) s.ctl.abort();
  const ctl = new AbortController(); s.ctl = ctl; s.ai = "loading"; s.res = null; renderSearch();
  const res = await searchSong({ title: s.title, artist: s.artist, sourceUrl: s.sourceUrl }, { library: s.library, ai: { provider: settings.provider || "anthropic", apiKey: settings.apiKey, model: settings.model || undefined }, signal: ctl.signal, skipAiIfLocal: false, freeOnly: !settings.showPaid });
  if (s !== srch || ctl.signal.aborted) return;
  s.paid = !!settings.showPaid;
  s.ctl = null; s.res = res; s.ai = "done";
  persistSearch();
  renderSearch();
}

const SCOPE_ES = { song: "Canción", album: "Cancionero o álbum que la incluye", collection: "Cancionero o álbum que la incluye" };
const FORMAT_ES = { musicxml: "MusicXML", midi: "MIDI", pdf: "PDF", web: "Página web" };
const spin = (t) => `<div class="srch-load" role="status"><span class="spinner sm" aria-hidden="true"></span><span>${t}</span></div>`;

const isFreeEd = (e) => e && e.free === true;
function editionHtml(ed, i, s) {
  const fail = s.directFail[ed.url];
  const free = isFreeEd(ed);
  const showFile = !ed.importable || !!fail;
  return `<li class="ed" data-i="${i}">
    <div class="ed-top"><b class="ed-t">${esc(ed.title)}</b>${ed.artist ? `<span class="ed-a">${esc(ed.artist)}</span>` : ""}</div>
    <div class="ed-src">Fuente: <b>${esc(ed.publisher)}</b>${hostOf(ed.url) && hostOf(ed.url) !== String(ed.publisher).toLowerCase() ? ` · ${esc(hostOf(ed.url))}` : ""}</div>
    <div class="tags"><span class="tag ${free ? "free" : "paid"}">${free ? (ed.access === "open" ? "Gratis · acceso libre" : "Gratis del autor") : "Comercial"}</span><span class="tag scope ${ed.scope === "song" ? "song" : "album"}">${SCOPE_ES[ed.scope] || "Canción"}</span><span class="tag">${FORMAT_ES[ed.format] || "Página web"}</span></div>
    ${ed.note ? `<p class="ed-note">${esc(ed.note)}</p>` : ""}
    ${fail ? `<p class="ed-fail" role="status">${ic("warn", "sm")}<span>${esc(fail)}</span></p>` : ""}
    <div class="row wrap">
      ${ed.importable ? `<button class="btn primary" data-act="direct" aria-label="Importar ${esc(ed.title)}">${ic("share", "sm")}Importar</button>` : ""}
      <a class="btn${ed.importable ? "" : " primary"}" href="${esc(ed.url)}" target="_blank" rel="noopener noreferrer" aria-label="Abrir ${esc(ed.title)} (se abre en otra pestaña)">${ic("ext", "sm")}Abrir</a>
      ${showFile ? `<button class="btn" data-act="import-ed" aria-label="Importar archivo descargado de ${esc(ed.title)}">${ic("pdf", "sm")}${free ? "Importar archivo descargado" : "Importar un archivo"}</button>` : ""}
    </div></li>`;
}
function catalogLinksHtml(s) {
  const links = s.local ? s.local.searchLinks : buildSearchLinks({ title: s.title, artist: s.artist }, { freeOnly: !settings.showPaid });
  if (!links.length) return "";
  return `<div class="srch-cats"><p class="srch-h-s">${settings.showPaid ? "Buscar en catálogos" : "Buscá vos en catálogos gratuitos"}</p><ul class="cat-links">${links.map((l) => `<li><a class="btn" href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${ic("ext", "sm")}${esc(l.label)}</a></li>`).join("")}</ul></div>`;
}
function editionsSection(s) {
  const paid = !!settings.showPaid;
  const title = paid ? "Ediciones encontradas" : "Ediciones gratuitas encontradas";
  const h = `<h3 class="srch-h">${ic("book")}${title}</h3><p class="expect"><b>Qué esperar:</b> la partitura real, tal cual. Sólo si es de acceso libre (dominio público o licencia abierta) o su autor la regala; en canciones modernas casi nunca hay.</p>`;
  const wrap = (inner, busyAttr = "") => `<section class="srch-sec path" aria-label="${title}"${busyAttr}>${h}${inner}${catalogLinksHtml(s)}</section>`;
  if (s.ai === "nokey") return wrap(`<div class="srch-note">${ic("info")}<div><p>Para buscar ediciones gratuitas en la web necesito tu API key de IA.</p><span>Los otros caminos de abajo (transcribir, grabar, importar) funcionan sin ella.</span></div><button class="btn" data-act="settings">Ir a Ajustes</button></div>`);
  if (s.ai === "loading" || s.ai === "idle") return wrap(`${spin("Buscando ediciones gratuitas en la web…")}<div class="skel" aria-hidden="true"></div>`, ` aria-busy="true"`);
  if (s.ai === "skipped") return wrap(`<div class="srch-note">${ic("info")}<div><p>Ya hay una versión para tocar, así que no busqué ediciones.</p></div><button class="btn" data-act="search-ai">Buscar ediciones igual</button></div>`);
  const r = s.res || { editions: [], errors: [] };
  const all = r.editions || [];
  const eds = paid ? all : all.filter(isFreeEd);
  const errs = (r.errors || []).filter((e) => e.source === "ai");
  let out = "";
  if (eds.length) {
    if (eds.some((e) => e.scope !== "song")) out += `<p class="hint srch-hint">«${esc(s.title)}» puede ser también el nombre de un álbum. Las ediciones marcadas como cancionero o álbum incluyen la canción junto con otras.</p>`;
    out += `<ul class="eds">${eds.map((e) => editionHtml(e, all.indexOf(e), s)).join("")}</ul>`;
  }
  if (errs.length) {
    const auth = errs.some((e) => e.kind === "auth");
    out += `<div class="srch-note warn" role="alert">${ic("warn")}<div><p>${esc(errs[0].message)}</p></div><div class="srch-btns">${auth ? `<button class="btn" data-act="settings">Ir a Ajustes</button>` : ""}${r.retryable ? `<button class="btn primary" data-act="retry-ai">${ic("restart", "sm")}Reintentar</button>` : ""}</div></div>`;
  } else if (!eds.length) {
    out += `<div class="srch-note">${ic("info")}<div><p>No encontré una edición gratuita de esta canción.</p><span>Seguí con los caminos de abajo.</span></div></div>`;
  } else {
    out += `<div class="row srch-again"><button class="btn sm ghost" data-act="search-ai">${ic("restart", "sm")}Buscar de nuevo</button></div>`;
  }
  return wrap(out);
}
function genFailText(err) {
  const k = err && err.kind;
  if (k === "compose" || k === "refusal") return "La IA no pudo reconstruir esta canción.";
  if (k === "parse") return "La respuesta de la IA no se pudo leer.";
  const c = classifyFailure(err);
  if (c === "network") return "No se pudo conectar con la IA. Revisá tu conexión.";
  if (c === "rate") return "La IA llegó a su límite de uso por ahora.";
  if (c === "auth") return "Falta una API key válida para pedirle la canción a la IA.";
  return "La IA no pudo armar esta canción.";
}
function renderSearch() {
  const s = srch; if (!s) return;
  const body = $("search-body");
  if (s.edit) { const t = $("se-title"), a = $("se-artist"); if (t) s.editTitle = t.value; if (a) s.editArtist = a.value; }
  const st = body.scrollTop, local = s.local;
  const lk = s.sourceUrl ? `<p class="srch-link">${ic("ext", "sm")}<a href="${esc(s.sourceUrl)}" target="_blank" rel="noopener noreferrer">Enlace: ${esc(hostOf(s.sourceUrl) || s.sourceUrl)}</a></p>` : "";
  let h = `<section class="srch-head" aria-label="Canción buscada">
    <div class="srch-id"><span class="srch-k">Partitura de</span><h2 class="srch-title">${esc(s.title)}</h2>${s.artist ? `<p class="srch-artist">${esc(s.artist)}</p>` : ""}${lk}</div>
    ${s.edit ? `<div class="srch-edit"><label class="field-s">Título<input id="se-title" type="text" maxlength="120" autocomplete="off" value="${esc(s.editTitle ?? s.title)}"></label><label class="field-s">Artista (opcional)<input id="se-artist" type="text" maxlength="120" autocomplete="off" value="${esc(s.editArtist ?? s.artist)}"></label><div class="row wrap"><button class="btn primary" data-act="edit-go">${ic("search", "sm")}Buscar de nuevo</button><button class="btn" data-act="edit-cancel">Cancelar</button></div></div>`
      : `<div class="row wrap"><button class="btn" data-act="edit">${ic("pencil", "sm")}Editar búsqueda</button><button class="btn" data-act="import-mine">${ic("pdf", "sm")}Importar un archivo</button></div>`}
  </section>`;
  if (s.gen && s.gen.status === "failed") {
    const g = s.gen;
    h += `<div class="srch-fail" role="alert">${ic("warn")}<div class="sf-t"><b>${esc(g.msg)}</b>${g.detail ? `<span>${esc(g.detail)}</span>` : ""}<span>No perdí tu búsqueda: seguís con «${esc(s.title)}»${s.artist ? " de " + esc(s.artist) : ""}${s.sourceUrl ? " y su enlace" : ""}.${g.compose ? " Probá alguno de los otros caminos." : ""}</span></div>
      <div class="sf-btns">${g.compose ? `<button class="btn primary" data-act="tx-file">${ic("wave", "sm")}Transcribir desde un audio</button><button class="btn" data-act="take">${ic("midi", "sm")}Tocarla vos</button><button class="btn" data-act="import-mine">${ic("pdf", "sm")}Importar un archivo</button>` : `<button class="btn primary" data-act="import-mine">${ic("pdf", "sm")}Importar un archivo</button>`}<button class="btn" data-act="edit">${ic("pencil", "sm")}Editar la búsqueda</button>${g.kind === "auth" ? `<button class="btn" data-act="settings">Ir a Ajustes</button>` : ""}${g.retryable ? `<button class="btn" data-act="gen">${ic("restart", "sm")}Reintentar</button>` : ""}</div></div>`;
  }
  // 1) tu biblioteca
  if (!local) h += `<section class="srch-sec" aria-label="En tu biblioteca" aria-busy="true"><h3 class="srch-h">En tu biblioteca</h3>${spin("Mirando tu biblioteca…")}</section>`;
  else if (local.inLibrary.length) {
    h += `<section class="srch-sec" aria-label="En tu biblioteca"><h3 class="srch-h">En tu biblioteca</h3><p class="expect"><b>Qué esperar:</b> exactamente la partitura que ya guardaste. Sin costo ni esfuerzo.</p><ul class="eds">${local.inLibrary.map((m) => {
      const sc = s.library.find((x) => x.id === m.scoreId) || {};
      const meta = [sc.derivedFrom ? "Versión de «" + (sc.derivedFrom.title || "otra") + "»" : "", sc.measures ? `${sc.measures.length} compases` : ""].filter(Boolean).join(" · ");
      return `<li class="ed lib" data-id="${esc(m.scoreId)}"><div class="ed-top"><b class="ed-t">${esc(m.title)}</b></div>${meta ? `<div class="ed-src">${esc(meta)}</div>` : ""}<div class="row wrap"><button class="btn primary" data-act="play-lib" aria-label="Tocar ${esc(m.title)}">${ic("hand", "sm")}Tocar</button><button class="btn" data-act="listen-lib" aria-label="Escuchar ${esc(m.title)}">${ic("play", "sm")}Escuchar</button></div></li>`;
    }).join("")}</ul></section>`;
  }
  // 2) incluidas en PianoCheck
  if (local && local.included.length) {
    const byPiece = [];
    for (const m of local.included) { let g = byPiece.find((x) => x.id === m.pieceId); if (!g) byPiece.push(g = { id: m.pieceId, vs: [] }); g.vs.push(m); }
    h += `<section class="srch-sec" aria-label="Incluidas en PianoCheck"><h3 class="srch-h">Incluidas en PianoCheck</h3><p class="expect"><b>Qué esperar:</b> arreglos de dominio público ya listos; la melodía es fiel y el arreglo es sencillo.</p><ul class="eds">${byPiece.map((g) => {
      const pc = PIECES.find((x) => x.id === g.id) || { title: g.vs[0].title, composer: "" };
      const [main, ...more] = g.vs;
      return `<li class="ed inc" data-p="${esc(g.id)}"><div class="ed-top"><b class="ed-t">${esc(pc.title)}</b>${pc.composer ? `<span class="ed-a">${esc(pc.composer)}</span>` : ""}</div>
        <div class="ed-src">${esc(main.label === "Solo melodía" ? "Melodía sencilla" : main.label)}${more.length ? " · hay una versión con acompañamiento" : ""} · dominio público</div>
        <div class="row wrap"><button class="btn primary" data-act="play-piece" data-v="${esc(main.versionId)}" aria-label="Tocar ${esc(pc.title)}: ${esc(main.label)}">${ic("hand", "sm")}Tocar</button><button class="btn" data-act="listen-piece" data-v="${esc(main.versionId)}" aria-label="Escuchar ${esc(pc.title)}: ${esc(main.label)}">${ic("play", "sm")}Escuchar</button>${more.map((v) => `<button class="btn" data-act="play-piece" data-v="${esc(v.versionId)}" aria-label="Tocar ${esc(pc.title)}: ${esc(v.label)}">${esc(v.label)}</button>`).join("")}</div></li>`;
    }).join("")}</ul></section>`;
  }
  if (local && !local.inLibrary.length && !local.included.length) h += `<p class="srch-none">No está en tu biblioteca ni entre las partituras incluidas.</p>`;
  // 3) ediciones gratuitas (y catálogos gratuitos)
  h += editionsSection(s);
  // 4) crear con IA
  h += `<section class="srch-sec path main" aria-label="Crear con IA"><h3 class="srch-h">${ic("sparkle")}Crear con IA</h3>
    <p class="expect"><b>Qué esperar:</b> la IA arma la canción de memoria en dos pasos (hoja guía con tonalidad, acordes y forma; después las notas) y se verifica sola. Suele acertar canciones conocidas, con errores: escuchala y corregila. Esfuerzo bajo. Necesita tu API key.</p>
    <details class="adjust"><summary>Ajustar arreglo <span class="adjust-now">${ARRANGE_MODES[composeArrange].name}</span></summary>
      <div class="seg wide opts adjust-seg" role="group" aria-label="Ajustar arreglo">${arrangeSegHtml()}</div><p class="hint gen-desc">${ARRANGE_MODES[composeArrange].desc}</p></details>
    <div class="row wrap"><button class="btn primary" data-act="gen">${ic("sparkle", "sm")}Crear con IA</button></div></section>`;
  // 5) transcribir desde un audio
  h += `<section class="srch-sec path" aria-label="Transcribir desde un audio"><h3 class="srch-h">${ic("wave")}Transcribir desde un audio</h3>
    <p class="expect"><b>Qué esperar:</b> convierte un audio tuyo en notas, en este dispositivo. Muy bueno con una melodía clara; regular con voces o bandas. Esfuerzo medio. PianoCheck no descarga audio de YouTube ni de otros servicios.</p>
    <div class="row wrap"><button class="btn" data-act="tx-file">${ic("wave", "sm")}Elegir un archivo de audio</button><button class="btn" data-act="tx-mic">${ic("mic", "sm")}Grabar con el micrófono</button></div></section>`;
  // 6) tocarla o tararearla
  h += `<section class="srch-sec path" aria-label="Tocarla o tararearla vos"><h3 class="srch-h">${ic("midi")}Tocarla o tararearla vos</h3>
    <p class="expect"><b>Qué esperar:</b> grabás la melodía que sabés. Con piano MIDI es exacta; con micrófono se transcribe. Después le sumás acompañamiento. Esfuerzo medio: tenés que saberla.</p>
    <div class="row wrap"><button class="btn" data-act="take">${ic("rec", "sm")}Grabar la melodía</button></div></section>`;
  // 7) importar un archivo
  h += `<section class="srch-sec path" aria-label="Importar un archivo que ya tengas"><h3 class="srch-h">${ic("pdf")}Importar un archivo que ya tengas</h3>
    <p class="expect"><b>Qué esperar:</b> la fidelidad del archivo. Foto y PDF se leen con IA (con algún error); MusicXML y MIDI entran tal cual. Esfuerzo bajo.</p>
    <div class="row wrap"><button class="btn" data-act="import-mine">${ic("pdf", "sm")}Importar un archivo</button></div></section>`;
  body.innerHTML = h;
  body.scrollTop = st;
  if (s.edit && !s.editFocused) { s.editFocused = true; const t = $("se-title"); if (t) t.focus(); }
}

async function playLocalScore(sc) {
  clearLastSearch();
  startPractice(validateScore(sc).score);
}
async function playPiece(pieceId, versionId) {
  const base = getPieceScore(pieceId, versionId);
  if (!base) { toast("No encontré esa versión."); return; }
  base.origin = "incluida";
  let sc = null;
  try { sc = await store.get(base.id); if (!sc) sc = await store.save(base); } catch (e) { toast("No se pudo guardar en tu biblioteca: " + e.message, 4500); sc = base; }
  playLocalScore(sc);
}
function importFromSearch(ed) {
  const s = srch; if (!s) return;
  openSheet({ path: "import", importFor: { title: s.title, artist: s.artist, sourceUrl: ed ? ed.url : s.sourceUrl } });
}
async function importDirect(ed) {
  const s = srch; if (!s) return;
  const token = ++importToken; const alive = () => token === importToken;
  lastImportKind = "direct";
  busy.open("Descargando la edición");
  const ctl = new AbortController(); composeAbort = ctl;
  const r = await fetchEditionFile(ed, { signal: ctl.signal });
  composeAbort = null;
  if (!alive()) return;
  busy.close();
  if (r.error) {
    s.directFail[ed.url] = ["network", "http", "format", "unsupported"].includes(r.kind) ? "No pude bajar el archivo desde la app. Abrí la partitura, descargala y usá «Importar archivo descargado»." : r.error;
    renderSearch(); return;
  }
  delete s.directFail[ed.url];
  const kind = ed.format === "musicxml" ? "xml" : ed.format === "midi" ? "midi" : "pdf";
  const file = new File([r.blob], r.filename, { type: r.blob.type });
  runImport(kind, [file], { title: s.title, artist: s.artist, sourceUrl: ed.url });
}
/** "Crear con IA" (hoja guía + partitura + verificación): si falla, no hay diálogo con sólo «Cerrar»: se vuelve a los resultados con la búsqueda intacta. */
async function doGenerate() {
  const s = srch; if (!s) return;
  s.gen = null;
  const token = ++importToken; const alive = () => token === importToken && s === srch;
  lastImportKind = "compose";
  const fail = (err, kind) => {
    const c = kind || classifyFailure(err);
    s.gen = { status: "failed", msg: genFailText(err), kind: c, retryable: c === "network" || c === "rate", compose: !!(err && err.kind === "compose"), detail: err && err.kind === "compose" && err.reason ? err.reason : "" };
    renderSearch(); $("search-body").scrollTop = 0;
    const b = $("search-body").querySelector(".srch-fail .btn"); if (b) b.focus({ preventScroll: true });
  };
  if (!settings.apiKey) { fail({ kind: "auth" }, "auth"); return; }
  busy.open("Armando la partitura");
  const ctl = new AbortController(); composeAbort = ctl;
  const m = ARRANGE_MODES[composeArrange] || ARRANGE_MODES.auto;
  try {
    const cm = await lazy("compose"), omr = await lazy("omr");
    const prov = settings.provider || "anthropic";
    const r = await cm.composeStepwise({ query: s.title, artist: s.artist, sourceUrl: s.sourceUrl, level: m.level, style: m.style, web: true, provider: prov, apiKey: settings.apiKey, model: settings.model || (omr.DEFAULT_MODELS || {})[prov], onProgress: (t) => alive() && busy.log(t), signal: ctl.signal });
    if (!alive()) return;
    const score = r.score;
    score.id = score.id || newId();
    score.origin = "ia";
    if (s.artist) score.artist = s.artist;
    busy.close();
    const rest = r.report && r.report.summary ? ` Quedó sin resolver: ${r.report.summary}.` : "";
    openReview(score, true, null, `Hecha con IA de memoria: revisala con Escuchar antes de practicar.${rest}`, { listen: true });
    if (editState) editState.fromSearch = true;
  } catch (err) {
    if (!alive()) return;
    if (!(err && err.name === "OmrError")) console.error(err);
    busy.close();
    fail(err);
  } finally { if (composeAbort === ctl) composeAbort = null; }
}
$("search-body").addEventListener("click", async (e) => {
  const sa = e.target.closest("[data-arrange]"); if (sa) { setArrange(sa.dataset.arrange); return; }
  const btn = e.target.closest("button[data-act]"); if (!btn || !srch) return;
  const s = srch, act = btn.dataset.act, li = btn.closest("li");
  try {
    if (act === "edit") { s.edit = true; s.editTitle = s.title; s.editArtist = s.artist; s.editFocused = false; renderSearch(); $("search-body").scrollTop = 0; }
    else if (act === "edit-cancel") { s.edit = false; renderSearch(); }
    else if (act === "edit-go") {
      const t = $("se-title").value.trim(); if (!t) { toast("Escribí el título de la canción."); $("se-title").focus(); return; }
      openSearch({ title: t, artist: $("se-artist").value.trim(), sourceUrl: s.sourceUrl });
    }
    else if (act === "import-mine") importFromSearch(null);
    else if (act === "tx-file") { tx.openChoose(txCtx(s)); $("file-audio").click(); }
    else if (act === "tx-mic") { tx.openChoose(txCtx(s)); $("tx-rec").click(); }
    else if (act === "take") tx.openTake(txCtx(s));
    else if (act === "import-ed") importFromSearch(s.res.editions[+li.dataset.i]);
    else if (act === "direct") await importDirect(s.res.editions[+li.dataset.i]);
    else if (act === "search-ai" || act === "retry-ai") { s.gen = s.gen && s.gen.status === "failed" ? s.gen : null; await runSearchAi(s, true); }
    else if (act === "gen") await doGenerate();
    else if (act === "settings") openSettings();
    else if (act === "play-lib") playLocalScore(await resolveScore(li.dataset.id));
    else if (act === "play-piece") await playPiece(li.dataset.p, btn.dataset.v);
    else if (act === "listen-lib") { clearLastSearch(); startPractice(await resolveScore(li.dataset.id), { listen: true }); }
    else if (act === "listen-piece") { const base = getPieceScore(li.dataset.p, btn.dataset.v); if (!base) { toast("No encontré esa versión."); return; } clearLastSearch(); startPractice(validateScore(base).score, { listen: true }); }
  } catch (err) { toast("Error: " + err.message, 4000); }
});
$("search-back").addEventListener("click", goLibrary);
$("lib-search").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = $("lib-search-q").value.trim();
  if (!q) { $("lib-search-q").focus(); return; }
  $("lib-search-q").value = "";
  if (parseMusicLink(q)) { link = null; renderLink(); openSheet({ query: q }); startResolve(q); }
  else openSearch({ title: q });
});

/* ---------- arreglo: "Solo melodía" y "Agregar acompañamiento" sin IA, siempre como versión nueva ---------- */
const EST_ES = { sencilla: "Arreglo sencillo", media: "Arreglo medio", elaborada: "Arreglo elaborado" };
const SUFFIX_RE = /\s*\((solo melodía|con acompañamiento|más elaborado)\)\s*$/i;
const baseTitle = (t) => String(t || "Sin título").replace(SUFFIX_RE, "").trim() || "Sin título";
function describeEstimate(score) {
  const a = analyzeScore(score);
  const hands = a.hands === "rh" ? "sólo mano derecha" : a.hands === "lh" ? "sólo mano izquierda" : a.hands === "both" ? "ambas manos" : "sin notas";
  const range = a.range.min != null ? ` · de ${midiName(a.range.min)} a ${midiName(a.range.max)}` : "";
  return { label: EST_ES[a.estimated], text: `${EST_ES[a.estimated]} · ${hands}${range}`, a };
}
/** Versión nueva (otro id, título con sufijo, vínculo a la original). kind "melodia" | "acomp". Devuelve null si no cambia nada. */
function makeArrangement(score, kind) {
  const out = kind === "melodia" ? melodyOnly(score) : addAccompaniment(score);
  if (JSON.stringify(out.measures) === JSON.stringify(score.measures)) return null;
  out.id = newId();
  out.title = `${baseTitle(score.title)} (${kind === "melodia" ? "solo melodía" : "con acompañamiento"})`;
  out.derivedFrom = { id: score.id, title: baseTitle(score.title) };
  delete out.level; delete out.updatedAt; delete out.createdAt;
  return out;
}
let arrCtx = null, arrOpener = null;
function openArrange(score, from) {
  arrCtx = { score: clone(score), from };
  arrOpener = document.activeElement;
  $("arr-piece").textContent = score.title || "Sin título";
  $("arr-est").innerHTML = `Ahora: <b>${esc(describeEstimate(score).text)}</b>`;
  $("arr-ai").disabled = false;
  $("sheet-arrange").hidden = false;
  $("arr-melody").focus();
}
function closeArrange() { $("sheet-arrange").hidden = true; arrCtx = null; arrOpener && arrOpener.focus && arrOpener.focus({ preventScroll: true }); }
$("arr-close").addEventListener("click", closeArrange);
$("sheet-arrange").addEventListener("click", (e) => { if (e.target === $("sheet-arrange")) closeArrange(); });
async function applyArrange(kind) {
  if (!arrCtx) return;
  let base = arrCtx.score; const from = arrCtx.from;
  try {
    if (from === "review") { base = await saveReview(); if (!base) return; }   // la original (con sus correcciones) queda guardada tal cual
    const out = makeArrangement(base, kind);
    if (!out) { toast(kind === "melodia" ? "Esta partitura ya es sólo melodía." : "Ya tiene ese acompañamiento.", 3200); return; }
    out.origin = "arreglo";
    const saved = await store.save(validateScore(out).score);
    const est = describeEstimate(saved).label;
    closeArrange();
    if (from === "review") openReview(saved, false, null, `Versión nueva de «${base.title}» · ${est}. La original quedó guardada sin cambios.`);
    else { await refreshLibrary(); toast(`Creé «${saved.title}» · ${est}`, 3600); const c = document.querySelector(`#library-list .card[data-id="${CSS.escape(saved.id)}"]`); if (c) { c.classList.add("flash"); c.scrollIntoView({ block: "nearest" }); } }
  } catch (err) { toast("No se pudo crear la versión: " + err.message, 4500); }
}
$("arr-melody").addEventListener("click", () => applyArrange("melodia"));
$("arr-acc").addEventListener("click", () => applyArrange("acomp"));
$("review-arrange").addEventListener("click", () => { const v = validateScore(editState.score); if (!v.ok) { toast("Primero tiene que haber alguna nota."); return; } v.score.title = $("review-title").value.trim() || v.score.title; openArrange(v.score, "review"); });
/** Avanzado: arreglo más elaborado pedido a la IA, usando las notas de la partitura como base (sourceScore). */
$("arr-ai").addEventListener("click", async () => {
  if (!arrCtx) return;
  let base = arrCtx.score; const from = arrCtx.from;
  if (!settings.apiKey) { closeArrange(); toast("Necesitás tu API key de IA en Ajustes.", 3800); openSettings(); return; }
  if (from === "review") { base = await saveReview(); if (!base) return; }
  closeArrange();
  lastImportKind = "arrange";
  const token = ++importToken; const alive = () => token === importToken;
  busy.open("Armando un arreglo más elaborado");
  const ctl = new AbortController(); composeAbort = ctl;
  try {
    const cm = await lazy("compose"), omr = await lazy("omr");
    const prov = settings.provider || "anthropic";
    const score = await cm.composeScore({ query: baseTitle(base.title), artist: base.artist, sourceUrl: base.sourceUrl, level: "pro", style: "acompanamiento", sourceScore: base, provider: prov, apiKey: settings.apiKey, model: settings.model || (omr.DEFAULT_MODELS || {})[prov], onProgress: (t) => alive() && busy.log(t), signal: ctl.signal });
    if (!alive()) return;
    delete score.level;
    score.id = newId(); score.origin = "ia"; score.title = `${baseTitle(base.title)} (más elaborado)`; score.derivedFrom = { id: base.id, title: baseTitle(base.title) };
    if (base.artist) score.artist = base.artist;
    busy.close();
    openReview(score, true, null, `Arreglo armado por IA a partir de las notas de «${baseTitle(base.title)}». Revisalo antes de practicar.`);
  } catch (err) {
    if (!alive()) return;
    busy.close(); toast((err && err.message) || "No se pudo armar el arreglo.", 5000);
  } finally { if (composeAbort === ctl) composeAbort = null; }
});

/* ---------- revisión / edición ---------- */
const DUR_NAME = { w: "redonda", h: "blanca", q: "negra", "8": "corchea", "16": "semicorchea", "32": "fusa" };
const durText = (ev) => `${DUR_NAME[ev.d] || ev.d}${ev.dots ? " con puntillo" : ""}`;
const tiemposText = (x) => { const r = Math.round(x * 100) / 100; return `${String(r).replace(".", ",")} ${r === 1 ? "tiempo" : "tiempos"}`; };
function openReview(score, isNew, warnings, note, extra = {}) {
  editState = { score: clone(score), selected: null, hist: createHistory(60), isNew, warnings: warnings || [], tab: "pitch", issues: [], issueIdx: 0, cmMeasure: null };
  $("review-note").hidden = !note; $("review-note-t").textContent = note || "";
  $("review-note-listen").hidden = !(note && extra.listen);
  $("review-title").value = score.title || "";
  $("review-bpm").value = score.bpm || 80;
  $("cm-box").hidden = true;
  show("review");
  reviewR.clearMarks(); reviewR.setCursor(null); reviewR.setFocusMeasure(null);
  lcR.close("silent");
  reviewSteps = buildSteps(editState.score, "both");
  reviewR.draw(editState.score, reviewSteps);
  annoR.setScore(score.id, score.measures.length);
  refreshReviewPhrases();
  refreshReview();
  if (editState.issues.length) requestAnimationFrame(() => gotoIssue(0, true));
  else if (warnings && warnings.length) toast("Aviso: " + warnings[0], 4500);
  syncDraftUi();
  if (isNew) autoDraft(); else if (isDraft(score)) { editState.draft = true; syncDraftUi(); }
}
/* ----- borradores: lo que llega a Revisión se guarda solo ----- */
let draftT = 0;
function syncDraftUi() { const d = !!(editState && editState.draft); $("review-discard").hidden = !d; $("review-draft").hidden = !d; }
async function autoDraft() {
  const es = editState; if (!es) return;
  if (!es.score.id) es.score.id = newId();
  es.score.draft = true; es.draft = true; syncDraftUi();
  try { await store.save(validateScore(es.score).score); } catch (e) { toast("No pude guardar el borrador: " + e.message, 4500); }
}
/** Guarda de nuevo el borrador (con los cambios de Revisión) poco después de cada edición. */
function scheduleDraftSave() {
  if (!editState || !editState.draft) return;
  clearTimeout(draftT);
  const es = editState;
  draftT = setTimeout(() => { if (editState === es && es.draft) { es.score.draft = true; store.save(validateScore(es.score).score).catch(() => {}); } }, 700);
}
async function flushDraft() {
  clearTimeout(draftT);
  const es = editState;
  if (es && es.draft) { es.score.title = $("review-title").value.trim() || es.score.title || "Sin título"; es.score.draft = true; try { await store.save(validateScore(es.score).score); } catch (e) { /* sin guardar */ } }
}
$("review-title").addEventListener("input", scheduleDraftSave);
$("review-note-listen").addEventListener("click", () => $("review-play").click());
$("review-discard").addEventListener("click", async () => {
  if (!editState || !editState.draft) return;
  if (!(await confirmDialog({ title: "¿Descartar este borrador?", text: "La partitura se borra de tu biblioteca. No se puede deshacer.", yes: "Descartar", no: "Seguir editando" }))) return;
  const id = editState.score.id; clearTimeout(draftT); editState.draft = false;
  try { await store.del(id); } catch (e) { /* ya no estaba */ }
  toast("Borrador descartado"); goLibrary();
});
function selNote() {
  const s = editState && editState.selected; if (!s) return null;
  const m = editState.score.measures[s.measure]; const ev = m && m[s.hand][s.idx];
  return ev && ev.k[s.keyIdx] ? { ev, key: ev.k[s.keyIdx] } : null;
}
/* avisos de importación + íconos sobre los compases */
function computeIssues() {
  if (!editState || !needsImportCheck(editState.score)) return [];
  return detectIssues(editState.score, { warnings: editState.warnings });
}
function reviewBadges() {
  const out = [];
  const cm = editState.score.comments || {};
  Object.keys(cm).forEach((k) => out.push({ measure: +k, type: "comment", label: `Comentario del compás ${+k + 1}: ${cm[k]}` }));
  editState.issues.forEach((it, i) => { if (!it.reviewed) out.push({ measure: it.measure, type: "warn", current: i === editState.issueIdx, label: `Aviso: ${it.text}` }); });
  return out;
}
function renderIssueBar() {
  const list = editState.issues, bar = $("review-issues");
  bar.hidden = !list.length;
  if (!list.length) { reviewR.setFocusMeasure(null); return; }
  const it = list[editState.issueIdx], pend = list.filter((x) => !x.reviewed).length;
  $("is-count").textContent = `Aviso ${editState.issueIdx + 1} de ${list.length}${pend ? "" : " · todos revisados"}`;
  $("is-text").textContent = it.text;
  bar.classList.toggle("reviewed", it.reviewed);
  $("is-done").setAttribute("aria-pressed", String(it.reviewed));
  $("is-done-t").textContent = it.reviewed ? "Revisado (deshacer)" : "Marcar como revisado";
  $("is-prev").disabled = $("is-next").disabled = list.length < 2;
  reviewR.setFocusMeasure(it.measure);
}
function gotoIssue(i, first) {
  const n = editState.issues.length; if (!n) return;
  editState.issueIdx = ((i % n) + n) % n;
  renderIssueBar();
  reviewR.setBadges(reviewBadges());
  reviewR.scrollToMeasure(editState.issues[editState.issueIdx].measure);
  void first;
}
$("is-prev").addEventListener("click", () => gotoIssue(editState.issueIdx - 1));
$("is-next").addEventListener("click", () => gotoIssue(editState.issueIdx + 1));
$("is-done").addEventListener("click", () => {
  const it = editState.issues[editState.issueIdx]; if (!it) return;
  commit(setReviewed(editState.score, it.key, !it.reviewed), { keepSel: true });
});
/** Todo se recalcula después de cada cambio. */
function refreshReview() {
  editState.issues = computeIssues();
  editState.issueIdx = Math.max(0, Math.min(editState.issueIdx, editState.issues.length - 1));
  reviewR.setBadges(reviewBadges());
  renderIssueBar();
  updateEditUi();
}
function updateEditUi() {
  const sel = selNote(), has = !!sel;
  $("ed-bar").hidden = !has;
  $("ed-del").disabled = !has;
  $("ed-comment").disabled = !has && editState.cmMeasure == null;
  $("ed-undo").disabled = !editState.hist.canUndo; $("ed-redo").disabled = !editState.hist.canRedo;
  document.querySelectorAll("#ed-tabs button").forEach((b) => { const on = b.dataset.tab === editState.tab; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
  document.querySelectorAll("#ed-bar .ed-tools").forEach((t) => (t.hidden = t.dataset.tab !== editState.tab));
  if (sel) {
    const s = editState.selected, midi = keyToMidi(sel.key);
    $("review-sel").innerHTML = `Seleccionada: <b>${midi == null ? sel.key : midiName(midi)}</b> — compás ${s.measure + 1}, ${HANDS_ES[s.hand]} · ${durText(sel.ev)}${sel.ev.f && sel.ev.f[s.keyIdx] ? ` · dedo ${sel.ev.f[s.keyIdx]}` : ""}`;
    document.querySelectorAll("#ed-dur button").forEach((b) => { const on = b.dataset.d === sel.ev.d; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
    $("ed-dot").setAttribute("aria-pressed", String(!!sel.ev.dots));
    const f = (sel.ev.f && sel.ev.f[s.keyIdx]) || 0;
    document.querySelectorAll("#ed-fing button").forEach((b) => { const on = +b.dataset.f === f; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
    $("ed-hand-t").textContent = s.hand === "rh" ? "Pasar a la mano izquierda" : "Pasar a la mano derecha";
    $("ins-chord").disabled = false;
  } else $("review-sel").textContent = editState.score.measures.length ? "Tocá una nota de la partitura para corregirla." : "";
  reviewR.setSelected(sel ? editState.selected : null);
}
/** Aplica el resultado de una operación de js/review.js: historial, selección, aviso si el compás se pasa. */
function commit(r, { keepSel = false } = {}) {
  if (!r || !r.ok) { toast((r && r.error) || "No se pudo hacer ese cambio.", 3800); return false; }
  const m = editState.selected ? editState.selected.measure : null;
  editState.hist.push({ score: editState.score, selected: editState.selected });
  editState.score = r.score; scheduleDraftSave();
  if (!keepSel) editState.selected = r.ref || null;
  if (r.warn && r.warn.over && m != null) toast(`El compás ${m + 1} se pasa por ${tiemposText(r.warn.over)}. Acortá otra nota o sacá un silencio.`, 5200);
  redrawReview();
  return true;
}
function redrawReview() {
  const st = $("review-score").scrollTop;
  reviewSteps = buildSteps(editState.score, "both");
  reviewR.draw(editState.score, reviewSteps);
  if (lcR.isOpen) lcR.invalidate();
  annoR.prune(editState.score.measures.length);
  $("review-score").scrollTop = st;
  refreshReviewPhrases();
  refreshReview();
}
const edSel = () => (selNote() ? editState.selected : null);
const doEdit = (op, ...args) => { const ref = edSel(); if (!ref) return; commit(op(editState.score, ref, ...args)); };
reviewR.onNoteTap((ref) => { if (!editState) return; editState.selected = ref; updateEditUi(); });
reviewR.onBadgeTap(({ measure, type }) => {
  if (!editState) return;
  if (type === "comment") openCommentBox(measure);
  else { const i = editState.issues.findIndex((x) => x.measure === measure && !x.reviewed); if (i >= 0) gotoIssue(i); }
});
$("ed-up").addEventListener("click", () => doEdit(shiftPitch, 1));
$("ed-down").addEventListener("click", () => doEdit(shiftPitch, -1));
$("ed-oct-up").addEventListener("click", () => doEdit(shiftPitch, 12));
$("ed-oct-down").addEventListener("click", () => doEdit(shiftPitch, -12));
$("ed-del").addEventListener("click", () => doEdit(deleteNote));
$("ed-tabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b || !editState) return; editState.tab = b.dataset.tab; updateEditUi(); });
$("ed-dur").addEventListener("click", (e) => { const b = e.target.closest("button"); const s = selNote(); if (!b || !s) return; doEdit(setDuration, b.dataset.d, s.ev.dots || 0); });
$("ed-dot").addEventListener("click", () => { const s = selNote(); if (s) doEdit(setDuration, s.ev.d, s.ev.dots ? 0 : 1); });
$("ed-hand").addEventListener("click", () => doEdit(moveHand));
$("ed-fing").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) doEdit(setFinger, +b.dataset.f); });
$("ed-fing-0").addEventListener("click", () => doEdit(setFinger, 0));
function fillFingering() {
  const editing = screen === "review";
  const source = editing ? editState?.score : current;
  if (!source) return;
  const { score, added, skipped } = suggestFingering(source);
  if (!added) {
    toast(skipped ? "Los acordes restantes necesitan digitación manual." : "La partitura ya tiene digitación.");
    return;
  }
  if (editing) commit({ ok: true, score }, { keepSel: true });
  else {
    current = score;
    practiceR.setFingerScore(score);
    syncKeyboard(false);
    toast(`Sugerí ${added} dedos para esta práctica. Para guardarlos, usá Revisión.`, 4500);
    return;
  }
  toast(`Sugerí ${added} dedos. ${skipped ? "Algunos acordes requieren revisión manual." : "Podés ajustarlos en Dedo."}`, 4200);
}
$("review-fingering").addEventListener("click", fillFingering);
$("practice-fingering").addEventListener("click", fillFingering);
$("ins-before").addEventListener("click", () => doEdit(insertEvent, "before"));
$("ins-after").addEventListener("click", () => doEdit(insertEvent, "after"));
$("ins-chord").addEventListener("click", () => doEdit(insertEvent, "chord"));
$("ins-rest-before").addEventListener("click", () => doEdit(insertEvent, "before", { rest: true }));
$("ins-rest-after").addEventListener("click", () => doEdit(insertEvent, "after", { rest: true }));
function undoRedo(kind) {
  const cur = { score: editState.score, selected: editState.selected };
  const h = kind === "undo" ? editState.hist.undo(cur) : editState.hist.redo(cur);
  if (!h) return;
  editState.score = h.score; editState.selected = h.selected; scheduleDraftSave(); redrawReview();
}
$("ed-undo").addEventListener("click", () => undoRedo("undo"));
$("ed-redo").addEventListener("click", () => undoRedo("redo"));
/* comentarios por compás */
function openCommentBox(m) {
  editState.cmMeasure = m;
  $("cm-label").textContent = `Comentario del compás ${m + 1}`;
  $("cm-input").value = (editState.score.comments && editState.score.comments[m]) || "";
  $("cm-box").hidden = false; $("cm-input").focus();
  $("ed-comment").disabled = false;
}
function closeCommentBox() { $("cm-box").hidden = true; }
$("ed-comment").addEventListener("click", () => { const s = edSel(); const m = s ? s.measure : editState.cmMeasure; if (m != null) openCommentBox(m); });
const saveComment = (text) => { const m = editState.cmMeasure; if (m == null) return; if (commit(setComment(editState.score, m, text), { keepSel: true })) closeCommentBox(); };
$("cm-save").addEventListener("click", () => saveComment($("cm-input").value));
$("cm-del").addEventListener("click", () => saveComment(""));
$("cm-input").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); saveComment($("cm-input").value); } });
async function saveReview() {
  const sc = editState.score;
  sc.title = $("review-title").value.trim() || "Sin título";
  clearTimeout(draftT); delete sc.draft;   // Guardar confirma el borrador (misma partitura, mismo id: no se duplica)
  sc.bpm = Math.max(30, Math.min(240, parseInt($("review-bpm").value, 10) || sc.bpm || 80));
  const v = validateScore(sc);
  v.score.id = sc.id || newId();
  try { await store.save(v.score); } catch (e) { toast("No se pudo guardar: " + e.message, 4500); return null; }
  editState.isNew = false; editState.draft = false; syncDraftUi();
  if (editState.fromSearch) clearLastSearch();   // ya conseguiste la partitura de esa búsqueda
  return v.score;
}
$("review-save").addEventListener("click", async () => { if (await saveReview()) { toast("Partitura guardada"); history.state && history.state.s ? history.back() : show("library", false); } });
$("review-save-practice").addEventListener("click", async () => { const s = await saveReview(); if (s) startPractice(s); });
$("review-task").addEventListener("click", () => { const v = validateScore(editState.score); if (!v.ok) { toast("Primero tiene que haber alguna nota."); return; } v.score.title = $("review-title").value.trim() || v.score.title; openTaskSheet(v.score, { bpm: parseInt($("review-bpm").value, 10) || v.score.bpm }); });
$("review-back").addEventListener("click", async () => {
  if (editState && editState.draft) { await flushDraft(); toast("Quedó como borrador en tu biblioteca", 2800); goLibrary(); return; }
  if (editState && (editState.hist.canUndo || editState.isNew) && !(await confirmDialog({ title: "¿Salir sin guardar?", text: "Los cambios que hiciste en esta partitura se pierden.", yes: "Salir sin guardar", no: "Seguir editando" }))) return;
  goLibrary();
});

/* ---------- tareas para la clase ---------- */
const taskTemplate = (t, n) => ({ range: t.from != null ? { from: t.from, to: t.to } : null, hands: t.hands || "both", loop: t.from != null, mode: t.mode || "espera", n });
const nIntentos = (k) => `${k} ${k === 1 ? "intento" : "intentos"}`;
function taskCardHtml(sc, t, atts) {
  const n = (sc.measures || []).length, tpl = taskTemplate(t, n);
  const eq = (atts || []).filter((a) => sameKind(a, tpl, n)).sort((p, q) => p.at - q.at);
  const last = eq.length ? `Último: ${eq[eq.length - 1].accuracy}%${tpl.mode === "pulso" ? " a pulso" : ""} · ${nIntentos(eq.length)}` : "Todavía sin intentos";
  const title = esc(sc.title || "Sin título");
  return `<li class="card task-card" data-task="${esc(sc.id)}"><div class="card-top"><div><span class="task-k">Tarea</span><div class="t">${title}</div></div></div>
    ${t.text ? `<p class="task-text">${esc(t.text)}</p>` : ""}
    <div><div class="task-meta">${esc(describeTask(t, n))}</div><div class="task-meta">${esc(last)}</div></div>
    <div class="row"><button class="btn primary grow" data-tact="start" aria-label="Empezar la tarea de ${title}">${ic("play", "sm")}Empezar</button>
    <button class="btn" data-tact="share" aria-label="Compartir resumen de ${title}">${ic("share", "sm")}Compartir resumen</button>
    <button class="btn icon danger" data-tact="del" aria-label="Quitar la tarea de ${title}">${ic("trash")}</button></div></li>`;
}
async function saveTasks() { await store.saveSettings({ tasks: settings.tasks }); }
$("task-list").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-tact]"); if (!btn) return;
  const id = btn.closest(".card").dataset.task, act = btn.dataset.tact;
  try {
    if (act === "start") await startTask(id);
    else if (act === "share") await shareTaskSummary(id);
    else if (act === "del" && await confirmDialog({ title: "¿Quitar esta tarea?", text: "Se saca de la lista de tareas. La partitura queda en tu biblioteca.", yes: "Quitar" })) {
      delete settings.tasks[id]; await saveTasks(); refreshLibrary(); toast("Tarea quitada");
    }
  } catch (err) { toast("Error: " + err.message, 4000); }
});
async function startTask(id) {
  const t = (settings.tasks || {})[id]; if (!t) throw new Error("No se encontró la tarea.");
  const sc = await resolveScore(id);
  $("toast").hidden = true;
  startPractice(sc, { hands: t.hands, bpm: t.bpm, mode: t.mode, passage: t.from != null ? { from: t.from, to: t.to, loop: true } : null, task: t });
}
/** Resumen del último intento equivalente a la tarea. */
async function shareTaskSummary(id) {
  const t = (settings.tasks || {})[id]; if (!t) return;
  const sc = await resolveScore(id), n = sc.measures.length, tpl = taskTemplate(t, n);
  const atts = await store.attempts(id);
  const eq = atts.filter((a) => sameKind(a, tpl, n));
  if (!eq.length) { toast("Todavía no practicaste esta tarea. Tocá «Empezar».", 3600); return; }
  await shareText(buildSummary({ title: sc.title, n, att: eq[eq.length - 1], attempts: atts, task: t }));
}

/* Crear tarea (desde Revisión o desde una tarjeta de la biblioteca) */
let taskDraft = null, taskOpener = null;
function taskAutoText() {
  const d = taskDraft, whole = d.from === 0 && d.to === d.n - 1;
  const parts = [whole ? "Pieza entera" : `Compases ${rangeText({ from: d.from, to: d.to })}`, d.hands === "rh" ? "mano derecha" : d.hands === "lh" ? "mano izquierda" : "ambas manos", `${d.bpm} BPM`];
  return parts.join(", ") + "." + (d.mode === "pulso" ? " A pulso con el metrónomo." : "");
}
function syncTaskSheet() {
  const d = taskDraft;
  $("tk-from").textContent = d.from + 1; $("tk-to").textContent = d.to + 1; $("tk-bpm").textContent = d.bpm;
  $("tk-from-dn").disabled = d.from <= 0; $("tk-from-up").disabled = d.from >= d.to;
  $("tk-to-dn").disabled = d.to <= d.from; $("tk-to-up").disabled = d.to >= d.n - 1;
  document.querySelectorAll("#tk-hands button").forEach((b) => { const on = b.dataset.hands === d.hands; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
  document.querySelectorAll("#tk-mode button").forEach((b) => { const on = b.dataset.mode === d.mode; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
  $("tk-count").textContent = `${$("tk-text").value.length} / ${MAX_TASK_TEXT}`;
}
function openTaskSheet(score, o = {}) {
  const n = score.measures.length;
  taskDraft = { score, n, from: 0, to: n - 1, hands: "both", bpm: o.bpm || score.bpm || 80, mode: "espera" };
  taskOpener = document.activeElement;
  $("task-piece").textContent = `${score.title || "Sin título"} · ${n} ${n === 1 ? "compás" : "compases"}`;
  $("tk-text").value = "";
  syncTaskSheet();
  $("sheet-task").hidden = false; $("tk-text").focus();
}
function closeTaskSheet() { $("sheet-task").hidden = true; taskOpener && taskOpener.focus && taskOpener.focus(); taskDraft = null; }
$("task-close").addEventListener("click", closeTaskSheet);
$("sheet-task").addEventListener("click", (e) => { if (e.target === $("sheet-task")) closeTaskSheet(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("sheet-task").hidden && $("confirm").hidden) closeTaskSheet(); });
const moveTk = (k, d) => { const t = taskDraft; t[k] += d; if (t.from > t.to) { if (k === "from") t.from = t.to; else t.to = t.from; } t.from = Math.max(0, t.from); t.to = Math.min(t.n - 1, t.to); syncTaskSheet(); };
$("tk-from-dn").addEventListener("click", () => moveTk("from", -1)); $("tk-from-up").addEventListener("click", () => moveTk("from", 1));
$("tk-to-dn").addEventListener("click", () => moveTk("to", -1)); $("tk-to-up").addEventListener("click", () => moveTk("to", 1));
$("tk-bpm-dn").addEventListener("click", () => { taskDraft.bpm = Math.max(30, taskDraft.bpm - 4); syncTaskSheet(); });
$("tk-bpm-up").addEventListener("click", () => { taskDraft.bpm = Math.min(240, taskDraft.bpm + 4); syncTaskSheet(); });
$("tk-hands").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { taskDraft.hands = b.dataset.hands; syncTaskSheet(); } });
$("tk-mode").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { taskDraft.mode = b.dataset.mode; syncTaskSheet(); } });
$("tk-text").addEventListener("input", syncTaskSheet);
$("tk-auto").addEventListener("click", () => { const v = $("tk-text").value.trim(); $("tk-text").value = (taskAutoText() + (v ? " " + v : "")).slice(0, MAX_TASK_TEXT); syncTaskSheet(); });
async function currentTaskFile() {
  const d = taskDraft;
  annoP.flush(); annoR.flush();
  let annotations = null;
  try { annotations = await annoPersist.get(d.score.id); } catch (e) { /* sin anotaciones */ }
  const obj = buildTaskFile({ score: d.score, annotations, task: { from: d.from, to: d.to, hands: d.hands, bpm: d.bpm, mode: d.mode, text: $("tk-text").value } });
  const text = serializeTask(obj);
  return new File([text], taskFileName(d.score.title), { type: "application/json" });
}
$("task-share").addEventListener("click", async () => {
  try {
    const file = await currentTaskFile();
    const r = await shareFile(file, { title: `Tarea: ${taskDraft.score.title || "PianoCheck"}`, text: "Tarea de PianoCheck. Abrila en la app: Nueva partitura → Importar → Tarea del profe." });
    if (r === "downloaded") toast("Archivo guardado en Descargas. Mandalo por WhatsApp o mail.", 4200);
  } catch (e) { toast("No se pudo armar la tarea: " + e.message, 4200); }
});
$("task-download").addEventListener("click", async () => { try { const f = await currentTaskFile(); downloadFile(f, f.name); toast("Archivo guardado en Descargas.", 3200); } catch (e) { toast("No se pudo armar la tarea: " + e.message, 4200); } });

/* compartir / descargar archivos y texto */
function downloadFile(file, name) {
  const url = URL.createObjectURL(file), a = document.createElement("a");
  a.href = url; a.download = name || file.name; a.rel = "noopener"; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
/** "shared" | "cancel" | "downloaded". Usa el menú de compartir del sistema (WhatsApp, mail…) si acepta archivos. */
async function shareFile(file, { title, text } = {}) {
  try {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title, text }); return "shared"; }
  } catch (e) { if (e && e.name === "AbortError") return "cancel"; }
  downloadFile(file, file.name);
  return "downloaded";
}
/** Comparte texto (y opcionalmente un archivo de audio). Sin menú del sistema: copia al portapapeles. */
async function shareText(text, file) {
  try {
    if (navigator.share) {
      const data = { title: "Resumen de práctica", text };
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) data.files = [file];
      await navigator.share(data);
      if (file && !data.files) downloadFile(file, file.name);
      return;
    }
  } catch (e) { if (e && e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); toast("Resumen copiado. Pegalo donde quieras.", 3600); }
  catch (e) { window.prompt("Copiá el resumen:", text); }
  if (file) downloadFile(file, file.name);
}

/* importar una tarea (.pianocheck) */
async function runImportTask(file) {
  lastImportKind = "task";
  const token = ++importToken; const alive = () => token === importToken;
  busy.open("Abriendo la tarea");
  try {
    if (file.size > MAX_TASK_BYTES) { busy.error("El archivo es demasiado grande para ser una tarea de PianoCheck."); return; }
    const text = await file.text();
    if (!alive()) return;
    const r = parseTaskFile(text);
    if (!r.ok) { busy.error(r.error); return; }
    r.score.origin = "tarea";
    const saved = await store.save(r.score);
    if (r.annotations) { try { await annoPersist.save(r.id, r.annotations); } catch (e) { /* sin anotaciones */ } }
    settings.tasks = { ...(settings.tasks || {}), [r.id]: { ...r.task, at: Date.now() } };
    const keys = Object.keys(settings.tasks).sort((p, q) => (settings.tasks[q].at || 0) - (settings.tasks[p].at || 0));
    keys.slice(30).forEach((k) => delete settings.tasks[k]);
    await saveTasks();
    busy.close();
    if (screen !== "library") show("library", false); else refreshLibrary();
    toast(`Tarea recibida: «${saved.title}». Tocá «Empezar».`, 4200);
  } catch (err) {
    if (!alive()) return;
    busy.error("No se pudo abrir el archivo: " + (err && err.message ? err.message : err));
  }
}

/* ---------- ajustes ---------- */
async function loadSettings() {
  const s = await store.settings();
  settings = { ...DEFAULT_SETTINGS, ...s };
  settings.midiTransport = s.midiTransport !== false;
  applyLook();
  applyKeyboardSetting();
  player.setTimbre(settings.timbre); player.setVolume(settings.listenVolume == null ? 0.8 : settings.listenVolume);
  syncTimbreUi();
}
function syncTimbreUi() { document.querySelectorAll("#set-timbre button").forEach((b) => { const on = b.dataset.timbre === (settings.timbre || "piano"); b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); }); }
$("set-timbre").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  settings.timbre = b.dataset.timbre === "suave" ? "suave" : "piano";
  store.saveSettings({ timbre: settings.timbre }).catch(() => {}); player.setTimbre(settings.timbre); syncTimbreUi();
  // pequeña muestra para comparar el timbre (sólo con el gesto de tocar el botón)
  player.unlock().then((ok) => { if (ok) player.play([60, 64, 67, 72].map((m, i) => ({ step: i, beat: i, at: i * 0.18, dur: 0.9, midi: m, hand: "rh" }))); }).catch(() => {});
});
function openSettings() {
  prevBeforeSettings = screen === "settings" ? prevBeforeSettings : screen;
  $("set-provider").value = settings.provider || "anthropic";
  $("set-key").value = settings.apiKey || ""; $("set-key").type = "password"; $("set-key-show").textContent = "Ver";
  $("set-model").value = settings.model || "";
  $("set-kb").checked = !!settings.onscreenKeyboard;
  $("set-midi-transport").checked = settings.midiTransport;
  $("set-phrases").checked = settings.showPhrases !== false;
  $("set-paid").checked = !!settings.showPaid;
  setMicSensUi(settings.micSensitivity);
  lazy("omr").then((m) => { if (m.DEFAULT_MODELS) $("set-model").placeholder = "por defecto: " + (m.DEFAULT_MODELS[$("set-provider").value] || ""); }).catch(() => {});
  show("settings");
}
$("set-provider").addEventListener("change", () => lazy("omr").then((m) => { if (m.DEFAULT_MODELS) $("set-model").placeholder = "por defecto: " + (m.DEFAULT_MODELS[$("set-provider").value] || ""); }).catch(() => {}));
$("set-key-show").addEventListener("click", () => { const k = $("set-key"); const show_ = k.type === "password"; k.type = show_ ? "text" : "password"; $("set-key-show").textContent = show_ ? "Ocultar" : "Ver"; });
function setMicSensUi(v) { const n = Math.round(Math.max(0, Math.min(1, Number.isFinite(+v) ? +v : 0.5)) * 100); $("set-mic-sens").value = n; $("set-mic-sens-val").textContent = n; }
function micSensFromUi() { return Math.max(0, Math.min(100, +$("set-mic-sens").value || 0)) / 100; }
$("set-mic-sens").addEventListener("input", () => { $("set-mic-sens-val").textContent = $("set-mic-sens").value; if (mic) mic.setSensitivity(micSensFromUi()); });
$("btn-open-settings").addEventListener("click", openSettings);
$("settings-back").addEventListener("click", () => (history.state && history.state.s ? history.back() : show(prevBeforeSettings, false)));
$("settings-save").addEventListener("click", async () => {
  settings = { ...settings, provider: $("set-provider").value, apiKey: $("set-key").value.trim(), model: $("set-model").value.trim(), onscreenKeyboard: $("set-kb").checked, showPhrases: $("set-phrases").checked, showPaid: $("set-paid").checked, micSensitivity: micSensFromUi() };
  settings.midiTransport = $("set-midi-transport").checked;
  try { await store.saveSettings(settings); toast("Ajustes guardados"); } catch (e) { toast("No se pudo guardar: " + e.message, 4500); return; }
  applyKeyboardSetting();
  if (current) applyPhrases();
  if (editState) refreshReviewPhrases();
  history.state && history.state.s ? history.back() : show(prevBeforeSettings, false);
});

/* ---------- pasar ajustes a otro dispositivo ---------- */
function formCfg() {
  return { provider: $("set-provider").value, apiKey: $("set-key").value.trim(), model: $("set-model").value.trim() };
}
function shareUrlOrToast() {
  const c = formCfg();
  if (!c.apiKey) { toast("Primero cargá tu API key arriba.", 3200); return null; }
  try { return buildShareUrl(location.origin, location.pathname, c); }
  catch (e) { toast("No se pudo armar el código: " + e.message, 4000); return null; }
}
function hideShareQr() { $("share-qr-box").hidden = true; $("share-qr").innerHTML = ""; }
$("share-show").addEventListener("click", async () => {
  const url = shareUrlOrToast(); if (!url) return;
  stopScan();
  try {
    const qrcode = (await import("../vendor/qrcode-generator.mjs")).default;
    const qr = qrcode(0, "M"); qr.addData(url, "Byte"); qr.make();
    const n = qr.getModuleCount(), q = 4; let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + q} ${r + q}h1v1h-1z`;
    $("share-qr").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 2 * q} ${n + 2 * q}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
    $("share-qr-box").hidden = false;
    $("share-qr-box").scrollIntoView({ block: "nearest", behavior: "smooth" });
  } catch (e) { console.error(e); toast("No se pudo generar el QR. Probá con «Compartir enlace».", 4500); }
});
$("share-hide").addEventListener("click", hideShareQr);
$("share-link").addEventListener("click", async () => {
  const url = shareUrlOrToast(); if (!url) return;
  try {
    if (navigator.share) { await navigator.share({ title: "PianoCheck: ajustes de IA", text: "Abrí este enlace para pasar la configuración de PianoCheck. Contiene una API key: no lo compartas.", url }); return; }
  } catch (e) { if (e && e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(url); toast("Enlace copiado. Contiene tu API key: no lo compartas.", 4200); }
  catch (e) { window.prompt("Copiá este enlace (contiene tu API key):", url); }
});
let scanStream = null, scanTimer = 0;
function stopScan() {
  clearInterval(scanTimer); scanTimer = 0;
  if (scanStream) { scanStream.getTracks().forEach((t) => t.stop()); scanStream = null; }
  const v = $("share-video"); if (v) { v.pause(); v.srcObject = null; }
  $("share-scan-box").hidden = true;
}
$("share-scan-close").addEventListener("click", stopScan);
$("share-scan").addEventListener("click", async () => {
  hideShareQr();
  const box = $("share-scan-box"), msg = $("share-scan-msg");
  if (!box.hidden) { stopScan(); return; }
  box.hidden = false;
  if (!("BarcodeDetector" in window)) {
    $("share-video").hidden = true;
    msg.textContent = "Este navegador no puede leer códigos QR desde la app. Pedile al otro dispositivo «Compartir enlace» y abrí el enlace acá, o escaneá el QR con la cámara del sistema: te abre este enlace.";
    return;
  }
  $("share-video").hidden = false; msg.textContent = "Apuntá la cámara al código QR del otro dispositivo.";
  try {
    const det = new window.BarcodeDetector({ formats: ["qr_code"] });
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
    const v = $("share-video"); v.srcObject = scanStream; await v.play();
    let busyScan = false;
    scanTimer = setInterval(async () => {
      if (busyScan || !scanStream) return; busyScan = true;
      try {
        const codes = await det.detect(v);
        for (const c of codes) {
          const tok = extractToken(c.rawValue);
          if (tok) { stopScan(); offerImport(tok); return; }
        }
      } catch (e) { /* cuadro sin imagen */ } finally { busyScan = false; }
    }, 300);
  } catch (e) {
    stopScan(); box.hidden = false; $("share-video").hidden = true;
    msg.textContent = e && e.name === "NotAllowedError" ? "No hay permiso para usar la cámara. Podés usar «Compartir enlace» en el otro dispositivo." : "No se pudo abrir la cámara: " + (e && e.message || e);
  }
});
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") { hideShareQr(); stopScan(); } });
window.addEventListener("pagehide", () => { hideShareQr(); stopScan(); });

/** Muestra el diálogo de importación (proveedor y key enmascarada). Nada se guarda sin aceptar. */
async function offerImport(token) {
  const r = decodeCfg(token);
  if (!r.ok) { toast("No se importó nada: " + r.error, 4500); return; }
  const c = r.cfg;
  const had = !!settings.apiKey;
  const text = `Proveedor: ${PROVIDER_NAMES[c.provider]}\nAPI key: ${maskKey(c.apiKey)}${c.model ? "\nModelo: " + c.model : ""}${had ? "\n\nReemplaza la configuración de IA que tenés en este dispositivo." : ""}`;
  const yes = await confirmDialog({ title: "¿Importar la configuración de IA de otro dispositivo?", text, yes: "Importar", no: "Cancelar", danger: false });
  if (!yes) return;
  try {
    settings = { ...settings, ...(await store.saveSettings({ provider: c.provider, apiKey: c.apiKey, model: c.model })) };
    if (screen === "settings") openSettings();
    toast("Configuración de IA importada.", 3000);
  } catch (e) { toast("No se pudo guardar: " + e.message, 4500); }
}
/** Si la URL trae #cfg=…, se borra el fragmento SIEMPRE (acepte o no) y recién después se ofrece importar. */
function handleIncomingHash() {
  const h = location.hash;
  if (!h.startsWith("#cfg=")) return;
  history.replaceState(history.state, "", location.pathname + location.search);
  const tok = extractToken(h);
  if (!tok) { toast("No se importó nada: el enlace no es válido.", 4500); return; }
  offerImport(tok);
}
window.addEventListener("hashchange", handleIncomingHash);

/* ---------- piano guía (teclado fijo en Práctica) ---------- */
const kb = createKeyboard($("piano"), { onKey: (m) => handleNoteOn(m), onKeyUp: (m) => handleNoteOff(m) });
let kbOpen = false;   // con la Guía apagada el teclado se pliega; el usuario puede desplegarlo
function applyKeyboardSetting() {
  kb.setInteractive(!!settings.onscreenKeyboard); thKb.setInteractive(!!settings.onscreenKeyboard);
  kb.setLane(holdMode() !== "apagado"); syncHoldUi();
  const g = settings.guide !== false;
  $("guide-toggle").setAttribute("aria-pressed", String(g));
  $("kb-toggle").setAttribute("aria-pressed", String(!!settings.onscreenKeyboard));
  syncKbFold(); refreshInputPill(); updateConnectHint();
}
/** Guía apagada y sin teclado de pantalla: el teclado se pliega y queda una barra fina para desplegarlo. */
function syncKbFold() {
  const need = settings.guide === false && !settings.onscreenKeyboard;
  const folded = need && !kbOpen;
  $("kb-fold").hidden = !need;
  $("practice-panel").classList.toggle("kb-folded", folded);
  $("kb-fold").setAttribute("aria-expanded", String(!folded));
  $("kb-fold-t").textContent = folded ? "Mostrar teclado" : "Ocultar teclado";
}
$("kb-fold").addEventListener("click", () => { kbOpen = !kbOpen; syncKbFold(); if (kbOpen) requestAnimationFrame(() => syncKeyboard(true)); });
function scoreRange(sc) {
  let lo = Infinity, hi = -Infinity;
  for (const m of sc.measures || []) for (const h of ["rh", "lh"]) for (const ev of m[h] || []) for (const k of ev.k || []) { const x = keyToMidi(k); if (x != null) { lo = Math.min(lo, x); hi = Math.max(hi, x); } }
  return Number.isFinite(lo) ? computeRange(lo, hi) : computeRange(60, 71);
}
function stepFingers(step) {
  const map = new Map();
  for (const r of (step && step.refs) || []) {
    const ev = current && current.measures[r.measure] && (current.measures[r.measure][r.hand] || [])[r.idx];
    const m = ev && keyToMidi(ev.k[r.keyIdx]), f = ev && ev.f && ev.f[r.keyIdx];
    if (m != null && f) map.set(m, f);
  }
  return map;
}
function stepHands(step) {
  const map = new Map();
  for (const r of (step && step.refs) || []) {
    const ev = current && current.measures[r.measure] && (current.measures[r.measure][r.hand] || [])[r.idx];
    const m = ev && keyToMidi(ev.k[r.keyIdx]);
    if (m != null && (r.hand === "rh" || !map.has(m))) map.set(m, r.hand);
  }
  return map;
}
function stepHandNotes(step) {
  const targets = { rh: [], lh: [] };
  for (const ref of step?.refs || allSteps[step?.i]?.refs || []) {
    const ev = current.measures[ref.measure][ref.hand][ref.idx];
    const midi = keyToMidi(ev.k[ref.keyIdx]);
    if (midi != null) targets[ref.hand].push(midi);
  }
  return targets;
}
const practiceHandMarks = new Map();
const hasTwoHands = (target) => target.rh.length > 0 && target.lh.length > 0;
const handText = (hand) => hand === "rh" ? "Mano derecha" : hand === "lh" ? "Mano izquierda" : "";
const withHand = (text, hand) => hand ? `${handText(hand)} · ${text}` : text;
function showHandFeedback(step, hit, wrongHand, kind) {
  const target = stepHandNotes(step);
  const dirty = practiceHandMarks.get(step.i) || new Set();
  if (wrongHand) dirty.add(wrongHand);
  practiceHandMarks.set(step.i, dirty);
  const states = handMarks(target, hit, dirty, kind);
  practiceR.markStep(step.i, states);
  return states;
}
/** Con Guía: ilumina el paso actual (las ya tocadas en verde). Sin Guía: no anticipa nada. */
function syncKeyboard(focus = true) {
  const st = session && session.state;
  const step = isPulso() ? (pulseRun ? steps[pulseRun.k] : null) : st && st.status === "playing" ? steps[st.index] : null;
  if (!step || settings.guide === false || listening) { if (!listening) kb.setTargets([]); return; }
  const hm = stepHands(step), fm = stepFingers(step), pressed = st && !isPulso() ? st.pressed : [];
  kb.setTargets(step.midi.map((m) => ({ midi: m, hand: hm.get(m) || "rh", done: pressed.includes(m), finger: fm.get(m) || 0 })));
  if (focus) kb.focus(step.midi);
}
$("guide-toggle").addEventListener("click", () => {
  settings.guide = settings.guide === false;
  store.saveSettings({ guide: settings.guide }).catch(() => {});
  if (settings.guide === false) kbOpen = false;
  $("guide-toggle").setAttribute("aria-pressed", String(settings.guide));
  kb.setHint(null); syncKbFold(); syncKeyboard(true); refreshNext();
});

/* ---------- Teoría (escala mayor y grados) ---------- */
const thKb = createKeyboard($("th-piano"), { onKey: (m) => handleNoteOn(m), minWhite: 26 });
const theory = createTheory({
  $, kb: thKb, get player() { return player; }, toast,
  inputReady: () => midiConnected || !!(mic && mic.running) || !!settings.onscreenKeyboard,
  enableOnscreen: () => { settings.onscreenKeyboard = true; store.saveSettings({ onscreenKeyboard: true }).catch(() => {}); applyKeyboardSetting(); syncInputSheet(); toast("Teclado de pantalla activado", 2000); },
  loadProgress: () => store.theory(),
  saveResult: (...a) => store.saveTheory(...a),
  onProgress: (p) => { theoryProgress = p; refreshTheoryCard(); },
});
let theoryProgress = null;
function refreshTheoryCard() {
  const sub = $("theory-card-sub");
  if (!sub) return;
  const p = theoryProgress;
  const parts = [];
  if (p) {
    const a = theory.summary("escala", p), b = theory.summary("grados", p);
    const keys = new Set([...a.keys, ...b.keys]).size;
    const best = [a.best, b.best].filter((x) => x != null);
    if (best.length) parts.push(`Mejor puntaje ${Math.max(...best)}%`);
    if (a.keys.length || b.keys.length) parts.push(`Escala: ${a.keys.length} de 12 tonalidades · Grados: ${b.keys.length} de 12`);
    void keys;
  }
  sub.textContent = parts.length ? parts.join(" · ") : "La escala mayor y los acordes de cada grado, con tu piano.";
}
async function openTheory() {
  show("theory");
  await theory.open();
}
function leaveTheory() { theory.leave(); closePSheet(true); stopMic(); $("toast").hidden = true; }
for (const id of ["open-theory", "welcome-theory"]) {
  $(id).addEventListener("click", () => openTheory().catch((e) => toast("Error: " + e.message, 4000)));
}
$("th-back").addEventListener("click", () => goLibrary());
$("th-body").addEventListener("click", (e) => theory.onBodyClick(e));
$("th-aux").addEventListener("click", () => theory.onAux());
$("th-pill").addEventListener("click", () => openPSheet("input", $("th-pill")));
store.theory().then((p) => { theoryProgress = p; refreshTheoryCard(); }).catch(() => {});

/* ---------- frases repetidas: leyenda "Estructura" ---------- */
function makeStructure(el, renderer, o = {}) {
  let list = [], cur = null, collapsed = false, picked = null;
  function render() {
    el.hidden = !list.length;
    if (!list.length) { el.innerHTML = ""; return; }
    const coll = o.inSheet ? false : collapsed;
    const chips = list.map((p, i) => {
      const gap = i > 0 ? `<span class="struct-dot" aria-hidden="true">${list[i - 1].endMeasure + 1 === p.startMeasure ? "·" : "…"}</span>` : "";
      return gap + `<button class="sc-chip${p.id === cur ? " cur" : ""}" data-id="${p.id}" style="--c:${phraseColor(p.label)}" aria-label="Frase ${esc(p.label)}, compases ${measureRangeText(p)}${p.id === cur ? " (la que tocás ahora)" : ""}${p.id === picked ? " (elegida)" : ""}">${esc(p.label)}</button>`;
    }).join("");
    const pk = picked && list.find((x) => x.id === picked);
    const go = pk && o.onPractice ? `<button class="btn primary sm struct-go" data-go="${pk.id}">Practicar esta frase (${measureRangeText(pk)})</button>` : "";
    el.innerHTML = `<button class="struct-t" aria-expanded="${!coll}" aria-label="Estructura de la pieza, ${coll ? "mostrar" : "ocultar"}">Estructura${coll ? "" : ":"}<svg class="ic sm chev ${coll ? "down" : ""}"><use href="#i-chev"/></svg></button>` + (coll ? "" : `<div class="struct-chips">${chips}</div>${go}`);
  }
  el.addEventListener("click", (e) => {
    if (e.target.closest(".struct-t")) { collapsed = !collapsed; render(); requestAnimationFrame(() => renderer.redraw()); return; }
    const g = e.target.closest(".struct-go");
    if (g) { const p = list.find((x) => x.id === g.dataset.go); if (p && o.onPractice) o.onPractice(p); return; }
    const c = e.target.closest(".sc-chip"); if (!c) return;
    const p = list.find((x) => x.id === c.dataset.id); if (!p) return;
    renderer.scrollToMeasure(p.startMeasure);
    if (o.onPractice) { picked = p.id; render(); const b = el.querySelector(`.sc-chip[data-id="${p.id}"]`); b && b.focus(); }
  });
  return { set(l, c) { list = l || []; cur = c || null; picked = null; render(); }, setCurrent(c) { if (c === cur) return; cur = c || null; if (!el.hidden && !(collapsed && !o.inSheet)) el.querySelectorAll(".sc-chip").forEach((b) => { b.classList.toggle("cur", b.dataset.id === cur); }); } };
}
const practiceStructs = [
  makeStructure($("practice-struct"), practiceR, { onPractice: (p) => startLoop({ from: p.startMeasure, to: p.endMeasure }) }),
  makeStructure($("practice-struct-sheet"), practiceR, { inSheet: true, onPractice: (p) => { closePSheet(true); startLoop({ from: p.startMeasure, to: p.endMeasure }); } }),
];
const practiceStruct = { set(l, c) { practiceStructs.forEach((x) => x.set(l, c)); $("look-struct-box").hidden = !(l && l.length); }, setCurrent(c) { practiceStructs.forEach((x) => x.setCurrent(c)); } };
const reviewStruct = makeStructure($("review-struct"), reviewR);
let phrases = [], curPhrase = "-", noteTimer = 0;
function applyPhrases() {
  phrases = settings.showPhrases === false || !current ? [] : findPhrases(current);
  practiceR.setPhrases(phrases); practiceStruct.set(phrases, null); curPhrase = "-"; hidePhraseNote();
  requestAnimationFrame(() => practiceR.redraw());
  trackPhrase();
}
function refreshReviewPhrases() {
  const l = settings.showPhrases === false || !editState ? [] : findPhrases(editState.score);
  reviewR.setPhrases(l); reviewStruct.set(l, null);
}
function showPhraseNote(t) {
  const n = $("phrase-note"); n.textContent = t; n.hidden = false;
  clearTimeout(noteTimer); noteTimer = setTimeout(hidePhraseNote, 5200);
}
function hidePhraseNote() { clearTimeout(noteTimer); $("phrase-note").hidden = true; }
$("phrase-note").addEventListener("click", hidePhraseNote);
/** Al entrar a una frase nueva: resalta su letra y, si es repetición, avisa. */
function trackPhrase() {
  if (!(session || pulseRun) || !phrases.length) { practiceStruct.setCurrent(null); return; }
  const step = curStep();
  const p = step ? phraseAt(phrases, step.measure) : null;
  const id = p ? p.id : null;
  if (id === curPhrase) return;
  curPhrase = id; practiceStruct.setCurrent(id);
  const msg = p && repeatNotice(p, phrases);
  if (msg) showPhraseNote(msg); else hidePhraseNote();
}

/* ---------- hojas de Práctica (Conexión, Tempo, Bucle, Lectura, Sesión) ---------- */
const SHEET_TITLES = { input: "Conexión", tempo: "Tempo", loop: "Bucle", look: "Lectura", hands: "Manos y sesión", listen: "Escucha" };
const SHEET_OPENERS = { input: "input-pill", tempo: "btn-tempo", loop: "btn-loop", look: "btn-look", hands: "hands-link", listen: "lt-opts" };
let sheetName = null, sheetFrom = null;
function openPSheet(name, opener) {
  if (sheetName === name) { closePSheet(); return; }
  if (sheetName) closePSheet(true);
  sheetName = name; sheetFrom = opener || (name === "input" && screen === "theory" ? $("th-pill") : $(SHEET_OPENERS[name]));
  $("ps-title").textContent = SHEET_TITLES[name];
  document.querySelectorAll("#psheet .ps-sec").forEach((x) => (x.hidden = x.dataset.sec !== name));
  $("psheet").hidden = false;
  Object.entries(SHEET_OPENERS).forEach(([k, id]) => $(id).setAttribute("aria-expanded", String(k === name)));
  $("th-pill").setAttribute("aria-expanded", String(name === "input" && screen === "theory"));
  if (name === "loop") initLoopSheet();
  if (name === "tempo") syncModeUi();
  if (name === "input") syncInputSheet();
  if (name === "hands") syncHandsUi();
  if (name === "listen") syncListenSheet();
  $("ps-box").focus({ preventScroll: true });
}
function closePSheet(silent) {
  if (!sheetName) return;
  const was = sheetName; sheetName = null;
  if (was === "loop") { stopListening(); practiceR.setRange(passage && passage.loop ? passage : null); }
  $("psheet").hidden = true;
  Object.values(SHEET_OPENERS).forEach((id) => $(id).setAttribute("aria-expanded", "false")); $("th-pill").setAttribute("aria-expanded", "false");
  if (!silent && sheetFrom && sheetFrom.focus) sheetFrom.focus({ preventScroll: true });
  sheetFrom = null;
}
$("ps-close").addEventListener("click", () => closePSheet());
for (const [name, id] of Object.entries(SHEET_OPENERS)) $(id).addEventListener("click", () => openPSheet(name, $(id)));
document.addEventListener("pointerdown", (e) => {
  if (!sheetName || sheetName === "loop") return;   // el selector de bucle queda abierto para mirar la partitura
  if (e.target.closest("#psheet") || e.target.closest("#pr-head") || e.target.closest("#th-head") || e.target.closest("#confirm")) return;
  closePSheet(true);
}, true);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && sheetName && $("confirm").hidden) closePSheet(); });

/* estado de entrada: "MIDI listo" / "Micrófono" / "Teclado" / "Conectar piano" */
function refreshInputPill() {
  const pill = $("input-pill");
  let cls = "off", text = "Conectar piano", label = "Entrada: sin conectar. Tocá para conectar un piano";
  if (midiConnected) { cls = "ok"; text = "MIDI listo"; label = "Entrada: piano MIDI listo. Tocá para ver las opciones"; }
  else if (mic && mic.running) { cls = "alt"; text = "Micrófono"; label = "Entrada: micrófono activo. Tocá para ver las opciones"; }
  else if (settings.onscreenKeyboard) { cls = "alt"; text = "Teclado"; label = "Entrada: teclado de pantalla. Tocá para ver las opciones"; }
  pill.className = "input-pill " + cls;
  $("pill-t").textContent = text; pill.setAttribute("aria-label", label);
  const tp = $("th-pill");   // mismo estado compacto en Teoría
  tp.className = "input-pill " + cls; $("th-pill-t").textContent = text; tp.setAttribute("aria-label", label);
  theory.refreshInput();
}
function syncInputSheet() {
  $("input-lead").textContent = midiConnected ? "Piano MIDI conectado." : mic && mic.running ? "El micrófono está escuchando." : settings.onscreenKeyboard ? "Estás usando el teclado de pantalla." : "Elegí cómo te escucha la app.";
  $("midi-transport-hint").hidden = !midiConnected || settings.midiTransport === false;
}
$("kb-toggle").addEventListener("click", () => {
  settings.onscreenKeyboard = !settings.onscreenKeyboard;
  store.saveSettings({ onscreenKeyboard: settings.onscreenKeyboard }).catch(() => {});
  applyKeyboardSetting(); syncInputSheet();
});

/* ---------- práctica ---------- */
const metro = createMetronome();
let metroBpm = 80;
function buildPips(n) { $("beat-pips").innerHTML = Array.from({ length: n }, () => "<i></i>").join(""); }
let countingIn = false, countBeats = 0, countWasOn = false, countTimer = 0, countStart = null;
metro.onBeat((i, info) => {
  const d = $("beat-dot"); d.className = "beat-dot on" + (i === 0 ? " accent" : "");
  const pips = $("beat-pips").children;
  for (let k = 0; k < pips.length; k++) pips[k].className = k === i ? "on" + (i === 0 ? " first" : "") : "";
  setTimeout(() => { d.className = "beat-dot"; for (const p of pips) p.className = ""; }, 140);
  if (countingIn && info) {
    if (countStart == null && i === 0) countStart = info.n;
    if (countStart == null) return;
    countBeats = info.n - countStart + 1;
    if (countBeats > entryBeats()) {
      clearTimeout(countTimer);
      countTimer = setTimeout(endCountIn, Math.max(0, info.perf - performance.now()));
    } else refreshNext();
  }
});
function syncMetroUi() {
  $("metro-toggle").checked = metro.isRunning;
  $("btn-tempo").classList.toggle("metro-on", metro.isRunning);
  updateMicNote();
}
function setMetroBpm(n, silent) {
  metroBpm = Math.max(30, Math.min(240, Math.round(n))); syncMetroRate(); holds.setBpm(metroBpm, performance.now());
  $("bpm-val").textContent = metroBpm; $("tempo-t").textContent = `♩ ${metroBpm} BPM`;
  $("btn-tempo").setAttribute("aria-label", `Tempo: ${metroBpm} negras por minuto${isPulso() ? ", modo A pulso" : ""}. Tocá para cambiarlo o elegir el modo`);
  if (!silent) {
    rememberPractice();
    if (isPulso() && pulse && screen === "practice") { clearTimeout(pulseRestartT); pulseRestartT = setTimeout(() => { if (screen === "practice" && isPulso()) resetSession(); }, 600); }   // otro tempo = otra toma
  }
}
$("bpm-down").addEventListener("click", () => setMetroBpm(metroBpm - 4));
$("bpm-up").addEventListener("click", () => setMetroBpm(metroBpm + 4));
$("metro-toggle").addEventListener("change", (e) => { if (e.target.checked) metro.start(); else metro.stop(); syncMetroUi(); });
const startMode = () => settings.practiceStart || ((settings.countIn || isPulso()) ? "count" : "first");
const entryUnit = () => clickUnit(current?.timeSig);
const entryBeats = () => Math.max(1, Math.round(measureStarts(current).barLen / entryUnit()));
function syncMetroRate() { metro.setBpm(metroBpm); metro.setUnit(entryUnit()); }
$("practice-start").addEventListener("click", (e) => {
  const mode = e.target.closest("button[data-start]")?.dataset.start;
  if (!mode || mode === startMode()) return;
  settings.practiceStart = mode;
  store.saveSettings({ practiceStart: mode }).catch(() => {});
  if (current && screen === "practice") resetSession();
  syncModeUi();
});
/** Cuenta de entrada: un compás de clics; mientras tanto se ignoran las notas. */
function beginCountIn() {
  if (isPulso() || startMode() !== "count" || !current || !session) return;
  countWasOn = metro.isRunning;
  if (!metro.isRunning) { metro.start(); syncMetroUi(); }
  if (!metro.isRunning) return;   // sin audio: no se espera
  countingIn = true; countBeats = 0; countStart = null;
  clearTimeout(countTimer); countTimer = setTimeout(endCountIn, 60000 / metroBpm * 12 + 800);
  refreshNext();
}
function endCountIn() {
  if (!countingIn) return;
  countingIn = false; clearTimeout(countTimer);
  if (!countWasOn) { metro.stop(); syncMetroUi(); }
  refreshNext();
}

const midi = createMidiInput({
  onNoteOn: onMidiNoteOn,
  onNoteOff: onMidiNoteOff,
  onPedal: (down, ts) => holdPedal(down, ts),
  onStatus: (s) => {
    midiConnected = !!s.connected;
    if (!midiConnected) heldMidiCommands.clear();
    if (mic && mic.running) onMicStatus({ connected: true });
    $("midi-dot").classList.toggle("on", !!s.connected);
    $("midi-usb").classList.toggle("on", !!s.connected && s.via !== "ble");
    $("midi-ble").classList.toggle("on", !!s.connected && s.via === "ble");
    if (s.connected) markHintSeen();
    updateConnectHint();
    $("midi-status").textContent = s.connected ? `${s.name || "Piano"} (${s.via === "ble" ? "BT" : "USB"})` : s.error ? s.error : "Piano sin conectar";
    $("midi-status").title = $("midi-status").textContent;
    $("midi-status").classList.toggle("idle", !s.connected && !s.error);
    if (s.error) toast(s.error, 4500);
    refreshInputPill(); syncInputSheet(); tx.midiChanged();
  },
});

const heldMidiCommands = new Set();
const scoreUsesMidi = (score, midi) => score.measures.some((measure) =>
  ["rh", "lh"].some((hand) => measure[hand]?.some((ev) => ev.k.some((key) => keyToMidi(key) === midi))));
function handleMidiCommand(m) {
  if (heldMidiCommands.has(m)) return true;
  if (settings.midiTransport === false || (m !== 21 && m !== 108)) return false;
  if (screen === "review" && editState && !annoR.isActive() && !scoreUsesMidi(editState.score, m)) {
    heldMidiCommands.add(m);
    if (m === 21) lcR.pause();
    else if (lcR.isOpen) { if (!lcR.playing) lcR.play(); }
    else reviewListen();
    return true;
  }
  if (screen !== "practice" || !current || annoP.isActive() || scoreUsesMidi(current, m)) return false;
  heldMidiCommands.add(m);
  if (m === 21) {
    if (lcP.isOpen) lcP.pause();
    else if (!paused && (isPulso() ? pulse && !pulse.finished : session?.state.status === "playing")) setPaused(true);
  } else if (lcP.isOpen) { if (!lcP.playing) lcP.play(); }
  else if (paused) setPaused(false);
  else openListen();
  return true;
}
function onMidiNoteOn(m, vel, ts) {
  if (tx.midiNoteOn(m, vel, ts) || handleMidiCommand(m)) return;
  handleNoteOn(m, ts, "midi");
}
function onMidiNoteOff(m, ts) {
  if (heldMidiCommands.delete(m) || tx.midiNoteOff(m, ts)) return;
  handleNoteOff(m, ts);
}
if (!midi.supported.usb) { $("midi-usb").disabled = true; $("midi-usb").title = "Este navegador no soporta Web MIDI"; }
if (!midi.supported.ble) { $("midi-ble").disabled = true; $("midi-ble").title = "Este navegador no soporta Web Bluetooth"; }
$("midi-usb").addEventListener("click", () => {
  midi.connectUsb().catch((e) => toast("USB: " + (e && e.message || e), 4500));
  if (settings.midiTransport !== false) player.unlock().catch(() => {});
});
$("midi-ble").addEventListener("click", () => {
  midi.connectBle().catch((e) => toast("Bluetooth: " + (e && e.message || e), 4500));
  if (settings.midiTransport !== false) player.unlock().catch(() => {});
});

/* ---------- transcribir desde un audio y grabar la melodía (js/txflow.js) ---------- */
const txCtx = (s) => ({ title: s.title, artist: s.artist, sourceUrl: s.sourceUrl });
async function polishWithAi(score, c, mode) {
  if (!settings.apiKey) { toast("Para pulir con IA hace falta tu API key (Ajustes).", 3600); return null; }
  const token = ++importToken; const alive = () => token === importToken;
  busy.open("Puliendo con IA");
  const ctl = new AbortController(); composeAbort = ctl;
  try {
    const cm = await lazy("compose"), omr = await lazy("omr");
    const prov = settings.provider || "anthropic";
    const out = await cm.composeScore({ query: baseTitle(score.title), artist: score.artist || (c && c.artist) || "", sourceScore: score, level: "auto", style: mode === "melodia" ? "melodia" : "acompanamiento", provider: prov, apiKey: settings.apiKey, model: settings.model || (omr.DEFAULT_MODELS || {})[prov], onProgress: (t) => alive() && busy.log(t), signal: ctl.signal });
    if (!alive()) return null;
    busy.close();
    out.id = newId(); out.origin = score.origin; out.title = score.title;
    if (score.artist) out.artist = score.artist;
    if (score.sourceUrl) out.sourceUrl = score.sourceUrl;
    return out;
  } catch (err) {
    if (alive()) { busy.close(); toast((err && err.message) || "No se pudo pulir con IA.", 5000); }
    return null;
  } finally { if (composeAbort === ctl) composeAbort = null; }
}
const tx = createTxFlow({
  $, toast, lazy,
  getSettings: () => settings,
  midi: { connected: () => midiConnected, usb: () => midi.connectUsb(), ble: () => midi.connectBle(), supported: midi.supported },
  accompany: (sc) => { const out = addAccompaniment(sc); out.id = sc.id; out.title = sc.title; out.origin = sc.origin; if (sc.artist) out.artist = sc.artist; if (sc.sourceUrl) out.sourceUrl = sc.sourceUrl; delete out.level; return out; },
  polish: polishWithAi,
  openReview: ({ score, warnings, note, ctx }) => {
    score.id = score.id || newId();
    openReview(score, true, warnings, note, { listen: true });
    if (ctx && editState) editState.fromSearch = true;
  },
});
$("new-tx-file").addEventListener("click", () => { closeSheet(); tx.openChoose(null); $("file-audio").click(); });
$("new-tx-mic").addEventListener("click", () => { closeSheet(); tx.openChoose(null); $("tx-rec").click(); });
$("new-take").addEventListener("click", () => { closeSheet(); tx.openTake(null); });

/* ---------- micrófono ---------- */
let mic = null, midiConnected = false;
function currentExpected() {
  if (screen === "theory") return theory.expected();
  if (!session) return [];
  const st = session.state;
  if (st.status !== "playing") return [];
  const step = steps[st.index];
  return step ? step.midi.filter((m) => !st.pressed.includes(m)) : [];
}
function updateConnectHint() {
  const nothing = !midiConnected && !(mic && mic.running) && !settings.onscreenKeyboard;
  $("connect-hint").hidden = !(nothing && !settings.seenConnectHint && screen === "practice");
}
function markHintSeen() {
  if (settings.seenConnectHint) return;
  settings.seenConnectHint = true;
  store.saveSettings({ seenConnectHint: true }).catch(() => {});
}
$("connect-hint-ok").addEventListener("click", () => { markHintSeen(); updateConnectHint(); });
function updateMicNote() { $("mic-note").hidden = !(mic && mic.running && metro.isRunning); }
function onMicStatus(s) {
  const on = !!s.connected;
  $("mic-toggle").setAttribute("aria-pressed", String(on));
  $("mic-line").hidden = !on && !s.error;
  $("mic-dot").classList.toggle("on", on);
  if (on) markHintSeen();
  updateConnectHint();
  $("mic-dot").classList.toggle("err", !on && !!s.error);
  const st = $("mic-status");
  st.classList.toggle("err", !on && !!s.error);
  st.textContent = on ? (midiConnected ? "Micrófono en pausa: hay un piano MIDI conectado" : "Escuchando…") : s.error ? s.error : "Micrófono apagado";
  st.title = st.textContent;
  if (typeof s.level === "number") $("mic-meter").style.width = Math.round(s.level * 100) + "%";
  if (!on) $("mic-meter").style.width = "0";
  if (s.error) toast(s.error, 5000);
  updateMicNote(); refreshInputPill(); syncInputSheet();
}
async function startMic() {
  if (!mic) {
    const m = await lazy("mic");
    mic = m.createMicInput({ onNoteOn: (n) => { if (!midiConnected) handleNoteOn(n, undefined, "mic"); }, onStatus: onMicStatus, getExpected: currentExpected, sensitivity: settings.micSensitivity });
  }
  mic.setSensitivity(settings.micSensitivity);
  if (isPulso()) { toast("A pulso todavía no funciona con micrófono. Pasamos a «Te espero».", 4800); setMode("espera"); }
  await mic.start();
}
function stopMic() { if (mic) mic.stop(); }
if (!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) { $("mic-toggle").disabled = true; $("mic-toggle").title = "Este navegador no permite usar el micrófono (¿página sin HTTPS?)"; }
$("mic-toggle").addEventListener("click", () => {
  if (mic && mic.running) { stopMic(); return; }
  startMic().catch(() => { /* el estado ya muestra el error */ });
});
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && mic && mic.running) { stopMic(); } });
window.addEventListener("pagehide", stopMic);

async function requestWake() {
  try { if (navigator.wakeLock && screen === "practice" && !wakeLock) { wakeLock = await navigator.wakeLock.request("screen"); wakeLock.addEventListener("release", () => (wakeLock = null)); } } catch (e) { wakeLock = null; }
}
function releaseWake() { try { wakeLock && wakeLock.release(); } catch (e) { /* nada */ } wakeLock = null; }
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && screen === "practice") requestWake(); });

/* ----- estado de la sesión de práctica ----- */
let passage = null;                    // null = pieza entera; { from, to, loop } (loop:false = "seguir desde…")
let allSteps = [];                     // todos los pasos de la partitura para las manos elegidas (los usa el render)
let paused = false, listening = false, missView = null, attemptSaved = false, finishTimer = 0, lapTimer = 0;
let laps = [];                         // vueltas completas del bucle: [{ clean, wrong }]
let agg = { clean: 0, dirty: 0, wrong: 0 };   // acumulado de las vueltas completas
let trace = { clean: [], dirty: [], errors: [] };   // por paso, acumulado de las vueltas completas
let handMiss = { rh: 0, lh: 0 };
let lastRun = null;                    // para volver desde Resultado
const isLoop = () => !!(passage && passage.loop);
const N = () => (current && current.measures ? current.measures.length : 0);
const handsText = () => (hands === "rh" ? "Mano derecha" : hands === "lh" ? "Mano izquierda" : "Ambas manos");

function curStep() {
  if (isPulso()) return pulseRun ? steps[Math.min(pulseRun.k, steps.length - 1)] || null : null;
  const st = session && session.state; return st ? steps[Math.min(st.index, steps.length - 1)] : null;
}
function curMeasure() { const s = curStep(); return s ? s.measure : passage ? passage.from : 0; }

function startPractice(score, o = {}) {
  const r = o.resume || null;
  current = score;
  hands = o.hands || (r && r.hands) || "both";
  const n = (score.measures || []).length;
  passage = null;
  if (o.passage) passage = { ...normRange(o.passage, n), loop: !!o.passage.loop };
  else if (r && r.loop && r.from != null) { const nr = normRange({ from: r.from, to: r.to }, n); if (nr) passage = { ...nr, loop: true }; }
  else if (r && r.measure > 0 && r.measure < n) passage = { from: r.measure, to: n - 1, loop: false };
  if (passage && !passage.loop && passage.from === 0) passage = null;
  document.querySelectorAll("#hands-seg button").forEach((b) => b.classList.toggle("on", b.dataset.hands === hands));
  $("practice-title").textContent = score.title || "Práctica";
  let md = normMode(o.mode || (r && r.mode));
  if (md === "pulso" && mic && mic.running) { toast("A pulso todavía no funciona con micrófono. Seguís en «Te espero».", 4800); md = "espera"; }
  practiceMode = md;
  activeTask = o.task || null; taskBannerOff = false;
  setMetroBpm(o.bpm || (r && r.bpm) || score.bpm || 80, true);
  metro.setBeats(entryBeats());
  buildPips(entryBeats());
  kb.setRange(...Object.values(scoreRange(score)));
  if (lcP.isOpen) lcP.close("silent");
  kbOpen = false; paused = false; listening = false; closePSheet(true);
  session = null; pulse = null; pulseRun = null; // evita avisos de frases de la sesión anterior
  practiceR.setBadges(commentBadges(score));
  annoP.setScore(score.id, n);
  applyPhrases();
  renderTaskBanner(); syncModeUi();
  if (screen !== "practice") show("practice");
  resetSession();
  syncKbFold(); updateConnectHint(); refreshInputPill(); syncMetroUi();
  requestWake();
  if (passage && !passage.loop && !o.listen) toast(`Seguís desde el compás ${passage.from + 1}`, 2400);
  if (o.listen) openListen();
}
function resetSession() {
  attemptSaved = false; kb.setHint(null); curPhrase = "-"; hidePhraseNote(); hideStuck(); missView = null;
  clearTimeout(finishTimer); clearTimeout(lapTimer); stopPulse(); stopListening(true); endCountIn(); setPaused(false, true);
  lastNoteMeasure = -1; hideMeasureNote(); pulseRun = null; pulse = null; session = null;
  errLog = []; errDetail = null; clearTimeout(errDetailT);
  resetHolds();
  laps = []; agg = { clean: 0, dirty: 0, wrong: 0 }; trace = { clean: [], dirty: [], errors: [] }; handMiss = { rh: 0, lh: 0 };
  allSteps = buildSteps(current, hands);
  practiceHandMarks.clear();
  holdAll = holdInfo(current, allSteps);
  steps = passage ? passageSteps(allSteps, passage) : allSteps;
  practiceR.clearMarks(); practiceR.setCursor(null);
  practiceR.draw(current, allSteps);
  practiceR.setRange(isLoop() ? passage : null);
  syncLoopButton(); renderLapLine();
  if (!steps.length) { session = null; refreshNext(); updatePracticeUi(); syncKeyboard(); return; }
  if (isPulso()) { startPulseTake(); return; }
  newSession(true);
  trackPhrase(); trackMeasureNote(steps[0].measure);
  beginCountIn();
}
/** Sesión nueva sobre los mismos pasos (arranque o nueva vuelta del bucle). */
function newSession(first) {
  session = createSession(steps, { maxStreak: isLoop() ? 999 : MAX_STREAK });
  missView = null;
  if (!first) practiceR.clearMarks();
  practiceHandMarks.clear();
  practiceR.setCursor(steps[0].i);
  lastNoteMeasure = -1; trackMeasureNote(steps[0].measure);
  updatePracticeUi(); syncKeyboard(true); refreshNext();
}
function leavePractice() {
  annoP.exit(true); annoPaused = false;
  stopPulse(); hideMeasureNote();
  rememberPractice(true);
  metro.stop(); syncMetroUi(); releaseWake(); stopMic(); updateMicNote();
  clearTimeout(finishTimer); clearTimeout(lapTimer); hidePhraseNote(); stopListening(true); endCountIn(); closePSheet(true); hideStuck(); $("toast").hidden = true;
}

/* ----- recuerdo del último pasaje / mano / tempo por partitura ----- */
let saveMemT = 0;
function rememberPractice(now) {
  if (!current || !current.id) return;
  const entry = { from: passage ? passage.from : null, to: passage ? passage.to : null, loop: isLoop(), hands, bpm: metroBpm, mode: practiceMode, measure: curMeasure(), at: Date.now() };
  settings.lastPractice = mergePractice(settings.lastPractice, current.id, entry);
  clearTimeout(saveMemT);
  const save = () => store.saveSettings({ lastPractice: settings.lastPractice }).catch(() => {});
  if (now) save(); else saveMemT = setTimeout(save, 700);
}

/* ----- modo "A pulso": el cursor avanza solo al tempo y cada paso tiene su instante ideal ----- */
let practiceMode = "espera";           // "espera" (Te espero) | "pulso" (A pulso)
let pulse = null, pulseRun = null, pulseTimer = 0, pulseRestartT = 0, pulseInfo = null, markedLap = -1;
let pulsePausedAt = null;
const pulseWin = () => windowFor(metroBpm, settings.pulseWindow || DEFAULT_WINDOW);
const isPulso = () => practiceMode === "pulso";
metro.onBeat((i, info) => {   // la primera pulsación fija el instante de la toma: cuenta de entrada de un compás y arranca
  if (!pulseRun || !info) return;
  if (pulseRun.phase === "count" && pulseRun.take0 == null && info.n === 0) pulseRun.take0 = info.perf + pulseRun.nBeats * entryUnit() * beatMs(metroBpm);
  if (pulseRun.phase === "count") { pulseRun.countN = Math.min(pulseRun.nBeats, info.n + 1); refreshNext(); }
});
const MODE_HINT = {
  espera: "Aprendé las notas: la app espera a que toques cada una.",
  pulso: "Tocá con el metrónomo: el cursor avanza solo y te marca si vas adelantado o atrasado.",
};
function syncModeUi() {
  const p = isPulso();
  document.querySelectorAll("#mode-seg button").forEach((b) => { const on = b.dataset.mode === practiceMode; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
  $("mode-hint").textContent = MODE_HINT[practiceMode] + (mic && mic.running && !p ? " A pulso todavía no funciona con micrófono." : "");
  $("btn-tempo").classList.toggle("pulso", p);
  $("btn-tempo").setAttribute("aria-label", `Tempo: ${metroBpm} negras por minuto${p ? ", modo A pulso" : ""}. Tocá para cambiarlo o elegir el modo`);
  $("metro-toggle").disabled = p;
  $("metro-toggle").closest(".switch").classList.toggle("locked", p);
  document.querySelectorAll("#practice-start button").forEach((b) => {
    const on = b.dataset.start === startMode();
    b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on));
  });
  $("countin-sub").textContent = startMode() === "first"
    ? "Tocá la primera nota indicada para arrancar."
    : "Escuchá un compás de clics y empezá en el siguiente tiempo fuerte.";
  $("practice-streak").hidden = p;
  syncMetroUi();
}
function setMode(m) {
  m = normMode(m);
  if (m === "pulso" && mic && mic.running) { toast("A pulso todavía no funciona con micrófono. Seguís en «Te espero».", 4800); syncModeUi(); return false; }
  if (m === practiceMode) { syncModeUi(); return true; }
  practiceMode = m;
  if (current && screen === "practice") { clearTimeout(finishTimer); closePSheet(true); resetSession(); rememberPractice(); }
  syncModeUi();
  return true;
}
$("mode-seg").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setMode(b.dataset.mode); });
function stopPulse() { clearInterval(pulseTimer); pulseTimer = 0; clearTimeout(pulseRestartT); pulseRestartT = 0; }
function startPulseTake() {
  stopPulse();
  pulsePausedAt = null;
  const ms = measureStarts(current);
  const from = passage ? passage.from : 0, to = passage ? passage.to : N() - 1;
  const origin = ms.starts[from] || 0, lapBeats = (to + 1 < ms.starts.length ? ms.starts[to + 1] : ms.total) - origin;
  const nBeats = entryBeats();
  pulse = createPulse(steps, { bpm: metroBpm, win: pulseWin(), origin, lapBeats: lapBeats > 0 ? lapBeats : ms.barLen, loop: isLoop() });
  const first = startMode() === "first";
  pulseRun = { phase: first ? "armed" : "count", take0: null, nBeats, countN: 0, k: 0, lap: -1, laps: [] };
  pulseInfo = null; markedLap = -1; missView = null;
  metro.stop(); syncMetroRate(); metro.setBeats(nBeats);
  if (!first) metro.start();
  if (!first && !metro.isRunning) {
    pulse = null; pulseRun = null; practiceMode = "espera"; syncModeUi();
    toast("Este navegador no puede reproducir el metrónomo: seguís en «Te espero».", 4800);
    resetSession(); return;
  }
  syncMetroUi();
  practiceR.setCursor(steps[0].i);
  pulseTimer = setInterval(pulseTick, 30);
  trackPhrase(); lastNoteMeasure = -1; trackMeasureNote(steps[0].measure);
  updatePracticeUi(); syncKeyboard(true); refreshNext();
}
function markPulse(entry, kind) {   // la partitura muestra la vuelta en curso: al empezar otra vuelta se limpian las marcas
  if (entry.lap < markedLap) return;
  if (entry.lap > markedLap) { practiceR.clearMarks(); practiceHandMarks.clear(); markedLap = entry.lap; }
  practiceR.markStep(entry.i, kind);
}
function pulseTick() {
  if (!pulse || !pulseRun || screen !== "practice" || paused || listening || pulseRun.take0 == null) return;
  const now = performance.now() - pulseRun.take0;
  if (now < 0) return;
  if (pulseRun.phase !== "play") { pulseRun.phase = "play"; refreshNext(); }
  const lap = isLoop() ? Math.floor(now / pulse.lapMs) : 0;
  let k = 0;
  for (let q = 0; q < steps.length; q++) { if (pulse.idealAt(q, lap) <= now + 20) k = q; else break; }
  if (lap !== pulseRun.lap || k !== pulseRun.k) {
    pulseRun.lap = lap; pulseRun.k = k;
    practiceR.setCursor(steps[k].i); practiceR.follow();
    trackPhrase(); trackMeasureNote(steps[k].measure); syncKeyboard(true); updatePracticeUi(); refreshNext();
  }
  let changed = false;
  for (const c of pulse.tick(now)) {
    changed = true;
    const target = stepHandNotes(c.entry);
    if (hasTwoHands(target)) {
      if (c.entry.lap < markedLap) continue;
      markPulse(c.entry, null);
      for (const hand of ["rh", "lh"]) {
        const missing = target[hand].filter((m) => c.missing.includes(m));
        if (!missing.length || practiceR.hasError(c.entry.i, hand)) continue;
        const text = withHand(`Faltó ${names(missing)}`, hand);
        pulseError(c.entry, "omit", null, text, hand, missing);
      }
      showHandFeedback(c.entry, c.hit, null, c.timing === "ontime" ? "clean" : (c.timing || "clean"));
      if (c.lapDone && isLoop()) pulseLapDone(c.entry.lap);
      continue;
    }
    if (c.status !== "hit") {
      markPulse(c.entry, "dirty");
      if (c.status === "missed" && c.entry.lap >= markedLap) {
        practiceR.setTag(c.entry.i, "omitida", "miss"); pulseInfo = { cls: "miss", sub: "Omitiste una nota" }; refreshNext();
        pulseError(c.entry, "omit", null, `No tocaste nada · Se esperaba ${names(c.entry.midi)}`);
      } else if (c.status === "wrong" && c.entry.lap >= markedLap && !practiceR.hasError(c.entry.i)) pulseError(c.entry, "wrong", null, `Faltaron notas · Se esperaba ${names(c.entry.midi)}`);
    }
    if (c.lapDone && isLoop()) pulseLapDone(c.entry.lap);
  }
  if (changed) updatePracticeUi();
  if (pulse.finished) finishPulse();
}
/** Marca el error en el lugar donde ocurrió (✕ nota equivocada, ○ omitida) y lo anota para la lista. entry = { i, measure, midi, lap }. */
function pulseError(entry, kind, played, text, hand, expected = entry.midi) {
  if (entry.lap < markedLap) return;
  if (!hand) markPulse(entry, "dirty");
  practiceR.markError(entry.i, { kind, played, expected, text, hand });
  logError({ measure: entry.measure, kind, text });
  announceError(text, entry.measure);
}
function pulseLapDone(lap) {
  const r = pulse.lapResult(lap).summary;
  pulseRun.laps.push({ clean: r.pctCorrect === 100 && r.pctOnTime === 100 && r.wrongNotes === 0, pct: r.pctCorrect });
  laps = pulseRun.laps; renderLapLine();
}
function finishPulse() {
  stopPulse(); metro.stop(); syncMetroUi();
  clearTimeout(finishTimer); finishTimer = setTimeout(showResult, 500);
}
const FB_CLS = { ontime: "ontime", early: "early", late: "late" };
function pulseNote(m, ts, src) {
  if (!pulse || !pulseRun || paused || listening) return;
  if (pulseRun.phase === "armed") {
    if (!steps[0].midi.includes(m)) return;
    const firstAt = pulse.idealAt(0, 0);
    pulseRun.take0 = ts - firstAt;
    pulseRun.phase = "play";
    resumePulseClock(ts);
  }
  if (pulseRun.take0 == null) return;
  const r = pulse.noteOn(m, ts - pulseRun.take0);
  if (r.kind === "ignored") return;
  practiceR.follow();
  if (r.kind === "hit") {
    kb.flash(m, "ok"); startHold(m, r.entry.i, src, ts);
    const target = stepHandNotes(r.entry), split = hasTwoHands(target);
    if (split && r.entry.lap >= markedLap) {
      markPulse(r.entry, null);
      const status = r.meanTiming === "ontime" ? "clean" : r.meanTiming;
      const marks = showHandFeedback(r.entry, r.hit, null, status);
      for (const hand of ["rh", "lh"]) if (marks[hand] && target[hand].every((n) => r.hit.includes(n))) practiceR.resolveError(r.entry.i, hand);
    }
    if (r.done) {
      const tm = r.meanTiming;
      if (!split) markPulse(r.entry, tm === "ontime" ? "clean" : tm);
      practiceR.setTag(r.entry.i, TIMING_ES[tm], FB_CLS[tm]);
      pulseInfo = { cls: FB_CLS[tm], sub: `${TIMING_ES[tm][0].toUpperCase()}${TIMING_ES[tm].slice(1)} ${devText(r.meanDev)}` };
    }
  } else {
    kb.flash(m, "bad");
    const where = r.entry || (steps[pulseRun.k] ? { ...steps[pulseRun.k], lap: Math.max(0, pulseRun.lap) } : null);   // nota suelta: se marca en el paso que estaba sonando
    if (where && where.lap >= markedLap) {
      const target = stepHandNotes(where);
      if (hasTwoHands(target)) {
        const hit = r.hit || [];
        const missing = where.midi.filter((n) => !hit.includes(n));
        const hand = errorHand(target, m, missing);
        if (hand) {
          markPulse(where, null);
          const expected = target[hand].filter((n) => missing.includes(n));
          showHandFeedback(where, hit, hand);
          pulseError(where, "wrong", m, withHand(errMsg(m, expected), hand), hand, expected);
        } else if (!practiceR.hasError(where.i)) logError({ measure: where.measure, kind: "wrong", text: errMsg(m, missing.length ? missing : where.midi) });
      } else {
        if (r.entry) { markPulse(r.entry, "dirty"); practiceR.setTag(r.entry.i, "otra nota", "miss"); }
        pulseError(where, "wrong", m, errMsg(m, where.midi));
      }
    }
    pulseInfo = { cls: "miss", sub: `Tocaste ${midiName(m)}` };
  }
  refreshNext(); updatePracticeUi();
}
function pulseNext() {
  if (!pulseRun) { setNext("Sin notas", "No hay notas para esta selección de manos", "", ""); return; }
  if (paused) { setNext("En pausa", "Tocá Continuar", "", ""); return; }
  if (pulseRun.phase === "armed") { setNext("Primera nota", settings.guide === false ? "Tocá para arrancar" : names(steps[0].midi), "", "La primera nota correcta activa el pulso"); return; }
  if (pulseRun.phase === "count") { setNext("Cuenta de entrada", String(Math.max(1, pulseRun.countN || 1)), "", "Empezá en el primer tiempo fuerte"); return; }
  const guide = settings.guide !== false, st = steps[pulseRun.k];
  setNext("A pulso", guide && st ? names(st.midi) : "Seguí el pulso", pulseInfo ? pulseInfo.cls : "", pulseInfo ? pulseInfo.sub : "");
}

/* ----- sostener las notas largas (carril sobre el piano guía + barra sobre la partitura) ----- */
const holds = createHoldTracker({ bpm: 80, now: () => performance.now(), onResult: (v) => onHoldResult(v) });
const holdMode = () => normHoldMode(settings.holdMode);
let holdAll = [];                       // holdInfo por paso global (índice = step.i)
const holdMeta = new Map();             // midi → info de la nota que se está sosteniendo
let holdSrc = "practice", holdRaf = 0, holdWait = null, durSteps = new Set();
let listenSnap = null, listenSig = "";
const endRefCache = new Map();
const say = (t) => { const el = $("hold-live"); el.textContent = ""; requestAnimationFrame(() => { el.textContent = t; }); };
const timeNow = (ts) => { const n = performance.now(); return Number.isFinite(ts) && Math.abs(ts - n) < 2000 ? ts : n; };
function resetHolds() {
  holds.reset(); holdMeta.clear(); durSteps = new Set(); holdWait = null;
  kb.setHolds([]); kb.setHoldMsg(""); practiceR.setHolds([]); practiceR.setCursorWait(false);
}
function startHold(m, stepI, src, ts) {
  if (holdMode() === "apagado" || screen !== "practice") return;
  const n = (holdAll[stepI] || []).find((x) => x.midi === m);
  const t = timeNow(ts), guided = src === "mic";
  if (!n) return;
  holds.press(m, { hand: n.hand, beats: n.beats, measure: n.measure, step: n.step, guided }, t);
  if (n.beats >= 1) {
    holdMeta.set(m, n); holdSrc = "practice";
    const b = Math.round(n.beats * 2) / 2;
    say(`Sostené ${String(b).replace(".", ",")} ${b <= 1 ? "tiempo" : "tiempos"}`);
    if (guided) kb.setHoldMsg("Con micrófono no mido cuánto sostenés: es sólo una guía", "info", 3200);
    holdKick();
  }
}
function handleNoteOff(m, ts) {
  if (screen !== "practice") return;
  holds.release(m, timeNow(ts)); holdKick();
}
function holdPedal(down, ts) { if (screen !== "practice") return; holds.pedal(down, timeNow(ts)); holdKick(); }
function onHoldResult(v) {
  if (v.state === "done") {
    if (v.total >= 2) kb.setHoldMsg("¡Bien!", "ok", 900);
    say(`Completaste los ${Math.round(v.total * 2) / 2} ${v.total <= 1 ? "tiempo" : "tiempos"}`.replace("Completaste los 1 tiempo", "Completaste el tiempo"));
    return;
  }
  const msg = `Soltaste antes · ${beatsText(v.short)}`;
  kb.setHoldMsg(msg, "bad", 2800); say(msg);
  if (holdMode() === "exigir" && !v.excused && v.step != null) {
    const meta = holdMeta.get(v.midi), text = `Soltaste antes ${midiName(v.midi)} · ${beatsText(v.short)}`;
    durSteps.add(v.step);
    if (!practiceR.hasError(v.step)) practiceR.markStep(v.step, "dur");
    errLog.push({ measure: v.measure != null ? v.measure : 0, kind: "dur", text });
    if (errLog.length > 60) errLog.shift();
    updatePracticeUi();
  }
}
function holdKick() { if (!holdRaf) holdRaf = requestAnimationFrame(holdFrame); }
function holdFrame() {
  holdRaf = 0;
  if (holdMode() === "apagado") { kb.setHolds([]); practiceR.setHolds([]); return; }
  const now = performance.now(), kbL = [], scL = [];
  let keep = false;
  if (holdSrc === "listen") {
    if (!listenSnap) { kb.setHolds([]); practiceR.setHolds([]); return; }
    const b = listenSnap.beat + (now - listenSnap.t) * listenSnap.rate;
    for (const e of listenSnap.events) {
      const el = Math.max(0, Math.min(e.dur, b - e.beat)); if (el >= e.dur) continue;
      const st = { total: e.dur, remaining: e.dur - el, fraction: el / e.dur, state: "holding", hand: e.hand };
      if (e.dur >= 1 - 1e-9) kbL.push({ midi: e.midi, ...st });
      let er = endRefCache.get(e.id);
      if (er === undefined && current) { er = endRefOf(current, { measure: e.measure, hand: e.hand, idx: e.idx, keyIdx: e.keyIdx }); endRefCache.set(e.id, er); }
      scL.push({ id: "L" + e.id, ref: { measure: e.measure, hand: e.hand, idx: e.idx, keyIdx: e.keyIdx }, endRef: er, hand: e.hand, fraction: st.fraction, state: "holding" });
    }
    keep = listenSnap.rate > 0 && listening;
  } else {
    let wait = null;
    const views = holds.tick(now), nxt = !isPulso() && session && session.state.status === "playing" ? steps[session.state.index] : null;
    for (const v of views) {
      kbL.push(v);
      const meta = holdMeta.get(v.midi);
      if (meta && meta.ref) scL.push({ id: v.id, ref: meta.ref, endRef: meta.endRef, hand: v.hand, fraction: v.fraction, state: v.state });
      if (v.state === "holding" && nxt && meta && nxt.t >= meta.end - 1e-6 && v.remaining > 0.05 && (!wait || v.remaining > wait.remaining)) wait = { remaining: v.remaining, midi: v.midi };
    }
    keep = views.length > 0;
    const k0 = holdWait ? Math.ceil(holdWait.remaining - 1e-6) : 0, k1 = wait ? Math.ceil(wait.remaining - 1e-6) : 0;
    holdWait = wait;
    practiceR.setCursorWait(!!wait);
    if (k0 !== k1) refreshNext();
  }
  kb.setHolds(kbL); practiceR.setHolds(scL);
  if (keep) holdRaf = requestAnimationFrame(holdFrame);
}
function listenSound(f) {
  holdSrc = "listen";
  listenSnap = { beat: f.beat, t: performance.now(), rate: f.playing ? f.rate / 1000 : 0, events: f.events };
  const sig = f.events.map((e) => e.id).join(",");
  if (sig !== listenSig) {   // las teclas quedan encendidas durante TODA la duración de su nota
    listenSig = sig;
    if (settings.guide !== false) kb.setTargets(f.events.map((e) => ({ midi: e.midi, hand: e.hand })));
  }
  holdKick();
}
/** Campos del intento sobre duraciones (vacío si no hubo notas largas evaluadas). */
function holdRec() {
  const sum = summarizeHolds(holds.results);
  if (!sum.total) return {};
  return { holdTotal: sum.total, holdOk: sum.ok, holdWeak: sum.byMeasure.slice(0, 3).map((w) => ({ measure: w.measure, errors: w.early })), holdMode: holdMode(), holdDurSteps: holdMode() === "exigir" ? durSteps.size : 0 };
}
function renderHoldLine(rec) {
  const el = $("result-holds"); if (!el) return;
  const line = rec && rec.holdTotal ? holdLine({ total: rec.holdTotal, ok: rec.holdOk }) : null;
  el.hidden = !line;
  if (!line) { el.textContent = ""; return; }
  const weak = holdWeakText({ byMeasure: (rec.holdWeak || []).map((w) => ({ measure: w.measure, early: w.errors })) });
  const extra = rec.holdDurSteps ? ` · ${rec.holdDurSteps} ${rec.holdDurSteps === 1 ? "paso marcado" : "pasos marcados"} con error de duración` : "";
  el.innerHTML = `${esc(line)}${extra}${weak ? `<br><span>${esc(weak)}</span>` : ""}`;
}
/* ajuste «Sostener las notas» (hoja de Tempo y Ajustes) */
const HOLD_HINT = { mostrar: "Anima y avisa cuánto sostener. No penaliza.", exigir: "Soltar antes marca el paso con error de duración (no corta el intento).", apagado: "Sin animación ni evaluación de duraciones." };
function syncHoldUi() {
  const m = holdMode();
  document.querySelectorAll("#hold-seg button, #set-hold button").forEach((b) => { const on = b.dataset.hold === m; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
  document.querySelectorAll(".hold-hint").forEach((e) => { e.textContent = HOLD_HINT[m]; });
}
function setHoldMode(m) {
  settings.holdMode = normHoldMode(m);
  store.saveSettings({ holdMode: settings.holdMode }).catch(() => {});
  if (settings.holdMode === "apagado") resetHolds();
  kb.setLane(settings.holdMode !== "apagado"); syncHoldUi();
}
document.querySelectorAll("#hold-seg, #set-hold").forEach((g) => g.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setHoldMode(b.dataset.hold); }));

/* ----- comentarios por compás, en Práctica ----- */
let lastNoteMeasure = -1, mNoteTimer = 0;
function commentBadges(sc) {
  return Object.keys((sc && sc.comments) || {}).map((k) => ({ measure: +k, type: "comment", label: `Comentario del compás ${+k + 1}: ${sc.comments[k]}` }));
}
function showMeasureNote(m, text) {
  const n = $("measure-note");
  n.innerHTML = `<b>Compás ${m + 1}</b><span>${esc(text)}</span>`; n.hidden = false;
  clearTimeout(mNoteTimer); mNoteTimer = setTimeout(hideMeasureNote, 6000);
}
function hideMeasureNote() { clearTimeout(mNoteTimer); $("measure-note").hidden = true; }
$("measure-note").addEventListener("click", hideMeasureNote);
/** Al llegar a un compás con comentario, se muestra un momento. */
function trackMeasureNote(m) {
  if (m === lastNoteMeasure) return;
  lastNoteMeasure = m;
  const c = current && current.comments && current.comments[m];
  if (c) showMeasureNote(m, c); else hideMeasureNote();
}
practiceR.onBadgeTap(({ measure, type }) => { if (type === "comment" && current && current.comments && current.comments[measure]) showMeasureNote(measure, current.comments[measure]); });

/* ----- consigna de la tarea ----- */
let activeTask = null, taskBannerOff = false;
function renderTaskBanner() {
  const t = activeTask;
  $("task-banner").hidden = !t || taskBannerOff;
  if (!t) return;
  $("task-banner-h").textContent = "Tarea · " + describeTask(t, N());
  $("task-banner-t").textContent = t.text || "";
  $("task-banner-t").hidden = !t.text;
}
$("task-banner-x").addEventListener("click", () => { taskBannerOff = true; renderTaskBanner(); requestAnimationFrame(() => practiceR.redraw()); });

/* ----- texto de "Próxima nota" ----- */
const names = (arr) => (arr || []).map(midiName).join(" + ");
function expectedNow() {
  const st = session && session.state;
  const step = st && st.status === "playing" ? steps[st.index] : null;
  return step ? step.midi.filter((m) => !st.pressed.includes(m)) : [];
}
let nextOverride = null;   // { label, name } temporal (p. ej. "Vuelta 2 limpia")
let errDetail = null, errDetailT = 0;   // detalle de una marca de error que se tocó: { kind, measure, text }
let errLog = [];                          // errores de la toma (para la lista de Resultado)
const errMsg = (played, expected) => `Tocaste ${played == null ? "otra nota" : midiName(played)} · Se esperaba ${names(expected)}`;
/** Anuncia (aria-live polite) y muestra el detalle de un error. */
function announceError(text, measure) {
  const el = $("err-live"); el.textContent = "";
  requestAnimationFrame(() => { el.textContent = `${text}. Compás ${measure + 1}.`; });
}
function logError(e) {
  const l = errLog[errLog.length - 1];
  if (l && l.measure === e.measure && l.text === e.text && l.kind === e.kind) return;
  errLog.push(e);
  if (errLog.length > 60) errLog.shift();
}
function showErrDetail(d) {
  errDetail = d; clearTimeout(errDetailT);
  errDetailT = setTimeout(() => { errDetail = null; refreshNext(); }, 6000);
  announceError(d.text, d.measure); refreshNext();
}
practiceR.onErrorTap((d) => showErrDetail({ kind: d.kind, measure: d.measure, text: d.text }));
function setNext(labelHtml, name, cls, sub) {
  const box = $("next-info");
  box.className = "next-info" + (cls ? " " + cls : "");
  $("next-label").innerHTML = labelHtml; $("next-name").textContent = name;
  $("next-sub").textContent = sub || "";
}
function refreshNext() {
  const guide = settings.guide !== false;
  if (listening) return;   // lo maneja la reproducción
  if (annoP.isActive() && screen === "practice") { setNext("Anotando", "En pausa", "", "La evaluación sigue al tocar «Listo»"); return; }
  if (errDetail) { setNext(`<span class="n-bad">${errDetail.kind === "omit" ? "○" : "✕"} Compás ${errDetail.measure + 1}</span>`, errDetail.text, "bad err", ""); return; }
  if (isPulso()) { pulseNext(); return; }
  if (!session) { setNext("Sin notas", "No hay notas para esta selección de manos", "", ""); return; }
  const st = session.state;
  if (countingIn) { setNext("Cuenta de entrada", String(Math.max(1, Math.min(entryBeats(), countBeats))), "", "Empezá en el próximo tiempo fuerte"); return; }
  if (paused) { setNext("En pausa", "Tocá Continuar", "", ""); return; }
  if (nextOverride) { setNext(nextOverride.label, nextOverride.name, nextOverride.cls || "", nextOverride.sub); return; }
  if (st.status === "finished") { setNext("", "¡Terminaste!", "", ""); return; }
  if (missView) { setNext(`<span class="n-bad">✕ Nota equivocada · compás ${missView.measure + 1}</span>`, missView.msg, "bad err", guide ? missView.sub : "Probá de nuevo"); return; }
  if (holdWait) { setNext("Seguí sosteniendo…", beatsText(Math.ceil(holdWait.remaining - 1e-6), false), "hold", "Todavía no toca la próxima nota"); return; }
  if (!guide) { setNext("Guía apagada", "Seguí la partitura", "", ""); return; }
  const exp = expectedNow();
  const partial = st.pressed.length > 0;
  setNext(partial ? "Falta" : "Próxima nota", names(exp) || "—", "", "");
}
function setPaused(v, silent) {
  paused = !!v;
  const b = $("practice-pause");
  b.setAttribute("aria-pressed", String(paused));
  b.querySelector("use").setAttribute("href", paused ? "#i-play" : "#i-pause");
  $("pause-t").textContent = paused ? "Continuar" : "Pausar";
  if (paused) holds.clearActive();
  if (silent) return;
  if (isPulso()) {
    const now = performance.now();
    if (paused) {
      pulsePausedAt = pulseRun?.phase === "play" ? now : null;
      stopPulse(); metro.stop(); syncMetroUi(); refreshNext();
    } else if (pulsePausedAt != null && pulseRun?.take0 != null) {
      pulseRun.take0 += now - pulsePausedAt;
      pulsePausedAt = null;
      resumePulseClock(now);
      pulseTimer = setInterval(pulseTick, 30);
      refreshNext();
    } else resetSession();
    return;
  }
  if (paused) { countWasPaused = metro.isRunning; endCountIn(); metro.stop(); }
  else { if (countWasPaused) metro.start(); beginCountIn(); }
  syncMetroUi(); refreshNext();
}
function resumePulseClock(now) {
  const origin = pulseRun.take0;
  const unitMs = entryUnit() * beatMs(metroBpm);
  const beat = Math.max(1, Math.floor((now - origin) / unitMs) + 1);
  metro.start({ delay: Math.max(0.05, (origin + beat * unitMs - performance.now()) / 1000), beat });
  syncMetroUi();
}
let countWasPaused = false;
$("practice-pause").addEventListener("click", () => {
  if (listening) { stopListening(); return; }
  if (isPulso()) { if (pulse) setPaused(!paused); return; }
  if (!session || session.state.status !== "playing") return;
  setPaused(!paused);
});

function updateHeader() {
  const n = N();
  const m = curMeasure();
  $("hands-t").textContent = handsText();
  $("measure-now").textContent = `Compás ${Math.min(n, m + 1)} de ${n}`;
  $("hands-link").setAttribute("aria-label", `${handsText()}, compás ${Math.min(n, m + 1)} de ${n}. Tocá para cambiar la mano, reiniciar o terminar`);
}
function updatePracticeUi() {
  if (isPulso()) {
    const total = steps.length, closed = pulse ? (isLoop() ? (pulseRun ? pulseRun.k + 1 : 0) : Math.min(pulse.closed, total)) : 0;
    $("practice-progress-txt").textContent = `${closed} / ${total}`;
    $("practice-progress").style.width = (total ? (closed / total) * 100 : 0) + "%";
    updateHeader(); return;
  }
  const st = session ? session.state : { index: 0, total: steps.length, streak: 0 };
  const sk = $("practice-streak");
  sk.setAttribute("aria-label", `Errores seguidos: ${st.streak} de ${MAX_STREAK}`);
  sk.querySelectorAll(".dots i").forEach((d, i) => d.classList.toggle("f", i < st.streak));
  sk.querySelector(".streak-n").textContent = `${Math.min(st.streak, MAX_STREAK)}/${MAX_STREAK}`;
  sk.className = "streak" + (st.streak >= MAX_STREAK ? " danger" : st.streak >= 3 ? " warn" : "");
  const done = st.status === "finished" ? st.total : st.index;
  $("practice-progress-txt").textContent = `${done} / ${st.total}`;
  $("practice-progress").style.width = (st.total ? (done / st.total) * 100 : 0) + "%";
  updateHeader();
}

/* ----- bucle: botón, hoja de selección, vueltas ----- */
function syncLoopButton() {
  const on = isLoop();
  $("loop-t").textContent = on ? `Bucle ${rangeText(passage)}` : "Bucle";
  $("btn-loop").setAttribute("aria-pressed", String(on));
  $("btn-loop").setAttribute("aria-label", on ? `Bucle activo, compases ${rangeText(passage)}. Tocá para cambiarlo o quitarlo` : "Bucle: elegir compases para repetir");
}
function renderLapLine() {
  const el = $("lap-line");
  if (isPulso() && !isLoop()) { el.hidden = false; el.setAttribute("aria-label", `A pulso, margen más o menos ${pulseWin()} milisegundos`); el.innerHTML = `<b>A pulso</b><span>a tiempo = ±${pulseWin()} ms</span>`; return; }
  if (!isLoop()) { el.hidden = true; el.innerHTML = ""; return; }
  const chips = laps.slice(-6).map((l, i, arr) => { const no = laps.length - arr.length + i + 1; return `<span class="lap ${l.clean ? "clean" : "dirty"}" aria-label="Vuelta ${no}: ${l.clean ? "limpia" : "con errores"}">${l.clean ? "✓" : "✕"} ${no}</span>`; }).join("");
  const clean = laps.filter((l) => l.clean).length;
  el.hidden = false;
  el.setAttribute("aria-label", `Vuelta ${laps.length + 1}. ${laps.length ? `${clean} de ${laps.length} vueltas limpias` : "Todavía no completaste ninguna vuelta"}`);
  el.innerHTML = `<b>Vuelta ${laps.length + 1}</b>${chips}${isPulso() ? `<span>a tiempo = ±${pulseWin()} ms</span>` : ""}`;
}
let draft = null, listenHands = "both", listenSlow = false;
function initLoopSheet() {
  const n = N();
  draft = isLoop() ? { from: passage.from, to: passage.to } : currentPair(curMeasure(), n);
  listenHands = hands;
  syncLoopSheet();
}
function syncLoopSheet() {
  const n = N();
  $("lp-from").textContent = draft.from + 1; $("lp-to").textContent = draft.to + 1;
  $("lp-from-dn").disabled = draft.from <= 0; $("lp-from-up").disabled = draft.from >= draft.to;
  $("lp-to-dn").disabled = draft.to <= draft.from; $("lp-to-up").disabled = draft.to >= n - 1;
  const cnt = passageSteps(allSteps, draft).length;
  $("lp-sum").textContent = `Compases ${rangeText(draft)} de ${n} · ${cnt} ${cnt === 1 ? "paso" : "pasos"}`;
  $("lp-off").hidden = !isLoop();
  $("lp-apply-t").textContent = isLoop() ? "Aplicar este pasaje" : "Practicar este pasaje";
  $("lp-slow").setAttribute("aria-pressed", String(listenSlow));
  document.querySelectorAll("#lp-hands button").forEach((b) => b.classList.toggle("on", b.dataset.hands === listenHands));
  $("lp-listen-t").textContent = listening ? "Detener" : "Escuchar";
  $("lp-listen").querySelector("use").setAttribute("href", listening ? "#i-stop" : "#i-ear");
  practiceR.setRange(draft);   // vista previa del rango en la partitura
}
const moveDraft = (k, d) => { draft[k] += d; if (draft.from > draft.to) { if (k === "from") draft.from = draft.to; else draft.to = draft.from; } draft.from = Math.max(0, draft.from); draft.to = Math.min(N() - 1, draft.to); if (listening) stopListening(); syncLoopSheet(); };
$("lp-from-dn").addEventListener("click", () => moveDraft("from", -1));
$("lp-from-up").addEventListener("click", () => moveDraft("from", 1));
$("lp-to-dn").addEventListener("click", () => moveDraft("to", -1));
$("lp-to-up").addEventListener("click", () => moveDraft("to", 1));
$("lp-pair").addEventListener("click", () => { draft = currentPair(curMeasure(), N()); if (listening) stopListening(); syncLoopSheet(); });
$("lp-off").addEventListener("click", () => { closePSheet(true); stopListening(true); passage = null; resetSession(); rememberPractice(); });
$("lp-apply").addEventListener("click", () => { const d = { ...draft }; closePSheet(true); startLoop(d); });
$("lp-slow").addEventListener("click", () => { listenSlow = !listenSlow; if (listening) stopListening(); syncLoopSheet(); });
document.querySelectorAll("#lp-hands button").forEach((b) => b.addEventListener("click", () => { listenHands = b.dataset.hands; syncLoopSheet(); }));
$("lp-listen").addEventListener("click", () => { if (listening) stopListening(); else { startListening({ range: draft, hands: listenHands, slow: listenSlow }); syncLoopSheet(); } });
/** Activa el bucle sobre un rango de compases y reinicia la sesión. */
function startLoop(range) {
  const r = normRange(range, N()); if (!r || !current) return;
  passage = { ...r, loop: true };
  if (screen !== "practice") show("practice");
  resetSession(); rememberPractice();
}

/* ----- ayuda al trabarse (bucle) ----- */
function showStuck() {
  const both = hands === "both" && handsWithNotes(steps);
  const canHand = both.rh && both.lh;
  const h = harderHand(handMiss) || "rh";
  $("st-hand").hidden = !canHand;
  $("st-hand").dataset.hand = h;
  $("st-hand-t").textContent = `Probar con ${h === "lh" ? "la mano izquierda" : "la mano derecha"}`;
  $("stuck-help").hidden = false;
}
function hideStuck() { $("stuck-help").hidden = true; }
$("st-go").addEventListener("click", hideStuck);
$("st-listen").addEventListener("click", () => { hideStuck(); listenSlow = true; startListening({ range: isLoop() ? passage : currentPair(curMeasure(), N()), hands, slow: true }); });
$("st-hand").addEventListener("click", () => { const h = $("st-hand").dataset.hand || "rh"; hideStuck(); setHands(h); });
$("st-measure").addEventListener("click", () => {
  hideStuck();
  const s = curStep(); if (!s || !session) return;
  const k0 = steps.findIndex((x) => x.measure === s.measure);
  if (k0 < 0) return;
  const from = session.state.index;
  if (!session.jumpTo(k0)) return;
  for (let k = k0; k <= from && k < steps.length; k++) {
    practiceR.markStep(steps[k].i, null);
    practiceR.clearStepErrors(steps[k].i);
    practiceHandMarks.delete(steps[k].i);
  }
  missView = null; kb.setHint(null);
  practiceR.setCursor(steps[k0].i); updatePracticeUi(); syncKeyboard(true); refreshNext(); trackPhrase();
});

/* ----- modo escucha en Práctica (Play, "Escuchar pasaje" de la ayuda y del bucle): la evaluación queda en pausa mientras dura ----- */
let micPaused = false;
function listenEnter() {
  listening = true; lcLastCursor = -2; resetHolds(); holdSrc = "listen";
  $("screen-practice").classList.add("listening");
  hideStuck(); setPaused(false, true); kb.setHint(null); missView = null;
  if (isPulso()) { stopPulse(); metro.stop(); syncMetroUi(); }
  if (mic && mic.running) { micPaused = true; stopMic(); }
  endCountIn();
  if (metro.isRunning) { metro.stop(); syncMetroUi(); }
}
function listenFrame(f) {
  if (f.step && f.step.i !== lcLastCursor) { lcLastCursor = f.step.i; practiceR.setCursor(f.step.i); }
  if (settings.guide !== false && f.notes.length) kb.focus(f.notes.map((x) => x.midi));
  $("measure-now").textContent = `Compás ${f.measure + 1} de ${N()}`;
  $("hands-t").textContent = "Escuchando";
}
function listenPlaying(p) {
  const b = $("btn-listen");
  b.querySelector("use").setAttribute("href", p ? "#i-pause" : "#i-play");
  b.setAttribute("aria-label", p ? "Pausar la escucha" : "Escuchar la partitura (Play)");
  b.setAttribute("aria-pressed", String(!!p));
  b.querySelector(".lbl").textContent = p ? "Pausar" : "Escuchar";
  if (p) requestWake();
}
function listenLeave(reason) {
  listening = false; lcLastCursor = -2; listenSnap = null; listenSig = ""; holdSrc = "practice"; kb.setHolds([]); practiceR.setHolds([]);
  $("screen-practice").classList.remove("listening");
  listenPlaying(false);
  if (micPaused) { micPaused = false; startMic().catch(() => {}); }
  const s = curStep();
  if (s && session) practiceR.setCursor(s.i);
  kb.setTargets([]); syncKeyboard(true); updatePracticeUi(); refreshNext();
  if (sheetName === "loop" && reason !== "silent") syncLoopSheet();
  if (isPulso() && reason !== "silent" && screen === "practice") resetSession();   // A pulso: después de escuchar se vuelve a empezar la toma
}
/** Play: toda la pieza (o el bucle / rango activo) con el cursor, el piano guía y la partitura siguiendo la música. */
function openListen(o = {}) {
  if (!current) return;
  closePSheet(true);
  const r = passage ? { from: passage.from, to: passage.to } : null;
  lcP.open({ range: r, bpm: current.bpm || 80, repeat: isLoop() ? true : undefined, autoplay: true, ...o });
}
/** "Escuchar pasaje" (ayuda al trabarse y selector de bucle): mismo motor, al tempo de práctica y con salida automática al terminar. */
function startListening({ range, hands: hs, slow }) {
  if (!current) return;
  const r = range ? normRange(range, N()) : null;
  lcP.open({ range: r, bpm: metroBpm, speed: slow ? 0.6 : 1, hands: hs || hands, repeat: false, autoplay: true, autoExit: true, temp: true });
}
function stopListening(silent) {
  if (!listening) return;
  lcP.close(silent ? "silent" : "stop");
}
$("btn-listen").addEventListener("click", () => {
  if (!current) return;
  if (lcP.isOpen) { lcP.toggle(); return; }
  if (annoP.isActive()) annoP.exit();
  openListen();
});
practiceR.onMeasureTap((m) => { if (lcP.isOpen) lcP.seekMeasure(m); });
/* opciones de escucha (hoja «Escucha») */
function syncListenSheet() {
  const o = lcP.options, bpm = lcP.bpm || (current && current.bpm) || 80;
  document.querySelectorAll("#ls-speed button").forEach((b) => { const v = +b.dataset.speed, on = v === o.speed; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); b.innerHTML = `${Math.round(v * 100)} %<small>♩ ${Math.round(bpm * v)}</small>`; });
  $("ls-bpm").textContent = `Tempo de la pieza: ♩ ${bpm} · ahora ♩ ${Math.round(bpm * o.speed)} BPM`;
  document.querySelectorAll("#ls-hands button").forEach((b) => { const on = b.dataset.hands === o.hands; b.classList.toggle("on", on); b.setAttribute("aria-pressed", String(on)); });
  const both = hands === "both";
  $("ls-mute").checked = !!o.muteMine && !both; $("ls-mute").disabled = both;
  $("ls-mute-sub").textContent = both ? "Para tocarla vos encima. Disponible cuando practicás con una sola mano." : `Deja de sonar la ${hands === "rh" ? "derecha" : "izquierda"} para que la toques vos encima.`;
  $("ls-metro").checked = !!o.metro; $("ls-count").checked = !!o.countIn; $("ls-along").checked = !!o.along;
  $("ls-vol").value = Math.round(o.volume * 100);
  $("ls-range").textContent = lcP.range ? `Suena: compases ${rangeText(lcP.range)}${o.repeat ? " (en bucle)" : ""}.` : `Suena: toda la pieza${o.repeat ? " (en bucle)" : ""}.`;
}
$("ls-speed").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { lcP.setSpeed(+b.dataset.speed); syncListenSheet(); } });
$("ls-hands").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { lcP.setHands(b.dataset.hands); syncListenSheet(); } });
$("ls-mute").addEventListener("change", (e) => lcP.setMuteMine(e.target.checked));
$("ls-metro").addEventListener("change", (e) => lcP.setMetro(e.target.checked));
$("ls-count").addEventListener("change", (e) => lcP.setCountIn(e.target.checked));
$("ls-along").addEventListener("change", (e) => { lcP.setAlong(e.target.checked); if (e.target.checked) toast("Tocar encima: tus notas se ven en el piano guía y no se puntúan.", 3600); });
$("ls-vol").addEventListener("input", (e) => lcP.setVolume(+e.target.value / 100));

/* ----- cambiar de mano / reiniciar / terminar ----- */
function syncHandsUi() {
  $("menu-whole").hidden = !(passage && !passage.loop); document.querySelectorAll("#hands-seg button").forEach((x) => x.classList.toggle("on", x.dataset.hands === hands)); }
function setHands(h) {
  hands = h; syncHandsUi();
  clearTimeout(finishTimer); resetSession(); rememberPractice();
  if (h !== "both") toast(h === "rh" ? "Probá con la mano derecha" : "Probá con la mano izquierda", 2000);
}
document.querySelectorAll("#hands-seg button").forEach((b) => b.addEventListener("click", () => { if (b.dataset.hands !== hands) setHands(b.dataset.hands); closePSheet(); }));
const doRestart = () => { clearTimeout(finishTimer); closePSheet(true); resetSession(); };
const doStop = () => {
  clearTimeout(finishTimer); closePSheet(true); stopListening(true);
  if (isPulso()) {
    stopPulse(); metro.stop(); syncMetroUi();
    if (pulse && pulseRun && pulseRun.take0 != null) pulse.tick(performance.now() - pulseRun.take0);
    if (!pulse || (!pulse.events.length && !pulse.closed)) { goLibrary(); return; }
    showResult(); return;
  }
  const st = session && session.state;
  const idle = !st || (!laps.length && st.status === "playing" && st.cleanSteps + st.dirtySteps === 0 && st.wrongNotes === 0);
  if (idle) { goLibrary(); return; }
  showResult();
};
$("menu-whole").addEventListener("click", () => { closePSheet(true); clearTimeout(finishTimer); passage = null; resetSession(); rememberPractice(); });
$("practice-restart").addEventListener("click", doRestart); $("menu-restart").addEventListener("click", doRestart);
$("practice-stop").addEventListener("click", doStop); $("menu-stop").addEventListener("click", doStop);
$("practice-back").addEventListener("click", () => goLibrary());

/* ----- entrada de notas ----- */
function handleNoteOn(m, ts, src) {
  if (screen === "theory") { theory.noteOn(m); return; }
  if (screen === "practice" && annoP.isActive()) return;   // anotando: la evaluación está en pausa
  if (screen === "practice" && listening) { if (lcP.along && lcP.isOpen) kb.flash(m, "ok"); return; }   // escuchando: no se evalúa; con «Tocar encima» se ve en el piano guía
  if (screen === "practice" && isPulso()) { const now = performance.now(); pulseNote(m, Number.isFinite(ts) && Math.abs(ts - now) < 2000 ? ts : now, src); return; }
  if (screen !== "practice" || !session || paused || listening || countingIn) return;
  const ev = session.noteOn(m);
  if (ev.type === "ignored") return;
  if (ev.type === "partial" || ev.type === "step" || ev.type === "finished") startHold(m, steps[ev.step].i, src, ts);
  practiceR.follow();   // si estabas mirando otra parte, vuelve suavemente al cursor
  const gi = steps[ev.step] ? steps[ev.step].i : null;
  const step = steps[ev.step];
  const target = stepHandNotes(step);
  const split = hasTwoHands(target);
  const completeMarks = () => {
    if (split) showHandFeedback(step, step.midi);
    else practiceR.markStep(gi, ev.result);
    practiceR.resolveError(gi);
  };
  switch (ev.type) {
    case "partial":
      kb.setHint(null); kb.flash(m, "ok"); missView = null;
      if (split) {
        const marks = showHandFeedback(step, session.state.pressed);
        for (const hand of ["rh", "lh"]) {
          if (marks[hand] && target[hand].every((n) => !ev.expected.includes(n))) practiceR.resolveError(gi, hand);
        }
      }
      syncKeyboard(false); break;
    case "step":
      kb.setHint(null); kb.flash(m, "ok"); missView = null; hideStuck();
      completeMarks(); practiceR.setCursor(steps[session.state.index].i);
      syncKeyboard(true); if (settings.guide === false) kb.focus([m]); trackPhrase(); trackMeasureNote(steps[session.state.index] ? steps[session.state.index].measure : steps[ev.step].measure); rememberPractice(); break;
    case "miss": case "stopped": {
      const hand = split ? errorHand(target, m, ev.expected) : null;
      const expected = hand ? target[hand].filter((n) => ev.expected.includes(n)) : ev.expected;
      if (split) showHandFeedback(step, session.state.pressed, hand);
      else practiceR.markStep(gi, "dirty");
      const t = nearestMissing(m, expected);
      kb.flash(m, "bad");
      const guide = settings.guide !== false;
      if (guide && t != null) kb.setHint({ fromMidi: m, toMidi: t });
      if (!guide) kb.focus([m]);
      const mv = t == null ? null : describeMove(m, t);
      const msg = withHand(errMsg(m, expected), hand), meas = step.measure;
      missView = { played: midiName(m), next: names(expected), sub: guide && mv ? mv.text : "", msg, measure: meas };
      if (!split || hand) practiceR.markError(gi, { kind: "wrong", played: m, expected, text: msg, hand });
      logError({ measure: meas, kind: "wrong", text: msg });
      announceError(msg, meas);
      if (hand) handMiss[hand]++;
      else if (!split) handMiss[target.rh.length ? "rh" : "lh"]++;
      if (isLoop() && ev.type === "miss" && ev.streak > MAX_STREAK) { session.resetStreak(); showStuck(); }
      break;
    }
    case "finished":
      kb.setHint(null); kb.flash(m, "ok"); missView = null; completeMarks(); syncKeyboard(false);
      if (isLoop()) completeLap(); else { setNext("", "¡Terminaste!", "", ""); }
      break;
  }
  if (ev.type !== "finished" || !isLoop()) refreshNext();
  updatePracticeUi();
  if (ev.type === "finished" && !isLoop()) { clearTimeout(finishTimer); finishTimer = setTimeout(showResult, 700); }
  if (ev.type === "stopped") { clearTimeout(finishTimer); finishTimer = setTimeout(showResult, 1100); }
}
/** Terminó una vuelta del bucle: se anota si salió limpia y vuelve suavemente al primer paso. */
function completeLap() {
  const st = session.state, res = session.stepResults, err = session.stepErrors;
  const clean = st.dirtySteps === 0 && st.wrongNotes === 0;
  laps.push({ clean, wrong: st.wrongNotes });
  agg.clean += st.cleanSteps; agg.dirty += st.dirtySteps; agg.wrong += st.wrongNotes;
  res.forEach((x, k) => { trace.clean[k] = (trace.clean[k] || 0) + (x === "clean" ? 1 : 0); trace.dirty[k] = (trace.dirty[k] || 0) + (x === "dirty" ? 1 : 0); trace.errors[k] = (trace.errors[k] || 0) + err[k]; });
  renderLapLine(); hideStuck();
  nextOverride = { label: `Vuelta ${laps.length}`, name: clean ? "Salió limpia" : "Con errores", sub: "Seguimos con la vuelta " + (laps.length + 1), cls: clean ? "" : "bad" };
  refreshNext(); updatePracticeUi(); rememberPractice();
  clearTimeout(lapTimer);
  lapTimer = setTimeout(() => { nextOverride = null; if (screen === "practice" && isLoop()) { newSession(false); beginCountIn(); } }, 900);
}

/* ---------- resultado ---------- */
/** Junta la sesión actual con las vueltas ya completas (bucle). */
function collectRun() {
  const st = session.state, res = session.stepResults, err = session.stepErrors;
  const results = steps.map((_, k) => ((trace.dirty[k] || 0) + (res[k] === "dirty" ? 1 : 0) > 0 ? "dirty" : (trace.clean[k] || 0) + (res[k] === "clean" ? 1 : 0) > 0 ? "clean" : null));
  const errors = steps.map((_, k) => (trace.errors[k] || 0) + err[k]);
  const clean = agg.clean + st.cleanSteps, dirty = agg.dirty + st.dirtySteps, wrong = agg.wrong + st.wrongNotes;
  const traversed = clean + dirty;
  const fin = isLoop() ? laps.length > 0 : st.status === "finished";
  const done = fin ? steps.length : st.index;
  return { st, results, errors, clean, dirty, wrong, traversed, accuracy: traversed ? Math.round((clean / traversed) * 100) : 0, fin, done, status: fin ? "finished" : st.status };
}
async function showResult() {
  if (isPulso()) { await showPulseResult(); return; }
  if (!session || screen !== "practice") return;
  const run = collectRun();
  const n = N(), range = passage && !isWholeRange(passage, n) ? { from: passage.from, to: passage.to } : null;
  const cov = coverage(steps, run.done);
  const rec = { scoreId: current && current.id, accuracy: run.accuracy, status: run.status, total: steps.length, index: run.done, clean: run.clean, dirty: run.dirty, wrong: run.wrong, hands, range, loop: isLoop(), bpm: metroBpm, laps: laps.length, measuresDone: cov.measuresDone, measuresTotal: cov.measuresTotal, mode: "espera", weak: hardestMeasures(run.results, steps, run.errors).slice(0, 3).map((h) => ({ measure: h.measure, errors: h.errors })), ...holdRec() };
  const { prev, saved } = await saveAttempt(rec);
  if (screen !== "practice") return;
  lastRun = { passage: passage ? { ...passage } : null, hands, bpm: metroBpm, mode: "espera" };
  show("result"); setResultMode("espera");
  lastResult = { rec: saved, attempts: [...prev, saved], n, title: current && current.title };
  const fin = run.status === "finished", stp = run.st.status === "stopped" && !isLoop();
  const acc = run.accuracy, cls = acc >= 90 ? "good" : acc >= 60 ? "mid" : "low";

  // cabecera
  $("result-head").textContent = isLoop() ? (laps.length ? `${laps.length} ${laps.length === 1 ? "vuelta" : "vueltas"} del bucle` : "Bucle sin completar")
    : fin ? (acc === 100 ? "¡Perfecto!" : "¡Terminaste la partitura!") : stp ? "Se detuvo por errores seguidos" : "Sesión terminada antes de completar";
  $("result-sub").textContent = isLoop() ? (laps.length ? `${laps.filter((l) => l.clean).length} de ${laps.length} salieron limpias.` : "Terminaste antes de completar una vuelta.")
    : stp ? `Pasaron ${MAX_STREAK + 1} errores seguidos. Probá más despacio o con una sola mano.`
    : fin ? (acc >= 90 ? "Llegaste al final casi sin errores." : "Llegaste al final. Con otra pasada va a salir más limpio.") : "Podés retomarla cuando quieras.";

  // métricas: Precisión y Avance, siempre juntas
  $("res-acc").textContent = run.traversed ? acc + "%" : "—"; $("res-acc").className = run.traversed ? cls : "";
  $("res-acc-sub").textContent = `${run.clean} ${run.clean === 1 ? "paso limpio" : "pasos limpios"} de ${run.traversed} ${run.traversed === 1 ? "recorrido" : "recorridos"}`;
  $("res-cov").innerHTML = `${cov.measuresDone} de ${cov.measuresTotal}<small> ${cov.measuresTotal === 1 ? "compás" : "compases"}</small>`;
  $("res-prog-sub").textContent = isLoop() && laps.length ? `${run.traversed} pasos tocados en ${laps.length} ${laps.length === 1 ? "vuelta" : "vueltas"}` : `${run.done} de ${steps.length} pasos`;
  const bar = animBar;
  bar("res-acc-bar", run.traversed ? acc : 0); bar("res-cov-bar", cov.measuresTotal ? (cov.measuresDone / cov.measuresTotal) * 100 : 0);
  $("res-cov-bar").parentNode.setAttribute("aria-hidden", "true");
  const sc = $("result-scope");
  sc.hidden = !range;
  if (range) sc.textContent = `${isLoop() ? "Bucle" : "Desde el compás " + (range.from + 1)}: compases ${rangeText(range)} de ${n} · ${handsText().toLowerCase()}`;
  $("res-clean").textContent = run.clean; $("res-dirty").textContent = run.dirty; $("res-wrong").textContent = run.wrong;
  $("res-laps").textContent = laps.length;

  renderCompare(rec, prev, fin, acc, range, n); renderHoldLine(rec);

  // la UNA acción principal
  const act = nextAction({ stepResults: run.results, steps, stepErrors: run.errors, done: run.done, status: run.status, hands, bpm: metroBpm, measures: n, range, loop: isLoop() });
  const box = $("result-action"), btn = $("result-action-btn");
  box.hidden = act.type === "none";
  $("result-retry").classList.toggle("primary", act.type === "none");
  $("result-retry-t").textContent = isLoop() ? "Repetir el bucle" : "Reintentar";
  if (act.type !== "none") {
    $("result-action-t").textContent = act.title; btn.textContent = act.cta; btn.dataset.type = act.type;
    btn.onclick = () => runAction(act);
  }
  resultMeasure = null; $("strip-offer").hidden = true;
  renderErrList();
  renderStrip(measureSummary(run.results, steps, n), run.errors);
  $((act.type === "none" ? "result-retry" : "result-action-btn")).focus();
}
let resultMeasure = null;
/** Lista de errores de la toma («Tocaste X · Se esperaba Y»), accesible con lector de pantalla. */
function renderErrList() {
  const box = $("res-errors"); box.hidden = !errLog.length; box.open = false;
  $("res-errors-t").textContent = `Errores de esta toma (${errLog.length})`;
  $("res-errors-list").innerHTML = errLog.map((e) => `<li><span class="sym" aria-hidden="true">${e.kind === "omit" ? "○" : e.kind === "dur" ? "⊢" : "✕"}</span><b>Compás ${e.measure + 1}</b><span>${esc(e.text)}</span></li>`).join("");
}
/* ---------- Resultado: textos según el modo, comparación, resumen para el profe y toma de audio ---------- */
let lastResult = null;   // { rec (intento guardado), attempts, n, title }
function setResultMode(mode) {
  const p = mode === "pulso";
  $("res-acc-l").textContent = p ? "Notas correctas" : "Precisión";
  $("res-cov-l").textContent = p ? "A tiempo" : "Avance";
  $("st-l1").textContent = p ? "A tiempo" : "Pasos limpios";
  $("st-l2").textContent = p ? "Adelantados" : "Pasos con error";
  $("st-l3").textContent = p ? "Atrasados" : "Notas erradas";
  $("st-l4").textContent = p ? "Omitidos" : "Vueltas";
  $("legend-espera").hidden = p; $("legend-pulso").hidden = !p;
  $("result-trend").hidden = true;
  $("res-laps-box").hidden = !p && !isLoop();
  $("screen-result").style.setProperty("--cols", (p || isLoop()) ? 4 : 3);
  discardTake();
  $("share-summary-t").textContent = "Compartir resumen";
  $("rec-start").hidden = !recorderSupported();
  $("rec-hint").hidden = !recorderSupported();
}
/** Insignia de récord + comparación con intentos equivalentes (mismo pasaje, mano, bucle y modo). */
function renderCompare(rec, prev, fin, acc, range, n) {
  const eq = equivalentAttempts(prev, rec, n);
  const bestPrev = bestEquivalent(prev, rec, n);
  const record = fin && bestPrev !== null && acc > bestPrev;
  const first = fin && eq.length === 0 && acc > 0;
  $("result-badge").hidden = !(record || first);
  $("result-badge-t").textContent = record ? "¡Nuevo récord!" : "Primer resultado guardado";
  const cmp = $("result-compare");
  const kind = [range ? `compases ${rangeText(range)}` : "pieza entera", handsText().toLowerCase(), isLoop() ? "en bucle" : "", isPulso() ? "a pulso" : ""].filter(Boolean).join(" · ");
  cmp.hidden = !rec.scoreId || (!eq.length && !prev.length);
  if (!cmp.hidden) cmp.textContent = bestPrev !== null ? (record ? `Superaste tu mejor intento anterior de este tipo (${bestPrev}%).` : acc === bestPrev && fin ? `Igualaste tu mejor intento de este tipo (${bestPrev}%).` : `Tu mejor intento completo de este tipo es ${bestPrev}%.`)
    : eq.length ? "Todavía no completaste un intento de este tipo para compararlo." : `Es tu primer intento de este tipo (${kind}): no se compara con los anteriores.`;
}
async function saveAttempt(rec) {
  let prev = [], saved = rec;
  if (rec.scoreId && !attemptSaved) {
    attemptSaved = true;
    try { prev = await store.attempts(rec.scoreId); saved = await store.addAttempt(rec); } catch (e) { console.warn("Historial:", e.message); }
  }
  return { prev, saved };
}
const animBar = (id, v) => { const e = $(id); e.style.transition = "none"; e.style.width = "0"; void e.offsetWidth; e.style.transition = ""; requestAnimationFrame(() => requestAnimationFrame(() => { e.style.width = v + "%"; })); };

async function showPulseResult() {
  if (!pulse || screen !== "practice") return;
  stopPulse(); metro.stop(); syncMetroUi();
  if (pulseRun && pulseRun.take0 != null) pulse.tick(performance.now() - pulseRun.take0);
  const res = pulse.result(), sum = res.summary, n = N(), loop = isLoop();
  const fin = loop ? res.laps > 0 : sum.total >= steps.length && steps.length > 0;
  const range = passage && !isWholeRange(passage, n) ? { from: passage.from, to: passage.to } : null;
  const cov = coverage(steps, loop ? (res.laps > 0 ? steps.length : sum.total) : sum.total);
  const rec = {
    scoreId: current && current.id, accuracy: sum.pctCorrect, status: fin ? "finished" : "playing", total: steps.length, index: Math.min(steps.length, sum.total),
    clean: sum.ontime, dirty: sum.total - sum.ontime, wrong: sum.wrongNotes, hands, range, loop, bpm: metroBpm, laps: res.laps, measuresDone: cov.measuresDone, measuresTotal: cov.measuresTotal,
    mode: "pulso", onTimePct: sum.pctOnTime, trendMs: sum.trendMs, hits: sum.hit, omitted: sum.missed, winMs: sum.win, weak: sum.weak.map((w) => ({ measure: w.measure, errors: w.bad })), ...holdRec(),
  };
  const { prev, saved } = await saveAttempt(rec);
  if (screen !== "practice") return;
  lastRun = { passage: passage ? { ...passage } : null, hands, bpm: metroBpm, mode: "pulso" };
  show("result"); setResultMode("pulso");
  lastResult = { rec: saved, attempts: [...prev, saved], n, title: current && current.title };
  const acc = sum.pctCorrect, cls = acc >= 90 ? "good" : acc >= 60 ? "mid" : "low";
  $("result-head").textContent = loop ? (res.laps ? `${res.laps} ${res.laps === 1 ? "vuelta" : "vueltas"} a pulso` : "Bucle sin completar") : fin ? (sum.pctCorrect === 100 && sum.pctOnTime === 100 ? "¡Pulso perfecto!" : "¡Terminaste a pulso!") : "Toma terminada antes del final";
  $("result-sub").textContent = sum.total === 0 ? "Todavía no se cerró ningún paso."
    : sum.pctCorrect === 100 && sum.pctOnTime === 100 ? "Tocaste todo a tiempo con el metrónomo."
    : sum.pctOnTime != null && sum.pctOnTime < 60 ? "Las notas están: ahora hay que ajustar el pulso." : "Seguí el metrónomo y se va afinando.";
  $("res-acc").textContent = sum.total ? acc + "%" : "—"; $("res-acc").className = sum.total ? cls : "";
  $("res-acc-sub").textContent = `${sum.hit} de ${sum.total} ${sum.total === 1 ? "paso" : "pasos"}${sum.missed ? ` · ${sum.missed} ${sum.missed === 1 ? "omitido" : "omitidos"}` : ""}${sum.wrongNotes ? ` · ${sum.wrongNotes} ${sum.wrongNotes === 1 ? "nota de más" : "notas de más"}` : ""}`;
  $("res-cov").textContent = sum.pctOnTime == null ? "—" : sum.pctOnTime + "%"; $("res-cov").className = sum.pctOnTime == null ? "" : sum.pctOnTime >= 85 ? "good" : sum.pctOnTime >= 55 ? "mid" : "low";
  $("res-prog-sub").textContent = `de los pasos correctos · margen ±${sum.win} ms`;
  animBar("res-acc-bar", sum.total ? acc : 0); animBar("res-cov-bar", sum.pctOnTime || 0);
  const tt = trendText(sum);
  $("result-trend").hidden = !tt; $("result-trend").textContent = tt || "";
  const sc = $("result-scope");
  sc.hidden = !range;
  if (range) sc.textContent = `${loop ? "Bucle" : "Desde el compás " + (range.from + 1)}: compases ${rangeText(range)} de ${n} · ${handsText().toLowerCase()}`;
  $("res-clean").textContent = sum.ontime; $("res-dirty").textContent = sum.early; $("res-wrong").textContent = sum.late; $("res-laps").textContent = sum.missed + sum.wrong;
  $("st-l4").textContent = sum.wrong ? "Omitidos o errados" : "Omitidos";
  renderCompare(rec, prev, fin, acc, range, n); renderHoldLine(rec);
  const act = timingAction(sum, { bpm: metroBpm, measures: n });
  const box = $("result-action"), btn = $("result-action-btn");
  box.hidden = sum.total === 0;
  $("result-retry").classList.toggle("primary", sum.total === 0);
  $("result-retry-t").textContent = loop ? "Repetir el bucle" : "Reintentar";
  if (sum.total) { $("result-action-t").textContent = act.title; btn.textContent = act.cta; btn.dataset.type = act.type; btn.onclick = () => runAction(act); }
  resultMeasure = null; $("strip-offer").hidden = true;
  renderErrList();
  renderStrip(measureStates(res.scored, steps, n));
  $((sum.total === 0 ? "result-retry" : "result-action-btn")).focus();
}

/* compartir resumen */
$("share-summary").addEventListener("click", async () => {
  if (!lastResult) return;
  const { rec, attempts, n, title } = lastResult;
  const text = buildSummary({ title, n, att: rec, attempts, task: activeTask });
  let file = null;
  if (takeBlob) file = new File([takeBlob.blob], `toma-${taskFileName(title).replace(/^Tarea-|\.pianocheck$/g, "")}.${extFor(takeBlob.mime)}`, { type: takeBlob.mime.split(";")[0] || "audio/webm" });
  await shareText(text, file);
});

/* toma de audio voluntaria */
let recorder = null, takeBlob = null, takeUrl = "";
function showRec(state) {   // "idle" | "live" | "done"
  $("rec-live").hidden = state !== "live"; $("rec-done").hidden = state !== "done";
  $("rec-start").disabled = state === "live";
  $("share-summary-t").textContent = state === "done" ? "Compartir resumen y toma" : "Compartir resumen";
}
function discardTake() {
  if (recorder) { recorder.cancel(); recorder = null; }
  if (takeUrl) { URL.revokeObjectURL(takeUrl); takeUrl = ""; }
  takeBlob = null;
  const a = $("rec-audio"); if (a) { a.pause(); a.removeAttribute("src"); a.load && a.load(); }
  showRec("idle");
}
function takeFinished(out) {
  recorder = null;
  if (!out || !out.blob.size) { showRec("idle"); toast("No se grabó nada.", 3000); return; }
  takeBlob = out; takeUrl = URL.createObjectURL(out.blob);
  $("rec-audio").src = takeUrl;
  showRec("done"); toast(`Toma de ${clock(out.ms)} lista para escuchar.`, 3200);
}
$("rec-start").addEventListener("click", async () => {
  if (recorder) return;
  if (!(await confirmDialog({ title: "¿Grabar una toma?", text: "Se usa el micrófono hasta 1 minuto. La grabación queda sólo en este dispositivo: se comparte o se descarga únicamente si vos lo decidís.", yes: "Grabar", no: "Ahora no", danger: false }))) return;
  discardTake();
  recorder = createRecorder({ maxMs: MAX_RECORD_MS, onTick: (ms) => { $("rec-time").textContent = `${clock(ms)} / ${clock(MAX_RECORD_MS)}`; }, onAutoStop: takeFinished });
  try { await recorder.start(); }
  catch (e) { recorder = null; showRec("idle"); toast(e && e.name === "NotAllowedError" ? "No hay permiso para usar el micrófono." : "No se pudo usar el micrófono: " + (e && e.message || e), 4600); return; }
  $("rec-time").textContent = `0:00 / ${clock(MAX_RECORD_MS)}`; showRec("live"); $("rec-stop").focus();
});
$("rec-stop").addEventListener("click", async () => { if (recorder) takeFinished(await recorder.stop()); });
$("rec-discard").addEventListener("click", () => { discardTake(); toast("Toma descartada.", 2200); });
$("rec-save").addEventListener("click", () => { if (takeBlob) downloadFile(new File([takeBlob.blob], `toma.${extFor(takeBlob.mime)}`, { type: takeBlob.mime }), `toma.${extFor(takeBlob.mime)}`); });
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && recorder && recorder.recording) recorder.stop().then(takeFinished); });

function renderStrip(sum, errors) {
  const el = $("measure-strip");
  el.innerHTML = sum.map((s, m) => {
    const lbl = s === "clean" ? (isPulso() ? "a tiempo" : "limpio") : s === "dirty" ? (isPulso() ? "errado u omitido" : "con error") : s === "off" ? "fuera de tiempo" : s === "none" ? "no tocado" : "sin notas";
    const glyph = s === "clean" ? "✓" : s === "dirty" ? "✕" : s === "off" ? "≈" : s === "none" ? "·" : "–";
    return `<button class="ms ${s}" data-m="${m}" ${s === "empty" ? "disabled" : ""} aria-label="Compás ${m + 1}: ${lbl}${s === "empty" ? "" : ". Tocá para practicarlo"}"><span>${m + 1}</span><i aria-hidden="true">${glyph}</i></button>`;
  }).join("");
  el.setAttribute("aria-label", `Resumen por compás: ${sum.filter((s) => s === "clean").length} limpios, ${sum.filter((s) => s === "dirty").length} con error, ${sum.filter((s) => s === "none").length} sin tocar${sum.some((s) => s === "off") ? `, ${sum.filter((s) => s === "off").length} fuera de tiempo` : ""}`);
}
$("measure-strip").addEventListener("click", (e) => {
  const b = e.target.closest(".ms"); if (!b || b.disabled) return;
  const m = +b.dataset.m; resultMeasure = m;
  const st = b.classList.contains("dirty") ? "tuvo errores" : b.classList.contains("clean") ? (isPulso() ? "salió a tiempo" : "salió limpio") : b.classList.contains("off") ? "salió fuera de tiempo" : "no lo tocaste completo";
  $("strip-offer-t").textContent = `Compás ${m + 1}: ${st}.`;
  $("strip-offer-go").textContent = `Practicar compás ${m + 1}`;
  $("strip-offer").hidden = false;
});
$("strip-offer-go").addEventListener("click", () => { if (resultMeasure != null) returnToPractice({ passage: { from: resultMeasure, to: resultMeasure, loop: true } }); });
/** Vuelve a Práctica desde Resultado con otro pasaje / mano / tempo. */
function returnToPractice(o = {}) {
  if (!current) return;
  const base = lastRun || { passage: null, hands, bpm: metroBpm, mode: practiceMode };
  practiceMode = normMode(base.mode || practiceMode);
  passage = "passage" in o ? (o.passage ? normalizePassage(o.passage) : null) : base.passage;
  hands = o.hands || base.hands || hands;
  if (o.bpm) setMetroBpm(o.bpm, true);
  show("practice", false); history.replaceState({ s: "practice" }, "");
  syncHandsUi(); resetSession(); rememberPractice(); requestWake();
}
const normalizePassage = (p) => { const r = normRange(p, N()); return r ? { ...r, loop: !!p.loop } : null; };
function runAction(act) {
  if (act.type === "fix") returnToPractice({ passage: { ...act.range, loop: true } });
  else if (act.type === "continue" && act.loop) returnToPractice();
  else if (act.type === "continue") returnToPractice({ passage: { from: act.measure, to: N() - 1, loop: false } });
  else if (act.type === "both-hands") returnToPractice({ hands: "both" });
  else if (act.type === "faster" || act.type === "slower") returnToPractice({ bpm: act.bpm });
}
$("result-retry").addEventListener("click", () => returnToPractice());
$("result-lib").addEventListener("click", () => { show("mylib"); });


/* ---------- Mi biblioteca (pantalla propia con todas las partituras) ---------- */
const ml = { q: "", filter: "todas", sort: "recientes" };
async function refreshMyLib() {
  let list = [], sums = {};
  try { list = (await store.list()) || []; sums = await store.summaries(); } catch (e) { $("ml-list").innerHTML = `<li class="empty">No se pudo leer la biblioteca: ${esc(e.message)}</li>`; return; }
  const total = list.length, opts = { bundledIds: bundledIds() };
  $("mylib-count").textContent = total ? `(${total})` : "";
  $("mylib-n").textContent = String(total); $("mylib-n").hidden = !total;
  const counts = filterCounts(list, opts);
  $("ml-filters").innerHTML = FILTERS.filter(([k]) => k === "todas" || k === ml.filter || counts[k] > 0).map(([k, name]) => `<button type="button" class="chip${k === ml.filter ? " on" : ""}" data-f="${k}" aria-pressed="${k === ml.filter}">${name}<b class="chip-n">${counts[k] || 0}</b></button>`).join("");
  $("ml-form").hidden = !total; $("ml-filters").hidden = !total;
  $("ml-empty").hidden = total > 0;
  const res = queryLibrary(list, { ...ml, sums, ...opts });
  $("ml-list").innerHTML = total && !res.length ? `<li class="empty">Ninguna partitura coincide con esa búsqueda o filtro.</li>` : res.map((s) => cardHtml(s, false, sums[s.id])).join("");
  $("ml-live").textContent = total ? `${res.length} de ${total} ${total === 1 ? "partitura" : "partituras"}` : "";
}
const goMyLib = () => { if (screen !== "mylib") show("mylib"); };
$("open-mylib").addEventListener("click", goMyLib);
$("lib-all").addEventListener("click", goMyLib);
document.querySelectorAll("[data-go-mylib]").forEach((b) => b.addEventListener("click", goMyLib));
$("menu-lib").addEventListener("click", () => { closePSheet(true); goMyLib(); });
$("mylib-back").addEventListener("click", goLibrary);
$("mylib-new").addEventListener("click", () => openSheet());
$("ml-form").addEventListener("submit", (e) => e.preventDefault());
$("ml-q").addEventListener("input", (e) => { ml.q = e.target.value; refreshMyLib(); });
$("ml-sort").addEventListener("change", (e) => { ml.sort = e.target.value; refreshMyLib(); });
$("ml-filters").addEventListener("click", (e) => { const b = e.target.closest("button[data-f]"); if (b) { ml.filter = b.dataset.f; refreshMyLib(); } });
$("mlE-search").addEventListener("click", () => { show("library", false); requestAnimationFrame(() => { const q = $("lib-search-q"); q && q.focus(); }); });
$("mlE-import").addEventListener("click", () => openSheet({ path: "import" }));
$("mlE-demo").addEventListener("click", async () => { try { await startOnscreen(clone(demoScore), { hands: "rh" }); } catch (err) { toast("Error: " + err.message, 4000); } });
/* borrador en la pantalla inicial */
$("draft-go").addEventListener("click", async () => { const id = $("draft-card").dataset.id; try { openReview(await resolveScore(id), false, null, "Borrador sin confirmar: tocá Guardar para dejarlo en tu biblioteca."); } catch (err) { toast("Error: " + err.message, 4000); } });
$("draft-x").addEventListener("click", async () => {
  const id = $("draft-card").dataset.id; if (!id) return;
  if (!(await confirmDialog({ title: "¿Descartar este borrador?", text: "La partitura se borra de tu biblioteca. No se puede deshacer.", yes: "Descartar", no: "Cancelar" }))) return;
  try { await store.del(id); } catch (e) { /* ya no estaba */ }
  refreshLibrary(); toast("Borrador descartado");
});

/* ----- exportar / importar la biblioteca (Ajustes) ----- */
const libMsg = (t, bad) => { const el = $("lib-msg"); el.textContent = t || ""; el.classList.toggle("bad", !!bad); };
$("lib-export").addEventListener("click", async () => {
  try {
    const st = await lazy("store");
    const scores = (await st.listScores()) || [];
    if (!scores.length) { libMsg("Todavía no hay partituras para exportar.", true); return; }
    const attempts = (await st.listAttempts()) || [], annotations = {};
    for (const sc of scores) { try { const a = await st.getAnnotations(sc.id); if (a) annotations[sc.id] = a; } catch (e) { /* sin anotaciones */ } }
    const data = buildLibraryExport({ scores, attempts, annotations, tasks: settings.tasks || {} });
    const name = libraryFileName();
    downloadFile(new File([serializeLibrary(data)], name, { type: "application/json" }), name);
    libMsg(`Exporté ${scores.length} ${scores.length === 1 ? "partitura" : "partituras"}, ${attempts.length} ${attempts.length === 1 ? "intento" : "intentos"} y ${Object.keys(annotations).length} con anotaciones. Sin tu API key.`);
  } catch (err) { libMsg("No se pudo exportar: " + (err && err.message || err), true); }
});
$("lib-import").addEventListener("click", () => $("lib-file").click());
$("lib-file").addEventListener("change", async (e) => {
  const f = e.target.files && e.target.files[0]; e.target.value = "";
  if (!f) return;
  try {
    if (f.size > 25 * 1024 * 1024) { libMsg("El archivo es demasiado grande para importarlo.", true); return; }
    const r = parseLibraryExport(await f.text());
    if (!r.ok) { libMsg(r.error, true); return; }
    const st = await lazy("store");
    const scoreIds = new Set(((await st.listScores()) || []).map((x) => x.id)), attemptIds = new Set(((await st.listAttempts()) || []).map((x) => x.id));
    const plan = planMerge({ scoreIds, attemptIds }, r);
    for (const sc of plan.addScores) await st.putScoreRaw(sc);
    for (const a of plan.addAttempts) await st.putAttemptRaw(a);
    for (const id of Object.keys(plan.addAnnotations)) await st.saveAnnotations(id, plan.addAnnotations[id]);
    if (Object.keys(plan.addTasks).length) { settings.tasks = { ...plan.addTasks, ...(settings.tasks || {}) }; await saveTasks(); }
    const sk = r.skipped.scores + r.skipped.attempts + r.skipped.annotations;
    libMsg(`Importé ${plan.counts.scores} ${plan.counts.scores === 1 ? "partitura" : "partituras"} nuevas${plan.counts.existing ? ` (${plan.counts.existing} ya estaban y no se tocaron)` : ""}${sk ? `. Se descartaron ${sk} datos dañados o fuera de límite` : ""}.`);
    refreshLibrary();
  } catch (err) { libMsg("No se pudo importar: " + (err && err.message || err), true); }
});

/* ---------- arranque ---------- */
(async function init() {
  await loadSettings();
  show("library", false);
  handleIncomingHash();
  handleIncomingShare();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js").catch((e) => console.warn("SW:", e.message));
  }
})();

/* Atajos de teclado (escritorio): espacio = Play/Pausa; flechas = compás anterior / siguiente mientras se escucha. */
document.addEventListener("keydown", (e) => {
  if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target, tag = t && t.tagName;
  if (tag === "INPUT" && t.type !== "range" && t.type !== "checkbox" || tag === "TEXTAREA" || tag === "SELECT" || (t && t.isContentEditable)) return;
  if (!$("confirm").hidden || !$("busy").hidden || !$("sheet-new").hidden) return;
  const lc = screen === "practice" ? lcP : screen === "review" ? lcR : null;
  if (!lc) return;
  if (e.key === " " || e.code === "Space") {
    if (tag === "BUTTON" || tag === "A" || (tag === "INPUT" && t.type === "checkbox")) return;   // el espacio activa el botón enfocado
    e.preventDefault();
    if (lc.isOpen) lc.toggle();
    else if (screen === "practice") { if (current && !annoP.isActive()) openListen(); }
    else reviewListen();
  } else if (lc.isOpen && tag !== "INPUT" && (e.key === "ArrowLeft" || e.key === "ArrowRight")) { e.preventDefault(); lc.step(e.key === "ArrowLeft" ? -1 : 1); }
});

/* Gancho de verificación: sólo existe con ?debug en la URL (no altera nada en uso normal). */
if (new URLSearchParams(location.search).has("debug")) {
  window.__pc = {
    take0: () => (pulseRun ? pulseRun.take0 : null),
    phase: () => (pulseRun ? pulseRun.phase : null),
    inject: (m, rel) => pulseNote(m, pulseRun.take0 + rel),
    handle: (m) => handleNoteOn(m, performance.now()),
    noteOn: (m, src) => handleNoteOn(m, performance.now(), src), noteOff: (m) => handleNoteOff(m, performance.now()), pedal: (d) => holdPedal(d, performance.now()),
    holds: () => ({ results: holds.results, active: holds.tick(performance.now()), mode: holdMode(), wait: holdWait, dur: [...durSteps] }), setHoldMode, setBpm: (n) => setMetroBpm(n),
    demo: (o) => { settings.onscreenKeyboard = true; applyKeyboardSetting(); startPractice(clone(demoScore), o || { hands: "both" }); },
    practice: (sc, o) => { settings.onscreenKeyboard = true; applyKeyboardSetting(); startPractice(validateScore(sc).score, o || {}); },
    search: (t, a) => openSearch({ title: t, artist: a || "" }),
    settingsNow: () => settings, setSetting: (k, v) => { settings[k] = v; },
    fakeMidi: (on) => { midiConnected = !!on; tx.midiChanged(); }, midiOn: (m, vel, ts) => onMidiNoteOn(m, vel || 80, ts || performance.now()), midiOff: (m, ts) => onMidiNoteOff(m, ts || performance.now()),
    tx: () => ({ stage: tx.stage, open: tx.isOpen, notes: tx.notes }),
    openReview: (sc, isNew) => openReview(validateScore(sc).score, isNew), refreshLibrary,
    holdAt: (i) => holdAll[i] || [], nextStep: () => (session ? steps[session.state.index] : null),
    state: () => ({ screen, mode: practiceMode, bpm: metroBpm, steps: steps.length, next: $("next-title") ? $("next-title").textContent : "" }),
    show: (n) => show(n),
    tap: (ref) => { if (editState) { editState.selected = ref; updateEditUi(); } },
    review: () => (editState ? { score: editState.score, sel: editState.selected, issues: editState.issues, idx: editState.issueIdx } : null),
    anno: () => ({ layout: practiceR.getLayout(), marks: annoP.store.marks(), active: annoP.isActive() }),
    scroll: () => practiceR.scrollPos(),
    pruneReview: (n) => annoR.prune(n),
    annoReview: () => ({ layout: reviewR.getLayout(), marks: annoR.store.marks(), active: annoR.isActive() }),
    lc: lcP, lcR, player, listen: (sc) => startPractice(validateScore(sc).score, { listen: true }),
    practiceStep: () => (typeof curStep === "function" ? curStep() : null),
  };
}
