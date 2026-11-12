---
'@talisman-midi/profiles': patch
'@talisman-midi/talisman': patch
---

[breaking] change name properties for inputs / outputs

To simplify usage with MIDI libraries that expose inputs & outputs as an object
with a `name` string property (such as `@arcanewizards/midi`),
introduce some generics, and simplify the property name to match.
