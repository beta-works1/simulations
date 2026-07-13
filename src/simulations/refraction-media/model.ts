import {
  DEG2RAD,
  RAD2DEG,
  RAY_CYAN,
  RAY_YELLOW,
  RAY_WHITE,
  MUTED,
  clearCanvas,
  drawAngleArc,
  drawDashedLine,
  drawLabel,
  drawRay,
  normalize,
  type Vec2,
} from '../shared/drawUtils'

export interface Medium {
  id: string
  label: string
  n: number
  color: string
}

export const MEDIA: Medium[] = [
  { id: 'water', label: 'Water (n ≈ 1.33)', n: 1.33, color: 'rgba(56, 189, 248, 0.35)' },
  { id: 'glass', label: 'Glass (n ≈ 1.5)', n: 1.5, color: 'rgba(148, 163, 184, 0.4)' },
]

export interface RefractionState {
  mediumId: string
  incidenceDeg: number
}

export const DEFAULT_REFRACTION_STATE: RefractionState = {
  mediumId: 'water',
  incidenceDeg: 40,
}

export function defaultRefractionState(): RefractionState {
  return { ...DEFAULT_REFRACTION_STATE }
}

const N_AIR = 1

export function snellRefractedAngle(incidenceDeg: number, n1: number, n2: number): number | null {
  const sinT = (n1 / n2) * Math.sin(incidenceDeg * DEG2RAD)
  if (Math.abs(sinT) > 1) return null
  return Math.asin(sinT) * RAD2DEG
}

export function drawRefractionMedia(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: RefractionState,
) {
  clearCanvas(ctx, w, h)

  const medium = MEDIA.find((m) => m.id === state.mediumId) ?? MEDIA[0]
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
  drawLabel(ctx, `${medium.label.split('(')[0].trim()}`, { x: w * 0.14, y: boundaryY + (h - boundaryY) * 0.35 })
  ctx.restore()

  const iRad = state.incidenceDeg * DEG2RAD
  const incidentDir = normalize({ x: -Math.sin(iRad), y: -Math.cos(iRad) })
  const incidentStart: Vec2 = {
    x: hit.x - incidentDir.x * rayLen,
    y: hit.y - incidentDir.y * rayLen,
  }

  drawRay(ctx, incidentStart, incidentDir, rayLen, RAY_YELLOW)

  const normalTop: Vec2 = { x: hit.x, y: hit.y - rayLen * 0.5 }
  drawDashedLine(ctx, hit, normalTop, RAY_WHITE)
  drawLabel(ctx, 'Normal', { x: hit.x + 32, y: hit.y - rayLen * 0.25 })

  drawAngleArc(
    ctx,
    hit,
    -Math.PI / 2 - iRad,
    -Math.PI / 2,
    34,
    `i = ${state.incidenceDeg}°`,
    RAY_YELLOW,
  )

  const refractedDeg = snellRefractedAngle(state.incidenceDeg, N_AIR, medium.n)
  if (refractedDeg !== null) {
    const rRad = refractedDeg * DEG2RAD
    const refractedDir = normalize({ x: Math.sin(rRad), y: Math.cos(rRad) })
    drawRay(ctx, hit, refractedDir, rayLen, RAY_CYAN)
    drawAngleArc(
      ctx,
      hit,
      Math.PI / 2,
      Math.PI / 2 + rRad,
      46,
      `r = ${Math.round(refractedDeg)}°`,
      RAY_CYAN,
    )
    drawLabel(
      ctx,
      `n₁ sin i = n₂ sin r`,
      { x: w * 0.5, y: h - 28 },
      'center',
    )
  } else {
    const reflectedDir = normalize({ x: Math.sin(iRad), y: -Math.cos(iRad) })
    drawRay(ctx, hit, reflectedDir, rayLen, RAY_CYAN)
    drawLabel(ctx, 'Total internal reflection!', { x: w * 0.5, y: h - 28 }, 'center')
  }

  drawLabel(ctx, "Snell's Law — Refraction Through Media", { x: w * 0.5, y: 24 }, 'center')
}
