//Initialisation des variables globales
var gameStart = false
var players = new Array(5)

/**
 * Detect duplicates from an array
 * @param {array} Array 
 * @returns {bool}
 */
function hasDuplicates(arr) {
    return arr.some((item, index) => arr.indexOf(item) !== index);
  }

/**
 * Initialise les actions lors des mises à jour des select
 */
function init_select_onclick(){
    // Sélectionne tous les éléments <select> sur la page
    var selects = document.querySelectorAll("select");

    // Boucle à travers chaque <select> et définir l'événement change
    selects.forEach(function(select) {
        select.addEventListener("change", function() {
            console.log("Option selected: " + this.value);

            //Récupération de l'ID select
            let selectID = parseInt(this.id[6])

            //Save value
            players[selectID-1] = this.value

            //Modification des options du select suivant
            let next_select = document.getElementById('player'+selectID + 1)
            next_select.querySelectorAll('option').forEach(function(option) {
                if (!players.includes(option.value)) {
                    option.disabled = false;
                }
            });
        });
    });
}


document.addEventListener("DOMContentLoaded", function() {
    init_select_onclick();
});