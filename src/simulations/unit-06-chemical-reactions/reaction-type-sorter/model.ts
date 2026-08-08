/** Classify reaction types — Unit 6, p.57. */

export type ReactionType =
  | 'combination'
  | 'decomposition'
  | 'displacement'
  | 'double-displacement'
  | 'combustion'

export interface EquationItem {
  id: string
  equation: string
  correct: ReactionType
}

export const EQUATION_BANK: EquationItem[] = [
  { id: 'e1', equation: '2H₂ + O₂ → 2H₂O', correct: 'combination' },
  { id: 'e2', equation: '2HgO → 2Hg + O₂', correct: 'decomposition' },
  { id: 'e3', equation: 'Zn + CuSO₄ → ZnSO₄ + Cu', correct: 'displacement' },
  {
    id: 'e4',
    equation: 'AgNO₃ + NaCl → AgCl + NaNO₃',
    correct: 'double-displacement',
  },
  { id: 'e5', equation: 'CH₄ + 2O₂ → CO₂ + 2H₂O', correct: 'combustion' },
]

export const TYPE_OPTIONS: { id: ReactionType; label: string }[] = [
  { id: 'combination', label: 'Combination' },
  { id: 'decomposition', label: 'Decomposition' },
  { id: 'displacement', label: 'Displacement' },
  { id: 'double-displacement', label: 'Double displacement' },
  { id: 'combustion', label: 'Combustion' },
]

export function scoreAnswers(answers: Record<string, ReactionType | ''>): {
  correct: number
  total: number
  percent: number
} {
  let correct = 0
  for (const item of EQUATION_BANK) {
    if (answers[item.id] === item.correct) correct += 1
  }
  const total = EQUATION_BANK.length
  return { correct, total, percent: Math.round((100 * correct) / total) }
}

export function allCorrect(answers: Record<string, ReactionType | ''>): boolean {
  return scoreAnswers(answers).correct === EQUATION_BANK.length
}
