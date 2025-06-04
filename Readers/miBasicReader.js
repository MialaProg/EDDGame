
var miBasic = {
    keywords: {},
    location: 0,
    vars: {},
    showTxt: async () => { },
    choice: async (type, options) => { return 0; },
    openDoor: (door) => { },
    getObject: (obj) => { },

    init: async () => {
        let script = await getDb(miDb.MIB_SCRIPT_PATH);

        miBasic.script = script.split('\n').unshift(':STOP').unshift('#STOP');
        miBasic._scanScript();

        miBasic.isLoaded = true
    },

    /**
       * Scan script to build label index (called automatically)
       */
    _scanScript: () => {
        for (let i = 0; i < miBasic.script.length; i++) {
            const line = miBasic.script[i].trim();
            if (line.startsWith(':')) {
                miBasic.keywords[line.substring(1)] = i;
            }
        }
    },

    goTo: (key) => {
        let lineNum = this.keywords[miBasic._getVal(key)];
        if (lineNum) {
            this.location = lineNum;
        }
    },

    _splitLine: (line, sep = ':') => {
        let parts = line.substring(1).split(sep);
        let command = parts[0].toLowerCase();
        return [parts, command];
    },

    _getVal: (code) => {
        if (code.startsWith('#')) {
            let [parts, cmd] = miBasic._splitLine(code, '-');
            switch (cmd) {
                case 'var':
                    return miBasic.vars[parts[1]];
                case 'js':
                    return eval(parts[1]);
            }
        }
        return code;
    },

    _readLine: () => {
        miBasic.location++;
        return miBasic.script[miBasic.location].trim();
    },

    run: async (from = miBasic.location) => {
        if (typeof from == 'string') {
            miBasic.goTo(from);
        } else {
            miBasic.location = from;
        }

        miBasic.running = true;
        while (miBasic.running) {
            if (miBasic.location >= miBasic.script.length) {
                console.warn("End of script reached.");
                miBasic.running = false;
                return;
            }

            let line = miBasic._readLine();

            if (line.startsWith(':')) {
                // Label => continue
                continue;
            }

            if (line.startsWith('#')) {
                let [parts, command] = miBasic._splitLine(line);

                switch (command) {
                    case '':
                        let options = [];
                        let type = parts[1];
                        let line = miBasic._readLine();
                        while (!line.startsWith('#')) {
                            line = line.split(':');
                            options.push(line);
                            line = miBasic._readLine();
                        }
                        let resultID = await this.choice(type, options);
                        miBasic.goTo(resultID);
                        break;
                    case 'stop':
                        miBasic.running = false;
                        break;
                    case 'open':
                        miBasic.openDoor(miBasic._getVal(parts[1]));
                        break;
                    case 'get':
                        miBasic.getObject(miBasic._getVal(parts[1]));
                        break;
                    case 'set':
                        miBasic.vars[parts[1]] = miBasic._getVal(parts[2]);
                        break;
                    case 'if':
                        let condition = parts[1];
                        let goTo = parts[2];
                        if (miBasic._getVal(condition)) miBasic.goTo(goTo);
                        break;
                    case 'goto':
                        let label = parts[1];
                        miBasic.goTo(label);
                        break;
                    default:
                        console.log(`miB: ${miBasic._getVal('#'+command)}`);

                }
                continue;

            }

            // If we reach here, it's a normal text output
            await miDb.showTxt(line);

        }
    }
}

var r;
var miBexemple = ()=>{
    miBasic.showTxt = async (text) => {
        console.log(`Text: ${text}`);
    };

    miBasic.choice = async (type, options) => {
        console.log(`Choice Type: ${type}`);
        console.log("Options:");
        options.forEach((option) => {
            console.log(`${option[0]}: ${option[1]}`);
        });
        
        r = undefined;
        console.log('r=(your choice here)');
        await wait(() => r !== undefined, 1000);
        return r;
    };

    miBasic.openDoor = (door) => {
        console.log(`Door opened: ${door}`);
    };

    miBasic.getObject = (obj) => {
        console.log(`Object obtained: ${obj}`);
    };

    miBasic.run(':START');
    miBasic.goTo('STOP');
    miBasic.run();
};




var MiBasicReaderJSLoaded = true;