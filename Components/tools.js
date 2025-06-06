var UNIQUEID = Math.floor(Date.now() / (10000)) - 170000000;

function nothing() { }

var logs = [];
var logsIdx = '';

function logOpen(catName) {
    // log ('-----------');
    logsIdx += '[' + (eval('logs' + logsIdx).push([catName]) - 1) + ']';
    // console.log(logsIdx);
}

function log(...args) {
    if (args.length === 1) {
        args = args[0];
    } else {
        args.push('(val)');
    }
    eval('logs' + logsIdx).push(args);
}

function logClose() {
    let parts = logsIdx.split('[');
    parts.pop();
    logsIdx = parts.join('[');
    // console.log(logsIdx);
}

/**
 * Attend un nombre de secondes spécifié avant de résoudre la promesse
 * @param {number} waitMs - Nombre de milisecondes à attendre
 * @returns {Promise<void>} Promesse résolue après le délai
 * @throws {Error} Si le timeout est atteint (en cas d'intervalle/timeout modifiés)
 * 
 * @example
 * // Attendre 5 secondes
 * await waitTime(5000);
 */
function waitTime(waitMs) {
    // const startTime = Date.now();
    // const interval = Math.floor(waitMs / 3) + 1;
    // return wait(
    //     () => Date.now() - startTime >= waitMs,
    //     interval,
    //     5000 + waitMs * 3 // Timeout légèrement supérieur pour éviter les conflits
    // );
    return new Promise(resolve => setTimeout(resolve, waitMs))
}

// ## INT

function getUniqueID() {
    UNIQUEID += 1;
    return UNIQUEID;
}

function randint(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ## ARRAY

/**
 * Detect duplicates from an array
 * @param {array} Array 
 * @returns {bool}
 */
function hasDuplicates(arr) {
    return arr.some((item, index) => arr.indexOf(item) !== index);
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

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}

/**
 * Find something in a part of an array
 * @param {*} arr 
 * @param {*} min 
 * @param {*} max 
 * @param {*} condition
 */
function findInArr(arr, min = 0, max = undefined, condition) {
    if (max === undefined || max >= arr.length) {
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

function getARandomItem(arr, conditions, restoration = () => { }) {
    let usable = [...arr];
    let result = undefined;
    let first = true;
    while (!result && usable.length > 0) {
        if (first) {
            first = false;
        } else {
            restoration();
        }
        let item = ranAndDel(usable);
        if (conditions(item)) {
            result = item;
        }
    }
    if (!result) {
        restoration();
    }
    return result;
}

// ## OBJ
function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// ## FETCH

async function getDb(path) {
    let data;
    await fetch(path)
        .then(response => response.text())
        .then(dt => {
            data = dt;
        })
        .catch(error => {
            console.error("Error fetching and parsing data:", error);
        });
    return data;
}


// ## URL
function checkIfUrlContains(keyword) {
  const currentUrl = window.location.href; // Récupère l'URL actuelle du navigateur
  if (currentUrl.includes(keyword)) {
    return true; // Retourne vrai si le mot-clé est trouvé
  } else {
    return false; // Retourne faux si le mot-clé n'est pas trouvé
  }
}







var ToolsJSLoaded = true;