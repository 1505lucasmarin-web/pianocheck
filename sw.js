// Service worker: precache del shell, cache-first con versión. Rutas relativas (subcarpeta de GitHub Pages).
const VERSION = "pianocheck-v10";
const SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "css/app.css",
  "js/app.js",
  "js/annotate-ui.js",
  "js/annotations.js",
  "js/arrange.js",
  "js/catalog.js",
  "js/compose.js",
  "js/demo.js",
  "js/engine.js",
  "js/importers.js",
  "js/issues.js",
  "js/keyboard.js",
  "js/lessons.js",
  "js/links.js",
  "js/metronome.js",
  "js/mic.js",
  "js/mic-worklet.js",
  "js/midi.js",
  "js/model.js",
  "js/omr.js",
  "js/phrases.js",
  "js/passage.js",
  "js/pieces.js",
  "js/recorder.js",
  "js/review.js",
  "js/summary.js",
  "js/task.js",
  "js/timing.js",
  "js/pitch.js",
  "js/playback.js",
  "js/share.js",
  "js/render.js",
  "js/store.js",
  "js/teoria.js",
  "js/theory.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/maskable-512.png",
  "vendor/fflate.mjs",
  "vendor/qrcode-generator.mjs",
  "vendor/pdf.min.mjs",
  "vendor/pdf.worker.min.mjs",
  "vendor/vexflow/vexflow-bravura.js"
];
// Nunca se cachean: IA (incluida su búsqueda web), oEmbed y APIs de búsqueda de canciones (identificar un enlace), catálogos y descargas de ediciones.
// Cualquier pedido a otro origen pasa de largo (ver el filtro del "fetch"); sólo se sirve del caché el shell de esta app.
const AI_HOSTS = ["api.anthropic.com", "generativelanguage.googleapis.com"];
const LOOKUP_HOSTS = ["www.youtube.com", "youtube.com", "open.spotify.com", "soundcloud.com", "api.deezer.com", "itunes.apple.com"];

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // Se cachea cada archivo por separado: si uno falta, el resto igual queda disponible offline.
    await Promise.all(SHELL.map(async (u) => {
      try { const r = await fetch(new Request(u, { cache: "reload" })); if (r.ok) await cache.put(new URL(u, self.registration.scope).href, r); }
      catch (err) { /* sin red o archivo ausente */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("pianocheck-") && k !== VERSION).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (AI_HOSTS.includes(url.hostname) || LOOKUP_HOSTS.includes(url.hostname) || url.origin !== self.location.origin) return; // nunca cachear APIs de IA, oEmbed/lookup ni terceros
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      if (res.ok && res.type === "basic") cache.put(req, res.clone());
      return res;
    } catch (err) {
      if (req.mode === "navigate") { const idx = await cache.match(new URL("index.html", self.registration.scope).href); if (idx) return idx; }
      throw err;
    }
  })());
});
