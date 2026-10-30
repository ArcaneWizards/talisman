import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MidiNetworkContext } from './network-state';
import { ConnectionStatus, UserConfig } from '../components/proto';
import {
  autoSelectOutputForInput,
  autoSelectProfileAndSubprofile,
  MidiInputConnectionInfo,
  MidiProfileDefinition,
  parseMidiMessages,
  parseSingleMidiMessage,
} from '@arcanewizards/talisman';
import { CircularBuffer } from '../shared/util';
import { Logger } from '@arcanejs/protocol/logging';
import { MIDIInput, MIDIMessageEvent, MIDIOutput } from '@arcanewizards/midi';
import { KNOWN_MIDI_PROFILES } from '@arcanewizards/talisman-profiles';
import { hslToRgb, RGB } from '@arcanewizards/talisman/color';
import {
  getCenterPosition,
  getCoordinateRanges,
  getMidiMessageDescription,
  getPositions,
  getRowsAndColumns,
  MidiMessageDescription,
} from '@arcanewizards/talisman/util';
import {
  MidiCoordinateInfo,
  MidiDeviceReadiness,
} from '@arcanewizards/talisman/profile';
import { MidiColorFeedback } from '@arcanewizards/talisman/feedback';
import { useShutdownHandler } from '@arcanewizards/sigil';
import { ProcessedMidiMessage } from '../components/frontend/shared/midi-message-monitor';

const MIDI_PROFILES: Record<string, MidiProfileDefinition> =
  KNOWN_MIDI_PROFILES;

type ConnectedInput = {
  input: MIDIInput;
  connected: boolean;
};

type ConnectedOutput = {
  output: MIDIOutput;
  connected: boolean;
};

const MIDI_MESSAGE_BUFFER = 100;

type LineState =
  | {
      type: 'on';
    }
  | {
      type: 'fading';
      opacity: number;
    };

type InteractionState = {
  modifier: boolean;
  cols: Record<number, LineState>;
  rows: Record<number, LineState>;
  cells: Record<string, LineState>;
};

function* getPositionLineStates(
  interactionState: React.MutableRefObject<InteractionState>,
  p: MidiCoordinateInfo | null | undefined,
): Generator<LineState> {
  for (const ps of getRowsAndColumns(p)) {
    if ('col' in ps) {
      const col = interactionState.current.cols[ps.col];
      if (col) yield col;
    } else {
      const row = interactionState.current.rows[ps.row];
      if (row) yield row;
    }
  }
  for (const c of getPositions(p)) {
    const cr = interactionState.current.cells[`${c.col},${c.row}`];
    if (cr) yield cr;
  }
}

export const useSelectedDevices = (
  log: Logger,
  midi: MidiNetworkContext,
  config: UserConfig,
  updateConfig: (update: (current: UserConfig) => UserConfig) => void,
) => {
  useEffect(() => {
    const inputDeviceName = config.selectedInput;
    if (!inputDeviceName) return;
    updateConfig((current) => {
      let selectedProfile = autoSelectProfileAndSubprofile(
        {
          inputDeviceName,
        },
        MIDI_PROFILES,
      );
      if (
        !selectedProfile ||
        (selectedProfile[0] === current.selectedProfile?.[0] &&
          selectedProfile[1] === current.selectedProfile?.[1])
      ) {
        selectedProfile = current.selectedProfile;
      }
      let selectedOutput = current.selectedOutput;
      const profile = MIDI_PROFILES[selectedProfile?.[0] ?? ''];
      if (profile) {
        selectedOutput =
          autoSelectOutputForInput(
            { inputDeviceName },
            midi.state.endpoints.outputs.map((o) => ({
              outputDeviceName: o.name,
            })),
            profile,
          )?.outputDeviceName ?? selectedOutput;
      }
      if (
        current.selectedProfile === selectedProfile &&
        current.selectedOutput === selectedOutput
      ) {
        return current;
      }
      return {
        ...current,
        selectedProfile,
        selectedOutput,
      };
    });
  }, [config.selectedInput, midi.state.endpoints.outputs, updateConfig]);

  const [inputStatus, setInputStatus] = useState<ConnectionStatus>({
    status: 'disabled',
  });
  const [outputStatus, setOutputStatus] = useState<ConnectionStatus>({
    status: 'disabled',
  });

  const selectedInputDevice =
    config.selectedInput !== null
      ? midi.state.endpoints.inputs.find(
          (input) => input.name === config.selectedInput,
        )
      : null;
  const selectedOutputDevice =
    config.selectedOutput !== null
      ? midi.state.endpoints.outputs.find(
          (output) => output.name === config.selectedOutput,
        )
      : null;

  const [input, setInput] = useState<ConnectedInput | null>(null);
  const [output, setOutput] = useState<ConnectedOutput | null>(null);
  const outputRef = useRef<ConnectedOutput | null>(null);

  useEffect(() => {
    outputRef.current = output;
  }, [output]);

  const inputBuffer = useRef(
    new CircularBuffer<ProcessedMidiMessage<MidiMessageDescription | null>>(
      MIDI_MESSAGE_BUFFER,
    ),
  );
  const [inputMessageIndex, setInputMessageIndex] = useState(0);

  const outputBuffer = useRef(
    new CircularBuffer<ProcessedMidiMessage<null>>(MIDI_MESSAGE_BUFFER),
  );
  const [outputMessageIndex, setOutputMessageIndex] = useState(0);

  useEffect(() => {
    if (input) {
      setInputStatus({
        status: 'connected',
        messagesReceived: inputMessageIndex,
      });
    }
    if (output) {
      setOutputStatus({
        status: 'connected',
        messagesReceived: outputMessageIndex,
      });
    }
  }, [input, output, inputMessageIndex, outputMessageIndex]);

  const setAllConnections = useCallback((status: ConnectionStatus) => {
    setInputStatus(status);
    setOutputStatus(status);
  }, []);

  const m = midi.midi;
  const { support } = midi.state;

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
      MIDI_PROFILES[p]?.subProfiles?.[subP]?.input({ connection }) ?? null;

    setMidiDeviceReadiness(null);

    inputProfile?.addEventListener('readiness', (event) => {
      setMidiDeviceReadiness(event.readiness);
      if (event.message) {
        setInputMessageIndex(
          inputBuffer.current.add({
            timestamp: Date.now(),
            extra: getMidiMessageDescription(event.message, null, null),
            ...event.message,
          }),
        );
      }
    });

    inputProfile?.addEventListener('action', ({ action, message }) => {
      const item = action?.item ? inputProfile?.getItem(action?.item) : null;
      const extra = getMidiMessageDescription(message, item ?? null, action);

      if (item && action) {
        if (
          action &&
          (action.action === 'button-press' ||
            action.action === 'button-release')
        ) {
          const on = action.action === 'button-press';
          if (action.nature.nature === 'modifier') {
            interactionState.current.modifier = on;
          }
          if (configRef.current.interaction.type === 'row-column') {
            for (const p of getRowsAndColumns(item.position)) {
              if ('col' in p) {
                if (on) {
                  interactionState.current.cols[p.col] = { type: 'on' };
                } else {
                  delete interactionState.current.cols[p.col];
                }
              } else {
                if (on) {
                  interactionState.current.rows[p.row] = { type: 'on' };
                } else {
                  delete interactionState.current.rows[p.row];
                }
              }
            }
          } else {
            for (const { row, col } of getPositions(item.position)) {
              const key = `${col},${row}`;
              if (on) {
                interactionState.current.cells[key] = { type: 'on' };
              } else {
                delete interactionState.current.cells[key];
              }
            }
          }
        }
        if (
          action.action === 'absolute-value' ||
          action.action === 'relative-value'
        ) {
          for (const p of getRowsAndColumns(item.position)) {
            if ('col' in p) {
              interactionState.current.cols[p.col] = {
                type: 'fading',
                opacity: 1,
              };
            } else {
              interactionState.current.rows[p.row] = {
                type: 'fading',
                opacity: 1,
              };
            }
          }
        }
      }

      setInputMessageIndex(
        inputBuffer.current.add({
          timestamp: Date.now(),
          extra,
          ...message,
        }),
      );
    });

    return inputProfile;
  }, [connection, config.selectedProfile]);

  const outputProfile = useMemo(() => {
    if (!connection || !inputProfile) {
      return null;
    }
    const [p, subP] = config.selectedProfile ?? ['', 'default'];
    return (
      MIDI_PROFILES[p]?.subProfiles?.[subP]?.feedback?.({
        connection,
        inputProfile,
        sendMessage: (msg) => {
          if (!outputRef.current) return;
          const parsedMsg = parseSingleMidiMessage(msg);
          outputRef.current.output.sendMessage(msg);
          setOutputMessageIndex(
            outputBuffer.current.add({
              timestamp: Date.now(),
              extra: null,
              ...parsedMsg,
            }),
          );
        },
      }) ?? null
    );
  }, [connection, inputProfile, config.selectedProfile]);

  useEffect(() => {
    return () => {
      // Ensure the output profile is properly closed when the component unmounts
      // or the profile changes.
      outputProfile?.close?.();
    };
  }, [outputProfile]);

  const interactionState = useRef<InteractionState>({
    modifier: false,
    cols: {},
    rows: {},
    cells: {},
  });

  const configRef = useRef<UserConfig>(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  const handleMidiMessage = useCallback(
    (input: ConnectedInput, event: MIDIMessageEvent) => {
      if (!input.connected) {
        return;
      }
      try {
        for (const [msg] of parseMidiMessages(event.message)) {
          const handled = inputProfile?.receiveMessage(msg);

          if (!handled) {
            setInputMessageIndex(
              inputBuffer.current.add({
                timestamp: Date.now(),
                extra: null,
                ...msg,
              }),
            );
          }
        }
      } catch (cause) {
        const error = new Error(`Unable to handle MIDI message`, { cause });
        log.error(error);
      }
    },
    [inputBuffer, inputProfile, log],
  );

  useEffect(() => {
    if (config.selectedInput === null) {
      setInputStatus({ status: 'disabled' });
      setOutputStatus({ status: 'disabled' });
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

    setAllConnections({ status: 'connecting' });

    const handleInitError = (type: 'input' | 'output') => (cause: unknown) => {
      const error = new Error(`Failed to initialize MIDI ${type}`, {
        cause,
      });
      log.error(error);
      (type === 'input' ? setInputStatus : setOutputStatus)({
        status: 'error',
        errors: [`${error.message}`, `${cause}`],
      });
    };

    try {
      if (!selectedInputDevice) {
        throw new Error(
          `MIDI input device "${config.selectedInput}" not found`,
        );
      }
      m.openInput(selectedInputDevice)
        .then((input: MIDIInput) => {
          setInput({ input, connected: true });
          log.info(`Opened MIDI input on port ${selectedInputDevice.name}`);
        })
        .catch(handleInitError('input'));
    } catch (cause) {
      const error = new Error(`Failed to open MIDI input`, { cause });
      log.error(error);
      setInputStatus({
        status: 'error',
        errors: [`${error.message}`, `${cause}`],
      });
    }

    if (config.selectedOutput) {
      try {
        if (!selectedOutputDevice) {
          throw new Error(
            `MIDI output device "${config.selectedOutput}" not found`,
          );
        }
        m.openOutput(selectedOutputDevice)
          .then((output: MIDIOutput) => {
            setOutput({ output, connected: true });
            log.info(`Opened MIDI output on port ${selectedOutputDevice.name}`);
          })
          .catch(handleInitError('output'));
      } catch (cause) {
        const error = new Error(`Failed to open MIDI output`, {
          cause,
        });
        log.error(error);
        setOutputStatus({
          status: 'error',
          errors: [`${error.message}`, `${cause}`],
        });
      }
    }
  }, [
    log,
    setAllConnections,
    config.selectedInput,
    config.selectedOutput,
    selectedInputDevice,
    selectedOutputDevice,
    m,
    support,
  ]);

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
      log.info(`Closing MIDI input`);
      input.input.close().catch((cause) => {
        const error = new Error(`Failed to close MIDI input`, {
          cause,
        });
        log.warn(error);
      });
      setInput((current) => {
        if (current === input) {
          return null;
        }
        return current;
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
      log.info(`Closing MIDI output`);
      output.output.close().catch((cause) => {
        const error = new Error(`Failed to close MIDI output`, {
          cause,
        });
        log.warn(error);
      });
      setOutput((current) => {
        if (current === output) {
          return null;
        }
        return current;
      });
    };
  }, [log, output]);

  type AnimationState = {
    hue: number;
    pos: number;
    lastTimestamp: number;
  };

  const animationState = useRef<AnimationState>({
    hue: 0,
    pos: 0,
    lastTimestamp: Date.now(),
  });

  useEffect(() => {
    if (!outputProfile || !inputProfile) {
      return;
    }

    if (config.fps <= 0) {
      log.warn(`Animation disabled due to FPS: ${config.fps}`);
      return;
    }

    const { minCol, maxCol, minRow, maxRow } = getCoordinateRanges(
      inputProfile.getItems(),
    );

    const cols = maxCol - minCol + 1;
    const rows = maxRow - minRow + 1;

    const interval = setInterval(() => {
      const { hue, pos, lastTimestamp } = animationState.current;
      const now = Date.now();
      const delta = now - lastTimestamp;

      // Advance Animation
      animationState.current.lastTimestamp = now;
      animationState.current.hue = (hue + (delta / 1000) * 60) % 360;
      animationState.current.pos = (pos + (delta / 1000) * 0.25) % 1;

      // Decrease row fades over time
      let hasOverlay = false;
      for (const obj of [
        interactionState.current.cells,
        interactionState.current.rows,
        interactionState.current.cols,
      ])
        for (const [i, state] of Object.entries(obj)) {
          if (state.type === 'fading') {
            hasOverlay = true;
            state.opacity -= (delta / 1000) * 0.5;
            if (state.opacity <= 0) {
              delete obj[Number(i)];
            }
          } else if (state.type === 'on') {
            hasOverlay = true;
          }
        }

      if (Number.isFinite(cols) && Number.isFinite(rows)) {
        for (const item of inputProfile.getItems()) {
          const { row: patternRow, col: patternCol } = getCenterPosition(
            item.position,
          );

          let h: number;
          let s: number;
          let l: number;

          if (configRef.current.pattern.type === 'rainbow') {
            if (patternCol !== null && patternRow != null) {
              const rotate =
                ((patternCol + patternRow * cols) / (cols * rows)) * 360;
              h = (hue + rotate) % 360;
            } else {
              h = hue;
            }
            s = interactionState.current.modifier ? 0 : 100;
          } else {
            h = configRef.current.pattern.hue;
            s = configRef.current.pattern.saturation;
          }
          if (configRef.current.lightness.type === 'solid') {
            l = configRef.current.lightness.value;
          } else {
            const thisPos =
              configRef.current.lightness.direction === 'horizontal'
                ? ((patternCol ?? 0) / cols / 2 - pos + 1) % 1
                : ((patternRow ?? 0) / rows / 2 - pos + 1) % 1;
            l = Math.abs(thisPos - 0.5) * 200;
          }
          const color = hslToRgb({ h, s, l });
          const value = l / 100;

          let overlay = 0;
          for (const o of getPositionLineStates(
            interactionState,
            item.position,
          )) {
            if (o.type === 'on') {
              overlay = 1;
            } else if (o.type === 'fading') {
              overlay = Math.max(overlay, o.opacity);
            }
          }
          const finalColor: RGB =
            overlay > 0
              ? [
                  color[0] * (1 - overlay) + overlay * 255,
                  color[1] * (1 - overlay) + overlay * 255,
                  color[2] * (1 - overlay) + overlay * 255,
                ]
              : hasOverlay
                ? [color[0] * 0.5, color[1] * 0.5, color[2] * 0.5]
                : color;
          const feedback: MidiColorFeedback = {
            mode: overlay > 0 || (!hasOverlay && l > 51) ? 'active' : 'empty',
            color: finalColor,
          };
          outputProfile.setItemColor(item.id, feedback);
          const finalValue =
            overlay > 0
              ? overlay * 0.5 + 0.5
              : hasOverlay
                ? value * 0.5
                : value;
          outputProfile.setItemValue(item.id, finalValue);
        }
      }

      outputProfile.frameFinished();
    }, 1000 / config.fps);

    return () => clearInterval(interval);
  }, [log, outputProfile, inputProfile, config.fps]);

  const shutdownHandler = useCallback(async () => {
    // If shutting down, make sure that the output profile is properly closed
    await outputProfile?.close?.();
    await input?.input.close();
    await output?.output.close();
  }, [input, output, outputProfile]);

  useShutdownHandler(shutdownHandler);

  const performModeSwitch = useCallback(() => {
    outputProfile?.performModeSwitch?.();
  }, [outputProfile]);

  return {
    inputStatus,
    outputStatus,
    inputBuffer,
    outputBuffer,
    input,
    output,
    midiDeviceReadiness,
    performModeSwitch,
  };
};
