import { FC, useContext, useEffect, useMemo, useRef } from 'react';
import { GameContext } from './context';
import { MidiActionEvent, MidiControllerItem } from '@talisman-midi/talisman';
import {
  getCenterPosition,
  getCoordinateRanges,
} from '@talisman-midi/talisman/util';
import { COLORS, RGB, rgbToLightness } from '@talisman-midi/talisman/color';
import {
  addArtifact,
  Artifact,
  generateScreenSaverArtifact,
} from '../artifacts';
import { createArtifactInterval, createRenderInterval } from '../rendering';
import { C } from '../../components/backend';

const SCREENSAVER_MIN_WAIT_MS = 500;
const SCREENSAVER_MAX_WAIT_MS = 5000;

export const ScreenSaver: FC = () => {
  const { devices, changeGame } = useContext(GameContext);

  const artifacts = useRef<Artifact[]>([]);

  useEffect(() => {
    const artifactInterval = createArtifactInterval(devices, artifacts);
    return () => {
      clearInterval(artifactInterval);
    };
  }, [devices]);

  const dimensions = useMemo(() => {
    const items: MidiControllerItem[] = [];

    for (const d of devices) {
      items.push(...d.inputProfile.getItems());
    }

    const { minRow, minCol, maxRow, maxCol } = getCoordinateRanges(items);

    const diameter = Math.sqrt((maxRow - minRow) ** 2 + (maxCol - minCol) ** 2);
    return { minRow, minCol, maxRow, maxCol, diameter };
  }, [devices]);

  useEffect(() => {
    const { minRow, minCol, maxRow, maxCol, diameter } = dimensions;

    const generateArtifact = () => {
      artifacts.current.push(
        generateScreenSaverArtifact(
          {
            row: Math.round((minRow + maxRow) * Math.random() + minRow),
            col: Math.round((minCol + maxCol) * Math.random() + minCol),
          },
          diameter,
        ),
      );
      artifactGenerator = setTimeout(
        generateArtifact,
        SCREENSAVER_MIN_WAIT_MS +
          Math.random() * (SCREENSAVER_MAX_WAIT_MS - SCREENSAVER_MIN_WAIT_MS),
      );
    };

    let artifactGenerator = setTimeout(
      generateArtifact,
      SCREENSAVER_MIN_WAIT_MS,
    );

    return () => clearTimeout(artifactGenerator);
  }, [dimensions]);

  useEffect(() => {
    const unbind: Array<() => void> = [];

    for (const d of devices) {
      const input = d.inputProfile;
      const output = d.outputProfile;
      if (!input || !output) continue;

      output.clear();

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
        if (!item?.position) return;
        if (event.action.action === 'button-press') {
          changeGame('main-menu');
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
  }, [devices, changeGame]);

  return <C.ScreenSaver />;
};
