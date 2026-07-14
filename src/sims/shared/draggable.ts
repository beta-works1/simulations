/**
 * Shared canvas drag helpers (PhET-style DraggableObject pattern).
 * Prefer useCanvasPointer in sims; these helpers keep bounds/snapping consistent.
 */

export type Point = { x: number; y: number }

export function clampPoint(
  p: Point,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
): Point {
  return {
    x: Math.min(bounds.maxX, Math.max(bounds.minX, p.x)),
    y: Math.min(bounds.maxY, Math.max(bounds.minY, p.y)),
  }
}

export function snapValue(value: number, step: number, origin = 0): number {
  if (step <= 0) return value
  return origin + Math.round((value - origin) / step) * step
}

/** Hit-test a circular handle. */
export function hitCircle(pt: Point, center: Point, radius: number): boolean {
  return Math.hypot(pt.x - center.x, pt.y - center.y) <= radius
}
