import { IDMap } from '@arcanejs/toolkit/util';
import type {
  TalismanLabGetMidiMessages,
  TalismanLabGetMidiMessagesReturn,
  UserConfig,
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
  DEFAULT_USER_CONFIG,
} from '../proto';
import {
  AnyClientComponentCall,
  AnyClientComponentMessage,
} from '@arcanejs/protocol';
import { Diff } from '@arcanejs/diff';

export type Events = {
  updateConfig: (diff: Diff<UserConfig>) => void;
  switchMode: () => void;
  getMidiMessages: (
    args: TalismanLabGetMidiMessages,
  ) => Promise<TalismanLabGetMidiMessagesReturn>;
};

export type AppRootProps = Pick<
  TalismanLabRootComponent,
  'midi' | 'config' | 'status'
> & {
  onUpdateConfig?: Events['updateConfig'];
  onSwitchMode?: Events['switchMode'];
  onGetMidiMessages?: Events['getMidiMessages'];
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
  config: DEFAULT_USER_CONFIG,
  status: {
    input: {
      status: 'disabled',
    },
    output: {
      status: 'disabled',
    },
    midiDeviceReadiness: null,
  },
};

type SupportedCalls = 'mana-workshop-get-midi-messages';

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
    if (isTalismanLabComponentMessage(message, 'mana-workshop-root')) {
      if (message.action === 'update-config') {
        this.events.emit('updateConfig', message.diff);
      } else if (message.action === 'switch-mode') {
        this.events.emit('switchMode');
      }
    }
  };

  /** @hidden */
  public handleCall = async (call: AnyClientComponentCall) => {
    if (isTalismanLabComponentCall(call, 'mana-workshop-get-midi-messages')) {
      return this.events.call('getMidiMessages', call);
    }
    throw new Error(`Unhandled call action: ${call.action}`);
  };

  /** @hidden */
  public getProtoInfo(idMap: IDMap): TalismanLabRootComponent {
    return {
      namespace: 'mana-workshop',
      component: 'mana-workshop-root',
      key: idMap.getId(this),
      midi: this.props.midi,
      config: this.props.config,
      status: this.props.status,
    };
  }
}
