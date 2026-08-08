import { describe, expect, it } from 'vitest'
import { indicatorColor, zoneForPhBook } from './model'

describe('pH indicator lab', () => {
  it('maps book pH zones (0–2 / 3–6 / 7 / 8–11 / 12–14)', () => {
    expect(zoneForPhBook(1)).toBe('Strong acid')
    expect(zoneForPhBook(5)).toBe('Weak acid')
    expect(zoneForPhBook(7)).toBe('Neutral')
    expect(zoneForPhBook(10)).toBe('Weak alkali')
    expect(zoneForPhBook(13)).toBe('Strong alkali')
  })

  it('turns phenolphthalein pink in alkali and litmus blue in base', () => {
    expect(indicatorColor('phenolphthalein', 12).label).toMatch(/Pink/i)
    expect(indicatorColor('litmus', 12).label).toMatch(/Blue/i)
    expect(indicatorColor('turmeric', 12).label).toMatch(/Brown/i)
  })
})
