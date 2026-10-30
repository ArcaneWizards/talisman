import { FC, useCallback, useContext } from 'react';
import {
  LOGO_URL_PATH,
  TalismanLabComponentCalls,
  TalismanLabRootComponent,
  TalismanLabSwitchMode,
  TalismanLabUpdateConfig,
  UserConfig,
} from '../../proto';

import { STRINGS } from '../../../constants';
import { Layout } from './layout';
import { Debugger } from '@arcanewizards/sigil/frontend';
import { diffJson } from '@arcanejs/diff';
import { StageContext } from '@arcanejs/toolkit-frontend';

import { MidiMessageMonitor } from '../shared/midi-message-monitor';
import { UserConfigEditor } from './user-config';
import { MidiMessageDescription } from '@arcanewizards/talisman/util';

type Props = {
  info: TalismanLabRootComponent;
};

export const TalismanLabRoot: FC<Props> = ({ info }) => {
  const { config, status, midi } = info;

  const { sendMessage, call } = useContext(StageContext);

  const updateConfig = useCallback(
    (change: (current: UserConfig) => UserConfig) => {
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

  return (
    <Layout<'debug'>
      footer
      modes={{
        debug: {
          child: () => (
            <Debugger title={STRINGS.debugger} className="size-full" />
          ),
          button: {
            icon: 'bug_report',
            title: STRINGS.debugger,
          },
        },
      }}
    >
      <div
        className="
          flex h-0 grow scrollbar-sigil flex-col overflow-y-auto
          bg-sigil-bg-light
        "
      >
        <div
          className="
            flex grow basis-0 scrollbar-sigil flex-col items-center
            justify-center gap-2 p-2
          "
        >
          <img
            src={`/${LOGO_URL_PATH}`}
            alt="LOGO"
            height="200"
            width="100%"
            className="max-h-[20svh]"
          />
          <UserConfigEditor
            midi={midi}
            status={status}
            config={config}
            updateConfig={updateConfig}
            performModeSwitch={performModeSwitch}
          />
          <div className="flex w-full grow flex-wrap gap-2">
            <MidiMessageMonitor<MidiMessageDescription | null>
              label="Messages received"
              latestIndex={
                status.input.status === 'connected'
                  ? status.input.messagesReceived
                  : 0
              }
              getMidiMessages={getInputMessages}
              defaultMonitoring
              renderExtra={renderExtra}
            />
            <MidiMessageMonitor<MidiMessageDescription | null>
              label="Messages sent"
              latestIndex={
                status.output.status === 'connected'
                  ? status.output.messagesReceived
                  : 0
              }
              getMidiMessages={getOutputMessages}
              renderExtra={renderExtra}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};
