// Importadores: MusicXML/MXL, MIDI, PDF → imágenes, preparación de fotos.
// El XML se parsea con una mini implementación propia (sin DOMParser) para que
// funcione igual en navegador y en Node.
import { validateScore, keyToMidi } from './model.js';
import { unzipSync } from '../vendor/fflate.mjs';

/* ------------------------------------------------------------------ utilidades */

const TYPE_TO_D = { whole: 'w', half: 'h', quarter: 'q', eighth: '8', '16th': '16', '32nd': '32', '64th': '32', '128th': '32', breve: 'w', long: 'w' };
const D_BEATS = { w: 4, h: 2, q: 1, '8': 0.5, '16': 0.25, '32': 0.125 };
// Valores representables en negras (con puntillos), de mayor a menor.
const SHAPES = [
  { b: 4, d: 'w', dots: 0 }, { b: 3.5, d: 'h', dots: 2 }, { b: 3, d: 'h', dots: 1 }, { b: 2, d: 'h', dots: 0 },
  { b: 1.75, d: 'q', dots: 2 }, { b: 1.5, d: 'q', dots: 1 }, { b: 1, d: 'q', dots: 0 },
  { b: 0.75, d: '8', dots: 1 }, { b: 0.5, d: '8', dots: 0 }, { b: 0.375, d: '16', dots: 1 },
  { b: 0.25, d: '16', dots: 0 }, { b: 0.1875, d: '32', dots: 1 }, { b: 0.125, d: '32', dots: 0 },
];
const EPS = 1e-6;

function mkEvent(shape, k, tie) {
  const ev = { k: k.slice(), d: shape.d };
  if (shape.dots) ev.dots = shape.dots;
  if (tie) ev.tie = true;
  return ev;
}

/** Descompone una duración (en negras) en formas representables, de mayor a menor. */
export function splitBeats(beats) {
  const out = [];
  let rem = beats;
  let guard = 0;
  while (rem > 0.125 / 2 && guard++ < 64) {
    const s = SHAPES.find((x) => x.b <= rem + EPS);
    if (!s) break;
    out.push(s);
    rem -= s.b;
  }
  return out;
}

/** Eventos (rests o notas con ligaduras entre las partes) para una duración arbitraria. */
function eventsForSpan(k, beats, firstTie) {
  return splitBeats(beats).map((s, i) => mkEvent(s, k, k.length ? (i === 0 ? firstTie : true) : false));
}

function newId() {
  return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function baseName(file) {
  const n = (file && file.name) || '';
  return n.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim();
}

async function readBytes(file) {
  if (file instanceof Uint8Array) return file;
  if (file instanceof ArrayBuffer) return new Uint8Array(file);
  return new Uint8Array(await file.arrayBuffer());
}

const FLAT_NAMES = ['c', 'db', 'd', 'eb', 'e', 'f', 'gb', 'g', 'ab', 'a', 'bb', 'b'];
const SHARP_NAMES = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
function midiKey(m, flats) {
  return (flats ? FLAT_NAMES : SHARP_NAMES)[m % 12] + '/' + (Math.floor(m / 12) - 1);
}

const KEYS_MAJOR = ['Cb', 'Gb', 'Db', 'Ab', 'Eb', 'Bb', 'F', 'C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#'];
const KEYS_MINOR = ['Abm', 'Ebm', 'Bbm', 'Fm', 'Cm', 'Gm', 'Dm', 'Am', 'Em', 'Bm', 'F#m', 'C#m', 'G#m', 'D#m', 'A#m'];
function fifthsToKey(f, minor) {
  const i = Math.max(-7, Math.min(7, f)) + 7;
  return (minor ? KEYS_MINOR : KEYS_MAJOR)[i];
}

function finish(obj, what) {
  const r = validateScore(obj);
  if (!r.ok || !r.score.measures.length) {
    throw new Error(`No se encontraron notas en el archivo ${what}.`);
  }
  return r.score;
}

/* ------------------------------------------------------------------ mini XML */

/** Parser XML mínimo → { name, attrs, children:[nodes], text }. Suficiente para MusicXML. */
export function parseXml(src) {
  let i = 0;
  const n = src.length;
  const decode = (s) => s.replace(/&(#x[0-9a-fA-F]+|#\d+|lt|gt|amp|quot|apos);/g, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" }[e];
  });
  const root = { name: '#root', attrs: {}, children: [], text: '' };
  const stack = [root];
  while (i < n) {
    const lt = src.indexOf('<', i);
    const cur = stack[stack.length - 1];
    if (lt === -1) break;
    if (lt > i) cur.text += decode(src.slice(i, lt));
    if (src.startsWith('<!--', lt)) {
      const e = src.indexOf('-->', lt + 4);
      i = e === -1 ? n : e + 3;
    } else if (src.startsWith('<![CDATA[', lt)) {
      const e = src.indexOf(']]>', lt);
      const end = e === -1 ? n : e;
      cur.text += src.slice(lt + 9, end);
      i = end + 3;
    } else if (src.startsWith('<?', lt)) {
      const e = src.indexOf('?>', lt);
      i = e === -1 ? n : e + 2;
    } else if (src.startsWith('<!', lt)) {
      // DOCTYPE (posible subconjunto interno entre corchetes)
      let depth = 0;
      let j = lt + 2;
      for (; j < n; j++) {
        const c = src[j];
        if (c === '[') depth++;
        else if (c === ']') depth--;
        else if (c === '>' && depth <= 0) break;
      }
      i = j + 1;
    } else if (src[lt + 1] === '/') {
      const e = src.indexOf('>', lt);
      if (stack.length > 1) stack.pop();
      i = e === -1 ? n : e + 1;
    } else {
      // etiqueta de apertura
      let j = lt + 1;
      let q = null;
      for (; j < n; j++) {
        const c = src[j];
        if (q) { if (c === q) q = null; } else if (c === '"' || c === "'") q = c;
        else if (c === '>') break;
      }
      let inner = src.slice(lt + 1, j);
      const selfClose = inner.endsWith('/');
      if (selfClose) inner = inner.slice(0, -1);
      const m = /^([^\s/>]+)/.exec(inner);
      const node = { name: m ? m[1] : '', attrs: {}, children: [], text: '' };
      const re = /([^\s=]+)\s*=\s*("([^"]*)"|'([^']*)')/g;
      let a;
      while ((a = re.exec(inner))) node.attrs[a[1]] = decode(a[3] !== undefined ? a[3] : a[4]);
      cur.children.push(node);
      if (!selfClose) stack.push(node);
      i = j + 1;
    }
  }
  return root.children.find((c) => c.name && c.name[0] !== '!') || null;
}

const kid = (node, name) => (node ? node.children.find((c) => c.name === name) : undefined);
const kids = (node, name) => (node ? node.children.filter((c) => c.name === name) : []);
const txt = (node, name) => { const c = kid(node, name); return c ? c.text.trim() : undefined; };
const num = (node, name) => { const t = txt(node, name); return t === undefined || t === '' ? undefined : Number(t); };

/* ------------------------------------------------------------------ MusicXML */

function stepKey(p) {
  const step = txt(p, 'step').toLowerCase();
  const alter = Math.round(num(p, 'alter') || 0);
  const acc = alter > 0 ? '#'.repeat(Math.min(alter, 2)) : alter < 0 ? 'b'.repeat(Math.min(-alter, 2)) : '';
  return `${step}${acc}/${num(p, 'octave')}`;
}

function parseMetronomeBpm(dir) {
  const met = kid(dir, 'direction-type') && kid(kid(dir, 'direction-type'), 'metronome');
  if (!met) return undefined;
  const unit = txt(met, 'beat-unit');
  const pm = Number(txt(met, 'per-minute'));
  if (!pm) return undefined;
  let beats = { whole: 4, half: 2, quarter: 1, eighth: 0.5, '16th': 0.25 }[unit] || 1;
  if (kid(met, 'beat-unit-dot')) beats *= 1.5;
  return pm * beats;
}

/**
 * Lee un documento score-partwise ya parseado → objeto Score (sin validar).
 * Estructura intermedia: por parte y compás, lista de notas {start,dur,staff,voice,keys,rest,tie,d,dots}.
 */
export function musicXmlToScore(root, fallbackTitle = '') {
  if (!root) throw new Error('El archivo no es un MusicXML válido.');
  if (root.name === 'score-timewise') throw new Error('MusicXML "timewise" no está soportado; exportalo como "partwise".');
  if (root.name !== 'score-partwise') throw new Error('El archivo no es un MusicXML válido.');

  const title = txt(kid(root, 'work'), 'work-title') || txt(root, 'movement-title') || fallbackTitle || 'Sin título';
  const parts = kids(root, 'part');
  if (!parts.length) throw new Error('El MusicXML no contiene partes.');

  let bpm; let timeSig; let keySig;
  const partData = parts.map((part) => {
    let divisions = 1;
    let curTS = timeSig || [4, 4];
    const measures = [];
    kids(part, 'measure').forEach((mEl) => {
      const notes = [];
      let pos = 0;
      let lastStart = 0;
      let maxEnd = 0;
      for (const el of mEl.children) {
        if (el.name === 'attributes') {
          const dv = num(el, 'divisions'); if (dv) divisions = dv;
          const t = kid(el, 'time');
          if (t) {
            const b = Number(txt(t, 'beats')); const bt = Number(txt(t, 'beat-type'));
            if (b > 0 && bt > 0) { curTS = [b, bt]; if (!timeSig) timeSig = [b, bt]; }
          }
          const k = kid(el, 'key');
          if (k && !keySig) {
            const f = num(k, 'fifths');
            if (f !== undefined) keySig = fifthsToKey(f, txt(k, 'mode') === 'minor');
          }
        } else if (el.name === 'direction') {
          const snd = kid(el, 'sound');
          const t = snd && snd.attrs.tempo ? Number(snd.attrs.tempo) : parseMetronomeBpm(el);
          if (t && !bpm) bpm = t;
        } else if (el.name === 'sound') {
          if (el.attrs.tempo && !bpm) bpm = Number(el.attrs.tempo);
        } else if (el.name === 'backup') {
          pos -= num(el, 'duration') || 0; if (pos < 0) pos = 0;
        } else if (el.name === 'forward') {
          pos += num(el, 'duration') || 0;
        } else if (el.name === 'note') {
          if (kid(el, 'grace')) continue;
          const dur = num(el, 'duration') || 0;
          const isChord = !!kid(el, 'chord');
          const start = isChord ? lastStart : pos;
          const rest = !!kid(el, 'rest');
          const pitch = kid(el, 'pitch');
          const staff = num(el, 'staff') || 1;
          const voice = txt(el, 'voice') || '1';
          const tieStop = kids(el, 'tie').some((t) => t.attrs.type === 'stop')
            || kids(kid(el, 'notations'), 'tied').some((t) => t.attrs.type === 'stop');
          const type = txt(el, 'type');
          const n = {
            start: start / divisions, dur: dur / divisions, staff, voice, rest, tie: tieStop,
            keys: pitch ? [stepKey(pitch)] : [], type: TYPE_TO_D[type], dots: Math.min(2, kids(el, 'dot').length),
            measureRest: rest && kid(el, 'rest').attrs.measure === 'yes',
          };
          if (!rest && !pitch) continue; // unpitched: ignorar
          notes.push(n);
          if (!isChord) { lastStart = pos; pos += dur; }
          maxEnd = Math.max(maxEnd, (start + dur) / divisions);
        }
      }
      measures.push({ notes, ts: curTS, implicit: mEl.attrs.implicit === 'yes', maxEnd });
    });
    const maxStaff = Math.max(1, ...measures.flatMap((m) => m.notes.map((n) => n.staff)));
    return { measures, maxStaff };
  });

  const ts = timeSig || [4, 4];
  const totalMeasures = Math.max(...partData.map((p) => p.measures.length));
  const twoStaves = partData.some((p) => p.maxStaff >= 2);
  const twoParts = partData.length >= 2;

  const out = [];
  for (let mi = 0; mi < totalMeasures; mi++) {
    const rhN = []; const lhN = [];
    let mlen = 0; let implicit = false; let tsM = ts;
    partData.forEach((p, pi) => {
      const m = p.measures[mi];
      if (!m) return;
      tsM = m.ts; implicit = implicit || m.implicit;
      mlen = Math.max(mlen, m.maxEnd);
      m.notes.forEach((n) => {
        if (twoStaves) {
          // Parte con dos pentagramas (o varias): staff 1 → rh, staff 2 → lh
          if (twoParts && p.maxStaff < 2) (pi === 0 ? rhN : lhN).push(n);
          else (n.staff >= 2 || (twoParts && pi >= 1) ? lhN : rhN).push(n);
        } else if (twoParts) {
          (pi === 0 ? rhN : lhN).push(n);
        } else if (n.rest) {
          // una sola parte sin staffs: se separa por do central
          rhN.push(n); lhN.push(n);
        } else {
          const hi = n.keys.filter((k) => keyToMidi(k) >= 60);
          const lo = n.keys.filter((k) => keyToMidi(k) < 60);
          if (hi.length) rhN.push({ ...n, keys: hi });
          if (lo.length) lhN.push({ ...n, keys: lo });
        }
      });
    });
    const full = tsM[0] * 4 / tsM[1];
    const len = implicit && mlen > 0 && mlen < full ? mlen : full;
    out.push({ rh: voiceToEvents(rhN, len), lh: voiceToEvents(lhN, len) });
  }

  return {
    id: newId(), title, bpm: bpm ? Math.round(bpm) : 80, timeSig: ts, keySig: keySig || 'C', measures: out,
  };
}

/** Elige la voz principal, fusiona voces simultáneas de igual inicio/duración y rellena con silencios. */
function voiceToEvents(notes, len) {
  const sounding = notes.filter((n) => !n.rest);
  if (!sounding.length) return eventsForSpan([], len, false);
  // voz principal = la de menor número presente (la voz 1 suele ser la melodía / voz superior)
  const voices = [...new Set(sounding.map((n) => n.voice))];
  const main = voices.sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))[0];

  // eventos de la voz principal agrupados por inicio
  const slots = [];
  const byStart = new Map();
  sounding.filter((n) => n.voice === main).sort((a, b) => a.start - b.start).forEach((n) => {
    const key = n.start.toFixed(5);
    let s = byStart.get(key);
    if (!s) { s = { start: n.start, dur: n.dur, keys: [], tie: n.tie, type: n.type, dots: n.dots }; byStart.set(key, s); slots.push(s); }
    n.keys.forEach((k) => { if (!s.keys.includes(k)) s.keys.push(k); });
    s.dur = Math.min(s.dur, n.dur);
  });
  // fusionar notas de otras voces que coinciden en inicio y duración
  sounding.filter((n) => n.voice !== main).forEach((n) => {
    const s = byStart.get(n.start.toFixed(5));
    if (s && Math.abs(s.dur - n.dur) < EPS) n.keys.forEach((k) => { if (!s.keys.includes(k)) s.keys.push(k); });
  });

  const evs = [];
  let cursor = 0;
  slots.sort((a, b) => a.start - b.start).forEach((s) => {
    if (s.start < cursor - EPS) return; // solapado: se descarta
    if (s.start > cursor + EPS) evs.push(...eventsForSpan([], s.start - cursor, false));
    const keys = s.keys.slice().sort((a, b) => keyToMidi(a) - keyToMidi(b));
    // Si el tipo+puntillos del XML coincide con la duración, usarlos tal cual (tresillos, etc.)
    const shapeBeats = s.type ? D_BEATS[s.type] * (2 - Math.pow(0.5, s.dots || 0)) : 0;
    if (s.type && s.keys.length && Math.abs(shapeBeats - s.dur) < EPS) {
      evs.push(mkEvent({ d: s.type, dots: s.dots }, keys, s.tie));
    } else {
      const piece = eventsForSpan(keys, s.dur, !!s.tie);
      evs.push(...piece);
    }
    cursor = s.start + s.dur;
  });
  if (cursor < len - EPS) evs.push(...eventsForSpan([], len - cursor, false));
  return evs;
}

const decodeUtf = (u8) => {
  if (u8[0] === 0xff && u8[1] === 0xfe) return new TextDecoder('utf-16le').decode(u8);
  if (u8[0] === 0xfe && u8[1] === 0xff) return new TextDecoder('utf-16be').decode(u8);
  return new TextDecoder('utf-8').decode(u8);
};

/** Importa texto XML o bytes de .mxl. */
export async function importMusicXml(file) {
  const bytes = await readBytes(file);
  let xml;
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
    // zip (.mxl)
    let files;
    try { files = unzipSync(bytes); } catch (e) { throw new Error('No se pudo abrir el archivo .mxl (zip dañado).'); }
    const names = Object.keys(files);
    let rootPath;
    const cont = files['META-INF/container.xml'];
    if (cont) {
      const c = parseXml(decodeUtf(cont));
      const rf = c && (function find(n) {
        if (n.name === 'rootfile' && n.attrs['full-path']) return n;
        for (const ch of n.children) { const r = find(ch); if (r) return r; }
        return null;
      })(c);
      if (rf) rootPath = rf.attrs['full-path'];
    }
    if (!rootPath || !files[rootPath]) {
      rootPath = names.find((x) => !x.startsWith('META-INF/') && /\.(xml|musicxml)$/i.test(x));
    }
    if (!rootPath) throw new Error('El .mxl no contiene una partitura MusicXML.');
    xml = decodeUtf(files[rootPath]);
  } else {
    xml = decodeUtf(bytes);
  }
  let root;
  try { root = parseXml(xml); } catch (e) { throw new Error('El archivo no es un MusicXML válido.'); }
  return finish(musicXmlToScore(root, baseName(file)), 'MusicXML');
}

/* ------------------------------------------------------------------ MIDI */

/** Parser SMF mínimo. Devuelve { format, ppq, tracks:[{name, events:[{tick, type, ...}]}] }. */
export function parseMidi(buf) {
  const u = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const dv = new DataView(u.buffer, u.byteOffset, u.byteLength);
  const str = (o, l) => String.fromCharCode(...u.subarray(o, o + l));
  let p = 0;
  // Algunos archivos RIFF-wrapped (RMID)
  if (str(0, 4) === 'RIFF') { const at = u.findIndex((_, k) => k + 4 <= u.length && str(k, 4) === 'MThd'); if (at < 0) throw new Error('El archivo no es un MIDI válido.'); p = at; }
  if (str(p, 4) !== 'MThd') throw new Error('El archivo no es un MIDI válido.');
  const hlen = dv.getUint32(p + 4);
  const format = dv.getUint16(p + 8);
  const ntrk = dv.getUint16(p + 10);
  const division = dv.getUint16(p + 12);
  if (division & 0x8000) throw new Error('MIDI con temporización SMPTE no soportado.');
  const ppq = division;
  p += 8 + hlen;
  const tracks = [];
  for (let t = 0; t < ntrk && p + 8 <= u.length; t++) {
    if (str(p, 4) !== 'MTrk') { const l = dv.getUint32(p + 4); p += 8 + l; t--; if (p >= u.length) break; continue; }
    const len = dv.getUint32(p + 4);
    let q = p + 8;
    const end = Math.min(u.length, q + len);
    p = q + len;
    const events = [];
    let tick = 0; let running = 0; let name = '';
    const vlq = () => { let v = 0; let b; do { b = u[q++]; v = (v << 7) | (b & 0x7f); } while ((b & 0x80) && q < end); return v; };
    while (q < end) {
      tick += vlq();
      let st = u[q];
      if (st === undefined) break;
      if (st >= 0x80) { q++; if (st < 0xf0) running = st; } else st = running;
      if (st === 0xff) {
        const type = u[q++]; const l = vlq(); const data = u.subarray(q, q + l); q += l;
        if (type === 0x03 && !name) name = String.fromCharCode(...data);
        else if (type === 0x51 && l === 3) events.push({ tick, type: 'tempo', uspq: (data[0] << 16) | (data[1] << 8) | data[2] });
        else if (type === 0x58 && l >= 2) events.push({ tick, type: 'timesig', num: data[0], den: Math.pow(2, data[1]) });
        else if (type === 0x59 && l >= 2) events.push({ tick, type: 'key', sf: (data[0] << 24) >> 24, minor: data[1] === 1 });
        else if (type === 0x2f) break;
      } else if (st === 0xf0 || st === 0xf7) {
        const l = vlq(); q += l;
      } else if (st >= 0xf1) {
        // otros mensajes de sistema (no esperables en SMF)
        if (st === 0xf2) q += 2; else if (st === 0xf1 || st === 0xf3) q += 1;
      } else {
        const hi = st & 0xf0; const ch = st & 0x0f;
        if (hi === 0xc0 || hi === 0xd0) { q += 1; continue; }
        const d1 = u[q++]; const d2 = u[q++];
        if (hi === 0x90 && d2 > 0) events.push({ tick, type: 'on', ch, note: d1, vel: d2 });
        else if (hi === 0x80 || hi === 0x90) events.push({ tick, type: 'off', ch, note: d1 });
      }
    }
    tracks.push({ name, events });
  }
  return { format, ppq, tracks };
}

/** SMF parseado → Score (sin validar). */
export function midiToScore(midi, fallbackTitle = '') {
  const { ppq, tracks } = midi;
  let uspq; let ts; let key;
  tracks.forEach((t) => t.events.forEach((e) => {
    if (e.type === 'tempo' && uspq === undefined) uspq = e.uspq;
    if (e.type === 'timesig' && !ts) ts = [e.num, e.den];
    if (e.type === 'key' && !key) key = e;
  }));
  const bpm = uspq ? Math.round(60000000 / uspq) : 120;
  ts = ts || [4, 4];
  const keySig = key ? fifthsToKey(key.sf, key.minor) : 'C';
  const flats = key ? key.sf < 0 : false;

  const grid = ppq / 4; // semicorchea
  // Notas por grupo (pista+canal), sin percusión (canal 10)
  const groups = new Map();
  tracks.forEach((t, ti) => {
    const open = new Map();
    t.events.forEach((e) => {
      if (e.type !== 'on' && e.type !== 'off') return;
      if (e.ch === 9) return;
      const kk = e.ch + ':' + e.note;
      if (e.type === 'on') {
        if (open.has(kk)) { // re-ataque sin off: cerrar el anterior
          const o = open.get(kk); push(groups, ti, e.ch, { s: o, e: e.tick, p: e.note });
        }
        open.set(kk, e.tick);
      } else if (open.has(kk)) {
        push(groups, ti, e.ch, { s: open.get(kk), e: e.tick, p: e.note });
        open.delete(kk);
      }
    });
    open.forEach((s, kk) => push(groups, ti, Number(kk.split(':')[0]), { s, e: s + ppq, p: Number(kk.split(':')[1]) }));
  });
  function push(g, ti, ch, n) {
    const id = ti + ':' + ch;
    if (!g.has(id)) g.set(id, []);
    g.get(id).push(n);
  }
  const quant = (arr) => arr.map((n) => {
    const s = Math.round(n.s / grid);
    const e = Math.max(s + 1, Math.round(n.e / grid));
    return { s, e, p: n.p };
  });
  const gl = [...groups.values()].filter((g) => g.length).map(quant);
  if (!gl.length) throw new Error('No se encontraron notas en el archivo MIDI.');

  let rhNotes; let lhNotes;
  if (gl.length >= 2) {
    // por pista/canal: el grupo de mayor altura media es la mano derecha; el resto va con la más cercana
    const mean = (g) => g.reduce((a, n) => a + n.p, 0) / g.length;
    const sorted = gl.slice().sort((a, b) => mean(b) - mean(a));
    const hiMean = mean(sorted[0]); const loMean = mean(sorted[sorted.length - 1]);
    rhNotes = []; lhNotes = [];
    sorted.forEach((g) => { (Math.abs(mean(g) - hiMean) <= Math.abs(mean(g) - loMean) ? rhNotes : lhNotes).push(...g); });
  } else {
    const all = gl[0];
    rhNotes = all.filter((n) => n.p >= 60);
    lhNotes = all.filter((n) => n.p < 60);
  }

  const mlen = ts[0] * (16 / ts[1]); // en semicorcheas
  const last = Math.max(...gl.flat().map((n) => n.e));
  const nMeasures = Math.max(1, Math.ceil(last / mlen));

  const rh = handToMeasures(rhNotes, mlen, nMeasures, flats);
  const lh = handToMeasures(lhNotes, mlen, nMeasures, flats);
  const measures = [];
  for (let i = 0; i < nMeasures; i++) measures.push({ rh: rh[i], lh: lh[i] });

  const title = (tracks.find((t) => t.name && t.events.some((e) => e.type === 'on')) || tracks.find((t) => t.name) || {}).name;
  return { id: newId(), title: (fallbackTitle || title || 'Sin título'), bpm, timeSig: ts, keySig, measures };
}

const SIXT_SHAPES = SHAPES.map((s) => ({ ...s, u: s.b * 4 })).filter((s) => Number.isInteger(s.u));

function splitUnits(u) {
  const out = [];
  let rem = u;
  while (rem > 0) {
    const s = SIXT_SHAPES.find((x) => x.u <= rem);
    out.push(s); rem -= s.u;
  }
  return out;
}

function handToMeasures(notes, mlen, nMeasures, flats) {
  // acordes por inicio; duración hasta el próximo inicio (o fin real si es antes)
  const byStart = new Map();
  notes.forEach((n) => {
    if (!byStart.has(n.s)) byStart.set(n.s, []);
    byStart.get(n.s).push(n);
  });
  const starts = [...byStart.keys()].sort((a, b) => a - b);
  const slots = [];
  starts.forEach((s, i) => {
    const grp = byStart.get(s);
    const end = Math.min(...grp.map((n) => n.e));
    const next = i + 1 < starts.length ? starts[i + 1] : Infinity;
    const e = Math.max(s + 1, Math.min(end, next));
    const pitches = [...new Set(grp.map((n) => n.p))].sort((a, b) => a - b);
    slots.push({ s, e, keys: pitches.map((m) => midiKey(m, flats)) });
  });
  // línea de tiempo plana: {start,end,keys|[]}
  const line = [];
  let cur = 0;
  slots.forEach((sl) => {
    if (sl.s > cur) line.push({ s: cur, e: sl.s, keys: [] });
    line.push(sl); cur = sl.e;
  });
  const total = nMeasures * mlen;
  if (cur < total) line.push({ s: cur, e: total, keys: [] });

  const res = Array.from({ length: nMeasures }, () => []);
  line.forEach((seg) => {
    let s = seg.s;
    let first = true;
    while (s < seg.e) {
      const mi = Math.floor(s / mlen);
      if (mi >= nMeasures) break;
      const mEnd = (mi + 1) * mlen;
      const e = Math.min(seg.e, mEnd);
      splitUnits(e - s).forEach((sh, idx) => {
        res[mi].push(mkEvent(sh, seg.keys, seg.keys.length ? !(first && idx === 0) : false));
      });
      first = false;
      s = e;
    }
  });
  res.forEach((m, i) => { if (!m.length) res[i] = splitUnits(mlen).map((sh) => mkEvent(sh, [], false)); });
  return res;
}

export async function importMidiFile(file) {
  const bytes = await readBytes(file);
  const parsed = parseMidi(bytes);
  return finish(midiToScore(parsed, baseName(file)), 'MIDI');
}

/* ------------------------------------------------------------------ PDF e imágenes (navegador) */

let pdfjsPromise = null;
async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import('../vendor/pdf.min.mjs').then((m) => {
      m.GlobalWorkerOptions.workerSrc = new URL('../vendor/pdf.worker.min.mjs', import.meta.url).href;
      return m;
    });
  }
  return pdfjsPromise;
}

function canvasToBlob(canvas, type = 'image/jpeg', q = 0.9) {
  if (canvas.convertToBlob) return canvas.convertToBlob({ type, quality: q });
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('No se pudo generar la imagen.'))), type, q));
}

function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
}

/** Renderiza cada página del PDF a JPEG. `scale` ≈ 2 por defecto (se limita a ~2000px de lado mayor). */
export async function pdfToImages(file, { scale = 2, maxPages = 30 } = {}) {
  const pdfjs = await loadPdfjs();
  const data = await readBytes(file);
  let doc;
  try { doc = await pdfjs.getDocument({ data }).promise; } catch (e) { throw new Error('No se pudo abrir el PDF.'); }
  const blobs = [];
  const n = Math.min(doc.numPages, maxPages);
  for (let i = 1; i <= n; i++) {
    const page = await doc.getPage(i);
    const v1 = page.getViewport({ scale: 1 });
    const s = Math.min(scale, 2000 / Math.max(v1.width, v1.height));
    const vp = page.getViewport({ scale: s });
    const canvas = makeCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: ctx, viewport: vp, canvas }).promise;
    blobs.push(await canvasToBlob(canvas));
    page.cleanup();
  }
  if (doc.destroy) doc.destroy();
  return blobs;
}

/** Corrige orientación EXIF, reduce a ~2000px y devuelve JPEG. */
export async function prepareImage(file, maxSide = 2000) {
  let bmp;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (e) {
    throw new Error('No se pudo leer la imagen.');
  }
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * k)); const h = Math.max(1, Math.round(bmp.height * k));
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  if (bmp.close) bmp.close();
  return canvasToBlob(canvas);
}

/** Despacha por extensión: devuelve Score para musicxml/mxl/mid. */
export async function importScoreFile(file) {
  const name = (file.name || '').toLowerCase();
  if (/\.(mid|midi)$/.test(name)) return importMidiFile(file);
  if (/\.(mxl|xml|musicxml)$/.test(name)) return importMusicXml(file);
  throw new Error('Formato de archivo no soportado.');
}
