import { colorEqual, ColorSpace, RGB } from '@arcanewizards/talisman/color';
import { createBasicColorVelocityFeedbackProfile } from '@arcanewizards/talisman/feedback';
import {
  createNovationLaunchpadRGBColorSpace,
  createNovationLaunchpadRGBPallette,
  createNovationModeSwitcher,
  NovationButtonInfo,
  NovationButtonOnlyLayout,
  NovationButtonOnlyProfile,
  NovationModeSwitchingOptions,
} from './shared/novation.js';
import {
  getMidiNote,
  MidiController,
  MidiInputConnectionInfo,
  MidiButtonNature,
  MidiControllerItem,
  MidiProfile,
  MidiColorFeedback,
  MidiFeedbackProfile,
  MidiFeedbackProfileInit,
  MidiProfileDefinition,
} from '@arcanewizards/talisman/core';

const NOVATION_LAUNCHPAD_MK3_MINI_SYSEX_HEADER = [
  0xf0, 0x00, 0x20, 0x29, 0x02, 0x0d,
];

const NOVATION_LAUNCHPAD_MK3_MINI_MODE_SWITCHING: NovationModeSwitchingOptions =
  {
    sysexHeader: NOVATION_LAUNCHPAD_MK3_MINI_SYSEX_HEADER,
    modeName: 'Programmer Mode',
    command: 0x0e,
    requiredMode: 1,
    defaultMode: 0,
  };

const FEEDBACK_KEY = 'feedback-rgb';

const UNIVERSAL_CONTROLLER_BUTTONS = Object.freeze([
  {
    controller: 91,
    nature: { nature: 'navigation', navigation: 'up' },
    col: 0,
    row: 8,
  },
  {
    controller: 92,
    nature: { nature: 'navigation', navigation: 'down' },
    col: 1,
    row: 8,
  },
  {
    controller: 93,
    nature: { nature: 'navigation', navigation: 'left' },
    col: 2,
    row: 8,
  },
  {
    controller: 94,
    nature: { nature: 'navigation', navigation: 'right' },
    col: 3,
    row: 8,
  },
  {
    controller: 95,
    nature: { nature: 'mode-change', mode: 'session' },
    col: 4,
    row: 8,
  },
  {
    controller: 96,
    nature: { nature: 'mode-change', mode: 'drum' },
    col: 5,
    row: 8,
  },
  {
    controller: 97,
    nature: { nature: 'mode-change', mode: 'note' },
    col: 6,
    row: 8,
  },
  {
    controller: 98,
    nature: { nature: 'mode-change', mode: 'user' },
    col: 7,
    row: 8,
  },
  {
    controller: 99,
    nature: { nature: 'unknown' },
    col: 8,
    row: 8,
  },
] satisfies Array<{
  controller: MidiController;
  nature: MidiButtonNature;
  col: number;
  row: number;
}>);

const SESSION_CONTROLLER_BUTTONS = Object.freeze([
  {
    controller: 19,
    nature: { nature: 'unknown' },
    col: 8,
    row: 0,
  },
  {
    controller: 29,
    nature: { nature: 'unknown' },
    col: 8,
    row: 1,
  },
  {
    controller: 39,
    nature: { nature: 'unknown' },
    col: 8,
    row: 2,
  },
  {
    controller: 49,
    nature: { nature: 'unknown' },
    col: 8,
    row: 3,
  },
  {
    controller: 59,
    nature: { nature: 'unknown' },
    col: 8,
    row: 4,
  },
  {
    controller: 69,
    nature: { nature: 'unknown' },
    col: 8,
    row: 5,
  },
  {
    controller: 79,
    nature: { nature: 'unknown' },
    col: 8,
    row: 6,
  },
  {
    controller: 89,
    nature: { nature: 'channel', action: 'stop' },
    col: 8,
    row: 7,
  },
] satisfies Array<{
  controller: MidiController;
  nature: MidiButtonNature;
  col: number;
  row: number;
}>);

/**
 * The controller buttons are the same in every mode,
 * so they can all share implementation here.
 */
const addControllerButtons = (
  items: Record<string, MidiControllerItem>,
  controllers: Record<number, NovationButtonInfo>,
  buttons:
    typeof UNIVERSAL_CONTROLLER_BUTTONS | typeof SESSION_CONTROLLER_BUTTONS,
) => {
  // Add controller buttons logic here
  for (const button of buttons) {
    const { controller, nature, col, row } = button;
    const id = `controller-${col}-${row}`;
    items[id] = {
      id,
      position: { col, row },
      feedback: FEEDBACK_KEY,
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

export const novationLaunchpadMk3MiniSessionLayout: NovationButtonOnlyLayout =
  () => {
    const items: Record<string, MidiControllerItem> = {};
    const notes: Record<number, NovationButtonInfo> = {};
    const controllers: Record<number, NovationButtonInfo> = {};

    const gridNature: MidiButtonNature = {
      nature: 'grid',
    };
    for (let col = 0; col < 8; col++) {
      for (let row = 0; row < 8; row++) {
        const id = `grid-${col}-${row}`;
        const note = getMidiNote((row + 1) * 10 + col + 1);
        items[id] = {
          id,
          position: { col, row },
          feedback: FEEDBACK_KEY,
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

    addControllerButtons(items, controllers, UNIVERSAL_CONTROLLER_BUTTONS);
    addControllerButtons(items, controllers, SESSION_CONTROLLER_BUTTONS);

    return { items, notes, controllers };
  };

class NovationLaunchpadMk3MiniProfileProgrammerMode extends NovationButtonOnlyProfile {
  public constructor(
    connection: MidiInputConnectionInfo,
    private readonly ledMode: 'rgb' | 'notes',
  ) {
    super({
      getLayout: novationLaunchpadMk3MiniSessionLayout,
      noteOffMode: '0-velocity',
      modeSwitching: NOVATION_LAUNCHPAD_MK3_MINI_MODE_SWITCHING,
      getFeedbackCapabilities: () => ({
        [FEEDBACK_KEY]: {
          led:
            this.ledMode === 'notes'
              ? {
                  type: 'palette',
                  brightnessValues: 1,
                  palette: createNovationLaunchpadRGBPallette(),
                }
              : {
                  type: 'rgb',
                  limits: {
                    rBits: 7,
                    gBits: 7,
                    bBits: 7,
                  },
                },
        },
      }),
    });
  }
}

let colorSpace: ColorSpace<[number]> | null = null;

export const createNovationLaunchpadMk3MiniFeedbackProfile: MidiFeedbackProfileInit =
  ({ connection, inputProfile, sendMessage }) => {
    const modeSwitcher = createNovationModeSwitcher({
      ...NOVATION_LAUNCHPAD_MK3_MINI_MODE_SWITCHING,
      sendMessage,
    });
    const profile = createBasicColorVelocityFeedbackProfile({
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
    })({ connection, inputProfile, sendMessage });

    return {
      ...profile,
      performModeSwitch: () => {
        modeSwitcher.performModeSwitch?.();
        profile.clear();
      },
      close: modeSwitcher.close,
    };
  };

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

/**
 * TODO: confirm what the actual maximum number of entries for RGB is...
 *
 * The docs say 81, but this is for a message that has `<colourspec> that may be
 * between 3-5 bytes each, so the limit when all the messages are RGB may be
 * lower? We reduce it here just to be safe, but we may be able to increase it.
 *
 * @see https://fael-downloads-prod.focusrite.com/customer/prod/s3fs-public/downloads/Launchpad%20Mini%20-%20Programmers%20Reference%20Manual.pdf
 */
const MAX_COLORS_PER_SYSEX_MESSAGE = Math.floor((81 / 5) * 3);

const DEFAULT_COLORS: Record<MidiColorFeedback['mode'], RGB> = {
  active: [255, 255, 255],
  ready: [0, 128, 128],
  empty: [0, 0, 0],
};

export const createNovationLaunchpadMk3MiniFeedbackProfileRGB: MidiFeedbackProfileInit =
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

    const modeSwitcher = createNovationModeSwitcher({
      ...NOVATION_LAUNCHPAD_MK3_MINI_MODE_SWITCHING,
      sendMessage,
    });

    const clear = () => {
      lastColours.fill([-1, -1, -1]);
      colorUpdated.fill(false);
      for (const item of inputProfile.getItems()) {
        setItemColor(item.id, { mode: 'empty' });
      }
      // Colors will actually be sent on next call to frameFinished()
    };

    return {
      performModeSwitch: () => {
        modeSwitcher.performModeSwitch?.();
        clear();
      },
      close: modeSwitcher.close,
      clear,
      setItemColor,
      setItemValue: () => {
        // no-op: unsupported
      },
      frameFinished: () => {
        let batch: number[][] = [];

        const sendBatch = () => {
          sendMessage([
            ...NOVATION_LAUNCHPAD_MK3_MINI_SYSEX_HEADER,
            0x03,
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
              0x03, // RGB Mode
              i, // Index
              Math.max(0, Math.min(0x7f, Math.round((r / 255) * 0x7f))),
              Math.max(0, Math.min(0x7f, Math.round((g / 255) * 0x7f))),
              Math.max(0, Math.min(0x7f, Math.round((b / 255) * 0x7f))),
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

export const NOVATION_LAUNCHPAD_MK3_MINI: MidiProfileDefinition = {
  name: 'Launchpad Mini (mk3)',
  testing: {
    ready: false,
  },
  autoSelect: (connection: MidiInputConnectionInfo) =>
    connection.inputDeviceName.includes('LPMiniMK3'),
  subProfiles: {
    default: {
      name: 'Sysex RGB Feedback',
      notice:
        'To be able to control the lights of the top row of buttons, please ensure your launchpad is in Programmer mode',
      input: ({ connection }) =>
        new NovationLaunchpadMk3MiniProfileProgrammerMode(connection, 'rgb'),
      feedback: createNovationLaunchpadMk3MiniFeedbackProfileRGB,
    },
    notes: {
      name: 'Note Feedback',
      notice:
        'To be able to control the lights of the top row of buttons, please ensure your launchpad is in Programmer mode',
      input: ({ connection }) =>
        new NovationLaunchpadMk3MiniProfileProgrammerMode(connection, 'notes'),
      feedback: createNovationLaunchpadMk3MiniFeedbackProfile,
    },
  },
};
