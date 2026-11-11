import test from 'node:test';
import assert from 'node:assert/strict';
import { importMusicXml, importMidiFile, parseXml, splitBeats } from '../js/importers.js';
import { zipSync, strToU8 } from '../vendor/fflate.mjs';
import { durBeats } from '../js/model.js';

const enc = (s) => new TextEncoder().encode(s);
const file = (bytes, name) => ({ name, arrayBuffer: async () => (bytes instanceof Uint8Array ? bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) : bytes) });
const sum = (evs) => evs.reduce((a, e) => a + durBeats(e), 0);

const pitch = (s, o, a) => `<pitch><step>${s}</step>${a ? `<alter>${a}</alter>` : ''}<octave>${o}</octave></pitch>`;
const note = (p, dur, type, extra = '', staff = 1, voice = 1) =>
  `<note>${p}<duration>${dur}</duration>${extra}<voice>${voice}</voice><type>${type}</type><staff>${staff}</staff></note>`;

const XML2 = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.1 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="3.1"><work><work-title>Prueba &amp; Co</work-title></work>
<part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list>
<part id="P1">
<measure number="1"><attributes><divisions>2</divisions><key><fifths>-1</fifths></key><time><beats>3</beats><beat-type>4</beat-type></time><staves>2</staves>
<clef number="1"><sign>G</sign></clef><clef number="2"><sign>F</sign></clef></attributes>
<direction><sound tempo="96"/></direction>
${note(pitch('C', 5), 2, 'quarter')}
<note><chord/>${pitch('E', 5)}<duration>2</duration><voice>1</voice><type>quarter</type><staff>1</staff></note>
<note><rest/><duration>2</duration><voice>1</voice><type>quarter</type><staff>1</staff></note>
${note(pitch('B', 4, -1), 2, 'quarter', '<tie type="start"/>')}
<backup><duration>6</duration></backup>
${note(pitch('F', 3), 6, 'half', '<dot/>', 2, 5)}
</measure>
<measure number="2">
${note(pitch('B', 4, -1), 6, 'half', '<tie type="stop"/><dot/>')}
<backup><duration>6</duration></backup>
<note><rest measure="yes"/><duration>6</duration><voice>5</voice><staff>2</staff></note>
</measure></part></score-partwise>`;

test('parseXml: entidades, CDATA, comentarios, autocierre', () => {
  const r = parseXml('<?xml version="1.0"?><!-- c --><a x="1&amp;2"><b/><c><![CDATA[<z>]]>t&lt;</c></a>');
  assert.equal(r.name, 'a');
  assert.equal(r.attrs.x, '1&2');
  assert.equal(r.children.length, 2);
  assert.equal(r.children[1].text, '<z>t<');
});

test('splitBeats', () => {
  assert.deepEqual(splitBeats(5).map((s) => s.b), [4, 1]);
  assert.deepEqual(splitBeats(0.75).map((s) => s.b), [0.75]);
});

test('MusicXML: staves, acordes, silencios, ligaduras, armadura, tempo', async () => {
  const s = await importMusicXml(file(enc(XML2), 'x.musicxml'));
  assert.equal(s.title, 'Prueba & Co');
  assert.equal(s.bpm, 96);
  assert.deepEqual(s.timeSig, [3, 4]);
  assert.equal(s.keySig, 'F');
  assert.equal(s.measures.length, 2);
  const [m1, m2] = s.measures;
  assert.deepEqual(m1.rh.map((e) => e.k), [['c/5', 'e/5'], [], ['bb/4']]);
  assert.deepEqual(m1.lh, [{ k: ['f/3'], d: 'h', dots: 1 }]);
  assert.deepEqual(m2.rh, [{ k: ['bb/4'], d: 'h', dots: 1, tie: true }]);
  assert.equal(sum(m2.lh), 3); // silencio de compás completo
  assert.deepEqual(m2.lh[0].k, []);
  for (const m of s.measures) { assert.equal(sum(m.rh), 3); assert.equal(sum(m.lh), 3); }
});

test('MusicXML: una parte sin staffs se separa por do central', async () => {
  const xml = `<score-partwise><part-list/><part id="P1"><measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time></attributes>
  ${note(pitch('E', 4), 2, 'half')}<note><chord/>${pitch('C', 3)}<duration>2</duration><type>half</type></note>
  ${note(pitch('G', 4), 2, 'half')}</measure></part></score-partwise>`;
  const s = await importMusicXml(file(enc(xml), 'a.xml'));
  assert.deepEqual(s.measures[0].rh.map((e) => e.k), [['e/4'], ['g/4']]);
  assert.deepEqual(s.measures[0].lh.map((e) => e.k), [['c/3'], []]);
  assert.equal(sum(s.measures[0].lh), 4);
  assert.equal(s.title, 'a');
});

test('MusicXML: dos voces simultáneas coincidentes se funden en acorde; voz distinta se descarta', async () => {
  const xml = `<score-partwise><part-list/><part id="P1"><measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time><staves>2</staves></attributes>
  ${note(pitch('E', 5), 2, 'half')}${note(pitch('G', 5), 2, 'half')}
  <backup><duration>4</duration></backup>
  ${note(pitch('C', 5), 2, 'half', '', 1, 2)}${note(pitch('C', 5), 1, 'quarter', '', 1, 2)}${note(pitch('D', 5), 1, 'quarter', '', 1, 2)}
  <backup><duration>4</duration></backup>
  ${note(pitch('C', 3), 4, 'whole', '', 2, 3)}</measure></part></score-partwise>`;
  const s = await importMusicXml(file(enc(xml), 'v.xml'));
  assert.deepEqual(s.measures[0].rh.map((e) => e.k), [['c/5', 'e/5'], ['g/5']]);
  assert.deepEqual(s.measures[0].lh, [{ k: ['c/3'], d: 'w' }]);
});

test('MXL (zip con container.xml)', async () => {
  const zip = zipSync({
    'META-INF/container.xml': strToU8('<?xml version="1.0"?><container><rootfiles><rootfile full-path="dir/score.xml" media-type="application/vnd.recordare.musicxml+xml"/></rootfiles></container>'),
    'dir/score.xml': strToU8(XML2),
  });
  const s = await importMusicXml(file(zip, 'x.mxl'));
  assert.equal(s.measures.length, 2);
  assert.equal(s.title, 'Prueba & Co');
});

test('MusicXML inválido → error en español', async () => {
  await assert.rejects(() => importMusicXml(file(enc('<foo/>'), 'a.xml')), /MusicXML/);
});

/* ---------- MIDI ---------- */
const vlq = (v) => { const b = [v & 0x7f]; while ((v >>= 7)) b.unshift((v & 0x7f) | 0x80); return b; };
function track(events) { // events: [absTick, bytes[]]
  const out = []; let last = 0;
  events.sort((a, b) => a[0] - b[0]).forEach(([t, bytes]) => { out.push(...vlq(t - last), ...bytes); last = t; });
  out.push(0, 0xff, 0x2f, 0);
  return [0x4d, 0x54, 0x72, 0x6b, (out.length >>> 24) & 255, (out.length >>> 16) & 255, (out.length >>> 8) & 255, out.length & 255, ...out];
}
const mid = (format, ppq, tracks) => new Uint8Array([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, format, 0, tracks.length, ppq >> 8, ppq & 255, ...tracks.flat()]);
const on = (t, n) => [t, [0x90, n, 80]];
const off = (t, n) => [t, [0x80, n, 0]];

test('MIDI: dos pistas → manos, tempo, compás, silencios y ligaduras entre compases', async () => {
  const ppq = 96;
  const meta = track([[0, [0xff, 0x51, 3, 0x07, 0xa1, 0x20]], [0, [0xff, 0x58, 4, 3, 2, 24, 8]]]); // 120 bpm, 3/4
  const right = track([on(0, 72), off(96, 72), on(96, 74), off(288, 74), // q, h
    on(480, 76), off(480 + 96, 76), // compás 2, tiempo 3 (480 = 5 negras)
  ]);
  const left = track([on(0, 48), off(288, 48), on(288, 52), on(288, 55), off(384, 52), off(384, 55)]);
  const s = await importMidiFile(file(mid(1, ppq, [meta, right, left]), 'song.mid'));
  assert.equal(s.bpm, 120);
  assert.deepEqual(s.timeSig, [3, 4]);
  const m1 = s.measures[0];
  assert.deepEqual(m1.rh.map((e) => e.k), [['c/5'], ['d/5']]);
  assert.equal(sum(m1.rh), 3);
  assert.deepEqual(m1.lh[0], { k: ['c/3'], d: 'h', dots: 1 });
  // compás 2: la mano izquierda toca acorde de 1 negra y luego silencio de compás
  const m2 = s.measures[1];
  assert.deepEqual(m2.lh[0].k, ['e/3', 'g/3']);
  for (const m of s.measures) { assert.equal(sum(m.rh), 3); assert.equal(sum(m.lh), 3); }
});

test('MIDI: una sola pista se separa por do central; notas largas cruzan compás con tie', async () => {
  const ppq = 48;
  // 4/4 por defecto: una redonda ligada desde el tiempo 3 del compás 1 (2 negras + 2 en el siguiente) = blanca ligada a blanca
  const t = track([on(96, 64), off(96 + 192, 64), on(0, 40), off(48, 40)]);
  const s = await importMidiFile(file(mid(0, ppq, [t]), 'one.mid'));
  assert.equal(s.bpm, 120);
  const [m1, m2] = s.measures;
  assert.deepEqual(m1.rh.map((e) => [e.k, e.d, !!e.tie]), [[[], 'h', false], [['e/4'], 'h', false]]);
  assert.deepEqual(m2.rh[0], { k: ['e/4'], d: 'h', tie: true });
  assert.deepEqual(m1.lh[0], { k: ['e/2'], d: 'q' });
  assert.equal(sum(m1.lh), 4);
  assert.equal(sum(m2.rh), 4);
});

test('MIDI inválido', async () => {
  await assert.rejects(() => importMidiFile(file(enc('hola'), 'x.mid')), /MIDI/);
});
