import {
  ComponentPropsWithoutRef,
  FC,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Game } from '../../../proto';
import { GAMES } from '../../../../arcade/games/context';
import {
  addArtifact,
  advanceArtifact,
  Artifact,
  generateFXArtifact,
  generateMoleHitArtifact,
  generateScreenSaverArtifact,
} from '../../../../arcade/artifacts';
import { isDefined } from '../../../../shared/util';
import { COLORS, RGB } from '@talisman-midi/talisman/color';
import { MidiCoordinatePoint } from '@talisman-midi/talisman/util';
import { RootContext } from '../context';

type ThumbnailProps = Omit<ComponentPropsWithoutRef<'svg'>, 'viewBox'> & {
  game: Game;
};

const COLS = 8;
const ROWS = 6;
const GAP_RATIO = 0.2;
const BORDER_WIDTH = 0.4;

const DIAMETER = Math.sqrt(COLS ** 2 + ROWS ** 2);

export const Thumbnail: FC<ThumbnailProps> = ({ game, ...props }) => {
  const { colors } = useContext(RootContext);

  const width = COLS + (COLS + 1) * GAP_RATIO + 2 * BORDER_WIDTH;
  const height = ROWS + (ROWS + 1) * GAP_RATIO + 2 * BORDER_WIDTH;

  const [artifacts, setArtifacts] = useState<Artifact[]>([]);

  useEffect(() => {
    let lastFrame = Date.now();

    const runFrame = () => {
      const deltaMs = Date.now() - lastFrame;

      setArtifacts((prev) =>
        prev.map((a) => advanceArtifact(a, deltaMs)).filter(isDefined),
      );

      lastFrame = Date.now();
      frame = requestAnimationFrame(runFrame);
    };

    let frame = requestAnimationFrame(runFrame);

    return () => cancelAnimationFrame(frame);
  }, []);

  const appendArtifacts = useCallback((...artifacts: Artifact[]) => {
    setArtifacts((prev) => [...prev, ...artifacts]);
  }, []);

  useEffect(() => {
    if (game === 'screen-saver' || game === 'fx-playground') {
      const generateArtifact = () => {
        appendArtifacts(
          (game === 'screen-saver'
            ? generateScreenSaverArtifact
            : generateFXArtifact)(
            {
              row: Math.round((ROWS - 1) * Math.random()),
              col: Math.round((COLS - 1) * Math.random()),
            },
            DIAMETER,
          ),
        );
      };

      const artifactGenerator = setInterval(
        generateArtifact,
        game === 'screen-saver' ? 2_000 : 700,
      );

      generateArtifact();

      return () => clearInterval(artifactGenerator);
    }
    if (game === 'tap-a-mole') {
      const generateMole = () => {
        const position: MidiCoordinatePoint = {
          row: Math.round((ROWS - 1) * Math.random()),
          col: Math.round((COLS - 1) * Math.random()),
        };
        appendArtifacts({
          type: 'dot',
          position,
          color: colors.primary,
          expiresMs: Date.now() + 500,
        });
        setTimeout(() => {
          appendArtifacts(
            generateMoleHitArtifact(
              position,
              DIAMETER,
              colors,
              Math.random() > 0.5 ? 'hit' : 'miss',
            ),
          );
        }, 500);
      };
      const moleGenerator = setInterval(generateMole, 800);

      generateMole();

      return () => clearInterval(moleGenerator);
    }
    if (game === 'four-in-a-row') {
      const ANIMATION_LOOP_INTERVAL = 2500;
      const DROP_TIME_MS = 300;

      const startGameAnimation = () => {
        const now = Date.now();
        const expiresMs = now + ANIMATION_LOOP_INTERVAL;
        appendArtifacts(
          {
            type: 'dot',
            position: { col: 1, row: 0 },
            color: colors.secondary,
            expiresMs,
          },
          {
            type: 'dot',
            position: { col: 2, row: 0 },
            color: colors.primary,
            expiresMs,
          },
          {
            type: 'dot',
            position: { col: 3, row: 0 },
            color: colors.secondary,
            expiresMs,
          },
          {
            type: 'dot',
            position: { col: 4, row: 0 },
            color: colors.primary,
            expiresMs,
          },
          {
            type: 'dot',
            position: { col: 5, row: 0 },
            color: colors.secondary,
            expiresMs,
          },
          {
            type: 'dot',
            position: { col: 3, row: 1 },
            color: colors.primary,
            expiresMs,
          },
          {
            type: 'dot',
            position: { col: 4, row: 1 },
            color: colors.secondary,
            expiresMs,
          },
          {
            type: 'dot',
            position: { col: 4, row: 1 },
            color: colors.primary,
            expiresMs,
          },
          {
            type: 'dot',
            position: { col: 4, row: 1 },
            color: colors.secondary,
            expiresMs,
          },
          {
            type: 'dot',
            position: { col: 5, row: 1 },
            color: colors.primary,
            expiresMs,
          },
          {
            type: 'dot',
            position: { col: 5, row: 2 },
            color: colors.secondary,
            expiresMs,
          },
          {
            type: 'dot',
            position: { col: 5, row: 3 },
            color: colors.primary,
            expiresMs,
          },
          {
            type: 'drop',
            target: { col: 4, row: 2 },
            color: colors.primary,
            endTimeMs: now + DROP_TIME_MS,
            rowsPerMs: ROWS / DROP_TIME_MS,
            trailFadeMs: 500,
          },
        );

        setTimeout(() => {
          appendArtifacts(
            {
              type: 'dot',
              position: { col: 4, row: 2 },
              color: colors.primary,
              expiresMs,
            },
            ...Array.from({ length: 4 }).map((_, i) => ({
              type: 'dot' as const,
              position: { col: i + 2, row: i },
              color: COLORS.WHITE,
              expiresMs,
              pulseMs: 500,
            })),
          );
        }, DROP_TIME_MS);
      };

      const gameAnimationGenerator = setInterval(
        startGameAnimation,
        ANIMATION_LOOP_INTERVAL,
      );

      startGameAnimation();

      return () => clearInterval(gameAnimationGenerator);
    }
  }, [colors, game, appendArtifacts]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} {...props}>
      {Array.from({ length: ROWS }).map((_, row) =>
        Array.from({ length: COLS }).map((_, col) => {
          let rgb: RGB = [0, 0, 0];

          for (const artifact of artifacts) {
            rgb = addArtifact(rgb, { row, col }, artifact);
          }

          const x = BORDER_WIDTH + GAP_RATIO + col * (1 + GAP_RATIO);
          const y =
            BORDER_WIDTH + GAP_RATIO + (ROWS - row - 1) * (1 + GAP_RATIO);
          return (
            <rect
              key={`${row}-${col}`}
              x={x}
              y={y}
              width={1}
              height={1}
              rx={0.2}
              ry={0.2}
              fill={`rgb(${rgb.join(',')})`}
            />
          );
        }),
      )}
      <rect
        x={BORDER_WIDTH / 2}
        y={BORDER_WIDTH / 2}
        width={width - BORDER_WIDTH}
        height={height - BORDER_WIDTH}
        rx={0.2}
        ry={0.2}
        fill="none"
        stroke={`var(--sigil-border)`}
        strokeWidth={BORDER_WIDTH}
      />
      <rect
        x={BORDER_WIDTH / 2}
        y={BORDER_WIDTH / 2}
        width={width - BORDER_WIDTH}
        height={height - BORDER_WIDTH}
        rx={0.2}
        ry={0.2}
        fill="none"
        stroke={`rgb(${GAMES[game].color.join(',')})`}
        strokeWidth={BORDER_WIDTH / 2}
      />
    </svg>
  );
};
