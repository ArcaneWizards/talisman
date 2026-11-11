---
'@talisman-midi/arcade': patch
---

Allow tap-a-mole to be used with single LED

Adjust the game rendering & item selection logic so that when single LEDs are
selected, the light is on based on whether there is a mole present only,
and avoid rendering wave artifacts.
