#miFILETYPE:miBasic
#openWith:miBasicReader.js

Salut !
#:Choix d'action
    Salut comment ça va ?:a
    Coucou...:b
    Tais-toi tu m'embete:c
#

#Ici c'est le comment ça va
:a
Bien et toi ?
#:Choix d'action
    Bien !:d
    Mal...:e
    Je sais pas...:f 
#

:b 
Comment ça va ?
#:Choix d'action
    Bien !:d
    Mal...:e
    Je sais pas...:f 
#

:c 
Je sais c'est fun !
#goto :b 
#

:d 
Aaah ! Tu veux une blague ?
#:Choix d'action
    Oui :g 
    Non :h 
#

:e 
Pourquoi ?
#:
    (...):eprcq
#
:eprcq
#Tu peux continuer ici...


































