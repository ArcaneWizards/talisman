import { describe, expect, it } from '@jest/globals';
import { createHerculesColorSpace, HERCULES_NOTE_TO_RGB } from './hercules.js';

describe('Hercules DJControl Inpulse 300 Feedback Profile', () => {
  it('color count', () => {
    expect(HERCULES_NOTE_TO_RGB.length).toBe(16 * 8);
  });
  it('color are valid', () => {
    expect(
      HERCULES_NOTE_TO_RGB.every((color) => /^([0-9a-f]{6})?$/.test(color)),
    ).toBe(true);
  });
  describe('createHerculesColorSpace', () => {
    const startTime = Date.now();
    const space = createHerculesColorSpace();
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
      expect(space.rgbToValue([255, 255, 255])).toEqual([0x7f]);

      // Primary Colors - Full Saturation
      expect(space.rgbToValue([255, 0, 0])).toEqual([0x60]);
      expect(space.rgbToValue([255, 255, 0])).toEqual([0x7c]);
      expect(space.rgbToValue([0, 255, 0])).toEqual([0x1c]);
      expect(space.rgbToValue([0, 255, 255])).toEqual([0x1f]);
      expect(space.rgbToValue([0, 0, 255])).toEqual([0x03]);
      expect(space.rgbToValue([255, 0, 255])).toEqual([0x63]);
    });
  });
});
