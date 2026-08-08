import { describe, expect, it } from 'vitest'
import { streamLength } from './model'

describe('water pressure depth', () => {
  it('makes deeper holes shoot farther', () => {
    expect(streamLength(2)).toBeGreaterThan(streamLength(1))
    expect(streamLength(1)).toBeGreaterThan(streamLength(0))
  })

  it('clamps out-of-range depth indices', () => {
    expect(streamLength(-1)).toBe(streamLength(0))
    expect(streamLength(99)).toBe(streamLength(2))
  })
})
