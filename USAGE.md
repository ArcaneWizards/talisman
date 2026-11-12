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

## Basic API Usage

TODO

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
