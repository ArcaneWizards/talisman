import { addRGB, COLORS, hslToRgb, RGB } from '@talisman-midi/talisman/color';
import { MidiCoordinatePoint } from '@talisman-midi/talisman/util';
import { GameColors } from '../components/proto';

export type Artifact =
  | {
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
    }
  | {
      // Static Values
      type: 'dot';
      position: MidiCoordinatePoint;
      color: RGB;
      expiresMs: number;
      pulseMs?: number;
    }
  | {
      type: 'drop';
      target: MidiCoordinatePoint;
      endTimeMs: number;
      rowsPerMs: number;
      trailFadeMs: number;
      color: RGB;
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
    case 'dot': {
      if (artifact.expiresMs <= Date.now()) {
        return null;
      }
      return artifact;
    }
    case 'drop': {
      if (artifact.endTimeMs + artifact.trailFadeMs <= Date.now()) {
        return null;
      }
      return artifact;
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
      return background;
    }
    case 'dot': {
      if (
        position.col !== artifact.position.col ||
        position.row !== artifact.position.row
      ) {
        return background;
      }
      let opacity = 1;
      if (artifact.pulseMs) {
        const phase =
          ((artifact.expiresMs - Date.now()) % artifact.pulseMs) /
          artifact.pulseMs;
        opacity = 0.5 + 0.5 * Math.sin(phase * 2 * Math.PI);
      }
      return addRGB(background, artifact.color, opacity);
    }
    case 'drop': {
      if (position.col !== artifact.target.col) {
        return background;
      }
      /** The time at which the drop is exactly at the current row */
      const passTime =
        artifact.endTimeMs -
        (position.row - artifact.target.row) / artifact.rowsPerMs;
      const timeDiff = Date.now() - passTime;
      let opacity: number;
      if (timeDiff < 0 || position.row < artifact.target.row) {
        opacity = 0;
      } else {
        // Trail
        opacity = Math.max(0, 1 - timeDiff / artifact.trailFadeMs);
      }
      return addRGB(background, artifact.color, opacity);
    }
  }

  const _exhaustiveCheck: never = artifact;
  return background;
};

export const generateScreenSaverArtifact = (
  center: MidiCoordinatePoint,
  diameter: number,
): Artifact => ({
  type: 'wave',
  center,
  speedPerSecond: diameter / 2,
  leadingColor: COLORS.WHITE,
  trailingColor: hslToRgb({
    h: Math.random() * 360,
    s: Math.random() * 50 + 50,
    l: 50,
  }),
  maxRadius: diameter * 2,
  leadingEdge: diameter / 16,
  trailingEdge: diameter / 4,
  radius: 0,
});

export const generateFXArtifact = (
  center: MidiCoordinatePoint,
  diameter: number,
): Artifact => ({
  type: 'wave',
  center,
  speedPerSecond: diameter,
  leadingColor: COLORS.WHITE,
  trailingColor: hslToRgb({
    h: Math.random() * 360,
    s: Math.random() * 50 + 50,
    l: 50,
  }),
  maxRadius: diameter * 2,
  leadingEdge: diameter / 16,
  trailingEdge: diameter / 4,
  radius: 0,
});

export const generateMoleHitArtifact = (
  center: MidiCoordinatePoint,
  diameter: number,
  colors: GameColors,
  type: 'hit' | 'miss',
): Artifact => {
  const highlight = type === 'hit' ? colors.secondary : colors.error;
  return {
    type: 'wave',
    center,
    speedPerSecond: diameter * (type === 'hit' ? 2 : 0.5),
    leadingColor: highlight,
    trailingColor: highlight,
    maxRadius: diameter * 2,
    leadingEdge: diameter / 16,
    trailingEdge: diameter / 16,
    radius: 0,
  };
};

export const generateFourInARowImpact = (
  center: MidiCoordinatePoint,
  diameter: number,
  color: RGB,
): Artifact => {
  return {
    type: 'wave',
    center,
    speedPerSecond: diameter * 2,
    leadingColor: COLORS.WHITE,
    trailingColor: color,
    maxRadius: diameter * 2,
    leadingEdge: diameter / 16,
    trailingEdge: diameter / 8,
    radius: 0,
  };
};
