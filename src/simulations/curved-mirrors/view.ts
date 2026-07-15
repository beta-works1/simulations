/**
 * View — canvas drawing for Concave & Convex Mirrors.
 * Reads model state only; no physics mutations.
 */
import { withShadow } from '../shared/canvasTheme'
import {
  RAY_CYAN,
  RAY_YELLOW,
  RAY_WHITE,
  OBJECT_COLOR,
  MUTED,
  clearCanvas,
  drawDashedLine,
  drawGlow,
  drawLabel,
  drawRay,
  normalize,
  type Vec2,
} from '../shared/drawUtils'
import {
  computeCurvedLayout,
  type CurvedMirrorsState,
  type MirrorType,
} from './model'

function drawMirrorArc(
  ctx: CanvasRenderingContext2D,
  pole: Vec2,
  r: number,
  type: MirrorType,
) {
  const drawArc = () => {
    ctx.beginPath()
    if (type === 'concave') {
      ctx.arc(pole.x + r, pole.y, r, Math.PI * 0.65, Math.PI * 1.35)
    } else {
      ctx.arc(pole.x - r, pole.y, r, -Math.PI * 0.35, Math.PI * 0.35)
    }
  }

  withShadow(
    ctx,
    () => {
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)'
      ctx.lineWidth = 10
      ctx.lineCap = 'round'
      drawArc()
      ctx.stroke()
    },
    { blur: 14, color: 'rgba(226, 232, 240, 0.38)', oy: 4 },
  )
  withShadow(
    ctx,
    () => {
      ctx.strokeStyle = '#e2e8f0'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      drawArc()
      ctx.stroke()
    },
    { blur: 8, color: 'rgba(255, 255, 255, 0.45)', oy: 1 },
  )
}

function drawArrowObject(
  ctx: CanvasRenderingContext2D,
  base: Vec2,
  height: number,
  color: string,
  label: string,
  dashed = false,
) {
  const tip = { x: base.x, y: base.y - height }
  ctx.save()
  if (dashed) ctx.setLineDash([6, 5])
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(base.x, base.y)
  ctx.lineTo(tip.x, tip.y)
  ctx.stroke()
  const angle = Math.atan2(tip.y - base.y, tip.x - base.x)
  const head = 10
  ctx.beginPath()
  ctx.moveTo(tip.x, tip.y)
  ctx.lineTo(tip.x - head * Math.cos(angle - 0.4), tip.y - head * Math.sin(angle - 0.4))
  ctx.lineTo(tip.x - head * Math.cos(angle + 0.4), tip.y - head * Math.sin(angle + 0.4))
  ctx.closePath()
  ctx.fill()
  drawLabel(ctx, label, { x: base.x - 28, y: tip.y - 10 })
  ctx.restore()
}

export function drawCurvedMirrors(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: CurvedMirrorsState,
) {
  clearCanvas(ctx, w, h, 'optics')
  const layout = computeCurvedLayout(w, h, state)
  const { pole, axisY, f, r, objectX, imageX, objectH, imageH, imageVirtual } = layout

  ctx.save()
  ctx.strokeStyle = MUTED
  ctx.setLineDash([5, 5])
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(0, axisY)
  ctx.lineTo(w, axisY)
  ctx.stroke()
  ctx.restore()

  drawMirrorArc(ctx, pole, r, state.type)

  const fPoint: Vec2 = {
    x: state.type === 'concave' ? pole.x - f : pole.x + f,
    y: axisY,
  }
  const cPoint: Vec2 = {
    x: state.type === 'concave' ? pole.x - r : pole.x + r,
    y: axisY,
  }

  ctx.save()
  ctx.fillStyle = RAY_WHITE
  ;[fPoint, cPoint, pole].forEach((p) => {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.restore()
  drawLabel(ctx, 'F', { x: fPoint.x, y: fPoint.y + 18 })
  drawLabel(ctx, 'C', { x: cPoint.x, y: cPoint.y + 18 })
  drawLabel(ctx, 'P', { x: pole.x, y: pole.y - 16 })

  const objBase = { x: objectX, y: axisY }
  const objTip = { x: objectX, y: axisY - objectH }
  drawGlow(ctx, objTip.x, objTip.y, 22, RAY_YELLOW, 0.35)
  drawArrowObject(ctx, objBase, objectH, OBJECT_COLOR, 'Object')

  const imgBase = { x: imageX, y: axisY }
  drawArrowObject(
    ctx,
    imgBase,
    imageH,
    RAY_CYAN,
    imageVirtual ? 'Virtual image' : 'Real image',
    imageVirtual,
  )

  const rayLen = w * 0.5
  const parallelHit = { x: pole.x - 8, y: objTip.y }
  drawRay(ctx, objTip, normalize({ x: parallelHit.x - objTip.x, y: 0 }), Math.abs(parallelHit.x - objTip.x), RAY_YELLOW, 2)

  if (state.type === 'concave') {
    const reflDir = normalize({ x: fPoint.x - parallelHit.x, y: fPoint.y - parallelHit.y })
    drawRay(ctx, parallelHit, reflDir, rayLen * 0.55, RAY_CYAN, 2)
  } else {
    const reflDir = normalize({ x: fPoint.x - parallelHit.x, y: fPoint.y - parallelHit.y })
    drawRay(ctx, parallelHit, reflDir, rayLen * 0.35, RAY_CYAN, 2)
    drawDashedLine(ctx, parallelHit, { x: parallelHit.x - rayLen * 0.4, y: parallelHit.y - rayLen * 0.15 }, RAY_CYAN)
  }

  drawRay(ctx, objTip, normalize({ x: pole.x - objTip.x, y: pole.y - objTip.y }),
    Math.hypot(pole.x - objTip.x, pole.y - objTip.y) * 0.95, RAY_YELLOW, 2)
  drawRay(ctx, objTip, normalize({ x: fPoint.x - objTip.x, y: fPoint.y - objTip.y }),
    Math.hypot(fPoint.x - objTip.x, fPoint.y - objTip.y) * 0.7, RAY_YELLOW, 2)

  const title =
    state.type === 'concave'
      ? 'Concave mirror — can form real or virtual images'
      : 'Convex mirror — always forms a virtual, upright image'
  drawLabel(ctx, title, { x: w * 0.42, y: 26 }, 'center')

  const u = pole.x - objectX
  const v = pole.x - imageX
  drawLabel(
    ctx,
    `1/f ≈ 1/u + 1/v  →  u=${Math.round(u)}px, v=${Math.round(v)}px`,
    { x: w * 0.5, y: h - 22 },
    'center',
  )
}
