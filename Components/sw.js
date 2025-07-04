// Import Workbox depuis CDN
importScripts('https://cdnjs.cloudflare.com/ajax/libs/workbox-sw/7.0.0/workbox-sw.min.js');

// Configuration
workbox.setConfig({ debug: true });

// Cache initial des assets critiques (sans utiliser document)
const PRECACHE_URLS = [
    '/index.html',
    // Ajoutez ici manuellement les URLs critiques si nécessaire
];

// Pré-cache des assets critiques
workbox.precaching.precacheAndRoute(PRECACHE_URLS);

// Stratégie Network First pour TOUTES les requêtes
const networkFirstHandler = new workbox.strategies.NetworkFirst({
    cacheName: 'network-first-cache',
    plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({ statuses: [0, 200] }),
        new workbox.expiration.ExpirationPlugin({
            maxEntries: 200, // Limite à x entrées
            maxAgeSeconds: 99*366 * 24 * 60 * 60
        })
    ]
});

// Capture toutes les requêtes
workbox.routing.registerRoute(
    ({ url }) => 
        url.origin === self.location.origin ||
        url.href.startsWith('https://cdn.exemple.com'), // Pour les CDNs externes
    networkFirstHandler
);

// Gestion de l'activation
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== 'network-first-cache')
                          .map(name => caches.delete(name))
            );
        })
    );
});

// Skip waiting pour les nouvelles versions
self.addEventListener('install', event => {
    self.skipWaiting();
});

// Réception des assets critiques du client
self.addEventListener('message', event => {
    if (event.data.type === 'CRITICAL_ASSETS') {
        event.waitUntil(
            caches.open(workbox.core.cacheNames.precache).then(cache => {
                return cache.addAll(event.data.assets);
            })
        );
    }
});