import { FC, useContext, useEffect } from 'react';
import { GameContext } from './context';
import { Button, Group } from '@arcanejs/react-toolkit';
import { MidiActionEvent } from '@talisman-midi/talisman';
import { gameGrid } from '../grid';

export const GameSelector: FC = () => {
  const { devices, changeGame } = useContext(GameContext);

  useEffect(() => {
    const unbind: Array<() => void> = [];

    for (const d of devices) {
      const input = d.inputProfile;
      const output = d.outputProfile;
      if (!input || !output) continue;

      output.clear();

      const { render } = gameGrid({
        input,
        output,
        background: [0, 255, 0],
      });

      render();

      const onMessage = (event: MidiActionEvent) => {
        if (!event.action.item) return;
        const item = input.getItem(event.action.item);
        if (!item?.position) return;
        if (event.action.action === 'button-press') {
          changeGame('fx-playground');
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
  }, [devices, changeGame]);

  return (
    <Group>
      <Button
        onClick={() => {
          changeGame('fx-playground');
        }}
        text="FX Playground"
      />
    </Group>
  );
};
