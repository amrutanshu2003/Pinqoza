/* Basic service worker for offline caching (no build-time precache).
 * Caches:
 * - GET /api/products* responses
 * - Images (png/jpg/webp/svg)
 * - CSS/JS from same-origin
 */

const CACHE_NAME = 'pinqoza-runtime-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))));
      await self.clients.claim();
    })()
  );
});

const isCacheableRequest = (request) => {
  if (request.method !== 'GET') return false;
  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin) return false;

  if (url.pathname.startsWith('/api/products')) return true;
  if (/\.(png|jpg|jpeg|webp|svg)$/i.test(url.pathname)) return true;
  if (/\.(css|js)$/i.test(url.pathname)) return true;
  return false;
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!isCacheableRequest(request)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // For products API, prefer network then cache (fresh when online)
      const url = new URL(request.url);
      const isProductsApi = url.pathname.startsWith('/api/products');
      const isJsCss = /\.(css|js)$/i.test(url.pathname);

      if (isProductsApi || isJsCss) {
        try {
          const fresh = await fetch(request);
          cache.put(request, fresh.clone());
          return fresh;
        } catch (e) {
          const cached = await cache.match(request);
          if (cached) return cached;
          throw e;
        }
      }

      // For static assets/images, prefer cache then network
      const cached = await cache.match(request);
      if (cached) return cached;

      const fresh = await fetch(request);
      cache.put(request, fresh.clone());
      return fresh;
    })()
  );
});
