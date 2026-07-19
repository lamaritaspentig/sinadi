const CACHE_NAME = 'lamarita-v3';

// spentig.ico didaftarkan sebagai aset inti yang wajib dimasukkan ke cache offline
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './spentig.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Mengamankan aset inti ke memori lokal...');
      return Promise.allSettled(
        CORE_ASSETS.map(asset => {
          return cache.add(asset).catch(err => {
            console.warn(`[Service Worker] Aset opsional gagal dimuat: ${asset}`, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Menghapus cache usang:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Sajikan dari cache, lakukan pembaruan di latar belakang
          fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          }).catch(() => {/* Abaikan jika offline */});
          
          return cachedResponse;
        }
        return fetch(event.request);
      })
    );
  }
});
