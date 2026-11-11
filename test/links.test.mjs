import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findUrl, parseMusicLink, cleanTitle, resolveSong, ENDPOINTS } from '../js/links.js';

test('findUrl', () => {
  assert.equal(findUrl('Mirá esto https://youtu.be/abc123?si=x, genial'), 'https://youtu.be/abc123?si=x');
  assert.equal(findUrl('(https://open.spotify.com/track/1)'), 'https://open.spotify.com/track/1');
  assert.equal(findUrl('sin enlace'), null);
  assert.equal(findUrl(null), null);
});

const CASES = [
  ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&utm_source=x', { service: 'youtube', id: 'dQw4w9WgXcQ', kind: 'video' }],
  ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', { service: 'youtube', id: 'dQw4w9WgXcQ', kind: 'video' }],
  ['https://youtu.be/dQw4w9WgXcQ?si=abc&t=10', { service: 'youtube', id: 'dQw4w9WgXcQ', kind: 'video' }],
  ['https://www.youtube.com/shorts/abc123XYZ', { service: 'youtube', id: 'abc123XYZ', kind: 'video' }],
  ['https://www.youtube.com/playlist?list=PLabc', { service: 'youtube', id: 'PLabc', kind: 'playlist' }],
  ['https://www.youtube.com/watch?list=PLabc', { service: 'youtube', id: 'PLabc', kind: 'playlist' }],
  ['https://music.youtube.com/watch?v=xyz789&si=q', { service: 'youtube-music', id: 'xyz789', kind: 'track' }],
  ['https://music.youtube.com/playlist?list=OLAK5uy_abc', { service: 'youtube-music', id: 'OLAK5uy_abc', kind: 'album' }],
  ['https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC?si=abc', { service: 'spotify', id: '4uLU6hMCjMI75M1A2tKUQC', kind: 'track' }],
  ['https://open.spotify.com/intl-es/track/4uLU6hMCjMI75M1A2tKUQC', { service: 'spotify', id: '4uLU6hMCjMI75M1A2tKUQC', kind: 'track' }],
  ['https://open.spotify.com/album/1A2B3C', { service: 'spotify', id: '1A2B3C', kind: 'album' }],
  ['https://open.spotify.com/playlist/37i9dQ?si=z', { service: 'spotify', id: '37i9dQ', kind: 'playlist' }],
  ['https://spotify.link/AbCdEf', { service: 'spotify', kind: 'unknown' }],
  ['https://music.apple.com/ar/album/bohemian-rhapsody/1440650428?i=1440650711', { service: 'apple-music', id: '1440650711', albumId: '1440650428', kind: 'track', country: 'ar', slugTitle: 'Bohemian Rhapsody' }],
  ['https://music.apple.com/us/album/a-night-at-the-opera/1440650428', { service: 'apple-music', id: '1440650428', kind: 'album', slugTitle: 'A Night At The Opera' }],
  ['https://music.apple.com/es/song/under-pressure/1440650718', { service: 'apple-music', id: '1440650718', kind: 'track', slugTitle: 'Under Pressure' }],
  ['https://www.deezer.com/es/track/3135556?utm=x', { service: 'deezer', id: '3135556', kind: 'track' }],
  ['https://www.deezer.com/track/3135556', { service: 'deezer', id: '3135556', kind: 'track' }],
  ['https://soundcloud.com/forss/flickermood?si=1', { service: 'soundcloud', kind: 'track', slugTitle: 'Flickermood', slugArtist: 'Forss' }],
  ['https://m.soundcloud.com/some-artist/my-song-name', { service: 'soundcloud', kind: 'track', slugTitle: 'My Song Name', slugArtist: 'Some Artist' }],
  ['https://soundcloud.com/forss/sets/soulhack', { service: 'soundcloud', kind: 'playlist' }],
  ['https://soundcloud.com/forss', { service: 'soundcloud', kind: 'artist' }],
];

for (const [url, exp] of CASES) {
  test('parse ' + url, () => {
    const r = parseMusicLink('Mirá esto ' + url + ' dale');
    assert.ok(r);
    assert.equal(r.url, url);
    for (const [k, v] of Object.entries(exp)) assert.equal(r[k], v, k);
  });
}

test('parse: sin URL, otro servicio, sin esquema', () => {
  assert.equal(parseMusicLink('hola'), null);
  assert.deepEqual(parseMusicLink('https://example.com/x'), { service: 'otro', kind: 'unknown', url: 'https://example.com/x' });
  assert.equal(parseMusicLink('youtu.be/abc123').id, 'abc123');
});

const CLEAN = [
  ['Queen - Bohemian Rhapsody (Official Video Remastered)', undefined, 'Bohemian Rhapsody', 'Queen'],
  ['Adele - Hello (Official Music Video)', 'AdeleVEVO', 'Hello', 'Adele'],
  ['Soda Stereo – De Música Ligera [Official Audio]', undefined, 'De Música Ligera', 'Soda Stereo'],
  ['Charly García — Rezo por Vos (Video Oficial)', undefined, 'Rezo por Vos', 'Charly García'],
  ['Los Fabulosos Cadillacs - Matador (Videoclip Oficial)', undefined, 'Matador', 'Los Fabulosos Cadillacs'],
  ['Coldplay - Yellow (Lyrics)', undefined, 'Yellow', 'Coldplay'],
  ['Gustavo Cerati - Crimen [Letra]', undefined, 'Crimen', 'Gustavo Cerati'],
  ['Pink Floyd - Time (Audio)', undefined, 'Time', 'Pink Floyd'],
  ['Daft Punk - Get Lucky (Visualizer)', undefined, 'Get Lucky', 'Daft Punk'],
  ['Oasis - Wonderwall | Official Video | HD', undefined, 'Wonderwall', 'Oasis'],
  ['Song Name HD', 'Some Band', 'Song Name', 'Some Band'],
  ['Imagine (Remastered 2011)', 'John Lennon - Topic', 'Imagine', 'John Lennon'],
  ['Bohemian Rhapsody - Remastered 2009', 'Queen', 'Bohemian Rhapsody', 'Queen'],
  ['Hotel California (2013 Remaster) [4K]', 'Eagles', 'Hotel California', 'Eagles'],
  ['Nirvana - Something In The Way (Live at Reading 1992)', undefined, 'Something In The Way (Live at Reading 1992)', 'Nirvana'],
  ['Eric Clapton - Layla (Acoustic)', undefined, 'Layla (Acoustic)', 'Eric Clapton'],
  ['Soda Stereo - Persiana Americana (En Vivo)', undefined, 'Persiana Americana (En Vivo)', 'Soda Stereo'],
  ['Calvin Harris - Summer (feat. Rag\'n\'Bone Man)', undefined, 'Summer', "Calvin Harris ft. Rag'n'Bone Man"],
  ['Rosalía - Despechá ft. Bad Bunny', undefined, 'Despechá', 'Rosalía ft. Bad Bunny'],
  ['Mi Canción (con Fulano)', 'Cantante', 'Mi Canción', 'Cantante ft. Fulano'],
  ['Spider-Man Theme', undefined, 'Spider-Man Theme', ''],
];
for (const [raw, author, title, artist] of CLEAN) {
  test('cleanTitle ' + raw, () => assert.deepEqual(cleanTitle(raw, author), { title, artist }));
}
test('cleanTitle: autor Topic/VEVO', () => {
  assert.equal(cleanTitle('Hello', 'Adele - Topic').artist, 'Adele');
  assert.equal(cleanTitle('Hello', 'TaylorSwiftVEVO').artist, 'Taylor Swift');
});

const json = (obj, ok = true) => async () => ({ ok, status: ok ? 200 : 500, json: async () => obj });

test('resolve: oEmbed YouTube', async () => {
  let called;
  const f = async (u) => { called = u; return { ok: true, json: async () => ({ title: 'Queen - Bohemian Rhapsody (Official Video Remastered)', author_name: 'Queen Official' }) }; };
  const r = await resolveSong(parseMusicLink('https://youtu.be/fJ9rUzIMcZQ?si=1'), { fetchImpl: f });
  assert.deepEqual(r, { title: 'Bohemian Rhapsody', artist: 'Queen', source: 'oembed' });
  assert.ok(called.startsWith(ENDPOINTS.youtubeOembed + encodeURIComponent('https://www.youtube.com/watch?v=fJ9rUzIMcZQ')));
});

test('resolve: Spotify sólo título', async () => {
  const r = await resolveSong(parseMusicLink('https://open.spotify.com/track/abc'), { fetchImpl: json({ title: 'Yellow' }) });
  assert.deepEqual(r, { title: 'Yellow', artist: '', source: 'oembed' });
});

test('resolve: SoundCloud "Título by Artista"', async () => {
  const r = await resolveSong(parseMusicLink('https://soundcloud.com/forss/flickermood'), { fetchImpl: json({ title: 'Flickermood by Forss', author_name: 'Forss' }) });
  assert.deepEqual(r, { title: 'Flickermood', artist: 'Forss', source: 'oembed' });
});

test('resolve: Apple con id de pista usa lookup', async () => {
  let u;
  const f = async (x) => { u = x; return { ok: true, json: async () => ({ results: [{ trackName: 'Bohemian Rhapsody', artistName: 'Queen' }] }) }; };
  const r = await resolveSong(parseMusicLink('https://music.apple.com/ar/album/bohemian-rhapsody/1440650428?i=1440650711'), { fetchImpl: f });
  assert.deepEqual(r, { title: 'Bohemian Rhapsody', artist: 'Queen', source: 'lookup' });
  assert.equal(u, 'https://itunes.apple.com/lookup?id=1440650711&country=ar');
});

test('resolve: Deezer track', async () => {
  const r = await resolveSong(parseMusicLink('https://www.deezer.com/es/track/3135556'), { fetchImpl: json({ title: 'Harder', artist: { name: 'Daft Punk' } }) });
  assert.deepEqual(r, { title: 'Harder', artist: 'Daft Punk', source: 'lookup' });
});

test('resolve: fallo de red → slug (Apple)', async () => {
  const f = async () => { throw new TypeError('Failed to fetch'); };
  const r = await resolveSong(parseMusicLink('https://music.apple.com/es/song/under-pressure/1440650718'), { fetchImpl: f });
  assert.deepEqual(r, { title: 'Under Pressure', artist: '', source: 'slug' });
});

test('resolve: todo falla → none', async () => {
  const r = await resolveSong(parseMusicLink('https://youtu.be/abc'), { fetchImpl: json({}, false) });
  assert.deepEqual(r, { title: '', artist: '', source: 'none' });
  assert.equal((await resolveSong(null)).source, 'none');
  assert.equal((await resolveSong(parseMusicLink('https://spotify.link/x'), { fetchImpl: json({ title: '' }) })).source, 'none');
});

test('resolve: álbum/lista/artista → needsTrack sin red', async () => {
  const f = async () => { throw new Error('no debe llamarse'); };
  for (const u of ['https://open.spotify.com/album/1', 'https://www.youtube.com/playlist?list=PL1', 'https://soundcloud.com/forss']) {
    const r = await resolveSong(parseMusicLink(u), { fetchImpl: f });
    assert.equal(r.needsTrack, true);
    assert.equal(r.source, 'none');
  }
  const a = await resolveSong(parseMusicLink('https://music.apple.com/us/album/a-night-at-the-opera/1440650428'), { fetchImpl: f });
  assert.equal(a.title, 'A Night At The Opera');
  assert.equal(a.needsTrack, true);
});

test('resolve: timeout (fetch que respeta abort y fetch colgado)', async () => {
  const hang = (u, { signal }) => new Promise((_, rej) => signal.addEventListener('abort', () => rej(new Error('abort'))));
  const t0 = Date.now();
  const r = await resolveSong(parseMusicLink('https://soundcloud.com/forss/flickermood'), { fetchImpl: hang, timeoutMs: 30 });
  assert.deepEqual(r, { title: 'Flickermood', artist: 'Forss', source: 'slug' });
  assert.ok(Date.now() - t0 < 1000);
  const never = () => new Promise(() => {});
  assert.equal((await resolveSong(parseMusicLink('https://youtu.be/abc'), { fetchImpl: never, timeoutMs: 30 })).source, 'none');
});

test('resolve: signal externo abortado', async () => {
  const ac = new AbortController(); ac.abort();
  const r = await resolveSong(parseMusicLink('https://youtu.be/abc'), { fetchImpl: json({ title: 'x' }), signal: ac.signal });
  assert.equal(r.source, 'none');
});
