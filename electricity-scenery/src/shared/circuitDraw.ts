import { Circle, Node, Path, Rectangle, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont } from 'scenerystack/scenery-phet'

export const WIRE = '#fbbf24'
export const WIRE_HOT = '#f97316'
export const WIRE_DANGER = '#ef4444'
export const BATTERY = '#64748b'
export const BULB = '#fde68a'
export const FUSE = '#94a3b8'
export const MAGNET_N = '#ef4444'
export const MAGNET_S = '#3b82f6'
export const MUTED = '#64748b'

export interface Vec2 {
  x: number
  y: number
}

export function pathLength(points: Vec2[]): number {
  let len = 0
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!
    const b = points[(i + 1) % points.length]!
    len += Math.hypot(b.x - a.x, b.y - a.y)
  }
  return len
}

export function pointOnLoop(points: Vec2[], t: number): Vec2 {
  const total = pathLength(points)
  let dist = (((t % 1) + 1) % 1) * total
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!
    const b = points[(i + 1) % points.length]!
    const seg = Math.hypot(b.x - a.x, b.y - a.y)
    if (dist <= seg) {
      const f = seg > 0 ? dist / seg : 0
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
    }
    dist -= seg
  }
  return points[0]!
}

export function pointOnOpenPath(points: Vec2[], t: number): Vec2 {
  if (points.length < 2) return points[0] ?? { x: 0, y: 0 }
  const clamped = Math.max(0, Math.min(1, t))
  const idx = Math.min(points.length - 2, Math.floor(clamped * (points.length - 1)))
  const a = points[idx]!
  const b = points[idx + 1]!
  const f = clamped * (points.length - 1) - idx
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
}

export function makeWireLoop(points: Vec2[], color = WIRE, lineWidth = 4): Path {
  const shape = new Shape()
  shape.moveTo(points[0]!.x, points[0]!.y)
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i]!.x, points[i]!.y)
  shape.close()
  return new Path(shape, { stroke: color, lineWidth, lineJoin: 'round', lineCap: 'round' })
}

export function makeWirePath(points: Vec2[], color = WIRE, lineWidth = 4, closed = false): Path {
  const shape = new Shape()
  shape.moveTo(points[0]!.x, points[0]!.y)
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i]!.x, points[i]!.y)
  if (closed) shape.close()
  return new Path(shape, { stroke: color, lineWidth, lineJoin: 'round', lineCap: 'round' })
}

export function makeBattery(x: number, y: number, cells = 1): Node {
  const root = new Node({ pickable: false })
  const count = Math.max(1, Math.min(6, cells))
  const cellH = 22
  const gap = 4
  const totalH = count * cellH + (count - 1) * gap
  let top = y - totalH / 2
  for (let i = 0; i < count; i++) {
    root.addChild(new Rectangle(x - 14, top, 28, cellH, {
      cornerRadius: 3,
      fill: i % 2 === 0 ? '#475569' : '#334155',
      stroke: '#94a3b8',
      lineWidth: 1,
    }))
    root.addChild(new Rectangle(x + 10, top + 6, 6, 10, { fill: '#fbbf24', cornerRadius: 1 }))
    top += cellH + gap
  }
  return root
}

export function makeBulb(x: number, y: number, brightness: number): Node {
  const glow = Math.max(0, Math.min(1, brightness))
  const root = new Node({ pickable: false })
  if (glow > 0.02) {
    root.addChild(new Circle(18 + glow * 14, {
      fill: `rgba(253, 224, 71, ${0.12 + glow * 0.35})`,
      centerX: x,
      centerY: y - 10,
    }))
  }
  root.addChild(new Circle(12, {
    fill: glow > 0.05 ? `rgba(253, 230, 138, ${0.45 + glow * 0.55})` : '#94a3b8',
    stroke: '#f59e0b',
    lineWidth: 1.5,
    centerX: x,
    centerY: y - 10,
  }))
  root.addChild(new Rectangle(x - 5, y + 2, 10, 10, { fill: '#64748b', cornerRadius: 2 }))
  return root
}

export function makeResistor(x: number, y: number, width: number, thickness: number): Node {
  return new Rectangle(x - width / 2, y - thickness / 2, width, thickness, {
    cornerRadius: 3,
    fill: '#b45309',
    stroke: '#fbbf24',
    lineWidth: 1.5,
    pickable: false,
  })
}

export function makeSwitch(x: number, y: number, closed: boolean): Node {
  const root = new Node({ pickable: false })
  root.addChild(new Circle(4, { fill: '#e2e8f0', centerX: x - 18, centerY: y }))
  root.addChild(new Circle(4, { fill: '#e2e8f0', centerX: x + 18, centerY: y }))
  if (closed) {
    root.addChild(new Path(new Shape().moveTo(x - 18, y).lineTo(x + 18, y), {
      stroke: WIRE,
      lineWidth: 3,
      lineCap: 'round',
    }))
  }
  else {
    root.addChild(new Path(new Shape().moveTo(x - 18, y).lineTo(x + 10, y - 16), {
      stroke: WIRE,
      lineWidth: 3,
      lineCap: 'round',
    }))
  }
  return root
}

export function makeFuse(x: number, y: number, blown: boolean): Node {
  const root = new Node({ pickable: false })
  root.addChild(new Rectangle(x - 28, y - 8, 56, 16, {
    cornerRadius: 4,
    fill: blown ? '#7f1d1d' : '#cbd5e1',
    stroke: blown ? '#ef4444' : '#64748b',
    lineWidth: 1.5,
  }))
  if (!blown) {
    root.addChild(new Path(new Shape().moveTo(x - 18, y).lineTo(x + 18, y), {
      stroke: '#0f172a',
      lineWidth: 2,
    }))
  }
  else {
    root.addChild(new Text('OPEN', {
      font: new PhetFont({ size: 9, weight: 'bold' }),
      fill: '#fecaca',
      centerX: x,
      centerY: y,
    }))
  }
  return root
}

export function makeLabel(
  text: string,
  x: number,
  y: number,
  center = false,
  options: { maxWidth?: number; fill?: string } = {},
): Node {
  const t = new Text(text, {
    font: new PhetFont({ size: 11, weight: 'bold' }),
    fill: options.fill ?? '#0f172a',
    maxWidth: options.maxWidth,
  })
  const padX = 5
  const padY = 2
  const bg = new Rectangle(-padX, -padY, t.width + padX * 2, t.height + padY * 2, {
    cornerRadius: 4,
    fill: 'rgba(248, 250, 252, 0.92)',
    stroke: 'rgba(15, 23, 42, 0.12)',
    lineWidth: 1,
  })
  const root = new Node({ children: [bg, t], pickable: false })
  t.left = 0
  t.top = 0
  if (center) {
    root.centerX = x
    root.centerY = y
  }
  else {
    root.left = x
    root.top = y
  }
  return root
}

export function makeChargeDot(x: number, y: number, hot = false): Circle {
  return new Circle(hot ? 4 : 3.5, {
    fill: hot ? WIRE_DANGER : '#38bdf8',
    stroke: '#0f172a',
    lineWidth: 0.8,
    centerX: x,
    centerY: y,
    pickable: false,
  })
}

export function makeMagnet(x: number, y: number, pole: 'N' | 'S', w = 28, h = 70): Node {
  const fill = pole === 'N' ? MAGNET_N : MAGNET_S
  const root = new Node({ pickable: false })
  root.addChild(new Rectangle(x - w / 2, y - h / 2, w, h, {
    cornerRadius: 4,
    fill,
    stroke: '#0f172a',
    lineWidth: 1,
  }))
  root.addChild(new Text(pole, {
    font: new PhetFont({ size: 16, weight: 'bold' }),
    fill: '#fff',
    centerX: x,
    centerY: y,
  }))
  return root
}
