import type {
  AnyComponentProto,
  BaseClientComponentCall,
  BaseClientComponentMessage,
  BaseComponentProto,
} from '@arcanejs/protocol';
import type { Diff } from '@arcanejs/diff';
import type { MidiEndpoints, MIDISupportResponse } from '@arcanewizards/midi';
import type { MidiMessageBufferSlice } from './frontend/shared/midi-message-monitor';
import type { MidiMessageDescription } from '@talisman-midi/talisman/util';
import type { UserActionState } from '@arcanewizards/sigil/frontend/user-actions';
import type { UpdateCheckResult } from '@arcanewizards/sigil/frontend/updates';
import type { MidiDeviceReadiness } from '@talisman-midi/talisman';
import type {
  TalismanFullProfileInfo,
  TalismanSupportedDeviceData,
} from './frontend/shared/device-profile-details';

import z from 'zod';
import { GET_EULA_RESPONSE, GetEulaResponse } from '@arcanewizards/apis';

export const LOGO_URL_PATH = 'logo-animated.svg';
export const LOGO_STATIC_URL_PATH = 'logo-static.svg';

// Config

export const USER_CONFIG = z.object({
  selectedInput: z.string().nullable(),
  selectedOutput: z.string().nullable(),
  selectedProfile: z.tuple([z.string(), z.string()]).nullable(),
  fps: z.number(),
  mode: z.object({
    mode: z.literal('test-pattern'),
    pattern: z.union([
      z.object({ type: z.literal('rainbow') }),
      z.object({
        type: z.literal('solid'),
        hue: z.number(),
        saturation: z.number(),
      }),
    ]),
    lightness: z.union([
      z.object({
        type: z.literal('moving'),
        direction: z.union([z.literal('horizontal'), z.literal('vertical')]),
      }),
      z.object({
        type: z.literal('solid'),
        value: z.number(),
      }),
    ]),
    interaction: z.object({
      type: z.union([z.literal('row-column'), z.literal('cell')]),
    }),
  }),
});

export type UserConfig = z.infer<typeof USER_CONFIG>;

export const DEFAULT_USER_CONFIG: UserConfig = {
  selectedInput: null,
  selectedOutput: null,
  selectedProfile: null,
  fps: 60,
  mode: {
    mode: 'test-pattern',
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
  },
};

const AGREED_TO_EULA = z.object({
  content: GET_EULA_RESPONSE,
  /**
   * The date the user agreed to the EULA, in milliseconds since the epoch.
   */
  dateAgreedOnMillis: z.number(),
  /**
   * We only generate an ID to include in update requests after the user
   * has agreed to the EULA.
   */
  updateId: z.string(),
});

export const LAB_CONFIG = z.object({
  config: USER_CONFIG,
  agreedToEula: AGREED_TO_EULA.optional(),
  checkForUpdates: z.boolean().optional().default(true),
  animatedLogo: z.boolean().optional().default(true),
});

export type LabConfig = z.infer<typeof LAB_CONFIG>;

export const DEFAULT_CONFIG: LabConfig = {
  config: DEFAULT_USER_CONFIG,
  checkForUpdates: true,
  animatedLogo: true,
};

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

export const NAMESPACE = 'talisman-lab';

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

export type ApplicationState = {
  input: ConnectionStatus;
  output: ConnectionStatus;
  midiDeviceReadiness: MidiDeviceReadiness | null;
  updates: UpdateCheckResult | null;
};

export type TalismanLabRootComponent = BaseComponentProto<
  Namespace,
  'talisman-lab-root'
> & {
  license: GetEulaResponse | null;
  midi: MIDINetworkState;
  config: LabConfig;
  state: ApplicationState;
};

export type LicenseGateComponent = BaseComponentProto<
  Namespace,
  'license-gate'
> & {
  eula: UserActionState<GetEulaResponse>;
};

export type TalismanLabComponent =
  TalismanLabRootComponent | LicenseGateComponent;

export const isTalismanLabComponent = (
  component: AnyComponentProto,
): component is TalismanLabComponent => component.namespace === NAMESPACE;

export type TalismanLabUpdateConfig = BaseClientComponentMessage<Namespace> & {
  component: 'talisman-lab-root';
  action: 'update-config';
  diff: Diff<LabConfig>;
};

export type TalismanLabSwitchMode = BaseClientComponentMessage<Namespace> & {
  component: 'talisman-lab-root';
  action: 'switch-mode';
};

export type LicenseGateAcceptLicense = BaseClientComponentMessage<Namespace> & {
  component: 'license-gate';
  action: 'accept-license';
};

export type TalismanLabComponentMessage =
  TalismanLabUpdateConfig | TalismanLabSwitchMode | LicenseGateAcceptLicense;

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
  'talisman-lab-get-midi-messages'
> & {
  device: 'input' | 'output';
  fromIndex: number;
};

export type TalismanLabGetMidiMessagesReturn =
  MidiMessageBufferSlice<MidiMessageDescription | null>;

export type TalismanLabGetSupportedDevices = BaseClientComponentCall<
  Namespace,
  'talisman-lab-get-supported-devices'
>;

export type TalismanLabGetSupportedDevicesReturn = Record<
  string,
  TalismanSupportedDeviceData
>;

export type GetFullProfileInfo = BaseClientComponentCall<
  Namespace,
  'talisman-lab-get-full-profile-info'
> & {
  profileName: string;
  subProfileName: string;
};

export type GetFullProfileInfoReturn = TalismanFullProfileInfo;

export type TalismanLabComponentCalls = {
  'talisman-lab-get-midi-messages': {
    call: TalismanLabGetMidiMessages;
    return: TalismanLabGetMidiMessagesReturn;
  };
  'talisman-lab-get-supported-devices': {
    call: TalismanLabGetSupportedDevices;
    return: TalismanLabGetSupportedDevicesReturn;
  };
  'talisman-lab-get-full-profile-info': {
    call: GetFullProfileInfo;
    return: GetFullProfileInfoReturn;
  };
};

export const isTalismanLabComponentCall = <
  A extends keyof TalismanLabComponentCalls,
>(
  call: BaseClientComponentCall<string, string>,
  action: A,
): call is TalismanLabComponentCalls[A]['call'] =>
  call.namespace === NAMESPACE && call.action === action;
