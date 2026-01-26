const cacheName = 'barload-pro-v3'; // Incremented version
const staticAssets = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

// 1. Install - Pre-cache all vital assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(staticAssets);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate - CLEAN UP OLD CACHES (Critical for offline stability)
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== cacheName)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch - Offline-first strategy
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  // For same-origin assets, go Cache-First
  if (url.origin === location.origin) {
    e.respondWith(cacheFirst(req));
  } else {
    // For external assets (like fonts), go Network-First
    e.respondWith(networkAndCache(req));
  }
});

async function cacheFirst(req) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  // Return cached file, or try to fetch it if missing
  return cached || fetch(req);
}

async function networkAndCache(req) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(req);
    await cache.put(req, fresh.clone());
    return fresh;
  } catch (err) {
    const fallback = await cache.match(req);
    return fallback;
  }
}
