import { FC, useContext, useEffect, useRef } from 'react';
import { GameContext } from './context';
import { Button, Group } from '@arcanejs/react-toolkit';
import { MidiActionEvent } from '@talisman-midi/talisman';
import {
  getCenterPosition,
  getCoordinateRanges,
} from '@talisman-midi/talisman/util';
import { COLORS, hslToRgb, RGB } from '@talisman-midi/talisman/color';
import { addArtifact, advanceArtifact, Artifact } from '../artifacts';
import { isDefined } from '../../shared/util';

export const GameSelector: FC = () => {
  const { devices, changeGame } = useContext(GameContext);

  const artifacts = useRef<Artifact[]>([]);

  useEffect(() => {
    const unbind: Array<() => void> = [];

    for (const d of devices) {
      const input = d.inputProfile;
      const output = d.outputProfile;
      if (!input || !output) continue;

      output.clear();

      const { minRow, minCol, maxRow, maxCol } = getCoordinateRanges(
        input.getItems(),
      );

      const diameter = Math.sqrt(
        (maxRow - minRow) ** 2 + (maxCol - minCol) ** 2,
      );

      const generateArtifact = () => {
        artifacts.current.push({
          type: 'wave',
          center: {
            row: Math.round((minRow + maxRow) * Math.random() + minRow),
            col: Math.round((minCol + maxCol) * Math.random() + minCol),
          },
          speedPerSecond: diameter / 2,
          leadingColor: COLORS.WHITE,
          trailingColor: hslToRgb({ h: Math.random() * 360, s: 100, l: 50 }),
          maxRadius: diameter * 2,
          leadingEdge: diameter / 16,
          trailingEdge: diameter / 4,
          radius: 0,
        });
      };

      const artifactGenerator = setInterval(generateArtifact, 2000);
      generateArtifact();

      let lastFrame = Date.now();
      const renderInterval = setInterval(() => {
        for (const item of input.getItems()) {
          let rgb: RGB = [0, 0, 0];
          const center = getCenterPosition(item.position, true);

          if (!center) {
            output.setItemColor(item.id, {
              mode: 'empty',
              color: COLORS.BLACK,
            });
            continue;
          }

          for (const artifact of artifacts.current) {
            rgb = addArtifact(rgb, center, artifact);
          }

          output.setItemColor(item.id, {
            mode: 'active',
            color: rgb,
          });

          output.frameFinished();
        }

        const deltaTime = Date.now() - lastFrame;
        artifacts.current = artifacts.current
          .map((a) => advanceArtifact(a, deltaTime))
          .filter(isDefined);

        lastFrame = Date.now();
      }, 1000 / d.config.fps);

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
        clearInterval(renderInterval);
        clearInterval(artifactGenerator);
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
