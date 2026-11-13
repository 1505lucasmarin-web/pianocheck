// Tiempo de práctica: acumulador de tiempo ACTIVO y agregados por día / partitura. Lógica pura (sin DOM ni IndexedDB).
// El registro (log) tiene la forma { days: { "AAAA-MM-DD": { [scoreId]: segundos } } }. Los días son locales.
// La práctica de Teoría se registra con el id TEORIA_ID.

/** Pausa sin actividad a partir de la cual deja de contar (30 s por defecto). */
export const DEFAULT_IDLE_MS = 30000;
/** Identificador de la práctica de Teoría dentro del registro. */
export const TEORIA_ID = "_teoria";

/** Día local "AAAA-MM-DD" de una marca de tiempo (ms). */
export function dayKey(ms = Date.now()) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "AAAA-MM-DD" correspondiente a `k` días antes de `ms` (k = 0 es el mismo día). */
export function shiftDay(ms, k) {
  const d = new Date(ms);
  return dayKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - k, 12).getTime());
}

/**
 * Pura: reparte un intervalo [fromMs, toMs) en tramos por día local (una sesión que cruza las 00:00 se parte).
 * @returns {{day:string, seconds:number}[]} sólo tramos con duración positiva, en orden cronológico.
 */
export function splitByDay(fromMs, toMs) {
  const out = [];
  if (!Number.isFinite(fromMs) || !Number.isFinite(toMs) || toMs <= fromMs) return out;
  let cur = fromMs;
  while (cur < toMs) {
    const d = new Date(cur);
    const nextMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
    const end = Math.min(toMs, nextMidnight);
    out.push({ day: dayKey(cur), seconds: (end - cur) / 1000 });
    cur = end;
  }
  return out;
}

/**
 * Pura: suma `seconds` a un día y una partitura. No muta el registro recibido.
 * @param {object} log registro actual (puede ser null)
 * @param {{day:string, scoreId:string, seconds:number}} s
 * @returns {object} registro nuevo
 */
export function addSession(log, { day, scoreId, seconds }) {
  const cur = normalizeLog(log);
  const sec = Number(seconds);
  if (!day || !scoreId || !Number.isFinite(sec) || sec <= 0) return cur;
  const days = { ...cur.days };
  const row = { ...(days[day] || {}) };
  row[scoreId] = Math.round(((row[scoreId] || 0) + sec) * 10) / 10;
  days[day] = row;
  return { days };
}

/** Pura: normaliza un registro leído de la base (descarta valores inválidos). */
export function normalizeLog(raw) {
  const out = { days: {} };
  const src = raw && typeof raw === "object" && raw.days && typeof raw.days === "object" ? raw.days : {};
  for (const day of Object.keys(src)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !src[day] || typeof src[day] !== "object") continue;
    const row = {};
    for (const id of Object.keys(src[day])) {
      const v = Number(src[day][id]);
      if (id && Number.isFinite(v) && v > 0) row[id] = v;
    }
    if (Object.keys(row).length) out.days[day] = row;
  }
  return out;
}

/**
 * Pura: une dos registros tomando, para cada día y partitura, el MAYOR de los dos.
 * Así importar dos veces el mismo archivo no duplica el tiempo (aunque dos dispositivos distintos
 * pueden quedar algo por debajo de la suma real).
 */
export function mergeLogs(a, b) {
  const A = normalizeLog(a), B = normalizeLog(b), days = {};
  for (const src of [A, B]) {
    for (const day of Object.keys(src.days)) {
      const row = { ...(days[day] || {}) };
      for (const id of Object.keys(src.days[day])) row[id] = Math.max(row[id] || 0, src.days[day][id]);
      days[day] = row;
    }
  }
  return { days };
}

/**
 * Pura: agregados del registro.
 * - total: todo el tiempo registrado.
 * - today: hoy (día local de `now`).
 * - week: últimos 7 días, incluido hoy.
 * - month: últimos 30 días, incluido hoy (ventana rodante, la misma que byDay).
 * - byDay: los últimos 30 días, del más antiguo al más reciente, con ceros incluidos.
 * - byScore: [{scoreId, seconds}] de mayor a menor (incluye TEORIA_ID si hubo práctica de Teoría).
 * - streakDays: días seguidos con práctica hasta hoy; si hoy todavía no hubo, cuenta desde ayer.
 * @returns {{total:number, today:number, week:number, month:number, byDay:{day:string, seconds:number}[], byScore:{scoreId:string, seconds:number}[], streakDays:number}}
 */
export function totals(log, { now = Date.now() } = {}) {
  const L = normalizeLog(log);
  const dayTotal = (d) => Object.values(L.days[d] || {}).reduce((x, y) => x + y, 0);
  const days = Object.keys(L.days);
  const total = days.reduce((x, d) => x + dayTotal(d), 0);
  const sumRange = (n) => { let s = 0; for (let k = 0; k < n; k++) s += dayTotal(shiftDay(now, k)); return s; };
  const byDay = [];
  for (let k = 29; k >= 0; k--) { const d = shiftDay(now, k); byDay.push({ day: d, seconds: dayTotal(d) }); }
  const scores = {};
  for (const d of days) for (const id of Object.keys(L.days[d])) scores[id] = (scores[id] || 0) + L.days[d][id];
  const byScore = Object.keys(scores).map((scoreId) => ({ scoreId, seconds: scores[scoreId] })).sort((p, q) => q.seconds - p.seconds);
  let streakDays = 0;
  let k = dayTotal(shiftDay(now, 0)) > 0 ? 0 : 1;
  while (dayTotal(shiftDay(now, k)) > 0 && k < 10000) { streakDays++; k++; }
  return { total, today: dayTotal(shiftDay(now, 0)), week: sumRange(7), month: sumRange(30), byDay, byScore, streakDays };
}

/** Pura: segundos registrados de una partitura (todo el historial). */
export function scoreSeconds(log, scoreId) {
  const L = normalizeLog(log);
  return Object.keys(L.days).reduce((x, d) => x + (L.days[d][scoreId] || 0), 0);
}

/**
 * Pura: formato corto en español rioplatense.
 * "12 h 35 min" | "12 h" (sin minutos) | "48 min" | "menos de 1 min".
 */
export function formatDuration(seconds) {
  const m = Math.floor((Number(seconds) || 0) / 60);
  if (m < 1) return "menos de 1 min";
  const h = Math.floor(m / 60), mm = m % 60;
  if (!h) return `${mm} min`;
  return mm ? `${h} h ${mm} min` : `${h} h`;
}

/**
 * Crea el acumulador de tiempo activo. Cuenta sólo entre start() y pause()/stop(), y sólo mientras
 * hubo actividad (activity()) en los últimos idleMs. La actividad inicial no existe: entrar a la práctica
 * y quedarse quieto no suma. Cada tramo contado se entrega a onSpan(fromMs, toMs) (para repartir por día).
 * @param {{now?:()=>number, idleMs?:number, onSpan?:(from:number,to:number)=>void}} [o]
 */
export function createTimeTracker({ now = () => Date.now(), idleMs = DEFAULT_IDLE_MS, onSpan } = {}) {
  let running = false, lastSettle = 0, lastActivity = -Infinity, session = 0;   // session: ms activos desde el último stop()

  // Acredita el tramo hasta ahora: sólo la parte cubierta por la última actividad + idleMs.
  function settle() {
    const t = now();
    const end = Math.min(t, lastActivity + idleMs);
    if (end > lastSettle) {
      session += end - lastSettle;
      if (onSpan) onSpan(lastSettle, end);
    }
    lastSettle = t;
  }

  return {
    /** Empieza (o reanuda) a contar. No hace nada si ya cuenta. */
    start() {
      if (running) return;
      running = true; lastActivity = -Infinity; lastSettle = now();
    },
    /** Marca actividad (nota tocada, interacción). Ignorada si no está contando. */
    activity() {
      if (!running) return;
      settle();
      lastActivity = lastSettle;
    },
    /** Pausa: acredita lo que corresponda y deja de contar hasta start(). */
    pause() {
      if (!running) return;
      settle();
      running = false; lastActivity = -Infinity;
    },
    /** Pausa y devuelve los segundos activos de la sesión (desde la última vez que se llamó stop()). Cierra la sesión. */
    stop() {
      this.pause();
      const out = session / 1000;
      session = 0;
      return out;
    },
    /** Acredita lo ya contado (llama onSpan) sin pausar: para guardar parciales cada ~30 s. No suma dos veces. */
    checkpoint() {
      if (running) settle();
    },
    /** Segundos activos de la sesión hasta ahora (sin pausar). */
    seconds() {
      if (!running) return session / 1000;
      const end = Math.min(now(), lastActivity + idleMs);
      return (session + Math.max(0, end - lastSettle)) / 1000;
    },
    get running() { return running; },
  };
}
