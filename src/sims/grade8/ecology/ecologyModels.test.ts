import { describe, expect, it } from 'vitest'
import {
  canLink,
  createFoodWebState,
  createGrasslandChainState,
  linkExists,
  removeNode,
  toggleLink,
} from './foodWebModel'
import { tierDetail, tierEnergies } from './ecologicalPyramidModel'

describe('foodWebModel', () => {
  it('allows producer → herbivore links', () => {
    const s = createFoodWebState()
    const grass = s.nodes.find((n) => n.id === 'grass')!
    const rabbit = s.nodes.find((n) => n.id === 'rabbit')!
    expect(canLink(grass, rabbit)).toBe(true)
  })

  it('blocks herbivore → producer links', () => {
    const s = createFoodWebState()
    const grass = s.nodes.find((n) => n.id === 'grass')!
    const rabbit = s.nodes.find((n) => n.id === 'rabbit')!
    expect(canLink(rabbit, grass)).toBe(false)
  })

  it('toggles links on and off', () => {
    let s = createGrasslandChainState()
    const frog = s.nodes.find((n) => n.id === 'frog')!
    const snake = s.nodes.find((n) => n.id === 'snake')!
    expect(linkExists(s.links, frog.id, snake.id)).toBe(true)
    s = toggleLink(s, frog.id, snake.id)
    expect(linkExists(s.links, frog.id, snake.id)).toBe(false)
    s = toggleLink(s, frog.id, snake.id)
    expect(linkExists(s.links, frog.id, snake.id)).toBe(true)
  })

  it('removes node and its links', () => {
    const s = removeNode(createFoodWebState(), 'rabbit')
    expect(s.nodes.some((n) => n.id === 'rabbit')).toBe(false)
    expect(s.links.some((l) => l.from === 'rabbit' || l.to === 'rabbit')).toBe(false)
  })
})

describe('ecologicalPyramidModel', () => {
  it('applies 10% rule across tiers', () => {
    const e = tierEnergies(10000)
    expect(e).toEqual([10000, 1000, 100, 10])
  })

  it('reports energy lost between tiers', () => {
    const d = tierDetail(10000, 1)
    expect(d.pctFromBelow).toBeCloseTo(10)
    expect(d.lostFromBelow).toBeCloseTo(90)
  })
})
