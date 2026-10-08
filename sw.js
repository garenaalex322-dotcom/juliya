// Офлайн-работа веб-версии: файлы приложения берутся из сети, а без интернета — из кэша.
// Версию и список файлов подставляет сборка (GitHub Actions).
const VERSION = "6c6202a2-4";
const FILES = ["./", "anim.js", "anim_a.js", "anim_b.js", "anim_c.js", "anim_d.js", "anim_e.js", "anim_specs.js", "app.js", "articles_more.js", "ex_a.js", "ex_b.js", "ex_c.js", "ex_d.js", "ex_e.js", "foods.js", "icon-180.png", "icon-192.png", "icon-512.png", "index.html", "knowledge.js", "knowledge_more.js", "manifest.webmanifest", "parser.js", "styles.css", "vendor/firebase-app-compat.js", "vendor/firebase-auth-compat.js", "vendor/firebase-firestore-compat.js", "vendor/html5-qrcode.min.js"];
const CACHE = 'tarelka-' + VERSION;
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('tarelka-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !fonts) return; // Firebase и Open Food Facts — всегда напрямую
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), fonts ? 2500 : 4000);
      const res = await fetch(req, { signal: ctrl.signal }); clearTimeout(t);
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') { const idx = await cache.match('index.html'); if (idx) return idx; }
      throw err;
    }
  })());
});
