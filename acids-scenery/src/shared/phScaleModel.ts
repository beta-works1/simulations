/** pH scale — PTB Ch 7. Model only; Canvas draws state. */

export const SUBSTANCES: { id: string; label: string; ph: number; color: string }[] = [
  // Solute pH / colors from PhET ph-scale Solute.ts
  { id: 'battery', label: 'Battery acid', ph: 1, color: 'rgb(255,255,0)' },
  { id: 'vomit', label: 'Vomit', ph: 2, color: 'rgb(255,171,120)' },
  { id: 'soda', label: 'Soda pop', ph: 2.5, color: 'rgb(204,255,102)' },
  { id: 'oj', label: 'Orange juice', ph: 3.5, color: 'rgb(255,180,0)' },
  { id: 'coffee', label: 'Coffee', ph: 5, color: 'rgb(164,99,7)' },
  { id: 'soup', label: 'Chicken soup', ph: 5.8, color: 'rgb(255,240,104)' },
  { id: 'milk', label: 'Milk', ph: 6.5, color: 'rgb(250,250,250)' },
  { id: 'water', label: 'Water', ph: 7, color: 'rgb(200,220,255)' },
  { id: 'blood', label: 'Blood', ph: 7.4, color: 'rgb(211,79,68)' },
  { id: 'spit', label: 'Spit', ph: 7.4, color: 'rgb(202,240,239)' },
  { id: 'soap', label: 'Hand soap', ph: 10, color: 'rgb(224,141,242)' },
  { id: 'drain', label: 'Drain cleaner', ph: 13, color: 'rgb(255,255,0)' },
]

/** PhET PHScaleConstants.PH_RANGE is −1…15; we expose the same span for custom marker. */
export const PH_RANGE = { min: -1, max: 15 } as const

export function phToColor(ph: number): string {
  const p = Math.max(0, Math.min(14, ph))
  const stops = [
    { at: 0, r: 220, g: 30, b: 30 },
    { at: 3, r: 255, g: 140, b: 0 },
    { at: 6, r: 255, g: 220, b: 0 },
    { at: 7, r: 80, g: 180, b: 80 },
    { at: 9, r: 60, g: 140, b: 220 },
    { at: 12, r: 90, g: 60, b: 200 },
    { at: 14, r: 120, g: 40, b: 160 },
  ]
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    if (p >= a.at && p <= b.at) {
      const t = (p - a.at) / (b.at - a.at)
      return `rgb(${Math.round(a.r + (b.r - a.r) * t)},${Math.round(a.g + (b.g - a.g) * t)},${Math.round(a.b + (b.b - a.b) * t)})`
    }
  }
  return 'rgb(120,40,160)'
}

export interface PhScaleState {
  displayPh: number
  targetPh: number
  time: number
}

export function createPhScaleState(): PhScaleState {
  return { displayPh: 7, targetPh: 7, time: 0 }
}

export function stepPhScale(s: PhScaleState, dt: number, target: number): PhScaleState {
  const diff = target - s.displayPh
  const displayPh = Math.abs(diff) < 0.02 ? target : s.displayPh + diff * Math.min(1, dt * 4)
  return { ...s, displayPh, targetPh: target, time: s.time + dt }
}

export function phLabel(ph: number): string {
  if (ph < 6.5) return 'Acidic'
  if (ph > 7.5) return 'Basic (alkaline)'
  return 'Neutral'
}
