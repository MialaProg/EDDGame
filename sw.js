
// sw.js (Service Worker)
// Importe les bibliothèques Workbox à partir du CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js');
const version = '3';

// Vérifie si Workbox est disponible
if (workbox) {
    console.log('Workbox est chargé avec succès !');

    // Configure le mode de débogage pour Workbox (utile pendant le développement)
    workbox.setConfig({ debug: true });

    // Définit le nom du cache pour les actifs
    // Cela permet de gérer différentes versions de cache si nécessaire
    workbox.core.setCacheNameDetails({
        prefix: 'EDDG',
        suffix: 'v' + version,
        precache: 'precache',
        runtime: 'runtime'
    });

    // Liste des URLs à pré-cacher initialement (ne pas inclure les pages HTML pour permettre leur mise à jour via NetworkFirst)
    workbox.precaching.precacheAndRoute([
        { url: './index.html', revision: version },
        { url: './', revision: version },
        //{ url: './sw.js', revision: version }, // Le Service Worker lui-même
        { url: 'https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js', revision: '6.1.5' }
        // Note: Les assets comme les images et le CDN Tailwind seront gérés par le message posté ou par NetworkFirst
    ]);

    // 2. Stratégie de mise en cache "Network First" (Réseau d'abord)
    // Cette stratégie tente de récupérer la ressource depuis le réseau en premier.
    // Si le réseau est disponible et la requête réussit, la réponse est utilisée et mise en cache.
    // Si le réseau échoue (par exemple, l'utilisateur est hors ligne), la version en cache est utilisée.
    // C'est idéal pour les ressources qui doivent être à jour mais qui doivent aussi fonctionner hors ligne.

    // Mise en cache de toutes les requêtes de navigation (pages HTML)
    workbox.routing.registerRoute(
        // Correspond à toutes les requêtes de navigation (pages HTML)
        new RegExp('/.*'), // Correspond à toutes les URL
        new workbox.strategies.NetworkFirst({
            cacheName: 'html-cache', // Nom spécifique pour le cache HTML
            plugins: [
                // Limite le nombre d'entrées dans ce cache
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 10, // Garde un maximum de 10 pages HTML
                    maxAgeSeconds: 99 * 366 * 24 * 60 * 60, // Les pages expirent après 99+ ans
                }),
                // Gère les réponses qui ne sont pas des succès HTTP (ex: 404, 500)
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200], // Cache les réponses avec statut 0 (pour les requêtes CORS) et 200
                }),
            ],
        })
    );

    // Mise en cache des ressources statiques (CSS, JS, Images, Fonts)
    // Utilise une expression régulière pour correspondre aux extensions de fichiers courantes
    workbox.routing.registerRoute(
        // Correspond aux fichiers CSS, JS, images (jpg, png, gif, svg, webp), et polices (woff, woff2, ttf, otf)
        ({ request }) =>
            request.destination === 'style' ||
            request.destination === 'script' ||
            request.destination === 'image' ||
            request.destination === 'font',
        new workbox.strategies.NetworkFirst({
            cacheName: 'assets-cache', // Nom spécifique pour le cache des assets
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 200, // Garde un maximum de 200 assets
                    maxAgeSeconds: 99 * 366 * 24 * 60 * 60, // Les assets expirent après 99+ ans
                }),
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
            ],
        })
    );

    // 3. Gestion des messages du client (optionnel mais utile)
    // Permet au Service Worker de communiquer avec la page principale
    self.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SKIP_WAITING') {
            // Force le Service Worker à passer à l'état "actif" immédiatement
            // Utile pour les mises à jour sans que l'utilisateur n'ait à recharger la page
            self.skipWaiting();
        } else if (event.data && event.data.type === 'CACHE_ASSETS' && event.data.urls) {
            // Reçoit la liste des URLs à cacher depuis la page principale
            const urlsToCache = event.data.urls;
            console.log('Service Worker a reçu des URLs à cacher :', urlsToCache);

            // Utilise Workbox pour ajouter ces URLs au cache de pré-cache
            // Note: `workbox.precaching.addRoute` n'existe pas directement pour ajouter des URLs au cache de pré-cache après l'installation.
            // On peut utiliser `caches.open` pour ajouter manuellement ou s'assurer que NetworkFirst les mettra en cache.
            // Pour une mise en cache immédiate, on peut utiliser `caches.open` et `cache.addAll`.
            caches.open(workbox.core.cacheNames.precache).then(cache => {
                return cache.addAll(urlsToCache).then(() => {
                    console.log('URLs ajoutées au cache de pré-cache :', urlsToCache);
                }).catch(error => {
                    console.error('Erreur lors de l\'ajout des URLs au cache :', error);
                });
            });
        }
    });

    workbox.routing.registerRoute(
        ({ request }) => request.destination === '' && request.method === 'GET',
        new workbox.strategies.NetworkFirst({
            cacheName: 'fetch-cache',
            plugins: [
                new workbox.expiration.ExpirationPlugin({
                    maxEntries: 100,
                    maxAgeSeconds: 99 * 366 * 24 * 60 * 60,
                }),
                new workbox.cacheableResponse.CacheableResponsePlugin({
                    statuses: [0, 200],
                }),
            ],
        })
    );

    console.log('Service Worker Workbox configuré.');

} else {
    console.error('Workbox n\'a pas pu être chargé.');
}

