import { describe, expect, it } from 'vitest'
import { gasLevels } from './model'

describe('carbon–oxygen cycle', () => {
  it('photosynthesis alone lowers CO₂ and raises O₂', () => {
    const g = gasLevels({ photosynthesis: true, respiration: false, combustion: false })
    expect(g.co2).toBeLessThan(50)
    expect(g.o2).toBeGreaterThan(50)
  })

  it('combustion raises CO₂ more than balanced photo + respiration', () => {
    const balanced = gasLevels({ photosynthesis: true, respiration: true, combustion: false })
    const withFire = gasLevels({ photosynthesis: true, respiration: true, combustion: true })
    expect(withFire.co2).toBeGreaterThan(balanced.co2)
    expect(withFire.o2).toBeLessThan(balanced.o2)
  })
})
