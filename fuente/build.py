import os
src=open('src/app.html').read()
head,body=src.split('<!--HEAD-END-->')
head_lib=''
body=body.replace('https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js','js/qrcode.js')
head=head.replace('https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js','js/qrcode.js')
import shutil; os.makedirs('dist/js',exist_ok=True); shutil.copy('qrcode.js','dist/js/qrcode.js'); shutil.copy('leaflet.js','dist/js/leaflet.js')
body=body.replace('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js','js/leaflet.js')
page=f'''<!doctype html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#1D3F30">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Actas Guardaparques">
<meta property="og:locale" content="es_AR">
<meta property="og:url" content="https://rikochet87.github.io/actas-guardaparques/">
<meta property="og:title" content="Actas Guardaparques">
<meta property="og:description" content="Labrá e imprimí actas de infracción y de constatación desde el teléfono. Funciona sin señal.">
<meta property="og:image" content="https://rikochet87.github.io/actas-guardaparques/og-image.png">
<meta property="og:image:secure_url" content="https://rikochet87.github.io/actas-guardaparques/og-image.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Emblema de guardaparques con un pino y montañas, y el título Actas Guardaparques">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="https://rikochet87.github.io/actas-guardaparques/og-image.png">
<meta name="description" content="Elaboración digital de actas de infracción y de constatación para el Cuerpo de Guardaparques Nacionales.">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<style>:root{{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}body{{margin:0}}img{{max-width:100%}}[hidden]{{display:none!important}}</style>
{head.strip()}
</head>
<body>
{body.strip()}
</body>
</html>
'''
os.makedirs('dist/icons',exist_ok=True)
open('dist/index.html','w').write(page)
open('dist/manifest.webmanifest','w').write('''{
  "name": "Actas Guardaparques",
  "short_name": "Actas GP",
  "description": "Actas de infracción y de constatación del Cuerpo de Guardaparques Nacionales",
  "lang": "es-AR",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#EDEFE8",
  "theme_color": "#1D3F30",
  "icons": [
    {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
    {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
    {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"}
  ]
}
''')
open('dist/sw.js','w').write('''// Service worker: la app funciona sin señal una vez abierta con conexión.
const V = "actas-gp-v7";
const CORE = ["./", "index.html", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png", "og-image.png", "js/qrcode.js", "js/leaflet.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== "mapas-v1").map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const r = e.request; if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin === location.origin) {
    // Red primero para la página (toma actualizaciones), caché si no hay señal
    if (r.mode === "navigate") { e.respondWith(fetch(r).then(res => { caches.open(V).then(c => c.put("index.html", res.clone())); return res; }).catch(() => caches.match("index.html"))); return; }
    e.respondWith(caches.match(r).then(m => m || fetch(r)));
  } else if (/^(tile\\.openstreetmap\\.org|server\\.arcgisonline\\.com)$/.test(u.hostname)) {
    // Mosaicos del mapa: se guardan los que se ven con señal para usarlos sin conexión
    e.respondWith(caches.open("mapas-v1").then(c => c.match(r).then(m => m || fetch(r).then(res => { c.put(r, res.clone()); c.keys().then(k => { if (k.length > 2500) k.slice(0, k.length - 2500).forEach(x => c.delete(x)); }); return res; }))));
  } else if (/fonts\\.(googleapis|gstatic)\\.com$/.test(u.hostname)) {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); return res; })));
  }
});
''')
print('ok')
