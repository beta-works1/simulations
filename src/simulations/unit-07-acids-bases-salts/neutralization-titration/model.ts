/** Acid–alkali titration with phenolphthalein — Unit 7, p.82. */

export const EQUIVALENCE_DROPS = 20

/** Starting alkaline (pink) → falls toward acid as HCl drops are added. */
export function phFromDrops(drops: number): number {
  const d = Math.max(0, Math.min(40, Math.round(drops)))
  // Start ~11, equivalence at 20 drops (~7), then fall to ~2
  if (d <= EQUIVALENCE_DROPS) {
    return 11 - (4 * d) / EQUIVALENCE_DROPS
  }
  const past = d - EQUIVALENCE_DROPS
  return Math.max(2, 7 - (5 * past) / 20)
}

/** Phenolphthalein: pink in alkali, clear at/after equivalence (neutral/acid). */
export function indicatorAppearance(drops: number): { fill: string; label: string } {
  const ph = phFromDrops(drops)
  if (ph >= 8.2) return { fill: '#ec4899', label: 'Pink (alkaline)' }
  return { fill: '#f8fafc', label: 'Clear (neutral / acid)' }
}

export function isAtEquivalence(drops: number): boolean {
  return Math.round(drops) === EQUIVALENCE_DROPS
}

/** Simple curve points for a sparkline (drops 0…40). */
export function phCurvePoints(maxDrops = 40): { drops: number; ph: number }[] {
  return Array.from({ length: maxDrops + 1 }, (_, drops) => ({
    drops,
    ph: phFromDrops(drops),
  }))
}
