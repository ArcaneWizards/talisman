import type { ColorSpace } from './color.js';
import {
  MIDI_CONTROL_CHANGE,
  MIDI_NOTE_ON,
  MidiColorFeedback,
  MidiFeedbackProfile,
  MidiFeedbackProfileInit,
} from './core.js';

type CreateBasicColorVelocityFeedbackProfileArgs = {
  getColorSpace: () => ColorSpace<[number]>;
  defaultVelocities: Record<MidiColorFeedback['mode'], number>;
};

/**
 * Call this to create a feedback initializer for a simple protocol that sends
 * Note of CC messages back to the midi device using velocity values only.
 */
export const createBasicColorVelocityFeedbackProfile =
  ({
    getColorSpace,
    defaultVelocities,
  }: CreateBasicColorVelocityFeedbackProfileArgs): MidiFeedbackProfileInit =>
  ({ inputProfile, sendMessage }) => {
    const lastNoteVelocities: number[] = [];
    const lastControlChangeVelocities: number[] = [];

    return {
      clear: () => {
        for (const item of inputProfile.getItems()) {
          for (const n of item.note || []) {
            sendMessage([MIDI_NOTE_ON | n.id.channel, n.id.note, 0]);
            lastNoteVelocities[n.id.note] = 0;
          }
          for (const c of item.controlChange || []) {
            sendMessage([
              MIDI_CONTROL_CHANGE | c.id.channel,
              c.id.controller,
              0,
            ]);
            lastControlChangeVelocities[c.id.controller] = 0;
          }
        }
      },
      setItemColor: (itemId, feedback) => {
        const [velocity] = feedback.color
          ? getColorSpace().rgbToValue(feedback.color)
          : [defaultVelocities[feedback.mode]];
        const i = inputProfile.getItem(itemId);
        for (const n of i?.note ?? []) {
          if (lastNoteVelocities[n.id.note] === velocity) {
            continue;
          }
          sendMessage([MIDI_NOTE_ON | n.id.channel, n.id.note, velocity]);
          lastNoteVelocities[n.id.note] = velocity;
        }
        for (const c of i?.controlChange ?? []) {
          if (lastControlChangeVelocities[c.id.controller] === velocity) {
            continue;
          }
          sendMessage([
            MIDI_CONTROL_CHANGE | c.id.channel,
            c.id.controller,
            velocity,
          ]);
          lastControlChangeVelocities[c.id.controller] = velocity;
        }
      },
      setItemValue: () => {
        // no-op
      },
      frameFinished: () => {
        // no-op
      },
    } satisfies MidiFeedbackProfile;
  };
