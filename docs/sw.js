const CACHE = "slawminyaw-v8";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./animations.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
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
  // Always fetch sw.js itself from network so updates are detected
  if (e.request.url.includes("sw.js")) {
    e.respondWith(fetch(e.request));
    return;
  }
  // For everything else: serve cache, fall back to network
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
