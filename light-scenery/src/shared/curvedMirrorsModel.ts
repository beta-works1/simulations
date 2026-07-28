/**
 * Pure model — Concave & Convex Mirrors.
 * No canvas, DOM, or React imports.
 */

export interface Vec2 {
  x: number
  y: number
}

export type MirrorType = 'concave' | 'convex'

export interface CurvedMirrorsState {
  type: MirrorType
  objectDist: number
}

export const DEFAULT_CURVED_STATE: CurvedMirrorsState = {
  type: 'concave',
  objectDist: 0.55,
}

export function defaultCurvedState(): CurvedMirrorsState {
  return { ...DEFAULT_CURVED_STATE }
}

export interface CurvedMirrorLayout {
  pole: Vec2
  axisY: number
  f: number
  r: number
  objectX: number
  imageX: number
  objectH: number
  imageH: number
  imageVirtual: boolean
}

export function computeCurvedLayout(
  w: number,
  h: number,
  state: CurvedMirrorsState,
): CurvedMirrorLayout {
  const pole: Vec2 = { x: w * 0.72, y: h * 0.55 }
  const axisY = pole.y
  const f = w * 0.18
  const r = f * 2
  const u = state.objectDist * w
  const fSigned = state.type === 'concave' ? f : -f
  const v = 1 / (1 / fSigned - 1 / u)
  const m = -v / u
  const objectH = h * 0.18
  const imageH = objectH * m

  return {
    pole,
    axisY,
    f,
    r,
    objectX: pole.x - u,
    imageX: pole.x - v,
    objectH,
    imageH,
    imageVirtual: v < 0,
  }
}
