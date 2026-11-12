// Anotaciones "como en papel" ancladas a la música. Lógica pura, sin DOM; importable en Node y navegador.
//
// Modelo: cada marca (trazo `pen`, resaltado `hl` o texto breve `text`) vive ANCLADA a un compás (índice 0-based), con
// coordenadas relativas a la caja de ese compás:
//   x = fracción del ancho del compás (0 = barra izquierda, 1 = barra derecha; puede salirse un poco: [-0.25, 1.25]);
//   y = unidades de "espacio de pentagrama" medidas desde la línea superior del gran pentagrama (negativo = arriba).
// Así, al cambiar de tamaño o de vista (continua ↔ por página) cada marca cae en el mismo lugar musical.
//
// `layout` describe dónde está cada compás en pantalla: [{ measure, x, y, w, staffSpace, systemHeight?, lhTop? }]
//   x,y = esquina izquierda y línea superior del gran pentagrama de ese compás (px); w = ancho (px); staffSpace = px por
//   espacio de pentagrama; systemHeight = alto del gran pentagrama en espacios (def. 16, sólo para decidir a qué compás
//   pertenece un punto que cae cerca); lhTop = y (en espacios) de la línea superior del pentagrama de la izquierda (def. 10,
//   sólo para decidir la mano `staff` de una marca).
// Un trazo que cruza varios compases se parte por compás (segmentos) que comparten `groupId`.

export const VERSION = 1;
export const MAX_MARKS = 2000;            // marcas por partitura
export const MAX_POINTS = 200;            // puntos por marca
export const MAX_TOTAL_POINTS = 40000;    // puntos por partitura
export const MAX_TEXT = 120;              // caracteres de un texto
export const MAX_HISTORY = 100;           // pasos de deshacer
export const TYPES = ['pen', 'hl', 'text'];
export const X_MIN = -0.25;
export const X_MAX = 1.25;
export const Y_MIN = -40;
export const Y_MAX = 80;
const DEFAULT_W = 24;                     // ancho de compás en espacios de pentagrama si no se conoce
const DEFAULT_SYSTEM_H = 16;
const DEFAULT_LH_TOP = 10;
const BAND_ABOVE = 5;                     // espacios por encima / debajo del gran pentagrama que aún cuentan como "ese compás"
const EPS = 1e-9;

const r3 = (n) => Math.round(n * 1000) / 1000;
const isNum = (n) => typeof n === 'number' && Number.isFinite(n);
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
let counter = 0;
const uid = (p) => `${p}${(++counter).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/* ------------------------------------------------------------------ simplificación (Ramer–Douglas–Peucker) */

function segDist(p, a, b) {
  const dx = b.x - a.x; const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  let t = l2 ? ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2 : 0;
  t = clamp(t, 0, 1);
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/**
 * Ramer–Douglas–Peucker iterativo: quita puntos que se desvían menos de `epsilon` de la recta entre sus vecinos conservados.
 * Conserva siempre el primero y el último punto.
 * @param {{x:number,y:number}[]} points
 * @param {number} epsilon en las mismas unidades que los puntos
 * @returns {{x:number,y:number}[]}
 */
export function simplifyStroke(points, epsilon) {
  if (!Array.isArray(points) || points.length <= 2) return Array.isArray(points) ? points.map((p) => ({ x: p.x, y: p.y })) : [];
  const keep = new Uint8Array(points.length);
  keep[0] = 1; keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let dmax = -1; let idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = segDist(points[i], points[a], points[b]);
      if (d > dmax) { dmax = d; idx = i; }
    }
    if (idx >= 0 && dmax > epsilon) { keep[idx] = 1; stack.push([a, idx], [idx, b]); }
  }
  return points.filter((_, i) => keep[i]).map((p) => ({ x: p.x, y: p.y }));
}

/** Reduce un trazo a como mucho `max` puntos subiendo el epsilon (x se pondera por el ancho típico de un compás). */
function capPoints(points, max = MAX_POINTS, wSS = DEFAULT_W) {
  if (points.length <= max) return points;
  const scaled = points.map((p) => ({ x: p.x * wSS, y: p.y }));
  let eps = 0.02;
  let out = scaled;
  for (let i = 0; i < 40 && out.length > max; i++) { out = simplifyStroke(scaled, eps); eps *= 1.6; }
  if (out.length > max) {                                  // último recurso: muestreo uniforme
    const step = (scaled.length - 1) / (max - 1);
    out = Array.from({ length: max }, (_, i) => scaled[Math.round(i * step)]);
  }
  return out.map((p) => ({ x: p.x / wSS, y: p.y }));
}

/* ------------------------------------------------------------------ marcas */

/**
 * Valida y normaliza UNA marca (estricto). Devuelve {mark} o {error}.
 * Campos: id, groupId, type, measure, staff ('rh'|'lh'|null), event (índice|null), points [{x,y}] (texto: 1 punto),
 * text (sólo `text`), color ('#rrggbb'|null), w (grosor en espacios de pentagrama), size (texto, en espacios).
 * @param {object} raw
 * @param {{strict?: boolean}} [opts] strict (defecto false): rechaza coordenadas fuera de rango en vez de recortarlas
 * @returns {{mark?: object, error?: string}}
 */
export function normalizeMark(raw, opts = {}) {
  const strict = !!opts.strict;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { error: 'la marca no es un objeto' };
  if (!TYPES.includes(raw.type)) return { error: `tipo inválido "${raw.type}"` };
  if (!Number.isInteger(raw.measure) || raw.measure < 0 || raw.measure > 9999) return { error: 'compás inválido' };
  if (raw.staff !== undefined && raw.staff !== null && raw.staff !== 'rh' && raw.staff !== 'lh') return { error: 'pentagrama inválido' };
  if (raw.event !== undefined && raw.event !== null && (!Number.isInteger(raw.event) || raw.event < 0 || raw.event > 9999)) return { error: 'evento inválido' };
  if (raw.id !== undefined && (typeof raw.id !== 'string' || !raw.id || raw.id.length > 64)) return { error: 'id inválido' };
  if (raw.groupId !== undefined && (typeof raw.groupId !== 'string' || !raw.groupId || raw.groupId.length > 64)) return { error: 'groupId inválido' };
  if (raw.color !== undefined && raw.color !== null && !(typeof raw.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw.color))) return { error: 'color inválido' };
  if (!Array.isArray(raw.points) || raw.points.length < 1) return { error: 'sin puntos' };
  if (raw.points.length > MAX_POINTS && (strict || raw.type === 'text')) return { error: `más de ${MAX_POINTS} puntos` };
  const pts = [];
  for (const p of raw.points) {
    if (!p || !isNum(p.x) || !isNum(p.y)) return { error: 'punto inválido' };
    if (strict && (p.x < X_MIN - EPS || p.x > X_MAX + EPS || p.y < Y_MIN - EPS || p.y > Y_MAX + EPS)) return { error: 'punto fuera de rango' };
    pts.push({ x: r3(clamp(p.x, X_MIN, X_MAX)), y: r3(clamp(p.y, Y_MIN, Y_MAX)) });
  }
  const mark = {
    id: raw.id || uid('m'),
    groupId: raw.groupId || raw.id || uid('g'),
    type: raw.type,
    measure: raw.measure,
    staff: raw.staff || null,
    event: raw.event === undefined ? null : raw.event,
    points: raw.type === 'text' ? pts.slice(0, 1) : capPoints(pts),
    color: raw.color || null,
  };
  if (raw.type === 'text') {
    if (typeof raw.text !== 'string') return { error: 'texto inválido' };
    const t = raw.text.replace(/\s+/g, ' ').trim();
    if (!t) return { error: 'texto vacío' };
    if (strict && t.length > MAX_TEXT) return { error: `texto de más de ${MAX_TEXT} caracteres` };
    mark.text = t.slice(0, MAX_TEXT);
    mark.size = isNum(raw.size) ? r3(clamp(raw.size, 0.5, 6)) : 1.4;
  } else {
    mark.w = isNum(raw.w) ? r3(clamp(raw.w, 0.02, 8)) : raw.type === 'hl' ? 1.2 : 0.18;
  }
  return { mark };
}

/* ------------------------------------------------------------------ pantalla ↔ ancla */

function boxOf(layout, measure) {
  return Array.isArray(layout) ? layout.find((b) => b && b.measure === measure) : undefined;
}

function validBox(b) {
  return b && Number.isInteger(b.measure) && isNum(b.x) && isNum(b.y) && isNum(b.w) && b.w > 0 && isNum(b.staffSpace) && b.staffSpace > 0;
}

/** Distancia (px) de un punto de pantalla a la banda del compás: 0 si cae adentro. */
function distToBox(p, b) {
  const s = b.staffSpace;
  const top = b.y - BAND_ABOVE * s;
  const bottom = b.y + ((b.systemHeight || DEFAULT_SYSTEM_H) + BAND_ABOVE) * s;
  const dx = Math.max(b.x - p.x, 0, p.x - (b.x + b.w));
  const dy = Math.max(top - p.y, 0, p.y - bottom);
  return Math.hypot(dx, dy);
}

/** Compás cuya caja es la más cercana a un punto de pantalla (null si el layout está vacío). */
function nearestBox(p, layout) {
  let best = null; let bd = Infinity;
  for (const b of layout || []) {
    if (!validBox(b)) continue;
    const d = distToBox(p, b);
    const c = Math.abs(p.x - (b.x + b.w / 2)) / b.w;
    const score = d + c * 1e-3;
    if (score < bd) { bd = score; best = b; }
  }
  return best;
}

/**
 * Punto de pantalla → ancla: compás más cercano y posición relativa a su caja.
 * @param {{x:number,y:number}} point px
 * @param {object[]} layout ver encabezado
 * @returns {{measure:number, x:number, y:number, staff:'rh'|'lh', wSS:number}|null} x fracción del ancho, y en espacios de pentagrama
 */
export function pointToAnchor(point, layout) {
  if (!point || !isNum(point.x) || !isNum(point.y)) return null;
  const b = nearestBox(point, layout);
  if (!b) return null;
  const y = (point.y - b.y) / b.staffSpace;
  return {
    measure: b.measure, x: (point.x - b.x) / b.w, y,
    staff: y < (isNum(b.lhTop) ? b.lhTop : DEFAULT_LH_TOP) - 2 ? 'rh' : 'lh',
    wSS: b.w / b.staffSpace,
  };
}

/**
 * Inversa: marca (o ancla) → puntos en pantalla según el layout actual.
 * @param {{measure:number, points?:{x:number,y:number}[], x?:number, y?:number}} mark
 * @param {object[]} layout
 * @returns {{x:number,y:number}[]|null} null si ese compás no está en el layout (p. ej. otra página)
 */
export function project(mark, layout) {
  if (!mark) return null;
  const b = boxOf(layout, mark.measure);
  if (!validBox(b)) return null;
  const pts = Array.isArray(mark.points) ? mark.points : isNum(mark.x) && isNum(mark.y) ? [{ x: mark.x, y: mark.y }] : [];
  return pts.map((p) => ({ x: b.x + p.x * b.w, y: b.y + p.y * b.staffSpace }));
}

/**
 * Parte un trazo en pantalla en marcas por compás. Si el trazo pasa de un compás a otro en el mismo sistema se agregan los
 * puntos de cruce en la barra (x = 0 / 1) para que las partes empalmen; si salta de sistema (otra fila) no se interpola.
 * Todos los segmentos comparten `groupId`.
 * @param {{x:number,y:number}[]} points puntos en pantalla (px)
 * @param {object[]} layout ver encabezado
 * @param {{type?:'pen'|'hl'|'text', groupId?:string, color?:string, w?:number, simplify?:boolean, event?:number, staff?:'rh'|'lh'}} [opts]
 *   simplify (defecto true) aplica Ramer–Douglas–Peucker (tolerancia 0.06 espacios)
 * @returns {object[]} marcas normalizadas (sin agregar a ningún store)
 */
export function splitStrokeByMeasure(points, layout, opts = {}) {
  const boxes = (layout || []).filter(validBox);
  const src = (Array.isArray(points) ? points : []).filter((p) => p && isNum(p.x) && isNum(p.y));
  if (!boxes.length || !src.length) return [];
  let pts = src;
  if (opts.simplify !== false && src.length > 2) {
    const s = boxes[0].staffSpace;
    pts = simplifyStroke(src, 0.06 * s);
  }
  const groupId = opts.groupId || uid('g');
  const sameRow = (a, b) => Math.abs(a.y - b.y) < 0.5 * Math.min(a.staffSpace, b.staffSpace);
  const rowSorted = (ref) => boxes.filter((b) => sameRow(b, ref)).sort((a, b) => a.x - b.x);

  const segs = [];                                           // {box, pts:[screen]}
  let cur = null;
  const push = (box, p) => {
    if (!cur || cur.box !== box) { cur = { box, pts: [] }; segs.push(cur); }
    cur.pts.push(p);
  };
  let prev = null; let prevBox = null;
  for (const p of pts) {
    const box = nearestBox(p, boxes);
    if (prev && box !== prevBox && sameRow(box, prevBox)) {
      const row = rowSorted(box);
      const ia = row.indexOf(prevBox); const ib = row.indexOf(box);
      const dir = ib > ia ? 1 : -1;
      const yAt = (x) => (Math.abs(p.x - prev.x) < EPS ? p.y : prev.y + ((x - prev.x) / (p.x - prev.x)) * (p.y - prev.y));
      for (let i = ia; i !== ib; i += dir) {
        const edge = dir > 0 ? row[i].x + row[i].w : row[i].x;      // barra por la que sale del compás i
        const q = { x: edge, y: yAt(edge) };
        push(row[i], q);                                              // cierra el compás i
        push(row[i + dir], q);                                        // abre el siguiente
      }
    }
    push(box, p);
    prev = p; prevBox = box;
  }
  const out = [];
  for (const s of segs) {
    const b = s.box;
    const ys = s.pts.reduce((a, p) => a + p.y, 0) / s.pts.length;
    const rel = s.pts.map((p) => ({ x: (p.x - b.x) / b.w, y: (p.y - b.y) / b.staffSpace }));
    const staff = opts.staff || ((ys - b.y) / b.staffSpace < (isNum(b.lhTop) ? b.lhTop : DEFAULT_LH_TOP) - 2 ? 'rh' : 'lh');
    const raw = { type: opts.type || 'pen', measure: b.measure, staff, event: opts.event === undefined ? null : opts.event, points: rel, groupId };
    if (opts.color) raw.color = opts.color;
    if (isNum(opts.w)) raw.w = opts.w;
    const r = normalizeMark(raw);
    if (r.mark) out.push(r.mark);
  }
  return out;
}

/* ------------------------------------------------------------------ store */

function markDist(mark, a, wSS) {
  // distancia (en espacios de pentagrama) de un ancla a una marca del mismo compás; x se convierte con el ancho del compás
  const pts = mark.points.map((p) => ({ x: p.x * wSS, y: p.y }));
  const q = { x: a.x * wSS, y: a.y };
  if (pts.length === 1) return Math.hypot(q.x - pts[0].x, q.y - pts[0].y) - (mark.type === 'text' ? Math.min(3, (mark.text || '').length * 0.35) : 0);
  let d = Infinity;
  for (let i = 1; i < pts.length; i++) d = Math.min(d, segDist(q, pts[i - 1], pts[i]));
  return d - (mark.w || 0) / 2;
}

/** Valida el JSON guardado ({v, marks}). Nunca lanza. */
function parseData(data) {
  const errors = [];
  let obj = data;
  if (typeof obj === 'string') {
    if (obj.length > 8 * 1024 * 1024) return { ok: false, errors: ['el JSON es demasiado grande'], marks: [] };
    try { obj = JSON.parse(obj); } catch (e) { return { ok: false, errors: ['JSON ilegible'], marks: [] }; }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ok: false, errors: ['las anotaciones no son un objeto'], marks: [] };
  if (obj.v !== VERSION) return { ok: false, errors: [`versión no soportada (${String(obj.v)})`], marks: [] };
  if (!Array.isArray(obj.marks)) return { ok: false, errors: ['falta la lista de marcas'], marks: [] };
  if (obj.marks.length > MAX_MARKS) return { ok: false, errors: [`demasiadas marcas (máx. ${MAX_MARKS})`], marks: [] };
  const marks = []; const seen = new Set(); let total = 0;
  obj.marks.forEach((raw, i) => {
    const r = normalizeMark(raw, { strict: true });
    if (!r.mark) { errors.push(`marca ${i + 1}: ${r.error}`); return; }
    if (!raw.id || !raw.groupId) { errors.push(`marca ${i + 1}: faltan id o groupId`); return; }
    if (seen.has(r.mark.id)) { errors.push(`marca ${i + 1}: id repetido`); return; }
    total += r.mark.points.length;
    if (total > MAX_TOTAL_POINTS) { errors.push(`marca ${i + 1}: demasiados puntos en total`); return; }
    seen.add(r.mark.id);
    marks.push(r.mark);
  });
  return { ok: true, errors, marks };
}

/**
 * Crea un almacén de anotaciones con deshacer/rehacer. `initial` puede ser una lista de marcas, el objeto/string de toJSON()
 * o undefined. Las marcas inválidas de `initial` se descartan.
 * @param {object[]|object|string} [initial]
 * @returns {{
 *   add(markOrMarks: object|object[]): {ok:boolean, marks:object[], error?:string},
 *   eraseAt(anchor:{measure:number,x:number,y:number,wSS?:number}, radius:number): {removed: object[]},
 *   undo(): boolean, redo(): boolean, clear(): number, canUndo(): boolean, canRedo(): boolean,
 *   marks(): object[], forMeasure(measure:number): object[], count(): number, subscribe(fn:Function): Function, toJSON(): object }}
 */
export function createStore(initial) {
  let list = [];
  const undoStack = [];
  const redoStack = [];
  const subs = new Set();
  const emit = () => { for (const f of [...subs]) { try { f(); } catch (e) { /* un suscriptor roto no frena al resto */ } } };
  const totalPoints = () => list.reduce((a, m) => a + m.points.length, 0);
  const pushOp = (op) => { undoStack.push(op); if (undoStack.length > MAX_HISTORY) undoStack.shift(); redoStack.length = 0; };

  if (initial) {
    const data = Array.isArray(initial) ? { v: VERSION, marks: initial.map((m) => ({ ...m, id: m && m.id ? m.id : uid('m'), groupId: m && (m.groupId || m.id) ? (m.groupId || m.id) : uid('g') })) } : initial;
    list = parseData(data).marks;
  }

  const store = {
    add(input) {
      const raws = Array.isArray(input) ? input : [input];
      if (!raws.length) return { ok: false, marks: [], error: 'no hay marcas' };
      const marks = [];
      const ids = new Set(list.map((m) => m.id));
      for (const raw of raws) {
        const r = normalizeMark(raw);
        if (!r.mark) return { ok: false, marks: [], error: r.error };
        if (ids.has(r.mark.id)) r.mark.id = uid('m');
        ids.add(r.mark.id);
        marks.push(r.mark);
      }
      if (list.length + marks.length > MAX_MARKS) return { ok: false, marks: [], error: `límite de ${MAX_MARKS} marcas alcanzado` };
      if (totalPoints() + marks.reduce((a, m) => a + m.points.length, 0) > MAX_TOTAL_POINTS) return { ok: false, marks: [], error: 'límite de puntos alcanzado' };
      list.push(...marks);
      pushOp({ type: 'add', ids: marks.map((m) => m.id) });
      emit();
      return { ok: true, marks: marks.map((m) => JSON.parse(JSON.stringify(m))) };
    },

    eraseAt(anchor, radius) {
      if (!anchor || !Number.isInteger(anchor.measure) || !isNum(anchor.x) || !isNum(anchor.y) || !isNum(radius) || radius < 0) return { removed: [] };
      const wSS = isNum(anchor.wSS) && anchor.wSS > 0 ? anchor.wSS : DEFAULT_W;
      const groups = new Set();
      for (const m of list) if (m.measure === anchor.measure && markDist(m, anchor, wSS) <= radius) groups.add(m.groupId);
      if (!groups.size) return { removed: [] };
      const removed = []; const kept = [];
      list.forEach((m, index) => { (groups.has(m.groupId) ? removed : kept).push(groups.has(m.groupId) ? { mark: m, index } : m); });
      list = kept;
      pushOp({ type: 'erase', removed });
      emit();
      return { removed: removed.map((r) => JSON.parse(JSON.stringify(r.mark))) };
    },

    undo() {
      const op = undoStack.pop();
      if (!op) return false;
      if (op.type === 'add') {
        op.marks = list.filter((m) => op.ids.includes(m.id));
        list = list.filter((m) => !op.ids.includes(m.id));
      } else {
        const asc = [...op.removed].sort((a, b) => a.index - b.index);
        for (const r of asc) list.splice(Math.min(r.index, list.length), 0, r.mark);
      }
      redoStack.push(op);
      emit();
      return true;
    },

    redo() {
      const op = redoStack.pop();
      if (!op) return false;
      if (op.type === 'add') list.push(...op.marks);
      else { const ids = new Set(op.removed.map((r) => r.mark.id)); list = list.filter((m) => !ids.has(m.id)); }
      undoStack.push(op);
      emit();
      return true;
    },

    clear() {
      const n = list.length;
      if (!n) return 0;
      const removed = list.map((mark, index) => ({ mark, index }));
      list = [];
      pushOp({ type: 'erase', removed });
      emit();
      return n;
    },

    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0,
    marks: () => JSON.parse(JSON.stringify(list)),
    forMeasure: (measure) => JSON.parse(JSON.stringify(list.filter((m) => m.measure === measure))),
    count: () => list.length,
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },

    /** Objeto serializable `{v, marks}` (JSON.stringify(store) también funciona). */
    toJSON() { return { v: VERSION, marks: JSON.parse(JSON.stringify(list)) }; },
  };
  return store;
}

/**
 * Lee anotaciones guardadas (string JSON u objeto `{v, marks}`) con validación estricta. Nunca lanza.
 * Si el JSON está corrupto, es de otra versión o excede los límites → ok:false (y store vacío). Si sólo algunas marcas son
 * inválidas, se descartan y se informan en `errors` (ok:true).
 * @param {string|object} data
 * @returns {{ok:boolean, errors:string[], store: ReturnType<typeof createStore>}}
 */
export function fromJSON(data) {
  const r = parseData(data);
  return { ok: r.ok, errors: r.errors, store: createStore(r.ok ? { v: VERSION, marks: r.marks } : undefined) };
}
