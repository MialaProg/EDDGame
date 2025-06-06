var Game = {

    rooms: [
        Array.from({ length: 13 }, (_, i) => ({ L: 85 + i })),
        Array(6).fill().map(() => ({})),
        Array(6).fill().map(() => ({})),
        Array(6).fill().map(() => ({}))
    ],

    roomsPriority: [
        30, 20, 21, 10, 31, 22, 11, 32, 12, 33, 24, 34, 35, 25, 15, 23, 14, 13
    ]

    , doors: {
        10: [1, 10], 11: [1], 12: [1], 13: [1, 10], 14: [1], 15: [10],
        20: [10], 21: [10], 22: [10], 23: [1], 24: [], 25: [10],
        30: [1], 31: [1], 32: [1], 33: [1], 34: [1], 35: []
    },


    placesAdded: [],

    db: {},
    // dbHistory: [],
    logPath: [],

    placesToBeAdded: [],
    // placesAdded: [... Game.rooms[0]], See below
    numPlaces: 2, // Len & > 
    toBeRestored: ['db', 'placesToBeAdded', 'placesAdded', 'logPath', 'numPlaces'],
    isGenerate: false,

    myItems: [],

    /**
     * Set and save change
     * @param {string} idx 
     * @param {string} val 
     * @param {string} arr 
     * @param {string} history 
     */
    setArr: (idx, val, arr, history) => {
        if (!history) {
            history = arr + 'History';
        }

        try {
            eval('nothing(' + val + ');');
        } catch (e) {
            if (!(e instanceof ReferenceError || e instanceof SyntaxError)) throw e;
            val = `'${val}'`;
        }

        // console.log(false, idx, val, arr, history);
        eval(`
        if (!${history}) ${history} = [];
        ${history}.push(["${idx}", JSON.stringify(${arr}${idx})]);
        if (Array.isArray(${arr}${idx})) {
            ${arr}${idx}.push(${val});
        } else {
            ${arr}${idx} = ${val};
        }
    `);
    }

    , restoreArr: (toLen, arr, history) => {
        if (!history) {
            history = arr + 'History';
        }
        if (!eval(history)) {
            eval(history + '= [];');
        }
        // console.log('Restore: ', arr, 'to', toLen);
        for (let i = eval(history).length; i > toLen; i--) {
            const e = eval(history)[i - 1];
            eval(`
                if ('${e[1]}' === 'undefined'){
                ${arr}${e[0]} = undefined;
                }else{
                ${arr}${e[0]} = JSON.parse('${e[1]}');
                }
            `);
            eval(history).pop();
        }
    }

    , setDbItem: (ItemID, Prop, val) => {
        if (!Game.db[ItemID]) {
            Game.setArr(`['${ItemID}']`, '{}', 'Game.db');
        }
        Game.setArr(`['${ItemID}']['${Prop}']`, `"${val}"`, 'Game.db');
    },

    getARandomItemAndRestore: (arr, conditions, restorate = () => { }) => {
        const initLen = []
        Game.toBeRestored.forEach((v) => {
            eval(`initLen.push(Game.${v}History ? Game.${v}History.length : 0);`);
        });

        // log('Get random in ', arr);
        return getARandomItem(arr, (item) => {
            // logOpen(item);
            return conditions(item);
        }, () => {
            for (let i = 0; i < Game.toBeRestored.length; i++) {
                const v = Game.toBeRestored[i];
                Game.restoreArr(initLen[i], 'Game.' + v);
            }
            // logClose();
            restorate();
        });
    },

    searchIn: (obj, value) => {
        if (!Game.db[obj]) Game.db[obj] = {};
        let entry = Object.entries(Game.db[obj]).find(([key, val]) => val === value);
        if (!entry) {
            return [undefined, undefined];
        }
        return entry;
    },

    intToCoords: (num) => {
        num = num.toString();
        if (num.length < 2) {
            num = '00' + num;
        }
        if (num.length > 3) {
            throw new Error("Number must be two or three digits.");
        }

        let d3 = (num.length == 3) ? num[2] : '';
        return [parseInt(num[0]), parseInt(num[1] + d3)];
    },

    coordsToInt: (arr) => {
        if (arr.length) {
            throw new Error("Array must have exactly two elements.");
        }
        return parseInt(arr[0].toString() + arr[1].toString());
    },

    getRoomDoors: (roomNum) => {
        let roomDoors = [...Game.doors[roomNum]];
        for (let i = 1; i < 11; i += 9) {
            if (Game.doors[roomNum - i] && Game.doors[roomNum - i].includes(i)) {
                roomDoors.push(-i);
            }
        }
        return roomDoors;
    },

    /**
 * Set in places the door of the room to val
 */
    setDoor: (door, roomARR, val) => {
        // let idx = 'L' + Game.rooms[roomARR[0]][roomARR[1]];
        // let place = Game.db[idx];
        // if (!place) {
        //     Game.db[idx] = {};
        //     place = Game.db[idx];
        // }
        // if (!place['R']) { place['R'] = {}; }
        // log('Set door', door, 'to', val, 'in', idx);
        // place['R'][door] = val;
        // log(place['R']);

        let room = Game.getRoom(roomARR);
        if (!room) { room = Game.setRoom(roomARR, {}); }
        if (!room['R']) { room['R'] = {}; }
        room['R'][door] = val;
    },

    getRoom: (roomIDX) => {
        if (!Array.isArray(roomIDX)) {
            roomIDX = Game.intToCoords(roomIDX);
        }
        return Game.rooms[roomIDX[0]][roomIDX[1]];
    },

    // Inutile car par référence...
    setRoom: (roomIDX, val) => {
        if (!Array.isArray(roomIDX)) {
            roomIDX = Game.intToCoords(roomIDX);
        }
        Game.rooms[roomIDX[0]][roomIDX[1]] = val;
        return val;
    },

    delItemGetter: (item) => {
        for (let i = 0; i < Object.keys(Game.db).length; i++) {
            const getter = Object.keys(Game.db)[i];
            for (let j = 0; j < Object.keys(getter).length; j++) {
                const req = Object.keys(getter)[j];
                if (getter[req].includes(item)) delete getter[req];
            }
        }

    },

    objectsReqFormat: (objReq) => {
        if (!objReq) return {};
        let objReqFormatted = {};
        objReq.split(',').forEach((e) => { // x&y|z>a&b|c
            let poss = e.split('>');
            let objsNF = poss[1].split('|');
            poss[0].split('|').forEach((reqs) => { // x&y ; z
                objsNF.forEach((objs) => {
                    objReqFormatted[reqs] = objs;
                });
            });
        });
        return objReqFormatted;
    },

    placeChecks: (placeID) => {
        placeID = parseInt(placeID);
        // Check if already added
        if (Game.placesAdded.includes(placeID)) return;

        // Check if it can be used
        // Game.placesToBeAdded.includes(placeID)
        if (Game.numPlaces > Game.roomsPriority.length) return;

        return true;
    },

    resolvePlace: (plReq, type) => {
        return Game.getARandomItemAndRestore(plReq, (placeID) => {
            Game.setArr('', 'L' + placeID, 'Game.logPath');

            // Check if it exist
            if (!miDb.lib.find(e => e[0] == 'L' + placeID)) return;

            if (!Game.rooms[0].find(e => e['L'] == placeID) && !Game.placeChecks(placeID)) return;

            // Check if already taken for typeof
            try {
                if (Game.db['L' + placeID][type]) return;
            } catch (e) {
                if (!(e instanceof TypeError)) throw e;
            }

            Game.setArr('', Game.numPlaces + 1, 'Game.numPlaces');
            Game.setArr('', placeID, 'Game.placesToBeAdded');
            return true;
        });
    },

    resolveGiver: (_for) => {
        return Game.getARandomItemAndRestore(miDb.lib.slice(miDb.LOC_PERSO[0], miDb.LOC_PERSO[1]), (perso) => {
            // Check if it is a perso
            if (perso[0][0] != 'P') {
                return;
            }
            Game.setArr('', perso[0], 'Game.logPath');

            // Check if it is already used
            try {
                if (Game.db[perso[0]]['exists']) {
                    Game.delItemGetter(perso[0]);
                }
            } catch (e) {
                if (!(e instanceof TypeError)) throw e;
            }

            let objReq = Game.objectsReqFormat(perso[4]);

            let object = Game.resolveObjects(objReq, _for.slice(1));
            if (!object) {
                return;
            }

            // Check places required
            let plr = perso[3].split(',');
            if (plr[0] == '*') plr = Array.from({ length: 99 }, (_, i) => i + 1);//.concat(Array.from({ length: 15 }, (_, i) => i + 85));
            let place = Game.resolvePlace(plr, 'P');
            if (!place) return;

            // Save and return

            // For multiple 0
            if (object == '0') {
                object += getUniqueID();
            } else {
                object = 'O' + object;
            }

            Game.setDbItem(perso[0], object, _for);
            Game.setDbItem('L' + place, 'P', perso[0].slice(1));
            return true;
        });
    },

    resolveObjects: (objReq, toGet = 'open') => {
        return Game.getARandomItemAndRestore(Object.keys(objReq), (e) => {
            // Check if it gives the toGet
            if (!objReq[e].split('&').includes(toGet)) return;

            objectIDs = e.split('&');

            for (let i = 0; i < objectIDs.length; i++) {
                const objectID = objectIDs[i];

                // Check if no object is required 
                if (objectID == '0') {
                    continue;
                }

                // Check if object already used  
                let [idx, cacheObject] = findInArr(miDb.lib, 60, undefined, item => item[0] == 'O' + objectID);


                Game.setArr('', cacheObject[0], 'Game.logPath');
                // console.log(Game.logPath.join('>')); OUTDATED
                try {
                    if (Game.db[cacheObject[0]]['exists']) {
                        if (cacheObject[2] == '1') {
                            return;
                        }
                        if (cacheObject[2] == '0') {
                            // Re-evaluate the location where getting the object
                            Game.delItemGetter(cacheObject[0]);
                        }
                    }
                } catch (e) {
                    if (!(e instanceof TypeError)) throw e;
                }

                let perso = Game.resolveGiver(cacheObject[0]);
                if (!perso) {
                    // Check for location
                    let loc = getARandomItem(miDb.lib.slice(miDb.LOC_PLACES[0], miDb.LOC_PLACES[1]), (loc) => {
                        // Check if it is a loc
                        if (loc[0][0] != 'L') {
                            return;
                        }

                        if (!Game.placeChecks(loc[0].slice(1))) return;

                        // Check if he give the object
                        let objReq = Game.objectsReqFormat(loc[4]);
                        let object = Game.resolveObjects(objReq, cacheObject[0].slice(1));
                        if (!object) {
                            return;
                        }

                        // Save and return

                        // For multiple 0
                        if (object == '0') {
                            object += getUniqueID();
                        } else {
                            object = 'O' + object;
                        }

                        Game.setDbItem(loc[0], object, cacheObject[0]);
                        Game.setArr('', Game.numPlaces + 1, 'Game.numPlaces');
                        Game.setArr('', loc[0].slice(1), 'Game.placesToBeAdded');
                        return true;
                    });
                    if (!loc) {
                        return;
                    }
                }

                // Save and return
                // setDb(`[${idx}]`, 1); 


            }

            return true;
        });
    },

    ranDoor: (roomIDX) => {
        let allDoors = Array.from({ length: miDb.NB_DOORS }, (_, i) => i + 1);
        let iniRoom = copy(Game.getRoom(roomIDX));
        return Game.getARandomItemAndRestore(allDoors, (doorID) => {
            let [idx, cacheDoor] = findInArr(miDb.lib, miDb.LOC_DOORS[0], miDb.LOC_DOORS[1], item => item[0] == 'R' + doorID);
            log('Search for door: ' + doorID);
            if (!cacheDoor) {
                log('ERR: No cacheDoor for', doorID);
                return;
            }
            Game.setArr('', cacheDoor[0], 'Game.logPath');

            // ### Check if door already used
            if (Game.searchIn(cacheDoor[0], 'OPEN')[0] !== undefined) {
                log('ERR: Deja util: ' + doorID);
                return;
            }

            // ### Check if places avaible
            let placesRequired = cacheDoor[3].split(",");
            // ## Check if actual place is compatible with the door
            const room = Game.getRoom(roomIDX);
            let place = Game.getRoom(roomIDX)['L'];
            if (place) {
                if (!placesRequired.includes(place.toString())) return;
            } else {
                place = parseInt(Game.resolvePlace(cacheDoor[3].split(','), 'R'));
                log('RP: Place', place, doorID);
                if (!place) return;
                room['L'] = place;
                Game.setArr('', place, 'Game.placesAdded');
            }

            // ### Check for objects required
            let objectID = Game.resolveObjects(Game.objectsReqFormat(cacheDoor[4]));
            log('RP: Obj', objectID, doorID);
            if (!objectID) return;


            // Save and return
            log('OK');
            Game.setDbItem(cacheDoor[0], 'O' + objectID, 'OPEN');
            return true;
        }, () => { Game.setRoom(roomIDX, copy(iniRoom)); log('Reset room to', iniRoom); });
    },

    generate: async () => {
        const len = Game.roomsPriority.length;
        const roomChecked = [];
        for (let i = 0; i < len; i++) {
            Loading.setProgressBar(10 + (i / len) * 30);

            await waitTime(10);

            Game.placesToBeAdded.push(1000 + i);
            const roomINT = Game.roomsPriority[i];
            const roomDoors = Game.getRoomDoors(roomINT);
            const roomCoords = Game.intToCoords(roomINT);
            const room = Game.getRoom(roomINT);
            roomChecked.push(roomINT)
            log('Room', roomINT, roomDoors);
            if (!roomDoors) continue;
            // OK: roomDoors shuffle
            shuffleArray(roomDoors);
            for (let j = 0; j < roomDoors.length; j++) {
                const doorRelative = roomDoors[j];
                const oroomINT = roomINT + doorRelative;
                const oroomCoords = Game.intToCoords(oroomINT);
                const oroom = Game.getRoom(oroomINT);
                try {
                    log('Check door', doorRelative, 'for', roomINT, 'to', oroomINT, Game.db['L' + room]);
                    if (Game.db['L' + room]['R'][doorRelative] != undefined) continue;
                } catch (e) { }

                let randomDoor
                if (roomChecked.includes(oroomINT)) {
                    randomDoor = Game.ranDoor(roomCoords);
                } else {
                    randomDoor = Game.ranDoor(oroomCoords);
                }

                log(`OK? Door ${doorRelative} for ${roomINT} : ${randomDoor}`);
                if (randomDoor) {
                    Game.setDoor(doorRelative, roomCoords, randomDoor);
                    Game.setDoor(-doorRelative, oroomCoords, randomDoor);
                }
            }
        }
        Game.addPlacesRequired();
        Game.isGenerate = true;
    },

    addPlacesRequired() {
        let minRoom = Game.roomsPriority.length - 1;
        let minChange = true;
        let roomSelected = undefined;

        let allRooms = [...Game.roomsPriority];
        const lenStandartPlaces = Game.rooms[0].length;
        for (let i = 0; i < lenStandartPlaces; i++) {
            allRooms.push('0' + i);
        }

        // let asBeenAdded = [];
        // Game.rooms.forEach((row) => {
        //     row.forEach((room) => {
        //         if (room) asBeenAdded.push(room);
        //     });
        // });
        // console.log(asBeenAdded);
        logOpen('addPlaces...');

        for (let i = Game.placesToBeAdded.length - 1; i > 0; i--) {
            logClose();
            let element = Game.placesToBeAdded[i];
            logOpen('Try adding place: ' + element);
            if (typeof element == "number" && element > 999) {
                minRoom = element - 1000;
                minChange = true;
                continue;
            }
            if (Game.placesAdded.includes(element)) {
                log('Already Added.');
                continue;
            }
            if (minChange) {
                roomSelected = allRooms.slice(minRoom);
                minChange = false;
            }
            log(getARandomItem(roomSelected, (roomINT) => {
                const room = Game.getRoom(roomINT);

                // Vérification que la place est libre pour l'élément
                if (room['L']) {
                    return;
                }

                room['L'] = element;
                // Ajout de l'élément à la liste des éléments ajoutés
                Game.placesAdded.push(element);
                return true;
            }));
            // console.log('Added to', my_room, ':[' + i + ']', element);
        }
        logClose();
    },

    getObject: (obj) => {
        if (!Game.db[obj]) Game.db[obj] = {};
        if (!Game.db[obj].nb) Game.db[obj].nb = 0;
        Game.db[obj].nb += 1;
    }

}

Game.rooms[0].forEach(room => {
    Game.placesAdded.push(room['L']);
});

var GameJSLoaded = true;