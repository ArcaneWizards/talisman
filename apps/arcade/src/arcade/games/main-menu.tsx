import { FC, useContext, useEffect, useMemo } from 'react';
import { Game, GameContext, GAMES, GAMES_EXCLUDING_MAIN_MENU } from './context';
import { Button, Group } from '@arcanejs/react-toolkit';
import {
  MidiActionEvent,
  MidiFeedbackProfile,
  MidiProfile,
} from '@talisman-midi/talisman';
import { RGB, rgbToLightness } from '@talisman-midi/talisman/color';
import { isDefined } from '../../shared/util';
import { ANY_LED_INTERACTIVE_ITEMS, selectItems } from '../item-selection';
import { useScreenSaverTimeout } from '../hooks';

export const MainMenu: FC = () => {
  const { devices, changeGame } = useContext(GameContext);

  useScreenSaverTimeout(10_000);

  const deviceInfo: Array<{
    output: MidiFeedbackProfile;
    input: MidiProfile;
    bindings: Record<string, Game>;
  }> = useMemo(
    () =>
      devices
        .map((d) => {
          const input = d.inputProfile;
          const output = d.outputProfile;

          const feedback = input.getFeedbackCapabilities();

          const items = selectItems(
            input.getItems(),
            feedback,
            ANY_LED_INTERACTIVE_ITEMS,
            GAMES_EXCLUDING_MAIN_MENU.length,
          );

          const bindings: Record<string, Game> = {};

          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const game = GAMES_EXCLUDING_MAIN_MENU[i];
            if (game && item) {
              bindings[item.id] = game;
            }
          }

          return {
            input,
            output,
            bindings,
          };
        })
        .filter(isDefined),
    [devices],
  );

  useEffect(() => {
    const unbind: Array<() => void> = [];

    for (const { input, output, bindings } of deviceInfo) {
      output.clear();

      for (const item of input.getItems()) {
        let rgb: RGB = [0, 0, 0];
        const binding = bindings[item.id];
        if (binding) {
          rgb = GAMES[binding].color;
        }

        output.setItemColor(item.id, {
          mode: rgbToLightness(rgb) > 0.5 ? 'active' : 'empty',
          color: rgb,
        });
      }
      output.frameFinished();

      const onMessage = (event: MidiActionEvent) => {
        if (!event.action.item) return;
        const item = input.getItem(event.action.item);
        if (event.action.action === 'button-press') {
          const binding = item && bindings[item.id];
          if (binding) {
            changeGame(binding);
          }
        }
      };
      input.addEventListener('action', onMessage);
      unbind.push(() => {
        input.removeEventListener('action', onMessage);
      });
    }

    return () => {
      for (const u of unbind) {
        u();
      }
    };
  }, [deviceInfo, changeGame]);

  return (
    <Group title="Main Menu">
      {GAMES_EXCLUDING_MAIN_MENU.map((game) => (
        <Button
          key={game}
          onClick={() => {
            changeGame(game);
          }}
          text={GAMES[game].name}
        />
      ))}
    </Group>
  );
};
