/**
 * Shared canvas presentation tokens + polish helpers.
 * Use these for backgrounds, glows, and strokes — never in physics/step logic.
 */

export type SceneTheme =
  | 'optics'
  | 'electric'
  | 'ecology'
  | 'space'
  | 'chemistry'
  | 'force'
  | 'biology'
  | 'nervous'
  | 'biotech'
  | 'lab'

export const SCENE = {
  optics: {
    top: '#0b1c2e',
    bottom: '#14324f',
    accent: '#7dd3fc',
    hot: '#fde68a',
    glow: 'rgba(125, 211, 252, 0.55)',
    stroke: 2.5,
  },
  electric: {
    top: '#1c1018',
    bottom: '#2d1824',
    accent: '#fbbf24',
    hot: '#fde68a',
    glow: 'rgba(251, 191, 36, 0.5)',
    stroke: 2.5,
  },
  ecology: {
    top: '#0f2a22',
    bottom: '#1a3d32',
    accent: '#6ee7b7',
    hot: '#a7f3d0',
    glow: 'rgba(110, 231, 183, 0.45)',
    stroke: 2.25,
  },
  space: {
    top: '#050814',
    bottom: '#0e1630',
    accent: '#a5b4fc',
    hot: '#fde68a',
    glow: 'rgba(165, 180, 252, 0.5)',
    stroke: 2.25,
  },
  chemistry: {
    top: '#f6f1fa',
    bottom: '#ebe3f4',
    accent: '#7c3aed',
    hot: '#ea580c',
    glow: 'rgba(124, 58, 237, 0.28)',
    stroke: 2.25,
  },
  force: {
    top: '#e8eef5',
    bottom: '#d5e0ec',
    accent: '#0e7490',
    hot: '#f59e0b',
    glow: 'rgba(14, 116, 144, 0.35)',
    stroke: 2.5,
  },
  biology: {
    top: '#f3f6f4',
    bottom: '#e4ece7',
    accent: '#047857',
    hot: '#d97706',
    glow: 'rgba(4, 120, 87, 0.3)',
    stroke: 2.25,
  },
  nervous: {
    top: '#1a1528',
    bottom: '#2a2140',
    accent: '#e9d5ff',
    hot: '#fbbf24',
    glow: 'rgba(233, 213, 255, 0.45)',
    stroke: 2.25,
  },
  biotech: {
    top: '#10241c',
    bottom: '#1a382c',
    accent: '#86efac',
    hot: '#fde047',
    glow: 'rgba(134, 239, 172, 0.4)',
    stroke: 2.25,
  },
  lab: {
    top: '#eef2f7',
    bottom: '#dde5ef',
    accent: '#0369a1',
    hot: '#ea580c',
    glow: 'rgba(3, 105, 161, 0.3)',
    stroke: 2.25,
  },
} as const satisfies Record<
  SceneTheme,
  { top: string; bottom: string; accent: string; hot: string; glow: string; stroke: number }
>

export function fillThemeBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: SceneTheme,
) {
  const t = SCENE[theme]
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, t.top)
  g.addColorStop(1, t.bottom)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  // Soft vignette for depth
  const vg = ctx.createRadialGradient(w * 0.5, h * 0.4, Math.min(w, h) * 0.15, w * 0.5, h * 0.5, Math.max(w, h) * 0.75)
  vg.addColorStop(0, 'rgba(255,255,255,0.04)')
  vg.addColorStop(1, 'rgba(0,0,0,0.18)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)
}

export function drawFaintGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  step = 40,
  color = 'rgba(15, 23, 42, 0.07)',
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = step; x < w; x += step) {
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
  }
  for (let y = step; y < h; y += step) {
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
  }
  ctx.stroke()
  ctx.restore()
}

export function drawStarfield(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed = 42,
  count = 60,
) {
  ctx.save()
  let s = seed
  const rand = () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
  for (let i = 0; i < count; i++) {
    const x = rand() * w
    const y = rand() * h
    const r = 0.6 + rand() * 1.4
    const a = 0.25 + rand() * 0.55
    ctx.beginPath()
    ctx.fillStyle = `rgba(226, 232, 240, ${a})`
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

/** Soft glow ring / halo behind an active element. */
export function drawGlow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  strength = 0.45,
) {
  ctx.save()
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius)
  g.addColorStop(0, color.includes('rgba') ? color : hexToRgba(color, strength))
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

export function withShadow(
  ctx: CanvasRenderingContext2D,
  draw: () => void,
  opts?: { blur?: number; color?: string; ox?: number; oy?: number },
) {
  ctx.save()
  ctx.shadowBlur = opts?.blur ?? 10
  ctx.shadowColor = opts?.color ?? 'rgba(0,0,0,0.35)'
  ctx.shadowOffsetX = opts?.ox ?? 0
  ctx.shadowOffsetY = opts?.oy ?? 3
  draw()
  ctx.restore()
}

/** Stroke a path twice: soft outer glow then crisp core. */
export function strokeWithGlow(
  ctx: CanvasRenderingContext2D,
  pathFn: () => void,
  color: string,
  width: number,
  glowColor?: string,
) {
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = glowColor ?? hexToRgba(color, 0.35)
  ctx.lineWidth = width + 5
  ctx.shadowBlur = 12
  ctx.shadowColor = glowColor ?? hexToRgba(color, 0.55)
  pathFn()
  ctx.stroke()
  ctx.shadowBlur = 0
  ctx.strokeStyle = color
  ctx.lineWidth = width
  pathFn()
  ctx.stroke()
  ctx.restore()
}

export function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return `rgba(255,255,255,${alpha})`
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

export const STROKE: {
  vector: number
  ray: number
  connector: number
  guide: number
  heavy: number
} = {
  vector: 2.5,
  ray: 2.75,
  connector: 2.25,
  guide: 1.5,
  heavy: 3.5,
}
