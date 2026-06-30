// Минимальный service worker: без офлайн-кэша.
// Нужен только для того, чтобы приложение можно было установить как PWA.
// Все запросы идут напрямую в сеть — обновления всегда свежие, без устаревшего кэша.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Сетевой проход без кэширования.
  event.respondWith(fetch(event.request));
});
