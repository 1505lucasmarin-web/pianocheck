import { test } from "node:test";
import assert from "node:assert/strict";
import { buildTake, compareTakes, takesComparable } from "../js/takes.js";
import * as P from "../js/progress.js";

// Partitura sintética: 8 negras en 2 compases de 4/4 (paso i en la negra i, compás floor(i/4)).
const steps = Array.from({ length: 8 }, (_, i) => ({ i, t: i, measure: Math.floor(i / 4), midi: [60 + i] }));
const NOW = Date.parse("2026-11-13T12:00:00");   // "hoy" = 13 nov (hora local del runner)

/** Toma sintética a un tempo fijo, con errores (wrongAt: {paso: notas erradas}) y pasos opcionales (sub). */
function take({ day, hour = 10, msPerBeat = 1000, wrongAt = {}, cleanAt = [], hands = "both", range = null, mode = "espera", sub = null, source = "midi", id = null, scoreId = "p1", extra = {} } = {}) {
  let t = 0;
  const idx = sub || steps.map((s) => s.i);
  const st = [], ev = [];
  let carry = 0;
  for (const i of idx) {
    t += msPerBeat + (extra[i] || 0);
    // como en la práctica real: la nota errada se toca ANTES de la correcta que completa el paso
    if (wrongAt[i]) { ev.push([Math.round(t - 100), 70, 80, 100]); carry += wrongAt[i]; }
    ev.push([Math.round(t), 60 + i, 80, Math.round(msPerBeat * 0.8)]);
    st.push({ i, measure: Math.floor(i / 4), tOn: Math.round(t), clean: !wrongAt[i] && !cleanAt.includes(i), wrong: carry });
    carry = 0;
  }
  const at = `${day}T${String(hour).padStart(2, "0")}:10:00`;
  const raw = { id: id || `${day}-${hour}-${Math.random().toString(36).slice(2, 6)}`, scoreId, at: new Date(at).toISOString(), day, mode, hands, range, bpm: Math.round(60000 / msPerBeat), source, events: ev, steps: st, summary: {} };
  return buildTake(raw);
}

test("fechas relativas: Hoy, Ayer y fecha corta sin punto", () => {
  assert.equal(P.relDay("2026-11-13", NOW), "Hoy");
  assert.equal(P.relDay("2026-11-12", NOW), "Ayer");
  assert.equal(P.relDay("2026-11-11", NOW), "11 nov");
  assert.equal(P.shortDate("2026-11-12"), "12 nov");
  assert.equal(P.shortDate("nope"), "");
  assert.equal(P.relDayPhrase("2026-11-12", NOW), "ayer");
  assert.equal(P.relDayPhrase("2026-10-02", NOW), "el 2 oct");
});

test("etiqueta de toma: «Ayer 21:10 · 90 % · ♩ 58»", () => {
  const t = take({ day: "2026-11-12", hour: 21 });
  const label = P.takeLabel(t, { accuracy: 90, tempoBpm: 58 }, NOW);
  assert.match(label, /^Ayer 21:10 · 90 % · ♩ 58$/);
  assert.equal(P.takeLabel(t, { accuracy: 90, tempoBpm: null }, NOW).endsWith("♩ —"), true);
});

test("un solo día: el par por defecto son las dos últimas y no hay comparación «ayer vs. hoy»", () => {
  const a = take({ day: "2026-11-13", hour: 9 }), b = take({ day: "2026-11-13", hour: 11 }), c = take({ day: "2026-11-13", hour: 15 });
  const d = P.defaultPair([c, a, b]);
  assert.deepEqual([d.a, d.b], [b.id, c.id]);
  assert.equal(d.rule, "ultimas-dos");
  const pr = P.presetPair("ayer", [a, b, c], { now: NOW });
  assert.equal(pr.ok, false);
  assert.match(pr.reason, /ayer/);
  assert.equal(P.defaultPair([a]), null);   // con una sola toma no hay par
});

test("ayer + hoy: A = la mejor de ayer, B = la última de hoy", () => {
  const y1 = take({ day: "2026-11-12", hour: 9, wrongAt: { 2: 2 } });            // 7/8 limpios
  const y2 = take({ day: "2026-11-12", hour: 18, cleanAt: [1] });                // peor: 6/8 limpios
  const h1 = take({ day: "2026-11-13", hour: 10, msPerBeat: 1200 });
  const h2 = take({ day: "2026-11-13", hour: 17, msPerBeat: 900 });
  const all = [y1, y2, h1, h2];
  const accOf = (t) => (t === y1 ? 90 : t === y2 ? 75 : 100);   // accuracy de prueba
  const d = P.defaultPair(all, { accOf });
  assert.equal(d.a, y1.id);
  assert.equal(d.b, h2.id);
  const pr = P.presetPair("ayer", all, { now: NOW, accOf });
  assert.deepEqual([pr.a, pr.b], [y1.id, h2.id]);
});

test("días salteados: el par sale del último día con práctica y del anterior, no del calendario", () => {
  const a = take({ day: "2026-11-09", hour: 10, msPerBeat: 1100 });
  const b = take({ day: "2026-11-11", hour: 10, msPerBeat: 1000 });
  const c = take({ day: "2026-11-11", hour: 19, msPerBeat: 900 });
  const d = P.defaultPair([a, b, c], { accOf: () => 50 });
  assert.deepEqual([d.a, d.b], [a.id, c.id]);   // 12 y 13 sin tomas: el día anterior es el 9 y el último el 11
  // gráfico: los días se ubican por fecha, así que el hueco entre el 9 y el 11 es el doble que entre el 9 y el 10
  const pts = P.evolutionPoints([a, b, c], steps);
  assert.deepEqual(pts.map((p) => p.day), ["2026-11-09", "2026-11-11"]);
  const svg = P.evolutionSvg([{ day: "2026-11-09", label: "9 nov", accuracy: 60 }, { day: "2026-11-10", label: "10 nov", accuracy: 70 }, { day: "2026-11-11", label: "11 nov", accuracy: 80 }], "accuracy", { width: 500, height: 240 });
  const xs = svg.pts.map((p) => p.x);
  assert.ok(Math.abs((xs[1] - xs[0]) - (xs[2] - xs[1])) < 0.01, "10 nov queda en el medio exacto");
});

test("sin equivalentes: partituras, manos, pasajes o modos distintos no se comparan ni se agrupan", () => {
  const base = take({ day: "2026-11-13", hour: 9 });
  const rh = take({ day: "2026-11-13", hour: 10, hands: "rh" });
  const pulso = take({ day: "2026-11-13", hour: 11, mode: "pulso" });
  const pasaje = take({ day: "2026-11-13", hour: 12, range: { from: 0, to: 0 }, sub: [0, 1, 2, 3, 4] });
  const otra = take({ day: "2026-11-13", hour: 13, scoreId: "p2" });
  assert.equal(takesComparable(base, rh).ok, false);
  assert.equal(takesComparable(base, pulso).ok, false);
  assert.equal(takesComparable(base, pasaje).ok, false);
  assert.equal(takesComparable(base, otra).ok, false);
  assert.equal(compareTakes(base, rh, steps).comparable, false);
  const groups = P.groupsOf([base, rh, pulso, pasaje]);
  assert.equal(groups.length, 4);
  assert.equal(P.groupsOf([base]).length, 1);
  // el grupo por defecto es el de más tomas
  const many = [base, take({ day: "2026-11-12", hour: 9 }), rh];
  assert.equal(P.resolveGroup(P.groupsOf(many)).hands, "both");
  // dos tomas de manos distintas quedan en grupos distintos: ninguno tiene par que comparar
  assert.ok(P.groupsOf([base, rh]).every((g) => P.defaultPair(g.takes) === null));
});

test("filtros: cambiar un filtro elige el grupo más parecido y cuenta las tomas", () => {
  const ambas = [take({ day: "2026-11-12", hour: 9 }), take({ day: "2026-11-13", hour: 9 }), take({ day: "2026-11-13", hour: 10 })];
  const rh = take({ day: "2026-11-13", hour: 11, hands: "rh" });
  const groups = P.groupsOf([...ambas, rh]);
  const cur = P.resolveGroup(groups);
  assert.equal(cur.hands, "both");
  const next = P.resolveGroup(groups, { hands: "rh", rangeKey: cur.rangeKey, mode: cur.mode }, "hands");
  assert.equal(next.hands, "rh");
  const opts = P.filterOptions(groups, "hands");
  assert.deepEqual(opts.map((o) => [o.value, o.count]), [["both", 3], ["rh", 1]]);
});

test("menos es mejor: notas erradas, titubeos y duración bajan ▲; precisión y pulso suben ▲", () => {
  assert.equal(P.verdictOf("wrongNotes", 6, 3).sym, "▲");
  assert.equal(P.verdictOf("wrongNotes", 3, 6).sym, "▼");
  assert.equal(P.verdictOf("hesitations", 2, 0).word, "mejor");
  assert.equal(P.verdictOf("hesitations", 0, 2).word, "peor");
  assert.equal(P.verdictOf("activeSec", 120, 90).sym, "▲");
  assert.equal(P.verdictOf("activeSec", 90, 120).sym, "▼");
  assert.equal(P.verdictOf("accuracy", 90, 100).sym, "▲");
  assert.equal(P.verdictOf("evenness", 80, 60).sym, "▼");
  assert.equal(P.verdictOf("tempoBpm", 58, 66).sym, "▲");
  assert.equal(P.verdictOf("tempoBpm", 58, 58.2).sym, "=");
  assert.equal(P.verdictOf("wrongNotes", 3, 3).sym, "=");
  assert.equal(P.verdictOf("tempoBpm", null, 60).sym, "—");
});

test("titular y tarjetas de diferencia coinciden con compareTakes; el signo de «menos es mejor» es correcto", () => {
  const ayer = take({ day: "2026-11-12", hour: 21, wrongAt: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1 }, msPerBeat: 1000 });
  const hoy = take({ day: "2026-11-13", hour: 10, wrongAt: { 2: 1 }, msPerBeat: 920 });
  const cmp = P.compareWith(ayer, hoy, steps, NOW);
  assert.equal(cmp.comparable, true);
  assert.equal(cmp.headline, compareTakes(ayer, hoy, steps, { antes: "ayer", ahora: "hoy" }).headline);
  assert.match(cmp.headline, /^Hoy: .*que ayer\.$/);
  const rows = Object.fromEntries(P.diffRows(cmp).map((r) => [r.key, r]));
  assert.equal(rows.wrongNotes.a, cmp.metricsA.wrongNotes);
  assert.equal(rows.wrongNotes.b, cmp.metricsB.wrongNotes);
  assert.equal(rows.wrongNotes.sym, "▲");          // bajaron las notas erradas
  assert.equal(rows.wrongNotes.lessIsBetter, true);
  assert.equal(rows.tempoBpm.sym, "▲");            // más rápido
  assert.equal(rows.accuracy.textA, `${cmp.metricsA.accuracy} %`);
});

test("compás por compás: el compás con menos errores en la toma nueva es «mejor» y tiene su detalle", () => {
  const ayer = take({ day: "2026-11-12", hour: 21, wrongAt: { 4: 1, 5: 1, 6: 1 }, extra: { 5: 2000 } });   // compás 2 con 3 errores y pausa
  const hoy = take({ day: "2026-11-13", hour: 10, wrongAt: { 5: 1 } });
  const cmp = P.compareWith(ayer, hoy, steps, NOW);
  const rows = P.measureRows(cmp);
  const m2 = rows.find((r) => r.measure === 1);
  assert.equal(m2.cls, "better");
  assert.equal(m2.sym, "▲");
  assert.equal(m2.errorsA, 3);
  assert.equal(m2.errorsB, 1);
  const txt = P.measureDetail(m2, "ayer", "hoy");
  assert.match(txt, /^Compás 2: ayer 3 errores y \d+,\d s · hoy 1 error y \d+,\d s$/);
});

test("alineación por paso con toma parcial: sólo se llenan las columnas tocadas y las notas caen en su paso", () => {
  const partial = take({ day: "2026-11-13", hour: 10, sub: [0, 1, 2, 3], wrongAt: { 2: 1 } });   // se tocaron los 4 primeros pasos
  const lay = P.rollLayout(partial, steps);
  assert.equal(lay.cols, 8);
  assert.deepEqual([...lay.doneCols].sort((a, b) => a - b), [0, 1, 2, 3]);
  assert.equal(lay.notes.length, partial.events.length);
  assert.ok(lay.notes.every((n) => n.col <= 3), "ninguna nota cae en una columna sin tocar");
  // la nota errada del paso 2 queda en su columna y marcada
  const wrong = lay.notes.filter((n) => n.wrong);
  assert.equal(wrong.length, 1);
  assert.equal(wrong[0].col, 2);
  // la altura de cada nota coincide con el paso al que cae
  const okCol = lay.notes.filter((n) => !n.wrong);
  assert.ok(okCol.every((n) => n.midi === 60 + n.col));
  // medida: el primer compás empieza en la columna 0 y el segundo en la 4
  assert.deepEqual(lay.measureStarts, [{ measure: 0, col: 0 }, { measure: 1, col: 4 }]);
});

test("piano-roll: un rectángulo por nota de cada toma, con las notas erradas marcadas", () => {
  const a = take({ day: "2026-11-12", hour: 9, wrongAt: { 3: 2 } }), b = take({ day: "2026-11-13", hour: 9 });
  const la = P.rollLayout(a, steps), lb = P.rollLayout(b, steps);
  const svg = P.rollSvg([{ key: "a", label: "A", layout: la }, { key: "b", label: "B", layout: lb }], { selected: 1 });
  assert.equal((svg.match(/class="pg-n pg-n-a/g) || []).length, a.events.length);
  assert.equal((svg.match(/class="pg-n pg-n-b/g) || []).length, b.events.length);
  assert.equal((svg.match(/ wrong"/g) || []).length, 1);   // una nota errada en la toma a (compás 1)
  assert.match(svg, /class="pg-sel"/);
});

test("segmento de un compás para «Alternar A/B» y tramos fuera de rango", () => {
  const t = take({ day: "2026-11-13", hour: 10 });
  const seg = P.measureSegment(t, steps, 1);     // compás 2 = pasos 4 a 7
  assert.ok(seg && seg.events.length > 0);
  assert.equal(seg.events[0][0] >= 0, true);
  assert.equal(P.measureSegment(t, steps, 9), null);
});

test("comparaciones rápidas: primera vs. última y mejor vs. última", () => {
  const t1 = take({ day: "2026-11-10", hour: 9, wrongAt: { 0: 3 } });
  const t2 = take({ day: "2026-11-11", hour: 9 });
  const t3 = take({ day: "2026-11-13", hour: 9, wrongAt: { 0: 1 } });
  const all = [t1, t2, t3];
  const primera = P.presetPair("primera", all);
  assert.deepEqual([primera.a, primera.b], [t1.id, t3.id]);
  const mejor = P.presetPair("mejor", all, { accOf: (t) => (t === t1 ? 60 : t === t2 ? 95 : 100) });
  assert.deepEqual([mejor.a, mejor.b], [t2.id, t3.id]);   // la mejor entre las anteriores a la última
  assert.equal(P.presetPair("primera", [t1]).ok, false);
});

test("valores de métricas y textos de duración", () => {
  assert.equal(P.fmtSec(102.4), "1 min 42 s");
  assert.equal(P.fmtSec(58), "58 s");
  assert.equal(P.decimalEs(6.25), "6,3");
  assert.equal(P.plural(1, "error", "errores"), "error");
  assert.equal(P.plural(3, "error", "errores"), "errores");
  assert.equal(P.practiceDaysOf({ days: { "2026-11-12": { p1: 60 }, "2026-11-13": { p1: 0, p2: 10 } } }, "p1"), 1);
  // una toma cuenta como día practicado aunque el registro de tiempo no lo tenga
  assert.equal(P.practiceDaysOf({ days: { "2026-11-12": { p1: 60 } } }, "p1", [{ day: "2026-11-10" }, { day: "2026-11-12" }]), 2);
});

test("evolución: un solo día muestra el punto con su aria-label y sin línea; tempo nulo no genera punto", () => {
  const one = P.evolutionSvg([{ day: "2026-11-13", label: "13 nov", accuracy: 93, tempoBpm: null, evenness: null }], "accuracy", { width: 400, height: 200 });
  assert.equal(one.pts.length, 1);
  assert.equal(one.pts[0].text, "13 nov: 93 % de precisión");
  assert.match(one.svg, /aria-label="13 nov: 93 % de precisión"/);
  assert.doesNotMatch(one.svg, /class="pg-line"/);
  const tempo = P.evolutionSvg([{ day: "2026-11-13", label: "13 nov", tempoBpm: null }], "tempoBpm", { width: 400, height: 200 });
  assert.equal(tempo.pts.length, 0);
});

test("evolución: con varios días la línea une los puntos y el valor queda en el texto", () => {
  const pts = [{ day: "2026-11-11", label: "11 nov", accuracy: 80 }, { day: "2026-11-12", label: "12 nov", accuracy: 85 }, { day: "2026-11-13", label: "13 nov", accuracy: 93 }];
  const ev = P.evolutionSvg(pts, "accuracy", { width: 600, height: 240 });
  assert.equal(ev.pts.length, 3);
  assert.equal(ev.pts[2].text, "13 nov: 93 % de precisión");
  assert.match(ev.svg, /class="pg-line"/);
  assert.ok(ev.pts[0].y > ev.pts[2].y, "más precisión queda más arriba");
});
