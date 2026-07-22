import { phCategory, type Category, type LabState, type Substance } from './model'

export type GuideStepId =
  | 'welcome'
  | 'pour-acid'
  | 'read-meter'
  | 'dip-litmus-acid'
  | 'pour-base'
  | 'dip-litmus-base'
  | 'choose-indicator'
  | 'neutralize'
  | 'predict'
  | 'done'

export type GuideTarget = 'shelf-acid' | 'shelf-base' | 'beaker' | 'litmus' | 'meter' | 'controls' | 'none'

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
    doThis: 'You will test acids and bases with litmus paper, a digital meter, and color indicators.',
    why: 'Acids have pH below 7, bases above 7, and pure water is near 7 (neutral).',
    litmusTip:
      'Litmus paper is a quick paper strip test: it turns red in acid and blue in base. Keep this rule in mind.',
    target: 'none',
  },
  {
    id: 'pour-acid',
    step: 2,
    title: 'Step 1 — Pour an acid',
    doThis: 'Drag vinegar, lemon juice, or HCl into the beaker (or tap the bottle).',
    why: 'Acids release H⁺ ions. Putting acid in the beaker lowers the pH below 7.',
    litmusTip: 'After pouring, we will dip litmus — expect it to turn red.',
    target: 'shelf-acid',
  },
  {
    id: 'read-meter',
    step: 3,
    title: 'Step 2 — Read the digital pH meter',
    doThis: 'Look at the teal digital pH meter beside the beaker.',
    why: 'A pH meter gives a number: below 7 = acidic, 7 = neutral, above 7 = basic.',
    litmusTip: 'The meter is precise; litmus is a simple color check. We use both.',
    target: 'meter',
  },
  {
    id: 'dip-litmus-acid',
    step: 4,
    title: 'Step 3 — Dip litmus in the acid',
    doThis: 'Drag the litmus strip into the beaker liquid (or tap for a quick dip).',
    why: 'Wet litmus reacts with the solution and shows acid/base by color.',
    litmusTip:
      'Litmus guide: RED = acid · BLUE = base · little change near neutral. Your strip should look red/pink now.',
    target: 'litmus',
  },
  {
    id: 'pour-base',
    step: 5,
    title: 'Step 4 — Add a base (or start fresh)',
    doThis: 'Pour soap or NaOH into the beaker. Or tap Empty, then pour only a base.',
    why: 'Bases raise pH. Mixing base into acid starts neutralization toward pH 7.',
    litmusTip: 'When the mixture becomes basic, litmus should turn blue on the next dip.',
    target: 'shelf-base',
  },
  {
    id: 'dip-litmus-base',
    step: 6,
    title: 'Step 5 — Dip litmus again',
    doThis: 'Drag litmus into the beaker again to test the new mixture.',
    why: 'Comparing two dips shows how the same paper reports different pH.',
    litmusTip:
      'If the solution is basic (pH > 7), litmus turns blue. If still acidic, it stays red — keep neutralizing!',
    target: 'litmus',
  },
  {
    id: 'choose-indicator',
    step: 7,
    title: 'Step 6 — Choose another indicator',
    doThis: 'In the sidebar, change Indicator (phenolphthalein, methyl orange, or universal).',
    why: 'Different indicators change color at different pH ranges — watch the beaker color.',
    litmusTip:
      'Litmus is only one indicator. Phenolphthalein is colorless in acid and pink in base. Universal shows a rainbow of colors.',
    target: 'controls',
  },
  {
    id: 'neutralize',
    step: 8,
    title: 'Step 7 — Neutralize',
    doThis: 'Use “Neutralize acid (+ base)” or “Neutralize base (+ acid)” until pH nears 7.',
    why: 'Acid + base → salt + water. Equal amounts push the mixture toward neutral.',
    litmusTip: 'Near pH 7, litmus looks muted (not strongly red or blue). Try dipping again after neutralizing.',
    target: 'controls',
  },
  {
    id: 'predict',
    step: 9,
    title: 'Step 8 — Predict, then check',
    doThis: 'Choose Acidic / Neutral / Basic, then press Reveal answer.',
    why: 'Scientists predict first, then measure — that trains your understanding.',
    litmusTip: 'Use both the meter number and litmus color to support your prediction.',
    target: 'controls',
  },
  {
    id: 'done',
    step: 10,
    title: 'Lab complete — keep exploring!',
    doThis: 'Empty the beaker and try new combinations. Replay the guide anytime.',
    why: 'You can now test, read pH, use litmus, change indicators, neutralize, and predict.',
    litmusTip: 'Remember forever: litmus red = acid, litmus blue = base.',
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

/** Advance guide when the learner completes the current step’s action. */
export function advanceGuideAfterAction(
  current: GuideStepId,
  action:
    | 'start'
    | 'poured'
    | 'viewed-meter'
    | 'dipped-litmus'
    | 'changed-indicator'
    | 'neutralized'
    | 'revealed'
    | 'skip',
  state: LabState,
): GuideStepId {
  if (action === 'skip') return nextGuideId(current)
  if (action === 'start' && current === 'welcome') return 'pour-acid'

  switch (current) {
    case 'pour-acid':
      if (action === 'poured' && state.volume > 0 && phCategory(state.displayPh) === 'acid') {
        return 'read-meter'
      }
      // poured something else — still move on if liquid present
      if (action === 'poured' && state.volume > 0) return 'read-meter'
      break
    case 'read-meter':
      if (action === 'viewed-meter' || action === 'dipped-litmus' || action === 'poured') {
        return 'dip-litmus-acid'
      }
      break
    case 'dip-litmus-acid':
      if (action === 'dipped-litmus' && state.litmusWet) return 'pour-base'
      break
    case 'pour-base':
      if (action === 'poured' || action === 'neutralized') return 'dip-litmus-base'
      break
    case 'dip-litmus-base':
      if (action === 'dipped-litmus') return 'choose-indicator'
      break
    case 'choose-indicator':
      if (action === 'changed-indicator') return 'neutralize'
      break
    case 'neutralize':
      if (action === 'neutralized') return 'predict'
      break
    case 'predict':
      if (action === 'revealed') return 'done'
      break
    default:
      break
  }
  return current
}

export function litmusResultMessage(state: LabState): string {
  if (state.volume < 1) {
    return 'Beaker is empty — pour a liquid first, then dip litmus.'
  }
  if (!state.litmusWet) {
    return 'Litmus is dry. Drag the strip into the beaker to dip it.'
  }
  const cat = phCategory(state.displayPh)
  if (cat === 'acid') {
    return `Litmus turned RED → the solution is acidic (pH ${state.displayPh.toFixed(1)}).`
  }
  if (cat === 'base') {
    return `Litmus turned BLUE → the solution is basic (pH ${state.displayPh.toFixed(1)}).`
  }
  return `Litmus shows little change → near neutral (pH ${state.displayPh.toFixed(1)}).`
}

export function pourExplain(sub: Substance, state: LabState): string {
  const cat = phCategory(state.displayPh)
  const role =
    sub.kind === 'acid'
      ? 'This is an acid — it lowers pH.'
      : sub.kind === 'base'
        ? 'This is a base — it raises pH.'
        : 'Water is neutral — it mostly dilutes the mixture.'
  return `Poured ${sub.label}. ${role} Mixture is now ${cat} (pH ${state.displayPh.toFixed(1)}).`
}

export function hoverExplain(hit: string | null, state: LabState): string | null {
  if (!hit) return null
  if (hit === 'litmus') {
    return state.litmusWet
      ? litmusResultMessage(state)
      : 'Litmus paper: drag into the beaker to dip. Red = acid, blue = base.'
  }
  if (hit === 'meter') {
    return state.volume < 1
      ? 'Digital pH meter — shows a number once liquid is in the beaker.'
      : `Meter reads pH ${state.displayPh.toFixed(1)} (${phCategory(state.displayPh)}). Below 7 acid, above 7 base.`
  }
  if (hit === 'beaker') {
    return state.volume < 1
      ? 'Beaker — drop substances here to mix them.'
      : `Beaker holds ${state.volume.toFixed(0)} mL. Color comes from the selected indicator.`
  }
  if (hit === 'empty') return 'Empty — clear the beaker and start a new test.'
  if (hit.startsWith('sub-')) {
    const id = hit.slice(4)
    const labels: Record<string, string> = {
      hcl: 'Strong acid (HCl). Expect low pH and red litmus.',
      vinegar: 'Weak acid (acetic acid). pH around 3 — litmus turns red.',
      lemon: 'Citric acid. Sour acids also turn litmus red.',
      water: 'Neutral water (~pH 7). Good for diluting.',
      soap: 'Basic soap. Expect higher pH and blue litmus.',
      naoh: 'Strong base (NaOH). High pH — litmus turns blue.',
    }
    return labels[id] ?? 'Drag into the beaker to pour.'
  }
  return null
}

export function categoryCoach(cat: Category): string {
  if (cat === 'acid') return 'Acidic: pH < 7 · litmus red · taste sour (never taste in real labs!)'
  if (cat === 'base') return 'Basic: pH > 7 · litmus blue · feel slippery (never touch strong bases!)'
  return 'Neutral: pH ≈ 7 · litmus barely changes'
}
