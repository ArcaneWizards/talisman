import { FC, ReactNode, SVGProps, useMemo } from 'react';
import { TalismanFullProfileInfo } from './device-profile-details';
import {
  MIDI_NOTE_OPTIONS,
  MidiButtonNature,
  MidiControllerItem,
  MidiNumericNature,
} from '@arcanewizards/talisman';

const isDefined = <T,>(value: T | undefined | null): value is T =>
  value !== undefined && value !== null;

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

export type MidiPreviewColorsProp = {
  cellBackground: string;
  border: string;
  text: string;
  hover: string;
  highlight: string;
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
  colors: MidiPreviewColorsProp;
  onItemsSelected?: (selectedItems: MidiControllerItem[]) => void;
  selectedItems?: Array<{
    item: MidiControllerItem;
    opacity: number;
  }>;
};

const MARGIN = 10;
const GAP = 10;
const GRID_SIZE = 100;
const TEXT_HEIGHT = GRID_SIZE / 3;
const FONT_HEIGHT = TEXT_HEIGHT * 0.8;
const MIN_FONT_HEIGHT = FONT_HEIGHT * 0.4;
const FONT_WIDTH = FONT_HEIGHT * 0.6;

const FEEDBACK_WIDTH = GRID_SIZE;
const FEEDBACK_HEIGHT = GRID_SIZE - TEXT_HEIGHT;
const FEEDBACK_FONT_SIZE = GRID_SIZE / 6;

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
    case 'encoder':
      return nature.role === 'grid' ? 'grid encoder' : 'encoder';
    case 'fader':
      return nature.bank === undefined
        ? nature.role
        : `bank ${nature.bank} ${nature.role}`;
    case 'mixer':
      return `CH ${nature.channel} ${nature.role}`;
    case 'xy-pad':
      return `xy-pad ${nature.role}`;
    case 'unknown':
      return null;
  }
  const _exhaustiveCheck: never = nature;
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

const feedbackSymbolId = (namespace: string, key: string) =>
  `${namespace}-feedback-${key}`;

type UseFeedbackSymbolsArgs = {
  /**
   * Internal SVG definitions can interfere with other SVG elements on the same
   * page, so this value must be set to something unique on the page
   */
  namespace: string;
  info: TalismanFullProfileInfo;
  colors: MidiPreviewColorsProp;
};

const useFeedbackSymbols = ({
  namespace,
  info,
  colors: c,
}: UseFeedbackSymbolsArgs) => {
  const rainbowGradient = `${namespace}-rainbow-gradient`;

  const defs = useMemo(
    () => (
      <linearGradient id={rainbowGradient} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="red" />
        <stop offset="16.66%" stopColor="orange" />
        <stop offset="33.33%" stopColor="yellow" />
        <stop offset="50%" stopColor="green" />
        <stop offset="66.66%" stopColor="blue" />
        <stop offset="83.33%" stopColor="indigo" />
        <stop offset="100%" stopColor="violet" />
      </linearGradient>
    ),
    [rainbowGradient],
  );

  const symbols = useMemo(() => {
    const symbols: ReactNode[] = [];
    const margin = GRID_SIZE / 16;

    for (const [key, value] of Object.entries(info.feedbackCapabilities)) {
      const id = feedbackSymbolId(namespace, key);

      if (value.led) {
        if (value.led.type === 'single') {
          symbols.push(
            <symbol
              id={id}
              key={id}
              viewBox={`0 0 ${FEEDBACK_WIDTH} ${FEEDBACK_HEIGHT}`}
            >
              <path
                d={`M${margin} ${margin} H${FEEDBACK_WIDTH - margin} L${margin} ${FEEDBACK_HEIGHT - margin} Z`}
                fill={`rgb(${value.led.color.join(',')})`}
              />
              <text
                x={FEEDBACK_WIDTH / 2}
                y={FEEDBACK_HEIGHT / 2}
                textAnchor="middle"
                alignmentBaseline="middle"
                fill={c.text}
                fontFamily="monospace"
                fontWeight="bold"
                fontSize={FEEDBACK_FONT_SIZE}
                stroke={c.border}
                strokeWidth={FEEDBACK_FONT_SIZE / 2}
                paintOrder="stroke"
              >
                ON/OFF
              </text>
            </symbol>,
          );
          continue;
        }

        if (value.led.type === 'rgb') {
          const bits =
            value.led.limits.bBits +
            value.led.limits.gBits +
            value.led.limits.rBits;
          symbols.push(
            <symbol
              id={id}
              key={id}
              viewBox={`0 0 ${FEEDBACK_WIDTH} ${FEEDBACK_HEIGHT}`}
            >
              <rect
                x={margin}
                y={margin}
                width={FEEDBACK_WIDTH - margin * 2}
                height={FEEDBACK_HEIGHT - margin * 2}
                fill={`url(#${rainbowGradient})`}
              />
              <text
                x={FEEDBACK_WIDTH / 2}
                y={FEEDBACK_HEIGHT / 2 - GRID_SIZE / 8}
                textAnchor="middle"
                alignmentBaseline="middle"
                fill={c.text}
                fontFamily="monospace"
                fontWeight="bold"
                fontSize={FEEDBACK_FONT_SIZE}
                stroke={c.border}
                strokeWidth={FEEDBACK_FONT_SIZE / 2}
                paintOrder="stroke"
              >
                {bits}bit
              </text>
              <text
                x={FEEDBACK_WIDTH / 2}
                y={FEEDBACK_HEIGHT / 2 + GRID_SIZE / 8}
                textAnchor="middle"
                alignmentBaseline="middle"
                fill={c.text}
                fontFamily="monospace"
                fontWeight="bold"
                fontSize={FEEDBACK_FONT_SIZE}
                stroke={c.border}
                strokeWidth={FEEDBACK_FONT_SIZE / 2}
                paintOrder="stroke"
              >
                RGB
              </text>
            </symbol>,
          );
          continue;
        }

        if (value.led.type === 'palette') {
          const colors = value.led.palette;
          const showColors = Math.min(8, colors.length);
          const isEven = showColors % 2 === 0;

          const pGridWidth =
            (FEEDBACK_WIDTH - margin * 2) /
            (isEven ? showColors / 2 : showColors);
          const pGridHeight = (FEEDBACK_HEIGHT - margin * 2) / (isEven ? 2 : 1);

          const grid: ReactNode[] = [];
          for (let i = 0; i < showColors; i++) {
            const color = colors[Math.round(i * (colors.length / showColors))];
            if (!color) continue;
            const row = isEven ? Math.floor(i / (showColors / 2)) : 0;
            const col = isEven ? i % (showColors / 2) : i;
            const x = col * pGridWidth + margin;
            const y = row * pGridHeight + margin;
            grid.push(
              <rect
                key={i}
                x={x}
                y={y}
                width={pGridWidth}
                height={pGridHeight}
                fill={`rgb(${color.join(',')})`}
              />,
            );
          }

          symbols.push(
            <symbol
              id={id}
              key={id}
              viewBox={`0 0 ${FEEDBACK_WIDTH} ${FEEDBACK_HEIGHT}`}
            >
              {grid}
              <text
                x={FEEDBACK_WIDTH / 2}
                y={FEEDBACK_HEIGHT / 2 - GRID_SIZE / 8}
                textAnchor="middle"
                alignmentBaseline="middle"
                fill={c.text}
                fontFamily="monospace"
                fontWeight="bold"
                fontSize={FEEDBACK_FONT_SIZE}
                stroke={c.border}
                strokeWidth={FEEDBACK_FONT_SIZE / 2}
                paintOrder="stroke"
              >
                {colors.length}
              </text>
              <text
                x={FEEDBACK_WIDTH / 2}
                y={FEEDBACK_HEIGHT / 2 + GRID_SIZE / 8}
                textAnchor="middle"
                alignmentBaseline="middle"
                fill={c.text}
                fontFamily="monospace"
                fontWeight="bold"
                fontSize={FEEDBACK_FONT_SIZE}
                stroke={c.border}
                strokeWidth={FEEDBACK_FONT_SIZE / 2}
                paintOrder="stroke"
              >
                colors
              </text>
            </symbol>,
          );
          continue;
        }
      }
    }
    return symbols;
  }, [info.feedbackCapabilities, rainbowGradient, namespace, c]);

  return { defs, symbols };
};

/**
 * Memoize colors to avoid fresh object references from re-rendering everything,
 * in case users don't pre-memoize the color object.
 */
const useMemoizedColors = (rawColors: MidiPreviewColorsProp) =>
  useMemo(
    () => ({
      cellBackground: rawColors.cellBackground,
      border: rawColors.border,
      text: rawColors.text,
      hover: rawColors.hover,
      highlight: rawColors.highlight,
    }),
    [
      rawColors.cellBackground,
      rawColors.border,
      rawColors.text,
      rawColors.hover,
      rawColors.highlight,
    ],
  );

type TextElementsArgs = {
  namespace: string;
  c: MidiPreviewColorsProp;
  textId: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const textElements = ({
  namespace,
  c,
  textId,
  text,
  x,
  y,
  width,
  height,
}: TextElementsArgs) => {
  const defs: ReactNode[] = [];
  const elements: ReactNode[] = [
    <rect
      key={`text-bg-${textId}`}
      x={x}
      y={y + height - TEXT_HEIGHT}
      width={width}
      height={TEXT_HEIGHT}
      fill={c.border}
    />,
  ];

  const textMaskId = `${namespace}-text-mask-${textId}`;

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

  const labelWidth = text ? text.length * FONT_WIDTH : 0;
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
      ? [text]
      : [
          text.substring(0, maxChars),
          text.length > maxChars * 2
            ? `${text.substring(maxChars, maxChars * 2 - 1)}…`
            : text.substring(maxChars),
        ];

  elements.push(
    <g key={`text-${textId}`} mask={`url(#${textMaskId})`}>
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fill={c.text}
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
  return { defs, elements };
};

export const MidiDevicePreview: FC<MidiDevicePreviewProps> = ({
  info,
  namespace,
  colors: rawColors,
  selectedItems,
  onItemsSelected,
  ...props
}) => {
  const gridInfo = useMemo(() => createGridInfo(info.items), [info.items]);

  const noFeedback = `${namespace}-no-feedback`;
  const mixedFeedback = `${namespace}-mixed-feedback`;
  const clsClick = `${namespace}-click`;

  const c = useMemoizedColors(rawColors);

  const { symbols: feedbackSymbols, defs: feedbackDefs } = useFeedbackSymbols({
    namespace,
    info,
    colors: c,
  });

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

      items.push(
        <rect
          key={`cell-${i}`}
          x={x}
          y={y}
          width={width}
          height={height}
          fill={c.cellBackground}
          stroke={c.border}
        />,
      );

      const feedback = Array.from(
        new Set(cell.items.map((item) => item.feedback).filter(isDefined)),
      );
      const uniqueFeedback = feedback.length === 1 && feedback[0];

      if (uniqueFeedback) {
        items.push(
          <use
            key={`feedback-${i}`}
            href={`#${feedbackSymbolId(namespace, uniqueFeedback)}`}
            x={x}
            y={y}
            width={width}
            height={height - TEXT_HEIGHT}
          />,
        );
      } else {
        items.push(
          <use
            key={`feedback-${i}`}
            href={`#${feedback.length > 1 ? mixedFeedback : noFeedback}`}
            x={x}
            y={y}
            width={width}
            height={height - TEXT_HEIGHT}
          />,
        );
      }

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

      const { defs: textDefs, elements: textItems } = textElements({
        namespace,
        c,
        textId: `cell-${i}`,
        text: labelText,
        x,
        y: y + height - TEXT_HEIGHT,
        width,
        height: TEXT_HEIGHT,
      });

      defs.push(...textDefs);
      items.push(...textItems);

      items.push(
        <g
          key={`click-${i}`}
          // eslint-disable-next-line no-restricted-syntax
          className={clsClick}
          opacity={0}
          onClick={() => onItemsSelected?.(cell.items)}
        >
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={c.hover}
            opacity={0.3}
          />
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            stroke={c.hover}
            strokeWidth={2}
            fill="none"
          />
        </g>,
      );
    }

    return { vh, vw, defs, items };
  }, [
    namespace,
    gridInfo,
    c,
    noFeedback,
    mixedFeedback,
    clsClick,
    onItemsSelected,
  ]);

  const highlights: ReactNode[] = useMemo(() => {
    const highlighedFingerprints: Record<
      string,
      {
        opacity: number;
        span: CellSpan;
      }
    > = {};
    for (const { item, opacity } of selectedItems || []) {
      const span = getCellSpan(item);
      if (!span) continue;
      const fingerprint = getSpanFingerprint(span);
      highlighedFingerprints[fingerprint] = {
        opacity: Math.max(
          highlighedFingerprints[fingerprint]?.opacity || 0,
          opacity,
        ),
        span,
      };
    }
    const rows = gridInfo?.rows || 0;
    const vh = MARGIN * 2 + GRID_SIZE * rows + GAP * (rows - 1);
    return Object.entries(highlighedFingerprints).map(
      ([fingerprint, { opacity, span }]) => {
        const width =
          GRID_SIZE * (span.cols[1] - span.cols[0] + 1) +
          GAP * (span.cols[1] - span.cols[0]);
        const height =
          GRID_SIZE * (span.rows[1] - span.rows[0] + 1) +
          GAP * (span.rows[1] - span.rows[0]);
        const x = MARGIN + span.cols[0] * (GRID_SIZE + GAP);
        const y = vh - (MARGIN + span.rows[0] * (GRID_SIZE + GAP)) - height;
        return (
          <g key={fingerprint} opacity={opacity}>
            <rect
              x={x}
              y={y}
              width={width}
              height={height}
              fill="none"
              stroke={c.highlight}
              strokeWidth="4"
              style={{ pointerEvents: 'none' }}
            />
          </g>
        );
      },
    );
  }, [selectedItems, c, gridInfo?.rows]);

  if (!elements)
    return (
      <svg viewBox={`0 0 200 50`} {...props}>
        <text
          x="100"
          y="25"
          textAnchor="middle"
          dominantBaseline="central"
          fill={c.text}
          stroke={c.border}
          strokeWidth={3}
          paintOrder="stroke"
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
      <style>{`.${clsClick}:hover {
          cursor: pointer;
          opacity: 1;
        }`}</style>
      <defs>
        {defs}
        {feedbackDefs}
      </defs>
      {feedbackSymbols}
      <symbol
        id={noFeedback}
        viewBox={`0 0 ${FEEDBACK_WIDTH} ${FEEDBACK_HEIGHT}`}
      >
        <text
          x={FEEDBACK_WIDTH / 2}
          y={FEEDBACK_HEIGHT / 2 - GRID_SIZE / 8}
          textAnchor="middle"
          alignmentBaseline="middle"
          fill={c.text}
          fontFamily="monospace"
          fontWeight="bold"
          fontSize={FEEDBACK_FONT_SIZE}
          stroke={c.border}
          strokeWidth={FEEDBACK_FONT_SIZE / 2}
          paintOrder="stroke"
        >
          NO
        </text>
        <text
          x={FEEDBACK_WIDTH / 2}
          y={FEEDBACK_HEIGHT / 2 + GRID_SIZE / 8}
          textAnchor="middle"
          alignmentBaseline="middle"
          fill={c.text}
          fontFamily="monospace"
          fontWeight="bold"
          fontSize={FEEDBACK_FONT_SIZE}
          stroke={c.border}
          strokeWidth={FEEDBACK_FONT_SIZE / 2}
          paintOrder="stroke"
        >
          FDBK
        </text>
      </symbol>
      <symbol
        id={mixedFeedback}
        viewBox={`0 0 ${FEEDBACK_WIDTH} ${FEEDBACK_HEIGHT}`}
      >
        <text
          x={FEEDBACK_WIDTH / 2}
          y={FEEDBACK_HEIGHT / 2 - GRID_SIZE / 8}
          textAnchor="middle"
          alignmentBaseline="middle"
          fill={c.text}
          fontFamily="monospace"
          fontWeight="bold"
          fontSize={FEEDBACK_FONT_SIZE}
          stroke={c.border}
          strokeWidth={FEEDBACK_FONT_SIZE / 2}
          paintOrder="stroke"
        >
          MIXED
        </text>
        <text
          x={FEEDBACK_WIDTH / 2}
          y={FEEDBACK_HEIGHT / 2 + GRID_SIZE / 8}
          textAnchor="middle"
          alignmentBaseline="middle"
          fill={c.text}
          fontFamily="monospace"
          fontWeight="bold"
          fontSize={FEEDBACK_FONT_SIZE}
          stroke={c.border}
          strokeWidth={FEEDBACK_FONT_SIZE / 2}
          paintOrder="stroke"
        >
          FDBK
        </text>
      </symbol>
      {items}
      {highlights}
    </svg>
  );
};

type MidiFeedbackSummaryProps = Omit<SVGProps<SVGSVGElement>, 'viewBox'> & {
  /**
   * Internal SVG definitions can interfere with other SVG elements on the same
   * page, so this value must be set to something unique on the page
   */
  namespace: string;
  info: TalismanFullProfileInfo;
  colors: MidiPreviewColorsProp;
};

export const MidiFeedbackSummary: FC<MidiFeedbackSummaryProps> = ({
  namespace,
  info,
  colors: rawColors,
  ...props
}) => {
  const c = useMemoizedColors(rawColors);

  const { symbols: feedbackSymbols, defs: feedbackDefs } = useFeedbackSymbols({
    namespace,
    info,
    colors: c,
  });

  const feedbackToCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of info.items) {
      if (item.feedback) {
        counts[item.feedback] = (counts[item.feedback] || 0) + 1;
      }
    }
    return counts;
  }, [info.items]);

  const { defs, boxes } = useMemo(() => {
    const defs: ReactNode[] = [];
    const boxes: ReactNode[] = [];

    let i = 0;
    for (const key of Object.keys(info.feedbackCapabilities)) {
      const width = GRID_SIZE;
      const height = GRID_SIZE;
      const x = i * (GRID_SIZE + GAP);
      const y = GRID_SIZE - height;

      const { defs: textDefs, elements: textItems } = textElements({
        namespace,
        c,
        textId: `cell-${i}`,
        text: `${feedbackToCounts[key] ?? 0} items`,
        x,
        y: y + height - TEXT_HEIGHT,
        width,
        height: TEXT_HEIGHT,
      });

      defs.push(...textDefs);

      boxes.push(
        <g key={key}>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={c.cellBackground}
            stroke={c.border}
          />
          <use
            key={`feedback-${i}`}
            href={`#${feedbackSymbolId(namespace, key)}`}
            x={x}
            y={y}
            width={width}
            height={height - TEXT_HEIGHT}
          />
          {textItems}
        </g>,
      );
      i++;
    }

    return { defs, boxes };
  }, [namespace, c, info.feedbackCapabilities, feedbackToCounts]);

  if (boxes.length === 0) {
    return (
      <svg {...props} viewBox={`0 0 ${GRID_SIZE} ${GRID_SIZE}`}>
        <rect
          x={0}
          y={0}
          width={GRID_SIZE}
          height={GRID_SIZE}
          fill={c.cellBackground}
          stroke={c.border}
        />
        <text
          x={GRID_SIZE / 2}
          y={GRID_SIZE / 2 - GRID_SIZE / 8}
          textAnchor="middle"
          alignmentBaseline="middle"
          fill={c.text}
          fontFamily="monospace"
          fontWeight="bold"
          fontSize={FEEDBACK_FONT_SIZE}
          stroke={c.border}
          strokeWidth={FEEDBACK_FONT_SIZE / 2}
          paintOrder="stroke"
        >
          NO
        </text>
        <text
          x={GRID_SIZE / 2}
          y={GRID_SIZE / 2 + GRID_SIZE / 8}
          textAnchor="middle"
          alignmentBaseline="middle"
          fill={c.text}
          fontFamily="monospace"
          fontWeight="bold"
          fontSize={FEEDBACK_FONT_SIZE}
          stroke={c.border}
          strokeWidth={FEEDBACK_FONT_SIZE / 2}
          paintOrder="stroke"
        >
          FDBK
        </text>
      </svg>
    );
  }

  return (
    <svg
      {...props}
      viewBox={`0 0 ${boxes.length * (GRID_SIZE + GAP) - GAP} ${GRID_SIZE}`}
    >
      <defs>
        {feedbackDefs}
        {defs}
      </defs>
      {feedbackSymbols}
      {boxes}
    </svg>
  );
};
