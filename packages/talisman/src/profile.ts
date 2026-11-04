import type {
  MidiParsedMessage,
  MidiProfile,
  MidiProfileEvents,
  MidiProfileListener,
  MidiDeviceReadinessEvent,
  MidiControllerItem,
  MidiControllerAction,
  FeedbackCapabilityProfile,
} from './core.js';

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
  abstract getFeedbackCapabilities: () => Record<
    string,
    FeedbackCapabilityProfile
  >;
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
      'getItems' | 'getItem' | 'getAction' | 'getFeedbackCapabilities'
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
  public getFeedbackCapabilities = (): Record<
    string,
    FeedbackCapabilityProfile
  > => {
    return this.profile.getFeedbackCapabilities();
  };
}
