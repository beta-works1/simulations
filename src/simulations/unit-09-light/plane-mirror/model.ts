/** Plane mirror image geometry — book Fig 9.8, p.112. */

export interface PlaneMirrorState {
  /** Object distance from mirror (positive, to the left). */
  objectDistance: number
  objectX: number
  imageX: number
  /** Equal object/image distance from the mirror. */
  distanceEqual: boolean
}

/**
 * Vertical mirror at x = 0. Object at −d, image at +d.
 * Distances from the mirror are equal.
 */
export function planeMirrorImage(objectDistance: number): PlaneMirrorState {
  const d = Math.max(0.1, objectDistance)
  return {
    objectDistance: d,
    objectX: -d,
    imageX: d,
    distanceEqual: true,
  }
}

export function distanceLabel(d: number): string {
  return `${d.toFixed(1)} cm`
}
