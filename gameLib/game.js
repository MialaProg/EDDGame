//Initialisation des variables globales
var InGame = false;

var players = new Array(5)

/**
 * Detect duplicates from an array
 * @param {array} Array 
 * @returns {bool}
 */
function hasDuplicates(arr) {
    return arr.some((item, index) => arr.indexOf(item) !== index);
  }

// IN-GAME CODE


function launch_game() {
    document.getElementById("pregame-interface").classList.add("is-hidden");
    document.getElementById("ingame-interface").classList.remove("is-hidden");
}

// STARTING GAME CODE

/**Set array <players> values to actual select values.
 * If there is a duplicate, set select value to none.
*/
function init_players_values() {
    let selects = document.querySelectorAll("select");
    selects.forEach(function(select) {
        let selectID = select.id[select.id.length - 1];
        players[selectID - 1] = select.value
        if (hasDuplicates(players)) {
            players[selectID - 1] = select.value = "none";
        }
    });
}

/**
 * Initialise les actions lors des mises à jour des select
 */
function init_select_onclick(){
    // Sélectionne tous les éléments <select> sur la page
    var selects = document.querySelectorAll("select");

    // Boucle à travers chaque <select> et définir l'événement change
    selects.forEach(function(select) {
        //Récupération de l'ID select
        let selectID = parseInt(select.id[6])
        let prev_select = document.getElementById('player'+(selectID-1))
          

        select.onclick = function() {
            let options = select.querySelectorAll('option');

            options.forEach(function(option) {
                option.disabled = players.includes(option.value) || (prev_select && prev_select.value === "none");  
            });
        }
        select.addEventListener("change", function() {
            console.log("Option selected: " + this.value);
            //Save value
            players[selectID-1] = this.value
        });
    });
}


function set_player_form_submit() {
    document.getElementById("player-form").addEventListener("submit", function(e) {
        e.preventDefault();

        let nb_player = players.indexOf("none");

        if (!nb_player){
            alert("Cela risque d'etre compliqué sans joueurs...");
            return
        }

        if (!confirm("Démarre la partie à "+(nb_player)+" joueurs ?")) {
            return;
        }

        InGame = true;
        console.log("Game start !");
        launch_game();
    });
}


document.addEventListener("DOMContentLoaded", function() {
    init_players_values();
    init_select_onclick();
    set_player_form_submit();
});