/**
 * Lateral brain diagram — PTB Grade 8 Ch 2 (Human Nervous System).
 * Anatomical base + translucent lobe overlays clipped to silhouette.
 */

export type BrainRegionId =
  | 'frontal'
  | 'parietal'
  | 'temporal'
  | 'occipital'
  | 'cerebellum'
  | 'brainstem'

export type BrainPart = 'cerebrum' | 'cerebellum' | 'brainstem'

export type Pt = { x: number; y: number }

export type BrainRegion = {
  id: BrainRegionId
  name: string
  part: BrainPart
  action: string
  detail: string
  examples: string[]
  poly: Pt[]
  fill: string
  fillHover: string
  fillActive: string
  accent: string
}

export type BrainBox = { x: number; y: number; w: number; h: number }

export const BRAIN_PARTS: { id: BrainPart; label: string; note: string }[] = [
  {
    id: 'cerebrum',
    label: 'Cerebrum',
    note: 'Largest part — thinking, memory, voluntary movement, senses',
  },
  {
    id: 'cerebellum',
    label: 'Cerebellum',
    note: '“Little brain” — balance and coordinated movement',
  },
  {
    id: 'brainstem',
    label: 'Brain stem',
    note: 'Connects brain to spinal cord — involuntary actions',
  },
]

export const BRAIN_OUTLINE: Pt[] = [
  { x: 0.12, y: 0.42 },
  { x: 0.16, y: 0.28 },
  { x: 0.28, y: 0.16 },
  { x: 0.42, y: 0.12 },
  { x: 0.55, y: 0.14 },
  { x: 0.68, y: 0.2 },
  { x: 0.78, y: 0.3 },
  { x: 0.84, y: 0.42 },
  { x: 0.86, y: 0.52 },
  { x: 0.82, y: 0.6 },
  { x: 0.74, y: 0.58 },
  { x: 0.7, y: 0.62 },
  { x: 0.78, y: 0.72 },
  { x: 0.76, y: 0.82 },
  { x: 0.68, y: 0.86 },
  { x: 0.6, y: 0.82 },
  { x: 0.56, y: 0.72 },
  { x: 0.52, y: 0.78 },
  { x: 0.48, y: 0.86 },
  { x: 0.42, y: 0.88 },
  { x: 0.4, y: 0.78 },
  { x: 0.38, y: 0.68 },
  { x: 0.32, y: 0.62 },
  { x: 0.22, y: 0.58 },
  { x: 0.14, y: 0.52 },
]

export const BRAIN_REGIONS: BrainRegion[] = [
  {
    id: 'frontal',
    name: 'Frontal lobe',
    part: 'cerebrum',
    action: 'Thinking, planning, and voluntary movement',
    detail:
      'Part of the cerebrum. Controls reasoning, decision-making, and voluntary muscle movements.',
    examples: ['Planning homework', 'Speaking', 'Kicking a ball'],
    fill: 'rgba(231, 76, 60, 0.42)',
    fillHover: 'rgba(231, 76, 60, 0.58)',
    fillActive: 'rgba(231, 76, 60, 0.72)',
    accent: '#e74c3c',
    poly: [
      { x: 0.14, y: 0.4 },
      { x: 0.18, y: 0.26 },
      { x: 0.3, y: 0.16 },
      { x: 0.42, y: 0.14 },
      { x: 0.46, y: 0.22 },
      { x: 0.44, y: 0.42 },
      { x: 0.38, y: 0.52 },
      { x: 0.28, y: 0.56 },
      { x: 0.18, y: 0.5 },
    ],
  },
  {
    id: 'parietal',
    name: 'Parietal lobe',
    part: 'cerebrum',
    action: 'Touch, pain, temperature, and body position',
    detail:
      'Part of the cerebrum. Receives and processes sensory information from the skin and body.',
    examples: ['Feeling heat from a cup', 'Touching a textured surface', 'Knowing where your hand is'],
    fill: 'rgba(52, 152, 219, 0.4)',
    fillHover: 'rgba(52, 152, 219, 0.56)',
    fillActive: 'rgba(52, 152, 219, 0.7)',
    accent: '#3498db',
    poly: [
      { x: 0.46, y: 0.16 },
      { x: 0.58, y: 0.15 },
      { x: 0.68, y: 0.22 },
      { x: 0.7, y: 0.36 },
      { x: 0.62, y: 0.44 },
      { x: 0.5, y: 0.42 },
      { x: 0.44, y: 0.3 },
    ],
  },
  {
    id: 'temporal',
    name: 'Temporal lobe',
    part: 'cerebrum',
    action: 'Hearing, memory, and language',
    detail:
      'Part of the cerebrum. Interprets sounds and helps store and recall memories and language.',
    examples: ['Listening to music', 'Remembering a lesson', 'Understanding speech'],
    fill: 'rgba(230, 160, 60, 0.42)',
    fillHover: 'rgba(230, 160, 60, 0.58)',
    fillActive: 'rgba(230, 160, 60, 0.72)',
    accent: '#e67e22',
    poly: [
      { x: 0.38, y: 0.5 },
      { x: 0.5, y: 0.44 },
      { x: 0.62, y: 0.46 },
      { x: 0.66, y: 0.58 },
      { x: 0.56, y: 0.7 },
      { x: 0.42, y: 0.68 },
      { x: 0.36, y: 0.58 },
    ],
  },
  {
    id: 'occipital',
    name: 'Occipital lobe',
    part: 'cerebrum',
    action: 'Vision — processing what the eyes see',
    detail: 'Part of the cerebrum. Visual centre at the back of the brain; interprets images from the eyes.',
    examples: ['Reading words on a page', 'Recognising colours', 'Catching a moving ball'],
    fill: 'rgba(46, 204, 113, 0.4)',
    fillHover: 'rgba(46, 204, 113, 0.56)',
    fillActive: 'rgba(46, 204, 113, 0.7)',
    accent: '#27ae60',
    poly: [
      { x: 0.7, y: 0.28 },
      { x: 0.8, y: 0.32 },
      { x: 0.86, y: 0.44 },
      { x: 0.84, y: 0.56 },
      { x: 0.74, y: 0.56 },
      { x: 0.68, y: 0.42 },
    ],
  },
  {
    id: 'cerebellum',
    name: 'Cerebellum',
    part: 'cerebellum',
    action: 'Balance and coordinated movement',
    detail:
      'Located behind and below the cerebrum. Coordinates muscle actions and keeps the body balanced.',
    examples: ['Riding a bicycle', 'Writing neatly', 'Standing on one foot'],
    fill: 'rgba(142, 45, 90, 0.45)',
    fillHover: 'rgba(142, 45, 90, 0.6)',
    fillActive: 'rgba(142, 45, 90, 0.75)',
    accent: '#8e2d5a',
    poly: [
      { x: 0.6, y: 0.64 },
      { x: 0.72, y: 0.6 },
      { x: 0.8, y: 0.7 },
      { x: 0.78, y: 0.82 },
      { x: 0.68, y: 0.86 },
      { x: 0.58, y: 0.78 },
    ],
  },
  {
    id: 'brainstem',
    name: 'Brain stem',
    part: 'brainstem',
    action: 'Involuntary actions — breathing and heartbeat',
    detail:
      'Connects the brain to the spinal cord. Controls automatic body processes you do not think about.',
    examples: ['Breathing while asleep', 'Heartbeat', 'Digestion reflexes'],
    fill: 'rgba(217, 90, 90, 0.48)',
    fillHover: 'rgba(217, 90, 90, 0.62)',
    fillActive: 'rgba(217, 90, 90, 0.78)',
    accent: '#d95a5a',
    poly: [
      { x: 0.5, y: 0.7 },
      { x: 0.58, y: 0.68 },
      { x: 0.58, y: 0.86 },
      { x: 0.5, y: 0.9 },
      { x: 0.46, y: 0.82 },
      { x: 0.46, y: 0.72 },
    ],
  },
]

export function mapPt(box: BrainBox, p: Pt): Pt {
  return { x: box.x + p.x * box.w, y: box.y + p.y * box.h }
}

export function pointInPoly(px: number, py: number, poly: Pt[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x
    const yi = poly[i].y
    const xj = poly[j].x
    const yj = poly[j].y
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-9) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function tracePoly(ctx: CanvasRenderingContext2D, box: BrainBox, poly: Pt[]) {
  const first = mapPt(box, poly[0])
  ctx.beginPath()
  ctx.moveTo(first.x, first.y)
  for (let i = 1; i < poly.length; i++) {
    const p = mapPt(box, poly[i])
    ctx.lineTo(p.x, p.y)
  }
  ctx.closePath()
}

function traceOutline(ctx: CanvasRenderingContext2D, box: BrainBox) {
  tracePoly(ctx, box, BRAIN_OUTLINE)
}

function drawBrainIllustration(ctx: CanvasRenderingContext2D, box: BrainBox) {
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.18)'
  ctx.shadowBlur = 14
  ctx.shadowOffsetY = 4
  traceOutline(ctx, box)
  const skin = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h)
  skin.addColorStop(0, '#fceee3')
  skin.addColorStop(0.4, '#e8c4a8')
  skin.addColorStop(1, '#c9956a')
  ctx.fillStyle = skin
  ctx.fill()
  ctx.restore()

  ctx.save()
  traceOutline(ctx, box)
  ctx.clip()

  ctx.strokeStyle = 'rgba(110, 75, 50, 0.32)'
  ctx.lineWidth = 1.2
  ctx.lineCap = 'round'
  const sulci: [Pt, Pt, Pt][] = [
    [{ x: 0.22, y: 0.34 }, { x: 0.32, y: 0.28 }, { x: 0.4, y: 0.36 }],
    [{ x: 0.3, y: 0.48 }, { x: 0.4, y: 0.42 }, { x: 0.5, y: 0.48 }],
    [{ x: 0.48, y: 0.24 }, { x: 0.58, y: 0.28 }, { x: 0.66, y: 0.24 }],
    [{ x: 0.56, y: 0.5 }, { x: 0.64, y: 0.54 }, { x: 0.7, y: 0.48 }],
    [{ x: 0.64, y: 0.7 }, { x: 0.7, y: 0.74 }, { x: 0.74, y: 0.68 }],
  ]
  for (const [a, b, c] of sulci) {
    const pa = mapPt(box, a)
    const pb = mapPt(box, b)
    const pc = mapPt(box, c)
    ctx.beginPath()
    ctx.moveTo(pa.x, pa.y)
    ctx.quadraticCurveTo(pb.x, pb.y, pc.x, pc.y)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(80, 35, 50, 0.28)'
  for (let i = 0; i < 4; i++) {
    const y = 0.64 + i * 0.04
    const p0 = mapPt(box, { x: 0.6, y })
    const p1 = mapPt(box, { x: 0.68, y: y + 0.012 })
    const p2 = mapPt(box, { x: 0.76, y })
    ctx.beginPath()
    ctx.moveTo(p0.x, p0.y)
    ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y)
    ctx.stroke()
  }
  ctx.restore()

  traceOutline(ctx, box)
  ctx.strokeStyle = '#5c4030'
  ctx.lineWidth = 2.2
  ctx.lineJoin = 'round'
  ctx.stroke()
}

export function regionCentroid(box: BrainBox, region: BrainRegion): Pt {
  let sx = 0
  let sy = 0
  for (const p of region.poly) {
    sx += p.x
    sy += p.y
  }
  const n = region.poly.length
  return mapPt(box, { x: sx / n, y: sy / n })
}

export function drawAnatomicalBrain(
  ctx: CanvasRenderingContext2D,
  box: BrainBox,
  opts: {
    selected: BrainRegionId
    hover: BrainRegionId | null
    showLabels: boolean
    showParts: boolean
    pulse: number
    feedback: 'correct' | 'wrong' | null
  },
) {
  drawBrainIllustration(ctx, box)

  ctx.save()
  traceOutline(ctx, box)
  ctx.clip()

  for (const r of BRAIN_REGIONS) {
    const active = opts.selected === r.id
    const hover = opts.hover === r.id
    tracePoly(ctx, box, r.poly)
    ctx.fillStyle = active ? r.fillActive : hover ? r.fillHover : r.fill
    ctx.fill()

    if (active || hover) {
      tracePoly(ctx, box, r.poly)
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'
      ctx.lineWidth = active ? 2.4 : 1.8
      ctx.stroke()
    }

    if (active) {
      const glow = 0.25 + 0.15 * Math.sin(opts.pulse * 3.5)
      ctx.save()
      ctx.shadowColor = `rgba(255,255,255,${glow})`
      ctx.shadowBlur = 14
      tracePoly(ctx, box, r.poly)
      ctx.strokeStyle = r.accent
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.restore()
    }
  }

  ctx.restore()

  traceOutline(ctx, box)
  ctx.strokeStyle = '#3d2a1f'
  ctx.lineWidth = 2
  ctx.stroke()

  if (opts.showParts) {
    drawPartBrackets(ctx, box)
  }

  if (opts.showLabels) {
    for (const r of BRAIN_REGIONS) {
      const show = r.id === opts.selected || r.id === opts.hover
      if (!show) continue
      const c = regionCentroid(box, r)
      ctx.font = '600 10px Roboto, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      const tw = ctx.measureText(r.name).width
      const pad = 6
      ctx.fillStyle = 'rgba(255,255,255,0.94)'
      roundRect(ctx, c.x - tw / 2 - pad, c.y - 9, tw + pad * 2, 18, 6)
      ctx.fill()
      ctx.strokeStyle = r.accent
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.fillStyle = '#1a252f'
      ctx.fillText(r.name, c.x, c.y + 0.5)
    }
  }

  if (opts.feedback) {
    ctx.save()
    ctx.fillStyle =
      opts.feedback === 'correct' ? 'rgba(39,174,96,0.18)' : 'rgba(231,76,60,0.18)'
    ctx.fillRect(box.x - 8, box.y - 8, box.w + 16, box.h + 16)
    ctx.restore()
  }
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

function drawPartBrackets(ctx: CanvasRenderingContext2D, box: BrainBox) {
  ctx.save()
  ctx.strokeStyle = 'rgba(44,62,80,0.35)'
  ctx.fillStyle = 'rgba(44,62,80,0.75)'
  ctx.lineWidth = 1.2
  ctx.font = '500 10px Roboto, sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'

  ctx.strokeRect(box.x + box.w * 0.1, box.y + box.h * 0.06, box.w * 0.78, box.h * 0.52)
  ctx.fillText('Cerebrum', box.x + box.w * 0.48 - 24, box.y + box.h * 0.08)

  ctx.fillStyle = 'rgba(44,62,80,0.65)'
  ctx.font = '500 9px Roboto, sans-serif'
  ctx.fillText('Cerebellum', box.x + box.w * 0.72, box.y + box.h * 0.92)
  ctx.fillText('Brain stem', box.x + box.w * 0.38, box.y + box.h * 0.97)
  ctx.restore()
}

export function hitTestBrainRegion(box: BrainBox, px: number, py: number): BrainRegionId | null {
  for (let i = BRAIN_REGIONS.length - 1; i >= 0; i--) {
    const r = BRAIN_REGIONS[i]
    const mapped = r.poly.map((p) => mapPt(box, p))
    if (pointInPoly(px, py, mapped)) return r.id
  }
  return null
}
