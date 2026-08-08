/** Match substances to everyday uses — Unit 7, p.80. */

export interface SubstanceUse {
  id: string
  substance: string
  correctUse: string
  options: string[]
}

export const SUBSTANCES: SubstanceUse[] = [
  {
    id: 'hcl',
    substance: 'HCl (dilute)',
    correctUse: 'Cleaning metals / toilets',
    options: ['Cleaning metals / toilets', 'Making soap', 'Baking cakes'],
  },
  {
    id: 'naoh',
    substance: 'NaOH',
    correctUse: 'Making soap',
    options: ['Making soap', 'Neutralising soil', 'Soft drinks'],
  },
  {
    id: 'caco3',
    substance: 'CaCO₃ (chalk / limestone)',
    correctUse: 'Building / antacid',
    options: ['Building / antacid', 'Bleaching clothes', 'Making glass only'],
  },
  {
    id: 'vinegar',
    substance: 'Acetic acid (vinegar)',
    correctUse: 'Food preservative / flavour',
    options: ['Food preservative / flavour', 'Car batteries', 'Drain cleaner'],
  },
]

export function scoreUses(answers: Record<string, string>): {
  correct: number
  total: number
} {
  let correct = 0
  for (const s of SUBSTANCES) {
    if (answers[s.id] === s.correctUse) correct += 1
  }
  return { correct, total: SUBSTANCES.length }
}

export function allUsesCorrect(answers: Record<string, string>): boolean {
  return scoreUses(answers).correct === SUBSTANCES.length
}
