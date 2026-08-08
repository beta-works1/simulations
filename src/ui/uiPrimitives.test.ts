import { describe, expect, it } from 'vitest'
import { PLATFORM_TOKENS } from '../data/unitTokens'

describe('design tokens', () => {
  it('exposes platform neutrals for the shell canvas', () => {
    expect(PLATFORM_TOKENS.canvasBg).toBe('#f7f4ef')
    expect(PLATFORM_TOKENS.ink).toBeTruthy()
  })
})
