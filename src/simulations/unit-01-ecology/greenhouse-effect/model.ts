/** Greenhouse effect: CO₂ level → temperature rise (book p.8). */

export const CO2_MIN = 280
export const CO2_MAX = 560
export const BASELINE_TEMP_C = 15

/** Approximate °C from atmospheric CO₂ (ppm). Higher CO₂ → higher temp. */
export function temperatureFromCo2(co2Ppm: number): number {
  const clamped = Math.max(CO2_MIN, Math.min(CO2_MAX, co2Ppm))
  const t = (clamped - CO2_MIN) / (CO2_MAX - CO2_MIN)
  return BASELINE_TEMP_C + t * 4.5
}

/** Gauge fill 0–1 for UI thermometer. */
export function tempGauge(co2Ppm: number): number {
  const temp = temperatureFromCo2(co2Ppm)
  const min = BASELINE_TEMP_C
  const max = BASELINE_TEMP_C + 4.5
  return Math.max(0, Math.min(1, (temp - min) / (max - min)))
}
