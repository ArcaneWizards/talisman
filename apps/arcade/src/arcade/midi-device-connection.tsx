import { FC, useEffect } from 'react';
import { ArcadeDeviceConfig, MidiDeviceState } from '../components/proto';

type Props = {
  uuid: string;
  updateState: (uuid: string, value: MidiDeviceState | null) => void;
  device: ArcadeDeviceConfig;
};

export const MidiDeviceConnection: FC<Props> = ({ uuid, updateState }) => {
  useEffect(() => {
    updateState(uuid, {
      input: { status: 'connecting' },
      output: { status: 'connecting' },
      readiness: null,
    });
    return () => {
      updateState(uuid, null);
    };
  }, [uuid, updateState]);

  return null;
};
