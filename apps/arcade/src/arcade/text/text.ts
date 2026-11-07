import { TEXT_4_5 } from './4x5';

const FONTS = Object.freeze({
  '4x5': {
    def: TEXT_4_5,
    cols: 4,
    rows: 5,
  },
});

export type FontDefinition = keyof typeof FONTS;

const PROCESSED_ARRAYS: Partial<
  Record<FontDefinition, Record<string, boolean[]>>
> = {};

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
