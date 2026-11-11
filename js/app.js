// PianoCheck — UI y cableado de pantallas.
import { validateScore, buildSteps, midiName, midiToKey, keyToMidi } from "./model.js";
import { createSession } from "./engine.js";
import { createMidiInput } from "./midi.js";
import { createMetronome } from "./metronome.js";
import { createRenderer } from "./render.js";
import { demoScore } from "./demo.js";
import { createKeyboard, describeMove, nearestMissing, computeRange } from "./keyboard.js";
import { findPhrases, phraseAt, repeatNotice, measureRangeText } from "./phrases.js";
import { phraseColor } from "./render.js";
import { buildShareUrl, decodeCfg, extractToken, maskKey, PROVIDER_NAMES } from "./share.js";
import { normRange, isWholeRange, rangeText, passageSteps, currentPair, hardestMeasures, coverage, measureSummary, harderHand, handsWithNotes, attemptKey, equivalentAttempts, bestEquivalent, nextAction, mergePractice, latestPractice } from "./passage.js";
import { buildEvents, createPlayer } from "./playback.js";

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
};

const DEFAULT_SETTINGS = { provider: "anthropic", apiKey: "", model: "", onscreenKeyboard: false, micSensitivity: 0.5, seenConnectHint: false, guide: true, showPhrases: true, scoreView: "continua", scoreTheme: "hoja", scoreSize: "mediano", countIn: false, lastPractice: {} };
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
const screens = ["library", "review", "practice", "result", "settings"];
function show(name, push = true) {
  const prev = screen;
  screen = name;
  screens.forEach((s) => ($("screen-" + s).hidden = s !== name));
  $("app").dataset.screen = name;
  if (prev === "practice" && name !== "practice") leavePractice();
  if (prev === "settings" && name !== "settings") { hideShareQr(); stopScan(); }
  if (push && name !== "library" && prev !== name) history.pushState({ s: name }, "", "");
  if (name === "library") refreshLibrary();
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
  show("library", false);
});
let prevBeforeSettings = "library";

/* ---------- renderers ---------- */
const reviewR = createRenderer($("review-score"), { mode: "page", lockMode: true });   // Revisión siempre por página
const practiceR = createRenderer($("practice-score"));                               // Práctica: continua o por página (Ajustes)

/* Aspecto de la partitura: vista, hoja (tema) y tamaño. Se guardan en los ajustes y se aplican al instante. */
const LOOK_OPTS = { scoreView: ["continua", "pagina"], scoreTheme: ["hoja", "sepia", "oscuro"], scoreSize: ["chico", "mediano", "grande"] };
function normalizeLook() { for (const k in LOOK_OPTS) if (!LOOK_OPTS[k].includes(settings[k])) settings[k] = DEFAULT_SETTINGS[k]; }
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
  syncLookUi();
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
  const tags = s.measures ? [`${n} ${n === 1 ? "compás" : "compases"}`, `♩ ${s.bpm || 80}`, (s.timeSig || [4, 4]).join("/"), demo ? "" : fmtDate(s.updatedAt || s.createdAt)].filter(Boolean).map((t) => `<span class="tag">${esc(t)}</span>`).join("") : "";
  const lvl = LEVEL_ES[s.level] ? `<span class="tag level">${LEVEL_ES[s.level]}</span>` : "";
  const res = sum && sum.count
    ? `<div class="scores"><div class="sc best"><span>Mejor</span><b>${sum.best == null ? "—" : sum.best + "%"}</b></div><div class="sc"><span>Último</span><b>${sum.last}%</b></div></div><div class="mini" aria-hidden="true"><i style="width:${sum.best || 0}%"></i></div>`
    : `<div class="sc-none">Sin intentos todavía</div>`;
  const title = esc(s.title || "Sin título");
  return `<li class="card" data-id="${esc(s.id)}"><div class="card-top"><div class="t">${title}</div>${lvl}</div><div class="tags">${tags}</div>${res}
    <div class="row"><button class="btn primary grow" data-act="practice" aria-label="Practicar ${title}">${ic("play", "sm")}Practicar</button>
    ${demo ? `<button class="btn" data-act="adddemo">${ic("plus", "sm")}Agregar a mi biblioteca</button><button class="btn" data-act="demokb" aria-label="Probar la demo con el teclado de pantalla">${ic("midi", "sm")}Probar con el teclado de pantalla</button>` : `<button class="btn" data-act="edit" aria-label="Editar ${title}">${ic("pencil", "sm")}Editar</button><button class="btn icon danger" data-act="del" aria-label="Eliminar ${title}">${ic("trash")}</button>`}</div></li>`;
}
let continueInfo = null;
const id2score = (id, list) => (id === demoScore.id ? demoScore : (list || []).find((x) => x.id === id));
async function refreshLibrary() {
  let list = [], sums = {};
  try { list = (await store.list()) || []; sums = await store.summaries(); } catch (e) { $("library-list").innerHTML = `<li class="empty">No se pudo leer la biblioteca: ${esc(e.message)}</li>`; return; }
  list = list.slice().sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  $("empty-state").hidden = list.length > 0;
  $("library-section").hidden = list.length === 0;
  $("demo-section").hidden = list.length === 0;
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
  $("demo-list").innerHTML = cardHtml(demoScore, true, sums[demoScore.id]);
  $("library-list").innerHTML = list.map((s) => cardHtml(s, false, sums[s.id])).join("");
}
async function resolveScore(id) {
  if (id === demoScore.id) return clone(demoScore);
  const s = await store.get(id);
  if (!s) throw new Error("No se encontró la partitura.");
  return validateScore(s).score;
}
async function addDemo() {
  const s = clone(demoScore); s.id = newId(); s.title = "Oda a la Alegría";
  return store.save(s);
}
async function onCardClick(e) {
  const btn = e.target.closest("button[data-act]"); if (!btn) return;
  const card = btn.closest(".card"), id = card.dataset.id, act = btn.dataset.act;
  try {
    if (act === "practice") startPractice(await resolveScore(id));
    else if (act === "demokb") await startOnscreen(await resolveScore(id));
    else if (act === "edit") openReview(await resolveScore(id), false);
    else if (act === "del") {
      const name = card.querySelector(".t").textContent;
      if (await confirmDialog({ title: "¿Eliminar esta partitura?", text: `«${name}» se borra de tu biblioteca junto con su historial de resultados. No se puede deshacer.`, yes: "Eliminar" })) { await store.del(id); refreshLibrary(); toast("Partitura eliminada"); }
    } else if (act === "adddemo") {
      await addDemo(); refreshLibrary(); toast("Agregada a tu biblioteca");
    }
  } catch (err) { toast("Error: " + err.message, 4000); }
}
$("library-list").addEventListener("click", onCardClick);
$("demo-list").addEventListener("click", onCardClick);
$("empty-demo").addEventListener("click", async () => { try { const s = await addDemo(); startPractice(s); } catch (err) { toast("Error: " + err.message, 4000); } });
$("empty-demo-kb").addEventListener("click", async () => { try { await startOnscreen(await addDemo()); } catch (err) { toast("Error: " + err.message, 4000); } });
/** Entra a Práctica con el teclado de pantalla ya activado (sin pasar por Ajustes). Queda guardado en el ajuste. */
async function startOnscreen(score) {
  settings.onscreenKeyboard = true;
  store.saveSettings({ onscreenKeyboard: true }).catch(() => {});
  applyKeyboardSetting();
  startPractice(score);
  toast("Teclado de pantalla activado", 2200);
}
$("continue-go").addEventListener("click", async () => {
  const c = continueInfo; if (!c) return;
  try { startPractice(await resolveScore(c.id), { resume: c }); } catch (err) { toast("Error: " + err.message, 4000); }
});

/* ---------- hoja "Nueva partitura" ---------- */
const LEVEL_DESC = {
  principiante: "Melodía de una nota en la derecha, notas largas y una nota o quinta en la izquierda. Tempo lento.",
  intermedio: "Melodía completa con su ritmo y acompañamiento con acordes quebrados. Algunas notas dobles.",
  pro: "Arreglo completo en la tonalidad original, con acordes u octavas y acompañamiento con movimiento.",
};
let composeLevel = "principiante", composeHands = "dos-manos", sheetOpener = null;
function setComposeLevel(l) {
  composeLevel = l;
  document.querySelectorAll("#compose-level button").forEach((b) => b.classList.toggle("on", b.dataset.level === l));
  $("compose-level-desc").textContent = LEVEL_DESC[l];
}
document.querySelectorAll("#compose-level button").forEach((b) => b.addEventListener("click", () => setComposeLevel(b.dataset.level)));
document.querySelectorAll("#compose-hands button").forEach((b) => b.addEventListener("click", () => {
  composeHands = b.dataset.hands;
  document.querySelectorAll("#compose-hands button").forEach((x) => x.classList.toggle("on", x === b));
}));
setComposeLevel("principiante");
function openSheet() { sheetOpener = document.activeElement; $("sheet-new").hidden = false; $("compose-query").focus(); }
function closeSheet() { $("sheet-new").hidden = true; sheetOpener && sheetOpener.focus && screen === "library" && sheetOpener.focus(); }
$("btn-new").addEventListener("click", openSheet);
$("empty-new").addEventListener("click", openSheet);
$("sheet-close").addEventListener("click", closeSheet);
$("sheet-new").addEventListener("click", (e) => { if (e.target === $("sheet-new")) closeSheet(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("sheet-new").hidden && $("confirm").hidden && $("busy").hidden) closeSheet(); });
$("compose-query").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); $("compose-go").click(); } });

/* ---------- importación ---------- */
const busy = { open(title) { $("busy-title").textContent = title; $("busy-log").textContent = ""; $("busy-err").hidden = true; $("busy-settings").hidden = true; $("busy-spinner").classList.remove("stop"); $("busy-close").textContent = "Cancelar"; $("busy").hidden = false; },
  log(msg) { $("busy-log").textContent = msg; },
  error(msg, needSettings) { $("busy-log").textContent = ""; $("busy-spinner").classList.add("stop"); $("busy-err").textContent = msg; $("busy-err").hidden = false; $("busy-settings").hidden = !needSettings; $("busy-close").textContent = "Cerrar"; },
  close() { $("busy").hidden = true; } };
let lastImportKind = "";
function cancelImport() { if (composeAbort) { try { composeAbort.abort(); } catch (e) { /* nada */ } }
  const reopen = lastImportKind === "compose" && !$("busy-err").hidden; importToken++; busy.close(); if (reopen && screen === "library") openSheet(); }
$("busy-close").addEventListener("click", cancelImport);
$("busy-settings").addEventListener("click", () => { cancelImport(); openSettings(); });

async function runCompose() {
  const query = $("compose-query").value.trim();
  if (!query) { toast("Escribí qué canción querés tocar."); $("compose-query").focus(); return; }
  lastImportKind = "compose";
  const token = ++importToken; const alive = () => token === importToken;
  closeSheet();
  busy.open("Armando la partitura");
  if (!settings.apiKey) { busy.error("Falta la API key. Cargala en Ajustes para pedir canciones a la IA.", true); return; }
  if (!navigator.onLine) { busy.error("Sin conexión a internet: pedir una canción la necesita."); return; }
  const ctl = new AbortController(); composeAbort = ctl;
  try {
    const cm = await lazy("compose"), omr = await lazy("omr");
    const prov = settings.provider || "anthropic";
    const score = await cm.composeScore({ query, level: composeLevel, hands: composeHands, provider: prov, apiKey: settings.apiKey, model: settings.model || (omr.DEFAULT_MODELS || {})[prov], onProgress: (m) => alive() && busy.log(m), signal: ctl.signal });
    if (!alive()) return;
    score.id = score.id || newId();
    busy.close();
    openReview(score, true, null, "Partitura armada por IA de memoria: puede tener diferencias con la original. Revisala antes de practicar.");
  } catch (err) {
    if (!alive()) return;
    if (!(err && err.name === "OmrError")) console.error(err);
    busy.error(err && err.message ? err.message : String(err), !!err && err.kind === "auth");
  } finally { composeAbort = null; }
}
let composeAbort = null;
$("compose-go").addEventListener("click", runCompose);

async function runImport(kind, files) {
  files = Array.from(files || []); if (!files.length) return;
  lastImportKind = kind;
  const token = ++importToken;
  const alive = () => token === importToken;
  const needsAi = kind === "photo" || kind === "images" || kind === "pdf";
  busy.open(needsAi ? "Leyendo partitura con IA" : "Importando partitura");
  try {
    let score;
    if (needsAi) {
      if (!settings.apiKey) {
        busy.error("Falta la API key. Cargala en Ajustes para leer fotos y PDF con IA.", true); return;
      }
      if (!navigator.onLine) { busy.error("Sin conexión a internet: la lectura por IA la necesita."); return; }
      busy.log("Preparando imágenes…");
      const imp = await lazy("importers"), omr = await lazy("omr");
      let blobs = [];
      if (kind === "pdf") {
        busy.log("Convirtiendo el PDF a imágenes…");
        blobs = await imp.pdfToImages(files[0], { scale: 2 });
      } else {
        for (let i = 0; i < files.length; i++) { busy.log(`Preparando imagen ${i + 1} de ${files.length}…`); blobs.push(await imp.prepareImage(files[i])); }
      }
      if (!alive()) return;
      if (!blobs.length) throw new Error("No se obtuvieron imágenes para leer.");
      score = await omr.recognizeScore(blobs, { provider: settings.provider || "anthropic", apiKey: settings.apiKey, model: settings.model || (omr.DEFAULT_MODELS || {})[settings.provider || "anthropic"], onProgress: (m) => alive() && busy.log(m) });
      if (!score.title || /^$/.test(score.title)) score.title = files[0].name.replace(/\.[^.]+$/, "");
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
    busy.close();
    openReview(v.score, true, v.errors);
  } catch (err) {
    if (!alive()) return;
    console.error(err);
    busy.error(err && err.message ? err.message : String(err), /key|clave|401|403/i.test(String(err && err.message)));
  }
}
const importMap = { "imp-photo": ["file-photo", "photo"], "imp-images": ["file-images", "images"], "imp-pdf": ["file-pdf", "pdf"], "imp-xml": ["file-xml", "xml"], "imp-midi": ["file-midi", "midi"] };
for (const [btn, [inp, kind]] of Object.entries(importMap)) {
  $(btn).addEventListener("click", () => { closeSheet(); $(inp).click(); });
  $(inp).addEventListener("change", (e) => { const f = e.target.files; runImport(kind, f); e.target.value = ""; });
}

/* ---------- revisión / edición ---------- */
function openReview(score, isNew, warnings, note) {
  editState = { score: clone(score), selected: null, history: [], isNew };
  $("review-note").hidden = !note; $("review-note-t").textContent = note || "";
  $("review-title").value = score.title || "";
  $("review-bpm").value = score.bpm || 80;
  show("review");
  reviewR.clearMarks(); reviewR.setCursor(null);
  reviewR.draw(editState.score, []);
  refreshReviewPhrases();
  updateEditUi();
  if (warnings && warnings.length) toast("Aviso: " + warnings[0], 4500);
}
function selNote() {
  const s = editState && editState.selected; if (!s) return null;
  const m = editState.score.measures[s.measure]; const ev = m && m[s.hand][s.idx];
  return ev && ev.k[s.keyIdx] ? { ev, key: ev.k[s.keyIdx] } : null;
}
function updateEditUi() {
  const sel = selNote();
  ["ed-up", "ed-down", "ed-oct-up", "ed-oct-down", "ed-del"].forEach((id) => ($(id).disabled = !sel));
  $("ed-undo").disabled = !editState || !editState.history.length;
  if (sel) {
    const s = editState.selected, midi = keyToMidi(sel.key);
    $("review-sel").innerHTML = `Seleccionada: <b>${midi == null ? sel.key : midiName(midi)}</b> — compás ${s.measure + 1}, ${HANDS_ES[s.hand]}`;
  } else $("review-sel").textContent = "Tocá una nota de la partitura para corregirla.";
  reviewR.setSelected(sel ? editState.selected : null);
}
function applyEdit(fn) {
  const sel = selNote(); if (!sel) return;
  editState.history.push({ score: clone(editState.score), selected: { ...editState.selected } });
  if (editState.history.length > 50) editState.history.shift();
  fn(sel);
  redrawReview();
}
function redrawReview() {
  const st = $("review-score").scrollTop;
  reviewR.draw(editState.score, []);
  $("review-score").scrollTop = st;
  refreshReviewPhrases();
  updateEditUi();
}
function shift(semi) {
  applyEdit(({ ev, key }) => {
    const m = keyToMidi(key); if (m == null) return;
    const nk = midiToKey(Math.max(21, Math.min(108, m + semi)));
    const i = editState.selected.keyIdx;
    if (!ev.k.some((k, j) => j !== i && k === nk)) ev.k[i] = nk;
  });
}
reviewR.onNoteTap((ref) => { if (!editState) return; editState.selected = ref; updateEditUi(); });
$("ed-up").addEventListener("click", () => shift(1));
$("ed-down").addEventListener("click", () => shift(-1));
$("ed-oct-up").addEventListener("click", () => shift(12));
$("ed-oct-down").addEventListener("click", () => shift(-12));
$("ed-del").addEventListener("click", () => applyEdit(({ ev }) => { ev.k.splice(editState.selected.keyIdx, 1); editState.selected = null; }));
$("ed-undo").addEventListener("click", () => {
  const h = editState.history.pop(); if (!h) return;
  editState.score = h.score; editState.selected = h.selected; redrawReview();
});
async function saveReview() {
  const sc = editState.score;
  sc.title = $("review-title").value.trim() || "Sin título";
  sc.bpm = Math.max(30, Math.min(240, parseInt($("review-bpm").value, 10) || sc.bpm || 80));
  const v = validateScore(sc);
  v.score.id = sc.id || newId();
  try { await store.save(v.score); } catch (e) { toast("No se pudo guardar: " + e.message, 4500); return null; }
  editState.isNew = false;
  return v.score;
}
$("review-save").addEventListener("click", async () => { if (await saveReview()) { toast("Partitura guardada"); history.state && history.state.s ? history.back() : show("library", false); } });
$("review-save-practice").addEventListener("click", async () => { const s = await saveReview(); if (s) startPractice(s); });
$("review-back").addEventListener("click", async () => {
  if (editState && (editState.history.length || editState.isNew) && !(await confirmDialog({ title: "¿Salir sin guardar?", text: "Los cambios que hiciste en esta partitura se pierden.", yes: "Salir sin guardar", no: "Seguir editando" }))) return;
  goLibrary();
});

/* ---------- ajustes ---------- */
async function loadSettings() {
  const s = await store.settings();
  settings = { ...DEFAULT_SETTINGS, ...s };
  applyLook();
  applyKeyboardSetting();
}
function openSettings() {
  prevBeforeSettings = screen === "settings" ? prevBeforeSettings : screen;
  $("set-provider").value = settings.provider || "anthropic";
  $("set-key").value = settings.apiKey || ""; $("set-key").type = "password"; $("set-key-show").textContent = "Ver";
  $("set-model").value = settings.model || "";
  $("set-kb").checked = !!settings.onscreenKeyboard;
  $("set-phrases").checked = settings.showPhrases !== false;
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
  settings = { ...settings, provider: $("set-provider").value, apiKey: $("set-key").value.trim(), model: $("set-model").value.trim(), onscreenKeyboard: $("set-kb").checked, showPhrases: $("set-phrases").checked, micSensitivity: micSensFromUi() };
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
const kb = createKeyboard($("piano"), { onKey: (m) => handleNoteOn(m) });
let kbOpen = false;   // con la Guía apagada el teclado se pliega; el usuario puede desplegarlo
function applyKeyboardSetting() {
  kb.setInteractive(!!settings.onscreenKeyboard);
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
function stepHands(step) {
  const map = new Map();
  for (const r of (step && step.refs) || []) {
    const ev = current && current.measures[r.measure] && (current.measures[r.measure][r.hand] || [])[r.idx];
    const m = ev && keyToMidi(ev.k[r.keyIdx]);
    if (m != null && (r.hand === "rh" || !map.has(m))) map.set(m, r.hand);
  }
  return map;
}
/** Con Guía: ilumina el paso actual (las ya tocadas en verde). Sin Guía: no anticipa nada. */
function syncKeyboard(focus = true) {
  const st = session && session.state;
  const step = st && st.status === "playing" ? steps[st.index] : null;
  if (!step || settings.guide === false || listening) { if (!listening) kb.setTargets([]); return; }
  const hm = stepHands(step);
  kb.setTargets(step.midi.map((m) => ({ midi: m, hand: hm.get(m) || "rh", done: st.pressed.includes(m) })));
  if (focus) kb.focus(step.midi);
}
$("guide-toggle").addEventListener("click", () => {
  settings.guide = settings.guide === false;
  store.saveSettings({ guide: settings.guide }).catch(() => {});
  if (settings.guide === false) kbOpen = false;
  $("guide-toggle").setAttribute("aria-pressed", String(settings.guide));
  kb.setHint(null); syncKbFold(); syncKeyboard(true); refreshNext();
});

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
  if (!session || !phrases.length) { practiceStruct.setCurrent(null); return; }
  const st = session.state;
  const step = steps[Math.min(st.index, steps.length - 1)];
  const p = step ? phraseAt(phrases, step.measure) : null;
  const id = p ? p.id : null;
  if (id === curPhrase) return;
  curPhrase = id; practiceStruct.setCurrent(id);
  const msg = p && repeatNotice(p, phrases);
  if (msg) showPhraseNote(msg); else hidePhraseNote();
}

/* ---------- hojas de Práctica (Conexión, Tempo, Bucle, Lectura, Sesión) ---------- */
const SHEET_TITLES = { input: "Conexión", tempo: "Tempo", loop: "Bucle", look: "Lectura", hands: "Manos y sesión" };
const SHEET_OPENERS = { input: "input-pill", tempo: "btn-tempo", loop: "btn-loop", look: "btn-look", hands: "hands-link" };
let sheetName = null, sheetFrom = null;
function openPSheet(name, opener) {
  if (sheetName === name) { closePSheet(); return; }
  if (sheetName) closePSheet(true);
  sheetName = name; sheetFrom = opener || $(SHEET_OPENERS[name]);
  $("ps-title").textContent = SHEET_TITLES[name];
  document.querySelectorAll("#psheet .ps-sec").forEach((x) => (x.hidden = x.dataset.sec !== name));
  $("psheet").hidden = false;
  Object.entries(SHEET_OPENERS).forEach(([k, id]) => $(id).setAttribute("aria-expanded", String(k === name)));
  if (name === "loop") initLoopSheet();
  if (name === "tempo") { $("countin-toggle").checked = !!settings.countIn; syncMetroUi(); }
  if (name === "input") syncInputSheet();
  if (name === "hands") syncHandsUi();
  $("ps-box").focus({ preventScroll: true });
}
function closePSheet(silent) {
  if (!sheetName) return;
  const was = sheetName; sheetName = null;
  if (was === "loop") { stopListening(); practiceR.setRange(passage && passage.loop ? passage : null); }
  $("psheet").hidden = true;
  Object.values(SHEET_OPENERS).forEach((id) => $(id).setAttribute("aria-expanded", "false"));
  if (!silent && sheetFrom && sheetFrom.focus) sheetFrom.focus({ preventScroll: true });
  sheetFrom = null;
}
$("ps-close").addEventListener("click", () => closePSheet());
for (const [name, id] of Object.entries(SHEET_OPENERS)) $(id).addEventListener("click", () => openPSheet(name, $(id)));
document.addEventListener("pointerdown", (e) => {
  if (!sheetName || sheetName === "loop") return;   // el selector de bucle queda abierto para mirar la partitura
  if (e.target.closest("#psheet") || e.target.closest("#pr-head") || e.target.closest("#confirm")) return;
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
}
function syncInputSheet() {
  $("input-lead").textContent = midiConnected ? "Piano MIDI conectado." : mic && mic.running ? "El micrófono está escuchando." : settings.onscreenKeyboard ? "Estás usando el teclado de pantalla." : "Elegí cómo te escucha la app.";
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
let countingIn = false, countBeats = 0, countWasOn = false, countTimer = 0;
metro.onBeat((i) => {
  const d = $("beat-dot"); d.className = "beat-dot on" + (i === 0 ? " accent" : "");
  const pips = $("beat-pips").children;
  for (let k = 0; k < pips.length; k++) pips[k].className = k === i ? "on" + (i === 0 ? " first" : "") : "";
  setTimeout(() => { d.className = "beat-dot"; for (const p of pips) p.className = ""; }, 140);
  if (countingIn) { countBeats++; refreshNext(); if (countBeats >= (current && current.timeSig ? current.timeSig[0] : 4)) endCountIn(); }
});
function syncMetroUi() {
  $("metro-toggle").checked = metro.isRunning;
  $("btn-tempo").classList.toggle("metro-on", metro.isRunning);
  updateMicNote();
}
function setMetroBpm(n, silent) {
  metroBpm = Math.max(30, Math.min(240, Math.round(n))); metro.setBpm(metroBpm);
  $("bpm-val").textContent = metroBpm; $("tempo-t").textContent = `♩ ${metroBpm} BPM`;
  $("btn-tempo").setAttribute("aria-label", `Tempo: ${metroBpm} negras por minuto. Tocá para cambiarlo`);
  if (!silent) rememberPractice();
}
$("bpm-down").addEventListener("click", () => setMetroBpm(metroBpm - 4));
$("bpm-up").addEventListener("click", () => setMetroBpm(metroBpm + 4));
$("metro-toggle").addEventListener("change", (e) => { if (e.target.checked) metro.start(); else metro.stop(); syncMetroUi(); });
$("countin-toggle").addEventListener("change", (e) => { settings.countIn = e.target.checked; store.saveSettings({ countIn: settings.countIn }).catch(() => {}); });
/** Cuenta de entrada: un compás de clics; mientras tanto se ignoran las notas. */
function beginCountIn() {
  if (!settings.countIn || !current || !session) return;
  countWasOn = metro.isRunning;
  if (!metro.isRunning) { metro.start(); syncMetroUi(); }
  if (!metro.isRunning) return;   // sin audio: no se espera
  countingIn = true; countBeats = 0;
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
  onNoteOn: (m) => handleNoteOn(m),
  onNoteOff: () => {},
  onStatus: (s) => {
    midiConnected = !!s.connected;
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
    refreshInputPill(); syncInputSheet();
  },
});
if (!midi.supported.usb) { $("midi-usb").disabled = true; $("midi-usb").title = "Este navegador no soporta Web MIDI"; }
if (!midi.supported.ble) { $("midi-ble").disabled = true; $("midi-ble").title = "Este navegador no soporta Web Bluetooth"; }
$("midi-usb").addEventListener("click", () => midi.connectUsb().catch((e) => toast("USB: " + (e && e.message || e), 4500)));
$("midi-ble").addEventListener("click", () => midi.connectBle().catch((e) => toast("Bluetooth: " + (e && e.message || e), 4500)));

/* ---------- micrófono ---------- */
let mic = null, midiConnected = false;
function currentExpected() {
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
    mic = m.createMicInput({ onNoteOn: (n) => { if (!midiConnected) handleNoteOn(n); }, onStatus: onMicStatus, getExpected: currentExpected, sensitivity: settings.micSensitivity });
  }
  mic.setSensitivity(settings.micSensitivity);
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

function curStep() { const st = session && session.state; return st ? steps[Math.min(st.index, steps.length - 1)] : null; }
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
  setMetroBpm(o.bpm || (r && r.bpm) || score.bpm || 80, true);
  metro.setBeats((score.timeSig || [4, 4])[0]);
  buildPips((score.timeSig || [4, 4])[0]);
  kb.setRange(...Object.values(scoreRange(score)));
  kbOpen = false; paused = false; listening = false; closePSheet(true);
  session = null; // evita avisos de frases de la sesión anterior
  applyPhrases();
  if (screen !== "practice") show("practice");
  resetSession();
  syncKbFold(); updateConnectHint(); refreshInputPill(); syncMetroUi();
  requestWake();
  if (passage && !passage.loop) toast(`Seguís desde el compás ${passage.from + 1}`, 2400);
}
function resetSession() {
  attemptSaved = false; kb.setHint(null); curPhrase = "-"; hidePhraseNote(); hideStuck(); missView = null;
  clearTimeout(finishTimer); clearTimeout(lapTimer); stopListening(true); endCountIn(); setPaused(false, true);
  laps = []; agg = { clean: 0, dirty: 0, wrong: 0 }; trace = { clean: [], dirty: [], errors: [] }; handMiss = { rh: 0, lh: 0 };
  allSteps = buildSteps(current, hands);
  steps = passage ? passageSteps(allSteps, passage) : allSteps;
  practiceR.clearMarks(); practiceR.setCursor(null);
  practiceR.draw(current, allSteps);
  practiceR.setRange(isLoop() ? passage : null);
  syncLoopButton(); renderLapLine();
  if (!steps.length) { session = null; refreshNext(); updatePracticeUi(); syncKeyboard(); return; }
  newSession(true);
  trackPhrase();
  beginCountIn();
}
/** Sesión nueva sobre los mismos pasos (arranque o nueva vuelta del bucle). */
function newSession(first) {
  session = createSession(steps, { maxStreak: isLoop() ? 999 : MAX_STREAK });
  missView = null;
  if (!first) practiceR.clearMarks();
  practiceR.setCursor(steps[0].i);
  updatePracticeUi(); syncKeyboard(true); refreshNext();
}
function leavePractice() {
  rememberPractice(true);
  metro.stop(); syncMetroUi(); releaseWake(); stopMic(); updateMicNote();
  clearTimeout(finishTimer); clearTimeout(lapTimer); hidePhraseNote(); stopListening(true); endCountIn(); closePSheet(true); hideStuck(); $("toast").hidden = true;
}

/* ----- recuerdo del último pasaje / mano / tempo por partitura ----- */
let saveMemT = 0;
function rememberPractice(now) {
  if (!current || !current.id) return;
  const entry = { from: passage ? passage.from : null, to: passage ? passage.to : null, loop: isLoop(), hands, bpm: metroBpm, measure: curMeasure(), at: Date.now() };
  settings.lastPractice = mergePractice(settings.lastPractice, current.id, entry);
  clearTimeout(saveMemT);
  const save = () => store.saveSettings({ lastPractice: settings.lastPractice }).catch(() => {});
  if (now) save(); else saveMemT = setTimeout(save, 700);
}

/* ----- texto de "Próxima nota" ----- */
const names = (arr) => (arr || []).map(midiName).join(" + ");
function expectedNow() {
  const st = session && session.state;
  const step = st && st.status === "playing" ? steps[st.index] : null;
  return step ? step.midi.filter((m) => !st.pressed.includes(m)) : [];
}
let nextOverride = null;   // { label, name } temporal (p. ej. "Vuelta 2 limpia")
function setNext(labelHtml, name, cls, sub) {
  const box = $("next-info");
  box.className = "next-info" + (cls ? " " + cls : "");
  $("next-label").innerHTML = labelHtml; $("next-name").textContent = name;
  $("next-sub").textContent = sub || "";
}
function refreshNext() {
  const guide = settings.guide !== false;
  if (listening) return;   // lo maneja la reproducción
  if (!session) { setNext("Sin notas", "No hay notas para esta selección de manos", "", ""); return; }
  const st = session.state;
  if (countingIn) { setNext("Cuenta de entrada", String(Math.max(1, countBeats + 1)), "", "Empezá cuando termine el compás"); return; }
  if (paused) { setNext("En pausa", "Tocá Continuar", "", ""); return; }
  if (nextOverride) { setNext(nextOverride.label, nextOverride.name, nextOverride.cls || "", nextOverride.sub); return; }
  if (st.status === "finished") { setNext("", "¡Terminaste!", "", ""); return; }
  if (missView) {
    if (guide) setNext(`<span class="n-bad">Tocaste ${esc(missView.played)}</span> · Próxima: `, missView.next, "bad", missView.sub);
    else setNext(`<span class="n-bad">Tocaste ${esc(missView.played)}</span> · `, "Probá de nuevo", "bad", "");
    return;
  }
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
  if (silent) return;
  if (paused) { countWasPaused = metro.isRunning; endCountIn(); metro.stop(); }
  else { if (countWasPaused) metro.start(); beginCountIn(); }
  syncMetroUi(); refreshNext();
}
let countWasPaused = false;
$("practice-pause").addEventListener("click", () => {
  if (listening) { stopListening(); return; }
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
  if (!isLoop()) { el.hidden = true; el.innerHTML = ""; return; }
  const chips = laps.slice(-6).map((l, i, arr) => { const no = laps.length - arr.length + i + 1; return `<span class="lap ${l.clean ? "clean" : "dirty"}" aria-label="Vuelta ${no}: ${l.clean ? "limpia" : "con errores"}">${l.clean ? "✓" : "✕"} ${no}</span>`; }).join("");
  const clean = laps.filter((l) => l.clean).length;
  el.hidden = false;
  el.setAttribute("aria-label", `Vuelta ${laps.length + 1}. ${laps.length ? `${clean} de ${laps.length} vueltas limpias` : "Todavía no completaste ninguna vuelta"}`);
  el.innerHTML = `<b>Vuelta ${laps.length + 1}</b>${chips}`;
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
  for (let k = k0; k <= from && k < steps.length; k++) practiceR.markStep(steps[k].i, null);
  missView = null; kb.setHint(null);
  practiceR.setCursor(steps[k0].i); updatePracticeUi(); syncKeyboard(true); refreshNext(); trackPhrase();
});

/* ----- escuchar el pasaje (Web Audio) ----- */
const player = createPlayer();
let micPaused = false, listenSteps = [];
function mapToPractice(beat) {   // paso de práctica (índice del render) que corresponde a ese instante
  let best = null;
  for (const s of allSteps) { if (s.t <= beat + 1e-6) best = s; else break; }
  return best ? best.i : null;
}
function startListening({ range, hands: hs, slow }) {
  if (!current) return;
  stopListening(true);
  const r = range ? normRange(range, N()) : null;
  const hsteps = passageSteps(buildSteps(current, hs || hands), r);
  if (!hsteps.length) { toast("No hay notas en ese pasaje con esa mano."); return; }
  const events = buildEvents(current, hsteps, { bpm: metroBpm, speed: slow ? 0.6 : 1 });
  const byStep = new Map();
  events.forEach((e) => { (byStep.get(e.step) || byStep.set(e.step, []).get(e.step)).push(e); });
  hideStuck(); setPaused(false, true); kb.setHint(null); missView = null;
  if (mic && mic.running) { micPaused = true; stopMic(); }
  listening = true; endCountIn();
  if (metro.isRunning) { metro.stop(); syncMetroUi(); }
  const label = r ? `Escuchando compases ${rangeText(r)}${slow ? " · lento" : ""}` : "Escuchando";
  setNext(label, "♪", "listen", "Tocá Detener para volver");
  $("practice-pause").setAttribute("aria-pressed", "false");
  $("pause-t").textContent = "Detener"; $("practice-pause").querySelector("use").setAttribute("href", "#i-stop");
  try {
    player.play(events, {
      onStep: (e) => {
        const g = mapToPractice(e.beat); if (g != null) practiceR.setCursor(g);
        const grp = byStep.get(e.step) || [];
        if (settings.guide !== false) kb.setTargets(grp.map((x) => ({ midi: x.midi, hand: x.hand }))), kb.focus(grp.map((x) => x.midi));
        setNext(label, names(grp.map((x) => x.midi).sort((a, b) => a - b)), "listen", "Tocá Detener para volver");
      },
      onEnd: () => stopListening(),
    });
  } catch (err) { listening = false; toast(err.message || "No se pudo reproducir el audio.", 3600); stopListening(true); return; }
  if (sheetName === "loop") syncLoopSheet();
}
function stopListening(silent) {
  if (!listening) return;
  listening = false; player.stop();
  $("pause-t").textContent = paused ? "Continuar" : "Pausar"; $("practice-pause").querySelector("use").setAttribute("href", paused ? "#i-play" : "#i-pause");
  if (micPaused) { micPaused = false; startMic().catch(() => {}); }
  const s = curStep();
  if (s && session) practiceR.setCursor(s.i);
  kb.setTargets([]); syncKeyboard(true); refreshNext();
  if (sheetName === "loop" && !silent) syncLoopSheet();
}

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
function handleNoteOn(m) {
  if (screen !== "practice" || !session || paused || listening || countingIn) return;
  const ev = session.noteOn(m);
  if (ev.type === "ignored") return;
  practiceR.follow();   // si estabas mirando otra parte, vuelve suavemente al cursor
  const gi = steps[ev.step] ? steps[ev.step].i : null;
  switch (ev.type) {
    case "partial": kb.setHint(null); kb.flash(m, "ok"); missView = null; syncKeyboard(false); break;
    case "step":
      kb.setHint(null); kb.flash(m, "ok"); missView = null; hideStuck();
      practiceR.markStep(gi, ev.result); practiceR.setCursor(steps[session.state.index].i);
      syncKeyboard(true); if (settings.guide === false) kb.focus([m]); trackPhrase(); rememberPractice(); break;
    case "miss": case "stopped": {
      practiceR.markStep(gi, "dirty");
      const t = nearestMissing(m, ev.expected);
      kb.flash(m, "bad");
      const guide = settings.guide !== false;
      if (guide && t != null) kb.setHint({ fromMidi: m, toMidi: t });
      if (!guide) kb.focus([m]);
      const mv = t == null ? null : describeMove(m, t);
      missView = { played: midiName(m), next: names(ev.expected), sub: guide && mv ? mv.text : "" };
      const hm = stepHands(steps[ev.step]);
      new Set(ev.expected.map((x) => hm.get(x) || "rh")).forEach((h) => { handMiss[h]++; });
      if (isLoop() && ev.type === "miss" && ev.streak > MAX_STREAK) { session.resetStreak(); showStuck(); }
      break;
    }
    case "finished":
      kb.setHint(null); kb.flash(m, "ok"); missView = null; practiceR.markStep(gi, ev.result); syncKeyboard(false);
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
  if (!session || screen !== "practice") return;
  const run = collectRun();
  const n = N(), range = passage && !isWholeRange(passage, n) ? { from: passage.from, to: passage.to } : null;
  const cov = coverage(steps, run.done);
  const rec = { scoreId: current && current.id, accuracy: run.accuracy, status: run.status, total: steps.length, index: run.done, clean: run.clean, dirty: run.dirty, wrong: run.wrong, hands, range, loop: isLoop(), bpm: metroBpm, laps: laps.length, measuresDone: cov.measuresDone, measuresTotal: cov.measuresTotal };
  let prev = [];
  if (rec.scoreId && !attemptSaved) {
    attemptSaved = true;
    try { prev = await store.attempts(rec.scoreId); await store.addAttempt(rec); } catch (e) { console.warn("Historial:", e.message); }
  }
  if (screen !== "practice") return;
  lastRun = { passage: passage ? { ...passage } : null, hands, bpm: metroBpm };
  show("result");
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
  const bar = (id, v) => { const e = $(id); e.style.transition = "none"; e.style.width = "0"; void e.offsetWidth; e.style.transition = ""; requestAnimationFrame(() => requestAnimationFrame(() => { e.style.width = v + "%"; })); };
  bar("res-acc-bar", run.traversed ? acc : 0); bar("res-cov-bar", cov.measuresTotal ? (cov.measuresDone / cov.measuresTotal) * 100 : 0);
  $("res-cov-bar").parentNode.setAttribute("aria-hidden", "true");
  const sc = $("result-scope");
  sc.hidden = !range;
  if (range) sc.textContent = `${isLoop() ? "Bucle" : "Desde el compás " + (range.from + 1)}: compases ${rangeText(range)} de ${n} · ${handsText().toLowerCase()}`;
  $("res-clean").textContent = run.clean; $("res-dirty").textContent = run.dirty; $("res-wrong").textContent = run.wrong;
  $("res-laps-box").hidden = !isLoop(); $("res-laps").textContent = laps.length; $("screen-result").style.setProperty("--cols", isLoop() ? 4 : 3);

  // comparación sólo con intentos equivalentes (mismo rango, mano y modo)
  const eq = equivalentAttempts(prev, rec, n);
  const bestPrev = bestEquivalent(prev, rec, n);
  const record = fin && bestPrev !== null && acc > bestPrev;
  const first = fin && eq.length === 0 && acc > 0;
  $("result-badge").hidden = !(record || first);
  $("result-badge-t").textContent = record ? "¡Nuevo récord!" : "Primer resultado guardado";
  const cmp = $("result-compare");
  const kind = [range ? `compases ${rangeText(range)}` : "pieza entera", handsText().toLowerCase(), isLoop() ? "en bucle" : ""].filter(Boolean).join(" · ");
  cmp.hidden = !rec.scoreId || (!eq.length && !prev.length);
  if (!cmp.hidden) cmp.textContent = bestPrev !== null ? (record ? `Superaste tu mejor intento anterior de este tipo (${bestPrev}%).` : acc === bestPrev && fin ? `Igualaste tu mejor intento de este tipo (${bestPrev}%).` : `Tu mejor intento completo de este tipo es ${bestPrev}%.`)
    : eq.length ? "Todavía no completaste un intento de este tipo para compararlo." : `Es tu primer intento de este tipo (${kind}): no se compara con los anteriores.`;

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
  renderStrip(measureSummary(run.results, steps, n), run.errors);
  $((act.type === "none" ? "result-retry" : "result-action-btn")).focus();
}
let resultMeasure = null;
function renderStrip(sum, errors) {
  const el = $("measure-strip");
  el.innerHTML = sum.map((s, m) => {
    const lbl = s === "clean" ? "limpio" : s === "dirty" ? "con error" : s === "none" ? "no tocado" : "sin notas";
    const glyph = s === "clean" ? "✓" : s === "dirty" ? "✕" : s === "none" ? "·" : "–";
    return `<button class="ms ${s}" data-m="${m}" ${s === "empty" ? "disabled" : ""} aria-label="Compás ${m + 1}: ${lbl}${s === "empty" ? "" : ". Tocá para practicarlo"}"><span>${m + 1}</span><i aria-hidden="true">${glyph}</i></button>`;
  }).join("");
  el.setAttribute("aria-label", `Resumen por compás: ${sum.filter((s) => s === "clean").length} limpios, ${sum.filter((s) => s === "dirty").length} con error, ${sum.filter((s) => s === "none").length} sin tocar`);
}
$("measure-strip").addEventListener("click", (e) => {
  const b = e.target.closest(".ms"); if (!b || b.disabled) return;
  const m = +b.dataset.m; resultMeasure = m;
  const st = b.classList.contains("dirty") ? "tuvo errores" : b.classList.contains("clean") ? "salió limpio" : "no lo tocaste completo";
  $("strip-offer-t").textContent = `Compás ${m + 1}: ${st}.`;
  $("strip-offer-go").textContent = `Practicar compás ${m + 1}`;
  $("strip-offer").hidden = false;
});
$("strip-offer-go").addEventListener("click", () => { if (resultMeasure != null) returnToPractice({ passage: { from: resultMeasure, to: resultMeasure, loop: true } }); });
/** Vuelve a Práctica desde Resultado con otro pasaje / mano / tempo. */
function returnToPractice(o = {}) {
  if (!current) return;
  const base = lastRun || { passage: null, hands, bpm: metroBpm };
  passage = "passage" in o ? (o.passage ? normalizePassage(o.passage) : null) : base.passage;
  hands = o.hands || base.hands || hands;
  if (o.bpm) setMetroBpm(o.bpm);
  show("practice", false); history.replaceState({ s: "practice" }, "");
  syncHandsUi(); resetSession(); rememberPractice(); requestWake();
}
const normalizePassage = (p) => { const r = normRange(p, N()); return r ? { ...r, loop: !!p.loop } : null; };
function runAction(act) {
  if (act.type === "fix") returnToPractice({ passage: { ...act.range, loop: true } });
  else if (act.type === "continue" && act.loop) returnToPractice();
  else if (act.type === "continue") returnToPractice({ passage: { from: act.measure, to: N() - 1, loop: false } });
  else if (act.type === "both-hands") returnToPractice({ hands: "both" });
  else if (act.type === "faster") returnToPractice({ bpm: act.bpm });
}
$("result-retry").addEventListener("click", () => returnToPractice());
$("result-lib").addEventListener("click", () => { show("library", false); });

/* ---------- arranque ---------- */
(async function init() {
  await loadSettings();
  show("library", false);
  handleIncomingHash();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js").catch((e) => console.warn("SW:", e.message));
  }
})();
