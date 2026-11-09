import { createContext, useContext } from 'react';
import type { ApplicationState, ArcadeConfig, GameColors } from '../../proto';
import type { Game } from '../../../arcade/games/context';

export type ConfigContextData = {
  config: ArcadeConfig;
  colors: GameColors;
  updateConfig: (change: (current: ArcadeConfig) => ArcadeConfig) => void;
  changeGame: (game: Game) => void;
};

export const RootContext = createContext<ConfigContextData>(
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
