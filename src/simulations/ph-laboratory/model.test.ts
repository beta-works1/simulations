import { describe, expect, it } from 'vitest'
import {
  computePh,
  createLabState,
  dipLitmus,
  indicatorColor,
  phCategory,
  pourSubstance,
  predictionCorrect,
  revealPrediction,
  setPrediction,
  stepLab,
} from './model'

describe('ph-laboratory model', () => {
  it('starts empty and neutral', () => {
    const s = createLabState()
    expect(s.volume).toBe(0)
    expect(computePh(0, 0, 0)).toBe(7)
  })

  it('pouring acid lowers pH', () => {
    let s = pourSubstance(createLabState(), 'hcl', 20)
    s = stepLab(s, 2)
    expect(s.volume).toBeGreaterThan(0)
    expect(s.displayPh).toBeLessThan(5)
    expect(phCategory(s.displayPh)).toBe('acid')
  })

  it('pouring base raises pH', () => {
    let s = pourSubstance(createLabState(), 'naoh', 20)
    s = stepLab(s, 2)
    expect(s.displayPh).toBeGreaterThan(9)
    expect(phCategory(s.displayPh)).toBe('base')
  })

  it('neutralizes acid when base is added', () => {
    let s = pourSubstance(createLabState(), 'hcl', 25)
    s = pourSubstance(s, 'naoh', 25)
    s = stepLab(s, 3)
    expect(s.displayPh).toBeGreaterThan(5)
    expect(s.displayPh).toBeLessThan(9)
  })

  it('dips litmus only when liquid present', () => {
    const dry = dipLitmus(createLabState())
    expect(dry.litmusDipped).toBe(true)
    expect(dry.litmusWet).toBe(false)

    let wet = pourSubstance(createLabState(), 'vinegar', 15)
    wet = dipLitmus(wet)
    expect(wet.litmusWet).toBe(true)
  })

  it('scores prediction after reveal', () => {
    let s = pourSubstance(createLabState(), 'lemon', 20)
    s = stepLab(s, 2)
    s = setPrediction(s, 'acid')
    s = revealPrediction(s)
    expect(predictionCorrect(s)).toBe(true)

    s = setPrediction(s, 'base')
    s = revealPrediction(s)
    expect(predictionCorrect(s)).toBe(false)
  })

  it('gives distinct indicator colors', () => {
    expect(indicatorColor('litmus', 2)).not.toBe(indicatorColor('litmus', 12))
    expect(indicatorColor('phenolphthalein', 3)).not.toBe(indicatorColor('phenolphthalein', 11))
  })
})
