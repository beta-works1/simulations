import { clearThemedScene } from '../../sims/shared/drawHelpers'
import { drawHint, drawLabelPill, drawValueChip } from '../../sims/shared/labels'
import type { GuideTarget } from './guide'
import {
  SUBSTANCES,
  categoryLabel,
  expectedIndicatorHint,
  indicatorColor,
  litmusStripColor,
  phCategory,
  type LabState,
} from './model'

export type LabHit =
  | `sub-${string}`
  | 'beaker'
  | 'litmus'
  | 'meter'
  | 'empty'
  | null

export type Box = { x: number; y: number; w: number; h: number }

export type LabLayout = {
  shelf: Box[]
  beaker: Box
  litmus: Box
  meter: Box
  emptyBtn: Box
  coach: Box
  litmusKey: Box
}

function inBox(pt: { x: number; y: number }, b: Box) {
  return pt.x >= b.x && pt.x <= b.x + b.w && pt.y >= b.y && pt.y <= b.y + b.h
}

export function buildLayout(w: number, h: number): LabLayout {
  const pad = 10
  const n = SUBSTANCES.length
  const gap = Math.max(4, Math.min(7, (w - pad * 2) / (n * 12)))
  const shelfY = pad + 2

  const maxBottleW = (w - pad * 2 - gap * (n - 1) - 72) / n
  const bottleW = Math.min(54, Math.max(34, maxBottleW))
  const bottleH = Math.min(62, Math.max(46, h * 0.12))
  const totalW = n * bottleW + (n - 1) * gap
  const startX = (w - totalW) / 2
  const shelf = SUBSTANCES.map((_, i) => ({
    x: startX + i * (bottleW + gap),
    y: shelfY,
    w: bottleW,
    h: bottleH,
  }))

  const emptyBtn: Box = {
    x: w - pad - 66,
    y: pad,
    w: 66,
    h: 26,
  }

  const workTop = shelfY + bottleH + 30
  const benchTop = h * 0.84

  const beakerW = Math.min(118, w * 0.24)
  const beakerH = Math.min(145, Math.max(100, benchTop - workTop - 36))
  const beaker: Box = {
    x: w * 0.5 - beakerW / 2,
    y: workTop + Math.max(8, (benchTop - workTop - beakerH) * 0.42),
    w: beakerW,
    h: beakerH,
  }

  const meterW = Math.min(108, Math.max(72, beaker.x - pad - 10))
  const meter: Box = {
    x: pad,
    y: beaker.y + beakerH * 0.12,
    w: meterW,
    h: 74,
  }

  const litmusW = 24
  const litmusH = 86
  const rightSpace = w - (beaker.x + beaker.w)
  let litmus: Box
  let litmusKey: Box

  if (rightSpace >= litmusW + 24) {
    litmus = {
      x: beaker.x + beaker.w + Math.min(20, rightSpace * 0.35),
      y: beaker.y + 10,
      w: litmusW,
      h: litmusH,
    }
    litmusKey = { x: 0, y: 0, w: 0, h: 0 }
  } else {
    litmus = {
      x: beaker.x + beaker.w * 0.55,
      y: Math.min(benchTop - litmusH - 8, beaker.y + beaker.h + 22),
      w: litmusW,
      h: litmusH,
    }
    litmusKey = { x: 0, y: 0, w: 0, h: 0 }
  }

  // Guide lives in the sidebar — keep coach box zero-sized on canvas.
  const coach: Box = { x: 0, y: h, w: 0, h: 0 }

  return { shelf, beaker, litmus, meter, emptyBtn, coach, litmusKey }
}

export function hitTestLab(pt: { x: number; y: number }, layout: LabLayout): LabHit {
  if (inBox(pt, layout.emptyBtn)) return 'empty'
  if (inBox(pt, layout.litmus)) return 'litmus'
  if (inBox(pt, layout.meter)) return 'meter'
  if (inBox(pt, layout.beaker)) return 'beaker'
  for (let i = 0; i < layout.shelf.length; i++) {
    if (inBox(pt, layout.shelf[i])) return `sub-${SUBSTANCES[i].id}`
  }
  return null
}

export function isOverBeaker(
  pt: { x: number; y: number },
  beaker: Box,
  pad = 20,
): boolean {
  return (
    pt.x >= beaker.x - pad &&
    pt.x <= beaker.x + beaker.w + pad &&
    pt.y >= beaker.y - pad &&
    pt.y <= beaker.y + beaker.h + pad
  )
}

function padInset(w: number): number {
  return Math.max(10, w * 0.02)
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function drawPulse(ctx: CanvasRenderingContext2D, box: Box, time: number) {
  const pulse = 0.35 + 0.35 * Math.sin(time * 3.2)
  ctx.save()
  ctx.strokeStyle = `rgba(45, 212, 191, ${0.35 + pulse})`
  ctx.lineWidth = 3
  ctx.setLineDash([6, 5])
  roundRect(ctx, box.x - 6, box.y - 6, box.w + 12, box.h + 12, 12)
  ctx.stroke()
  ctx.restore()
}

function drawBottle(
  ctx: CanvasRenderingContext2D,
  box: Box,
  color: string,
  label: string,
  highlight: boolean,
) {
  const { x, y, w, h } = box
  const neckW = w * 0.35
  const neckH = h * 0.22
  const bodyY = y + neckH

  ctx.save()
  if (highlight) {
    ctx.shadowColor = 'rgba(45, 212, 191, 0.55)'
    ctx.shadowBlur = 14
  }

  ctx.fillStyle = 'rgba(220,230,240,0.55)'
  ctx.fillRect(x + (w - neckW) / 2, y, neckW, neckH)

  roundRect(ctx, x + 4, bodyY, w - 8, h - neckH, 10)
  const g = ctx.createLinearGradient(x, bodyY, x, y + h)
  g.addColorStop(0, color)
  g.addColorStop(1, 'rgba(20,30,40,0.35)')
  ctx.fillStyle = g
  ctx.fill()
  ctx.strokeStyle = highlight ? '#2dd4bf' : 'rgba(255,255,255,0.35)'
  ctx.lineWidth = highlight ? 2.5 : 1.5
  ctx.stroke()
  ctx.restore()

  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.font = `600 ${Math.max(8, Math.min(10, w * 0.18))}px Space Grotesk, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  const compact = w < 52
  const shortNames: Record<string, string> = {
    'HCl (acid)': 'HCl',
    Vinegar: 'Vinegar',
    'Lemon juice': 'Lemon',
    Water: 'Water',
    Soap: 'Soap',
    'NaOH (base)': 'NaOH',
  }
  const display = compact ? shortNames[label] ?? label.split(' ')[0] ?? label : shortNames[label] ?? label
  ctx.fillText(display, x + w / 2, y + h + 4)
}

function drawBeaker(
  ctx: CanvasRenderingContext2D,
  box: Box,
  state: LabState,
  highlight: boolean,
) {
  const { x, y, w, h } = box
  const fillFrac = Math.min(1, state.volume / 100)
  const liquidTop = y + h * 0.18 + (1 - fillFrac) * h * 0.7

  ctx.save()
  roundRect(ctx, x, y + h * 0.08, w, h * 0.88, 14)
  ctx.fillStyle = 'rgba(200, 220, 240, 0.12)'
  ctx.fill()
  ctx.strokeStyle = highlight ? '#2dd4bf' : 'rgba(255,255,255,0.45)'
  ctx.lineWidth = highlight ? 3 : 2
  ctx.stroke()

  if (fillFrac > 0.02) {
    ctx.save()
    roundRect(ctx, x + 3, y + h * 0.08, w - 6, h * 0.88, 12)
    ctx.clip()
    const color = indicatorColor(state.indicator, state.displayPh)
    const swirl = state.mixing ? Math.sin(state.time * 10) * 4 : 0
    ctx.fillStyle = color
    ctx.globalAlpha = state.indicator === 'phenolphthalein' && state.displayPh < 8.2 ? 0.35 : 0.82
    ctx.fillRect(x, liquidTop + swirl, w, y + h - liquidTop)
    if (state.mixing) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'
      ctx.lineWidth = 2
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.ellipse(
          x + w / 2,
          liquidTop + 12 + i * 10,
          w * 0.28 * (1 - state.mixProgress) + i * 4,
          4,
          0,
          0,
          Math.PI * 2,
        )
        ctx.stroke()
      }
    }
    ctx.restore()
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.25)'
  ctx.lineWidth = 1
  for (let i = 1; i <= 4; i++) {
    const ty = y + h * 0.2 + i * h * 0.15
    ctx.beginPath()
    ctx.moveTo(x + 8, ty)
    ctx.lineTo(x + 22, ty)
    ctx.stroke()
  }
  ctx.restore()
  drawLabelPill(ctx, 'Beaker', x + w / 2, y + h + 10, { fontSize: 10, bold: true })
}

function drawLitmusStrip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  dipOffset: number,
  highlight: boolean,
) {
  ctx.save()
  if (highlight) {
    ctx.shadowColor = 'rgba(45, 212, 191, 0.5)'
    ctx.shadowBlur = 10
  }
  roundRect(ctx, x, y + dipOffset, w, h - dipOffset * 0.4, 4)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = highlight ? '#2dd4bf' : 'rgba(255,255,255,0.4)'
  ctx.lineWidth = highlight ? 2 : 1.5
  ctx.stroke()
  ctx.fillStyle = 'rgba(80,90,100,0.9)'
  ctx.fillRect(x - 4, y + dipOffset - 8, w + 8, 10)
  ctx.restore()
}

function drawLitmusDock(ctx: CanvasRenderingContext2D, box: Box) {
  const { x, y, w, h } = box
  roundRect(ctx, x, y, w, h, 4)
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)'
  ctx.lineWidth = 1.5
  ctx.setLineDash([4, 4])
  ctx.stroke()
  ctx.setLineDash([])
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.fill()
}

function drawLitmus(
  ctx: CanvasRenderingContext2D,
  box: Box,
  state: LabState,
  highlight: boolean,
  dragging: boolean,
) {
  if (dragging) {
    drawLitmusDock(ctx, box)
    drawLabelPill(ctx, 'Drag into beaker', box.x + box.w / 2, box.y + box.h + 14, {
      fontSize: 9,
    })
    return
  }

  const dipped = state.litmusDipped
  const oy = dipped ? 36 : 0
  const color = litmusStripColor(state.displayPh, state.litmusWet)
  drawLitmusStrip(ctx, box.x, box.y, box.w, box.h, color, oy, highlight)

  drawLabelPill(
    ctx,
    state.litmusWet ? 'Wet' : 'Drag to dip',
    box.x + box.w / 2,
    box.y + box.h + 28,
    { fontSize: 8 },
  )
}

function drawLitmusDrag(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  state: LabState,
  overBeaker: boolean,
) {
  const w = 28
  const h = 100
  const x = pos.x - w / 2
  const y = pos.y - h * 0.35
  const previewWet = overBeaker && state.volume >= 1
  const dipOffset = previewWet ? 36 : overBeaker ? 18 : 0
  const color = previewWet
    ? litmusStripColor(state.displayPh, true)
    : litmusStripColor(state.displayPh, false)

  ctx.save()
  ctx.globalAlpha = 0.92
  drawLitmusStrip(ctx, x, y, w, h, color, dipOffset, true)
  ctx.restore()

  if (overBeaker && state.volume >= 1) {
    drawHint(ctx, 'Release to dip litmus', pos.x, pos.y + 58, 800, 600)
  } else if (overBeaker) {
    drawHint(ctx, 'Beaker is empty — pour liquid first', pos.x, pos.y + 58, 800, 600)
  } else {
    drawHint(ctx, 'Drop into the beaker', pos.x, pos.y + 58, 800, 600)
  }
}

function drawMeter(ctx: CanvasRenderingContext2D, box: Box, state: LabState) {
  const { x, y, w, h } = box
  roundRect(ctx, x, y, w, h, 12)
  ctx.fillStyle = 'rgba(12, 22, 34, 0.92)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(45, 212, 191, 0.45)'
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = 'rgba(148, 163, 184, 0.95)'
  ctx.font = '600 10px Space Grotesk, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('DIGITAL pH', x + 12, y + 10)

  const shown = state.volume < 0.5 ? '—' : state.displayPh.toFixed(1)
  ctx.fillStyle = '#5eead4'
  ctx.font = '700 28px Space Grotesk, sans-serif'
  ctx.fillText(shown, x + 12, y + 28)

  const cat = state.volume < 0.5 ? 'Empty' : categoryLabel(phCategory(state.displayPh))
  ctx.fillStyle = 'rgba(226, 232, 240, 0.85)'
  ctx.font = '600 12px Space Grotesk, sans-serif'
  ctx.fillText(cat, x + 12, y + 62)
}

function drawLitmusKey(ctx: CanvasRenderingContext2D, box: Box) {
  if (box.w < 90) return
  roundRect(ctx, box.x, box.y, box.w, box.h, 10)
  ctx.fillStyle = 'rgba(12, 22, 34, 0.88)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.2)'
  ctx.stroke()

  ctx.fillStyle = '#fff'
  ctx.font = '700 11px Space Grotesk, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('Litmus guide', box.x + 10, box.y + 10)

  const rows: { color: string; label: string }[] = [
    { color: 'rgb(220, 55, 70)', label: 'Red → Acid' },
    { color: 'rgb(55, 90, 210)', label: 'Blue → Base' },
    { color: 'rgb(180, 120, 160)', label: 'Muted → Neutral' },
  ]
  rows.forEach((row, i) => {
    const yy = box.y + 32 + i * 26
    roundRect(ctx, box.x + 10, yy, 16, 16, 3)
    ctx.fillStyle = row.color
    ctx.fill()
    ctx.fillStyle = 'rgba(226,232,240,0.95)'
    ctx.font = '600 11px Space Grotesk, sans-serif'
    ctx.fillText(row.label, box.x + 34, yy + 2)
  })
}

export function drawPhLaboratory(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  state: LabState,
  layout: LabLayout,
  hover: LabHit,
  dragId: string | null,
  dragPos: { x: number; y: number } | null,
  litmusDragPos: { x: number; y: number } | null,
  guide: { title: string; body: string; litmusTip?: string; target: GuideTarget },
) {
  clearThemedScene(ctx, w, h, 'lab')

  const benchTop = h * 0.84
  ctx.fillStyle = 'rgba(30, 45, 60, 0.55)'
  ctx.fillRect(0, benchTop, w, h - benchTop)
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.fillRect(0, benchTop, w, 3)

  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.fillRect(padInset(w), layout.shelf[0].y + layout.shelf[0].h + 18, w - padInset(w) * 2, 5)

  if (guide.target === 'shelf-acid') {
    SUBSTANCES.forEach((sub, i) => {
      if (sub.kind === 'acid') drawPulse(ctx, layout.shelf[i], state.time)
    })
  } else if (guide.target === 'shelf-base') {
    SUBSTANCES.forEach((sub, i) => {
      if (sub.kind === 'base') drawPulse(ctx, layout.shelf[i], state.time)
    })
  } else if (guide.target === 'litmus') {
    drawPulse(ctx, layout.litmus, state.time)
  } else if (guide.target === 'meter') {
    drawPulse(ctx, layout.meter, state.time)
  } else if (guide.target === 'beaker') {
    drawPulse(ctx, layout.beaker, state.time)
  }

  SUBSTANCES.forEach((sub, i) => {
    const box = layout.shelf[i]
    const dragging = dragId === sub.id
    if (dragging && dragPos) return
    const guided =
      (guide.target === 'shelf-acid' && sub.kind === 'acid') ||
      (guide.target === 'shelf-base' && sub.kind === 'base')
    drawBottle(ctx, box, sub.color, sub.label, hover === `sub-${sub.id}` || guided)
  })

  drawBeaker(
    ctx,
    layout.beaker,
    state,
    hover === 'beaker' ||
      dragId != null ||
      (litmusDragPos != null && isOverBeaker(litmusDragPos, layout.beaker)),
  )
  drawLitmus(
    ctx,
    layout.litmus,
    state,
    hover === 'litmus' || guide.target === 'litmus',
    litmusDragPos != null,
  )
  drawMeter(ctx, layout.meter, state)
  if (layout.litmusKey.w > 0 && layout.litmusKey.h > 0) {
    drawLitmusKey(ctx, layout.litmusKey)
  }

  roundRect(ctx, layout.emptyBtn.x, layout.emptyBtn.y, layout.emptyBtn.w, layout.emptyBtn.h, 8)
  ctx.fillStyle = hover === 'empty' ? 'rgba(45, 212, 191, 0.35)' : 'rgba(255,255,255,0.1)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.3)'
  ctx.stroke()
  ctx.fillStyle = '#fff'
  ctx.font = '600 12px Space Grotesk, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(
    'Empty',
    layout.emptyBtn.x + layout.emptyBtn.w / 2,
    layout.emptyBtn.y + layout.emptyBtn.h / 2,
  )

  if (dragId && dragPos) {
    const sub = SUBSTANCES.find((s) => s.id === dragId)
    if (sub) {
      const ghost: Box = { x: dragPos.x - 30, y: dragPos.y - 40, w: 60, h: 80 }
      drawBottle(ctx, ghost, sub.color, sub.label, true)
      drawHint(ctx, 'Drop into the beaker', dragPos.x, dragPos.y + 50, w, h)
    }
  }

  if (litmusDragPos) {
    drawLitmusDrag(
      ctx,
      litmusDragPos,
      state,
      isOverBeaker(litmusDragPos, layout.beaker),
    )
  }

  if (state.volume >= 1) {
    drawValueChip(
      ctx,
      'Color',
      expectedIndicatorHint(state.indicator, state.displayPh),
      layout.beaker.x + layout.beaker.w / 2,
      layout.beaker.y - 6,
      { fontSize: 11, accent: true },
    )
  }

  if (state.revealed && state.prediction) {
    const ok = state.prediction === phCategory(state.displayPh)
    drawValueChip(
      ctx,
      ok ? '✓' : 'Actual',
      ok ? 'Prediction correct!' : categoryLabel(phCategory(state.displayPh)),
      layout.beaker.x + layout.beaker.w / 2,
      layout.beaker.y - 22,
      { fontSize: 12, accent: true },
    )
  }
}
