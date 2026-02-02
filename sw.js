const cacheName = 'barcalc-v3'; // Increment version for new deployment
const staticAssets = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json'
];

// 1. Install - Pre-cache all vital assets and skip waiting
self.addEventListener('install', e => {
  console.log('[ServiceWorker] Install');
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(staticAssets);
    }).then(() => {
      console.log('[ServiceWorker] Skip waiting');
      return self.skipWaiting(); // Activate immediately
    })
  );
});

// 2. Activate - Clean up old caches and take control immediately
self.addEventListener('activate', e => {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== cacheName)
            .map(key => {
              console.log('[ServiceWorker] Removing old cache:', key);
              return caches.delete(key);
            })
      );
    }).then(() => {
      console.log('[ServiceWorker] Claiming clients');
      return self.clients.claim(); // Take control of all pages immediately
    })
  );
});

// 3. Fetch - Offline-first with network update in background
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  // For same-origin assets, use stale-while-revalidate strategy
  if (url.origin === location.origin) {
    e.respondWith(staleWhileRevalidate(req));
  } else {
    // For external assets (like fonts), go Network-First
    e.respondWith(networkFirst(req));
  }
});

// Stale-while-revalidate: Serve from cache, update in background
async function staleWhileRevalidate(req) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  
  // Fetch fresh version in background
  const fetchPromise = fetch(req).then(fresh => {
    // Update cache with fresh version
    cache.put(req, fresh.clone());
    return fresh;
  }).catch(() => cached); // Fallback to cached on network error
  
  // Return cached immediately if available, otherwise wait for network
  return cached || fetchPromise;
}

// Network-first: Try network, fallback to cache
async function networkFirst(req) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(req);
    await cache.put(req, fresh.clone());
    return fresh;
  } catch (err) {
    const cached = await cache.match(req);
    return cached || new Response('Network error', { status: 408 });
  }
}

// Listen for messages from the app (for manual update checks)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
