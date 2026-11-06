import { describe, expect, it } from '@jest/globals';
import {
  AKAI_VELOCITY_TO_RGB,
  createAkaiColorSpace,
} from './akai-apcmini-mk2.js';
import { colorArrayToColor } from '@talisman-midi/talisman/util';

describe('Akai APC Mini Mk2 Feedback Profile', () => {
  it('color count', () => {
    expect(AKAI_VELOCITY_TO_RGB.length).toBe(128 * 3);
  });
  it('sample check', () => {
    expect(colorArrayToColor(AKAI_VELOCITY_TO_RGB, 0)).toEqual([
      0x00, 0x00, 0x00,
    ]);
    expect(colorArrayToColor(AKAI_VELOCITY_TO_RGB, 82)).toEqual([
      0xb2, 0x1a, 0x7d,
    ]);
    expect(colorArrayToColor(AKAI_VELOCITY_TO_RGB, 127)).toEqual([
      0x4b, 0x15, 0x02,
    ]);
  });

  describe('createAkaiColorSpace', () => {
    const startTime = Date.now();
    const space = createAkaiColorSpace();
    const endTime = Date.now();

    it('should be quick-ish to precompute', () => {
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(20_000);
    });

    it('Correct memory footprint', () => {
      expect(space.size).toEqual(0x10000);
    });

    it('address locations', () => {
      expect(space.getAddress([0, 0, 0])).toEqual(0);
      expect(space.getAddress([255, 255, 255])).toEqual(65534);
    });

    it('sample check', () => {
      expect(space.rgbToValue([0, 0, 0])).toEqual([0, 0]);
      expect(space.rgbToValue([255, 255, 255])).toEqual([6, 3]);

      // Primary Colors - Full Saturation
      expect(space.rgbToValue([255, 0, 0])).toEqual([6, 5]);
      expect(space.rgbToValue([255, 255, 0])).toEqual([6, 13]);
      expect(space.rgbToValue([0, 255, 0])).toEqual([6, 21]);
      expect(space.rgbToValue([0, 255, 255])).toEqual([6, 90]);
      expect(space.rgbToValue([0, 0, 255])).toEqual([6, 45]);
      expect(space.rgbToValue([255, 0, 255])).toEqual([6, 53]);
    });
  });
});
