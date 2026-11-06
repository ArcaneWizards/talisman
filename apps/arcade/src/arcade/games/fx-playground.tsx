import { FC, useContext, useEffect, useRef } from 'react';
import { GameContext } from './context';
import { MidiActionEvent } from '@talisman-midi/talisman';
import { MidiCoordinatePoint } from '@talisman-midi/talisman/util';
import { gameGrid } from '../grid';
import { Button, Group } from '@arcanejs/react-toolkit';

type Artifacts = {
  state: 'active' | 'inactive';
  opacity: number;
  center: MidiCoordinatePoint;
};

type InteractionState = {
  pressing: Record<string, Artifacts>;
  artifacts: Artifacts[];
};

const FADE_PER_SECOND = 0.5;

export const FxPlayground: FC = () => {
  const { devices, changeGame } = useContext(GameContext);

  const interaction = useRef<InteractionState>({
    pressing: {},
    artifacts: [],
  });

  useEffect(() => {
    devices.forEach((d) => {
      d.outputProfile?.clear();
      d.outputProfile?.frameFinished();

      for (const item of d.inputProfile?.getItems() ?? []) {
        d.outputProfile?.setItemColor(item.id, {
          mode: 'active',
          color: [100, 0, 0],
        });
      }
      d.outputProfile?.frameFinished();
    });
  }, [devices]);

  useEffect(() => {
    const unbind: Array<() => void> = [];

    for (const d of devices) {
      const input = d.inputProfile;
      const output = d.outputProfile;
      if (!input || !output) continue;

      output.clear();

      const { render, getCenterPosition, setColor } = gameGrid({
        input,
        output,
        background: [255, 0, 0],
      });

      let lastFrame = Date.now();
      const interval = setInterval(() => {
        interaction.current.artifacts = interaction.current.artifacts.filter(
          (artifact) => {
            // Adjust opacity
            if (artifact.state === 'inactive') {
              artifact.opacity -=
                FADE_PER_SECOND * ((Date.now() - lastFrame) / 1000);
            }
            return artifact.opacity > 0;
          },
        );

        for (const artifact of interaction.current.artifacts) {
          setColor(artifact.center, [
            255 * artifact.opacity,
            255 * artifact.opacity,
            0,
          ]);
        }

        lastFrame = Date.now();
        render();
      }, 1000 / d.config.fps);

      const onMessage = (event: MidiActionEvent) => {
        if (!event.action.item) return;
        const center = getCenterPosition(event.action.item);
        if (!center) return;
        if (event.action.action === 'button-press') {
          const artifact: Artifacts = {
            state: 'active',
            opacity: 1,
            center,
          };
          interaction.current.pressing[event.action.item] = artifact;
          interaction.current.artifacts.push(artifact);
        } else if (event.action.action === 'button-release') {
          const a = interaction.current.pressing[event.action.item];
          if (a) {
            a.state = 'inactive';
          }
          delete interaction.current.pressing[event.action.item];
        }
      };
      input.addEventListener('action', onMessage);
      unbind.push(() => {
        input.removeEventListener('action', onMessage);
        clearInterval(interval);
      });
    }

    return () => {
      for (const u of unbind) {
        u();
      }
    };
  }, [devices]);

  return (
    <Group title="FX Playground">
      <Button
        onClick={() => {
          changeGame('menu');
        }}
        text="Main Menu"
      />
    </Group>
  );
};
