// Miala Canvas Library, V0-EDDG
/**
 * Dessine un rectangle avec options de style
 * @param {string} canvasId - ID du canvas
 * @param {number} x - Position X
 * @param {number} y - Position Y
 * @param {number} w - Largeur
 * @param {number} h - Hauteur
 * @param {string} [fillColor] - Couleur de remplissage (optionnel)
 * @param {string} [strokeColor] - Couleur du contour (optionnel)
 * @param {number} [lineWidth=1] - Épaisseur du contour (optionnel)
 */
function drawRect(canvasId, x, y, w, h, fillColor, strokeColor, lineWidth = 1) {
        const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    x *= canvas.width / 100;
    y *= canvas.height / 100;
    w *= canvas.width / 100;
    h *= canvas.height / 100;

    const ctx = canvas.getContext('2d');

    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
    }

    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.strokeRect(x, y, w, h);
    }
}


/**
 * Dessine une flèche sur un canvas HTML
 * @param {string} canvasId - ID de l'élément canvas
 * @param {number} x - Position X de départ de la flèche
 * @param {number} y - Position Y de départ de la flèche
 * @param {number} w - Largeur totale (pour droite/gauche) ou hauteur de la pointe (pour haut/bas)
 * @param {number} h - Hauteur de la pointe (pour droite/gauche) ou largeur totale (pour haut/bas)
 * @param {'right'|'left'|'up'|'down'} dir - Direction de la flèche
 * @returns {void}
 * @example
 * // Dessine une flèche vers la droite
 * drawArrow('myCanvas', 50, 50, 100, 20, 'right');
 */
function drawArrow(canvasId, x, y, w, h, dir) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    x *= canvas.width / 100;
    y *= canvas.height / 100;
    w *= canvas.width / 100;
    h *= canvas.height / 100;

    const ctx = canvas.getContext('2d');

    // Définir la couleur noire pour le contour et le remplissage
    ctx.strokeStyle = 'black';
    ctx.fillStyle = 'black';
    ctx.lineWidth = 10;


    // Dessine la ligne de la flèche
    ctx.beginPath();
    switch(dir) {
        case 'right':
            ctx.moveTo(x, y);
            ctx.lineTo(x + w - h, y);
            break;
        case 'left':
            ctx.moveTo(x + h, y);
            // ctx.lineTo(x, y);
            ctx.lineTo(x + w, y);
            break;
        case 'up':
            ctx.moveTo(x, y + h - w);
            ctx.lineTo(x, y);
            break;
        case 'down':
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + h - w);
            break;
        default:
            console.error('Direction invalide');
            return;
    }
    ctx.stroke();

    // Dessine la pointe de la flèche (remplie)
    ctx.beginPath();
    switch(dir) {
        case 'right':
            ctx.moveTo(x + w - h, y - h/2);
            ctx.lineTo(x + w, y);
            ctx.lineTo(x + w - h, y + h/2);
            break;
        case 'left':
            ctx.moveTo(x + h, y - h/2);
            ctx.lineTo(x, y);
            ctx.lineTo(x + h, y + h/2);
            break;
        case 'up':
            ctx.moveTo(x - w/2, y + w);
            ctx.lineTo(x, y);
            ctx.lineTo(x + w/2, y + w);
            break;
        case 'down':
            ctx.moveTo(x - w/2, y + h - w);
            ctx.lineTo(x, y + h);
            ctx.lineTo(x + w/2, y + h - w);
            break;
    }
    ctx.closePath();
    ctx.fill();

}

/**
 * Set the background color of the canvas and remove all
 * @param {HTMLCanvasElement} canvas - The canvas element to set the background color for
 * @param {string} color - The color to set the background to (e.g., "red", "#ff0000")
 * @returns {void}
 */
function setBg(canvasId, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error("Canvas element not found.");
        return;
    }
    if (canvas.getContext) {
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        console.error("Canvas not supported in this browser.");
    }
}

/**
 * Dessine une image sur un canvas avec des paramètres de position et de taille personnalisables.
 * @param {string} imgID - Le nom de l'image png à dessiner.
 * @param {number} [x=0] - Position horizontale (en pixels) sur le canvas où dessiner l'image.
 * @param {number} [y=0] - Position verticale (en pixels) sur le canvas où dessiner l'image.
 * @param {number} [w=100] - Largeur (en pixels) de l'image dessinée.
 * @param {number} [h=100] - Hauteur (en pixels) de l'image dessinée.
 * @param {string} [canvasID=_canvasID] - L'ID du canvas (HTMLCanvasElement) cible. Par défaut utilise une variable globale _canvasID.
 * @example
 * // Dessine une image avec les paramètres par défaut
 * drawImage('myImage');
 * 
 * // Dessine une image à la position (50,50) avec taille 200x150
 * drawImage('myImage', 50, 50, 200, 150);
 */
function drawImage(imgID, x = 0, y = 0, w = 100, h = 100, canvasID=_canvasID, rounded=true) {
    try {
        const canvas = document.getElementById(_canvasID);
        if (!canvas) {
            console.error("Canvas element not found.");
            return;
        }
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            console.error("Canvas not supported in this browser.");
            alert("Votre navigateur web ne supporte pas l'élément canvas.");
            return;
        }

        x *= canvas.width / 100;
        y *= canvas.height / 100;
        w *= canvas.width / 100;
        h *= canvas.height / 100;

        // Draw the image placeID (./Images/Items/Lx.png)
        const img = new Image();
        img.src = `./Images/Items/${imgID}.png`;
        

        let imgLoadID = imgToLoad;
        imgToLoad += 1;
        img.onload = function () {
            waitUntil(() => imgLoaded >= imgLoadID, () => {
                const aspectRatio = img.width / img.height;

                // Adjust dimensions to maintain aspect ratio
                if (h * aspectRatio > w) {
                    h = w / aspectRatio;
                } else {
                    w = h * aspectRatio;
                }
                

                if (rounded) {
                    ctx.save();
                    // Calculate radius as 10% of the smaller dimension
                    const radius = Math.min(w, h) * 0.1;
                    // Create rounded rectangle path
                    ctx.beginPath();
                    ctx.moveTo(x + radius, y);
                    ctx.lineTo(x + w - radius, y);
                    ctx.arcTo(x + w, y, x + w, y + radius, radius);
                    ctx.lineTo(x + w, y + h - radius);
                    ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
                    ctx.lineTo(x + radius, y + h);
                    ctx.arcTo(x, y + h, x, y + h - radius, radius);
                    ctx.lineTo(x, y + radius);
                    ctx.arcTo(x, y, x + radius, y, radius);
                    ctx.closePath();
                    ctx.clip();
                    // Draw the image within the clipped area
                    ctx.drawImage(img, x, y, w, h);
                    ctx.restore();
                } else {
                    // Draw the image normally without clipping
                    ctx.drawImage(img, x, y, w, h);
                }
                
                imgLoaded += 1;
            });
        };
        img.onerror = function () {
            waitUntil(() => imgLoaded >= imgLoadID, () => {
                imgLoaded += 1;
            });
            //console.error(`Failed to load image: ./Images/Items/${imgID}.png`);
        };
    }
    catch (e) {
        console.error(e);
    }
}


var canvasLibLoaded = true;