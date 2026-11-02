import {
  MIDI_NOTE_ON,
  MidiController,
  MidiInputConnectionInfo,
  MidiNote,
  MidiProfileDefinition,
} from '@arcanewizards/talisman';
import { ColorSpace, RGB } from '@arcanewizards/talisman/color';
import {
  MidiColorFeedback,
  MidiFeedbackProfile,
  MidiFeedbackProfileInit,
} from '@arcanewizards/talisman/feedback';
import {
  MidiButtonNature,
  MidiControllerAction,
  MidiControllerItem,
  MidiProfileBasic,
  MidiProfileInit,
} from '@arcanewizards/talisman/profile';
import {
  createMidiFighter9ColorSpace,
  MIDI_FIGHTER_9_COLOR_SPACE,
} from './shared/midi-fighter.js';

export const createMidiFighter3DProfile: MidiProfileInit = () => {
  const items: Record<string, MidiControllerItem> = {};
  const buttonNatures: Record<
    string,
    { item: string; nature: MidiButtonNature }
  > = {};
  const systemNatures: Record<
    string,
    { item: string; nature: MidiButtonNature }
  > = {};

  const BUTTON_NOTE_CHANNEL = 2;
  const BUTTON_CONTROL_CHANGE_CHANNEL = 3;
  const SYSTEM_BUTTON_CHANNEL = 3;

  {
    // Encapsulate to leave out of scope

    for (let bank = 0; bank < 4; bank++) {
      for (let button = 0; button < 16; button++) {
        const id = `bank${bank}-knob${button}`;
        const buttonNature: MidiButtonNature = {
          nature: 'grid',
          bank,
        };
        const controller = (36 + (bank * 16 + button)) as MidiController;
        buttonNatures[controller] = { item: id, nature: buttonNature };
        items[id] = {
          id,
          note: [
            {
              id: {
                type: 'note',
                channel: BUTTON_NOTE_CHANNEL,
                note: controller,
              },
              nature: buttonNature,
            },
          ],
          position: {
            col: button % 4,
            row: Math.floor(button / 4),
          },
        };
      }
    }

    for (let bank = 0; bank < 4; bank++) {
      // Bank Change
      const id = `bank-${bank}`;
      const systemNature: MidiButtonNature = {
        nature: 'bank-change',
        bank,
      };
      systemNatures[bank] = { item: id, nature: systemNature };
      items[id] = {
        id,
        note: [
          {
            id: {
              type: 'note',
              channel: SYSTEM_BUTTON_CHANNEL,
              note: bank as MidiNote,
            },
            nature: systemNature,
          },
        ],
        position: {
          col: bank,
          row: 4,
        },
      };
    }

    const SIDE_BUTTON_LABELS = [
      'Left Bottom',
      'Left Middle',
      'Left Top',
      'Right Bottom',
      'Right Middle',
      'Right Top',
    ];
    for (let bank = 0; bank < 4; bank++) {
      const systemNature: MidiButtonNature = {
        nature: 'unknown',
        bank,
      };
      for (let button = 0; button < 6; button++) {
        const id = `bank${bank}-side-button-${button}`;
        const note = (bank * 6 + button + 20) as MidiController;
        systemNatures[note] = { item: id, nature: systemNature };
        items[id] = {
          id,
          label: SIDE_BUTTON_LABELS[button],
          note: [
            {
              id: {
                type: 'note',
                channel: SYSTEM_BUTTON_CHANNEL,
                note,
              },
              nature: systemNature,
            },
          ],
        };
      }
    }
  }

  return new MidiProfileBasic({
    getItems: () => Object.values(items),
    getItem: (id) => items[id] ?? null,
    getAction: (msg): MidiControllerAction | null => {
      if (msg.type === 'control-change') {
        if (msg.channel === BUTTON_CONTROL_CHANGE_CHANNEL) {
          const buttonNature = buttonNatures[msg.controller];
          if (buttonNature) {
            const { item } = buttonNature;
            return {
              action: 'duplicate',
              item,
            };
          }
          return null;
        }
      } else if (msg.type === 'note') {
        if (msg.channel === BUTTON_NOTE_CHANNEL) {
          const buttonNature = buttonNatures[msg.note];
          if (buttonNature) {
            const { item, nature } = buttonNature;
            return {
              action: msg.action === 'on' ? 'button-press' : 'button-release',
              item,
              nature,
            };
          }
          return null;
        }
        if (msg.channel === SYSTEM_BUTTON_CHANNEL) {
          const systemNature = systemNatures[msg.note];
          if (systemNature) {
            const { item, nature } = systemNature;
            return {
              action: msg.action === 'on' ? 'button-press' : 'button-release',
              item,
              nature,
            };
          }
          return null;
        }
      }

      return null;
    },
  });
};

let _colorSpace: ColorSpace<[number, number]> | null = null;

const DEFAULT_COLORS: Record<MidiColorFeedback['mode'], RGB> = {
  active: [255, 255, 255],
  ready: [0, 128, 128],
  empty: [0, 0, 0],
};

const COLOR_CHANGE_CHANNEL = 2;
const BRIGHTNESS_CHANGE_CHANNEL = 3;

export const createMidiFighter3D9ColorFeedback: MidiFeedbackProfileInit = ({
  inputProfile,
  sendMessage,
}) => {
  const idToController: Record<string, number> = {};
  let maxNoteId = 0;

  for (const item of inputProfile.getItems()) {
    for (const cc of item.note || []) {
      // Only grid controls are feedback enabled
      if (cc.nature?.nature === 'grid') {
        idToController[item.id] = cc.id.note;
        maxNoteId = Math.max(maxNoteId, cc.id.note);
      }
    }
  }

  const lastColorValues = new Array<number>(maxNoteId + 1).fill(-1);
  const lastBrightnessValues = new Array<number>(maxNoteId + 1).fill(-1);

  if (!_colorSpace) {
    _colorSpace = createMidiFighter9ColorSpace();
  }
  const colorSpace = _colorSpace;

  const setItemColor: MidiFeedbackProfile['setItemColor'] = (
    idString,
    feedback,
  ) => {
    const controller = idToController[idString];
    if (controller === undefined) {
      return;
    }
    const [v, b] = colorSpace.rgbToValue(
      feedback.color ?? DEFAULT_COLORS[feedback.mode],
    );

    const velocity = MIDI_FIGHTER_9_COLOR_SPACE[v]?.velocity;
    if (velocity === undefined) {
      throw new Error(`Unexpected color index: ${v}`);
    }
    const brightness = b + 18;

    if (lastColorValues[controller] !== velocity) {
      sendMessage([
        MIDI_NOTE_ON | COLOR_CHANGE_CHANNEL,
        controller,
        velocity & 0x7f,
      ]);
      lastColorValues[controller] = velocity;
    }
    if (lastBrightnessValues[controller] !== brightness) {
      sendMessage([
        MIDI_NOTE_ON | BRIGHTNESS_CHANGE_CHANNEL,
        controller,
        brightness & 0x7f,
      ]);
      lastBrightnessValues[controller] = brightness;
    }
  };

  return {
    clear: () => {
      for (const controller of Object.keys(idToController)) {
        setItemColor(controller, { color: [0, 0, 0], mode: 'empty' });
      }
    },
    setItemColor,
    setItemValue: () => {
      // no-op: unnecessary
    },
    frameFinished: () => {
      // no-op: unnecessary
    },
    close: async () => {},
  };
};

export const MIDI_FIGHTER_3D: MidiProfileDefinition = {
  name: 'Midi Fighter 3D',
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
    connection.inputDeviceName === 'Midi Fighter 3D',
  subProfiles: {
    default: {
      name: 'Default',
      input: createMidiFighter3DProfile,
      feedback: createMidiFighter3D9ColorFeedback,
    },
  },
};
