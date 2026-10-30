import { ColorSpace } from './color.js';
import {
  MIDI_CONTROL_CHANGE,
  MIDI_NOTE_ON,
  MidiInputConnectionInfo,
} from './index.js';
import type { MidiProfile } from './profile.js';

export type MidiColorFeedback = {
  /**
   * What mode is the current control on
   */
  mode: 'empty' | 'ready' | 'active';
  /**
   * When relevant (for example when the control is connected to something that
   * has an associated color) - an optional color can be provided.
   *
   * This may not always be usable,
   * for example for buttons that only have on / off LEDs.
   *
   * When a controller supports color feedback and this field is not set,
   * then the profile should default to a suitable color based on the mode.
   */
  color?: [number, number, number];
};

/**
 * An interface that can be used to batch prepare MIDI messages to send to a
 * MIDI device to represent feedback of the current application's state.
 */
export type MidiFeedbackProfile = {
  /**
   * When defined,
   * this function can be called to configure the device to be in an appropriate
   * mode for the selected profile.
   *
   * It is expected that this can be called if the {@link MidiProfile}
   * fired a .
   */
  performModeSwitch?: () => void;
  /**
   * Called when the feedback profile no longer needs to be used with the given
   * device, for example:
   * - The user removes the specified device from the config
   * - The user selects a different profile
   * - The application is shutting down
   *
   * This can be used for example to reset a device to its default state,
   * if it had been modified by the feedback profile,
   * and to remove any references / listeners that may have been created by
   * the feedback profile.
   */
  close?: () => Promise<void>;
  /**
   * Reset feedback of all items to their default state.
   *
   * This may require {@link MidiFeedbackProfile.frameFinished} to be called
   * before messages are sent, which allows for implementations to optimize
   * message batching.
   */
  clear: () => void;
  /**
   * Begin a new frame if one is not already in progress,
   * and set the note value for the specified channel and note.
   */
  setItemColor: (id: string, feedback: MidiColorFeedback) => void;

  /**
   * @param id The identifier of the item whose position is being set.
   * @param value The new position value for the item, value between 0 and 1.
   */
  setItemValue: (id: string, value: number) => void;

  /**
   * Indicate that the current frame has finished and any accumulated feedback
   * should be processed and sent to the MIDI device.
   */
  frameFinished: () => void;
};

export type MidiFeedbackProfileInitArgs = {
  connection: MidiInputConnectionInfo;
  inputProfile: MidiProfile;
  sendMessage: (message: number[]) => void;
};

export type MidiFeedbackProfileInit = (
  args: MidiFeedbackProfileInitArgs,
) => MidiFeedbackProfile;

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
