// Service worker: la app funciona sin señal una vez abierta con conexión.
const V = "actas-gp-v4";
const CORE = ["./", "index.html", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    // Red primero para la página (toma actualizaciones), caché si no hay señal
    if (r.mode === "navigate") { e.respondWith(fetch(r).then(res => { caches.open(V).then(c => c.put("index.html", res.clone())); return res; }).catch(() => caches.match("index.html"))); return; }
    e.respondWith(caches.match(r).then(m => m || fetch(r)));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; })));
  }
});
