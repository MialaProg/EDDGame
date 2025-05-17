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

var canvasObj;
// Initialisation of the game.
async function initMain() {
    await wait(() => libLoaded('Tools') && libLoaded('Players'));
    // Players choice init
    console.log('Players init...')
    PlayersJS.init();
    await wait(() => libLoaded('Loading'));
    // Loading init
    Loading.init();

    PlayersJS.playBtnChecks[0] = true;
    document.getElementById('players-p').innerText = 'Séléctionnez vos joueurs:';

    await wait(() => libLoaded('MiDbReader') && libLoaded('Game') && libLoaded('Canvas') && libLoaded('Imgs'));
    console.log('Db,Game,Canvas&Imgs Loaded');

    // Init all & preparing hall img
    miDb.initConst();
    Loading.setTitle('Téléchargement des données...');
    Loading.setProgressBar(0);
    Loading.setProgressBar(3);

    await miDb.initLib();
    await miDb.constLoaded();

    canvasObj = new CanvasLib('room-canvas');

    // Game generation: 10% to 50%
    wait(() => PlayersJS.PlayersChoiced).then(async () => {
        Loading.setTitle('Création de la partie...');
        Loading.setProgressBar(10);
        Game.generate();
        Loading.setProgressBar(50);

        Loading.setTitle('Affichage de la pièce...');
        showRoom(miDb.START_ROOM[0]);

        canvasObj.update = ()=>{showRoom(Game.actualRoom);};
        setTimeout(()=>{
        Loading.setTitle('Votre connexion semble trop lente.<br>Absorption de trombones...');
        }, 60000);
    });

    // Preload hall image
    console.log('Preload HALL:', Imgs.get('L97'));


    await wait(() => libLoaded('Buttons'));
    // Buttons init
    await wait(() => libLoaded('Modal') && libLoaded('MiBasicReader'));
    // Init all

}

// Show room: use Canvas, Game, Loading
function showRoom(roomINT) {
    Game.actualRoom = roomINT;
    Game.actualItems = [];

    if (pageMode == 'ingame') {
        Loading.setProgressBar(0);
        Loading.changeMode(1);
        Loading.setProgressBar(50);
    }

    canvasObj.setBackground();

    let roomARR = Game.intToCoords(roomINT)
    let placeID = Game.rooms[roomARR[0]][roomARR[1]];
    if (!placeID) {
        console.error('Nothing here...');
    }
    Game.actualItems.push('L' + placeID);
    canvasObj.drawImage(40, 40, 40, 40, 'L' + placeID);

    console.log('DrawChar',Game.db['L' + placeID]);

    let place = Game.db['L' + placeID];
    if (place) {
        let persoID = place['P'];
        if (persoID) {
            Game.actualItems.push('P' + persoID);
            canvasObj.drawImage(20, 85, 39, 29, 'P' + persoID);
            canvasObj.drawRect(20, 85, 41, 31, undefined, 'black');
        }
    }

    // const roomSelect = document.getElementById("current-room");

    console.log('Draw doors');

    // Gestion des portes
    if (place && roomARR[0] != 0) {
        let doorIDs = place['R'];
        let arr = Game.getRoomDoors(roomINT);
        for (let index = 0; index < arr.length; index++) {
            const doorKey = arr[index];
            let doorID = doorIDs ? doorIDs[doorKey] : undefined;
            if (doorID && !Game.db['R' + doorID]['opened']) {
                Game.actualItems.push('R' + doorID);
                if (Math.abs(doorKey) > 5) {
                    canvasObj.drawImage(50 + 4 * doorKey, 40, 20, 40, 'R' + doorID);
                } else {
                    canvasObj.drawImage(60, 50 + 40 * doorKey, 40, 20, 'R' + doorID);
                }
            } else {
                if (Math.abs(doorKey) > 5) {
                    canvasObj.drawArrow(50 + 4 * doorKey, 40, 15, 10, doorKey > 0 ? 'right' : 'left');
                } else {
                    canvasObj.drawArrow(60, 50 + 40 * doorKey, 10, 15, doorKey > 0 ? 'down' : 'up');
                }
                // const nextRoom = (roomINT + doorKey).toString();
                // const [x, y] = [parseInt(nextRoom[0]), parseInt(nextRoom[1])];
                // const optionValue = `${x};${y}`;
                // if (!Array.from(roomSelect.options).some(option => option.value === optionValue)) {
                //     const option = document.createElement("option");
                //     option.value = optionValue;
                //     option.textContent = `${alphabet[x - 1]}${y + 1}`;
                //     roomSelect.appendChild(option);
                // }
            }
        }
    }

    // Rename the option
    // const optionSelected = Array.from(roomSelect.options).find(option => option.value === `${roomARR[0]};${roomARR[1]}`);
    // log('Option selected: ', optionSelected);
    // if (optionSelected && !optionSelected.textContent) {
    //     optionSelected.textContent = optionSelected.innerHTML + '';
    //     log('Txt content:' + optionSelected.textContent);
    // }
    // if (optionSelected && placeID && optionSelected.textContent.length < 5) {
    //     const placeLine = findInArr(db, PLACES_LOC[0], PLACES_LOC[1], item => item[0] == 'L' && item[1] == placeID); //Returns [key, val]
    //     if (placeLine) {
    //         let placeName = placeLine[1][2];
    //         log('Place:L' + placeName);
    //         if (roomARR[0] != 0) {
    //             placeName = optionSelected.textContent + ' : ' + placeName;
    //         }
    //         optionSelected.textContent = placeName;
    //     }
    // }

    // Fin du chargement
    console.log('End SR');
    if (pageMode != 'loadinggame') {
        return;
    }
    wait(() => {
        Loading.setProgressBar(50 + (CanvasLib.numImgsPrinted / CanvasLib.numImgsToPrint) * 50);
        return CanvasLib.numImgsPrinted >= CanvasLib.numImgsToPrint;
    }).then(() => {
        Loading.changeMode(2);
    });
}












console.log('Main:init...');
var devFast = true;
document.addEventListener("DOMContentLoaded", function () {
    console.log('Doc loaded');
    initMain();
});


MainJSLoaded = true;