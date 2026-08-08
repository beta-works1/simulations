import { describe, expect, it } from 'vitest'
import { energyAtLevel, energyBars } from './model'

describe('ecological pyramid', () => {
  it('applies the 10% energy rule up the pyramid', () => {
    expect(energyAtLevel(1000, 0)).toBe(1000)
    expect(energyAtLevel(1000, 1)).toBe(100)
    expect(energyAtLevel(1000, 2)).toBe(10)
  })

  it('bars shrink at higher trophic levels', () => {
    const bars = energyBars(1000)
    expect(bars[0]).toBe(1)
    expect(bars[1]).toBeLessThan(bars[0])
    expect(bars[2]).toBeLessThan(bars[1])
  })
})
