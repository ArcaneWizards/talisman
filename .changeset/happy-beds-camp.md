---
'@talisman-midi/arcade': patch
---

Don't limit number of moles for non-grid devices

Previously, tap-a-mole was limiting the selection of buttons usable for moles to
8 when the device did not have a large-enough grid. This now removes the limit
so all usable items are selected.
