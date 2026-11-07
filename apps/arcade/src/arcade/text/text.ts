import { TEXT_4_5 } from './4x5';
import { TEXT_5_7 } from './5x7';
import { TEXT_6_8 } from './6x8';

export const FONTS = Object.freeze({
  '4x5': {
    def: TEXT_4_5,
    cols: 4,
    rows: 5,
  },
  '5x7': {
    def: TEXT_5_7,
    cols: 5,
    rows: 7,
  },
  '6x8': {
    def: TEXT_6_8,
    cols: 6,
    rows: 8,
  },
});

export type ValidTextChar = `${keyof typeof TEXT_4_5}`;

export type FontDefinition = keyof typeof FONTS;

const PROCESSED_ARRAYS: Partial<
  Record<FontDefinition, Record<string, boolean[]>>
> = {};

/**
 * Return an object with a property for each character,
 * where the value is a top-to-bottom, left-to-right flat array of booleans.
 */
export const getBitArrays = (
  definition: FontDefinition,
): Record<string, boolean[]> => {
  if (PROCESSED_ARRAYS[definition]) {
    return PROCESSED_ARRAYS[definition]!;
  }
  const result: Record<string, boolean[]> = {};
  const def = FONTS[definition];
  const bitLength = def.cols * def.rows;
  for (const [key, str] of Object.entries(def.def)) {
    const bits: boolean[] = Array.from({ length: bitLength });
    const lines = str
      .trim()
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length !== def.rows) {
      throw new Error(
        `Invalid number of rows for character ${key}, expected ${def.rows}: ${lines.length}`,
      );
    }
    let i = 0;
    for (const line of lines) {
      if (line.length !== def.cols) {
        throw new Error(
          `Invalid number of columns for character ${key}, expected ${def.cols}: [${line}]`,
        );
      }
      for (const char of line) {
        if (char !== '-' && char !== '*') {
          throw new Error(
            `Invalid character for character ${key}, expected '*' or '-': [${char}]`,
          );
        }
        bits[i++] = char === '*';
      }
    }
    result[key] = bits;
  }
  PROCESSED_ARRAYS[definition] = result;
  return result;
};

export const renderText = (
  font: FontDefinition,
  chars: ValidTextChar[],
  padding: number = 2,
) => {
  const charWidth = FONTS[font].cols;
  const charHeight = FONTS[font].rows;
  const bitArrays = getBitArrays(font);

  const textWidth = chars.length * charWidth + (chars.length - 1) * padding;
  const result = Array.from({ length: textWidth * charHeight }, () => false);

  for (let charIndex = 0; charIndex < chars.length; charIndex++) {
    const char = chars[charIndex];
    const bits = char && bitArrays[char];
    for (let row = 0; row < charHeight; row++) {
      for (let col = 0; col < charWidth; col++) {
        // TEXT BITS are stored row by row from top to bottom,
        // so we need to invert the row index to render correctly
        const bit = bits?.[(charHeight - 1 - row) * charWidth + col] ?? false;
        const textCol = charIndex * (charWidth + padding) + col;
        result[row * textWidth + textCol] = bit;
      }
    }
  }

  const getValue = (col: number, row: number): boolean => {
    if (col < 0 || col >= textWidth || row < 0 || row >= charHeight) {
      return false;
    }
    return result[textWidth * row + col] ?? false;
  };

  return {
    getValue,
  };
};

export type RenderedText = ReturnType<typeof renderText>;
