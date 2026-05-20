const CACHE = "slawminyaw-v147";
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
  "./doberman.png",
  "./newicon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      // Cache assets individually — one failure won't block the whole install
      return Promise.allSettled(
        ASSETS.map(url => c.add(url).catch(() => { /* skip if unavailable */ }))
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  // version.txt — always live, never cached
  if (e.request.url.includes("version.txt")) {
    e.respondWith(fetch(e.request, { cache: "no-cache" }).catch(() => new Response("")));
    return;
  }
  // For everything else: try network first, fall back to cache
  e.respondWith(
    fetch(new Request(e.request, { cache: "no-cache" }))
      .then(res => {
        if (res.ok) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Handle force-reset message from the page
self.addEventListener("message", e => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});
