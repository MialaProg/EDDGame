
var miBasic = {
    keywords: {},
    location: 0,
    vars: {},
    showTxt: async (text) => { },
    choice: async (type, options) => { return 0; },
    openDoor: (door) => { },
    getObject: (obj) => { },

    init: async (path = miDb.MIB_SCRIPT_PATH) => {
        let script = await getDb(path);

        script = script.split('\n');
        script.unshift(':STOP');
        script.unshift('#STOP');

        miBasic.script = script;
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
        let lineNum = miBasic.keywords[miBasic._getVal(key)];
        if (lineNum) {
            miBasic.location = lineNum;
        }
    },

    _splitLine: (line, sep = ':') => {
        let parts = line.substring(1).split(sep);
        let command = parts[0].toLowerCase();
        return [parts, command];
    },

    _getVal: (code) => {
        code = code.toString().trim();
        if (code.startsWith('#')) {
            let [parts, cmd] = miBasic._splitLine(code, '-');
            switch (cmd) {
                case 'var':
                    let val =  miBasic.vars[parts[1]];
                    if (isNaN(parseInt(val))) return val;
                    return parseInt(val);
                case 'js':
                    return eval(parts[1]);
            }
        }
        return code;
    },

    _readLine: () => {
        miBasic.location++;
        let line = miBasic.script[miBasic.location].trim();
        // console.log(line);
        return line;
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
                        let resultID = await miBasic.choice(type, options);
                        console.log('Item choiced:',resultID);
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
                        let val = miBasic._getVal(parts[2]);
                        if (val == '') val = true; // Default to true if empty
                        miBasic.vars[parts[1]] = val;
                        break;
                    case 'if':
                        let var1 = parts[1];
                        let var2 = parts[2];
                        var2 = (var2 == '') ? true : miBasic._getVal(var2);
                        let goTo = parts[3];
                        if (miBasic._getVal(var1) == var2) miBasic.goTo(goTo);
                        break;
                    case 'goto':
                        let label = parts[1];
                        miBasic.goTo(label);
                        break;
                    default:
                        console.log(`miB: ${miBasic._getVal('#' + command)}`);

                }
                continue;

            }

            // If we reach here, it's a normal text output
            await miBasic.showTxt(line);

        }
    }
}

var r;
var miBexemple = () => {
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
};




var MiBasicReaderJSLoaded = true;