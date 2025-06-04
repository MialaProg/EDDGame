
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

    roomIntToID: (roomINT)=>{
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

    setEvents: ()=>{
        RoomSelect.HTMLE.addEventListener("change", function () {
            if (this.value != "OFF") {
                //TODO
                // nbActions += 1;
                // nbTours += 1;
                // actualPlayer = players[(nbTours - 1) % nbPlayers];
                // document.getElementById('loadingTitle').innerHTML = findInArr(miDb.lib, LOADING_LOC[0], undefined, (item) => item[1] === actualPlayer)[1][2];
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
    propose: (type, prefix) => {
        let push = (itemID)=>{
            // Vérification du type
            if (itemID[0] !== type){
                if (itemID[0] !== 'R') return;
                // Verification de la compatibilité
                if (miBasic.keywords[type + itemID]) return;
                if (Game.db[itemID].opened) return;
            }
            MSelect.options.push({id: itemID, text: findInArr(miDb.lib, 0, undefined, (item) => item[0] === itemID)[1]});
        };
        Game.actualItems.forEach((itemID) => {push(itemID)});
        if (type === 'O') {Object.keys(Game.db).forEach((itemID) => {
            if (itemID[0] !== type) return;
            if (Game.db[itemID].nb) push(itemID);
        })};
    },

    use: ()=>{
        Actions.propose('O', 'U');
    },
    speach: ()=>{
        Actions.propose('P', 'P');
    },
    search: ()=>{

    },
};














var ButtonsJSLoaded = true;