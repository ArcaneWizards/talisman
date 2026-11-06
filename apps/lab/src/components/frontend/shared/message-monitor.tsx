import { useCallback, useState, useEffect, useRef } from 'react';
import type { BufferSlice } from '../../../shared/util';

export type UseMessageMonitorArgs<M> = {
  defaultMonitoring?: boolean;
  getMessages: (fromIndex: number) => Promise<BufferSlice<M>>;
  latestIndex: number;
  maxMessages: number;
};

export type MessageGroup<M> =
  | {
      key: string;
      type: 'slice';
      slice: M[];
    }
  | {
      key: string;
      type: 'missing';
      count: number;
    };

export type ReceivedMessages<M> = {
  received: number;
  groups: MessageGroup<M>[];
};

type RequestState = {
  inProgress: boolean;
  requireFollowUp: boolean;
};

export function useMessageMonitor<M>({
  defaultMonitoring,
  latestIndex,
  getMessages,
  maxMessages,
}: UseMessageMonitorArgs<M>) {
  const [monitoring, setMonitoring] = useState(defaultMonitoring);
  const [messages, setMessages] = useState<ReceivedMessages<M>>({
    received: 0,
    groups: [],
  });

  const toggleMessages = useCallback(
    () => setMonitoring((current) => !current),
    [],
  );

  /**
   * Use a reference to avoid waiting for react lifecycle,
   * and avoid sending more than one request for messages at a time.
   */
  const requestState = useRef<RequestState>({
    inProgress: false,
    requireFollowUp: false,
  });

  const requestLatestMessages = useCallback(
    (from: number) => {
      if (requestState.current.inProgress) {
        requestState.current.requireFollowUp = true;
        return;
      }

      requestState.current.inProgress = true;
      requestAnimationFrame(() =>
        getMessages(from)
          .then((result) => {
            requestState.current.inProgress = false;

            setMessages((current) => {
              const groups = [...current.groups];
              let toAdd = result.slice;

              if (current.received < result.startIndex) {
                // Add missing message
                groups.push({
                  key: `${Date.now()}-missing`,
                  type: 'missing',
                  count: result.startIndex - current.received,
                });
              } else if (current.received > result.startIndex) {
                // Handle overlapping messages
                const overlap = current.received - result.startIndex;
                toAdd = toAdd.slice(overlap);
              }
              if (toAdd.length > 0) {
                groups.push({
                  key: `${Date.now()}-slice`,
                  type: 'slice',
                  slice: toAdd,
                });
              }

              // Trim the groups from the start so that the max number of messages is 100
              let count = 0;
              let i;
              for (i = groups.length - 1; i >= 0 && count < maxMessages; i--) {
                const group = groups[i];
                if (group?.type === 'slice') {
                  count += group.slice.length;
                } else if (group?.type === 'missing') {
                  count += 1;
                }
              }

              // i is now the index of the first group to keep (exclusive)

              return {
                received: result.received,
                groups: groups.slice(Math.max(0, i - 1)),
              };
            });

            if (requestState.current.requireFollowUp) {
              requestState.current.requireFollowUp = false;
              requestLatestMessages(result.received);
            }
          })
          .catch((cause) => {
            const error = new Error('Unable to get messages', { cause });
            // eslint-disable-next-line no-console
            console.error(error);
            requestState.current.inProgress = false;
          }),
      );
    },
    [getMessages, maxMessages],
  );

  useEffect(() => {
    if (!monitoring) {
      return;
    }
    if (latestIndex && latestIndex > messages.received) {
      requestLatestMessages(messages.received);
    }
  }, [monitoring, messages.received, latestIndex, requestLatestMessages]);

  return {
    toggleMessages,
    messages,
    monitoring,
  };
}
