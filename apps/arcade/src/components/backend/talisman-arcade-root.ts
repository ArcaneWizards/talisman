import { IDMap } from '@arcanejs/toolkit/util';
import type { LabConfig } from '../proto';
import {
  Base,
  EventEmitter,
  Listenable,
} from '@arcanejs/toolkit/components/base';
import {
  Namespace,
  TalismanArcadeRootComponent,
  TalismanArcadeComponentCalls,
  isTalismanArcadeComponentMessage,
  DEFAULT_CONFIG,
} from '../proto';
import {
  AnyClientComponentCall,
  AnyClientComponentMessage,
} from '@arcanejs/protocol';
import { Diff } from '@arcanejs/diff';

export type Events = {
  updateConfig: (diff: Diff<LabConfig>) => void;
};

export type AppRootProps = Pick<
  TalismanArcadeRootComponent,
  'midi' | 'config' | 'state' | 'license'
> & {
  onUpdateConfig?: Events['updateConfig'];
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
    updates: null,
  },
  license: null,
};

type SupportedCalls = never;

export class TalismanArcadeRoot
  extends Base<
    Namespace,
    TalismanArcadeRootComponent,
    AppRootProps,
    TalismanArcadeComponentCalls,
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
    if (isTalismanArcadeComponentMessage(message, 'talisman-arcade-root')) {
      if (message.action === 'update-config') {
        this.events.emit('updateConfig', message.diff);
      }
    }
  };

  /** @hidden */
  public handleCall = async (call: AnyClientComponentCall) => {
    throw new Error(`Unhandled call action: ${call.action}`);
  };

  /** @hidden */
  public getProtoInfo(idMap: IDMap): TalismanArcadeRootComponent {
    return {
      namespace: 'talisman-arcade',
      component: 'talisman-arcade-root',
      key: idMap.getId(this),
      license: this.props.license,
      midi: this.props.midi,
      config: this.props.config,
      state: this.props.state,
    };
  }
}
