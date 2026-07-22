export type GuideStepId =
  | 'welcome'
  | 'pour-acid'
  | 'read-meter'
  | 'dip-litmus-acid'
  | 'pour-base'
  | 'dip-litmus-base'
  | 'choose-indicator'
  | 'read-scale'
  | 'done'

export type GuideTarget = 'acid' | 'base' | 'beaker' | 'litmus' | 'meter' | 'scale' | 'controls' | 'none'

export type IndicatorKind = 'universal' | 'litmus' | 'phenolphthalein' | 'methyl-orange'

export interface GuideStep {
  id: GuideStepId
  step: number
  title: string
  doThis: string
  why: string
  litmusTip?: string
  target: GuideTarget
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'welcome',
    step: 1,
    title: 'Welcome to the pH Lab',
    doThis: 'Press “Start guided lab”, then follow each highlighted step.',
    why: 'Acids have pH below 7, bases above 7, and pure water is near 7 (neutral).',
    litmusTip: 'Litmus turns RED in acid and BLUE in base. Keep that rule handy.',
    target: 'none',
  },
  {
    id: 'pour-acid',
    step: 2,
    title: 'Step 1 — Pour an acid',
    doThis: 'Tap the HCl beaker (or “Pour acid”) to pour into the mix beaker.',
    why: 'Acids release H⁺ ions and lower pH below 7.',
    litmusTip: 'After pouring, we will dip litmus — expect it to turn red.',
    target: 'acid',
  },
  {
    id: 'read-meter',
    step: 3,
    title: 'Step 2 — Read the digital meter',
    doThis: 'Look at the teal digital pH meter beside the beaker.',
    why: 'A pH meter gives a number: below 7 = acidic, 7 = neutral, above 7 = basic.',
    litmusTip: 'The meter is precise; litmus is a quick color check. We use both.',
    target: 'meter',
  },
  {
    id: 'dip-litmus-acid',
    step: 4,
    title: 'Step 3 — Dip litmus in the acid',
    doThis: 'Tap the litmus strip. Watch it dip into the liquid and change color.',
    why: 'Wet litmus reacts with the solution and shows acid/base by color.',
    litmusTip: 'RED = acid · BLUE = base · muted near neutral. Expect red/pink now.',
    target: 'litmus',
  },
  {
    id: 'pour-base',
    step: 5,
    title: 'Step 4 — Add a base',
    doThis: 'Tap the NaOH beaker to pour base (or empty first, then pour only base).',
    why: 'Bases raise pH. Mixing base into acid starts neutralization toward pH 7.',
    litmusTip: 'When the mixture becomes basic, litmus should turn blue on the next dip.',
    target: 'base',
  },
  {
    id: 'dip-litmus-base',
    step: 6,
    title: 'Step 5 — Dip litmus again',
    doThis: 'Tap litmus once more and watch the dip animation.',
    why: 'Comparing two dips shows how the same paper reports different pH.',
    litmusTip: 'If basic (pH > 7), litmus turns blue. If still acidic, it stays red.',
    target: 'litmus',
  },
  {
    id: 'choose-indicator',
    step: 7,
    title: 'Step 6 — Change the color indicator',
    doThis: 'In Controls, pick Universal, Litmus, Phenolphthalein, or Methyl orange.',
    why: 'Different indicators change color at different pH ranges — watch the beaker.',
    litmusTip:
      'Universal shows a rainbow. Phenolphthalein is colorless in acid, pink in base.',
    target: 'controls',
  },
  {
    id: 'read-scale',
    step: 8,
    title: 'Step 7 — Read the pH color scale',
    doThis: 'Find the rainbow pH scale under the beaker. The marker shows your pH.',
    why: 'Universal indicator colors map across the full 0–14 scale.',
    litmusTip: 'Match the beaker color and marker position to the scale labels.',
    target: 'scale',
  },
  {
    id: 'done',
    step: 9,
    title: 'Lab complete — keep exploring!',
    doThis: 'Empty the beaker and try new mixes. Press Replay guide anytime.',
    why: 'You can pour, read pH, dip litmus, switch indicators, and read the scale.',
    litmusTip: 'Remember: litmus red = acid, litmus blue = base.',
    target: 'none',
  },
]

export function getGuideStep(id: GuideStepId): GuideStep {
  return GUIDE_STEPS.find((s) => s.id === id) ?? GUIDE_STEPS[0]
}

export function nextGuideId(id: GuideStepId): GuideStepId {
  const i = GUIDE_STEPS.findIndex((s) => s.id === id)
  if (i < 0 || i >= GUIDE_STEPS.length - 1) return 'done'
  return GUIDE_STEPS[i + 1].id
}

export function advanceGuideAfterAction(
  current: GuideStepId,
  action:
    | 'start'
    | 'poured'
    | 'viewed-meter'
    | 'dipped-litmus'
    | 'changed-indicator'
    | 'viewed-scale'
    | 'skip',
  volume: number,
  category: string,
): GuideStepId {
  if (action === 'skip') return nextGuideId(current)
  if (action === 'start' && current === 'welcome') return 'pour-acid'

  switch (current) {
    case 'pour-acid':
      if (action === 'poured' && volume > 0) return 'read-meter'
      break
    case 'read-meter':
      if (action === 'viewed-meter' || action === 'dipped-litmus' || action === 'poured') {
        return 'dip-litmus-acid'
      }
      break
    case 'dip-litmus-acid':
      if (action === 'dipped-litmus') return 'pour-base'
      break
    case 'pour-base':
      if (action === 'poured') return 'dip-litmus-base'
      break
    case 'dip-litmus-base':
      if (action === 'dipped-litmus') return 'choose-indicator'
      break
    case 'choose-indicator':
      if (action === 'changed-indicator') return 'read-scale'
      break
    case 'read-scale':
      if (action === 'viewed-scale') return 'done'
      break
    default:
      break
  }
  void category
  return current
}

/** Color of solution for a selected indicator at a given pH. */
export function solutionIndicatorColor(kind: IndicatorKind, ph: number, volume: number): string {
  if (volume < 0.5) return 'rgba(200,220,240,0.2)'
  switch (kind) {
    case 'litmus':
      if (ph < 6.5) return 'rgb(220, 55, 70)'
      if (ph > 7.5) return 'rgb(55, 90, 210)'
      return 'rgb(180, 120, 160)'
    case 'phenolphthalein':
      if (ph < 8.2) return 'rgba(245, 248, 255, 0.35)'
      {
        const t = Math.min(1, (ph - 8.2) / 3)
        return `rgba(${Math.round(220 - t * 40)}, ${Math.round(40 + t * 20)}, ${Math.round(120 + t * 40)}, ${0.35 + t * 0.55})`
      }
    case 'methyl-orange':
      if (ph < 3.1) return 'rgb(220, 40, 40)'
      if (ph < 4.4) {
        const t = (ph - 3.1) / 1.3
        return `rgb(220, ${Math.round(40 + t * 140)}, 40)`
      }
      return 'rgb(240, 200, 40)'
    case 'universal':
    default:
      return universalPhColor(ph)
  }
}

export function universalPhColor(ph: number): string {
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
