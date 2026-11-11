// Piano guía: teclado fijo con teclas iluminadas, aciertos/errores y flecha de corrección.
// Las funciones puras (describeMove, nearestMissing, computeRange, ...) son seguras de importar en Node.
import { midiName } from "./model.js";

const BLACK_PC = new Set([1, 3, 6, 8, 10]);
export const isBlack = (m) => BLACK_PC.has(((m % 12) + 12) % 12);

/** Texto de una distancia en semitonos: 1 → "medio tono", 2 → "1 tono", 3 → "1 tono y medio", 12 → "1 octava", 14 → "1 octava y 1 tono". */
export function semitonesText(semitones) {
  const s = Math.abs(Math.round(semitones));
  const oct = Math.floor(s / 12), rem = s % 12;
  const tones = Math.floor(rem / 2), half = rem % 2;
  const parts = [];
  if (oct) parts.push(`${oct} ${oct === 1 ? "octava" : "octavas"}`);
  if (tones) parts.push(`${tones} ${tones === 1 ? "tono" : "tonos"}${half ? " y medio" : ""}`);
  else if (half) parts.push("medio tono");
  return parts.join(" y ") || "0 tonos";
}

/**
 * Cómo moverse desde la nota tocada hasta la que había que tocar.
 * → { dir: "izquierda"|"derecha"|null, semitones, text }, p. ej. "Movete 1 tono a la derecha → Sol4".
 */
export function describeMove(playedMidi, targetMidi) {
  const diff = targetMidi - playedMidi;
  if (!diff) return { dir: null, semitones: 0, text: "" };
  const dir = diff > 0 ? "derecha" : "izquierda";
  const semitones = Math.abs(diff);
  return { dir, semitones, text: `Movete ${semitonesText(semitones)} a la ${dir} → ${midiName(targetMidi)}` };
}

/**
 * De las notas que faltan del paso (acorde), la más cercana a la tocada.
 * Desempate (misma distancia arriba y abajo): la más grave, es decir la que está hacia la izquierda/abajo.
 */
export function nearestMissing(playedMidi, missing) {
  let best = null, bd = Infinity;
  for (const m of missing || []) {
    const d = Math.abs(m - playedMidi);
    if (d < bd || (d === bd && m < best)) { best = m; bd = d; }
  }
  return best;
}

/**
 * Rango del teclado para una partitura que va de minMidi a maxMidi: octavas completas (de Do a Si),
 * con al menos media octava (6 semitonos) de margen a cada lado y mínimo 2 octavas. Limitado a A0..C8.
 */
export function computeRange(minMidi, maxMidi) {
  let lo = Number.isFinite(minMidi) ? minMidi : 60, hi = Number.isFinite(maxMidi) ? maxMidi : 71;
  if (hi < lo) [lo, hi] = [hi, lo];
  let low = Math.floor((lo - 6) / 12) * 12;
  let high = Math.ceil((hi + 6 + 1) / 12) * 12 - 1;
  while (high - low + 1 < 24) { if (high + 12 <= 108) high += 12; else low -= 12; }
  if (low < 21) { low = 21; if (high - low + 1 < 24) high = Math.min(108, low + 24 - 1); }
  if (high > 108) { high = 108; if (high - low + 1 < 24) low = Math.max(21, high - 24 + 1); }
  return { low, high };
}

const SVGNS = "http://www.w3.org/2000/svg";
const tagName = (m) => (m % 12 === 0 ? midiName(m) : midiName(m).replace(/-?\d+$/, ""));

/**
 * createKeyboard(container, { onKey?(midi), minWhite? }) →
 *   { setRange, setTargets([{midi, hand:"rh"|"lh", done?, label?}]), setSteps(list), flash(midi,"ok"|"bad"), setHint({fromMidi,toMidi}|null),
 *     setInteractive(bool), focus(midis), destroy() }
 * `done:true` en un objetivo lo pinta verde (nota del acorde que ya tocaste).
 * `label` en un objetivo reemplaza el nombre de la tecla (p. ej. "Fa♯" o "Mi♯" con la ortografía de la tonalidad).
 * setSteps([{fromMidi,toMidi,text}]) dibuja pastillas (T / S) entre dos teclas.
 */
export function createKeyboard(container, opts = {}) {
  const minWhite = opts.minWhite || 22, maxWhite = opts.maxWhite || 60;
  const onKey = opts.onKey || (() => {});
  container.classList.add("pk");
  container.setAttribute("role", "group");
  container.setAttribute("aria-label", "Teclado de piano");
  container.innerHTML = `<div class="pk-bar"><span class="pk-leg" hidden><span class="pk-mk rh" aria-hidden="true"></span>MD<span class="pk-mk lh" aria-hidden="true"></span>MI</span></div><div class="pk-scroll"><div class="pk-keys"></div></div>`;
  const legend = container.querySelector(".pk-leg");
  const scroller = container.querySelector(".pk-scroll");
  const keysEl = container.querySelector(".pk-keys");

  let low = 48, high = 83, nWhite = 0, ww = minWhite, interactive = false;
  const els = new Map();             // midi → elemento
  const whiteIdx = new Map();        // midi blanca → posición
  let targets = new Map();           // midi → {hand, done}
  const okSet = new Set(); const okTimers = new Map();
  let badMidi = null, hint = null, svg = null, pendingFocus = null, downEl = null;
  let stepList = [];                 // etiquetas entre teclas vecinas (T / S) en la franja superior

  const centerX = (m) => (isBlack(m) ? (whiteIdx.get(m - 1) + 1) * ww : (whiteIdx.get(m) + 0.5) * ww);

  function build() {
    keysEl.innerHTML = ""; els.clear(); whiteIdx.clear();
    let html = ""; let wi = 0;
    for (let m = low; m <= high; m++) if (!isBlack(m)) whiteIdx.set(m, wi++);
    nWhite = wi;
    for (let m = low; m <= high; m++) {
      const nm = midiName(m);
      if (isBlack(m)) {
        html += `<div class="pk-b" data-midi="${m}" style="--c:${whiteIdx.get(m - 1) + 1}" aria-label="${nm}"></div>`;
      } else {
        const isC = m % 12 === 0;
        html += `<div class="pk-w${isC ? " c" : ""}${m === 60 ? " mid" : ""}" data-midi="${m}" style="--i:${whiteIdx.get(m)}" aria-label="${nm}">${isC ? `<span class="pk-n">${nm}</span>` : ""}</div>`;
      }
    }
    keysEl.innerHTML = html;
    keysEl.querySelectorAll("[data-midi]").forEach((e) => els.set(+e.dataset.midi, e));
    svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("class", "pk-arrow"); svg.setAttribute("aria-hidden", "true");
    keysEl.appendChild(svg);
    layout(); paint();
  }

  function stripH() { return parseFloat(getComputedStyle(keysEl).getPropertyValue("--strip")) || 0; }

  function layout() {
    const W = scroller.clientWidth;
    if (!W || !nWhite) return;
    const fit = W / nWhite;
    ww = fit >= minWhite ? Math.min(fit, maxWhite) : minWhite;
    keysEl.style.setProperty("--ww", ww + "px");
    keysEl.style.width = nWhite * ww + "px";
    keysEl.style.marginLeft = nWhite * ww < W ? Math.floor((W - nWhite * ww) / 2) + "px" : "0";
    drawArrow(); drawSteps();
    if (pendingFocus) { const f = pendingFocus; pendingFocus = null; focusNow(f, false); }
    else if (!scroller.dataset.init) { scroller.dataset.init = "1"; scroller.scrollLeft = Math.max(0, centerX(Math.min(high, Math.max(low, 60))) - W / 2); }
  }

  function paint() {
    els.forEach((el, m) => {
      const t = targets.get(m);
      const cls = ["pk-b", "pk-w"].filter((c) => el.classList.contains(c));
      if (el.classList.contains("c")) cls.push("c");
      if (el.classList.contains("mid")) cls.push("mid");
      if (el.classList.contains("down")) cls.push("down");
      if (t && t.done) cls.push("done");
      else if (t) cls.push("lit", t.hand === "lh" ? "is-lh" : "is-rh");
      if (okSet.has(m)) cls.push("okf");
      if (m === badMidi) cls.push("bad");
      if (hint && hint.toMidi === m) cls.push("hintT");
      el.className = cls.join(" ");
      let tag = el.querySelector(".pk-tag");
      if (t) {
        const html = t.label ? (t.done ? `<i class="pk-chk" aria-hidden="true">✓</i><b>${t.label}</b>` : `<b>${t.label}</b>`) : t.done ? `<i class="pk-chk" aria-hidden="true">✓</i>` : `<i class="pk-mk ${t.hand === "lh" ? "lh" : "rh"}" aria-hidden="true"></i><b>${tagName(m)}</b>`;
        if (!tag) { tag = document.createElement("span"); el.appendChild(tag); }
        tag.className = "pk-tag" + (t.label ? " lab" : "");
        if (tag.dataset.k !== html) { tag.innerHTML = html; tag.dataset.k = html; }
        el.setAttribute("aria-label", t.label ? `${t.label}${t.done ? ", tocada" : ""}` : `${midiName(m)}${t.done ? ", tocada" : t.hand === "lh" ? ", mano izquierda" : ", mano derecha"}`);
      } else if (tag) { tag.remove(); el.setAttribute("aria-label", midiName(m)); }
    });
    legend.hidden = ![...targets.values()].some((t) => !t.done);
  }

  function drawArrow() {
    if (!svg) return;
    svg.innerHTML = "";
    if (!hint || !els.has(hint.fromMidi) || !els.has(hint.toMidi) || hint.fromMidi === hint.toMidi) { svg.style.display = "none"; return; }
    const sh = stripH();
    svg.style.display = "";
    const total = keysEl.clientHeight || 140;
    svg.setAttribute("width", nWhite * ww); svg.setAttribute("height", total);
    svg.setAttribute("viewBox", `0 0 ${nWhite * ww} ${total}`);
    const xa = centerX(hint.fromMidi), xb = centerX(hint.toMidi);
    const y0 = sh + 6, h = Math.max(14, Math.min(sh - 2, 14 + Math.abs(xb - xa) * 0.12));
    const cx = (xa + xb) / 2, cy = y0 - 2 * h;
    // la punta termina apenas dentro de la tecla de destino, apuntando en la dirección de la curva
    const ang = Math.atan2(y0 - cy, xb - cx), hs = 12;
    const tipX = xb, tipY = y0;
    const bx = tipX - Math.cos(ang) * hs * 1.3, by = tipY - Math.sin(ang) * hs * 1.3;
    const px = -Math.sin(ang) * hs * 0.8, py = Math.cos(ang) * hs * 0.8;
    const d = `M ${xa} ${y0} Q ${cx} ${cy} ${bx} ${by}`;
    const mk = (tag, attrs) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); svg.appendChild(e); return e; };
    mk("path", { d, class: "halo" });
    mk("polygon", { points: `${tipX},${tipY} ${bx + px},${by + py} ${bx - px},${by - py}`, class: "halo head" });
    mk("path", { d, class: "line" });
    mk("polygon", { points: `${tipX},${tipY} ${bx + px},${by + py} ${bx - px},${by - py}`, class: "head" });
    mk("circle", { cx: xa, cy: y0, r: 5, class: "dot" });
  }

  /** Pastillas T / S centradas entre dos teclas (sólo si ambas existen en el rango). */
  function drawSteps() {
    keysEl.querySelectorAll(".pk-step").forEach((e) => e.remove());
    for (const st of stepList) {
      if (!els.has(st.fromMidi) || !els.has(st.toMidi)) continue;
      const e = document.createElement("span");
      e.className = "pk-step " + (st.text === "S" ? "s" : "t");
      e.textContent = st.text;
      e.style.left = (centerX(st.fromMidi) + centerX(st.toMidi)) / 2 + "px";
      e.setAttribute("aria-hidden", "true");
      keysEl.appendChild(e);
    }
  }

  function focusNow(midis, smooth) {
    const W = scroller.clientWidth;
    if (!W || !midis.length) return;
    const xs = midis.filter((m) => els.has(m)).map(centerX);
    if (!xs.length) return;
    const xmin = Math.min(...xs), xmax = Math.max(...xs), margin = ww * 1.5;
    const sl = scroller.scrollLeft;
    if (xmin - margin >= sl && xmax + margin <= sl + W) return; // ya se ve con aire a los lados
    let target = (xmin + xmax) / 2 - W / 2;
    if (xmax - xmin + 2 * margin > W) target = xs.slice().sort((a, b) => a - b)[Math.floor(xs.length / 2)] - W / 2; // no entran todas: centro en la nota del medio
    target = Math.max(0, Math.min(nWhite * ww - W, target));
    scroller.scrollTo({ left: target, behavior: smooth ? "smooth" : "auto" });
  }

  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => layout()) : null;
  if (ro) ro.observe(scroller);

  keysEl.addEventListener("pointerdown", (e) => {
    if (!interactive) return;
    const k = e.target.closest("[data-midi]"); if (!k) return;
    const m = +k.dataset.midi;
    k.classList.add("down");
    const up = () => { k.classList.remove("down"); k.removeEventListener("pointerup", up); k.removeEventListener("pointerleave", up); k.removeEventListener("pointercancel", up); };
    k.addEventListener("pointerup", up); k.addEventListener("pointerleave", up); k.addEventListener("pointercancel", up);
    onKey(m);
  });

  build();

  return {
    setRange(lo, hi) {
      let l = Math.max(0, Math.min(lo, hi)), h = Math.min(127, Math.max(lo, hi));
      if (isBlack(l)) l--; if (isBlack(h)) h++;
      if (l === low && h === high && els.size) return;
      low = l; high = h; delete scroller.dataset.init; build();
    },
    setTargets(list) {
      targets = new Map();
      for (const t of list || []) if (t && Number.isFinite(t.midi)) targets.set(t.midi, { hand: t.hand === "lh" ? "lh" : "rh", done: !!t.done, label: typeof t.label === "string" ? t.label : "" });
      paint();
    },
    flash(midi, kind) {
      if (kind === "bad") { badMidi = midi; paint(); return; }
      okSet.add(midi); clearTimeout(okTimers.get(midi));
      okTimers.set(midi, setTimeout(() => { okSet.delete(midi); okTimers.delete(midi); paint(); }, 450));
      if (badMidi === midi) badMidi = null;
      paint();
    },
    setHint(h) {
      hint = h && Number.isFinite(h.fromMidi) && Number.isFinite(h.toMidi) ? { fromMidi: h.fromMidi, toMidi: h.toMidi } : null;
      if (hint) badMidi = hint.fromMidi; else badMidi = null;
      paint(); drawArrow();
    },
    /** Etiquetas entre teclas: [{fromMidi, toMidi, text:"T"|"S"}]. Lista vacía las quita. */
    setSteps(list) {
      stepList = (list || []).filter((x) => x && Number.isFinite(x.fromMidi) && Number.isFinite(x.toMidi));
      drawSteps();
    },
    setInteractive(v) { interactive = !!v; container.classList.toggle("interactive", interactive); },
    /** Lleva a la vista las teclas dadas (sólo se mueve si no se ven con margen). */
    focus(midis) { const l = (midis || []).filter(Number.isFinite); if (!l.length) return; if (!scroller.clientWidth) pendingFocus = l; else focusNow(l, true); },
    get scroller() { return scroller; },
    destroy() { if (ro) ro.disconnect(); okTimers.forEach(clearTimeout); container.innerHTML = ""; container.classList.remove("pk", "interactive"); },
  };
}
