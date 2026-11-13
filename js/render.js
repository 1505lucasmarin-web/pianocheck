// Dibujo de la partitura con VexFlow (global `VexFlow`, vendor/vexflow/vexflow-bravura.js).
// API: createRenderer(container, {mode}) → { draw, setCursor, follow, markStep(i, "clean"|"dirty"|"early"|"late"), setTag, onNoteTap, onBadgeTap, clearMarks, setSelected,
//   setPhrases, setRange, setBadges, setFocusMeasure, scrollToMeasure, setLook, redraw, destroy }
// Dos vistas: "page" (sistemas apilados, con scroll vertical) y "cont" (toda la pieza en una sola fila que se desplaza).
// Los colores salen de variables CSS por tema (data-sheet="hoja|sepia|oscuro" en el contenedor): cambiar de tema no redibuja.
import { phraseCaption, baseLetter } from "./phrases.js";
import { midiToKey } from "./model.js";
const VF = () => window.VexFlow;

// Un color por letra de frase para la interfaz oscura (leyenda). En la partitura se usan --ph0..--ph7 según el tema.
export const PHRASE_COLORS = ["#e9b44c", "#6fc2b0", "#e58aa0", "#a99be8", "#78b4ec", "#b9cc6a", "#f09a5b", "#d6d0c0"];
export const phraseIdx = (label) => Math.max(0, baseLetter(label).charCodeAt(0) - 65) % PHRASE_COLORS.length;
export const phraseColor = (label) => PHRASE_COLORS[phraseIdx(label)];
const SVGNS = "http://www.w3.org/2000/svg";

export const SIZES = ["chico", "mediano", "grande"];
export const THEMES = ["hoja", "sepia", "oscuro"];
const PAGE_SIZE_F = { chico: 0.82, mediano: 1, grande: 1.25 };   // factor sobre la escala de la vista por página
const CONT_SIZE_F = { chico: 0.65, mediano: 0.85, grande: 1 };   // fracción del alto que ocupa el gran pentagrama
const SNAP = 20, SEG_NAT = 1700, SCALE_STEP = 0.05;              // tramos: ancho múltiplo de 20 y escala múltiplo de 0,05 → sin costuras
const H0 = 330, FLAG_Y = 240, NUM_Y = 48, TOP_Y = 18, BOT_Y = 128, X0 = 22;
const SPACE = 10, STAFF_TOP = TOP_Y + 4 * SPACE, STAFF_BOT = BOT_Y + 8 * SPACE;   // primera línea del gran pentagrama y última línea del bajo (unidades del SVG)
const SYS_SPACES = (STAFF_BOT - STAFF_TOP) / SPACE, LH_TOP_SP = (BOT_Y + 4 * SPACE - STAFF_TOP) / SPACE;   // alto del gran pentagrama y línea superior del bajo, en espacios
const LBL_H = 26;   // alto reservado arriba en la vista continua para la etiqueta fija «Compás N»

const LETTER = { c: 0, d: 1, e: 2, f: 3, g: 4, a: 5, b: 6 };
function diatonic(key) {
  const m = /^([a-g])([#b]*)\/(-?\d+)/i.exec(String(key));
  if (!m) return 0;
  const acc = m[2].split("").reduce((a, ch) => a + (ch === "#" ? 1 : -1), 0);
  return parseInt(m[3], 10) * 7 + LETTER[m[1].toLowerCase()] + acc * 0.01;
}
const KEY_ACC = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F#": 6, "C#": 7, F: 1, Bb: 2, Eb: 3, Ab: 4, Db: 5, Gb: 6, Cb: 7,
  Am: 0, Em: 1, Bm: 2, "F#m": 3, "C#m": 4, "G#m": 5, "D#m": 6, "A#m": 7, Dm: 1, Gm: 2, Cm: 3, Fm: 4, Bbm: 5, Ebm: 6, Abm: 7 };

const DUR_W = { w: 84, h: 58, q: 40, "8": 32, "16": 28, "32": 26 };
function eventWidth(e) {
  let w = DUR_W[e.d] || 40;
  if (e.dots) w += 9 * e.dots;
  if (e.k && e.k.some((k) => /[#b]/.test(String(k).split("/")[0].slice(1)))) w += 12;
  if (e.k && e.k.length > 1) w += 4;
  return w;
}
function handWidth(evs) { return (evs || []).reduce((a, e) => a + eventWidth(e), 0); }
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const reduceMotion = () => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };

export function createRenderer(container, opts = {}) {
  container.classList.add("score-view");
  const root = document.createElement("div");
  root.className = "score-root";
  container.appendChild(root);

  let mode = opts.mode === "page" ? "page" : "cont";
  const lockMode = !!opts.lockMode;
  let theme = "hoja", size = "mediano";
  container.dataset.sheet = theme;

  let score = null, steps = [], systems = [], noteIndex = new Map(), stepEls = [];
  let phrases = [];
  let range = null;        // pasaje resaltado/acotado { from, to } (base 0) o null
  let marks = [], cursor = -1, tapCb = null, selected = null;
  let badges = [], badgeCb = null, focusMeasure = null, tagEl = null, tagTimer = 0;
  let lastWidth = 0, lastHeight = 0, resizeTimer = 0, cursorRect = null, selMark = null;
  const flagEls = new Map();
  let flagY = FLAG_Y;
  // vista continua
  let cs = null;           // { view, track, cursorEl, clefs, scale, total, viewW, Dw, stepPos, gx, ... }
  let look = null;         // desplazamiento libre (arrastre / frase elegida) en px; null = seguir al cursor
  let curOffset = 0, drag = null, inertia = 0;
  let activeM = null;      // compás que se está evaluando (el del cursor)
  const errs = new Map();  // paso → { kind: "wrong"|"omit", played, expected[], text, resolved }
  let errCb = null;
  let annotating = false, drawCb = null, annoSvg = null, curLayout = null;

  const nk = (m, h, i) => m + "|" + h + "|" + i;

  /* ---------------------------- dibujo común ---------------------------- */
  function makeNotes(events, clef, restKey, key2orig) {
    const V = VF();
    const notes = [];
    for (const e of events) {
      const dots = Math.min(2, e.dots || 0);
      let n;
      if (!e.k || !e.k.length) {
        n = new V.StaveNote({ keys: [restKey], duration: e.d + "r", clef });
        key2orig.push([]);
      } else {
        const order = e.k.map((k, i) => i).sort((a, b) => diatonic(e.k[a]) - diatonic(e.k[b]));
        n = new V.StaveNote({ keys: order.map((i) => e.k[i]), duration: e.d, clef, autoStem: true });
        key2orig.push(order);
      }
      for (let d = 0; d < dots; d++) V.Dot.buildAndAttach([n], { all: true });
      notes.push(n);
    }
    return notes;
  }

  /** Crea un SVG de VexFlow dentro de `el` con tinta = color actual del tema (currentColor). */
  function makeSvg(el, w, h) {
    const V = VF();
    const renderer = new V.Renderer(el, V.Renderer.Backends.SVG);
    renderer.resize(w, h);
    const ctx = renderer.getContext();
    ctx.setFillStyle("currentColor"); ctx.setStrokeStyle("currentColor");
    const svg = el.querySelector("svg");
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    svg.style.display = "block"; svg.style.overflow = "visible";
    return { ctx, svg };
  }

  /** Dibuja un compás (dos pentagramas + notas). o = { sysIdx, header, time, num, u, entries }. */
  function drawMeasure(ctx, svg, sc, mi, x, w, o) {
    const V = VF();
    const ts = sc.timeSig || [4, 4];
    const m = sc.measures[mi];
    const key2 = { rh: [], lh: [] };
    let top, bot;
    try {
      top = new V.Stave(x, TOP_Y, w);
      bot = new V.Stave(x, BOT_Y, w);
      if (o.header) {
        top.addClef("treble"); bot.addClef("bass");
        try { top.addKeySignature(sc.keySig || "C"); bot.addKeySignature(sc.keySig || "C"); } catch (e) { /* armadura inválida */ }
        if (o.time) { top.addTimeSignature(`${ts[0]}/${ts[1]}`); bot.addTimeSignature(`${ts[0]}/${ts[1]}`); }
      }
      if (mi === sc.measures.length - 1) { top.setEndBarType(V.Barline.type.END); bot.setEndBarType(V.Barline.type.END); }
      top.setContext(ctx).draw(); bot.setContext(ctx).draw();
      if (o.header) {
        new V.StaveConnector(top, bot).setType("brace").setContext(ctx).draw();
        new V.StaveConnector(top, bot).setType("singleLeft").setContext(ctx).draw();
      }
      new V.StaveConnector(top, bot).setType(mi === sc.measures.length - 1 ? "boldDoubleRight" : "singleRight").setContext(ctx).draw();
    } catch (err) {
      console.warn("compás", mi + 1, "no se pudo dibujar el pentagrama", err);
      return null;
    }
    if (o.pickup || o.num) {
      // primer compás con anacrusa: la etiqueta «Anacrusa» reemplaza al número; si no, el número del compás
      const t = document.createElementNS(SVGNS, "text");
      t.setAttribute("class", o.pickup ? "mnum mpick" : "mnum"); t.setAttribute("y", NUM_Y);
      if (o.pickup) { t.setAttribute("x", x + w / 2); t.setAttribute("text-anchor", "middle"); } else t.setAttribute("x", x + 10);
      t.setAttribute("font-size", 10 * o.u); t.textContent = o.pickup ? "Anacrusa" : String(mi + 1);
      svg.appendChild(t);
    }
    try {
      const rhN = makeNotes(m.rh || [], "treble", "b/4", key2.rh);
      const lhN = makeNotes(m.lh || [], "bass", "d/3", key2.lh);
      const voices = [];
      const mk = (notes, restKey, clef, stave) => {
        let ns = notes;
        if (!ns.length) { ns = [new V.StaveNote({ keys: [restKey], duration: "wr", clef, align_center: true })]; }
        ns.forEach((n) => n.setStave(stave));
        const v = new V.Voice({ numBeats: ts[0], beatValue: ts[1] }).setMode(V.Voice.Mode.SOFT);
        v.addTickables(ns);
        voices.push(v);
        return ns;
      };
      mk(rhN, "d/5", "treble", top);
      mk(lhN, "f/3", "bass", bot);
      try { V.Accidental.applyAccidentals(voices, sc.keySig || "C"); } catch (e) { V.Accidental.applyAccidentals(voices, "C"); }
      new V.Formatter().joinVoices([voices[0]]).joinVoices([voices[1]]).formatToStave(voices, top);
      const beams = [];
      if (rhN.length) beams.push(...V.Beam.generateBeams(rhN));
      if (lhN.length) beams.push(...V.Beam.generateBeams(lhN));
      voices[0].draw(ctx, top); voices[1].draw(ctx, bot);
      if (o.ext) [["rh", rhN], ["lh", lhN]].forEach(([hand, ns]) => ns.forEach((n, idx) => {   // extensión vertical real (líneas adicionales, plicas, corchetes, digitaciones)
        try {
          const ys = n.getYs(); let lo = Math.min(...ys), hi = Math.max(...ys);
          if (n.hasStem && n.hasStem()) { const se = n.getStemExtents(); lo = Math.min(lo, se.topY, se.baseY); hi = Math.max(hi, se.topY, se.baseY); }
          o.ext.min = Math.min(o.ext.min, lo); o.ext.max = Math.max(o.ext.max, hi);
          const ev = (m[hand] || [])[idx];
          if (ev && ev.f && ev.k && ev.k.length) { if (hand === "rh") o.ext.min = Math.min(o.ext.min, lo - 14 - 12 * (ev.f.filter(Boolean).length - 1)); else o.ext.max = Math.max(o.ext.max, hi + 20 + 12 * (ev.f.filter(Boolean).length - 1)); }
        } catch (e) { /* sin extensión */ }
      }));
      beams.forEach((b) => b.setContext(ctx).draw());
      [["rh", rhN], ["lh", lhN]].forEach(([hand, ns]) => {
        (m[hand] || []).forEach((e, idx) => {
          if (!e.tie || !e.k || !e.k.length || idx === 0) return;
          try {
            const prev = ns[idx - 1];
            if (prev && !prev.isRest()) new V.StaveTie({ first_note: prev, last_note: ns[idx], first_indices: prev.getKeys().map((_, i) => i), last_indices: ns[idx].getKeys().map((_, i) => i) }).setContext(ctx).draw();
          } catch (err) { /* sin ligadura */ }
        });
      });
      [["rh", rhN, key2.rh], ["lh", lhN, key2.lh]].forEach(([hand, ns, k2]) => {
        ns.forEach((n, idx) => {
          const ev = (m[hand] || [])[idx];
          if (!ev) return;
          const g = n.getSVGElement ? n.getSVGElement() : null;
          const info = { measure: mi, hand, idx, note: n, el: g, k2: k2[idx], sys: o.sysIdx, rest: !ev.k || !ev.k.length };
          noteIndex.set(nk(mi, hand, idx), info);
          o.entries.push(info);
        });
      });
    } catch (err) {
      console.warn("compás", mi + 1, "inválido:", err);
      try {
        const t = svg.ownerDocument.createElementNS(SVGNS, "text");
        t.setAttribute("x", top.getX() + top.getWidth() / 2); t.setAttribute("y", top.getYForLine(2) + 4);
        t.setAttribute("text-anchor", "middle"); t.setAttribute("class", "bad-measure"); t.textContent = "compás ilegible";
        svg.appendChild(t);
      } catch (e2) { /* nada */ }
    }
    return { top, bot };
  }

  /* ---------------------------- vista por página ---------------------------- */
  function layoutSystems(sc, W) {
    const nAcc = KEY_ACC[sc.keySig] ?? 0;
    const widths = sc.measures.map((m) => 36 + Math.max(handWidth(m.rh), handWidth(m.lh), 60));
    const out = []; let cur = null;
    widths.forEach((w, i) => {
      const extra = 46 + nAcc * 10 + (out.length === 0 && !cur ? 30 : 0);
      if (!cur) { cur = { from: i, to: i, w: w + extra + (i === 0 ? 30 : 0), items: [i] }; return; }
      if (cur.w + w <= W - 24) { cur.items.push(i); cur.to = i; cur.w += w; }
      else { out.push(cur); cur = { from: i, to: i, w: w + extra, items: [i] }; }
    });
    if (cur) out.push(cur);
    return { out, widths, nAcc };
  }

  function drawSystem(sys, si, W, scale, sc, meta) {
    const el = document.createElement("div");
    el.className = "system";
    el.dataset.sys = si;
    root.appendChild(el);
    const effW = W / scale;
    const H = 276;
    const { ctx, svg } = makeSvg(el, effW, H);
    svg.setAttribute("width", W); svg.setAttribute("height", H * scale);
    svg.style.width = W + "px"; svg.style.height = (H * scale) + "px";

    const total = sys.items.reduce((a, i) => a + meta.widths[i], 0);
    const first = sys.items[0];
    const decor = 46 + meta.nAcc * 10 + (first === 0 ? 30 : 0);
    const avail = effW - 16;
    let stretch = (avail - decor) / total;
    if (si === meta.count - 1) stretch = Math.min(stretch, 1.25);
    stretch = Math.max(stretch, 0.8);
    const entries = [];
    let x = 8;
    const mx = {};
    sys.items.forEach((mi, pos) => {
      const isFirst = pos === 0;
      let w = meta.widths[mi] * stretch + (isFirst ? decor : 0);
      if (x + w > effW - 6) w = effW - 6 - x;
      mx[mi] = { x, w };
      drawMeasure(ctx, svg, sc, mi, x, w, { sysIdx: si, header: isFirst, time: isFirst && first === 0, num: isFirst && mi > 0, pickup: mi === 0 && sc.pickupBeats > 0, u: 1 / scale, entries });
      x += w;
    });
    systems[si] = { el, svg, ctx, entries, H, mx, from: sys.from, to: sys.to, scale, u: 1 / scale, x0: 0, bracketY: 20 / scale };
  }

  function drawPage(sc) {
    const W = Math.floor(container.clientWidth - 22);
    if (W < 120) { lastWidth = 0; return; }
    const base = W < 560 ? Math.max(0.62, W / 560) : 1;
    const scale = base * PAGE_SIZE_F[size];
    const lay = layoutSystems(sc, W / scale);
    lay.count = lay.out.length;
    lay.out.forEach((sys, si) => {
      try { drawSystem(sys, si, W, scale, sc, lay); }
      catch (err) { console.error("sistema", si, err); }
    });
  }

  /* ---------------------------- vista continua ---------------------------- */
  function drawCont(sc) {
    const V = VF();
    const viewW = container.clientWidth, viewH = container.clientHeight;
    if (viewW < 120 || viewH < 80) { lastWidth = 0; return; }
    const nAcc = KEY_ACC[sc.keySig] ?? 0;
    const decor = 46 + nAcc * 10 + 30;
    const widths = sc.measures.map((m) => Math.round(36 + Math.max(handWidth(m.rh), handWidth(m.lh), 60)));
    // posiciones globales (en unidades naturales); cada tramo termina en múltiplo de SNAP
    const gx = [], gw = [], segsDef = [];
    let x = X0, cur = null;
    const closeSeg = (padLast) => {
      if (!cur) return;
      const pad = (SNAP - (x % SNAP)) % SNAP;
      if (padLast) { gw[cur.to] += pad; x += pad; }
      cur.end = padLast ? x : Math.ceil((x + 10) / SNAP) * SNAP;
      segsDef.push(cur);
    };
    widths.forEach((w0, i) => {
      const w = w0 + (i === 0 ? decor : 0);
      if (!cur || (x - cur.x0 + w > SEG_NAT && cur.items.length)) {
        closeSeg(true);
        cur = { x0: cur ? x : 0, from: i, to: i, items: [] };
      }
      gx[i] = x; gw[i] = w; x += w; cur.items.push(i); cur.to = i;
    });
    closeSeg(false);
    const total = segsDef.length ? segsDef[segsDef.length - 1].end : 0;

    root.className = "score-root cs-root";
    const view = document.createElement("div"); view.className = "cs-view";
    const cursorEl = document.createElement("div"); cursorEl.className = "cs-cursor"; cursorEl.hidden = true;
    const track = document.createElement("div"); track.className = "cs-track";
    const clefs = document.createElement("div"); clefs.className = "cs-clefs";
    view.append(cursorEl, track, clefs);
    root.appendChild(view);

    const ext = { min: Infinity, max: -Infinity };
    segsDef.forEach((sd, si) => {
      const el = document.createElement("div");
      el.className = "system cs-seg"; el.dataset.sys = si;
      track.appendChild(el);
      const sw = sd.end - sd.x0;
      const { ctx, svg } = makeSvg(el, sw, H0);
      const entries = [], mx = {};
      try {
        sd.items.forEach((mi) => {
          mx[mi] = { x: gx[mi] - sd.x0, w: gw[mi] };
          drawMeasure(ctx, svg, sc, mi, gx[mi] - sd.x0, gw[mi], { sysIdx: si, header: mi === 0, time: mi === 0, num: true, pickup: mi === 0 && sc.pickupBeats > 0, u: 1, entries, ext });
        });
      } catch (err) { console.error("tramo", si, err); }
      systems[si] = { el, svg, ctx, entries, H: H0, mx, from: sd.from, to: sd.to, sw, x0: sd.x0 };
    });

    // alto real del contenido (líneas adicionales, plicas) para escalar sin recortar
    let cmin = Math.min(TOP_Y + 40 - 8, NUM_Y - 12, ext.min - 7), cmax = Math.max(BOT_Y + 80 + 8, ext.max + 7);
    if (badges.length) cmin = Math.min(cmin, 12);   // lugar para los íconos de comentario / aviso sobre el compás
    flagY = cmax + 8; cmax = flagY + 8;
    const R0 = cmax - cmin;
    const hasPh = phrases.length > 0;
    const PH = hasPh ? 28 : 0;                       // px reservados arriba para corchetes y letras
    const availH = viewH - 14 - PH - LBL_H;
    let scale = (availH / R0) * CONT_SIZE_F[size];
    // tope por ancho: en pantallas angostas y altas (celular vertical) tienen que verse ~2 compases
    scale = Math.min(scale, viewW / ({ chico: 640, mediano: 500, grande: 400 })[size]);
    scale = clamp(Math.floor(Math.min(scale, 2.2) / SCALE_STEP) * SCALE_STEP, 0.3, 2.2);
    const u = 1 / scale;
    const y0 = cmin - PH * u, Rn = R0 + PH * u;
    const svgH = Rn * scale;
    systems.forEach((s) => s.svg.querySelectorAll(".mnum").forEach((t) => t.setAttribute("font-size", 11 * u)));
    const topPx = LBL_H + Math.max(0, Math.round((viewH - LBL_H - svgH) / 2));
    track.style.top = topPx + "px"; track.style.width = (total * scale) + "px";
    systems.forEach((s) => {
      s.scale = scale; s.u = u; s.bracketY = cmin - 6 * u;
      s.svg.setAttribute("viewBox", `0 ${y0} ${s.sw} ${Rn}`);
      s.svg.setAttribute("width", s.sw * scale); s.svg.setAttribute("height", svgH);
      s.svg.style.width = (s.sw * scale) + "px"; s.svg.style.height = svgH + "px";
      s.el.style.width = (s.sw * scale) + "px";
    });

    // bloque fijo de claves (clave de sol y de fa + armadura + compás)
    let Dw = 60;
    try {
      const first = noteIndex.get(nk(0, "rh", 0)) || noteIndex.get(nk(0, "lh", 0));
      Dw = first ? Math.ceil(first.note.getStave().getNoteStartX()) : decor + 8;
    } catch (e) { Dw = decor + 8; }
    try {
      const ow = Dw + 2;
      const { ctx, svg } = makeSvg(clefs, ow, H0);
      svg.setAttribute("viewBox", `0 ${y0} ${ow} ${Rn}`);
      svg.setAttribute("width", ow * scale); svg.setAttribute("height", svgH);
      svg.style.width = (ow * scale) + "px"; svg.style.height = svgH + "px";
      const ts = sc.timeSig || [4, 4];
      const top = new V.Stave(X0, TOP_Y, Dw - X0), bot = new V.Stave(X0, BOT_Y, Dw - X0);
      top.addClef("treble"); bot.addClef("bass");
      try { top.addKeySignature(sc.keySig || "C"); bot.addKeySignature(sc.keySig || "C"); } catch (e) { /* armadura inválida */ }
      top.addTimeSignature(`${ts[0]}/${ts[1]}`); bot.addTimeSignature(`${ts[0]}/${ts[1]}`);
      top.setEndBarType(V.Barline.type.NONE); bot.setEndBarType(V.Barline.type.NONE);
      top.setContext(ctx).draw(); bot.setContext(ctx).draw();
      new V.StaveConnector(top, bot).setType("brace").setContext(ctx).draw();
      new V.StaveConnector(top, bot).setType("singleLeft").setContext(ctx).draw();
    } catch (err) { console.warn("bloque de claves", err); }
    const csvg = clefs.querySelector("svg"); if (csvg) csvg.style.top = topPx + "px";
    clefs.style.height = viewH + "px"; clefs.style.width = (Dw * scale) + "px";
    clefs.style.setProperty("--fade", Math.round(14 * scale) + "px");

    const bandTop = topPx + PH, bandH = (cmax - cmin) * scale + 4;
    cursorEl.style.top = (bandTop - 2) + "px"; cursorEl.style.height = bandH + "px";
    const mlabel = document.createElement("div"); mlabel.className = "cs-mlabel"; mlabel.hidden = true; mlabel.setAttribute("aria-hidden", "true");
    const back = document.createElement("button"); back.type = "button"; back.className = "cs-back"; back.hidden = true;
    back.addEventListener("click", (e) => { e.stopPropagation(); follow(); });
    back.addEventListener("pointerdown", (e) => e.stopPropagation());
    view.append(mlabel, back);
    cs = { view, track, cursorEl, clefs, mlabel, back, y0, svgH, scale, total, viewW, viewH, Dw, gx, gw, stepPos: [], PH, topPx };
    curOffset = 0; look = null;
  }

  /* ---------------------------- dibujo general ---------------------------- */
  function draw(sc, st) {
    score = sc; steps = st || [];
    systems = []; noteIndex = new Map(); stepEls = [];
    cursorRect = null; selMark = null; cs = null; activeM = null; flagEls.clear(); flagY = FLAG_Y; tagEl = null; clearTimeout(tagTimer);
    cancelAnimationFrame(inertia); drag = null;
    if (annoSvg) { annoSvg.remove(); annoSvg = null; }
    clearHolds();
    root.innerHTML = ""; root.className = "score-root";
    container.classList.toggle("cont", mode === "cont");
    if (!sc || !VF()) return;
    if (container.clientWidth < 120) { lastWidth = 0; return; }
    if (mode === "cont") drawCont(sc); else drawPage(sc);
    if (!systems.length) return;
    lastWidth = container.clientWidth; lastHeight = container.clientHeight;
    stepEls = steps.map((s) => (s.refs || []).map((r) => noteIndex.get(nk(r.measure, r.hand, r.idx))).filter(Boolean));
    if (cs) computeStepPos();
    marks.forEach((mk, i) => mk && applyMark(i, mk));
    drawPhrases();
    drawRange();
    drawFingers(); drawBadges(); drawFocus(); drawErrors();
    if (cursor >= 0) applyCursor(cursor, false);
    if (selected) setSelected(selected);
    buildOverlay();
  }

  function computeStepPos() {
    cs.stepPos = stepEls.map((infos) => {
      if (!infos || !infos.length) return null;
      const xs = infos.map((n) => { try { return n.note.getAbsoluteX() + systems[n.sys].x0; } catch (e) { return NaN; } }).filter(Number.isFinite);
      if (!xs.length) return null;
      const l = Math.min(...xs) - 12, r = Math.max(...xs) + 22;
      return { c: (l + r) / 2, w: r - l };
    });
  }

  /* ---------------------------- capa de anotaciones y layout de compases ---------------------------- */
  /** Cajas de los compases de la vista actual, en px del lienzo que se desplaza con la partitura (página: contenido del contenedor; continua: la pista).
   *  → { mode, space (px por espacio de pentagrama), width, height, measures: [{ measure, x, y, w, staffSpace, systemHeight, lhTop }] } (forma que espera js/annotations.js: y = línea superior del gran pentagrama). */
  function buildLayout() {
    const out = [];
    if (cs) {
      const sc = cs.scale;
      for (let mi = 0; mi < (score ? score.measures.length : 0); mi++) {
        if (cs.gx[mi] == null) continue;
        out.push({ measure: mi, x: cs.gx[mi] * sc, y: (STAFF_TOP - cs.y0) * sc, w: cs.gw[mi] * sc, staffSpace: SPACE * sc, systemHeight: SYS_SPACES, lhTop: LH_TOP_SP });
      }
      return { mode: "cont", space: SPACE * sc, width: cs.total * sc, height: cs.svgH, measures: out };
    }
    systems.forEach((s) => {
      if (!s) return;
      const sc = s.scale || 1;
      for (let mi = s.from; mi <= s.to; mi++) {
        const m = s.mx[mi]; if (!m) continue;
        out.push({ measure: mi, x: s.el.offsetLeft + m.x * sc, y: s.el.offsetTop + STAFF_TOP * sc, w: m.w * sc, staffSpace: SPACE * sc, systemHeight: SYS_SPACES, lhTop: LH_TOP_SP });
      }
    });
    const first = systems.find(Boolean);
    return { mode: "page", space: SPACE * ((first && first.scale) || 1), width: container.clientWidth, height: Math.max(container.scrollHeight, container.clientHeight), measures: out };
  }
  /** SVG vacío para las marcas: en continua dentro de la pista (se desplaza con ella), en página dentro del contenedor (scrollea con la hoja). */
  function buildOverlay() {
    annoSvg = null; curLayout = null;
    if (!systems.length) return;
    curLayout = buildLayout();
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "anno-svg" + (annotating ? " on" : ""));
    svg.setAttribute("width", curLayout.width); svg.setAttribute("height", curLayout.height);
    svg.setAttribute("viewBox", `0 0 ${curLayout.width} ${curLayout.height}`);
    svg.style.width = curLayout.width + "px"; svg.style.height = curLayout.height + "px";
    (cs ? cs.track : container).appendChild(svg);
    annoSvg = svg;
    if (drawCb) drawCb({ svg, layout: curLayout });
  }
  /** Modo Anotar: los gestos sobre la partitura dibujan; arrastrar/tocar notas queda desactivado. */
  function setAnnotating(on) {
    annotating = !!on;
    container.classList.toggle("annotating", annotating);
    if (annoSvg) annoSvg.classList.toggle("on", annotating);
    if (annotating) { cancelAnimationFrame(inertia); drag = null; if (cs) cs.view.classList.remove("cs-dragging"); }
  }
  /** Desplaza la partitura (modo Anotar): continua → dx px; página → dy px. */
  function panBy(dx, dy, live) {
    if (cs) lookAt((look != null ? look : curOffset) + dx, !live);
    else container.scrollBy({ top: dy, behavior: live || reduceMotion() ? "auto" : "smooth" });
  }
  const scrollPos = () => (cs ? { x: look != null ? look : curOffset } : { y: container.scrollTop });

  /* ---------------------------- frases ---------------------------- */
  function drawPhrases() {
    systems.forEach((s) => s && s.svg.querySelectorAll(".phrase-mark").forEach((e) => e.remove()));
    if (!phrases.length) return;
    const isCont = mode === "cont";
    systems.forEach((s) => {
      if (!s) return;
      const u = s.u || 1 / (s.scale || 1);
      phrases.forEach((p) => {
        const a = Math.max(p.startMeasure, s.from), b = Math.min(p.endMeasure, s.to);
        if (a > b || !s.mx[a] || !s.mx[b]) return;
        const x1 = s.mx[a].x + 3, x2 = s.mx[b].x + s.mx[b].w - 3;
        const cont = p.startMeasure < s.from, more = p.endMeasure > s.to;
        const idx = phraseIdx(p.label);
        const col = `var(--ph${idx})`;
        const g = document.createElementNS(SVGNS, "g");
        g.setAttribute("class", "phrase-mark"); g.setAttribute("data-phrase", p.id);
        const yb = s.bracketY, th = 3 * u;
        const el = (tag, at, st) => { const e = document.createElementNS(SVGNS, tag); for (const k in at) e.setAttribute(k, at[k]); if (st) Object.assign(e.style, st); g.appendChild(e); return e; };
        const fillS = { fill: col, stroke: "none" };
        el("rect", { x: x1, y: yb, width: Math.max(2, x2 - x1), height: th, rx: th / 2, opacity: 0.95 }, fillS);
        if (!cont) el("rect", { x: x1, y: yb, width: 2 * u, height: 8 * u }, fillS);
        if (!more) el("rect", { x: x2 - 2 * u, y: yb, width: 2 * u, height: 8 * u }, fillS);
        if (!(isCont && cont)) {
          const fs = 13 * u;
          const full = cont ? `${p.label} (sigue)` : phraseCaption(p, phrases);
          const span = isCont && cs ? (cs.gx[p.endMeasure] + cs.gw[p.endMeasure] - 3) - (cs.gx[p.startMeasure] + 3) : (x2 - x1);
          const text = full.length * fs * 0.56 <= span - 8 * u ? full : p.label;
          const t = el("text", { x: x1 + 2 * u, y: yb - 3 * u, "font-size": fs, "font-weight": 700, "font-family": "Georgia,serif", "stroke-width": 3 * u, "paint-order": "stroke", "stroke-linejoin": "round" }, { fill: col, stroke: "var(--sh-bg)" });
          t.textContent = text;
        }
        s.svg.appendChild(g);
      });
    });
  }
  function setPhrases(list) {
    const had = phrases.length > 0;
    phrases = Array.isArray(list) ? list : [];
    if (mode === "cont" && score && systems.length && had !== (phrases.length > 0)) { redraw(); return; } // cambia el alto reservado
    drawPhrases();
  }

  /* ---------------------------- digitación ---------------------------- */
  /** Números de dedo: sobre la nota en la mano derecha, bajo la nota en la izquierda (apilados en acordes). */
  function drawFingers() {
    systems.forEach((s) => s && s.svg.querySelectorAll(".fing-g").forEach((e) => e.remove()));
    if (!score) return;
    noteIndex.forEach((info) => {
      const ev = ((score.measures[info.measure] || {})[info.hand] || [])[info.idx];
      if (!ev || !ev.f || !ev.k || !ev.k.length || info.rest) return;
      const s = systems[info.sys]; if (!s) return;
      const u = s.u || 1 / (s.scale || 1);
      let ys, x, lo, hi;
      try {
        ys = info.note.getYs(); x = info.note.getAbsoluteX() + 6; lo = Math.min(...ys); hi = Math.max(...ys);
        if (info.note.hasStem && info.note.hasStem()) { const se = info.note.getStemExtents(); lo = Math.min(lo, se.topY, se.baseY); hi = Math.max(hi, se.topY, se.baseY); }
      } catch (e) { return; }
      const digits = (info.k2 || []).map((orig, j) => ({ f: ev.f[orig] || 0, j })).filter((d) => d.f);   // j crece con la altura
      if (!digits.length) return;
      const fs = 12 * u, g = document.createElementNS(SVGNS, "g");
      g.setAttribute("class", "fing-g");
      const put = (d, y) => {
        const t = document.createElementNS(SVGNS, "text");
        t.setAttribute("class", "fing"); t.setAttribute("x", x); t.setAttribute("y", y); t.setAttribute("text-anchor", "middle"); t.setAttribute("font-size", fs);
        t.textContent = String(d.f); g.appendChild(t);
      };
      if (info.hand === "rh") { let y = lo - 6 * u; digits.forEach((d) => { put(d, y); y -= fs * 1.02; }); }
      else { let y = hi + fs + 3 * u; digits.slice().reverse().forEach((d) => { put(d, y); y += fs * 1.02; }); }
      s.svg.appendChild(g);
    });
  }

  /* ---------------------------- íconos sobre el compás (comentario / aviso) ---------------------------- */
  const BADGE_PATH = {
    comment: "M-8 -7H8Q10 -7 10 -5V3Q10 5 8 5H-1L-6 9V5H-8Q-10 5 -10 3V-5Q-10 -7 -8 -7Z",
    warn: "M0 -9.5L10.5 8.5H-10.5Z",
  };
  function drawBadges() {
    systems.forEach((s) => s && s.svg.querySelectorAll(".mbadge").forEach((e) => e.remove()));
    if (!badges.length || !score) return;
    const by = new Map();
    badges.forEach((b) => { (by.get(b.measure) || by.set(b.measure, []).get(b.measure)).push(b); });
    systems.forEach((s) => {
      if (!s) return;
      const u = Math.min(s.u || 1 / (s.scale || 1), 1.7);
      by.forEach((list, mi) => {
        const m = s.mx[mi]; if (!m) return;
        list.forEach((b, k) => {
          const x = m.x + m.w - (16 + k * 24) * u, y = 33;
          const g = document.createElementNS(SVGNS, "g");
          g.setAttribute("class", `mbadge ${b.type}${b.current ? " cur" : ""}`); g.dataset.measure = mi; g.dataset.type = b.type;
          g.setAttribute("transform", `translate(${x} ${y}) scale(${u})`);
          g.setAttribute("role", "img"); g.setAttribute("aria-label", b.label || b.type);
          const el = (tag, at) => { const e = document.createElementNS(SVGNS, tag); for (const kk in at) e.setAttribute(kk, at[kk]); g.appendChild(e); return e; };
          el("circle", { r: 15, class: "mb-hit" });
          if (b.type === "comment") el("path", { d: BADGE_PATH.comment, class: "mb-shape" });
          else if (b.type === "warn") { el("path", { d: BADGE_PATH.warn, class: "mb-shape" }); el("path", { d: "M-1.4 -3.5h2.8v7h-2.8z", class: "mb-mark" }); el("circle", { cx: 0, cy: 6.6, r: 1.6, class: "mb-mark" }); }
          else { el("circle", { r: 9.5, class: "mb-shape" }); el("path", { d: "M-4.6 0.4L-1.4 3.6L4.8 -3.4", class: "mb-tick" }); }
          if (b.current) el("circle", { r: 13.5, class: "mb-ring" });
          s.svg.appendChild(g);
        });
      });
    });
  }
  /** Íconos sobre los compases: [{ measure, type: "comment"|"warn"|"done", label?, current? }]. */
  function setBadges(list) {
    const next = Array.isArray(list) ? list.filter((b) => b && Number.isInteger(b.measure)) : [];
    const was = badges.length > 0;
    badges = next;
    if (mode === "cont" && score && systems.length && was !== (badges.length > 0)) { redraw(); return; }   // cambia el alto reservado
    drawBadges();
  }
  root.addEventListener("click", (ev) => {
    const b = ev.target.closest && ev.target.closest(".mbadge");
    if (!b || !badgeCb) return;
    ev.stopPropagation();
    badgeCb({ measure: +b.dataset.measure, type: b.dataset.type });
  }, true);

  /** Resalta un compás (aviso que se está mirando). */
  function drawFocus() {
    systems.forEach((s) => s && s.svg.querySelectorAll(".focus-band").forEach((e) => e.remove()));
    if (focusMeasure == null) return;
    systems.forEach((s) => {
      const m = s && s.mx[focusMeasure]; if (!m) return;
      let vb; try { vb = s.svg.viewBox.baseVal; } catch (e) { vb = null; }
      const r = document.createElementNS(SVGNS, "rect");
      r.setAttribute("class", "focus-band"); r.setAttribute("x", m.x); r.setAttribute("width", m.w);
      r.setAttribute("y", vb && vb.height ? vb.y : 0); r.setAttribute("height", vb && vb.height ? vb.height : (s.H || 300));
      s.svg.insertBefore(r, s.svg.firstChild);
    });
  }
  function setFocusMeasure(m) { focusMeasure = Number.isInteger(m) ? m : null; drawFocus(); }

  /* ---------------------------- pasaje (bucle) ---------------------------- */
  /** Resalta el rango y atenúa lo de afuera. */
  function drawRange() {
    systems.forEach((s) => s && s.svg.querySelectorAll(".loop-mark").forEach((e) => e.remove()));
    container.classList.toggle("has-range", !!range);
    if (!range) return;
    systems.forEach((s) => {
      if (!s) return;
      let vb;
      try { vb = s.svg.viewBox.baseVal; } catch (e) { vb = null; }
      const vy = vb && vb.height ? vb.y : 0, vh = vb && vb.height ? vb.height : (s.H || 300);
      const u = s.u || 1 / (s.scale || 1);
      const g = document.createElementNS(SVGNS, "g"); g.setAttribute("class", "loop-mark");
      const back = document.createElementNS(SVGNS, "g"); back.setAttribute("class", "loop-mark");
      const rect = (parent, cls, x, w) => { const r = document.createElementNS(SVGNS, "rect"); r.setAttribute("class", cls); r.setAttribute("x", x); r.setAttribute("width", Math.max(0, w)); r.setAttribute("y", vy); r.setAttribute("height", vh); parent.appendChild(r); };
      let any = false;
      for (let mi = s.from; mi <= s.to; mi++) {
        const m = s.mx[mi]; if (!m) continue;
        const inside = mi >= range.from && mi <= range.to;
        if (inside) { rect(back, "loop-band", m.x, m.w); any = true; } else rect(g, "loop-dim", m.x, m.w);
      }
      const a = s.mx[range.from], b = s.mx[range.to];
      if (a && range.from >= s.from && range.from <= s.to) { const l = document.createElementNS(SVGNS, "rect"); l.setAttribute("class", "loop-edge"); l.setAttribute("x", a.x); l.setAttribute("width", 3 * u); l.setAttribute("y", TOP_Y - 2); l.setAttribute("height", BOT_Y + 80 - TOP_Y + 4); g.appendChild(l); }
      if (b && range.to >= s.from && range.to <= s.to) { const l = document.createElementNS(SVGNS, "rect"); l.setAttribute("class", "loop-edge"); l.setAttribute("x", b.x + b.w - 3 * u); l.setAttribute("width", 3 * u); l.setAttribute("y", TOP_Y - 2); l.setAttribute("height", BOT_Y + 80 - TOP_Y + 4); g.appendChild(l); }
      if (any) s.svg.insertBefore(back, s.svg.firstChild);
      s.svg.appendChild(g);
    });
  }
  /** Pasaje { from, to } (base 0) o null. Con vista continua acota el desplazamiento al rango. */
  function setRange(r) {
    const next = r ? { from: Math.min(r.from, r.to), to: Math.max(r.from, r.to) } : null;
    if (JSON.stringify(next) === JSON.stringify(range)) return;
    range = next;
    drawRange();
    if (!cs) {
      if (range && systems.length) scrollToMeasure(range.from);
      return;
    }
    look = null;
    if (cursor >= 0 && range && cs.stepPos[cursor]) applyOffset(targetOffset(cursor), true);
    else if (range) lookAt(cs.gx[range.from] * cs.scale - (cs.Dw * cs.scale + 18), true);
    else applyOffset(cursor >= 0 ? targetOffset(cursor) : 0, true);
  }

  /* ---------------------------- desplazamiento continuo ---------------------------- */
  const maxOffset = () => (cs ? Math.max(0, cs.total * cs.scale - cs.viewW) : 0);
  /** Límites del desplazamiento. Con un pasaje activo la vista queda acotada a ese rango (si entra en pantalla, queda fija). */
  function bounds() {
    const mo = maxOffset();
    if (!range || !cs || cs.gx[range.from] == null || cs.gx[range.to] == null) return [0, mo];
    const left = cs.gx[range.from] * cs.scale - (cs.Dw * cs.scale + 18);
    const right = (cs.gx[range.to] + cs.gw[range.to]) * cs.scale + 14 - cs.viewW;
    const lo = clamp(Math.round(left), 0, mo);
    return [lo, Math.max(lo, clamp(Math.round(right), 0, mo))];
  }
  function targetOffset(i) {
    const p = cs.stepPos[i];
    if (!p) return curOffset;
    const [lo, hi] = bounds();
    return clamp(Math.round(p.c * cs.scale - cs.viewW / 2), lo, hi);
  }
  /** Aplica offset de la partitura y posición de la marca. animate=false → sin transición. */
  function applyOffset(off, animate) {
    if (!cs) return;
    const anim = animate && !reduceMotion();
    if (!anim) { cs.track.style.transition = "none"; cs.cursorEl.style.transition = "none"; }
    off = Math.round(off);
    curOffset = off;
    cs.track.style.transform = `translate3d(${-off}px,0,0)`;
    const p = cursor >= 0 ? cs.stepPos[cursor] : null;
    if (p) {
      cs.cursorEl.hidden = false;
      cs.cursorEl.style.width = (p.w * cs.scale) + "px";
      cs.cursorEl.style.transform = `translate3d(${p.c * cs.scale - p.w * cs.scale / 2 - off}px,0,0)`;
    } else cs.cursorEl.hidden = true;
    cs.clefs.classList.toggle("on", off > 2);
    if (cs.back) {   // si mirás otra parte y la nota esperada quedó fuera de pantalla, un botón de borde la recupera
      const cx = p ? p.c * cs.scale - off : null;
      const left = cx != null && cx < (off > 2 ? cs.Dw * cs.scale : 0), right = cx != null && cx > cs.viewW - 6;
      cs.back.hidden = !(look != null && (left || right));
      cs.back.className = "cs-back " + (left ? "l" : "r");
      cs.back.textContent = left ? "◂ Nota esperada" : "Nota esperada ▸";
      cs.back.setAttribute("aria-label", "Volver a la nota esperada");
    }
    if (!anim) { void cs.track.offsetWidth; cs.track.style.transition = ""; cs.cursorEl.style.transition = ""; }
  }
  function currentRenderedOffset() {
    try { return -new DOMMatrixReadOnly(getComputedStyle(cs.track).transform).m41; } catch (e) { return curOffset; }
  }
  function follow() {
    if (look == null || !cs) return;
    look = null;
    cancelAnimationFrame(inertia);
    applyOffset(cursor >= 0 ? targetOffset(cursor) : 0, true);
  }
  function lookAt(off, animate) {
    if (!cs) return;
    const [lo, hi] = bounds();
    look = clamp(Math.round(off), lo, hi);
    applyOffset(look, animate);
  }

  // arrastre con el dedo para mirar adelante / atrás
  root.addEventListener("pointerdown", (ev) => {
    if (annotating || mode !== "cont" || !cs || (ev.pointerType === "mouse" && ev.button !== 0)) return;
    cancelAnimationFrame(inertia);
    drag = { id: ev.pointerId, x: ev.clientX, off: currentRenderedOffset(), moved: false, samples: [[performance.now(), ev.clientX]] };
  });
  root.addEventListener("pointermove", (ev) => {
    if (!drag || ev.pointerId !== drag.id || !cs) return;
    const dx = ev.clientX - drag.x;
    if (!drag.moved) {
      if (Math.abs(dx) < 5) return;
      drag.moved = true; cs.view.classList.add("cs-dragging");
      try { root.setPointerCapture(ev.pointerId); } catch (e) { /* nada */ }
    }
    drag.samples.push([performance.now(), ev.clientX]); if (drag.samples.length > 6) drag.samples.shift();
    lookAt(drag.off - dx, false);
  });
  const endDrag = (ev) => {
    if (!drag || ev.pointerId !== drag.id) return;
    const d = drag; drag = null;
    if (d.moved) { wasDrag = true; setTimeout(() => { wasDrag = false; }, 60); }
    if (!d.moved || !cs) return;
    cs.view.classList.remove("cs-dragging");
    const s = d.samples, a = s[0], b = s[s.length - 1];
    let v = b[0] > a[0] ? -(b[1] - a[1]) / (b[0] - a[0]) : 0;   // px/ms (positivo = hacia adelante)
    if (Math.abs(v) < 0.2 || reduceMotion() || performance.now() - b[0] > 80) return;
    let last = performance.now(), pos = look;
    const step = (now) => {
      const dt = Math.min(32, now - last); last = now;
      pos += v * dt; v *= Math.pow(0.992, dt);
      const [lo, hi] = bounds();
      const c = clamp(pos, lo, hi);
      lookAt(c, false);
      if (Math.abs(v) > 0.03 && c === pos && look != null) inertia = requestAnimationFrame(step);
    };
    inertia = requestAnimationFrame(step);
  };
  root.addEventListener("pointerup", endDrag);
  root.addEventListener("pointercancel", endDrag);

  function scrollToMeasure(m) {
    if (mode === "cont" && cs) {
      if (m == null || !cs.gx[m] && m !== 0) return;
      lookAt(cs.gx[m] * cs.scale - (cs.Dw * cs.scale + 18), true);
      return;
    }
    const si = systems.findIndex((s) => s && m >= s.from && m <= s.to);
    if (si < 0) return;
    container.scrollTo({ top: Math.max(0, systems[si].el.offsetTop - 10), behavior: "smooth" });
  }

  /* ---------------------------- marcas, cursor, selección ---------------------------- */
  function setCls(infos, cls, on) { infos.forEach((n) => n.el && n.el.classList.toggle(cls, on)); }
  /** Marca no cromática: ✓ (limpio) o ✕ (con error) debajo del pentagrama, además del color. */
  const FLAG_PATH = { clean: "M-4 0L-1 3.5L5 -4", dirty: "M-3.6 -3.6L3.6 3.6M3.6 -3.6L-3.6 3.6", early: "M2.6 -4.2L-2.6 0L2.6 4.2", late: "M-2.6 -4.2L2.6 0L-2.6 4.2", dur: "M-5.5 0H1.5M4.5 -4.5V4.5" };
  function setFlag(i, kind) {
    const old = flagEls.get(i); if (old) { old.remove(); flagEls.delete(i); }
    if (!kind) return;
    const infos = stepEls[i]; if (!infos || !infos.length) return;
    const s = systems[infos[0].sys]; if (!s) return;
    const xs = infos.map((n) => { try { return n.note.getAbsoluteX(); } catch (e) { return NaN; } }).filter(Number.isFinite);
    if (!xs.length) return;
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2 + 5, u = s.u || 1;
    const p = document.createElementNS(SVGNS, "path");
    p.setAttribute("class", "step-flag " + kind);
    p.setAttribute("d", FLAG_PATH[kind] || FLAG_PATH.dirty);
    p.setAttribute("transform", `translate(${cx} ${flagY}) scale(${u})`);
    p.setAttribute("stroke-width", 2.2);
    s.svg.appendChild(p); flagEls.set(i, p);
  }
  function applyMark(i, kind) {
    const infos = stepEls[i]; if (!infos) return;
    setCls(infos, "pc-clean", kind === "clean");
    setCls(infos, "pc-dirty", kind === "dirty");
    setCls(infos, "pc-early", kind === "early");
    setCls(infos, "pc-late", kind === "late");
    setCls(infos, "pc-dur", kind === "dur");
    setFlag(i, kind);
  }
  /** Rótulo breve junto a la nota ("adelantado", "atrasado", "a tiempo"…); desaparece solo. Sólo hay uno a la vez. */
  function setTag(i, text, cls) {
    if (tagEl) { tagEl.remove(); tagEl = null; } clearTimeout(tagTimer);
    const infos = stepEls[i]; if (!infos || !infos.length || !text) return;
    const s = systems[infos[0].sys]; if (!s) return;
    const xs = infos.map((n) => { try { return n.note.getAbsoluteX(); } catch (e) { return NaN; } }).filter(Number.isFinite);
    if (!xs.length) return;
    const u = s.u || 1;
    const t = document.createElementNS(SVGNS, "text");
    t.setAttribute("class", "step-tag " + (cls || "")); t.setAttribute("text-anchor", "middle");
    t.setAttribute("x", (Math.min(...xs) + Math.max(...xs)) / 2 + 5); t.setAttribute("y", flagY - 9 * u); t.setAttribute("font-size", 11 * u);
    t.textContent = text; s.svg.appendChild(t); tagEl = t;
    tagTimer = setTimeout(() => { if (tagEl === t) { t.remove(); tagEl = null; } }, 1300);
  }
  function markStep(i, kind) { marks[i] = kind || null; applyMark(i, kind); }
  function clearMarks() {
    marks = []; errs.clear();
    systems.forEach((s) => s && s.svg.querySelectorAll(".err-g").forEach((e) => e.remove()));
    stepEls.forEach((infos) => { setCls(infos, "pc-clean", false); setCls(infos, "pc-dirty", false); setCls(infos, "pc-early", false); setCls(infos, "pc-late", false); setCls(infos, "pc-dur", false); });
    flagEls.forEach((e) => e.remove()); flagEls.clear();
    if (tagEl) { tagEl.remove(); tagEl = null; } clearTimeout(tagTimer);
  }

  /* ---------------------------- compás y renglón en evaluación ---------------------------- */
  /** Fondo suave sobre el compás actual (ambos pentagramas), distinto del cursor de la nota. En página, además, el renglón entero; en continua, la etiqueta fija «Compás N». */
  function drawActive() {
    systems.forEach((s) => { if (!s) return; s.svg.querySelectorAll(".meas-band").forEach((e) => e.remove()); s.el.classList.remove("sys-active"); delete s.el.dataset.label; });
    if (cs && cs.mlabel) cs.mlabel.hidden = activeM == null;
    if (activeM == null || !score) return;
    systems.forEach((s, si) => {
      const m = s && s.mx[activeM]; if (!m) return;
      const r = document.createElementNS(SVGNS, "rect");
      r.setAttribute("class", "meas-band"); r.setAttribute("data-measure", activeM);
      r.setAttribute("x", m.x); r.setAttribute("width", m.w); r.setAttribute("y", STAFF_TOP - 18); r.setAttribute("height", STAFF_BOT - STAFF_TOP + 36); r.setAttribute("rx", 6);
      s.svg.insertBefore(r, s.svg.firstChild);
      if (mode === "page") { s.el.classList.add("sys-active"); s.el.dataset.label = `Renglón ${si + 1} de ${systems.length}`; }
    });
    if (cs && cs.mlabel) cs.mlabel.textContent = `Compás ${activeM + 1}`;
  }
  function setActive(m) {
    const next = Number.isInteger(m) ? m : null;
    if (next === activeM && systems.some((s) => s && s.svg.querySelector(".meas-band"))) return;
    activeM = next; drawActive();
  }

  /* ---------------------------- errores: símbolo + nota fantasma ---------------------------- */
  const stepLetters = (midi) => { const k = midiToKey(midi); const m = /^([a-g])(#?)\/(-?\d+)$/.exec(k || ""); return m ? { d: parseInt(m[3], 10) * 7 + LETTER[m[1]], sharp: !!m[2] } : null; };
  function drawErrors() {
    systems.forEach((s) => s && s.svg.querySelectorAll(".err-g").forEach((e) => e.remove()));
    errs.forEach((e, i) => drawErr(i, e));
  }
  function drawErr(i, e) {
    const infos = stepEls[i]; if (!infos || !infos.length) return;
    const s = systems[infos[0].sys]; if (!s) return;
    let anchor = null, ay = Infinity;
    for (const n of infos) {
      try { const ys = n.note.getYs(); const y = Math.min(...ys); if (y < ay) { ay = y; anchor = n; } } catch (er) { /* sin posición */ }
    }
    if (!anchor) return;
    let ax; try { ax = anchor.note.getAbsoluteX(); } catch (er) { return; }
    const u = s.u || 1 / (s.scale || 1), k = Math.max(1, Math.min(u, 1.6));
    const g = document.createElementNS(SVGNS, "g");
    g.setAttribute("class", `err-g ${e.kind}${e.resolved ? " resolved" : ""}`);
    g.dataset.step = i; g.dataset.measure = anchor.measure; g.dataset.kind = e.kind;
    g.setAttribute("role", "img"); g.setAttribute("aria-label", `Compás ${anchor.measure + 1}: ${e.text}`);
    const el = (tag, at, parent) => { const x = document.createElementNS(SVGNS, tag); for (const kk in at) x.setAttribute(kk, at[kk]); (parent || g).appendChild(x); return x; };
    el("circle", { class: "err-hit", cx: ax + 24, cy: ay, r: 20 * k });
    let shifted = false, ghostY = null;
    // cabeza "fantasma" a la altura que tocó el usuario (sólo si entra razonablemente en el pentagrama de la nota esperada)
    if (e.kind === "wrong" && Number.isInteger(e.played)) {
      const pl = stepLetters(e.played);
      let bottomY = anchor.hand === "rh" ? TOP_Y + 8 * SPACE : BOT_Y + 8 * SPACE;
      try { bottomY = anchor.note.getStave().getYForLine(4); } catch (er) { /* constante */ }
      const baseD = anchor.hand === "rh" ? 30 : 18;   // E4 / G2: línea de abajo
      if (pl) {
        const y = bottomY - (pl.d - baseD) * (SPACE / 2);
        const near = Math.abs(y - ay) <= 9 * SPACE / 2;   // a lo sumo ~una octava de la nota esperada
        const inStaff = pl.d >= baseD - 6 && pl.d <= baseD + 8 + 6;
        if (inStaff && near) {
          const dy = Math.abs(y - ay);
          shifted = dy < SPACE * 0.7;
          const cx = ax + 6 + (shifted ? 13 : 0);
          const topLine = bottomY - 4 * SPACE;
          for (let ly = topLine - SPACE; ly >= y - 2; ly -= SPACE) el("line", { class: "ghost-ledger", x1: cx - 9, x2: cx + 9, y1: ly, y2: ly });
          for (let ly = bottomY + SPACE; ly <= y + 2; ly += SPACE) el("line", { class: "ghost-ledger", x1: cx - 9, x2: cx + 9, y1: ly, y2: ly });
          ghostY = y; el("ellipse", { class: "ghost-note", cx, cy: y, rx: 7.4, ry: 5.3, transform: `rotate(-20 ${cx} ${y})` });
          if (pl.sharp) { const t = el("text", { class: "ghost-acc", x: cx - 15, y: y + 5, "font-size": 15 }); t.textContent = "♯"; }
        }
      }
    }
    const bx = ax + 22 + (shifted ? 6 : 0), by = ay + (ghostY != null && ghostY < ay ? 14 : -14);
    const sym = el("g", { class: "err-sym", transform: `translate(${bx} ${by}) scale(${k})` });
    if (e.kind === "omit") { el("circle", { class: "err-ring", r: 7 }, sym); }
    else { el("circle", { class: "err-disc", r: 8 }, sym); el("path", { class: "err-x", d: "M-3.4 -3.4L3.4 3.4M3.4 -3.4L-3.4 3.4" }, sym); }
    s.svg.appendChild(g);
  }
  /** Marca un error junto a la nota esperada del paso: { kind: "wrong"|"omit", played?, expected[], text }. Queda hasta clearMarks(). */
  function markError(i, info) {
    if (!info) return;
    errs.set(i, { kind: info.kind === "omit" ? "omit" : "wrong", played: Number.isInteger(info.played) ? info.played : null, expected: info.expected || [], text: String(info.text || ""), resolved: false });
    drawErrors();
  }
  /** El usuario corrigió: la marca queda como historial discreto. */
  function resolveError(i) { const e = errs.get(i); if (!e || e.resolved) return; e.resolved = true; drawErrors(); }
  root.addEventListener("click", (ev) => {
    const g = ev.target.closest && ev.target.closest(".err-g");
    if (!g || !errCb) return;
    ev.stopPropagation();
    const i = +g.dataset.step, e = errs.get(i);
    if (e) errCb({ step: i, measure: +g.dataset.measure, kind: e.kind, text: e.text });
  }, true);

  function ensureRect(sysIdx) {
    const s = systems[sysIdx]; if (!s) return null;
    if (!cursorRect || cursorRect.ownerSVGElement !== s.svg) {
      if (cursorRect) cursorRect.remove();
      cursorRect = s.svg.ownerDocument.createElementNS(SVGNS, "rect");
      cursorRect.setAttribute("class", "cursor-rect");
      cursorRect.setAttribute("rx", 8);
      s.svg.insertBefore(cursorRect, s.svg.firstChild);
    }
    return cursorRect;
  }
  function applyCursor(i, animate) {
    setTimeout(applyWait, 0);
    stepEls.forEach((infos) => setCls(infos, "pc-cur", false));
    const infos = stepEls[i];
    setActive(steps[i] ? steps[i].measure : null);
    if (cs) {
      if (!infos || !infos.length) { cs.cursorEl.hidden = true; return; }
      setCls(infos, "pc-cur", true);
      look = null;
      applyOffset(targetOffset(i), animate);
      return;
    }
    if (!infos || !infos.length) { if (cursorRect) cursorRect.remove(), (cursorRect = null); return; }
    setCls(infos, "pc-cur", true);
    const si = infos[0].sys;
    const r = ensureRect(si);
    const xs = infos.map((n) => { try { return n.note.getAbsoluteX(); } catch (e) { return 0; } });
    const x = Math.min(...xs);
    if (r) { r.setAttribute("x", x - 12); r.setAttribute("width", Math.max(...xs) - x + 34); r.setAttribute("y", 26); r.setAttribute("height", systems[si].H - 34); }
    scrollToSystem(si, animate !== false);
  }
  function scrollToSystem(si, smooth = true) {
    const s = systems[si]; if (!s) return;
    const top = s.el.offsetTop, bottom = top + s.el.offsetHeight;
    const vt = container.scrollTop, vb = vt + container.clientHeight;
    if (top < vt + 4 || bottom > vb - 4) container.scrollTo({ top: Math.max(0, top - 10), behavior: smooth && !reduceMotion() ? "smooth" : "auto" });
  }
  function setCursor(i) {
    const prev = cursor;
    cursor = (i === null || i === undefined) ? -1 : i;
    if (cursor < 0) {
      setActive(null);
      stepEls.forEach((infos) => setCls(infos, "pc-cur", false));
      if (cursorRect) { cursorRect.remove(); cursorRect = null; }
      if (cs) { cs.cursorEl.hidden = true; look = null; }
      return;
    }
    applyCursor(cursor, prev >= 0);
  }

  function setSelected(ref) {
    selected = ref || null;
    if (selMark) { selMark.remove(); selMark = null; }
    if (!ref) return;
    const info = noteIndex.get(nk(ref.measure, ref.hand, ref.idx)); if (!info) return;
    const s = systems[info.sys];
    try {
      const ys = info.note.getYs();
      const j = Math.max(0, info.k2 ? info.k2.indexOf(ref.keyIdx) : 0);
      const c = s.svg.ownerDocument.createElementNS(SVGNS, "circle");
      c.setAttribute("cx", info.note.getAbsoluteX() + 6); c.setAttribute("cy", ys[j] ?? ys[0]);
      c.setAttribute("r", 13); c.setAttribute("class", "sel-ring");
      s.svg.appendChild(c); selMark = c;
    } catch (e) { /* ignorar */ }
  }

  // toque en un compás (p. ej. para saltar ahí al escuchar): no se dispara al arrastrar la partitura
  let measureCb = null, wasDrag = false;
  root.addEventListener("click", (ev) => {
    if (!measureCb || annotating || wasDrag) return;
    const sysEl = ev.target.closest && ev.target.closest(".system"); if (!sysEl) return;
    const s = systems[+sysEl.dataset.sys]; if (!s || !s.mx) return;
    let p;
    try { const pt = s.svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; p = pt.matrixTransform(s.svg.getScreenCTM().inverse()); } catch (e) { return; }
    for (let mi = s.from; mi <= s.to; mi++) { const m = s.mx[mi]; if (m && p.x >= m.x && p.x <= m.x + m.w) { measureCb(mi); return; } }
  });

  // toque: nota más cercana al punto tocado
  root.addEventListener("click", (ev) => {
    if (!tapCb || annotating) return;
    const sysEl = ev.target.closest(".system"); if (!sysEl) return;
    const s = systems[+sysEl.dataset.sys]; if (!s) return;
    let p;
    try { const pt = s.svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; p = pt.matrixTransform(s.svg.getScreenCTM().inverse()); } catch (e) { return; }
    let best = null, bd = 30 * 30;
    for (const n of s.entries) {
      if (n.rest) continue;
      let x, ys;
      try { x = n.note.getAbsoluteX() + 6; ys = n.note.getYs(); } catch (e) { continue; }
      ys.forEach((y, j) => {
        const d = (x - p.x) ** 2 + ((y - p.y) * 1.2) ** 2;
        if (d < bd) { bd = d; best = { measure: n.measure, hand: n.hand, idx: n.idx, keyIdx: n.k2[j] ?? j }; }
      });
    }
    if (best) tapCb(best);
  });


  /* ---------------------------- notas sostenidas: barra de duración sobre la partitura ---------------------------- */
  // Una barra por nota larga, desde la cabeza hasta donde termina su valor (en continua, proporcional al espacio de la partitura; en página,
  // dentro del renglón). Se dibuja una vez y después sólo cambia transform / opacity: no se vuelve a dibujar VexFlow.
  let holdSvg = null, cursorWait = false;
  const holdEls = new Map();    // id → { g, fill, w, state, f }
  function applyWait() {
    if (cs && cs.cursorEl) cs.cursorEl.classList.toggle("wait", cursorWait);
    if (cursorRect) cursorRect.classList.toggle("wait", cursorWait);
  }
  /** Marca que el cursor todavía no toca (se sigue sosteniendo una nota que termina antes). */
  function setCursorWait(on) { on = !!on; if (on === cursorWait) return; cursorWait = on; applyWait(); }
  function clearHolds() { holdEls.clear(); if (holdSvg) { holdSvg.remove(); holdSvg = null; } }
  function holdSvgEl() {
    if (holdSvg && holdSvg.isConnected) return holdSvg;
    if (!systems.length) return null;
    const svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "hold-svg"); svg.setAttribute("aria-hidden", "true");
    (cs ? cs.track : container).appendChild(svg);
    holdSvg = svg; sizeHoldSvg();
    return svg;
  }
  function sizeHoldSvg() {
    if (!holdSvg) return;
    const w = cs ? cs.total * cs.scale : container.clientWidth, h = cs ? cs.svgH : Math.max(container.scrollHeight, container.clientHeight);
    holdSvg.setAttribute("width", w); holdSvg.setAttribute("height", h);
    holdSvg.style.width = w + "px"; holdSvg.style.height = h + "px";
  }
  /** px (en el lienzo que se desplaza) de una coordenada x / y del SVG del sistema. */
  const hx = (sys, ax) => (cs ? (ax + sys.x0) * cs.scale : sys.el.offsetLeft + ax * sys.scale);
  const hy = (sys, ay) => (cs ? (ay - cs.y0) * cs.scale : sys.el.offsetTop + ay * sys.scale);
  function holdGeom(h) {
    const r = h.ref; const info = r && noteIndex.get(nk(r.measure, r.hand, r.idx)); if (!info || info.rest) return null;
    const s = systems[info.sys]; if (!s) return null;
    let ax, ys; try { ax = info.note.getAbsoluteX(); ys = info.note.getYs(); } catch (e) { return null; }
    const j = Math.max(0, info.k2 ? info.k2.indexOf(r.keyIdx) : 0), yy = ys[j] != null ? ys[j] : ys[0];
    const k = cs ? cs.scale : s.scale || 1;
    const x0 = hx(s, ax) + 11 * k, y = hy(s, yy);
    let x1 = null;
    const e = h.endRef && noteIndex.get(nk(h.endRef.measure, h.endRef.hand, h.endRef.idx));
    if (e && (cs || e.sys === info.sys)) { try { x1 = hx(systems[e.sys], e.note.getAbsoluteX()) - 4 * k; } catch (er) { x1 = null; } }
    if (x1 == null) {
      let m = h.endRef ? h.endRef.measure : (score ? score.measures.length : 1);
      if (!cs) m = Math.min(m - (h.endRef && h.endRef.idx === 0 ? 1 : 0), s.to);
      else m = Math.max(r.measure, m - (h.endRef && h.endRef.idx === 0 ? 1 : 0));
      if (cs) { const gi = Math.min(Math.max(0, m), cs.gx.length - 1); x1 = (cs.gx[gi] + cs.gw[gi]) * cs.scale - 8 * k; }
      else { const mm = s.mx[Math.min(Math.max(m, s.from), s.to)]; x1 = s.el.offsetLeft + (mm.x + mm.w) * s.scale - 8 * k; }
    }
    return { x: x0, y, w: Math.max(18, x1 - x0), th: Math.max(5, 6.5 * k) };
  }
  /** list = [{ id, ref:{measure,hand,idx,keyIdx}, endRef, hand, fraction, state:"holding"|"done"|"early" }]. Lo que no está en la lista se quita. */
  function setHolds(list) {
    const seen = new Set();
    for (const h of list || []) {
      if (!h || !h.ref) continue;
      seen.add(h.id);
      let e = holdEls.get(h.id);
      if (!e) {
        const svg = holdSvgEl(); if (!svg) continue;
        const g = holdGeom(h); if (!g) continue;
        sizeHoldSvg();
        const el = document.createElementNS(SVGNS, "g");
        el.setAttribute("class", "hold-g " + (h.hand === "lh" ? "lh" : "rh"));
        el.style.transform = `translate(${g.x}px, ${g.y - g.th / 2}px)`;
        const mk = (cls, w) => { const r = document.createElementNS(SVGNS, "rect"); r.setAttribute("class", cls); r.setAttribute("width", w); r.setAttribute("height", g.th); r.setAttribute("rx", g.th / 2); el.appendChild(r); return r; };
        mk("hold-track", g.w);
        const fill = mk("hold-fill", g.w);
        svg.appendChild(el);
        e = { g: el, fill, w: g.w, state: "", f: -1 };
        holdEls.set(h.id, e);
      }
      const f = Math.max(0, Math.min(1, h.fraction || 0));
      if (Math.abs(f - e.f) > 0.002) { e.fill.style.transform = `scaleX(${f.toFixed(3)})`; e.f = f; }
      const st = h.state || "holding";
      if (st !== e.state) { e.g.setAttribute("class", "hold-g " + (h.hand === "lh" ? "lh" : "rh") + " " + st); e.state = st; }
    }
    for (const [id, e] of [...holdEls]) if (!seen.has(id)) { e.g.remove(); holdEls.delete(id); }
  }

  /* ---------------------------- aspecto / redibujo ---------------------------- */
  function setLook(o = {}) {
    let redo = false;
    if (o.theme && THEMES.includes(o.theme) && o.theme !== theme) { theme = o.theme; container.dataset.sheet = theme; }   // sólo CSS
    if (o.size && SIZES.includes(o.size) && o.size !== size) { size = o.size; redo = true; }
    if (o.view && !lockMode) { const m = o.view === "page" ? "page" : "cont"; if (m !== mode) { mode = m; redo = true; } }
    if (redo && score) redraw();
  }
  function redraw() {
    if (!score) return;
    const st = container.scrollTop;
    draw(score, steps);
    if (mode === "page") {
      container.scrollTop = st;
      const cur = cursor >= 0 && stepEls[cursor] && stepEls[cursor][0];
      if (cur) scrollToSystem(cur.sys);   // tras cambiar el tamaño, el sistema que tocás vuelve a quedar a la vista
    }
  }
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const w = container.clientWidth, h = container.clientHeight;
      if (!score || w <= 0) return;
      if (Math.abs(w - lastWidth) > 12 || (mode === "cont" && Math.abs(h - lastHeight) > 12)) redraw();
    }, 150);
  });
  ro.observe(container);

  return {
    draw, setCursor, follow, getLayout: () => curLayout, getOverlay: () => annoSvg, onDraw(cb) { drawCb = cb; if (cb && annoSvg) cb({ svg: annoSvg, layout: curLayout }); }, setAnnotating, panBy, scrollPos, markStep, markError, resolveError, hasError: (i) => errs.has(i), onErrorTap(cb) { errCb = cb; }, clearMarks, setSelected, setPhrases, setRange, scrollToMeasure, setLook, setBadges, setFocusMeasure, setTag, setHolds, setCursorWait,
    onNoteTap(cb) { tapCb = cb; },
    onMeasureTap(cb) { measureCb = cb; },
    onBadgeTap(cb) { badgeCb = cb; },
    redraw,
    destroy() { ro.disconnect(); root.remove(); },
  };
}
