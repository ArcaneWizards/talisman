import { it } from '@jest/globals';
import { MIDI_NOTE_OPTIONS } from './index.js';

it('MIDI_NOTE_OPTIONS index should match value', () => {
  for (let i = 0; i < MIDI_NOTE_OPTIONS.length; i++) {
    if (MIDI_NOTE_OPTIONS[i]?.value !== `${i}`) {
      throw new Error(`MIDI_NOTE_OPTIONS are incorrect for ${i}`);
    }
  }
});
