import { Circle, Node, Path, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont } from 'scenerystack/scenery-phet'

export const RAY_YELLOW = '#fbbf24'
export const RAY_CYAN = '#22d3ee'
export const RAY_WHITE = '#f8fafc'
export const MIRROR_COLOR = '#cbd5e1'
export const OBJECT_COLOR = '#f97316'
export const MUTED = '#64748b'

export interface Vec2 {
  x: number
  y: number
}

export const DEG2RAD = Math.PI / 180
export const RAD2DEG = 180 / Math.PI

export function normalize(v: Vec2): Vec2 {
  const len = Math.hypot(v.x, v.y) || 1
  return { x: v.x / len, y: v.y / len }
}

export function dot2(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y
}

export function makeRay(from: Vec2, dir: Vec2, len: number, color: string, lineWidth = 3): Node {
  const tip = { x: from.x + dir.x * len, y: from.y + dir.y * len }
  const head = 10
  const shaft = new Path(new Shape().moveTo(from.x, from.y).lineTo(tip.x, tip.y), {
    stroke: color,
    lineWidth,
    lineCap: 'round',
  })
  const angle = Math.atan2(dir.y, dir.x)
  const headShape = new Shape()
    .moveTo(tip.x, tip.y)
    .lineTo(tip.x - head * Math.cos(angle - 0.45), tip.y - head * Math.sin(angle - 0.45))
    .lineTo(tip.x - head * Math.cos(angle + 0.45), tip.y - head * Math.sin(angle + 0.45))
    .close()
  const headPath = new Path(headShape, { fill: color })
  return new Node({ children: [shaft, headPath], pickable: false })
}

export function makeDashedLine(a: Vec2, b: Vec2, color: string): Path {
  return new Path(new Shape().moveTo(a.x, a.y).lineTo(b.x, b.y), {
    stroke: color,
    lineWidth: 1.5,
    lineDash: [6, 5],
  })
}

export function makeLabel(text: string, x: number, y: number, center = false): Text {
  const t = new Text(text, {
    font: new PhetFont({ size: 11, weight: 'bold' }),
    fill: '#0f172a',
    x,
    y,
  })
  if (center) t.centerX = x
  return t
}

export function makeAngleArc(
  hit: Vec2,
  startAngle: number,
  endAngle: number,
  radius: number,
  label: string,
  color: string,
): Node {
  const arc = new Path(new Shape().arc(hit.x, hit.y, radius, startAngle, endAngle, false), {
    stroke: color,
    lineWidth: 2,
  })
  const mid = (startAngle + endAngle) / 2
  const lx = hit.x + (radius + 14) * Math.cos(mid)
  const ly = hit.y + (radius + 14) * Math.sin(mid)
  const labelNode = new Text(label, {
    font: new PhetFont({ size: 10, weight: 'bold' }),
    fill: color,
    centerX: lx,
    centerY: ly,
  })
  return new Node({ children: [arc, labelNode], pickable: false })
}

export function makeArrowObject(base: Vec2, height: number, color: string, dashed = false): Node {
  const tip = { x: base.x, y: base.y - height }
  const shaft = new Path(new Shape().moveTo(base.x, base.y).lineTo(tip.x, tip.y), {
    stroke: color,
    lineWidth: 3,
    lineDash: dashed ? [6, 5] : undefined,
  })
  const angle = Math.atan2(tip.y - base.y, tip.x - base.x)
  const head = 10
  const headShape = new Shape()
    .moveTo(tip.x, tip.y)
    .lineTo(tip.x - head * Math.cos(angle - 0.4), tip.y - head * Math.sin(angle - 0.4))
    .lineTo(tip.x - head * Math.cos(angle + 0.4), tip.y - head * Math.sin(angle + 0.4))
    .close()
  const headPath = new Path(headShape, { fill: color })
  return new Node({ children: [shaft, headPath], pickable: false })
}

export function makeLightSource(x: number, y: number, color = RAY_YELLOW): Node {
  return new Node({
    children: [
      new Circle(12, { fill: color, opacity: 0.35, centerX: x, centerY: y }),
      new Circle(7, { fill: color, centerX: x, centerY: y }),
      new Circle(3, { fill: '#0f172a', centerX: x, centerY: y }),
    ],
    pickable: false,
  })
}

export function seededScatter(i: number, diffuse: boolean): number {
  if (!diffuse) return 0
  const seeds = [-22, 18, -14, 26, -8, 12, -28, 20, -16, 10]
  return (seeds[i % seeds.length]! * Math.PI) / 180
}

export const SPECTRUM = [
  { color: '#ef4444', label: 'Red' },
  { color: '#f97316', label: 'Orange' },
  { color: '#eab308', label: 'Yellow' },
  { color: '#22c55e', label: 'Green' },
  { color: '#3b82f6', label: 'Blue' },
  { color: '#6366f1', label: 'Indigo' },
  { color: '#a855f7', label: 'Violet' },
] as const
