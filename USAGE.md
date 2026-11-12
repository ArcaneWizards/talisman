# How to use Talisman

This document is for developers who want to use the the Talisman project in
their own software.

If this is not you, please see:

- [contributing guidelines](./CONTRIBUTING.md) - if you want to help test a
  profile, or develop your own
- [Arcane Wizards docs](https://arcanewizards.com/docs) - if you need help using any of our apps

## Package Installation

Install the following packages using your favourite Node package manager:

- [`@talisman-midi/talisman`](https://www.npmjs.com/package/@talisman-midi/talisman)
- [`@talisman-midi/profiles`](https://www.npmjs.com/package/@talisman-midi/profiles)

And if you plan to connect to midi from Node.js
(rather than from a web browser)
then also install a MIDI package of your choice, e.g:

- [`midi`](https://www.npmjs.com/package/midi)
- [`@arcanewizards/midi`](https://www.npmjs.com/package/@arcanewizards/midi)

e.g:

```shell
pnpm install @arcanewizards/midi @talisman-midi/talisman @talisman-midi/profiles
```

> **Heads up:** the project is currently in
> [Phase 1](./README.md#phase-1---device--api-expansion-current),
> so the API is still likely to change. Use TypeScript, and lock your
> dependency versions.

## Core Concepts

Talisman separates "what is this device, and what can it do" from "how do I talk
to MIDI". It deliberately **does not open any MIDI connections itself**,
you bring your own MIDI library (Web MIDI, `midi`, `@arcanewizards/midi`, ...),
and Talisman sits on top of it.

| Concept                | Type                    | What it is                                                                                                                                           |
| ---------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Profile definition** | `MidiProfileDefinition` | Describes a device (or family of devices): its name, how well it has been tested, how to recognise it, and its sub-profiles.                         |
| **Sub-profile**        | `ProfilePair`           | A particular way of using a device (e.g. "RGB feedback via SysEx" vs "LED notes"). Pairs an **input** profile with an optional **feedback** profile. |
| **Input profile**      | `MidiProfile`           | Created per connection. You feed it parsed MIDI messages, and it emits `action` and `readiness` events.                                              |
| **Feedback profile**   | `MidiFeedbackProfile`   | Created per connection. You tell it what colour / value each item should have, and it sends the right MIDI messages to the device.                   |
| **Controller item**    | `MidiControllerItem`    | A physical control on the device (button, fader, encoder, ...), with an `id`, optional label & position, and the MIDI messages it uses.              |
| **Action**             | `MidiControllerAction`  | What the user _meant_: `button-press`, `button-release`, `absolute-value`, `relative-value` (plus `pending` and `duplicate`).                        |
| **Bindable identity**  | `MidiBindableIdentity`  | A stable identifier for "this raw MIDI control", for saving user bindings that survive profile changes.                                              |

The two packages split up like this:

- [`@talisman-midi/talisman`](#talisman-midi-talisman) - types, helper
  functions & base classes. Contains **no device-specific code**.
- [`@talisman-midi/profiles`](#talisman-midiprofiles) - the actual collection
  of device profiles, built on top of the types above.

## `@talisman-midi/profiles`

### The profile collection

```ts
import {
  KNOWN_MIDI_PROFILES,
  MIDI_PROFILES,
  isKnownMidiProfile,
  type KnownMidiProfile,
} from '@talisman-midi/profiles';
```

| Export                | Description                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `KNOWN_MIDI_PROFILES` | A frozen object of every profile, keyed by profile ID. The keys are typed, so `KNOWN_MIDI_PROFILES['generic']` needs no null check. |
| `KnownMidiProfile`    | String-union type of every known profile ID.                                                                                        |
| `isKnownMidiProfile`  | Type-guard that narrows an arbitrary `string` (e.g. one loaded from a config file) to a `KnownMidiProfile`.                         |
| `MIDI_PROFILES`       | The same collection, but typed as `Partial<Record<string, MidiProfileDefinition>>` for when you only have string keys.              |

Each value is a `MidiProfileDefinition`:

```ts
const profile = KNOWN_MIDI_PROFILES['novation-launchpad-mk3-x'];

profile.name; // 'Launchpad X (mk3)'
profile.testing.ready; // true - see "Testing status" below
profile.subProfiles; // { default: {...}, notes: {...} }
```

### Available profiles

To see a list of available device profiles, check either:

- The [`packages/profiles/src/index.ts`](./packages/profiles/src/index.ts) file.
- The [Talisman page on the Arcane Wizards website](https://arcanewizards.com/talisman).

Use `Object.keys(KNOWN_MIDI_PROFILES)` if you need the list at runtime.

A few things worth knowing:

- The **`generic`** profile never auto-selects.
  It's a fall-back that a user must choose explicitly.
  It has no items or feedback, and just turns every raw message into
  a generic action (`note` → button press/release, `control-change` / pitch-wheel / aftertouch →
  `absolute-value`). The `zeroNoteOn` variant treats Note On with velocity `0` as a
  button release, which some devices send instead of Note Off.
- **Sub-profiles with `feedback: null`** (such as `generic`) only support
  receiving messages, check before using it (see below).
- Sub-profile `name` and `notice` are intended for display to the user,
  e.g. in a profile drop-down.
  For example the Launchpad Mini (mk3) notice asks the user to put the device in
  Programmer mode.

### Testing status

Every profile has a `testing` field describing how much real-world verification
it has had.

Using it is optional, but we recommend that apps only offer `ready: true`
profiles to regular users by default, and gate the others behind an
"experimental" / "show untested profiles" setting.

```ts
const readyProfiles = Object.entries(KNOWN_MIDI_PROFILES).filter(
  ([, profile]) => profile.testing.ready,
);
```

## `@talisman-midi/talisman`

### Entry points

The package exposes a number of sub-path exports.
Everything in `core` is also re-exported from the root entry point.

| Import                             | Contents                                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `@talisman-midi/talisman`          | Everything in `core`, plus profile auto-selection and message parsing / creation helpers.               |
| `@talisman-midi/talisman/core`     | Types (`MidiProfile`, `MidiFeedbackProfile`, `MidiControllerAction`, ...) and MIDI constants.           |
| `@talisman-midi/talisman/color`    | `RGB` types & colour helpers, including `createColorSpace` for converting RGB to device palette values. |
| `@talisman-midi/talisman/profile`  | Base classes for implementing input profiles (`MidiProfileBase`, `MidiProfileBasic`).                   |
| `@talisman-midi/talisman/feedback` | Factories for simple feedback profiles.                                                                 |
| `@talisman-midi/talisman/util`     | Misc. helpers: binding keys, grid / position maths, human-readable message descriptions.                |

### Describing connections

Talisman only needs a name from your MIDI library:

```ts
type MidiInputConnectionInfo = { name: string };
type MidiOutputConnectionInfo = { name: string };
```

Any object with a `name` property (a Web MIDI `MIDIInput`, or a port from
`@arcanewizards/midi`) satisfies this, so you can pass your library's port
objects straight in.

### Step 1: Pick a profile

`autoSelectProfileAndSubprofile` looks for the most appropriate profile &
subprofile to use for a given input,
based on the auto selection logic implemented in each profile.

```ts
import { autoSelectProfileAndSubprofile } from '@talisman-midi/talisman';
import {
  KNOWN_MIDI_PROFILES,
  isKnownMidiProfile,
} from '@talisman-midi/profiles';

const pair = autoSelectProfileAndSubprofile(input, KNOWN_MIDI_PROFILES);
// null, or [profileId, subProfileId] e.g. ['akai-apcmini-mk2', 'default']

if (pair) {
  const profile = KNOWN_MIDI_PROFILES[pair[0]];
  const subProfile =
    profile.subProfiles[pair[1]] ?? profile.subProfiles.default;
}
```

If the user has explicitly chosen a profile (e.g. the Generic one, or a profile
that can't be auto-detected), pass its ID as the third argument to only
auto-select the _sub-profile_:

```ts
autoSelectProfileAndSubprofile(
  input,
  KNOWN_MIDI_PROFILES,
  'novation-launchpad-mk2-pro',
);
```

Users can also pick the sub-profile themselves,
`profile.subProfiles` is just a `Record<string, ProfilePair>`
with a mandatory `default` entry, and each one has an optional human-readable
`name` and `notice`.

### Step 2: Find the matching output

Most feedback-capable devices expose a separate MIDI output port.
`autoSelectOutputForInput` finds it, using the profile's own `autoSelectOutput`
when it has one (some devices name their input & output ports differently,
e.g. with `MIDIIN…` / `MIDIOUT…` prefixes), and otherwise falling back to an
exact name match:

```ts
import { autoSelectOutputForInput } from '@talisman-midi/talisman';

const output = autoSelectOutputForInput(input, allOutputs, profile);
// the matching output (same type as the items in allOutputs), or null
```

If you don't find an output you can still use the input profile,
you just can't send feedback.

### Step 3: Parse incoming MIDI messages

Raw MIDI messages (`number[]`) need to be parsed into a `MidiParsedMessage`
before being passed to a profile.
Use `parseMidiMessages` rather than `parseSingleMidiMessage`, as some devices
batch multiple messages into one packet when they are sent in quick succession:

```ts
import { parseMidiMessages } from '@talisman-midi/talisman';

inputConnection.addEventListener('message', (event) => {
  // Web MIDI gives you a Uint8Array in `event.data` - convert with Array.from()
  for (const [parsed] of parseMidiMessages(event.message)) {
    inputProfile.receiveMessage(parsed);
  }
});
```

A parsed message is a discriminated union on `type`:
`'note'` (with `action: 'on' | 'off'`), `'control-change'`, `'polyphonic-aftertouch'`, `'program-change'`,
`'channel-aftertouch'`, `'pitch-wheel'`, plus the unparsed `'sysex'`, `'mtc'` and `'other'`.
Channels are **0-indexed** (Channel 1 = `0`).

These parsers will throw on malformed messages, so wrap them in a `try / catch` if you're
handling untrusted input.

There are also tiny helpers for going the other way: `midiNoteOn`, `midiNoteOff`
and `midiControlChange`, each returning a `[status, data1, data2]` array that
you can pass to your MIDI library.

### Step 4: Create the input profile and listen for actions

Create a `MidiProfile` from the sub-profile, and subscribe to its events:

```ts
const inputProfile = subProfile.input({ connection: input });

inputProfile.addEventListener('action', ({ message, action }) => {
  switch (action.action) {
    case 'button-press':
    case 'button-release':
      console.log(action.item, action.action, action.nature);
      break;
    case 'absolute-value': // faders, limited encoders, ...
      console.log(action.item, action.value); // 0 → 1
      break;
    case 'relative-value': // endless encoders, platters, ...
      console.log(action.item, action.change); // whole-number steps, +/-
      break;
    case 'pending': // waiting on further messages (e.g. MSB/LSB pairs)
    case 'duplicate': // redundant message - ignore it
      break;
  }
});
```

Things to know about actions:

- `action.item` is the ID of a `MidiControllerItem`, look it up using
  `inputProfile.getItem(id)`, or enumerate everything with
  `inputProfile.getItems()` (for example to draw a picture of the device,
  using each item's `label` and `position`).
- `action.nature` tells you what the control is _for_ (e.g. `grid`,
  `navigation`, `modifier`, `deck`, `fader`, `encoder`, ...) so apps can pick
  sensible default behaviour without per-device logic.
- `absolute-value` is always normalised to `0`-`1`, regardless of whether the
  device used 7-bit CC or 14-bit pitch-wheel messages (`precisionBits` tells
  you the original resolution).
- `receiveMessage` returns `true` if the profile understood the message, and
  `false` if not. When it returns `false` it's recommended to fall back to the raw
  message (see [Saving user bindings](#saving-user-bindings)).
- Remove listeners with `inputProfile.removeEventListener(...)` using the same
  function reference.

### Step 5: Handle device readiness

Some devices (notably the Novation Launchpads) need to be in a specific mode
before they behave as the profile expects.
Profiles report this via the `readiness` event:

```ts
// `feedbackProfile` is created in the next step
inputProfile.addEventListener('readiness', ({ readiness }) => {
  switch (readiness.state) {
    case 'ready':
      break;
    case 'pending-mode-switch':
      // Device is in the wrong mode, but we can switch it ourselves.
      feedbackProfile.performModeSwitch?.();
      break;
    case 'unusable':
      // Needs manual intervention by the user (e.g. reconfiguring the device)
      showWarning(readiness.message);
      break;
  }
});
```

Both `pending-mode-switch` and `unusable` states include a `message` that is
suitable for showing to the user. The built-in profiles replay their most recent
readiness state to any listener added later, so it's fine to subscribe after
creating the profile.
`performModeSwitch` is only defined on feedback profiles for devices that
need it, and you should always call `close()` when you're done to put the
device back how you found it (see [Cleaning up](#cleaning-up)).

### Step 6: Send feedback (lights, motorised faders, ...)

If the sub-profile has a `feedback` initializer (it is `null` otherwise),
create a `MidiFeedbackProfile`. You need to give it your input profile,
and a function it can use to send raw messages:

```ts
if (subProfile.feedback) {
  const feedbackProfile = subProfile.feedback({
    connection: input,
    inputProfile,
    sendMessage: (message) => outputConnection.sendMessage(message),
  });

  feedbackProfile.clear(); // reset all items to their default state
  feedbackProfile.setItemColor('some-item-id', {
    mode: 'active', // 'empty' | 'ready' | 'active'
    color: [255, 0, 0], // optional RGB, each 0-255
  });
  feedbackProfile.setItemValue('some-fader-id', 0.5); // 0 → 1, for motorised faders / encoder LEDs
  feedbackProfile.frameFinished(); // flush everything above to the device
}
```

Feedback is **batched into frames**. Make as many `setItemColor` /
`setItemValue` / `clear` calls as you like, then call `frameFinished()` once to
let the profile optimise & send the messages. A good rule of thumb is to call it
once at the end of each render / update, and don't forget to call it after `clear()`.

About colours:

- `mode` is always required. It lets devices without full RGB (e.g. single-colour
  or palette LEDs) pick something sensible. If you omit `color` the profile
  chooses a default colour for that mode.
- When `color` is provided, the profile maps it to the **closest colour the device
  can actually display**, so don't assume an exact match on palette-based devices.
- Item IDs come from the **input** profile (`inputProfile.getItems()`), so
  the same IDs are used for both input and output.

To find out what each item is capable of, use the feedback capabilities:

```ts
const capabilities = inputProfile.getFeedbackCapabilities();
// Record<string, FeedbackCapabilityProfile>

for (const item of inputProfile.getItems()) {
  const capability = item.feedback ? capabilities[item.feedback] : undefined;
  if (capability?.led?.type === 'rgb') {
    // full RGB, capability.led.limits has the bit-depth of each channel
  } else if (capability?.led?.type === 'palette') {
    // limited palette, capability.led.palette is the list of available colours
  }
  // also: capability.motorizedFader, capability.encoderLEDs.modes
}
```

### Cleaning up

Always `await feedbackProfile.close?.()` before closing the underlying MIDI
connections. It resets any device state that the profile changed (such as
reverting from Programmer mode), and removes any listeners it has set up.
The [complete example](#complete-nodejs-example) below shows the correct order of
shutdown.

### Saving user bindings

If your app lets users bind controls to actions with a "MIDI learn" feature,
**don't** store `MidiControllerItem.id` values. They may change when the user
switches profile or when a profile gets updated.
Store a `MidiBindableIdentity` instead,
which identifies the underlying control from the raw MIDI message
(type + channel + note / controller):

```ts
import {
  midiMessageToIdentity,
  midiIdentityToKey,
  midiKeyToIdentity,
} from '@talisman-midi/talisman/util';

// During "learn", capture the identity of the message that was received
const identity = midiMessageToIdentity(parsedMessage); // MidiBindableIdentity | null
if (identity) {
  const key = midiIdentityToKey(identity); // a string, safe to use as a map key / store in config
  bindings[key] = myAction;
}

// Later, on every message...
const received = midiMessageToIdentity(parsedMessage);
const binding = received && bindings[midiIdentityToKey(received)];

// And to restore from storage
const restored = midiKeyToIdentity(key); // MidiBindableIdentity | null
```

Because this operates on raw messages it keeps working for devices
with `generic` profiles, and for messages that a profile doesn't understand yet.

### Colour utilities

`@talisman-midi/talisman/color` has a number of helpers that are useful when
working with LED feedback, e.g:

```ts
import {
  hexToRGB,
  rgbToHsl,
  hslToRgb,
  colorDistance,
  addRGB,
  COLORS,
  type RGB,
} from '@talisman-midi/talisman/color';

const red: RGB = hexToRGB('#ff0000');
```

If you are writing your own profile for a device with a fixed palette,
`createColorSpace` precomputes a constant-time lookup from any RGB value to the
closest value(s) the device understands (see its usage in
[`packages/profiles`](./packages/profiles/src/devices/shared/novation.ts)).

### Misc. helpers

`@talisman-midi/talisman/util` also contains functions for working with item
positions (`MidiCoordinateInfo`: `row`, `col`, `orientation`) such as
`getPositions`, `getRowsAndColumns`, `getCenterPosition` and `getCoordinateRanges`,
useful for rendering a device layout or treating a grid controller as a
canvas. `getMidiMessageDescription` produces a human-readable
description of a message, which is handy for building MIDI monitors.
Rows are typically 0-indexed from the **bottom**, and columns from the left.

## Writing your own profile

Profiles aren't limited to the ones shipped in `@talisman-midi/profiles`:
anything matching the `MidiProfileDefinition` type works with every helper above.
(If you want to contribute a device back to the project please read the
[contributing guidelines](./CONTRIBUTING.md) first.)

The simplest possible profile uses `MidiProfileBasic`, which implements event
handling and `receiveMessage` for you, and just needs to know how to turn a
parsed message into an action:

```ts
import type {
  MidiControllerItem,
  MidiProfileDefinition,
} from '@talisman-midi/talisman/core';
import { MidiProfileBasic } from '@talisman-midi/talisman/profile';

const PLAY_BUTTON: MidiControllerItem = {
  id: 'play',
  label: 'Play',
  note: [{ id: { type: 'note', channel: 0, note: 60 } }],
};

export const MY_DEVICE: MidiProfileDefinition = {
  name: 'My Device',
  testing: { ready: false },
  autoSelect: ({ name }) => name.includes('My Device'),
  subProfiles: {
    default: {
      name: 'Default',
      input: () =>
        new MidiProfileBasic({
          getItems: () => [PLAY_BUTTON],
          getItem: (id) => (id === PLAY_BUTTON.id ? PLAY_BUTTON : null),
          getFeedbackCapabilities: () => ({}),
          getAction: (message) =>
            message.type === 'note' && message.note === 60
              ? {
                  item: 'play',
                  action:
                    message.action === 'on' ? 'button-press' : 'button-release',
                  nature: { nature: 'unknown' },
                }
              : null,
        }),
      feedback: null,
    },
  },
};
```

Then use it just like a built-in profile, either passed directly or alongside the
known ones, e.g.
`autoSelectProfileAndSubprofile(input, { ...KNOWN_MIDI_PROFILES, 'my-device': MY_DEVICE })`.

- Extend `MidiProfileBase` directly if you need more control, for example to emit
  `readiness` events with `setReadiness(...)` for devices that need mode switching.
- Use `createBasicColorVelocityFeedbackProfile` from
  `@talisman-midi/talisman/feedback` for devices that take a colour as a note / CC
  velocity (simple palette-LED grids).
- The profiles in [`packages/profiles/src/devices`](./packages/profiles/src/devices/)
  are the best reference for more complex behaviour.

## Using in the browser (Web MIDI)

Nothing in either package depends on Node.js, so the same code works in a
browser. The only difference is where you get your connections from:

```ts
const access = await navigator.requestMIDIAccess({ sysex: true });
const inputs = [...access.inputs.values()];
const outputs = [...access.outputs.values()];

// MIDIInput / MIDIOutput both have a `name`, so they can be passed straight in.
const output = autoSelectOutputForInput(input, outputs, profile);

input.onmidimessage = (event) => {
  if (!event.data) return;
  for (const [parsed] of parseMidiMessages(Array.from(event.data))) {
    inputProfile.receiveMessage(parsed);
  }
};

// sendMessage for the feedback profile:
const sendMessage = (message: number[]) => output.send(message);
```

> Many devices need SysEx messages (for example the "Sysex RGB" sub-profiles of
> the Launchpads and APC Mini Mk2), so request `sysex: true`. The user will need
> to accept the browser's permission prompt for feedback to work.

## Complete Node.js Example

Here's an example app that:

- Runs in Node.js (not the browser) using `@arcanewizards/midi`
- connects to ALL connected MIDI devices that use a
  known profile defined in '@talisman-midi/profiles'
- checks if they need to switch modes, and does it automatically
- listens for button presses, and lights up the output red when they are pressed
- cleanly shuts-down, and resets the mode of any device that was switched.

> It's also defined in the directory [examples/node](./examples/node/) if you
> want to clone the repo and simply run it

```ts
import { midi, MIDIInput, MIDIOutput } from '@arcanewizards/midi';
import {
  autoSelectProfileAndSubprofile,
  autoSelectOutputForInput,
  parseMidiMessages,
  MidiFeedbackProfile,
} from '@talisman-midi/talisman';
import {
  KNOWN_MIDI_PROFILES,
  isKnownMidiProfile,
} from '@talisman-midi/profiles';

const inputConnections: MIDIInput[] = [];
const outputConnections: MIDIOutput[] = [];
const outputProfiles: MidiFeedbackProfile[] = [];

const run = async () => {
  const midiInstance = await midi();

  const inputs = await midiInstance.getInputs();
  const outputs = await midiInstance.getOutputs();
  const inputsWithProfilesAndOutputs = inputs
    .map((input) => {
      const profileIdPair = autoSelectProfileAndSubprofile(
        input,
        KNOWN_MIDI_PROFILES,
      );
      if (!profileIdPair || !isKnownMidiProfile(profileIdPair[0])) {
        return null;
      }
      const profile = KNOWN_MIDI_PROFILES[profileIdPair[0]];
      const output = autoSelectOutputForInput(input, outputs, profile);
      if (!output) {
        return null;
      }
      return {
        input,
        profile,
        output,
      };
    })
    .filter((x) => x !== null);

  if (inputsWithProfilesAndOutputs.length === 0) {
    console.log('No valid MIDI inputs with profiles and outputs found.');
    return;
  }

  console.log('Valid MIDI inputs with profiles and outputs:');
  inputsWithProfilesAndOutputs.forEach(({ input, profile, output }) => {
    console.log(
      `Input: ${input.name}, Profile: ${profile.name}, Output: ${output.name ?? 'None'}`,
    );
  });

  for (const device of inputsWithProfilesAndOutputs) {
    // Establish MIDI connections
    const inputConnection = await midiInstance.openInput(device.input);
    inputConnections.push(inputConnection);
    const outputConnection = await midiInstance.openOutput(device.output);
    outputConnections.push(outputConnection);

    // Set up & connect talisman profiles
    if (!device.profile.subProfiles.default.feedback) {
      console.warn(
        `No feedback profile found for device: ${device.input.name}`,
      );
      continue;
    }

    const inputProfile = device.profile.subProfiles.default.input({
      connection: device.input,
    });
    inputConnection.addEventListener('message', (event) => {
      for (const [msg] of parseMidiMessages(event.message))
        inputProfile.receiveMessage(msg);
    });

    const outputProfile = device.profile.subProfiles.default.feedback({
      connection: device.input,
      inputProfile,
      sendMessage: outputConnection.sendMessage,
    });
    outputProfiles.push(outputProfile);

    // Clear the output's feedback
    outputProfile.clear();
    outputProfile.frameFinished();

    // Add listeners to profiles
    inputProfile.addEventListener('readiness', ({ readiness }) => {
      // Some devices require switching into a different mode
      // such as the Novation Launchpad devices
      // remember to call outputProfile.close() when you close a connection
      // to revert a device back to its original state
      if (readiness.state === 'pending-mode-switch') {
        console.warn(
          `Automatically performing mode switch for device: ${device.input.name}`,
        );
        outputProfile.performModeSwitch?.();
      }
    });

    inputProfile.addEventListener('action', ({ action }) => {
      console.log('Action received:', action);

      if (action.action === 'button-press') {
        outputProfile.setItemColor(action.item, {
          mode: 'active',
          color: [255, 0, 0],
        });
      } else if (action.action === 'button-release') {
        outputProfile.setItemColor(action.item, {
          mode: 'empty',
          color: [0, 0, 0],
        });
      }
      outputProfile.frameFinished();
    });
  }
};

run().catch(console.error);

/**
 * it's important to shut-down and close profiles properly
 */
const shutdown = async () => {
  // Make sure you close output profiles before the connections themselves
  for (const outputProfile of outputProfiles) {
    await outputProfile.close?.();
  }
  // Finally close connections
  for (const input of inputConnections) {
    input.close();
  }
  for (const output of outputConnections) {
    output.close();
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
```
