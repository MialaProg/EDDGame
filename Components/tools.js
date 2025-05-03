var UNIQUEID = Math.floor(Date.now() / (10000)) - 174612000;
function getUniqueID() {
    UNIQUEID += 1;
    return UNIQUEID;
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
        })
        .catch(error => {
            console.error("Error fetching and parsing data:", error);
        });
    return data;
}











var ToolsJSLoaded