import { createContext, useContext } from 'react';
import { ApplicationState, LabConfig } from '../../proto';

export type ConfigContextData = {
  config: LabConfig;
  updateConfig: (change: (current: LabConfig) => LabConfig) => void;
};

export const ConfigContext = createContext<ConfigContextData>(
  new Proxy({} as ConfigContextData, {
    get() {
      throw new Error('ConfigContext not initialized');
    },
  }),
);

export const ApplicationStateContext = createContext<ApplicationState>({
  updates: null,
});

export const useApplicationState = () => useContext(ApplicationStateContext);
