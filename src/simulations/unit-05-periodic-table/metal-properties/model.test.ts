import { describe, expect, it } from 'vitest'
import { PROPERTIES, propertyById } from './model'

describe('metal properties', () => {
  it('covers lustre, conductance, malleability', () => {
    expect(PROPERTIES.map((p) => p.id)).toEqual(['lustre', 'conductance', 'malleability'])
    expect(propertyById('lustre').metalText).toMatch(/shiny|lustre/i)
    expect(propertyById('conductance').nonmetalText).toMatch(/insulat|poor/i)
    expect(propertyById('malleability').metalText).toMatch(/sheet|malleable/i)
  })
})
