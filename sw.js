/**
 * sw.js - Service Worker para Funcionamiento 100% Offline e Instalación PWA
 */

const CACHE_NAME = 'control-herramientas-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/db.js',
  './js/excel.js',
  './js/app.js',
  './lib/xlsx.full.min.js',
  './manifest.json',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-192.svg',
  './assets/icon-512.svg'
];

// Instalación: Precarga de todos los archivos necesarios
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activación: Limpieza de cachés antiguas si hubiera actualización
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estrategia de Red: Cache First con Network Fallback (100% Offline)
self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean GET o esquemas extraños
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Guardar copia en caché si es una respuesta válida
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Si no hay internet y busca la página principal, devolver index.html de la caché
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
