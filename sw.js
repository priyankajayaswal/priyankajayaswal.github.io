// Studyhub PWA service worker
// Strategy:
//   * HTML pages          → network-first (always-fresh when online; cached fallback offline)
//   * Same-origin static
//     (icons, manifest)   → cache-first
//   * Same-origin JSON,
//     CSS, JS             → stale-while-revalidate
//   * Cross-origin GETs
//     (d3 CDN, etc.)      → stale-while-revalidate with opaque-response fallback
//
// Editing a page on disk and reloading shows the new version immediately (no need to bump CACHE_NAME).
// Bump CACHE_NAME only when changing this file's logic or evicting old CDN versions.

const CACHE_NAME = 'studyhub-v7';

// Precache: hub shell + the one external library every page needs.
// (Cross-origin requests use { mode: 'no-cors' } so they store as opaque responses.)
const SAME_ORIGIN_PRECACHE = [
  './',
  './try.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];
const CROSS_ORIGIN_PRECACHE = [
  'https://d3js.org/d3.v7.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(SAME_ORIGIN_PRECACHE);
    // Cross-origin precache must use no-cors → opaque responses, which still serve fine
    await Promise.all(CROSS_ORIGIN_PRECACHE.map(url =>
      fetch(new Request(url, { mode: 'no-cors' }))
        .then(resp => cache.put(url, resp))
        .catch(() => {/* offline at install time — will lazy-fill on first online visit */})
    ));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isHtml(req) {
  if (req.mode === 'navigate') return true;
  const accept = req.headers.get('accept') || '';
  if (accept.includes('text/html')) return true;
  return /\.html?($|\?)/.test(new URL(req.url).pathname);
}

function isCacheFirstStatic(url) {
  const p = url.pathname;
  return p.startsWith('/icons/')
      || p.endsWith('/manifest.json')
      || /\.(woff2?|ttf|otf|png|jpe?g|svg|webp|gif|ico)$/.test(p);
}

async function networkFirst(request) {
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, fresh.clone());
    }
    return fresh;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      const shell = await caches.match('./try.html');
      if (shell) return shell;
    }
    throw e;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const fresh = await fetch(request);
  if (fresh && (fresh.ok || fresh.type === 'opaque') && request.method === 'GET') {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, fresh.clone());
  }
  return fresh;
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then(fresh => {
    if (fresh && (fresh.ok || fresh.type === 'opaque') && request.method === 'GET') {
      caches.open(CACHE_NAME).then(cache => cache.put(request, fresh.clone()));
    }
    return fresh;
  }).catch(() => cached);
  return cached || fetchPromise;
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin && isHtml(req)) {
    event.respondWith(networkFirst(req));
  } else if (sameOrigin && isCacheFirstStatic(url)) {
    event.respondWith(cacheFirst(req));
  } else {
    // Same-origin JSON/CSS/JS AND cross-origin (d3 CDN, etc.):
    // stale-while-revalidate gives instant offline + background refresh.
    event.respondWith(staleWhileRevalidate(req));
  }
});
