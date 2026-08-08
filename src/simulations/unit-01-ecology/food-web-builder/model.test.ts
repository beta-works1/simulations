import { describe, expect, it } from 'vitest'
import { hasGrassRabbitFox, toggleLink } from './model'

describe('food web builder', () => {
  it('toggles links on and off', () => {
    expect(toggleLink([], 'grass-rabbit')).toEqual(['grass-rabbit'])
    expect(toggleLink(['grass-rabbit'], 'grass-rabbit')).toEqual([])
  })

  it('detects the grass → rabbit → fox chain', () => {
    expect(hasGrassRabbitFox(['grass-rabbit'])).toBe(false)
    expect(hasGrassRabbitFox(['grass-rabbit', 'rabbit-fox'])).toBe(true)
  })
})
