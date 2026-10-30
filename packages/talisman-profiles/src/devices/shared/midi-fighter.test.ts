import { describe, expect, it } from '@jest/globals';
import {
  createMidiFighterClassicColorSpace,
  createMidiFighterExpandedColorSpace,
} from './midi-fighter.js';

describe('Midi Fighter Classic Pallette', () => {
  describe('createMidiFighterClassicColorSpace', () => {
    const startTime = Date.now();
    const space = createMidiFighterClassicColorSpace();
    const endTime = Date.now();

    it('should be quick-ish to precompute', () => {
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(30_000);
    });

    it('Correct memory footprint', () => {
      expect(space.size).toEqual(0x10000);
    });

    it('sample check', () => {
      expect(space.rgbToValue([0, 0, 0])).toEqual([0, 0]);

      // Primary Colors - Full Saturation
      expect(space.rgbToValue([255, 0, 0])).toEqual([83, 9]);
      expect(space.rgbToValue([255, 255, 0])).toEqual([63, 9]);
      expect(space.rgbToValue([0, 255, 0])).toEqual([42, 9]);
      expect(space.rgbToValue([0, 255, 255])).toEqual([20, 9]);
      expect(space.rgbToValue([0, 0, 255])).toEqual([0, 9]);
      expect(space.rgbToValue([255, 0, 255])).toEqual([105, 9]);
    });
  });
  describe('createMidiFighterExpandedColorSpace', () => {
    const startTime = Date.now();
    const space = createMidiFighterExpandedColorSpace();
    const endTime = Date.now();

    it('should be quick-ish to precompute', () => {
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5_000);
    });

    it('Correct memory footprint', () => {
      expect(space.size).toEqual(0x10000);
    });

    const MAX_BRIGHTNESS = 2;

    it('sample check', () => {
      expect(space.rgbToValue([0, 0, 0])).toEqual([0, 0]);
      expect(space.rgbToValue([255, 255, 255])).toEqual([3, MAX_BRIGHTNESS]);

      // Primary Colors - Full Saturation - Middle Lightness
      expect(space.rgbToValue([255, 0, 0])).toEqual([5, MAX_BRIGHTNESS]);
      expect(space.rgbToValue([255, 255, 0])).toEqual([13, MAX_BRIGHTNESS]);
      expect(space.rgbToValue([0, 255, 0])).toEqual([21, MAX_BRIGHTNESS]);
      expect(space.rgbToValue([0, 255, 255])).toEqual([90, MAX_BRIGHTNESS]);
      expect(space.rgbToValue([0, 0, 255])).toEqual([45, MAX_BRIGHTNESS]);
      expect(space.rgbToValue([255, 0, 255])).toEqual([53, MAX_BRIGHTNESS]);
    });
  });
});
