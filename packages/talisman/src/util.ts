import { getMidiChannel, getMidiController, getMidiNote } from './index.js';
import type {
  MidiHotkeyMode,
  MidiControllerAction,
  MidiControllerItem,
  MidiCoordinateInfo,
  MidiBindableIdentity,
  MidiParsedMessage,
} from './core.js';

export const colorArrayToColor = (
  arr: readonly number[],
  index: number,
): [number, number, number] => {
  const start = index * 3;
  if (index < 0 || start + 2 >= arr.length) {
    throw new Error('Index out of bounds for color array');
  }
  return [arr[start]!, arr[start + 1]!, arr[start + 2]!];
};

/**
 * Extract the consistent {@link MidiBindableIdentity} for a particular message,
 * useful to capture binding information during a "learn",
 * or to look-up a binding on receipt of a message.
 */
export const midiMessageToIdentity = (
  message: MidiParsedMessage,
): MidiBindableIdentity | null => {
  switch (message.type) {
    case 'note':
      return {
        type: 'note',
        channel: message.channel,
        note: message.note,
      };
    case 'polyphonic-aftertouch':
      return {
        type: 'polyphonic-aftertouch',
        channel: message.channel,
        note: message.note,
      };
    case 'control-change':
      return {
        type: 'control-change',
        channel: message.channel,
        controller: message.controller,
      };
    case 'program-change':
      return message;
    case 'channel-aftertouch':
      return {
        type: 'channel-aftertouch',
        channel: message.channel,
      };
    case 'pitch-wheel':
      return {
        type: 'pitch-wheel',
        channel: message.channel,
      };
    case 'mtc':
    case 'sysex':
    case 'other':
      return null;
  }
  const _exhaustiveCheck: never = message;
  throw new Error(`Unhandled MIDI message type: ${JSON.stringify(message)}`);
};

const KEY_PREFIXES: Record<MidiBindableIdentity['type'], string> = {
  note: 'n',
  'polyphonic-aftertouch': 'pa',
  'control-change': 'cc',
  'program-change': 'pc',
  'channel-aftertouch': 'ca',
  'pitch-wheel': 'pw',
};

/**
 * Produce a unique and sortable key for a given {@link MidiBindableIdentity}.
 *
 * This can be used to store & look-up bindings for a particular identity.
 *
 * Keys are guaranteed to be alphanumerically sorted by channel / note /
 * controller etc... as numbers are zero-padded.
 */
export const midiIdentityToKey = (identity: MidiBindableIdentity): string => {
  const ch = identity.channel.toString().padStart(2, '0');
  const prefix = KEY_PREFIXES[identity.type];
  switch (identity.type) {
    case 'note':
      return `${ch}-${prefix}-${identity.note.toString().padStart(3, '0')}`;
    case 'polyphonic-aftertouch':
      return `${ch}-${prefix}-${identity.note.toString().padStart(3, '0')}`;
    case 'control-change':
      return `${ch}-${prefix}-${identity.controller.toString().padStart(3, '0')}`;
    case 'program-change':
      return `${ch}-${prefix}-${identity.program.toString().padStart(3, '0')}`;
    case 'channel-aftertouch':
      return `${ch}-${prefix}`;
    case 'pitch-wheel':
      return `${ch}-${prefix}`;
  }
};

/**
 * Convert a string produced by {@link midiIdentityToKey} back into the
 * {@link MidiBindableIdentity} that it represents.
 *
 * The intention for this is to allow string identities to be used in user config
 * storage (for example as object keys),
 * and avoid having to store additional structured data about the identity
 * itself, avoiding issues that may arise from duplicate / non-canonical
 * data being stored.
 */
export const midiKeyToIdentity = (key: string): MidiBindableIdentity | null => {
  const [channelString, type, idString] = key.split('-');

  if (!type || !channelString) {
    return null;
  }

  const channel = getMidiChannel(parseInt(channelString, 10), null);

  if (channel === null) {
    return null;
  }

  switch (type) {
    case KEY_PREFIXES['channel-aftertouch']:
      return {
        type: 'channel-aftertouch',
        channel,
      };
    case KEY_PREFIXES['pitch-wheel']:
      return {
        type: 'pitch-wheel',
        channel,
      };
  }

  if (!idString) {
    return null;
  }

  const value = parseInt(idString, 10);
  if (isNaN(value)) {
    return null;
  }

  switch (type) {
    case KEY_PREFIXES['note']: {
      const note = getMidiNote(value, null);
      if (note === null) {
        return null;
      }
      return {
        type: 'note',
        channel,
        note,
      };
    }
    case KEY_PREFIXES['polyphonic-aftertouch']: {
      const note = getMidiNote(value, null);
      if (note === null) {
        return null;
      }
      return {
        type: 'polyphonic-aftertouch',
        channel,
        note,
      };
    }
    case KEY_PREFIXES['control-change']: {
      const controller = getMidiController(value, null);
      if (controller === null) {
        return null;
      }
      return {
        type: 'control-change',
        channel,
        controller,
      };
    }
    case KEY_PREFIXES['program-change']:
      return {
        type: 'program-change',
        channel,
        program: value,
      };
  }
  return null;
};

export const midiNumberToValues = (
  endianness: 'big' | 'little',
  value: number,
  bytes: number,
) => {
  const values = [];
  for (let i = 0; i < bytes; i++) {
    const j = endianness === 'big' ? bytes - i - 1 : i;
    values.push((value >> (j * 7)) & 0x7f);
  }
  return values;
};

export type MidiCoordinatePoint = { row: number; col: number };
export type MidiCoordinatePartialPoint = {
  row: number | null;
  col: number | null;
};

export function* getPositions(
  p: MidiCoordinateInfo | null | undefined,
): Generator<MidiCoordinatePoint> {
  if (!p) {
    return;
  }
  if (p.row !== undefined) {
    const rStart = typeof p.row === 'number' ? p.row : p.row[0];
    const rEnd = typeof p.row === 'number' ? p.row : p.row[1];
    for (let r = rStart; r <= rEnd; r++) {
      if (p.col !== undefined) {
        const cStart = typeof p.col === 'number' ? p.col : p.col[0];
        const cEnd = typeof p.col === 'number' ? p.col : p.col[1];
        for (let c = cStart; c <= cEnd; c++) {
          yield { row: r, col: c };
        }
      }
    }
  }
}

export function* getRowsAndColumns(
  p: MidiCoordinateInfo | null | undefined,
): Generator<{ row: number } | { col: number }> {
  if (!p) {
    return;
  }
  if (p.row !== undefined) {
    const rStart = typeof p.row === 'number' ? p.row : p.row[0];
    const rEnd = typeof p.row === 'number' ? p.row : p.row[1];
    for (let r = rStart; r <= rEnd; r++) {
      yield { row: r };
    }
  }
  if (p.col !== undefined) {
    const cStart = typeof p.col === 'number' ? p.col : p.col[0];
    const cEnd = typeof p.col === 'number' ? p.col : p.col[1];
    for (let c = cStart; c <= cEnd; c++) {
      yield { col: c };
    }
  }
}

export function getCenterPosition(
  p: MidiCoordinateInfo | null | undefined,
  requireBoth: true,
): MidiCoordinatePoint | null;
export function getCenterPosition(
  p: MidiCoordinateInfo | null | undefined,
  requireBoth?: false,
): MidiCoordinatePartialPoint;
export function getCenterPosition(
  p: MidiCoordinateInfo | null | undefined,
  requireBoth?: boolean,
): MidiCoordinatePartialPoint | null {
  const row =
    typeof p?.row === 'number'
      ? p.row
      : p?.row
        ? (p.row[0] + p.row[1]) / 2
        : null;
  const col =
    typeof p?.col === 'number'
      ? p.col
      : p?.col
        ? (p.col[0] + p.col[1]) / 2
        : null;
  if (requireBoth && (row === null || col === null)) {
    return null;
  }
  return { row, col };
}

export type MidiGridArea = {
  minCol: number;
  maxCol: number;
  minRow: number;
  maxRow: number;
};

export const getCoordinateRanges = (
  items: Iterable<MidiControllerItem>,
): MidiGridArea => {
  let minCol = Infinity;
  let maxCol = -Infinity;
  let minRow = Infinity;
  let maxRow = -Infinity;

  for (const note of items) {
    if (!note.position) {
      continue;
    }
    const { col, row } = note.position;
    const cs = typeof col === 'number' ? [col] : (col ?? []);
    const rs = typeof row === 'number' ? [row] : (row ?? []);
    minCol = Math.min(minCol, ...cs);
    maxCol = Math.max(maxCol, ...cs);
    minRow = Math.min(minRow, ...rs);
    maxRow = Math.max(maxRow, ...rs);
  }

  return {
    minCol,
    maxCol,
    minRow,
    maxRow,
  };
};

const addCoordinatesToLabel = (
  label: string,
  position: MidiCoordinateInfo | null | undefined,
): string => {
  if (!position) {
    return label;
  }
  let col: string | null = null;
  if (position.col !== undefined) {
    if (typeof position.col === 'number') {
      col = `${position.col}`;
    } else {
      col = `${position.col[0]}-${position.col[1]}`;
    }
  }

  let row: string | null = null;
  if (position.row !== undefined) {
    if (typeof position.row === 'number') {
      row = `${position.row}`;
    } else {
      row = `${position.row[0]}-${position.row[1]}`;
    }
  }

  const coordinates = `[${col ?? '-'}, ${row ?? '-'}]`;
  if (label) {
    return `${label} ${coordinates}`;
  } else {
    return coordinates;
  }
};

const HOTKEY_MODE_LABEL: Record<MidiHotkeyMode, string> = {
  'hot-cue': 'Hot Cue ',
  roll: 'Roll ',
  slicer: 'Slicer ',
  sampler: 'Sampler ',
  tones: 'Tones ',
  fx: 'FX ',
  'slicer-loop': 'Slicer Loop ',
  'beat-jump': 'Beat Jump ',
};

export type MidiMessageDescription = {
  /**
   * A description of the MIDI message (without value information),
   * that will remain the same when user continues to interact with the item.
   */
  description: string;
  /**
   * Test describing the value of this specific message
   */
  value: string | null;
};

export const getMidiMessageDescription = (
  message: MidiParsedMessage,
  item: MidiControllerItem | null,
  action: MidiControllerAction | null,
): MidiMessageDescription | null => {
  if (action) {
    if (action.action === 'pending') {
      return {
        description: 'Pending (partial information)',
        value: '',
      };
    }
    if (
      action.action === 'button-press' ||
      action.action === 'button-release'
    ) {
      let description: string;
      switch (action.nature.nature) {
        case 'grid':
          description = 'Grid';
          break;
        case 'modifier':
          description = `Modifier: ${action.nature.modifier}`;
          break;
        case 'bank-change':
          description = `Change Bank: ${action.nature.bank}`;
          break;
        case 'mode-change':
          description = `Change Mode: ${action.nature.mode}`;
          break;
        case 'edit':
          description = `Edit: ${action.nature.action}`;
          break;
        case 'channel':
          description = `Channel${action.nature.channel !== undefined ? ` ${action.nature.channel}` : ''}: ${action.nature.action}`;
          break;
        case 'deck':
          description = `Deck ${action.nature.channel}: ${action.nature.action}`;
          break;
        case 'deck-hotkey': {
          const mode = action.nature.mode
            ? HOTKEY_MODE_LABEL[action.nature.mode]
            : '';
          description = `Deck ${action.nature.channel} ${mode}Hotkey: ${action.nature.index}`;
          break;
        }
        case 'navigation':
          description = `Navigation: ${action.nature.navigation}`;
          break;
        case 'unknown':
          description = item?.label ? `Unknown - ${item?.label}` : `Unknown`;
          break;
        default: {
          const _n: never = action.nature;
          throw new Error(
            `Unhandled action nature: ${JSON.stringify(action.nature)}`,
          );
        }
      }
      if ('bank' in action.nature) {
        description += ` [Bank ${action.nature.bank}]`;
      }
      return {
        description: addCoordinatesToLabel(description, item?.position),
        value: action.action === 'button-press' ? 'Press' : 'Release',
      };
    }
    if (
      action.action === 'absolute-value' ||
      action.action === 'relative-value'
    ) {
      let value = '';
      if (action.action === 'absolute-value') {
        value = `Value: ${action.value.toFixed(5)}`;
      } else if (action.action === 'relative-value') {
        value = `Relative Value: ${action.change}${action.degreesPerIncrement ? ` (${(action.degreesPerIncrement * action.change).toFixed(2)}°)` : ''}`;
      }

      value += ` [${action.precisionBits}bit]`;

      let description: string;
      switch (action.nature.nature) {
        case 'fader':
          description = `Fader: ${action.nature.role}`;
          break;
        case 'encoder':
          description = `Encoder: ${action.nature.role}`;
          break;
        case 'xy-pad':
          description = `XY Pad: ${action.nature.role}`;
          break;
        case 'deck':
          description = `Deck ${action.nature.channel}: ${action.nature.role}`;
          break;
        case 'mixer':
          description = `Mixer ${action.nature.channel}: ${action.nature.role}${action.nature.role === 'eq' ? ` - ${action.nature.eq}` : ''}`;
          break;
        case 'navigation':
          description = `Navigation: ${action.nature.role}`;
          break;
        case 'unknown':
          description = item?.label ? `Unknown - ${item?.label}` : `Unknown`;
          break;
        default: {
          const _n: never = action.nature;
          throw new Error(
            `Unhandled action nature: ${JSON.stringify(action.nature)}`,
          );
        }
      }
      if ('bank' in action.nature) {
        description += ` [Bank ${action.nature.bank}]`;
      }
      return {
        description: addCoordinatesToLabel(description, item?.position),
        value,
      };
    }

    if (action.action === 'duplicate') {
      return {
        description: 'Duplicate',
        value: null,
      };
    }

    const _n: never = action.action;
    throw new Error(`Unhandled action: ${JSON.stringify(action)}`);
  }
  if (message.type === 'mtc') {
    return { description: 'MTC Message', value: null };
  }
  if (message.type === 'sysex') {
    return { description: 'SysEx Message', value: null };
  }

  return null;
};

export const startsWithSysex = (
  message: number[],
  header: number[],
): boolean => {
  if (message.length < header.length) return false;
  for (let i = 0; i < header.length; i++) {
    if (message[i] !== header[i]) return false;
  }
  return true;
};
