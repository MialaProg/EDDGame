// Import Workbox depuis CDN (seule importation nécessaire)
importScripts('https://cdnjs.cloudflare.com/ajax/libs/workbox-sw/7.0.0/workbox-sw.min.js');

// Configuration
workbox.setConfig({ debug: true }); // Désactiver en production

// Stratégie Network First pour TOUS les contenus
const networkFirstHandler = new workbox.strategies.NetworkFirst({
    cacheName: 'network-first-cache',
    plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
            statuses: [0, 200] // Inclut les réponses opaque (cross-origin)
        }),
        new workbox.expiration.ExpirationPlugin({
            maxEntries: 200, // Limite à 200 entrées maximum
            maxAgeSeconds: 100 * 366 * 24 * 60 * 60 // 100+ ans
        })
    ]
});

// Capture automatique de tous les assets (pages, scripts, images, etc.)
workbox.routing.registerRoute(
    ({ request }) => 
        request.destination === 'document' || 
        request.destination === 'script' ||
        request.destination === 'style' ||
        request.destination === 'image' ||
        request.destination === 'font',
    networkFirstHandler
);

// Capture des navigations (pages)
workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    networkFirstHandler
);

// Cache automatique des assets critiques présents dans le HTML
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('precache').then(cache => {
            return cache.addAll([
                '/index.html',
                // Ajoute automatiquement tous les assets du document
                ...Array.from(document.querySelectorAll('link[rel="stylesheet"], script[src], img[src]'))
                    .map(el => el.href || el.src)
                    .filter(url => url.startsWith('http'))
            ]);
        })
    );
});

// Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== 'network-first-cache')
                          .map(name => caches.delete(name))
            );
        })
    );
});