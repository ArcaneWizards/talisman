import {
  getMidiController,
  getMidiNote,
  MIDI_NOTE_ON,
  MidiInputConnectionInfo,
  MidiNoteIdentity,
  MidiControllerAction,
  MidiProfile,
  MidiButtonNature,
  MidiControllerItem,
  MidiNumericNature,
  MidiProfileInit,
  MidiColorFeedback,
  MidiFeedbackProfile,
  MidiFeedbackProfileInit,
  MidiProfileDefinition,
  MidiProfileFeedbackCapabilities,
} from '@arcanewizards/talisman/core';
import { MidiProfileBasic } from '@arcanewizards/talisman/profile';
import {
  colorEqual,
  ColorSpace,
  createColorSpace,
  RGB,
} from '@arcanewizards/talisman/color';
import { midiNumberToValues } from '@arcanewizards/talisman/util';

export const AKAI_BRIGHTNESS_CHANNELS = Object.freeze([
  0.1, 0.25, 0.5, 0.65, 0.75, 0.9, 1.0,
]);

// prettier-ignore
export const AKAI_VELOCITY_TO_RGB = Object.freeze([
  0x00, 0x00, 0x00,
  0x1E, 0x1E, 0x1E,
  0x7F, 0x7F, 0x7F,
  0xFF, 0xFF, 0xFF,
  0xFF, 0x4C, 0x4C,
  0xFF, 0x00, 0x00,
  0x59, 0x00, 0x00,
  0x19, 0x00, 0x00,
  0xFF, 0xBD, 0x6C,
  0xFF, 0x54, 0x00,
  0x59, 0x1D, 0x00,
  0x27, 0x1B, 0x00,
  0xFF, 0xFF, 0x4C,
  0xFF, 0xFF, 0x00,
  0x59, 0x59, 0x00,
  0x19, 0x19, 0x00,
  0x88, 0xFF, 0x4C,
  0x54, 0xFF, 0x00,
  0x1D, 0x59, 0x00,
  0x14, 0x2B, 0x00,
  0x4C, 0xFF, 0x4C,
  0x00, 0xFF, 0x00,
  0x00, 0x59, 0x00,
  0x00, 0x19, 0x00,
  0x4C, 0xFF, 0x5E,
  0x00, 0xFF, 0x19,
  0x00, 0x59, 0x0D,
  0x00, 0x19, 0x02,
  0x4C, 0xFF, 0x88,
  0x00, 0xFF, 0x55,
  0x00, 0x59, 0x1D,
  0x00, 0x1F, 0x12,
  0x4C, 0xFF, 0xB7,
  0x00, 0xFF, 0x99,
  0x00, 0x59, 0x35,
  0x00, 0x19, 0x12,
  0x4C, 0xC3, 0xFF,
  0x00, 0xA9, 0xFF,
  0x00, 0x41, 0x52,
  0x00, 0x10, 0x19,
  0x4C, 0x88, 0xFF,
  0x00, 0x55, 0xFF,
  0x00, 0x1D, 0x59,
  0x00, 0x08, 0x19,
  0x4C, 0x4C, 0xFF,
  0x00, 0x00, 0xFF,
  0x00, 0x00, 0x59,
  0x00, 0x00, 0x19,
  0x87, 0x4C, 0xFF,
  0x54, 0x00, 0xFF,
  0x19, 0x00, 0x64,
  0x0F, 0x00, 0x30,
  0xFF, 0x4C, 0xFF,
  0xFF, 0x00, 0xFF,
  0x59, 0x00, 0x59,
  0x19, 0x00, 0x19,
  0xFF, 0x4C, 0x87,
  0xFF, 0x00, 0x54,
  0x59, 0x00, 0x1D,
  0x22, 0x00, 0x13,
  0xFF, 0x15, 0x00,
  0x99, 0x35, 0x00,
  0x79, 0x51, 0x00,
  0x43, 0x64, 0x00,
  0x03, 0x39, 0x00,
  0x00, 0x57, 0x35,
  0x00, 0x54, 0x7F,
  0x00, 0x00, 0xFF,
  0x00, 0x45, 0x4F,
  0x25, 0x00, 0xCC,
  0x7F, 0x7F, 0x7F,
  0x20, 0x20, 0x20,
  0xFF, 0x00, 0x00,
  0xBD, 0xFF, 0x2D,
  0xAF, 0xED, 0x06,
  0x64, 0xFF, 0x09,
  0x10, 0x8B, 0x00,
  0x00, 0xFF, 0x87,
  0x00, 0xA9, 0xFF,
  0x00, 0x2A, 0xFF,
  0x3F, 0x00, 0xFF,
  0x7A, 0x00, 0xFF,
  0xB2, 0x1A, 0x7D,
  0x40, 0x21, 0x00,
  0xFF, 0x4A, 0x00,
  0x88, 0xE1, 0x06,
  0x72, 0xFF, 0x15,
  0x00, 0xFF, 0x00,
  0x3B, 0xFF, 0x26,
  0x59, 0xFF, 0x71,
  0x38, 0xFF, 0xCC,
  0x5B, 0x8A, 0xFF,
  0x31, 0x51, 0xC6,
  0x87, 0x7F, 0xE9,
  0xD3, 0x1D, 0xFF,
  0xFF, 0x00, 0x5D,
  0xFF, 0x7F, 0x00,
  0xB9, 0xB0, 0x00,
  0x90, 0xFF, 0x00,
  0x83, 0x5D, 0x07,
  0x39, 0x2b, 0x00,
  0x14, 0x4C, 0x10,
  0x0D, 0x50, 0x38,
  0x15, 0x15, 0x2A,
  0x16, 0x20, 0x5A,
  0x69, 0x3C, 0x1C,
  0xA8, 0x00, 0x0A,
  0xDE, 0x51, 0x3D,
  0xD8, 0x6A, 0x1C,
  0xFF, 0xE1, 0x26,
  0x9E, 0xE1, 0x2F,
  0x67, 0xB5, 0x0F,
  0x1E, 0x1E, 0x30,
  0xDC, 0xFF, 0x6B,
  0x80, 0xFF, 0xBD,
  0x9A, 0x99, 0xFF,
  0x8E, 0x66, 0xFF,
  0x40, 0x40, 0x40,
  0x75, 0x75, 0x75,
  0xE0, 0xFF, 0xFF,
  0xA0, 0x00, 0x00,
  0x35, 0x00, 0x00,
  0x1A, 0xD0, 0x00,
  0x07, 0x42, 0x00,
  0xB9, 0xB0, 0x00,
  0x3F, 0x31, 0x00,
  0xB3, 0x5F, 0x00,
  0x4B, 0x15, 0x02,
]);

const FEEDBACK_CAPABILITY_BUTTON_GRID = 'grid';
const FEEDBACK_CAPABILITY_BUTTON_RED = 'red';
const FEEDBACK_CAPABILITY_BUTTON_GREEN = 'green';

const FEEDBACK_CAPABILITIES_RGB = Object.freeze({
  [FEEDBACK_CAPABILITY_BUTTON_GRID]: {
    led: {
      type: 'rgb',
      limits: {
        rBits: 8,
        gBits: 8,
        bBits: 8,
      },
    },
  },
  [FEEDBACK_CAPABILITY_BUTTON_RED]: {
    led: {
      type: 'single',
      brightnessValues: 1,
      color: [255, 0, 0],
      modes: ['solid', 'blink'],
    },
  },
  [FEEDBACK_CAPABILITY_BUTTON_GREEN]: {
    led: {
      type: 'single',
      brightnessValues: 1,
      color: [0, 255, 0],
      modes: ['solid', 'blink'],
    },
  },
} satisfies MidiProfileFeedbackCapabilities);

const STATIC_NOTES: Array<
  Omit<MidiControllerItem, 'id' | 'note'> & {
    nature: MidiButtonNature;
    note: MidiNoteIdentity;
  }
> = [
  {
    label: 'Volume',
    note: {
      type: 'note',
      channel: 0,
      note: 100,
    },
    nature: {
      nature: 'channel',
      action: 'volume',
    },
    position: {
      col: 0,
      row: 1,
    },
    feedback: FEEDBACK_CAPABILITY_BUTTON_RED,
  },
  {
    label: 'Pan',
    note: {
      type: 'note',
      channel: 0,
      note: 101,
    },
    nature: {
      nature: 'channel',
      action: 'pan',
    },
    position: {
      col: 1,
      row: 1,
    },
    feedback: FEEDBACK_CAPABILITY_BUTTON_RED,
  },
  {
    label: 'Send',
    note: {
      type: 'note',
      channel: 0,
      note: 102,
    },
    nature: {
      nature: 'channel',
      action: 'send',
    },
    position: {
      col: 2,
      row: 1,
    },
    feedback: FEEDBACK_CAPABILITY_BUTTON_RED,
  },
  {
    label: 'Device',
    note: {
      type: 'note',
      channel: 0,
      note: 103,
    },
    nature: {
      nature: 'unknown',
    },
    position: {
      col: 3,
      row: 1,
    },
    feedback: FEEDBACK_CAPABILITY_BUTTON_RED,
  },
  {
    label: 'Up',
    note: {
      type: 'note',
      channel: 0,
      note: 104,
    },
    nature: {
      nature: 'navigation',
      navigation: 'up',
    },
    position: {
      col: 4,
      row: 1,
    },
    feedback: FEEDBACK_CAPABILITY_BUTTON_RED,
  },
  {
    label: 'Down',
    note: {
      type: 'note',
      channel: 0,
      note: 105,
    },
    nature: {
      nature: 'navigation',
      navigation: 'down',
    },
    position: {
      col: 5,
      row: 1,
    },
    feedback: FEEDBACK_CAPABILITY_BUTTON_RED,
  },
  {
    label: 'Left',
    note: {
      type: 'note',
      channel: 0,
      note: 106,
    },
    nature: {
      nature: 'navigation',
      navigation: 'left',
    },
    position: {
      col: 6,
      row: 1,
    },
    feedback: FEEDBACK_CAPABILITY_BUTTON_RED,
  },
  {
    label: 'Right',
    note: {
      type: 'note',
      channel: 0,
      note: 107,
    },
    nature: {
      nature: 'navigation',
      navigation: 'right',
    },
    position: {
      col: 7,
      row: 1,
    },
    feedback: FEEDBACK_CAPABILITY_BUTTON_RED,
  },
  {
    label: 'Clip',
    note: {
      type: 'note',
      channel: 0,
      note: 112,
    },
    nature: {
      nature: 'channel',
      action: 'clip',
    },
    position: {
      col: 8,
      row: 9,
    },
    feedback: FEEDBACK_CAPABILITY_BUTTON_GREEN,
  },
  {
    label: 'Solo',
    note: {
      type: 'note',
      channel: 0,
      note: 113,
    },
    nature: {
      nature: 'channel',
      action: 'solo',
    },
    position: {
      col: 8,
      row: 8,
    },
    feedback: FEEDBACK_CAPABILITY_BUTTON_GREEN,
  },
  {
    label: 'Mute',
    note: {
      type: 'note',
      channel: 0,
      note: 114,
    },
    nature: {
      nature: 'channel',
      action: 'mute',
    },
    position: {
      col: 8,
      row: 7,
    },
    feedback: FEEDBACK_CAPABILITY_BUTTON_GREEN,
  },
  {
    label: 'Record',
    note: {
      type: 'note',
      channel: 0,
      note: 115,
    },
    nature: {
      nature: 'channel',
      action: 'record',
    },
    position: {
      col: 8,
      row: 6,
    },
    feedback: FEEDBACK_CAPABILITY_BUTTON_GREEN,
  },
  {
    label: 'Select',
    note: {
      type: 'note',
      channel: 0,
      note: 116,
    },
    nature: {
      nature: 'channel',
      action: 'select',
    },
    position: {
      col: 8,
      row: 5,
    },
    feedback: FEEDBACK_CAPABILITY_BUTTON_GREEN,
  },
  {
    label: 'Drum',
    note: {
      type: 'note',
      channel: 0,
      note: 117,
    },
    nature: {
      nature: 'mode-change',
      mode: 'drum',
    },
    position: {
      col: 8,
      row: 4,
    },
    feedback: FEEDBACK_CAPABILITY_BUTTON_GREEN,
  },
  {
    label: 'Note',
    note: {
      type: 'note',
      channel: 0,
      note: 118,
    },
    nature: {
      nature: 'mode-change',
      mode: 'note',
    },
    position: {
      col: 8,
      row: 3,
    },
    feedback: FEEDBACK_CAPABILITY_BUTTON_GREEN,
  },
  {
    label: 'Stop All Clips',
    note: {
      type: 'note',
      channel: 0,
      note: 119,
    },
    nature: {
      nature: 'unknown',
    },
    position: {
      col: 8,
      row: 2,
    },
    feedback: FEEDBACK_CAPABILITY_BUTTON_GREEN,
  },
  {
    label: 'Shift',
    note: {
      type: 'note',
      channel: 0,
      note: 122,
    },
    nature: {
      nature: 'modifier',
      modifier: 'shift',
    },
    position: {
      col: 8,
      row: 1,
    },
    feedback: null,
  },
];

/**
 * Create a colour space for the mapping [brightness, velocity] based on
 * {@link AKAI_BRIGHTNESS_CHANNELS} and {@link AKAI_VELOCITY_TO_RGB}
 */
export const createAkaiColorSpace = (): ColorSpace<[number, number]> => {
  return createColorSpace({
    sizes: [7, AKAI_VELOCITY_TO_RGB.length / 3],
    argsToRgb: ([brightnessId, velocity]) => {
      const velocityStartAddress = velocity * 3;
      const r = AKAI_VELOCITY_TO_RGB[velocityStartAddress];
      const g = AKAI_VELOCITY_TO_RGB[velocityStartAddress + 1];
      const b = AKAI_VELOCITY_TO_RGB[velocityStartAddress + 2];

      if (r === undefined || g === undefined || b === undefined) {
        throw new Error(`Invalid RGB values for velocity: ${velocity}`);
      }

      const brightness = AKAI_BRIGHTNESS_CHANNELS[brightnessId];

      if (brightness === undefined) {
        throw new Error(`Invalid brightness ID: ${brightnessId}`);
      }

      return [brightness * r, brightness * g, brightness * b];
    },
    precision: [5, 5, 5],
  });
};

const itemId = (type: 'cc' | 'note', index: number) => `${type}:${index}`;

export const createApcMiniMk2Profile =
  (feedback: 'notes' | 'rgb'): MidiProfileInit =>
  ({ connection }) => {
    const items: Record<string, MidiControllerItem> = {};
    const buttonNatures: Record<string, MidiButtonNature> = {};
    const controllerNatures: Record<string, MidiNumericNature> = {};

    {
      // Encapsulate to leave out of scope

      for (const { nature, ...item } of STATIC_NOTES) {
        if (item.note) {
          const id = itemId(item.note.type, item.note.note);
          items[id] = {
            id,
            ...item,
            note: [
              {
                id: item.note,
                nature,
              },
            ],
          };
          buttonNatures[id] = nature;
        }
      }

      for (let col = 0; col < 8; col++) {
        for (let row = 0; row < 8; row++) {
          const note = getMidiNote(row * 8 + col);
          const id = itemId('note', note);
          const nature: MidiButtonNature = { nature: 'grid' };
          items[id] = {
            id,
            note: [{ id: { type: 'note', channel: 0, note }, nature }],
            label: `Grid (${col}, ${row})`,
            position: {
              col,
              row: row + 2,
            },
            feedback: FEEDBACK_CAPABILITY_BUTTON_GRID,
          };
          buttonNatures[id] = nature;
        }
      }

      for (let col = 0; col < 9; col++) {
        const controller = getMidiController(col + 48);
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
            row: 0,
            orientation: 'vertical',
          },
          feedback: null,
        };
        controllerNatures[id] = nature;
      }
    }

    const profile = new MidiProfileBasic({
      getItems: () => Object.values(items),
      getItem: (id) => items[id] ?? null,
      getFeedbackCapabilities: () =>
        feedback === 'notes'
          ? Object.freeze({
              [FEEDBACK_CAPABILITY_BUTTON_GRID]: {
                led: {
                  type: 'palette',
                  brightnessValues: 1,
                  palette: (() => {
                    const rgbValues: RGB[] = [];
                    for (let i = 0; i < AKAI_VELOCITY_TO_RGB.length; i += 3) {
                      const r = AKAI_VELOCITY_TO_RGB[i];
                      const g = AKAI_VELOCITY_TO_RGB[i + 1];
                      const b = AKAI_VELOCITY_TO_RGB[i + 2];
                      if (
                        r === undefined ||
                        g === undefined ||
                        b === undefined
                      ) {
                        throw new Error(
                          `Invalid RGB values at index ${i}: [${r}, ${g}, ${b}]`,
                        );
                      }
                      rgbValues.push([r, g, b]);
                    }
                    return rgbValues;
                  })(),
                },
              },
              [FEEDBACK_CAPABILITY_BUTTON_RED]: {
                led: {
                  type: 'single',
                  brightnessValues: 1,
                  color: [255, 0, 0],
                  modes: ['solid', 'blink'],
                },
              },
              [FEEDBACK_CAPABILITY_BUTTON_GREEN]: {
                led: {
                  type: 'single',
                  brightnessValues: 1,
                  color: [0, 255, 0],
                  modes: ['solid', 'blink'],
                },
              },
            } satisfies MidiProfileFeedbackCapabilities)
          : FEEDBACK_CAPABILITIES_RGB,
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
          const id = itemId('cc', msg.controller);
          const nature = controllerNatures[id];
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

    if (connection.inputDeviceName.includes('Notes')) {
      profile.setReadiness({
        readiness: {
          state: 'unusable',
          message: 'Please use the Control MIDI input instead of Notes',
        },
      });
    }

    if (connection.inputDeviceName.includes('MIDIIN2')) {
      profile.setReadiness({
        readiness: {
          state: 'unusable',
          message: 'Please use the primary MIDI port for this device',
        },
      });
    }

    return profile;
  };

let colorSpace: ColorSpace<[number, number]> | null = null;

const getLimits = (inputProfile: MidiProfile) => {
  let minGrid = Infinity;
  let maxGrid = -Infinity;
  let minSingleLed = Infinity;
  let maxSingleLed = -Infinity;

  for (const item of inputProfile.getItems()) {
    for (const note of item.note || []) {
      if (note.nature?.nature === 'grid') {
        minGrid = Math.min(minGrid, note.id.note);
        maxGrid = Math.max(maxGrid, note.id.note);
      } else {
        minSingleLed = Math.min(minSingleLed, note.id.note);
        maxSingleLed = Math.max(maxSingleLed, note.id.note);
      }
    }
  }

  return {
    minGrid,
    maxGrid,
    minSingleLed,
    maxSingleLed,
  };
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

export const createApcMiniMk2Feedback: MidiFeedbackProfileInit = ({
  inputProfile,
  sendMessage,
}) => {
  const { minGrid, maxGrid, minSingleLed, maxSingleLed } =
    getLimits(inputProfile);
  const noteIDs = getNoteIDs(inputProfile);

  const maxNote = Math.max(maxGrid, maxSingleLed);
  const lastNoteValues = new Array<[number, number]>(maxNote + 1).fill([
    -1, -1,
  ]);

  setTimeout(() => {
    // Assume MIDI messages before 1 second have not been correctly processed
    // and reset everything on next frame.
    lastNoteValues.fill([-1, -1]);
  }, 1000);

  const setItemColor: MidiFeedbackProfile['setItemColor'] = (
    idString,
    feedback,
  ) => {
    const id = noteIDs[idString];
    if (!id) {
      return;
    }
    if (id.note >= minGrid && id.note <= maxGrid) {
      if (!colorSpace) {
        colorSpace = createAkaiColorSpace();
      }

      const [channel, velocity] = colorSpace.rgbToValue(
        feedback.color ?? [0, 0, 0],
      );

      const lastValue = lastNoteValues[id.note];
      if (lastValue?.[0] === channel && lastValue?.[1] === velocity) {
        return;
      }

      lastNoteValues[id.note] = [channel, velocity];
      sendMessage([MIDI_NOTE_ON | (channel & 0xf), id.note, velocity & 0x7f]);
    } else if (id.note >= minSingleLed && id.note <= maxSingleLed) {
      const velocity = feedback.mode === 'empty' ? 0 : 1;
      const lastValue = lastNoteValues[id.note];
      if (lastValue?.[1] === velocity) {
        return;
      }
      lastNoteValues[id.note] = [0, velocity];
      sendMessage([MIDI_NOTE_ON, id.note, velocity & 0x7f]);
    }
  };

  return {
    clear: () => {
      for (const item of inputProfile.getItems()) {
        for (const note of item.note || []) {
          lastNoteValues[note.id.note] = [-1, -1];
        }
        setItemColor(item.id, { mode: 'empty' });
      }
    },
    setItemColor,
    setItemValue: () => {
      // no-op: unsupported
    },
    frameFinished: () => {
      // no-op: unnecessary
    },
  };
};

export type MidiRgbBatchDataValueKeys = {
  /**
   * The start note of the button in the batch (inclusive)
   */
  'start-inclusive': null;
  /**
   * The end note of the button in the batch (inclusive)
   */
  'end-inclusive': null;
  /**
   * The end note of the button in the batch (inclusive)
   */
  'end-exclusive': null;
  /**
   * The red value of the color, between 0 and 255,
   * and sent as 2 7-bit values, as dictated by the endianness.
   */
  'red-8bit': null;
  /**
   * The green value of the color, between 0 and 255,
   * and sent as 2 7-bit values, as dictated by the endianness.
   */
  'green-8bit': null;
  /**
   * The blue value of the color, between 0 and 255,
   * and sent as 2 7-bit values, as dictated by the endianness.
   */
  'blue-8bit': null;
};

type SysexMidiColorBatched = {
  /**
   * When sending numeric values that don't fit in a single 7-bit value,
   * the data is split into 7-bit chunks and sent in multiple messages.
   *
   * This defines whether the most significant or least significant byte
   * should be send first.
   */
  endianness: 'big' | 'little';
  /**
   * The values to include in each batch.
   *
   * See {@link MidiRgbBatchDataValueKeys} for explanation
   */
  batchData: Array<keyof MidiRgbBatchDataValueKeys>;
  /**
   * The minimum number of batches that need to be send for the device to
   * consider the message valid.
   *
   * TODO: investigate why this is even needed for the device?
   */
  minBatchSize: number;
  maxBatchSize: number;
  message: Array<
    | {
        type: 'static';
        values: number[];
      }
    | {
        type: 'data-length';
        /**
         * How many bytes should be used to represent the number of data bytes.
         */
        bytes: number;
      }
    | {
        type: 'batch-data-bytes';
      }
  >;
};

type MidiColorUpdate = {
  note: number;
  color: [number, number, number];
};

type BatchedColorUpdate = {
  startNote: number;
  endNote: number;
  color: [number, number, number];
};

export const AKAI_APC_MINI_MK_2_OUTPUT_MAPPING: SysexMidiColorBatched = {
  endianness: 'big',
  message: [
    {
      type: 'static',
      values: [0xf0, 0x47, 0x7f, 0x4f, 0x24],
    },
    {
      type: 'data-length',
      bytes: 2,
    },
    {
      type: 'batch-data-bytes',
    },
    {
      type: 'static',
      values: [0xf7],
    },
  ],
  minBatchSize: 2,
  maxBatchSize: 20,
  batchData: [
    'start-inclusive',
    'end-inclusive',
    'red-8bit',
    'green-8bit',
    'blue-8bit',
  ],
};

const sendSysexRgbBatchedMessages = (
  config: SysexMidiColorBatched,
  updates: MidiColorUpdate[],
  sendMessage: (message: number[]) => void,
): void => {
  // Combine adjacent same-colors to single update
  const batchedUpdates: BatchedColorUpdate[] = [];
  for (const c of updates.sort((a, b) => a.note - b.note)) {
    const lastUpdate = batchedUpdates[batchedUpdates.length - 1];
    if (
      lastUpdate?.endNote === c.note - 1 &&
      colorEqual(lastUpdate.color, c.color)
    ) {
      lastUpdate.endNote = c.note;
    } else {
      batchedUpdates.push({
        startNote: c.note,
        endNote: c.note,
        color: c.color,
      });
    }
  }

  // Ensure batched updates are at least `minBatchSize` long
  if (batchedUpdates.length < config.minBatchSize) {
    const lastUpdate = batchedUpdates[batchedUpdates.length - 1];
    while (lastUpdate && batchedUpdates.length < config.minBatchSize) {
      batchedUpdates.push(lastUpdate);
    }
  }

  // Create batches of up to `maxBatchSize` updates
  const batches: BatchedColorUpdate[][] = [];
  for (let i = 0; i < batchedUpdates.length; i += config.maxBatchSize) {
    batches.push(batchedUpdates.slice(i, i + config.maxBatchSize));
  }

  // TODO: add option to limit number of batches in single message,
  // and return multiple messages if needed
  for (const batch of batches) {
    const data = batch.flatMap((update) =>
      config.batchData.flatMap((key) => {
        switch (key) {
          case 'start-inclusive':
            return [update.startNote];
          case 'end-inclusive':
            return [update.endNote];
          case 'end-exclusive':
            return [update.endNote + 1];
          case 'red-8bit':
            return midiNumberToValues(config.endianness, update.color[0], 2);
          case 'green-8bit':
            return midiNumberToValues(config.endianness, update.color[1], 2);
          case 'blue-8bit':
            return midiNumberToValues(config.endianness, update.color[2], 2);
        }
      }),
    );
    const message = config.message.flatMap((message) => {
      switch (message.type) {
        case 'static':
          return message.values;
        case 'data-length':
          return midiNumberToValues(
            config.endianness,
            data.length,
            message.bytes,
          );
        case 'batch-data-bytes':
          return data;
      }
    });
    sendMessage(message);
  }
};

export const createApcMiniMk2RGBFeedback: MidiFeedbackProfileInit = ({
  inputProfile,
  sendMessage,
}) => {
  const { minGrid, maxGrid, minSingleLed, maxSingleLed } =
    getLimits(inputProfile);
  const noteIDs = getNoteIDs(inputProfile);
  const maxNote = Math.max(maxGrid, maxSingleLed);
  const noteColors = new Array<RGB>(maxNote + 1).fill([-1, -1, -1]);
  const noteColorChanges = new Array<boolean>(maxNote + 1).fill(false);
  const noteVelocities = new Array<number>(
    maxSingleLed - minSingleLed + 1,
  ).fill(-1);
  const noteVelocityChanges = new Array<boolean>(
    maxSingleLed - minSingleLed + 1,
  ).fill(false);

  const defaultColors: Record<MidiColorFeedback['mode'], RGB> = {
    active: [255, 255, 255],
    ready: [0, 128, 128],
    empty: [0, 0, 0],
  };

  let resetFrame = false;

  setTimeout(() => {
    // Assume MIDI messages before 1 second have not been correctly processed
    // and resent everything on next frame.
    resetFrame = true;
  }, 1000);

  const setItemColor: MidiFeedbackProfile['setItemColor'] = (
    idString,
    feedback,
  ) => {
    const id = noteIDs[idString];
    if (!id) {
      return;
    }
    if (id.note >= minGrid && id.note <= maxGrid) {
      const c = feedback.color ?? defaultColors[feedback.mode];
      const current = noteColors[id.note];
      if (current && (!colorEqual(current, c) || resetFrame)) {
        noteColors[id.note] = c;
        noteColorChanges[id.note] = true;
      }
    } else if (id.note >= minSingleLed && id.note <= maxSingleLed) {
      const index = id.note - minSingleLed;
      const velocity = feedback.mode === 'empty' ? 0 : 1;
      const lastVelocity = noteVelocities[index];
      if (lastVelocity === velocity && !resetFrame) {
        return;
      }
      noteVelocities[index] = velocity;
      noteVelocityChanges[index] = true;
    }
  };

  return {
    clear: () => {
      noteColors.fill([-1, -1, -1]);
      noteVelocities.fill(-1);
      for (const item of inputProfile.getItems()) {
        setItemColor(item.id, { mode: 'empty' });
      }
    },
    setItemColor,
    setItemValue: () => {
      // no-op: unsupported
    },
    frameFinished: () => {
      resetFrame = false;
      // Send SysEx messages first (if done in other order, can break things)
      const updates: MidiColorUpdate[] = [];
      for (let note = 0; note < noteColors.length; note++) {
        if (noteColorChanges[note]) {
          updates.push({
            note,
            color: noteColors[note]!,
          });
        }
      }

      sendSysexRgbBatchedMessages(
        AKAI_APC_MINI_MK_2_OUTPUT_MAPPING,
        updates,
        sendMessage,
      );

      // Mark all frames as unchanged
      noteColorChanges.fill(false);

      // Send note velocities
      const noteMessages: number[][] = [];
      for (let i = 0; i < noteVelocities.length; i++) {
        if (noteVelocityChanges[i]) {
          const note = i + minSingleLed;
          const velocity = noteVelocities[i];
          if (velocity === undefined) {
            continue;
          }
          noteMessages.push([MIDI_NOTE_ON, note, velocity & 0x7f]);
        }
      }
      noteVelocityChanges.fill(false);
      setTimeout(() => {
        // Send notes after a delay, as they can interfere with sysex messages
        for (const message of noteMessages) {
          sendMessage(message);
        }
      }, 10);
    },
  };
};

export const AKAI_APC_MINI_MK_2: MidiProfileDefinition = {
  name: 'Akai APC Mini Mk2',
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
  autoSelect: (connection: MidiInputConnectionInfo) =>
    connection.inputDeviceName.includes('APC mini mk2'),
  subProfiles: {
    default: {
      name: 'Default (Full RGB SysEx)',
      input: createApcMiniMk2Profile('rgb'),
      feedback: createApcMiniMk2RGBFeedback,
    },
    notes: {
      name: 'LED Notes',
      input: createApcMiniMk2Profile('notes'),
      feedback: createApcMiniMk2Feedback,
    },
  },
};
