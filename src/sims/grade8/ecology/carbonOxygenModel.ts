/** Model: carbon–oxygen cycle pools and animated transfer rates. */

export type CyclePool = 'atmosphere' | 'plants' | 'animals'

export interface CarbonOxygenState {
  co2: number
  o2: number
  plantCarbon: number
  animalCarbon: number
  photosynthesisRate: number
  respirationRate: number
  time: number
}

export function createCarbonOxygenState(): CarbonOxygenState {
  return {
    co2: 55,
    o2: 70,
    plantCarbon: 40,
    animalCarbon: 25,
    photosynthesisRate: 0.55,
    respirationRate: 0.4,
    time: 0,
  }
}

export function stepCarbonOxygen(s: CarbonOxygenState, dt: number): CarbonOxygenState {
  const photo = s.photosynthesisRate * 18 * dt
  const resp = s.respirationRate * 14 * dt
  const take = Math.min(photo, s.co2, 100 - s.plantCarbon)
  const give = Math.min(resp, s.o2 * 0.3 + s.animalCarbon * 0.2, s.plantCarbon + s.animalCarbon)

  let co2 = s.co2 - take + give * 0.9
  let o2 = s.o2 + take * 0.85 - give * 0.7
  let plantCarbon = s.plantCarbon + take * 0.7 - give * 0.25
  let animalCarbon = s.animalCarbon + take * 0.15 - give * 0.35

  co2 = clamp(co2, 5, 100)
  o2 = clamp(o2, 10, 100)
  plantCarbon = clamp(plantCarbon, 5, 95)
  animalCarbon = clamp(animalCarbon, 5, 80)

  return { ...s, co2, o2, plantCarbon, animalCarbon, time: s.time + dt }
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}
