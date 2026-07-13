import { withShadow } from '../shared/canvasTheme'
import {
  RAY_WHITE,
  clearCanvas,
  drawGlow,
  drawLabel,
  drawRay,
  normalize,
  type Vec2,
} from '../shared/drawUtils'

export interface RainbowState {
  phase: number
  speed: number
}

export const DEFAULT_RAINBOW_STATE: RainbowState = {
  phase: 0,
  speed: 1,
}

export function defaultRainbowState(): RainbowState {
  return { ...DEFAULT_RAINBOW_STATE }
}

const SPECTRUM = [
  { color: '#ef4444', label: 'Red', n: 1.331 },
  { color: '#f97316', label: 'Orange', n: 1.332 },
  { color: '#eab308', label: 'Yellow', n: 1.333 },
  { color: '#22c55e', label: 'Green', n: 1.334 },
  { color: '#3b82f6', label: 'Blue', n: 1.335 },
  { color: '#6366f1', label: 'Indigo', n: 1.336 },
  { color: '#a855f7', label: 'Violet', n: 1.337 },
]

export function stepRainbow(state: RainbowState, dt: number): RainbowState {
  const next = state.phase + dt * state.speed * 0.35
  return { ...state, phase: next > 1 ? 1 : next }
}

function dropletCenter(w: number, h: number): Vec2 {
  return { x: w * 0.58, y: h * 0.52 }
}

function drawDroplet(ctx: CanvasRenderingContext2D, c: Vec2, r: number) {
  withShadow(
    ctx,
    () => {
      const grad = ctx.createRadialGradient(c.x - r * 0.3, c.y - r * 0.3, r * 0.1, c.x, c.y, r)
      grad.addColorStop(0, 'rgba(186, 230, 253, 0.9)')
      grad.addColorStop(0.5, 'rgba(56, 189, 248, 0.45)')
      grad.addColorStop(1, 'rgba(14, 116, 144, 0.25)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2)
      ctx.fill()
    },
    { blur: 16, color: 'rgba(125, 211, 252, 0.35)', oy: 4 },
  )
  ctx.save()
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.8)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(c.x, c.y, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

export function drawRainbowDispersion(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: RainbowState,
) {
  clearCanvas(ctx, w, h, 'optics')

  const drop = dropletCenter(w, h)
  const dropR = Math.min(w, h) * 0.14
  const entry: Vec2 = { x: drop.x - dropR * 0.85, y: drop.y - dropR * 0.2 }
  const exitBase: Vec2 = { x: drop.x + dropR * 0.75, y: drop.y + dropR * 0.35 }
  const lightSrc: Vec2 = { x: w * 0.08, y: h * 0.38 }

  drawDroplet(ctx, drop, dropR)
  drawLabel(ctx, 'Water droplet', { x: drop.x, y: drop.y + dropR + 22 }, 'center')

  const phase = state.phase

  drawGlow(ctx, lightSrc.x, lightSrc.y, 38, RAY_WHITE, 0.4)
  ctx.save()
  ctx.fillStyle = RAY_WHITE
  ctx.beginPath()
  ctx.arc(lightSrc.x, lightSrc.y, 6, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  if (phase < 0.35) {
    const t = phase / 0.35
    const from = lightSrc
    const to = {
      x: from.x + (entry.x - from.x) * t,
      y: from.y + (entry.y - from.y) * t,
    }
    drawRay(ctx, from, normalize({ x: to.x - from.x, y: to.y - from.y }),
      Math.hypot(to.x - from.x, to.y - from.y), RAY_WHITE, 3)
    drawLabel(ctx, 'White light', { x: from.x + 40, y: from.y - 14 })
  } else if (phase < 0.55) {
    drawRay(ctx, lightSrc, normalize({ x: entry.x - lightSrc.x, y: entry.y - lightSrc.y }),
      Math.hypot(entry.x - lightSrc.x, entry.y - lightSrc.y), RAY_WHITE, 3)
    const t = (phase - 0.35) / 0.2
    SPECTRUM.forEach((band, i) => {
      const spread = (i - 3) * 0.04
      const internalEnd = {
        x: drop.x + (dropR * 0.3) * Math.cos(spread),
        y: drop.y + (dropR * 0.3) * Math.sin(spread),
      }
      const start = entry
      const pt = {
        x: start.x + (internalEnd.x - start.x) * t,
        y: start.y + (internalEnd.y - start.y) * t,
      }
      drawRay(ctx, start, normalize({ x: pt.x - start.x, y: pt.y - start.y }),
        Math.hypot(pt.x - start.x, pt.y - start.y), band.color, 2)
    })
    drawLabel(ctx, 'Dispersion inside droplet', { x: w * 0.5, y: h * 0.12 }, 'center')
  } else {
    drawRay(ctx, lightSrc, normalize({ x: entry.x - lightSrc.x, y: entry.y - lightSrc.y }),
      Math.hypot(entry.x - lightSrc.x, entry.y - lightSrc.y), RAY_WHITE, 2)
    const t = Math.min(1, (phase - 0.55) / 0.45)
    SPECTRUM.forEach((band, i) => {
      const spread = (i - 3) * 0.12
      const dir = normalize({
        x: Math.cos(-0.35 + spread),
        y: Math.sin(0.55 + spread * 0.5),
      })
      const len = w * 0.38 * t
      drawRay(ctx, exitBase, dir, len, band.color, 2.5)
    })
    drawLabel(ctx, 'Spectrum exits — rainbow forms', { x: w * 0.5, y: h * 0.12 }, 'center')
  }

  drawLabel(ctx, 'Rainbow Formation (Dispersion)', { x: w * 0.5, y: 28 }, 'center')

  if (phase >= 1) {
    ctx.save()
    ctx.globalAlpha = 0.35
    const arcX = w * 0.72
    const arcY = h * 0.88
    const arcR = w * 0.28
    const grad = ctx.createLinearGradient(arcX - arcR, arcY, arcX + arcR, arcY)
    SPECTRUM.forEach((s, i) => grad.addColorStop(i / (SPECTRUM.length - 1), s.color))
    ctx.strokeStyle = grad
    ctx.lineWidth = 10
    ctx.beginPath()
    ctx.arc(arcX, arcY, arcR, Math.PI, 0)
    ctx.stroke()
    ctx.restore()
    drawLabel(ctx, 'Rainbow arc', { x: arcX, y: arcY - arcR - 16 }, 'center')
  }
}
