import { describe, expect, it } from 'vitest'
import { STEAM_BUILDS, emptyChecklist, progress } from './model'

describe('steam builds', () => {
  it('tracks checklist progress over 5 builds', () => {
    expect(STEAM_BUILDS).toHaveLength(5)
    const none = emptyChecklist()
    expect(progress(none).done).toBe(0)
    const all = {
      bioplastic: true,
      soap: true,
      'solar-cooker': true,
      'wind-turbine': true,
      ups: true,
    }
    expect(progress(all).complete).toBe(true)
    expect(progress(all).percent).toBe(100)
  })
})
