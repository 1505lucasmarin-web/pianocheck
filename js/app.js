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

const DEFAULT_SETTINGS = { provider: "anthropic", apiKey: "", model: "", onscreenKeyboard: false, micSensitivity: 0.5, seenConnectHint: false, guide: true, showPhrases: true, scoreView: "continua", scoreTheme: "hoja", scoreSize: "mediano" };
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
  mark("set-view", "view", settings.scoreView);
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
for (const [id, attr, key] of [["look-theme", "theme", "scoreTheme"], ["set-theme", "theme", "scoreTheme"], ["look-size", "size", "scoreSize"], ["set-size", "size", "scoreSize"], ["set-view", "view", "scoreView"]]) {
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
    ? `<div class="scores"><div class="sc best"><span>Mejor</span><b>${sum.best}%</b></div><div class="sc"><span>Último</span><b>${sum.last}%</b></div></div><div class="mini" aria-hidden="true"><i style="width:${sum.best}%"></i></div>`
    : `<div class="sc-none">Sin intentos todavía</div>`;
  const title = esc(s.title || "Sin título");
  return `<li class="card" data-id="${esc(s.id)}"><div class="card-top"><div class="t">${title}</div>${lvl}</div><div class="tags">${tags}</div>${res}
    <div class="row"><button class="btn primary grow" data-act="practice" aria-label="Practicar ${title}">${ic("play", "sm")}Practicar</button>
    ${demo ? `<button class="btn" data-act="adddemo">${ic("plus", "sm")}Agregar a mi biblioteca</button>` : `<button class="btn" data-act="edit" aria-label="Editar ${title}">${ic("pencil", "sm")}Editar</button><button class="btn icon danger" data-act="del" aria-label="Eliminar ${title}">${ic("trash")}</button>`}</div></li>`;
}
async function refreshLibrary() {
  let list = [], sums = {};
  try { list = (await store.list()) || []; sums = await store.summaries(); } catch (e) { $("library-list").innerHTML = `<li class="empty">No se pudo leer la biblioteca: ${esc(e.message)}</li>`; return; }
  list = list.slice().sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  $("empty-state").hidden = list.length > 0;
  $("library-section").hidden = list.length === 0;
  $("demo-section").hidden = list.length === 0;
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
function applyKeyboardSetting() {
  kb.setInteractive(!!settings.onscreenKeyboard);
  const g = settings.guide !== false;
  $("guide-toggle").setAttribute("aria-pressed", String(g));
  requestAnimationFrame(() => practiceR.redraw());
}
function scoreRange(sc) {
  let lo = Infinity, hi = -Infinity;
  for (const m of sc.measures || []) for (const h of ["rh", "lh"]) for (const ev of m[h] || []) for (const k of ev.k || []) { const x = keyToMidi(k); if (x != null) { lo = Math.min(lo, x); hi = Math.max(hi, x); } }
  return Number.isFinite(lo) ? computeRange(lo, hi) : computeRange(60, 71);
}
function stepHands(step) {
  const map = new Map();
  for (const r of step.refs || []) {
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
  if (!step || settings.guide === false) { kb.setTargets([]); return; }
  const hm = stepHands(step);
  kb.setTargets(step.midi.map((m) => ({ midi: m, hand: hm.get(m) || "rh", done: st.pressed.includes(m) })));
  if (focus) kb.focus(step.midi);
}
$("guide-toggle").addEventListener("click", () => {
  settings.guide = settings.guide === false;
  store.saveSettings({ guide: settings.guide }).catch(() => {});
  $("guide-toggle").setAttribute("aria-pressed", String(settings.guide));
  kb.setHint(null); syncKeyboard(true);
});

/* ---------- frases repetidas: leyenda "Estructura" ---------- */
function makeStructure(el, renderer) {
  let list = [], cur = null, collapsed = false;
  function render() {
    el.hidden = !list.length;
    if (!list.length) { el.innerHTML = ""; return; }
    const chips = list.map((p, i) => {
      const gap = i > 0 ? `<span class="struct-dot" aria-hidden="true">${list[i - 1].endMeasure + 1 === p.startMeasure ? "·" : "…"}</span>` : "";
      return gap + `<button class="sc-chip${p.id === cur ? " cur" : ""}" data-id="${p.id}" style="--c:${phraseColor(p.label)}" aria-label="Frase ${esc(p.label)}, compases ${measureRangeText(p)}${p.id === cur ? " (la que tocás ahora)" : ""}">${esc(p.label)}</button>`;
    }).join("");
    el.innerHTML = `<button class="struct-t" aria-expanded="${!collapsed}" aria-label="Estructura de la pieza, ${collapsed ? "mostrar" : "ocultar"}">Estructura${collapsed ? "" : ":"}<svg class="ic sm chev ${collapsed ? "down" : ""}"><use href="#i-chev"/></svg></button>` + (collapsed ? "" : `<div class="struct-chips">${chips}</div>`);
  }
  el.addEventListener("click", (e) => {
    if (e.target.closest(".struct-t")) { collapsed = !collapsed; render(); requestAnimationFrame(() => renderer.redraw()); return; }
    const c = e.target.closest(".sc-chip"); if (!c) return;
    const p = list.find((x) => x.id === c.dataset.id); if (p) renderer.scrollToMeasure(p.startMeasure);
  });
  return { set(l, c) { list = l || []; cur = c || null; render(); }, setCurrent(c) { if (c === cur) return; cur = c || null; if (!el.hidden && !collapsed) el.querySelectorAll(".sc-chip").forEach((b) => { b.classList.toggle("cur", b.dataset.id === cur); }); } };
}
const practiceStruct = makeStructure($("practice-struct"), practiceR);
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

/* ---------- práctica ---------- */
const metro = createMetronome();
let metroBpm = 80;
function buildPips(n) { $("beat-pips").innerHTML = Array.from({ length: n }, () => "<i></i>").join(""); }
metro.onBeat((i) => {
  const d = $("beat-dot"); d.className = "beat-dot on" + (i === 0 ? " accent" : "");
  const pips = $("beat-pips").children;
  for (let k = 0; k < pips.length; k++) pips[k].className = k === i ? "on" + (i === 0 ? " first" : "") : "";
  setTimeout(() => { d.className = "beat-dot"; for (const p of pips) p.className = ""; }, 140);
});
function setMetroBpm(n) { metroBpm = Math.max(30, Math.min(240, n)); metro.setBpm(metroBpm); $("bpm-val").textContent = metroBpm; }
$("bpm-down").addEventListener("click", () => setMetroBpm(metroBpm - 4));
$("bpm-up").addEventListener("click", () => setMetroBpm(metroBpm + 4));
$("metro-toggle").addEventListener("click", () => {
  if (metro.isRunning) metro.stop(); else metro.start();
  $("metro-toggle").setAttribute("aria-pressed", String(metro.isRunning));
  updateMicNote();
});

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
  const nothing = !midiConnected && !(mic && mic.running);
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
  updateMicNote();
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

function startPractice(score, keepHands) {
  current = score;
  if (!keepHands) { hands = "both"; }
  document.querySelectorAll("#hands-seg button").forEach((b) => b.classList.toggle("on", b.dataset.hands === hands));
  $("practice-title").textContent = score.title || "Práctica";
  setMetroBpm(score.bpm || 80);
  metro.setBeats((score.timeSig || [4, 4])[0]);
  buildPips((score.timeSig || [4, 4])[0]);
  kb.setRange(...Object.values(scoreRange(score)));
  session = null; // evita avisos de frases de la sesión anterior
  applyPhrases();
  if (screen !== "practice") show("practice");
  resetSession();
  updateConnectHint();
  requestWake();
}
function resetSession() {
  attemptSaved = false; flash(null); kb.setHint(null); curPhrase = "-"; hidePhraseNote();
  steps = buildSteps(current, hands);
  practiceR.clearMarks(); practiceR.setCursor(null);
  practiceR.draw(current, steps);
  if (!steps.length) { session = null; setMsg("No hay notas para practicar con esta selección de manos.", "bad"); updatePracticeUi(); syncKeyboard(); return; }
  session = createSession(steps, { maxStreak: MAX_STREAK });
  practiceR.setCursor(0);
  setMsg("Tocá la primera nota.", "");
  updatePracticeUi();
  syncKeyboard(true);
  trackPhrase();
}
function leavePractice() {
  metro.stop(); $("metro-toggle").setAttribute("aria-pressed", "false"); releaseWake(); stopMic(); updateMicNote();
  clearTimeout(finishTimer); hidePhraseNote();
}
let attemptSaved = false, flashT = 0;
function setMsg(t, cls) {
  const m = $("practice-msg"); $("practice-msg-t").textContent = t;
  m.className = "msg" + (cls ? " " + cls : "");
  m.querySelector("use").setAttribute("href", cls === "ok" ? "#i-check" : cls === "bad" ? "#i-x" : "#i-play");
  if (cls) { void m.offsetWidth; m.classList.add("pop"); }
}
function flash(kind) {
  const el = $("practice-score"); clearTimeout(flashT);
  el.classList.remove("flash-ok", "flash-bad");
  if (kind) { el.classList.add("flash-" + kind); flashT = setTimeout(() => el.classList.remove("flash-ok", "flash-bad"), 420); }
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
}
let finishTimer = 0;
function handleNoteOn(m) {
  if (screen !== "practice" || !session) return;
  const ev = session.noteOn(m);
  if (ev.type !== "ignored") practiceR.follow();   // si estabas mirando otra parte, vuelve suavemente al cursor
  const names = (arr) => (arr || []).map(midiName).join(" + ");
  const missMsg = () => {
    const t = nearestMissing(m, ev.expected);
    kb.flash(m, "bad");
    if (settings.guide !== false && t != null) kb.setHint({ fromMidi: m, toMidi: t });
    if (settings.guide === false) kb.focus([m]);
    const mv = t == null ? null : describeMove(m, t);
    setMsg(`Tocaste ${midiName(m)}.${mv ? " " + mv.text : ""}${ev.expected.length > 1 ? ` (faltan ${names(ev.expected)})` : ""}`, "bad");
  };
  switch (ev.type) {
    case "ignored": return;
    case "partial": kb.setHint(null); kb.flash(m, "ok"); syncKeyboard(false); setMsg(`Bien. Falta: ${names(ev.expected)}`, "ok"); flash("ok"); break;
    case "step": kb.setHint(null); kb.flash(m, "ok"); practiceR.markStep(ev.step, ev.result); practiceR.setCursor(session.state.index); setMsg(ev.result === "clean" ? "¡Bien!" : "Paso completado (con errores).", ev.result === "clean" ? "ok" : ""); if (ev.result === "clean") flash("ok"); syncKeyboard(true); if (settings.guide === false) kb.focus([m]); trackPhrase(); break;
    case "miss": flash("bad"); practiceR.markStep(ev.step, "dirty"); missMsg(); break;
    case "stopped": flash("bad"); practiceR.markStep(ev.step, "dirty"); missMsg(); break;
    case "finished": kb.setHint(null); kb.flash(m, "ok"); syncKeyboard(false); practiceR.markStep(ev.step, ev.result); setMsg("¡Terminaste!", "ok"); break;
  }
  updatePracticeUi();
  if (ev.type === "finished" || ev.type === "stopped") { clearTimeout(finishTimer); finishTimer = setTimeout(showResult, ev.type === "finished" ? 700 : 1100); }
}
async function showResult() {
  if (!session || screen !== "practice") return;
  const st = session.state;
  const rec = { scoreId: current && current.id, accuracy: st.accuracy, status: st.status, total: st.total, index: st.status === "finished" ? st.total : st.index, clean: st.cleanSteps, dirty: st.dirtySteps, wrong: st.wrongNotes, hands };
  let prevBest = null;
  if (rec.scoreId && !attemptSaved) {
    attemptSaved = true;
    try { const prev = await store.attempts(rec.scoreId); prevBest = prev.length ? Math.max(...prev.map((a) => a.accuracy)) : null; await store.addAttempt(rec); } catch (e) { console.warn("Historial:", e.message); }
  }
  if (screen !== "practice") return;
  show("result");
  const cls = st.accuracy >= 90 ? "good" : st.accuracy >= 60 ? "mid" : "low";
  $("result-pct").textContent = st.accuracy + "%";
  $("result-pct").className = "big-pct " + cls;
  const ring = $("result-ring"); ring.className = "ring " + cls;
  const fg = $("result-ring-fg"); fg.style.transition = "none"; fg.style.strokeDashoffset = "326.73"; void fg.getBoundingClientRect(); fg.style.transition = "";
  requestAnimationFrame(() => requestAnimationFrame(() => { fg.style.strokeDashoffset = String(326.73 * (1 - Math.max(0, Math.min(100, st.accuracy)) / 100)); }));
  const fin = st.status === "finished", stp = st.status === "stopped";
  $("result-head").textContent = fin ? (st.accuracy === 100 ? "¡Perfecto!" : "¡Terminaste la partitura!") : stp ? "Se detuvo por errores seguidos" : "Sesión terminada antes de completar";
  $("result-sub").textContent = fin ? (st.accuracy >= 90 ? "Tocaste casi todo sin errores." : "Llegaste al final. Con otra pasada va a salir más limpio.")
    : stp ? `Pasaron ${MAX_STREAK + 1} errores seguidos. Probá más despacio o con una sola mano.` : "Podés retomarla cuando quieras.";
  const record = rec.scoreId && prevBest !== null && st.accuracy > prevBest;
  const first = rec.scoreId && prevBest === null;
  $("result-badge").hidden = !(record || (first && fin && st.accuracy > 0));
  $("result-badge").lastChild.textContent = record ? "¡Nuevo récord!" : "Primer resultado guardado";
  const cmp = $("result-compare");
  cmp.hidden = !(rec.scoreId && prevBest !== null);
  if (!cmp.hidden) cmp.textContent = record ? `Superaste tu mejor intento anterior (${prevBest}%).` : st.accuracy === prevBest ? `Igualaste tu mejor intento (${prevBest}%).` : `Tu mejor intento es ${prevBest}%.`;
  $("res-clean").textContent = st.cleanSteps; $("res-dirty").textContent = st.dirtySteps; $("res-wrong").textContent = st.wrongNotes;
  $("res-prog").textContent = `${fin ? st.total : st.index}/${st.total}`;
  $("result-retry").focus();
}
$("practice-stop").addEventListener("click", () => { clearTimeout(finishTimer); if (session && session.state.status === "playing" && session.state.cleanSteps + session.state.dirtySteps === 0 && session.state.wrongNotes === 0) { goLibrary(); return; } showResult(); });
$("practice-restart").addEventListener("click", () => { clearTimeout(finishTimer); resetSession(); });
$("practice-back").addEventListener("click", () => goLibrary());
document.querySelectorAll("#hands-seg button").forEach((b) => b.addEventListener("click", () => {
  hands = b.dataset.hands;
  document.querySelectorAll("#hands-seg button").forEach((x) => x.classList.toggle("on", x === b));
  clearTimeout(finishTimer); resetSession();
}));
$("result-retry").addEventListener("click", () => { show("practice", false); history.replaceState({ s: "practice" }, ""); resetSession(); requestWake(); });
$("result-lib").addEventListener("click", () => { show("library", false); });

$("panel-toggle").addEventListener("click", () => { const p = $("practice-panel"); const on = p.classList.toggle("expanded"); $("panel-toggle").setAttribute("aria-expanded", String(on)); $("panel-toggle-t").textContent = on ? "Menos" : "Más"; requestAnimationFrame(() => practiceR.redraw()); });

/* ---------- arranque ---------- */
(async function init() {
  await loadSettings();
  show("library", false);
  handleIncomingHash();
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./sw.js").catch((e) => console.warn("SW:", e.message));
  }
})();
