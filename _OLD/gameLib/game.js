//Initialisation des variables globales
var InGame = false;
var ConsoleLog = true;
var actualMode = 'pregame';

var players = new Array(5)
// places = [[85, 86, 87, 88, ... 97], [undef * 6] * 3]
var places = [
    Array.from({ length: 13 }, (_, i) => ({ 'L': 85 + i })), // Row 1: 85 to 97
    Array(6).fill().map(() => ({})),    // Row 2: unique objects
    Array(6).fill().map(() => ({})),    // Row 3: unique objects
    Array(6).fill().map(() => ({}))     // Row 4: unique objects
];
// Priority order of places [,]
var placesPriority = [
    [3, 0],
    [2, 0], [2, 1],
    [1, 0], [3, 1], [2, 2],
    [1, 1], [3, 2],
    [1, 2], [3, 3],
    [2, 4], [3, 4],
    [3, 5], [2, 5], [1, 5],
    [2, 3], [1, 4],
    [1, 3]
];
// doors
var doors = {
    10: [1, 10], 11: [1], 12: [1], 13: [1, 10], 14: [1], 15: [10],
    20: [10], 21: [10], 22: [10], 23: [1], 24: [], 25: [10],
    30: [1], 31: [1], 32: [1], 33: [1], 34: [1], 35: []
};


// actualGame = {place: [objects]}
var actualGame = {}
// For trace edit when generate
var editGen = [];
var toBeAdded, db, boardGenerated, startRoom, alphabet, nbPlayers;
var PLACES_LOC, DOORS_LOC, PERSO_LOC, OBJ_LOC, LOADING_LOC;//Not implemented everywhere yet
var actualRoom, actualItems, actualPlayer;
var canvasObj, miBasicObj, discObj;

var [nbActions, nbTours] = [0, 0];

var GameConst = 0;
var GameConstMax = 1;

var _canvasID = 'room-canvas';

// ItemID => {REQ => GIVE, ..., 'unlocked'=?, 'used'=?}
var myItemsHistory = [];
var myItems = {};

var logs = [];

var UNIQUEID = Math.floor(Date.now() / (10000)) - 174612000;
function getUniqueID() {
    UNIQUEID += 1;
    return UNIQUEID;
}

function libLoaded(libname) {
    try {
        return eval(libname + 'Loaded');
    } catch (e) {
        return;
    }
}

function CanvasLibLoaded() {
    return libLoaded('canvasLib');
}

function GameConstInitied() {
    return GameConst >= GameConstMax;
}

function log(...arguments) {
    logs.push(...arguments);
    if (!arguments[0]) {
        return;
    }
    if (ConsoleLog) {
        console.log(...arguments);
    }
}

/**
 * Detect duplicates from an array
 * @param {array} Array 
 * @returns {bool}
 */
function hasDuplicates(arr) {
    return arr.some((item, index) => arr.indexOf(item) !== index);
}

function randint(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}



/**
 * Chooses a random element from an array without repeating previous choices
 * @param {array} arr - The array to choose from
 * @param {array} previousChoices - The array of previously chosen elements
 * @returns {any} - The chosen element
 */
function chooseRandomUnique(arr, previousChoices) {
    let filteredArr = arr.filter(item => !previousChoices.includes(item));
    if (filteredArr.length === 0) {
        throw new Error("No unique elements left to choose from.");
    }
    let randomIndex = Math.floor(Math.random() * filteredArr.length);
    let chosenElement = filteredArr[randomIndex];
    previousChoices.push(chosenElement);
    return chosenElement;
}

/**
 * Chooses a random element from an array without repeating previous choices
 * @param {array} arr - The copy of array to choose from
 * @returns {any} - The chosen element
 */
function ranAndDel(arr) {
    let randomIndex = randint(0, arr.length - 1);
    let chosenElement = arr[randomIndex];
    arr.splice(randomIndex, 1); // Change arr even outside the func
    return chosenElement;
}




async function getDb(path) {
    let data;
    await fetch(path)
        .then(response => response.text())
        .then(dt => {
            data = dt;
            // db = data.trim().split("\n").map(row => row.split(";"));
        })
        .catch(error => {
            console.error("Error fetching and parsing data:", error);
        });
    return data;
}
getDb("gameData/items.miDb").then(data => {
    db = data.trim().split("\n").map(row => row.split(";"));
});


/**
 * Set and save change
 * @param {string} idx 
 * @param {string} val 
 * @param {string} arr 
 * @param {string} history 
 */
function setArr(idx, val, arr, history) {
    if (!history) {
        history = arr + 'History';
    }
    log(false, idx, val, arr, history);
    eval(`
        ${history}.push(["${idx}", JSON.stringify(${arr}${idx})]);
        if (Array.isArray(${arr}${idx})) {
            ${arr}${idx}.push(${val});
        } else {
            ${arr}${idx} = ${val};
        }
    `);
}

function restoreArr(toLen, arr, history) {
    if (!history) {
        history = arr + 'History';
    }
    // log(toLen);
    for (let i = eval(history).length; i > toLen; i--) {
        const e = eval(history)[i - 1];
        log('Restore: ', e);
        eval(`
            ${arr}${e[0]} = JSON.parse("${e[1]}");
        `);
        eval(history).pop();
    }
}

function setMyItems(ItemID, Prop, val) {
    if (!myItems[ItemID]) {
        setArr(`['${ItemID}']`, '{}', 'myItems');
    }
    setArr(`['${ItemID}']['${Prop}']`, `"${val}"`, 'myItems');
}

function setDb(idx, val) {
    setArr(idx, `"${val}"`, 'db', 'editGen');
    // eval(`
    //     editGen.push(['${idx}', JSON.stringify(db${idx})]);
    //     if (Array.isArray(db${idx})) {
    //         db${idx}.push('${val}');
    //     } else {
    //         db${idx} = '${val}';
    //     }
    // `);
}

function restoreDb(toLen) {
    restoreArr(toLen, 'db', 'editGen');
    // for (let i = editGen.length; i > toLen; i--) {
    //     const e = editGen[i - 1];
    //     eval(`
    //         db${e[0]} = JSON.parse('${e[1]}');
    //     `);
    //     editGen.pop();
    // }
}

/**
 * Wait until the condition is true, then execute the callback
 * @param {*} condition 
 * @param {*} callback 
 */
function waitUntil(condition, callback) {
    const interval = setInterval(() => {
        if (condition()) {
            clearInterval(interval);
            callback();
        }
    }, 100); // Check every 100 milliseconds
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
function wait(condition, interval = 100, timeout = 10000) {
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

// RL: Before = complete

function searchInMyItems(obj, value) {
    let entry = Object.entries(myItems[obj]).find(([key, val]) => val === value);
    if (!entry) {
        return [undef, undef];
    }
    return entry;
}

function intToRoom(num) {
    num = num.toString();
    if (num.length < 2) {
        num = '0' + num;
    }
    if (num.length > 2) {
        throw new Error("Number must be two digits.");
    }
    return [parseInt(num[0]), parseInt(num[1])];
}

function roomToInt(arr) {
    if (arr.length !== 2) {
        throw new Error("Array must have exactly two elements.");
    }
    return parseInt(arr[0].toString() + arr[1].toString());
}

function getDoors(roomNum) {
    let roomDoors = [...doors[roomNum]];
    for (let i = 1; i < 11; i += 9) {
        if (doors[roomNum - i] && doors[roomNum - i].includes(i)) {
            roomDoors.push(-i);
        }
    }
    return roomDoors;
}


/**
 * Set in places the door of the room to val
 */
function setDoor(door, roomARR, val) {
    let room = places[roomARR[0]][roomARR[1]];
    if (!room) { room = {}; }
    if (!room['R']) { room['R'] = {}; }
    room['R'][door] = val;
    places[roomARR[0]][roomARR[1]] = room;
}

/**
 * Find something in a part of an array
 * @param {*} arr 
 * @param {*} min 
 * @param {*} max 
 * @param {*} condition
 */
function findInArr(arr, min = 0, max = undefined, condition) {
    if (max === undefined) {
        max = arr.length - 1;
    }
    let i = min;
    while (i <= max) {
        if (condition(arr[i])) {
            return [i, arr[i]];
        }
        i++;
    }
    return [-1, undefined];
}

function getIndex(item, arr, min = 0, max = undefined) {
    let [idx, obj] = findInArr(arr, min, max, e => e === item);
    return idx;
}

function getARandomItem(arr, conditions, restore = true) {
    let usable = [...arr];
    let result = undefined;
    const initLen = editGen.length;
    const initMyItMLen = myItemsHistory.length;
    while (!result && usable.length > 0) {
        if (restore) {
            restoreDb(initLen);
            restoreArr(initMyItMLen, 'myItems');
        }
        let item = ranAndDel(usable);
        if (conditions(item)) {
            result = item;
        }
    }
    return result;
}


// PROGRESS BAR
var progressInterval, progress;
function setProgressBar(val) {
    if (!progress) {
        return;
    }
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    if (val == 0) {
        progress.value = 0;
    }
    let currentVal = progress.value;
    let step = (val - currentVal) / 50; // Adjust the number of steps as needed
    progressInterval = setInterval(() => {
        currentVal += step;
        progress.value = currentVal;
        progress.innerHTML = Math.round(currentVal) + "%";
        if ((step > 0 && currentVal >= val) || (step < 0 && currentVal <= val)) {
            clearInterval(progressInterval);
            progress.value = val;
            progress.innerHTML = val + "%";
        }
    }, 40); // Adjust the interval time as needed
}
document.addEventListener("DOMContentLoaded", function () {
    progress = document.getElementById("progress-bar");
    if (progress) {
        setProgressBar(0);
    } else {
        console.error("Progress bar element not found.");
    }
});

// BOARD GENERATION CODE

// Resolve where persos have to be.
function resolvePlace(placesRequired, _for) {
    return getARandomItem(placesRequired, (placeID) => {
        let placeIDL = 'L' + placeID;
        if (myItems[placeIDL][_for[0]]) {
            return;
        }
        toBeAdded.push(findInArr(db, PLACES_LOC[0], PLACES_LOC[1], (itm) => itm[0] + itm[1] == placeIDL)[1]);
        setMyItems(placeIDL, _for[0], _for.slice(1));
        return true;
    });
}

//  Resolve objects required for a system
function resolveObjects(objectsRequired, _for = '0') {
    let toBeAddedLen = toBeAdded.length;
    return getARandomItem(objectsRequired, (objectID) => {
        if (toBeAddedLen !== toBeAdded.length) {
            log('toBeAdded: ', toBeAdded);
            toBeAdded = toBeAdded.slice(0, toBeAddedLen);
        }
        // Check if no object is required 
        if (objectID == '0') {
            return true;
        }

        // Check if object already used  
        let [idx, cacheObject] = findInArr(db, 60, undefined, item => item[0] == 'O' && item[1] == objectID);

        if (objectID != '21' && cacheObject[3]) {
            return;
        }

        let perso = getARandomItem(db.slice(50, 70), (perso) => {
            // Check if it is a perso
            if (perso[0] != 'P') {
                return;
            }
            // Check if it is already used
            // if (perso[6]) {
            //     return;
            // }
            // Check if he give the object
            if (!perso[4].split(',').includes(objectID)) {
                return;
            }
            // Check objects required
            let object = resolveObjects(perso[3].split(","), 'P' + perso[1]);
            if (!object) {
                return;
            }

            // Check places required
            let plr = perso[5].split(',');
            if (plr[0] == '*') plr = Array.from({ length: 18 }, (_, i) => i + 1).concat(Array.from({ length: 15 }, (_, i) => i + 85));
            if (!resolvePlace(plr, 'P' + perso[1])) return;

            // Save and return
            let idx = getIndex(perso, db, 50, 70);

            // For multiple 0
            if (object == '0') {
                object += getUniqueID();
            } else {
                object = 'O' + object;
            }

            setMyItems('P' + perso[1], object, 'O' + objectID);
            setDb(`[${idx}]`, '1');
            return true;
        });
        if (perso) {

            toBeAdded.push(perso);
            setMyItems('O' + objectID, 'P' + perso[1], _for);
        } else {
            // Check for location
            let loc = getARandomItem(db.slice(0, 60), (loc) => {
                // Check if it is a loc
                if (loc[0] != 'L') {
                    return;
                }
                // Check if it is already used
                // if (loc[6]) {
                //     return;
                // }
                // Check if he give the object
                if (!loc[4] || !loc[4].split(',').includes(objectID)) {
                    return;
                }
                // Check objects required
                let object = resolveObjects(loc[3].split(","), 'L' + loc[1]);
                if (!object) {
                    return;
                }

                // Save and return
                let idx = getIndex(loc, db, 0, 60);

                // For multiple 0
                if (object == '0') {
                    object += getUniqueID();
                } else {
                    object = 'O' + object;
                }

                setMyItems('L' + loc[1], object, 'O' + objectID);
                setDb(`[${idx}]`, '1');
                return true;
            });
            if (!loc) {
                return;
            }
            toBeAdded.push(loc);
            setMyItems('O' + objectID, 'L' + loc[1], _for);
        }

        // Save and return

        setDb(`[${idx}]`, 1);
        return true;
    });
}

function ranDoor(roomITM) {
    let allDoors = Array.from({ length: 18 }, (_, i) => i + 1);
    let toBeAddedLen = toBeAdded.length;
    let door = getARandomItem(allDoors, (doorID) => {
        if (toBeAddedLen !== toBeAdded.length) {
            toBeAdded = toBeAdded.slice(0, toBeAddedLen);
        }
        let [idx, cacheDoor] = findInArr(db, 0, 30, item => item[0] == 'R' && item[1] == doorID);
        if (!cacheDoor) {
            return;
        }
        // ### Check if door already used
        if (cacheDoor[6]) {
            return;
        }

        // ### Check if places avaible


        // let placesRequired = cacheDoor[5].split(",");
        // ## Check if actual place is compatible with the door
        if (roomITM['L']) {
            if (!placesRequired.includes(roomITM['L'].toString())) return;
        } else {
            let place = resolvePlace(cacheDoor[5].split(','), 'R' + cacheDoor[1]);
            if (!place) return;
            roomITM['L'] = place;
        }

        // ### Check for objects required
        let objectID = resolveObjects(cacheDoor[3].split(","), 'R' + doorID);
        if (!objectID) {
            return;
        }

        // Save and return
        setMyItems('R' + doorID, 'O' + objectID, 'OPEN');
        setDb(`[${idx}]`, 1);
        return true;
    });
    return door;
}

// function initAsBeenAdded(){
//     let asBeenAdded = [];
//     places.forEach((placesRow) => {
//         placesRow.forEach((place) => {
//             Object.keys(place).forEach((key) => {
//                 if (place['L']){
//                     asBeenAdded.push(db.find(item => item[0] + item[1] == place['L']));
//                 }
//                 if (place['L']){
//                     asBeenAdded.push(db.find(item => item[0] + item[1] == place['L']));
//                 }
//             });
//         });
//     });
// }

/*
function addItemsToRoom(type) {
    let minRoom = placesPriority.length - 1;
    let minChange = true;
    let roomSelected = undefined;

    let allRooms = [...placesPriority];
    const lenStandartPlaces = places[0].length;
    for (let i = 0; i < lenStandartPlaces; i++) {
        allRooms.push([0, i]);
    }
    let asBeenAdded = [db.find(item => item[0] == 'L' && item[1] == '92')]; //Bugfix: #2

    for (let i = toBeAdded.length - 1; i > 0; i--) {
        let element = toBeAdded[i];
        if (typeof element === 'number') {
            minRoom = element;
            minChange = true;
            continue;
        }
        if (element[0] !== type) {
            continue;
        }
        if (asBeenAdded.includes(element)) {
            continue;
        }
        if (minChange) {
            roomSelected = allRooms.slice(minRoom);
            minChange = false;
        }
        getARandomItem(roomSelected, (roomARR) => {
            let room = places[roomARR[0]][roomARR[1]];
            if (!room) {
                room = {};
            }
            // Vérification que la place est libre pour l'élément
            if (room[element[0]]) {
                return;
            }

            room[type] = element[1];
            places[roomARR[0]][roomARR[1]] = room;
            // Ajout de l'élément à la liste des éléments ajoutés
            asBeenAdded.push(element);
            return true;
        }, false);
        // log('Added to', my_room, ':[' + i + ']', element);
    }
}*/

function addPlacesToRoom() {
    let minRoom = placesPriority.length - 1;
    let minChange = true;
    let roomSelected = undefined;

    let allRooms = [...placesPriority];
    const lenStandartPlaces = places[0].length;
    for (let i = 0; i < lenStandartPlaces; i++) {
        allRooms.push([0, i]);
    }

    let asBeenAdded = [];
    places.forEach((row) => {
        row.forEach((place) => {
            if (place['L']) asBeenAdded.push(place['L']);
        })
    })

    for (let i = toBeAdded.length - 1; i > 0; i--) {
        let element = toBeAdded[i];
        if (typeof element === 'number') {
            minRoom = element;
            minChange = true;
            continue;
        }
        if (element[0] !== 'L') {
            continue;
        }
        if (asBeenAdded.includes(element[1])) {
            continue;
        }
        if (minChange) {
            roomSelected = allRooms.slice(minRoom);
            minChange = false;
        }
        getARandomItem(roomSelected, (roomARR) => {
            let room = places[roomARR[0]][roomARR[1]];
            if (!room) {
                room = {};
            }
            // Vérification que la place est libre pour l'élément
            if (room['L']) {
                return;
            }

            room['L'] = element[1];
            places[roomARR[0]][roomARR[1]] = room;
            // Ajout de l'élément à la liste des éléments ajoutés
            asBeenAdded.push(element[1]);
            return true;
        }, false);
        // log('Added to', my_room, ':[' + i + ']', element);
    }
}

function addCharsToRoom(){
    places.forEach((row) => {
        row.forEach((place) => {
            if (place['L'] && myItems['L'+place['L']] && myItems['L'+place['L']]['P']){
                place['P'] == myItems['L'+place['L']]['P'];
            };
        })
    })
}


async function generate_board() {
    toBeAdded = [];
    places[3][0] = { 'L': 99 }; //,  ?
    setProgressBar(10);
    waitUntil(() => db != undefined && GameConstInitied(), () => {
        for (let i = 0; i < placesPriority.length; i++) {
            setProgressBar(10 + (i / placesPriority.length) * 50);
            toBeAdded.push(i);
            let placeARR = placesPriority[i];
            let placeINT = roomToInt(placeARR);
            let place = places[placeARR[0]][placeARR[1]];
            let placeDoor = getDoors(placeINT);
            if (!placeDoor) {
                continue;
            }
            for (let y = 0; y < placeDoor.length; y++) {
                const doorTo = placeDoor[y]; //INT
                if (!randint(0, 3)) {
                    // log(`Door ${doorTo} for ${placeINT} : ignored`);
                    continue;
                }
                try {
                    if (place['R'][doorTo] != undefined) {
                        continue;
                    }
                } catch (error) { }
                let randomDoor = ranDoor();
                // log(`Door ${doorTo} for ${placeINT} : ${randomDoor}`);
                if (randomDoor) {
                    setDoor(doorTo, placeARR, randomDoor);
                    setDoor(-doorTo, intToRoom(placeINT + doorTo), randomDoor);
                }
            }
        }
        setProgressBar(70);
        addPlacesToRoom();
        setProgressBar(80);
        addCharsToRoom();
        setProgressBar(90);
        boardGenerated = true;
        log("Board generated !")
    });
}


// SCREENS CONTROL
function scrollPage(from, to, callback) {
    const duration = 500;
    const distance = to - from;
    let startTime = null;

    function animation(currentTime) {
        if (startTime === null) {
            startTime = currentTime;
        }
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        const ease = easeInOutQuad(progress);
        window.scrollTo(0, from + distance * ease);

        if (timeElapsed < duration) {
            requestAnimationFrame(animation);
        } else if (callback) {
            callback(); // Appel du callback à la fin
        }
    }

    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    requestAnimationFrame(animation);
}

function changeMode(mode) {
    document.getElementById("pregame-interface").classList.add("is-hidden");
    document.getElementById("loadinggame-interface").classList.add("is-hidden");
    // document.getElementById("ingame-interface").classList.add("is-hidden");

    document.getElementById(mode + "-interface").classList.remove("is-hidden");
    actualMode = mode;
}

// IN-GAME CODE


async function launch_game() {
    changeMode("loadinggame");
    await generate_board();
    waitUntil(() => startRoom, () => {
        changeMode("ingame");
        showRoom(startRoom);
    });
}


function showRoom(roomARR) {
    if (!canvasObj) {
        console.error('Try showRoom without canvasObj');
        waitUntil(() => { return canvasObj; }, () => {
            showRoom(roomARR);
        });
    }
    actualRoom = roomARR;
    actualItems = []
    imgToLoad = 0;
    imgLoaded = 0;
    if (actualMode == 'ingame') {
        setProgressBar(0);
        changeMode("loadinggame");
        scrollPage(canvasObj.canvas.offsetTop, 0);
    }
    let room = places[roomARR[0]][roomARR[1]];
    if (!room) {
        console.error("Room not found.");
        return;
    }
    canvasObj.setBackground();
    let placeID = room['L'];
    if (placeID) {
        actualItems.push('L' + placeID);
        canvasObj.drawImage(40, 40, 40, 40, 'L' + placeID);
    }
    let persoID = room['P'];
    if (persoID) {
        actualItems.push('P' + persoID);
        canvasObj.drawImage(20, 85, 39, 29, 'P' + persoID);
        canvasObj.drawRect(20, 85, 41, 31, undefined, 'black');
    }

    const roomSelect = document.getElementById("current-room");
    // Gestion des portes
    if (roomARR[0] != 0) {
        let doorIDs = room['R'];
        let roomINT = roomToInt(roomARR);
        let arr = getDoors(roomINT);
        for (let index = 0; index < arr.length; index++) {
            const doorKey = arr[index];
            let doorID = doorIDs ? doorIDs[doorKey] : undefined;
            if (doorID && !myItems['R' + doorID]['opened']) {
                actualItems.push('R' + doorID);
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
                const nextRoom = (roomINT + doorKey).toString();
                // const roomSelect = document.getElementById("current-room");
                const [x, y] = [parseInt(nextRoom[0]), parseInt(nextRoom[1])];
                const optionValue = `${x};${y}`;
                if (!Array.from(roomSelect.options).some(option => option.value === optionValue)) {
                    const option = document.createElement("option");
                    option.value = optionValue;
                    option.textContent = `${alphabet[x - 1]}${y + 1}`;
                    roomSelect.appendChild(option);
                }
            }
        }
    }

    // Rename the option
    const optionSelected = Array.from(roomSelect.options).find(option => option.value === `${roomARR[0]};${roomARR[1]}`);
    log('Option selected: ', optionSelected);
    if (optionSelected && !optionSelected.textContent) {
        optionSelected.textContent = optionSelected.innerHTML + '';
        log('Txt content:' + optionSelected.textContent);
    }
    if (optionSelected && placeID && optionSelected.textContent.length < 5) {
        const placeLine = findInArr(db, PLACES_LOC[0], PLACES_LOC[1], item => item[0] == 'L' && item[1] == placeID); //Returns [key, val]
        if (placeLine) {
            let placeName = placeLine[1][2];
            log('Place:L' + placeName);
            if (roomARR[0] != 0) {
                placeName = optionSelected.textContent + ' : ' + placeName;
            }
            optionSelected.textContent = placeName;
        }
    }

    // Fin du chargement
    if (actualMode != 'loadinggame') {
        return;
    }
    waitUntil(
        () => {
            setProgressBar(progress.value + (90 - progress.value) / 2);
            return imgLoaded == imgToLoad;
        },
        () => {
            scrollPage(0, canvasObj.canvas.offsetTop, () => changeMode("ingame"));
        }
    );
}

// STARTING PREGAME CODE

/**Set array <players> values to actual select values.
 * If there is a duplicate, set select value to none.
*/
function init_players_values() {
    let selects = document.querySelectorAll("select.player-select");
    selects.forEach(function (select) {
        let selectID = select.id[select.id.length - 1];
        players[selectID - 1] = select.value
        if (hasDuplicates(players)) {
            players[selectID - 1] = select.value = "none";
        }
    });
}

/**
 * Initialise les actions lors des mises à jour des select
 */
function init_select_onclick() {
    // Sélectionne tous les éléments <select> sur la page
    let selects = document.querySelectorAll("select.player-select");

    // Boucle à travers chaque <select> et définir l'événement change
    selects.forEach(function (select) {
        //Récupération de l'ID select
        let selectID = parseInt(select.id[6])
        let prev_select = document.getElementById('player' + (selectID - 1))


        select.onclick = function () {
            let options = select.querySelectorAll('option');

            options.forEach(function (option) {
                option.disabled = players.includes(option.value) || (prev_select && prev_select.value === "none");
            });
        }
        select.addEventListener("change", function () {
            log("Option selected: " + this.value);
            //Save value
            players[selectID - 1] = this.value
        });
    });
}




function set_player_form_submit() {
    document.getElementById("player-form").addEventListener("submit", function (e) {
        e.preventDefault();

        nbPlayers = players.indexOf("none");

        if (!nbPlayers) {
            alert("Cela risque d'etre compliqué sans joueurs...");
            return
        }
        if (nbPlayers == -1) {
            nbPlayers = players.length;
        }

        if (!confirm("Démarre la partie à " + (nbPlayers) + " joueurs ?")) {
            return;
        }

        InGame = true;
        log("Game start !");
        launch_game();
    });
}


document.addEventListener("DOMContentLoaded", function () {
    init_players_values();
    init_select_onclick();
    set_player_form_submit();
});

// Gestion des variables global venant de const.miDb
async function initGameConst() {
    let data = await getDb("gameData/const.miDb");
    if (!data) {
        console.error("Error fetching const data.");
        return;
    }
    data = data.trim().split("\n");
    for (let i = 0; i < data.length; i++) {
        const line = data[i];
        if (line.includes("#ROOMS")) {
            let currentRoom_HTML = '<option value="OFF">Destinations possibles:</option>';
            i += 1;
            let r = data[i].split(";");
            for (let j = 0; j < r.length; j++) {
                const element = r[j];
                currentRoom_HTML += `<option value="0;${j}">${element}</option>`;
            }
            i += 1;
            r = data[i].split(":");
            currentRoom_HTML += `<option value="${r[1][0]};${r[1][1]}">${r[0]}</option>`;
            i += 1;
            let starting_room = data[i];
            startRoom = starting_room.split(";").map(Number);
            waitUntil(() => document.readyState === "complete", () => {
                let roomSelect = document.getElementById("current-room");
                if (roomSelect) {
                    roomSelect.innerHTML = currentRoom_HTML;
                    roomSelect.value = 'OFF';
                    log('Starting room:', starting_room);
                    initSelectRoom();
                } else {
                    console.error("Room select element not found.");
                }
                GameConst += 1;
            });
            log("Rooms created !")
            continue;
        }
        if (line.includes("#ALPHABET")) {
            i += 1;
            alphabet = data[i].split(";");
        }
        // var PLACES_LOC, DOORS_LOC, PERSO_LOC, OBJ_LOC;
        if (line.includes("#PLACES_LOC")) {
            i += 1;
            PLACES_LOC = data[i].split(";").map(Number);
        }
        if (line.includes("#DOORS_LOC")) {
            i += 1;
            DOORS_LOC = data[i].split(";").map(Number);
        }
        if (line.includes("#PERSO_LOC")) {
            i += 1;
            PERSO_LOC = data[i].split(";").map(Number);
        }
        if (line.includes("#OBJ_LOC")) {
            i += 1;
            OBJ_LOC = data[i].split(";").map(Number);
        }
        if (line.includes("#LOADING_LOC")) {
            i += 1;
            LOADING_LOC = data[i].split(";").map(Number);
        }
    }
    log("GameConst initied");
}
initGameConst();

var isMouseOverRoomSelect;
function initSelectRoom() {
    let roomSelect = document.getElementById("current-room");
    roomSelect.addEventListener("change", function () {
        if (this.value != "OFF") {
            nbActions += 1;
            nbTours += 1;
            actualPlayer = players[(nbTours - 1) % nbPlayers];
            document.getElementById('loadingTitle').innerHTML = findInArr(db, LOADING_LOC[0], undefined, (item) => item[1] === actualPlayer)[1][2];
            showRoom(this.value.split(";").map(Number));
            wait(() => !isMouseOverRoomSelect, 200, 10 ** 9).then(() => { wait(() => isMouseOverRoomSelect, 200, 10 ** 9).then(() => roomSelect.value = "OFF") });
        }
    });

    roomSelect.addEventListener('mouseenter', () => {
        isMouseOverRoomSelect = true;
    });

    roomSelect.addEventListener('mouseleave', () => {
        isMouseOverRoomSelect = false;
    });
}


function updateCanvasSize() {
    const canvas = document.getElementById("room-canvas");
    const container = document.querySelector(".canvas-container");

    // Calcul dynamique de la taille
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight;
    // const size = Math.min(maxWidth, maxHeight);

    // Applique les dimensions au conteneur
    // container.style.width = `${size}px`;
    // container.style.height = `${size}px`;

    // Met à jour les attributs du canvas avec haute résolution
    // const scale = window.devicePixelRatio || 1; // Gestion de la rétine
    canvas.width = maxWidth;//* scale;
    canvas.height = maxHeight;//* scale;

    // Ajuste le contexte pour le scaling
    const ctx = canvas.getContext("2d");
    /*ctx.scale(scale, scale);*/

    // Configuration de la qualité d'image
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (actualRoom) {
        showRoom(actualRoom);
    }
}

// Initialisation
window.addEventListener("load", updateCanvasSize);
window.addEventListener("resize", updateCanvasSize);

waitUntil(
    () => CanvasLibLoaded(),
    () => {
        canvasObj = new CanvasLib(_canvasID);
        log("CanvasObj init");
    }
)

// miBasic LIBS
var chatAnsSelected;
getDb("gameData/txt.miBasic").then(data => {
    waitUntil(
        () => libLoaded('miBasicInterpreter') && libLoaded('disc'),
        async () => {
            miBasicObj = new miBasicInterpreter(data);
            miBasicObj.setFunc('open', (door) => {
                console.log('Open ' + door);
                myItems[door]['opened'] = true;
                showRoom(actualRoom);
            });
            miBasicObj.setFunc('get', (obj) => {
                console.log('Get ' + obj);
                if (!myItems[obj]['unlocked']) {
                    myItems[obj]['unlocked'] = 0;
                }
                myItems[obj]['unlocked'] += 1;
            });
            miBasicObj.setFunc('show', async (txt) => {
                console.log('Show ' + txt);
                chat.addMessage(txt);
                let time = Date.now();
                await wait(() => Date.now() - time > 500, 300);
            });
            miBasicObj.setFunc('choice', async (type, options) => {
                // Types: OBJ, REP, ON
                console.log('Choice ' + type, options);
                chat.clearAns();
                chatAnsSelected = false;
                for (let index = 0; index < options.length; index++) {
                    let option = options[index];
                    if (option[0] == '0') {
                        option[0] = "Je n'ai rien pour toi, pour l'instant...";
                    }
                    else if (type == 'OBJ') {
                        if (!myItems[option[0]]['unlocked'] || myItems[option[0]]['used']) {
                            continue;
                        }
                        option[0] = 'Utiliser: ' + findInArr(db, 0, undefined, item => item[0] + item[1] == option[0])[1][2];
                    }
                    else if (type == 'ON') {
                        // chat.addMessage('*Sur quoi souhaitez vous utiliser cet objet ?');
                        if (!actualItems.includes(option[0])) {
                            continue;
                        }
                        option[0] = 'Utiliser sur: ' + findInArr(db, 0, undefined, item => item[0] + item[1] == option[0])[1][2];
                    }
                    chat.createAnswer(option[0], (rep) => {
                        // miBasicObj.goTo();
                        chatAnsSelected = option[1];
                    });
                }
                const thisChat = chatID;
                await wait(() => chatAnsSelected || thisChat != chatID, undefined, 10 ** 7)
                if (thisChat == chatID) await miBasicObj.run(chatAnsSelected);
            });
            log("miBasicObj init");
            // chat.show();
            // await miBasicObj.run('PR8');
            // chat.createMessage('*Fin de la discussion...');

        }
    )
});


// BUTTONS FUNCTIONS
function addChoice(itemID, type = '') {
    let pos = miBasicObj.keywords[type + itemID];
    if (pos) {
        chatChoices.push({ id: pos, text: db.find(e => e[0] == itemID[0] && e[1] == itemID.substring(1))[2] });
        return true;
    }
    return;
}

function createChoice(itemID, spe, pre) {
    if (!(itemID.startsWith('R') || itemID.startsWith(spe))) {
        return;
    }

    if (!addChoice(itemID)) {
        addChoice(itemID, pre)
    }
}

function createChoices(spe, pre) {
    chat.clearConv();
    chatChoices = [];
    for (let i = 0; i < actualItems.length; i++) {
        createChoice(actualItems[i], spe, pre);
    }
    for (const key in myItems) {
        if (myItems[key]['unlocked'] && !myItems[key]['used']) {
            createChoice(key, spe, pre);
        }
    }
    populateChoices();
    chat.switch('choice');
    chat.show();
}

function useButton() {
    // let ItemsAvailable = actualItems.concat()
    createChoices('O', 'U');
}

function speakButton() {
    createChoices('P', 'P');
}

function searchButton() {
    log('Seaching..');
    chat.clearConv();
    chatChoices = [];
    try {
        let actualPlaceObjs = myItems[
            findInArr(actualItems, 0, undefined, item => item[0] == 'L')[1]
        ];
        if (actualPlaceObjs) {
            Object.keys(actualPlaceObjs).forEach((key) => {
                log('Find', key);
                if (key.startsWith('0')) {
                    let getID = actualPlaceObjs[key];
                    if ((getID == 'O21' || !myItems[getID]['unlocked'])) { // && !addChoice(getID) (Retiré car noisettes)
                        let txt = db.find(e => e[0] == getID[0] && e[1] == getID.substring(1))[2];
                        chatChoices.push({ id: 0, text: txt });
                        chat.addMessage(
                            '*Vous trouvez: ' + txt
                            + `<br><a onclick = "
                                if (!myItems['${getID}']['unlocked']) myItems['${getID}']['unlocked'] = 0;
                                myItems['${getID}']['unlocked'] += 1; this.remove();">Ramasser</a>`
                        );
                    };
                }
            });
        }
    } catch (e) {
        console.log('Location error for search:', e);
    }
    if (!chatChoices.length) {
        log('Nothing to see here');
        chat.switch('msg');
        chat.addMessage('*Vous ne trouvez rien.');
        chat.show();
    } else {
        log('Founded');
        populateChoices();
        chat.switch('choice');
        chat.show();
    }
}