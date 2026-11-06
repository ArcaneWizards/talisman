import { DataFileUpdater } from '@arcanejs/react-toolkit/data';
import {
  ArcadeConfig,
  ArcadeDeviceConfig,
  MIDINetworkState,
} from '../components/proto';
import {
  autoSelectOutputForInput,
  autoSelectProfileAndSubprofile,
} from '@talisman-midi/talisman';
import { ENABLED_MIDI_PROFILES } from '../constants';
import isEqual from 'lodash/isEqual';
import { useEffect } from 'react';

export const useDeviceAutoSelection = (
  midi: MIDINetworkState,
  config: ArcadeConfig,
  updateConfig: DataFileUpdater<ArcadeConfig>,
) => {
  useEffect(() => {
    updateConfig((current) => {
      const updatedDevices: Record<string, ArcadeDeviceConfig> = {};

      for (const [uuid, deviceConfig] of Object.entries(current.devices)) {
        if (!deviceConfig.input) continue;
        const selectedProfile =
          deviceConfig.selectedProfile ??
          autoSelectProfileAndSubprofile(
            {
              inputDeviceName: deviceConfig.input,
            },
            ENABLED_MIDI_PROFILES,
          );
        const profile = ENABLED_MIDI_PROFILES[selectedProfile?.[0] ?? ''];
        const output =
          deviceConfig.output ||
          (profile &&
            autoSelectOutputForInput(
              { inputDeviceName: deviceConfig.input },
              midi.endpoints.outputs.map((o) => ({
                outputDeviceName: o.name,
              })),
              profile,
            )?.outputDeviceName) ||
          null;
        if (
          !isEqual(deviceConfig.selectedProfile, selectedProfile) ||
          deviceConfig.output !== output
        ) {
          updatedDevices[uuid] = {
            ...deviceConfig,
            selectedProfile,
            output,
          };
        }
      }
      if (Object.keys(updatedDevices).length > 0) {
        return {
          ...current,
          devices: {
            ...current.devices,
            ...updatedDevices,
          },
        };
      }
      return current;
    });
  }, [config.devices, midi.endpoints.outputs, updateConfig]);
};
