/**
 * View — canvas drawing for Laws of Reflection.
 * Reads model state only; no physics mutations.
 */
import { withShadow } from '../shared/canvasTheme'
import {
  RAD2DEG,
  RAY_CYAN,
  RAY_YELLOW,
  RAY_WHITE,
  MIRROR_COLOR,
  clearCanvas,
  drawAngleArc,
  drawDashedLine,
  drawGlow,
  drawLabel,
  drawRay,
  normalize,
  type Vec2,
} from '../shared/drawUtils'
import {
  sourceFromIncidence,
  type LawsOfReflectionState,
} from './model'

function dot2(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y
}

export function drawLawsOfReflection(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: LawsOfReflectionState,
) {
  clearCanvas(ctx, w, h, 'optics')

  const mirrorY = h * 0.72
  const mirrorX1 = w * 0.12
  const mirrorX2 = w * 0.88
  const hit: Vec2 = { x: w * 0.5, y: mirrorY }
  const rayLen = Math.min(w, h) * 0.42

  const source =
    state.sourceX > 0 && state.sourceY > 0
      ? { x: state.sourceX * w, y: state.sourceY * h }
      : sourceFromIncidence(hit, state.incidenceDeg, rayLen)

  const toHit = normalize({ x: hit.x - source.x, y: hit.y - source.y })
  const incidenceRad = Math.acos(Math.min(1, Math.abs(dot2(toHit, { x: 0, y: -1 }))))
  const reflectedDir = normalize({ x: Math.sin(incidenceRad), y: -Math.cos(incidenceRad) })

  withShadow(
    ctx,
    () => {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.28)'
      ctx.fillRect(mirrorX1, mirrorY, mirrorX2 - mirrorX1, h - mirrorY)
    },
    { blur: 14, color: 'rgba(226, 232, 240, 0.4)', oy: 4 },
  )
  withShadow(
    ctx,
    () => {
      ctx.strokeStyle = MIRROR_COLOR
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(mirrorX1, mirrorY)
      ctx.lineTo(mirrorX2, mirrorY)
      ctx.stroke()
    },
    { blur: 8, color: 'rgba(255, 255, 255, 0.45)', oy: 1 },
  )

  const normalTop: Vec2 = { x: hit.x, y: hit.y - rayLen * 0.55 }
  drawDashedLine(ctx, hit, normalTop, RAY_WHITE)
  drawLabel(ctx, 'Normal', { x: hit.x + 36, y: hit.y - rayLen * 0.3 })

  drawRay(ctx, source, toHit, Math.hypot(hit.x - source.x, hit.y - source.y), RAY_YELLOW)
  drawRay(ctx, hit, reflectedDir, rayLen, RAY_CYAN)

  const iDeg = Math.round(incidenceRad * RAD2DEG)
  drawAngleArc(
    ctx,
    hit,
    -Math.PI / 2 - incidenceRad,
    -Math.PI / 2,
    36,
    `i = ${iDeg}°`,
    RAY_YELLOW,
  )
  drawAngleArc(
    ctx,
    hit,
    -Math.PI / 2,
    -Math.PI / 2 + incidenceRad,
    48,
    `r = ${iDeg}°`,
    RAY_CYAN,
  )

  drawGlow(ctx, source.x, source.y, 34, RAY_YELLOW, 0.55)
  ctx.save()
  ctx.fillStyle = RAY_YELLOW
  ctx.beginPath()
  ctx.arc(source.x, source.y, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#0f172a'
  ctx.beginPath()
  ctx.arc(source.x, source.y, 4, 0, Math.PI * 2)
  ctx.fill()
  drawLabel(ctx, 'Light source', { x: source.x, y: source.y - 22 })
  ctx.restore()

  drawLabel(ctx, 'Mirror', { x: (mirrorX1 + mirrorX2) / 2, y: mirrorY + 22 }, 'center')
  drawLabel(ctx, 'Laws of Reflection: ∠i = ∠r', { x: w * 0.5, y: 24 }, 'center')
  drawLabel(ctx, 'drag source', { x: source.x, y: source.y + 28 }, 'center')
}
