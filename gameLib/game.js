//Initialisation des variables globales
var InGame = false;

var players = new Array(5)
// places = [[85, 86, 87, 88, ... 97], [undef * 6] * 3]
var places = [
    Array.from({ length: 13 }, (_, i) => 85 + i), // Row 1: 85 to 97
    Array(6).fill(undefined),                   // Row 2: undefined
    Array(6).fill(undefined),                   // Row 3: undefined
    Array(6).fill(undefined)                    // Row 4: undefined
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
var db = undefined;
var boardGenerated = false;
// For trace edit when generate
var editGen = [];
var toBeAdded = undefined;


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

/**
 * Set the background color of the canvas
 * @param {HTMLCanvasElement} canvas - The canvas element to set the background color for
 * @param {string} color - The color to set the background to (e.g., "red", "#ff0000")
 * @returns {void}
 */
function setBg(canvasId, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error("Canvas element not found.");
        return;
    }
    if (canvas.getContext) {
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        console.error("Canvas not supported in this browser.");
    }
}

function setProgress(id, val) {
    let progress = document.getElementById(id);
    if (progress) {
        progress.value = val;
    } else {
        console.error("Progress element not found.");
    }
}

async function getDb() {
    await fetch("gameData/items.miDb")
        .then(response => response.text())
        .then(data => {
            db = data.trim().split("\n").map(row => row.split(";"));
        })
        .catch(error => {
            console.error("Error fetching and parsing data:", error);
        });
}
getDb();

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
            roomDoors += [-i];
        }
    }
    return roomDoors;
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



// BOARD GENERATION CODE

//  Resolve objects required for a system
function resolveObjects(objectsRequired) {
    let toBeAddedLen = toBeAdded.length;
    return getARandomItem(objectsRequired, (objectID) => {
        if (toBeAddedLen !== toBeAdded.length) {
            console.log(toBeAdded);
            toBeAdded = toBeAdded.slice(0, toBeAddedLen);
        }
        // Check if no object is required 
        if (objectID == '0') {
            return true;
        }

        // Check if object already used        
        let [idx, cacheObject] = findInArr(db, 60, undefined, item => item[0] == 'O' && item[1] == objectID);
        if (cacheObject[3]) {
            return;
        }

        let perso = getARandomItem(db.slice(50, 70), (perso) => {
            // Check if it is a perso
            if (perso[0] != 'P') {
                return;
            }
            // Check if it is already used
            if (perso[6]) {
                return;
            }
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
                if (loc[6]) {
                    return;
                }
                // Check if he give the object
                if (!loc[4].split(',').includes(objectID)) {
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

async function generate_board() {
    toBeAdded = [];
    places[3][0] = { 'L': 99 }; //,  ?
    waitUntil(() => db != undefined, () => {
        for (let i = 0; i < placesPriority.length; i++) {
            let placeARR = placesPriority[i];
            let placeINT = roomToInt(placeARR);
            let place = places[placeARR[0]][placeARR[1]];
            let placeDoor = getDoors(placeINT);
            if (!placeDoor) {
                continue;
            }
            for (let y = 0; y < placeDoor.length; y++) {
                const doorTo = placeDoor[y]; //INT
                try {
                    if (place['R'][doorTo] != undefined) {
                        continue;
                    }
                } catch (error) { }
                let randomDoor = ranDoor();
                if (randomDoor) {
                    setDoor(doorTo, placeARR, randomDoor);
                    setDoor(-doorTo, intToRoom(placeINT + doorTo), randomDoor);
                }
            }
        }
        boardGenerated = true;
        console.log("Board generated !")
    });
}





// IN-GAME CODE


async function launch_game() {
    document.getElementById("pregame-interface").classList.add("is-hidden");
    document.getElementById("loadinggame-interface").classList.remove("is-hidden");
    setBg('room-canvas', 'black');
    document.getElementById("loadinggame-interface").classList.add("is-hidden");
    document.getElementById("ingame-interface").classList.remove("is-hidden");
}

// STARTING GAME CODE

/**Set array <players> values to actual select values.
 * If there is a duplicate, set select value to none.
*/
function init_players_values() {
    let selects = document.querySelectorAll("select");
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
    var selects = document.querySelectorAll("select");

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
            console.log("Option selected: " + this.value);
            //Save value
            players[selectID - 1] = this.value
        });
    });
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
        console.log("Game start !");
        launch_game();
    });
}


document.addEventListener("DOMContentLoaded", function () {
    init_players_values();
    init_select_onclick();
    set_player_form_submit();
});