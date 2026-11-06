import { createContext } from 'react';
import { MidiDeviceConnection } from '../midi-device-connection';

export type Game = 'menu' | 'fx-playground';

export type GameContextData = {
  devices: MidiDeviceConnection[];
  changeGame: (game: Game) => void;
};

export const GameContext = createContext<GameContextData>(
  new Proxy(
    {},
    {
      get: () => {
        throw new Error('GameContext not initialized');
      },
    },
  ) as GameContextData,
);
