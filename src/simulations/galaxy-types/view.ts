/**
 * View — canvas drawing for Galaxy Types.
 * Reads model state only; no physics mutations.
 */
import { roundRect } from '../../sims/shared/drawHelpers'
import { drawGlow, drawStarfield, fillThemeBackground, SCENE } from '../shared/canvasTheme'
import { drawCaptionCard, wrapCanvasText } from '../shared/drawUtils'
import {
  galaxyById,
  GALAXIES,
  type GalaxyTypesState,
} from './model'

function drawSpiralGalaxy(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rotDeg: number,
  scale: number,
) {
  const rot = (rotDeg * Math.PI) / 180
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rot)

  drawGlow(ctx, 0, 0, 28 * scale, SCENE.space.hot, 0.3)
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, 22 * scale)
  core.addColorStop(0, '#fff8e1')
  core.addColorStop(0.5, '#ffd54f')
  core.addColorStop(1, 'rgba(255,180,50,0)')
  ctx.fillStyle = core
  ctx.beginPath()
  ctx.arc(0, 0, 22 * scale, 0, Math.PI * 2)
  ctx.fill()

  for (let arm = 0; arm < 2; arm++) {
    ctx.strokeStyle = `rgba(180,200,255,${0.35 + arm * 0.1})`
    ctx.lineWidth = 14 * scale
    ctx.beginPath()
    for (let t = 0; t <= 1; t += 0.02) {
      const angle = t * Math.PI * 3 + arm * Math.PI
      const r = (8 + t * 55) * scale
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r * 0.55
      if (t === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  for (let i = 0; i < 120; i++) {
    const angle = ((i * 137.5) / 180) * Math.PI
    const r = ((i % 20) / 20) * 60 * scale + 5
    const x = Math.cos(angle) * r
    const y = Math.sin(angle) * r * 0.55
    ctx.fillStyle = `rgba(255,255,255,${0.3 + (i % 5) / 10})`
    ctx.beginPath()
    ctx.arc(x, y, 0.8 + (i % 3) * 0.4, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function drawEllipticalGalaxy(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50 * scale)
  g.addColorStop(0, '#ffe082')
  g.addColorStop(0.4, '#bcaaa4')
  g.addColorStop(0.75, '#6d4c41')
  g.addColorStop(1, 'rgba(40,30,25,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(cx, cy, 55 * scale, 35 * scale, 0.3, 0, Math.PI * 2)
  ctx.fill()

  for (let i = 0; i < 80; i++) {
    const t = i / 80
    const angle = t * Math.PI * 2
    const r = 15 + (i % 12) * 3
    const x = cx + Math.cos(angle) * r * scale
    const y = cy + Math.sin(angle) * r * 0.65 * scale
    ctx.fillStyle = `rgba(255,240,220,${0.25 + (i % 4) / 8})`
    ctx.beginPath()
    ctx.arc(x, y, 0.7, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawIrregularGalaxy(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number) {
  const blobs = [
    { dx: -20, dy: -10, r: 28, c: '#7986cb' },
    { dx: 25, dy: 5, r: 22, c: '#ef5350' },
    { dx: -5, dy: 22, r: 18, c: '#ffb74d' },
    { dx: 15, dy: -25, r: 15, c: '#81c784' },
  ]
  blobs.forEach((b) => {
    const g = ctx.createRadialGradient(cx + b.dx * scale, cy + b.dy * scale, 0, cx + b.dx * scale, cy + b.dy * scale, b.r * scale)
    g.addColorStop(0, b.c)
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx + b.dx * scale, cy + b.dy * scale, b.r * scale, 0, Math.PI * 2)
    ctx.fill()
  })
  for (let i = 0; i < 60; i++) {
    const x = cx + (((i * 4321) % 100) / 100 - 0.5) * 90 * scale
    const y = cy + (((i * 8765) % 100) / 100 - 0.5) * 60 * scale
    ctx.fillStyle = `rgba(255,255,255,${0.3 + (i % 5) / 10})`
    ctx.beginPath()
    ctx.arc(x, y, 1, 0, Math.PI * 2)
    ctx.fill()
  }
}

export type GalaxyHitRegion = {
  id: GalaxyType
  x: number
  y: number
  w: number
  h: number
}

/** Hit regions for tap-to-select (wide: columns; narrow: thumbnail strip). */
export function galaxyHitRegions(w: number, h: number): GalaxyHitRegion[] {
  const cardH = Math.max(64, 62)
  const cardTop = h - cardH - 8
  if (w > 520) {
    const third = w / 3
    const regionH = Math.max(40, cardTop - 28)
    return GALAXIES.map((g, i) => ({
      id: g.id,
      x: third * i + 8,
      y: 12,
      w: third - 16,
      h: regionH,
    }))
  }
  const stripY = Math.max(8, cardTop - 56)
  const cellW = (w - 32) / 3
  return GALAXIES.map((g, i) => ({
    id: g.id,
    x: 16 + i * cellW,
    y: stripY,
    w: cellW - 6,
    h: 44,
  }))
}

export function hitTestGalaxy(
  pt: { x: number; y: number },
  w: number,
  h: number,
): GalaxyType | null {
  for (const r of galaxyHitRegions(w, h)) {
    if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h) return r.id
  }
  return null
}

export function drawGalaxyTypes(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: GalaxyTypesState,
) {
  fillThemeBackground(ctx, w, h, 'space')
  drawStarfield(ctx, w, h, 77, 100)

  const info = galaxyById(state.selected)
  ctx.font = '12px Roboto, sans-serif'
  // Reserve space for caption so labels never sit on the card
  const descProbe = wrapCanvasText(ctx, info.description, w - 56, 2)
  const cardH = Math.max(64, 28 + 18 + descProbe.length * 16)
  const cardTop = h - cardH - 8

  const compareAll = w > 520
  if (compareAll) {
    const third = w / 3
    const vizCy = Math.min(h * 0.42, cardTop * 0.5)
    drawSpiralGalaxy(ctx, third * 0.5, vizCy, state.rotation, 0.9)
    drawEllipticalGalaxy(ctx, third * 1.5, vizCy, 0.9)
    drawIrregularGalaxy(ctx, third * 2.5, vizCy, 0.9)

    ctx.font = '600 11px Roboto, sans-serif'
    ctx.textAlign = 'center'
    GALAXIES.forEach((g, i) => {
      ctx.fillStyle = g.id === state.selected ? '#38bdf8' : '#64748b'
      ctx.fillText(g.label, third * (i + 0.5), cardTop - 14)
    })
    ctx.textAlign = 'left'

    const hi = GALAXIES.findIndex((g) => g.id === state.selected)
    ctx.strokeStyle = 'rgba(56,189,248,0.5)'
    ctx.strokeRect(third * hi + 8, 12, third - 16, Math.max(40, cardTop - 28))
  } else {
    const cx = w * 0.5
    const cy = Math.min(h * 0.38, cardTop * 0.42)
    if (state.selected === 'spiral') drawSpiralGalaxy(ctx, cx, cy, state.rotation, 1.0)
    else if (state.selected === 'elliptical') drawEllipticalGalaxy(ctx, cx, cy, 1.0)
    else drawIrregularGalaxy(ctx, cx, cy, 1.0)

    // Thumbnail strip for tap-to-select on narrow layouts
    const regions = galaxyHitRegions(w, h)
    regions.forEach((r) => {
      const active = r.id === state.selected
      ctx.fillStyle = active ? 'rgba(56,189,248,0.22)' : 'rgba(15,23,42,0.55)'
      ctx.strokeStyle = active ? 'rgba(56,189,248,0.7)' : 'rgba(100,116,139,0.45)'
      ctx.lineWidth = 1.5
      roundRect(ctx, r.x, r.y, r.w, r.h, 6)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = active ? '#38bdf8' : '#94a3b8'
      ctx.font = '600 11px Roboto, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(galaxyById(r.id).label, r.x + r.w / 2, r.y + r.h / 2 + 4)
    })
    ctx.textAlign = 'left'
  }

  drawCaptionCard(ctx, w, h, info.label, info.description)
}
