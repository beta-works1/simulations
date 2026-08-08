/** Water pressure increases with depth — streams from bottle holes (book p.99). */

export const HOLE_COUNT = 3

/** Depth index 0 = top hole (shallow), 2 = bottom (deep). */
export function streamLength(depthIndex: number): number {
  const i = Math.max(0, Math.min(HOLE_COUNT - 1, Math.floor(depthIndex)))
  // Relative jet length: deeper → longer stream
  return 40 + i * 45
}

export function holeDepthLabel(depthIndex: number): string {
  if (depthIndex <= 0) return 'Near surface (low pressure)'
  if (depthIndex === 1) return 'Middle (medium pressure)'
  return 'Near bottom (high pressure)'
}
