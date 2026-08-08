/** Ecological energy pyramid — ~10% transfer each level (book p.4). */

export type TrophicLevel = 'producers' | 'primary' | 'secondary' | 'tertiary'

export const TROPHIC_LEVELS: TrophicLevel[] = ['producers', 'primary', 'secondary', 'tertiary']

export const TRANSFER_FRACTION = 0.1

/** Energy (arbitrary units) at a trophic level from producer baseline. */
export function energyAtLevel(producerEnergy: number, levelIndex: number): number {
  if (producerEnergy < 0 || levelIndex < 0) return 0
  let energy = producerEnergy
  for (let i = 0; i < levelIndex; i++) energy *= TRANSFER_FRACTION
  // Avoid float noise (e.g. 1000 × 0.1²) for school-friendly readouts.
  return Math.round(energy * 1e9) / 1e9
}

/** Relative bar heights 0–1 for display (producers = 1). */
export function energyBars(producerEnergy: number): number[] {
  const base = Math.max(producerEnergy, 1)
  return TROPHIC_LEVELS.map((_, i) => energyAtLevel(producerEnergy, i) / base)
}
