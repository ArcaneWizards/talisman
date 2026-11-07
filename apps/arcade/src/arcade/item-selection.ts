import {
  MidiControllerItem,
  MidiProfileFeedbackCapabilities,
} from '@talisman-midi/talisman';
import { filter } from '../shared/util';

export type ItemSelector = (
  feedback: MidiProfileFeedbackCapabilities,
) => (item: MidiControllerItem) => boolean;

const isRGB = (
  feedback: MidiProfileFeedbackCapabilities,
  item: MidiControllerItem,
) => !!item.feedback && feedback[item.feedback]?.led?.type === 'rgb';

const isColor = (
  feedback: MidiProfileFeedbackCapabilities,
  item: MidiControllerItem,
) =>
  !!item.feedback &&
  (feedback[item.feedback]?.led?.type === 'rgb' ||
    feedback[item.feedback]?.led?.type === 'palette');

const isLed = (
  feedback: MidiProfileFeedbackCapabilities,
  item: MidiControllerItem,
) => !!item.feedback && !!feedback[item.feedback]?.led;

const isGrid = (item: MidiControllerItem) =>
  !!item.note?.some((n) => n.nature?.nature === 'grid') ||
  !!item.controlChange?.some((n) => n.nature?.nature === 'grid');

const hasInteractivity = (item: MidiControllerItem) =>
  !!item.note?.some((n) => !!n.nature?.nature) ||
  !!item.controlChange?.some((n) => !!n.nature?.nature);

export const rgbGridItems: ItemSelector =
  (feedback: MidiProfileFeedbackCapabilities) =>
  (item: MidiControllerItem): boolean =>
    isRGB(feedback, item) && isGrid(item);

export const colorGridItems: ItemSelector =
  (feedback: MidiProfileFeedbackCapabilities) =>
  (item: MidiControllerItem): boolean =>
    isColor(feedback, item) && isGrid(item);

export const ledGridItems: ItemSelector =
  (feedback: MidiProfileFeedbackCapabilities) =>
  (item: MidiControllerItem): boolean =>
    isLed(feedback, item) && isGrid(item);

export const rgbInteractiveItems: ItemSelector =
  (feedback: MidiProfileFeedbackCapabilities) =>
  (item: MidiControllerItem): boolean =>
    isRGB(feedback, item) && hasInteractivity(item);

export const colorInteractiveItems: ItemSelector =
  (feedback: MidiProfileFeedbackCapabilities) =>
  (item: MidiControllerItem): boolean =>
    isColor(feedback, item) && hasInteractivity(item);

export const ledInteractiveItems: ItemSelector =
  (feedback: MidiProfileFeedbackCapabilities) =>
  (item: MidiControllerItem): boolean =>
    isLed(feedback, item) && hasInteractivity(item);

export const rgbItems: ItemSelector =
  (feedback: MidiProfileFeedbackCapabilities) =>
  (item: MidiControllerItem): boolean =>
    isRGB(feedback, item);

export const colorItems: ItemSelector =
  (feedback: MidiProfileFeedbackCapabilities) =>
  (item: MidiControllerItem): boolean =>
    isColor(feedback, item);

export const anyLedItems: ItemSelector =
  (feedback: MidiProfileFeedbackCapabilities) =>
  (item: MidiControllerItem): boolean =>
    isLed(feedback, item);

/**
 * Prioritizing GRID elements,
 * select items that have both interactivity and LED capabilities
 */
export const ANY_LED_INTERACTIVE_ITEMS = Object.freeze([
  rgbGridItems,
  colorGridItems,
  rgbInteractiveItems,
  colorInteractiveItems,
  ledInteractiveItems,
] satisfies ItemSelector[]);

/**
 * Get all items that have LED capabilities,
 * prioritizing GRID and interactive elements,
 * but allowing non-interactive elements;
 */
export const ANY_LED_POTENTIALLY_INTERACTIVE_ITEMS = Object.freeze([
  rgbGridItems,
  colorGridItems,
  rgbInteractiveItems,
  colorInteractiveItems,
  ledInteractiveItems,
  rgbItems,
  colorItems,
  anyLedItems,
] satisfies ItemSelector[]);

export const selectItems = (
  deviceItems: Iterable<MidiControllerItem>,
  feedback: MidiProfileFeedbackCapabilities,
  selectors: Iterable<ItemSelector>,
  minItems?: number,
) => {
  let items: MidiControllerItem[] = [];

  for (const selector of selectors) {
    if (
      items.length === 0 ||
      (minItems !== undefined && items.length < minItems)
    ) {
      items = Array.from(
        filter(
          deviceItems,
          selector(feedback),
          minItems !== undefined ? minItems - items.length : undefined,
        ),
      );
    } else {
      break;
    }
  }
  return items;
};
