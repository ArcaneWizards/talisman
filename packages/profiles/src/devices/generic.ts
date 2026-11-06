import type {
  MidiProfileInit,
  MidiProfileDefinition,
} from '@talisman-midi/talisman/core';
import { MidiProfileBasic } from '@talisman-midi/talisman/profile';

type GenericProfileOptions = {
  interpretZeroNoteOnAsRelease?: boolean;
};

export const createProfile = ({
  interpretZeroNoteOnAsRelease,
}: GenericProfileOptions) => {
  return new MidiProfileBasic({
    getItem: () => null,
    getItems: () => [],
    getFeedbackCapabilities: () => ({}),
    getAction: (msg) => {
      if (msg.type === 'note') {
        const action =
          msg.action === 'off' ||
          (interpretZeroNoteOnAsRelease && msg.velocity === 0)
            ? 'button-release'
            : 'button-press';
        return {
          action,
          item: `note-${msg.channel}-${msg.note}`,
          nature: { nature: 'unknown' },
        };
      }
      if (msg.type === 'control-change') {
        return {
          action: 'absolute-value',
          item: `cc-${msg.channel}-${msg.controller}`,
          nature: { nature: 'unknown' },
          value: msg.value / 127,
          precisionBits: 7,
        };
      }
      if (msg.type === 'polyphonic-aftertouch') {
        return {
          action: 'absolute-value',
          item: `aftertouch-${msg.channel}-${msg.note}`,
          nature: { nature: 'unknown' },
          value: msg.pressure / 127,
          precisionBits: 7,
        };
      }
      if (msg.type === 'pitch-wheel') {
        return {
          action: 'absolute-value',
          item: `pitch-wheel-${msg.channel}`,
          nature: { nature: 'unknown' },
          value: msg.value / 16383,
          precisionBits: 14,
        };
      }
      if (msg.type === 'channel-aftertouch') {
        return {
          action: 'absolute-value',
          item: `aftertouch-${msg.channel}`,
          nature: { nature: 'unknown' },
          value: msg.pressure / 127,
          precisionBits: 7,
        };
      }
      return null;
    },
  });
};

export const createGenericProfile: MidiProfileInit = () => {
  return createProfile({ interpretZeroNoteOnAsRelease: false });
};

export const createGenericProfileZeroNoteOn: MidiProfileInit = () => {
  return createProfile({ interpretZeroNoteOnAsRelease: true });
};

export const GENERIC: MidiProfileDefinition = {
  name: 'Generic',
  testing: {
    ready: true,
    maintainers: [
      {
        ghUsername: 's0',
        os: ['macos', 'windows'],
        date: '2026-10-15',
      },
    ],
  },
  autoSelect: () => false,
  subProfiles: {
    default: {
      name: 'Default',
      input: createGenericProfile,
      feedback: null,
    },
    zeroNoteOn: {
      name: 'Zero Note On',
      input: createGenericProfileZeroNoteOn,
      feedback: null,
    },
  },
};
