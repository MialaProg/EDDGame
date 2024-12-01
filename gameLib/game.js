//Initialisation des variables globales
var gameStart = false

/**
 * Initialise les actions lors des mises à jour des select
 */
function init_select_onclick(){
    // Sélectionner tous les éléments <select> sur la page
    var selects = document.querySelectorAll("select");

    // Boucle à travers chaque <select> et définir l'événement onclick
    selects.forEach(function(select) {
        select.addEventListener("change", function() {
            console.log("Option selected: " + this.value); // Remplacez cette ligne par votre logique
        });
    });
}

document.addEventListener("DOMContentLoaded", function() {
    init_select_onclick();
});