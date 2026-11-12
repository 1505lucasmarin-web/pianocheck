import test from 'node:test';
import assert from 'node:assert/strict';
import {
  searchSong, fetchEditionFile, classifyFailure, buildSearchLinks, buildSearchRequest, normalizeUrl, SEARCH_SYSTEM_PROMPT,
  BLOCKED_DOMAINS, ANTHROPIC_SEARCH_TOOL,
} from '../js/catalog.js';
import { OmrError } from '../js/omr.js';

const HL = 'https://www.halleonard.com/product/363715/taylor-swift-evermore';
const FAKE = 'https://www.free-sheet-music-pdfs.example/evermore-taylor-swift.pdf';
const resp = (status, obj) => ({ ok: status < 300, status, text: async () => (typeof obj === 'string' ? obj : JSON.stringify(obj)) });
const ai = { provider: 'anthropic', apiKey: 'k' };

const model = (obj) => JSON.stringify(obj);
const anthropicReply = ({ results, text, citations = [], stop = 'end_turn' }) => ({
  stop_reason: stop,
  content: [
    { type: 'server_tool_use', id: 'srvtoolu_1', name: 'web_search', input: { query: 'evermore taylor swift sheet music piano' } },
    { type: 'web_search_tool_result', tool_use_id: 'srvtoolu_1', content: results.map(([url, title]) => ({ type: 'web_search_result', url, title, page_age: null, encrypted_content: 'xx' })) },
    { type: 'text', text, ...(citations.length ? { citations: citations.map(([url, title]) => ({ type: 'web_search_result_location', url, title, cited_text: '...', encrypted_index: 'i' })) } : {}) },
  ],
});

const evermoreJson = (extra = []) => model({
  identified: { title: 'evermore', artist: 'Taylor Swift ft. Bon Iver', kind: 'song' },
  editions: [
    { title: 'evermore (feat. Bon Iver) - Easy Piano', artist: 'Taylor Swift', publisher: 'Hal Leonard', url: HL, format: 'pdf', scope: 'album', note: 'Es el cancionero del álbum.' },
    { title: 'evermore PDF gratis', publisher: 'free-sheet', url: FAKE, format: 'pdf', scope: 'song' },
    ...extra,
  ],
});

test('canción en biblioteca: coincidencia por título/artista y por sourceUrl; no gasta una llamada de IA', async () => {
  let calls = 0;
  const library = [
    { id: 's1', title: 'Evermore (Taylor Swift)' }, { id: 's2', title: 'Otra cosa' },
    { id: 's3', title: 'Cover', sourceUrl: 'https://youtu.be/abc123?utm_source=x' },
  ];
  const r = await searchSong({ title: 'evermore', artist: 'Taylor Swift' }, { library, ai, fetchImpl: async () => { calls++; return resp(200, {}); } });
  assert.deepEqual(r.inLibrary, [{ scoreId: 's1', title: 'Evermore (Taylor Swift)', match: 'title+artist' }]);
  assert.equal(calls, 0);
  assert.equal(r.aiSkipped, true);
  assert.equal(r.identified.kind, 'song');
  assert.ok(r.searchLinks.length >= 1);
  const byUrl = await searchSong({ title: 'Mi versión', sourceUrl: 'https://www.youtu.be/abc123#t=3' }, { library });
  assert.equal(byUrl.inLibrary[0].scoreId, 's3'); assert.equal(byUrl.inLibrary[0].match, 'url');
  const forced = await searchSong({ title: 'evermore' }, { library, ai, skipAiIfLocal: false, fetchImpl: async () => { calls++; return resp(200, anthropicReply({ results: [], text: '{"editions":[]}' })); } });
  assert.equal(calls, 1); assert.equal(forced.aiSkipped, false);
});

test('"Oda a la alegría": incluida primero (melodía sencilla), sin IA', async () => {
  const r = await searchSong({ title: 'Oda a la alegría' });
  assert.equal(r.included[0].pieceId, 'oda-a-la-alegria');
  assert.equal(r.included[0].versionId, 'melodia');
  assert.equal(r.included[0].label, 'Solo melodía');
  assert.equal(r.included[1].label, 'Con acompañamiento');
  assert.equal(r.identified.kind, 'song');
  assert.equal((await searchSong({ title: 'Ode to Joy', artist: 'Beethoven' })).included[0].pieceId, 'oda-a-la-alegria');
});

test('evermore / Taylor Swift: edición verificada no importable; la URL inventada se descarta', async () => {
  let sent;
  const r = await searchSong({ title: 'evermore', artist: 'Taylor Swift' }, {
    ai, fetchImpl: async (url, init) => { sent = { url, body: JSON.parse(init.body), headers: init.headers }; return resp(200, anthropicReply({ results: [[HL, 'Taylor Swift – Evermore Easy Piano Personality Softcover'], ['https://www.musicnotes.com/x', 'otro']], text: evermoreJson(), citations: [[HL, 'Hal Leonard']] })); },
  });
  assert.equal(sent.url, 'https://api.anthropic.com/v1/messages');
  assert.equal(sent.body.tools[0].type, ANTHROPIC_SEARCH_TOOL);
  assert.equal(sent.body.tools[0].name, 'web_search');
  assert.equal(sent.headers['x-api-key'], 'k');
  assert.equal(r.editions.length, 1);
  const e = r.editions[0];
  assert.equal(e.url, HL);
  assert.equal(e.verified, true);
  assert.equal(e.importable, false);
  assert.equal(e.format, 'web');
  assert.equal(e.source, 'halleonard.com');
  assert.equal(e.publisher, 'Hal Leonard');
  assert.equal(e.scope, 'album');
  assert.match(e.note, /álbum/);
  assert.equal(e.title, 'evermore (feat. Bon Iver) - Easy Piano');
  assert.ok(!r.editions.some((x) => x.url === FAKE));
  assert.equal(r.rejected, 1);
  assert.deepEqual(r.errors, []);
  assert.equal(r.retryable, false);
  assert.equal(r.identified.kind, 'song');
  assert.equal(r.identified.artist, 'Taylor Swift ft. Bon Iver');
  assert.match(r.searchLinks[0].url, /^https:\/\/www\.halleonard\.com\/search\/search\.action\?keywords=evermore%20Taylor%20Swift$/);
  assert.match(sent.body.messages[0].content, /"evermore"/);
  assert.match(SEARCH_SYSTEM_PROMPT, /song and an album/);
  assert.match(SEARCH_SYSTEM_PROMPT, /NEVER return sites that distribute copyrighted scores/);
});

test('canción vs álbum: el modelo distingue y la edición del álbum se marca como tal', async () => {
  const album = model({
    identified: { title: 'evermore', artist: 'Taylor Swift', kind: 'album' },
    editions: [{ title: 'Taylor Swift – Evermore (songbook)', publisher: 'Hal Leonard', url: HL, scope: 'collection', note: 'Cancionero completo.' }],
  });
  const r = await searchSong({ title: 'evermore', artist: 'Taylor Swift' }, { ai, fetchImpl: async () => resp(200, anthropicReply({ results: [[HL, 'HL']], text: album })) });
  assert.equal(r.identified.kind, 'album');
  assert.equal(r.editions[0].scope, 'collection');
  const unknownKind = model({ identified: { title: 'x', kind: 'cosa' }, editions: [] });
  const r2 = await searchSong({ title: 'x' }, { ai, fetchImpl: async () => resp(200, anthropicReply({ results: [], text: unknownKind })) });
  assert.equal(r2.identified.kind, 'unknown');
  assert.deepEqual(r2.editions, []);
});

test('importable sólo si es archivo abierto en una fuente de acceso abierto; comercial nunca', async () => {
  const MIDI = 'https://www.mutopiaproject.org/ftp/GruberFX/stille_nacht/stille_nacht.mid';
  const PDF_OPEN = 'https://imslp.org/images/a/ab/PMLP1-x.pdf';
  const PDF_COM = 'https://www.halleonard.com/files/evermore.pdf';
  const HTTP = 'http://www.mutopiaproject.org/a.mid';
  const PAGE = 'https://imslp.org/wiki/Stille_Nacht';
  const BAD = 'https://www.scribd.com/doc/123/evermore';
  const urls = [MIDI, PDF_OPEN, PDF_COM, HTTP, PAGE, BAD];
  const text = model({ identified: { title: 'Stille Nacht', kind: 'song' }, editions: urls.map((url) => ({ title: 't', url })) });
  const r = await searchSong({ title: 'Stille Nacht Gruber xyz' }, { ai, skipAiIfLocal: false, fetchImpl: async () => resp(200, anthropicReply({ results: urls.map((u) => [u, 'T']), text })) });
  const by = Object.fromEntries(r.editions.map((e) => [e.url, e]));
  assert.equal(by[MIDI].importable, true); assert.equal(by[MIDI].format, 'midi');
  assert.equal(by[PDF_OPEN].importable, true); assert.equal(by[PDF_OPEN].format, 'pdf');
  assert.equal(by[PDF_COM].importable, false);
  assert.equal(by[HTTP].importable, false);
  assert.equal(by[PAGE].importable, false);
  assert.equal(by[BAD], undefined);                                    // sitio de descargas no autorizadas
  assert.equal(r.rejected, 1);
  assert.ok(BLOCKED_DOMAINS.includes('scribd.com'));
});

test('si el modelo no devuelve JSON: sólo se usan las URLs citadas realmente', async () => {
  const r = await searchSong({ title: 'evermore', artist: 'Taylor Swift' }, {
    ai, fetchImpl: async () => resp(200, anthropicReply({ results: [[HL, 'Evermore HL'], ['https://otra.example/x', 'x']], text: 'Encontré una edición de Hal Leonard.', citations: [[HL, 'Evermore HL']] })),
  });
  assert.deepEqual(r.editions.map((e) => e.url), [HL]);
  assert.equal(r.editions[0].verified, true);
  assert.equal(r.editions[0].title, 'Evermore HL');
});

test('pause_turn: se reenvía el turno pausado y se sigue', async () => {
  const bodies = [];
  const f = async (u, init) => {
    bodies.push(JSON.parse(init.body));
    if (bodies.length === 1) return resp(200, { stop_reason: 'pause_turn', content: [{ type: 'server_tool_use', id: 's', name: 'web_search', input: { query: 'q' } }] });
    return resp(200, anthropicReply({ results: [[HL, 'HL']], text: evermoreJson() }));
  };
  const r = await searchSong({ title: 'evermore', artist: 'Taylor Swift' }, { ai, fetchImpl: f });
  assert.equal(bodies.length, 2);
  assert.equal(bodies[1].messages.length, 2);
  assert.equal(bodies[1].messages[1].role, 'assistant');
  assert.equal(r.editions.length, 1);
});

test('Gemini: Interactions API con google_search y url_citation', async () => {
  let sent;
  const reply = { steps: [
    { type: 'google_search_call', arguments: { queries: ['evermore piano sheet'] } },
    { type: 'google_search_result', call_id: 'c', result: [{ search_suggestions: '<div/>' }] },
    { type: 'model_output', content: [{ type: 'text', text: evermoreJson(), annotations: [{ type: 'url_citation', url: HL, title: 'halleonard.com', start_index: 0, end_index: 5 }] }] },
  ] };
  const r = await searchSong({ title: 'evermore', artist: 'Taylor Swift' }, { ai: { provider: 'gemini', apiKey: 'g' }, fetchImpl: async (u, init) => { sent = { u, body: JSON.parse(init.body), h: init.headers }; return resp(200, reply); } });
  assert.equal(sent.u, 'https://generativelanguage.googleapis.com/v1beta/interactions');
  assert.deepEqual(sent.body.tools, [{ type: 'google_search' }]);
  assert.equal(sent.h['x-goog-api-key'], 'g');
  assert.match(sent.body.input, /evermore/);
  assert.deepEqual(r.editions.map((e) => e.url), [HL]);
  assert.equal(r.editions[0].importable, false);
  assert.equal(r.rejected, 1);
  // bloqueo de seguridad
  const blocked = await searchSong({ title: 'x' }, { ai: { provider: 'gemini', apiKey: 'g' }, fetchImpl: async () => resp(200, { promptFeedback: { blockReason: 'SAFETY' } }) });
  assert.equal(blocked.errors[0].kind, 'refused');
  // enlace de redirección opaco de grounding: no sirve como edición
  const redirect = 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AbC';
  const rr = await searchSong({ title: 'x' }, { ai: { provider: 'gemini', apiKey: 'g' }, fetchImpl: async () => resp(200, { steps: [{ type: 'model_output', content: [{ type: 'text', text: 'ok', annotations: [{ type: 'url_citation', url: redirect, title: 'a' }] }] }] }) });
  assert.deepEqual(rr.editions, []);
});

test('sin API key: editions vacío, error claro, enlaces de búsqueda igual', async () => {
  let calls = 0;
  for (const a of [undefined, { provider: 'anthropic', apiKey: '' }, { provider: 'gemini', apiKey: '   ' }]) {
    const r = await searchSong({ title: 'evermore', artist: 'Taylor Swift' }, { ai: a, fetchImpl: async () => { calls++; return resp(200, {}); } });
    assert.deepEqual(r.editions, []);
    assert.equal(r.errors.length, 1);
    assert.equal(r.errors[0].kind, 'auth');
    assert.match(r.errors[0].message, /API key/);
    assert.equal(r.retryable, false);
    assert.ok(r.searchLinks.length >= 1);
  }
  assert.equal(calls, 0);
  const empty = await searchSong({});
  assert.equal(empty.errors[0].source, 'input');
  assert.deepEqual(empty.searchLinks, []);
  await assert.doesNotReject(searchSong(null));
});

test('fallas: red, límite, clave, rechazo, tool error → errors + searchLinks presentes y retryable bien marcado', async () => {
  const run = (fetchImpl) => searchSong({ title: 'evermore', artist: 'Taylor Swift' }, { ai, fetchImpl });
  const net = await run(async () => { throw new TypeError('Failed to fetch'); });
  assert.deepEqual(net.editions, []);
  assert.equal(net.errors[0].kind, 'network'); assert.equal(net.retryable, true);
  assert.ok(net.searchLinks.length >= 1);
  const rate = await run(async () => resp(429, {}));
  assert.equal(rate.errors[0].kind, 'rate'); assert.equal(rate.retryable, true);
  const auth = await run(async () => resp(401, {}));
  assert.equal(auth.errors[0].kind, 'auth'); assert.equal(auth.retryable, false);
  const server = await run(async () => resp(529, 'x'));
  assert.equal(server.errors[0].kind, 'network'); assert.equal(server.retryable, true);
  const refused = await run(async () => resp(200, { stop_reason: 'refusal', content: [] }));
  assert.equal(refused.errors[0].kind, 'refused'); assert.equal(refused.retryable, false);
  const nosearch = await run(async () => resp(400, { error: { message: 'web_search tool is not enabled for your organization' } }));
  assert.equal(nosearch.errors[0].kind, 'unknown'); assert.match(nosearch.errors[0].message, /búsqueda web/);
  const garbage = await run(async () => resp(200, '<html>'));
  assert.equal(garbage.errors[0].kind, 'unknown');
  const toolErr = await run(async () => resp(200, { stop_reason: 'end_turn', content: [{ type: 'web_search_tool_result', tool_use_id: 'a', content: { type: 'web_search_tool_result_error', error_code: 'too_many_requests' } }, { type: 'text', text: '{"editions":[]}' }] }));
  assert.equal(toolErr.errors[0].kind, 'rate'); assert.equal(toolErr.retryable, true);
  const aborted = await run(async () => { const e = new Error('a'); e.name = 'AbortError'; throw e; });
  assert.equal(aborted.errors[0].kind, 'unknown'); assert.equal(aborted.retryable, false);
});

test('classifyFailure', () => {
  assert.equal(classifyFailure(new OmrError('x', 'network')), 'network');
  assert.equal(classifyFailure(new OmrError('x', 'server')), 'network');
  assert.equal(classifyFailure(new OmrError('x', 'auth')), 'auth');
  assert.equal(classifyFailure(new OmrError('x', 'rate')), 'rate');
  assert.equal(classifyFailure(new OmrError('x', 'refusal')), 'refused');
  assert.equal(classifyFailure(new OmrError('x', 'parse')), 'unknown');
  assert.equal(classifyFailure(new OmrError('x', 'abort')), 'unknown');
  assert.equal(classifyFailure(new TypeError('Failed to fetch')), 'network');
  assert.equal(classifyFailure(new Error('boom')), 'unknown');
  assert.equal(classifyFailure(null), 'unknown');
  assert.equal(classifyFailure({ kind: 'rate' }), 'rate');
});

test('enlaces de búsqueda y URLs', () => {
  assert.deepEqual(buildSearchLinks({}), []);
  const l = buildSearchLinks({ title: 'Fix You', artist: 'Coldplay & co' });
  assert.equal(l[0].url, 'https://www.halleonard.com/search/search.action?keywords=Fix%20You%20Coldplay%20%26%20co');
  assert.equal(normalizeUrl('https://WWW.Example.com/a/b/?utm_source=x&q=1#frag'), 'https://example.com/a/b?q=1');
  assert.equal(normalizeUrl('javascript:alert(1)'), '');
  assert.equal(normalizeUrl('nada'), '');
  const req = buildSearchRequest('gemini', { apiKey: 'k', model: 'm', title: 'x' });
  assert.match(req.url, /interactions$/);
});

test('fetchEditionFile', async () => {
  const MIDI = { url: 'https://www.mutopiaproject.org/ftp/GruberFX/stille_nacht/stille%20nacht.mid', format: 'midi', importable: true };
  const mk = (over = {}) => async () => ({ ok: true, status: 200, headers: { get: (h) => ({ 'content-type': 'audio/midi' })[h.toLowerCase()] ?? null }, blob: async () => new Blob([new Uint8Array([1, 2, 3])]), ...over });
  const ok = await fetchEditionFile(MIDI, { fetchImpl: mk() });
  assert.equal(ok.filename, 'stille nacht.mid');
  assert.equal(ok.blob.size, 3);
  const noExt = await fetchEditionFile({ url: 'https://imslp.org/download/abc', format: 'pdf', importable: true }, { fetchImpl: mk() });
  assert.equal(noExt.filename, 'abc.pdf');
  // no importables: ni se intenta
  let calls = 0;
  const f = async () => { calls++; return mk()(); };
  for (const ed of [null, { url: HL, importable: false }, { url: HL }, { importable: true }, { url: 'http://x.org/a.mid', importable: true }]) {
    const r = await fetchEditionFile(ed, { fetchImpl: f });
    assert.ok(r.error, JSON.stringify(ed));
  }
  assert.equal(calls, 0);
  const cors = await fetchEditionFile(MIDI, { fetchImpl: async () => { throw new TypeError('Failed to fetch'); } });
  assert.equal(cors.kind, 'network'); assert.match(cors.error, /Importar un archivo/);
  assert.equal((await fetchEditionFile(MIDI, { fetchImpl: async () => { const e = new Error('a'); e.name = 'AbortError'; throw e; } })).kind, 'abort');
  assert.equal((await fetchEditionFile(MIDI, { fetchImpl: mk({ ok: false, status: 404 }) })).kind, 'http');
  const html = await fetchEditionFile(MIDI, { fetchImpl: mk({ headers: { get: () => 'text/html; charset=utf-8' } }) });
  assert.equal(html.kind, 'format');
  const big = await fetchEditionFile(MIDI, { fetchImpl: mk({ headers: { get: (h) => (h === 'content-length' ? String(99 * 1024 * 1024) : null) } }) });
  assert.equal(big.kind, 'size');
  assert.equal((await fetchEditionFile(MIDI, { fetchImpl: mk({ blob: async () => new Blob([]) }) })).kind, 'format');
});

/* ------------------------------------------------------------------ modo freeOnly (sólo acceso libre) */
import { FREE_SEARCH_SYSTEM_PROMPT, COMMERCIAL_DOMAINS, OPEN_HOSTS } from '../js/catalog.js';

test('freeOnly: evermore con búsqueda que devuelve Hal Leonard → ninguna edición paga, sin enlaces a tiendas', async () => {
  const r = await searchSong({ title: 'evermore', artist: 'Taylor Swift' }, { ai, freeOnly: true, fetchImpl: async () => resp(200, anthropicReply({ results: [[HL, 'Evermore HL'], [FAKE, 'x']], text: evermoreJson() })) });
  assert.deepEqual(r.editions, []);
  assert.ok(r.rejected >= 1);
  assert.ok(r.searchLinks.every((l) => !/halleonard|musicnotes|sheetmusic/i.test(l.url)));
  assert.ok(r.searchLinks.every((l) => /^https:\/\/www\.mutopiaproject\.org\/cgibin\/make-table\.cgi\?searchingfor=evermore$/.test(l.url)));
  const free = await searchSong({ title: 'evermore', artist: 'Taylor Swift' }, { ai, fetchImpl: async () => resp(200, anthropicReply({ results: [[HL, 'Evermore HL']], text: evermoreJson() })) });
  assert.equal(free.editions[0].publisher, 'Hal Leonard');                       // sin freeOnly sigue igual
  assert.equal(free.editions[0].free, false);
  assert.equal(free.editions[0].access, 'commercial');
});

test('freeOnly: el pedido a la IA pide sólo acceso libre y bloquea tiendas; el modo normal no cambia', () => {
  const free = buildSearchRequest('anthropic', { apiKey: 'k', model: 'm', title: 'Gymnopédie', freeOnly: true });
  const body = JSON.parse(free.init.body);
  assert.equal(body.system, FREE_SEARCH_SYSTEM_PROMPT);
  assert.match(body.system, /never pay/i);
  assert.match(body.messages[0].content, /FREE/);
  assert.ok(body.tools[0].blocked_domains.includes('halleonard.com') && body.tools[0].blocked_domains.includes('scribd.com'));
  const norm = JSON.parse(buildSearchRequest('anthropic', { apiKey: 'k', model: 'm', title: 'x' }).init.body);
  assert.equal(norm.system, SEARCH_SYSTEM_PROMPT);
  assert.deepEqual(norm.tools[0].blocked_domains, BLOCKED_DOMAINS);
  const g = JSON.parse(buildSearchRequest('gemini', { apiKey: 'k', model: 'm', title: 'x', freeOnly: true }).init.body);
  assert.ok(g.input.startsWith(FREE_SEARCH_SYSTEM_PROMPT));
  assert.ok(COMMERCIAL_DOMAINS.includes('halleonard.com') && !OPEN_HOSTS.some((h) => COMMERCIAL_DOMAINS.includes(h)));
});

test('freeOnly: acepta fuentes abiertas (importables) y "gratis del titular" declarado; descarta lo desconocido sin declarar', async () => {
  const IMSLP = 'https://imslp.org/images/3/3a/PMLP2-Gymnopedie.pdf';
  const OWNER = 'https://artista.example/partituras/mi-cancion.pdf';
  const ANON = 'https://random-blog.example/partitura.pdf';
  const MN = 'https://www.musicnotes.com/sheetmusic/x';
  const urls = [IMSLP, OWNER, ANON, MN];
  const text = model({ identified: { title: 'Gymnopédie No. 1', artist: 'Erik Satie', kind: 'song' }, editions: [
    { title: 'Gymnopédie 1', publisher: 'IMSLP', url: IMSLP, format: 'pdf', access: 'open' },
    { title: 'Mi canción', publisher: 'La artista', url: OWNER, format: 'pdf', access: 'owner-free' },
    { title: 'Blog', url: ANON, format: 'pdf' },
    { title: 'Musicnotes', url: MN, access: 'owner-free' },                 // el modelo miente: igual es una tienda
  ] });
  const r = await searchSong({ title: 'Gymnopédie' }, { ai, freeOnly: true, fetchImpl: async () => resp(200, anthropicReply({ results: urls.map((u) => [u, 'T']), text })) });
  assert.deepEqual(r.editions.map((e) => e.url), [IMSLP, OWNER]);
  assert.equal(r.editions[0].importable, true); assert.equal(r.editions[0].access, 'open'); assert.equal(r.editions[0].free, true);
  assert.equal(r.editions[1].importable, false); assert.equal(r.editions[1].access, 'owner-free');
  assert.equal(r.rejected, 2);
  // fallback sin JSON: sólo las citadas de fuente abierta
  const r2 = await searchSong({ title: 'x' }, { ai, freeOnly: true, fetchImpl: async () => resp(200, anthropicReply({ results: [[IMSLP, 'a'], [OWNER, 'b'], [HL, 'c']], text: 'Mirá.', citations: [[IMSLP, 'a'], [OWNER, 'b'], [HL, 'c']] })) });
  assert.deepEqual(r2.editions.map((e) => e.url), [IMSLP]);
});

test('freeOnly: buildSearchLinks sólo con catálogos gratuitos; sin título no hay enlaces', () => {
  const l = buildSearchLinks({ title: 'Clair de lune', artist: 'Debussy' }, { freeOnly: true });
  assert.equal(l.length, 1);
  assert.equal(l[0].url, 'https://www.mutopiaproject.org/cgibin/make-table.cgi?searchingfor=Clair%20de%20lune');
  assert.deepEqual(buildSearchLinks({ artist: 'x' }, { freeOnly: true }), []);
  assert.deepEqual(buildSearchLinks({}, { freeOnly: true }), []);
  assert.match(buildSearchLinks({ title: 'a' })[0].url, /halleonard/);        // el comportamiento viejo se mantiene sin la opción
});
