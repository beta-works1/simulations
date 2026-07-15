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

/**
 * Shrink font and/or ellipsize so text fits maxWidth.
 * Call after setting ctx.font to the desired face (weight + family); size is adjusted.
 */
export function fitTextToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startPx: number,
  minPx = 8,
): { text: string; fontPx: number } {
  let size = Math.max(minPx, Math.round(startPx))
  const weightMatch = ctx.font.match(/^(italic\s+)?(bold|600|700|\d{3})\s/)
  const weight = weightMatch ? weightMatch[0] : ''
  const family = ctx.font.replace(/^(italic\s+)?([\w-]+\s+)?\d+(\.\d+)?px\s+/, '') || 'Roboto, sans-serif'

  const setFont = (px: number) => {
    ctx.font = `${weight}${px}px ${family}`
  }

  setFont(size)
  while (size > minPx && ctx.measureText(text).width > maxWidth) {
    size -= 1
    setFont(size)
  }
  if (ctx.measureText(text).width <= maxWidth) return { text, fontPx: size }

  let truncated = text
  while (truncated.length > 1 && ctx.measureText(`${truncated}…`).width > maxWidth) {
    truncated = truncated.slice(0, -1)
  }
  return { text: truncated.length < text.length ? `${truncated}…` : truncated, fontPx: size }
}

/** Draw centered (or aligned) text that stays within maxWidth. */
export function fillFittedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  startPx: number,
  opts?: { minPx?: number; align?: CanvasTextAlign; baseline?: CanvasTextBaseline },
) {
  const align = opts?.align ?? ctx.textAlign
  const baseline = opts?.baseline ?? ctx.textBaseline
  const { text: shown, fontPx: px } = fitTextToWidth(ctx, text, maxWidth, startPx, opts?.minPx ?? 8)
  const weightMatch = ctx.font.match(/^(italic\s+)?(bold|600|700|\d{3})\s/)
  const weight = weightMatch ? weightMatch[0] : ''
  const family = ctx.font.replace(/^(italic\s+)?([\w-]+\s+)?\d+(\.\d+)?px\s+/, '') || 'Roboto, sans-serif'
  ctx.font = `${weight}${px}px ${family}`
  ctx.textAlign = align
  ctx.textBaseline = baseline
  ctx.fillText(shown, x, y)
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

/** Erlenmeyer / conical flask silhouette (center x, top → bottom, half-width at base). */
export function erlenmeyerPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  bottom: number,
  halfW: number,
  neckRatio = 0.35,
  shoulderT = 0.16,
) {
  const neck = halfW * neckRatio
  const shoulderY = top + (bottom - top) * shoulderT
  ctx.beginPath()
  ctx.moveTo(cx - neck, top)
  ctx.lineTo(cx - neck, shoulderY)
  ctx.lineTo(cx - halfW, bottom)
  ctx.lineTo(cx + halfW, bottom)
  ctx.lineTo(cx + neck, shoulderY)
  ctx.lineTo(cx + neck, top)
  ctx.closePath()
}

/** Open trapezoid mixing vessel (no vertical neck). */
export function taperedVesselPath(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  bottom: number,
  halfTop: number,
  halfBottom: number,
) {
  ctx.beginPath()
  ctx.moveTo(cx - halfTop, top)
  ctx.lineTo(cx - halfBottom, bottom)
  ctx.lineTo(cx + halfBottom, bottom)
  ctx.lineTo(cx + halfTop, top)
  ctx.closePath()
}

/**
 * Fill liquid clipped to a closed vessel path. `fillLevel` 0–1 from empty → full.
 * Call after building the path with beginPath/closePath; does not stroke.
 */
export function fillClippedLiquid(
  ctx: CanvasRenderingContext2D,
  path: (c: CanvasRenderingContext2D) => void,
  top: number,
  bottom: number,
  fillLevel: number,
  color: string,
  opts?: { inset?: number; alpha?: number },
) {
  const level = Math.max(0, Math.min(1, fillLevel))
  if (level <= 0.001) return
  const inset = opts?.inset ?? 2
  const liquidTop = bottom - inset - level * (bottom - top - inset * 2)
  ctx.save()
  path(ctx)
  ctx.clip()
  ctx.globalAlpha = opts?.alpha ?? 0.9
  ctx.fillStyle = color
  ctx.fillRect(
    -1e4,
    liquidTop,
    2e4,
    Math.max(0, bottom - liquidTop + 1),
  )
  // meniscus highlight
  ctx.globalAlpha = Math.min(0.35, (opts?.alpha ?? 0.9) * 0.4)
  ctx.fillStyle = '#fff'
  ctx.fillRect(-1e4, liquidTop, 2e4, 3)
  ctx.restore()
}

/** Draw stroked erlenmeyer with liquid that stays inside the glass. */
export function drawErlenmeyerFlask(
  ctx: CanvasRenderingContext2D,
  cx: number,
  top: number,
  bottom: number,
  halfW: number,
  fillLevel: number,
  fillColor: string,
  opts?: {
    stroke?: string
    lineWidth?: number
    neckRatio?: number
    shoulderT?: number
    alpha?: number
  },
) {
  const neckRatio = opts?.neckRatio ?? 0.35
  const shoulderT = opts?.shoulderT ?? 0.16
  const path = (c: CanvasRenderingContext2D) =>
    erlenmeyerPath(c, cx, top, bottom, halfW, neckRatio, shoulderT)

  fillClippedLiquid(ctx, path, top, bottom, fillLevel, fillColor, {
    inset: 3,
    alpha: opts?.alpha ?? 0.9,
  })

  path(ctx)
  ctx.strokeStyle = opts?.stroke ?? '#5d6d7e'
  ctx.lineWidth = opts?.lineWidth ?? 2.5
  ctx.stroke()

  // open rim
  const neck = halfW * neckRatio
  ctx.beginPath()
  ctx.moveTo(cx - neck, top)
  ctx.lineTo(cx + neck, top)
  ctx.stroke()
}
