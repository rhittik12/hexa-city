/**
 * Rotation utilities for the hexagonal city.
 *
 * The city has 6 sides (indices 0–5).
 * Each side spans 60 degrees (π/3 radians) around the Y-axis.
 */

const SIDES = 6;
const ANGLE_PER_SIDE = (2 * Math.PI) / SIDES; // 60° in radians

/** Return the Y-axis rotation in radians for a given side index. */
export function getRotationAngle(side: number): number {
  return side * ANGLE_PER_SIDE;
}

/** Return the next side index, wrapping 5 → 0. */
export function getNextSide(current: number): number {
  return (current + 1) % SIDES;
}

/** Return the previous side index, wrapping 0 → 5. */
export function getPrevSide(current: number): number {
  return (current - 1 + SIDES) % SIDES;
}
