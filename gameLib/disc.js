var chatModal, messagesDiv, answersDiv;
// Fonctions principales
const chat = {
    show: () => chatModal.classList.add('is-active'),
    hide: () => chatModal.classList.remove('is-active'),

    createMessage: (text, from = 'npc') => {
        const msg = document.createElement('div');
        msg.className = `message ${from}-message`;
        msg.innerHTML = `
      <div class="message-body">
        ${text}
      </div>
    `;
        messagesDiv.appendChild(msg);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    },

    createAnswer: (text, callback) => {
        const btn = document.createElement('button');
        btn.className = 'button is-small mr-2';
        btn.textContent = text;
        btn.onclick = () => {
            chat.createMessage(text, 'user'); // Optionnel: afficher la réponse du joueur
            callback(text);
        };
        answersDiv.appendChild(btn);
    },

    clearConv: () => {
        messagesDiv.innerHTML = '';
        answersDiv.innerHTML = '';
    },

    clearAns: () => {
        answersDiv.innerHTML = '';
    }
};

var discLoaded;

document.addEventListener('DOMContentLoaded', () => {
    // Éléments UI
    chatModal = document.getElementById('gameChat');
    messagesDiv = document.getElementById('chatContent');
    answersDiv = document.getElementById('answers');


    // Événement pour fermer la modale
    try {
        chatModal.querySelector('.delete').addEventListener('click', chat.hide);
        chatModal.querySelector('.modal-background').addEventListener('click', chat.hide);
    } catch (e) { }

    discLoaded = true;

});


// // Exemple d'utilisation :
// // Début de conversation
// chat.clearConv();
// chat.show();

// // Message du NPC
// chat.createMessage("Tu trouves une potion mystère. Que fais-tu ?");

// // Réponses joueur
// chat.createAnswer("Boire la potion", (rep) => {
//     chat.createMessage("*Glou glou* - Vous sentez une étrange énergie !");
//     // Ajouter logique jeu...
// });

// chat.createAnswer("Jeter la potion", (rep) => {
//     chat.createMessage("La fiole se brise en mille morceaux !");
//     // Ajouter logique jeu...
// });

// });