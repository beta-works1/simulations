/** Scale levels from cell → gene — PTB Ch 5. Model only; Canvas draws state. */

export const DNA_ZOOM_LABELS = [
  'Cell',
  'Nucleus',
  'Chromosome',
  'DNA double helix',
  'Gene segment',
] as const

export const DNA_ZOOM_MAX = 4

export interface DnaZoomState {
  spin: number
}

export function createDnaZoomState(): DnaZoomState {
  return { spin: 0 }
}

export function stepDnaZoom(s: DnaZoomState, dt: number, running: boolean): DnaZoomState {
  if (!running || dt <= 0) return s
  return { spin: s.spin + dt }
}

export function clampZoomLevel(n: number): number {
  return Math.max(0, Math.min(DNA_ZOOM_MAX, Math.round(n)))
}
