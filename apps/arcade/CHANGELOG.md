# @talisman-midi/arcade

## 0.1.4

### Patch Changes

- 5263ee8: Don't limit number of moles for non-grid devices

  Previously, tap-a-mole was limiting the selection of buttons usable for moles to
  8 when the device did not have a large-enough grid. This now removes the limit
  so all usable items are selected.

## 0.1.3

### Patch Changes

- aa9e9e7: Fix draw condition in 4-in-a-row

  Previously, we were incorrectly checking if the bottom row was filled to
  determine if the game was a draw, this is now fixed to check the top row,
  so games should no longer prematurely end.

## 0.1.2

### Patch Changes

- Updated dependencies [099cd26]
- Updated dependencies [099cd26]
- Updated dependencies [099cd26]
  - @talisman-midi/profiles@0.0.6
  - @talisman-midi/talisman@0.1.3

## 0.1.1

### Patch Changes

- aa1cd35: Add Four-in-a-Row game

## 0.1.0

### Minor Changes

- 4bfe55f: Prepare first public beta release

### Patch Changes

- 17ed721: Update README
- 201344b: Fix grid selection logic for tap-a-mole

  There were a couple of logical errors when selecting the minimum grid area
  for controllers that do not have a rectangular / square grid.

- 4bfe55f: Implement GUI for different games,
  including an animated thumbnail for each game,
  and instructions on how to use each game.
- 201344b: Allow tap-a-mole to be used with single LED

  Adjust the game rendering & item selection logic so that when single LEDs are
  selected, the light is on based on whether there is a mole present only,
  and avoid rendering wave artifacts.

- 17ed721: Modify timing of screensaver slightly

  Introduce some randomness to how frequently the artifacts are generated.

- Updated dependencies [201344b]
- Updated dependencies [17ed721]
  - @talisman-midi/profiles@0.0.5
  - @talisman-midi/talisman@0.1.2

## 0.0.5

### Patch Changes

- 5dc5222: Introduce Tap-a-Mole Game, Screensaver & FX-Sandbox

  First release with actual games and interactivity.

- 62621b4: Update logo URL in README
- Updated dependencies [8006439]
  - @talisman-midi/assets@0.1.1

## 0.0.4

### Patch Changes

- 1d36ecd: Bump version to publish to new namespace from CI

  All packages and apps have now been moved into the
  [@talisman-midi](https://www.npmjs.com/org/talisman-midi) namespace on NPM.
  This version bump is to make the first publish to this namespace from CI.

- Updated dependencies [1d36ecd]
- Updated dependencies [1d36ecd]
  - @talisman-midi/assets@0.1.0
  - @talisman-midi/profiles@0.0.4
  - @talisman-midi/talisman@0.1.1

## 0.0.3

### Patch Changes

- Updated dependencies [10aff01]
- Updated dependencies [9217fe3]
- Updated dependencies [37981da]
- Updated dependencies [9217fe3]
  - @talisman-midi/talisman@0.1.0
  - @talisman-midi/profiles@0.0.3

## 0.0.2

### Patch Changes

- 1272dab: Finish preparing initial release

  - Ensure that user settings are saved between launches
  - Allow users to disable logo animation
  - Display a EULA on app launch
  - Check for updates and display changes when there's an update available.

## 0.0.2

### Patch Changes

- 658542c: Initial version bump to test publish workflow
- Updated dependencies [658542c]
  - @talisman-midi/profiles@0.0.2
  - @talisman-midi/talisman@0.0.2
