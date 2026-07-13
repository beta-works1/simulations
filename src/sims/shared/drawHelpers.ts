/** Shared Canvas drawing helpers for responsive PhET-like visuals. */

import {
  fillThemeBackground,
  type SceneTheme,
  withShadow,
} from './canvasTheme'

export function clearScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  top = '#0d2137',
  bottom = '#16324d',
) {
  const g = ctx.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, top)
  g.addColorStop(1, bottom)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  const vg = ctx.createRadialGradient(
    w * 0.5,
    h * 0.35,
    Math.min(w, h) * 0.12,
    w * 0.5,
    h * 0.55,
    Math.max(w, h) * 0.7,
  )
  vg.addColorStop(0, 'rgba(255,255,255,0.045)')
  vg.addColorStop(1, 'rgba(0,0,0,0.16)')
  ctx.fillStyle = vg
  ctx.fillRect(0, 0, w, h)
}

export function clearThemedScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: SceneTheme,
) {
  fillThemeBackground(ctx, w, h, theme)
}

export { withShadow }

export function fontPx(base: number, w: number, h: number, min = 10, max = 22) {
  const scale = Math.min(w, h) / 480
  return Math.round(Math.max(min, Math.min(max, base * scale)))
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

export function drawBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts?: { bg?: string; fg?: string; padX?: number; font?: string },
) {
  const padX = opts?.padX ?? 10
  const font = opts?.font ?? '12px Roboto, sans-serif'
  ctx.font = font
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  const tw = ctx.measureText(text).width
  const h = 24
  const w = tw + padX * 2
  roundRect(ctx, x, y - h / 2, w, h, 8)
  ctx.fillStyle = opts?.bg ?? 'rgba(0,0,0,0.45)'
  ctx.fill()
  ctx.fillStyle = opts?.fg ?? '#fff'
  ctx.fillText(text, x + padX, y + 1)
}

export function drawLegend(
  ctx: CanvasRenderingContext2D,
  items: { color: string; label: string }[],
  x: number,
  y: number,
  fontSize: number,
) {
  ctx.font = `${fontSize}px Roboto, sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  let cx = x
  for (const item of items) {
    ctx.beginPath()
    ctx.arc(cx + 6, y, 5, 0, Math.PI * 2)
    ctx.fillStyle = item.color
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    ctx.fillText(item.label, cx + 16, y)
    cx += 16 + ctx.measureText(item.label).width + 16
  }
}
