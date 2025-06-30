var Game = {

    rooms: [
        Array.from({ length: 11 }, (_, i) => ({ L: 87 + i })),
        Array(5).fill().map(() => ({})),
        Array(5).fill().map(() => ({})),
        Array(5).fill().map(() => ({})),
        Array(5).fill().map(() => ({}))
    ],

    roomsPriority: [
        40, 30, 41, 20, 31, 42, 32, 21, 22, 43, 33, 23, 44, 34, 24, 10, 11
    ],

    uselessRooms: [],

    doors: {
        10: [], 11: [],
        20: [1, 10], 21: [1, 10], 22: [1], 23: [1, 10], 24: [10],
        30: [1, 10], 31: [], 32: [1, 10], 33: [], 34: [10],
        40: [1], 41: [1], 42: [1], 43: [1], 44: []
    },

    // When loc req = *, not implemented everywhere
    allLocs: Array.from({ length: 99 }, (_, i) => i + 1),

    // For external save
    unlockedPlaces: [],
    timer: 0,
    level: 1,

    placesAdded: [99],
    placesDefault: [99],
    placesToBeAdded: [],
    numPlacesAvaible: 0,

    // For better perfs (ID inside)
    objToBeUnavaible: undefined,
    objUnavaibles: [],

    emptyPlaces: [], // Scan places will scan wich locations gives nothing


    db: {},
    // dbHistory: [],
    logPath: [],
    logs: [],

    toBeRestored: ['db', 'placesToBeAdded', 'placesAdded', 'logPath', 'numPlacesAvaible', ''],
    History: [],
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
            eval('emptyFn(' + val + ');');
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
    },

    // Simplification of setArr
    setArrBackup: (idx, val) => {
        try {
            val = JSON.stringify(val);

            Game.History.push([idx, JSON.stringify(eval('Game.' + idx))]);
            eval(`
        if (Array.isArray(Game.${idx})) {
            Game.${idx}.push(${val});
        } else {
            Game.${idx} = ${val};
        }
        `);
        } catch (e) {
            console.log('Error in setArrBackup:', idx, val);
            e.code = 'G83sAB';
            throwERR(e);
        }
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
            // console.log('restoreArr', arr);
            // console.log(e);
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

    // Set Game.db.item.prop to val and save
    , setDbItem: (ItemID, Prop, val) => {
        if (!Game.db[ItemID]) {
            Game.db[ItemID] = {};
        }
        Game.setArrBackup(`db.${ItemID}.${Prop}`, val);
    },

    pushDbItem: (ItemID, Prop, val) => {
        if (!Game.db[ItemID]) {
            Game.db[ItemID] = {};
        }
        if (!Game.db[ItemID][Prop]) {
            Game.db[ItemID][Prop] = [];
        }
        Game.setArrBackup(`db.${ItemID}['${Prop}']`, val);
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
        let entry = Object.entries(Game.db[obj]).find(([key, val]) => {
            try {
                return val.includes(value);
            } catch (e) {
                return false;
            }
        });
        if (!entry) {
            return [undefined, undefined];
        }
        return entry;
    },

    getObjForIn: (_in, obj) => {
        return Game.searchIn(_in, obj)[0];
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
                if (getterObj[req].includes(item)) Game.setArr(`['${getter}']['${req}']`, JSON.stringify(getterObj[req].filter(item2 => item !== item2)), 'Game.db');
            }
        }

    },

    /**
     * Parses the object requirements string from a game object and returns a formatted requirements object.
     *
     * The requirements string (obj[4]) is expected in the format:
     *   "req1|req2>objA&objB|objC,req3>objD"
     * which means:
     *   - req1 or req2 require objA and objB, or objC
     *   - req3 requires objD
     *
     * The returned object maps each requirement (e.g., req1, req2, req3) to an array of objects they require.
     *
     * Example:
     *   Input: obj[4] = "x&y|z>a&b|c"
     *   Output: {
     *     x&y: ["a&b", "c"],
     *     z: ["a&b", "c"]
     *   }
     *
     * @param {Array} obj - The game object array, where obj[4] is the requirements string.
     * @returns {Object} An object mapping requirement keys to arrays of objects they require.
     */
    objectsReqFormat: (obj) => {
        let objReq = obj[4];
        if (!objReq) return {};
        let objReqFormatted = {};
        objReq.split(',').forEach((e) => { // x&y|z>a&b|c
            let poss = e.split('>');
            let objsNF = poss[1].split('|');
            poss[0].split('|').forEach((reqs) => { // x&y ; z
                const inDb = Game.db[obj[0]];
                if (inDb && inDb[reqs]) return Game.logs.push('ORF-already:' + reqs); // Verify object giver isn't already used
                objReqFormatted[reqs] = [];
                objsNF.forEach((objs) => {
                    objReqFormatted[reqs].push(objs);
                });
            });
        });
        return objReqFormatted;
    },

    scanPlaces: () => {
        Game.emptyPlaces = [];
        findInArr(miDb.lib, miDb.LOC_PLACES[0], miDb.LOC_PLACES[1], item => {
            if (item[0][0] != 'L') return; // Not a place
            if (item[4] && item[4].trim() != '') return;
            const placeID = parseInt(item[0].slice(1));
            Game.emptyPlaces.push(placeID);
        })
    },

    placeChecks: (placeID, ToAdd) => {
        // Check if it can be used
        if (!Game.numPlacesAvaible) return Game.stopChain('L-FULL');

        placeID = parseInt(placeID);
        // Check if already added
        let Added = Game.placesAdded.includes(placeID);
        if ((ToAdd || !Game.placesDefault.includes(placeID)) && Added) {
            const local = Game.logPath.includes('L' + placeID);
            if (local) Game.objToBeUnavaible = undefined;
            return Game.stopChain('L-alreadyAdded (lcl:' + local);
        };

        if (!Added && !Game.placesToBeAdded.includes(placeID)) Game.setArr('', Game.numPlacesAvaible - 1, 'Game.numPlacesAvaible');
        Game.setArr('', placeID, 'Game.placesToBeAdded');

        return true;
    },

    resolvePlace: (plReq, type, ToAdd, checkEmpty = true) => {
        function checks(placeID) {
            Game.setArr('', 'L' + placeID, 'Game.logPath');

            // Check if it exist
            if (!miDb.lib.find(e => e[0] == 'L' + placeID)) return Game.stopChain('L-Not exist');

            // Check if already taken for typeof
            try {
                if (Game.db['L' + placeID][type]) {
                    Game.objToBeUnavaible = undefined;
                    return Game.stopChain('L-Already taken')
                };
            } catch (e) {
                if (!(e instanceof TypeError)) throw e;
            }

            if (!Game.placeChecks(placeID, ToAdd)) return Game.stopChain('L-No checks');

            return true;
        }
        // Priority to empty places
        if (checkEmpty) {
            const resultInEmptyPlaces = Game.getARandomItemAndRestore(plReq, (placeID) => {
                if (!Game.emptyPlaces.includes(parseInt(placeID))) return;
                return checks(placeID);
            });
            if (resultInEmptyPlaces) return resultInEmptyPlaces;
        }
        return Game.getARandomItemAndRestore(plReq, (placeID) => {
            if (Game.emptyPlaces.includes(parseInt(placeID))) return;
            return checks(placeID);
        });
    },

    resolveGiver: (_for) => {
        return Game.getARandomItemAndRestore(miDb.lib.slice(miDb.LOC_PERSO[0], miDb.LOC_PERSO[1]), (perso) => {
            // Check if it is a perso
            if (perso[0][0] != 'P') {
                return;
            }
            Game.setArr('', perso[0], 'Game.logPath');

            // Spec, TODO: add in gameconst
            if (perso[0] == 'P1' && players.includes('E')) return Game.stopChain('P-Efelant is in the tree');
            if (perso[0] == 'P2' && noError('noSnakeMode')) return Game.stopChain('P-NoSnakeMode');

            // Check if it is already used
            try {
                const oldPlace = Game.db[perso[0]].L;
                if (oldPlace) {
                    Game.setArr(`['L${oldPlace}'].P`, undefined, 'Game.db'); // Remove the place
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
            if (plr[0] == '*') plr = Game.allLocs;
            let place = Game.resolvePlace(plr, 'P');
            if (!place) return Game.stopChain('P-No Place');

            // Save and return

            // For multiple 0
            if (object == '0') {
                // object += getUniqueID(); // useless with push 
            } else {
                object = 'O' + object;
            }

            Game.pushDbItem(perso[0], object, _for);
            Game.setDbItem(perso[0], 'L', place);
            Game.setDbItem(perso[0], 'isUsefull', true);
            Game.setDbItem('L' + place, 'P', perso[0].slice(1));
            return true;
        });
    },

    getSearchGivesPatern: (toGetNum) => {
        // For optimisation:
        return new RegExp(`(?:^|&)${toGetNum}(?:$|&)`);
        // Next use with :
        // objReq = Game.objectsReqFormat(miDb.lib.find(e => e[0] == ''));
        // pattern = Game.getSearchGivesPatern('');
        // x = Object.keys(objReq).some((e) => {
        //     if (objReq[e].some(gives => pattern.test(gives))) return true;
        // });
    },

    resolveObjects: (objReq, toGet = 'open') => {
        const pattern = Game.getSearchGivesPatern(toGet);

        return Game.getARandomItemAndRestore(Object.keys(objReq), (e) => {
            // Check if it gives the toGet
            // if (!objReq[e].find((gives) => gives.split('&').includes(toGet))) return;
            if (!objReq[e].some(gives => pattern.test(gives))) return;

            const objectIDs = e.split('&');

            for (let i = 0; i < objectIDs.length; i++) {
                const objectID = objectIDs[i];

                // Check if no object is required 
                if (objectID == '0') {
                    Game.setArr('', '0', 'Game.logPath');
                    continue;
                }

                const objUID = 'O' + objectID;

                if (Game.logPath.includes(objUID)) return; // Avoid infinite loop
                Game.setArr('', objUID, 'Game.logPath');

                if (Game.objUnavaibles.includes(objectID)) return Game.stopChain('O-bj in UnA list');

                // Check if object already used  
                let [idx, cacheObject] = findInArr(miDb.lib, 60, undefined, item => item[0] == objUID);


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
                } catch (e) {
                    if (!(e instanceof TypeError)) throw e;
                }
                Game.setDbItem(cacheObject[0], 'exists', 'true');

                Game.objToBeUnavaible = objectID; // Save the object to be unavaible
                let perso = Game.resolveGiver(cacheObject[0]);
                if (!perso) {
                    // Check for location
                    let loc = Game.getARandomItemAndRestore(miDb.lib.slice(miDb.LOC_PLACES[0], miDb.LOC_PLACES[1]), (loc) => {
                        // Check if it is a loc
                        if (loc[0][0] != 'L') {
                            return;
                        }

                        Game.setArr('', loc[0], 'Game.logPath');

                        // Principe: si UnA change, vérifie que c'est pour de bonnes raisons
                        const isUnA = Game.objToBeUnavaible == objectID;
                        const checksOK = Game.placeChecks(loc[0].slice(1));
                        if (!checksOK) {
                            if (!isUnA || Game.objToBeUnavaible) return Game.stopChain('L-No placeChecks');
                            const objReq = Game.objectsReqFormat(loc);
                            const pattern = Game.getSearchGivesPatern(cacheObject[0].slice(1));
                            const thisPlaceGiveMe = Object.keys(objReq).some((e) => {
                                if (objReq[e].some(gives => pattern.test(gives))) return true;
                            });
                            if (!thisPlaceGiveMe) {
                                Game.objToBeUnavaible = objectID;
                                return Game.stopChain('L-No placeChecks, oTBU+');
                            }
                            return Game.stopChain('L-No placeChecks, oTBU-');
                        }

                        // Check if he give the object
                        const objReq = Game.objectsReqFormat(loc); //[4]
                        let object = Game.resolveObjects(objReq, cacheObject[0].slice(1));
                        if (!object) {
                            return Game.stopChain('L-No obj gives this');
                        }




                        // Save and return

                        // For multiple 0 (useless with push)
                        // if (object == '0') object += getUniqueID();
                        if (object != '0') object = 'O' + object;

                        Game.pushDbItem(loc[0], object, cacheObject[0]);
                        return true;
                    });
                    if (!loc) {
                        const isUnA = Game.objToBeUnavaible == objectID;
                        if (isUnA) Game.objUnavaibles.push(objectID);
                        return Game.stopChain('O-No Loc =>isUnA:' + isUnA);
                    }
                } // End if !perso

                Game.setDbItem(cacheObject[0], 'isUsefull', true);

            } // End for objectIDs

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
            Game.logs.push('=>R' + doorID + ' for RM' + roomIDX + ' <' + JSON.stringify(usable));

            // ### Check if door already used
            if (Game.searchIn(cacheDoor[0], 'OPEN')[0] !== undefined) return Game.stopChain('Already use');

            // ### Check if places avaible
            let placesRequired = cacheDoor[3].split(",");
            if (placesRequired[0] == '*') placesRequired = Game.allLocs;

            // ## Check if actual place is compatible with the door
            const room = Game.getRoom(roomIDX);
            let place = room['L'];
            if (place) {
                if (!placesRequired.includes(place.toString())) return Game.stopChain('R-Incompatible L' + place);
            } else {
                place = parseInt(Game.resolvePlace(placesRequired, 'R', true));
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
            // Game.stopChain('OK'); // For test all chaines
        }, () => { Game.setRoom(roomIDX, copy(iniRoom)); log('Reset room to', iniRoom); });
    },

    isGen: false,
    generate: async () => {
        if (Game.isGen) return;
        Game.isGen = true;

        // Setup the end room
        const end = Game.getRoom(miDb.END_ROOM[0]);
        end.L = 99;

        Game.scanPlaces();

        const len = Game.roomsPriority.length;
        const roomChecked = [];
        const coefLoading = 30 / (4 * len);
        for (let i = 0; i < len; i++) {
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
                if (!randint(0, 5)) continue; // 1/6 chance to skip door 
                if (Game.uselessRooms.includes(room) && !randint(0, 3)) continue; // Skip useless rooms (Pb#10)

                Loading.setProgressBar(10 + coefLoading * (4 * i + j), false); // 10 + ((4*i + j) / (len*4)) * 30 = 10 + 30/(4len)*(4i+j)
                await waitUIupdate();

                const doorRelative = roomDoors[j];
                // Search if door already set
                try { if (room.R[doorRelative]) continue; }
                catch (e) { /* No door set yet */ }

                const oroomINT = roomINT + doorRelative;
                if (Game.uselessRooms.includes(oroomINT) && !randint(0, 3)) continue; // Skip useless rooms (Pb#10)
                const oroomCoords = Game.intToCoords(oroomINT);
                // const oroom = Game.getRoom(oroomINT);

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
        Game.addUselessThings();
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

    addUselessThings: () => {
        var GameAvaiblePersos = [];
        miDb.lib.slice(miDb.LOC_PERSO[0], miDb.LOC_PERSO[1]).forEach(perso => {
            if (perso[0][0] == 'P' && !noError('Game.db[perso[0]].isUsefull')) {
                GameAvaiblePersos.push(perso);
            }
        })

        const allRooms = [...Game.roomsPriority].concat(
            Array.from({ length: Game.rooms[0].length }, (_, i) => ("0" + i))
        );
        shuffleArray(allRooms).forEach((roomINT) => {
            // for (let i = 0; i < 4; i++) {
            //     for (let j = 0; j < 6; j++) {
            const room = Game.getRoom(roomINT);
            // Check for places
            if (!room['L']) {
                Game.getARandomItemAndRestore(miDb.lib.slice(miDb.LOC_PLACES[0], miDb.LOC_PLACES[1]), (loc) => {
                    if (!randint(0, 5) || loc[0][0] != 'L') return; // 16% chance to skip useless place
                    let locID = parseInt(loc[0].slice(1));
                    if (isNaN(locID) || Game.placesAdded.includes(locID)) {
                        return;
                    }
                    Game.placesAdded.push(locID);
                    room['L'] = locID;
                    Game.logs.push('UlA- Add useless loc ' + locID + ' to room ' +roomINT);
                    return true;
                });
            }
            // Check for objects in place
            if (!room['L']) return; // continue;
            const locUID = 'L' + room['L'];
            const loc = findInArr(miDb.lib, miDb.LOC_PLACES[0], miDb.LOC_PLACES[1], item => item[0] == locUID);
            const objs = Game.objectsReqFormat(loc);
            Object.entries(objs).forEach(([req, objArr]) => {
                if (req[0] == '0') { // If no req
                    objArr.forEach((objs) => {
                        objs.forEach((obj) => {
                            if (!randint(0, 2)) return; // 33% chance to skip useless object
                            try {
                                const id = 'O' + obj;
                                if (!Game.db[id].isUsefull) {
                                    Game.pushDbItem(loc[0], '0', id);
                                    Game.logs.push('UlA- Add useless object ' + id + ' to ' + loc[0]);
                                }
                            } catch (e) { }
                        });
                    });
                }
            });

            // Check for perso 
            let locObj = Game.db[locUID];
            if (!locObj) locObj = Game.db[locUID] = {};
            if (!locObj['P']) {
                getARandomItem(GameAvaiblePersos, (perso) => {
                    if (!randint(0, 3)) return; // 25% chance to skip useless perso
                    // Check places required
                    let plr = perso[3].split(',');
                    if (plr.includes(room['L']) || plr[0] == '*') {
                        // Save and return
                        Game.setDbItem(perso[0], 'L', room['L']);
                        Game.pushDbItem(locUID, perso[0], 'P');
                        Game.logs.push('Add useless perso ' + perso[0] + ' to ' + locUID);
                        GameAvaiblePersos = GameAvaiblePersos.filter(p => p[0] !== perso[0]);
                        return true;
                    }
                    return;
                });
            }

            // Check for object in perso
            if (!locObj['P']) return; // continue;
            const persoUID = 'L' + locObj['P'];
            const perso = findInArr(miDb.lib, miDb.LOC_PERSO[0], miDb.LOC_PERSO[1], item => item[0] == persoUID);
            const objsP = Game.objectsReqFormat(perso);
            Object.entries(objsP).forEach(([req, objArr]) => {
                if (req[0] == '0') { // If no req
                    objArr.forEach((objs) => {
                        objs.forEach((obj) => {
                            if (!randint(0, 2)) return; // 33% chance to skip useless object
                            try {
                                const id = 'O' + obj;
                                if (!Game.db[id].isUsefull) {
                                    Game.pushDbItem(perso[0], '0', id);
                                    Game.logs.push('UlA- Add useless object ' + id + ' to ' + perso[0]);
                                }
                            } catch (e) { }
                        });
                    });
                }
            });
            //     }
            // }
        });

    },

    getObject: (obj) => {
        if (!Game.db[obj]) Game.db[obj] = {};
        if (!Game.db[obj].nb) Game.db[obj].nb = 0;
        Game.db[obj].nb += 1;
    },

    useObject: (obj) => {
        if ('0' != findInArr(miDb.lib, miDb.LOC_OBJS[0], miDb.LOC_OBJS[1], item => item[0] == obj)[1][2]) Game.db[obj].nb -= 1;
    },


    // Sauvegarde (JSON + compression)
    save: async () => {
        const blob = new Blob([await compress(JSON.stringify(Game))], { type: 'application/octet-stream' });
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
                showRoom(Game.actualRoom);
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