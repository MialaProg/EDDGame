var chatModal, messagesDiv, answersDiv, lastChatWriter;
var chatID = 0;
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
        lastChatWriter = from;
    },

    addMessage: (text, from = 'npc') => {
        if (text.trim().startsWith('*')) {
            text = '<i>' + text.substring(1) + '</i>';
        }
        if (from === lastChatWriter) {
            let lastMsg = document.getElementsByClassName(`${from}-message`);
            lastMsg = lastMsg[lastMsg.length - 1].childNodes[1];
            lastMsg.innerHTML += "<br>" + text;
        } else {
            chat.createMessage(text, from);
        }
    },

    createAnswer: (text, callback) => {
        const btn = document.createElement('button');
        btn.className = 'button is-small mr-2';
        btn.textContent = text;
        btn.onclick = () => {
            chat.createMessage(text, 'user'); // Optionnel: afficher la réponse du joueur
            chat.clearAns();
            callback(text);
        };
        answersDiv.appendChild(btn);
    },

    clearConv: () => {
        messagesDiv.innerHTML = '';
        answersDiv.innerHTML = '';
        lastChatWriter = undefined;
        chatID += 1;
    },

    clearAns: () => {
        answersDiv.innerHTML = '';
    },

    switch: (mode) => {
        document.getElementById('messages').classList.toggle('is-hidden', mode !== 'msg');
        document.getElementById('choices-list').classList.toggle('is-hidden', mode !== 'choice');
    }
};

var discLoaded;

document.addEventListener('DOMContentLoaded', () => {
    // Éléments UI
    chatModal = document.getElementById('gameChat');
    messagesDiv = document.getElementById('messages');//chatCnt ?
    answersDiv = document.getElementById('answers');


    // Événement pour fermer la modale
    document.querySelectorAll('.modal-background, .modal-close').forEach(($el) => {
        $el.addEventListener('click', () => {
            chat.hide();
        });
    })

    discLoaded = true;

});

var chatSelectedChoice = null;
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

/* LISTE DE CHOIX: */

// const choices = [
//     { id: 1, text: 'Option 1' },
//     { id: 2, text: 'Option 2' },
//     { id: 3, text: 'Option 3' },
//     { id: 4, text: 'Option 4' }
// ];
var chatChoices;

// Remplir la liste des options
function populateChoices() {
    const list = document.getElementById('choices-list');
    list.innerHTML = '';
    chatChoices.forEach(choice => {
        const li = document.createElement('li');
        li.innerHTML = `
            <a class="choice-item is-rounded ${chatSelectedChoice === choice.id ? 'is-active' : ''}" 
               onclick="selectChoice(${choice.id})">
                ${choice.text}
            </a>
        `;
        list.appendChild(li);
    });
}

// Sélectionner une option
function selectChoice(choiceId) {
    chatSelectedChoice = choiceId;
    populateChoices(); // Met à jour l'affichage des sélections
    confirmSelection();
}

// Confirmer la sélection
function confirmSelection() {
    if (![false, undefined].includes(chatSelectedChoice)) {
        const selected = chatChoices.find(c => c.id === chatSelectedChoice);
        console.log('Option sélectionnée:', selected);
        // chat.clearConv();
        chat.switch('msg');
        miBasicObj.run(chatSelectedChoice);
        log("ENDChat");
    } else {
        alert('Veuillez sélectionner une option');
    }
}
