import { createContext } from 'react';
import { MidiDeviceConnection } from '../midi-device-connection';
import { RGB } from '@talisman-midi/talisman/color';

export const GAMES = Object.freeze({
  'main-menu': {
    color: [0, 0, 0],
  },
  'screen-saver': {
    color: [100, 0, 0],
  },
  'fx-playground': {
    color: [0, 100, 0],
  },
} satisfies Record<
  string,
  {
    color: RGB;
  }
>);

export type Game = keyof typeof GAMES;

export const GAMES_EXCLUDING_MAIN_MENU = (Object.keys(GAMES) as Game[]).filter(
  (key) => key !== 'main-menu',
);

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
