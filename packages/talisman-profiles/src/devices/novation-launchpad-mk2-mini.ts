import {
  ColorSpace,
  createColorSpace,
  hslToRgb,
} from '@arcanewizards/talisman/color';
import { createBasicColorVelocityFeedbackProfile } from '@arcanewizards/talisman/feedback';
import {
  MidiButtonNature,
  MidiControllerItem,
} from '@arcanewizards/talisman/profile';
import {
  createNovationButtonOnlyProfile,
  NovationButtonInfo,
  NovationButtonOnlyLayout,
} from './shared/novation.js';
import { getMidiController, getMidiNote } from '@arcanewizards/talisman';

const novationLaunchpadMk2MiniLayout: NovationButtonOnlyLayout = () => {
  const items: Record<string, MidiControllerItem> = {};
  const notes: Record<number, NovationButtonInfo> = {};
  const controllers: Record<number, NovationButtonInfo> = {};

  const gridNature: MidiButtonNature = {
    nature: 'grid',
  };
  for (let col = 0; col < 8; col++) {
    for (let row = 0; row < 8; row++) {
      const id = `grid-${col}-${row}`;
      const note = getMidiNote((7 - row) * 16 + col);
      items[id] = {
        id,
        position: { col, row },
        note: [
          {
            id: {
              type: 'note',
              channel: 0,
              note,
            },
            nature: gridNature,
          },
        ],
      };
      notes[note] = { item: id, nature: gridNature };
    }
  }

  const RIGHT_LABELS = ['H', 'G', 'F', 'E', 'D', 'C', 'B', 'A'];

  for (let row = 0; row < 8; row++) {
    const id = `row-${row}`;
    const nature: MidiButtonNature = {
      nature: 'unknown',
    };
    const note = getMidiNote((7 - row) * 16 + 8);
    items[id] = {
      id,
      position: { col: 8, row },
      label: RIGHT_LABELS[row],
      note: [
        {
          id: {
            type: 'note',
            channel: 0,
            note,
          },
          nature,
        },
      ],
    };
    notes[note] = { item: id, nature };
  }

  for (let col = 0; col < 8; col++) {
    const id = `col-${col}`;
    const nature: MidiButtonNature = {
      nature: 'channel',
      action: 'select',
      channel: col,
    };
    const controller = getMidiController(0x68 + col);
    items[id] = {
      id,
      position: { col, row: 8 },
      label: String(col + 1),
      controlChange: [
        {
          id: {
            type: 'control-change',
            channel: 0,
            controller,
          },
          nature,
        },
      ],
    };
    controllers[controller] = { item: id, nature };
  }

  return { items, notes, controllers };
};

export const createNovationLaunchpadMk2MiniProfile =
  createNovationButtonOnlyProfile({
    getLayout: novationLaunchpadMk2MiniLayout,
    noteOffMode: '0-velocity',
  });

export const NOVATION_RG_COLOURS = Object.freeze([
  // Colors usable by the Novation Launchpad Mk2 Mini
  [0, { lightness: 0, hue: 0 }],
  [1, { lightness: 17, hue: 0 }],
  [2, { lightness: 30, hue: 0 }],
  [3, { lightness: 50, hue: 0 }],
  [18, { lightness: 30, hue: 15 }],
  [83, { lightness: 50, hue: 15 }],
  [34, { lightness: 30, hue: 25 }],
  [99, { lightness: 50, hue: 30 }],
  [17, { lightness: 17, hue: 36 }],
  [97, { lightness: 30, hue: 36 }],
  [115, { lightness: 50, hue: 36 }],
  [50, { lightness: 50, hue: 44 }],
  [49, { lightness: 50, hue: 52 }],
  [16, { lightness: 17, hue: 120 }],
  [96, { lightness: 30, hue: 120 }],
  [48, { lightness: 50, hue: 120 }],
  [16, { lightness: 17, hue: 120 }],
  [96, { lightness: 30, hue: 120 }],
  // Blue -> Green mapping, so that blue colors don't appear as black / red
  [16, { lightness: 17, hue: 240 }],
  [96, { lightness: 30, hue: 240 }],
  [48, { lightness: 50, hue: 240 }],
] satisfies Array<[number, { lightness: number; hue: number }]>);

/**
 * Create a raw colour space from RGB -> NOVATION_RG_COLOURS index
 */
export const createIndexLaunchpadMk2MiniColorSpace = (): ColorSpace<
  [number]
> => {
  return createColorSpace({
    sizes: [NOVATION_RG_COLOURS.length],
    argsToRgb: ([index]) => {
      const c = NOVATION_RG_COLOURS[index];

      if (!c) {
        throw new Error(`Invalid color index: ${index}`);
      }
      return hslToRgb({ h: c[1].hue, s: 100, l: c[1].lightness });
    },
    precision: [5, 5, 5],
  });
};

let colorSpace: ColorSpace<[number]> | null = null;

/**
 * Create a raw colour space from RGB -> NOVATION_RG_COLOURS index
 */
export const createVelocityLaunchpadMk2MiniColorSpace = (): ColorSpace<
  [number]
> => {
  const indexSpace = createIndexLaunchpadMk2MiniColorSpace();
  return {
    size: indexSpace.size,
    getAddress: indexSpace.getAddress,
    rgbToValue: (rgb) => {
      const [index] = indexSpace.rgbToValue(rgb);
      const entry = NOVATION_RG_COLOURS[index];
      return [entry?.[0] ?? 0];
    },
  };
};

export const createNovationLaunchpadMk2MiniFeedbackProfile =
  createBasicColorVelocityFeedbackProfile({
    defaultVelocities: {
      empty: 0,
      active: 15,
      ready: 3,
    },
    getColorSpace: () => {
      if (!colorSpace) {
        colorSpace = createVelocityLaunchpadMk2MiniColorSpace();
      }
      return colorSpace;
    },
  });
