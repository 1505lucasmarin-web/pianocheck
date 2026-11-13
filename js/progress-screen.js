// Pantalla de progreso de una partitura: evolución, comparación de dos tomas, piano-roll, escucha y lista de tomas.
// El DOM vive acá; la lógica pura está en progress.js. Práctica, reproducción, confirmación y el acceso a la base llegan
// como dependencias desde app.js (así no se duplica nada de lo que ya hacen).
import { buildSteps } from "./model.js";
import { takeMetrics } from "./takes.js";
import { formatDuration } from "./practice-time.js";
import * as P from "./progress.js";

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ic = (name, cls = "") => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const byAtDesc = (a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0);
const FILTER_LBL = { hands: "Mano", rangeKey: "Pasaje", mode: "Modo" };
const VERD_ES = { mejor: "mejor", igual: "igual", peor: "peor" };
const errTxt = (n) => `${n} ${P.plural(n, "error", "errores")}`;

/**
 * Crea la pantalla. deps:
 *  loadStore(): promesa del módulo store.js · resolveScore(id): partitura lista para practicar
 *  startPractice(score, opts) · playTake(take, {onEnd, tailMs}) · stopPlay() · confirm({title,text,yes}) · toast(msg, ms)
 */
export function createProgressScreen({ loadStore, resolveScore, startPractice, playTake, stopPlay, confirm, toast }) {
  const S = {
    id: null, from: "library", score: null, takes: [], groups: [], g: null, a: null, b: null, m: null,
    metric: "accuracy", note: "", cmp: null, evoPts: [], practiceSec: 0, days: 0,
    stepsBy: {}, mCache: new Map(), audioUrls: new Map(), altToken: 0, loadToken: 0,
  };
  const now = () => Date.now();
  const stepsOf = (hands) => (S.stepsBy[hands] ||= buildSteps(S.score, hands));
  const mOf = (t) => { let m = S.mCache.get(t.id); if (!m) { m = takeMetrics(t, stepsOf(t.hands)); S.mCache.set(t.id, m); } return m; };
  const accOf = (t) => mOf(t).accuracy;
  const byId = (id) => S.takes.find((t) => t.id === id) || null;
  const groupTakes = () => (S.g ? S.g.takes : []);
  const main = $("progress-main");

  /* ---- ciclo de vida ---- */

  /** Abre la pantalla para una partitura. `from` es la pantalla de origen (para «Volver»). */
  async function open(id, from) {
    leave();
    Object.assign(S, { id, from: ["result", "mylib", "library"].includes(from) ? from : "library", score: null, takes: [], groups: [], g: null, a: null, b: null, m: null, note: "", cmp: null, stepsBy: {}, mCache: new Map() });
    $("progress-title").textContent = "Progreso";
    await load();
  }
  /** Detiene reproducciones y cancela alternancias en curso. */
  function leave() {
    S.altToken++;
    stopPlay();
    for (const u of S.audioUrls.values()) URL.revokeObjectURL(u);
    S.audioUrls.clear();
  }
  /** Vuelve a leer las tomas de la partitura abierta (después de borrar o marcar favoritas). */
  async function load() {
    const token = ++S.loadToken, id = S.id;
    let score = null, takes = [], practiceSec = 0, days = 0;
    try {
      score = await resolveScore(id);
      const st = await loadStore();
      takes = (await st.listTakes(id)) || [];
      practiceSec = await st.practiceSecondsOf(id);
      days = P.practiceDaysOf(await st.getPracticeLog(), id, takes);
    } catch (e) {
      if (token === S.loadToken) { $("pg-body").hidden = true; $("pg-filters").innerHTML = ""; $("pg-stats").textContent = ""; $("pg-empty").hidden = false; $("pg-empty").innerHTML = `<p>No se pudo abrir el progreso: ${esc(e.message)}</p>`; }
      return;
    }
    if (token !== S.loadToken || id !== S.id) return;
    const prevKey = S.g ? S.g.key : null;
    Object.assign(S, { score, takes, practiceSec, days, stepsBy: {}, mCache: new Map() });
    $("progress-title").textContent = score.title || "Progreso";
    S.groups = P.groupsOf(takes);
    const keep = prevKey ? S.groups.find((g) => g.key === prevKey) : null;
    setGroup(keep || P.resolveGroup(S.groups), !keep);
    renderAll();
  }
  /** Fija el grupo de tomas equivalentes; si `resetPair`, elige A y B por defecto. */
  function setGroup(g, resetPair = true) {
    S.g = g || null;
    if (!S.g) { S.a = S.b = null; return; }
    const ids = new Set(S.g.takes.map((t) => t.id));
    if (resetPair) S.m = null;
    if (resetPair || !ids.has(S.a) || !ids.has(S.b) || S.a === S.b) {
      const d = P.defaultPair(S.g.takes, { accOf });
      if (d) { S.a = d.a; S.b = d.b; }
      else { S.a = S.g.takes.length ? S.g.takes[S.g.takes.length - 1].id : null; S.b = null; }   // una sola toma: se muestran sus métricas
    }
  }

  /* ---- render ---- */

  function renderAll() {
    const empty = !S.takes.length;
    $("pg-empty").hidden = !empty;
    $("pg-body").hidden = empty;
    $("pg-filters").hidden = empty;
    renderStats();
    $("pg-note").hidden = !S.note || empty;
    $("pg-note").textContent = S.note;
    if (empty) {
      $("pg-empty").innerHTML = `<p>Todavía no hay tomas de esta pieza. Practicala y volvé acá.</p><div class="row wrap"><button class="btn primary big" type="button" data-pg="practice">${ic("hand", "sm")}Practicar esta pieza</button></div>`;
      $("pg-filters").innerHTML = "";
      return;
    }
    renderFilters();
    renderEvo();
    renderCmp();
    renderRoll();
    renderTakes();
  }
  function renderStats() {
    const n = S.takes.length;
    const t = S.practiceSec > 0 ? formatDuration(S.practiceSec) : "sin registrar";
    $("pg-stats").innerHTML = `<span>Tiempo practicado <b>${esc(t)}</b></span><span><b>${n}</b> ${n === 1 ? "toma" : "tomas"}</span><span><b>${S.days}</b> ${S.days === 1 ? "día practicado" : "días practicados"}</span>`;
  }
  function renderFilters() {
    const g = S.g;
    if (!g) { $("pg-filters").innerHTML = ""; return; }
    const seg = (field, opts) => `<div class="seg pg-seg" role="group" aria-label="${FILTER_LBL[field]}">${opts.map((o) => {
      const on = o.value === g[field];
      return `<button type="button" data-pg="filter" data-f="${field}" data-v="${esc(o.value)}" class="${on ? "on" : ""}" aria-pressed="${on}">${esc(o.label)} <small>${o.count}</small></button>`;
    }).join("")}</div>`;
    const ranges = P.filterOptions(S.groups, "rangeKey");
    const rangeSel = `<label class="pg-f pg-range"><span class="pg-fl">${FILTER_LBL.rangeKey}</span><select data-pg="range" aria-label="Pasaje">${ranges.map((o) => `<option value="${esc(o.value)}" ${o.value === g.rangeKey ? "selected" : ""}>${esc(o.label)} (${o.count})</option>`).join("")}</select></label>`;
    $("pg-filters").innerHTML = `<div class="pg-f"><span class="pg-fl" aria-hidden="true">${FILTER_LBL.hands}</span>${seg("hands", P.filterOptions(S.groups, "hands"))}</div>${rangeSel}<div class="pg-f"><span class="pg-fl" aria-hidden="true">${FILTER_LBL.mode}</span>${seg("mode", P.filterOptions(S.groups, "mode"))}</div>`;
  }

  function renderEvo() {
    const g = S.g, box = $("pg-evo");
    const def = P.EVO_METRICS[S.metric];
    $("pg-metric").innerHTML = Object.keys(P.EVO_METRICS).map((k) => `<button type="button" data-pg="metric" data-v="${k}" class="${k === S.metric ? "on" : ""}" aria-pressed="${k === S.metric}">${esc(P.EVO_METRICS[k].label)}</button>`).join("");
    const pts = P.evolutionPoints(g.takes, stepsOf(g.hands));
    const withVal = pts.filter((p) => Number.isFinite(p[S.metric]));
    let html = "";
    S.evoPts = [];
    if (!withVal.length) {
      html = `<p class="pg-empty-line">Todavía no hay ${esc(def.label.toLowerCase())} para medir: hace falta una toma con suficientes notas.</p>`;
    } else {
      const width = Math.max(260, Math.floor(box.clientWidth || 520));
      const { svg, pts: dots } = P.evolutionSvg(pts, S.metric, { width, height: width < 520 ? 220 : 260 });
      S.evoPts = dots;
      html = svg;
      if (withVal.length === 1) html += `<p class="pg-one">Volvé mañana para ver tu evolución.</p>`;
    }
    if (g.takes.every((t) => t.source === "mic")) html += `<p class="hint">Con micrófono no se miden duraciones ni pulso con precisión.</p>`;
    box.innerHTML = html;
    $("pg-evo-tip").textContent = withVal.length ? "Tocá o enfocá un punto para ver su valor." : "";
    const row = (p) => `<tr><th scope="row">${esc(P.relDay(p.day, now()))}</th><td>${p.accuracy ?? "—"}</td><td>${p.tempoBpm ?? "—"}</td><td>${p.evenness ?? "—"}</td><td>${p.takes}</td></tr>`;
    $("pg-evo-table").innerHTML = pts.length ? `<table class="pg-table"><caption>Mejor valor de cada día</caption><thead><tr><th scope="col">Día</th><th scope="col">Precisión (%)</th><th scope="col">Tempo (bpm)</th><th scope="col">Pulso (de 100)</th><th scope="col">Tomas</th></tr></thead><tbody>${pts.map(row).join("")}</tbody></table>` : `<p class="hint">Sin datos todavía.</p>`;
  }
  function showTip(i) {
    const p = S.evoPts.find((x) => x.i === i);
    if (p) $("pg-evo-tip").textContent = p.text;
  }

  function renderCmp() {
    const g = S.g, takes = g.takes;
    const ta = byId(S.a), tb = byId(S.b);
    const opts = (sel) => `<option value="" ${sel ? "" : "selected"} disabled>Elegí una toma</option>` + takes.map((t) => `<option value="${esc(t.id)}" ${t.id === sel ? "selected" : ""}>${esc(P.takeLabel(t, mOf(t), now()))}</option>`).join("");
    $("pg-pick").innerHTML = `<label class="pg-pick-l"><span>Antes (A)</span><select data-pg="selA">${opts(S.a)}</select></label><label class="pg-pick-l"><span>Ahora (B)</span><select data-pg="selB">${opts(S.b)}</select></label>`;
    const few = takes.length < 2;
    $("pg-presets").innerHTML = [["ayer", "Ayer vs. hoy"], ["primera", "Primera vs. última"], ["mejor", "Mejor vs. última"]]
      .map(([k, t]) => `<button type="button" class="btn" data-pg="preset" data-v="${k}" ${few ? "disabled" : ""}>${t}</button>`).join("");
    const diffs = $("pg-diffs"), mstrip = $("pg-mstrip"), detail = $("pg-mdetail");
    S.cmp = null;
    if (few) {
      $("pg-headline").textContent = "Hacé otra toma para comparar.";
      $("pg-headline").className = "pg-headline pg-quiet";
      diffs.innerHTML = ta ? singleCards(ta) : "";
      mstrip.innerHTML = ""; detail.innerHTML = "";
      return;
    }
    if (!ta || !tb || ta.id === tb.id) {
      $("pg-headline").textContent = "Elegí dos tomas distintas para comparar.";
      $("pg-headline").className = "pg-headline pg-quiet";
      diffs.innerHTML = ""; mstrip.innerHTML = ""; detail.innerHTML = "";
      return;
    }
    const cmp = P.compareWith(ta, tb, stepsOf(g.hands), now());
    if (!cmp.comparable) {
      $("pg-headline").textContent = cmp.reason;
      $("pg-headline").className = "pg-headline pg-quiet";
      diffs.innerHTML = ""; mstrip.innerHTML = ""; detail.innerHTML = "";
      return;
    }
    S.cmp = cmp;
    $("pg-headline").textContent = cmp.headline;
    $("pg-headline").className = "pg-headline";
    const cardHtml = (r) => `<div class="pg-diff ${r.cls}"><span class="pg-dl">${esc(r.label)}${r.note ? ` <small>(${esc(r.note)})</small>` : ""}</span><span class="pg-dv"><span>${esc(r.textA)}</span><span class="pg-arrow" aria-hidden="true">→</span><b>${esc(r.textB)}</b></span><span class="pg-sym"><span aria-hidden="true">${r.sym}</span> ${r.word}${r.lessIsBetter && r.cls !== "na" ? ` <small>menos es mejor</small>` : ""}</span></div>`;
    diffs.innerHTML = P.diffRows(cmp).map(cardHtml).join("") + (ta.source === "mic" || tb.source === "mic" ? `<p class="hint pg-wide">Con micrófono no se miden duraciones ni pulso con precisión.</p>` : "");
    const { antes, ahora } = P.headlineOf(ta, tb, now());
    const rows = P.measureRows(cmp);
    mstrip.innerHTML = rows.map((r) => `<button type="button" class="pg-mb ${r.cls}" data-pg="measure" data-v="${r.measure}" aria-pressed="${S.m === r.measure}" aria-label="Compás ${r.measure + 1}: ${VERD_ES[r.verdict]}. ${antes}: ${errTxt(r.errorsA)}. ${ahora}: ${errTxt(r.errorsB)}."><b>${r.measure + 1}</b><span aria-hidden="true">${r.sym} ${VERD_ES[r.verdict]}</span></button>`).join("");
    const sel = S.m != null ? rows.find((r) => r.measure === S.m) : null;
    detail.innerHTML = sel
      ? `<p class="pg-mtext">${esc(P.measureDetail(sel, antes, ahora))}</p><div class="row wrap"><button type="button" class="btn primary" data-pg="practice-m">${ic("hand", "sm")}Practicar este compás</button></div>`
      : `<p class="hint">Tocá un compás para ver el detalle.</p>`;
  }
  /** Tarjetas de métricas de una sola toma (cuando todavía no hay con qué comparar). */
  function singleCards(t) {
    const m = mOf(t);
    const items = [["Precisión", `${m.accuracy} %`], ["Tempo efectivo", m.tempoBpm != null ? `♩ ${m.tempoBpm}` : "—"], ["Pulso parejo", m.evenness != null ? `${m.evenness} /100` : "—"], ["Titubeos", String(m.hesitations)], ["Notas erradas", String(m.wrongNotes)], ["Duración", P.fmtSec(m.activeSec)]];
    return items.map(([l, v]) => `<div class="pg-diff na"><span class="pg-dl">${esc(l)}</span><span class="pg-dv"><b>${esc(v)}</b></span></div>`).join("");
  }

  function renderRoll() {
    const g = S.g, ta = byId(S.a), tb = byId(S.b), box = $("pg-roll"), listen = $("pg-listen");
    const audioFigs = [[ta, "A"], [tb, "B"]].filter(([t]) => t && t.hasAudio && groupTakes().length > 1)
      .map(([t, w]) => `<figure class="pg-audio"><figcaption>Audio grabado · ${w}: ${esc(P.takeLabel(t, mOf(t), now()))}</figcaption><audio controls preload="metadata" data-aid="${esc(t.id)}" aria-label="Audio grabado de la toma ${w}"></audio></figure>`).join("");
    const canCmp = groupTakes().length > 1 && ta && tb && ta.id !== tb.id;
    if (!canCmp) {
      box.innerHTML = `<p class="hint">${groupTakes().length > 1 ? "Elegí dos tomas distintas para verlas una sobre la otra." : "Con una sola toma no hay dos voces para superponer: abajo podés escucharla."}</p>`;
    } else {
      const steps = stepsOf(g.hands);
      const la = P.rollLayout(ta, steps), lb = P.rollLayout(tb, steps);
      const { antes, ahora } = P.headlineOf(ta, tb, now());
      const colW = window.innerWidth < 600 ? 34 : 42;
      const svg = P.rollSvg([{ key: "a", label: `A · ${P.relDay(ta.day, now())} ${P.hhmm(ta.at)}`, layout: la }, { key: "b", label: `B · ${P.relDay(tb.day, now())} ${P.hhmm(tb.at)}`, layout: lb }], { colW, laneH: 104, selected: S.m, label: `Piano-roll: ${antes} contra ${ahora}, ${la.notes.length} y ${lb.notes.length} notas` });
      box.innerHTML = `<div class="pg-roll-scroll" tabindex="0" role="region" aria-label="Piano-roll desplazable. Deslizá con el dedo para ver toda la pieza.">${svg}</div>
        <ul class="pg-legend"><li><i class="sw sw-a" aria-hidden="true"></i>A: ${esc(antes)}, ${la.notes.length} notas</li><li><i class="sw sw-b" aria-hidden="true"></i>B: ${esc(ahora)}, ${lb.notes.length} notas</li><li><i class="sw sw-w" aria-hidden="true"></i>Nota errada</li><li>Tocá un compás para elegirlo</li></ul>`;
    }
    const canPlayB = tb && groupTakes().length > 1;
    listen.innerHTML = `<div class="row wrap pg-listen-btns">
        ${ta ? `<button type="button" class="btn" data-pg="play" data-v="a">${ic("play", "sm")}Reproducir A</button>` : ""}
        ${canPlayB ? `<button type="button" class="btn" data-pg="play" data-v="b">${ic("play", "sm")}Reproducir B</button>` : ""}
        ${canCmp ? `<button type="button" class="btn primary" data-pg="alt" ${S.m == null ? "disabled" : ""}>${ic("loop", "sm")}Alternar A/B${S.m != null ? ` en el compás ${S.m + 1}` : ""}</button>` : ""}
      </div>
      ${canCmp && S.m == null ? `<p class="hint">Para alternar, elegí un compás: tocalo en el piano-roll o en la tira de arriba.</p>` : ""}
      ${audioFigs ? `<div class="pg-audios">${audioFigs}</div>` : ""}`;
    loadAudios();
  }
  /** Carga los audios grabados de A y B (si los tienen) en sus <audio>. */
  async function loadAudios() {
    const els = [...document.querySelectorAll("#pg-listen audio[data-aid]")];
    for (const el of els) {
      const id = el.dataset.aid;
      try {
        if (!S.audioUrls.has(id)) {
          const a = await (await loadStore()).getTakeAudio(id);
          if (!a || !a.blob) continue;
          S.audioUrls.set(id, URL.createObjectURL(a.blob));
        }
        el.src = S.audioUrls.get(id);
      } catch (e) { el.replaceWith(Object.assign(document.createElement("p"), { className: "hint", textContent: "No se pudo leer el audio." })); }
    }
  }

  function renderTakes() {
    const box = $("pg-takes");
    const list = S.takes.slice().sort(byAtDesc);
    const days = [...new Set(list.map((t) => t.day))];
    box.innerHTML = days.map((day) => {
      const items = list.filter((t) => t.day === day).map((t) => {
        const m = mOf(t), when = `${P.relDay(t.day, now())} ${P.hhmm(t.at)}`;
        const tags = [P.MODE_ES[t.mode] || t.mode, P.HANDS_ES[t.hands] || t.hands, P.rangeLabel(t.range), t.loop ? "En bucle" : "", P.SOURCE_ES[t.source] || t.source].filter(Boolean).map((x) => `<span class="tag">${esc(x)}</span>`).join("");
        const nums = [`Precisión <b>${m.accuracy} %</b>`, `Tempo <b>${m.tempoBpm ?? "—"}</b>`, `Pulso <b>${m.evenness ?? "—"}/100</b>`, `Titubeos <b>${m.hesitations}</b>`, `Errores <b>${m.wrongNotes}</b>`, `Tiempo activo <b>${P.fmtSec(m.activeSec)}</b>`].map((x) => `<span>${x}</span>`).join("");
        return `<li class="card take-card pg-take${t.keep ? " is-fav" : ""}" data-id="${esc(t.id)}">
          <div class="take-top"><b>${esc(when)}</b>${t.keep ? `<span class="tag fav-tag">Favorita</span>` : ""}${t.hasAudio ? `<span class="tag audio-tag">${ic("wave", "sm")}Con audio</span>` : ""}</div>
          <div class="pg-tags">${tags}</div>
          <div class="take-nums">${nums}</div>
          ${t.source === "mic" ? `<p class="hint">Micrófono: no se miden duraciones ni pulso con precisión.</p>` : ""}
          <div class="row wrap pg-take-acts">
            <button type="button" class="btn primary" data-pg="play-take" data-id="${esc(t.id)}" aria-label="Reproducir la toma de ${esc(when)}">${ic("play", "sm")}Reproducir</button>
            <button type="button" class="btn" data-pg="keep" data-id="${esc(t.id)}" aria-pressed="${!!t.keep}" aria-label="${t.keep ? "Quitar de favoritas" : "Marcar como favorita"}: toma de ${esc(when)}">${t.keep ? "★ Favorita" : "☆ Marcar favorita"}</button>
            ${t.hasAudio || t.syncAudio ? `<button type="button" class="btn" data-pg="sync-audio" data-id="${esc(t.id)}" aria-pressed="${!!t.syncAudio}" aria-label="${t.syncAudio ? "Dejar de sincronizar el audio" : "Sincronizar el audio con mi cuenta"}: toma de ${esc(when)}">${t.syncAudio ? "☁ Audio sincronizado" : "☁ Sincronizar audio"}</button>` : ""}
            <button type="button" class="btn danger" data-pg="del" data-id="${esc(t.id)}" aria-label="Borrar la toma de ${esc(when)}">${ic("trash", "sm")}Borrar</button>
          </div>
        </li>`;
      }).join("");
      return `<section class="pg-day"><h4>${esc(P.relDay(day, now()))} <small>${esc(P.shortDate(day))}</small></h4><ul class="take-list">${items}</ul></section>`;
    }).join("");
  }

  /* ---- acciones ---- */

  function filterChange(field, value) {
    const g = S.g;
    const want = { hands: g.hands, rangeKey: g.rangeKey, mode: g.mode };
    want[field] = value;
    const next = P.resolveGroup(S.groups, want, field);
    if (!next) return;
    S.note = next.hands !== want.hands || next.rangeKey !== want.rangeKey || next.mode !== want.mode ? `Con esa combinación no hay tomas: se muestran ${P.groupLabel(next)}.` : "";
    setGroup(next, true);
    renderAll();
  }
  function pick(which, id) {
    if (which === "a") S.a = id; else S.b = id;
    renderCmp(); renderRoll();
  }
  function applyPreset(kind) {
    const r = P.presetPair(kind, groupTakes(), { now: now(), accOf });
    if (!r.ok) { toast(r.reason, 4200); return; }
    S.a = r.a; S.b = r.b;
    renderCmp(); renderRoll();
  }
  function selectMeasure(m) {
    S.m = S.m === m ? null : m;
    renderCmp(); renderRoll();
  }
  async function practiceFrom(hands, mode, passage) {
    leave();
    const sc = await resolveScore(S.id);
    startPractice(sc, { hands, mode, ...(passage ? { passage } : {}) });
  }
  function playWhole(which) {
    const t = byId(which === "a" ? S.a : S.b);
    if (!t) return;
    S.altToken++;
    playTake(t);
  }
  function alternate() {
    if (S.m == null || !S.g) return;
    const ta = byId(S.a), tb = byId(S.b), steps = stepsOf(S.g.hands);
    const sa = ta && P.measureSegment(ta, steps, S.m), sb = tb && P.measureSegment(tb, steps, S.m);
    if (!sa || !sb) { toast("Alguna de las dos tomas no tiene tocado ese compás.", 3800); return; }
    const token = ++S.altToken;
    playTake({ id: "alt-a", events: sa.events }, { tailMs: 400, onEnd: () => { if (token === S.altToken) playTake({ id: "alt-b", events: sb.events }, { tailMs: 400 }); } });
  }
  async function toggleSyncAudio(id) {
    const st = await loadStore(), t = byId(id);
    if (!t) return;
    await st.setTakeSyncAudio(id, !t.syncAudio);
    toast(t.syncAudio ? "El audio ya no se sube a tu cuenta (en los otros dispositivos puede quedar la copia)." : "El audio se subirá a tu cuenta y llegará a tus otros dispositivos (requiere iniciar sesión en Ajustes).", 4200);
    await load();
  }
  async function toggleKeep(id) {
    const st = await loadStore(), t = byId(id);
    if (!t) return;
    await st.saveTake({ ...t, keep: !t.keep });
    toast(t.keep ? "Ya no es favorita." : "Marcada como favorita: no se borra sola.", 3000);
    await load();
  }
  async function removeTake(id) {
    const ok = await confirm({ title: "¿Borrar esta toma?", text: "Se borra junto con su audio, si lo tiene. No se puede deshacer.", yes: "Borrar" });
    if (!ok) return;
    const st = await loadStore();
    await st.deleteTakes([id]);
    if (S.a === id) S.a = null;
    if (S.b === id) S.b = null;
    toast("Toma borrada.", 2400);
    await load();
  }

  const ACTIONS = {
    filter: (b) => filterChange(b.dataset.f, b.dataset.v),
    metric: (b) => { S.metric = b.dataset.v; renderEvo(); },
    preset: (b) => applyPreset(b.dataset.v),
    measure: (b) => selectMeasure(Number(b.dataset.v)),
    "practice-m": () => practiceFrom(S.g.hands, S.g.mode, { from: S.m, to: S.m, loop: true }),
    play: (b) => playWhole(b.dataset.v),
    alt: () => alternate(),
    "play-take": (b) => { const t = byId(b.dataset.id); if (t) { S.altToken++; playTake(t); } },
    keep: (b) => toggleKeep(b.dataset.id),
    "sync-audio": (b) => toggleSyncAudio(b.dataset.id),
    del: (b) => removeTake(b.dataset.id),
    practice: () => practiceFrom("both", "espera", null),
  };
  const keyOf = (b) => `${b.dataset.pg}|${b.dataset.v || b.dataset.id || b.dataset.f || ""}`;

  main.addEventListener("click", (e) => {
    const dot = e.target.closest(".pg-pt");
    if (dot) { showTip(Number(dot.dataset.i)); return; }
    const roll = e.target.closest("#pg-roll [data-m]");
    if (roll) { selectMeasure(Number(roll.dataset.m)); return; }
    const b = e.target.closest("button[data-pg]");
    if (!b || b.disabled || !ACTIONS[b.dataset.pg]) return;
    const key = keyOf(b);
    const r = ACTIONS[b.dataset.pg](b);
    // las acciones re-dibujan: devolvemos el foco al mismo control cuando vuelve a existir
    Promise.resolve(r).then(() => {
      const again = [...main.querySelectorAll("button[data-pg]")].find((x) => keyOf(x) === key);
      if (again && document.activeElement === document.body) again.focus({ preventScroll: true });
    }).catch(() => {});
  });
  main.addEventListener("focusin", (e) => { const dot = e.target.closest(".pg-pt"); if (dot) showTip(Number(dot.dataset.i)); });
  main.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.pg === "range") filterChange("rangeKey", t.value);
    else if (t.dataset.pg === "selA" && t.value) pick("a", t.value);
    else if (t.dataset.pg === "selB" && t.value) pick("b", t.value);
  });
  let rz = null;
  window.addEventListener("resize", () => {
    clearTimeout(rz);
    rz = setTimeout(() => { if (!$("screen-progress").hidden && S.g) { renderEvo(); renderRoll(); } }, 160);
  });

  /** Estado para los ganchos de verificación (?debug). */
  function debug() {
    return {
      id: S.id, from: S.from, takes: S.takes.length, groups: S.groups.map((g) => ({ key: g.key, n: g.count })),
      group: S.g ? S.g.key : null, a: S.a, b: S.b, m: S.m, metric: S.metric, note: S.note,
      cmp: S.cmp ? { headline: S.cmp.headline, deltas: S.cmp.deltas, rows: P.diffRows(S.cmp).map((r) => ({ key: r.key, a: r.textA, b: r.textB, sym: r.sym, word: r.word })), measures: P.measureRows(S.cmp).map((r) => ({ m: r.measure, verdict: r.verdict, errorsA: r.errorsA, errorsB: r.errorsB, secondsA: r.secondsA, secondsB: r.secondsB })) } : null,
      evoPts: S.evoPts.map((p) => ({ day: p.day, value: p.value, text: p.text })),
      rollNotes: [...document.querySelectorAll("#pg-roll .pg-n-a")].length, rollNotesB: [...document.querySelectorAll("#pg-roll .pg-n-b")].length,
      rollWrong: [...document.querySelectorAll("#pg-roll .pg-n.wrong")].length,
      mstrip: [...document.querySelectorAll("#pg-mstrip .pg-mb")].map((b) => b.textContent.trim()),
      takeIds: S.takes.map((t) => t.id),
      practiceSec: S.practiceSec, days: S.days,
    };
  }

  return { open, leave, debug, reload: load, get isOpen() { return !$("screen-progress").hidden; } };
}
