import { FC, useCallback, useContext, useMemo } from 'react';
import {
  LabConfig,
  TalismanArcadeRootComponent,
  TalismanArcadeUpdateConfig,
} from '../../proto';

import { STRINGS } from '../../../constants';
import { Layout, UPDATE_DETAILS_WINDOW_MODE } from './layout';
import { Debugger } from '@arcanewizards/sigil/frontend';
import { diffJson } from '@arcanejs/diff';
import { StageContext } from '@arcanejs/toolkit-frontend';

import { License } from './license';
import { UpdateDetails } from '@arcanewizards/sigil/frontend/updates';
import {
  ApplicationStateContext,
  ConfigContext,
  ConfigContextData,
} from './context';
import { Settings } from './settings';
import { Logo } from './logo';

type Props = {
  info: TalismanArcadeRootComponent;
};

export const TalismanArcadeRoot: FC<Props> = ({ info }) => {
  const { config, state } = info;

  const { sendMessage } = useContext(StageContext);

  const updateConfig = useCallback(
    (change: (current: LabConfig) => LabConfig) => {
      const diff = diffJson(config, change(config));
      sendMessage?.<TalismanArcadeUpdateConfig>({
        type: 'component-message',
        namespace: 'talisman-arcade',
        component: 'talisman-arcade-root',
        componentKey: info.key,
        action: 'update-config',
        diff,
      });
    },
    [sendMessage, info.key, config],
  );

  const configValue: ConfigContextData = useMemo(() => {
    return {
      config,
      updateConfig,
    };
  }, [config, updateConfig]);

  return (
    <ConfigContext.Provider value={configValue}>
      <ApplicationStateContext.Provider value={state}>
        <Layout<
          'debug' | 'license' | 'settings' | typeof UPDATE_DETAILS_WINDOW_MODE
        >
          footer
          licenseMode="license"
          modes={{
            license: {
              child: (setWindowMode) =>
                info.license ? (
                  <License eula={info.license} setWindowMode={setWindowMode} />
                ) : null,
              button: {
                icon: 'info',
                title: STRINGS.license,
              },
            },
            debug: {
              child: () => (
                <Debugger title={STRINGS.debugger} className="size-full" />
              ),
              button: {
                icon: 'bug_report',
                title: STRINGS.debugger,
              },
            },
            settings: {
              child: (setWindowMode) => (
                <Settings setWindowMode={setWindowMode} />
              ),
              button: {
                icon: 'settings',
                title: STRINGS.settings.title,
              },
            },
            [UPDATE_DETAILS_WINDOW_MODE]: {
              child: (setWindowMode) =>
                info.state.updates ? (
                  <UpdateDetails
                    updates={info.state.updates}
                    strings={STRINGS.updates.details}
                    closeDetails={() => setWindowMode(null)}
                    className="grow"
                  />
                ) : null,
              button: null,
            },
          }}
        >
          <div className="flex h-0 grow scrollbar-sigil flex-col overflow-y-auto">
            <div
              className="
                flex grow basis-0 scrollbar-sigil flex-col items-center
                justify-center gap-2 p-2
              "
            >
              <Logo animatedLogo={config.animatedLogo} />
            </div>
          </div>
        </Layout>
      </ApplicationStateContext.Provider>
    </ConfigContext.Provider>
  );
};
