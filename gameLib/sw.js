const CACHE_NAME = 'cache-v1';
// find . -type f
const ASSETS = [
    './externalLib/bulma.css',
    './gameData/const.miDb',
    './gameData/items.miDb',
    './gameData/txt.miBasic',
    './gameLib/miBasicInterpreter.js',
    './gameLib/buttons.css',
    './gameLib/canvas.js',
    './gameLib/divers.css',
    './gameLib/disc.js',
    './gameLib/disc.css',
    './gameLib/EDDGame.webmanifest',
    './gameLib/game.js',
    './gameLib/style.css',
    './gameLib/sw.js',
    './Images/icon.png',
    './Images/Items/O21.png',
    './Images/Items/O22.png',
    './Images/Items/O23.png',
    './Images/Items/O3.png',
    './Images/Items/O30.png',
    './Images/Items/O31.png',
    './Images/Items/O32.png',
    './Images/Items/O33.png',
    './Images/Items/O4.png',
    './Images/Items/O5.png',
    './Images/Items/O6.png',
    './Images/Items/O7.png',
    './Images/Items/O8.png',
    './Images/Items/O9.png',
    './Images/Items/P1.png',
    './Images/Items/P11.png',
    './Images/Items/P2.png',
    './Images/Items/P3.png',
    './Images/Items/P3aPp.png',
    './Images/Items/P4.png',
    './Images/Items/P5.png',
    './Images/Items/P7.png',
    './Images/Items/R1.png',
    './Images/Items/R10.png',
    './Images/Items/R11.png',
    './Images/Items/R12.png',
    './Images/Items/R16.png',
    './Images/Items/R2.png',
    './Images/Items/R3.png',
    './Images/Items/R4.png',
    './Images/Items/R5.png',
    './Images/Items/R6.png',
    './Images/Items/R7.png',
    './Images/Items/R8.png',
    './Images/Items/R9.png',
    './Images/Items/Regles & Equ.png',
    './Images/Items/Souris.png',
    './Images/Items/Eau.png',
    './Images/Items/Frometon.png',
    './Images/Items/L1.png',
    './Images/Items/L10.png',
    './Images/Items/L12.png',
    './Images/Items/L13.png',
    './Images/Items/L14.png',
    './Images/Items/L15.png',
    './Images/Items/L16.png',
    './Images/Items/L17.png',
    './Images/Items/L18.png',
    './Images/Items/L2.png',
    './Images/Items/L3.png',
    './Images/Items/L4.png',
    './Images/Items/L5.png',
    './Images/Items/L6.png',
    './Images/Items/L7.png',
    './Images/Items/L8.png',
    './Images/Items/L85.png',
    './Images/Items/L86.png',
    './Images/Items/L87.png',
    './Images/Items/L9.png',
    './Images/Items/L97.png',
    './Images/Items/Lunr.png',
    './Images/Items/O1.png',
    './Images/Items/O10.png',
    './Images/Items/O11.png',
    './Images/Items/O12.png',
    './Images/Items/O13.png',
    './Images/Items/O15.png',
    './Images/Items/O16.png',
    './Images/Items/O19.png',
    './Images/Items/O2.png',
    './Images/Items/O20.png',
    './index.html'
];
//Précacher les ressources
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(ASSETS);
            })
    );
}
);
//Intercepter les requêtes réseau
self.addEventListener('fetch', event => {
    event.respondWith(
        fetch(event.request)
            .catch(() => caches.match(event.request))
    );
});