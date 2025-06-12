var Game = {

    rooms: [
        Array.from({ length: 13 }, (_, i) => ({ L: 85 + i })),
        Array(6).fill().map(() => ({})),
        Array(6).fill().map(() => ({})),
        Array(6).fill().map(() => ({}))
    ],

    roomsPriority: [
        30, 20, 21, 10, 31, 22, 11, 32, 12, 33, 24, 34, 35, 25, 15, 23, 14, 13
    ],

    doors: {
        10: [1, 10], 11: [1], 12: [1], 13: [1, 10], 14: [1], 15: [10],
        20: [10], 21: [10], 22: [10], 23: [1], 24: [], 25: [10],
        30: [1], 31: [1], 32: [1], 33: [1], 34: [1], 35: []
    },


    placesAdded: [],
    placesDefault: [],
    placesToBeAdded: [],
    numPlacesAvaible: 0,

    db: {},
    // dbHistory: [],
    logPath: [],
    logs: [],

    toBeRestored: ['db', 'placesToBeAdded', 'placesAdded', 'logPath', 'numPlacesAvaible'],
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
            val = JSON.stringify(val);
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
    },

    // For logging
    stopChain: (err) => { Game.logs.push(err + ' '.repeat(25 - err.length) + Game.logPath.join('<')); }

    , setDbItem: (ItemID, Prop, val) => {
        if (!Game.db[ItemID]) {
            Game.setArr(`['${ItemID}']`, '{}', 'Game.db');
        }
        Game.setArr(`['${ItemID}']['${Prop}']`, `"${val}"`, 'Game.db');
    },

    getARandomItemAndRestore: (arr, conditions, restorate = () => { }) => {
        const initLen = []
        Game.toBeRestored.forEach((v) => {
            initLen.push(Game[`${v}History`] ? Game[`${v}History`].length : 0);
        });

        // log('Get random in ', arr);
        return getARandomItem(arr, (item, usable) => {
            // logOpen(item);
            return conditions(item, usable);
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

    getObjForIn: (obj, val) => {
        return Game.searchIn(obj, val)[0];
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
        if (arr.length != 2) {
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
            const getterObj = Game.db[getter];
            for (let j = 0; j < Object.keys(getterObj).length; j++) {
                const req = Object.keys(getterObj)[j];
                if (getterObj[req].includes(item)) Game.setArr(`['${getter}']['${req}']`, undefined, 'Game.db');
            }
        }

    },

    objectsReqFormat: (obj) => {
        let objReq = obj[4];
        if (!objReq) return {};
        let objReqFormatted = {};
        objReq.split(',').forEach((e) => { // x&y|z>a&b|c
            let poss = e.split('>');
            let objsNF = poss[1].split('|');
            poss[0].split('|').forEach((reqs) => { // x&y ; z
                const inDb = Game.db[obj[0]];
                if (inDb && inDb[reqs]) return; // Verify object giver isn't already used
                objReqFormatted[reqs] = [];
                objsNF.forEach((objs) => {
                    objReqFormatted[reqs].push(objs);
                });
            });
        });
        return objReqFormatted;
    },

    placeChecks: (placeID, ToAdd) => {

        placeID = parseInt(placeID);
        // Check if already added
        let Added = Game.placesAdded.includes(placeID);
        if ((ToAdd || !Game.placesDefault.includes(placeID)) && Added) return Game.stopChain('L-alreadyAdded');

        // Check if it can be used
        if (!Game.numPlacesAvaible) return Game.stopChain('L-FULL');

        if (!Added && !Game.placesToBeAdded.includes(placeID)) Game.setArr('', Game.numPlacesAvaible - 1, 'Game.numPlacesAvaible');
        Game.setArr('', placeID, 'Game.placesToBeAdded');

        return true;
    },

    resolvePlace: (plReq, type, ToAdd) => {
        return Game.getARandomItemAndRestore(plReq, (placeID) => {
            Game.setArr('', 'L' + placeID, 'Game.logPath');

            // Check if it exist
            if (!miDb.lib.find(e => e[0] == 'L' + placeID)) return Game.stopChain('L-Not exist');

            // Check if already taken for typeof
            try {
                if (Game.db['L' + placeID][type]) return Game.stopChain('L-Already taken');
            } catch (e) {
                if (!(e instanceof TypeError)) throw e;
            }

            if (!Game.placeChecks(placeID, ToAdd)) return Game.stopChain('L-No checks');

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

            if (perso[0] == 'P1' && players.includes('E')){
                return Game.stopChain('P-Efelant is in the tree');
            }

            // Check if it is already used
            try {
                const oldPlace = Game.db[perso[0]]['L'];
                if (oldPlace) {
                    Game.setArr(`['L${oldPlace}']['P']`, undefined, 'Game.db'); // Remove the place
                }
            } catch (e) {
                if (!(e instanceof TypeError)) throw e;
            }

            let objReq = Game.objectsReqFormat(perso); //[4]

            let object = Game.resolveObjects(objReq, _for.slice(1));
            if (!object) {
                return Game.stopChain('P-No obj gives this');
            }

            // Check places required
            let plr = perso[3].split(',');
            if (plr[0] == '*') plr = Array.from({ length: 99 }, (_, i) => i + 1);//.concat(Array.from({ length: 15 }, (_, i) => i + 85));
            let place = Game.resolvePlace(plr, 'P');
            if (!place) return Game.stopChain('P-No Place');

            // Save and return

            // For multiple 0
            if (object == '0') {
                object += getUniqueID();
            } else {
                object = 'O' + object;
            }

            Game.setDbItem(perso[0], object, _for);
            Game.setDbItem(perso[0], 'L', place);
            Game.setDbItem('L' + place, 'P', perso[0].slice(1));
            return true;
        });
    },

    resolveObjects: (objReq, toGet = 'open') => {
        return Game.getARandomItemAndRestore(Object.keys(objReq), (e) => {
            // Check if it gives the toGet
            if (!objReq[e].find((gives) => gives.split('&').includes(toGet))) return;
            // if (!objReq[e].split('&').includes(toGet)) return;

            objectIDs = e.split('&');

            for (let i = 0; i < objectIDs.length; i++) {
                const objectID = objectIDs[i];

                // Check if no object is required 
                if (objectID == '0') {
                    Game.setArr('', '0', 'Game.logPath');
                    continue;
                }

                // Check if object already used  
                let [idx, cacheObject] = findInArr(miDb.lib, 60, undefined, item => item[0] == 'O' + objectID);


                Game.setArr('', cacheObject[0], 'Game.logPath');
                // console.log(Game.logPath.join('>')); OUTDATED
                try {
                    if (Game.db[cacheObject[0]]['exists']) {
                        if (cacheObject[2] == '1') {
                            return Game.stopChain('Already used');
                        }
                        if (cacheObject[2] == '0') {
                            // Re-evaluate the location where getting the object
                            Game.delItemGetter(cacheObject[0]);
                        }
                    }
                    Game.setDbItem(cacheObject[0], 'exists', 'true');
                } catch (e) {
                    if (!(e instanceof TypeError)) throw e;
                }

                let perso = Game.resolveGiver(cacheObject[0]);
                if (!perso) {
                    // Check for location
                    let loc = Game.getARandomItemAndRestore(miDb.lib.slice(miDb.LOC_PLACES[0], miDb.LOC_PLACES[1]), (loc) => {
                        // Check if it is a loc
                        if (loc[0][0] != 'L') {
                            return;
                        }

                        Game.setArr('', loc[0], 'Game.logPath');

                        if (!Game.placeChecks(loc[0].slice(1))) return Game.stopChain('L-No placeChecks');

                        // Check if he give the object
                        let objReq = Game.objectsReqFormat(loc); //[4]
                        let object = Game.resolveObjects(objReq, cacheObject[0].slice(1));
                        if (!object) {
                            return Game.stopChain('L-No obj gives this');
                        }

                        // Save and return

                        // For multiple 0
                        if (object == '0') {
                            object += getUniqueID();
                        } else {
                            object = 'O' + object;
                        }

                        Game.setDbItem(loc[0], object, cacheObject[0]);
                        return true;
                    });
                    if (!loc) {
                        return Game.stopChain('No Loc');
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
        return Game.getARandomItemAndRestore(allDoors, (doorID, usable) => {
            let [idx, cacheDoor] = findInArr(miDb.lib, miDb.LOC_DOORS[0], miDb.LOC_DOORS[1], item => item[0] == 'R' + doorID);
            if (!cacheDoor) return;
            Game.setArr('', cacheDoor[0], 'Game.logPath');
            Game.logs.push('=>' + doorID + ' for ' + roomIDX + ' <' + JSON.stringify(usable));

            // ### Check if door already used
            if (Game.searchIn(cacheDoor[0], 'OPEN')[0] !== undefined) return Game.stopChain('Already use');

            // ### Check if places avaible
            let placesRequired = cacheDoor[3].split(",");
            // ## Check if actual place is compatible with the door
            const room = Game.getRoom(roomIDX);
            let place = Game.getRoom(roomIDX)['L'];
            if (place) {
                if (!placesRequired.includes(place.toString())) return Game.stopChain('R-Incompatible L' + place);
            } else {
                place = parseInt(Game.resolvePlace(cacheDoor[3].split(','), 'R', true));
                if (!place) return Game.stopChain('R-No Place');
                room['L'] = place;
                Game.setArr('', place, 'Game.placesAdded');
            }

            // ### Check for objects required
            let objectID = Game.resolveObjects(Game.objectsReqFormat(cacheDoor)); //[4]
            if (!objectID) return Game.stopChain('R-No object');


            // Save and return
            Game.setDbItem(cacheDoor[0], 'O' + objectID, 'OPEN');
            return true;
        }, () => { Game.setRoom(roomIDX, copy(iniRoom)); log('Reset room to', iniRoom); });
    },

    generate: async () => {
        const len = Game.roomsPriority.length;
        const roomChecked = [];
        for (let i = 0; i < len; i++) {
            Loading.setProgressBar(10 + (i / len) * 30, false);
            await waitUIupdate();

            Game.placesToBeAdded.push(1000 + i);
            const roomINT = Game.roomsPriority[i];
            const roomDoors = Game.getRoomDoors(roomINT);
            const roomCoords = Game.intToCoords(roomINT);
            const room = Game.getRoom(roomINT);
            roomChecked.push(roomINT)
            // log('Room', roomINT, roomDoors);
            if (!roomDoors) continue;
            // OK: roomDoors shuffle
            shuffleArray(roomDoors);
            for (let j = 0; j < roomDoors.length; j++) {
                const doorRelative = roomDoors[j];
                const oroomINT = roomINT + doorRelative;
                const oroomCoords = Game.intToCoords(oroomINT);
                const oroom = Game.getRoom(oroomINT);
                try {
                    // log('Check door', doorRelative, 'for', roomINT, 'to', oroomINT, Game.db['L' + room]);
                    if (Game.db['L' + room]['R'][doorRelative] != undefined) continue;
                } catch (e) { }

                Game.logs.push('----- Check door ' + doorRelative + ' for ' + roomINT + ' to ' + oroomINT);
                Game.logPath = [];

                let randomDoor;
                if (roomChecked.includes(oroomINT)) {
                    randomDoor = Game.ranDoor(roomCoords);
                } else {
                    randomDoor = Game.ranDoor(oroomCoords);
                }

                // log(`OK? Door ${doorRelative} for ${roomINT} : ${randomDoor}`);
                if (randomDoor) {
                    Game.stopChain('OK');
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
    },


    // Sauvegarde (JSON + compression)
    save: async () => {
        let toDownload = await compress(JSON.stringify(Game));
        const blob = new Blob([toDownload], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'EDDGameSave.gz.db.mi';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Chargement (décompression + JSON)
    load: async () => {
        let uploadedStr;
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.mi,.db,.gz,.miDb';
        console.log('Wait input');
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            console.log('Wait reader')
            reader.onload = async (event) => {
                uploadedStr = event.target.result;
                console.log('Wait uncompress');
                let Gamebis = JSON.parse(await decompress(uploadedStr));
                alert('Game loaded successfully!');
                Object.assign(Game, Gamebis);
                console.log('Game ready');
            };
            reader.readAsText(file);
        };
        input.click();
    }

}

Game.rooms[0].forEach(room => {
    Game.placesDefault.push(room['L']);
    Game.placesAdded.push(room['L']);
});
Game.numPlacesAvaible = Game.roomsPriority.length;

var GameJSLoaded = true;