/**
 * View — canvas drawing for Black Hole.
 * Reads model state only; no physics mutations.
 */
import { drawGlow, drawStarfield, fillThemeBackground, SCENE, strokeWithGlow } from '../shared/canvasTheme'
import {
  collapseRadius,
  eventHorizonRadius,
  phaseLabel,
  photonPaths,
  type BlackHoleState,
} from './model'

export function drawBlackHole(ctx: CanvasRenderingContext2D, w: number, h: number, state: BlackHoleState) {
  fillThemeBackground(ctx, w, h, 'space')
  drawStarfield(ctx, w, h, 42, 90)

  const cx = w * 0.5
  const cy = h * 0.5

  if (state.phase === 'collapse') {
    const r = collapseRadius(state.collapseProgress) * 70
    drawGlow(ctx, cx, cy, r + 50, '#ff8a65', 0.35 + state.collapseProgress * 0.25)
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r + 40)
    g.addColorStop(0, '#fff8e1')
    g.addColorStop(0.2, '#ff8a65')
    g.addColorStop(0.5, '#d32f2f')
    g.addColorStop(0.8, 'rgba(80,20,20,0.5)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, r + 40, 0, Math.PI * 2)
    ctx.fill()

    if (state.collapseProgress > 0.5) {
      const bhR = eventHorizonRadius() * (state.collapseProgress - 0.5) * 2
      ctx.fillStyle = '#000'
      ctx.beginPath()
      ctx.arc(cx, cy, bhR, 0, Math.PI * 2)
      ctx.fill()
    }
  } else {
    const ehR = eventHorizonRadius()
    const diskR = ehR * 2.8
    drawGlow(ctx, cx, cy, diskR * 0.9, SCENE.space.hot, 0.22)
    const disk = ctx.createRadialGradient(cx, cy, ehR, cx, cy, diskR)
    disk.addColorStop(0, 'rgba(255,160,60,0)')
    disk.addColorStop(0.3, 'rgba(255,130,50,0.65)')
    disk.addColorStop(0.6, 'rgba(160,80,220,0.4)')
    disk.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = disk
    ctx.beginPath()
    ctx.ellipse(cx, cy, diskR, diskR * 0.32, 0, 0, Math.PI * 2)
    ctx.fill()

    const paths = photonPaths(cx, cy, state.bendTime)
    paths.forEach((p, i) => {
      const pulse = 0.5 + 0.5 * Math.sin(state.bendTime * 3 + i)
      const color = p.captured
        ? `rgba(255,100,80,${0.5 + pulse * 0.4})`
        : `rgba(120,220,255,${0.45 + pulse * 0.35})`
      const width = p.captured ? 2.5 : 1.5
      strokeWithGlow(
        ctx,
        () => {
          ctx.beginPath()
          ctx.moveTo(p.startX, p.startY)
          ctx.bezierCurveTo(p.cp1X, p.cp1Y, p.cp2X, p.cp2Y, p.endX, p.endY)
        },
        color,
        width,
        p.captured ? 'rgba(255,100,80,0.35)' : SCENE.space.glow,
      )
    })

    ctx.fillStyle = '#000'
    ctx.beginPath()
    ctx.arc(cx, cy, ehR, 0, Math.PI * 2)
    ctx.fill()
    strokeWithGlow(
      ctx,
      () => {
        ctx.beginPath()
        ctx.arc(cx, cy, ehR + 1.5, 0, Math.PI * 2)
      },
      'rgba(255,200,100,0.75)',
      2,
      SCENE.space.hot,
    )
  }

  ctx.fillStyle = 'rgba(15,23,42,0.88)'
  ctx.fillRect(16, 16, 220, 36)
  ctx.fillStyle = '#e2e8f0'
  ctx.font = '600 13px Roboto, sans-serif'
  ctx.fillText(phaseLabel(state.phase), 28, 38)
}
