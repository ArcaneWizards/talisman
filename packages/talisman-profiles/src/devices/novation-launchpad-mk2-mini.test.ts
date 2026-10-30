import { describe, expect, it } from '@jest/globals';
import {
  createIndexLaunchpadMk2MiniColorSpace,
  createVelocityLaunchpadMk2MiniColorSpace,
  NOVATION_RG_COLOURS,
} from './novation-launchpad-mk2-mini.js';

describe('Novation Launchpad Mk2 Mini Feedback Profile', () => {
  describe('color space', () => {
    const startTime = Date.now();
    const index = createIndexLaunchpadMk2MiniColorSpace();
    const velocity = createVelocityLaunchpadMk2MiniColorSpace();
    const endTime = Date.now();

    it('should be quick-ish to precompute', () => {
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5_000);
    });

    it('Correct memory footprint', () => {
      expect(index.size).toEqual(0x8000);
    });

    it('address locations', () => {
      expect(index.getAddress([0, 0, 0])).toEqual(0);
      expect(index.getAddress([255, 255, 255])).toEqual(32767);
    });

    it('createIndexLaunchpadMk2MiniColorSpace sample check', () => {
      expect(NOVATION_RG_COLOURS[index.rgbToValue([0, 0, 0])[0]]).toEqual([
        0,
        { lightness: 0, hue: 0 },
      ]);
      expect(NOVATION_RG_COLOURS[index.rgbToValue([255, 255, 255])[0]]).toEqual(
        [49, { lightness: 50, hue: 52 }],
      );

      // Primary Colors - Full Saturation
      expect(NOVATION_RG_COLOURS[index.rgbToValue([255, 0, 0])[0]]).toEqual([
        3,
        { lightness: 50, hue: 0 },
      ]);
      expect(NOVATION_RG_COLOURS[index.rgbToValue([255, 255, 0])[0]]).toEqual([
        49,
        { lightness: 50, hue: 52 },
      ]);
      expect(NOVATION_RG_COLOURS[index.rgbToValue([0, 255, 0])[0]]).toEqual([
        48,
        { lightness: 50, hue: 120 },
      ]);
      expect(NOVATION_RG_COLOURS[index.rgbToValue([0, 255, 255])[0]]).toEqual([
        48,
        { lightness: 50, hue: 120 },
      ]);
      expect(NOVATION_RG_COLOURS[index.rgbToValue([0, 0, 255])[0]]).toEqual([
        48,
        { lightness: 50, hue: 240 },
      ]);
      expect(NOVATION_RG_COLOURS[index.rgbToValue([255, 0, 255])[0]]).toEqual([
        3,
        { lightness: 50, hue: 0 },
      ]);
    });

    it('createVelocityLaunchpadMk2MiniColorSpace sample check', () => {
      expect(velocity.rgbToValue([0, 0, 0])).toEqual([0]);
      expect(velocity.rgbToValue([255, 255, 255])).toEqual([49]);

      // Primary Colors - Full Saturation
      expect(velocity.rgbToValue([255, 0, 0])).toEqual([3]);
      expect(velocity.rgbToValue([255, 255, 0])).toEqual([49]);
      expect(velocity.rgbToValue([0, 255, 0])).toEqual([48]);
      expect(velocity.rgbToValue([0, 255, 255])).toEqual([48]);
      expect(velocity.rgbToValue([0, 0, 255])).toEqual([48]);
      expect(velocity.rgbToValue([255, 0, 255])).toEqual([3]);
    });
  });
});
