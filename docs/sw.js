const CACHE = "slawminyaw-v132";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./animations.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-192-maskable.png",
  "./icon-512.png",
  "./icon-512-maskable.png",
  "./apple-touch-icon.png",
  "./favicon.ico",
  "./doberman.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  // version.txt must never be cached — always live from network
  if (e.request.url.includes('version.txt')) {
    e.respondWith(fetch(e.request, { cache: 'no-cache' }));
    return;
  }
  // Always bypass browser HTTP cache, fall back to SW cache if offline
  const fresh = new Request(e.request, { cache: 'no-cache' });
  e.respondWith(
    fetch(fresh)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
