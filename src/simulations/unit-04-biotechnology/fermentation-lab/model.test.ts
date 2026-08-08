import { describe, expect, it } from 'vitest'
import { bubbleScore, fermentationLabel, OPTIMAL_TEMP_C } from './model'

describe('fermentation lab', () => {
  it('scores higher near optimal temperature with more yeast and time', () => {
    const good = bubbleScore(8, OPTIMAL_TEMP_C, 45)
    const cold = bubbleScore(8, 10, 45)
    const short = bubbleScore(8, OPTIMAL_TEMP_C, 5)
    expect(good).toBeGreaterThan(cold)
    expect(good).toBeGreaterThan(short)
  })

  it('labels high scores as lots of bubbles', () => {
    expect(fermentationLabel(80)).toMatch(/Lots/i)
    expect(fermentationLabel(0)).toMatch(/Little/i)
  })
})
