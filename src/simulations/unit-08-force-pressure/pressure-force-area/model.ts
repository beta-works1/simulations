/** Pressure = force / area — face-down vs edge-down (book p.97). */

export const AREA_FACE = 20 // cm² — large face on sand
export const AREA_EDGE = 2 // cm² — thin edge on sand

export type Orientation = 'face-down' | 'edge-down'

export function areaForOrientation(orientation: Orientation): number {
  return orientation === 'face-down' ? AREA_FACE : AREA_EDGE
}

/** Pressure in N/cm² (school-friendly units). */
export function pressure(force: number, area: number): number {
  if (area <= 0) return 0
  return force / area
}

/** Visual sink depth 0–1 proportional to pressure (capped for display). */
export function sinkDepth(force: number, area: number, maxP = 25): number {
  const p = pressure(force, area)
  return Math.max(0, Math.min(1, p / maxP))
}
