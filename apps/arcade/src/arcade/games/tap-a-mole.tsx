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
  getMidiCoordinatePointFingerprint,
  hasMidiCoordinatePointPosition,
  MidiControllerItemWithPointPosition,
  MidiCoordinatePoint,
} from '@talisman-midi/talisman/util';
import { addArtifact, Artifact, generateMoleHitArtifact } from '../artifacts';
import { RGB } from '@talisman-midi/talisman/color';
import {
  ANY_LED_INTERACTIVE_ITEMS,
  selectItems,
  TAP_A_MOLE_GRID_SELECTION,
} from '../item-selection';
import { createArtifactInterval, createRenderInterval } from '../rendering';
import { gameGrid } from '../grid';
import { FONTS, RenderedText, renderText, ValidTextChar } from '../text/text';
import { filter } from '../../shared/util';
import isEqual from 'lodash/isEqual';
import { TapAMoleGameState } from '../../components/proto';
import { C } from '../../components/backend';
import { useScreenSaverTimeout } from '../hooks';

const MIN_TARGETS = 8;
const COUNTDOWN_MS = 3_000;
const GAME_LENGTH_MS = 30_000;
/**
 * After missing a mole, how long should it stay visible before disappearing
 */
const MOLE_REMAIN_MS = 1_000;

const MOLE_APPEARANCE_MAX_INTERVAL_MS = 2_000;
const MOLE_APPEARANCE_MIN_INTERVAL_MS = 500;
const MOLE_SPEEDUP_FACTOR = 0.9;
const MOLE_APPEARANCE_JITTER_FACTOR = 0.4;

const MOLE_WAIT_MAX_MS = 2_000;
const MOLE_WAIT_MIN_MS = 700;
const MOLE_WAIT_SPEEDUP_FACTOR = 0.85;

const MAX_SCORE_PER_MOLE = 100;
const MIN_SCORE_PER_MOLE = 10;
/**
 * If you hit a mole within this threshold, you get the maximum score
 */
const MAX_HIT_PRECISION_MS = 30;
const MISS_PENALTY = 10;

/**
 * Return a score, between {@link MIN_SCORE_PER_MOLE} and {@link MAX_SCORE_PER_MOLE}
 * based on the hit timing.
 */
const calculateScore = (diffMs: number) => {
  /**
   * Value between 0 and 1 representing how far the received score should be between the maximum and minimum score.
   */
  const scalePosition =
    Math.max(0, diffMs - MAX_HIT_PRECISION_MS) /
    (MOLE_WAIT_MAX_MS - MAX_HIT_PRECISION_MS);
  return Math.max(
    Math.floor(
      MAX_SCORE_PER_MOLE -
        scalePosition * (MAX_SCORE_PER_MOLE - MIN_SCORE_PER_MOLE),
    ),
    0,
  );
};

export const TapAMole: FC = () => {
  const { devices, changeGame, colors } = useContext(GameContext);

  const artifacts = useRef<Artifact[]>([]);

  useEffect(() => {
    const artifactInterval = createArtifactInterval(devices, artifacts);
    return () => {
      clearInterval(artifactInterval);
    };
  }, [devices]);

  const [gameState, setGameState] = useState<TapAMoleGameState>({
    mode: 'ready',
  });

  const { resetMenuResetTimeout, clearMenuResetTimeout } =
    useScreenSaverTimeout(10_000);

  useEffect(() => {
    if (gameState.mode === 'ready') {
      // Timeout to screen-saver when user stays on the ready screen too long
      resetMenuResetTimeout();
    } else {
      // Disable screensaver timeout when actively in use / viewing score
      clearMenuResetTimeout();
    }
  }, [gameState.mode, resetMenuResetTimeout, clearMenuResetTimeout]);

  const gameData = useRef<{
    moles: Map<
      string,
      {
        position: MidiCoordinatePoint;
        appearanceMs: number;
        expiresMs: number;
        missRecorded: boolean;
      }
    >;
    nextMoleAppearanceMs: number;
    nextMoleWaitMs: number;
    moleAppearanceInterval: number;
  } | null>(null);

  const textRendering = useRef<{
    text: string;
    width: number;
    scrollPosition: number;
    render: RenderedText['getValue'];
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
        selection: TAP_A_MOLE_GRID_SELECTION,
      });

      let items: MidiControllerItemWithPointPosition[];

      if (grid) {
        // We have found an appropriate grid, use that
        items = grid.selectedItems();
      } else {
        items = selectItems(
          device.inputProfile.getItems(),
          feedback,
          ANY_LED_INTERACTIVE_ITEMS,
          undefined,
          hasMidiCoordinatePointPosition,
        );

        if (items.length < MIN_TARGETS) {
          // Cannot use this device
          continue;
        }
      }

      // Determine eligible mole locations
      const moleLocations = new Map<string, MidiCoordinatePoint>();

      for (const item of items) {
        moleLocations.set(
          getMidiCoordinatePointFingerprint(item.position),
          item.position,
        );
      }

      return {
        device,
        diameter,
        items,
        grid,
        moleLocations,
      };
    }
    return null;
  }, [devices]);

  useEffect(() => {
    const grid = deviceInfo?.grid;
    if (!grid) return;
    const gridWidth = grid.cols;
    const scrollInterval = setInterval(() => {
      if (textRendering.current) {
        if (
          textRendering.current.scrollPosition <= -textRendering.current.width
        ) {
          textRendering.current.scrollPosition = gridWidth;
        } else {
          textRendering.current.scrollPosition -= 1;
        }
      }
    }, 100);
    return () => {
      clearInterval(scrollInterval);
    };
  }, [deviceInfo]);

  const hitMole = useCallback(
    (center: MidiCoordinatePoint) => {
      const now = Date.now();
      if (!gameData.current) return;
      const fingerprint = getMidiCoordinatePointFingerprint(center);
      const mole = gameData.current.moles.get(fingerprint);
      let score = 0;
      let hit: boolean;
      if (!mole) {
        score = -MISS_PENALTY;
        hit = false;
      } else {
        if (mole.expiresMs <= now)
          // Return with no penalty
          return;
        score = calculateScore(now - mole.appearanceMs);
        hit = true;
      }
      setGameState((current) =>
        current.mode === 'playing'
          ? {
              ...current,
              score: current.score + score,
              hit: current.hit + (hit ? 1 : 0),
            }
          : current,
      );
      gameData.current.moles.delete(fingerprint);
      if (deviceInfo) {
        const diameter = deviceInfo.diameter;
        artifacts.current.push(
          generateMoleHitArtifact(
            center,
            diameter,
            colors.current,
            hit ? 'hit' : 'miss',
          ),
        );
      }
    },
    [colors, deviceInfo],
  );

  const prepareRenderedText = useCallback(
    (text: string) => {
      const grid = deviceInfo?.grid;
      if (!grid) return;
      if (!isEqual(textRendering.current?.text, text)) {
        for (const f of ['6x8', '5x7', '4x5'] as const) {
          const font = FONTS[f];
          if (grid.cols >= font.cols && grid.rows >= font.rows) {
            const render = renderText(f, text);
            const offsetRows =
              grid.minRow + Math.floor((grid.rows - font.rows) / 2);
            if (render.textWidth <= grid.cols) {
              const offsetCols =
                grid.minCol + Math.floor((grid.cols - font.cols) / 2);
              textRendering.current = {
                text,
                width: render.textWidth,
                scrollPosition: 0, // ignored
                render: (col: number, row: number) => {
                  return render.getValue(col - offsetCols, row - offsetRows);
                },
              };
            } else {
              // Scroll text
              textRendering.current = {
                text,
                width: render.textWidth,
                scrollPosition: grid.cols, // start right of grid and scroll-in
                render: (col: number, row: number) => {
                  return render.getValue(
                    col - (textRendering.current?.scrollPosition ?? 0),
                    row - offsetRows,
                  );
                },
              };
            }
            break;
          }
        }
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

      const { items, grid } = deviceInfo;

      const selectedItemIDs = new Set(items.map((item) => item.id));

      /**
       * Render interval handles both game logic & rendering.
       *
       * We do this here rather than separate intervals so that time-sensitive
       * countdowns (e.g. mole appearance) start precisely with a frame render,
       * to ensure scoring is not affected by frame-rate.
       */
      const renderInterval = createRenderInterval(d, () => {
        let flash = false;

        // Game logic & pre-rendering calculations

        const now = Date.now();
        if (gameStateRef.current.mode === 'countdown') {
          let text: ValidTextChar | null = null;

          const remaining = gameStateRef.current.gameStartTimeMs - now;
          flash = Math.floor(remaining / 500) % 2 === 0;

          if (remaining < 0) {
            setGameState({
              mode: 'playing',
              score: 0,
              gameEndTimeMs: now + GAME_LENGTH_MS,
              hit: 0,
              miss: 0,
            });
            gameData.current = {
              moleAppearanceInterval: MOLE_APPEARANCE_MAX_INTERVAL_MS,
              nextMoleWaitMs: MOLE_WAIT_MAX_MS,
              moles: new Map(),
              nextMoleAppearanceMs: now,
            };
          } else if (grid) {
            if (remaining > 2000) {
              text = '3';
            } else if (remaining > 1000) {
              text = '2';
            } else {
              text = '1';
            }
            if (text) {
              prepareRenderedText(text);
            }
          }
        } else if (gameStateRef.current.mode === 'playing') {
          if (now >= gameStateRef.current.gameEndTimeMs) {
            setGameState((current) =>
              current.mode === 'playing'
                ? {
                    ...current,
                    mode: 'finished',
                    gameFinishMs: now,
                  }
                : current,
            );
          } else {
            if (!gameData.current) {
              throw new Error('Game data is not initialized');
            }

            spawnMole: if (now >= gameData.current.nextMoleAppearanceMs) {
              const { moles, nextMoleWaitMs, moleAppearanceInterval } =
                gameData.current;
              const availableMoles = Array.from(
                filter(
                  deviceInfo.moleLocations.entries(),
                  ([k]) => !moles.has(k),
                ),
              );
              if (!availableMoles.length) {
                break spawnMole;
              }
              const moleLocation =
                availableMoles[
                  Math.floor(Math.random() * availableMoles.length)
                ];
              if (!moleLocation) {
                break spawnMole;
              }
              moles.set(moleLocation[0], {
                position: moleLocation[1],
                appearanceMs: now,
                expiresMs: now + nextMoleWaitMs,
                missRecorded: false,
              });

              // Update values for next mole
              const interval = Math.max(
                MOLE_APPEARANCE_MIN_INTERVAL_MS,
                Math.min(
                  MOLE_APPEARANCE_MAX_INTERVAL_MS,
                  moleAppearanceInterval * MOLE_SPEEDUP_FACTOR,
                ),
              );
              gameData.current.moleAppearanceInterval = interval;
              gameData.current.nextMoleWaitMs = Math.max(
                MOLE_WAIT_MIN_MS,
                Math.min(
                  MOLE_WAIT_MAX_MS,
                  nextMoleWaitMs * MOLE_WAIT_SPEEDUP_FACTOR,
                ),
              );

              // Schedule next mole appearance
              gameData.current.nextMoleAppearanceMs =
                now +
                Math.max(
                  interval +
                    (Math.random() - 0.5) * MOLE_APPEARANCE_JITTER_FACTOR,
                  MOLE_APPEARANCE_MIN_INTERVAL_MS,
                );
            }

            for (const [key, mole] of gameData.current.moles.entries()) {
              if (now >= mole.expiresMs && !mole.missRecorded) {
                mole.missRecorded = true;
                setGameState((current) =>
                  current.mode === 'playing'
                    ? {
                        ...current,
                        miss: current.miss + 1,
                      }
                    : current,
                );
              }
              if (now >= mole.expiresMs + MOLE_REMAIN_MS) {
                gameData.current.moles.delete(key);
              }
            }
          }
        } else if (gameStateRef.current.mode === 'finished') {
          prepareRenderedText(gameStateRef.current.score.toString());
        }

        // Rendering

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
            rgb = selectedItemIDs.has(item.id)
              ? colors.current.ready
              : colors.current.primary;
          } else if (gameStateRef.current.mode === 'countdown') {
            if (textRendering.current) {
              rgb = textRendering.current.render(center.col, center.row)
                ? colors.current.primary
                : flash
                  ? colors.current.secondary
                  : [0, 0, 0];
            }
          } else if (gameStateRef.current.mode === 'playing') {
            const positionFingerprint =
              getMidiCoordinatePointFingerprint(center);
            const mole = gameData.current?.moles.get(positionFingerprint);
            if (mole) {
              rgb =
                mole.expiresMs > now
                  ? colors.current.primary
                  : colors.current.error;
            }
          } else if (gameStateRef.current.mode === 'finished') {
            if (textRendering.current) {
              rgb = textRendering.current.render(center.col, center.row)
                ? colors.current.secondary
                : [0, 0, 0];
            }
          }

          // Draw artifacts before other elements / moles
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
          if (gameStateRef.current.mode === 'ready') {
            setGameState({
              mode: 'countdown',
              gameStartTimeMs: Date.now() + COUNTDOWN_MS,
            });
          } else if (gameStateRef.current.mode === 'playing') {
            hitMole(center);
          } else if (gameStateRef.current.mode === 'finished') {
            // Reset the game if it's finished and a button is pressed
            // after 1 second (we wait to avoid accidentally resetting immediately)
            if (Date.now() < gameStateRef.current.gameFinishMs + 1_000) return;
            setGameState({
              mode: 'ready',
            });
          }
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
  }, [colors, devices, changeGame, hitMole, prepareRenderedText, deviceInfo]);

  return <C.TapAMole state={gameState} />;
};
