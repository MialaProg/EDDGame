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

var canvasObj, allJSLoaded;
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
        document.getElementById('pageTitle').innerHTML = 'Chargement... | EDDGame';
        Loading.setTitle('Création de la partie...');
        Loading.setProgressBar(10);
        await Game.generate();
        Loading.setProgressBar(50);

        Loading.setTitle('Affichage de la pièce...');
        showRoom(miDb.START_ROOM[0]);
        document.getElementById('pageTitle').innerHTML = 'EDDGame - Board Game Companion';

        canvasObj.update = () => { showRoom(Game.actualRoom); };
        setTimeout(() => {
            if (Imgs.get(miDb.PRELOAD_IMG).isLoading) Loading.setTitle('Votre connexion semble trop lente.<br>Absorption de trombones...');
        }, 60000);
    });

    // Preload hall image
    console.log('Preload HALL:', Imgs.get(miDb.PRELOAD_IMG));


    await wait(() => libLoaded('Buttons'));
    // Buttons init
    RoomSelect.init();
    await wait(() => libLoaded('Modal') && libLoaded('MiBasicReader'));
    // Init all
    Modal.init();
    miBasic.init();
    initMiBasicFunc();

    await wait(() => Modal.isLoaded && miBasic.isLoaded);

    console.log('All initied !');

    allJSLoaded = true;

    if (checkIfUrlContains("Mimi50")) {
        Modal.open();
        Modal.switch('chat');
        await miBasic.init('./DB/mimi.app');
        miBasic.run();
    }




}

function initMiBasicFunc() {
    miBasic.showTxt = MChat.addText;
    miBasic.choice = async (type, options) => {
        MChat.ans = undefined;
        type = type.toUpperCase();
        let selectText;
        try { selectText = eval('miDb.SELECT_TXT_' + type) } catch (e) { };
        if (selectText) selectText = selectText[0];
        options.forEach(option => {
            let txt = option[0];
            if (type == 'OBJ') {
                const obj = Game.db[txt];
                if (!obj || obj.nb <= 0) return;
                txt = findInArr(miDb.lib, miDb.LOC_OBJS[0], miDb.LOC_OBJS[1], item => item[0] == txt)[1][1];
            }
            if (type == 'ON') {
                if (!Game.actualItems.includes(txt)) return;
                txt = findInArr(miDb.lib, 0, undefined, item => item[0] == txt)[1][1];
            }
            MChat.addAnswer(option[1], txt, selectText);
        });
        await wait(() => MChat.ans !== undefined, 200)
        return MChat.ans;
    };
    miBasic.openDoor = (door) => {
        console.log('Open door:', door);
        Game.db[door].opened = true;
        showRoom();
    };
    miBasic.getObject = (obj) => {
        MChat.addText(miDb.TXT_GET[0] + findInArr(miDb.lib, miDb.LOC_OBJS[0], miDb.LOC_OBJS[1], item => item[0] == obj)[1][1], undefined, 10);
        Game.getObject(obj);
    };
    miBasic.useObject = (obj) => {
        console.log('Use object:', obj);
        Game.useObject(obj);
    };
}

// Show room: use Canvas, Game, Loading
function showRoom(roomINT = Game.actualRoom) {
    Game.actualRoom = roomINT;
    Game.actualItems = [];

    if (pageMode == 'ingame') {
        Loading.setProgressBar(0);
        Loading.changeMode(1);
        Loading.setProgressBar(50);
    }

    canvasObj.setBackground();

    const roomARR = Game.intToCoords(roomINT);
    const room = Game.getRoom(roomARR);
    const placeID = room['L'];
    if (placeID) {
        Game.actualItems.push('L' + placeID);
        canvasObj.drawImage(40, 40, 40, 40, 'L' + placeID);

        place = Game.db['L' + placeID];
        if (place) {
            let persoID = place['P'];
            if (persoID && !Game.db['P' + persoID].isHidden) {
                Game.actualItems.push('P' + persoID);
                canvasObj.drawImage(20, 85, 39, 29, 'P' + persoID);
                canvasObj.drawRect(20, 85, 41, 31, undefined, 'black');
            }
        }

        // Rename the option
        const optionSelected = RoomSelect.HTMLE ? Array.from(RoomSelect.HTMLE.options).find(option => option.value === roomINT.toString()) : undefined;
        
        if (optionSelected && !optionSelected.textContent) {
            optionSelected.textContent = optionSelected.innerHTML + '';
        }
        if (optionSelected && optionSelected.textContent.length < 5) {
            const placeLine = findInArr(miDb.lib, miDb.LOC_PLACES[0], miDb.LOC_PLACES[1], item => item[0] == 'L' + placeID); //Returns [key, val]
            if (placeLine) {
                let placeName = placeLine[1][1];
                console.log('Place:L' + placeName);
                if (roomARR[0] != 0) {
                    placeName = optionSelected.textContent + ' : ' + placeName;
                }
                optionSelected.textContent = placeName;
            }
        }
    }

    console.log('Draw doors');

    // Gestion des portes
    if (roomARR[0] != 0) {
        const doorIDs = room['R'];
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
                const nextRoom = (parseInt(roomINT) + doorKey).toString();
                console.log('Test add :', nextRoom, roomINT, doorKey);
                if (RoomSelect.HTMLE && !Array.from(RoomSelect.HTMLE.options).some(option => option.value === nextRoom)) {
                    const option = document.createElement("option");
                    option.value = nextRoom;
                    option.textContent = RoomSelect.roomIntToID(nextRoom);
                    RoomSelect.HTMLE.appendChild(option);
                }
            }
        }
    }



    // Fin du chargement
    console.log('End SR');
    if (pageMode != 'loadinggame') {
        return;
    }
    let noCoTimer = Date.now();
    wait(() => {
        Loading.setProgressBar(50 + (CanvasLib.numImgsPrinted / CanvasLib.numImgsToPrint) * 50);
        return CanvasLib.numImgsPrinted >= CanvasLib.numImgsToPrint || Date.now() - noCoTimer > 10000;
    }).then(() => {
        if (Date.now() - noCoTimer > 10000){
            alert('Certaines images n\'ont pas pu être chargées.\nVeuillez vérifier votre connexion internet.');
        }
        Loading.changeMode(2);
    });
}












console.log('Main:init...');
var devFast = false;
document.addEventListener("DOMContentLoaded", function () {
    console.log('Doc loaded');
    initMain();
});


MainJSLoaded = true;