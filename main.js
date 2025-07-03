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

function openCongratsPage(time, level) {
  // Valider les paramètres
  if (typeof time === 'number' && typeof level === 'number') {
    const url = `./congrats.html?time=${time}&level=${level}`;
    const newTab = window.open(url, '_blank');
    
    // Vérifier si l'ouverture a été bloquée
    if (!newTab || newTab.closed) {
      alert('Veuillez autoriser les popups pour ce site');
    }
  } else {
    console.error('Paramètres invalides');
  }
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
    Actions.init();
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
            let txt = option[0].trim();
            if (type == 'OBJ') {
                if (txt == '0') {
                    txt = "(Ne rien utiliser)";
                } else {
                    const obj = Game.db[txt];
                    if (!obj || !obj.nb) return;
                    txt = findInArr(miDb.lib, miDb.LOC_OBJS[0], miDb.LOC_OBJS[1], item => item[0] == txt)[1][1];
                }
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
    miBasic.openDoor = async (door) => {
        console.log('Open door:', door);
        Game.db[door].opened = true;
        showRoom();
    };
    miBasic.getObject = async (objs) => {
        if (typeof objs != 'array') objs = [objs];
        // objs.forEach(obj => {
        for (const obj of objs) {
            await MChat.addText(miDb.TXT_GET_FIND_USE[0] + findInArr(miDb.lib, miDb.LOC_OBJS[0], miDb.LOC_OBJS[1], item => item[0] == obj)[1][1], undefined, 10);
            Game.getObject(obj);
            // });
        }
    };
    miBasic.useObject = async (objs) => {
        console.log('Use object:', objs);
        if (typeof objs != 'array') objs = [objs];
        for (const obj of objs) {
            Game.useObject(obj);
            await MChat.addText(miDb.TXT_GET_FIND_USE[2] + findInArr(miDb.lib, miDb.LOC_OBJS[0], miDb.LOC_OBJS[1], item => item[0] == obj)[1][1], undefined, 10);
        }
    };
    miBasic.lock = async (locking) => { Modal.isLocked = locking; };
}

// Show room: use Canvas, Game, Loading
function showRoom(roomINT = Game.actualRoom) {
    Game.actualRoom = roomINT;
    Game.actualItems = [];

    Loading.setTitle('Affichage de la pièce');

    if (pageMode == 'ingame') {
        Loading.setProgressBar(0);
        Loading.changeMode(1);
        Loading.setProgressBar(50);
    }

    canvasObj.setBackground();
    canvasObj.clearHistory()

    const roomARR = Game.intToCoords(roomINT);
    const room = Game.getRoom(roomARR);
    const placeID = room['L'];
    let place;
    if (placeID) {
        if (placeID='99') openCongratsPage(60, Game.level);
        Game.actualItems.push('L' + placeID);
        canvasObj.drawImage(50, 50 / 1.2, 40, 40 / 1.2, 'L' + placeID);

        place = Game.db['L' + placeID];

        // Rename the option
        const option = findInArr(Game.unlockedPlaces, 0, undefined, option => option.id === roomINT.toString());
        if (option[0] && option[1].text.length < 5) {
            const placeLine = findInArr(miDb.lib, miDb.LOC_PLACES[0], miDb.LOC_PLACES[1], item => item[0] == 'L' + placeID); //Returns [key, val]
            if (placeLine) {
                let placeName = placeLine[1][1];
                if (roomARR[0] != 0) {
                    placeName = option[1].text + ' : ' + placeName;
                }
                option[1].text = placeName;
                Actions.setRoomTxt(placeName);
            }
        }
        // OLD with roomSelect
        // const optionSelected = RoomSelect.HTMLE ? Array.from(RoomSelect.HTMLE.options).find(option => option.value === roomINT.toString()) : undefined;

        // if (optionSelected && !optionSelected.textContent) {
        //     optionSelected.textContent = optionSelected.innerHTML + '';
        // }
        // if (optionSelected && optionSelected.textContent.length < 5) {
        //     const placeLine = findInArr(miDb.lib, miDb.LOC_PLACES[0], miDb.LOC_PLACES[1], item => item[0] == 'L' + placeID); //Returns [key, val]
        //     if (placeLine) {
        //         let placeName = placeLine[1][1];
        //         if (roomARR[0] != 0) {
        //             placeName = optionSelected.textContent + ' : ' + placeName;
        //         }
        //         optionSelected.textContent = placeName;
        //     }
        // }
    }

    // Gestion des portes
    if (roomARR[0] != 0) {
        const doorIDs = room['R'];
        let arr = Game.getRoomDoors(roomINT);
        for (let index = 0; index < arr.length; index++) {
            const doorKey = arr[index];
            let doorID = doorIDs ? doorIDs[doorKey] : undefined;
            if (doorID && !Game.db['R' + doorID]['opened']) {
                Game.actualItems.push('R' + doorID);
                if (Math.abs(doorKey) > 5) { // +10/-10
                    canvasObj.drawImage(50 + 4 * doorKey, 50 / 1.2, 20, 40 / 1.2, 'R' + doorID);
                } else { // +1/-1
                    canvasObj.drawImage(50, (50 + 40 * doorKey) / 1.2, 40, 20 / 1.2, 'R' + doorID);
                }
            } else {
                if (Math.abs(doorKey) > 5) {
                    canvasObj.drawArrow(50 + 3 * doorKey, 50 / 1.2, 15, 10 / 1.2, doorKey > 0 ? 'right' : 'left');
                } else {
                    canvasObj.drawArrow(50, (50 + 40 * doorKey) / 1.2, 10, 15 / 1.2, doorKey > 0 ? 'down' : 'up');
                }
                const nextRoom = (parseInt(roomINT) + doorKey).toString();
                // if (RoomSelect.HTMLE && !Array.from(RoomSelect.HTMLE.options).some(option => option.value === nextRoom)) {
                //     const option = document.createElement("option");
                //     option.value = nextRoom;
                //     option.textContent = RoomSelect.roomIntToID(nextRoom);
                //     RoomSelect.HTMLE.appendChild(option);
                // }
                //Update changeRoom
                const option = findInArr(Game.unlockedPlaces, 0, undefined, option => option.id === nextRoom);
                if (!option[1]) {
                    Game.unlockedPlaces.push({ id: nextRoom, text: Actions.roomStrToID(nextRoom.toString()) });
                }
            }
        }
    }

    // Draw character (perso)
    if (place) {
        let persoID = place['P'];
        if (persoID && !Game.db['P' + persoID].isHidden) {
            Game.actualItems.push('P' + persoID);
            canvasObj.drawRect(20, 80 / 1.2, 41, 41 / 1.2, 'white', 'black');
            canvasObj.drawImage(20, 80 / 1.2, 39, 39 / 1.2, 'P' + persoID);
        }
    }

    Loading.setTitle('Chargement des images...');


    // Fin du chargement
    console.log('End SR');
    // if (pageMode != 'loadinggame') {
    //     return;
    // }
    let noCoTimer = Date.now();
    wait(() => {
        Loading.setProgressBar(50 + (CanvasLib.numImgsPrinted / CanvasLib.numImgsToPrint) * 50);
        return CanvasLib.numImgsPrinted >= CanvasLib.numImgsToPrint || Date.now() - noCoTimer > 7000;
    }).then(() => {
        if (Date.now() - noCoTimer > 7000) {
            alert('Certaines images n\'ont pas pu être chargées.\nVeuillez vérifier votre connexion internet.');
        }
        Loading.setProgressBar(99);
        console.log('End LG => changeMode');
        Loading.changeMode(2);
        Loading.setPlayerTitle();
    });
}












console.log('Main:init...');
var devFast = false;
document.addEventListener("DOMContentLoaded", function () {
    console.log('Doc loaded');
    initMain();
});


MainJSLoaded = true;