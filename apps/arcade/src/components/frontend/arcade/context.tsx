import { createContext, useContext } from 'react';
import { ApplicationState, ArcadeConfig } from '../../proto';

export type ConfigContextData = {
  config: ArcadeConfig;
  updateConfig: (change: (current: ArcadeConfig) => ArcadeConfig) => void;
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
  devices: {},
});

export const useApplicationState = () => useContext(ApplicationStateContext);
