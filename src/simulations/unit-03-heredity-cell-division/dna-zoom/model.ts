/** DNA structure zoom: chromosome → helix → bases (book p.28). */

export type ZoomLevel = 'chromosome' | 'helix' | 'bases'

export type ZoomInfo = { id: ZoomLevel; label: string; detail: string }

export const ZOOM_LEVELS: ZoomInfo[] = [
  {
    id: 'chromosome',
    label: 'Chromosome',
    detail: 'Packed DNA visible during cell division — many genes coiled tightly.',
  },
  {
    id: 'helix',
    label: 'Double helix',
    detail: 'Two strands twist like a ladder — the shape of a DNA molecule.',
  },
  {
    id: 'bases',
    label: 'Base pairs',
    detail: 'A pairs with T, C pairs with G — the code that carries hereditary information.',
  },
]

/** Slider 0–2 → zoom level. */
export function zoomFromLevel(level: number): ZoomInfo {
  const i = Math.max(0, Math.min(ZOOM_LEVELS.length - 1, Math.round(level)))
  return ZOOM_LEVELS[i]
}
