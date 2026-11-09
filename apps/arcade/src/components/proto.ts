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
import { MidiDeviceReadiness } from '@talisman-midi/talisman';
import { v4 as uuidv4 } from 'uuid';
import type { Game } from '../arcade/games/context';
import { RGB } from '@talisman-midi/talisman/color';

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

const ARCADE_DEVICE_CONFIG = z.object({
  input: z.string().nullable(),
  output: z.string().nullable(),
  selectedProfile: z.tuple([z.string(), z.string()]).nullable(),
  fps: z.number(),
});

export type ArcadeDeviceConfig = z.infer<typeof ARCADE_DEVICE_CONFIG>;

export const ARCADE_CONFIG = z.object({
  agreedToEula: AGREED_TO_EULA.optional(),
  checkForUpdates: z.boolean().optional().default(true),
  animatedLogo: z.boolean().optional().default(true),
  devices: z.record(ARCADE_DEVICE_CONFIG),
});

export type ArcadeConfig = z.infer<typeof ARCADE_CONFIG>;

export const DEFAULT_CONFIG: ArcadeConfig = {
  checkForUpdates: true,
  animatedLogo: true,
  devices: {
    [uuidv4()]: {
      input: null,
      output: null,
      selectedProfile: null,
      fps: 60,
    },
  },
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

export type MidiDeviceState = {
  input: ConnectionStatus;
  output: ConnectionStatus;
  readiness: MidiDeviceReadiness | null;
};

export type ApplicationState = {
  updates: UpdateCheckResult | null;
  devices: Record<string, MidiDeviceState>;
};

export type GameColors = {
  primary: RGB;
  secondary: RGB;
  ready: RGB;
  error: RGB;
};

export type TalismanArcadeRootComponent = BaseComponentProto<
  Namespace,
  'talisman-arcade-root'
> & {
  license: GetEulaResponse | null;
  midi: MIDINetworkState;
  config: ArcadeConfig;
  state: ApplicationState;
  child: AnyComponentProto | null;
  colors: GameColors;
};

export type LicenseGateComponent = BaseComponentProto<
  Namespace,
  'license-gate'
> & {
  eula: UserActionState<GetEulaResponse>;
};

export type MainMenuComponent = BaseComponentProto<Namespace, 'main-menu'>;

export type ScreensaverComponent = BaseComponentProto<Namespace, 'screensaver'>;

export type FxPlaygroundComponent = BaseComponentProto<
  Namespace,
  'fx-playground'
>;

export type TapAMoleGameState =
  | {
      mode: 'ready';
    }
  | {
      mode: 'countdown';
      gameStartTimeMs: number;
    }
  | {
      mode: 'playing';
      score: number;
      hit: number;
      miss: number;
      gameEndTimeMs: number;
    }
  | {
      mode: 'finished';
      gameFinishMs: number;
      score: number;
      hit: number;
      miss: number;
    };

export type TapAMoleComponent = BaseComponentProto<Namespace, 'tap-a-mole'> & {
  state: TapAMoleGameState;
};

export type TalismanArcadeComponent =
  | TalismanArcadeRootComponent
  | LicenseGateComponent
  | MainMenuComponent
  | ScreensaverComponent
  | FxPlaygroundComponent
  | TapAMoleComponent;

export const isTalismanArcadeComponent = (
  component: AnyComponentProto,
): component is TalismanArcadeComponent => component.namespace === NAMESPACE;

export type TalismanArcadeUpdateConfig =
  BaseClientComponentMessage<Namespace> & {
    component: 'talisman-arcade-root';
    action: 'update-config';
    diff: Diff<ArcadeConfig>;
  };

export type { Game };

export type TalismanArcadeChangeGame = BaseClientComponentMessage<Namespace> & {
  component: 'talisman-arcade-root';
  action: 'change-game';
  game: Game;
};

export type LicenseGateAcceptLicense = BaseClientComponentMessage<Namespace> & {
  component: 'license-gate';
  action: 'accept-license';
};

export type TalismanArcadeComponentMessage =
  | TalismanArcadeUpdateConfig
  | TalismanArcadeChangeGame
  | LicenseGateAcceptLicense;

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
