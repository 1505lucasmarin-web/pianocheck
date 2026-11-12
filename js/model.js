// Modelo de partitura + construcción de pasos. Sin dependencias, sin DOM.

const NOTE_SEMITONE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const SHARP_NAMES = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
const LATIN_NAMES = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
const DUR_BEATS = { w: 4, h: 2, q: 1, '8': 0.5, '16': 0.25, '32': 0.125 };
const VALID_DEN = [1, 2, 4, 8, 16, 32];
export const MAX_COMMENT = 160;                                  // largo máximo del comentario de un compás
export const ORIGINS = ['foto', 'imagenes', 'pdf', 'ia', 'importada', 'incluida', 'tarea', 'arreglo'];   // foto/imagenes/pdf/ia: leídas por IA, se les buscan avisos de importación; el resto sólo dice de dónde salió
const fingerOf = (v) => { const n = Math.round(Number(v)); return n >= 1 && n <= 5 ? n : 0; };

/** "c/4" → 60. Acepta #, ##, b, bb, n. Devuelve null si es inválida. */
export function keyToMidi(key) {
  if (typeof key !== 'string') return null;
  const m = /^\s*([a-g])(##|#|bb|b|n)?\s*\/\s*(-?\d+)\s*$/i.exec(key);
  if (!m) return null;
  const letter = m[1].toLowerCase();
  const acc = (m[2] || '').toLowerCase();
  let alt = 0;
  if (acc === '#') alt = 1;
  else if (acc === '##') alt = 2;
  else if (acc === 'b') alt = -1;
  else if (acc === 'bb') alt = -2;
  const midi = (parseInt(m[3], 10) + 1) * 12 + NOTE_SEMITONE[letter] + alt;
  return midi >= 0 && midi <= 127 ? midi : null;
}

/** 60 → "c/4" (con sostenidos). */
export function midiToKey(midi) {
  if (!Number.isInteger(midi) || midi < 0 || midi > 127) return null;
  return SHARP_NAMES[midi % 12] + '/' + (Math.floor(midi / 12) - 1);
}

/** 61 → "Do#4" */
export function midiName(midi) {
  if (!Number.isInteger(midi) || midi < 0 || midi > 127) return '?';
  return LATIN_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
}

/** Duración en negras (con puntillos). */
export function durBeats(ev) {
  if (!ev) return 0;
  const base = DUR_BEATS[String(ev.d)];
  if (base === undefined) return 0;
  const dots = ev.dots === 2 ? 2 : ev.dots === 1 ? 1 : 0;
  return base * (2 - Math.pow(0.5, dots));
}

function normKeySig(v) {
  if (typeof v !== 'string') return 'C';
  const s = v.trim();
  const m = /^([a-gA-G])([#b]?)(m?)$/.exec(s);
  if (!m) return 'C';
  return m[1].toUpperCase() + m[2] + m[3];
}

function normEvent(raw, where, errors) {
  if (!raw || typeof raw !== 'object') {
    errors.push(`${where}: evento inválido, descartado`);
    return null;
  }
  const d = String(raw.d).toLowerCase();
  if (!(d in DUR_BEATS)) {
    errors.push(`${where}: duración inválida "${raw.d}", descartado`);
    return null;
  }
  let ks = raw.k;
  if (typeof ks === 'string') ks = [ks];
  if (ks === undefined || ks === null) ks = [];
  if (!Array.isArray(ks)) {
    errors.push(`${where}: "k" inválido, descartado`);
    return null;
  }
  const k = [];
  const fs = [];
  const rawF = Array.isArray(raw.f) ? raw.f : [];
  ks.forEach((x, xi) => {
    const s = typeof x === 'string' ? x.trim().toLowerCase().replace(/\s+/g, '') : '';
    if (keyToMidi(s) === null) {
      errors.push(`${where}: altura inválida "${x}" ignorada`);
      return;
    }
    if (!k.includes(s)) { k.push(s); fs.push(fingerOf(rawF[xi])); }   // la digitación `f` va en paralelo a `k`
  });
  if (ks.length > 0 && k.length === 0) {
    errors.push(`${where}: sin alturas válidas, descartado`);
    return null;
  }
  const ev = { k, d };
  if (fs.some((x) => x > 0)) ev.f = fs;
  const dots = Number(raw.dots);
  if (dots === 1 || dots === 2) ev.dots = dots;
  if (raw.tie === true || raw.tie === 'true') ev.tie = true;
  return ev;
}

/** Normaliza una partitura. Nunca lanza excepción. ok = hay al menos una nota tocable. */
export function validateScore(obj) {
  const errors = [];
  const score = {
    id: '', title: 'Sin título', bpm: 80, timeSig: [4, 4], keySig: 'C', measures: [],
  };
  try {
    if (typeof obj === 'string') {
      try { obj = JSON.parse(obj); } catch (e) { obj = null; }
    }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      errors.push('La partitura no es un objeto válido');
      score.id = 's' + Date.now().toString(36);
      return { ok: false, errors, score };
    }
    score.id = typeof obj.id === 'string' && obj.id ? obj.id : 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    if (typeof obj.title === 'string' && obj.title.trim()) score.title = obj.title.trim();
    const bpm = Number(obj.bpm);
    if (Number.isFinite(bpm) && bpm > 0) score.bpm = Math.min(300, Math.max(20, Math.round(bpm)));
    if (Array.isArray(obj.timeSig) && obj.timeSig.length === 2) {
      const n = Number(obj.timeSig[0]);
      const dn = Number(obj.timeSig[1]);
      if (Number.isInteger(n) && n > 0 && n <= 32 && VALID_DEN.includes(dn)) score.timeSig = [n, dn];
    }
    score.keySig = normKeySig(obj.keySig);
    const su = typeof obj.sourceUrl === 'string' ? obj.sourceUrl.trim() : '';
    if (su && su.length <= 2000 && /^https?:\/\/\S+$/i.test(su)) score.sourceUrl = su;   // enlace de la canción original (sólo http/https)
    const art = typeof obj.artist === 'string' ? obj.artist.replace(/\s+/g, ' ').trim().slice(0, 120) : '';
    if (art) score.artist = art;                                                          // artista de la canción (búsqueda)
    if (obj.derivedFrom && typeof obj.derivedFrom === 'object' && typeof obj.derivedFrom.id === 'string' && obj.derivedFrom.id) {
      score.derivedFrom = { id: obj.derivedFrom.id.slice(0, 80), title: String(obj.derivedFrom.title || '').trim().slice(0, 120) };   // versión creada a partir de otra
    }
    if (obj.level === 'principiante' || obj.level === 'intermedio' || obj.level === 'pro') score.level = obj.level;
    if (ORIGINS.includes(obj.origin)) score.origin = obj.origin;
    if (obj.draft === true) score.draft = true;                                         // borrador: guardado solo, todavía sin confirmar en Revisión

    const ms = Array.isArray(obj.measures) ? obj.measures : [];
    if (!Array.isArray(obj.measures)) errors.push('Falta la lista de compases');
    let notes = 0;
    ms.forEach((m, mi) => {
      const out = { rh: [], lh: [] };
      if (!m || typeof m !== 'object') {
        errors.push(`Compás ${mi + 1}: inválido, queda vacío`);
      } else {
        for (const hand of ['rh', 'lh']) {
          const arr = Array.isArray(m[hand]) ? m[hand] : [];
          arr.forEach((raw, ei) => {
            const ev = normEvent(raw, `Compás ${mi + 1} ${hand}[${ei}]`, errors);
            if (ev) {
              out[hand].push(ev);
              if (ev.k.length && !ev.tie) notes++;
            }
          });
        }
      }
      score.measures.push(out);
    });
    // comentarios por compás y avisos ya revisados (opcionales)
    if (obj.comments && typeof obj.comments === 'object' && !Array.isArray(obj.comments)) {
      const cm = {};
      for (const key of Object.keys(obj.comments)) {
        const idx = Number(key);
        const txt = typeof obj.comments[key] === 'string' ? obj.comments[key].replace(/\s+/g, ' ').trim().slice(0, MAX_COMMENT) : '';
        if (Number.isInteger(idx) && idx >= 0 && idx < score.measures.length && txt) cm[idx] = txt;
      }
      if (Object.keys(cm).length) score.comments = cm;
    }
    if (Array.isArray(obj.reviewed)) {
      const rv = [...new Set(obj.reviewed.filter((x) => typeof x === 'string' && /^[a-z]{2,12}:\d{1,4}(:[a-z]{2})?$/.test(x)))].slice(0, 300);
      if (rv.length) score.reviewed = rv;
    }
    if (score.measures.length === 0) errors.push('La partitura no tiene compases');
    else if (notes === 0) errors.push('La partitura no tiene notas');
    return { ok: notes > 0, errors, score };
  } catch (e) {
    errors.push('Error inesperado al validar: ' + (e && e.message ? e.message : e));
    return { ok: false, errors, score };
  }
}

/**
 * Pasos de práctica: une ambas manos por instante, omite silencios y ligaduras.
 * Step = { i, t, measure, midi[], refs:[{measure, hand, idx, keyIdx}] }
 */
export function buildSteps(score, hands = 'both') {
  const measures = (score && Array.isArray(score.measures)) ? score.measures : [];
  const ts = (score && Array.isArray(score.timeSig)) ? score.timeSig : [4, 4];
  const barLen = (ts[0] * 4) / ts[1];
  const useHands = hands === 'rh' ? ['rh'] : hands === 'lh' ? ['lh'] : ['rh', 'lh'];
  const byT = new Map();
  let base = 0;
  measures.forEach((m, mi) => {
    let maxLen = 0;
    for (const hand of useHands) {
      const evs = (m && Array.isArray(m[hand])) ? m[hand] : [];
      let t = 0;
      evs.forEach((ev, idx) => {
        if (ev && !ev.tie && Array.isArray(ev.k) && ev.k.length > 0) {
          const abs = Math.round((base + t) * 1e6) / 1e6;
          let st = byT.get(abs);
          if (!st) {
            st = { t: abs, measure: mi, set: new Set(), refs: [] };
            byT.set(abs, st);
          }
          ev.k.forEach((key, keyIdx) => {
            const mid = keyToMidi(key);
            if (mid === null) return;
            st.set.add(mid);
            st.refs.push({ measure: mi, hand, idx, keyIdx });
          });
        }
        t += durBeats(ev);
      });
      if (t > maxLen) maxLen = t;
    }
    // Para "rh"/"lh" el largo del compás se toma de ambas manos para no desfasar el tiempo.
    if (useHands.length === 1) {
      const other = useHands[0] === 'rh' ? 'lh' : 'rh';
      const evs = (m && Array.isArray(m[other])) ? m[other] : [];
      const t = evs.reduce((a, ev) => a + durBeats(ev), 0);
      if (t > maxLen) maxLen = t;
    }
    base += maxLen > 0 ? maxLen : barLen;
  });
  return [...byT.values()]
    .filter((s) => s.set.size > 0)
    .sort((a, b) => a.t - b.t)
    .map((s, i) => ({
      i, t: s.t, measure: s.measure, midi: [...s.set].sort((a, b) => a - b), refs: s.refs,
    }));
}
