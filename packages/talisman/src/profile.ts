import type {
  MidiNoteIdentity,
  MidiControlChangeIdentity,
  MidiParsedMessage,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  MidiBindableIdentity,
  MidiPolyphonicAftertouchIdentity,
  MidiProgramChangeIdentity,
  MidiChannelAftertouchIdentity,
  MidiPitchWheelIdentity,
  MidiInputConnectionInfo,
} from './index.js';

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

export type MidiProfile = {
  /**
   * Get all known items for a particular midi controller.
   *
   * @see {@link MidiControllerItem}
   */
  getItems: () => Iterable<MidiControllerItem>;
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

/**
 * A basic implementation of {@link MidiProfile} for devices that don't have any
 * special modes or initialization requirements.
 */
export abstract class MidiProfileBase implements MidiProfile {
  readonly listeners: {
    readonly [K in keyof MidiProfileEvents]: Set<MidiProfileListener<K>>;
  } = Object.freeze({
    action: new Set<MidiProfileListener<'action'>>(),
    readiness: new Set<MidiProfileListener<'readiness'>>(),
  });

  private _readiness: MidiDeviceReadinessEvent | null = null;

  public addEventListener = <K extends keyof MidiProfileEvents>(
    event: K,
    listener: MidiProfileListener<K>,
  ): void => {
    this.listeners[event].add(listener);
    if (event === 'readiness' && this._readiness) {
      (listener as MidiProfileListener<'readiness'>)(this._readiness);
    }
  };

  public removeEventListener = <K extends keyof MidiProfileEvents>(
    event: K,
    listener: MidiProfileListener<K>,
  ): void => {
    this.listeners[event].delete(listener);
  };

  public emit = <K extends keyof MidiProfileEvents>(
    event: K,
    payload: MidiProfileEvents[K],
  ): void => {
    for (const listener of this.listeners[event]) {
      listener(payload);
    }
  };

  public setReadiness = (readiness: MidiDeviceReadinessEvent): void => {
    this._readiness = readiness;
    this.emit('readiness', readiness);
  };

  abstract getItems: () => Iterable<MidiControllerItem>;
  abstract getItem: (id: string) => MidiControllerItem | null;
  abstract receiveMessage: (message: MidiParsedMessage) => boolean;
}

/**
 * A basic implementation of {@link MidiProfile} for devices that don't have any
 * special modes or initialization requirements.
 */
export abstract class MidiProfileBasicBase extends MidiProfileBase {
  public receiveMessage = (message: MidiParsedMessage): boolean => {
    const action = this.getAction(message);
    if (action) {
      this.emit('action', { message, action });
      return true;
    }
    return false;
  };

  abstract getItems: () => Iterable<MidiControllerItem>;
  abstract getItem: (id: string) => MidiControllerItem | null;
  abstract getAction: (
    message: MidiParsedMessage,
  ) => MidiControllerAction | null;
}

export class MidiProfileBasic extends MidiProfileBasicBase {
  public constructor(
    private readonly profile: Pick<
      MidiProfileBasicBase,
      'getItems' | 'getItem' | 'getAction'
    >,
  ) {
    super();
  }

  public getItems = (): Iterable<MidiControllerItem> => {
    return this.profile.getItems();
  };

  public getItem = (id: string): MidiControllerItem | null => {
    return this.profile.getItem(id);
  };

  public getAction = (
    message: MidiParsedMessage,
  ): MidiControllerAction | null => {
    return this.profile.getAction(message);
  };
}
