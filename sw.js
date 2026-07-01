const CACHE_NAME = 'smartkiosk-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Installazione: metti in cache le risorse principali
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Attivazione: elimina vecchie cache
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: prima prova dalla rete (dati Firebase sempre freschi),
// se offline usa la cache per la struttura dell'app
self.addEventListener('fetch', e => {
  // Le chiamate Firebase vanno sempre dalla rete, mai dalla cache
  if (e.request.url.includes('firebasedatabase') ||
      e.request.url.includes('firebaseapp') ||
      e.request.url.includes('gstatic.com')) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Aggiorna la cache con la versione più recente
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
