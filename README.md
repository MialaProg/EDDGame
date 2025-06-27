# EDDGame   
Board game   
   
   
# Glossaire:   
System: Door or perso   
Item: R;L;P or O   
Places: Story places (L)   
Rooms: Each case of the board   
Perso: Character

# Format de variables de chargement   
*Lib*JSLoaded   
   
# Format des bases de données   
   
## items.miDb   
0 : ID   
1 : Nom   
2 : Mode (0: Constant --, 1: Consommable 1-, 2: Multiples consommable 11)   
3 : Lieux possibles (1,2,3)   
4 : Req > Don (5>6,7&8>9|10,54&26|47>4,6>open)   
   
## gameConst.miDb   
(#)Var\ndata   
   
## Game   
rooms: {L;R}   
db: {L:{P;O}}   
    for objects: nb (0~) ; isUsefull? ; exists? => For mode
    for doors: opened?   
    for perso: isHidden? ; isUsefull?
    [xx] = [xx,yy,zz] (&)
objUnavaibles:
    set objToBeUnavaible
    => if isn't changed & an error occured: always an error => can skip this for better perfs

   
Variables disponibles: cf. miDbReader   
   
# Commandes miBasic 
Commentaire: '#x'  
Create keyword: ':x'   
Go to keyword: '#goto:x'   
Stop: '#stop'   
Open door: '#open:x'   
Get object: '#get:x'   
Set variable: '#set:xvar:xval'   (val true by default) 
Access variable: '#var-xvar'   
Execute JS: '#js-xcode'   
Choice between options: '#:xtype   
        ID:GOTO   
        ID:GOTO   
        #'   
Condition: '#if:xconde:val:xgoto' (par def: val=true)

Ex: #if:#var-WAZO::#js-'E'+(5*7) (If var 'WAZO', go to 'E35')
   
   
# Warning   
- IDs in placeAdded & tobe: type numbers   
- L97 & P3 are in reality a .jpg XD   
   
# TODO   
- Check no error: [#11](https://github.com/MialaProg/EDDGame/issues/11)
- Verify all text & assets in miBasic: [#7](https://github.com/MialaProg/EDDGame/issues/7)

# Changelog
- Actual online version: V0.01.0
- Verified stable version: (nothing to see here)
## V0.01.0 - 25/06/25
- We can play a game !
- Bugfixes: 1 to 11
- Beta
## Before
Consult commits for all history.