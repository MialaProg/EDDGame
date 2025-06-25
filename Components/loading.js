

var Loading = {
    init: () => {
        Loading.title = document.getElementById('loadingTitle');
        Loading.progress = document.getElementById('loadingProgress');
        // PlayersJS.playBtn.addEventListener('click', () => {Loading.changeMode(1)});
        PlayersJS.change.push(() => { Loading.setTitle(findInArr(miDb.lib, miDb.LOC_LOADING[0], undefined, (item) => item[1] === actualPlayer)[1][2]); })
    },

    setProgressBar: (val, animated = true) => {
        // console.log('SetPrgss', val);
        if (!Loading.progress) {
            return;
        }
        if (Loading.progressInterval) {
            clearInterval(Loading.progressInterval);
        }
        if (!animated){
            Loading.progress.value = val;
            return;
        }
        if (val == 0) {
            Loading.progress.value = 0;
        }
        let currentVal = Loading.progress.value;
        // let step = (val - currentVal) / 50; // Adjust the number of steps as needed
        let sens = val - currentVal;
        Loading.progressInterval = setInterval(() => {
            currentVal += (val - currentVal) / 50;
            Loading.progress.value = currentVal;
            Loading.progress.innerHTML = Math.round(currentVal) + "%";
            if ((sens > 0 && currentVal >= val - 1) || (sens < 0 && currentVal <= val + 1)) {
                clearInterval(Loading.progressInterval);
                Loading.progress.value = val;
                Loading.progress.innerHTML = val + "%";
            }
        }, 40); // Adjust the interval time as needed
    },

    setTitle: (title) => {
        if (!Loading.title) {
            return;
        }
        Loading.title.innerHTML = title;
    },


    /**
 * Smoothly scrolls the page between two positions or elements
 * @param {number|HTMLElement} from - Starting scroll position or DOM element
 * @param {number|HTMLElement} to - Target scroll position or DOM element
 * @param {Function} [callback] - Optional callback to execute after scroll completion
 * @returns {Promise<void>} Promise that resolves when scroll is complete
 
    scrollPage: async (from, to, callback) => {
        const duration = 500;

        const resolvePosition = (value) => {
            if (value instanceof HTMLElement) {
                const rect = value.getBoundingClientRect();
                return rect.top + window.scrollY;
            }
            return typeof value === 'number' ? value : 0;
        };

        const fromPos = resolvePosition(from);
        const toPos = resolvePosition(to);
        const distance = toPos - fromPos;

        let startTime = null;

        function easeInOutQuad(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        }

        return new Promise((resolve) => {
            const animate = (currentTime) => {
                if (!startTime) startTime = currentTime;
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                window.scrollTo(0, fromPos + distance * easeInOutQuad(progress));

                if (elapsed < duration) {
                    requestAnimationFrame(animate);
                } else {
                    if (typeof callback === 'function') callback();
                    resolve();
                }
            };

            requestAnimationFrame(animate);
        });
    },*/




    changeMode: async (mode) => {
        await wait(()=>!Loading.inChange);
        Loading.inChange = 1;

        let modes = ["pregame", "loadinggame", "ingame"];

        if (typeof mode == 'number') {
            mode = modes[mode];
        }

        let new_mode_element = document.getElementById(mode + "-interface");
        new_mode_element.classList.remove("is-hidden");

        // Loading.scrollPage(document.getElementById(pageMode + "-interface"), new_mode_element).then(() => {
        scrollToInContainer(document.getElementById(pageMode + "-interface"), 0);
        scrollToInContainer(new_mode_element).then(() => {
            modes.forEach((m) => {
                document.getElementById(m + "-interface").classList.toggle('is-hidden', m != mode);
            })
            Loading.inChange = 0;
        })
        pageMode = mode;
    }
}











var LoadingJSLoaded = true;