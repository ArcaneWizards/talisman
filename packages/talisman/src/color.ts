/**
 * [red, green, blue] components, with each value between 0-255
 */
export type RGB = [number, number, number];

export interface HSL {
  /** Hue component of the color (0-360) */
  h: number;
  /** Saturation component of the color (0-100) */
  s: number;
  /** Lightness component of the color (0-100) */
  l: number;
}

export const rgbToHsl = (rgb: RGB): HSL => {
  const rn = rgb[0] / 255;
  const gn = rgb[1] / 255;
  const bn = rgb[2] / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    switch (max) {
      case rn:
        h = ((gn - bn) / delta) % 6;
        break;
      case gn:
        h = (bn - rn) / delta + 2;
        break;
      default:
        h = (rn - gn) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

export const hslToRgb = ({ h, s, l }: HSL): RGB => {
  const sn = s / 100;
  const ln = l / 100;

  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = ln - c / 2;

  let rn = 0,
    gn = 0,
    bn = 0;
  if (h < 60) [rn, gn, bn] = [c, x, 0];
  else if (h < 120) [rn, gn, bn] = [x, c, 0];
  else if (h < 180) [rn, gn, bn] = [0, c, x];
  else if (h < 240) [rn, gn, bn] = [0, x, c];
  else if (h < 300) [rn, gn, bn] = [x, 0, c];
  else [rn, gn, bn] = [c, 0, x];

  return [
    Math.round((rn + m) * 255),
    Math.round((gn + m) * 255),
    Math.round((bn + m) * 255),
  ];
};

/**
 * Max possible "redmean" distance, i.e. black (0,0,0) vs white (255,255,255)
 *
 * Used to normalize colorSimilarity.
 * At that pair rMean = 127.5, so weightR = weightB = 2.5 - 1/512.
 */
const MAX_REDMEAN_DISTANCE = (() => {
  const rMean = 127.5;
  const weightR = 2 + rMean / 256;
  const weightG = 4;
  const weightB = 2 + (255 - rMean) / 256;
  return Math.sqrt((weightR + weightG + weightB) * 255 ** 2);
})();

/**
 * Perceptual similarity between two RGB colors using the "redmean" weighted
 * Euclidean distance, normalized to [0, 1]. 0 = identical, 1 = maximally different.
 */
export function colorDistance(a: RGB, b: RGB): number {
  const rMean = (a[0] + b[0]) / 2;
  const dR = a[0] - b[0];
  const dG = a[1] - b[1];
  const dB = a[2] - b[2];

  const weightR = 2 + rMean / 256;
  const weightG = 4;
  const weightB = 2 + (255 - rMean) / 256;

  const distance = Math.sqrt(
    weightR * dR ** 2 + weightG * dG ** 2 + weightB * dB ** 2,
  );

  return distance / MAX_REDMEAN_DISTANCE;
}

export type ColorSpace<T extends [number, ...number[]]> = {
  /**
   * Size in bytes of the precomputed color space array.
   */
  size: number;
  /**
   * Get the closest values in the color space for the given RGB color.
   */
  rgbToValue: (rgb: RGB) => T;
  /**
   * Get the address of a particular value in the color space,
   * for testing purposes.
   */
  getAddress: (rgb: RGB) => number;
};

type CreateColorSpaceArg<T extends [number, ...number[]]> = {
  /**
   * The integer sizes for each component of the color space,
   * each space will be a range from 0 to size-1.
   *
   * For example, for an 8-bit color component,
   * the size would be 256.
   */
  sizes: T;
  argsToRgb: (args: T) => RGB;
  /**
   * How many bits of precision to use for each component in the R,G,B color space.
   *
   * Each number in the tuple corresponds to the number of bits of precision for
   * the R, G, and B components respectively.
   */
  precision: [number, number, number];
};

const getColorSpaceAddress = (
  rgb: RGB,
  rBytes: number,
  gBytes: number,
  bBytes: number,
  tBytes: number,
) => {
  const r = (rgb[0] & 0xff) >> (8 - rBytes);
  const g = (rgb[1] & 0xff) >> (8 - gBytes);
  const b = (rgb[2] & 0xff) >> (8 - bBytes);

  return ((((r << gBytes) | g) << bBytes) | b) << (tBytes - 1);
};

const colorSpace = <T extends [number, ...number[]]>(
  tBytes: number,
  rBytes: number,
  gBytes: number,
  bBytes: number,
  map: Uint8Array,
): ColorSpace<T> => {
  return {
    size: map.length,
    rgbToValue: (rgb: RGB) => {
      const result: T = new Array(tBytes).fill(0) as T;

      const addressStart = getColorSpaceAddress(
        rgb,
        rBytes,
        gBytes,
        bBytes,
        tBytes,
      );

      for (let i = 0; i < tBytes; i++) {
        result[i] = map[addressStart + i]!;
      }

      return result;
    },
    getAddress: (rgb: RGB) =>
      getColorSpaceAddress(rgb, rBytes, gBytes, bBytes, tBytes),
  };
};

/**
 * Create a memory & cpu efficient approximate color-space mapping,
 * allowing for quick conversion from RGB to appropriate midi values with only
 * constant-time lookups, at the expense of a bit of preprocessing.
 */
export const createColorSpace = <T extends [number, ...number[]]>({
  sizes,
  argsToRgb,
  precision,
}: CreateColorSpaceArg<T>): ColorSpace<T> => {
  /**
   * How many bytes we need to store per color component in the precomputed map.
   */
  const tBytes = sizes.length;
  const rBytes = precision[0];
  const gBytes = precision[1];
  const bBytes = precision[2];

  for (const s of [rBytes, gBytes, bBytes]) {
    if (s < 1 || s > 8) {
      throw new Error('Invalid precision value, each must be between 1 and 8');
    }
  }

  /**
   * Exact memory footprint of the precomputed color space array in bytes.
   */
  const arrayBytes =
    precision.reduce((acc, p) => acc * Math.pow(2, p), 1) * tBytes;

  if (arrayBytes > 0x10000) {
    throw new Error('Precomputed color space array exceeds memory limit');
  }

  // Calculate how much bit shifting is required for each color component.

  const map = new Uint8Array(arrayBytes);
  const lookupTableSize = sizes.reduce((acc, size) => acc * size, 1);
  const lookupTable = new Array<[T, RGB]>(lookupTableSize);

  if (lookupTableSize === 0) {
    throw new Error('sizes for each dimension must all be greater than 0');
  }

  const currentIndex: T = sizes.map(() => 0) as T;
  for (let i = 0; i < lookupTableSize; i++) {
    lookupTable[i] = [[...currentIndex], argsToRgb(currentIndex)];

    // Increment the current index for the next iteration.
    for (let j = currentIndex.length - 1; j >= 0; j--) {
      currentIndex[j]!++;
      if (currentIndex[j]! < sizes[j]!) {
        break;
      }
      currentIndex[j] = 0;
    }
  }

  // Use scope to limit the lifetime of temporary variables during preprocessing.
  const rShift = 8 - rBytes;
  const gShift = 8 - gBytes;
  const bShift = 8 - bBytes;

  const rSize = 1 << rBytes;
  const gSize = 1 << gBytes;
  const bSize = 1 << bBytes;
  for (let r = 0; r < rSize; r++) {
    for (let g = 0; g < gSize; g++) {
      for (let b = 0; b < bSize; b++) {
        // Compute the RGB value for this combination of r, g, b.
        const rgb: RGB = [r << rShift, g << gShift, b << bShift];

        // Find the closest entry in the lookup table.
        let closestResult: T = lookupTable[0]![0];
        let closestDistance = Infinity;
        for (let i = 0; i < lookupTableSize; i++) {
          const [args, tableRgb] = lookupTable[i]!;
          const distance = colorDistance(rgb, tableRgb);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestResult = args;
          }
        }

        /**
         * The start address in map
         */
        const addressStart = getColorSpaceAddress(
          rgb,
          rBytes,
          gBytes,
          bBytes,
          tBytes,
        );

        for (let byteIndex = 0; byteIndex < tBytes; byteIndex++) {
          map[addressStart + byteIndex] = closestResult[byteIndex]!;
        }
      }
    }
  }

  return colorSpace(tBytes, rBytes, gBytes, bBytes, map);
};

export const colorEqual = (a: RGB | undefined, b: RGB): boolean => {
  return a?.[0] === b[0] && a[1] === b[1] && a[2] === b[2];
};

export const hexToRGB = (hex: string): RGB => {
  let offset = 0;
  if (hex.length < 6 || hex.length > 7) {
    throw new Error(`Invalid hex color: ${hex}`);
  } else if (hex.length === 7) {
    if (hex[0] !== '#') {
      throw new Error(`Invalid hex color: ${hex}`);
    }
    offset = 1;
  }
  const r = parseInt(hex.slice(0 + offset, 2 + offset), 16);
  const g = parseInt(hex.slice(2 + offset, 4 + offset), 16);
  const b = parseInt(hex.slice(4 + offset, 6 + offset), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [r, g, b];
};
