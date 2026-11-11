import {
  FC,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { GameContext } from './context';
import { MidiActionEvent } from '@talisman-midi/talisman';
import {
  getCenterPosition,
  getCoordinateRanges,
  MidiCoordinatePoint,
} from '@talisman-midi/talisman/util';
import { addArtifact, Artifact } from '../artifacts';
import { addRGB, RGB } from '@talisman-midi/talisman/color';
import { FOUR_IN_A_ROW_GRID_SELECTION } from '../item-selection';
import { createArtifactInterval, createRenderInterval } from '../rendering';
import { gameGrid } from '../grid';
import { FourInARowState } from '../../components/proto';
import { C } from '../../components/backend';
import { useScreenSaverTimeout } from '../hooks';

const PULSE_RATE_MS = 1000;

type CellState = {
  type: 'placed' | 'won';
  player: number;
} | null;

export const FourInARow: FC = () => {
  const { devices, changeGame, colors } = useContext(GameContext);

  const artifacts = useRef<Artifact[]>([]);

  useEffect(() => {
    const artifactInterval = createArtifactInterval(devices, artifacts);
    return () => {
      clearInterval(artifactInterval);
    };
  }, [devices]);

  const [gameState, setGameState] = useState<FourInARowState>({
    mode: 'ready',
  });

  const { resetMenuResetTimeout, clearMenuResetTimeout } =
    useScreenSaverTimeout(10_000);

  const gameData = useRef<{
    /**
     * [column, row] representation of the game grid -> current cell state
     */
    grid: CellState[][];
    allowInputAfter: number;
  }>({
    grid: [],
    allowInputAfter: 0,
  });

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
        selection: FOUR_IN_A_ROW_GRID_SELECTION,
      });

      const items = grid?.selectedItems();

      if (!items || !grid) continue;

      return {
        feedback,
        device,
        diameter,
        items,
        grid,
      };
    }
    return null;
  }, [devices]);

  useEffect(() => {
    if (deviceInfo) {
      gameData.current.grid = Array.from({ length: deviceInfo.grid.cols }, () =>
        Array.from({ length: deviceInfo.grid.rows }, () => null),
      );
      gameData.current.allowInputAfter = Date.now();
    }
  }, [deviceInfo]);

  useEffect(() => {
    if (gameState.mode === 'ready' && deviceInfo) {
      // Timeout to screen-saver when user stays on the ready screen too long
      // and there is a compatible connected device.
      resetMenuResetTimeout();
    } else {
      // Disable screensaver timeout when actively in use / viewing score
      clearMenuResetTimeout();
    }
  }, [
    gameState.mode,
    deviceInfo,
    resetMenuResetTimeout,
    clearMenuResetTimeout,
  ]);

  const touchButton = useCallback(
    (center: MidiCoordinatePoint) => {
      if (!deviceInfo) return;
      if (gameStateRef.current.mode === 'ready') {
        setGameState({
          mode: 'playing',
          player: Math.round(Math.random()),
        });
      } else if (gameStateRef.current.mode === 'playing') {
        const column =
          gameData.current.grid[deviceInfo.grid.minCol + center.col];

        if (!column) {
          throw new Error('Invalid column');
        }

        let row = deviceInfo.grid.rows;
        while (row === null || row > 0) {
          if (column[row - 1] !== null) {
            break;
          }
          row--;
        }

        if (row < deviceInfo.grid.rows) {
          // Successfully found available position
          column[row] = { type: 'placed', player: gameStateRef.current.player };
          setGameState({
            mode: 'playing',
            player: 1 - gameStateRef.current.player,
          });
        }
      } else if (gameStateRef.current.mode === 'finished') {
        setGameState({
          mode: 'ready',
        });
      }
    },
    [deviceInfo],
  );

  useEffect(() => {
    const unbind: Array<() => void> = [];

    for (const d of devices) {
      const { inputProfile, outputProfile } = d;
      const isSelectedDevice = deviceInfo && deviceInfo.device === d;

      if (!isSelectedDevice || !deviceInfo) {
        for (const item of d.inputProfile.getItems()) {
          d.outputProfile.setItemColor(item.id, {
            mode: 'empty',
            color: colors.current.error,
          });
        }
        d.outputProfile.frameFinished();
        continue;
      }

      outputProfile.clear();

      const { items, grid, feedback } = deviceInfo;

      const selectedItemIDs = new Set(items.map((item) => item.id));
      /**
       * Render interval handles both game logic & rendering.
       *
       * We do this here rather than separate intervals so that time-sensitive
       * countdowns (e.g. mole appearance) start precisely with a frame render,
       * to ensure scoring is not affected by frame-rate.
       */
      const renderInterval = createRenderInterval(d, () => {
        if (!gameData.current) {
          throw new Error('Game data is not initialized');
        }

        const now = Date.now();
        const phase =
          Math.sin(
            ((now - gameData.current.allowInputAfter) / PULSE_RATE_MS) *
              Math.PI *
              2,
          ) *
            0.5 +
          0.5;
        const faceOpacity = phase * 0.75 + 0.25;

        for (const item of inputProfile.getItems()) {
          let rgb: RGB = [0, 0, 0];
          const fdbk = !!item.feedback && feedback[item.feedback]?.led;
          const isSingleLed = fdbk && fdbk?.type === 'single';

          if (isSingleLed) {
            // Don't render single LEDs at all for this game
            continue;
          }

          // Palette is not making full use of MIDI notes
          // Limit animations
          const isSmallPallete =
            fdbk && fdbk?.type === 'palette' && fdbk.palette.length <= 100;

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
            rgb = selectedItemIDs.has(item.id)
              ? colors.current.ready
              : colors.current.primary;
          } else if (gameStateRef.current.mode === 'playing') {
            if (selectedItemIDs.has(item.id)) {
              const spotData =
                gameData.current.grid[grid.minCol + center.col]?.[
                  center.row - grid.minRow
                ];
              if (spotData) {
                if (spotData.type === 'placed') {
                  rgb =
                    spotData.player === 0
                      ? colors.current.primary
                      : colors.current.secondary;
                }
              } else if (
                now > gameData.current.allowInputAfter &&
                center.row === grid.maxRow
              ) {
                const color =
                  gameStateRef.current.player === 0
                    ? colors.current.primary
                    : colors.current.secondary;
                const opacity = isSmallPallete
                  ? Math.round(faceOpacity)
                  : faceOpacity;
                rgb = addRGB(rgb, color, opacity);
              }
            }
          } else if (gameStateRef.current.mode === 'finished') {
            // TODO
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
          if (!selectedItemIDs.has(item.id)) return;
          touchButton(center);
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
  }, [colors, devices, changeGame, touchButton, deviceInfo]);

  const finalGameState: FourInARowState =
    devices.length === 0 || !deviceInfo
      ? {
          mode: 'error',
          error: `Please connect a device with at least a 4x4 grid`,
        }
      : gameState;

  return <C.FourInARow state={finalGameState} />;
};
