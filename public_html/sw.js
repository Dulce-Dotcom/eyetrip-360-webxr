const CACHE_NAME = 'eyetrip-vr-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/video1.html',
  '/video2.html',
  '/video3.html',
  '/video4.html',
  '/gallery.html',
  '/css/app.css',
  '/css/eyetrip-style.css',
  '/css/material-ui.css',
  '/js/app.js',
  '/js/modules/PanoramaPlayer.js',
  '/js/modules/ParticleTrailSystem.js',
  '/js/modules/VRMenu.js',
  '/js/modules/WebXRHandler.js',
  '/js/modules/VideoStreamManager.js',
  '/js/vendor/VRButton.js',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  '/assets/sound/swoosh.mp3'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip video files - always fetch from network
  if (event.request.url.includes('/assets/videos/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});
