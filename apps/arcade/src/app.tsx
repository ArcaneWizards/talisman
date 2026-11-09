import {
  AppShell,
  AppListenerManager,
  SigilRuntimeAppProps,
} from '@arcanewizards/sigil';
import {
  FC,
  JSX,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { C } from './components/backend';
import {
  DEFAULT_CONNECTION,
  isDeviceReady,
  MidiDeviceConnection,
} from './arcade/midi-device-connection';
import { getEnv } from './env';
import { ListenerConfig } from '@arcanewizards/sigil/shared/config';
import { ConnectionsContextProvider } from '@arcanejs/react-toolkit/connections';
import { useMidiNetworkState } from './arcade/network-state';
import {
  ApplicationState,
  ArcadeConfig,
  MidiDeviceState,
} from './components/proto';
import { Diff } from '@arcanejs/diff/diff';
import { patchJson } from '@arcanejs/diff';
import { Logger } from '@arcanejs/protocol/logging';
import { LabConfigData } from './config';
import path from 'node:path';
import { useDataFileContext } from '@arcanejs/react-toolkit/data';
import { UpdateChecker } from '@arcanewizards/sigil/updates';
import { api, GetEulaResponse } from '@arcanewizards/apis';
import { UpdateCheckResult } from '@arcanewizards/sigil/frontend/updates';
import { API_APP_ID } from './constants';
import { EulaGate } from './eula';
import { MidiDeviceConnectionState } from './arcade/midi-device-connection';
import { useDeviceAutoSelection } from './arcade/device-auto-selection';
import { ScreenSaver } from './arcade/games/screensaver';
import {
  Game,
  GameColors,
  GameContext,
  GameContextData,
} from './arcade/games/context';
import { FxPlayground } from './arcade/games/fx-playground';
import { MainMenu } from './arcade/games/main-menu';
import { TapAMole } from './arcade/games/tap-a-mole';
import { filter } from './shared/util';

const DEFAULT_PORT: ListenerConfig['port'] = { from: 4120, to: 4200 };

export type AppApi = Record<never, never>;

export type TalismanArcadeAppProps = {
  dataDirectory: string;
};

export type AppProps = SigilRuntimeAppProps<AppApi, TalismanArcadeAppProps>;

type AppRootProps = {
  logger: Logger;
  license: GetEulaResponse;
  updates: UpdateCheckResult | null;
};

const getGame = (game: Game): ReactNode => {
  switch (game) {
    case 'main-menu':
      return <MainMenu />;
    case 'screen-saver':
      return <ScreenSaver />;
    case 'fx-playground':
      return <FxPlayground />;
    case 'tap-a-mole':
      return <TapAMole />;
  }
  const _exhaustiveCheck: never = game;
  return null;
};

const AppRoot: FC<AppRootProps> = ({ logger, license, updates }) => {
  const { data: config, updateData: updateConfig } =
    useDataFileContext(LabConfigData);

  const midi = useMidiNetworkState(logger);

  useDeviceAutoSelection(midi.state, config, updateConfig);

  const onUpdateConfig = (diff: Diff<ArcadeConfig>) => {
    updateConfig((prev) => patchJson(prev, diff) ?? prev);
  };

  const [deviceState, setDeviceState] = useState<
    Record<string, MidiDeviceConnectionState>
  >({});

  const updateDeviceState = useCallback(
    (
      uuid: string,
      update: (
        current: MidiDeviceConnectionState,
      ) => MidiDeviceConnectionState | null,
    ) => {
      const deviceConfig = config.devices[uuid];
      if (!deviceConfig) {
        return;
      }
      setDeviceState((prev) => {
        const state = update(
          prev[uuid] ?? { ...DEFAULT_CONNECTION, config: deviceConfig },
        );
        if (state === (prev[uuid] ?? null)) {
          // No change in state, return previous state
          return prev;
        }
        if (state === null) {
          return Object.fromEntries(
            Object.entries(prev).filter(([key]) => key !== uuid),
          );
        }
        return {
          ...prev,
          [uuid]: state,
        };
      });
    },
    [setDeviceState, config],
  );

  const status: ApplicationState = useMemo(() => {
    return {
      updates,
      devices: Object.fromEntries(
        Object.entries(deviceState).map(
          ([uuid, { input, output, readiness }]) => [
            uuid,
            { input, output, readiness } satisfies MidiDeviceState,
          ],
        ),
      ),
    };
  }, [updates, deviceState]);

  const [game, changeGame] = useState<Game>('main-menu');

  const colors = useRef<GameColors>({
    primary: [255, 0, 255],
    secondary: [0, 255, 255],
    error: [100, 0, 0],
    ready: [0, 255, 0],
  });

  const gameContextValue: GameContextData = useMemo(() => {
    return {
      devices: [...filter(Object.values(deviceState), isDeviceReady)],
      changeGame,
      colors,
    };
  }, [deviceState]);

  return (
    <>
      {Object.entries(config.devices).map(([uuid, device]) => (
        <MidiDeviceConnection
          key={uuid}
          midi={midi}
          uuid={uuid}
          updateState={updateDeviceState}
          config={device}
        />
      ))}
      <C.TalismanArcadeRoot
        license={license}
        midi={midi.state}
        config={config}
        onUpdateConfig={onUpdateConfig}
        state={status}
      >
        <GameContext.Provider value={gameContextValue}>
          {getGame(game)}
        </GameContext.Provider>
      </C.TalismanArcadeRoot>
    </>
  );
};

export const App = ({
  title,
  version,
  edition,
  toolkit,
  logger,
  logEventEmitter,
  setWindowUrl,
  shutdownContext,
}: AppProps): ReactNode => {
  const {
    data: config,
    error: configError,
    resetData,
  } = useDataFileContext(LabConfigData);

  useEffect(() => {
    if (configError) {
      // TODO: consider putting a data protection gate in-place to prevent
      // users losing their config.
      logger.warn('Resetting invalid config');
      resetData();
    }
  }, [logger, configError, resetData]);

  const env = useMemo(() => getEnv(logger), [logger]);

  const appListenerConfig = useMemo(() => {
    const baseConfig: ListenerConfig = {
      port: DEFAULT_PORT,
    };
    if (env.PORT) {
      // Just override the port, keeping the interface config as-is
      baseConfig.port = env.PORT;
    }
    return baseConfig;
  }, [env.PORT]);

  const a = useMemo(() => api(env.API_BASE_URL), [env.API_BASE_URL]);

  const [updateState, setUpdateState] = useState<UpdateCheckResult | null>(
    null,
  );

  return (
    <AppShell
      title={title}
      version={version}
      dataDirectory={'/'}
      logger={logger}
      logEventEmitter={logEventEmitter}
      shutdownContext={shutdownContext}
    >
      {config.agreedToEula ? (
        <AppRoot
          logger={logger}
          license={config.agreedToEula.content}
          updates={updateState}
        />
      ) : (
        <EulaGate api={a} />
      )}

      <UpdateChecker
        app={API_APP_ID}
        version={version}
        edition={edition}
        api={a}
        setUpdateState={setUpdateState}
        config={config}
      />
      <AppListenerManager
        toolkit={toolkit}
        setWindowUrl={setWindowUrl}
        listenerConfig={{ appListenerConfig }}
      />
    </AppShell>
  );
};

export const createApp = (props: AppProps): JSX.Element => {
  return (
    <ConnectionsContextProvider toolkit={props.toolkit}>
      <LabConfigData.Provider
        path={path.join(props.dataDirectory, 'config.json')}
      >
        <App {...props} />
      </LabConfigData.Provider>
    </ConnectionsContextProvider>
  );
};
