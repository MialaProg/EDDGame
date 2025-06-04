

var Modal = {
    getHTMLE: (id = '') => {
        return document.getElementById('gameModal' + id);
    },

    open: () => Modal.getHTMLE().classList.add('is-active'),
    close: () => Modal.getHTMLE().classList.remove('is-active'),

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
    }
};

var MSelect = {
    options: [], // [{id: text:} ...]
    empty: 'Aucune option n\'est disponible.',

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
               onclick="MSelect.select('${choice.id}')">
                ${choice.text}
            </a>
        `;
                list.appendChild(li);
            });
        }
        MSelect.show();
    }
};

var MChat = {

};






var ModalJSLoaded = true;