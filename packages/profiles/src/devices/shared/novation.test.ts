import { describe, expect, it } from '@jest/globals';
import {
  NOVATION_LAUNCHPAD_RGB_PALLETTE,
  createNovationLaunchpadRGBColorSpace,
} from './novation.js';

describe('Novation Launchpad RGB Palette', () => {
  it('color count', () => {
    expect(NOVATION_LAUNCHPAD_RGB_PALLETTE.length).toBe(128);
  });
  it('color are valid', () => {
    expect(
      NOVATION_LAUNCHPAD_RGB_PALLETTE.every((color) =>
        /^([0-9a-f]{6})?$/.test(color),
      ),
    ).toBe(true);
  });
  describe('createNovationLaunchpadRGBColorSpace', () => {
    const startTime = Date.now();
    const space = createNovationLaunchpadRGBColorSpace();
    const endTime = Date.now();

    it('should be quick-ish to precompute', () => {
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5_000);
    });

    it('Correct memory footprint', () => {
      expect(space.size).toEqual(0x8000);
    });

    it('address locations', () => {
      expect(space.getAddress([0, 0, 0])).toEqual(0);
      expect(space.getAddress([255, 255, 255])).toEqual(32767);
    });

    it('sample check', () => {
      expect(space.rgbToValue([0, 0, 0])).toEqual([0]);
      expect(space.rgbToValue([255, 255, 255])).toEqual([3]);

      // Primary Colors - Full Saturation
      expect(space.rgbToValue([255, 0, 0])).toEqual([5]);
      expect(space.rgbToValue([255, 255, 0])).toEqual([13]);
      expect(space.rgbToValue([0, 255, 0])).toEqual([21]);
      expect(space.rgbToValue([0, 255, 255])).toEqual([90]);
      expect(space.rgbToValue([0, 0, 255])).toEqual([45]);
      expect(space.rgbToValue([255, 0, 255])).toEqual([53]);
    });
  });
});
