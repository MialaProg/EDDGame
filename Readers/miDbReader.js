
var miDb = {
    initLib: async () => {
        let data = await getDb("./DB/items.miDb");
        miDb.lib = data.trim().split("\n").map(row => row.split(";"));
        miDb.libLoaded = true;
    },

    constNb: 0,
    constMax: 1,

    constLoaded: () => {
        return wait(() => miDb.constNb >= miDb.constMax);
    },

    // Gestion des variables global venant de const.miDb
    initConst: async () => {
        let data = await getDb("DB/gameConst.miDb");
        if (!data) {
            console.error("Error fetching const data.");
            return;
        }
        data = data.split("\n");
        for (let i = 0; i < data.length; i++) {
            const line = data[i];
            // if (line.includes("#ROOMS")) {
            //     let currentRoom_HTML = '<option value="OFF">Destinations possibles:</option>';
            //     i += 1;
            //     let r = data[i].split(";");
            //     for (let j = 0; j < r.length; j++) {
            //         const element = r[j];
            //         currentRoom_HTML += `<option value="0;${j}">${element}</option>`;
            //     }
            //     i += 1;
            //     r = data[i].split(":");
            //     currentRoom_HTML += `<option value="${r[1][0]};${r[1][1]}">${r[0]}</option>`;
            //     i += 1;
            //     let starting_room = data[i];
            //     startRoom = starting_room.split(";").map(Number);
            //     waitUntil(() => document.readyState === "complete", () => {
            //         let roomSelect = document.getElementById("current-room");
            //         if (roomSelect) {
            //             roomSelect.innerHTML = currentRoom_HTML;
            //             roomSelect.value = 'OFF';
            //             console.log('Starting room:', starting_room);
            //             initSelectRoom();
            //         } else {
            //             console.error("Room select element not found.");
            //         }
            //         miDb.constNb += 1;
            //     });
            //     console.log("Rooms created !")
            //     continue;
            // }

            miDb.constVars.forEach((varName) => {
                if (line.includes("#" + varName)) {
                    i += 1;
                    eval(`miDb.${varName} = data[i].split(";")`);
                    if (miDb.constNum.includes(varName)) {
                        eval(`miDb.${varName} = miDb.${varName}.map(Number)`);
                    }
                }
            });
        }
        miDb.constNb += 1;
        console.log("GameConst initied");
    }
};


// Avaible vars - Variables disponibles
miDb.constNum = ['NB_DOORS', 'LOC_DOORS', 'LOC_PERSO', 'LOC_PLACES', 'LOC_OBJS', 'LOC_LOADING'];
miDb.constVars = ['IMGS_PATH', 'START_ROOM', 'ROOMS_DEFAULT', 'ROOMS_LETTERS', 'ROOMS_UNLOCKED',
    'PRELOAD_IMG','MSG_No_UseSpchSrch','MIB_SCRIPT_PATH','SELECT_TXT_OBJ','SELECT_TXT_ON', 'TXT_GET'
].concat(miDb.constNum);
/* ['PLACES_LOC', 'DOORS_LOC', 'PERSO_LOC', 'OBJ_LOC', 'LOADING_LOC'],
constVars: ['ALPHABET'].concat(miDb.constNum), */










var MiDbReaderJSLoaded = true;