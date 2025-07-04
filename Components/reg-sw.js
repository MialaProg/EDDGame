// Enregistre le Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Récupère tous les assets critiques du DOM
        const criticalAssets = [
            location.href,
            ...Array.from(document.querySelectorAll('link[rel="stylesheet"], script[src], img[src]'))
                .map(el => el.href || el.src)
                .filter(Boolean)
        ];
        
        // Enregistre le SW avec la liste des assets
        navigator.serviceWorker.register('/sw.js', {
            updateViaCache: 'none',
            scope: '/'
        }).then(registration => {
            console.log('SW enregistré');
            
            // Envoie la liste des assets critiques au SW
            if (registration.active) {
                registration.active.postMessage({
                    type: 'CRITICAL_ASSETS',
                    assets: criticalAssets
                });
            }
        });
    });
}