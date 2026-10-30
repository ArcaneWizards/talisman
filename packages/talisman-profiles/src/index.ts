import type {
  MidiInputConnectionInfo,
  MidiProfileDefinition,
} from '@arcanewizards/talisman';
import { AKAI_APC_MINI_MK_2 } from './devices/akai-apcmini-mk2.js';
import {
  createGenericProfile,
  createGenericProfileZeroNoteOn,
} from './devices/generic.js';
import {
  createHerculesDJControlInpulse300FeedbackProfile,
  createHerculesDJControlInpulse300Profile,
} from './devices/hercules.js';
import {
  createBitchboyFeedback,
  createBitchboyProfile,
} from './devices/bitchboy.js';
import {
  createNovationLaunchpadMk2MiniFeedbackProfile,
  createNovationLaunchpadMk2MiniProfile,
} from './devices/novation-launchpad-mk2-mini.js';
import {
  createNovationLaunchpadMk2ProFeedbackProfile,
  createNovationLaunchpadMk2ProFeedbackProfileRGB,
  createNovationLaunchpadMk2ProProfileProgrammerMode,
} from './devices/novation-launchpad-mk2-pro.js';
import {
  createNovationLaunchpadMk2FeedbackProfile,
  createNovationLaunchpadMk2FeedbackProfileRGB,
  createNovationLaunchpadMk2ProfileSessionMode,
} from './devices/novation-launchpad-mk2.js';
import { NOVATION_LAUNCHPAD_MK3_X } from './devices/novation-launchpad-mk3-x.js';
import {
  createNovationLaunchpadMk3MiniFeedbackProfile,
  createNovationLaunchpadMk3MiniFeedbackProfileRGB,
  createNovationLaunchpadMk3MiniProfileSessionMode,
} from './devices/novation-launchpad-mk3-mini.js';
import { MIDI_FIGHTER_TWISTER } from './devices/midi-fighter-twister.js';
import { MIDI_FIGHTER_3D } from './devices/midi-fighter-3d.js';

export const KNOWN_MIDI_PROFILES = Object.freeze({
  generic: {
    name: 'Generic',
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
  },
  'akai-apimini-mk2': AKAI_APC_MINI_MK_2,
  bitchboy: {
    name: 'BitchBoy',
    autoSelect: (connection: MidiInputConnectionInfo) =>
      connection.inputDeviceName.includes('BitchBoy'),
    subProfiles: {
      default: {
        name: 'Default',
        input: createBitchboyProfile,
        feedback: createBitchboyFeedback,
      },
    },
  },
  'hercules-djcontrol-inpulse-300': {
    name: 'Hercules DJControl Inpulse 300',
    autoSelect: (connection: MidiInputConnectionInfo) =>
      connection.inputDeviceName.includes('DJControl Inpulse 300'),
    subProfiles: {
      default: {
        input: createHerculesDJControlInpulse300Profile,
        feedback: createHerculesDJControlInpulse300FeedbackProfile,
      },
    },
  },
  'midi-fighter-twister': MIDI_FIGHTER_TWISTER,
  'midi-fighter-3d': MIDI_FIGHTER_3D,
  'novation-launchpad-mk2-mini': {
    name: 'Launchpad Mini (mk2)',
    autoSelect: (connection: MidiInputConnectionInfo) =>
      connection.inputDeviceName.includes('Launchpad Mini'),
    subProfiles: {
      default: {
        name: 'Default (Red + Green LED Only)',
        input: createNovationLaunchpadMk2MiniProfile,
        feedback: createNovationLaunchpadMk2MiniFeedbackProfile,
      },
    },
  },
  'novation-launchpad-mk2-pro': {
    // Note these are the same device, and you often see both names in the wild,
    // though it was officially released as part of the mk2 series.
    name: 'Launchpad Pro (mk1 / mk2)',
    autoSelect: () => false,
    subProfiles: {
      default: {
        name: 'Programmer Mode - Sysex RGB Feedback',
        input: createNovationLaunchpadMk2ProProfileProgrammerMode,
        feedback: createNovationLaunchpadMk2ProFeedbackProfileRGB,
      },
      notes: {
        name: 'Programmer Mode - Note Feedback',
        input: createNovationLaunchpadMk2ProProfileProgrammerMode,
        feedback: createNovationLaunchpadMk2ProFeedbackProfile,
      },
    },
  },
  'novation-launchpad-mk2': {
    name: 'Launchpad (mk2)',
    autoSelect: (connection: MidiInputConnectionInfo) =>
      connection.inputDeviceName === 'Launchpad',
    subProfiles: {
      default: {
        name: 'Session Mode - Sysex RGB Feedback',
        input: createNovationLaunchpadMk2ProfileSessionMode,
        feedback: createNovationLaunchpadMk2FeedbackProfileRGB,
      },
      notes: {
        name: 'Session Mode - Note Feedback',
        input: createNovationLaunchpadMk2ProfileSessionMode,
        feedback: createNovationLaunchpadMk2FeedbackProfile,
      },
    },
  },
  'novation-launchpad-mk3-x': NOVATION_LAUNCHPAD_MK3_X,
  'novation-launchpad-mk3-mini': {
    name: 'Launchpad Mini (mk3)',
    autoSelect: (connection: MidiInputConnectionInfo) =>
      connection.inputDeviceName.includes('LPMiniMK3'),
    subProfiles: {
      default: {
        name: 'Sysex RGB Feedback',
        notice:
          'To be able to control the lights of the top row of buttons, please ensure your launchpad is in Programmer mode',
        input: createNovationLaunchpadMk3MiniProfileSessionMode,
        feedback: createNovationLaunchpadMk3MiniFeedbackProfileRGB,
      },
      notes: {
        name: 'Note Feedback',
        notice:
          'To be able to control the lights of the top row of buttons, please ensure your launchpad is in Programmer mode',
        input: createNovationLaunchpadMk3MiniProfileSessionMode,
        feedback: createNovationLaunchpadMk3MiniFeedbackProfile,
      },
    },
  },
} satisfies Record<string, MidiProfileDefinition>);

export type KnownMidiProfile = keyof typeof KNOWN_MIDI_PROFILES;
