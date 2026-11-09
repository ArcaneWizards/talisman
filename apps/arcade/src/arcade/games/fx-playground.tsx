import { FC, useContext, useEffect, useRef } from 'react';
import { GameContext } from './context';
import { MidiActionEvent } from '@talisman-midi/talisman';
import {
  getCenterPosition,
  getCoordinateRanges,
} from '@talisman-midi/talisman/util';
import { addArtifact, Artifact, generateFXArtifact } from '../artifacts';
import { COLORS, RGB, rgbToLightness } from '@talisman-midi/talisman/color';
import { useScreenSaverTimeout } from '../hooks';
import { createArtifactInterval, createRenderInterval } from '../rendering';
import { C } from '../../components/backend';

export const FxPlayground: FC = () => {
  const { devices, changeGame } = useContext(GameContext);

  const artifacts = useRef<Artifact[]>([]);

  const { resetMenuResetTimeout } = useScreenSaverTimeout(60_000);

  useEffect(() => {
    const artifactInterval = createArtifactInterval(devices, artifacts);
    return () => {
      clearInterval(artifactInterval);
    };
  }, [devices]);

  useEffect(() => {
    const unbind: Array<() => void> = [];

    for (const d of devices) {
      const input = d.inputProfile;
      const output = d.outputProfile;
      output.clear();

      const { minRow, minCol, maxRow, maxCol } = getCoordinateRanges(
        input.getItems(),
      );

      const diameter = Math.sqrt(
        (maxRow - minRow) ** 2 + (maxCol - minCol) ** 2,
      );

      const renderInterval = createRenderInterval(d, () => {
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
            mode: rgbToLightness(rgb) > 0.5 ? 'active' : 'empty',
            color: rgb,
          });
        }
      });

      const onMessage = (event: MidiActionEvent) => {
        if (!event.action.item) return;
        const item = input.getItem(event.action.item);
        const center = getCenterPosition(item?.position, true);
        if (!center) return;
        if (event.action.action === 'button-press') {
          resetMenuResetTimeout();
          artifacts.current.push(generateFXArtifact(center, diameter));
        }
      };
      input.addEventListener('action', onMessage);
      unbind.push(() => {
        input.removeEventListener('action', onMessage);
        clearInterval(renderInterval);
      });
    }

    return () => {
      for (const u of unbind) {
        u();
      }
    };
  }, [devices, changeGame, resetMenuResetTimeout]);

  return <C.FxPlayground />;
};
