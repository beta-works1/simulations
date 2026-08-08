/** Carbon–oxygen cycle processes and atmospheric gauges (book p.2). */

export type ProcessFlags = {
  photosynthesis: boolean
  respiration: boolean
  combustion: boolean
}

export const DEFAULT_FLAGS: ProcessFlags = {
  photosynthesis: true,
  respiration: true,
  combustion: false,
}

const BASE_CO2 = 50
const BASE_O2 = 50

/** Shift CO₂ / O₂ gauges (0–100) from which processes are on. */
export function gasLevels(flags: ProcessFlags): { co2: number; o2: number } {
  let co2 = BASE_CO2
  let o2 = BASE_O2
  if (flags.photosynthesis) {
    co2 -= 18
    o2 += 18
  }
  if (flags.respiration) {
    co2 += 12
    o2 -= 12
  }
  if (flags.combustion) {
    co2 += 20
    o2 -= 16
  }
  return {
    co2: Math.max(0, Math.min(100, co2)),
    o2: Math.max(0, Math.min(100, o2)),
  }
}
