/**
 * Pure model — Laws of Reflection.
 * No canvas, DOM, or React imports.
 */

export interface Vec2 {
  x: number
  y: number
}

const DEG2RAD = Math.PI / 180
const RAD2DEG = 180 / Math.PI

export interface LawsOfReflectionState {
  incidenceDeg: number
  sourceX: number
  sourceY: number
}

export const DEFAULT_LAWS_STATE: LawsOfReflectionState = {
  incidenceDeg: 35,
  sourceX: 0.22,
  sourceY: 0.28,
}

export function defaultLawsState(): LawsOfReflectionState {
  return { ...DEFAULT_LAWS_STATE }
}

export function incidenceFromSource(
  source: Vec2,
  hit: Vec2,
): number {
  const toHit = normalize({ x: hit.x - source.x, y: hit.y - source.y })
  const normal = { x: 0, y: -1 }
  const cosI = Math.abs(dot2(toHit, normal))
  return Math.acos(Math.min(1, cosI)) * RAD2DEG
}

function normalize(v: Vec2): Vec2 {
  const len = Math.hypot(v.x, v.y) || 1
  return { x: v.x / len, y: v.y / len }
}

function dot2(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y
}

export function sourceFromIncidence(
  hit: Vec2,
  incidenceDeg: number,
  rayLen: number,
): Vec2 {
  const rad = incidenceDeg * DEG2RAD
  const dir = normalize({ x: -Math.sin(rad), y: -Math.cos(rad) })
  return { x: hit.x - dir.x * rayLen, y: hit.y - dir.y * rayLen }
}

export function hitTestSource(
  state: LawsOfReflectionState,
  w: number,
  h: number,
  point: Vec2,
): boolean {
  const mirrorY = h * 0.72
  const hit: Vec2 = { x: w * 0.5, y: mirrorY }
  const rayLen = Math.min(w, h) * 0.42
  const source =
    state.sourceX > 0
      ? { x: state.sourceX * w, y: state.sourceY * h }
      : sourceFromIncidence(hit, state.incidenceDeg, rayLen)
  return Math.hypot(point.x - source.x, point.y - source.y) < 18
}
