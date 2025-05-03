var players;

var PlayersJS = {
    selects: [],


    init: () => {
        this.playBtn = document.getElementById('playBtn');


    },

    createSelect: () => {
        let form = document.getElementById('players-form');
        for (let i = 0; i < 5; i++) {
            let container = document.createElement('div');
            container.className = 'field is-danger';

            let label = document.createElement('label');
            label.className = 'label';
            label.setAttribute('for', 'player5');
            label.textContent = 'Joueur 5:';
            container.appendChild(label);

            let controlDiv = document.createElement('div');
            controlDiv.className = 'control select';

            let select = document.createElement('select');
            select.className = 'player-select';
            select.id = 'player5';
            select.name = 'player5';

            let options = [
                { value: 'none', text: '-Vide-', selected: true },
                { value: 'T', text: 'Toutie' },
                { value: 'DN', text: 'Doudou Noisette' },
                { value: 'DA', text: 'Doudou Âne' },
                { value: 'P', text: 'Peupeuvre' },
                { value: 'E', text: 'Efélant' }
            ];

            options.forEach(optionData => {
                let option = document.createElement('option');
                option.value = optionData.value;
                option.textContent = optionData.text;
                if (optionData.selected) {
                    option.selected = true;
                }
                select.appendChild(option);
            });

            controlDiv.appendChild(select);
            container.appendChild(controlDiv);

            document.body.appendChild(container);
        }
    },

    readSelect: () => {

    }
}














var PlayersJSLoaded = true;