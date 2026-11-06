import {
  AppShell,
  AppListenerManager,
  SigilRuntimeAppProps,
} from '@arcanewizards/sigil';
import { FC, JSX, ReactNode, useMemo, useState } from 'react';
import { C } from './components/backend';
import { getEnv } from './env';
import { ListenerConfig } from '@arcanewizards/sigil/shared/config';
import { ConnectionsContextProvider } from '@arcanejs/react-toolkit/connections';
import { useMidiNetworkState } from './workshop/network-state';
import { LabConfig } from './components/proto';
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

const AppRoot: FC<AppRootProps> = ({ logger, license, updates }) => {
  const { data: config, updateData: updateConfig } =
    useDataFileContext(LabConfigData);

  const midi = useMidiNetworkState(logger);

  const onUpdateConfig = (diff: Diff<LabConfig>) => {
    updateConfig((prev) => patchJson(prev, diff) ?? prev);
  };

  const status = useMemo(() => {
    return {
      updates,
    };
  }, [updates]);

  return (
    <C.TalismanArcadeRoot
      license={license}
      midi={midi.state}
      config={config}
      onUpdateConfig={onUpdateConfig}
      state={status}
    />
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
  const { data: config } = useDataFileContext(LabConfigData);

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
