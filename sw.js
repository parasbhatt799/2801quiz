const CACHE_NAME = 'iq-master-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.html',
  '/topic.html',
  '/result.html',
  '/scratch.html',
  '/content.html',
  '/app-logic.js',
  '/ads-manager.js',
  '/quizbank.js',
  '/tailwindcss.js',
  '/manifest.json',
  '/css/all.min.css',
  '/css/main.css',
  '/Diamond.png',
  '/GlooWall.png',
  '/Sensitivity.png',
  '/character.png',
  '/img-1.png',
  '/rankPush.png',
  '/wepons.png'
];

// Install Event - Pre-cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache-First for static assets, Network-First for API/Dynamic
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip caching for API calls, Google Analytics, AdSense, Clarity, etc.
  if (
    url.pathname.includes('api.php') ||
    url.hostname.includes('googletagmanager.com') ||
    url.hostname.includes('pagead2.googlesyndication.com') ||
    url.hostname.includes('googleads') ||
    url.hostname.includes('clarity.ms') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version immediately
        return cachedResponse;
      }

      // Fallback to network
      return fetch(event.request).then((networkResponse) => {
        // Cache newly fetched basic static assets
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
      }).catch(() => {
        // Offline fallback
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});