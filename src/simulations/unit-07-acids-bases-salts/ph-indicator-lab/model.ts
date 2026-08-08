/** pH scale & indicator colours — book opening page (p.76) and indicator notes. */

export type IndicatorId = 'litmus' | 'phenolphthalein' | 'methyl-orange' | 'turmeric'

export type PhZone = 'Strong acid' | 'Weak acid' | 'Neutral' | 'Weak alkali' | 'Strong alkali'

export function zoneForPh(ph: number): PhZone {
  if (ph <= 2) return 'Strong acid'
  if (ph <= 6) return 'Weak acid'
  if (ph < 8) return 'Neutral' // book: 7 neutral; treat 7–<8 as neutral band
  if (ph <= 11) return 'Weak alkali'
  return 'Strong alkali'
}

/** Exact book ranges: 0–2, 3–6, 7, 8–11, 12–14 — use integer-friendly boundaries. */
export function zoneForPhBook(ph: number): PhZone {
  const p = Math.round(ph)
  if (p <= 2) return 'Strong acid'
  if (p <= 6) return 'Weak acid'
  if (p === 7) return 'Neutral'
  if (p <= 11) return 'Weak alkali'
  return 'Strong alkali'
}

export function indicatorColor(indicator: IndicatorId, ph: number): { fill: string; label: string } {
  const alkaline = ph > 7
  const acidic = ph < 7
  switch (indicator) {
    case 'litmus':
      if (acidic) return { fill: '#ef4444', label: 'Red (acid)' }
      if (alkaline) return { fill: '#3b82f6', label: 'Blue (alkali)' }
      return { fill: '#c4b5fd', label: 'Purple (neutral)' }
    case 'phenolphthalein':
      if (ph >= 8.2) return { fill: '#ec4899', label: 'Pink (alkaline)' }
      return { fill: '#f8fafc', label: 'Colourless' }
    case 'methyl-orange':
      if (ph < 3.1) return { fill: '#ef4444', label: 'Red (acid)' }
      if (ph > 4.4) return { fill: '#f59e0b', label: 'Yellow (alkaline/neutral)' }
      return { fill: '#fb923c', label: 'Orange (transition)' }
    case 'turmeric':
      if (alkaline) return { fill: '#92400e', label: 'Brown (alkali)' }
      return { fill: '#facc15', label: 'Yellow' }
  }
}

/** CSS stops matching a typical textbook pH strip (red→yellow→green→blue→purple). */
export const PH_GRADIENT =
  'linear-gradient(90deg,#b91c1c 0%,#ea580c 15%,#facc15 35%,#22c55e 50%,#0ea5e9 70%,#4f46e5 85%,#7e22ce 100%)'
