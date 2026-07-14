/**
 * Optional base types for rulers / protractors (PhET measurement tools).
 * Sims can extend these; no rendering is included here.
 */

export type MeasurementToolKind = 'ruler' | 'protractor'

export interface MeasurementToolState {
  kind: MeasurementToolKind
  x: number
  y: number
  /** Rotation in degrees. */
  angleDeg: number
  visible: boolean
}

export function defaultRuler(x = 40, y = 40): MeasurementToolState {
  return { kind: 'ruler', x, y, angleDeg: 0, visible: false }
}

export function defaultProtractor(x = 80, y = 80): MeasurementToolState {
  return { kind: 'protractor', x, y, angleDeg: 0, visible: false }
}
