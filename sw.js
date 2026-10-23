/* Caché del mapa de Madrid: las teselas y la librería se guardan en el móvil
   para que las siguientes visitas carguen casi al instante.
   El Excel (.xlsx) y los datos (.json) se piden siempre primero a internet,
   para que tus cambios se vean en cuanto los subes. */
const SHELL = 'madrid3d-shell-v2';
const TILES = 'madrid3d-tiles-v1';
const MAX_TILES = 1500;

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(SHELL).then(c => Promise.allSettled([
    './', 'index.html',
    'https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.js',
    'https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/maplibre-gl.css'
  ].map(u => c.add(u)))));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== SHELL && k !== TILES).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length > MAX_TILES) {
    await Promise.all(keys.slice(0, keys.length - MAX_TILES).map(k => cache.delete(k)));
  }
}

async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) {
    cache.put(req, res.clone());
    if (Math.random() < 0.05) trim(cache);
  }
  return res;
}

async function staleWhileRevalidate(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  const net = fetch(req).then(res => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
    return res;
  }).catch(() => hit);
  return hit || net;
}

async function networkFirst(req, name, ms) {
  const cache = await caches.open(name);
  const net = fetch(req).then(res => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  });
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
  try {
    return await Promise.race([net, timeout]);
  } catch (err) {
    const hit = await cache.match(req);
    return hit || net;
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.hostname === 'tiles.openfreemap.org') {
    if (/\/\d+\/\d+\/\d+\.(pbf|mvt)$/.test(url.pathname)) {
      e.respondWith(cacheFirst(req, TILES));
    } else {
      e.respondWith(networkFirst(req, TILES, 2500));
    }
  } else if (url.origin === self.location.origin && /\.(xlsx|json)$/i.test(url.pathname)) {
    e.respondWith(networkFirst(req, SHELL, 4000));
  } else if (url.hostname === 'cdnjs.cloudflare.com' || url.origin === self.location.origin) {
    e.respondWith(staleWhileRevalidate(req, SHELL));
  }
});
