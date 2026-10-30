import {
  AnyComponentProto,
  BaseClientComponentCall,
  BaseClientComponentMessage,
  BaseComponentProto,
} from '@arcanejs/protocol';
import { Diff } from '@arcanejs/diff';
import { MidiEndpoints, MIDISupportResponse } from '@arcanewizards/midi';
import { MidiMessageBufferSlice } from './frontend/shared/midi-message-monitor';
import { MidiMessageDescription } from '@arcanewizards/talisman/util';
import { MidiDeviceReadiness } from '@arcanewizards/talisman/profile';

// Data

export type ConnectionStatus =
  | {
      status: 'disabled' | 'connecting';
    }
  | {
      status: 'error';
      errors: string[];
    }
  | {
      status: 'connected';
      messagesReceived: number;
    };

// Proto

export const NAMESPACE = 'mana-workshop';

export type Namespace = typeof NAMESPACE;

export type MIDINetworkState = {
  /**
   * null: loading
   */
  support: MIDISupportResponse | null;
  endpoints: MidiEndpoints;
  profiles: Record<
    string,
    {
      name: string;
      subProfiles: Record<string, string>;
    }
  >;
};

export type UserConfig = {
  selectedInput: string | null;
  selectedOutput: string | null;
  selectedProfile: [string, string] | null;
  fps: number;
  pattern:
    | {
        type: 'rainbow';
      }
    | {
        type: 'solid';
        hue: number;
        saturation: number;
      };
  lightness:
    | {
        type: 'moving';
        direction: 'horizontal' | 'vertical';
      }
    | {
        type: 'solid';
        value: number;
      };
  interaction: {
    type: 'row-column' | 'cell';
  };
};

export const DEFAULT_USER_CONFIG: UserConfig = {
  selectedInput: null,
  selectedOutput: null,
  selectedProfile: null,
  fps: 60,
  pattern: {
    type: 'solid',
    hue: 200,
    saturation: 100,
  },
  lightness: {
    type: 'solid',
    value: 50,
  },
  interaction: {
    type: 'row-column',
  },
};

export type TalismanLabRootComponent = BaseComponentProto<
  Namespace,
  'mana-workshop-root'
> & {
  midi: MIDINetworkState;
  config: UserConfig;
  status: {
    input: ConnectionStatus;
    output: ConnectionStatus;
    midiDeviceReadiness: MidiDeviceReadiness | null;
  };
};

export type TalismanLabComponent = TalismanLabRootComponent;

export const isTalismanLabComponent = (
  component: AnyComponentProto,
): component is TalismanLabComponent => component.namespace === NAMESPACE;

export type TalismanLabUpdateConfig = BaseClientComponentMessage<Namespace> & {
  component: 'mana-workshop-root';
  action: 'update-config';
  diff: Diff<UserConfig>;
};

export type TalismanLabSwitchMode = BaseClientComponentMessage<Namespace> & {
  component: 'mana-workshop-root';
  action: 'switch-mode';
};

export type TalismanLabComponentMessage =
  TalismanLabUpdateConfig | TalismanLabSwitchMode;

export const isTalismanLabComponentMessage = <
  C extends TalismanLabComponentMessage['component'],
>(
  message: BaseClientComponentMessage<string>,
  component: C,
): message is TalismanLabComponentMessage & { component: C } =>
  message.namespace === NAMESPACE &&
  (message as TalismanLabComponentMessage).component === component;

export type TalismanLabGetMidiMessages = BaseClientComponentCall<
  Namespace,
  'mana-workshop-get-midi-messages'
> & {
  device: 'input' | 'output';
  fromIndex: number;
};

export type TalismanLabGetMidiMessagesReturn =
  MidiMessageBufferSlice<MidiMessageDescription | null>;

export type TalismanLabComponentCalls = {
  'mana-workshop-get-midi-messages': {
    call: TalismanLabGetMidiMessages;
    return: TalismanLabGetMidiMessagesReturn;
  };
};

export const isTalismanLabComponentCall = <
  A extends keyof TalismanLabComponentCalls,
>(
  call: BaseClientComponentCall<string, string>,
  action: A,
): call is TalismanLabComponentCalls[A]['call'] =>
  call.namespace === NAMESPACE && call.action === action;
