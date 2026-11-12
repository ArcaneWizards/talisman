import {
  getMidiController,
  getMidiNote,
  MIDI_NOTE_ON,
  MidiInputConnectionInfo,
  MidiNoteIdentity,
  MidiButtonNature,
  MidiControllerAction,
  MidiControllerItem,
  MidiNumericNature,
  MidiProfile,
  MidiProfileInit,
  MidiFeedbackProfileInit,
  MidiProfileDefinition,
  MidiProfileFeedbackCapabilities,
} from '@talisman-midi/talisman';
import {
  ColorSpace,
  createColorSpace,
  RGB,
} from '@talisman-midi/talisman/color';
import { MidiProfileBasic } from '@talisman-midi/talisman/profile';
import { AKAI_VELOCITY_TO_RGB } from './akai-apcmini-mk2.js';

const itemId = (type: 'cc' | 'note', index: number) => `${type}:${index}`;

const FEEDBACK_CAPABILITY_KEY = 'key';

export const createBitchboyProfile: MidiProfileInit = () => {
  const items: Record<string, MidiControllerItem> = {};
  const buttonNatures: Record<string, MidiButtonNature> = {};
  const controllerNatures: Record<string, MidiNumericNature> = {};

  {
    // Encapsulate to leave out of scope

    // 3x3 Pad Grid Right
    const PAD_3X3_NOTES = [36, 37, 38, 40, 41, 42, 44, 45, 46];
    for (let i = 0; i < PAD_3X3_NOTES.length; i++) {
      const note = getMidiNote(PAD_3X3_NOTES[i]!);
      const col = (i % 3) + 11;
      const row = Math.floor(i / 3);
      const id = itemId('note', note);
      const nature: MidiButtonNature = { nature: 'grid' };
      items[id] = {
        id,
        note: [{ id: { type: 'note', channel: 0, note }, nature }],
        label: `Grid (${col}, ${row})`,
        position: {
          col,
          row,
        },
        feedback: FEEDBACK_CAPABILITY_KEY,
      };
      buttonNatures[id] = nature;
    }

    // 4x1 Pad Row Left
    for (let i = 0; i < 4; i++) {
      const note = getMidiNote(i + 48);
      const col = i;
      const row = 3;
      const id = itemId('note', note);
      const nature: MidiButtonNature = {
        nature: 'grid',
      };
      items[id] = {
        id,
        note: [{ id: { type: 'note', channel: 0, note }, nature }],
        label: `Pad Row (${col})`,
        position: {
          col,
          row,
        },
        feedback: FEEDBACK_CAPABILITY_KEY,
      };
      buttonNatures[id] = nature;
    }

    // 4x4 Pad Grid Left
    for (let i = 0; i < 16; i++) {
      const note = getMidiNote(i + 52);
      const col = i % 4;
      const row = (i >> 2) + 4;
      const id = itemId('note', note);
      const nature: MidiButtonNature = { nature: 'grid' };
      items[id] = {
        id,
        note: [{ id: { type: 'note', channel: 0, note }, nature }],
        label: `Grid (${col}, ${row})`,
        position: {
          col,
          row,
        },
        feedback: FEEDBACK_CAPABILITY_KEY,
      };
      buttonNatures[id] = nature;
    }

    // 4x1 Pad Row Right
    for (let i = 0; i < 4; i++) {
      const note = getMidiNote(i + 80);
      const col = i + 4;
      const row = 3;
      const id = itemId('note', note);
      const nature: MidiButtonNature = {
        nature: 'grid',
      };
      items[id] = {
        id,
        note: [{ id: { type: 'note', channel: 0, note }, nature }],
        label: `Pad Row (${col})`,
        position: {
          col,
          row,
        },
        feedback: FEEDBACK_CAPABILITY_KEY,
      };
      buttonNatures[id] = nature;
    }

    // 4x4 Pad Grid Right
    for (let i = 0; i < 16; i++) {
      const note = getMidiNote(i + 84);
      const col = (i % 4) + 4;
      const row = (i >> 2) + 4;
      const id = itemId('note', note);
      const nature: MidiButtonNature = { nature: 'grid' };
      items[id] = {
        id,
        note: [{ id: { type: 'note', channel: 0, note }, nature }],
        label: `Grid (${col}, ${row})`,
        position: {
          col,
          row,
        },
        feedback: FEEDBACK_CAPABILITY_KEY,
      };
      buttonNatures[id] = nature;
    }

    // Faders
    for (let col = 0; col < 8; col++) {
      const controller = getMidiController(col);
      const id = itemId('cc', controller);
      const nature: MidiNumericNature = {
        nature: 'fader',
        role: 'misc',
      };
      items[id] = {
        id,
        label: `Fader ${col}`,
        controlChange: [
          {
            id: { type: 'control-change', channel: 0, controller },
            nature,
          },
        ],
        position: {
          col,
          row: [0, 2],
          orientation: 'vertical',
        },
        feedback: null,
      };
      controllerNatures[id] = nature;
    }

    // FX Sliders
    for (let i = 0; i < 4; i++) {
      const controller = getMidiController(8 + i);
      const row = 7 - i;
      const id = itemId('cc', controller);
      const nature: MidiNumericNature = {
        nature: 'fader',
        role: 'misc',
      };
      items[id] = {
        id,
        label: `FX Slider ${i}`,
        controlChange: [
          {
            id: { type: 'control-change', channel: 0, controller },
            nature,
          },
        ],
        position: {
          col: [8, 10],
          row,
          orientation: 'horizontal',
        },
        feedback: null,
      };
      controllerNatures[id] = nature;
    }

    controllerNatures[12] = {
      nature: 'xy-pad',
      role: 'x',
    };
    controllerNatures[13] = {
      nature: 'xy-pad',
      role: 'y',
    };
    controllerNatures[14] = {
      nature: 'xy-pad',
      role: 'press',
    };

    // Knobs
    for (let i = 0; i < 8; i++) {
      const controller = getMidiController(i + 20);
      const row = 7 - (i >> 1);
      const col = ((i % 2) << 1) + 11;
      const id = itemId('cc', controller);
      const nature: MidiNumericNature = {
        nature: 'encoder',
        role: 'misc',
      };
      items[id] = {
        id,
        label: `Knob ${i}`,
        controlChange: [
          {
            id: { type: 'control-change', channel: 0, controller },
            nature,
          },
        ],
        position: {
          col,
          row,
          orientation: 'circular',
        },
        feedback: null,
      };
      controllerNatures[id] = nature;
    }
  }

  const TRACKPAD_ITEM: MidiControllerItem = {
    id: 'trackpad',
    label: 'Trackpad',
    position: {
      col: [8, 10],
      row: [0, 2],
      orientation: 'xy',
    },
    controlChange: [
      {
        id: { type: 'control-change', channel: 0, controller: 12 },
        nature: controllerNatures[12],
      },
      {
        id: { type: 'control-change', channel: 0, controller: 13 },
        nature: controllerNatures[13],
      },
      {
        id: { type: 'control-change', channel: 0, controller: 14 },
        nature: controllerNatures[14],
      },
    ],
    feedback: null,
  };
  items[TRACKPAD_ITEM.id] = TRACKPAD_ITEM;

  return new MidiProfileBasic({
    getItems: () => Object.values(items),
    getItem: (id) => items[id] ?? null,
    getFeedbackCapabilities: () =>
      Object.freeze({
        [FEEDBACK_CAPABILITY_KEY]: {
          led: {
            type: 'palette',
            brightnessValues: 1,
            palette: getBitchboyVelocityToRGB().reduce<RGB[]>(
              (acc, _, i, arr) => {
                if (i % 3 === 0) {
                  const r = arr[i];
                  const g = arr[i + 1];
                  const b = arr[i + 2];
                  if (r === undefined || g === undefined || b === undefined) {
                    throw new Error(
                      `Invalid RGB values at index ${i}: [${r}, ${g}, ${b}]`,
                    );
                  }
                  acc.push([r, g, b]);
                }
                return acc;
              },
              [],
            ),
          },
        },
      } satisfies MidiProfileFeedbackCapabilities),
    getAction: (msg): MidiControllerAction | null => {
      if (msg.type === 'note') {
        const id = itemId(msg.type, msg.note);
        const nature = buttonNatures[id];
        if (!nature) {
          return null;
        }
        return {
          item: id,
          action: msg.action === 'on' ? 'button-press' : 'button-release',
          nature,
        };
      }
      if (msg.type === 'control-change') {
        let id: string;
        let nature: MidiNumericNature | undefined;
        if (msg.controller >= 12 && msg.controller <= 14) {
          id = TRACKPAD_ITEM.id;
          nature = controllerNatures[msg.controller];
        } else {
          id = itemId('cc', msg.controller);
          nature = controllerNatures[id];
        }

        if (!nature) {
          return null;
        }
        return {
          item: id,
          action: 'absolute-value',
          nature,
          value: msg.value / 127,
          precisionBits: 7,
        };
      }
      return null;
    },
  });
};

const getNoteIDs = (inputProfile: MidiProfile) => {
  const noteIDs: Record<string, MidiNoteIdentity> = {};
  for (const item of inputProfile.getItems()) {
    for (const note of item.note || []) {
      noteIDs[itemId('note', note.id.note)] = note.id;
    }
  }
  return noteIDs;
};

export const getBitchboyVelocityToRGB = () => {
  const bitchboyVelocityToRGB = [...AKAI_VELOCITY_TO_RGB];

  // Overwrite AKAI colours with BitchBoy colours
  {
    /**
     * See: https://github.com/chrisssstos/bitchboy_firmware/blob/main/firmware/bitchboy_main.ino#L1344
     */
    const overrides: Array<[number, number, number, number]> = [
      [0, 0x06, 0x06, 0x06], // BBOY GRAY
      [32, 0xd6, 0x35, 0x00], // BBOY ORANGE
      [64, 0x18, 0x18, 0x00], // BBOY YELLOW
      [95, 0x00, 0x20, 0x00], // BBOY GREEN
      [127, 0x00, 0x20, 0x00], // BBOY GREEN
    ];

    for (const [i, r, g, b] of overrides) {
      const startAddress = i * 3;
      bitchboyVelocityToRGB[startAddress] = r;
      bitchboyVelocityToRGB[startAddress + 1] = g;
      bitchboyVelocityToRGB[startAddress + 2] = b;
    }
  }
  return bitchboyVelocityToRGB;
};

export const createBitchboyColorSpace = (): ColorSpace<[number]> => {
  const bitchboyVelocityToRGB = getBitchboyVelocityToRGB();

  return createColorSpace({
    sizes: [bitchboyVelocityToRGB.length / 3],
    argsToRgb: ([velocity]) => {
      const velocityStartAddress = velocity * 3;
      const r = bitchboyVelocityToRGB[velocityStartAddress];
      const g = bitchboyVelocityToRGB[velocityStartAddress + 1];
      const b = bitchboyVelocityToRGB[velocityStartAddress + 2];

      if (r === undefined || g === undefined || b === undefined) {
        throw new Error(`Invalid RGB values for velocity: ${velocity}`);
      }

      return [r, g, b];
    },
    precision: [5, 5, 5],
  });
};

let colorSpace: ColorSpace<[number]> | null = null;

const BLACK: RGB = [0, 0, 0];

export const createBitchboyFeedback: MidiFeedbackProfileInit = ({
  inputProfile,
  sendMessage,
}) => {
  const noteIDs = getNoteIDs(inputProfile);
  const lastNoteValues = new Array<number>();

  return {
    clear: () => {
      if (!colorSpace) {
        colorSpace = createBitchboyColorSpace();
      }
      for (const item of inputProfile.getItems()) {
        for (const note of item.note || []) {
          const [velocity] = colorSpace.rgbToValue(BLACK);
          lastNoteValues[note.id.note] = velocity;
          sendMessage([MIDI_NOTE_ON, note.id.note, velocity]);
        }
      }
    },
    setItemColor: (idString, feedback) => {
      const id = noteIDs[idString];
      if (!id) {
        return;
      }
      if (!colorSpace) {
        colorSpace = createBitchboyColorSpace();
      }

      const [velocity] = colorSpace.rgbToValue(feedback.color ?? BLACK);

      const lastValue = lastNoteValues[id.note];
      if (lastValue === velocity) {
        return;
      }

      lastNoteValues[id.note] = velocity;
      sendMessage([MIDI_NOTE_ON, id.note, velocity & 0x7f]);
    },
    setItemValue: () => {
      // no-op: unsupported
    },
    frameFinished: () => {
      // no-op: unnecessary
    },
  };
};

export const BITCHBOY: MidiProfileDefinition = {
  name: 'BitchBoy',
  testing: {
    ready: true,
    manufacturer: [
      {
        ghUsername: 'chrisssstos',
        os: ['macos'],
        date: '2026-10-02',
      },
    ],
  },
  autoSelect: (connection: MidiInputConnectionInfo) =>
    connection.name.includes('BitchBoy'),
  subProfiles: {
    default: {
      name: 'Default',
      input: createBitchboyProfile,
      feedback: createBitchboyFeedback,
    },
  },
};
