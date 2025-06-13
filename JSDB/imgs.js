

var Imgs = {
    images: {},


    create: (path) => {
        const img = new Image();
        img.src = path;
        img.isLoading = true;
        img.onload = () => {
            img.isLoaded = true;
            img.isLoading = false;
        };
        img.onerror = function () {
            img.isLoaded = false;
            img.isLoading = false;
        };
        return img;
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
        return wait(()=>Imgs.images[name].isLoaded);
    },

    isAvaible: (name) => {
        return wait(()=>!Imgs.images[name].isLoading);
    }


};


var ImgsJSLoaded = true;