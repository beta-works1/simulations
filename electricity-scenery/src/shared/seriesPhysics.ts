export type CircuitMode = 'series' | 'parallel'

export interface CircuitReadout {
  totalResistance: number
  totalCurrent: number
  bulbCurrent: number
  bulbBrightness: number
}

export function computeSeriesParallel(mode: CircuitMode, voltage: number, r: number): CircuitReadout {
  if (r <= 0) return { totalResistance: 0, totalCurrent: 0, bulbCurrent: 0, bulbBrightness: 0 }
  if (mode === 'series') {
    const totalResistance = 2 * r
    const totalCurrent = voltage / totalResistance
    return { totalResistance, totalCurrent, bulbCurrent: totalCurrent, bulbBrightness: Math.min(1, totalCurrent) }
  }
  const totalResistance = r / 2
  const totalCurrent = voltage / totalResistance
  const bulbCurrent = totalCurrent / 2
  return { totalResistance, totalCurrent, bulbCurrent, bulbBrightness: Math.min(1, bulbCurrent * 2) }
}

export function seriesLoop(w: number, h: number): { x: number; y: number }[] {
  const cx = w * 0.5
  const cy = h * 0.52
  const hw = Math.min(w * 0.36, 260)
  const hh = Math.min(h * 0.3, 150)
  return [
    { x: cx - hw, y: cy - hh },
    { x: cx + hw, y: cy - hh },
    { x: cx + hw, y: cy + hh },
    { x: cx - hw, y: cy + hh },
  ]
}

export function parallelLoops(w: number, h: number): {
  top: { x: number; y: number }[]
  bottom: { x: number; y: number }[]
} {
  const cx = w * 0.5
  const cy = h * 0.52
  const hw = Math.min(w * 0.36, 260)
  const gap = Math.min(h * 0.14, 70)
  const hh = Math.min(h * 0.22, 110)
  const left = cx - hw
  const right = cx + hw
  const midTop = cy - gap
  const midBot = cy + gap
  return {
    top: [
      { x: left, y: midTop - hh },
      { x: right, y: midTop - hh },
      { x: right, y: midTop + hh },
      { x: left, y: midTop + hh },
    ],
    bottom: [
      { x: left, y: midBot - hh },
      { x: right, y: midBot - hh },
      { x: right, y: midBot + hh },
      { x: left, y: midBot + hh },
    ],
  }
}
