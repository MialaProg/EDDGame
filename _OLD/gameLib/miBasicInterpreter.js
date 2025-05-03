//V1-EDDG

/** Basic script interpreter for custom command processing (e.g., #OPEN, #GET, #CHOICE)
 * @class
 */
class miBasicInterpreter {
    /**
   * Create an interpreter instance
   * @constructor
   * @param {string} script - Script to interpret (automatically appends ':STOP\n#STOP')
   * @property {string[]} script - Script lines with stop markers
   * @property {number} location - Current execution line
   * @property {Array<Function>} funcs - Command handlers [open, get, choice, show]
   * @property {Object<string, number>} keywords - Label to line number mapping
   */
    constructor(script) {
        this.script = script.split('\n');
        this.script.unshift(':STOP');
        this.script.unshift('#STOP');
        this.location = 0;
        this.funcs = [
            (door) => { },
            (obj) => { },
            async (type, options) => { },
            async (txt) => { }
        ];
        this.keywords = {};
        this.vars = [];
        this._scanScript();
    }

    /**
       * Scan script to build label index (called automatically)
       * @private
       */
    _scanScript() {
        for (let i = 0; i < this.script.length; i++) {
            const line = this.script[i].trim();
            if (line.startsWith(':')) {
                this.keywords[line.substring(1)] = i;
            }
        }
    }

    /**
  * Bind custom handler to command
  * @param {(string|number)} name - Command name or index ('open'|0, 'get'|1, 'choice'|2, 'show'|3)
  * @param {Function} func - Handler function
  * @throws {Error} For invalid command names
  * @example
  * setFunc('open', (door) => console.log(`Opening ${door}`))
  */
    setFunc(name, func) {
        if (typeof name == 'string') {
            switch (name) {
                case 'open':
                    name = 0;
                    break;
                case 'get':
                    name = 1;
                    break;
                case 'choice':
                    name = 2;
                    break;
                case 'show':
                    name = 3;
                    break;
            }
        }
        if (typeof name == 'number') {
            this.funcs[name] = func;
        } else {
            throw new Error('Invalid function name (open/get/choice/show)');
        }
    }

    /**
   * Read current line and advance pointer
   * @param {boolean} [reload=false] - Unused parameter
   * @returns {string} Current line or #STOP
   */
    readLine(reload = false) {
        if (this.location > this.script.length) {
            return '#STOP';
        }
        let line = this.script[this.location].trim();
        this.location += 1;
        return line;
    }

    /**
   * Jump to label position
   * @param {string} key - Label name (without ':')
   */
    goTo(key) {
        let lineNum = this.keywords[key];
        if (lineNum) {
            this.location = lineNum;
        }
    }

    /**
   * Execute script from specified position
   * @param {(number|string)} [from=this.location] - Start line number or label
   * @async
   * @example
   * run('START') // Start from :START label
   */
    async run(from = this.location) {
        if (typeof from == 'string') {
            // from = this.script.findIndex(line => line.startsWith(':' + from)) + 1;
            this.goTo(from);
        } else {
            this.location = from;
        }
        let line = this.readLine();

        if (line.startsWith('#')) {
            line = line.substring(1).split(':');
            switch (line[0]) {
                case 'OPEN':
                    this.funcs[0](line[1]);
                    break;
                case 'GET':
                    this.funcs[1](line[1]);
                    break;
                case 'OBJ':
                case 'ON':
                case 'REP':
                    let options = [];
                    let type = line[0];
                    line = this.readLine();
                    while (!line.startsWith('#')) {
                        line = line.split(':');
                        options.push(line);
                        line = this.readLine();
                    }
                    await this.funcs[2](type, options);
                case 'STOP':
                    return;
                case 'IF':
                    let condition = line[1];
                    let goTo = line[2];
                    if (eval(condition)) {
                        this.goTo(goTo);
                    }
                    break;
                case 'GOTO':
                    let label = line[1];
                    this.goTo(label);
                    break;
                case 'SAVE':
                    this.vars.push(line[1]);
                    break;
                case 'VAR':
                    if (this.vars.includes(line[1])){
                        this.goTo(line[2]);
                    }

            }

            await this.run();
            return;
        }
        if (line.startsWith(':')) {
            await this.run();
            return;
        }

        await this.funcs[3](line);
        await this.run();
        return;

    }
}

// Command Reference (as JS comments)
/*
# Command       | Parameters          | Handler
#----------------------------------------------------------------
# OPEN          | [door]              | funcs[0](door)
# GET           | [obj]               | funcs[1](obj)
# OBJ/ON/REP    | [options...]        | funcs[2](type, options)
# IF            | [condition]:[label] | Conditional jump
# GOTO          | [label]             | Unconditional jump
# STOP          | -                   | Ends execution
*/

/**
 * Example usage
 * @example
 * const interpreter = new miBasicInterpreter(`
 *   :START
 *   #OPEN:door1
 *   Welcome! Choose an option.
 *   #OBJ
 *   Option 1:Label1
 *   Option 2:Label2
 *   #STOP
 * `);
 * 
 * interpreter.setFunc('open', (door) => console.log(door));
 * interpreter.run('START');
 */

var miBasicInterpreterLoaded = true;