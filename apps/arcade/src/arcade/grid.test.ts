import { describe, it, expect } from '@jest/globals';
import {
  hasMidiCoordinatePointPosition,
  type MidiControllerItemWithPointPosition,
  type MidiGridArea,
} from '@talisman-midi/talisman/util';

import { buildCellPresence, gameGrid, getMaxContiguousArea } from './grid';
import {
  ANY_LED_INTERACTIVE_ITEMS,
  selectItems,
  TAP_A_MOLE_GRID_SELECTION,
} from './item-selection';
import { KNOWN_MIDI_PROFILES } from '@talisman-midi/profiles';

/**
 * Shorthand for an inclusive rectangle in absolute coordinates
 */
const rect = (
  minCol: number,
  minRow: number,
  maxCol: number,
  maxRow: number,
): MidiGridArea => ({ minCol, minRow, maxCol, maxRow });

const areaOf = ({ minCol, maxCol, minRow, maxRow }: MidiGridArea) =>
  (maxCol - minCol + 1) * (maxRow - minRow + 1);

/**
 * Build the bounding area and `cellPresence[col][row]` matrix
 * (in the same shape as `gameGrid` builds it) for the union of the given rectangles
 */
const presenceFromRects = (
  ...rects: MidiGridArea[]
): { area: MidiGridArea; presence: boolean[][] } => {
  const area: MidiGridArea = {
    minCol: Math.min(...rects.map((r) => r.minCol)),
    maxCol: Math.max(...rects.map((r) => r.maxCol)),
    minRow: Math.min(...rects.map((r) => r.minRow)),
    maxRow: Math.max(...rects.map((r) => r.maxRow)),
  };
  const presence = Array.from({ length: area.maxCol - area.minCol + 1 }, () =>
    Array.from({ length: area.maxRow - area.minRow + 1 }, () => false),
  );
  for (const r of rects) {
    for (let col = r.minCol; col <= r.maxCol; col++) {
      for (let row = r.minRow; row <= r.maxRow; row++) {
        presence[col - area.minCol]![row - area.minRow] = true;
      }
    }
  }
  return { area, presence };
};

/**
 * Parse an ASCII grid where each line is a row and each character a column,
 * `#` marking a present cell.
 */
const presenceFromAscii = (
  ascii: string,
): { area: MidiGridArea; presence: boolean[][] } => {
  const lines = ascii
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const cols = Math.max(...lines.map((l) => l.length));
  const presence = Array.from({ length: cols }, (_, col) =>
    lines.map((line) => line[col] === '#'),
  );
  return {
    area: rect(0, 0, cols - 1, lines.length - 1),
    presence,
  };
};

const isFullyPresent = (
  area: MidiGridArea,
  result: MidiGridArea,
  presence: boolean[][],
) => {
  for (let col = result.minCol; col <= result.maxCol; col++) {
    for (let row = result.minRow; row <= result.maxRow; row++) {
      if (!presence[col - area.minCol]?.[row - area.minRow]) {
        return false;
      }
    }
  }
  return true;
};

/**
 * O(C^3 x R^3) reference implementation of the largest present rectangle area
 */
const bruteForceMaxArea = (presence: boolean[][]): number => {
  const cols = presence.length;
  const rows = presence[0]?.length ?? 0;
  let best = 0;
  for (let c0 = 0; c0 < cols; c0++) {
    for (let c1 = c0; c1 < cols; c1++) {
      for (let r0 = 0; r0 < rows; r0++) {
        for (let r1 = r0; r1 < rows; r1++) {
          let full = true;
          for (let c = c0; c <= c1 && full; c++) {
            for (let r = r0; r <= r1 && full; r++) {
              full = !!presence[c]?.[r];
            }
          }
          if (full) {
            best = Math.max(best, (c1 - c0 + 1) * (r1 - r0 + 1));
          }
        }
      }
    }
  }
  return best;
};

/**
 * Run the algorithm and check the invariants that should always hold:
 * the result is fully present, within the area, and of maximal size.
 */
const run = ({
  area,
  presence,
}: {
  area: MidiGridArea;
  presence: boolean[][];
}) => {
  const result = getMaxContiguousArea(area, presence);
  expect(result.minCol).toBeGreaterThanOrEqual(area.minCol);
  expect(result.maxCol).toBeLessThanOrEqual(area.maxCol);
  expect(result.minRow).toBeGreaterThanOrEqual(area.minRow);
  expect(result.maxRow).toBeLessThanOrEqual(area.maxRow);
  expect(isFullyPresent(area, result, presence)).toBe(true);
  expect(areaOf(result)).toBe(bruteForceMaxArea(presence));
  return result;
};

describe('getMaxContiguousArea', () => {
  describe('degenerate inputs', () => {
    it('returns the max area unchanged when there are no columns', () => {
      const area = rect(Infinity, Infinity, -Infinity, -Infinity);
      expect(getMaxContiguousArea(area, [])).toEqual(area);
    });

    it('returns the max area unchanged when no cells are present', () => {
      const area = rect(0, 0, 2, 2);
      const presence = [
        [false, false, false],
        [false, false, false],
        [false, false, false],
      ];
      expect(getMaxContiguousArea(area, presence)).toEqual(area);
    });

    it('handles a single cell', () => {
      expect(run(presenceFromRects(rect(3, 4, 3, 4)))).toEqual(
        rect(3, 4, 3, 4),
      );
    });

    it('handles a single cell surrounded by gaps', () => {
      expect(
        run(
          presenceFromAscii(`
            ...
            .#.
            ...
          `),
        ),
      ).toEqual(rect(1, 1, 1, 1));
    });
  });

  describe('single rectangle', () => {
    it('returns a fully present square grid', () => {
      expect(run(presenceFromRects(rect(0, 0, 7, 7)))).toEqual(
        rect(0, 0, 7, 7),
      );
    });

    it('returns a fully present wide grid', () => {
      expect(run(presenceFromRects(rect(0, 0, 8, 1)))).toEqual(
        rect(0, 0, 8, 1),
      );
    });

    it('returns a fully present tall grid', () => {
      expect(run(presenceFromRects(rect(0, 0, 1, 8)))).toEqual(
        rect(0, 0, 1, 8),
      );
    });

    it('respects non-zero and negative offsets', () => {
      expect(run(presenceFromRects(rect(-3, 5, 2, 9)))).toEqual(
        rect(-3, 5, 2, 9),
      );
    });

    it('handles a single row', () => {
      expect(run(presenceFromRects(rect(0, 0, 5, 0)))).toEqual(
        rect(0, 0, 5, 0),
      );
    });

    it('handles a single column', () => {
      expect(run(presenceFromRects(rect(0, 0, 0, 5)))).toEqual(
        rect(0, 0, 0, 5),
      );
    });
  });

  describe('two rectangles', () => {
    it('identical rectangles', () => {
      expect(
        run(presenceFromRects(rect(1, 1, 4, 4), rect(1, 1, 4, 4))),
      ).toEqual(rect(1, 1, 4, 4));
    });

    it('one rectangle entirely containing the other', () => {
      expect(
        run(presenceFromRects(rect(0, 0, 7, 7), rect(2, 2, 4, 4))),
      ).toEqual(rect(0, 0, 7, 7));
    });

    it('cross shape with a wider horizontal bar', () => {
      // 8x2 horizontal bar vs 2x6 vertical bar
      expect(
        run(presenceFromRects(rect(0, 2, 7, 3), rect(3, 0, 4, 5))),
      ).toEqual(rect(0, 2, 7, 3));
    });

    it('cross shape with a taller vertical bar', () => {
      // 6x2 horizontal bar vs 2x8 vertical bar
      expect(
        run(presenceFromRects(rect(0, 3, 5, 4), rect(2, 0, 3, 7))),
      ).toEqual(rect(2, 0, 3, 7));
    });

    it('symmetric cross shape picks one of the arms', () => {
      const result = run(presenceFromRects(rect(0, 2, 5, 3), rect(2, 0, 3, 5)));
      expect([rect(0, 2, 5, 3), rect(2, 0, 3, 5)]).toContainEqual(result);
    });

    it('plus shape with thick arms picks one of the tied arms', () => {
      // 6x4 horizontal and 4x6 vertical bars: both are 24 and equally square
      const result = run(presenceFromRects(rect(0, 1, 5, 4), rect(1, 0, 4, 5)));
      expect(areaOf(result)).toBe(24);
    });

    it('corner overlap with one smaller rectangle', () => {
      // 4x4 at the origin, 3x3 overlapping only its bottom-right cell
      expect(
        run(presenceFromRects(rect(0, 0, 3, 3), rect(3, 3, 5, 5))),
      ).toEqual(rect(0, 0, 3, 3));
    });

    it('corner overlap with one smaller rectangle (smaller first)', () => {
      expect(
        run(presenceFromRects(rect(0, 0, 2, 2), rect(2, 2, 5, 5))),
      ).toEqual(rect(2, 2, 5, 5));
    });

    it('corner overlap with equal-sized rectangles picks one of them', () => {
      const result = run(presenceFromRects(rect(0, 0, 2, 2), rect(2, 2, 4, 4)));
      expect([rect(0, 0, 2, 2), rect(2, 2, 4, 4)]).toContainEqual(result);
    });

    it('anti-diagonal corner overlap', () => {
      // bottom-left / top-right arrangement
      expect(
        run(presenceFromRects(rect(0, 3, 3, 6), rect(3, 0, 5, 3))),
      ).toEqual(rect(0, 3, 3, 6));
    });

    it('partial edge overlap where the union strip beats both rectangles', () => {
      // 4x4 (16) and 8x2 (16), but rows 1..2 span cols 0..9 (20)
      expect(
        run(presenceFromRects(rect(0, 0, 3, 3), rect(2, 1, 9, 2))),
      ).toEqual(rect(0, 1, 9, 2));
    });

    it('adjacent rectangles with different heights (step shape)', () => {
      // 3x6 (18) next to 4x3, the shared 7x3 strip is 21
      expect(
        run(presenceFromRects(rect(0, 0, 2, 5), rect(3, 0, 6, 2))),
      ).toEqual(rect(0, 0, 6, 2));
    });

    it('adjacent rectangles where the taller one wins', () => {
      // 3x8 (24) next to 2x2, the shared strip is only 5x2 (10)
      expect(
        run(presenceFromRects(rect(0, 0, 2, 7), rect(3, 3, 4, 4))),
      ).toEqual(rect(0, 0, 2, 7));
    });

    it('adjacent rectangles with the same height merge', () => {
      expect(
        run(presenceFromRects(rect(0, 0, 2, 3), rect(3, 0, 5, 3))),
      ).toEqual(rect(0, 0, 5, 3));
    });

    it('vertically stacked rectangles with the same width merge', () => {
      expect(
        run(presenceFromRects(rect(0, 0, 3, 2), rect(0, 3, 3, 5))),
      ).toEqual(rect(0, 0, 3, 5));
    });

    it('T shape', () => {
      // 7x2 top bar, 2x6 stem
      expect(
        run(presenceFromRects(rect(0, 0, 6, 1), rect(2, 0, 3, 5))),
      ).toEqual(rect(0, 0, 6, 1));
    });

    it('L shape', () => {
      // 2x8 vertical, 6x2 horizontal along the bottom
      expect(
        run(presenceFromRects(rect(0, 0, 1, 7), rect(0, 6, 5, 7))),
      ).toEqual(rect(0, 0, 1, 7));
    });

    it('disjoint rectangles with a gap', () => {
      expect(
        run(presenceFromRects(rect(0, 0, 1, 1), rect(3, 3, 6, 5))),
      ).toEqual(rect(3, 3, 6, 5));
    });

    it('disjoint rectangles of equal area prefer the squarer one', () => {
      // 1x4 vs 2x2
      expect(
        run(presenceFromRects(rect(0, 0, 3, 0), rect(5, 2, 6, 3))),
      ).toEqual(rect(5, 2, 6, 3));
    });

    it('two rectangles at negative offsets', () => {
      expect(
        run(presenceFromRects(rect(-5, -5, -2, -2), rect(-2, -2, 0, 0))),
      ).toEqual(rect(-5, -5, -2, -2));
    });
  });

  describe('irregular presence', () => {
    it('grid with a hole in the middle', () => {
      expect(
        run(
          presenceFromAscii(`
            ######
            ######
            ##.###
            ######
          `),
        ),
      ).toEqual(rect(3, 0, 5, 3));
    });

    it('grid with a missing corner (e.g. a logo button)', () => {
      expect(
        run(
          presenceFromAscii(`
            ########.
            #########
            #########
            #########
          `),
        ),
      ).toEqual(rect(0, 0, 7, 3));
    });

    it('jagged rows of differing lengths', () => {
      const result = run({
        area: rect(0, 0, 2, 3),
        presence: [
          [true, true, true, true],
          [true, true],
          [true, true, true],
        ],
      });
      expect(result).toEqual(rect(0, 0, 2, 1));
    });

    it('matches a brute force search on random grids', () => {
      // Simple deterministic LCG so failures are reproducible
      let seed = 12345;
      const random = () => {
        seed = (seed * 1103515245 + 12345) % 2 ** 31;
        return seed / 2 ** 31;
      };
      for (let i = 0; i < 200; i++) {
        const cols = 1 + Math.floor(random() * 8);
        const rows = 1 + Math.floor(random() * 8);
        const density = 0.4 + random() * 0.6;
        const presence = Array.from({ length: cols }, () =>
          Array.from({ length: rows }, () => random() < density),
        );
        const area = rect(0, 0, cols - 1, rows - 1);
        if (!presence.some((c) => c.some(Boolean))) {
          continue;
        }
        run({ area, presence });
      }
    });
  });
});

describe('real profiles', () => {
  describe('bitchboy', () => {
    const profile = KNOWN_MIDI_PROFILES.bitchboy.subProfiles.default.input({
      connection: {
        name: 'Bitchboy',
      },
    });
    it('getMaxContiguousArea', () => {
      const usableItems: MidiControllerItemWithPointPosition[] = selectItems(
        profile.getItems(),
        profile.getFeedbackCapabilities(),
        ANY_LED_INTERACTIVE_ITEMS,
        undefined,
        hasMidiCoordinatePointPosition,
      );

      const { usableRange, cellPresence } = buildCellPresence(usableItems);

      const result = getMaxContiguousArea(usableRange, cellPresence);
      // 2x8 vertical, 6x2 horizontal along the bottom
      expect(result).toEqual(rect(0, 3, 7, 7));
    });

    it('gameGrid', () => {
      const grid = gameGrid({
        input: profile,
        selection: TAP_A_MOLE_GRID_SELECTION,
      });

      // Should select main grid area
      expect(grid).toEqual({
        ...rect(0, 3, 7, 7),
        cols: 8,
        rows: 5,
        getCenterPosition: expect.any(Function),
        selectedItems: expect.any(Function),
      });
    });
  });
});
