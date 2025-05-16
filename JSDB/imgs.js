

var Imgs = {
    NumImgsLoaded:0,
    NumImgsToLoad:0,
    images: {},

    ImagesLoaded: () => {
        return NumImgsLoaded >= NumImgsLoaded;
    },

    isToLoad: (img) => {
        return img.Num < NumImgsLoaded - 2;
    },

    create: (path) => {
        const img = new Image();
        img.src = path;
        Imgs.NumImgsToLoad += 1;
        img.Num = NumImgsToLoad;
        img.isLoading = true;
        img.onload = () => {
            img.isLoaded = true;
            img.isLoading = false;
            Imgs.NumImgsLoaded += 1;
        };
        img.onerror = function () {
            img.isLoaded = false;
            img.isLoading = false;
            Imgs.NumImgsLoaded += 1;
        };
    },

    get: (name) => {
        let img = Imgs.images[name];
        let path = miDb.IMGS_PATH[0] + name + miDb.IMGS_PATH[1];
        if (img && !img.isLoading && !img.isLoaded){
            delete img;
            path += '?reload=' + getUniqueID();
        }
        if (!img) {
            img = Imgs.create(path);
            Imgs.images[name] = img;
        }
        return img;
    },

    isLoaded: (name) => {
        return wait(Imgs.images[name].isLoaded);
    }


};


var ImgsJSLoaded = true;