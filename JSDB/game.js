var Game = {

    rooms: [
        Array.from({ length: 13 }, (_, i) => (85 + i)),
        Array(6).fill().map(() => (undefined)),
        Array(6).fill().map(() => (undefined)),
        Array(6).fill().map(() => (undefined))
    ],

    roomsPriority: [
        '30', '20', '21', '10', '31', '22', '11', '32', '12', '33', '24', '34', '35', '25', '15', '23', '14', '13'
    ]

    , doors: {
        10: [1, 10], 11: [1], 12: [1], 13: [1, 10], 14: [1], 15: [10],
        20: [10], 21: [10], 22: [10], 23: [1], 24: [], 25: [10],
        30: [1], 31: [1], 32: [1], 33: [1], 34: [1], 35: []
    }

    , db: {},
    // dbHistory: [],
    placesToBeAdded: [],
    placesAdded: [],
    toBeRestored: ['db', 'placesToBeAdded', 'placesAdded'],

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

    , restoreArr: (toLen, arr, history) => {
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

    , setDbItem: (ItemID, Prop, val) => {
        if (!Game.db[ItemID]) {
            setArr(`['${ItemID}']`, '{}', 'Game.db');
        }
        setArr(`['${ItemID}']['${Prop}']`, `"${val}"`, 'Game.db');
    },

    getARandomItemAndRestore: (arr, conditions, restorate = () => { }) => {
        toBeRestored.forEach((v) => {
            eval(`let initLen4${v} = Game.${v}History : Game.${v}History.length ? 0;`);
        });
        return getARandomItem(arr, conditions, () => {
            toBeRestored.forEach((v) => {
                this.restoreArr('initLen4' + v, 'Game.' + v);
            });
            restorate();
        });
    },

    searchIn: (obj, value) => {
        let entry = Object.entries(myItems[obj]).find(([key, val]) => val === value);
        if (!entry) {
            return [undef, undef];
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
        let room = Game.rooms[roomARR[0]][roomARR[1]];
        if (!room) { room = {}; }
        if (!room['R']) { room['R'] = {}; }
        room['R'][door] = val;
        Game.rooms[roomARR[0]][roomARR[1]] = room;
    },

    getRoom: (roomINT) => {
        const roomARR = Game.intToCoords(roomINT);
        const room = Game.rooms[roomARR[0]][roomARR[1]];
        return room;
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

    resolvePlace: (plReq, type) => {
        return Game.getARandomItemAndRestore(plReq, (placeID) => {

            // Check if it exist
            if (!miDb.lib.find(e => e[0] == 'L'+placeID)) return;

            // Check if already added
            if (Game.placesAdded.includes(placeID)) return;

            // Check if already taken for type
            if (Game.db['L' + placeID][type]) return;

            setArr('', placeID, 'Game.placesToBeAdded');
            return true;
        });
    },

    resolveGiver: (_for) => {
        return Game.getARandomItemAndRestore(miDb.lib.slice(miDb.LOC_PERSO[0], miDb.LOC_PERSO[1]), (perso) => {
            // Check if it is a perso
            if (perso[0][0] != 'P') {
                return;
            }
            // Check if it is already used
            try {
                if (Game.db[perso[0]]['exists']) {
                    Game.delItemGetter(perso[0]);
                }
            } catch (e) {
                if (!(e instanceof TypeError)) throw e;
            }

            let objReq = Game.objectsReqFormat(perso[4]);

            let object = resolveObjects(objReq, _for.slice(1));
            if (!object) {
                return;
            }

            // Check places required
            let plr = perso[3].split(',');
            if (plr[0] == '*') plr = Array.from({ length: 99 }, (_, i) => i + 1);//.concat(Array.from({ length: 15 }, (_, i) => i + 85));
            let place = resolvePlace(plr, 'P');
            if (!place) return;

            // Save and return

            // For multiple 0
            if (object == '0') {
                object += getUniqueID();
            } else {
                object = 'O' + object;
            }

            Game.setDbItem(perso[0],  object, _for);
            Game.setDbItem('L'+place,  'P', perso[0].slice(1));
            return true;
        });
    },

    resolveObjects: (objReq, toGet='open') => {
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
                let [idx, cacheObject] = findInArr(db, 60, undefined, item => item[0] == 'O' + objectID);

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

                let perso = resolveGiver(cacheObject[0]);
                //HERE TODO CTN
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


            }

            return true;
        });
    },

    ranDoor: (room) => {
        let allDoors = Array.from({ length: miDb.NB_DOORS }, (_, i) => i + 1);
        let iniRoom = { ...room };
        return Game.getARandomItemAndRestore(allDoors, (doorID) => {
            let [idx, cacheDoor] = findInArr(db, miDb.LOC_DOORS[0], miDb.LOC_DOORS[1], item => item[0] == 'R' + doorID);
            if (!cacheDoor) {
                return;
            }
            // ### Check if door already used
            if (Game.searchIn(cacheDoor[0], 'open')) {
                return;
            }

            // ### Check if places avaible
            let placesRequired = cacheDoor[3].split(",");
            // ## Check if actual place is compatible with the door
            if (room['L']) {
                if (!placesRequired.includes(room['L'].toString())) return;
            } else {
                let place = resolvePlace(cacheDoor[3].split(','), 'R');
                if (!place) return;
                room['L'] = place;
                setArr('', place, 'Game.placesAdded');
            }

            // ### Check for objects required
            let objectID = resolveObjects(objectsReqFormat(cacheDoor[4]));
            if (!objectID) {
                return;
            }

            // Save and return
            setMyItems(cacheDoor[0], 'O' + objectID, 'OPEN');
            setDb(`[${idx}]`, 1);
            return true;
        }, () => { room = iniRoom; });
    },

    generate: () => {
        const len = Game.roomsPriority.length;
        for (let i = 0; i < len; i++) {
            setProgressBar(10 + (i / len) * 30);
            placesToBeAdded.push(i);
            const roomINT = Game.roomsPriority[i];
            const roomDoors = Game.getRoomDoors(roomINT);
            const room = Game.getRoom(roomINT);
            if (!roomDoors) continue;
            // TODO: roomDoors shuffle
            for (let j = 0; j < roomDoors.length; j++) {
                const doorRelative = roomDoors[j];
                try {
                    if (room['R'][doorRelative] != undefined) continue;
                } catch (e) { }
                let randomDoor = Game.ranDoor(room);
                log(`Door ${doorRelative} for ${placeINT} : ${randomDoor}`);
                if (randomDoor) {
                    Game.setDoor(doorRelative, placeARR, randomDoor);
                    Game.setDoor(-doorRelative, intToRoom(placeINT + doorRelative), randomDoor);
                }
            }
        }
    }

}


var GameJSLoaded = true;