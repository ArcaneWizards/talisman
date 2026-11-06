import { IDMap } from '@arcanejs/toolkit/util';
import type {
  GetFullProfileInfo,
  GetFullProfileInfoReturn,
  LabConfig,
  TalismanLabGetMidiMessages,
  TalismanLabGetMidiMessagesReturn,
  TalismanLabGetSupportedDevices,
  TalismanLabGetSupportedDevicesReturn,
} from '../proto';
import {
  Base,
  EventEmitter,
  Listenable,
} from '@arcanejs/toolkit/components/base';
import {
  Namespace,
  TalismanLabRootComponent,
  TalismanLabComponentCalls,
  isTalismanLabComponentMessage,
  isTalismanLabComponentCall,
  DEFAULT_CONFIG,
} from '../proto';
import {
  AnyClientComponentCall,
  AnyClientComponentMessage,
} from '@arcanejs/protocol';
import { Diff } from '@arcanejs/diff';

export type Events = {
  updateConfig: (diff: Diff<LabConfig>) => void;
  switchMode: () => void;
  getMidiMessages: (
    args: TalismanLabGetMidiMessages,
  ) => Promise<TalismanLabGetMidiMessagesReturn>;
  getSupportedDevices: (
    args: TalismanLabGetSupportedDevices,
  ) => Promise<TalismanLabGetSupportedDevicesReturn>;
  getFullProfileInfo: (
    args: GetFullProfileInfo,
  ) => Promise<GetFullProfileInfoReturn>;
};

export type AppRootProps = Pick<
  TalismanLabRootComponent,
  'midi' | 'config' | 'state' | 'license'
> & {
  onUpdateConfig?: Events['updateConfig'];
  onSwitchMode?: Events['switchMode'];
  onGetMidiMessages?: Events['getMidiMessages'];
  onGetSupportedDevices?: Events['getSupportedDevices'];
  onGetFullProfileInfo?: Events['getFullProfileInfo'];
};

const DEFAULT_PROPS: AppRootProps = {
  midi: {
    support: null,
    endpoints: {
      inputs: [],
      outputs: [],
    },
    profiles: {},
  },
  config: DEFAULT_CONFIG,
  state: {
    input: {
      status: 'disabled',
    },
    output: {
      status: 'disabled',
    },
    midiDeviceReadiness: null,
    updates: null,
  },
  license: null,
};

type SupportedCalls =
  | 'talisman-lab-get-midi-messages'
  | 'talisman-lab-get-supported-devices'
  | 'talisman-lab-get-full-profile-info';

export class TalismanLabRoot
  extends Base<
    Namespace,
    TalismanLabRootComponent,
    AppRootProps,
    TalismanLabComponentCalls,
    SupportedCalls
  >
  implements Listenable<Events>
{
  /** @hidden */
  private readonly events = new EventEmitter<Events>();

  public constructor(props: AppRootProps) {
    super(DEFAULT_PROPS, props, {
      onPropsUpdated: (oldProps) =>
        this.events.processPropChanges(
          {
            onUpdateConfig: 'updateConfig',
            onSwitchMode: 'switchMode',
            onGetMidiMessages: 'getMidiMessages',
            onGetSupportedDevices: 'getSupportedDevices',
            onGetFullProfileInfo: 'getFullProfileInfo',
          },
          oldProps,
          this.props,
        ),
    });
    this.triggerInitialPropsUpdate();
  }

  addListener = this.events.addListener;
  removeListener = this.events.removeListener;

  /** @hidden */
  public handleMessage = (message: AnyClientComponentMessage) => {
    if (isTalismanLabComponentMessage(message, 'talisman-lab-root')) {
      if (message.action === 'update-config') {
        this.events.emit('updateConfig', message.diff);
      } else if (message.action === 'switch-mode') {
        this.events.emit('switchMode');
      }
    }
  };

  /** @hidden */
  public handleCall = async (call: AnyClientComponentCall) => {
    if (isTalismanLabComponentCall(call, 'talisman-lab-get-midi-messages')) {
      return this.events.call('getMidiMessages', call);
    }
    if (
      isTalismanLabComponentCall(call, 'talisman-lab-get-supported-devices')
    ) {
      return this.events.call('getSupportedDevices', call);
    }
    if (
      isTalismanLabComponentCall(call, 'talisman-lab-get-full-profile-info')
    ) {
      return this.events.call('getFullProfileInfo', call);
    }
    throw new Error(`Unhandled call action: ${call.action}`);
  };

  /** @hidden */
  public getProtoInfo(idMap: IDMap): TalismanLabRootComponent {
    return {
      namespace: 'talisman-lab',
      component: 'talisman-lab-root',
      key: idMap.getId(this),
      license: this.props.license,
      midi: this.props.midi,
      config: this.props.config,
      state: this.props.state,
    };
  }
}
