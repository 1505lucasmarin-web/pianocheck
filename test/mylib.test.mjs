import test from "node:test";
import assert from "node:assert/strict";
import { originKind, queryLibrary, filterCounts, draftsOf, isDraft, buildLibraryExport, serializeLibrary, parseLibraryExport, planMerge, LIB_LIMITS, FILTERS } from "../js/mylib.js";
import { validateScore } from "../js/model.js";

const sc = (id, extra = {}) => ({ id, title: "Pieza " + id, bpm: 80, timeSig: [4, 4], keySig: "C", measures: [{ rh: [{ k: ["c/4"], d: "w" }], lh: [] }], ...extra });

test("validateScore conserva origin (viejos y nuevos) y draft", () => {
  for (const o of ["ia", "foto", "pdf", "importada", "incluida", "tarea", "arreglo"]) assert.equal(validateScore(sc("a", { origin: o })).score.origin, o);
  assert.equal(validateScore(sc("a", { origin: "xx" })).score.origin, undefined);
  assert.equal(validateScore(sc("a", { draft: true })).score.draft, true);
  assert.equal(validateScore(sc("a", { draft: "si" })).score.draft, undefined);
});

test("originKind: explícito e inferido", () => {
  assert.equal(originKind(sc("a", { origin: "ia" })), "ia");
  assert.equal(originKind(sc("a", { origin: "ia", derivedFrom: { id: "x" } })), "arreglo");
  assert.equal(originKind(sc("a", { origin: "pdf" })), "importada");
  assert.equal(originKind(sc("a", { origin: "tarea" })), "tarea");
  assert.equal(originKind(sc("a", { derivedFrom: { id: "x", title: "" } })), "arreglo");
  assert.equal(originKind(sc("a", { level: "pro" })), "ia");
  assert.equal(originKind(sc("demo-oda")), "incluida");
  assert.equal(originKind(sc("p-1"), { bundledIds: new Set(["p-1"]) }), "incluida");
  assert.equal(originKind(sc("zz")), "importada");
  assert.equal(originKind(null), "importada");
});

test("buscar, filtrar y ordenar", () => {
  const list = [sc("1", { title: "Canción de cuna", artist: "Brahms", origin: "ia", updatedAt: 10 }), sc("2", { title: "Árbol", origin: "foto", updatedAt: 30 }), sc("3", { title: "Zeta", origin: "tarea", updatedAt: 20, draft: true })];
  const sums = { 1: { count: 2, best: 90, last: 80 }, 3: { count: 1, best: 50, last: 50 } };
  assert.deepEqual(queryLibrary(list).map((s) => s.id), ["2", "3", "1"]);
  assert.deepEqual(queryLibrary(list, { sort: "titulo" }).map((s) => s.id), ["2", "1", "3"]);
  assert.deepEqual(queryLibrary(list, { sort: "mejor", sums }).map((s) => s.id), ["1", "3", "2"]);
  assert.deepEqual(queryLibrary(list, { q: "arbol" }).map((s) => s.id), ["2"]);
  assert.deepEqual(queryLibrary(list, { q: "BRAHMS cuna" }).map((s) => s.id), ["1"]);
  assert.deepEqual(queryLibrary(list, { filter: "importada" }).map((s) => s.id), ["2"]);
  assert.deepEqual(queryLibrary(list, { filter: "borrador" }).map((s) => s.id), ["3"]);
  assert.deepEqual(filterCounts(list), { todas: 3, borrador: 1, ia: 1, importada: 1, incluida: 0, tarea: 1, arreglo: 0, transcrita: 0, grabada: 0 });
  assert.deepEqual(draftsOf(list).map((s) => s.id), ["3"]); assert.equal(isDraft(list[0]), false);
  assert.equal(FILTERS[0][0], "todas");
});

const lib = () => buildLibraryExport({
  scores: [sc("a", { updatedAt: 111, origin: "ia", apiKey: "SECRETO" }), sc("b", { updatedAt: 222 })],
  attempts: [{ id: "t1", scoreId: "a", accuracy: 90, at: 5, token: "x" }, { id: "t2", scoreId: "zzz", accuracy: 1 }],
  annotations: { a: { v: 1, marks: [] }, zzz: { v: 1, marks: [] } }, tasks: { a: { at: 3, text: "hola" } }, now: 1000,
});

test("exportar: sin claves ni datos huérfanos", () => {
  const e = lib(); const txt = serializeLibrary(e);
  assert.ok(!/SECRETO/.test(txt)); assert.ok(!/"token"/.test(txt));
  assert.equal(e.attempts.length, 1); assert.deepEqual(Object.keys(e.annotations), ["a"]);
});

test("ida y vuelta conserva partituras, fechas, anotaciones e historial", () => {
  const r = parseLibraryExport(serializeLibrary(lib()));
  assert.equal(r.ok, true);
  assert.deepEqual(r.scores.map((s) => [s.id, s.updatedAt, s.origin]), [["a", 111, "ia"], ["b", 222, undefined]]);
  assert.equal(r.attempts.length, 1); assert.equal(r.attempts[0].accuracy, 90);
  assert.deepEqual(r.annotations.a, { v: 1, marks: [] }); assert.deepEqual(r.tasks.a, { at: 3, text: "hola" });
});

test("fusión sin duplicar por id", () => {
  const r = parseLibraryExport(serializeLibrary(lib()));
  const m = planMerge({ scoreIds: new Set(["a"]), attemptIds: new Set() }, r);
  assert.deepEqual(m.addScores.map((s) => s.id), ["b"]); assert.equal(m.addAttempts.length, 0); assert.deepEqual(m.addAnnotations, {}); assert.equal(m.counts.existing, 1);
  const m2 = planMerge({ scoreIds: new Set(), attemptIds: new Set(["t1"]) }, r);
  assert.equal(m2.addScores.length, 2); assert.equal(m2.addAttempts.length, 0);
  const again = planMerge({ scoreIds: new Set(["a", "b"]), attemptIds: new Set(["t1"]) }, r);
  assert.equal(again.counts.scores, 0);
});

test("datos corruptos o fuera de límites", () => {
  assert.equal(parseLibraryExport("").ok, false);
  assert.equal(parseLibraryExport("{no json").ok, false);
  assert.equal(parseLibraryExport(JSON.stringify({ format: "otra", version: 1, scores: [] })).ok, false);
  assert.equal(parseLibraryExport(JSON.stringify({ format: "pianocheck-library", version: 99, scores: [] })).ok, false);
  assert.equal(parseLibraryExport(JSON.stringify({ format: "pianocheck-library", version: 1 })).ok, false);
  assert.equal(parseLibraryExport(JSON.stringify({ format: "pianocheck-library", version: 1, scores: [{ id: "x", measures: "no" }, null, 7] })).ok, false);
  assert.equal(parseLibraryExport("x".repeat(100), { ...LIB_LIMITS, maxBytes: 10 }).ok, false);
  // mezcla: lo válido pasa, lo corrupto se descarta
  const e = lib(); e.scores.push({ id: "c", measures: [] }); e.scores.push({ id: "a", title: "duplicada", measures: sc("a").measures }); e.attempts.push({ id: "t3", scoreId: "a", pad: "y".repeat(5000) }); e.annotations.b = { v: 1, marks: "roto" };
  const r = parseLibraryExport(JSON.stringify(e));
  assert.equal(r.ok, true); assert.equal(r.scores.length, 2); assert.equal(r.skipped.scores, 2); assert.equal(r.skipped.attempts, 1); assert.equal(r.skipped.annotations, 1); assert.deepEqual(Object.keys(r.annotations), ["a"]);
});

test("límites: demasiadas partituras o intentos", () => {
  const e = buildLibraryExport({ scores: [sc("a"), sc("b"), sc("c")], attempts: [{ id: "1", scoreId: "a" }, { id: "2", scoreId: "a" }, { id: "3", scoreId: "a" }] });
  const r = parseLibraryExport(JSON.stringify(e), { ...LIB_LIMITS, maxScores: 2, maxAttempts: 1 });
  assert.equal(r.scores.length, 2); assert.equal(r.attempts.length, 1); assert.equal(r.skipped.scores, 1); assert.equal(r.skipped.attempts, 2); assert.ok(r.warnings.length);
});

test('orígenes nuevos: transcrita y grabada (etiqueta, filtro y conteo)', () => {
  const list = [{ id: 'a', title: 'A', origin: 'transcrita' }, { id: 'b', title: 'B', origin: 'grabada', draft: true }, { id: 'c', title: 'C', origin: 'ia' }];
  assert.equal(originKind(list[0]), 'transcrita'); assert.equal(originKind(list[1]), 'grabada');
  assert.deepEqual(queryLibrary(list, { filter: 'transcrita' }).map((s) => s.id), ['a']);
  assert.deepEqual(queryLibrary(list, { filter: 'grabada' }).map((s) => s.id), ['b']);
  assert.equal(filterCounts(list).transcrita, 1);
  assert.ok(FILTERS.some(([k, n]) => k === 'transcrita' && n === 'Transcritas') && FILTERS.some(([k]) => k === 'grabada'));
});
