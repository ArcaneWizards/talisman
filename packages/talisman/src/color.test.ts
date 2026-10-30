import { describe, expect, it } from '@jest/globals';
import { hexToRGB } from './color.js';

describe('hexToRGB', () => {
  it('no hash', () => {
    expect(hexToRGB('000000')).toEqual([0x00, 0x00, 0x00]);
    expect(hexToRGB('ffffff')).toEqual([0xff, 0xff, 0xff]);
    expect(hexToRGB('0055ff')).toEqual([0x00, 0x55, 0xff]);
    expect(hexToRGB('443322')).toEqual([0x44, 0x33, 0x22]);
  });
  it('with hash', () => {
    expect(hexToRGB('#000000')).toEqual([0x00, 0x00, 0x00]);
    expect(hexToRGB('#ffffff')).toEqual([0xff, 0xff, 0xff]);
    expect(hexToRGB('#0055ff')).toEqual([0x00, 0x55, 0xff]);
    expect(hexToRGB('#443322')).toEqual([0x44, 0x33, 0x22]);
  });
  it('invalid input', () => {
    expect(() => hexToRGB('')).toThrow();
    expect(() => hexToRGB('#')).toThrow();
    expect(() => hexToRGB('gggggg')).toThrow();
    expect(() => hexToRGB('#12345')).toThrow();
  });
});
