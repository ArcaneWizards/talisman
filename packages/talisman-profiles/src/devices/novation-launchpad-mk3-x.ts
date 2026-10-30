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
  MidiProfileBase,
  MidiProfileInit,
} from '@arcanewizards/talisman/profile';
import {
  createNovationLaunchpadRGBColorSpace,
  NovationButtonInfo,
  NovationButtonOnlyLayout,
} from './shared/novation.js';
import {
  getMidiNote,
  MidiInputConnectionInfo,
  MidiController,
  MidiParsedMessage,
  MidiProfileDefinition,
} from '@arcanewizards/talisman';
import { startsWithSysex } from '@arcanewizards/talisman/util';

const NOVATION_LAUNCHPAD_MK3_X_SYSEX_HEADER = [
  0xf0, 0x00, 0x20, 0x29, 0x02, 0x0c,
];

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
    nature: { nature: 'mode-change', mode: 'user' },
    col: 5,
    row: 8,
  },
  {
    controller: 97,
    nature: { nature: 'mode-change', mode: 'drum' },
    col: 6,
    row: 8,
  },
  {
    controller: 98,
    nature: { nature: 'unknown' },
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
    nature: { nature: 'channel', action: 'record' },
    col: 8,
    row: 0,
  },
  {
    controller: 29,
    nature: { nature: 'channel', action: 'solo' },
    col: 8,
    row: 1,
  },
  {
    controller: 39,
    nature: { nature: 'channel', action: 'mute' },
    col: 8,
    row: 2,
  },
  {
    controller: 49,
    nature: { nature: 'channel', action: 'stop' },
    col: 8,
    row: 3,
  },
  {
    controller: 59,
    nature: { nature: 'channel', action: 'send' },
    col: 8,
    row: 4,
  },
  {
    controller: 69,
    nature: { nature: 'channel', action: 'send' },
    col: 8,
    row: 5,
  },
  {
    controller: 79,
    nature: { nature: 'channel', action: 'pan' },
    col: 8,
    row: 6,
  },
  {
    controller: 89,
    nature: { nature: 'channel', action: 'volume' },
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
    | typeof UNIVERSAL_CONTROLLER_BUTTONS
    | typeof SESSION_CONTROLLER_BUTTONS,
) => {
  // Add controller buttons logic here
  for (const button of buttons) {
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

export const novationLaunchpadMk3XProgrammerLayout: NovationButtonOnlyLayout =
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

class NovationLaunchpadMk3XProfileProgrammerMode extends MidiProfileBase {
  private readonly layout: ReturnType<NovationButtonOnlyLayout>;
  private readonly isIncorrectPort: boolean;

  private _modeCheckTimeout: ReturnType<typeof setTimeout> | null = null;

  public constructor(
    private readonly connection: MidiInputConnectionInfo,
    _layout: NovationButtonOnlyLayout,
  ) {
    super();
    this.layout = _layout();
    this.isIncorrectPort =
      // MacOS
      connection.inputDeviceName.includes('LPX DAW') ||
      // Windows
      connection.inputDeviceName === 'LPX MIDI';

    if (this.isIncorrectPort) {
      this.setReadiness({
        readiness: {
          state: 'unusable',
          message:
            connection.inputDeviceName === 'LPX MIDI'
              ? 'This profile cannot be used with port 1 of this device, please use the MIDIIN2 port instead.'
              : 'This profile cannot be used with the LPX DAW port, please use the MIDI port instead.',
        },
      });
    }

    this._modeCheckTimeout = setTimeout(() => {
      // Assume that if the profile does not receive a response for the mode
      // check within 1 second, that it's in the incorrect mode.
      if (!this.isIncorrectPort) {
        this.emit('readiness', {
          readiness: {
            state: 'pending-mode-switch',
            message:
              'Did not receive a response for mode check, device likely needs to be switched to programmer mode.',
          },
        });
      }
    }, 1000);
  }

  public getItems = (): Iterable<MidiControllerItem> => {
    return Object.values(this.layout.items);
  };

  public getItem = (id: string): MidiControllerItem | null => {
    return this.layout.items[id] ?? null;
  };

  public receiveMessage = (message: MidiParsedMessage): boolean => {
    if (message.type === 'note') {
      const info = this.layout.notes[message.note];
      if (!info) {
        return false;
      }
      const noteOn = message.velocity > 0;
      this.emit('action', {
        action: {
          item: info.item,
          action: noteOn ? 'button-press' : 'button-release',
          nature: info.nature,
          velocity: message.velocity,
        },
        message,
      });
      return true;
    } else if (message.type === 'control-change') {
      const info = this.layout.controllers[message.controller];
      if (!info) {
        return false;
      }
      this.emit('action', {
        action: {
          item: info.item,
          action: message.value > 0 ? 'button-press' : 'button-release',
          nature: info.nature,
          velocity: message.value,
        },
        message,
      });
      return true;
    } else if (message.type === 'sysex') {
      if (
        !startsWithSysex(message.message, NOVATION_LAUNCHPAD_MK3_X_SYSEX_HEADER)
      ) {
        return false;
      }

      const pfx = NOVATION_LAUNCHPAD_MK3_X_SYSEX_HEADER.length;

      const cmd = message.message[pfx];

      switch (cmd) {
        case 0x0e: {
          if (this._modeCheckTimeout) {
            clearTimeout(this._modeCheckTimeout);
            this._modeCheckTimeout = null;
          }
          if (!this.isIncorrectPort) {
            // Only send additional readiness events if the port is correct
            const programmerMode = message.message[pfx + 1] === 1;
            this.emit('readiness', {
              message,
              readiness: programmerMode
                ? {
                    state: 'ready',
                  }
                : {
                    state: 'pending-mode-switch',
                    message:
                      'Device must be switched to programmer mode before it can be used with this profile.',
                  },
            });
          }
          return true;
        }
      }

      return false;
    }
    return false;
  };
}

export const createNovationLaunchpadMk3XProfileProgrammerMode: MidiProfileInit =
  ({ connection }) =>
    new NovationLaunchpadMk3XProfileProgrammerMode(
      connection,
      novationLaunchpadMk3XProgrammerLayout,
    );

let colorSpace: ColorSpace<[number]> | null = null;

const createModeSwitcher = (
  sendMessage: (message: number[]) => void,
): Pick<MidiFeedbackProfile, 'performModeSwitch' | 'close'> => {
  let hasSwitched = false;

  const checkMode = () => {
    // Send a request to check the current mode of the device
    sendMessage([...NOVATION_LAUNCHPAD_MK3_X_SYSEX_HEADER, 0x0e, 0xf7]);
  };

  // Immediately check the device mode
  setTimeout(checkMode, 0);

  /**
   * Start an interval to periodically check the current mode of the device,
   * this will allow users to be notified if the device reaches an unexpected
   * state.
   */
  const interval = setInterval(checkMode, 1000);

  return {
    performModeSwitch: () => {
      hasSwitched = true;
      sendMessage([...NOVATION_LAUNCHPAD_MK3_X_SYSEX_HEADER, 0x0e, 1, 0xf7]);
    },
    close: async () => {
      clearInterval(interval);
      if (hasSwitched) {
        sendMessage([...NOVATION_LAUNCHPAD_MK3_X_SYSEX_HEADER, 0x0e, 0, 0xf7]);
      }
    },
  };
};

export const createNovationLaunchpadMk3XFeedbackProfile: MidiFeedbackProfileInit =
  ({ connection, inputProfile, sendMessage }) => {
    const modeSwitcher = createModeSwitcher(sendMessage);

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
    })({
      connection,
      inputProfile,
      sendMessage,
    });

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
 * @see https://userguides.novationmusic.com/hc/en-gb/articles/24001475492498-Controlling-the-Launchpad-X-surface
 */
const MAX_COLORS_PER_SYSEX_MESSAGE = Math.floor((81 / 5) * 3);

const DEFAULT_COLORS: Record<MidiColorFeedback['mode'], RGB> = {
  active: [255, 255, 255],
  ready: [0, 128, 128],
  empty: [0, 0, 0],
};

export const createNovationLaunchpadMk3XFeedbackProfileRGB: MidiFeedbackProfileInit =
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

    const modeSwitcher = createModeSwitcher(sendMessage);

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
            ...NOVATION_LAUNCHPAD_MK3_X_SYSEX_HEADER,
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

export const NOVATION_LAUNCHPAD_MK3_X: MidiProfileDefinition = {
  name: 'Launchpad X (mk3)',
  autoSelect: (connection: MidiInputConnectionInfo) =>
    connection.inputDeviceName.includes('LPX'),
  autoSelectOutput: ({ inputDeviceName }, outputs) => {
    let search = inputDeviceName;
    if (inputDeviceName.startsWith('MIDIIN')) {
      search = `MIDIOUT${inputDeviceName.slice(6)}`;
    }
    if (inputDeviceName.endsWith(' Out')) {
      search = `${inputDeviceName.slice(0, -4)} In`;
    }
    const exact = outputs.find((output) => output.outputDeviceName === search);
    return (
      exact ??
      outputs.find((output) => output.outputDeviceName.includes(search)) ??
      null
    );
  },
  subProfiles: {
    default: {
      name: 'Programmer Mode - Sysex RGB Feedback',
      input: createNovationLaunchpadMk3XProfileProgrammerMode,
      feedback: createNovationLaunchpadMk3XFeedbackProfileRGB,
    },
    notes: {
      name: 'Programmer Mode - Note Feedback',
      input: createNovationLaunchpadMk3XProfileProgrammerMode,
      feedback: createNovationLaunchpadMk3XFeedbackProfile,
    },
  },
};
