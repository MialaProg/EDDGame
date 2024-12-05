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
        //Récupération de l'ID select
        let selectID = parseInt(this.id[6])
        let prev_select = document.getElementById('player'+(selectID-1))
            
        select.onclick = function() {
            let options = select.querySelectorAll('option');

            options.forEach(function(option) {
                option.disabled = (players.includes(option.value) || prev_select.value == "none");
            });
        }
        select.addEventListener("change", function() {
            console.log("Option selected: " + this.value);
            //Save value
            players[selectID-1] = this.value
        });
    });
}


document.addEventListener("DOMContentLoaded", function() {
    init_select_onclick();
});