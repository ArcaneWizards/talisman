import { FC, ReactNode, useCallback, useContext, useMemo } from 'react';
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
  RootContext,
  RootContextData,
} from './context';
import { Settings } from './settings';
import { Logo } from './logo';
import {
  WINDOW_MODE_PARAM,
  WINDOW_MODE_MONITOR,
  WINDOW_MODE_DEVICES,
} from './urls';
import { SupportedDevices } from './devices';
import { success } from '@arcanewizards/sigil/frontend/user-actions';

type Props = {
  info: TalismanLabRootComponent;
};

export const TalismanLabRoot: FC<Props> = ({ info }) => {
  const { config, state, midi } = info;

  const { sendMessage, call } = useContext(StageContext);

  const windowMode = useMemo(
    () => new URLSearchParams(window.location.search).get(WINDOW_MODE_PARAM),
    [],
  );

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

  const getSupportedDevices: RootContextData['getSupportedDevices'] =
    useCallback(() => {
      if (!call) {
        throw new Error('No call function available');
      }
      return call<
        'talisman-lab',
        TalismanLabComponentCalls,
        'talisman-lab-get-supported-devices'
      >({
        type: 'component-call',
        namespace: 'talisman-lab',
        componentKey: info.key,
        action: 'talisman-lab-get-supported-devices',
      }).then(success);
    }, [call, info.key]);

  const getFullProfileInfo: RootContextData['getFullProfileInfo'] = useCallback(
    (args) => {
      if (!call) {
        throw new Error('No call function available');
      }
      return call<
        'talisman-lab',
        TalismanLabComponentCalls,
        'talisman-lab-get-full-profile-info'
      >({
        type: 'component-call',
        namespace: 'talisman-lab',
        componentKey: info.key,
        action: 'talisman-lab-get-full-profile-info',
        ...args,
      }).then(success);
    },
    [call, info.key],
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

  const configValue: RootContextData = useMemo(() => {
    return {
      config,
      updateConfig,
      getSupportedDevices,
      getFullProfileInfo,
    };
  }, [config, updateConfig, getSupportedDevices, getFullProfileInfo]);

  const updateUserConfig = useCallback(
    (change: (current: UserConfig) => UserConfig) =>
      updateConfig((current) => ({
        ...current,
        config: change(current.config),
      })),
    [updateConfig],
  );

  let children: ReactNode = null;

  if (windowMode) {
    let windowChild: ReactNode = null;
    if (windowMode === WINDOW_MODE_DEVICES) {
      windowChild = <SupportedDevices />;
    } else if (windowMode === WINDOW_MODE_MONITOR) {
      windowChild = (
        <div className="flex h-0 grow scrollbar-sigil flex-col overflow-y-auto">
          <div
            className="
              flex grow basis-0 scrollbar-sigil flex-col items-stretch
              justify-center gap-2 p-2
            "
          >
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
              className="grow basis-0"
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
              className="grow basis-0"
            />
          </div>
        </div>
      );
    }
    if (windowChild) {
      children = (
        <RootContext.Provider value={configValue}>
          <ApplicationStateContext.Provider value={state}>
            <Layout<never> modes={null}>{windowChild}</Layout>
          </ApplicationStateContext.Provider>
        </RootContext.Provider>
      );
    }
  }

  if (!children) {
    children = (
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
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <RootContext.Provider value={configValue}>
      <ApplicationStateContext.Provider value={state}>
        {children}
      </ApplicationStateContext.Provider>
    </RootContext.Provider>
  );
};
