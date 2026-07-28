/**
 * Pure model — Plane Mirror & Periscope.
 * No canvas, DOM, or React imports.
 */

export type MirrorMode = 'plane' | 'periscope'

export interface PlaneMirrorState {
  mode: MirrorMode
  objectDist: number
  objectHeight: number
}

export const DEFAULT_PLANE_STATE: PlaneMirrorState = {
  mode: 'plane',
  objectDist: 0.35,
  objectHeight: 0.22,
}

export function defaultPlaneState(): PlaneMirrorState {
  return { ...DEFAULT_PLANE_STATE }
}
