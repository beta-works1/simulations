/**
 * View — canvas drawing for Regular vs Diffuse Reflection.
 * Reads model state only; no physics mutations.
 */
import { withShadow } from '../shared/canvasTheme'
import {
  RAY_CYAN,
  RAY_YELLOW,
  MIRROR_COLOR,
  clearCanvas,
  drawGlow,
  drawLabel,
  drawRay,
  normalize,
  type Vec2,
} from '../shared/drawUtils'
import {
  type RegularVsDiffuseState,
  type SurfaceType,
} from './model'

function seededScatter(i: number, surface: SurfaceType): number {
  if (surface === 'regular') return 0
  const seeds = [-22, 18, -14, 26, -8, 12, -28, 20, -16, 10]
  return (seeds[i % seeds.length] * Math.PI) / 180
}

export function drawRegularVsDiffuse(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: RegularVsDiffuseState,
) {
  clearCanvas(ctx, w, h, 'optics')

  const surfaceY = h * 0.68
  const surfaceX1 = w * 0.1
  const surfaceX2 = w * 0.9
  const rayLen = h * 0.38
  const spacing = (surfaceX2 - surfaceX1) / (state.rayCount + 1)

  const isSmooth = state.surface === 'regular'

  if (isSmooth) {
    withShadow(
      ctx,
      () => {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.25)'
        ctx.fillRect(surfaceX1, surfaceY, surfaceX2 - surfaceX1, h - surfaceY)
      },
      { blur: 12, color: 'rgba(226, 232, 240, 0.38)', oy: 4 },
    )
    withShadow(
      ctx,
      () => {
        ctx.strokeStyle = MIRROR_COLOR
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(surfaceX1, surfaceY)
        ctx.lineTo(surfaceX2, surfaceY)
        ctx.stroke()
      },
      { blur: 8, color: 'rgba(255, 255, 255, 0.4)', oy: 1 },
    )
  } else {
    withShadow(
      ctx,
      () => {
        ctx.fillStyle = 'rgba(71, 85, 105, 0.38)'
        ctx.fillRect(surfaceX1, surfaceY, surfaceX2 - surfaceX1, h - surfaceY)
      },
      { blur: 10, color: 'rgba(100, 116, 139, 0.35)', oy: 3 },
    )
    withShadow(
      ctx,
      () => {
        ctx.strokeStyle = '#94a3b8'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.beginPath()
        for (let x = surfaceX1; x <= surfaceX2; x += 6) {
          const bump = Math.sin(x * 0.08) * 4 + Math.sin(x * 0.23) * 2
          if (x === surfaceX1) ctx.moveTo(x, surfaceY + bump)
          else ctx.lineTo(x, surfaceY + bump)
        }
        ctx.stroke()
      },
      { blur: 4, color: 'rgba(148, 163, 184, 0.3)', oy: 1 },
    )
  }

  const theta = (state.incidenceDeg * Math.PI) / 180
  const incidentDir = normalize({ x: Math.sin(theta), y: Math.cos(theta) })

  for (let i = 0; i < state.rayCount; i++) {
    const hitX = surfaceX1 + spacing * (i + 1)
    const hit: Vec2 = { x: hitX, y: surfaceY }
    const incidentFrom: Vec2 = {
      x: hitX - incidentDir.x * rayLen,
      y: surfaceY - incidentDir.y * rayLen,
    }

    drawGlow(ctx, incidentFrom.x, incidentFrom.y, 14, RAY_YELLOW, 0.35)
    drawRay(ctx, incidentFrom, incidentDir, rayLen, RAY_YELLOW, 2)

    const outAngle = theta + seededScatter(i, state.surface)
    const reflectDir = normalize({
      x: Math.sin(outAngle),
      y: -Math.cos(outAngle),
    })
    drawRay(ctx, hit, reflectDir, rayLen * 0.85, RAY_CYAN, 2)
  }

  const title =
    state.surface === 'regular'
      ? 'Regular (specular) reflection — parallel rays stay parallel'
      : 'Diffuse reflection — rays scatter in many directions'
  drawLabel(ctx, title, { x: w * 0.5, y: 28 }, 'center')
  drawLabel(
    ctx,
    isSmooth ? 'Smooth surface' : 'Rough surface',
    { x: w * 0.5, y: surfaceY + 28 },
    'center',
  )
}
