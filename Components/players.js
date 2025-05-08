var players = [];
var playersNb = 0;

var PlayersJS = {
  playBtnChecks: [false,false], // LoadingLoaded, NbPlayers > 0
  PlayersChoiced: false,

  init: () => {
    PlayersJS.playBtn = document.getElementById('playBtn');
    PlayersJS.createSelects();
    setInterval(PlayersJS.updateSelects, 500);
    PlayersJS.initSubmit();
  },

  createSelects: () => {
    let form = document.getElementById('players-form');
    for (let i = 1; i < 6; i++) {
      let container = document.createElement('div');
      container.className = 'field is-danger';

      let label = document.createElement('label');
      label.className = 'label';
      label.setAttribute('for', 'player'+i);
      label.textContent = 'Joueur '+i+':';
      container.appendChild(label);

      let controlDiv = document.createElement('div');
      controlDiv.className = 'control select';

      let select = document.createElement('select');
      select.className = 'player-select';
      select.id = 'player'+i;
      select.name = 'player'+i;

      let options = [{
        value: 'none',
        text: '-Vide-',
        selected: true
      },
        {
          value: 'T',
          text: 'Toutie'
        },
        {
          value: 'DN',
          text: 'Doudou Noisette'
        },
        {
          value: 'DA',
          text: 'Doudou Âne'
        },
        {
          value: 'P',
          text: 'Peupeuvre'
        },
        {
          value: 'E',
          text: 'Efélant'
        }];

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

      //form.insertBefore(container, PlayersJS.playBtn);
      PlayersJS.playBtn.before(container);
    }
  },

  updateSelects: () => {
    if (pageMode != 'pregame') {
      return;
    }
    // Sélectionne tous les éléments <select> sur la page
    let selects = document.querySelectorAll("select.player-select");

    // Boucle à travers chaque <select>
    selects.forEach(function (select) {
      //Récupération de l'ID select
      let selectID = parseInt(select.id[6]) - 1;
      let prev_select = document.getElementById('player' + (selectID))

      let options = select.querySelectorAll('option');

      options.forEach(function (option) {
        option.disabled = (option.value != 'none' && players.includes(option.value)) || (prev_select && prev_select.value === "none");
      });

      players[selectID] = select.value;
      playersNb = players.indexOf("none");
      if (playersNb == -1) {
        playersNb = players.length;
      }
      PlayersJS.playBtnChecks[1] = !!playersNb
      PlayersJS.playBtn.innerText = 'Jouer (à '+playersNb+') !';
      PlayersJS.playBtn.disabled = PlayersJS.playBtnChecks.includes(false);
    });
  },
  
  initSubmit: () => {
    document.getElementById("players-form").addEventListener("submit", function (e) {
        e.preventDefault();

        PlayersJS.updateSelects();

        if (!playersNb) {
            alert("Cela risque d'etre compliqué sans joueurs...");
            return
        }

        if (!confirm("Démarrer la partie à " + (playersNb) + " joueurs ?")) {
            return;
        }

        PlayersChoiced = true;
        log("Game start !");
    });
  }
}














var PlayersJSLoaded = true;