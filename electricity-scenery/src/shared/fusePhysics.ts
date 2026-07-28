const SHORT_RESISTANCE = 0.05
const WIRE_RESISTANCE = 0.1

export interface FuseReadout {
  current: number
  fuseIntact: boolean
  loadPowered: boolean
}

export function computeFuseCircuit(
  voltage: number,
  loadResistance: number,
  fuseRating: number,
  shorted: boolean,
  fuseBlown: boolean,
): FuseReadout {
  if (fuseBlown) return { current: 0, fuseIntact: false, loadPowered: false }
  const resistance = shorted
    ? SHORT_RESISTANCE + WIRE_RESISTANCE
    : loadResistance + WIRE_RESISTANCE
  const current = voltage / resistance
  const fuseIntact = current <= fuseRating
  return { current, fuseIntact, loadPowered: !shorted && fuseIntact }
}

export function fuseMainLoop(w: number, h: number): { x: number; y: number }[] {
  const cx = w * 0.5
  const cy = h * 0.52
  const hw = Math.min(w * 0.38, 270)
  const hh = Math.min(h * 0.3, 150)
  return [
    { x: cx - hw, y: cy - hh },
    { x: cx + hw, y: cy - hh },
    { x: cx + hw, y: cy + hh },
    { x: cx - hw, y: cy + hh },
  ]
}

export function shortBypass(w: number, h: number): { x: number; y: number }[] {
  const loop = fuseMainLoop(w, h)
  const left = loop[3]!
  const right = loop[2]!
  const y = (left.y + right.y) * 0.5 + 28
  return [
    { x: left.x + 60, y: left.y + 40 },
    { x: left.x + 60, y },
    { x: right.x - 60, y },
    { x: right.x - 60, y: right.y - 40 },
  ]
}
