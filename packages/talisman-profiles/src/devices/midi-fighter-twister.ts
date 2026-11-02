import {
  MIDI_CONTROL_CHANGE,
  MidiController,
  MidiInputConnectionInfo,
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
  MidiNumericNature,
  MidiProfileBasic,
  MidiProfileInit,
} from '@arcanewizards/talisman/profile';
import {
  createMidiFighterClassicColorSpace,
  createMidiFighterExpandedColorSpace,
  MIDI_FIGHTER_BRIGHTNESS_LEVELS,
} from './shared/midi-fighter.js';

export const createMidiFighterTwisterProfile: MidiProfileInit = () => {
  const items: Record<string, MidiControllerItem> = {};
  const buttonNatures: Record<
    string,
    { item: string; nature: MidiButtonNature }
  > = {};
  const encoderNatures: Record<
    string,
    { item: string; nature: MidiNumericNature }
  > = {};
  const systemNatures: Record<
    string,
    { item: string; nature: MidiButtonNature }
  > = {};

  {
    // Encapsulate to leave out of scope

    for (let bank = 0; bank < 4; bank++) {
      for (let knob = 0; knob < 16; knob++) {
        const id = `bank${bank}-knob${knob}`;
        const buttonNature: MidiButtonNature = {
          nature: 'grid',
          bank,
        };
        const encoderNature: MidiNumericNature = {
          nature: 'encoder',
          role: 'grid',
          bank,
        };
        const controller = (bank * 16 + knob) as MidiController;
        buttonNatures[controller] = { item: id, nature: buttonNature };
        encoderNatures[controller] = { item: id, nature: encoderNature };
        items[id] = {
          id,
          controlChange: [
            {
              id: {
                type: 'control-change',
                channel: 0,
                controller,
              },
              nature: encoderNature,
            },
            {
              id: {
                type: 'control-change',
                channel: 1,
                controller,
              },
              nature: buttonNature,
            },
          ],
          position: {
            col: knob % 4,
            row: 3 - Math.floor(knob / 4),
          },
        };
      }
    }

    for (let bank = 0; bank < 8; bank++) {
      // Bank Change
      const id = `bank-${bank}`;
      const systemNature: MidiButtonNature = {
        nature: 'bank-change',
        bank,
      };
      systemNatures[bank] = { item: id, nature: systemNature };
      items[id] = {
        id,
        controlChange: [
          {
            id: {
              type: 'control-change',
              channel: 3,
              controller: bank as MidiController,
            },
            nature: systemNature,
          },
        ],
      };
    }
    const SIDE_BUTTON_LABELS = [
      'Left Top',
      'Left Middle',
      'Left Bottom',
      'Right Top',
      'Right Middle',
      'Right Bottom',
    ];
    for (let bank = 0; bank < 4; bank++) {
      const systemNature: MidiButtonNature = {
        nature: 'unknown',
        bank,
      };
      for (let button = 0; button < 6; button++) {
        const id = `bank${bank}-side-button-${button}`;
        const controller = (bank * 6 + button + 8) as MidiController;
        systemNatures[controller] = { item: id, nature: systemNature };
        items[id] = {
          id,
          label: SIDE_BUTTON_LABELS[button],
          controlChange: [
            {
              id: {
                type: 'control-change',
                channel: 3,
                controller,
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
        if (msg.channel === 0) {
          // Encoder
          const encoderNature = encoderNatures[msg.controller];
          if (encoderNature) {
            const { item, nature } = encoderNature;
            return {
              action: 'absolute-value',
              item,
              nature,
              value: msg.value / 127,
              precisionBits: 7,
            };
          }
          return null;
        }
        if (msg.channel === 1) {
          // Encoder Press
          const buttonNature = buttonNatures[msg.controller];
          if (buttonNature) {
            const { item, nature } = buttonNature;
            return {
              action: msg.value > 0 ? 'button-press' : 'button-release',
              item,
              nature,
            };
          }
          return null;
        }
        if (msg.channel === 3) {
          // Side Buttons / System
          const systemNature = systemNatures[msg.controller];
          if (systemNature) {
            const { item, nature } = systemNature;
            return {
              action: msg.value > 0 ? 'button-press' : 'button-release',
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

let _classicColorSpace: ColorSpace<[number, number]> | null = null;

const DEFAULT_COLORS: Record<MidiColorFeedback['mode'], RGB> = {
  active: [255, 255, 255],
  ready: [0, 128, 128],
  empty: [0, 0, 0],
};

export const createMidiFighterTwisterClassicFeedback: MidiFeedbackProfileInit =
  ({ inputProfile, sendMessage }) => {
    const idToController: Record<string, number> = {};

    const lastColorValues = new Array<number>(16 * 4).fill(-1);
    const lastBrightnessValues = new Array<number>(16 * 4).fill(-1);
    const lastValues = new Array<number>(16 * 4).fill(-1);

    for (const item of inputProfile.getItems()) {
      for (const cc of item.controlChange || []) {
        if (cc.id.channel === 0) {
          idToController[item.id] = cc.id.controller;
        }
      }
    }

    if (!_classicColorSpace) {
      _classicColorSpace = createMidiFighterClassicColorSpace();
    }
    const colorSpace = _classicColorSpace;

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

      const velocity = v + 1;
      const brightness = (b / 9) * 31 + 17;

      if (lastColorValues[controller] !== velocity) {
        sendMessage([MIDI_CONTROL_CHANGE | 1, controller, velocity & 0x7f]);
        lastColorValues[controller] = velocity;
      }
      if (lastBrightnessValues[controller] !== brightness) {
        sendMessage([MIDI_CONTROL_CHANGE | 2, controller, brightness & 0x7f]);
        lastBrightnessValues[controller] = brightness;
      }
    };

    return {
      clear: () => {
        for (const controller of Object.values(idToController)) {
          // There's no black colour, can only set brightness
          lastBrightnessValues[controller] = 17;
          sendMessage([MIDI_CONTROL_CHANGE | 2, controller, 17]);
          // Make ring 0
          sendMessage([MIDI_CONTROL_CHANGE, controller, 0]);
          lastValues[controller] = 0;
        }
      },
      setItemColor,
      setItemValue: (id, value) => {
        const controller = idToController[id];
        if (controller === undefined) {
          return;
        }
        const scaledValue = Math.round(value * 127) & 0x7f;
        if (lastValues[controller] !== scaledValue) {
          sendMessage([MIDI_CONTROL_CHANGE, controller, scaledValue]);
          lastValues[controller] = scaledValue;
        }
      },
      frameFinished: () => {
        // no-op: unnecessary
      },
    };
  };

let _expandedColorSpace: ColorSpace<[number, number]> | null = null;

export const createMidiFighterTwisterExpandedFeedback: MidiFeedbackProfileInit =
  ({ inputProfile, sendMessage }) => {
    const idToController: Record<string, number> = {};

    const lastColorValues = new Array<number>(16 * 4).fill(-1);
    const lastBrightnessValues = new Array<number>(16 * 4).fill(-1);
    const lastValues = new Array<number>(16 * 4).fill(-1);

    for (const item of inputProfile.getItems()) {
      for (const cc of item.controlChange || []) {
        if (cc.id.channel === 0) {
          idToController[item.id] = cc.id.controller;
        }
      }
    }

    if (!_expandedColorSpace) {
      _expandedColorSpace = createMidiFighterExpandedColorSpace();
    }
    const colorSpace = _expandedColorSpace;

    const setItemColor: MidiFeedbackProfile['setItemColor'] = (
      idString,
      feedback,
    ) => {
      const controller = idToController[idString];
      if (controller === undefined) {
        return;
      }
      const [velocity, b] = colorSpace.rgbToValue(
        feedback.color ?? DEFAULT_COLORS[feedback.mode],
      );
      const relativeBrightnessValue = Math.round(
        (b / (MIDI_FIGHTER_BRIGHTNESS_LEVELS.length - 1)) * 31,
      );
      const brightness = relativeBrightnessValue + 17;

      if (lastColorValues[controller] !== velocity) {
        sendMessage([MIDI_CONTROL_CHANGE | 1, controller, velocity & 0x7f]);
        lastColorValues[controller] = velocity;
      }
      if (lastBrightnessValues[controller] !== brightness) {
        sendMessage([MIDI_CONTROL_CHANGE | 2, controller, brightness & 0x7f]);
        lastBrightnessValues[controller] = brightness;
      }
    };

    return {
      clear: () => {
        for (const controller of Object.values(idToController)) {
          // There's no black colour, can only set brightness
          lastBrightnessValues[controller] = 17;
          sendMessage([MIDI_CONTROL_CHANGE | 2, controller, 17]);
          // Make ring 0
          sendMessage([MIDI_CONTROL_CHANGE, controller, 0]);
          lastValues[controller] = 0;
        }
      },
      setItemColor,
      setItemValue: (id, value) => {
        const controller = idToController[id];
        if (controller === undefined) {
          return;
        }
        const scaledValue = Math.round(value * 127) & 0x7f;
        if (lastValues[controller] !== scaledValue) {
          sendMessage([MIDI_CONTROL_CHANGE, controller, scaledValue]);
          lastValues[controller] = scaledValue;
        }
      },
      frameFinished: () => {
        // no-op: unnecessary
      },
    };
  };

export const MIDI_FIGHTER_TWISTER: MidiProfileDefinition = {
  name: 'Midi Fighter Twister',
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
    connection.inputDeviceName === 'Midi Fighter Twister',
  subProfiles: {
    default: {
      name: 'Color Map: Classic',
      input: createMidiFighterTwisterProfile,
      feedback: createMidiFighterTwisterClassicFeedback,
    },
    expanded: {
      name: 'Color Map: Expanded',
      input: createMidiFighterTwisterProfile,
      feedback: createMidiFighterTwisterExpandedFeedback,
    },
  },
};
