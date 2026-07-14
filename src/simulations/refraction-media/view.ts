/**
 * View — canvas drawing for Refraction Through Media.
 * Reads model state only; no physics mutations.
 */
import {
  DEG2RAD,
  RAY_CYAN,
  RAY_YELLOW,
  RAY_WHITE,
  MUTED,
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
  N_AIR,
  computeRefraction,
  type RefractionState,
} from './model'

export function drawRefractionMedia(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: RefractionState,
) {
  clearCanvas(ctx, w, h, 'optics')

  const { medium, refractedDeg } = computeRefraction(state)
  const boundaryY = h * 0.55
  const hit: Vec2 = { x: w * 0.5, y: boundaryY }
  const rayLen = Math.min(w, h) * 0.45

  ctx.save()
  ctx.fillStyle = 'rgba(15, 23, 42, 0.5)'
  ctx.fillRect(0, 0, w, boundaryY)
  ctx.fillStyle = medium.color
  ctx.fillRect(0, boundaryY, w, h - boundaryY)
  ctx.strokeStyle = MUTED
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, boundaryY)
  ctx.lineTo(w, boundaryY)
  ctx.stroke()
  drawLabel(ctx, 'Air (n = 1.00)', { x: w * 0.14, y: boundaryY * 0.35 })
  drawLabel(ctx, `${medium.label.split('(')[0].trim()}`, {
    x: w * 0.14,
    y: boundaryY + (h - boundaryY) * 0.35,
  })
  ctx.restore()

  const iRad = state.incidenceDeg * DEG2RAD
  const incidentDir = normalize({ x: -Math.sin(iRad), y: -Math.cos(iRad) })
  const incidentStart: Vec2 = {
    x: hit.x - incidentDir.x * rayLen,
    y: hit.y - incidentDir.y * rayLen,
  }

  drawGlow(ctx, incidentStart.x, incidentStart.y, 32, RAY_YELLOW, 0.5)
  ctx.save()
  ctx.fillStyle = RAY_YELLOW
  ctx.beginPath()
  ctx.arc(incidentStart.x, incidentStart.y, 7, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#0f172a'
  ctx.beginPath()
  ctx.arc(incidentStart.x, incidentStart.y, 3, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  drawRay(ctx, incidentStart, incidentDir, rayLen, RAY_YELLOW)

  if (state.showNormal) {
    const normalTop: Vec2 = { x: hit.x, y: hit.y - rayLen * 0.5 }
    const normalBottom: Vec2 = { x: hit.x, y: hit.y + rayLen * 0.45 }
    drawDashedLine(ctx, hit, normalTop, RAY_WHITE)
    drawDashedLine(ctx, hit, normalBottom, RAY_WHITE)
    drawLabel(ctx, 'Normal', { x: hit.x + 32, y: hit.y - rayLen * 0.25 })
  }

  if (state.showAngles) {
    drawAngleArc(
      ctx,
      hit,
      -Math.PI / 2 - iRad,
      -Math.PI / 2,
      34,
      `i = ${state.incidenceDeg}°`,
      RAY_YELLOW,
    )
  }

  if (refractedDeg !== null) {
    const rRad = refractedDeg * DEG2RAD
    const refractedDir = normalize({ x: Math.sin(rRad), y: Math.cos(rRad) })
    drawRay(ctx, hit, refractedDir, rayLen, RAY_CYAN)
    if (state.showAngles) {
      drawAngleArc(
        ctx,
        hit,
        Math.PI / 2,
        Math.PI / 2 + rRad,
        46,
        `r = ${Math.round(refractedDeg)}°`,
        RAY_CYAN,
      )
    }
    drawLabel(ctx, `n₁ sin i = n₂ sin r`, { x: w * 0.5, y: h - 28 }, 'center')
  } else {
    const reflectedDir = normalize({ x: Math.sin(iRad), y: -Math.cos(iRad) })
    drawRay(ctx, hit, reflectedDir, rayLen, RAY_CYAN)
    drawLabel(ctx, 'Total internal reflection!', { x: w * 0.5, y: h - 28 }, 'center')
  }

  drawLabel(ctx, "Snell's Law — Refraction Through Media", { x: w * 0.5, y: 24 }, 'center')
  drawLabel(ctx, 'drag laser · or use panel', { x: w * 0.5, y: 44 }, 'center')

  // Expose hit geometry metadata on canvas for pointer (via return)
  return { hit, incidentStart, boundaryY, rayLen, nAir: N_AIR }
}

export type RefractionLayout = {
  hit: Vec2
  incidentStart: Vec2
  boundaryY: number
  rayLen: number
}
