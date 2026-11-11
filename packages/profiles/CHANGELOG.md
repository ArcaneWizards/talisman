# @talisman-midi/profiles

## 0.0.5

### Patch Changes

- 201344b: Adjust bitchboy profile

  Make the first row of keys nature: grid,
  so apps that require a minimum grid of 5 rows can use this area.

- 17ed721: Update README
- Updated dependencies [17ed721]
  - @talisman-midi/talisman@0.1.2

## 0.0.4

### Patch Changes

- 1d36ecd: Bump version to publish to new namespace from CI

  All packages and apps have now been moved into the
  [@talisman-midi](https://www.npmjs.com/org/talisman-midi) namespace on NPM.
  This version bump is to make the first publish to this namespace from CI.

- Updated dependencies [1d36ecd]
  - @talisman-midi/talisman@0.1.1

## 0.0.3

### Patch Changes

- 37981da: Add Mode switching to all other Novation Launchpad profiles

  All devices novation launchpad profiles (other than the MK2 MINI)
  now periodically check the current mode the device is in,
  and notify consumers that a mode switch is required when they are not in the
  correct more, or are not responding to enquiry requests.

- 9217fe3: Add testing information to profile
- Updated dependencies [10aff01]
- Updated dependencies [9217fe3]
  - @talisman-midi/talisman@0.1.0

## 0.0.2

### Patch Changes

- 658542c: Initial version bump to test publish workflow
- Updated dependencies [658542c]
  - @talisman-midi/talisman@0.0.2
