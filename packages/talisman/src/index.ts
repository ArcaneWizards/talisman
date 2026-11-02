import {
  getMidiChannel,
  getMidiController,
  getMidiNote,
  MIDI_CHANNEL_AFTERTOUCH,
  MIDI_CONTROL_CHANGE,
  MIDI_MTC,
  MIDI_NOTE_OFF,
  MIDI_NOTE_ON,
  MIDI_PITCH_WHEEL,
  MIDI_POLYPHONIC_AFTERTOUCH,
  MIDI_PROGRAM_CHANGE,
  MIDI_SYSEX,
  type MidiInputConnectionInfo,
  type MidiOutputConnectionInfo,
  type MidiParsedMessage,
  type MidiProfileDefinition,
  type MidiProfileSubprofileDefaultKey,
} from './core.js';

export * from './core.js';

/**
 * Auto select a profile based on the given MIDI connection information.
 *
 * @returns either null, or a pair of strings representing the keys for the main
 * profile and sub-profile.
 */
export const autoSelectProfileAndSubprofile = (
  connection: MidiInputConnectionInfo,
  profiles: Record<string, MidiProfileDefinition>,
  mainProfile?: string,
): null | [string, string] => {
  if (!mainProfile) {
    for (const [key, profile] of Object.entries(profiles)) {
      if (profile.autoSelect(connection)) {
        mainProfile = key;
        break;
      }
    }
  }

  if (!mainProfile) {
    return null;
  }

  for (const [subKey, subProfile] of Object.entries(
    profiles[mainProfile]?.subProfiles ?? {},
  )) {
    if (subProfile.autoSelect?.(connection)) {
      return [mainProfile, subKey];
    }
  }

  return [mainProfile, 'default' satisfies MidiProfileSubprofileDefaultKey];
};

export const autoSelectOutputForInput = (
  input: MidiInputConnectionInfo,
  outputs: MidiOutputConnectionInfo[],
  profile: MidiProfileDefinition,
): MidiOutputConnectionInfo | null => {
  if (profile.autoSelectOutput) {
    return profile.autoSelectOutput(input, outputs);
  }
  // Fall-back to exact name match
  const exactMatch = outputs.find(
    (o) => o.outputDeviceName === input.inputDeviceName,
  );
  if (exactMatch) {
    return exactMatch;
  }

  return null;
};

const parseMidiMessage = (
  message: number[],
  offset: number,
): MidiParsedMessage => {
  const a = message[offset];
  const b = message[offset + 1];
  const c = message[offset + 2];

  if (!a) {
    throw new Error('Invalid MIDI message: missing status byte');
  }

  if (a === MIDI_SYSEX) {
    return {
      type: 'sysex',
      message,
    };
  }
  if (a === MIDI_MTC) {
    return {
      type: 'mtc',
      message,
    };
  }

  const status = a & 0xf0;
  const channel = getMidiChannel(a & 0x0f);

  switch (status) {
    case MIDI_NOTE_ON:
      if (b === undefined || c === undefined) {
        throw new Error('Invalid NOTE_ON message: missing note or velocity');
      }
      return {
        message,
        type: 'note',
        action: 'on',
        channel,
        note: getMidiNote(b),
        velocity: c,
      };
    case MIDI_NOTE_OFF:
      if (b === undefined || c === undefined) {
        throw new Error('Invalid NOTE_OFF message: missing note or velocity');
      }
      return {
        message,
        type: 'note',
        action: 'off',
        channel,
        note: getMidiNote(b),
        velocity: c,
      };
    case MIDI_POLYPHONIC_AFTERTOUCH:
      if (b === undefined || c === undefined) {
        throw new Error(
          'Invalid POLYPHONIC_AFTERTOUCH message: missing note or pressure',
        );
      }
      return {
        message,
        type: 'polyphonic-aftertouch',
        channel,
        note: getMidiNote(b),
        pressure: c,
      };
    case MIDI_CONTROL_CHANGE:
      if (b === undefined || c === undefined) {
        throw new Error(
          'Invalid CONTROL_CHANGE message: missing controller or value',
        );
      }
      return {
        message,
        type: 'control-change',
        channel,
        controller: getMidiController(b),
        value: c,
      };
    case MIDI_PROGRAM_CHANGE:
      if (b === undefined) {
        throw new Error('Invalid PROGRAM_CHANGE message: missing program');
      }
      return {
        message,
        type: 'program-change',
        channel,
        program: b,
      };
    case MIDI_CHANNEL_AFTERTOUCH:
      if (b === undefined) {
        throw new Error('Invalid CHANNEL_AFTERTOUCH message: missing pressure');
      }
      return {
        message,
        type: 'channel-aftertouch',
        channel,
        pressure: b,
      };
    case MIDI_PITCH_WHEEL:
      if (b === undefined || c === undefined) {
        throw new Error('Invalid PITCH_WHEEL message: missing value');
      }
      return {
        message,
        type: 'pitch-wheel',
        channel,
        value: (c << 7) | b,
      };
    default:
      return {
        type: 'other',
        message,
      };
  }
};

export const parseSingleMidiMessage = (msg: number[]): MidiParsedMessage =>
  parseMidiMessage(msg, 0);

/**
 * Given a raw MIDI message,
 * return a generator that yields all the valid & parsed MIDI messages.
 *
 * This will handle cases where devices sometimes send multiple MIDI messages
 * in one sequence instead of individually when they occur in quick succession
 * (such as with the Behringer X-Touch extender, when turning encoders fast).
 *
 * It is recommended to use this instead of {@link parseSingleMidiMessage}
 * so that these cases are handled for you automatically.
 *
 * @yields {[MidiParsedMessage, number[]]} A tuple containing the parsed MIDI message and the consumed message bytes.
 */
export function* parseMidiMessages(
  message: number[],
): Generator<[MidiParsedMessage, number[]]> {
  if (message.length === 3) {
    // Fast path for the most common case
    yield [parseMidiMessage(message, 0), message];
    return;
  }
  // Handle non-standard midi messages
  let offset = 0;
  while (offset < message.length) {
    const msg = parseMidiMessage(message, offset);
    if (msg.type === 'sysex') {
      yield [msg, message.slice(offset)];
      offset = message.length;
    } else {
      yield [msg, message.slice(offset, offset + 3)];
      offset += 3;
    }
  }
}

export const midiNoteOn = (
  channel: number,
  note: number,
  velocity: number,
): [number, number, number] => {
  return [MIDI_NOTE_ON | (channel & 0xf), note, velocity];
};

export const midiNoteOff = (
  channel: number,
  note: number,
  velocity: number,
): [number, number, number] => {
  return [MIDI_NOTE_OFF | (channel & 0xf), note, velocity];
};

export const midiControlChange = (
  channel: number,
  controller: number,
  value: number,
): [number, number, number] => {
  return [MIDI_CONTROL_CHANGE | (channel & 0xf), controller, value];
};
