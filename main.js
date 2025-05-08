var pageMode = 'pregame';





function libLoaded(libname) {
    try {
        return eval(libname + 'JSLoaded');
    } catch (e) {
        return;
    }
}

/**
 * Attend qu'une condition soit remplie en vérifiant à intervalles réguliers
 * @param {function} condition - Fonction à tester qui retourne une valeur truthy quand prête
 * @param {number} [interval=100] - Intervalle de vérification en millisecondes
 * @param {number} [timeout=10000] - Délai maximum d'attente en millisecondes
 * @returns {Promise<any>} Promesse résolue avec la valeur retournée par la condition
 * @throws {Error} Si le timeout est atteint ou si la condition lève une erreur
 * 
 * @example
 * // Attendre un élément DOM
 * const button = await wait(() => document.querySelector('#submit-btn'));
 * 
 * @example
 * // Attendre une valeur spécifique avec vérification
 * const data = await wait(
 *   () => api.data?.status === 'ready' ? api.data : null,
 *   200,
 *   5000
 * );
 */
function wait(condition, interval = 100, timeout = 10 ** 7) {
    return new Promise((resolve, reject) => {
        let intervalId;
        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            reject(new Error(`Timeout after ${timeout}ms`));
        }, timeout);

        const check = () => {
            try {
                const result = condition();
                if (result) {
                    clearTimeout(timeoutId);
                    clearInterval(intervalId);
                    resolve(result);
                }
            } catch (error) {
                clearTimeout(timeoutId);
                clearInterval(intervalId);
                reject(error);
            }
        };

        check(); // Premier check immédiat
        intervalId = setInterval(check, interval);
    });
}

// Initialisation of the game.
async function initMain() {
    await wait(() => libLoaded('Tools') && libLoaded('Players'));
    // Players choice init
    log('Players init...')
    PlayersJS.init();
    await wait(() => libLoaded('Loading'));
    // Loading init
    Loading.init();

    PlayersJS.playBtnChecks[0] = true;
    document.getElementById('players-p').innerText = 'Séléctionnez vos joueurs:';

    await wait(() => libLoaded('MiDbReader') && libLoaded('Game') && libLoaded('Canvas') && libLoaded('Imgs'));
    // Init all & preparing hall img
    miDb.initConst();
    Loading.setTitle('Téléchargement des données...');
    Loading.setProgressBar(0);

    await miDb.initLib();
    
    // Game generation: 10% to 50%
    wait(() => PlayersJS.PlayersChoiced && miDb.const()).then(() => {
        Loading.setTitle('Création de la partie...');
        Loading.setProgressBar(10);
    });

    await wait(() => libLoaded('Buttons'));
    // Buttons init
    await wait(() => libLoaded('Modal') && libLoaded('MiBasicReader'));
    // Init all

}

console.log('Main:init...');
document.addEventListener("DOMContentLoaded", function () {
    console.log('Doc loaded');
    initMain();
});


MainJSLoaded = true;