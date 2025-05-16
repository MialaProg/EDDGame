# EDDGame
Board game


# Glossaire:
System: Door or perso
Item: R;L;P or O

(unrespected)
Places: Story places (L)
Rooms: Each case of the board

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

Variables disponibles: cf. miDbReader

# Warning
L97 & P3 are in reality a .jpg XD