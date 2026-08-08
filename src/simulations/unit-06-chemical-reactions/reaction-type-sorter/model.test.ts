import { describe, expect, it } from 'vitest'
import { EQUATION_BANK, allCorrect, scoreAnswers } from './model'

describe('reaction type sorter', () => {
  it('scores five equations', () => {
    const wrong = Object.fromEntries(EQUATION_BANK.map((e) => [e.id, 'combustion' as const]))
    expect(scoreAnswers(wrong).total).toBe(5)
    expect(scoreAnswers(wrong).correct).toBeLessThan(5)

    const right = Object.fromEntries(EQUATION_BANK.map((e) => [e.id, e.correct]))
    expect(scoreAnswers(right).correct).toBe(5)
    expect(allCorrect(right)).toBe(true)
  })
})
