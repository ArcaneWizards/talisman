import {
  ColorSpace,
  createColorSpace,
  hexToRGB,
} from '@talisman-midi/talisman/color';
import {
  FeedbackCapabilityProfile,
  MidiButtonNature,
  MidiControllerAction,
  MidiControllerItem,
  MidiFeedbackProfile,
  MidiParsedMessage,
  MidiProfileInit,
} from '@talisman-midi/talisman/core';
import {
  MidiProfileBase,
  MidiProfileBasic,
} from '@talisman-midi/talisman/profile';
import { startsWithSysex } from '@talisman-midi/talisman/util';

/**
 * RGB Color Palette used for the Novation Launchpads, Mk1, Mk2 and Mk3.
 *
 * Note -> RGB Hexadecimal format (RRGGBB)
 *
 * Downloads Pages (and associated reference)
 *
 * - [Launchpad (mk1)](https://downloads.novationmusic.com/novation/launchpad-mk1/launchpad)
 * - [Launchpad Mini (mk1)](https://downloads.novationmusic.com/novation/launchpad-mk1/launchpad)
 * - [Launchpad (mk2)](https://downloads.novationmusic.com/novation/launchpad-mk2/launchpad-mk2)
 * - [Launchpad Mini (mk2)](https://downloads.novationmusic.com/novation/launchpad-mk2/launchpad-mini-mk2)
 * - [Launchpad Pro (mk1/mk2)](https://downloads.novationmusic.com/novation/launchpad-mk2/launchpad-pro) - Note there is these are the same device, and you often see both names in the wild.
 * - [Launchpad X (mk3)](https://downloads.novationmusic.com/novation/launchpad-mk3/launchpad-x)
 * - [Launchpad Mini (mk3)](https://downloads.novationmusic.com/novation/launchpad-mk3/launchpad-mini-mk3-0)
 * - [Launchpad Pro (mk3)](https://downloads.novationmusic.com/novation/launchpad-mk3/launchpad-pro-mk3-0)
 *
 * Programmer Manuals:
 *
 * - [Launchpad (mk2) Manual](https://fael-downloads-prod.focusrite.com/customer/prod/s3fs-public/downloads/Launchpad%20MK2%20Programmers%20Reference%20Manual%20v1.03.pdf)
 * - [Launchpad Pro Manual (mk2)](https://fael-downloads-prod.focusrite.com/customer/prod/s3fs-public/downloads/Launchpad%20Pro%20Programmers%20Reference%20Guide%201.01.pdf)
 * - [Launchpad Pro Manual (mk3)](https://fael-downloads-prod.focusrite.com/customer/prod/s3fs-public/downloads/LPP3_prog_ref_guide_200415.pdf)
 */
// prettier-ignore
export const NOVATION_LAUNCHPAD_RGB_PALLETTE = [
  // 0-7
  '000000',
  '1c1c1c',
  '7c7c7c',
  'fcfcfc',
  'ff4d47',
  'ff0a00',
  '5a0100',
  '190000',
  // 8-15
  'ffbd62',
  'ff5600',
  '5a1d00',
  '241800',
  'fdfd21',
  'fdfd00',
  '585800',
  '181800',
  // 16-23
  '80fd2a',
  '40fd00',
  '165800',
  '132800',
  '34fd2b',
  '00fd00',
  '005800',
  '001800',
  // 24-31
  '33fd46',
  '00fd00',
  '005800',
  '001800',
  '32fd7e',
  '00fd3a',
  '005814',
  '001c0f',
  // 32-39
  '2ffcb0',
  '00fc91',
  '005831',
  '00180f',
  '39bfff',
  '00a7ff',
  '004051',
  '001018',
  // 40-47
  '4186ff',
  '0050ff',
  '001a5a',
  '000719',
  '4647ff',
  '0000ff',
  '00005b',
  '000019',
  // 48-55
  '8347ff',
  '8347ff',
  '160067',
  '0b0032',
  'ff49ff',
  'ff00ff',
  '5a005a',
  '190019',
  // 56-63
  '190019',
  'ff0752',
  '5a011b',
  '210010',
  'ff1900',
  '9b3500',
  '7a5100',
  '3e6400',
  // 64-71
  '003800',
  '005432',
  '00537e',
  '0000ff',
  '00444d',
  '1b00d2',
  '7c7c7c',
  '202020',
  // 72-79
  'fc0c02',
  'bafd00',
  'aaed00',
  '56fd00',
  '008800',
  '00fc7a',
  '00a7ff',
  '001bff',
  // 80-87
  '3500ff',
  '7700ff',
  'b4177e',
  '412000',
  'ff4a00',
  '83e100',
  '65fd00',
  '00fd00',
  // 88-95
  '00fd00',
  '45fd61',
  '00fcca',
  '5086ff',
  '274dc9',
  '827aed',
  'd30cff',
  'ff065a',
  // 96-103
  'ff7d00',
  'b9b100',
  '8afd00',
  '825d00',
  '392800',
  '0d4c05',
  '005037',
  '131329',
  // 104-111
  '101f5a',
  '6a3c17',
  'ac0400',
  'e15135',
  'dc6900',
  'ffe100',
  '99e100',
  '5fb500',
  // 112-119
  '1b1b31',
  'dcfd54',
  '76fcb8',
  '9697ff',
  '8b61ff',
  '404040',
  '747474',
  'defcfc',
  // 120-127
  'a40400',
  '350000',
  '00d100',
  '004000',
  'b9b100',
  '3d3000',
  'b45d00',
  '4a1400',
];

export const createNovationLaunchpadRGBPallette = () =>
  NOVATION_LAUNCHPAD_RGB_PALLETTE.map(hexToRGB);

export const createNovationLaunchpadRGBColorSpace = (): ColorSpace<
  [number]
> => {
  const rgb = createNovationLaunchpadRGBPallette();
  return createColorSpace({
    sizes: [rgb.length],
    argsToRgb: ([velocity]) => {
      const c = rgb[velocity];

      if (!c) {
        throw new Error(`Invalid RGB values for velocity: ${velocity}`);
      }

      return c;
    },
    precision: [5, 5, 5],
  });
};

export type NovationButtonInfo = {
  item: string;
  nature: MidiButtonNature;
};

export type NovationModeSwitchingOptions = {
  sysexHeader: number[];
  command: number;
  requiredMode: number;
  defaultMode?: number;
  modeName: string;
};

export type CreateNovationButtonOnlyProfileArgs = {
  getLayout: () => {
    items: Record<string, MidiControllerItem>;
    notes: Record<number, NovationButtonInfo>;
    controllers: Record<number, NovationButtonInfo>;
  };
  noteOffMode: '0-velocity' | 'note-off';
  getFeedbackCapabilities?: () => Record<string, FeedbackCapabilityProfile>;
  validatePort?: () =>
    | {
        isIncorrectPort: false;
      }
    | {
        isIncorrectPort: true;
        reason: string;
      };
  modeSwitching?: NovationModeSwitchingOptions;
};

export type NovationButtonOnlyLayout =
  CreateNovationButtonOnlyProfileArgs['getLayout'];

export class NovationButtonOnlyProfile extends MidiProfileBase {
  private readonly layout: ReturnType<NovationButtonOnlyLayout>;
  private readonly isIncorrectPort: boolean;
  private readonly opts: Pick<
    CreateNovationButtonOnlyProfileArgs,
    'noteOffMode' | 'getFeedbackCapabilities' | 'modeSwitching'
  >;

  private _modeCheckTimeout: ReturnType<typeof setTimeout> | null = null;

  public constructor({
    getLayout,
    validatePort,
    ...opts
  }: CreateNovationButtonOnlyProfileArgs) {
    super();
    this.layout = getLayout();
    this.opts = opts;

    if (validatePort) {
      const result = validatePort();
      this.isIncorrectPort = result.isIncorrectPort;
      if (result.isIncorrectPort) {
        this.setReadiness({
          readiness: {
            state: 'unusable',
            message: result.reason,
          },
        });
      }
    } else {
      this.isIncorrectPort = false;
    }

    if (opts.modeSwitching) {
      this._modeCheckTimeout = setTimeout(() => {
        // Assume that if the profile does not receive a response for the mode
        // check within 1 second, that it's in the incorrect mode.
        if (!this.isIncorrectPort) {
          this.emit('readiness', {
            readiness: {
              state: 'pending-mode-switch',
              message:
                'Did not receive a response for mode check, device likely needs to be switched to programmer mode, or is an incompatible port.',
            },
          });
        }
      }, 1000);
    }
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
      const noteOn =
        this.opts.noteOffMode === 'note-off'
          ? message.action === 'on'
          : message.velocity > 0;
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
      if (this.opts.modeSwitching) {
        if (
          !startsWithSysex(message.message, this.opts.modeSwitching.sysexHeader)
        ) {
          return false;
        }

        const pfx = this.opts.modeSwitching.sysexHeader.length;

        const cmd = message.message[pfx];

        switch (cmd) {
          case this.opts.modeSwitching.command: {
            if (this._modeCheckTimeout) {
              clearTimeout(this._modeCheckTimeout);
              this._modeCheckTimeout = null;
            }
            if (!this.isIncorrectPort) {
              // Only send additional readiness events if the port is correct
              const programmerMode =
                message.message[pfx + 1] ===
                this.opts.modeSwitching.requiredMode;
              this.emit('readiness', {
                message,
                readiness: programmerMode
                  ? {
                      state: 'ready',
                    }
                  : {
                      state: 'pending-mode-switch',
                      message: `Device must be switched to ${this.opts.modeSwitching.modeName} before it can be used with this profile.`,
                    },
              });
            }
            return true;
          }
        }
      }

      return false;
    }
    return false;
  };

  public getFeedbackCapabilities = () => {
    return this.opts.getFeedbackCapabilities?.() ?? {};
  };
}

export const createNovationButtonOnlyProfile =
  ({
    getLayout,
    noteOffMode,
    getFeedbackCapabilities,
  }: CreateNovationButtonOnlyProfileArgs): MidiProfileInit =>
  () => {
    const { items, notes, controllers } = getLayout();

    return new MidiProfileBasic({
      getItems: () => Object.values(items),
      getItem: (id) => items[id] ?? null,
      getFeedbackCapabilities: () => getFeedbackCapabilities?.() ?? {},
      getAction: (msg): MidiControllerAction | null => {
        if (msg.type === 'note') {
          const info = notes[msg.note];
          if (!info) {
            return null;
          }
          const noteOn =
            noteOffMode === 'note-off' ? msg.action === 'on' : msg.velocity > 0;
          return {
            item: info.item,
            action: noteOn ? 'button-press' : 'button-release',
            nature: info.nature,
            velocity: msg.velocity,
          };
        } else if (msg.type === 'control-change') {
          const info = controllers[msg.controller];
          if (!info) {
            return null;
          }
          return {
            item: info.item,
            action: msg.value > 0 ? 'button-press' : 'button-release',
            nature: info.nature,
            velocity: msg.value,
          };
        }
        return null;
      },
    });
  };

type CreateNovationModeSwitcherArgs = NovationModeSwitchingOptions & {
  sendMessage: (message: number[]) => void;
};

export const createNovationModeSwitcher = ({
  sysexHeader,
  command,
  requiredMode: requiredProfile,
  defaultMode: defaultProfile = 0,
  sendMessage,
}: CreateNovationModeSwitcherArgs): Pick<
  MidiFeedbackProfile,
  'performModeSwitch' | 'close'
> => {
  let hasSwitched = false;

  const checkMode = () => {
    // Send a request to check the current mode of the device
    sendMessage([...sysexHeader, command, 0xf7]);
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
      sendMessage([...sysexHeader, command, requiredProfile, 0xf7]);
    },
    close: async () => {
      clearInterval(interval);
      if (hasSwitched && defaultProfile !== undefined) {
        sendMessage([...sysexHeader, command, defaultProfile, 0xf7]);
      }
    },
  };
};
