
var miDb = {
    initLib: async () => {
        let data = await getDb("DB/items.miDb");
        miDb.lib = data.trim().split("\n").map(row => row.split(";"));
    },

    constNb: 0,
    constMax: 2,

    const: async () => {
        await wait(() => miDb.constNb >= miDb.constMax);
    },

    // Gestion des variables global venant de const.miDb
    initConst: async () => {
        let data = await getDb("DB/gameConst.miDb");
        if (!data) {
            console.error("Error fetching const data.");
            return;
        }
        data = data.trim().split("\n");
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
            //             log('Starting room:', starting_room);
            //             initSelectRoom();
            //         } else {
            //             console.error("Room select element not found.");
            //         }
            //         miDb.constNb += 1;
            //     });
            //     log("Rooms created !")
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
        log("GameConst initied");
    }
};



miDb.constNum = ['NB_DOORS', 'LOC_DOORS', 'LOC_PERSO'];
miDb.constVars = [].concat(miDb.constNum);
/* ['PLACES_LOC', 'DOORS_LOC', 'PERSO_LOC', 'OBJ_LOC', 'LOADING_LOC'],
constVars: ['ALPHABET'].concat(miDb.constNum), */










var miDbReaderLoaded = true;