import {
  getMidiNote,
  MIDI_NOTE_ON,
  MidiControlChangeIdentity,
  MidiInputConnectionInfo,
  MidiNoteIdentity,
  MidiHotkeyMode,
  MidiButtonNature,
  MidiControllerAction,
  MidiControllerItem,
  MidiCoordinateInfo,
  MidiProfileInit,
  MidiNumericNature,
  MidiFeedbackProfile,
  MidiFeedbackProfileInit,
  MidiProfileDefinition,
  FeedbackCapabilityProfile,
} from '@arcanewizards/talisman/core';
import {
  ColorSpace,
  createColorSpace,
  hexToRGB,
  RGB,
} from '@arcanewizards/talisman/color';
import { MidiProfileBasic } from '@arcanewizards/talisman/profile';

const FEEDBACK_CAPABILITY_RING = 'ring';
const FEEDBACK_CAPABILITY_BUTTON_RED = 'red';
const FEEDBACK_CAPABILITY_BUTTON_WHITE = 'white';
const FEEDBACK_CAPABILITY_BUTTON_AMBER = 'amber';
const FEEDBACK_CAPABILITY_BUTTON_GREEN = 'green';

type FeedbackCapability =
  | typeof FEEDBACK_CAPABILITY_RING
  | typeof FEEDBACK_CAPABILITY_BUTTON_RED
  | typeof FEEDBACK_CAPABILITY_BUTTON_WHITE
  | typeof FEEDBACK_CAPABILITY_BUTTON_AMBER
  | typeof FEEDBACK_CAPABILITY_BUTTON_GREEN;

export const createHerculesDJControlInpulse300Profile: MidiProfileInit = () => {
  type DeckID = 'deckA' | 'deckB' | 'deckC' | 'deckD';
  const CHANNEL_TO_DECK = Object.freeze({
    1: 'deckA',
    2: 'deckB',
    4: 'deckC',
    5: 'deckD',
  });
  const CHANNEL_TO_DECK_LABEL = Object.freeze({
    1: 'Deck A',
    2: 'Deck B',
    4: 'Deck C',
    5: 'Deck D',
  });
  const DECK_TO_RESOLVED_CHANNEL = Object.freeze({
    deckA: 0,
    deckB: 1,
    deckC: 2,
    deckD: 3,
  } satisfies Record<DeckID, number>);

  const isDeckChannel = (midiChannel: number): midiChannel is 1 | 2 | 4 | 5 =>
    midiChannel in CHANNEL_TO_DECK;

  type DeckAction = (MidiButtonNature & { nature: 'deck' })['action'];

  type FullyDefinedNote = MidiControllerItem & {
    note: [
      {
        id: MidiNoteIdentity;
        nature: MidiButtonNature;
      },
    ];
  };

  type FullyDefinedFader = MidiControllerItem & {
    controlChange: [
      {
        id: MidiControlChangeIdentity;
        nature: MidiNumericNature;
      },
    ];
  };

  const PLATTER = 0x08;

  const BROWSE_BUTTON = Object.freeze({
    id: 'browse-push',
    label: 'Browser',
    note: [
      {
        id: {
          type: 'note',
          channel: 0,
          note: 0x00,
        },
        nature: {
          nature: 'navigation',
          navigation: 'enter',
        },
      },
    ],
    controlChange: [
      {
        id: {
          type: 'control-change',
          channel: 0,
          controller: 1,
        },
        nature: {
          nature: 'navigation',
          role: 'up-down',
        },
      },
      {
        id: {
          type: 'control-change',
          channel: 0,
          controller: 2,
        },
        nature: {
          nature: 'navigation',
          role: 'left-right',
        },
      },
    ],
    position: {
      col: 9,
      row: 11,
    },
    feedback: FEEDBACK_CAPABILITY_RING,
  } satisfies FullyDefinedNote);

  const MAIN_NOTES = Object.freeze({
    [0x00]: BROWSE_BUTTON,
    [0x01]: {
      id: 'beatmatch-guide',
      label: 'Beatmatch Guide',
      note: [
        {
          id: {
            type: 'note',
            channel: 0,
            note: 0x01,
          },
          nature: {
            nature: 'unknown',
          },
        },
      ],
      position: {
        col: 9,
        row: 5,
      },
      feedback: null,
    },
    [0x02]: {
      id: 'master-pfl',
      label: 'Master Pre-Fader Listen',
      note: [
        {
          id: {
            type: 'note',
            channel: 0,
            note: 0x02,
          },
          nature: {
            nature: 'unknown',
          },
        },
      ],
      position: {
        col: 9,
        row: 6,
      },
      feedback: null,
    },
    [0x03]: {
      id: 'assistant',
      label: 'Assistant',
      note: [
        {
          id: {
            type: 'note',
            channel: 0,
            note: 0x03,
          },
          nature: {
            nature: 'navigation',
            navigation: 'menu',
          },
        },
      ],
      position: {
        col: 9,
        row: 10,
      },
      feedback: FEEDBACK_CAPABILITY_BUTTON_WHITE,
    },
  } satisfies Record<string, FullyDefinedNote>);

  const MAIN_FADERS = Object.freeze({
    [0x0]: {
      id: 'crossfader',
      controlChange: [
        {
          id: {
            type: 'control-change',
            channel: 0,
            controller: 0,
          },
          nature: {
            nature: 'fader',
            role: 'cross-fader',
          },
        },
      ],
      position: {
        col: 9,
        row: 0,
        orientation: 'horizontal',
      },
      feedback: null,
    },
    [0x03]: {
      id: 'master-fader',
      controlChange: [
        {
          id: {
            type: 'control-change',
            channel: 0,
            controller: 0x03,
          },
          nature: {
            nature: 'fader',
            role: 'master',
          },
        },
      ],
      position: {
        col: 9,
        row: 8,
      },
      feedback: null,
    },
    [0x04]: {
      id: 'headphones-fader',
      controlChange: [
        {
          id: {
            type: 'control-change',
            channel: 0,
            controller: 0x04,
          },
          nature: {
            nature: 'fader',
            role: 'headphones',
          },
        },
      ],
      position: {
        col: 9,
        row: 7,
      },
      feedback: null,
    },
  } satisfies Record<string, FullyDefinedFader>);

  const platterId = (deckId: DeckID) => `${deckId}.platter`;

  const DECK_NOTES = Object.freeze({
    [PLATTER]: {
      // Even though this is defined in NOTES, we reuse this item later for
      // platter CC changes
      action: 'platter-touch',
      label: 'Platter',
      position: null,
      feedback: null,
    },
    [0x00]: {
      action: 'fx',
      label: 'FX Toggle',
      position: {
        col: 2,
        row: 12,
      },
      feedback: FEEDBACK_CAPABILITY_BUTTON_RED,
    },
    [0x01]: {
      action: 'slip',
      label: 'Slip',
      position: {
        col: 6,
        row: 5,
      },
      feedback: FEEDBACK_CAPABILITY_BUTTON_RED,
    },
    [0x02]: {
      action: 'quantize',
      label: 'Quantize',
      position: {
        col: 7,
        row: 6,
      },
      feedback: FEEDBACK_CAPABILITY_BUTTON_RED,
    },
    [0x03]: {
      action: 'vinyl',
      label: 'Vinyl',
      position: {
        col: [0, 1],
        row: 5,
      },
      feedback: FEEDBACK_CAPABILITY_BUTTON_WHITE,
    },
    [0x04]: {
      action: 'shift',
      label: 'Shift',
      position: {
        col: [0, 1],
        row: 3,
      },
      feedback: null,
    },
    [0x05]: {
      action: 'sync',
      label: 'Sync',
      position: {
        col: [0, 1],
        row: 2,
      },
      feedback: FEEDBACK_CAPABILITY_BUTTON_RED,
    },
    [0x06]: {
      action: 'cue',
      label: 'Cue',
      position: {
        col: [0, 1],
        row: 1,
      },
      feedback: FEEDBACK_CAPABILITY_BUTTON_AMBER,
    },
    [0x07]: {
      action: 'play-pause',
      label: 'Play/Pause',
      position: {
        col: [0, 1],
        row: 0,
      },
      feedback: FEEDBACK_CAPABILITY_BUTTON_GREEN,
    },
    [0x09]: {
      action: 'loop-in',
      label: 'Loop In',
      position: {
        col: 0,
        row: 4,
      },
      feedback: FEEDBACK_CAPABILITY_BUTTON_RED,
    },
    [0x0a]: {
      action: 'loop-out',
      label: 'Loop Out',
      position: {
        col: 1,
        row: 4,
      },
      feedback: FEEDBACK_CAPABILITY_BUTTON_RED,
    },
    [0x0b]: {
      action: 'loop-in-long-press',
      label: 'Loop In Long Press',
      position: null,
      feedback: null,
    },
    [0x0c]: {
      action: 'pre-fader-listen',
      label: 'Pre-Fader Listen',
      position: null,
      feedback: FEEDBACK_CAPABILITY_BUTTON_RED,
    },
    [0x0d]: {
      action: 'load',
      label: 'Load',
      position: null,
      feedback: null,
    },
    [0x0f]: {
      action: 'hotkey-mode-hot-cue',
      label: 'Hot Cue',
      position: {
        col: 2,
        row: 3,
      },
      feedback: null,
    },
    [0x10]: {
      action: 'hotkey-mode-roll',
      label: 'Roll',
      position: {
        col: 3,
        row: 3,
      },
      feedback: null,
    },
    [0x11]: {
      action: 'hotkey-mode-slicer',
      label: 'Slicer',
      position: {
        col: 4,
        row: 3,
      },
      feedback: null,
    },
    [0x12]: {
      action: 'hotkey-mode-sampler',
      label: 'Sampler',
      position: {
        col: 5,
        row: 3,
      },
      feedback: null,
    },
    [0x13]: {
      action: 'hotkey-mode-tones',
      label: 'Tones',
      position: {
        col: 2,
        row: 3,
      },
      feedback: null,
    },
    [0x14]: {
      action: 'hotkey-mode-fx',
      label: 'FX',
      position: {
        col: 3,
        row: 3,
      },
      feedback: null,
    },
    [0x15]: {
      action: 'hotkey-mode-slicer-loop',
      label: 'Slicer Loop',
      position: {
        col: 4,
        row: 3,
      },
      feedback: null,
    },
    [0x16]: {
      action: 'hotkey-mode-beat-jump',
      label: 'Beat Jump',
      position: {
        col: 5,
        row: 3,
      },
      feedback: null,
    },
  } satisfies Record<
    number,
    {
      action: DeckAction;
      label: string;
      position: MidiCoordinateInfo | null;
      feedback: FeedbackCapability | null;
    }
  >);

  type DeckNoteID = `${keyof typeof DECK_NOTES}`;

  const isDeckNote = (note: string): note is DeckNoteID => note in DECK_NOTES;

  const createDeckNotes = (midiChannel: 1 | 2 | 4 | 5) => {
    const deckId = CHANNEL_TO_DECK[midiChannel];
    const deckLabel = CHANNEL_TO_DECK_LABEL[midiChannel];
    const deckChannel = DECK_TO_RESOLVED_CHANNEL[deckId];
    const colStart = midiChannel === 1 || midiChannel === 4 ? 0 : 11;
    return Object.fromEntries(
      Object.entries(DECK_NOTES).map(
        ([note, { action, label, position, feedback }]) => {
          const isPlatter = note === PLATTER.toString();
          return [
            note as DeckNoteID,
            {
              id: isPlatter ? platterId(deckId) : `${deckId}.${note}`,
              label: `${deckLabel} ${label}`,
              note: [
                {
                  id: {
                    type: 'note',
                    channel: midiChannel,
                    note: getMidiNote(parseInt(note)),
                  },
                  nature: {
                    nature: 'deck',
                    action: action,
                    channel: deckChannel,
                  },
                },
              ],
              controlChange: isPlatter
                ? [
                    {
                      id: {
                        type: 'control-change',
                        channel: midiChannel,
                        controller: 0x09,
                      },
                      nature: {
                        nature: 'deck',
                        role: 'platter-adjust',
                        channel: deckChannel,
                      },
                    },
                    {
                      id: {
                        type: 'control-change',
                        channel: midiChannel,
                        controller: 0x0a,
                      },
                      nature: {
                        nature: 'deck',
                        role: 'platter-scratch',
                        channel: deckChannel,
                      },
                    },
                  ]
                : [],
              position: isPlatter
                ? {
                    // Hardcode platter touch positions as they are in center
                    col: colStart === 0 ? [2, 5] : [13, 16],
                    row: [7, 10],
                  }
                : action === 'pre-fader-listen' || action === 'load'
                  ? {
                      // Hardcode headphone positions as they are in center
                      col: colStart === 0 ? 8 : 10,
                      row: action === 'pre-fader-listen' ? 6 : 12,
                    }
                  : position
                    ? {
                        col:
                          typeof position.col === 'number'
                            ? position.col + colStart
                            : [
                                position.col[0] + colStart,
                                position.col[1] + colStart,
                              ],
                        row: position.row,
                      }
                    : undefined,
              feedback,
            },
          ] satisfies [DeckNoteID, FullyDefinedNote];
        },
      ),
    ) as Record<DeckNoteID, FullyDefinedNote>;
  };

  const createDeckFaders = (midiChannel: 1 | 2 | 4 | 5) => {
    const deckId = CHANNEL_TO_DECK[midiChannel];
    const deckChannel = DECK_TO_RESOLVED_CHANNEL[deckId];
    const col = midiChannel === 1 || midiChannel === 4 ? 8 : 10;
    return Object.freeze({
      [0x0]: {
        id: `${deckId}.volume`,
        controlChange: [
          {
            id: {
              type: 'control-change',
              channel: midiChannel,
              controller: 0x0,
            },
            nature: {
              nature: 'mixer',
              channel: deckChannel,
              role: 'upfader',
            },
          },
        ],
        position: {
          col,
          row: [2, 4],
          orientation: 'vertical',
        },
        feedback: null,
      },
      [0x1]: {
        id: `${deckId}.hlpf`,
        controlChange: [
          {
            id: {
              type: 'control-change',
              channel: midiChannel,
              controller: 0x1,
            },
            nature: {
              nature: 'mixer',
              channel: deckChannel,
              role: 'high-low-pass',
            },
          },
        ],
        position: {
          col,
          row: 7,
        },
        feedback: null,
      },
      [0x2]: {
        id: `${deckId}.eq-low`,
        controlChange: [
          {
            id: {
              type: 'control-change',
              channel: midiChannel,
              controller: 0x2,
            },
            nature: {
              nature: 'mixer',
              channel: deckChannel,
              role: 'eq',
              eq: 'low',
            },
          },
        ],
        position: {
          col,
          row: 8,
        },
        feedback: null,
      },
      [0x3]: {
        id: `${deckId}.eq-mid`,
        controlChange: [
          {
            id: {
              type: 'control-change',
              channel: midiChannel,
              controller: 0x3,
            },
            nature: {
              nature: 'mixer',
              channel: deckChannel,
              role: 'eq',
              eq: 'mid',
            },
          },
        ],
        position: {
          col,
          row: 9,
        },
        feedback: null,
      },
      [0x4]: {
        id: `${deckId}.eq-high`,
        controlChange: [
          {
            id: {
              type: 'control-change',
              channel: midiChannel,
              controller: 0x4,
            },
            nature: {
              nature: 'mixer',
              channel: deckChannel,
              role: 'eq',
              eq: 'high',
            },
          },
        ],
        position: {
          col,
          row: 10,
        },
        feedback: null,
      },
      [0x5]: {
        id: `${deckId}.gain`,
        controlChange: [
          {
            id: {
              type: 'control-change',
              channel: midiChannel,
              controller: 0x5,
            },
            nature: {
              nature: 'mixer',
              channel: deckChannel,
              role: 'gain',
            },
          },
        ],
        position: {
          col,
          row: 11,
        },
        feedback: null,
      },
      [0x6]: {
        id: `${deckId}.fx-level`,
        controlChange: [
          {
            id: {
              type: 'control-change',
              channel: midiChannel,
              controller: 0x6,
            },
            nature: {
              nature: 'mixer',
              channel: deckChannel,
              role: 'fx',
            },
          },
        ],
        position: {
          col: col === 8 ? 3 : 14,
          row: 12,
        },
        feedback: null,
      },
      [0x7]: {
        id: `${deckId}.dry-wet`,
        controlChange: [
          {
            id: {
              type: 'control-change',
              channel: midiChannel,
              controller: 0x7,
            },
            nature: {
              nature: 'mixer',
              channel: deckChannel,
              role: 'dry-wet',
            },
          },
        ],
        position: {
          col: col === 8 ? 4 : 15,
          row: 12,
        },
        feedback: null,
      },
      [0x8]: {
        id: `${deckId}.tempo`,
        controlChange: [
          {
            id: {
              type: 'control-change',
              channel: midiChannel,
              controller: 0x8,
            },
            nature: {
              nature: 'deck',
              channel: deckChannel,
              role: 'tempo',
            },
          },
        ],
        position: {
          col: col === 8 ? [6, 7] : [17, 18],
          row: [0, 3],
          orientation: 'vertical',
        },
        feedback: null,
      },
    } satisfies Partial<Record<string, FullyDefinedFader>>);
  };

  const createDeckItems = (midiChannel: 1 | 2 | 4 | 5) => {
    return {
      notes: createDeckNotes(midiChannel),
      faders: createDeckFaders(midiChannel),
    };
  };

  const HOTKEY_MODES: MidiHotkeyMode[] = [
    'hot-cue',
    'roll',
    'slicer',
    'sampler',
    'tones',
    'fx',
    'slicer-loop',
    'beat-jump',
  ];

  const HOTKEY_A_CHANNEL = 6;
  const HOTKEY_B_CHANNEL = 7;

  const createHotkeys = (side: 'a' | 'b') => {
    const colStart = side === 'a' ? 2 : 13;
    return Object.fromEntries(
      Array.from({ length: 128 }, (_, i) => [
        i,
        {
          id: `hotkey.${side}.${i}`,
          note: [
            {
              id: {
                type: 'note',
                channel: side === 'a' ? HOTKEY_A_CHANNEL : HOTKEY_B_CHANNEL,
                note: getMidiNote(i),
              },
              nature: {
                nature: 'deck-hotkey',
                channel: side === 'a' ? 0 : 1,
                index: i & 0x0f,
                mode: HOTKEY_MODES[i >> 4],
              },
            },
          ],
          position: {
            col: (i & 0x03) + colStart,
            row: (((i >> 2) & 1) ^ 1) << 1,
          },
          feedback: FEEDBACK_CAPABILITY_BUTTON_RED,
        } satisfies FullyDefinedNote,
      ]),
    ) as Record<string, FullyDefinedNote>;
  };

  const items = {
    deckA: createDeckItems(1),
    deckB: createDeckItems(2),
    deckC: createDeckItems(4),
    deckD: createDeckItems(5),
    hotkeysA: createHotkeys('a'),
    hotkeysB: createHotkeys('b'),
    main: {
      notes: MAIN_NOTES,
      cc: MAIN_FADERS,
    },
  };

  const allItems: Record<string, MidiControllerItem> = Object.fromEntries(
    [
      ...Object.values(items.deckA.notes),
      ...Object.values(items.deckB.notes),
      ...Object.values(items.deckC.notes),
      ...Object.values(items.deckD.notes),
      ...Object.values(items.deckA.faders),
      ...Object.values(items.deckB.faders),
      ...Object.values(items.deckC.faders),
      ...Object.values(items.deckD.faders),
      ...Object.values(items.hotkeysA),
      ...Object.values(items.hotkeysB),
      ...Object.values(items.main.notes),
      ...Object.values(items.main.cc),
    ].map((item) => [item.id, item]),
  );

  const getRelativeChange = (value: number) => {
    if (value >= 0x40 && value <= 0x7f) {
      return value - 0x80;
    }
    return value;
  };

  const pendingLsb: Record<DeckID | 'main', number[]> = {
    main: [],
    deckA: new Array(9),
    deckB: new Array(9),
    deckC: new Array(9),
    deckD: new Array(9),
  };

  return new MidiProfileBasic({
    getItem: (id) => allItems[id] ?? null,
    getItems: () => Object.values(allItems),
    getFeedbackCapabilities: () =>
      Object.freeze({
        [FEEDBACK_CAPABILITY_RING]: {
          led: {
            type: 'palette',
            brightnessValues: 1,
            palette: HERCULES_NOTE_TO_RGB.map(hexToRGB),
          },
        },
        [FEEDBACK_CAPABILITY_BUTTON_RED]: {
          led: {
            type: 'single',
            brightnessValues: 1,
            color: [255, 0, 0],
            modes: ['solid'],
          },
        },
        [FEEDBACK_CAPABILITY_BUTTON_WHITE]: {
          led: {
            type: 'single',
            brightnessValues: 1,
            color: [255, 255, 255],
            modes: ['solid'],
          },
        },
        [FEEDBACK_CAPABILITY_BUTTON_AMBER]: {
          led: {
            type: 'single',
            brightnessValues: 1,
            color: [255, 191, 0],
            modes: ['solid'],
          },
        },
        [FEEDBACK_CAPABILITY_BUTTON_GREEN]: {
          led: {
            type: 'single',
            brightnessValues: 1,
            color: [0, 255, 0],
            modes: ['solid'],
          },
        },
      } satisfies Record<FeedbackCapability, FeedbackCapabilityProfile>),
    getAction: (msg) => {
      if (msg.type === 'note') {
        const action = msg.velocity === 0 ? 'button-release' : 'button-press';
        const note = `${msg.note}`;
        let item: FullyDefinedNote | null = null;
        if (msg.channel === 0) {
          item =
            (MAIN_NOTES as Partial<Record<string, FullyDefinedNote>>)[note] ??
            null;
        } else if (isDeckChannel(msg.channel)) {
          const deckId = CHANNEL_TO_DECK[msg.channel];

          if (!isDeckNote(note)) return null;
          const deckNoteId = DECK_NOTES[note];

          if (!deckNoteId) return null;

          item = items[deckId].notes[note];
        } else if (msg.channel === HOTKEY_A_CHANNEL) {
          item = items.hotkeysA[note] ?? null;
        } else if (msg.channel === HOTKEY_B_CHANNEL) {
          item = items.hotkeysB[note] ?? null;
        }
        if (item) {
          return {
            item: item.id,
            action,
            nature: item.note[0].nature,
          };
        }
      } else if (msg.type === 'control-change') {
        if (msg.channel === 0) {
          if (msg.controller >= 0x1 && msg.controller <= 0x02) {
            const cc = BROWSE_BUTTON.controlChange.find(
              (c) => c.id.controller === msg.controller,
            );
            if (!cc) return null;
            return {
              item: BROWSE_BUTTON.id,
              action: 'relative-value',
              nature: cc.nature,
              degreesPerIncrement: 15,
              change: getRelativeChange(msg.value),
              precisionBits: 7,
            } satisfies MidiControllerAction;
          } else if (msg.controller < 0x20) {
            const item =
              (MAIN_FADERS as Partial<Record<string, FullyDefinedFader>>)[
                msg.controller
              ] ?? null;
            if (item) {
              pendingLsb.main[msg.controller] = msg.value;
              // MSB
              return {
                action: 'pending',
                item: item.id,
              } satisfies MidiControllerAction;
            }
          } else {
            const msbController = msg.controller - 0x20;
            const item =
              (MAIN_FADERS as Partial<Record<string, FullyDefinedFader>>)[
                msbController
              ] ?? null;
            const msb = pendingLsb.main[msbController];
            if (item && msb !== undefined) {
              return {
                action: 'absolute-value',
                item: item.id,
                nature: item.controlChange[0].nature,
                value: ((msb << 7) | msg.value) / 16383,
                precisionBits: 14,
              } satisfies MidiControllerAction;
            }
          }
        } else if (isDeckChannel(msg.channel)) {
          const deckId = CHANNEL_TO_DECK[msg.channel];
          if (msg.controller === 0x09 || msg.controller === 0x0a) {
            const item = items[deckId].notes[PLATTER];
            const nature = item.controlChange?.find(
              (c) => c.id.controller === msg.controller,
            )?.nature;
            if (!nature || !('role' in nature)) return null;
            return {
              item: item.id,
              action: 'relative-value',
              nature,
              degreesPerIncrement: 1,
              change: getRelativeChange(msg.value),
              precisionBits: 7,
            } satisfies MidiControllerAction;
          } else if (msg.controller < 0x20) {
            const info =
              (
                items[deckId].faders as Partial<
                  Record<string, FullyDefinedFader>
                >
              )[msg.controller] ?? null;
            if (info) {
              pendingLsb[deckId][msg.controller] = msg.value;
              // MSB
              return {
                action: 'pending',
                item: info.id,
              } satisfies MidiControllerAction;
            }
          } else {
            const msbController = msg.controller - 0x20;
            const item =
              (
                items[deckId].faders as Partial<
                  Record<string, FullyDefinedFader>
                >
              )[msbController] ?? null;
            const msb = pendingLsb[deckId][msbController];
            if (item && msb !== undefined) {
              return {
                action: 'absolute-value',
                item: item.id,
                nature: item.controlChange[0].nature,
                value: ((msb << 7) | msg.value) / 16383,
                precisionBits: 14,
              } satisfies MidiControllerAction;
            }
          }
        }
      }

      return null;
    },
  });
};

// prettier-ignore
export const HERCULES_NOTE_TO_RGB = Object.freeze([
  // 0
  '000000',
  '000055',
  '0000aa',
  '0000ff',
  '002400',
  '002455',
  '0024aa',
  '0024ff',
  '004800',
  '004855',
  '0048aa',
  '0048ff',
  '006d00',
  '006d55',
  '006daa',
  '006dff',
  // 1
  '009100',
  '009155',
  '0091aa',
  '0091ff',
  '00b600',
  '00b655',
  '00b6aa',
  '00b6ff',
  '00da00',
  '00da55',
  '00daaa',
  '00daff',
  '00ff00',
  '00ff55',
  '00ffaa',
  '00ffff',
  // 2
  '550000',
  '550055',
  '5500aa',
  '5500ff',
  '552400',
  '552455',
  '5524aa',
  '5524ff',
  '554800',
  '554855',
  '5548aa',
  '5548ff',
  '556d00',
  '556d55',
  '556daa',
  '556dff',
  // 3
  '559100',
  '559155',
  '5591aa',
  '5591ff',
  '55b600',
  '55b655',
  '55b6aa',
  '55b6ff',
  '55da00',
  '55da55',
  '55daaa',
  '55daff',
  '55ff00',
  '55ff55',
  '55ffaa',
  '55ffff',
  // 4
  'aa0000',
  'aa0055',
  'aa00aa',
  'aa00ff',
  'aa2400',
  'aa2455',
  'aa24aa',
  'aa24ff',
  'aa4800',
  'aa4855',
  'aa48aa',
  'aa48ff',
  'aa6d00',
  'aa6d55',
  'aa6daa',
  'aa6dff',
  // 5
  'aa9100',
  'aa9155',
  'aa91aa',
  'aa91ff',
  'aab600',
  'aab655',
  'aab6aa',
  'aab6ff',
  'aada00',
  'aada55',
  'aadaaa',
  'aadaff',
  'aaff00',
  'aaff55',
  'aaffaa',
  'aaffff',
  // 6
  'ff0000',
  'ff0055',
  'ff00aa',
  'ff00ff',
  'ff2400',
  'ff2455',
  'ff24aa',
  'ff24ff',
  'ff4800',
  'ff4855',
  'ff48aa',
  'ff48ff',
  'ff6d00',
  'ff6d55',
  'ff6daa',
  'ff6dff',
  // 7
  'ff9100',
  'ff9155',
  'ff91aa',
  'ff91ff',
  'ffb600',
  'ffb655',
  'ffb6aa',
  'ffb6ff',
  'ffda00',
  'ffda55',
  'ffdaaa',
  'ffdaff',
  'ffff00',
  'ffff55',
  'ffffaa',
  'ffffff',
]);

export const createHerculesColorSpace = (): ColorSpace<[number]> => {
  const rgb: RGB[] = HERCULES_NOTE_TO_RGB.map(hexToRGB);
  return createColorSpace({
    sizes: [rgb.length],
    argsToRgb: ([velocity]) => {
      const c = rgb[velocity];

      if (!c) {
        throw new Error(`Invalid RGB values for velocity: ${velocity}`);
      }

      return c;
    },
    precision: [5, 5, 5],
  });
};

let colorSpace: ColorSpace<[number]> | null = null;

export const createHerculesDJControlInpulse300FeedbackProfile: MidiFeedbackProfileInit =
  ({ inputProfile, sendMessage }) => {
    const items: Record<string, MidiControllerItem> = {};

    for (const item of inputProfile.getItems()) {
      items[item.id] = item;
    }

    const lastVelocities: Record<string, number> = {};

    const setItemColor: MidiFeedbackProfile['setItemColor'] = (
      id,
      feedback,
    ) => {
      const item = items[id];
      if (!item?.note) return;

      let channel: number | null = null;
      let velocity: number | null = null;
      let targetNote: number | null = null;
      for (const note of item.note) {
        channel = note.id.channel;
        if (note.id.channel === 0 && note.id.note === 0) {
          // Handle Energy Ring
          if (!colorSpace) {
            colorSpace = createHerculesColorSpace();
          }
          velocity = colorSpace.rgbToValue(feedback.color ?? [0, 0, 0])[0];
          targetNote = 0x5;
        } else {
          velocity = feedback.mode === 'empty' ? 0 : 0x7f;
          targetNote = note.id.note;
        }
      }
      if (channel === null || velocity === null || targetNote === null) return;

      const lastVelocity = lastVelocities[id] ?? null;
      if (lastVelocity === velocity) return;
      lastVelocities[id] = velocity;

      sendMessage([MIDI_NOTE_ON | channel, targetNote, velocity]);
    };

    return {
      clear: () => {
        for (const key in lastVelocities) {
          delete lastVelocities[key];
        }
        for (const item of inputProfile.getItems()) {
          setItemColor(item.id, { mode: 'empty' });
        }
      },
      setItemColor,
      setItemValue: () => {
        // no-op
      },
      frameFinished: () => {
        // no-op
      },
    } satisfies MidiFeedbackProfile;
  };

export const HERCULES_DJCONTROL_INPULSE_300: MidiProfileDefinition = {
  name: 'Hercules DJControl Inpulse 300',
  testing: {
    ready: true,
    maintainers: [
      {
        ghUsername: 's0',
        os: ['macos'],
        date: '2026-10-15',
      },
    ],
  },
  autoSelect: (connection: MidiInputConnectionInfo) =>
    connection.inputDeviceName.includes('DJControl Inpulse 300'),
  subProfiles: {
    default: {
      input: createHerculesDJControlInpulse300Profile,
      feedback: createHerculesDJControlInpulse300FeedbackProfile,
    },
  },
};
