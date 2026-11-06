import {
  MidiControllerItem,
  MidiCoordinateInfo,
  MidiFeedbackProfile,
  MidiProfile,
} from '@talisman-midi/talisman';
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

const isExplicitCoordinate = (
  coordinate: MidiCoordinateInfo | undefined,
): coordinate is MidiCoordinatePoint =>
  typeof coordinate?.row === 'number' && typeof coordinate?.col === 'number';

const coordinateString = (coordinate: MidiCoordinatePoint) =>
  `${coordinate.row}:${coordinate.col}`;

export const gameGrid = ({ input, output, background }: GameGridArgs) => {
  const usableFeedback = new Set(
    Object.entries(input.getFeedbackCapabilities())
      .filter(([, { led }]) => led?.type === 'rgb' || led?.type === 'palette')
      .map(([id]) => id),
  );

  /**
   * All items with:
   *
   * - some form of color feedback
   * - explicit row and column positions (i.e. not a range)
   * - a nature defined (i.e. some form of input, and not just output)
   */
  const usableItems: MidiControllerItem[] = [];
  const cellPresence: Set<string> = new Set();
  for (const item of input.getItems()) {
    if (!item.feedback || !usableFeedback.has(item.feedback)) {
      // No usable color feedback
      continue;
    }
    if (!isExplicitCoordinate(item.position)) {
      continue;
    }
    if (
      !item.note?.some((n) => n.nature) &&
      !item.controlChange?.some((n) => n.nature)
    ) {
      // No nature defined (i.e. not an input)
      continue;
    }
    usableItems.push(item);
    cellPresence.add(coordinateString(item.position));
  }

  /**
   * Max boundaries of elements from {@link usableItems}
   */
  const usableRange = getCoordinateRanges(usableItems);

  const { maxCol, maxRow } = usableRange;

  // TODO: restrict ranges to usable grids only

  /**
   * Center position for ALL items (not just grid items)
   */
  const centerPositions: Map<string, MidiCoordinatePoint> = new Map();
  for (const item of input.getItems()) {
    const center = getCenterPosition(item.position, true);
    if (center) {
      centerPositions.set(item.id, center);
    }
  }
  const { minCol, minRow } = usableRange;
  const grid: RGB[][] = Array.from({ length: maxRow - minRow + 1 }, () =>
    Array.from({ length: maxCol - minCol + 1 }, () => background),
  );

  console.log({ minCol, minRow, maxCol, maxRow });

  return {
    rows: maxCol - minCol + 1,
    cols: maxRow - minRow + 1,
    getCenterPosition: (itemId: string) => centerPositions.get(itemId) ?? null,
    /**
     * Set a color in the "usable" grid coordinate system
     */
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
    render: (finish = true) => {
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
      if (finish) {
        output.frameFinished();
      }
    },
  };
};
