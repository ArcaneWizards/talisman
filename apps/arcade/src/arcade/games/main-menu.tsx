import { FC, useContext, useEffect, useMemo } from 'react';
import { Game, GameContext, GAMES, GAMES_EXCLUDING_MAIN_MENU } from './context';
import { Button, Group } from '@arcanejs/react-toolkit';
import {
  MidiActionEvent,
  MidiControllerItem,
  MidiFeedbackProfile,
  MidiProfile,
  MidiProfileFeedbackCapabilities,
} from '@talisman-midi/talisman';
import { RGB, rgbToLightness } from '@talisman-midi/talisman/color';
import { filter, isDefined } from '../../shared/util';

const rgbGridItems =
  (feedback: MidiProfileFeedbackCapabilities) =>
  (item: MidiControllerItem): boolean =>
    !!item.feedback &&
    feedback[item.feedback]?.led?.type === 'rgb' &&
    (!!item.note?.some((n) => n.nature?.nature === 'grid') ||
      !!item.controlChange?.some((n) => n.nature?.nature === 'grid'));

const colorGridItems =
  (feedback: MidiProfileFeedbackCapabilities) =>
  (item: MidiControllerItem): boolean =>
    !!item.feedback &&
    (feedback[item.feedback]?.led?.type === 'rgb' ||
      feedback[item.feedback]?.led?.type === 'palette') &&
    (!!item.note?.some((n) => n.nature?.nature === 'grid') ||
      !!item.controlChange?.some((n) => n.nature?.nature === 'grid'));

const rgbItems =
  (feedback: MidiProfileFeedbackCapabilities) =>
  (item: MidiControllerItem): boolean =>
    !!item.feedback && feedback[item.feedback]?.led?.type === 'rgb';

const colorItems =
  (feedback: MidiProfileFeedbackCapabilities) =>
  (item: MidiControllerItem): boolean =>
    !!item.feedback &&
    (feedback[item.feedback]?.led?.type === 'rgb' ||
      feedback[item.feedback]?.led?.type === 'palette');

const anyLedItems =
  (feedback: MidiProfileFeedbackCapabilities) =>
  (item: MidiControllerItem): boolean =>
    !!item.feedback && !!feedback[item.feedback]?.led;

const BUTTON_SELECTION_ORDER = [
  rgbGridItems,
  colorGridItems,
  rgbItems,
  colorItems,
  anyLedItems,
];

export const MainMenu: FC = () => {
  const { devices, changeGame } = useContext(GameContext);

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
          if (!input || !output) return null;

          const feedback = input.getFeedbackCapabilities();

          /**
           * Find the most ideal selection of buttons to use for the available games
           */
          let items: MidiControllerItem[] = [];

          for (const selector of BUTTON_SELECTION_ORDER) {
            if (items.length < GAMES_EXCLUDING_MAIN_MENU.length) {
              items = [
                ...items,
                ...filter(
                  input.getItems(),
                  selector(feedback),
                  GAMES_EXCLUDING_MAIN_MENU.length - items.length,
                ),
              ];
            } else {
              break;
            }
          }

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

        output.frameFinished();
      }

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
      <Button
        onClick={() => {
          changeGame('screen-saver');
        }}
        text="Screen Saver"
      />
      <Button
        onClick={() => {
          changeGame('fx-playground');
        }}
        text="FX Playground"
      />
    </Group>
  );
};
