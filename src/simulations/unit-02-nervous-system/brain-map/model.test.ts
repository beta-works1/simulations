import { describe, expect, it } from 'vitest'
import { BRAIN_REGIONS, regionInfo } from './model'

describe('brain map', () => {
  it('lists five major regions', () => {
    expect(BRAIN_REGIONS).toHaveLength(5)
  })

  it('returns occipital function about vision', () => {
    expect(regionInfo('occipital').functionText).toMatch(/Vision/i)
    expect(regionInfo('cerebellum').functionText).toMatch(/Balance/i)
  })
})
