const CACHE_NAME = 'transferencia-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
];

// Rutas que el SW NO debe interceptar nunca
const BYPASS_PATTERNS = [
  /\/api\//,
  /\/_next\/webpack-hmr/,
  /\/socket\.io/,
  /\/ws/,
  /^chrome-extension/,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        console.log('Some resources could not be cached');
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Solo manejar GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // No interceptar rutas de API, WebSocket ni extensiones
  const shouldBypass = BYPASS_PATTERNS.some((pattern) =>
    pattern.test(event.request.url)
  );
  if (shouldBypass) return;

  // No interceptar peticiones cross-origin (evita el problema con maplibre, etc.)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request)
        .then((networkResponse) => {
          // Solo cachear respuestas válidas same-origin
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Fallback a la página principal si hay error de red
          return caches.match('/') || new Response('Sin conexión', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        });
    })
  );
});