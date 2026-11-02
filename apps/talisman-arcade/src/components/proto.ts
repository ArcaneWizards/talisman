import {
  AnyComponentProto,
  BaseClientComponentCall,
  BaseClientComponentMessage,
  BaseComponentProto,
} from '@arcanejs/protocol';
import { Diff } from '@arcanejs/diff';
import { MidiEndpoints, MIDISupportResponse } from '@arcanewizards/midi';
import z from 'zod';
import { GET_EULA_RESPONSE, GetEulaResponse } from '@arcanewizards/apis';
import { UserActionState } from '@arcanewizards/sigil/frontend/user-actions';
import { UpdateCheckResult } from '@arcanewizards/sigil/frontend/updates';

export const LOGO_URL_PATH = 'logo-animated.svg';
export const LOGO_STATIC_URL_PATH = 'logo-static.svg';

// Config

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
  agreedToEula: AGREED_TO_EULA.optional(),
  checkForUpdates: z.boolean().optional().default(true),
  animatedLogo: z.boolean().optional().default(true),
});

export type LabConfig = z.infer<typeof LAB_CONFIG>;

export const DEFAULT_CONFIG: LabConfig = {
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

export const NAMESPACE = 'talisman-arcade';

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
  updates: UpdateCheckResult | null;
};

export type TalismanArcadeRootComponent = BaseComponentProto<
  Namespace,
  'talisman-arcade-root'
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

export type TalismanArcadeComponent =
  TalismanArcadeRootComponent | LicenseGateComponent;

export const isTalismanArcadeComponent = (
  component: AnyComponentProto,
): component is TalismanArcadeComponent => component.namespace === NAMESPACE;

export type TalismanArcadeUpdateConfig =
  BaseClientComponentMessage<Namespace> & {
    component: 'talisman-arcade-root';
    action: 'update-config';
    diff: Diff<LabConfig>;
  };

export type LicenseGateAcceptLicense = BaseClientComponentMessage<Namespace> & {
  component: 'license-gate';
  action: 'accept-license';
};

export type TalismanArcadeComponentMessage =
  TalismanArcadeUpdateConfig | LicenseGateAcceptLicense;

export const isTalismanArcadeComponentMessage = <
  C extends TalismanArcadeComponentMessage['component'],
>(
  message: BaseClientComponentMessage<string>,
  component: C,
): message is TalismanArcadeComponentMessage & { component: C } =>
  message.namespace === NAMESPACE &&
  (message as TalismanArcadeComponentMessage).component === component;

export type TalismanArcadeComponentCalls = Record<never, never>;

export const isTalismanArcadeComponentCall = <
  A extends keyof TalismanArcadeComponentCalls,
>(
  call: BaseClientComponentCall<string, string>,
  action: A,
): call is TalismanArcadeComponentCalls[A]['call'] =>
  call.namespace === NAMESPACE && call.action === action;
