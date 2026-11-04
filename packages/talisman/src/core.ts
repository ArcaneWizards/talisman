import type { RGB } from './color.js';

export const MIDI_NOTE_OFF = 0x80;
export const MIDI_NOTE_ON = 0x90;
export const MIDI_POLYPHONIC_AFTERTOUCH = 0xa0;
export const MIDI_CONTROL_CHANGE = 0xb0;
export const MIDI_PROGRAM_CHANGE = 0xc0;
export const MIDI_CHANNEL_AFTERTOUCH = 0xd0;
export const MIDI_PITCH_WHEEL = 0xe0;
export const MIDI_SYSEX = 0xf0;
export const MIDI_MTC = 0xf1;

export const MIDI_PITCH_WHEEL_MAX = 0x3fff;

export const MIDI_CHANNEL_OPTIONS = Object.freeze({
  0: 'Channel 1',
  1: 'Channel 2',
  2: 'Channel 3',
  3: 'Channel 4',
  4: 'Channel 5',
  5: 'Channel 6',
  6: 'Channel 7',
  7: 'Channel 8',
  8: 'Channel 9',
  9: 'Channel 10',
  10: 'Channel 11',
  11: 'Channel 12',
  12: 'Channel 13',
  13: 'Channel 14',
  14: 'Channel 15',
  15: 'Channel 16',
});

export type MidiChannel = keyof typeof MIDI_CHANNEL_OPTIONS;

export const MIDI_NOTE_OPTIONS = Object.freeze({
  0: '0',
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: '11',
  12: '12',
  13: '13',
  14: '14',
  15: '15',
  16: '16',
  17: '17',
  18: '18',
  19: '19',
  20: '20',
  21: '21 (A0)',
  22: '22 (A#0/Bb0)',
  23: '23 (B0)',
  24: '24 (C1)',
  25: '25 (C#1/Db1)',
  26: '26 (D1)',
  27: '27 (D#1/Eb1)',
  28: '28 (E1)',
  29: '29 (F1)',
  30: '30 (F#1/Gb1)',
  31: '31 (G1)',
  32: '32 (G#1/Ab1)',
  33: '33 (A1)',
  34: '34 (A#1/Bb1)',
  35: '35 (B1)',
  36: '36 (C2)',
  37: '37 (C#2/Db2)',
  38: '38 (D2)',
  39: '39 (D#2/Eb2)',
  40: '40 (E2)',
  41: '41 (F2)',
  42: '42 (F#2/Gb2)',
  43: '43 (G2)',
  44: '44 (G#2/Ab2)',
  45: '45 (A2)',
  46: '46 (A#2/Bb2)',
  47: '47 (B2)',
  48: '48 (C3)',
  49: '49 (C#3/Db3)',
  50: '50 (D3)',
  51: '51 (D#3/Eb3)',
  52: '52 (E3)',
  53: '53 (F3)',
  54: '54 (F#3/Gb3)',
  55: '55 (G3)',
  56: '56 (G#3/Ab3)',
  57: '57 (A3)',
  58: '58 (A#3/Bb3)',
  59: '59 (B3)',
  60: '60 (C4) (Middle C)',
  61: '61 (C#4/Db4)',
  62: '62 (D4)',
  63: '63 (D#4/Eb4)',
  64: '64 (E4)',
  65: '65 (F4)',
  66: '66 (F#4/Gb4)',
  67: '67 (G4)',
  68: '68 (G#4/Ab4)',
  69: '69 (A4) (440 Hz)',
  70: '70 (A#4/Bb4)',
  71: '71 (B4)',
  72: '72 (C5)',
  73: '73 (C#5/Db5)',
  74: '74 (D5)',
  75: '75 (D#5/Eb5)',
  76: '76 (E5)',
  77: '77 (F5)',
  78: '78 (F#5/Gb5)',
  79: '79 (G5)',
  80: '80 (G#5/Ab5)',
  81: '81 (A5)',
  82: '82 (A#5/Bb5)',
  83: '83 (B5)',
  84: '84 (C6)',
  85: '85 (C#6/Db6)',
  86: '86 (D6)',
  87: '87 (D#6/Eb6)',
  88: '88 (E6)',
  89: '89 (F6)',
  90: '90 (F#6/Gb6)',
  91: '91 (G6)',
  92: '92 (G#6/Ab6)',
  93: '93 (A6)',
  94: '94 (A#6/Bb6)',
  95: '95 (B6)',
  96: '96 (C7)',
  97: '97 (C#7/Db7)',
  98: '98 (D7)',
  99: '99 (D#7/Eb7)',
  100: '100 (E7)',
  101: '101 (F7)',
  102: '102 (F#7/Gb7)',
  103: '103 (G7)',
  104: '104 (G#7/Ab7)',
  105: '105 (A7)',
  106: '106 (A#7/Bb7)',
  107: '107 (B7)',
  108: '108 (C8)',
  109: '109 (C#8/Db8)',
  110: '110 (D8)',
  111: '111 (D#8/Eb8)',
  112: '112 (E8)',
  113: '113 (F8)',
  114: '114 (F#8/Gb8)',
  115: '115 (G8)',
  116: '116 (G#8/Ab8)',
  117: '117 (A8)',
  118: '118 (A#8/Bb8)',
  119: '119 (B8)',
  120: '120 (C9)',
  121: '121 (C#9/Db9)',
  122: '122 (D9)',
  123: '123 (D#9/Eb9)',
  124: '124 (E9)',
  125: '125 (F9)',
  126: '126 (F#9/Gb9)',
  127: '127 (G9)',
});

export type MidiNote = keyof typeof MIDI_NOTE_OPTIONS;

export const MIDI_CONTROLLER_OPTIONS = Object.freeze({
  0: '0 (00h)',
  1: '1 (01h)',
  2: '2 (02h)',
  3: '3 (03h)',
  4: '4 (04h)',
  5: '5 (05h)',
  6: '6 (06h)',
  7: '7 (07h)',
  8: '8 (08h)',
  9: '9 (09h)',
  10: '10 (0Ah)',
  11: '11 (0Bh)',
  12: '12 (0Ch)',
  13: '13 (0Dh)',
  14: '14 (0Eh)',
  15: '15 (0Fh)',
  16: '16 (10h)',
  17: '17 (11h)',
  18: '18 (12h)',
  19: '19 (13h)',
  20: '20 (14h)',
  21: '21 (15h)',
  22: '22 (16h)',
  23: '23 (17h)',
  24: '24 (18h)',
  25: '25 (19h)',
  26: '26 (1Ah)',
  27: '27 (1Bh)',
  28: '28 (1Ch)',
  29: '29 (1Dh)',
  30: '30 (1Eh)',
  31: '31 (1Fh)',
  32: '32 (20h)',
  33: '33 (21h)',
  34: '34 (22h)',
  35: '35 (23h)',
  36: '36 (24h)',
  37: '37 (25h)',
  38: '38 (26h)',
  39: '39 (27h)',
  40: '40 (28h)',
  41: '41 (29h)',
  42: '42 (2Ah)',
  43: '43 (2Bh)',
  44: '44 (2Ch)',
  45: '45 (2Dh)',
  46: '46 (2Eh)',
  47: '47 (2Fh)',
  48: '48 (30h)',
  49: '49 (31h)',
  50: '50 (32h)',
  51: '51 (33h)',
  52: '52 (34h)',
  53: '53 (35h)',
  54: '54 (36h)',
  55: '55 (37h)',
  56: '56 (38h)',
  57: '57 (39h)',
  58: '58 (3Ah)',
  59: '59 (3Bh)',
  60: '60 (3Ch)',
  61: '61 (3Dh)',
  62: '62 (3Eh)',
  63: '63 (3Fh)',
  64: '64 (40h)',
  65: '65 (41h)',
  66: '66 (42h)',
  67: '67 (43h)',
  68: '68 (44h)',
  69: '69 (45h)',
  70: '70 (46h)',
  71: '71 (47h)',
  72: '72 (48h)',
  73: '73 (49h)',
  74: '74 (4Ah)',
  75: '75 (4Bh)',
  76: '76 (4Ch)',
  77: '77 (4Dh)',
  78: '78 (4Eh)',
  79: '79 (4Fh)',
  80: '80 (50h)',
  81: '81 (51h)',
  82: '82 (52h)',
  83: '83 (53h)',
  84: '84 (54h)',
  85: '85 (55h)',
  86: '86 (56h)',
  87: '87 (57h)',
  88: '88 (58h)',
  89: '89 (59h)',
  90: '90 (5Ah)',
  91: '91 (5Bh)',
  92: '92 (5Ch)',
  93: '93 (5Dh)',
  94: '94 (5Eh)',
  95: '95 (5Fh)',
  96: '96 (60h)',
  97: '97 (61h)',
  98: '98 (62h)',
  99: '99 (63h)',
  100: '100 (64h)',
  101: '101 (65h)',
  102: '102 (66h)',
  103: '103 (67h)',
  104: '104 (68h)',
  105: '105 (69h)',
  106: '106 (6Ah)',
  107: '107 (6Bh)',
  108: '108 (6Ch)',
  109: '109 (6Dh)',
  110: '110 (6Eh)',
  111: '111 (6Fh)',
  112: '112 (70h)',
  113: '113 (71h)',
  114: '114 (72h)',
  115: '115 (73h)',
  116: '116 (74h)',
  117: '117 (75h)',
  118: '118 (76h)',
  119: '119 (77h)',
  120: '120 (78h): All Sound Off',
  121: '121 (79h): Reset All Controllers',
  122: '122 (7Ah): Local Control On/Off',
  123: '123 (7Bh): All Notes Off',
  124: '124 (7Ch): Omni Mode Off',
  125: '125 (7Dh): Omni Mode On',
  126: '126 (7Eh): Mono Mode On',
  127: '127 (7Fh): Poly Mode On',
});

export type MidiController = keyof typeof MIDI_CONTROLLER_OPTIONS;

export const getMidiChannel = <T = never>(
  channel: number,
  fallback?: T,
): MidiChannel | T => {
  if (isNaN(channel) || !(channel in MIDI_CHANNEL_OPTIONS)) {
    if (fallback === undefined) {
      throw new Error('Invalid MIDI channel number');
    }
    return fallback;
  }
  return channel as MidiChannel;
};

export const getMidiNote = <T = never>(
  note: number,
  fallback?: T,
): MidiNote | T => {
  if (isNaN(note) || !(note in MIDI_NOTE_OPTIONS)) {
    if (fallback === undefined) {
      throw new Error('Invalid MIDI note number');
    }
    return fallback;
  }
  return note as MidiNote;
};

export const getMidiController = <T = never>(
  controller: number,
  fallback?: T,
): MidiController | T => {
  if (isNaN(controller) || !(controller in MIDI_CONTROLLER_OPTIONS)) {
    if (fallback === undefined) {
      throw new Error('Invalid MIDI controller number');
    }
    return fallback;
  }
  return controller as MidiController;
};

type MidiChannelAddressable = {
  /**
   * 0-indexed. Value between `0` and `15`.
   * e.g. Channel 1 = `0`, Channel 16 = `15`
   */
  channel: MidiChannel;
};

export type MidiNoteIdentity = MidiChannelAddressable & {
  type: 'note';
  /**
   * Value between `0` and `127`
   */
  note: MidiNote;
};

export type MidiPolyphonicAftertouchIdentity = MidiChannelAddressable & {
  type: 'polyphonic-aftertouch';
  /**
   * Value between `0` and `127`
   */
  note: MidiNote;
};

export type MidiControlChangeIdentity = MidiChannelAddressable & {
  type: 'control-change';
  /**
   * Value between `0` and `119`
   */
  controller: MidiController;
};

export type MidiProgramChangeIdentity = MidiChannelAddressable & {
  type: 'program-change';
  /**
   * Value between `0` and `127`
   */
  program: number;
};

export type MidiChannelAftertouchIdentity = MidiChannelAddressable & {
  type: 'channel-aftertouch';
};

export type MidiPitchWheelIdentity = MidiChannelAddressable & {
  type: 'pitch-wheel';
};

/**
 * A bindable identity is a unique way of identifying a group of MIDI messages
 * that should be considered different values for the same control,
 * and should be bindable to some kind of behavior .
 *
 * When a user uses a "learn" feature to try and bind a control,
 * this is the type that should be used to identify the control.
 *
 * We don't use {@link MidiControllerItem.id} for this for 2 reasons:
 * 1. A single control can generate multiple types of MIDI messages.
 * 2. We want bindings to generally survive when the selected profile changes,
 *    or the profile itself changes internally.
 */
export type MidiBindableIdentity =
  | MidiNoteIdentity
  | MidiPolyphonicAftertouchIdentity
  | MidiControlChangeIdentity
  | MidiProgramChangeIdentity
  | MidiChannelAftertouchIdentity
  | MidiPitchWheelIdentity;

type MidiChannelMessageBase = {
  /** Value between `0` and `15` */
  channel: number;
};

export type MidiParsedMessage = {
  message: number[];
} & (
  | (MidiChannelMessageBase &
      (
        | (MidiNoteIdentity & {
            action: 'on' | 'off';
            /** Value between `0` and `127` */
            velocity: number;
          })
        | (MidiPolyphonicAftertouchIdentity & {
            type: 'polyphonic-aftertouch';
            /** Value between `0` and `127` */
            note: number;
            /** Value between `0` and `127` */
            pressure: number;
          })
        | (MidiControlChangeIdentity & {
            /** Value between `0` and `127` */
            value: number;
          })
        | MidiProgramChangeIdentity
        | (MidiChannelAftertouchIdentity & {
            /** Value between `0` and `127` */
            pressure: number;
          })
        | (MidiPitchWheelIdentity & {
            /** Value between `0` and `16383` */
            value: number;
          })
      ))
  | {
      type: 'mtc' | 'sysex' | 'other';
    }
);

export type MidiInputConnectionInfo = {
  inputDeviceName: string;
};

export type MidiOutputConnectionInfo = {
  outputDeviceName: string;
};
/**
 * Optional positional information about a {@link MidiControllerItem}:
 *
 * - {@link MidiCoordinateInfo.col col}
 * - {@link MidiCoordinateInfo.row row}
 * - {@link MidiCoordinateInfo.orientation orientation}
 */
export type MidiCoordinateInfo = {
  /**
   * If defined, represents the physical column that this control fits within,
   * or range of columns that this control spans (inclusive).
   *
   * For example, the value `[2, 4]` would indicate that the control is present
   * on columns 2, 3 and 4.
   *
   * These are typically 0-indexed, and go from left to right.
   */
  col?: number | [number, number];
  /**
   * If defined, represents the physical row that this control fits within,
   * or range of rows that this control spans (inclusive).
   *
   * For example, the value `[2, 4]` would indicate that the control is present
   * on rows 2, 3 and 4.
   *
   * These are typically 0-indexed, and go from bottom to top.
   */
  row?: number | [number, number];
  /**
   * In cases where the control has a specific orientation,
   * this indicates whether it is vertical or horizontal.
   *
   * (for example faders)
   */
  orientation?: 'vertical' | 'horizontal';
};

/**
 * Type that represents an individual item on a MIDI control surface.
 *
 * Each item may be associated with:
 *
 * - A single type of MIDI message (e.g. a button may be associated with note
 *   on/off messages with a specific note ID)
 * - Multiple types of message (e.g. an encoder may send relative position
 *   changes, along with note on/off messages when pressed).
 *
 * Each item also has a {@link MidiCoordinateInfo position} on the controller
 * (potentially spanning multiple rows and columns),
 * and may have a way to receive feedback (e.g. LED or Motor control).
 */
export type MidiControllerItem = {
  /**
   * Unique identifier for the controller item,
   * guaranteed to be unique for the current profile & device.
   *
   * DO NOT use this for storing user bindings,
   * as it may change between profiles or internal updates.
   * Instead {@link MidiBindableIdentity} should be used for storing user bindings.
   *
   * See {@link MidiBindableIdentity} for more information.
   *
   * If you need to determine the possible ways in which an item can be bound,
   * you can use the message specific array properties of the
   * {@link MidiControllerItem} to inspect.
   */
  id: string;

  /**
   * Key of the associated {@link MidiProfileDefinition.feedbackCapabilitites}
   * that represents what feedback options are possible for this item.
   *
   * TODO: make required
   */
  feedback?: string | null;

  /**
   * Human-readable label for the controller item.
   */
  label?: string;

  /**
   * The physical position of the controller item on the MIDI control surface.
   */
  position?: MidiCoordinateInfo;

  note?: Array<{
    id: MidiNoteIdentity;
    /**
     * Optional
     *
     * If an item always returns a specific button nature, it can be defined here.
     */
    nature?: MidiButtonNature;
  }>;

  polyphonicAftertouch?: Array<{
    id: MidiPolyphonicAftertouchIdentity;
  }>;

  controlChange?: Array<{
    id: MidiControlChangeIdentity;
    /**
     * Optional
     *
     * If an item always returns a specific numeric nature, it can be defined here.
     */
    nature?: MidiNumericNature | MidiButtonNature;
  }>;

  programChange?: Array<{
    id: MidiProgramChangeIdentity;
  }>;

  channelAftertouch?: Array<{
    id: MidiChannelAftertouchIdentity;
  }>;

  pitchWheel?: Array<{
    id: MidiPitchWheelIdentity;
    /**
     * Optional
     *
     * If an item always returns a specific numeric nature, it can be defined here.
     */
    nature?: MidiNumericNature;
  }>;
};

export type MidiHotkeyMode =
  | 'hot-cue'
  | 'roll'
  | 'slicer'
  | 'sampler'
  | 'tones'
  | 'fx'
  | 'slicer-loop'
  | 'beat-jump';

export type MidiButtonNature =
  | {
      nature: 'grid';
      bank?: number;
    }
  | {
      nature: 'navigation';
      navigation: 'up' | 'down' | 'left' | 'right' | 'enter' | 'menu';
      bank?: number;
    }
  | {
      nature: 'bank-change';
      bank: number;
    }
  | {
      nature: 'modifier';
      modifier: 'shift' | 'control' | 'alt';
    }
  | {
      nature: 'mode-change';
      mode: 'session' | 'drum' | 'note' | 'user' | 'device' | 'mixer';
    }
  | {
      nature: 'edit';
      action:
        | 'double'
        | 'duplicate'
        | 'delete'
        | 'undo'
        | 'redo'
        | 'quantize'
        | 'click';
      bank?: number;
    }
  | {
      nature: 'channel';
      action:
        | 'clip'
        | 'record'
        | 'mute'
        | 'solo'
        | 'select'
        | 'volume'
        | 'pan'
        | 'send'
        | 'stop';
      channel?: number;
      bank?: number;
    }
  | {
      nature: 'deck';
      channel: number;
      action:
        | 'load'
        | 'vinyl'
        | 'slip'
        | 'quantize'
        | 'pre-fader-listen'
        | 'loop-in'
        | 'loop-in-long-press'
        | 'loop-out'
        | 'fx'
        | 'shift'
        | 'cue'
        | 'sync'
        | 'play-pause'
        | 'platter-touch'
        | `hotkey-mode-${MidiHotkeyMode}`;
    }
  | {
      nature: 'deck-hotkey';
      channel: number;
      index: number;
      mode?: MidiHotkeyMode;
    }
  | {
      nature: 'unknown';
      bank?: number;
    };

export type MidiNumericNature =
  | {
      nature: 'fader';
      role: 'master' | 'misc' | 'headphones' | 'cross-fader';
      bank?: number;
    }
  | {
      nature: 'encoder';
      role: 'misc' | 'grid';
      bank?: number;
    }
  | {
      nature: 'xy-pad';
      role: 'x' | 'y' | 'press';
    }
  | {
      nature: 'navigation';
      role: 'up-down' | 'left-right';
    }
  | {
      nature: 'deck';
      channel: number;
      role: 'tempo' | 'platter-scratch' | 'platter-adjust';
    }
  | ({
      nature: 'mixer';
      channel: number;
    } & (
      | {
          role: 'gain' | 'upfader' | 'high-low-pass' | 'fx' | 'dry-wet';
        }
      | {
          role: 'eq';
          eq: 'low' | 'low-mid' | 'mid' | 'high-mid' | 'high';
        }
    ))
  | {
      nature: 'unknown';
    };

/**
 * SysEx information provided by the device.
 */
export type MidiDeviceReadiness =
  | {
      /**
       * The device is not in the correct mode,
       * but can automatically be switched to the correct mode.
       */
      state: 'pending-mode-switch';
      message: string;
    }
  | {
      /**
       * The device is not usable for some reason,
       * for example it may require manual reconfiguration.
       */
      state: 'unusable';
      message: string;
    }
  | {
      /**
       * The device is ready for use.
       */
      state: 'ready';
    };

/**
 * Type that represents an action taken by a user interacting with a specific
 * MIDI item.
 *
 * The intention for this is to be a level higher than the raw MIDI message,
 * encapsulating the intention behind the interaction,
 * with hints for applications on how they should likely respond.
 */
export type MidiControllerAction = {
  /**
   * The ID of the controller item that this action is associated with.
   */
  item: string;
} & (
  | {
      /**
       * When the full intention behind a MIDI message cannot be determined
       * and further messages are required, this action will be returned.
       *
       * (For example when the MSB & LSB of a number is spread across multiple
       * messages)
       */
      action: 'pending';
    }
  | {
      /**
       * When a MIDI message is received that duplicates data received by other messages,
       * and should be ignored.
       */
      action: 'duplicate';
    }
  | {
      action: 'button-press' | 'button-release';
      /**
       * What is the button supposed to do (its nature)
       */
      nature: MidiButtonNature;
      /**
       * Optional for buttons, representing the velocity of the press.
       *
       * This is usually undefined, as most controllers don't have sensors for this.
       */
      velocity?: number;
    }
  | {
      /**
       * Represents an absolute value being set for a control
       * (e.g., a fader or limited encoder).
       */
      action: 'absolute-value';
      /**
       * What is this control supposed to do (its nature)
       */
      nature: MidiNumericNature;
      /**
       * Value between 0 and 1, where 0 represents the minimum value and 1
       * represents the maximum value.
       *
       * This is normalized to handle values that come from both Control-Change
       * messages (e.g. Akai), and Pitch-Wheel messages
       * (e.g. Mackie controllers / MCU).
       */
      value: number;
      /**
       * The number of bits used to represent this value on MIDI
       */
      precisionBits: number;
    }
  | {
      /**
       * Represents an adjustment to the current value of something.
       */
      action: 'relative-value';
      /**
       * What is this control supposed to do (its nature)
       */
      nature: MidiNumericNature;
      /**
       * The amount by which the current value should be adjusted,
       * in whole number "increments" or "steps".
       *
       * It is up to the consumer to interpret what this means,
       * `degreesPerIncrement` may offer a hint as to how much a single increment
       * represents if the control is a rotational control.
       */
      change: number;
      /**
       * The number of degrees that correspond to a single increment of the control,
       * for rotational controls such as encoders or platters.
       */
      degreesPerIncrement?: number;
      /**
       * The number of bits used to represent this value on MIDI
       */
      precisionBits: number;
    }
);

export type MidiActionEvent = {
  message: MidiParsedMessage;
  action: MidiControllerAction;
};

/**
 * Not relevant for all devices,
 * but some devices may have different modes / states,
 * and need to report when they are in an incorrect mode.
 */
export type MidiDeviceReadinessEvent = {
  /**
   * If triggered by a message, the original message is included here.
   */
  message?: MidiParsedMessage;
  readiness: MidiDeviceReadiness;
};

export type MidiProfileEvents = {
  action: MidiActionEvent;
  readiness: MidiDeviceReadinessEvent;
};

export type MidiProfileListener<K extends keyof MidiProfileEvents> = (
  payload: MidiProfileEvents[K],
) => void;

export type MidiProfileFeedbackCapabilities = Record<
  string,
  FeedbackCapabilityProfile
>;

export type MidiProfile = {
  /**
   * Get all known items for a particular midi controller.
   *
   * @see {@link MidiControllerItem}
   */
  getItems: () => Iterable<MidiControllerItem>;
  /**
   * A map of capability profile IDs to the set of capabilities they define.
   *
   * These definitions help apps to dynamically understand the capabilities of
   * the device, and automatically create sensible default profiles / behaviors.
   *
   * We recommend defining one per item type for a given controller,
   * e.g. if you have a number of RGB grid buttons,
   * and a number of single-LED buttons,
   * you would define 2 profiles.
   *
   * These keys only need to be unique within the context of this profile,
   * and do not need to be globally unique.
   *
   * An empty object should be returned when a device does not have any feedback
   * capabilities.
   */
  getFeedbackCapabilities: () => MidiProfileFeedbackCapabilities;
  /**
   * Get the item of a specific ID
   */
  getItem: (id: string) => MidiControllerItem | null;
  /**
   * Handle receipt of a MIDI message.
   *
   * When `false` is returned, it is recommended that a consumer falls back to
   * using the raw MIDI message information to determine user intent,
   * if a profile is later updated to understand the corresponding message,
   * things should continue to work as long as a {@link MidiBindableIdentity}
   * was used to save the binding.
   *
   * @returns true if the message was understood and handled, false otherwise.
   */
  receiveMessage: (message: MidiParsedMessage) => boolean;
  addEventListener: <K extends keyof MidiProfileEvents>(
    event: K,
    listener: (payload: MidiProfileEvents[K]) => void,
  ) => void;
  removeEventListener: <K extends keyof MidiProfileEvents>(
    event: K,
    listener: (payload: MidiProfileEvents[K]) => void,
  ) => void;
};

export type MidiProfileInitArgs = {
  connection: MidiInputConnectionInfo;
};

export type MidiProfileInit = (args: MidiProfileInitArgs) => MidiProfile;

export type MidiColorFeedback = {
  /**
   * What mode is the current control on
   */
  mode: 'empty' | 'ready' | 'active';
  /**
   * When relevant (for example when the control is connected to something that
   * has an associated color) - an optional color can be provided.
   *
   * This may not always be usable,
   * for example for buttons that only have on / off LEDs.
   *
   * When a controller supports color feedback and this field is not set,
   * then the profile should default to a suitable color based on the mode.
   */
  color?: [number, number, number];
};

/**
 * An interface that can be used to batch prepare MIDI messages to send to a
 * MIDI device to represent feedback of the current application's state.
 */
export type MidiFeedbackProfile = {
  /**
   * When defined,
   * this function can be called to configure the device to be in an appropriate
   * mode for the selected profile.
   *
   * It is expected that this can be called if the {@link MidiProfile}
   * fired a .
   */
  performModeSwitch?: () => void;
  /**
   * Called when the feedback profile no longer needs to be used with the given
   * device, for example:
   * - The user removes the specified device from the config
   * - The user selects a different profile
   * - The application is shutting down
   *
   * This can be used for example to reset a device to its default state,
   * if it had been modified by the feedback profile,
   * and to remove any references / listeners that may have been created by
   * the feedback profile.
   */
  close?: () => Promise<void>;
  /**
   * Reset feedback of all items to their default state.
   *
   * This may require {@link MidiFeedbackProfile.frameFinished} to be called
   * before messages are sent, which allows for implementations to optimize
   * message batching.
   */
  clear: () => void;
  /**
   * Begin a new frame if one is not already in progress,
   * and set the note value for the specified channel and note.
   */
  setItemColor: (id: string, feedback: MidiColorFeedback) => void;

  /**
   * @param id The identifier of the item whose position is being set.
   * @param value The new position value for the item, value between 0 and 1.
   */
  setItemValue: (id: string, value: number) => void;

  /**
   * Indicate that the current frame has finished and any accumulated feedback
   * should be processed and sent to the MIDI device.
   */
  frameFinished: () => void;
};

export type MidiFeedbackProfileInitArgs = {
  connection: MidiInputConnectionInfo;
  inputProfile: MidiProfile;
  sendMessage: (message: number[]) => void;
};

export type MidiFeedbackProfileInit = (
  args: MidiFeedbackProfileInitArgs,
) => MidiFeedbackProfile;

export type MidiProfileSubprofileDefaultKey = 'default';

export type MidiProfileTester = {
  /** GitHub username of the tester */
  ghUsername?: string;
  /**
   * The operating system that the tester verified this profile & hardware with.
   */
  os: Array<'macos' | 'windows' | 'linux'>;
  /**
   * A date string in the format `YYYY-MM-DD` representing when the tester
   * verified the profile.
   */
  date: string;
};

/**
 * A capability profile describes what feedback capabilities a particular
 * {@link MidiControllerItem} has, for example RGB feedback or
 */
export type FeedbackCapabilityProfile = {
  motorizedFader?: true;
  encoderLEDs?: {
    /**
     * How can the encoder LEDs be lit up?
     *
     * - `spot`: Lights up one LED at a time
     * - `fill`: Lights up all LEDs between the start and current position
     * - `mirror`: Lights up LEDs outwards from the center position,
     *   filling either left or right depending on whether the value is
     *   above or below the center position.
     */
    modes: Array<'spot' | 'fill' | 'mirror'>;
  };
  led?: {
    /**
     * Are the colors available to use limited by a hard-coded palette,
     * or is setting RGB values possible?
     */
    type: 'palette' | 'single' | 'rgb';
  } & (
    | {
        type: 'palette';
        /**
         * How many brightness values can be set in conjunction with each color
         * in the palette.
         *
         * In general, this will mean that there are more possible color
         * variations than simply the base colors themselves.
         */
        brightnessValues: number;
        /**
         * Returns the list of colors available in the palette.
         */
        palette: Array<RGB>;
      }
    | {
        type: 'rgb';
        limits: {
          /**
           * How many bits are used to represent the red component of the color.
           */
          rBits: number;
          /**
           * How many bits are used to represent the green component of the color.
           */
          gBits: number;
          /**
           * How many bits are used to represent the blue component of the color.
           */
          bBits: number;
        };
      }
    | {
        type: 'single';
        /**
         * Approximate color of the single-color LED
         */
        color: RGB;
        /**
         * How many brightness values can be set for this LED.
         */
        brightnessValues: number;
        modes: Array<'solid' | 'blink' | 'pulse'>;
      }
  );
};

export type ProfilePair = {
  name?: string;
  notice?: string;
  input: MidiProfileInit;
  feedback: MidiFeedbackProfileInit | null;
  /**
   * Return true if the subprofile profile should be automatically selected for
   * the given connection.
   *
   * Note that {@link MidiProfileDefinition.autoSelect} should also return true
   * for the given connection as well, otherwise the sub-profile will only be
   * auto-selected if a user explicitly selects the main profile
   */
  autoSelect?: (connection: MidiInputConnectionInfo) => boolean;
};

export type MidiProfileDefinition = {
  name: string;
  /**
   * Record of information of how thoroughly this profile has been tested.
   *
   * Consumers of this API should use this information to determine whether they
   * want to allow for a particular profile to be used or not.
   */
  testing: {
    /**
     * Has this profile been tested thoroughly enough for usage?
     *
     * Consumers of this API can use this flag to decide whether to include this
     * profile in the available profiles of the app by default.
     *
     * Of course usage of this flag is optional,
     * and consumers can choose to select whichever profiles they want to use.
     */
    ready: boolean;
    /**
     * List of testers who are part of the project maintainers team that have
     * tested this profile.
     */
    maintainers?: MidiProfileTester[];
    /**
     * List of testers who are part of the manufacturer team of the device
     * that have tested this profile.
     */
    manufacturer?: MidiProfileTester[];
    /**
     * List of community testers that have tested this profile.
     */
    community?: MidiProfileTester[];
  };
  /**
   * Return true if the profile should be automatically selected for the given
   * connection.
   */
  autoSelect: (connection: MidiInputConnectionInfo) => boolean;
  /**
   * For cases where the names of input & output devices don't match exactly,
   * this function allows the profile to specify which output device should be
   * used for a given input device.
   */
  autoSelectOutput?: (
    input: MidiInputConnectionInfo,
    outputs: MidiOutputConnectionInfo[],
  ) => MidiOutputConnectionInfo | null;
  subProfiles: Record<string, ProfilePair> &
    Record<MidiProfileSubprofileDefaultKey, ProfilePair>;
};
