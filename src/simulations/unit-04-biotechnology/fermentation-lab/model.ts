/** Yeast fermentation: yeast / temperature / time → CO₂ bubble score (book p.39). */

export const OPTIMAL_TEMP_C = 32

/**
 * Relative CO₂ bubble score (0–100).
 * More yeast and time help; temperature peaks near ~32 °C and falls off if too cold/hot.
 */
export function bubbleScore(yeast: number, tempC: number, timeMin: number): number {
  const yeastFactor = Math.max(0, Math.min(1, yeast / 10))
  const timeFactor = Math.max(0, Math.min(1, timeMin / 60))
  const tempDelta = Math.abs(tempC - OPTIMAL_TEMP_C)
  const tempFactor = Math.max(0, 1 - tempDelta / 28)
  return Math.round(100 * yeastFactor * timeFactor * tempFactor)
}

export function fermentationLabel(score: number): string {
  if (score >= 70) return 'Lots of CO₂ bubbles'
  if (score >= 35) return 'Moderate bubbling'
  if (score > 0) return 'Slow fermentation'
  return 'Little or no activity'
}
