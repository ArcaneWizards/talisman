import { midi, MIDIInput, MIDIOutput } from '@arcanewizards/midi';
import {
  autoSelectProfileAndSubprofile,
  autoSelectOutputForInput,
  parseMidiMessages,
  MidiFeedbackProfile,
} from '@talisman-midi/talisman';
import { KNOWN_MIDI_PROFILES } from '@talisman-midi/profiles';

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
      if (!profileIdPair) {
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
