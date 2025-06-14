var UNIQUEID = Math.floor(Date.now() / (10000)) - 170000000;

function nothing() { }

var logs = [];
var logsIdx = '';

function logOpen(catName) {
    // log ('-----------');
    logsIdx += '[' + (eval('logs' + logsIdx).push([catName]) - 1) + ']';
    // console.log(logsIdx);
}

function log(...args) {
    if (args.length === 1) {
        args = args[0];
    } else {
        args.push('(val)');
    }
    eval('logs' + logsIdx).push(args);
}

function logClose() {
    let parts = logsIdx.split('[');
    parts.pop();
    logsIdx = parts.join('[');
    // console.log(logsIdx);
}

/**
 * Attend un nombre de secondes spécifié avant de résoudre la promesse
 * @param {number} waitMs - Nombre de milisecondes à attendre
 * @returns {Promise<void>} Promesse résolue après le délai
 * @throws {Error} Si le timeout est atteint (en cas d'intervalle/timeout modifiés)
 * 
 * @example
 * // Attendre 5 secondes
 * await waitTime(5000);
 */
function waitTime(waitMs) {
    // const startTime = Date.now();
    // const interval = Math.floor(waitMs / 3) + 1;
    // return wait(
    //     () => Date.now() - startTime >= waitMs,
    //     interval,
    //     5000 + waitMs * 3 // Timeout légèrement supérieur pour éviter les conflits
    // );
    return new Promise(resolve => setTimeout(resolve, waitMs))
}

// ## VARS
function noError(varName){
    let Var;
    try {
        Var = eval(varName);
    } catch (e) {}
    return Var;
}

// ## INT

function getUniqueID() {
    UNIQUEID += 1;
    return UNIQUEID;
}

function randint(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ## STRING

// Fonction de compression native (utilisant l'API Compression Streams)
async function compress(str) {
  const byteArray = new TextEncoder().encode(str);
  const cs = new CompressionStream('gzip');
  const writer = cs.writable.getWriter();
  writer.write(byteArray);
  writer.close();
  const compressed = await new Response(cs.readable).arrayBuffer();
  return String.fromCharCode(...new Uint8Array(compressed));
}

// Fonction de décompression native
async function decompress(compressedStr) {
  if (typeof compressedStr !== 'string') {
    throw new TypeError('compressedStr must be a string');
  }
  const bytes = new Uint8Array(Array.from(compressedStr).map(c => c.charCodeAt(0)));
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    }
  });
  const ds = new DecompressionStream('gzip');
  const decompressedStream = stream.pipeThrough(ds);
  const decompressed = await new Response(decompressedStream).arrayBuffer();
  return new TextDecoder().decode(decompressed);
}

// ## ARRAY

/**
 * Detect duplicates from an array
 * @param {array} Array 
 * @returns {bool}
 */
function hasDuplicates(arr) {
    return arr.some((item, index) => arr.indexOf(item) !== index);
}

/**
 * Chooses a random element from an array without repeating previous choices
 * @param {array} arr - The copy of array to choose from
 * @returns {any} - The chosen element
 */
function ranAndDel(arr) {
    let randomIndex = randint(0, arr.length - 1);
    let chosenElement = arr[randomIndex];
    arr.splice(randomIndex, 1); // Change arr even outside the func
    return chosenElement;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
}

/**
 * Find something in a part of an array
 * @param {*} arr 
 * @param {*} min 
 * @param {*} max 
 * @param {*} condition
 */
function findInArr(arr, min = 0, max = undefined, condition) {
    if (max === undefined || max >= arr.length) {
        max = arr.length - 1;
    }
    let i = min;
    while (i <= max) {
        if (condition(arr[i])) {
            return [i, arr[i]];
        }
        i++;
    }
    return [-1, undefined];
}

function getIndex(item, arr, min = 0, max = undefined) {
    let [idx, obj] = findInArr(arr, min, max, e => e === item);
    return idx;
}

function getARandomItem(arr, conditions, restoration = () => { }) {
    let usable = [...arr];
    let result = undefined;
    let first = true;
    while (!result && usable.length > 0) {
        if (first) {
            first = false;
        } else {
            restoration();
        }
        let item = ranAndDel(usable);
        if (conditions(item, usable)) {
            result = item;
        }
    }
    if (!result) {
        restoration();
    }
    return result;
}

// ## OBJ
function copy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// ## RESOLUTION UI UPDATE
function waitUIupdate() {
    return new Promise(resolve => {
      // Double raf pour s'assurer que le navigateur a fait son rendu
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  }

function runWithUIupdate(func) {
    return new Promise((resolve, reject) => {
      const execute = () => {
        try {
          // Exécute la fonction et récupère le résultat
          const result = func();
          
          // Utilise requestAnimationFrame pour la résolution
          requestAnimationFrame(() => {
            resolve(result);
          });
        } catch (error) {
          // Gère les erreurs avec requestAnimationFrame
          requestAnimationFrame(() => {
            reject(error);
          });
        }
      };
  
      // Lance l'exécution dans la file d'attente des tâches lourdes
      setTimeout(execute, 0);
    });
  }

// ## FETCH

async function getDb(path) {
    let data;
    await fetch(path)
        .then(response => response.text())
        .then(dt => {
            data = dt;
        })
        .catch(error => {
            console.error("Error fetching and parsing data:", error);
        });
    return data;
}


// ## URL
function checkIfUrlContains(keyword) {
    const currentUrl = window.location.href; // Récupère l'URL actuelle du navigateur
    if (currentUrl.includes(keyword)) {
        return true; // Retourne vrai si le mot-clé est trouvé
    } else {
        return false; // Retourne faux si le mot-clé n'est pas trouvé
    }
}


// ## PAGE
function scrollToInContainer(element, duration = 500, align = 'top', container = document.documentElement) {
    return new Promise((resolve) => {
        // Déterminer le conteneur de défilement (window ou élément DOM)
        const isWindowContainer = (
            container === document.documentElement || 
            container === document.body
        );
        
        // Calculer les dimensions et positions
        const containerHeight = isWindowContainer 
            ? window.innerHeight 
            : container.clientHeight;
        
        const elementRect = element.getBoundingClientRect();
        const containerRect = isWindowContainer
            ? { top: 0, bottom: window.innerHeight }
            : container.getBoundingClientRect();
        
        // Calculer la position cible
        let targetPosition;
        if (align === 'top') {
            targetPosition = elementRect.top - containerRect.top;
        } else if (align === 'bottom') {
            targetPosition = elementRect.bottom - containerRect.bottom + containerHeight;
        } else {
            throw new Error("L'alignement doit être 'top' ou 'bottom'");
        }
        
        // Ajouter le défilement actuel
        const currentScroll = isWindowContainer
            ? window.pageYOffset || document.documentElement.scrollTop
            : container.scrollTop;
        
        targetPosition += currentScroll;
        
        // Animation avec easing
        const startTime = performance.now();
        
        function animate(time) {
            const elapsed = time - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = easeInOutQuad(progress);
            
            const newPosition = currentScroll + (targetPosition - currentScroll) * ease;
            
            // Appliquer le défilement
            if (isWindowContainer) {
                window.scrollTo(0, newPosition);
            } else {
                container.scrollTop = newPosition;
            }
            
            // Continuer ou terminer l'animation
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        }
        
        requestAnimationFrame(animate);
    });
}

// Fonction d'easing pour animation fluide
function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}



var ToolsJSLoaded = true;