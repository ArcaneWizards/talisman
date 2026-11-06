import { MidiFeedbackProfile, MidiProfile } from '@talisman-midi/talisman';
import { RGB } from '@talisman-midi/talisman/color';
import {
  getCenterPosition,
  getCoordinateRanges,
  getPositions,
  MidiCoordinatePoint,
} from '@talisman-midi/talisman/util';

type GameGridArgs = {
  background: RGB;
  input: MidiProfile;
  output: MidiFeedbackProfile;
};

export const gameGrid = ({ input, output, background }: GameGridArgs) => {
  const { minCol, maxCol, minRow, maxRow } = getCoordinateRanges(
    input.getItems(),
  );

  const centerPositions: Map<string, MidiCoordinatePoint> = new Map();

  for (const item of input.getItems()) {
    const center = getCenterPosition(item.position, true);
    if (center) {
      centerPositions.set(item.id, center);
    }
  }

  const grid: RGB[][] = Array.from({ length: maxRow - minRow + 1 }, () =>
    Array.from({ length: maxCol - minCol + 1 }, () => background),
  );

  return {
    rows: maxCol - minCol + 1,
    cols: maxRow - minRow + 1,
    getCenterPosition: (itemId: string) => centerPositions.get(itemId) ?? null,
    setColor: (position: MidiCoordinatePoint, color: RGB) => {
      const row = position.row - minRow;
      const col = position.col - minCol;
      if (
        row >= 0 &&
        row < grid.length &&
        col >= 0 &&
        col < (grid[0]?.length ?? 0)
      ) {
        grid[row]![col] = color;
      }
    },
    render: () => {
      for (const item of input.getItems()) {
        let rgb: RGB | null = null;
        let count = 0;
        for (const pos of getPositions(item.position)) {
          const row = pos.row - minRow;
          const col = pos.col - minCol;
          if (
            row >= 0 &&
            row < grid.length &&
            col >= 0 &&
            col < (grid[0]?.length ?? 0)
          ) {
            const cell = grid[row]?.[col];
            if (cell) {
              if (!rgb) {
                rgb = cell;
              } else {
                // Add the cell's RGB values to the running average
                rgb = [
                  (rgb[0] * count + cell[0]) / (count + 1),
                  (rgb[1] * count + cell[1]) / (count + 1),
                  (rgb[2] * count + cell[2]) / (count + 1),
                ];
              }
              count++;
            }
          }
        }
        if (rgb) {
          output.setItemColor(item.id, {
            mode: 'active',
            color: rgb,
          });
        }
      }
      output.frameFinished();
    },
  };
};
