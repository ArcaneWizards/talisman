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
  MidiGridArea,
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

/**
 * Get the largest unbroken area within the given maximum area and cell presence matrix
 *
 * Uses the "maximal rectangle" histogram-stack approach,
 * giving an overall complexity of O(C x R) time and O(R) extra space.
 *
 * When multiple rectangles share the largest area,
 * the most square one is preferred, then the first one found.
 *
 * @param maxArea The maximum area to consider
 * @param cellPresence A 2D array indicating the presence of cells, offset by the minimum row and column of the usable range,
 * indexed as `cellPresence[col][row]`
 * @returns The largest fully-present rectangle in the coordinate system of {@link maxArea},
 * or {@link maxArea} unchanged if no cells are present.
 */
export const getMaxContiguousArea = (
  maxArea: MidiGridArea,
  cellPresence: boolean[][],
): MidiGridArea => {
  const cols = cellPresence.length;
  let rows = 0;
  for (const column of cellPresence) {
    rows = Math.max(rows, column.length);
  }

  /**
   * For each row, the number of consecutive present cells ending at the current column
   */
  const heights = new Uint32Array(rows);
  /**
   * Row indexes with strictly increasing heights
   */
  const stack = new Uint32Array(rows + 1);

  let best: {
    area: number;
    squareness: number;
    minCol: number;
    maxCol: number;
    minRow: number;
    maxRow: number;
  } | null = null;

  for (let c = 0; c < cols; c++) {
    const column = cellPresence[c];
    for (let r = 0; r < rows; r++) {
      heights[r] = column?.[r] ? (heights[r] ?? 0) + 1 : 0;
    }

    let stackSize = 0;
    // Iterate one past the end with a height of 0 to flush the stack
    for (let r = 0; r <= rows; r++) {
      const height = r < rows ? (heights[r] ?? 0) : 0;
      while (stackSize > 0) {
        const top = stack[stackSize - 1] ?? 0;
        const topHeight = heights[top] ?? 0;
        if (topHeight < height) {
          break;
        }
        stackSize--;
        if (topHeight === 0) {
          continue;
        }
        // The rectangle of height topHeight extends from just after the
        // previous (strictly lower) stack entry up to (but excluding) r
        const minRow = stackSize > 0 ? (stack[stackSize - 1] ?? 0) + 1 : 0;
        const width = r - minRow;
        const area = width * topHeight;
        const squareness = Math.abs(width - topHeight);
        if (
          !best ||
          area > best.area ||
          (area === best.area && squareness < best.squareness)
        ) {
          best = {
            area,
            squareness,
            minCol: c - topHeight + 1,
            maxCol: c,
            minRow,
            maxRow: r - 1,
          };
        }
      }
      stack[stackSize++] = r;
    }
  }

  if (!best) {
    return maxArea;
  }

  return {
    minCol: maxArea.minCol + best.minCol,
    maxCol: maxArea.minCol + best.maxCol,
    minRow: maxArea.minRow + best.minRow,
    maxRow: maxArea.minRow + best.maxRow,
  };
};

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
  }

  /**
   * Max boundaries of elements from {@link usableItems}
   */
  const usableRange = getCoordinateRanges(usableItems);

  const cellPresence: boolean[][] = Array.from(
    { length: usableRange.maxCol - usableRange.minCol + 1 },
    () =>
      Array.from(
        { length: usableRange.maxRow - usableRange.minRow + 1 },
        () => false,
      ),
  );

  for (const item of usableItems) {
    if (isExplicitCoordinate(item.position)) {
      const row = item.position.row - usableRange.minRow;
      const col = item.position.col - usableRange.minCol;
      if (col < 0) {
        continue;
      }
      const colArray = cellPresence[col];
      if (!colArray || row < 0 || row >= colArray.length) {
        continue;
      }
      colArray[row] = true;
    }
  }

  const { maxCol, maxRow, minCol, minRow } = getMaxContiguousArea(
    usableRange,
    cellPresence,
  );

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
  const grid: RGB[][] = Array.from({ length: maxCol - minCol + 1 }, () =>
    Array.from({ length: maxRow - minRow + 1 }, () => background),
  );

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
      if (col < 0) {
        return;
      }
      const colArray = grid[col];
      if (!colArray || row < 0 || row >= colArray.length) {
        return;
      }
      colArray[row] = color;
    },
    render: (finish = true) => {
      for (const item of input.getItems()) {
        let rgb: RGB | null = null;
        let count = 0;
        for (const pos of getPositions(item.position)) {
          const row = pos.row - minRow;
          const col = pos.col - minCol;
          if (col >= 0 && row >= 0) {
            const cell = grid[col]?.[row];
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
