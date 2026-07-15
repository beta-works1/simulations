/**
 * View — canvas drawing for Plane Mirror & Periscope.
 * Reads model state only; no physics mutations.
 */
import { withShadow } from '../shared/canvasTheme'
import {
  DEG2RAD,
  RAY_CYAN,
  RAY_YELLOW,
  RAY_WHITE,
  OBJECT_COLOR,
  MIRROR_COLOR,
  MUTED,
  clearCanvas,
  drawDashedLine,
  drawGlow,
  drawLabel,
  drawRay,
  normalize,
  type Vec2,
} from '../shared/drawUtils'
import { type PlaneMirrorState } from './model'

function drawArrow(
  ctx: CanvasRenderingContext2D,
  base: Vec2,
  tip: Vec2,
  color: string,
  label: string,
) {
  ctx.save()
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
  drawLabel(ctx, label, { x: (base.x + tip.x) / 2 - 20, y: (base.y + tip.y) / 2 })
  ctx.restore()
}

function drawMirrorSegment(
  ctx: CanvasRenderingContext2D,
  a: Vec2,
  b: Vec2,
  angleDeg: number,
) {
  ctx.save()
  ctx.translate((a.x + b.x) / 2, (a.y + b.y) / 2)
  ctx.rotate(angleDeg * DEG2RAD)
  const len = Math.hypot(b.x - a.x, b.y - a.y)
  withShadow(
    ctx,
    () => {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.3)'
      ctx.fillRect(-len / 2, -7, len, 14)
    },
    { blur: 12, color: 'rgba(226, 232, 240, 0.42)', oy: 3 },
  )
  withShadow(
    ctx,
    () => {
      ctx.strokeStyle = MIRROR_COLOR
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-len / 2, 0)
      ctx.lineTo(len / 2, 0)
      ctx.stroke()
    },
    { blur: 8, color: 'rgba(255, 255, 255, 0.45)', oy: 1 },
  )
  ctx.restore()
}

function drawPlaneMirrorScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: PlaneMirrorState,
) {
  const mirrorX = w * 0.55
  const axisY = h * 0.82
  const objX = mirrorX - state.objectDist * w
  const objTop = axisY - state.objectHeight * h
  const imgX = mirrorX + (mirrorX - objX)
  const imgTop = objTop

  ctx.save()
  ctx.strokeStyle = MUTED
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(0, axisY)
  ctx.lineTo(w, axisY)
  ctx.stroke()
  ctx.restore()

  drawMirrorSegment(
    ctx,
    { x: mirrorX, y: h * 0.15 },
    { x: mirrorX, y: axisY },
    0,
  )
  drawLabel(ctx, 'Mirror', { x: mirrorX + 28, y: h * 0.4 })

  drawArrow(ctx, { x: objX, y: axisY }, { x: objX, y: objTop }, OBJECT_COLOR, 'Object')

  ctx.save()
  ctx.globalAlpha = 0.55
  ctx.setLineDash([6, 5])
  drawArrow(ctx, { x: imgX, y: axisY }, { x: imgX, y: imgTop }, RAY_CYAN, 'Virtual image')
  ctx.restore()

  const objMid = { x: objX, y: (axisY + objTop) / 2 }
  const mirrorMid = { x: mirrorX, y: (axisY + objTop) / 2 }
  const imgMid = { x: imgX, y: (axisY + objTop) / 2 }

  drawRay(ctx, objMid, normalize({ x: mirrorMid.x - objMid.x, y: mirrorMid.y - objMid.y }),
    Math.hypot(mirrorMid.x - objMid.x, mirrorMid.y - objMid.y), RAY_YELLOW, 2)
  drawRay(ctx, mirrorMid, normalize({ x: imgMid.x - mirrorMid.x, y: imgMid.y - mirrorMid.y }),
    Math.hypot(imgMid.x - mirrorMid.x, imgMid.y - mirrorMid.y), RAY_YELLOW, 2)

  drawDashedLine(ctx, objMid, imgMid, RAY_WHITE)
  drawLabel(ctx, 'Same distance behind mirror', { x: (objMid.x + imgMid.x) / 2, y: axisY + 36 }, 'center')
}

function drawPeriscopeScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  const tubeW = w * 0.12
  const topMirror: Vec2 = { x: w * 0.38, y: h * 0.22 }
  const bottomMirror: Vec2 = { x: w * 0.62, y: h * 0.62 }
  const eye: Vec2 = { x: w * 0.78, y: h * 0.78 }
  const target: Vec2 = { x: w * 0.18, y: h * 0.12 }

  ctx.save()
  ctx.fillStyle = 'rgba(30, 41, 59, 0.8)'
  ctx.strokeStyle = '#475569'
  ctx.lineWidth = 2
  ctx.fillRect(topMirror.x - tubeW / 2, topMirror.y, tubeW, bottomMirror.y - topMirror.y)
  ctx.strokeRect(topMirror.x - tubeW / 2, topMirror.y, tubeW, bottomMirror.y - topMirror.y)
  ctx.fillRect(bottomMirror.x - tubeW / 2, bottomMirror.y, tubeW, eye.y - bottomMirror.y)
  ctx.strokeRect(bottomMirror.x - tubeW / 2, bottomMirror.y, tubeW, eye.y - bottomMirror.y)
  ctx.restore()

  drawMirrorSegment(
    ctx,
    { x: topMirror.x - 40, y: topMirror.y },
    { x: topMirror.x + 40, y: topMirror.y },
    -45,
  )
  drawMirrorSegment(
    ctx,
    { x: bottomMirror.x - 40, y: bottomMirror.y },
    { x: bottomMirror.x + 40, y: bottomMirror.y },
    45,
  )

  drawLabel(ctx, '45°', { x: topMirror.x + 50, y: topMirror.y - 8 })
  drawLabel(ctx, '45°', { x: bottomMirror.x - 50, y: bottomMirror.y + 8 })

  drawRay(ctx, target, normalize({ x: topMirror.x - target.x, y: topMirror.y - target.y }),
    Math.hypot(topMirror.x - target.x, topMirror.y - target.y), RAY_YELLOW)
  drawRay(ctx, topMirror, { x: 1, y: 0 }, Math.hypot(bottomMirror.x - topMirror.x, bottomMirror.y - topMirror.y), RAY_YELLOW)
  drawRay(ctx, bottomMirror, normalize({ x: eye.x - bottomMirror.x, y: eye.y - bottomMirror.y }),
    Math.hypot(eye.x - bottomMirror.x, eye.y - bottomMirror.y), RAY_CYAN)

  drawGlow(ctx, target.x, target.y, 28, OBJECT_COLOR, 0.45)
  ctx.save()
  ctx.fillStyle = OBJECT_COLOR
  ctx.beginPath()
  ctx.arc(target.x, target.y, 8, 0, Math.PI * 2)
  ctx.fill()
  drawLabel(ctx, 'Object', { x: target.x, y: target.y - 18 })
  drawGlow(ctx, eye.x, eye.y, 24, RAY_CYAN, 0.45)
  ctx.fillStyle = RAY_CYAN
  ctx.beginPath()
  ctx.arc(eye.x, eye.y, 7, 0, Math.PI * 2)
  ctx.fill()
  drawLabel(ctx, 'Eye', { x: eye.x + 24, y: eye.y })
  ctx.restore()
}

export function drawPlaneMirrorPeriscope(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: PlaneMirrorState,
) {
  clearCanvas(ctx, w, h, 'optics')
  if (state.mode === 'plane') {
    drawPlaneMirrorScene(ctx, w, h, state)
    drawLabel(ctx, 'Plane mirror — virtual image forms behind the mirror', { x: w * 0.5, y: 24 }, 'center')
  } else {
    drawPeriscopeScene(ctx, w, h)
    drawLabel(ctx, 'Periscope — two plane mirrors at 45° redirect light', { x: w * 0.5, y: 24 }, 'center')
  }
}
