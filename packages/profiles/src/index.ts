import type { MidiProfileDefinition } from '@talisman-midi/talisman/core';
import { AKAI_APC_MINI_MK_2 } from './devices/akai-apcmini-mk2.js';
import { GENERIC } from './devices/generic.js';
import { HERCULES_DJCONTROL_INPULSE_300 } from './devices/hercules.js';
import { BITCHBOY } from './devices/bitchboy.js';
import { NOVATION_LAUNCHPAD_MK2_MINI } from './devices/novation-launchpad-mk2-mini.js';
import { NOVATION_LAUNCHPAD_MK2_PRO } from './devices/novation-launchpad-mk2-pro.js';
import { NOVATION_LAUNCHPAD_MK2 } from './devices/novation-launchpad-mk2.js';
import { NOVATION_LAUNCHPAD_MK3_X } from './devices/novation-launchpad-mk3-x.js';
import { NOVATION_LAUNCHPAD_MK3_MINI } from './devices/novation-launchpad-mk3-mini.js';
import { MIDI_FIGHTER_TWISTER } from './devices/midi-fighter-twister.js';
import { MIDI_FIGHTER_3D } from './devices/midi-fighter-3d.js';

/**
 * Stricter version of {@link MIDI_PROFILES},
 * where the key type is only allowed to be strings of known
 * MIDI profile identifiers.
 */
export const KNOWN_MIDI_PROFILES = Object.freeze({
  generic: GENERIC,
  'akai-apimini-mk2': AKAI_APC_MINI_MK_2,
  bitchboy: BITCHBOY,
  'hercules-djcontrol-inpulse-300': HERCULES_DJCONTROL_INPULSE_300,
  'midi-fighter-twister': MIDI_FIGHTER_TWISTER,
  'midi-fighter-3d': MIDI_FIGHTER_3D,
  'novation-launchpad-mk2-mini': NOVATION_LAUNCHPAD_MK2_MINI,
  'novation-launchpad-mk2-pro': NOVATION_LAUNCHPAD_MK2_PRO,
  'novation-launchpad-mk2': NOVATION_LAUNCHPAD_MK2,
  'novation-launchpad-mk3-x': NOVATION_LAUNCHPAD_MK3_X,
  'novation-launchpad-mk3-mini': NOVATION_LAUNCHPAD_MK3_MINI,
} satisfies Record<string, MidiProfileDefinition>);

/**
 * String union-type of all known MIDI profile identifiers.
 */
export type KnownMidiProfile = keyof typeof KNOWN_MIDI_PROFILES;

/**
 * Type-guard function returning true if a given string is a known MIDI profile identifier.
 */
export const isKnownMidiProfile = (
  profileId: string,
): profileId is KnownMidiProfile => profileId in KNOWN_MIDI_PROFILES;

/**
 * Object containing all MIDI profiles,
 * where each key is a string representing a MIDI profile identifier.
 */
export const MIDI_PROFILES: Readonly<
  Partial<Record<string, MidiProfileDefinition>>
> = KNOWN_MIDI_PROFILES;
