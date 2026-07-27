/** Natural indicators — PTB Ch 7. Model only; Canvas draws state. */

export type IndicatorType = 'cabbage' | 'turmeric'
export type SubstanceType = 'acid' | 'neutral' | 'base'

export interface IndicatorState {
  dripProgress: number
  mixedPh: number
  displayPh: number
  time: number
}

export function createIndicatorState(): IndicatorState {
  return { dripProgress: 0, mixedPh: 7, displayPh: 7, time: 0 }
}

export function targetPhForSubstance(substance: SubstanceType): number {
  return substance === 'acid' ? 2.5 : substance === 'base' ? 11 : 7
}

export function stepIndicator(
  s: IndicatorState,
  dt: number,
  substance: SubstanceType,
  dripping: boolean,
): IndicatorState {
  const targetPh = targetPhForSubstance(substance)
  let { dripProgress, mixedPh, displayPh } = s

  if (dripping) {
    dripProgress = Math.min(1, dripProgress + dt * 0.45)
  }

  const mix = dripProgress
  mixedPh = 7 + (targetPh - 7) * mix
  // Smooth readout (presentation damping — not a new chemical law)
  const diff = mixedPh - displayPh
  displayPh = Math.abs(diff) < 0.02 ? mixedPh : displayPh + diff * Math.min(1, dt * 5)

  return { ...s, dripProgress, mixedPh, displayPh, time: s.time + dt }
}

/** Cabbage: pink/red acidic, purple neutral, blue/green basic. */
export function cabbageColor(ph: number): string {
  if (ph < 5) return `rgb(${220}, ${60 + ph * 10}, ${90})`
  if (ph < 6.5) return `rgb(${180}, ${80}, ${140})`
  if (ph <= 7.5) return 'rgb(120, 60, 160)'
  if (ph < 10) return `rgb(${50}, ${100 + (ph - 7) * 30}, ${200})`
  return `rgb(${40}, ${140}, ${120})`
}

/** Turmeric: yellow in acid/neutral, red-brown in base. */
export function turmericColor(ph: number): string {
  if (ph < 8) return 'rgb(240, 200, 40)'
  const t = Math.min(1, (ph - 8) / 4)
  return `rgb(${220 - t * 80}, ${120 - t * 60}, ${30})`
}

export function indicatorColor(type: IndicatorType, ph: number): string {
  return type === 'cabbage' ? cabbageColor(ph) : turmericColor(ph)
}

export function phCategory(ph: number): string {
  if (ph < 6) return 'Acidic'
  if (ph > 8) return 'Basic'
  return 'Neutral'
}

export function expectedColor(indicator: IndicatorType, substance: SubstanceType): string {
  if (indicator === 'cabbage') {
    if (substance === 'acid') return 'Pink / red'
    if (substance === 'base') return 'Blue / green'
    return 'Purple'
  }
  return substance === 'base' ? 'Red-brown' : 'Yellow'
}
