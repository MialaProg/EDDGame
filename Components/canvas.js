

// Miala Canvas Library, V1-EDDG

// var [imgToLoad, imgLoaded] = [0, 0];

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
            const img = Imgs.get(image);
            Imgs.isLoaded(image).then(()=>{
                wait(Imgs.isToLoad(img)).then(()=>{
                    this.drawImage(x, y, w, h, img, rounded, fillColor);
                })
            });
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






var CanvasJSLoaded = true;