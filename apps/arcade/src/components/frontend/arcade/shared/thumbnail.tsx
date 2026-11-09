import {
  ComponentPropsWithoutRef,
  FC,
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
import { RGB } from '@talisman-midi/talisman/color';
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

  useEffect(() => {
    if (game === 'screen-saver' || game === 'fx-playground') {
      const generateArtifact = () => {
        setArtifacts((prev) => [
          ...prev,
          (game === 'screen-saver'
            ? generateScreenSaverArtifact
            : generateFXArtifact)(
            {
              row: Math.round((ROWS - 1) * Math.random()),
              col: Math.round((COLS - 1) * Math.random()),
            },
            DIAMETER,
          ),
        ]);
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
        setArtifacts((prev) => [
          ...prev,
          {
            type: 'dot',
            position,
            color: colors.primary,
            expiresMs: Date.now() + 500,
          },
        ]);
        setTimeout(() => {
          setArtifacts((prev) => [
            ...prev,
            generateMoleHitArtifact(
              position,
              DIAMETER,
              colors,
              Math.random() > 0.5 ? 'hit' : 'miss',
            ),
          ]);
        }, 500);
      };
      const moleGenerator = setInterval(generateMole, 800);

      generateMole();

      return () => clearInterval(moleGenerator);
    }
  }, [colors, game]);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} {...props}>
      {Array.from({ length: ROWS }).map((_, row) =>
        Array.from({ length: COLS }).map((_, col) => {
          let rgb: RGB = [0, 0, 0];

          for (const artifact of artifacts) {
            rgb = addArtifact(rgb, { row, col }, artifact);
          }

          const x = BORDER_WIDTH + GAP_RATIO + col * (1 + GAP_RATIO);
          const y = BORDER_WIDTH + GAP_RATIO + row * (1 + GAP_RATIO);
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
