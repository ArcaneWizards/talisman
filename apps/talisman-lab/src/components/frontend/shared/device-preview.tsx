import { FC, ReactNode, SVGProps, useMemo } from 'react';
import { TalismanFullProfileInfo } from './device-profile-details';
import {
  MIDI_NOTE_OPTIONS,
  MidiButtonNature,
  MidiControllerItem,
  MidiNumericNature,
} from '@arcanewizards/talisman';

type CellSpan = {
  cols: [number, number];
  rows: [number, number];
};

const getCellSpan = ({ position }: MidiControllerItem): CellSpan | null => {
  const { col, row } = position || {};
  if (col === undefined || row === undefined) return null;
  const cols: [number, number] = typeof col === 'number' ? [col, col] : col;
  const rows: [number, number] = typeof row === 'number' ? [row, row] : row;
  return {
    cols,
    rows,
  };
};

const getSpanFingerprint = (span: CellSpan) => {
  const { cols, rows } = span;
  return `${cols[0]}-${cols[1]}:${rows[0]}-${rows[1]}`;
};

type GridInfoCell = {
  span: CellSpan;
  items: MidiControllerItem[];
};

type ResolvedInfoCell = GridInfoCell & {
  type: 'visible' | 'overlap';
};

type GridInfo = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  cols: number;
  rows: number;
  cells: ResolvedInfoCell[];
};

export const createGridInfo = (
  items: MidiControllerItem[],
): GridInfo | null => {
  // Determine the size of the grid
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const item of items) {
    const span = getCellSpan(item);
    if (!span) continue;
    const { cols, rows } = span;
    minX = Math.min(minX, ...cols);
    maxX = Math.max(maxX, ...cols);
    minY = Math.min(minY, ...rows);
    maxY = Math.max(maxY, ...rows);
  }

  if (minX > maxX || minY > maxY) {
    // No grid data available
    return null;
  }

  /**
   * Position fingerprint to the items in those positions
   */
  const positionToItems = new Map<string, GridInfoCell>();
  /**
   * Cells to the positions they cover
   */
  const cellToPosisions: Set<string>[][] = Array.from(
    { length: maxX - minX + 1 },
    () => Array.from({ length: maxY - minY + 1 }, () => new Set<string>()),
  );

  for (const item of items) {
    const span = getCellSpan(item);
    if (!span) continue;

    const fingerprint = getSpanFingerprint(span);

    let cell = positionToItems.get(fingerprint);
    if (!cell) {
      cell = { span, items: [] };
      positionToItems.set(fingerprint, cell);
    }

    cell.items.push(item);

    const { cols, rows } = span;
    for (let x = cols[0]; x <= cols[1]; x++) {
      for (let y = rows[0]; y <= rows[1]; y++) {
        cellToPosisions[x - minX]?.[y - minY]?.add(fingerprint);
      }
    }
  }

  /**
   * resulting array
   */
  const cells: ResolvedInfoCell[] = [];

  // For each position fingerpring, determine if it's non overlapping
  // and add it to this map if so
  /**
   * positions that don't overlap with any other position
   */
  const visibleCells = new Set<string>();
  fingerprintLoop: for (const [
    fingerprint,
    cell,
  ] of positionToItems.entries()) {
    for (let x = cell.span.cols[0]; x <= cell.span.cols[1]; x++) {
      for (let y = cell.span.rows[0]; y <= cell.span.rows[1]; y++) {
        if ((cellToPosisions[x - minX]?.[y - minY]?.size ?? 0) > 1) {
          continue fingerprintLoop;
        }
      }
    }
    cells.push({ ...cell, type: 'visible' });
    visibleCells.add(fingerprint);
  }

  // For each coordinate, see if there are any positions that are present that
  // are not yet visible, and then add them to the result if so.

  for (let x = 0; x < cellToPosisions.length; x++) {
    const col = cellToPosisions[x];
    if (!col) continue;
    for (let y = 0; y < col.length; y++) {
      const row = col[y];
      if (!row) continue;
      if (
        Array.from(row).some((fingerprint) => !visibleCells.has(fingerprint))
      ) {
        // Add this cell, as it has positions that are missing
        const items: MidiControllerItem[] = [];
        for (const fingerprint of row) {
          const cell = positionToItems.get(fingerprint);
          if (cell) {
            items.push(...cell.items);
          }
        }
        cells.push({
          span: { cols: [x, x], rows: [y, y] },
          items,
          type: 'overlap',
        });
      }
    }
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    cols: maxX - minX + 1,
    rows: maxY - minY + 1,
    cells,
  };
};

export type MidiDevicePreviewProps = Omit<
  SVGProps<SVGSVGElement>,
  'viewBox'
> & {
  /**
   * Internal SVG definitions can interfere with other SVG elements on the same
   * page, so this value must be set to something unique on the page
   */
  namespace: string;
  info: TalismanFullProfileInfo;
  colors: {
    cellBackground: string;
    cellBorder: string;
  };
};

const MARGIN = 10;
const GAP = 10;
const GRID_SIZE = 100;
const TEXT_HEIGHT = GRID_SIZE / 3;
const FONT_HEIGHT = TEXT_HEIGHT * 0.9;
const MIN_FONT_HEIGHT = FONT_HEIGHT * 0.4;
const FONT_WIDTH = FONT_HEIGHT * 0.6;

const natureDescription = (nature: MidiButtonNature | MidiNumericNature) => {
  switch (nature.nature) {
    case 'grid':
      return 'grid';
    case 'modifier':
      return nature.modifier;
    case 'bank-change':
      return `bank ${nature.bank}`;
    case 'mode-change':
      return `mode ${nature.mode}`;
    case 'edit':
      return nature.action;
    case 'channel':
      return nature.channel === undefined
        ? nature.action
        : `ch ${nature.channel} ${nature.action}`;
    case 'deck':
      return 'role' in nature
        ? `deck ${nature.channel} ${nature.role}`
        : `deck ${nature.channel} ${nature.action}`;
    case 'deck-hotkey':
      return `deck ${nature.channel} hotkey ${nature.index}`;
    case 'navigation':
      return 'role' in nature
        ? nature.role
        : nature.bank === undefined
          ? nature.navigation
          : `bank ${nature.bank} ${nature.navigation}`;
    case 'unknown':
      return null;
  }
};

const itemDescription = (item: MidiControllerItem) => {
  if (item.label) {
    return item.label;
  }

  // Use note / controller natures if there is no label
  const descriptions = new Set<string>();
  for (const note of item?.note || []) {
    if (note.nature) {
      const description = natureDescription(note.nature);
      if (description) {
        descriptions.add(description);
      }
    }
  }
  for (const cc of item?.controlChange || []) {
    if (cc.nature) {
      const description = natureDescription(cc.nature);
      if (description) {
        descriptions.add(description);
      }
    }
  }

  if (descriptions.size > 0) {
    return Array.from(descriptions).join(', ');
  }

  for (const note of item?.note || []) {
    descriptions.add(`CH${note.id.channel} ${MIDI_NOTE_OPTIONS[note.id.note]}`);
  }

  for (const cc of item?.controlChange || []) {
    descriptions.add(`CH${cc.id.channel} CC ${cc.id.controller}`);
  }

  if (descriptions.size > 0) {
    return Array.from(descriptions).join(', ');
  }

  return 'UNKNOWN';
};

export const MidiDevicePreview: FC<MidiDevicePreviewProps> = ({
  info,
  namespace,
  colors: rawColors,
  ...props
}) => {
  const gridInfo = useMemo(() => createGridInfo(info.items), [info.items]);

  /**
   * Memoize colors to avoid fresh object references from re-rendering everything
   */
  const c = useMemo(
    () => ({
      cellBackground: rawColors.cellBackground,
      cellBorder: rawColors.cellBorder,
    }),
    [rawColors.cellBackground, rawColors.cellBorder],
  );

  const elements = useMemo(() => {
    if (!gridInfo) return null;

    const vw =
      MARGIN * 2 + GRID_SIZE * gridInfo?.cols + GAP * (gridInfo?.cols - 1);
    const vh =
      MARGIN * 2 + GRID_SIZE * gridInfo?.rows + GAP * (gridInfo?.rows - 1);

    const defs: ReactNode[] = [];
    const items: ReactNode[] = [];

    for (let i = 0; i < gridInfo.cells.length; i++) {
      const cell = gridInfo.cells[i];
      if (!cell) continue;
      const width =
        GRID_SIZE * (cell.span.cols[1] - cell.span.cols[0] + 1) +
        GAP * (cell.span.cols[1] - cell.span.cols[0]);
      const height =
        GRID_SIZE * (cell.span.rows[1] - cell.span.rows[0] + 1) +
        GAP * (cell.span.rows[1] - cell.span.rows[0]);
      const x = MARGIN + cell.span.cols[0] * (GRID_SIZE + GAP);
      const y = vh - (MARGIN + cell.span.rows[0] * (GRID_SIZE + GAP)) - height;

      const textMaskId = `${namespace}-text-mask-${i}`;

      defs.push(
        <mask id={textMaskId} key={textMaskId}>
          <rect
            x={x}
            y={y + height - TEXT_HEIGHT}
            width={width}
            height={TEXT_HEIGHT}
            fill="white"
            stroke="black"
          />
        </mask>,
      );

      items.push(
        <rect
          key={`cell-${i}`}
          x={x}
          y={y}
          width={width}
          height={height}
          fill={c.cellBackground}
          stroke={c.cellBorder}
        />,
      );

      items.push(
        <rect
          key={`text-bg-${i}`}
          x={x}
          y={y + height - TEXT_HEIGHT}
          width={width}
          height={TEXT_HEIGHT}
          fill={c.cellBackground}
          stroke={c.cellBorder}
        />,
      );

      const item =
        (cell.type === 'visible' && cell.items.length === 1 && cell.items[0]) ||
        null;
      const description = item ? itemDescription(item) : null;

      const labelText =
        description ??
        (cell.type === 'visible'
          ? cell.items.length > 1
            ? 'MULTIPLE'
            : 'UNKNOWN'
          : 'OVERLAP');

      const labelWidth = labelText ? labelText.length * FONT_WIDTH : 0;
      const maxTextWidth = width - GAP;
      const maxChars = Math.floor(
        ((maxTextWidth / FONT_WIDTH) * FONT_HEIGHT) / MIN_FONT_HEIGHT,
      );
      const adjustedHeight = Math.max(
        MIN_FONT_HEIGHT,
        Math.min(FONT_HEIGHT, (maxTextWidth / labelWidth) * FONT_HEIGHT),
      );

      const lines =
        adjustedHeight > MIN_FONT_HEIGHT
          ? [labelText]
          : [
              labelText.substring(0, maxChars),
              labelText.length > maxChars * 2
                ? `${labelText.substring(maxChars, maxChars * 2 - 1)}…`
                : labelText.substring(maxChars),
            ];

      items.push(
        <g key={`text-${i}`} mask={`url(#${textMaskId})`}>
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="currentColor"
            fontSize={adjustedHeight}
            fontFamily="monospace"
          >
            {lines.map((line, index) => (
              <tspan
                key={index}
                x={x + width / 2}
                y={
                  y +
                  height -
                  TEXT_HEIGHT / 2 +
                  (lines.length === 1
                    ? 0
                    : (index - (lines.length - 1) / 2) * adjustedHeight)
                }
              >
                {line}
              </tspan>
            ))}
          </text>
        </g>,
      );
    }

    return { vh, vw, defs, items };
  }, [namespace, gridInfo, c]);

  if (!elements)
    return (
      <svg viewBox={`0 0 200 50`} {...props}>
        <text
          x="100"
          y="25"
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
        >
          <tspan x="100" y="18">
            MIDI device has
          </tspan>
          <tspan x="100" y="32">
            no positional info
          </tspan>
        </text>
      </svg>
    );

  const { vh, vw, defs, items } = elements;

  return (
    <svg viewBox={`0 0 ${vw} ${vh}`} {...props}>
      <defs>{defs}</defs>
      {items}
    </svg>
  );
};
