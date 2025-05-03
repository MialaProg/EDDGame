var places = [
    Array.from({ length: 13 }, (_, i) => (85 + i )),
    Array(6).fill().map(() => (undefined)),    
    Array(6).fill().map(() => (undefined)),    
    Array(6).fill().map(() => (undefined))     
];

var placesPriority = [
    '30', '20', '21', '10', '31', '22', '11', '32', '12', '33', '24', '34', '35', '25', '15', '23', '14', '13'
]

var doors = {
    10: [1, 10], 11: [1], 12: [1], 13: [1, 10], 14: [1], 15: [10],
    20: [10], 21: [10], 22: [10], 23: [1], 24: [], 25: [10],
    30: [1], 31: [1], 32: [1], 33: [1], 34: [1], 35: []
};

var myGame = {};
var myGameHistory = [];

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

function setMyGame(ItemID, Prop, val) {
    if (!myGame[ItemID]) {
        setArr(`['${ItemID}']`, '{}', 'myGame');
    }
    setArr(`['${ItemID}']['${Prop}']`, `"${val}"`, 'myGame');
}







var GameJSLoaded = true;