// Sincronización entre dispositivos: lógica pura (sin DOM, sin IndexedDB, sin Firebase).
export const MAX_DOC_CHARS = 900000;          // Firestore limita cada documento a ~1 MiB
export const PULL_OVERLAP_MS = 5 * 60000;      // se re-lee un margen por si los relojes de los dispositivos difieren
export const COLLECTIONS = { score: 'scores', anno: 'annos', attempt: 'attempts', take: 'takes', audio: 'audio', theory: 'meta', settings: 'meta', practice: 'practice' };
/** Ajustes que viajan entre dispositivos (el resto es de cada aparato: teclado en pantalla, micrófono, etc.). La API key va aparte, sólo si se activa. */
export const SYNC_SETTINGS = ['scoreView', 'scoreTheme', 'scoreSize', 'showPhrases', 'guide', 'countIn', 'pulseWindow', 'hideMarks', 'timbre', 'listenSpeed', 'listenRepeat', 'listenHands', 'listenMetro', 'listenCountIn', 'listenMuteMine', 'listenAlong', 'listenVolume', 'holdMode', 'showPaid', 'saveTakes', 'lastPractice', 'tasks'];
export const AUDIO_CHUNK = 700000;            // caracteres base64 por documento (< 1 MiB)
export const MAX_AUDIO_CHARS = 9000000;       // ~6,5 MB de audio por toma; más grande no se sube
/** Parte el audio (base64) en documentos; null si es demasiado grande. */
export function splitAudio(takeId, mime, b64, now) {
  if (!b64 || b64.length > MAX_AUDIO_CHARS) return null;
  const total = Math.max(1, Math.ceil(b64.length / AUDIO_CHUNK));
  const out = [];
  for (let n = 0; n < total; n++) out.push({ id: `${takeId}~${n}`, data: { u: now, takeId, n, total, mime: mime || 'audio/webm', b64: b64.slice(n * AUDIO_CHUNK, (n + 1) * AUDIO_CHUNK) } });
  return out;
}
/** Junta los pedazos de una toma; null si faltan. */
export function joinAudio(pieces) {
  if (!pieces || !pieces.length) return null;
  const total = pieces[0].total, by = new Map(pieces.map((p) => [p.n, p]));
  if (!(total >= 1) || by.size < total) return null;
  let b64 = ''; for (let n = 0; n < total; n++) { const p = by.get(n); if (!p) return null; b64 += p.b64; }
  return { mime: pieces[0].mime, b64 };
}
export const KEY_FIELDS = ['provider', 'apiKey', 'model'];

/** Id de documento válido (Firestore no admite "/"). */
export const docId = (kind, id) => (kind === 'theory' ? 'theory' : kind === 'settings' ? 'settings' : String(id).replace(/\//g, '_'));

export function pickSettings(settings, withKey = false) {
  const out = {};
  const s = settings && typeof settings === 'object' ? settings : {};
  for (const k of SYNC_SETTINGS) if (s[k] !== undefined) out[k] = s[k];
  if (withKey && typeof s.apiKey === 'string' && s.apiKey) for (const k of KEY_FIELDS) if (s[k] !== undefined) out[k] = s[k];   // una key vacía nunca pisa la de la nube
  return out;
}
/** Qué aplicar localmente de los ajustes remotos (la key sólo si este dispositivo lo permite). */
export function settingsToApply(remote, withKey = false) {
  const out = pickSettings(remote, false);
  if (withKey) for (const k of KEY_FIELDS) if (remote && typeof remote[k] === 'string' && remote[k]) out[k] = remote[k];
  return out;
}

/** Suma registros de tiempo de práctica de dispositivos distintos (cada dispositivo sólo escribe el suyo, así que no hay doble conteo). */
export function sumLogs(...logs) {
  const days = {};
  for (const log of logs) {
    const d = log && typeof log === 'object' && log.days && typeof log.days === 'object' ? log.days : {};
    for (const day of Object.keys(d)) {
      const row = d[day] || {};
      const out = (days[day] ||= {});
      for (const id of Object.keys(row)) { const v = Number(row[id]); if (Number.isFinite(v) && v > 0) out[id] = Math.round(((out[id] || 0) + v) * 10) / 10; }
    }
  }
  return { days };
}

/** Une dos progresos de Teoría: mejor puntaje por ejercicio, unión de tonalidades y días, mayor número de intentos. */
export function mergeTheory(a, b) {
  const la = (a && a.lessons) || {}, lb = (b && b.lessons) || {};
  const lessons = {};
  for (const id of new Set([...Object.keys(la), ...Object.keys(lb)])) {
    const x = la[id] || {}, y = lb[id] || {};
    const best = { ...(x.best || {}) };
    for (const ex of Object.keys(y.best || {})) { const c = y.best[ex]; if (!best[ex] || (c && c.pct > best[ex].pct)) best[ex] = c; }
    lessons[id] = { best, keys: [...new Set([...(x.keys || []), ...(y.keys || [])])], mastered: [...new Set([...(x.mastered || []), ...(y.mastered || [])])], runs: Math.max(x.runs || 0, y.runs || 0) };
  }
  const days = [...new Set([...((a && a.days) || []), ...((b && b.days) || [])])].sort();
  const out = { lessons };
  if (days.length) out.days = days;
  return out;
}
export const sameJSON = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** Arma el documento a subir; null si no entra en Firestore. */
export function packDoc(rec, now) {
  const json = JSON.stringify(rec);
  if (json.length > MAX_DOC_CHARS) return null;
  return { u: now, json };
}
export const tombstone = (now) => ({ u: now, deleted: true });
export function unpackDoc(data) {
  if (!data || typeof data !== 'object') return null;
  if (data.deleted) return { deleted: true, u: Number(data.u) || 0 };
  try { return { deleted: false, u: Number(data.u) || 0, rec: JSON.parse(data.json) }; } catch (e) { return null; }
}
export const chunk = (arr, n) => { const out = []; for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n)); return out; };
