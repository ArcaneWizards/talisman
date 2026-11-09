import { IDMap } from '@arcanejs/toolkit/util';
import type { ArcadeConfig } from '../proto';
import {
  AnyComponent,
  BaseParent,
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
import { ToolkitRenderContext } from '@arcanejs/toolkit';
import type { Game } from '../../arcade/games/context';

export type Events = {
  updateConfig: (diff: Diff<ArcadeConfig>) => void;
  changeGame: (game: Game) => void;
};

export type AppRootProps = Pick<
  TalismanArcadeRootComponent,
  'midi' | 'config' | 'state' | 'license' | 'colors'
> & {
  onUpdateConfig?: Events['updateConfig'];
  onChangeGame?: Events['changeGame'];
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
    devices: {},
  },
  license: null,
  colors: {
    primary: [0, 0, 0],
    secondary: [0, 0, 0],
    ready: [0, 0, 0],
    error: [0, 0, 0],
  },
};

type SupportedCalls = never;

export class TalismanArcadeRoot
  extends BaseParent<
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
            onChangeGame: 'changeGame',
          },
          oldProps,
          this.props,
        ),
    });
    this.triggerInitialPropsUpdate();
  }

  addListener = this.events.addListener;
  removeListener = this.events.removeListener;

  public validateChildren = (children: AnyComponent[]) => {
    if (children.length > 1) {
      throw new Error('AppContext can only have one child');
    }
  };

  /** @hidden */
  public handleMessage = (message: AnyClientComponentMessage) => {
    if (isTalismanArcadeComponentMessage(message, 'talisman-arcade-root')) {
      if (message.action === 'update-config') {
        this.events.emit('updateConfig', message.diff);
      } else if (message.action === 'change-game') {
        this.events.emit('changeGame', message.game);
      }
    }
  };

  /** @hidden */
  public handleCall = async (call: AnyClientComponentCall) => {
    throw new Error(`Unhandled call action: ${call.action}`);
  };

  /** @hidden */
  public getProtoInfo(
    idMap: IDMap,
    context: ToolkitRenderContext,
  ): TalismanArcadeRootComponent {
    return {
      namespace: 'talisman-arcade',
      component: 'talisman-arcade-root',
      key: idMap.getId(this),
      license: this.props.license,
      midi: this.props.midi,
      config: this.props.config,
      state: this.props.state,
      colors: this.props.colors,
      child:
        this.getChildren()
          .slice(0, 1)
          .map((c) => c.getProtoInfo(idMap, context))[0] ?? null,
    };
  }
}
