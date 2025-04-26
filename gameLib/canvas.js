// Miala Canvas Library, V0-EDDG

var [imgToLoad, imgLoaded] = [0, 0];

class CanvasLib {
    /**
     * Crée une instance liée à un canvas
     * @param {string} canvasID - ID du canvas HTML
     * @param {string} [defaultFill] - Couleur de remplissage par défaut
     * @param {string} [defaultStroke] - Couleur de contour par défaut
     */
    constructor(canvasID, defaultFill = '#FFFFFF', defaultStroke = '#000000') {
        this.canvas = document.getElementById(canvasID);
        if (!this.canvas) throw new Error('Canvas non trouvé');
        this.ctx = this.canvas.getContext('2d');
        this.defaultFill = defaultFill;
        this.defaultStroke = defaultStroke;
    }

    /**
     * Dessine un rectangle centré
     * @param {number} x - Position X centrale en %
     * @param {number} y - Position Y centrale en %
     * @param {number} w - Largeur en %
     * @param {number} h - Hauteur en %
     * @param {string} [fillColor] - Couleur de remplissage optionnelle
     * @param {string} [strokeColor] - Couleur de contour optionnelle
     */
    drawRect(x, y, w, h, fillColor, strokeColor) {
        this._saveStyles();

        const px = (x / 100) * this.canvas.width;
        const py = (y / 100) * this.canvas.height;
        const width = (w / 100) * this.canvas.width;
        const height = (h / 100) * this.canvas.height;

        if (fillColor) {
            this.ctx.fillStyle = fillColor || this.defaultFill;
            this.ctx.fillRect(px - width / 2, py - height / 2, width, height);
        }
        if (strokeColor) {
            this.ctx.strokeStyle = strokeColor || this.defaultStroke;
            this.ctx.lineWidth = 5;
            this.ctx.strokeRect(px - width / 2, py - height / 2, width, height);
        }
        this._restoreStyles();
    }

    /**
     * Dessine une image centrée (chemin ou objet Image)
     * @param {number} x - Position X centrale en %
     * @param {number} y - Position Y centrale en %
     * @param {number} w - Largeur max en %
     * @param {number} h - Hauteur max en %
     * @param {string|HTMLImageElement} image - Chemin ou objet Image
     * @param {boolean} [rounded] - Si vrai, arrondit les coins
     * @param {string} [fillColor] - Teinte optionnelle pour l'image
     */
    drawImage(x, y, w, h, image, rounded = true, fillColor) {
        if (typeof image === 'string') {
            const img = new Image();
            img.src = `./Images/Items/${image}.png`;
            let imgLoadID = imgToLoad;
            imgToLoad += 1;
            img.onload = () => waitUntil(() => imgLoaded >= imgLoadID, () => {
                this.drawImage(x, y, w, h, img, rounded, fillColor);
                imgLoaded += 1;
            });
            img.onerror = function () {
                waitUntil(() => imgLoaded >= imgLoadID, () => {
                    imgLoaded += 1;
                });
                //console.error(`Failed to load image: ./Images/Items/${imgID}.png`);
            };
            return;
        }

        this._saveStyles();

        const px = (x / 100) * this.canvas.width;
        const py = (y / 100) * this.canvas.height;
        const maxWidth = (w / 100) * this.canvas.width;
        const maxHeight = (h / 100) * this.canvas.height;

        const ratio = Math.min(
            maxWidth / image.naturalWidth,
            maxHeight / image.naturalHeight
        );

        w = image.naturalWidth * ratio;
        h = image.naturalHeight * ratio;
        [x, y] = [px - w / 2, py - h / 2];

        if (fillColor) {
            this.ctx.filter = `hue-rotate(${fillColor})`;
        }

        if (rounded) {
            // Calculate radius as 10% of the smaller dimension
            const radius = Math.min(w, h) * 0.1;
            // Create rounded rectangle path
            this.ctx.beginPath();
            this.ctx.moveTo(x + radius, y);
            this.ctx.lineTo(x + w - radius, y);
            this.ctx.arcTo(x + w, y, x + w, y + radius, radius);
            this.ctx.lineTo(x + w, y + h - radius);
            this.ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
            this.ctx.lineTo(x + radius, y + h);
            this.ctx.arcTo(x, y + h, x, y + h - radius, radius);
            this.ctx.lineTo(x, y + radius);
            this.ctx.arcTo(x, y, x + radius, y, radius);
            this.ctx.closePath();
            this.ctx.clip();
        }

        this.ctx.drawImage(
            image, x, y, w, h
        );

        this._restoreStyles();
    }

    /**
     * Dessine une flèche orientée
     * @param {number} x - Position X centrale en %
     * @param {number} y - Position Y centrale en %
     * @param {number} w - Largeur en %
     * @param {number} h - Hauteur en %
     * @param {'up'|'down'|'left'|'right'} dir - Direction
     * @param {string} [fillColor] - Couleur optionnelle
     */
    drawArrow(x, y, w, h, dir, strokeFillColor) {
        this._saveStyles();

        const px = (x / 100) * this.canvas.width;
        const py = (y / 100) * this.canvas.height;
        const width = (w / 100) * this.canvas.width;
        const height = (h / 100) * this.canvas.height;

        this.ctx.fillStyle = strokeFillColor || this.defaultStroke;
        this.ctx.beginPath();

        // Configuration des points selon la direction
        switch (dir) {
            case 'right':
                this.ctx.moveTo(px - width / 2, py - height / 2);
                this.ctx.lineTo(px + width / 2, py);
                this.ctx.lineTo(px - width / 2, py + height / 2);
                break;
            case 'left':
                this.ctx.moveTo(px + width / 2, py - height / 2);
                this.ctx.lineTo(px - width / 2, py);
                this.ctx.lineTo(px + width / 2, py + height / 2);
                break;
            case 'up':
                this.ctx.moveTo(px - width / 2, py + height / 2);
                this.ctx.lineTo(px, py - height / 2);
                this.ctx.lineTo(px + width / 2, py + height / 2);
                break;
            case 'down':
                this.ctx.moveTo(px - width / 2, py - height / 2);
                this.ctx.lineTo(px, py + height / 2);
                this.ctx.lineTo(px + width / 2, py - height / 2);
                break;
        }


        this.ctx.closePath();
        this.ctx.fill();
        this._restoreStyles();
    }

    /**
     * Efface tout le contenu du canvas
     */
    clear() {
        this.ctx.save();
        this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset les transformations
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    /**
     * Remplit le canvas avec une couleur d'arrière-plan
     * @param {string} [color] - Couleur HTML (utilise defaultFill si non précisée)
     */
    setBackground(color = this.defaultFill) {
        this._saveStyles();
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this._restoreStyles();
    }

    // Méthodes internes pour gérer les styles
    _saveStyles() {
        this.ctx.save();
        this._originalFill = this.ctx.fillStyle;
        this._originalStroke = this.ctx.strokeStyle;
        this._originalFilter = this.ctx.filter;
    }

    _restoreStyles() {
        this.ctx.fillStyle = this._originalFill;
        this.ctx.strokeStyle = this._originalStroke;
        this.ctx.filter = this._originalFilter;
        this.ctx.restore();
    }
}

// /**
//  * Dessine un rectangle avec options de style
//  * @param {string} canvasId - ID du canvas
//  * @param {number} x - Position X
//  * @param {number} y - Position Y
//  * @param {number} w - Largeur
//  * @param {number} h - Hauteur
//  * @param {string} [fillColor] - Couleur de remplissage (optionnel)
//  * @param {string} [strokeColor] - Couleur du contour (optionnel)
//  * @param {number} [lineWidth=1] - Épaisseur du contour (optionnel)
//  */
// function drawRect(canvasId, x, y, w, h, fillColor, strokeColor, lineWidth = 1) {
//         const canvas = document.getElementById(canvasId);
//     if (!canvas) return;

//     x *= canvas.width / 100;
//     y *= canvas.height / 100;
//     w *= canvas.width / 100;
//     h *= canvas.height / 100;

//     const ctx = canvas.getContext('2d');

//     if (fillColor) {
//         ctx.fillStyle = fillColor;
//         ctx.fillRect(x, y, w, h);
//     }

//     if (strokeColor) {
//         ctx.strokeStyle = strokeColor;
//         ctx.lineWidth = lineWidth;
//         ctx.strokeRect(x, y, w, h);
//     }
// }


// /**
//  * Dessine une flèche sur un canvas HTML
//  * @param {string} canvasId - ID de l'élément canvas
//  * @param {number} x - Position X de départ de la flèche
//  * @param {number} y - Position Y de départ de la flèche
//  * @param {number} w - Largeur totale (pour droite/gauche) ou hauteur de la pointe (pour haut/bas)
//  * @param {number} h - Hauteur de la pointe (pour droite/gauche) ou largeur totale (pour haut/bas)
//  * @param {'right'|'left'|'up'|'down'} dir - Direction de la flèche
//  * @returns {void}
//  * @example
//  * // Dessine une flèche vers la droite
//  * drawArrow('myCanvas', 50, 50, 100, 20, 'right');
//  */
// function drawArrow(canvasId, x, y, w, h, dir) {
//     const canvas = document.getElementById(canvasId);
//     if (!canvas) return;

//     x *= canvas.width / 100;
//     y *= canvas.height / 100;
//     w *= canvas.width / 100;
//     h *= canvas.height / 100;

//     const ctx = canvas.getContext('2d');

//     // Définir la couleur noire pour le contour et le remplissage
//     ctx.strokeStyle = 'black';
//     ctx.fillStyle = 'black';
//     ctx.lineWidth = 10;


//     // Dessine la ligne de la flèche
//     ctx.beginPath();
//     switch(dir) {
//         case 'right':
//             ctx.moveTo(x, y);
//             ctx.lineTo(x + w - h, y);
//             break;
//         case 'left':
//             ctx.moveTo(x + h, y);
//             // ctx.lineTo(x, y);
//             ctx.lineTo(x + w, y);
//             break;
//         case 'up':
//             ctx.moveTo(x, y + h - w);
//             ctx.lineTo(x, y);
//             break;
//         case 'down':
//             ctx.moveTo(x, y);
//             ctx.lineTo(x, y + h - w);
//             break;
//         default:
//             console.error('Direction invalide');
//             return;
//     }
//     ctx.stroke();

//     // Dessine la pointe de la flèche (remplie)
//     ctx.beginPath();
//     switch(dir) {
//         case 'right':
//             ctx.moveTo(x + w - h, y - h/2);
//             ctx.lineTo(x + w, y);
//             ctx.lineTo(x + w - h, y + h/2);
//             break;
//         case 'left':
//             ctx.moveTo(x + h, y - h/2);
//             ctx.lineTo(x, y);
//             ctx.lineTo(x + h, y + h/2);
//             break;
//         case 'up':
//             ctx.moveTo(x - w/2, y + w);
//             ctx.lineTo(x, y);
//             ctx.lineTo(x + w/2, y + w);
//             break;
//         case 'down':
//             ctx.moveTo(x - w/2, y + h - w);
//             ctx.lineTo(x, y + h);
//             ctx.lineTo(x + w/2, y + h - w);
//             break;
//     }
//     ctx.closePath();
//     ctx.fill();

// }

// /**
//  * Set the background color of the canvas and remove all
//  * @param {HTMLCanvasElement} canvas - The canvas element to set the background color for
//  * @param {string} color - The color to set the background to (e.g., "red", "#ff0000")
//  * @returns {void}
//  */
// function setBg(canvasId, color) {
//     const canvas = document.getElementById(canvasId);
//     if (!canvas) {
//         console.error("Canvas element not found.");
//         return;
//     }
//     if (canvas.getContext) {
//         var ctx = canvas.getContext('2d');
//         ctx.fillStyle = color;
//         ctx.fillRect(0, 0, canvas.width, canvas.height);
//     } else {
//         console.error("Canvas not supported in this browser.");
//     }
// }

// /**
//  * Dessine une image sur un canvas avec des paramètres de position et de taille personnalisables.
//  * @param {string} imgID - Le nom de l'image png à dessiner.
//  * @param {number} [x=0] - Position horizontale (en pixels) sur le canvas où dessiner l'image.
//  * @param {number} [y=0] - Position verticale (en pixels) sur le canvas où dessiner l'image.
//  * @param {number} [w=100] - Largeur (en pixels) de l'image dessinée.
//  * @param {number} [h=100] - Hauteur (en pixels) de l'image dessinée.
//  * @param {string} [canvasID=_canvasID] - L'ID du canvas (HTMLCanvasElement) cible. Par défaut utilise une variable globale _canvasID.
//  * @example
//  * // Dessine une image avec les paramètres par défaut
//  * drawImage('myImage');
//  * 
//  * // Dessine une image à la position (50,50) avec taille 200x150
//  * drawImage('myImage', 50, 50, 200, 150);
//  */
// function drawImage(imgID, x = 0, y = 0, w = 100, h = 100, canvasID=_canvasID, rounded=true) {
//     try {
//         const canvas = document.getElementById(_canvasID);
//         if (!canvas) {
//             console.error("Canvas element not found.");
//             return;
//         }
//         const ctx = canvas.getContext("2d");
//         if (!ctx) {
//             console.error("Canvas not supported in this browser.");
//             alert("Votre navigateur web ne supporte pas l'élément canvas.");
//             return;
//         }



//         x *= canvas.width / 100;
//         y *= canvas.height / 100;
//         w *= canvas.width / 100;
//         h *= canvas.height / 100;

//         // Draw the image placeID (./Images/Items/Lx.png)
//         const img = new Image();
//         img.src = `./Images/Items/${imgID}.png`;


//         let imgLoadID = imgToLoad;
//         imgToLoad += 1;
//         img.onload = function () {
//             waitUntil(() => imgLoaded >= imgLoadID, () => {
//                 const aspectRatio = img.width / img.height;

//                 // Adjust dimensions to maintain aspect ratio
//                 if (h * aspectRatio > w) {
//                     h = w / aspectRatio;
//                 } else {
//                     w = h * aspectRatio;
//                 }

//                 drawRect(_canvasID, x, y, w/2, h/2, "white", "black", 1);

//                 x -= w / 2;
//                 y -= h / 2;

//                 if (rounded) {
//                     ctx.save();
//                     // Calculate radius as 10% of the smaller dimension
//                     const radius = Math.min(w, h) * 0.1;
//                     // Create rounded rectangle path
//                     ctx.beginPath();
//                     ctx.moveTo(x + radius, y);
//                     ctx.lineTo(x + w - radius, y);
//                     ctx.arcTo(x + w, y, x + w, y + radius, radius);
//                     ctx.lineTo(x + w, y + h - radius);
//                     ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
//                     ctx.lineTo(x + radius, y + h);
//                     ctx.arcTo(x, y + h, x, y + h - radius, radius);
//                     ctx.lineTo(x, y + radius);
//                     ctx.arcTo(x, y, x + radius, y, radius);
//                     ctx.closePath();
//                     ctx.clip();
//                     // Draw the image within the clipped area
//                     ctx.drawImage(img, x, y, w, h);
//                     ctx.restore();
//                 } else {
//                     // Draw the image normally without clipping
//                     ctx.drawImage(img, x, y, w, h);
//                 }

//                 imgLoaded += 1;
//             });
//         };
//         img.onerror = function () {
//             waitUntil(() => imgLoaded >= imgLoadID, () => {
//                 imgLoaded += 1;
//             });
//             //console.error(`Failed to load image: ./Images/Items/${imgID}.png`);
//         };
//     }
//     catch (e) {
//         console.error(e);
//     }
// }


var canvasLibLoaded = true;