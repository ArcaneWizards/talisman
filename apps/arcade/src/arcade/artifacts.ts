import { addRGB, RGB } from '@talisman-midi/talisman/color';
import { MidiCoordinatePoint } from '@talisman-midi/talisman/util';

export type Artifact = {
  // Static Values
  type: 'wave';
  center: MidiCoordinatePoint;
  speedPerSecond: number;
  /**
   * The radius after which point the artifact will be deleted
   */
  maxRadius: number;
  leadingColor: RGB;
  trailingColor: RGB;
  leadingEdge: number;
  trailingEdge: number;
  // Dynamic Values
  radius: number;
};

export const advanceArtifact = (
  artifact: Artifact,
  deltaMs: number,
): Artifact | null => {
  switch (artifact.type) {
    case 'wave': {
      const newRadius =
        artifact.radius + artifact.speedPerSecond * (deltaMs / 1000);
      if (newRadius > artifact.maxRadius) {
        return null;
      }
      return {
        ...artifact,
        radius: newRadius,
      };
    }
  }
};

/**
 * Add the color from a given artifact to the given background color,
 * based on the provided artifacts properties relative to the given position.
 */
export const addArtifact = (
  background: RGB,
  position: MidiCoordinatePoint,
  artifact: Artifact,
): RGB => {
  switch (artifact.type) {
    case 'wave': {
      const distance = Math.sqrt(
        (position.row - artifact.center.row) ** 2 +
          (position.col - artifact.center.col) ** 2,
      );
      const diff = distance - artifact.radius;
      if (diff > 0) {
        if (diff < artifact.leadingEdge) {
          const factor = 1 - diff / artifact.leadingEdge;
          return addRGB(background, artifact.leadingColor, factor);
        }
      } else if (diff > -artifact.trailingEdge) {
        const factor = Math.min(1, 1 + diff / artifact.trailingEdge);
        /**
         * How much of the trail should be using only the trailing color,
         * compared to transitioning between the leading & trailing colors.
         */
        const transitionFactor =
          artifact.trailingEdge /
          (artifact.leadingEdge + artifact.trailingEdge);
        if (factor > transitionFactor) {
          // Return blend between trailingColor and leadingColor
          return addRGB(
            artifact.trailingColor,
            artifact.leadingColor,
            (factor - transitionFactor) / (1 - transitionFactor),
          );
        } else {
          return addRGB(
            background,
            artifact.trailingColor,
            factor / transitionFactor,
          );
        }
      }
      break;
    }
  }

  // For now, just return the background color unchanged.
  return background;
};
