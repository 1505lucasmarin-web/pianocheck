// Dibujo de la partitura con VexFlow (global `VexFlow`, vendor/vexflow/vexflow-bravura.js).
// API: createRenderer(container, {mode}) → { draw, setCursor, follow, markStep, onNoteTap, clearMarks, setSelected,
//   setPhrases, scrollToMeasure, setLook, redraw, destroy }
// Dos vistas: "page" (sistemas apilados, con scroll vertical) y "cont" (toda la pieza en una sola fila que se desplaza).
// Los colores salen de variables CSS por tema (data-sheet="hoja|sepia|oscuro" en el contenedor): cambiar de tema no redibuja.
import { phraseCaption, baseLetter } from "./phrases.js";
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
  let marks = [], cursor = -1, tapCb = null, selected = null;
  let lastWidth = 0, lastHeight = 0, resizeTimer = 0, cursorRect = null, selMark = null;
  const flagEls = new Map();
  let flagY = FLAG_Y;
  // vista continua
  let cs = null;           // { view, track, cursorEl, clefs, scale, total, viewW, Dw, stepPos, gx, ... }
  let look = null;         // desplazamiento libre (arrastre / frase elegida) en px; null = seguir al cursor
  let curOffset = 0, drag = null, inertia = 0;

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
    if (o.num) {
      const t = document.createElementNS(SVGNS, "text");
      t.setAttribute("class", "mnum"); t.setAttribute("x", x + 10); t.setAttribute("y", NUM_Y);
      t.setAttribute("font-size", 10 * o.u); t.textContent = String(mi + 1);
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
      if (o.ext) [...rhN, ...lhN].forEach((n) => {   // extensión vertical real (líneas adicionales, plicas, corchetes)
        try {
          const ys = n.getYs(); o.ext.min = Math.min(o.ext.min, ...ys); o.ext.max = Math.max(o.ext.max, ...ys);
          if (n.hasStem && n.hasStem()) { const se = n.getStemExtents(); o.ext.min = Math.min(o.ext.min, se.topY, se.baseY); o.ext.max = Math.max(o.ext.max, se.topY, se.baseY); }
        } catch (e) { /* sin extensión */ }
      });
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
      drawMeasure(ctx, svg, sc, mi, x, w, { sysIdx: si, header: isFirst, time: isFirst && first === 0, num: isFirst && mi > 0, u: 1 / scale, entries });
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
          drawMeasure(ctx, svg, sc, mi, gx[mi] - sd.x0, gw[mi], { sysIdx: si, header: mi === 0, time: mi === 0, num: true, u: 1, entries, ext });
        });
      } catch (err) { console.error("tramo", si, err); }
      systems[si] = { el, svg, ctx, entries, H: H0, mx, from: sd.from, to: sd.to, sw, x0: sd.x0 };
    });

    // alto real del contenido (líneas adicionales, plicas) para escalar sin recortar
    let cmin = Math.min(TOP_Y + 40 - 8, NUM_Y - 12, ext.min - 7), cmax = Math.max(BOT_Y + 80 + 8, ext.max + 7);
    flagY = cmax + 8; cmax = flagY + 8;
    const R0 = cmax - cmin;
    const hasPh = phrases.length > 0;
    const PH = hasPh ? 28 : 0;                       // px reservados arriba para corchetes y letras
    const availH = viewH - 14 - PH;
    let scale = (availH / R0) * CONT_SIZE_F[size];
    // tope por ancho: en pantallas angostas y altas (celular vertical) tienen que verse ~2 compases
    scale = Math.min(scale, viewW / ({ chico: 640, mediano: 500, grande: 400 })[size]);
    scale = clamp(Math.floor(Math.min(scale, 2.2) / SCALE_STEP) * SCALE_STEP, 0.3, 2.2);
    const u = 1 / scale;
    const y0 = cmin - PH * u, Rn = R0 + PH * u;
    const svgH = Rn * scale;
    systems.forEach((s) => s.svg.querySelectorAll(".mnum").forEach((t) => t.setAttribute("font-size", 11 * u)));
    const topPx = Math.max(0, Math.round((viewH - svgH) / 2));
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
    cs = { view, track, cursorEl, clefs, scale, total, viewW, viewH, Dw, gx, gw, stepPos: [], PH, topPx };
    curOffset = 0; look = null;
  }

  /* ---------------------------- dibujo general ---------------------------- */
  function draw(sc, st) {
    score = sc; steps = st || [];
    systems = []; noteIndex = new Map(); stepEls = [];
    cursorRect = null; selMark = null; cs = null; flagEls.clear(); flagY = FLAG_Y;
    cancelAnimationFrame(inertia); drag = null;
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
    if (cursor >= 0) applyCursor(cursor, false);
    if (selected) setSelected(selected);
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

  /* ---------------------------- desplazamiento continuo ---------------------------- */
  const maxOffset = () => (cs ? Math.max(0, cs.total * cs.scale - cs.viewW) : 0);
  function targetOffset(i) {
    const p = cs.stepPos[i];
    if (!p) return curOffset;
    return clamp(Math.round(p.c * cs.scale - cs.viewW / 2), 0, maxOffset());
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
    look = clamp(Math.round(off), 0, maxOffset());
    applyOffset(look, animate);
  }

  // arrastre con el dedo para mirar adelante / atrás
  root.addEventListener("pointerdown", (ev) => {
    if (mode !== "cont" || !cs || (ev.pointerType === "mouse" && ev.button !== 0)) return;
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
    if (!d.moved || !cs) return;
    cs.view.classList.remove("cs-dragging");
    const s = d.samples, a = s[0], b = s[s.length - 1];
    let v = b[0] > a[0] ? -(b[1] - a[1]) / (b[0] - a[0]) : 0;   // px/ms (positivo = hacia adelante)
    if (Math.abs(v) < 0.2 || reduceMotion() || performance.now() - b[0] > 80) return;
    let last = performance.now(), pos = look;
    const step = (now) => {
      const dt = Math.min(32, now - last); last = now;
      pos += v * dt; v *= Math.pow(0.992, dt);
      const c = clamp(pos, 0, maxOffset());
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
    p.setAttribute("d", kind === "clean" ? "M-4 0L-1 3.5L5 -4" : "M-3.6 -3.6L3.6 3.6M3.6 -3.6L-3.6 3.6");
    p.setAttribute("transform", `translate(${cx} ${flagY}) scale(${u})`);
    p.setAttribute("stroke-width", 2.2);
    s.svg.appendChild(p); flagEls.set(i, p);
  }
  function applyMark(i, kind) {
    const infos = stepEls[i]; if (!infos) return;
    setCls(infos, "pc-clean", kind === "clean");
    setCls(infos, "pc-dirty", kind === "dirty");
    setFlag(i, kind);
  }
  function markStep(i, kind) { marks[i] = kind || null; applyMark(i, kind); }
  function clearMarks() {
    marks = [];
    stepEls.forEach((infos) => { setCls(infos, "pc-clean", false); setCls(infos, "pc-dirty", false); });
    flagEls.forEach((e) => e.remove()); flagEls.clear();
  }

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
    stepEls.forEach((infos) => setCls(infos, "pc-cur", false));
    const infos = stepEls[i];
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
    if (animate !== false) scrollToSystem(si);
  }
  function scrollToSystem(si) {
    const s = systems[si]; if (!s) return;
    const top = s.el.offsetTop, bottom = top + s.el.offsetHeight;
    const vt = container.scrollTop, vb = vt + container.clientHeight;
    if (top < vt + 4 || bottom > vb - 4) container.scrollTo({ top: Math.max(0, top - 10), behavior: "smooth" });
  }
  function setCursor(i) {
    const prev = cursor;
    cursor = (i === null || i === undefined) ? -1 : i;
    if (cursor < 0) {
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

  // toque: nota más cercana al punto tocado
  root.addEventListener("click", (ev) => {
    if (!tapCb) return;
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
    draw, setCursor, follow, markStep, clearMarks, setSelected, setPhrases, scrollToMeasure, setLook,
    onNoteTap(cb) { tapCb = cb; },
    redraw,
    destroy() { ro.disconnect(); root.remove(); },
  };
}
