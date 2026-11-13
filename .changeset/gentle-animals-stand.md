---
'@talisman-midi/arcade': patch
---

Fix draw condition in 4-in-a-row

Previously, we were incorrectly checking if the bottom row was filled to
determine if the game was a draw, this is now fixed to check the top row,
so games should no longer prematurely end.
