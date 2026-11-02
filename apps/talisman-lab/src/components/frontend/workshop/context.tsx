import { createContext, useContext } from 'react';
import {
  ApplicationState,
  GetFullProfileInfo,
  GetFullProfileInfoReturn,
  LabConfig,
  TalismanLabGetSupportedDevicesReturn,
} from '../../proto';
import { ActionResponse } from '@arcanewizards/sigil/frontend/user-actions';

export type RootContextData = {
  config: LabConfig;
  getSupportedDevices: () => ActionResponse<TalismanLabGetSupportedDevicesReturn>;
  getFullProfileInfo: (
    args: Pick<GetFullProfileInfo, 'profileName' | 'subProfileName'>,
  ) => ActionResponse<GetFullProfileInfoReturn>;
};

export const RootContext = createContext<RootContextData>(
  new Proxy({} as RootContextData, {
    get() {
      throw new Error('RootContext not initialized');
    },
  }),
);

export const ApplicationStateContext = createContext<ApplicationState>({
  updates: null,
  input: { status: 'disabled' },
  output: { status: 'disabled' },
  midiDeviceReadiness: null,
});

export const useApplicationState = () => useContext(ApplicationStateContext);
