


var Actions = {
    isToggleInit: false,

    init: () => {
        for (let j = 0; j < miDb.ROOMS_DEFAULT.length; j++) {
            const element = miDb.ROOMS_DEFAULT[j];
            Game.unlockedPlaces.push({ id: "0" + j, text: element });
        }
        miDb.ROOMS_UNLOCKED.forEach(roomINT => {
            const roomSTR = roomINT.toString();
            Game.unlockedPlaces.push({ id: roomSTR, text: Actions.roomStrToID(roomSTR) });
        });
        Actions.changeMode(3);
    },

    roomStrToID (roomSTR) {return `${miDb.ROOMS_LETTERS[parseInt(roomSTR[0]) - 1]}${parseInt(roomSTR[1]) + 1}`;},

    deprecated: () => { throw new Error("This function of Actions is deprecated."); },
    propose: () => { throw new Error("Actions.propose is deprecated. (Use toolBox)"); },

    random: () => {
        Game.timer += 1;
        Actions.changeMode(1);
        PlayersJS.next();
        let txt = "-- Résultat du dé --\n";
        txt += "( Tour de " + PlayersJS.getName() + " )\n";
        txt += "Vous pouvez bouger de ";
        txt += (randint(0, 2) + randint(0, 2));
        txt += " cases max.\nVous devez déplacer ";
        txt += randint(0, 1) ? "M. Le Directeur" : "le Surveillant";
        txt += " d'une case vers ";
        switch (randint(0, 6)) {
            case 0: txt += "la direction de votre choix"; break;
            case 1: txt += "le Nord (haut)"; break;
            case 2: txt += "l'Est (droite)"; break;
            case 3: txt += "le Sud (bas)"; break;
            case 4: txt += "l'Ouest (gauche)"; break;
            case 5: txt += "le HALL"; break;
            case 6: txt += "E4"; break;
        }
        txt += ".";
        alert(txt);
    },

    changeRoom: () => {
        MChat.clearConv();
        Modal.changeTitle(`Il est ${miDb.TIMER[0]}h${Math.floor(Game.timer / miDb.TIMER[1] * 60)}min`);
        MSelect.options = [...Game.unlockedPlaces];
        MSelect.empty = 'Aucune destination n\'est disponible.';

        MSelect.select = (sid, txt) => {
            Actions.changeMode(2);
            Game.timer += 1;
            Actions.setRoomTxt(txt);
            showRoom(sid);
            Modal.close();
        };
        MSelect.create();
    },

    setRoomTxt: (text) => {
        document.getElementById('roomSelect').innerHTML = text;
    },

    toolBox: async () => {
        MChat.clearConv();
        MSelect.options = [
            { id: 'save', text: 'Sauvegarder' },
            { id: 'load', text: 'Charger' },
            { id: 'thisIsTheEvil', text: '--------------' },
            { id: 'search', text: 'Chercher ici' }
        ];
        let push = (itemID) => {
            console.log('Vérification du type');

            let type = itemID[0];
            if (type == 'R') {
                if (Game.db[itemID].opened) return;
                if (miBasic.keywords['U' + itemID]) type = 'O';
                else if (miBasic.keywords['P' + itemID]) type = 'P';
                else return;
            } else {
                if (!miBasic.keywords[itemID]) return; // Normally fix #15
            }

            let actionTxt;
            if (type == 'O') actionTxt = 'Utiliser : ';
            else if (type == 'P') actionTxt = 'Parler à : ';

            MSelect.options.push({ id: (itemID[0] == 'R' ? type : '') + itemID, text: actionTxt + findInArr(miDb.lib, 0, undefined, (item) => item[0] === itemID)[1][1] });
        };
        // Add all actual items
        Game.actualItems.forEach((itemID) => { push(itemID) });
        // Add the inventory
        Object.keys(Game.db).forEach((itemID) => {
            if (itemID[0] !== 'O') return;
            if (Game.db[itemID].nb) push(itemID);
        });

        MSelect.select = (sid) => {
            Game.timer += 1;
            Actions.changeMode(3);
            console.log(sid);
            if (sid === 'search') Actions.search();
            else if (sid === 'save') Game.save();
            else if (sid === 'load') Game.load();
            else {
                Modal.switch('chat');
                miBasic.run(sid);
            }
        };
        MSelect.create();
    },

    changeMode: (mode) => {
        document.querySelectorAll('.action2').forEach((el) => {
            el.disabled = (mode > 1);
        });
        document.querySelectorAll('.action3').forEach((el) => {
            el.disabled = (mode == 3);
        });
    },

    showOptions: () => { Actions.deprecated(); },

    toggle: (OnOff) => {
        Actions.deprecated();
        if (!Actions.isToggleInit) {
            Actions.isToggleInit = true;
            PlayersJS.change.push(() => {
                Actions.toggle(true);
            });
        }
        document.querySelectorAll('.actionBtn').forEach((el) => {
            el.disabled = !OnOff;
        });
        // document.getElementById('action' + id).setAttribute('disabled', !OnOff);
    },

    use: () => { throw new Error("This function is deprecated."); },
    speach: () => { throw new Error("This function is deprecated."); },
    search: () => {
        console.log('Seaching..');
        MChat.clearConv();
        MSelect.options = [];
        MSelect.empty = miDb.MSG_No_UseSpchSrch[2];
        let actualPlaceObjs;
        try {
            actualPlaceObjs = Game.db[
                findInArr(Game.actualItems, 0, undefined, item => item[0] == 'L')[1]
            ];
            Object.keys(actualPlaceObjs).forEach((key) => {
                console.log('Find', key);
                if (key.startsWith('0')) {
                    actualPlaceObjs[key].forEach((item) => {
                        item.split('&').forEach((getID) => {
                            let txt = miDb.lib.find(e => e[0] == getID)[1];
                            MSelect.options.push({ id: getID, text: txt });
                        });
                    });
                }
            });
        } catch (e) {
            console.log('Location error for search: ', e);
        }
        MSelect.create();
        MSelect.select = (sid, stxt) => {
            if (!actualPlaceObjs) return;
            console.log('Choiced: ' + sid);
            // Bugfix: with 0 directly
            // delete actualPlaceObjs[Object.keys(actualPlaceObjs).find(key => actualPlaceObjs[key] === sid)];
            delOneItem(actualPlaceObjs[0], sid);

            Game.getObject(sid);
            Modal.switch('chat');
            MChat.addText(miDb.TXT_GET[1] + stxt);
        };
    },

    save: () => {
        Actions.deprecated();
        console.log('Saving..');
        MChat.clearConv();
        MSelect.options = [
            { id: 'save', text: 'Sauvegarder' },
            { id: 'load', text: 'Charger' }
        ];
        MSelect.create();
        MSelect.select = (sid) => {
            if (sid === 'save') {
                Game.save();
            } else if (sid === 'load') {
                Game.load();
            }
        };
    }
};


var RoomSelect = {
    deprecated: () => {
        throw new Error("RoomSelect is deprecated.");
    },
    init: () => {
        RoomSelect.deprecated();

        RoomSelect.HTMLE = document.getElementById("current-room");
        RoomSelect.setEvents();
        RoomSelect.setDefault();
        PlayersJS.change.push(() => {
            document.getElementById('timerOption').innerHTML = 'Il est ' + Math.round(timer / miDb.TIMER[0]) + 'h';
        });
    },

    getVal: () => {
        RoomSelect.deprecated();
        return RoomSelect.HTMLE.value;
    },

    setVal: (val) => {
        RoomSelect.deprecated();
        RoomSelect.HTMLE.value = val;
    },

    roomIntToID: (roomINT) => {
        RoomSelect.deprecated();
        roomINT = roomINT.toString();
        // return miDb.ROOMS_LETTERS[parseInt(roomINT[0]) - 1] + roomINT.slice(1);
        return `${miDb.ROOMS_LETTERS[parseInt(roomINT[0]) - 1]}${parseInt(roomINT[1]) + 1}`
    },

    setDefault: () => {
        RoomSelect.deprecated();

        let currentRoom_HTML = '<option value="OFF" id="timerOption">Destinations possibles:</option>';
        for (let j = 0; j < miDb.ROOMS_DEFAULT.length; j++) {
            const element = miDb.ROOMS_DEFAULT[j];
            currentRoom_HTML += `<option value="0${j}">${element}</option>`;
        }
        miDb.ROOMS_UNLOCKED.forEach(roomINT => {
            currentRoom_HTML += `<option value="${roomINT}">${RoomSelect.roomIntToID(roomINT)}</option>`;
        });
        RoomSelect.HTMLE.innerHTML = currentRoom_HTML;
        RoomSelect.setVal('OFF');

    },

    setEvents: () => {
        RoomSelect.deprecated();
        RoomSelect.HTMLE.addEventListener("change", function () {
            if (this.value != "OFF") {
                PlayersJS.next();
                showRoom(RoomSelect.getVal());
                // showRoom(this.value.split(";").map(Number));
                wait(() => !RoomSelect.isMouseOver, 200, 10 ** 9).then(() => { wait(() => RoomSelect.isMouseOver, 200, 10 ** 9).then(() => RoomSelect.setVal("OFF")) });
            }
        });

        RoomSelect.HTMLE.addEventListener('mouseenter', () => {
            RoomSelect.isMouseOver = true;
        });

        RoomSelect.HTMLE.addEventListener('mouseleave', () => {
            RoomSelect.isMouseOver = false;
        });
    }
};



var ButtonsJSLoaded = true;
