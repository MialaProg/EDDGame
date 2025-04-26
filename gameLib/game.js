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
]
// doors
var doors = {
    10: [1, 10], 11: [1], 12: [1], 13: [1, 10], 14: [1], 15: [10],
    20: [10], 21: [10], 22: [10], 23: [1], 24: [], 25: [10],
    30: [1], 31: [1], 32: [1], 33: [1], 34: [1], 35: []
}


// actualGame = {place: [objects]}
var actualGame = {}
// For trace edit when generate
var editGen = [];
var toBeAdded, db, boardGenerated, startRoom, alphabet;
var PLACES_LOC, DOORS_LOC, PERSO_LOC, OBJ_LOC;//Not implemented everywhere yet
var actualRoom, imgToLoad, imgLoaded;

var GameConst = 0;
var GameConstMax = 1;

var _canvasID = 'room-canvas';

function CanvasLibLoaded() {
    try {
        return canvasLibLoaded;
    } catch (e) {
        return;
    }
}

function GameConstInitied() {
    return GameConst >= GameConstMax;
}

function log(...arguments) {
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
 */
function setDb(idx, val) {
    eval(`
        editGen.push(['${idx}', JSON.stringify(db${idx})]);
        if (Array.isArray(db${idx})) {
            db${idx}.push('${val}');
        } else {
            db${idx} = '${val}';
        }
    `);
}

function restoreDb(toLen) {
    for (let i = editGen.length; i > toLen; i--) {
        const e = editGen[i - 1];
        eval(`
            db${e[0]} = JSON.parse('${e[1]}');
        `);
        editGen.pop();
    }
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
    while (!result && usable.length > 0) {
        if (restore) { restoreDb(initLen); }
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

//  Resolve objects required for a system
function resolveObjects(objectsRequired) {
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
            let object = resolveObjects(perso[3].split(","));
            if (!object) {
                return;
            }

            // Save and return
            let idx = getIndex(perso, db, 50, 70);
            setDb(`[${idx}]`, '1');
            return true;
        });
        if (perso) {

            toBeAdded.push(perso);
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
                let object = resolveObjects(loc[3].split(","));
                if (!object) {
                    return;
                }

                // Save and return
                let idx = getIndex(loc, db, 0, 60);
                setDb(`[${idx}]`, '1');
                return true;
            });
            if (!loc) {
                return;
            }
            toBeAdded.push(loc);
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
        // // ### Check if places avaible
        // let placesRequired = cacheDoor[5].split(",");
        // // ## Check if actual place is compatible with the door
        // if (roomITM['L']) {
        //     return placesRequired.includes(roomITM['L'].toString());
        // }
        // // ## Else, check if one place required is available
        // let place = getARandomItem(placesRequired, (placeID) => {
        //     let cachePlace = findInArr(db, 15, 60, item => item[0] == 'L' && item[1] == placeID);
        //     if (!cachePlace) {
        //         return;
        //     }
        //     // ### Check if place already used
        //     if (cachePlace[6]) {
        //         return;
        //     }
        //     return true;
        // });
        // if (!place) {
        //     return;
        // }
        // ### Check for objects required
        let object = resolveObjects(cacheDoor[3].split(","));
        if (!object) {
            return;
        }

        // Save and return
        setDb(`[${idx}]`, 1);
        return true;
    });
    return door;
}

function addItemsToRoom(type) {
    let minRoom = placesPriority.length - 1;
    let minChange = true;
    let roomSelected = undefined;

    let allRooms = [...placesPriority];
    const lenStandartPlaces = places[0].length;
    for (let i = 0; i < lenStandartPlaces; i++) {
        allRooms.push([0, i]);
    }
    let asBeenAdded = [];

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
        let my_room = getARandomItem(roomSelected, (roomARR) => {
            let room = places[roomARR[0]][roomARR[1]];
            if (!room) {
                room = {};
            }
            // Vérification que la place est libre pour l'élément
            if (room[element[0]]) {
                return;
            }

            room[element[0]] = element[1];
            places[roomARR[0]][roomARR[1]] = room;
            // Ajout de l'élément à la liste des éléments ajoutés
            asBeenAdded.push(element);
            return true;
        }, false);
        // log('Added to', my_room, ':[' + i + ']', element);
    }
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
        addItemsToRoom('L');
        setProgressBar(80);
        addItemsToRoom('P');
        setProgressBar(90);
        boardGenerated = true;
        log("Board generated !")
    });
}


// SCREENS CONTROL
function changeMode(mode) {
    document.getElementById("pregame-interface").classList.add("is-hidden");
    document.getElementById("loadinggame-interface").classList.add("is-hidden");
    document.getElementById("ingame-interface").classList.add("is-hidden");

    document.getElementById(mode + "-interface").classList.remove("is-hidden");
    actualMode = mode;
}

// IN-GAME CODE


async function launch_game() {
    changeMode("loadinggame");
    setBg('room-canvas', 'black');
    await generate_board();
    waitUntil(() => startRoom, () => {
        changeMode("ingame");
        showRoom(startRoom);
    });
}

// STARTING GAME CODE

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


function showRoom(roomARR) {
    if (!CanvasLibLoaded()) {
        console.error('Try showRoom without canvasLibLoaded');
        waitUntil(() => CanvasLibLoaded(), () => {
            showRoom(roomARR);
        });
    }
    actualRoom = roomARR;
    imgToLoad = 0;
    imgLoaded = 0;
    if (actualMode == 'ingame') {
        setProgressBar(0);
        changeMode("loadinggame");
    }
    let room = places[roomARR[0]][roomARR[1]];
    if (!room) {
        console.error("Room not found.");
        return;
    }
    setBg('room-canvas', 'white');
    let placeID = room['L'];
    if (placeID) {
        drawImage('L' + placeID, 20, 20, 40, 40);
    }
    let persoID = room['P'];
    if (persoID) {
        drawImage('P' + persoID, 0, 70, 40, 30);
        drawRect(_canvasID, 0, 70, 40, 30, undefined, 'black', 5);
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
            if (doorID) {
                if (Math.abs(doorKey) > 5) {
                    drawImage('R' + doorID, 40 + 4 * doorKey, 20, 20, 40);
                } else {
                    drawImage('R' + doorID, 40, 40 + 40 * doorKey, 40, 20);
                }
            } else {
                if (Math.abs(doorKey) > 5) {
                    drawArrow(_canvasID, 40 + 4 * doorKey, 50, 10, 10, doorKey > 0 ? 'right' : 'left');
                } else {
                    drawArrow(_canvasID, 50, 40 + 40 * doorKey, 10, 10, doorKey > 0 ? 'down' : 'up');
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
    if (optionSelected && !optionSelected.textContent){
        optionSelected.textContent = optionSelected.innerHTML + '';
        log('Txt content:' + optionSelected.textContent);
     }
    if (optionSelected && placeID && optionSelected.textContent.length < 5){
        consoncopyine = findInArr(db, PLACES_LOC[0], PLACES_LOC[1], item => item[0] == 'L' && item[1] == placeID);
        if (placeLine){
            
            let placeName = placeLine[2];
            log('Place:L' +placeName);
            if (roomARR[0] != 0){
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
            changeMode("ingame");
        }
    );
}


function set_player_form_submit() {
    document.getElementById("player-form").addEventListener("submit", function (e) {
        e.preventDefault();

        let nb_player = players.indexOf("none");

        if (!nb_player) {
            alert("Cela risque d'etre compliqué sans joueurs...");
            return
        }
        if (nb_player == -1) {
            nb_player = players.length;
        }

        if (!confirm("Démarre la partie à " + (nb_player) + " joueurs ?")) {
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
            let currentRoom_HTML = '';
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
                    roomSelect.value = starting_room;
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
    }
    log("GameConst initied");
}
initGameConst();

function initSelectRoom() {
    let roomSelect = document.getElementById("current-room");
    roomSelect.addEventListener("change", function () {
        showRoom(this.value.split(";").map(Number));
    });
}


function updateCanvasSize() {
    const canvas = document.getElementById("room-canvas");
    const container = document.querySelector(".canvas-container");

    // Calcul dynamique de la taille
    const maxWidth = window.innerWidth;
    const maxHeight = window.innerHeight * .9;
    const size = Math.min(maxWidth, maxHeight);

    // Applique les dimensions au conteneur
    container.style.width = `${size}px`;
    container.style.height = `${size}px`;

    // Met à jour les attributs du canvas avec haute résolution
    const scale = window.devicePixelRatio || 1; // Gestion de la rétine
    canvas.width = size;//* scale;
    canvas.height = size;//* scale;

    // Ajuste le contexte pour le scaling
    const ctx = canvas.getContext("2d");
    /*ctx.scale(scale, scale);*/

    // Configuration de la qualité d'image
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    try { showRoom(actualRoom); } catch (e) { }
}

// Initialisation
window.addEventListener("load", updateCanvasSize);
window.addEventListener("resize", updateCanvasSize);

// BUTTONS FUNCTIONS
function useButton(){

}

function speakButton(){

}