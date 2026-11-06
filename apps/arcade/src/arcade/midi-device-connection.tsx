import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArcadeDeviceConfig,
  ConnectionStatus,
  MidiDeviceState,
} from '../components/proto';
import {
  MidiDeviceReadiness,
  MidiFeedbackProfile,
  MidiInputConnectionInfo,
  MidiProfile,
  parseMidiMessages,
} from '@talisman-midi/talisman';
import { useLogger, useShutdownHandler } from '@arcanewizards/sigil';
import { MidiNetworkContext } from './network-state';
import { MIDIInput, MIDIMessageEvent, MIDIOutput } from '@arcanewizards/midi';
import { ALL_MIDI_PROFILES } from '../constants';
import { isEqual } from 'lodash';

export type MidiDeviceConnection = MidiDeviceState & {
  config: ArcadeDeviceConfig;
  inputProfile: MidiProfile | null;
  outputProfile: MidiFeedbackProfile | null;
};

type Props = {
  uuid: string;
  midi: MidiNetworkContext;
  updateState: (
    uuid: string,
    update: (current: MidiDeviceConnection) => MidiDeviceConnection | null,
  ) => void;
  config: ArcadeDeviceConfig;
};

type ConnectedInput = {
  input: MIDIInput;
  connected: boolean;
};

type ConnectedOutput = {
  output: MIDIOutput;
  connected: boolean;
};

export const DEFAULT_CONNECTION: Omit<MidiDeviceConnection, 'config'> = {
  input: { status: 'disabled' },
  output: { status: 'disabled' },
  readiness: null,
  inputProfile: null,
  outputProfile: null,
};

export const MidiDeviceConnection: FC<Props> = ({
  uuid,
  midi,
  updateState,
  config,
}) => {
  const log = useLogger();

  const m = midi.midi;
  const { endpoints, support } = midi.state;

  const selectedInputDevice = useMemo(() => {
    return config.input !== null
      ? endpoints.inputs.find((input) => input.name === config.input)
      : null;
  }, [config.input, endpoints.inputs]);

  const selectedOutputDevice = useMemo(() => {
    return config.output !== null
      ? endpoints.outputs.find((output) => output.name === config.output)
      : null;
  }, [config.output, endpoints.outputs]);

  const [input, setInput] = useState<ConnectedInput | null>(null);
  const [output, setOutput] = useState<ConnectedOutput | null>(null);

  const connection: MidiInputConnectionInfo | null = useMemo(() => {
    if (!input) {
      return null;
    }
    return {
      inputDeviceName: input.input.getInfo().name,
    };
  }, [input]);

  const [midiDeviceReadiness, setMidiDeviceReadiness] =
    useState<MidiDeviceReadiness | null>(null);

  const inputProfile = useMemo(() => {
    if (!connection) {
      return null;
    }
    const [p, subP] = config.selectedProfile ?? ['', 'default'];
    const inputProfile =
      ALL_MIDI_PROFILES[p]?.subProfiles?.[subP]?.input({ connection }) ?? null;

    setMidiDeviceReadiness(null);

    inputProfile?.addEventListener('readiness', (event) => {
      setMidiDeviceReadiness((current) => {
        if (isEqual(current, event.readiness)) {
          return current;
        }
        return event.readiness;
      });
    });

    return inputProfile;
  }, [connection, config.selectedProfile]);

  const outputProfile = useMemo(() => {
    if (!connection || !inputProfile || !output) {
      return null;
    }
    const [p, subP] = config.selectedProfile ?? ['', 'default'];
    const feedback = ALL_MIDI_PROFILES[p]?.subProfiles?.[subP]?.feedback?.({
      connection,
      inputProfile,
      sendMessage: (msg) => {
        if (!output.connected) return;
        output.output.sendMessage(msg);
      },
    });
    if (feedback) {
      return {
        name: output.output.getInfo().name,
        feedback,
      };
    }
  }, [connection, inputProfile, output, config.selectedProfile]);

  useEffect(() => {
    return () => {
      // Ensure the output profile is properly closed when the component unmounts
      // or the profile changes.
      outputProfile?.feedback.close?.();
    };
  }, [outputProfile]);

  const setAllConnections = useCallback(
    (state: ConnectionStatus) => {
      updateState(uuid, () => ({
        config,
        input: state,
        output: state,
        readiness: null,
        inputProfile: null,
        outputProfile: null,
      }));
    },
    [updateState, uuid, config],
  );

  useEffect(() => {
    if (config.input === null) {
      setAllConnections({ status: 'disabled' });
      return;
    }

    if (!support) {
      // Loading
      setAllConnections({ status: 'connecting' });
      return;
    }

    if (!support.supported) {
      setAllConnections({
        status: 'error',
        errors: [support.reason],
      });
      return;
    }

    updateState(uuid, (current) => ({
      ...current,
      input: { status: 'connecting' },
    }));

    const initPromise = selectedInputDevice
      ? m.openInput(selectedInputDevice)
      : Promise.reject(
          new Error(`MIDI input device "${config.input}" not found`),
        );
    initPromise
      .then((input: MIDIInput) => {
        setInput({ input, connected: true });
        log.info(`Opened MIDI input ${config.input}`);
      })
      .catch((cause) => {
        const error = new Error(`Failed to initialize MIDI input`, {
          cause,
        });
        log.error(error);
        updateState(uuid, (current) => ({
          ...current,
          input: {
            status: 'error',
            errors: [`${error.message}`, `${cause}`],
          },
        }));
      });
  }, [
    log,
    uuid,
    updateState,
    setAllConnections,
    config.input,
    selectedInputDevice,
    m,
    support,
  ]);

  useEffect(() => {
    if (!support?.supported || !config.input) {
      // Only initialize an output with an input
      return;
    }
    if (config.output) {
      updateState(uuid, (current) => ({
        ...current,
        output: { status: 'connecting' },
      }));

      const initPromise = selectedOutputDevice
        ? m.openOutput(selectedOutputDevice)
        : Promise.reject(
            new Error(`MIDI output device "${config.output}" not found`),
          );

      initPromise
        .then((output: MIDIOutput) => {
          setOutput({ output, connected: true });
          log.info(`Opened MIDI output ${config.output}`);
        })
        .catch((cause) => {
          const error = new Error(`Failed to initialize MIDI output`, {
            cause,
          });
          log.error(error);
          updateState(uuid, (current) => ({
            ...current,
            output: {
              status: 'error',
              errors: [`${error.message}`, `${cause}`],
            },
          }));
        });
    }
  }, [
    log,
    uuid,
    updateState,
    setAllConnections,
    config.input,
    config.output,
    selectedOutputDevice,
    m,
    support,
  ]);

  useEffect(() => {
    if (input || output) {
      updateState(uuid, (current) => ({
        ...current,
        input: input ? { status: 'connected' } : current.input,
        output: output ? { status: 'connected' } : current.output,
        inputProfile,
        outputProfile: outputProfile?.feedback ?? null,
        readiness: midiDeviceReadiness,
      }));
    }
  }, [
    uuid,
    updateState,
    input,
    output,
    inputProfile,
    outputProfile,
    midiDeviceReadiness,
  ]);

  const handleMidiMessage = useCallback(
    (input: ConnectedInput, event: MIDIMessageEvent) => {
      if (!input.connected) {
        return;
      }
      try {
        for (const [msg] of parseMidiMessages(event.message)) {
          inputProfile?.receiveMessage(msg);
        }
      } catch (cause) {
        const error = new Error(`Unable to handle MIDI message`, { cause });
        log.error(error);
      }
    },
    [inputProfile, log],
  );

  const handleMidiMessageRef = useRef(handleMidiMessage);

  useEffect(() => {
    handleMidiMessageRef.current = handleMidiMessage;
  }, [handleMidiMessage]);

  useEffect(() => {
    if (!input) return;

    const { name } = input.input.getInfo();
    input.input.addEventListener('closed', () => {
      // Don't update the connection status,
      // as the state change of midi will trigger a re-check of the input
      // device and update the status accordingly
      log.info(`MIDI input ${name} closed`);
      // But prevent more messages being sent to this input instance
      input.connected = false;
    });
    input.input.addEventListener('message', (event) =>
      handleMidiMessageRef.current(input, event),
    );

    return () => {
      log.info(`Closing MIDI input ${name}`);
      input.input.close().catch((cause) => {
        const error = new Error(`Failed to close MIDI input`, {
          cause,
        });
        log.warn(error);
      });
    };
  }, [log, input]);

  useEffect(() => {
    if (!output) return;

    const { name } = output.output.getInfo();
    output.output.addEventListener('closed', () => {
      // Don't update the connection status,
      // as the state change of midi will trigger a re-check of the input
      // device and update the status accordingly
      log.info(`MIDI output ${name} closed`);
      // But prevent more messages being sent to this output instance
      output.connected = false;
    });

    return () => {
      log.info(`Closing MIDI output ${name}`);
      output.output.close().catch((cause) => {
        const error = new Error(`Failed to close MIDI output`, {
          cause,
        });
        log.warn(error);
      });
    };
  }, [log, output]);

  const shutdownHandler = useCallback(async () => {
    log.info(`Shutting down MIDI device connection for UUID ${uuid}`);
    if (output) {
      output.connected = false;
    }
    if (input) {
      input.connected = false;
    }
    // If shutting down, make sure that the output profile is properly closed
    await outputProfile?.feedback.close?.();
    await input?.input.close();
    await output?.output.close();
  }, [uuid, log, input, output, outputProfile]);

  useShutdownHandler(shutdownHandler);

  useEffect(() => {
    if (midiDeviceReadiness?.state === 'pending-mode-switch' && outputProfile) {
      // Automatically switch modes when required
      log.warn(`Automatically switching mode for ${outputProfile.name}`);
      outputProfile.feedback.performModeSwitch?.();
    }
  }, [log, midiDeviceReadiness, outputProfile]);

  return null;
};
