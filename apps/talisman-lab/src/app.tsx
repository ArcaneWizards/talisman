import {
  AppShell,
  AppListenerManager,
  SigilRuntimeAppProps,
} from '@arcanewizards/sigil';
import { FC, JSX, ReactNode, useCallback, useMemo, useState } from 'react';
import { C } from './components/backend';
import { getEnv } from './env';
import { ListenerConfig } from '@arcanewizards/sigil/shared/config';
import { ConnectionsContextProvider } from '@arcanejs/react-toolkit/connections';
import { useMidiNetworkState } from './workshop/network-state';
import { useSelectedDevices } from './workshop/selected-devices';
import { DEFAULT_USER_CONFIG, UserConfig } from './components/proto';
import { Diff } from '@arcanejs/diff/diff';
import { patchJson } from '@arcanejs/diff';
import { Events as TalismanLabRootEvents } from './components/backend/talisman-lab-root';
import { Logger } from '@arcanejs/protocol/logging';

const DEFAULT_PORT: ListenerConfig['port'] = { from: 4100, to: 4200 };

export type AppApi = Record<never, never>;

export type TalismanLabAppProps = Record<never, never>;

export type AppProps = SigilRuntimeAppProps<AppApi, TalismanLabAppProps>;

type AppRootProps = {
  logger: Logger;
};

const AppRoot: FC<AppRootProps> = ({ logger }) => {
  const midi = useMidiNetworkState(logger);

  const [config, setConfig] = useState<UserConfig>(DEFAULT_USER_CONFIG);

  const {
    inputStatus,
    outputStatus,
    inputBuffer,
    outputBuffer,
    midiDeviceReadiness,
    performModeSwitch,
  } = useSelectedDevices(logger, midi, config, setConfig);

  const onUpdateConfig = (diff: Diff<UserConfig>) => {
    setConfig((prev) => patchJson(prev, diff) ?? prev);
  };

  const status = useMemo(() => {
    return {
      input: inputStatus,
      output: outputStatus,
      midiDeviceReadiness,
    };
  }, [inputStatus, outputStatus, midiDeviceReadiness]);

  const onGetMidiMessages: TalismanLabRootEvents['getMidiMessages'] =
    useCallback(
      async ({ device, fromIndex }) =>
        (device === 'input' ? inputBuffer : outputBuffer).current.getFromIndex(
          fromIndex,
        ),
      [inputBuffer, outputBuffer],
    );

  return (
    <C.TalismanLabRoot
      midi={midi.state}
      config={config}
      onUpdateConfig={onUpdateConfig}
      status={status}
      onGetMidiMessages={onGetMidiMessages}
      onSwitchMode={performModeSwitch}
    />
  );
};

export const App = ({
  title,
  version,
  toolkit,
  logger,
  logEventEmitter,
  setWindowUrl,
  shutdownContext,
}: AppProps): ReactNode => {
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

  return (
    <AppShell
      title={title}
      version={version}
      dataDirectory={'/'}
      logger={logger}
      logEventEmitter={logEventEmitter}
      shutdownContext={shutdownContext}
    >
      <AppRoot logger={logger} />
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
      <App {...props} />
    </ConnectionsContextProvider>
  );
};
