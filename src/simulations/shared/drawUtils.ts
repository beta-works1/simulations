import {
  SCENE,
  STROKE,
  drawGlow,
  fillThemeBackground,
  type SceneTheme,
} from './canvasTheme'

export const RAY_CYAN = SCENE.optics.accent
export const RAY_YELLOW = SCENE.optics.hot
export const RAY_WHITE = '#f8fafc'
export const LABEL_COLOR = '#f1f5f9'
export const MUTED = '#94a3b8'
export const MIRROR_COLOR = '#e2e8f0'
export const OBJECT_COLOR = '#fb7185'

export const DEG2RAD = Math.PI / 180
export const RAD2DEG = 180 / Math.PI

export interface Vec2 {
  x: number
  y: number
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s }
}

export function normalize(v: Vec2): Vec2 {
  const len = Math.hypot(v.x, v.y) || 1
  return { x: v.x / len, y: v.y / len }
}

export function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y
}

export function drawRay(
  ctx: CanvasRenderingContext2D,
  from: Vec2,
  dir: Vec2,
  length: number,
  color: string,
  width: number = STROKE.ray,
) {
  const d = normalize(dir)
  const to = add(from, scale(d, length))
  ctx.save()
  ctx.lineCap = 'round'
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.28
  ctx.lineWidth = width + 6
  ctx.shadowBlur = 14
  ctx.shadowColor = color
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()
  ctx.globalAlpha = 1
  ctx.lineWidth = width
  ctx.shadowBlur = 0
  ctx.beginPath()
  ctx.moveTo(from.x, from.y)
  ctx.lineTo(to.x, to.y)
  ctx.stroke()
  drawArrowhead(ctx, from, to, color)
  ctx.restore()
  return to
}

function drawArrowhead(ctx: CanvasRenderingContext2D, from: Vec2, to: Vec2, color: string) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x)
  const head = 10
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(to.x, to.y)
  ctx.lineTo(to.x - head * Math.cos(angle - 0.35), to.y - head * Math.sin(angle - 0.35))
  ctx.lineTo(to.x - head * Math.cos(angle + 0.35), to.y - head * Math.sin(angle + 0.35))
  ctx.closePath()
  ctx.fill()
}

export function drawDashedLine(
  ctx: CanvasRenderingContext2D,
  a: Vec2,
  b: Vec2,
  color: string,
  dash = [6, 5],
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = STROKE.guide
  ctx.setLineDash(dash)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(a.x, a.y)
  ctx.lineTo(b.x, b.y)
  ctx.stroke()
  ctx.restore()
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  pos: Vec2,
  align: CanvasTextAlign = 'center',
) {
  ctx.save()
  ctx.font = '600 13px Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif'
  ctx.textAlign = align
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0,0,0,0.65)'
  ctx.shadowBlur = 4
  ctx.fillStyle = LABEL_COLOR
  ctx.fillText(text, pos.x, pos.y)
  ctx.restore()
}

export function drawAngleArc(
  ctx: CanvasRenderingContext2D,
  center: Vec2,
  fromAngle: number,
  toAngle: number,
  radius: number,
  label: string,
  color: string = RAY_YELLOW,
) {
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = STROKE.guide
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.arc(center.x, center.y, radius, fromAngle, toAngle)
  ctx.stroke()
  const mid = (fromAngle + toAngle) / 2
  const labelPos = {
    x: center.x + (radius + 14) * Math.cos(mid),
    y: center.y + (radius + 14) * Math.sin(mid),
  }
  drawLabel(ctx, label, labelPos)
  ctx.restore()
}

export function clearCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  theme: SceneTheme = 'optics',
) {
  fillThemeBackground(ctx, w, h, theme)
}

/** Word-wrap canvas text; returns lines that fit within maxWidth. */
export function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 3,
): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  const lines: string[] = []
  let current = words[0]!
  for (let i = 1; i < words.length; i++) {
    const word = words[i]!
    const trial = `${current} ${word}`
    if (ctx.measureText(trial).width <= maxWidth) {
      current = trial
    } else {
      lines.push(current)
      current = word
      if (lines.length >= maxLines - 1) {
        // pack remainder into last line, ellipsize if needed
        const rest = [current, ...words.slice(i + 1)].join(' ')
        let last = rest
        while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) {
          last = last.slice(0, -1)
        }
        lines.push(ctx.measureText(rest).width > maxWidth ? `${last}…` : rest)
        return lines
      }
    }
  }
  lines.push(current)
  return lines
}

/** Draw a bottom caption card with title + wrapped description; returns panel top y. */
export function drawCaptionCard(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  title: string,
  description: string,
  opts?: { minHeight?: number; padX?: number },
): number {
  const padX = opts?.padX ?? 16
  const minHeight = opts?.minHeight ?? 64
  ctx.font = '12px Roboto, sans-serif'
  const lines = wrapCanvasText(ctx, description, w - padX * 2 - 24, 2)
  const cardH = Math.max(minHeight, 28 + 18 + lines.length * 16)
  const top = h - cardH - 8
  ctx.fillStyle = 'rgba(15,23,42,0.9)'
  ctx.fillRect(padX, top, w - padX * 2, cardH)
  ctx.strokeStyle = 'rgba(148,163,184,0.25)'
  ctx.strokeRect(padX, top, w - padX * 2, cardH)
  ctx.fillStyle = '#f1f5f9'
  ctx.font = '600 15px Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(title, padX + 12, top + 24)
  ctx.fillStyle = '#94a3b8'
  ctx.font = '12px Roboto, sans-serif'
  lines.forEach((line, i) => {
    ctx.fillText(line, padX + 12, top + 44 + i * 16)
  })
  return top
}

export function canvasPoint(
  clientX: number,
  clientY: number,
  canvas: HTMLCanvasElement,
): Vec2 {
  const rect = canvas.getBoundingClientRect()
  return { x: clientX - rect.left, y: clientY - rect.top }
}

export { drawGlow, SCENE, STROKE }
export type { SceneTheme }
