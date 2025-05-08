var UNIQUEID = Math.floor(Date.now() / (10000)) - 174612000;
var ConsoleLog = true;

function log(...arguments) {
    //logs.push(...arguments);
    if (!arguments[0]) {
        return;
    }
    if (ConsoleLog) {
        console.log(...arguments);
    }
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

function getARandomItem(arr, conditions, restoration = () => {}) {
    let usable = [...arr];
    let result = undefined;
    while (!result && usable.length > 0) {
        restoration();
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










var ToolsJSLoaded = true;