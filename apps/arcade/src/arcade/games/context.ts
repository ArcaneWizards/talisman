import { createContext, Ref } from 'react';
import { MidiDeviceConnectionStateReady } from '../midi-device-connection';
import { RGB } from '@talisman-midi/talisman/color';

export const GAMES = Object.freeze({
  'main-menu': {
    color: [0, 0, 0],
    name: 'Main Menu',
  },
  'screen-saver': {
    color: [100, 0, 0],
    name: 'Screen Saver',
  },
  'fx-playground': {
    color: [0, 100, 0],
    name: 'FX Playground',
  },
  'tap-a-mole': {
    color: [0, 0, 100],
    name: 'Tap A Mole',
  },
} satisfies Record<
  string,
  {
    color: RGB;
    name: string;
  }
>);

export type Game = keyof typeof GAMES;

export const GAMES_EXCLUDING_MAIN_MENU = (Object.keys(GAMES) as Game[]).filter(
  (key) => key !== 'main-menu',
);

export type GameColors = {
  primary: RGB;
  secondary: RGB;
};

export type GameContextData = {
  devices: MidiDeviceConnectionStateReady[];
  changeGame: (game: Game) => void;
  colors: Ref<GameColors>;
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
