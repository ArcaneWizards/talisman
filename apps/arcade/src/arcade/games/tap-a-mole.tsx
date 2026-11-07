import { FC, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GameContext, GAMES } from './context';
import { MidiActionEvent, MidiControllerItem } from '@talisman-midi/talisman';
import {
  getCenterPosition,
  getCoordinateRanges,
} from '@talisman-midi/talisman/util';
import { Button, Group } from '@arcanejs/react-toolkit';
import { addArtifact, Artifact } from '../artifacts';
import { RGB } from '@talisman-midi/talisman/color';
import { ANY_LED_INTERACTIVE_ITEMS, selectItems } from '../item-selection';
import { createRenderInterval } from '../rendering';
import { gameGrid } from '../grid';
import { FONTS, RenderedText, renderText, ValidTextChar } from '../text/text';

const MIN_TARGETS = 8;
const COUNTDOWN_MS = 3000;

type GameState =
  | {
      mode: 'ready';
    }
  | {
      mode: 'countdown';
      startTime: number;
    }
  | {
      mode: 'playing';
    };

export const TapAMole: FC = () => {
  const { devices, changeGame } = useContext(GameContext);

  const artifacts = useRef<Artifact[]>([]);

  const [gameState, setGameState] = useState<GameState>({
    mode: 'ready',
  });

  const textRenderCache = useRef<{
    text: string;
    render: RenderedText;
  } | null>(null);

  /**
   * Use a ref in the rendering interval to always have the latest game state
   */
  const gameStateRef = useRef(gameState);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  /**
   * Select a single appropriate device to play this game
   */
  const deviceInfo = useMemo(() => {
    for (const device of devices) {
      const feedback = device.inputProfile.getFeedbackCapabilities();

      // Get dimensions of entire device for effects
      const { minRow, minCol, maxRow, maxCol } = getCoordinateRanges(
        device.inputProfile.getItems(),
      );

      const diameter = Math.sqrt(
        (maxRow - minRow) ** 2 + (maxCol - minCol) ** 2,
      );

      const grid = gameGrid({
        input: device.inputProfile,
        selection: [
          {
            selectors: ANY_LED_INTERACTIVE_ITEMS,
            minCols: FONTS['6x8'].cols,
            minRows: FONTS['6x8'].rows,
          },
          {
            selectors: ANY_LED_INTERACTIVE_ITEMS,
            minCols: FONTS['5x7'].cols,
            minRows: FONTS['5x7'].rows,
          },
          {
            selectors: ANY_LED_INTERACTIVE_ITEMS,
            minCols: FONTS['4x5'].cols,
            minRows: FONTS['4x5'].rows,
          },
        ],
      });

      let items: MidiControllerItem[];

      if (grid) {
        // We have found an appropriate grid, use that
        items = grid.selectedItems();
      } else {
        items = selectItems(
          device.inputProfile.getItems(),
          feedback,
          ANY_LED_INTERACTIVE_ITEMS,
          MIN_TARGETS,
        );

        if (items.length < MIN_TARGETS) {
          // Cannot use this device
          continue;
        }
      }

      return {
        device,
        diameter,
        items,
        grid,
      };
    }
    return null;
  }, [devices]);

  useEffect(() => {
    const unbind: Array<() => void> = [];

    for (const d of devices) {
      const { inputProfile, outputProfile } = d;
      const isSelectedDevice = deviceInfo && deviceInfo.device === d;

      if (!isSelectedDevice || !deviceInfo) {
        for (const item of d.inputProfile.getItems()) {
          d.outputProfile.setItemColor(item.id, {
            mode: 'empty',
            color: [100, 0, 0],
          });
        }
        d.outputProfile.frameFinished();
        continue;
      }

      outputProfile.clear();

      const { items, grid } = deviceInfo;

      const selectedItemIDs = new Set(items.map((item) => item.id));

      const renderInterval = createRenderInterval(d, () => {
        let textRender: RenderedText | null = null;
        let flash = false;

        if (gameStateRef.current.mode === 'countdown') {
          let text: ValidTextChar | null = null;

          const remaining =
            COUNTDOWN_MS - (Date.now() - gameStateRef.current.startTime);
          flash = Math.floor(remaining / 500) % 2 === 0;

          if (remaining < 0) {
            setGameState({
              mode: 'playing',
            });
          } else if (grid) {
            if (remaining > 2000) {
              text = '3';
            } else if (remaining > 1000) {
              text = '2';
            } else {
              text = '1';
            }
            if (text) {
              if (textRenderCache.current?.text !== text) {
                for (const f of ['6x8', '5x7', '4x5'] as const) {
                  const font = FONTS[f];
                  if (grid.cols >= font.cols && grid.rows >= font.rows) {
                    const offsetCols = Math.floor((grid.cols - font.cols) / 2);
                    const offsetRows = Math.floor((grid.rows - font.rows) / 2);
                    const render = renderText(f, [text]);
                    textRenderCache.current = {
                      text,
                      render: {
                        getValue: (col: number, row: number) => {
                          return render.getValue(
                            col - offsetCols,
                            row - offsetRows,
                          );
                        },
                      },
                    };
                    break;
                  }
                }
              }
              textRender = textRenderCache.current?.render ?? null;
            }
          }
        }

        for (const item of inputProfile.getItems()) {
          let rgb: RGB = [0, 0, 0];

          const center = getCenterPosition(item.position, true);
          if (!center) {
            outputProfile.setItemColor(item.id, {
              mode: 'empty',
              color: rgb,
            });
            continue;
          }

          if (gameStateRef.current.mode === 'ready') {
            // Make the screen green to indicate ready state
            rgb = selectedItemIDs.has(item.id) ? [0, 255, 0] : [100, 100, 100];
          } else if (gameStateRef.current.mode === 'countdown') {
            if (textRender) {
              rgb = textRender.getValue(center.col, center.row)
                ? [255, 255, 255]
                : flash
                  ? [0, 0, 255]
                  : [0, 0, 0];
            }

            // Make the screen red to indicate countdown state
          }
          for (const artifact of artifacts.current) {
            rgb = addArtifact(rgb, center, artifact);
          }
          outputProfile.setItemColor(item.id, {
            mode: selectedItemIDs.has(item.id) ? 'active' : 'empty',
            color: rgb,
          });
        }
      });

      const onMessage = (event: MidiActionEvent) => {
        if (!event.action.item) return;
        const item = inputProfile.getItem(event.action.item);
        const center = getCenterPosition(item?.position, true);
        if (!center || !item) return;
        if (event.action.action === 'button-press') {
          if (gameStateRef.current.mode === 'ready') {
            if (!selectedItemIDs.has(item.id)) return;
            setGameState({
              mode: 'countdown',
              startTime: Date.now(),
            });
          }

          // TODO
        }
      };
      inputProfile.addEventListener('action', onMessage);
      unbind.push(() => {
        inputProfile.removeEventListener('action', onMessage);
        clearInterval(renderInterval);
      });
    }

    return () => {
      for (const u of unbind) {
        u();
      }
    };
  }, [devices, changeGame, deviceInfo]);

  return (
    <Group title={GAMES['tap-a-mole'].name} direction="vertical">
      <Button
        onClick={() => {
          changeGame('main-menu');
        }}
        text="Main Menu"
      />
      {!deviceInfo ? (
        <>
          Please connect a device with at least {MIN_TARGETS} interactive items
          with LED feedback
        </>
      ) : (
        <>
          {gameState.mode === 'ready' && (
            <>Press a green button on the pad to start the game</>
          )}
          {gameState.mode === 'countdown' && <>Get ready...</>}
        </>
      )}
    </Group>
  );
};
