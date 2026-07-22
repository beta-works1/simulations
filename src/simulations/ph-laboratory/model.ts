/** pH Laboratory — pure model (no canvas/DOM). */

export type IndicatorKind = 'litmus' | 'phenolphthalein' | 'methyl-orange' | 'universal'
export type Prediction = 'acid' | 'base' | 'neutral' | null
export type Category = 'acid' | 'base' | 'neutral'

export interface Substance {
  id: string
  label: string
  /** Intrinsic pH of the substance when used as a stock solution. */
  ph: number
  color: string
  kind: Category
}

export const SUBSTANCES: readonly Substance[] = [
  { id: 'hcl', label: 'HCl (acid)', ph: 1.5, color: 'rgb(255,220,120)', kind: 'acid' },
  { id: 'vinegar', label: 'Vinegar', ph: 2.8, color: 'rgb(255,240,180)', kind: 'acid' },
  { id: 'lemon', label: 'Lemon juice', ph: 2.3, color: 'rgb(255,210,80)', kind: 'acid' },
  { id: 'water', label: 'Water', ph: 7, color: 'rgb(190,220,255)', kind: 'neutral' },
  { id: 'soap', label: 'Soap', ph: 10, color: 'rgb(220,180,255)', kind: 'base' },
  { id: 'naoh', label: 'NaOH (base)', ph: 13, color: 'rgb(200,230,255)', kind: 'base' },
] as const

export interface LabState {
  /** Volume of liquid in beaker (mL), 0–100. */
  volume: number
  /** Strong-acid equivalent units in beaker. */
  acidUnits: number
  /** Strong-base equivalent units in beaker. */
  baseUnits: number
  /** Smoothed pH for meter / color. */
  displayPh: number
  indicator: IndicatorKind
  litmusDipped: boolean
  litmusWet: boolean
  /** Brief pour / mix animation 0–1. */
  mixProgress: number
  mixing: boolean
  prediction: Prediction
  revealed: boolean
  time: number
  /** Last substance id poured (for labels). */
  lastSubstanceId: string | null
}

export function createLabState(): LabState {
  return {
    volume: 0,
    acidUnits: 0,
    baseUnits: 0,
    displayPh: 7,
    indicator: 'universal',
    litmusDipped: false,
    litmusWet: false,
    mixProgress: 0,
    mixing: false,
    prediction: null,
    revealed: false,
    time: 0,
    lastSubstanceId: null,
  }
}

/** True equilibrium pH from acid/base inventory (simplified strong acid/base). */
export function computePh(acidUnits: number, baseUnits: number, volume: number): number {
  if (volume < 0.5) return 7
  const neutralized = Math.min(acidUnits, baseUnits)
  const excessAcid = acidUnits - neutralized
  const excessBase = baseUnits - neutralized
  if (excessAcid > 0.05) {
    // Map excess to pH 0–6.5
    const strength = Math.min(1, excessAcid / Math.max(volume * 0.4, 1))
    return 7 - 6.2 * strength
  }
  if (excessBase > 0.05) {
    const strength = Math.min(1, excessBase / Math.max(volume * 0.4, 1))
    return 7 + 6.2 * strength
  }
  return 7
}

export function phCategory(ph: number): Category {
  if (ph < 6.5) return 'acid'
  if (ph > 7.5) return 'base'
  return 'neutral'
}

export function categoryLabel(c: Category): string {
  return c === 'acid' ? 'Acidic' : c === 'base' ? 'Basic' : 'Neutral'
}

/** Indicator color for a given pH. */
export function indicatorColor(kind: IndicatorKind, ph: number): string {
  switch (kind) {
    case 'litmus':
      if (ph < 6.5) return 'rgb(220, 55, 70)'
      if (ph > 7.5) return 'rgb(55, 90, 210)'
      return 'rgb(180, 120, 160)'
    case 'phenolphthalein':
      // Colorless acid/neutral → pink/magenta in base
      if (ph < 8.2) return 'rgba(245, 248, 255, 0.35)'
      {
        const t = Math.min(1, (ph - 8.2) / 3)
        return `rgba(${220 - t * 40}, ${40 + t * 20}, ${120 + t * 40}, ${0.35 + t * 0.55})`
      }
    case 'methyl-orange':
      // Red in strong acid → orange → yellow above ~4.4
      if (ph < 3.1) return 'rgb(220, 40, 40)'
      if (ph < 4.4) {
        const t = (ph - 3.1) / 1.3
        return `rgb(${220}, ${40 + t * 140}, ${40})`
      }
      return 'rgb(240, 200, 40)'
    case 'universal':
    default: {
      const stops = [
        { at: 0, r: 220, g: 30, b: 30 },
        { at: 3, r: 255, g: 140, b: 0 },
        { at: 6, r: 255, g: 220, b: 0 },
        { at: 7, r: 80, g: 180, b: 80 },
        { at: 9, r: 60, g: 140, b: 220 },
        { at: 12, r: 90, g: 60, b: 200 },
        { at: 14, r: 120, g: 40, b: 160 },
      ]
      const p = Math.max(0, Math.min(14, ph))
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
  }
}

export function litmusStripColor(ph: number, wet: boolean): string {
  if (!wet) return 'rgb(230, 210, 200)'
  return indicatorColor('litmus', ph)
}

export function setIndicator(s: LabState, indicator: IndicatorKind): LabState {
  return { ...s, indicator }
}

export function setPrediction(s: LabState, prediction: Prediction): LabState {
  return { ...s, prediction, revealed: false }
}

export function revealPrediction(s: LabState): LabState {
  return { ...s, revealed: true }
}

/** Pour a stock substance into the beaker (mix). */
export function pourSubstance(s: LabState, substanceId: string, amountMl = 18): LabState {
  const sub = SUBSTANCES.find((x) => x.id === substanceId)
  if (!sub) return s
  const room = Math.max(0, 100 - s.volume)
  const add = Math.min(amountMl, room)
  if (add < 0.5) return s

  let acidUnits = s.acidUnits
  let baseUnits = s.baseUnits
  // Convert substance strength relative to pH distance from 7
  const strength = Math.abs(sub.ph - 7) / 6
  const units = add * (0.35 + strength * 0.9)
  if (sub.kind === 'acid') acidUnits += units
  else if (sub.kind === 'base') baseUnits += units
  // Neutral just dilutes volume

  const volume = s.volume + add
  const target = computePh(acidUnits, baseUnits, volume)
  return {
    ...s,
    volume,
    acidUnits,
    baseUnits,
    displayPh: s.volume < 0.5 ? target : s.displayPh,
    mixing: true,
    mixProgress: 0,
    litmusWet: false,
    litmusDipped: false,
    revealed: false,
    lastSubstanceId: substanceId,
  }
}

/** Add acid to neutralize a base (or strengthen acidity). */
export function neutralizeBase(s: LabState, amountMl = 12): LabState {
  return pourSubstance(s, 'hcl', amountMl)
}

/** Add base to neutralize an acid. */
export function neutralizeAcid(s: LabState, amountMl = 12): LabState {
  return pourSubstance(s, 'naoh', amountMl)
}

export function dipLitmus(s: LabState): LabState {
  if (s.volume < 1) return { ...s, litmusDipped: true, litmusWet: false }
  return { ...s, litmusDipped: true, litmusWet: true }
}

export function undipLitmus(s: LabState): LabState {
  return { ...s, litmusDipped: false }
}

export function emptyBeaker(s: LabState): LabState {
  return {
    ...createLabState(),
    indicator: s.indicator,
    prediction: s.prediction,
  }
}

export function stepLab(s: LabState, dt: number): LabState {
  let { mixProgress, mixing, displayPh, time } = s
  time += dt

  if (mixing) {
    mixProgress = Math.min(1, mixProgress + dt * 1.4)
    if (mixProgress >= 1) mixing = false
  }

  const target = computePh(s.acidUnits, s.baseUnits, s.volume)
  const diff = target - displayPh
  displayPh = Math.abs(diff) < 0.02 ? target : displayPh + diff * Math.min(1, dt * 4.5)

  return { ...s, mixProgress, mixing, displayPh, time }
}

export function predictionCorrect(s: LabState): boolean | null {
  if (!s.prediction || !s.revealed || s.volume < 1) return null
  return s.prediction === phCategory(s.displayPh)
}

export function expectedIndicatorHint(kind: IndicatorKind, ph: number): string {
  const cat = phCategory(ph)
  switch (kind) {
    case 'litmus':
      return cat === 'acid' ? 'Red' : cat === 'base' ? 'Blue' : 'Purple-ish'
    case 'phenolphthalein':
      return cat === 'base' ? 'Pink / magenta' : 'Colorless'
    case 'methyl-orange':
      return ph < 3.1 ? 'Red' : ph < 4.4 ? 'Orange' : 'Yellow'
    case 'universal':
      return cat === 'acid' ? 'Warm / red-yellow' : cat === 'base' ? 'Cool / blue-violet' : 'Green'
  }
}
