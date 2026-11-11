import { MidiProfile } from '@talisman-midi/talisman';
import {
  getCenterPosition,
  getCoordinateRanges,
  hasMidiCoordinatePointPosition,
  MidiControllerItemWithPointPosition,
  MidiCoordinatePoint,
  MidiGridArea,
} from '@talisman-midi/talisman/util';
import { ItemSelector, selectItems } from './item-selection';

type GameGridArgs = {
  input: MidiProfile;
  selection: Iterable<{
    selectors: Iterable<ItemSelector>;
    minCols?: number;
    minRows?: number;
  }>;
};

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

export const buildCellPresence = (
  usableItems: MidiControllerItemWithPointPosition[],
) => {
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

  return { usableRange, cellPresence };
};

export const gameGrid = ({ input, selection }: GameGridArgs) => {
  const feedback = input.getFeedbackCapabilities();

  for (const { selectors, minCols, minRows } of selection) {
    const usableItems: MidiControllerItemWithPointPosition[] = selectItems(
      input.getItems(),
      feedback,
      selectors,
      undefined,
      hasMidiCoordinatePointPosition,
    );

    const { usableRange, cellPresence } = buildCellPresence(usableItems);

    const { maxCol, maxRow, minCol, minRow } = getMaxContiguousArea(
      usableRange,
      cellPresence,
    );
    const rows = maxRow - minRow + 1;
    const cols = maxCol - minCol + 1;

    if (minRows && rows < minRows) {
      continue;
    }
    if (minCols && cols < minCols) {
      continue;
    }

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

    return {
      minCol,
      minRow,
      maxCol,
      maxRow,
      rows,
      cols,
      getCenterPosition: (itemId: string) =>
        centerPositions.get(itemId) ?? null,
      selectedItems: (): MidiControllerItemWithPointPosition[] => usableItems,
    };
  }

  return null;
};

export type GridData = Exclude<ReturnType<typeof gameGrid>, null>;
