const CACHE_VERSION = 'zizo-v2-' + Date.now();
const STATIC_CACHE = CACHE_VERSION + '-static';
const RUNTIME_CACHE = CACHE_VERSION + '-runtime';

const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/assets/generated/zizo-app-icon.dim_192x192.png',
  '/assets/generated/zizo-app-icon.dim_512x512.png',
  '/assets/generated/zizo-app-icon-maskable.dim_512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.error('Cache addAll failed:', error);
        return Promise.resolve();
      });
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !name.startsWith(CACHE_VERSION))
          .map((name) => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // CRITICAL: Skip ALL canister/API calls - never cache backend traffic
  // This includes .ic0.app, .icp0.io, .localhost, and raw canister IDs
  if (
    url.hostname.includes('.ic0.app') ||
    url.hostname.includes('.icp0.io') ||
    url.hostname.includes('.localhost') ||
    url.pathname.includes('/api/') ||
    url.pathname.includes('canister')
  ) {
    return;
  }

  // For same-origin requests only
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Always try network first for HTML to get latest version
        if (event.request.mode === 'navigate' || event.request.destination === 'document') {
          const networkResponse = await fetch(event.request);
          return networkResponse;
        }

        // For static assets, try cache first, then network
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // Fetch from network and cache if successful
        const networkResponse = await fetch(event.request);
        if (networkResponse.status === 200) {
          const cache = await caches.open(RUNTIME_CACHE);
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // For navigation requests, return a basic offline page
        if (event.request.mode === 'navigate') {
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Offline</title></head><body style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;text-align:center;"><div><h1>You are offline</h1><p>Please check your internet connection and try again.</p></div></body></html>',
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/html' }
            }
          );
        }

        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      }
    })()
  );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
