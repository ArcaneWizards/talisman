import {
  ToolbarGrow,
  ToolbarRow,
  ToolbarWrapper,
} from '@arcanewizards/sigil/frontend/toolbars';
import { useMemo, ReactNode } from 'react';
import type { MidiParsedMessage } from '@arcanewizards/talisman';
import { cn } from '@arcanejs/toolkit-frontend/util';
import { ControlButton } from '@arcanewizards/sigil/frontend/controls';
import type { BufferSlice } from '../../../shared/util';
import { MessageGroup, useMessageMonitor } from './message-monitor';

export type ProcessedMidiMessage<E> = {
  /** Unix timestamp in milliseconds */
  timestamp: number;
  message: number[];
  extra: E;
} & MidiParsedMessage;

export type MidiMessageBufferSlice<E> = BufferSlice<ProcessedMidiMessage<E>>;

const MAX_MESSAGES = 100;

const TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  fractionalSecondDigits: 3,
});

const clsCell = () =>
  `bg-sigil-bg-dark flex items-center justify-center p-1 group-hover:bg-sigil-bg-light`;

const clsHeader = () => cn(clsCell(), 'text-center font-bold');

type MidiMessageMonitorProps<E> = {
  label: string;
  latestIndex: number;
  renderExtra: (extra: E) => ReactNode;
  getMidiMessages: (fromIndex: number) => Promise<MidiMessageBufferSlice<E>>;
  defaultMonitoring?: boolean;
  className?: string;
};

const TYPE_TO_LABEL: Record<MidiParsedMessage['type'], string> = {
  note: 'Note',
  'polyphonic-aftertouch': 'PA',
  'control-change': 'CC',
  'program-change': 'PC',
  'channel-aftertouch': 'CA',
  'pitch-wheel': 'Pitch',
  mtc: 'MTC',
  sysex: 'SysEx',
  other: 'Other',
};

const typeLabel = (msg: MidiParsedMessage) =>
  msg.type === 'note'
    ? `Note ${msg.action === 'on' ? 'On' : 'Off'}`
    : TYPE_TO_LABEL[msg.type];

const noteLabel = (msg: MidiParsedMessage) => {
  switch (msg.type) {
    case 'note':
      return msg.note;
    case 'polyphonic-aftertouch':
      return msg.note;
    case 'control-change':
      return msg.controller;
    case 'program-change':
      return msg.program;
    default:
      return null;
  }
};

const valueLabel = (msg: MidiParsedMessage) => {
  switch (msg.type) {
    case 'note':
      return msg.velocity;
    case 'polyphonic-aftertouch':
      return msg.pressure;
    case 'control-change':
      return msg.value;
    case 'pitch-wheel':
      return msg.value;
    default:
      return null;
  }
};

type MessageGroupRenderProps<E> = {
  renderExtra: (extra: E) => ReactNode;
  group: MessageGroup<ProcessedMidiMessage<E>>;
};

const MessageGroupRender = <E,>({
  group,
  renderExtra,
}: MessageGroupRenderProps<E>): ReactNode => {
  if (group.type === 'missing') {
    return (
      <div className="group grid-table-midi-messages-row">
        <div className={cn(clsCell(), 'grid-table-midi-messages-row-span')}>
          {group.count} Missing messages
        </div>
      </div>
    );
  } else {
    const rows: ReactNode[] = [];
    for (
      let j = group.slice.length - 1;
      j >= 0 && rows.length < MAX_MESSAGES;
      j--
    ) {
      const message = group.slice[j];
      if (!message) {
        continue;
      }
      rows.push(
        <div key={j} className="group grid-table-midi-messages-row">
          <div className={clsCell()}>
            {TIME_FORMATTER.format(message.timestamp)}
          </div>
          <div className={clsCell()}>{typeLabel(message)}</div>
          <div className={clsCell()}>
            {'channel' in message ? `${message.channel + 1}` : ''}
          </div>
          <div className={clsCell()}>{noteLabel(message)}</div>
          <div className={clsCell()}>{valueLabel(message)}</div>
          <div className={cn(clsCell(), 'flex-col')}>
            {renderExtra(message.extra)}
          </div>
          <div className={cn(clsCell(), 'flex justify-start gap-1')}>
            {message.message.map((byte, byteIndex) => (
              <code key={byteIndex}>{byte.toString(16).padStart(2, '0')}</code>
            ))}
          </div>
        </div>,
      );
    }
    return <>{rows}</>;
  }
};

export const MidiMessageMonitor = <E,>({
  label,
  latestIndex,
  renderExtra,
  getMidiMessages,
  defaultMonitoring = false,
  className,
}: MidiMessageMonitorProps<E>) => {
  const { toggleMessages, monitoring, messages } = useMessageMonitor<
    ProcessedMidiMessage<E>
  >({
    defaultMonitoring,
    latestIndex,
    getMessages: getMidiMessages,
    maxMessages: MAX_MESSAGES,
  });

  const table = useMemo(() => {
    if (!monitoring || !messages.received) {
      return (
        <div className="flex grow items-center justify-center p-2">
          {monitoring ? 'No messages received' : 'Monitoring disabled'}
        </div>
      );
    }

    const rows: ReactNode[] = [];

    for (
      let i = messages.groups.length - 1;
      i >= 0 && rows.length < MAX_MESSAGES;
      i--
    ) {
      const group = messages.groups[i];
      if (!group) {
        continue;
      }
      rows.push(
        <MessageGroupRender
          key={group.key}
          group={group}
          renderExtra={renderExtra}
        />,
      );
    }

    return (
      <div
        className={cn(
          'h-[200px] grow scrollbar-sigil overflow-x-auto overflow-y-scroll',
          className,
        )}
      >
        <div
          className="
            grid-table-midi-messages min-w-max bg-sigil-border text-[0.7rem]
          "
        >
          <div className={clsHeader()}>Time</div>
          <div className={clsHeader()}>Type</div>
          <div className={clsHeader()}>Channel</div>
          <div className={clsHeader()}>Note / Controller</div>
          <div className={clsHeader()}>Value / Velocity</div>
          <div className={clsHeader()}>Details</div>
          <div className={clsHeader()}>Message</div>
          {rows}
        </div>
      </div>
    );
  }, [className, monitoring, messages, renderExtra]);

  return (
    <div
      className={cn(
        `
          flex max-w-full grow flex-col overflow-hidden border
          border-sigil-border bg-sigil-bg-dark shadow-sigil-box
        `,
        className,
      )}
    >
      <ToolbarWrapper>
        <ToolbarRow>
          <span className="m-sigil-toolbar-padding">
            {`${label}: ${latestIndex}`}
          </span>
          <ToolbarGrow />
          <ControlButton
            onClick={toggleMessages}
            title="Toggle MIDI Message Monitoring"
            variant="toolbar"
            icon={monitoring ? 'stop' : 'play_arrow'}
          >
            {monitoring ? 'Stop' : 'Start'}
          </ControlButton>
        </ToolbarRow>
      </ToolbarWrapper>
      {table}
    </div>
  );
};
