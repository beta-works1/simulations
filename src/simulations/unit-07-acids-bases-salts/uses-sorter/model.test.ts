import { describe, expect, it } from 'vitest'
import { SUBSTANCES, allUsesCorrect, scoreUses } from './model'

describe('uses sorter', () => {
  it('scores substance–use matches', () => {
    const right = Object.fromEntries(SUBSTANCES.map((s) => [s.id, s.correctUse]))
    expect(scoreUses(right).correct).toBe(SUBSTANCES.length)
    expect(allUsesCorrect(right)).toBe(true)
    expect(scoreUses({}).correct).toBe(0)
  })
})
