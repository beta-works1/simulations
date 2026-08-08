import { describe, expect, it } from 'vitest'
import { bondingFor } from './model'

describe('bonding builder', () => {
  it('describes electron transfer for ionic NaCl', () => {
    const s = bondingFor('ionic')
    expect(s.example).toMatch(/NaCl/)
    expect(s.electronStory).toMatch(/transfer/i)
  })

  it('describes electron sharing for covalent H₂', () => {
    const s = bondingFor('covalent')
    expect(s.example).toMatch(/H₂|H2/)
    expect(s.electronStory).toMatch(/shar/i)
  })
})
