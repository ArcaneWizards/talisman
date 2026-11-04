import { FC, ReactNode, useCallback, useContext, useMemo } from 'react';
import {
  LabConfig,
  TalismanLabComponentCalls,
  TalismanLabRootComponent,
  TalismanLabSwitchMode,
  TalismanLabUpdateConfig,
  UserConfig,
} from '../../proto';

import { SOURCE_CODE_URL, STRINGS } from '../../../constants';
import { Layout, UPDATE_DETAILS_WINDOW_MODE } from './layout';
import { Debugger, useBrowserContext } from '@arcanewizards/sigil/frontend';
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
import { RawLogo } from './logo';
import {
  WINDOW_MODE_PARAM,
  WINDOW_MODE_MONITOR,
  WINDOW_MODE_DEVICES,
} from './urls';
import { SupportedDevices } from './devices';
import { success } from '@arcanewizards/sigil/frontend/user-actions';
import {
  DeviceProfileDetails,
  useFullProfileInfo,
} from '../shared/device-profile-details';
import { ControlButton } from '@arcanewizards/sigil/frontend/controls';
import { ExternalLink } from './content';
import { Icon } from '@arcanejs/toolkit-frontend/components/core';

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
      });
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

  const selectedProfile =
    midi.profiles[config.config.selectedProfile?.[0] ?? ''];
  const profileId = config.config.selectedProfile?.[0] ?? '';

  // Must be memoized: useFullProfileInfo re-runs its load (an async transition)
  // whenever this array identity changes.
  const subProfileKeys = useMemo(
    () => (selectedProfile ? Object.keys(selectedProfile.subProfiles) : []),
    [selectedProfile],
  );

  const deviceInfo = useFullProfileInfo({
    getProfileInfo: getFullProfileInfo,
    profileId,
    subProfileKeys,
  });

  const { openNewWidow, openExternalLink } = useBrowserContext();

  const openSupportedDevices = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set(WINDOW_MODE_PARAM, WINDOW_MODE_DEVICES);
    openNewWidow(url.href);
  }, [openNewWidow]);

  const contributeLink = SOURCE_CODE_URL + '/blob/main/CONTRIBUTING.md';

  const openContribute = useCallback(() => {
    openExternalLink(contributeLink);
  }, [openExternalLink, contributeLink]);

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
            <div
              className="
                flex w-full max-w-[1015px] flex-wrap gap-2 rounded-md
                bg-sigil-bg-dark p-2 text-sigil-foreground
              "
            >
              <RawLogo
                animatedLogo={config.animatedLogo}
                className="size-logo-home grow"
              />
              <div
                className="
                  m-0 flex w-arcane-slider-open grow-1000 flex-col
                  justify-center gap-2
                "
              >
                <p className="m-0">
                  This app is part of the{' '}
                  <ExternalLink href={SOURCE_CODE_URL}>
                    Talisman MIDI Project
                  </ExternalLink>
                  , an open-source initiative aiming to create reusable MIDI
                  device profiles for any application.
                </p>
                <p className="m-0">
                  You can test your MIDI devices with the profiles that have
                  been built so far by running the built-in test patterns, and
                  also monitor incoming & outgoing MIDI messages for your
                  selected device.
                </p>
                <p className="m-0">
                  If you'd like to contribute by building your own profiles or
                  by helping to test existing profiles, please read our{' '}
                  <ExternalLink href={contributeLink}>
                    contribution guidelines
                  </ExternalLink>
                  .
                </p>
              </div>
              <div className="grid min-w-max grow grid-cols-1 gap-1">
                <ControlButton variant="large" onClick={openSupportedDevices}>
                  View supported devices
                </ControlButton>
                <ControlButton variant="large" onClick={openContribute}>
                  Contribute
                  <Icon icon="open_in_new" />
                </ControlButton>
              </div>
            </div>
            <UserConfigEditor
              midi={midi}
              status={state}
              config={config.config}
              updateConfig={updateUserConfig}
              performModeSwitch={performModeSwitch}
              deviceInfo={deviceInfo}
            />
            <DeviceProfileDetails
              profileId={profileId}
              subProfileNames={selectedProfile?.subProfiles ?? {}}
              getProfileInfo={getFullProfileInfo}
              subProfile={{
                mode: 'locked',
                subProfileKey: config.config.selectedProfile?.[1] ?? null,
              }}
              className="
                h-0 min-h-[300px] max-w-[95vw] min-w-[min(70vw,1015px)] grow
                rounded-md bg-sigil-bg-dark p-1
              "
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
