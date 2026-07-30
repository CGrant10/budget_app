const CACHE      = "slawminyaw-v469";
const FONT_CACHE = "slawminyaw-fonts-v1";
const CDN_CACHE  = "slawminyaw-cdn-v1";
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
  "./maddawg.png",
  "./newicon.png",
  "./poke-gengar.gif",
  "./poke-gastly.gif",
  "./poke-haunter.gif",
  "./poke-charizard.gif",
  "./poke-squirtle.gif",
  "./team-bears.png",
  "./team-dodgers.png",
  "./team-knights.png",
  "./team-celtics.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      // Cache assets individually — one failure won't block the whole install.
      // cache:"reload" bypasses the HTTP cache so a new release always precaches
      // the new bytes, never a stale copy the browser happened to be holding.
      return Promise.allSettled(
        ASSETS.map(url =>
          fetch(new Request(url, { cache: "reload" }))
            .then(res => (res.ok ? c.put(url, res) : null))
            .catch(() => { /* skip if unavailable */ })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE && k !== FONT_CACHE && k !== CDN_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// The app shell, as absolute URLs, so a request can be recognised as shell.
const SHELL = new Set(ASSETS.map(p => new URL(p, self.location.href).href));

// Serve from cache immediately, then refresh the entry in the background.
// This is what makes launch feel instant: no network round-trip stands between
// the tap and the first paint. It is safe because the app polls version.txt on
// every launch (always live, never cached) and surfaces the update button, so a
// cached shell can never strand anyone on an old build.
function staleWhileRevalidate(e, cacheName) {
  const req = e.request;
  return caches.open(cacheName).then(async c => {
    const cached = await c.match(req);
    const revalidate = fetch(new Request(req, { cache: "no-cache" }))
      .then(res => { if (res.ok) c.put(req, res.clone()); return res; })
      .catch(() => null);
    if (cached) {
      e.waitUntil(revalidate);   // finish the refresh even after we've responded
      return cached;
    }
    return (await revalidate) || new Response("", { status: 504, statusText: "Offline" });
  });
}

self.addEventListener("fetch", e => {
  // Only GETs are cacheable; let everything else go straight to the network.
  if (e.request.method !== "GET") return;

  const url = e.request.url;

  // version.txt — always live, never cached. This is the update mechanism.
  if (url.includes("version.txt")) {
    e.respondWith(fetch(e.request, { cache: "no-cache" }).catch(() => new Response("")));
    return;
  }

  // Google Fonts — cache-first (fonts don't change, re-fetching is wasted bandwidth)
  if (url.includes("fonts.googleapis.com") || url.includes("fonts.gstatic.com")) {
    e.respondWith(
      caches.open(FONT_CACHE).then(c =>
        c.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            if (res.ok) c.put(e.request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  // Pinned CDN libraries (Chart.js, Cascadia Code) — the URLs carry their own
  // version, so a cached copy is never wrong. Cache-first keeps the first chart
  // and the PowerShell theme from waiting on a download every session.
  if (url.includes("cdn.jsdelivr.net")) {
    e.respondWith(
      caches.open(CDN_CACHE).then(c =>
        c.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            if (res.ok || res.type === "opaque") c.put(e.request, res.clone());
            return res;
          });
        }).catch(() => fetch(e.request))
      )
    );
    return;
  }

  // The app shell (and any page navigation) — cache-first, refreshed in background.
  if (e.request.mode === "navigate" || SHELL.has(url) || SHELL.has(url.split("?")[0])) {
    e.respondWith(staleWhileRevalidate(e, CACHE));
    return;
  }

  // Everything else: network first, fall back to cache.
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
