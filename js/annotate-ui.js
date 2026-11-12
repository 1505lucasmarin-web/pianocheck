// Modo «Anotar»: dibujar a mano alzada, resaltar y escribir notas breves sobre la partitura, ancladas al compás (js/annotations.js).
// createAnnotateUI({ renderer, host, area, persist, toast, hint, onActive, getHidden, setHidden }) → { setScore, enter, exit, isActive, refresh, count, store }
import { createStore, fromJSON, pointToAnchor, project, splitStrokeByMeasure, MAX_TEXT } from "./annotations.js";

const SVGNS = "http://www.w3.org/2000/svg";
export const PEN = ["#7b1fa2", "#1565c0", "#ad1457"];      // lápiz (en cada tema se muestra con la variante que contrasta: --an-c0..2)
export const HL = ["#ffcd28", "#50c882", "#ff78be"];       // resaltador (--an-h0..2)
export const TEXT_MAX = 60;
const COLOR_NAMES = ["violeta", "azul", "magenta"];
const HL_NAMES = ["amarillo", "verde", "rosa"];
const QUICK_MARKS = [
  ["1", "Pulgar"], ["2", "Índice"], ["3", "Mayor"], ["4", "Anular"], ["5", "Meñique"],
  ["*", "Asterisco"], ["↑", "Flecha arriba"], ["↓", "Flecha abajo"], ["✓", "Marca de revisión"],
];
const ic = (n, cls = "sm") => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const wrapText = (t, n = 22) => {
  const out = []; let line = "";
  for (const w of String(t).split(" ")) {
    if (line && (line + " " + w).length > n) { out.push(line); line = w; } else line = line ? line + " " + w : w;
    while (line.length > n + 6) { out.push(line.slice(0, n)); line = line.slice(n); }
  }
  if (line) out.push(line);
  return out;
};

export function createAnnotateUI({ renderer, host, area, persist, toast = () => {}, hint = "", onActive = () => {}, getHidden = () => false, setHidden = () => {} }) {
  let store = createStore(), unsub = null, scoreId = null, saveT = 0;
  let active = false, tool = "pen", color = 0, pending = null, stamp = "", nMeasures = 0;
  let scoreLoad = 0;
  let svg = null, layout = null;
  let stroke = null, pan = null, penSeenAt = 0;
  const ptrs = new Map();

  /* ---------- DOM: barra de herramientas + botón ojo ---------- */
  const bar = document.createElement("div");
  bar.className = "anno-bar"; bar.hidden = true; bar.setAttribute("role", "toolbar"); bar.setAttribute("aria-label", "Herramientas de anotación");
  bar.innerHTML = `
    <div class="grp" role="group" aria-label="Herramienta">
      <button class="tb" data-tool="pen" aria-pressed="true" aria-label="Lápiz" title="Lápiz">${ic("pen")}<span class="lbl">Lápiz</span></button>
      <button class="tb" data-tool="hl" aria-pressed="false" aria-label="Resaltador" title="Resaltador">${ic("highlighter")}<span class="lbl">Resaltador</span></button>
      <button class="tb" data-tool="text" aria-pressed="false" aria-label="Texto" title="Texto">${ic("textnote")}<span class="lbl">Texto</span></button>
      <button class="tb" data-tool="eraser" aria-pressed="false" aria-label="Goma" title="Goma">${ic("eraser")}<span class="lbl">Goma</span></button>
    </div>
    <span class="sp"></span>
    <button class="tb done" data-act="done" aria-label="Listo, terminar de anotar">${ic("check")}<span>Listo</span></button>
    <div class="grp" role="group" aria-label="Color">
      ${[0, 1, 2].map((i) => `<button class="sw" data-color="${i}" aria-pressed="${i === 0}" aria-label="Color ${COLOR_NAMES[i]}"><i></i></button>`).join("")}
    </div>
    <div class="grp" role="group" aria-label="Deshacer y desplazar">
      <button class="tb" data-act="undo" aria-label="Deshacer" title="Deshacer" disabled>${ic("undo")}<span class="lbl">Deshacer</span></button>
      <button class="tb" data-act="redo" aria-label="Rehacer" title="Rehacer" disabled>${ic("redo")}<span class="lbl">Rehacer</span></button>
      <button class="tb" data-act="prev" aria-label="Desplazar hacia atrás" title="Desplazar atrás">‹</button>
      <button class="tb" data-act="next" aria-label="Desplazar hacia adelante" title="Desplazar adelante">›</button>
    </div>
    <div class="grp anno-quick" role="group" aria-label="Marcas rápidas">
      ${QUICK_MARKS.map(([mark, label]) => `<button type="button" class="tb" data-stamp="${mark}" aria-label="${mark} · ${label}" aria-pressed="false">${mark}</button>`).join("")}
    </div>
    <div class="anno-text" hidden>
      <button type="button" class="tb" data-act="text-open">Escribir texto</button>
      <input type="text" maxlength="${TEXT_MAX}" autocomplete="off" aria-label="Nota breve (hasta ${TEXT_MAX} caracteres)" placeholder="Nota breve (hasta ${TEXT_MAX} caracteres)" hidden>
      <button class="tb" data-act="text-ok" hidden>Poner</button><button class="tb" data-act="text-no" aria-label="Cancelar la nota">${ic("x")}</button>
    </div>
    <p class="anno-note" role="status"></p>`;
  host.appendChild(bar);
  const q = (s) => bar.querySelector(s);
  const eye = document.createElement("button");
  eye.type = "button"; eye.className = "anno-eye"; eye.hidden = true;
  eye.innerHTML = `<span class="on">${ic("eye", "")}</span><span class="off" hidden>${ic("eye-off", "")}</span>`;
  area.appendChild(eye);

  /* ---------- guardado ---------- */
  const flush = () => { clearTimeout(saveT); saveT = 0; if (scoreId) persist.save(scoreId, store.count() ? store.toJSON() : null).catch(() => {}); };
  const queueSave = () => { clearTimeout(saveT); saveT = setTimeout(flush, 350); };
  function bind(s) {
    if (unsub) unsub();
    store = s; unsub = store.subscribe(() => { syncUi(); draw(); queueSave(); });
  }
  bind(store);

  /** Carga las marcas de una partitura; las de compases que ya no existen se descartan (con aviso). */
  async function setScore(id, n) {
    const load = ++scoreLoad;
    flush(); exit(true);
    scoreId = id || null; nMeasures = n || 0; pending = null;
    let s = createStore();
    bind(s);
    if (scoreId) {
      try {
        const raw = await persist.get(scoreId);
        if (raw) { const r = fromJSON(raw); s = r.store; }
      } catch (e) { /* sin anotaciones */ }
    }
    if (load !== scoreLoad) return;
    if (!store.count()) bind(s);
    prune(n);
    syncUi(); draw();
  }
  function prune(n) {
    nMeasures = n;
    const marks = store.marks(), keep = marks.filter((m) => m.measure < n);
    if (keep.length === marks.length) return 0;
    const dropped = new Set(marks.filter((m) => m.measure >= n).map((m) => m.groupId)).size;
    bind(createStore({ v: 1, marks: keep }));
    toast(`Se ${dropped === 1 ? "descartó 1 anotación" : `descartaron ${dropped} anotaciones`} de compases que ya no existen.`, 4600);
    flush(); syncUi(); draw();
    return dropped;
  }

  /* ---------- dibujo de las marcas ---------- */
  const el = (tag, at, parent) => { const e = document.createElementNS(SVGNS, tag); for (const k in at) e.setAttribute(k, at[k]); if (parent) parent.appendChild(e); return e; };
  const slotOf = (m) => (m.type === "hl" ? HL : PEN).indexOf(String(m.color || "").toLowerCase());
  const space = () => (layout && layout.measures[0] ? layout.measures[0].staffSpace : 8);
  function pathD(pts) { return pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(""); }
  function drawMark(m, lay) {
    const pts = project(m, lay); if (!pts || !pts.length) return;
    const b = lay.find((x) => x.measure === m.measure), ss = b ? b.staffSpace : 8;
    const g = el("g", { class: "an-mark", "data-id": m.id, "data-group": m.groupId, "data-measure": m.measure, "data-type": m.type });
    const slot = slotOf(m);
    if (m.type === "text") {
      const fs = Math.max(11, (m.size || 1.4) * ss * 1.15), lines = wrapText(m.text);
      const t = el("text", { class: "an-text", x: pts[0].x, y: pts[0].y, "font-size": fs.toFixed(1), "stroke-width": (fs * 0.28).toFixed(1) }, g);
      if (slot >= 0) t.setAttribute("class", `an-text an-c${slot}`); else t.setAttribute("fill", m.color || "#7b1fa2");
      lines.forEach((ln, i) => { const s = el("tspan", { x: pts[0].x, dy: i ? (fs * 1.15).toFixed(1) : 0 }, t); s.textContent = ln; });
      g.setAttribute("aria-label", `Nota en el compás ${m.measure + 1}: ${m.text}`);
    } else {
      const w = Math.max(m.type === "hl" ? 6 : 2.2, (m.w || (m.type === "hl" ? 1.2 : 0.18)) * ss);
      const d = pts.length === 1 ? pathD([pts[0], { x: pts[0].x + 0.1, y: pts[0].y }]) : pathD(pts);
      const p = el("path", { d, class: (m.type === "hl" ? "an-hl" : "an-pen") + (slot >= 0 ? ` an-${m.type === "hl" ? "h" : "c"}${slot}` : ""), "stroke-width": w.toFixed(1) }, g);
      if (slot < 0) { p.setAttribute("stroke", m.color || "#7b1fa2"); if (m.type === "hl") p.setAttribute("stroke-opacity", ".45"); }
    }
    svg.appendChild(g);
  }
  function draw() {
    if (!svg || !layout) return;
    svg.querySelectorAll(".an-mark,.an-pending").forEach((e) => e.remove());
    for (const m of store.marks()) drawMark(m, layout.measures);
    if (pending) {
      const pt = project({ measure: pending.measure, points: [{ x: pending.x, y: pending.y }] }, layout.measures);
      if (pt && pt[0]) el("circle", { class: "an-pending", cx: pt[0].x, cy: pt[0].y, r: Math.max(5, space() * 0.6) }, svg);
    }
    svg.classList.toggle("hidden-marks", getHidden() && !active);
    syncEye();
  }

  /* ---------- barra ---------- */
  function syncUi() {
    bar.querySelectorAll("[data-tool]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tool === tool)));
    bar.querySelectorAll("[data-stamp]").forEach((b) => b.setAttribute("aria-pressed", String(tool === "stamp" && b.dataset.stamp === stamp)));
    bar.querySelectorAll(".sw").forEach((b) => {
      const i = +b.dataset.color; b.setAttribute("aria-pressed", String(i === color));
      b.style.setProperty("--c", `var(--an-${tool === "hl" ? "h" : "c"}${i}, ${(tool === "hl" ? HL : PEN)[i]})`);
      b.setAttribute("aria-label", `Color ${(tool === "hl" ? HL_NAMES : COLOR_NAMES)[i]}`);
      b.disabled = tool === "eraser";
    });
    q('[data-act="undo"]').disabled = !store.canUndo(); q('[data-act="redo"]').disabled = !store.canRedo();
    q(".anno-text").hidden = !pending;
    q(".anno-text input").hidden = !pending?.editing;
    q('[data-act="text-ok"]').hidden = !pending?.editing;
    q('[data-act="text-open"]').hidden = !!pending?.editing;
    const mode = layout && layout.mode;
    q('[data-act="prev"]').textContent = mode === "page" ? "▴" : "‹"; q('[data-act="next"]').textContent = mode === "page" ? "▾" : "›";
    q(".anno-note").textContent = pending ? "Elegí una marca rápida o tocá «Escribir texto»." : tool === "stamp" ? `Tocá la partitura para colocar «${stamp}».` : tool === "text" ? "Tocá dónde querés poner la nota." : tool === "eraser" ? "Pasá el dedo por una marca para borrarla." : (hint || "Dibujá sobre la partitura. Para moverte, usá dos dedos o los botones de desplazamiento.");
    syncEye();
  }
  function syncEye() {
    const has = store.count() > 0, hid = getHidden();
    eye.hidden = !has || active;
    eye.setAttribute("aria-pressed", String(!hid));
    eye.setAttribute("aria-label", hid ? "Mostrar las anotaciones" : "Ocultar las anotaciones");
    eye.title = hid ? "Mostrar anotaciones" : "Ocultar anotaciones";
    eye.querySelector(".on").hidden = hid; eye.querySelector(".off").hidden = !hid;
  }
  eye.addEventListener("click", () => { setHidden(!getHidden()); draw(); });
  bar.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tool]"), c = e.target.closest(".sw"), a = e.target.closest("[data-act]");
    const preset = e.target.closest("[data-stamp]");
    if (preset) {
      stamp = preset.dataset.stamp;
      tool = "stamp";
      if (pending) commitText(stamp); else syncUi();
    } else if (t) { tool = t.dataset.tool; pending = null; syncUi(); draw(); }
    else if (c && !c.disabled) { color = +c.dataset.color; syncUi(); }
    else if (a) {
      const act = a.dataset.act;
      if (act === "undo") store.undo(); else if (act === "redo") store.redo();
      else if (act === "done") exit();
      else if (act === "prev" || act === "next") { const sgn = act === "next" ? 1 : -1; renderer.panBy(sgn * area.clientWidth * 0.6, sgn * area.clientHeight * 0.7); }
      else if (act === "text-open" && pending) {
        pending.editing = true; syncUi(); q(".anno-text input").focus({ preventScroll: true });
      } else if (act === "text-ok") commitText();
      else if (act === "text-no") { pending = null; syncUi(); draw(); }
    }
  });
  q(".anno-text input").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); commitText(); } if (e.key === "Escape") { e.stopPropagation(); pending = null; syncUi(); draw(); } });
  function commitText(value = q(".anno-text input").value) {
    const v = value.replace(/\s+/g, " ").trim().slice(0, TEXT_MAX);
    if (!pending) return;
    if (!v) { toast("Escribí la nota primero."); return; }
    const r = store.add({ type: "text", measure: pending.measure, staff: pending.staff, points: [{ x: pending.x, y: pending.y }], text: v.slice(0, MAX_TEXT), color: PEN[color] });
    if (!r.ok) toast(r.error || "No se pudo agregar la nota.");
    pending = null; q(".anno-text input").value = ""; syncUi(); draw();
  }

  /* ---------- gestos sobre la partitura ---------- */
  const local = (ev) => { const r = svg.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; };
  const strokeW = (tl) => Math.max(tl === "hl" ? 6 : 2.2, (tl === "hl" ? 1.2 : 0.18) * space());
  function previewStroke() {
    if (!stroke) return;
    if (!stroke.el) { stroke.el = el("path", { class: stroke.tool === "hl" ? "an-hl" : "an-pen", fill: "none" }, svg); stroke.el.classList.add(`an-${stroke.tool === "hl" ? "h" : "c"}${color}`); }
    stroke.el.setAttribute("d", pathD(stroke.pts)); stroke.el.setAttribute("stroke-width", (strokeW(stroke.tool) * (stroke.press || 1)).toFixed(1));
  }
  function cancelStroke() { if (stroke && stroke.el) stroke.el.remove(); stroke = null; }
  function eraseAtPoint(p) {
    const a = pointToAnchor(p, layout.measures); if (!a) return;
    const r = store.eraseAt(a, Math.max(0.7, 14 / space()));
    if (r.removed.length) { try { navigator.vibrate && navigator.vibrate(8); } catch (e) { /* sin vibración */ } }
  }
  function onDown(ev) {
    if (!active || !svg) return;
    if (ev.pointerType === "mouse" && ev.button !== 0) return;
    ev.preventDefault();
    const now = performance.now();
    if (ev.pointerType === "pen") { penSeenAt = now; for (const [id, p] of ptrs) if (p.type === "touch") { ptrs.delete(id); } cancelStroke(); pan = null; }
    else if (ev.pointerType === "touch" && now - penSeenAt < 5000) return;   // rechazo de palma: con lápiz activo se ignoran los dedos
    ptrs.set(ev.pointerId, { type: ev.pointerType, x: ev.clientX, y: ev.clientY });
    try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* nada */ }
    const touches = [...ptrs.values()].filter((p) => p.type === "touch");
    if (touches.length >= 2) { cancelStroke(); pan = { x: (touches[0].x + touches[1].x) / 2, y: (touches[0].y + touches[1].y) / 2 }; return; }
    if (pan) return;
    const p = local(ev);
    if (tool === "eraser") { stroke = { tool, id: ev.pointerId }; eraseAtPoint(p); return; }
    stroke = { tool, id: ev.pointerId, pts: [p], moved: 0, start: p, press: 0, n: 0 };
    if (tool === "pen" || tool === "hl") previewStroke();
  }
  function onMove(ev) {
    if (!active || !ptrs.has(ev.pointerId)) return;
    ev.preventDefault();
    const rec = ptrs.get(ev.pointerId); rec.x = ev.clientX; rec.y = ev.clientY;
    if (pan) {
      const t = [...ptrs.values()].filter((x) => x.type === "touch");
      if (t.length >= 2) {
        const cx = (t[0].x + t[1].x) / 2, cy = (t[0].y + t[1].y) / 2;
        renderer.panBy(pan.x - cx, pan.y - cy, true); pan = { x: cx, y: cy };
      }
      return;
    }
    if (!stroke || stroke.id !== ev.pointerId) return;
    const evs = ev.getCoalescedEvents ? ev.getCoalescedEvents() : [];
    for (const e of (evs.length ? evs : [ev])) {
      const p = local(e);
      if (stroke.tool === "eraser") { eraseAtPoint(p); continue; }
      const last = stroke.pts[stroke.pts.length - 1];
      if (Math.hypot(p.x - last.x, p.y - last.y) < 1.2) continue;
      stroke.pts.push(p);
      if (e.pointerType === "pen" && e.pressure > 0) { stroke.press = (stroke.press * stroke.n + 0.6 + 0.8 * e.pressure) / (stroke.n + 1); stroke.n++; }
    }
    if (stroke.tool === "eraser") return;
    if (stroke.tool === "pen" || stroke.tool === "hl") previewStroke();
    else if (Math.hypot(stroke.pts[stroke.pts.length - 1].x - stroke.start.x, stroke.pts[stroke.pts.length - 1].y - stroke.start.y) > 8) stroke.moved = 1;
  }
  function onUp(ev) {
    const had = ptrs.delete(ev.pointerId);
    try { svg && svg.releasePointerCapture(ev.pointerId); } catch (e) { /* nada */ }
    if (pan) { if ([...ptrs.values()].filter((x) => x.type === "touch").length < 2) { pan = null; if (!ptrs.size) cancelStroke(); } return; }
    if (!had || !stroke || stroke.id !== ev.pointerId || ev.type === "pointercancel") { if (stroke && stroke.id === ev.pointerId) cancelStroke(); return; }
    const s = stroke; stroke = null;
    if (s.tool === "eraser") return;
    if (s.el) s.el.remove();
    if (s.tool === "text" || s.tool === "stamp") {
      if (s.moved) return;
      const a = pointToAnchor(s.start, layout.measures); if (!a) return;
      pending = { measure: a.measure, x: a.x, y: a.y, staff: a.staff };
      q(".anno-text input").value = "";
      if (s.tool === "stamp") commitText(stamp); else { syncUi(); draw(); }
      return;
    }
    let pts = s.pts;
    if (pts.length === 1) pts = [pts[0], { x: pts[0].x + 0.5, y: pts[0].y }];
    const w = s.tool === "pen" && s.press ? 0.18 * s.press : undefined;
    const marks = splitStrokeByMeasure(pts, layout.measures, { type: s.tool, color: (s.tool === "hl" ? HL : PEN)[color], ...(w ? { w } : {}) });
    if (!marks.length) return;
    const r = store.add(marks);
    if (!r.ok) toast(r.error || "No se pudo guardar la marca.");
  }

  /* ---------- enlace con el renderizador ---------- */
  renderer.onDraw(({ svg: s, layout: l }) => {
    svg = s; layout = l; cancelStroke(); ptrs.clear(); pan = null;
    svg.addEventListener("pointerdown", onDown);
    svg.addEventListener("pointermove", onMove);
    svg.addEventListener("pointerup", onUp);
    svg.addEventListener("pointercancel", onUp);
    svg.addEventListener("contextmenu", (e) => e.preventDefault());
    syncUi(); draw();
  });

  function enter() {
    if (active) return;
    active = true; if (getHidden()) setHidden(false);
    bar.hidden = false; renderer.setAnnotating(true); syncUi(); draw(); onActive(true);
  }
  function exit(silent) {
    if (!active) return;
    active = false; pending = null; cancelStroke(); ptrs.clear(); pan = null;
    bar.hidden = true; renderer.setAnnotating(false); flush(); syncUi(); draw(); if (!silent) onActive(false); else onActive(false, true);
  }
  return { setScore, prune, enter, exit, isActive: () => active, refresh: draw, count: () => store.count(), get store() { return store; }, flush };
}
