import { colorEqual, ColorSpace, RGB } from '@arcanewizards/talisman/color';
import {
  createBasicColorVelocityFeedbackProfile,
  MidiColorFeedback,
  MidiFeedbackProfile,
  MidiFeedbackProfileInit,
} from '@arcanewizards/talisman/feedback';
import {
  MidiButtonNature,
  MidiControllerItem,
  MidiProfile,
  MidiProfileInit,
} from '@arcanewizards/talisman/profile';
import {
  createNovationButtonOnlyProfile,
  createNovationLaunchpadRGBColorSpace,
  NovationButtonInfo,
  NovationButtonOnlyLayout,
} from './shared/novation.js';
import {
  getMidiNote,
  MidiController,
  MidiProfileDefinition,
} from '@arcanewizards/talisman';

const CONTROLLER_BUTTONS = Object.freeze([
  {
    controller: 1,
    nature: { nature: 'channel', action: 'record' },
    col: 1,
    row: 0,
  },
  {
    controller: 2,
    nature: { nature: 'channel', action: 'select' },
    col: 2,
    row: 0,
  },
  {
    controller: 3,
    nature: { nature: 'channel', action: 'mute' },
    col: 3,
    row: 0,
  },
  {
    controller: 4,
    nature: { nature: 'channel', action: 'solo' },
    col: 4,
    row: 0,
  },
  {
    controller: 5,
    nature: { nature: 'channel', action: 'volume' },
    col: 5,
    row: 0,
  },
  {
    controller: 6,
    nature: { nature: 'channel', action: 'pan' },
    col: 6,
    row: 0,
  },
  {
    controller: 7,
    nature: { nature: 'channel', action: 'send' },
    col: 7,
    row: 0,
  },
  {
    controller: 8,
    nature: { nature: 'channel', action: 'stop' },
    col: 8,
    row: 0,
  },
  {
    controller: 10,
    nature: { nature: 'channel', action: 'record' },
    col: 0,
    row: 1,
  },
  {
    controller: 20,
    nature: { nature: 'edit', action: 'double' },
    col: 0,
    row: 2,
  },
  {
    controller: 30,
    nature: { nature: 'edit', action: 'duplicate' },
    col: 0,
    row: 3,
  },
  {
    controller: 40,
    nature: { nature: 'edit', action: 'quantize' },
    col: 0,
    row: 4,
  },
  {
    controller: 50,
    nature: { nature: 'edit', action: 'delete' },
    col: 0,
    row: 5,
  },
  {
    controller: 60,
    nature: { nature: 'edit', action: 'undo' },
    col: 0,
    row: 6,
  },
  {
    controller: 70,
    nature: { nature: 'edit', action: 'click' },
    col: 0,
    row: 7,
  },
  {
    controller: 80,
    nature: { nature: 'modifier', modifier: 'shift' },
    col: 0,
    row: 8,
  },
  {
    controller: 91,
    nature: { nature: 'navigation', navigation: 'up' },
    col: 1,
    row: 9,
  },
  {
    controller: 92,
    nature: { nature: 'navigation', navigation: 'down' },
    col: 2,
    row: 9,
  },
  {
    controller: 93,
    nature: { nature: 'navigation', navigation: 'left' },
    col: 3,
    row: 9,
  },
  {
    controller: 94,
    nature: { nature: 'navigation', navigation: 'right' },
    col: 4,
    row: 9,
  },
  {
    controller: 95,
    nature: { nature: 'mode-change', mode: 'session' },
    col: 5,
    row: 9,
  },
  {
    controller: 96,
    nature: { nature: 'mode-change', mode: 'note' },
    col: 6,
    row: 9,
  },
  {
    controller: 97,
    nature: { nature: 'mode-change', mode: 'device' },
    col: 7,
    row: 9,
  },
  {
    controller: 98,
    nature: { nature: 'mode-change', mode: 'user' },
    col: 8,
    row: 9,
  },
  {
    controller: 19,
    nature: { nature: 'unknown' },
    col: 9,
    row: 1,
  },
  {
    controller: 29,
    nature: { nature: 'unknown' },
    col: 9,
    row: 2,
  },
  {
    controller: 39,
    nature: { nature: 'unknown' },
    col: 9,
    row: 3,
  },
  {
    controller: 49,
    nature: { nature: 'unknown' },
    col: 9,
    row: 4,
  },
  {
    controller: 59,
    nature: { nature: 'unknown' },
    col: 9,
    row: 5,
  },
  {
    controller: 69,
    nature: { nature: 'unknown' },
    col: 9,
    row: 6,
  },
  {
    controller: 79,
    nature: { nature: 'unknown' },
    col: 9,
    row: 7,
  },
  {
    controller: 89,
    nature: { nature: 'unknown' },
    col: 9,
    row: 8,
  },
] satisfies Array<{
  controller: MidiController;
  nature: MidiButtonNature;
  col: number;
  row: number;
}>);

/**
 * Only usable in SysEx feedback
 */
const SIDE_LED: MidiControllerItem = {
  id: 'side',
  note: [
    {
      id: {
        type: 'note',
        channel: 0,
        note: 99,
      },
    },
  ],
  position: {
    row: 0,
    col: [4, 5],
  },
};

/**
 * The controller buttons are the same in every mode,
 * so they can all share implementation here.
 */
const addControllerButtons = (
  items: Record<string, MidiControllerItem>,
  controllers: Record<number, NovationButtonInfo>,
) => {
  // Add controller buttons logic here
  for (const button of CONTROLLER_BUTTONS) {
    const { controller, nature, col, row } = button;
    const id = `controller-${col}-${row}`;
    items[id] = {
      id,
      position: { col, row },
      controlChange: [
        {
          id: {
            type: 'control-change',
            channel: 0,
            controller,
          },
          nature,
        },
      ],
    };
    controllers[controller] = { item: id, nature };
  }
};

export const novationLaunchpadMK2ProProgrammerLayout: NovationButtonOnlyLayout =
  () => {
    const items: Record<string, MidiControllerItem> = {};
    const notes: Record<number, NovationButtonInfo> = {};
    const controllers: Record<number, NovationButtonInfo> = {};

    const gridNature: MidiButtonNature = {
      nature: 'grid',
    };
    for (let col = 1; col < 9; col++) {
      for (let row = 1; row < 9; row++) {
        const id = `grid-${col}-${row}`;
        const note = getMidiNote(row * 10 + col);
        items[id] = {
          id,
          position: { col, row },
          note: [
            {
              id: {
                type: 'note',
                channel: 0,
                note,
              },
              nature: gridNature,
            },
          ],
        };
        notes[note] = { item: id, nature: gridNature };
      }
    }

    addControllerButtons(items, controllers);

    // Make side LED controllable
    items[SIDE_LED.id] = SIDE_LED;
    for (const node of SIDE_LED.note ?? []) {
      notes[node.id.note] = {
        item: SIDE_LED.id,
        nature: {
          nature: 'unknown',
        },
      };
    }

    return { items, notes, controllers };
  };

export const createNovationLaunchpadMk2ProProfileProgrammerMode: MidiProfileInit =
  createNovationButtonOnlyProfile({
    getLayout: novationLaunchpadMK2ProProgrammerLayout,
    noteOffMode: 'note-off',
  });

let colorSpace: ColorSpace<[number]> | null = null;

export const createNovationLaunchpadMk2ProFeedbackProfile =
  createBasicColorVelocityFeedbackProfile({
    defaultVelocities: {
      empty: 0,
      active: 15,
      ready: 3,
    },
    getColorSpace: () => {
      if (!colorSpace) {
        colorSpace = createNovationLaunchpadRGBColorSpace();
      }
      return colorSpace;
    },
  });

const getMaxId = (inputProfile: MidiProfile) => {
  let maxId = -Infinity;

  for (const item of inputProfile.getItems()) {
    for (const note of item.note || []) {
      maxId = Math.max(maxId, note.id.note);
    }
    for (const control of item.controlChange || []) {
      maxId = Math.max(maxId, control.id.controller);
    }
  }

  return maxId;
};

const MAX_COLORS_PER_SYSEX_MESSAGE = 78;

const DEFAULT_COLORS: Record<MidiColorFeedback['mode'], RGB> = {
  active: [255, 255, 255],
  ready: [0, 128, 128],
  empty: [0, 0, 0],
};

export const createNovationLaunchpadMk2ProFeedbackProfileRGB: MidiFeedbackProfileInit =
  ({ inputProfile, sendMessage }) => {
    const maxId = getMaxId(inputProfile);
    const lastColours = new Array<RGB>(maxId + 1).fill([-1, -1, -1]);
    const colorUpdated: boolean[] = new Array(maxId + 1).fill(false);

    const setItemColor: MidiFeedbackProfile['setItemColor'] = (
      itemId,
      feedback,
    ) => {
      const i = inputProfile.getItem(itemId);
      const color = feedback.color ?? DEFAULT_COLORS[feedback.mode];
      for (const n of i?.note ?? []) {
        if (!colorEqual(lastColours[n.id.note], color)) {
          colorUpdated[n.id.note] = true;
        }
        lastColours[n.id.note] = color;
      }
      for (const c of i?.controlChange ?? []) {
        if (!colorEqual(lastColours[c.id.controller], color)) {
          colorUpdated[c.id.controller] = true;
        }
        lastColours[c.id.controller] = color;
      }
    };

    return {
      clear: () => {
        lastColours.fill([-1, -1, -1]);
        colorUpdated.fill(false);
        for (const item of inputProfile.getItems()) {
          setItemColor(item.id, { mode: 'empty' });
        }
        // Colors will actually be sent on next call to frameFinished()
      },
      setItemColor,
      setItemValue: () => {
        // no-op: unsupported
      },
      frameFinished: () => {
        let batch: number[][] = [];

        const sendBatch = () => {
          sendMessage([
            0xf0,
            0x00,
            0x20,
            0x29,
            0x02,
            0x10,
            0x0b,
            ...batch.flat(),
            0xf7,
          ]);
          batch = [];
        };

        for (let i = 0; i <= maxId; i++) {
          if (colorUpdated[i]) {
            const c = lastColours[i];
            if (!c) continue;
            const [r, g, b] = c;
            batch.push([
              i,
              Math.max(0, Math.min(0x3f, Math.round((r / 255) * 0x3f))),
              Math.max(0, Math.min(0x3f, Math.round((g / 255) * 0x3f))),
              Math.max(0, Math.min(0x3f, Math.round((b / 255) * 0x3f))),
            ]);
            colorUpdated[i] = false;
            if (batch.length >= MAX_COLORS_PER_SYSEX_MESSAGE) {
              sendBatch();
            }
          }
        }
        if (batch.length > 0) {
          sendBatch();
        }
      },
    } satisfies MidiFeedbackProfile;
  };

export const NOVATION_LAUNCHPAD_MK2_PRO: MidiProfileDefinition = {
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
};
