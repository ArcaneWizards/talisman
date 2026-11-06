import { useEffect, useMemo, useState } from 'react';
import { MIDINetworkState } from '../components/proto';
import {
  midi,
  MidiEndpoints,
  MIDIEndpointsChangedEvent,
  MIDIEventListener,
  MIDIInterface,
  MIDISupportResponse,
} from '@arcanewizards/midi';
import { Logger } from '@arcanejs/protocol/logging';
import { KNOWN_MIDI_PROFILES } from '@talisman-midi/profiles';

const MIDI_STATUS_POLL_INTERVAL = 1000;

export type MidiNetworkContext = {
  state: MIDINetworkState;
  midi: MIDIInterface;
};

export const useMidiNetworkState = (log: Logger): MidiNetworkContext => {
  const [support, setSupport] = useState<MIDISupportResponse | null>(null);

  const [endpoints, setEndpoints] = useState<MidiEndpoints>({
    inputs: [],
    outputs: [],
  });

  const m = useMemo(() => midi(), []);

  useEffect(() => {
    m.getSupportInfo()
      .then(setSupport)
      .catch((cause) => {
        const error = new Error('Failed to get MIDI support info', { cause });
        log.error(error);
        setSupport({
          supported: false,
          reason: 'Failed to get MIDI support info',
        });
      });
  }, [m, log]);

  useEffect(() => {
    if (!support?.supported) {
      return;
    }
    // Keep track of available devices as state so that we can react to changes
    // in device availability

    let listener: MIDIEventListener<MIDIEndpointsChangedEvent> | null = null;
    let interval: NodeJS.Timeout | null = null;

    if (support.notifications.supported) {
      const l: MIDIEventListener<MIDIEndpointsChangedEvent> = ({ endpoints }) =>
        setEndpoints(endpoints);
      try {
        m.addEventListener('endpointschanged', l);
        // Establishing listener succeeded
        listener = l;
        // Get the initial list of devices
        m.getEndpoints()
          .then(setEndpoints)
          .catch((cause) => {
            const error = new Error(`Failed to get MIDI devices`, { cause });
            log.error(error);
          });
      } catch (cause) {
        const error = new Error(
          `Failed to initialize MIDI endpoint change listener, falling-back to polling`,
          { cause },
        );
        log.error(error);
      }
    }

    if (!listener) {
      // If notifications aren't supported, or listening failed,
      // poll for changes every 5 seconds
      interval = setInterval(() => {
        m.getEndpoints()
          .then(setEndpoints)
          .catch((cause) => {
            const error = new Error(`Failed to get MIDI devices`, {
              cause,
            });
            log.error(error);
          });
      }, MIDI_STATUS_POLL_INTERVAL);
    }

    return () => {
      if (listener) {
        m.removeEventListener('endpointschanged', listener);
      }
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [m, log, support]);

  const profiles: MIDINetworkState['profiles'] = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(KNOWN_MIDI_PROFILES).map(
          ([key, { name, subProfiles }]) => [
            key,
            {
              name,
              subProfiles: Object.fromEntries(
                Object.entries(subProfiles ?? {}).map(([key, { name }]) => [
                  key,
                  name ?? (key === 'default' ? 'Default' : key),
                ]),
              ),
            },
          ],
        ),
      ),
    [],
  );

  const state: MIDINetworkState = useMemo(
    () => ({ support, endpoints, profiles }),
    [support, endpoints, profiles],
  );

  return useMemo(() => ({ state, midi: m }), [state, m]);
};
