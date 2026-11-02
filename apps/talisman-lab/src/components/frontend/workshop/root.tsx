import { FC, useCallback, useContext, useMemo } from 'react';
import {
  LabConfig,
  TalismanLabComponentCalls,
  TalismanLabRootComponent,
  TalismanLabSwitchMode,
  TalismanLabUpdateConfig,
  UserConfig,
} from '../../proto';

import { STRINGS } from '../../../constants';
import { Layout, UPDATE_DETAILS_WINDOW_MODE } from './layout';
import { Debugger } from '@arcanewizards/sigil/frontend';
import { diffJson } from '@arcanejs/diff';
import { StageContext } from '@arcanejs/toolkit-frontend';

import { MidiMessageMonitor } from '../shared/midi-message-monitor';
import { UserConfigEditor } from './user-config';
import { MidiMessageDescription } from '@arcanewizards/talisman/util';
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
  info: TalismanLabRootComponent;
};

export const TalismanLabRoot: FC<Props> = ({ info }) => {
  const { config, state, midi } = info;

  const { sendMessage, call } = useContext(StageContext);

  const updateConfig = useCallback(
    (change: (current: LabConfig) => LabConfig) => {
      const diff = diffJson(config, change(config));
      sendMessage?.<TalismanLabUpdateConfig>({
        type: 'component-message',
        namespace: 'talisman-lab',
        component: 'talisman-lab-root',
        componentKey: info.key,
        action: 'update-config',
        diff,
      });
    },
    [sendMessage, info.key, config],
  );

  const performModeSwitch = useCallback(
    () =>
      sendMessage?.<TalismanLabSwitchMode>({
        type: 'component-message',
        namespace: 'talisman-lab',
        component: 'talisman-lab-root',
        componentKey: info.key,
        action: 'switch-mode',
      }),
    [sendMessage, info.key],
  );

  const getMidiMessages = useCallback(
    (device: 'input' | 'output', fromIndex: number) => {
      if (!call) {
        throw new Error('No call function available');
      }
      return call<
        'talisman-lab',
        TalismanLabComponentCalls,
        'talisman-lab-get-midi-messages'
      >({
        type: 'component-call',
        namespace: 'talisman-lab',
        componentKey: info.key,
        action: 'talisman-lab-get-midi-messages',
        device,
        fromIndex,
      });
    },
    [call, info.key],
  );

  const getInputMessages = useCallback(
    (fromIndex: number) => getMidiMessages('input', fromIndex),
    [getMidiMessages],
  );

  const getOutputMessages = useCallback(
    (fromIndex: number) => getMidiMessages('output', fromIndex),
    [getMidiMessages],
  );

  const renderExtra = useCallback(
    (extra: MidiMessageDescription | null) =>
      extra ? (
        <span>
          <span className="text-sigil-foreground-highlight">
            {extra.value ? `${extra.value} - ` : ''}
          </span>
          <span className="text-sigil-foreground">{extra.description}</span>
        </span>
      ) : (
        <span className="text-sigil-error-foreground">Unknown message</span>
      ),
    [],
  );

  const configValue: ConfigContextData = useMemo(() => {
    return {
      config,
      updateConfig,
    };
  }, [config, updateConfig]);

  const updateUserConfig = useCallback(
    (change: (current: UserConfig) => UserConfig) =>
      updateConfig((current) => ({
        ...current,
        config: change(current.config),
      })),
    [updateConfig],
  );

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
              <UserConfigEditor
                midi={midi}
                status={state}
                config={config.config}
                updateConfig={updateUserConfig}
                performModeSwitch={performModeSwitch}
              />
              <div className="flex w-full grow flex-wrap gap-2">
                <MidiMessageMonitor<MidiMessageDescription | null>
                  label="Messages received"
                  latestIndex={
                    state.input.status === 'connected'
                      ? state.input.messagesReceived
                      : 0
                  }
                  getMidiMessages={getInputMessages}
                  defaultMonitoring
                  renderExtra={renderExtra}
                />
                <MidiMessageMonitor<MidiMessageDescription | null>
                  label="Messages sent"
                  latestIndex={
                    state.output.status === 'connected'
                      ? state.output.messagesReceived
                      : 0
                  }
                  getMidiMessages={getOutputMessages}
                  renderExtra={renderExtra}
                />
              </div>
            </div>
          </div>
        </Layout>
      </ApplicationStateContext.Provider>
    </ConfigContext.Provider>
  );
};
