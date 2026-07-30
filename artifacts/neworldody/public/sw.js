/**
 * Neworldody Service Worker
 * Caches the app shell and data for offline use.
 */

const CACHE_NAME = 'neworldody-v3';
const ASSETS = [
  '/',
  '/css/style.css',
  '/js/app.js',
  '/js/storage.js',
  '/js/sky.js',
  '/js/audio.js',
  '/data/config.json',
  '/data/challenges.json',
  '/data/achievements.json',
  '/data/events.json',
  '/data/soul.json',
  '/data/days/day_001.json',
  '/data/days/day_002.json',
  '/data/days/day_003.json',
  '/data/days/day_004.json',
  '/data/days/day_005.json',
  '/data/days/day_006.json',
  '/data/days/day_007.json',
  '/manifest.json',
  '/favicon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.url.includes('/data/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
  } else {
    event.respondWith(
      caches.match(request).then(cached => {
        return cached || fetch(request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        });
      })
    );
  }
});
