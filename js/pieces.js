// Partituras incluidas en la app: sólo dominio público, melodías muy conocidas en versiones sencillas.
// Lógica pura, sin DOM. Cada versión es un Score (mismo formato que model.js/validateScore).
//
// Origen de las melodías (para mantener la honestidad sobre qué se contrastó):
//  - Noche de Paz: melodía contrastada compás por compás con la edición de Mutopia (Gruber, 6/8, 12 compases, en Si bemol)
//    y transportada a Do.
//  - Greensleeves: contrastada con una transcripción en La menor, 3/4, anacrusis de negra (compases 1–15 del tema).
//  - Oda a la Alegría, Estrellita, Martinillo, Cumpleaños feliz, Minueto en Sol, Canon de Pachelbel y Para Elisa:
//    escritas de memoria (melodías tradicionales/estándar); Para Elisa y el Minueto son versiones simplificadas.
// Los acompañamientos ("Con acompañamiento") son armonizaciones sencillas propias, no transcripciones.
//
// `pickupBeats` (en la versión): si la partitura empieza con anacrusa declarada, el primer compás dura esa cantidad de
// negras en vez del compás completo. El resto de los compases suman exactamente el compás indicado.
import { fitHand } from './compose.js';

/* ------------------------------------------------------------------ mini-DSL para escribir compases */

// Acordes de la mano izquierda (registro cómodo, Do2–Do4). Primer elemento = bajo.
const CH = {
  C: ['c/3', 'e/3', 'g/3'], G: ['g/2', 'b/2', 'd/3'], G7: ['g/2', 'b/2', 'f/3'], F: ['f/2', 'a/2', 'c/3'],
  Am: ['a/2', 'c/3', 'e/3'], Dm: ['d/3', 'f/3', 'a/3'], Em: ['e/2', 'g/2', 'b/2'], D: ['d/3', 'f#/3', 'a/3'],
  A: ['a/2', 'c#/3', 'e/3'], E: ['e/2', 'g#/2', 'b/2'], Bm: ['b/2', 'd/3', 'f#/3'], 'F#m': ['f#/2', 'a/2', 'c#/3'],
};

const DUR = { w: 'w', h: 'h', q: 'q', 8: '8', 16: '16', 32: '32' };

/** "f#4" → "f#/4"; "bb3" → "bb/3". */
function key(tok) {
  const m = /^([a-g])(#|b)?(\d)$/.exec(tok);
  if (!m) throw new Error('altura inválida: ' + tok);
  return `${m[1]}${m[2] || ''}/${m[3]}`;
}

/**
 * Convierte "e4:q e4:q f4:q. r:h c3+e3:h <C>:h <C/b>:q. <C/u>:q." en eventos.
 * `r` = silencio; `+` junta alturas de un acorde; `<X>` = acorde de CH (`/b` sólo el bajo, `/u` las voces agudas).
 */
function evs(str) {
  return str.trim().split(/\s+/).map((tok) => {
    const [p, dd] = tok.split(':');
    const dots = dd.endsWith('..') ? 2 : dd.endsWith('.') ? 1 : 0;
    const d = DUR[dd.replace(/\./g, '')];
    if (!d) throw new Error('duración inválida: ' + tok);
    let k;
    if (p === 'r') k = [];
    else if (p.startsWith('<')) {
      const m = /^<([A-Za-z#0-9]+)(?:\/(b|u))?>$/.exec(p);
      const ch = m && CH[m[1]];
      if (!ch) throw new Error('acorde desconocido: ' + tok);
      k = m[2] === 'b' ? [ch[0]] : m[2] === 'u' ? ch.slice(1) : ch.slice();
    } else k = p.split('+').map(key);
    const ev = { k, d };
    if (dots) ev.dots = dots;
    return ev;
  });
}

const beatsOf = (list) => list.reduce((a, e) => a + ({ w: 4, h: 2, q: 1, 8: 0.5, 16: 0.25, 32: 0.125 }[e.d] * (e.dots === 2 ? 1.75 : e.dots === 1 ? 1.5 : 1)), 0);

/** Arma los compases: `rh` lista de strings; `lh` lista de strings o null (silencios del largo de cada compás). */
function build(rh, lh) {
  return rh.map((r, i) => {
    const right = evs(r);
    const left = lh ? evs(lh[i]) : fitHand([], beatsOf(right)).events;
    return { rh: right, lh: left };
  });
}

/* ------------------------------------------------------------------ piezas */

// --- Oda a la Alegría (Beethoven), Do mayor, 16 compases
const OA = {
  a1: 'e4:q e4:q f4:q g4:q', a2: 'g4:q f4:q e4:q d4:q', a3: 'c4:q c4:q d4:q e4:q',
  a4: 'e4:q. d4:8 d4:h', a5: 'd4:q. c4:8 c4:h',
  b1: 'd4:q d4:q e4:q c4:q', b2: 'd4:q e4:8 f4:8 e4:q c4:q', b3: 'd4:q e4:8 f4:8 e4:q d4:q', b4: 'c4:q d4:q g3:h',
};
const ODA_RH = [OA.a1, OA.a2, OA.a3, OA.a4, OA.a1, OA.a2, OA.a3, OA.a5, OA.b1, OA.b2, OA.b3, OA.b4, OA.a1, OA.a2, OA.a3, OA.a5];
const ODA_LH = [
  '<C>:h <C>:h', '<G>:h <G>:h', '<C>:h <C>:h', '<G>:h <C>:h',
  '<C>:h <C>:h', '<G>:h <G>:h', '<C>:h <C>:h', '<G>:h <C>:h',
  '<G>:h <C>:h', '<G>:h <C>:h', '<G>:h <C>:q <G>:q', '<C>:h <G>:h',
  '<C>:h <C>:h', '<G>:h <G>:h', '<C>:h <C>:h', '<G>:h <C>:h',
];

// --- Estrellita (Twinkle, Twinkle, Little Star), Do mayor, 12 compases
const T1 = 'c4:q c4:q g4:q g4:q'; const T2 = 'a4:q a4:q g4:h'; const T3 = 'f4:q f4:q e4:q e4:q';
const T4 = 'd4:q d4:q c4:h'; const T5 = 'g4:q g4:q f4:q f4:q'; const T6 = 'e4:q e4:q d4:h';
const TW_RH = [T1, T2, T3, T4, T5, T6, T5, T6, T1, T2, T3, T4];
const TW_LH = [
  '<C>:h <C>:h', '<F>:h <C>:h', '<F>:h <C>:h', '<G>:h <C>:h', '<C>:h <F>:h', '<C>:h <G>:h',
  '<C>:h <F>:h', '<C>:h <G>:h', '<C>:h <C>:h', '<F>:h <C>:h', '<F>:h <C>:h', '<G>:h <C>:h',
];

// --- Martinillo / Frère Jacques, Do mayor, 8 compases
const F1 = 'c4:q d4:q e4:q c4:q'; const F3 = 'e4:q f4:q g4:h'; const F5 = 'g4:8 a4:8 g4:8 f4:8 e4:q c4:q'; const F7 = 'c4:q g3:q c4:h';
const FJ_RH = [F1, F1, F3, F3, F5, F5, F7, F7];
const FJ_LH = ['<C>:h <C>:h', '<C>:h <C>:h', '<C>:h <C>:h', '<C>:h <G>:h', '<C>:h <C>:h', '<C>:h <C>:h', '<C>:h <C>:h', '<C>:h <C>:h'];

// --- Cumpleaños feliz (melodía tradicional), Do mayor, 3/4, anacrusa de una negra
const CB_RH = ['g4:8. g4:16', 'a4:q g4:q c5:q', 'b4:h g4:8. g4:16', 'a4:q g4:q d5:q', 'c5:h g4:8. g4:16',
  'g5:q e5:q c5:q', 'b4:q a4:q f5:8. f5:16', 'e5:q c5:q d5:q', 'c5:h.'];
const CB_LH = ['r:q', '<C>:h.', '<G7>:h.', '<G7>:h.', '<C>:h.', '<C>:h.', '<G7>:h <F>:q', '<C>:h <G7>:q', '<C>:h.'];

// --- Para Elisa (Beethoven), tema inicial simplificado, La menor, 3/8, anacrusa de dos semicorcheas
const FE_P = 'e5:16 d#5:16'; const FE1 = 'e5:16 d#5:16 e5:16 b4:16 d5:16 c5:16';
const FE2 = 'a4:8 r:q'; const FE3 = 'b4:8 r:q'; const FE4 = 'c5:8 r:8 e5:16 d#5:16'; const FE7 = 'b4:8 r:8 c5:16 b4:16'; const FE8 = 'a4:q.';
const FE_RH = [FE_P, FE1, FE2, FE3, FE4, FE1, FE2, FE7, FE8];
const FE_LH = ['r:8', 'r:q.', 'r:8. a2:16 e3:16 a3:16', 'r:8. e3:16 g#3:16 b3:16', 'r:8. a2:16 e3:16 a3:16',
  'r:q.', 'r:8. a2:16 e3:16 a3:16', 'r:8. e3:16 g#3:16 b3:16', 'a2+e3:q.'];

// --- Minueto en Sol (Petzold, antes atribuido a Bach), Sol mayor, 3/4, 16 compases
const MN = {
  m1: 'd5:q g4:8 a4:8 b4:8 c5:8', m2: 'd5:q g4:q g4:q', m3: 'e5:q c5:8 d5:8 e5:8 f#5:8', m4: 'g5:q g4:q g4:q',
  m5: 'c5:q d5:8 c5:8 b4:8 a4:8', m6: 'b4:q c5:8 b4:8 a4:8 g4:8', m7: 'f#4:q g4:8 a4:8 b4:8 g4:8', m8: 'a4:h.',
  m15: 'a4:q b4:8 a4:8 g4:8 f#4:8', m16: 'g4:h.',
};
const MN_RH = [MN.m1, MN.m2, MN.m3, MN.m4, MN.m5, MN.m6, MN.m7, MN.m8, MN.m1, MN.m2, MN.m3, MN.m4, MN.m5, MN.m6, MN.m15, MN.m16];
const MN_LH = [
  '<G>:h.', '<G>:h.', '<C>:h <D>:q', '<G>:h.', '<C>:q <D>:h', '<G>:h <D>:q', '<D>:h <G>:q', '<D>:h.',
  '<G>:h.', '<G>:h.', '<C>:h <D>:q', '<G>:h.', '<C>:q <D>:h', '<G>:h <D>:q', '<D>:q <G>:q <D>:q', '<G>:h.',
];

// --- Canon de Pachelbel, tema simplificado, Re mayor, 4/4 (dos negras blancas por compás)
const CA_RH = ['f#5:h e5:h', 'd5:h c#5:h', 'b4:h a4:h', 'b4:h c#5:h', 'd5:h c#5:h', 'b4:h a4:h', 'g4:h f#4:h', 'g4:h a4:h', 'd5:w'];
const CA_LH = ['<D>:h <A>:h', '<Bm>:h <F#m>:h', '<G>:h <D>:h', '<G>:h <A>:h', '<D>:h <A>:h', '<Bm>:h <F#m>:h', '<G>:h <D>:h', '<G>:h <A>:h', '<D>:w'];

// --- Noche de Paz (Gruber), Do mayor, 6/8, 12 compases
const S1 = 'g4:8. a4:16 g4:8 e4:q.'; const S3 = 'd5:q d5:8 b4:q.'; const S4 = 'c5:q c5:8 g4:q.';
const S5 = 'a4:q a4:8 c5:8. b4:16 a4:8'; const S9 = 'd5:q d5:8 f5:8. d5:16 b4:8';
const S10 = 'c5:q. e5:q.'; const S11 = 'c5:8. g4:16 e4:8 g4:8. f4:16 d4:8'; const S12 = 'c5:h.';
const SN_RH = [S1, S1, S3, S4, S5, S1, S5, S1, S9, S10, S11, S12];
const SN_LH = [
  '<C/b>:q. <C/u>:q.', '<C/b>:q. <C/u>:q.', '<G/b>:q. <G/u>:q.', '<C/b>:q. <C/u>:q.', '<F>:q. <G>:q.', '<C/b>:q. <C/u>:q.',
  '<F>:q. <G>:q.', '<C/b>:q. <C/u>:q.', '<G>:q. <G>:q.', '<C>:q. <C>:q.', '<C>:q. <G>:q.', '<C>:h.',
];

// --- Greensleeves (tradicional inglesa), La menor, 3/4, anacrusa de una negra
const GS = {
  p: 'a4:q', g1: 'c5:h d5:q', g2: 'e5:q. f5:8 e5:q', g3: 'd5:h b4:q', g4: 'g4:q. a4:8 b4:q', g5: 'c5:h a4:q',
  g6: 'a4:q. g#4:8 a4:q', g7: 'b4:h g#4:q', g8: 'e4:h a4:q', g13: 'c5:q. b4:8 a4:q', g14: 'g#4:q. f#4:8 g#4:q', g15: 'a4:h.',
};
const GS_RH = [GS.p, GS.g1, GS.g2, GS.g3, GS.g4, GS.g5, GS.g6, GS.g7, GS.g8, GS.g1, GS.g2, GS.g3, GS.g4, GS.g13, GS.g14, GS.g15];
const GS_LH = ['r:q', '<Am>:h.', '<Am>:h.', '<G>:h.', '<Em>:h.', '<Am>:h.', '<Am>:q <E>:h', '<E>:h.', '<Am>:h.',
  '<Am>:h.', '<Am>:h.', '<G>:h.', '<Em>:h.', '<Am>:h.', '<E>:h.', '<Am>:h.'];

function piece(id, title, composer, aliases, meta, rh, lh, extra = {}) {
  const base = { bpm: meta.bpm, timeSig: meta.timeSig, keySig: meta.keySig };
  const mk = (vid, label, withLh) => ({
    id: vid,
    label,
    ...(meta.pickupBeats ? { pickupBeats: meta.pickupBeats } : {}),
    score: { id: `${id}-${vid}`, title: `${title} (${label.toLowerCase()})`, ...base, measures: build(rh, withLh ? lh : null) },
  });
  const versions = [mk('melodia', 'Solo melodía', false)];
  if (lh) versions.push(mk('acompanamiento', 'Con acompañamiento', true));
  return { id, title, composer, aliases, ...extra, versions };
}

/** Catálogo de piezas incluidas. Cada pieza: {id, title, composer, aliases, versions:[{id, label, pickupBeats?, score}]}. */
import { bachPrelude } from './bach-prelude.js';

export const PIECES = [
  piece('oda-a-la-alegria', 'Oda a la Alegría', 'Ludwig van Beethoven',
    ['oda a la alegria', 'himno a la alegria', 'himno de la alegria', 'ode to joy', 'ode an die freude', 'novena sinfonia',
      'ninth symphony', 'hymn to joy', 'freude schoner gotterfunken'],
    { bpm: 96, timeSig: [4, 4], keySig: 'C' }, ODA_RH, ODA_LH),
  piece('estrellita', 'Estrellita (Twinkle, Twinkle, Little Star)', 'Tradicional (melodía francesa, s. XVIII)',
    ['estrellita', 'estrellita donde estas', 'estrellita dónde estás', 'twinkle twinkle little star', 'twinkle twinkle', 'twinkle', 'little star',
      'ah vous dirai-je maman', 'ah vous dirai je maman', 'brilla brilla estrellita'],
    { bpm: 100, timeSig: [4, 4], keySig: 'C' }, TW_RH, TW_LH),
  piece('martinillo', 'Martinillo (Frère Jacques)', 'Tradicional (francesa)',
    ['martinillo', 'fray martin', 'fray martín', 'hermano santiago', 'frere jacques', 'frère jacques', 'brother john', 'are you sleeping', 'duerme usted'],
    { bpm: 100, timeSig: [4, 4], keySig: 'C' }, FJ_RH, FJ_LH),
  piece('cumpleanos-feliz', 'Cumpleaños feliz', 'Tradicional (Hill y Hill, 1893)',
    ['cumpleanos feliz', 'cumpleaños feliz', 'feliz cumpleanos', 'feliz cumpleaños', 'happy birthday', 'happy birthday to you', 'cumple feliz', 'que los cumplas feliz'],
    { bpm: 100, timeSig: [3, 4], keySig: 'C', pickupBeats: 1 }, CB_RH, CB_LH),
  piece('para-elisa', 'Para Elisa (tema inicial)', 'Ludwig van Beethoven',
    ['para elisa', 'fur elise', 'für elise', 'for elise', 'bagatela en la menor', 'bagatelle in a minor', 'wo0 59', 'woo 59', 'bagatelle no 25'],
    { bpm: 66, timeSig: [3, 8], keySig: 'Am', pickupBeats: 0.5 }, FE_RH, FE_LH),
  piece('minueto-en-sol', 'Minueto en Sol', 'Christian Petzold (atribuido antes a J. S. Bach)',
    ['minueto en sol', 'minueto en sol mayor', 'minuet in g', 'minuet in g major', 'menuet in g', 'minuet in g major bwv anh 114', 'bwv anh 114', 'minueto de bach'],
    { bpm: 110, timeSig: [3, 4], keySig: 'G' }, MN_RH, MN_LH),
  piece('canon-de-pachelbel', 'Canon en Re (tema)', 'Johann Pachelbel',
    ['canon de pachelbel', 'canon en re', 'canon en re mayor', 'pachelbel canon', 'canon in d', 'pachelbels canon', 'canon pachelbel'],
    { bpm: 60, timeSig: [4, 4], keySig: 'D' }, CA_RH, CA_LH),
  piece('noche-de-paz', 'Noche de Paz', 'Franz Xaver Gruber',
    ['noche de paz', 'noche de paz noche de amor', 'silent night', 'silent night holy night', 'stille nacht', 'stille nacht heilige nacht'],
    { bpm: 80, timeSig: [6, 8], keySig: 'C' }, SN_RH, SN_LH),
  piece('greensleeves', 'Greensleeves', 'Tradicional inglesa (s. XVI)',
    ['greensleeves', 'green sleeves', 'mangas verdes', 'what child is this', 'alas my love'],
    { bpm: 100, timeSig: [3, 4], keySig: 'Am', pickupBeats: 1 }, GS_RH, GS_LH),
  bachPrelude,
];

/* ------------------------------------------------------------------ búsqueda */

/** minúsculas, sin tildes ni signos, espacios colapsados. */
export function normalizeText(s) {
  return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/&/g, ' y ').replace(/[^a-z0-9]+/g, ' ').trim();
}

const STOP = new Set(['a', 'la', 'el', 'los', 'las', 'de', 'del', 'en', 'y', 'the', 'of', 'to', 'in', 'and', 'for', 'por', 'para', 'un', 'una', 'an']);
const tokens = (s) => normalizeText(s).split(' ').filter(Boolean);
const content = (s) => tokens(s).filter((t) => !STOP.has(t));

function lev1(a, b) {                                   // ¿distancia de edición ≤ 1?
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1);
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : b.slice(i + 1) === a.slice(i);
}
const tokMatch = (q, t) => q === t || (q.length >= 5 && t.length >= 5 && lev1(q, t));

function aliasScore(qNorm, qToks, alias) {
  const aNorm = normalizeText(alias);
  if (!aNorm) return 0;
  if (qNorm === aNorm) return 1;
  const aToks = content(alias);
  if (!qToks.length || !aToks.length) return 0;
  const bounded = (hay, needle) => (` ${hay} `).includes(` ${needle} `);
  if (qNorm.length >= 3 && bounded(aNorm, qNorm)) return Math.min(0.95, 0.75 + 0.2 * (qNorm.length / aNorm.length));
  if (aNorm.length >= 5 && bounded(qNorm, aNorm)) return Math.min(0.9, 0.7 + 0.2 * (aNorm.length / qNorm.length));
  const hit = qToks.filter((q) => aToks.some((t) => tokMatch(q, t))).length;
  if (hit === qToks.length) return 0.6 + 0.2 * (hit / aToks.length);                      // todas las palabras del pedido están
  if (hit >= 2 && hit / aToks.length >= 0.75) return 0.55 + 0.1 * (hit / qToks.length);  // pedido más largo que el alias (con artista, etc.)
  return 0;
}

/**
 * Busca piezas incluidas por título/alias (sin tildes ni mayúsculas, coincidencia parcial y errores de tipeo de 1 letra).
 * @param {string} query texto libre
 * @returns {{piece: object, score: number}[]} ordenado de mayor a menor (score 0..1, sólo ≥ 0.5)
 */
export function findPiece(query) {
  const qNorm = normalizeText(query);
  const qToks = content(query);
  if (!qNorm || !qToks.length) return [];
  const out = [];
  for (const piece of PIECES) {
    let best = 0;
    for (const name of [piece.title, ...piece.aliases]) best = Math.max(best, aliasScore(qNorm, qToks, name));
    if (best >= 0.5) out.push({ piece, score: Math.round(best * 1000) / 1000 });
  }
  return out.sort((a, b) => b.score - a.score);
}

/**
 * Copia profunda del Score de una versión (para que la app pueda modificarla sin tocar el catálogo).
 * @param {string} pieceId @param {string} [versionId] por defecto la primera (melodía sencilla)
 * @returns {object|null}
 */
export function getPieceScore(pieceId, versionId) {
  const p = PIECES.find((x) => x.id === pieceId);
  if (!p) return null;
  const v = versionId ? p.versions.find((x) => x.id === versionId) : p.versions[0];
  return v ? JSON.parse(JSON.stringify(v.score)) : null;
}
