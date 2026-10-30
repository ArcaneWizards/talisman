import {
  ColorSpace,
  createColorSpace,
  hexToRGB,
  hslToRgb,
  RGB,
} from '@arcanewizards/talisman/color';

export const createMidiFighterClassicColorSpace = (): ColorSpace<
  [number, number]
> => {
  const NOTE_TO_COLOR = Array.from({ length: 125 }).map((_, i) =>
    hslToRgb({ h: (360 + 240 - (i / 125) * 360) % 360, s: 100, l: 50 }),
  );

  return createColorSpace({
    // Device supports 32 values of brightness (0-31)
    // however this would take too long to compute, so we reduce it to 10 levels
    sizes: [125, 10],
    argsToRgb: ([velocity, brightness]) => {
      const c = NOTE_TO_COLOR[velocity];
      if (!c) {
        throw new Error(`Invalid RGB values for velocity: ${velocity}`);
      }
      const [r, g, b] = c;

      const br = brightness / 9;

      return [br * r, br * g, br * b];
    },
    precision: [5, 5, 5],
  });
};

export const MIDI_FIGHTER_9_COLOR_SPACE = Object.freeze([
  { color: [0xff, 0x26, 0x00], velocity: 13 },
  { color: [0xff, 0x93, 0x00], velocity: 25 },
  { color: [0xff, 0xb0, 0x00], velocity: 37 },
  { color: [0x00, 0xf9, 0x00], velocity: 49 },
  { color: [0x00, 0x8f, 0x00], velocity: 61 },
  { color: [0x00, 0xfd, 0xff], velocity: 73 },
  { color: [0x04, 0x3f, 0xff], velocity: 85 },
  { color: [0x94, 0x37, 0xff], velocity: 97 },
  { color: [0xcd, 0x32, 0xce], velocity: 13 },
] satisfies Array<{
  color: RGB;
  velocity: number;
}>);

export const MIDI_FIGHTER_9_COLOR_SPACE_BRIGHTNESS_LEVELS = 16;

export const createMidiFighter9ColorSpace = (): ColorSpace<
  [number, number]
> => {
  return createColorSpace({
    // Device supports 32 values of brightness (0-31)
    // however this would take too long to compute, so we reduce it to 10 levels
    sizes: [
      MIDI_FIGHTER_9_COLOR_SPACE.length,
      MIDI_FIGHTER_9_COLOR_SPACE_BRIGHTNESS_LEVELS,
    ],
    argsToRgb: ([index, brightness]) => {
      const c = MIDI_FIGHTER_9_COLOR_SPACE[index]?.color;
      if (!c) {
        throw new Error(`Invalid RGB values for index: ${index}`);
      }
      const [r, g, b] = c;

      const br =
        brightness / (MIDI_FIGHTER_9_COLOR_SPACE_BRIGHTNESS_LEVELS - 1);

      return [br * r, br * g, br * b];
    },
    precision: [5, 5, 5],
  });
};

// prettier-ignore
export const MIDI_FIGHTER_EXPANDED_PALLETTE = [
  // 0-7
  '000000',
  '1e1e1e',
  '7f7f7f',
  'ffffff',
  'ff4b4c',
  'ff0000',
  '7f0100',
  '1e0000',
  // 8-15
  'ffbd6c',
  'ff5500',
  '591d00',
  '271c00',
  'fdff4c',
  'fdff00',
  '585900',
  '191900',
  // 16-23
  '88ff4b',
  '54ff00',
  '1d5a01',
  '152b00',
  '4dff4d',
  '05ff03',
  '007f01',
  '001e00',
  // 24-31
  '4bff5d',
  '06ff1a',
  '01590d',
  '001902',
  '4dff88',
  '29f656',
  '096820',
  '002414',
  // 32-39
  '4dffb7',
  '04ff99',
  '005935',
  '001812',
  '4cc3ff',
  '00a9ff',
  '004152',
  '001018',
  // 40-47
  '4c89ff',
  '1255ff',
  '001d59',
  '000819',
  '4c4cff',
  '2600ff',
  '0d007f',
  '01001e',
  // 48-55
  '874dff',
  '5302ff',
  '180164',
  '0f0031',
  'ff4cff',
  'ff03ff',
  '590159',
  '180019',
  // 56-63
  'ff4c87',
  'ff0254',
  '59001c',
  '220013',
  'ff1501',
  '993600',
  '795100',
  '436400',
  // 64-71
  '033800',
  '015735',
  '00547f',
  '2600ff',
  '01464e',
  '2500cc',
  '7f7f7f',
  '202020',
  // 72-79
  'ff0000',
  'bcff2c',
  'afed06',
  '63ff0c',
  '0e8b00',
  '00ff87',
  '00a9ff',
  '2229ff',
  // 80-87
  '3f00ff',
  '7a02ff',
  'b2197d',
  '402100',
  'ff4901',
  '88e10a',
  '72ff15',
  '05ff03',
  // 88-95
  '3bff27',
  '59ff70',
  '38ffcc',
  '5a8aff',
  '3051c6',
  '877fe9',
  'd31eff',
  'ff005d',
  // 96-103
  'ff7f01',
  'b9b003',
  '8fff00',
  '845d08',
  '392b00',
  '154c0f',
  '0c5039',
  '15162a',
  // 104-111
  '17205a',
  '693c1d',
  'a80009',
  'de513d',
  'd86b1c',
  'ffe125',
  '9ee12f',
  '67b50d',
  // 112-119
  '1f1e30',
  'dcff6b',
  '80ffbd',
  '9a99ff',
  '8e66ff',
  '404040',
  '757575',
  'e0ffff',
  // 120-127
  'a00000',
  '350000',
  '1dd001',
  '074200',
  'b9b003',
  '3f3100',
  'b35f00',
  'ffffff',
];

/**
 * Low-resolution brightness curve for the brightness value,
 * as it seems it's not a simple linear relationship /
 * multiplication of R/G/B with brightness.
 */
export const MIDI_FIGHTER_BRIGHTNESS_LEVELS = [0, 0.2, 1];

export const createMidiFighterExpandedColorSpace = (): ColorSpace<
  [number, number]
> => {
  const rgb: RGB[] = MIDI_FIGHTER_EXPANDED_PALLETTE.map(hexToRGB);

  return createColorSpace({
    // Device supports 32 values of brightness (0-31)
    // however this would take too long to compute, so we reduce it to 10 levels
    sizes: [rgb.length, MIDI_FIGHTER_BRIGHTNESS_LEVELS.length],
    argsToRgb: ([velocity, brightness]) => {
      const c = rgb[velocity];
      const br = MIDI_FIGHTER_BRIGHTNESS_LEVELS[brightness];

      if (!c || br === undefined) {
        throw new Error(
          `Invalid RGB values for velocity/brightness: ${velocity}/${brightness}`,
        );
      }

      const [r, g, b] = c;

      return [r * br, g * br, b * br];
    },
    precision: [5, 5, 5],
  });
};
