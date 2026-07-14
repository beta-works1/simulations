/**
 * Pure model — Snell's Law / Bending Light indices.
 * No canvas, DOM, or React imports.
 */

export interface Medium {
  id: string
  label: string
  n: number
  color: string
}

export const MEDIA: Medium[] = [
  // Indices of refraction from PhET bending-light Substance.ts (red light)
  { id: 'water', label: 'Water (n = 1.333)', n: 1.333, color: 'rgba(56, 189, 248, 0.35)' },
  { id: 'glass', label: 'Glass (n = 1.500)', n: 1.5, color: 'rgba(148, 163, 184, 0.4)' },
  { id: 'diamond', label: 'Diamond (n = 2.419)', n: 2.419, color: 'rgba(165, 180, 252, 0.45)' },
]

/** PhET Substance.AIR index for red light */
export const N_AIR = 1.000293

export interface RefractionState {
  mediumId: string
  incidenceDeg: number
  showNormal: boolean
  showAngles: boolean
}

export const DEFAULT_REFRACTION_STATE: RefractionState = {
  mediumId: 'water',
  incidenceDeg: 40,
  showNormal: true,
  showAngles: true,
}

export function defaultRefractionState(): RefractionState {
  return { ...DEFAULT_REFRACTION_STATE }
}

export function getMedium(id: string): Medium {
  return MEDIA.find((m) => m.id === id) ?? MEDIA[0]
}

const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI

/**
 * Snell's law: n1 sin θ1 = n2 sin θ2.
 * Returns refracted angle in degrees, or null for total internal reflection.
 */
export function snellRefractedAngle(incidenceDeg: number, n1: number, n2: number): number | null {
  const sinT = (n1 / n2) * Math.sin(incidenceDeg * DEG2RAD)
  if (Math.abs(sinT) > 1) return null
  return Math.asin(sinT) * RAD2DEG
}

export function clampIncidence(deg: number): number {
  return Math.max(0, Math.min(85, deg))
}

export function setIncidence(state: RefractionState, incidenceDeg: number): RefractionState {
  return { ...state, incidenceDeg: clampIncidence(incidenceDeg) }
}

export function setMedium(state: RefractionState, mediumId: string): RefractionState {
  return { ...state, mediumId }
}

export function computeRefraction(state: RefractionState): {
  medium: Medium
  refractedDeg: number | null
  isTir: boolean
} {
  const medium = getMedium(state.mediumId)
  const refractedDeg = snellRefractedAngle(state.incidenceDeg, N_AIR, medium.n)
  return { medium, refractedDeg, isTir: refractedDeg === null }
}
