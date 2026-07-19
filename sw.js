const CACHE_NAME = 'lamarita-v2';

// Hanya daftarkan aset internal yang 100% PASTI ada.
// Ikon dihapus dari daftar wajib muat awal agar SW tidak macet jika Anda belum mengunggah gambar ikon.
const REQUIRED_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Mengunduh aset inti ke cache...');
      // Menggunakan pendekatan satu per satu agar jika salah satu gagal, yang lain tetap tersimpan
      return Promise.allSettled(
        REQUIRED_ASSETS.map(asset => {
          return cache.add(asset).catch(err => {
            console.warn(`[Service Worker] Gagal mengunduh aset opsional: ${asset}`, err);
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
            console.log('[Service Worker] Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Hanya intercept file lokal di domain GitHub Pages Anda
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Kembalikan dari cache, tapi lakukan update latar belakang jika online
          fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          }).catch(() => {/* Abaikan jika sedang offline */});
          
          return cachedResponse;
        }
        return fetch(event.request);
      })
    );
  }
});
