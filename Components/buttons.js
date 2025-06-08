
var RoomSelect = {
    init: () => {
        RoomSelect.HTMLE = document.getElementById("current-room");
        RoomSelect.setEvents();
        RoomSelect.setDefault();
    },

    getVal: () => {
        return RoomSelect.HTMLE.value;
    },

    setVal: (val) => {
        RoomSelect.HTMLE.value = val;
    },

    roomIntToID: (roomINT) => {
        roomINT = roomINT.toString();
        // return miDb.ROOMS_LETTERS[parseInt(roomINT[0]) - 1] + roomINT.slice(1);
        return `${miDb.ROOMS_LETTERS[parseInt(roomINT[0]) - 1]}${parseInt(roomINT[1]) + 1}`
    },

    setDefault: () => {

        let currentRoom_HTML = '<option value="OFF">Destinations possibles:</option>';
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
        RoomSelect.HTMLE.addEventListener("change", function () {
            if (this.value != "OFF") {
                PlayersJS.next();
                //TODO
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


var Actions = {
    isToggleInit: false,

    propose: (type, prefix) => {
        MChat.clearConv();
        MSelect.options = [];
        let push = (itemID) => {
            console.log('Vérification du type');
            if (itemID[0] !== type) {
                if (itemID[0] !== 'R') return;
                console.log('Verification de la compatibilité', miBasic.keywords[prefix + itemID]);
                if (!miBasic.keywords[prefix + itemID]) return;
                if (Game.db[itemID].opened) return;
            }
            MSelect.options.push({ id: (itemID[0] == 'R' ? prefix : '') + itemID, text: findInArr(miDb.lib, 0, undefined, (item) => item[0] === itemID)[1][1] });
        };
        Game.actualItems.forEach((itemID) => { push(itemID) });
        if (type === 'O') {
            Object.keys(Game.db).forEach((itemID) => {
                if (itemID[0] !== type) return;
                if (Game.db[itemID].nb) push(itemID);
            })
        };
    },

    showOptions: async (id) => {
        MSelect.empty = miDb.MSG_No_UseSpchSrch[id];
        MSelect.select = (sid) => {
            console.log(sid);
            Modal.switch('chat');
            miBasic.run(sid);
        };
        MSelect.create();
    },

    toggle: (id, OnOff) => {
        console.log('Toggle', OnOff);
        if (!Actions.isToggleInit) {
            Actions.isToggleInit = true;
            PlayersJS.change.push(() => {
                Actions.toggle('', true);
            });
        }
        document.querySelectorAll('.actionBtn').forEach((el) => {
            el.disabled = !OnOff;
        });
        // document.getElementById('action' + id).setAttribute('disabled', !OnOff);
    },

    use: () => {
        Actions.propose('O', 'U');
        Actions.showOptions(0);
        Actions.toggle('Use', false);
    },
    speach: () => {
        Actions.propose('P', 'P');
        Actions.showOptions(1);
        Actions.toggle('Speach', false);
    },
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
                    let getID = actualPlaceObjs[key];
                    // if ((getID == 'O21' || !myItems[getID]['unlocked'])) { // && !addChoice(getID) (Retiré car noisettes)
                    let txt = miDb.lib.find(e => e[0] == getID)[1];
                    MSelect.options.push({ id: getID, text: txt });
                }
            });
        } catch (e) {
            console.log('Location error for search:', e);
        }
        MSelect.create();
        MSelect.select = (sid, stxt) => {
            if (!actualPlaceObjs) return;
            console.log('Choiced: ' + sid);
            delete actualPlaceObjs[Object.keys(actualPlaceObjs).find(key => actualPlaceObjs[key] === sid)];
            Game.getObject(sid);
            Modal.switch('chat');
            MChat.addText(miDb.TXT_GET[1] + stxt);
        };

        Actions.toggle('Search', false);
    },
};














var ButtonsJSLoaded = true;