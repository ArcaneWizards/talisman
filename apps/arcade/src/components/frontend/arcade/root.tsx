import { FC, useCallback, useContext, useMemo } from 'react';
import {
  ArcadeConfig,
  Game,
  TALISMAN_LOGO_URL_PATH,
  TalismanArcadeRootComponent,
  TalismanArcadeUpdateConfig,
} from '../../proto';

import { SOURCE_CODE_URL, STRINGS } from '../../../constants';
import { Layout, UPDATE_DETAILS_WINDOW_MODE } from './layout';
import { Debugger, useBrowserContext } from '@arcanewizards/sigil/frontend';
import { diffJson } from '@arcanejs/diff';
import { StageContext } from '@arcanejs/toolkit-frontend';

import { License } from './license';
import { UpdateDetails } from '@arcanewizards/sigil/frontend/updates';
import {
  ApplicationStateContext,
  RootContext,
  ConfigContextData,
} from './context';
import { Settings } from './settings';
import { Logo } from './logo';
import { DeviceConfig } from './device-config';
import { ExternalLink } from './content';
import { ControlButton } from '@arcanewizards/sigil/frontend/controls';

type Props = {
  info: TalismanArcadeRootComponent;
};

const TALISMAN_PROJECT_PAGE_LINK = 'https://arcanewizards.com/talisman';

export const TalismanArcadeRoot: FC<Props> = ({ info }) => {
  const { config, state, midi, child, colors } = info;

  const { sendMessage, renderComponent } = useContext(StageContext);

  const { openExternalLink } = useBrowserContext();

  const updateConfig = useCallback(
    (change: (current: ArcadeConfig) => ArcadeConfig) => {
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

  const changeGame = useCallback(
    (game: Game) => {
      sendMessage?.({
        type: 'component-message',
        namespace: 'talisman-arcade',
        component: 'talisman-arcade-root',
        componentKey: info.key,
        action: 'change-game',
        game,
      });
    },
    [sendMessage, info.key],
  );

  const rootValue: ConfigContextData = useMemo(() => {
    return {
      config,
      colors,
      updateConfig,
      changeGame,
    };
  }, [config, updateConfig, colors, changeGame]);

  const openTalismanProjectPage = useCallback(() => {
    openExternalLink(TALISMAN_PROJECT_PAGE_LINK);
  }, [openExternalLink]);

  return (
    <RootContext.Provider value={rootValue}>
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
              <div
                className="
                  flex w-full max-w-[1015px] flex-wrap justify-center gap-2
                  rounded-md bg-sigil-bg-dark p-2 text-sigil-foreground
                "
              >
                <div
                  className="
                    flex w-[150px] grow flex-wrap items-center justify-center
                    gap-2
                  "
                >
                  <img
                    src={`/${TALISMAN_LOGO_URL_PATH}`}
                    alt="LOGO"
                    className="aspect-square w-[90px] max-w-full"
                  />
                  <div className="w-0 min-w-arcane-slider-min grow">
                    <p>
                      This app is open-source, and part of the{' '}
                      <ExternalLink href={SOURCE_CODE_URL}>
                        Talisman MIDI Project
                      </ExternalLink>
                      , an initiative aiming to improve how we create software
                      that supports many different MIDI devices.
                    </p>
                    <p>
                      We welcome new contributions, in particular support &
                      testing for new devices.
                    </p>
                  </div>
                </div>
                <ControlButton
                  variant="large"
                  onClick={openTalismanProjectPage}
                >
                  Learn More
                </ControlButton>
              </div>
              <div
                className="
                  flex w-full max-w-[1015px] flex-wrap justify-center gap-2
                  rounded-md bg-sigil-bg-dark p-2 text-sigil-foreground
                "
              >
                {Object.entries(config.devices).map(([uuid, device]) => (
                  <DeviceConfig
                    key={uuid}
                    midi={midi}
                    config={device}
                    state={state.devices[uuid] ?? null}
                    update={(change) =>
                      updateConfig((prev) => {
                        return {
                          ...prev,
                          devices: Object.fromEntries(
                            Object.entries(prev.devices).map(([id, d]) =>
                              id === uuid ? [id, change(d)] : [id, d],
                            ),
                          ),
                        };
                      })
                    }
                  />
                ))}
              </div>
              {child && renderComponent(child)}
            </div>
          </div>
        </Layout>
      </ApplicationStateContext.Provider>
    </RootContext.Provider>
  );
};
