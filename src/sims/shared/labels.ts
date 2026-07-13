import { fontPx, roundRect } from './drawHelpers'

/** Cohesive on-canvas label styling across grade-8 (and reusable) sims. */
export const LABEL = {
  fontFamily: 'Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif',
  fg: '#152033',
  fgMuted: '#5a6b7f',
  fgInverse: '#ffffff',
  bg: 'rgba(255,255,255,0.94)',
  bgDark: 'rgba(21,32,51,0.88)',
  accent: '#0e7490',
  hover: 'rgba(14,116,144,0.28)',
  padX: 9,
  padY: 5,
  radius: 8,
} as const

export type LabelAlign = 'left' | 'center' | 'right'

export function drawLabelPill(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts?: {
    align?: LabelAlign
    bg?: string
    fg?: string
    fontSize?: number
    padX?: number
    padY?: number
    radius?: number
    bold?: boolean
  },
) {
  const align = opts?.align ?? 'center'
  const padX = opts?.padX ?? LABEL.padX
  const padY = opts?.padY ?? LABEL.padY
  const radius = opts?.radius ?? LABEL.radius
  const fontSize = opts?.fontSize ?? 12
  const bold = opts?.bold ?? true
  ctx.font = `${bold ? '600 ' : ''}${fontSize}px ${LABEL.fontFamily}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  const tw = ctx.measureText(text).width
  const boxW = tw + padX * 2
  const boxH = fontSize + padY * 2
  let left = x
  if (align === 'center') left = x - boxW / 2
  if (align === 'right') left = x - boxW
  const top = y - boxH / 2
  roundRect(ctx, left, top, boxW, boxH, radius)
  ctx.fillStyle = opts?.bg ?? LABEL.bg
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.fillStyle = opts?.fg ?? LABEL.fg
  ctx.fillText(text, left + padX, y + 0.5)
  return { x: left, y: top, w: boxW, h: boxH }
}

export function drawValueChip(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number,
  opts?: { align?: LabelAlign; fontSize?: number; accent?: boolean },
) {
  const text = label ? `${label} ${value}` : value
  return drawLabelPill(ctx, text, x, y, {
    align: opts?.align ?? 'center',
    fontSize: opts?.fontSize,
    bg: opts?.accent ? LABEL.bgDark : LABEL.bg,
    fg: opts?.accent ? LABEL.fgInverse : LABEL.fg,
  })
}

export function drawHint(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  canvasW: number,
  canvasH: number,
  opts?: { muted?: boolean },
) {
  const fs = fontPx(11, canvasW, canvasH, 9, 14)
  drawLabelPill(ctx, text, x, y, {
    align: 'center',
    fontSize: fs,
    bold: false,
    bg: opts?.muted ? 'rgba(255,255,255,0.7)' : 'rgba(41,128,185,0.12)',
    fg: opts?.muted ? LABEL.fgMuted : LABEL.accent,
    padX: 10,
    padY: 4,
  })
}

/** Soft halo behind a interactive handle when hovered / dragged. */
export function drawHoverHalo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  active: boolean,
) {
  if (!active) return
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fillStyle = LABEL.hover
  ctx.fill()
}

export function drawAxisLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  canvasW: number,
  canvasH: number,
) {
  const fs = fontPx(11, canvasW, canvasH, 9, 13)
  ctx.font = `600 ${fs}px ${LABEL.fontFamily}`
  ctx.fillStyle = LABEL.fgMuted
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
}
