import { describe, expect, it } from 'vitest'
import { CO2_MIN, temperatureFromCo2, tempGauge } from './model'

describe('greenhouse effect', () => {
  it('raises temperature as CO₂ increases', () => {
    expect(temperatureFromCo2(560)).toBeGreaterThan(temperatureFromCo2(CO2_MIN))
  })

  it('fills the gauge more at higher CO₂', () => {
    expect(tempGauge(560)).toBeGreaterThan(tempGauge(350))
    expect(tempGauge(CO2_MIN)).toBe(0)
  })
})
