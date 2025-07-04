<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Site Hors Ligne (Network First)</title>
    <!-- Chargement de Tailwind CSS pour un style rapide et réactif -->
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f0f4f8; /* Couleur de fond légère */
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }
        .container {
            background-color: #ffffff;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            max-width: 800px;
            width: 100%;
            text-align: center;
            margin-bottom: 20px;
        }
        h1 {
            color: #2c3e50;
            margin-bottom: 20px;
            font-size: 2.5rem;
            font-weight: bold;
        }
        p {
            color: #34495e;
            line-height: 1.6;
            margin-bottom: 15px;
        }
        .status-message {
            margin-top: 20px;
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: bold;
        }
        .status-online {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .status-offline {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        .image-gallery {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 15px;
            margin-top: 30px;
        }
        .image-item {
            width: 150px;
            height: 150px;
            background-color: #ecf0f1;
            border-radius: 8px;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.9rem;
            color: #7f8c8d;
            border: 1px solid #bdc3c7;
        }
        .image-item img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 8px;
        }

        /* Styles responsifs pour les petits écrans */
        @media (max-width: 640px) {
            h1 {
                font-size: 1.8rem;
            }
            .container {
                padding: 20px;
            }
            .image-item {
                width: 120px;
                height: 120px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Bienvenue sur notre site hors ligne !</h1>
        <p>Cette page est conçue pour démontrer les capacités hors ligne grâce à un Service Worker et Workbox, en utilisant une stratégie de mise en cache "network first".</p>
        <p>Essayez de désactiver votre connexion internet et de recharger la page. Si tout fonctionne correctement, vous devriez toujours voir cette page.</p>
        <div id="status" class="status-message">Vérification de l'état de la connexion...</div>

        <div class="image-gallery">
            <div class="image-item">
                <img src="https://placehold.co/150x150/FF5733/FFFFFF?text=Image+1" alt="Image de démonstration 1" onerror="this.src='https://placehold.co/150x150/CCCCCC/000000?text=Erreur+Image';">
            </div>
            <div class="image-item">
                <img src="https://placehold.co/150x150/33FF57/FFFFFF?text=Image+2" alt="Image de démonstration 2" onerror="this.src='https://placehold.co/150x150/CCCCCC/000000?text=Erreur+Image';">
            </div>
            <div class="image-item">
                <img src="https://placehold.co/150x150/3357FF/FFFFFF?text=Image+3" alt="Image de démonstration 3" onerror="this.src='https://placehold.co/150x150/CCCCCC/000000?text=Erreur+Image';">
            </div>
            <div class="image-item">
                <img src="https://placehold.co/150x150/FFFF33/000000?text=Image+4" alt="Image de démonstration 4" onerror="this.src='https://placehold.co/150x150/CCCCCC/000000?text=Erreur+Image';">
            </div>
        </div>
    </div>

    <!-- Script pour enregistrer le Service Worker -->
    <script>
        // Fonction pour collecter les URLs des assets
        function collectAssetsUrls() {
            const urls = new Set();

            // Ajouter les URLs des images
            document.querySelectorAll('img').forEach(img => {
                if (img.src) {
                    urls.add(new URL(img.src).href); // Utilise URL pour obtenir l'URL absolue
                }
            });

            // Ajouter les URLs des scripts externes (sauf le Service Worker lui-même)
            document.querySelectorAll('script[src]').forEach(script => {
                if (script.src && !script.src.includes('sw.js')) {
                    urls.add(new URL(script.src).href);
                }
            });

            // Ajouter les URLs des feuilles de style externes
            document.querySelectorAll('link[rel="stylesheet"][href]').forEach(link => {
                if (link.href) {
                    urls.add(new URL(link.href).href);
                }
            });

            // Ajoutez d'autres types d'assets si nécessaire (ex: fonts, vidéos)

            return Array.from(urls);
        }

        // Vérifie si les Service Workers sont supportés par le navigateur
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('Service Worker enregistré avec succès :', registration);

                        // Une fois le Service Worker enregistré, envoyez-lui les URLs des assets
                        if (registration.active) {
                            const assetsToCache = collectAssetsUrls();
                            registration.active.postMessage({
                                type: 'CACHE_ASSETS',
                                urls: assetsToCache
                            });
                            console.log('URLs des assets envoyées au Service Worker :', assetsToCache);
                        }
                    })
                    .catch(error => {
                        console.error('Échec de l\'enregistrement du Service Worker :', error);
                    });
            });
        } else {
            console.warn('Votre navigateur ne supporte pas les Service Workers.');
        }

        // Met à jour le statut de la connexion en temps réel
        function updateOnlineStatus() {
            const statusElement = document.getElementById('status');
            if (navigator.onLine) {
                statusElement.textContent = 'Vous êtes en ligne.';
                statusElement.className = 'status-message status-online';
            } else {
                statusElement.textContent = 'Vous êtes hors ligne. Le contenu est servi depuis le cache.';
                statusElement.className = 'status-message status-offline';
            }
        }

        // Écoute les changements d'état de la connexion
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        // Appelle la fonction au chargement initial de la page
        updateOnlineStatus();
    </script>
</body>
</html>
```javascript
// sw.js (Service Worker)
// Importe les bibliothèques Workbox à partir du CDN
importScripts('[https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js](https://storage.googleapis.com/workbox-cdn/releases/6.1.5/workbox-sw.js)');

// Vérifie si Workbox est disponible
if (workbox) {
    console.log('Workbox est chargé avec succès !');

    // Configure le mode de débogage pour Workbox (utile pendant le développement)
    workbox.setConfig({ debug: true });

    // Définit le nom du cache pour les actifs
    // Cela permet de gérer différentes versions de cache si nécessaire
    workbox.core.setCacheNameDetails({
        prefix: 'my-app',
        suffix: 'v1',
        precache: 'precache',
        runtime: 'runtime'
    });

    // Liste des URLs à pré-cacher initialement (peut être vide si tout est envoyé par postMessage)
    // Pour cet exemple, nous gardons les URLs critiques ici.
    workbox.precaching.precacheAndRoute([
        { url: '/', revision: '1' }, // La page d'index
        { url: '/index.html', revision: '1' }, // La page d'index (au cas où l'URL exacte serait demandée)
        { url: '/sw.js', revision: '1' }, // Le Service Worker lui-même
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
                    maxEntries: 50, // Garde un maximum de 50 pages HTML
                    maxAgeSeconds: 30 * 24 * 60 * 60, // Les pages expirent après 30 jours
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
                    maxEntries: 60, // Garde un maximum de 60 assets
                    maxAgeSeconds: 30 * 24 * 60 * 60, // Les assets expirent après 30 jours
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

    console.log('Service Worker Workbox configuré.');

} else {
    console.error('Workbox n\'a pas pu être chargé.');
}

