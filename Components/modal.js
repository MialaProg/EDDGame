

var Modal = {
    isLocked: false,

    getHTMLE: (id = '') => {
        return document.getElementById('gameModal' + id);
    },

    open: () => Modal.getHTMLE().classList.add('is-active'),
    close: () => {
        if (!Modal.isLocked) {
            Modal.getHTMLE().classList.remove('is-active');
            miBasic.running = false;
        }
        else alert("Impossible de fermer le popup pour le moment.");
    },

    init: () => {
        Modal.close();

        // Événement pour fermer le modal
        document.querySelectorAll('.modal-background, .modal-close').forEach(($el) => {
            $el.addEventListener('click', () => {
                Modal.close();
            });
        })

        Modal.isLoaded = true;
    },

    switch: (mode) => {
        Modal.getHTMLE('Select').classList.toggle('is-hidden', mode !== 'select');
        Modal.getHTMLE('Messages').classList.toggle('is-hidden', mode !== 'chat');
    },

    changeTitle: (title) => { document.getElementById('modalTitle').innerHTML = title; },
};

var MSelect = {
    options: [], // [{id: text:} ...]
    empty: 'Aucune option n\'est disponible.',

    select: (sid, stxt) => { },

    _select: (sid, stxt) => {
        // Prevent from double clicking (maybe fix #14)
        if (Date.now() - MSelect.selectTimer < 2000) return;
        MSelect.selectTimer = Date.now();
        MSelect.select(sid, stxt);
    },

    show: () => {
        Modal.switch('select');
        Modal.open();
    },
    // Remplir la liste des options
    create: () => {
        const list = Modal.getHTMLE('Select');
        list.innerHTML = '';
        if (MSelect.options.length === 0) {
            list.innerHTML = MSelect.empty;
        } else {
            MSelect.options.forEach(choice => {
                const li = document.createElement('li');
                li.innerHTML = `
            <a class="choice-item is-rounded" 
               onclick="MSelect._select('${choice.id}', \`${choice.text}\`)">
                ${choice.text}
            </a>
        `;
                list.appendChild(li);
            });
        }
        MSelect.selectTimer = 0;
        MSelect.show();
    }
};

var MChat = {
    last: undefined,
    ans: undefined,

    addText: async (text, from = 'npc', timeWait = 50) => {
        const isItalic = text.trim().startsWith('*');
        if (isItalic) text = text.substring(1);
        const len = text.length;
        let oldText = '';
        let actualText = '';
        let HTMLE;
        if (from === MChat.last) {
            console.log('Add msg ' + text);
            let lastMsg = document.getElementsByClassName(`${from}-message`);
            HTMLE = lastMsg[lastMsg.length - 1].childNodes[0];
            oldText = HTMLE.innerHTML + '<br>';
        } else {
            console.log('Create msg ' + text);
            const msg = document.createElement('div');
            msg.className = `message ${from}-message`;
            HTMLE = document.createElement('div');
            HTMLE.className = 'message-body';

            msg.appendChild(HTMLE);
            Modal.getHTMLE('Messages').appendChild(msg);
            MChat.last = from;
        }
        for (let i = 0; i < len; i++) {
            actualText += text[i];
            HTMLE.innerHTML = oldText + (isItalic ? `<i>${actualText}</i>` : actualText);
            // Modal.getHTMLE('Messages').scrollTop = Modal.getHTMLE('Messages').scrollHeight;
            scrollToInContainer(HTMLE, 1000, 'bottom', Modal.getHTMLE('Content'));
            await waitTime(timeWait);
        }
    },

    addAnswer: (id, text, selectTxt) => {
        MChat.ans = undefined;
        const btn = document.createElement('button');
        btn.className = 'button is-small mr-2';
        btn.textContent = text;
        btn.onclick = async () => {
            MChat.clearAns();
            await MChat.addText(selectTxt ? selectTxt + text : text, 'user', 10);
            MChat.ans = id;
        };
        Modal.getHTMLE('Answers').appendChild(btn);
    },

    clearConv: () => {
        Modal.getHTMLE('Messages').innerHTML = '';
        Modal.getHTMLE('Answers').innerHTML = '';
        MChat.last = undefined;
    },

    clearAns: () => {
        Modal.getHTMLE('Answers').innerHTML = '';
    },
};






var ModalJSLoaded = true;