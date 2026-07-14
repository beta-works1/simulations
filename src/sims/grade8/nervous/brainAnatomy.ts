/**
 * Lateral brain — regions tile inside one smooth silhouette (shared edges, no gaps).
 */

export type BrainRegionId =
  | 'frontal'
  | 'parietal'
  | 'temporal'
  | 'occipital'
  | 'cerebellum'
  | 'brainstem'

export type Pt = { x: number; y: number }

export type BrainRegion = {
  id: BrainRegionId
  name: string
  action: string
  /** Closed loop of anchor points (shared with neighbours). */
  ring: Pt[]
  fill: string
  fillHover: string
  fillActive: string
  attach: Pt
  labelSide: 'left' | 'right' | 'top' | 'bottom'
}

export type BrainBox = { x: number; y: number; w: number; h: number }

export function mapPt(box: BrainBox, p: Pt): Pt {
  return { x: box.x + p.x * box.w, y: box.y + p.y * box.h }
}

/** Outer profile — front = left. Single smooth closed loop. */
export const BRAIN_OUTLINE_RING: Pt[] = [
  { x: 0.11, y: 0.5 },
  { x: 0.13, y: 0.3 },
  { x: 0.24, y: 0.13 },
  { x: 0.42, y: 0.09 },
  { x: 0.58, y: 0.09 },
  { x: 0.72, y: 0.13 },
  { x: 0.82, y: 0.24 },
  { x: 0.87, y: 0.4 },
  { x: 0.85, y: 0.52 },
  { x: 0.78, y: 0.6 },
  { x: 0.8, y: 0.72 },
  { x: 0.72, y: 0.84 },
  { x: 0.6, y: 0.8 },
  { x: 0.52, y: 0.92 },
  { x: 0.44, y: 0.92 },
  { x: 0.4, y: 0.78 },
  { x: 0.28, y: 0.68 },
  { x: 0.17, y: 0.6 },
]

/** Internal anchors — every divider endpoint is reused by two regions. */
const A = {
  fpTop: { x: 0.45, y: 0.14 },
  fpMid: { x: 0.45, y: 0.34 },
  ftLow: { x: 0.26, y: 0.54 },
  poTop: { x: 0.62, y: 0.18 },
  poMid: { x: 0.68, y: 0.34 },
  ocMid: { x: 0.74, y: 0.46 },
  otMid: { x: 0.6, y: 0.54 },
  tcMid: { x: 0.52, y: 0.64 },
  cbIn: { x: 0.58, y: 0.72 },
  bsTop: { x: 0.44, y: 0.7 },
} as const

export const BRAIN_REGIONS: BrainRegion[] = [
  {
    id: 'frontal',
    name: 'Frontal lobe',
    action: 'Planning, decisions, voluntary movement, speech',
    fill: '#e89b8c',
    fillHover: '#f0b0a4',
    fillActive: '#d97768',
    attach: { x: 0.26, y: 0.28 },
    labelSide: 'left',
    ring: [
      { x: 0.11, y: 0.5 },
      { x: 0.13, y: 0.3 },
      { x: 0.24, y: 0.13 },
      A.fpTop,
      A.fpMid,
      A.ftLow,
      { x: 0.17, y: 0.6 },
    ],
  },
  {
    id: 'parietal',
    name: 'Parietal lobe',
    action: 'Touch, pressure, pain, and spatial awareness',
    fill: '#6b7c93',
    fillHover: '#8494a8',
    fillActive: '#556578',
    attach: { x: 0.58, y: 0.22 },
    labelSide: 'top',
    ring: [
      A.fpTop,
      { x: 0.42, y: 0.09 },
      { x: 0.58, y: 0.09 },
      { x: 0.72, y: 0.13 },
      A.poTop,
      A.poMid,
      A.fpMid,
    ],
  },
  {
    id: 'temporal',
    name: 'Temporal lobe',
    action: 'Hearing, language comprehension, and memory',
    fill: '#e8b87a',
    fillHover: '#f0c890',
    fillActive: '#d4a05e',
    attach: { x: 0.38, y: 0.58 },
    labelSide: 'left',
    ring: [
      A.ftLow,
      A.fpMid,
      A.poMid,
      A.otMid,
      A.tcMid,
      A.bsTop,
      { x: 0.4, y: 0.78 },
      { x: 0.28, y: 0.68 },
      { x: 0.17, y: 0.6 },
    ],
  },
  {
    id: 'occipital',
    name: 'Occipital lobe',
    action: 'Vision — processing what the eyes see',
    fill: '#5fbfb0',
    fillHover: '#78cfc2',
    fillActive: '#4aa898',
    attach: { x: 0.8, y: 0.38 },
    labelSide: 'right',
    ring: [
      A.poTop,
      { x: 0.72, y: 0.13 },
      { x: 0.82, y: 0.24 },
      { x: 0.87, y: 0.4 },
      { x: 0.85, y: 0.52 },
      { x: 0.78, y: 0.6 },
      A.ocMid,
      A.otMid,
      A.poMid,
    ],
  },
  {
    id: 'cerebellum',
    name: 'Cerebellum',
    action: 'Balance, posture, and coordinated movement',
    fill: '#8b3a5c',
    fillHover: '#a34f72',
    fillActive: '#722a48',
    attach: { x: 0.7, y: 0.74 },
    labelSide: 'right',
    ring: [
      A.ocMid,
      { x: 0.78, y: 0.6 },
      { x: 0.8, y: 0.72 },
      { x: 0.72, y: 0.84 },
      { x: 0.6, y: 0.8 },
      A.cbIn,
      A.tcMid,
      A.otMid,
    ],
  },
  {
    id: 'brainstem',
    name: 'Brain stem',
    action: 'Breathing, heart rate, and basic life functions',
    fill: '#d95a5a',
    fillHover: '#e57474',
    fillActive: '#c04040',
    attach: { x: 0.48, y: 0.84 },
    labelSide: 'bottom',
    ring: [
      A.bsTop,
      A.tcMid,
      A.cbIn,
      { x: 0.6, y: 0.8 },
      { x: 0.52, y: 0.92 },
      { x: 0.44, y: 0.92 },
      { x: 0.4, y: 0.78 },
    ],
  },
]

/** Catmull-Rom → cubic Bézier closed loop (smooth through every anchor). */
function traceSmoothClosed(ctx: CanvasRenderingContext2D, box: BrainBox, ring: Pt[]) {
  const n = ring.length
  if (n < 3) return

  const p = (i: number) => mapPt(box, ring[(i + n) % n])

  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const p0 = p(i - 1)
    const p1 = p(i)
    const p2 = p(i + 1)
    const p3 = p(i + 2)

    const cp1 = {
      x: p1.x + (p2.x - p0.x) / 6,
      y: p1.y + (p2.y - p0.y) / 6,
    }
    const cp2 = {
      x: p2.x - (p3.x - p1.x) / 6,
      y: p2.y - (p3.y - p1.y) / 6,
    }

    if (i === 0) ctx.moveTo(p1.x, p1.y)
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y)
  }
  ctx.closePath()
}

function sampleRing(ring: Pt[], stepsPerSeg = 10): Pt[] {
  const n = ring.length
  const pts: Pt[] = []
  for (let i = 0; i < n; i++) {
    const p0 = ring[(i - 1 + n) % n]
    const p1 = ring[i]
    const p2 = ring[(i + 1) % n]
    const p3 = ring[(i + 2) % n]
    for (let s = 0; s < stepsPerSeg; s++) {
      const t = s / stepsPerSeg
      const cp1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
      const cp2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
      pts.push(cubic(p1, cp1, cp2, p2, t))
    }
  }
  return pts
}

function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  }
}

function pointInPoly(px: number, py: number, poly: Pt[]): boolean {
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

const HIT_CACHE = new Map<string, Pt[]>()

function hitPoly(region: BrainRegion): Pt[] {
  let cached = HIT_CACHE.get(region.id)
  if (!cached) {
    cached = sampleRing(region.ring, 12)
    HIT_CACHE.set(region.id, cached)
  }
  return cached
}

function drawSulci(ctx: CanvasRenderingContext2D, box: BrainBox, region: BrainRegion) {
  ctx.strokeStyle = 'rgba(0,0,0,0.14)'
  ctx.lineWidth = 1
  ctx.lineCap = 'round'
  const a = mapPt(box, region.attach)

  if (region.id === 'cerebellum') {
    for (let i = 0; i < 4; i++) {
      const t = 0.64 + i * 0.04
      ctx.beginPath()
      const p0 = mapPt(box, { x: 0.62, y: t })
      const p1 = mapPt(box, { x: 0.7, y: t + 0.015 })
      const p2 = mapPt(box, { x: 0.76, y: t })
      ctx.moveTo(p0.x, p0.y)
      ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y)
      ctx.stroke()
    }
    return
  }

  if (region.id === 'brainstem') return

  for (let i = 0; i < 2; i++) {
    const ox = (i - 0.5) * 0.035
    ctx.beginPath()
    ctx.moveTo(a.x - box.w * 0.05 + ox * box.w, a.y - box.h * 0.04)
    ctx.quadraticCurveTo(a.x + ox * box.w, a.y + box.h * 0.02, a.x + box.w * 0.06, a.y + box.h * 0.04)
    ctx.stroke()
  }
}

function roundPill(
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

export function drawAnatomicalBrain(
  ctx: CanvasRenderingContext2D,
  box: BrainBox,
  opts: {
    selected: BrainRegionId
    hover: BrainRegionId | null
    fontSize: number
    canvasW: number
    canvasH: number
  },
) {
  // Base fill inside silhouette
  ctx.save()
  traceSmoothClosed(ctx, box, BRAIN_OUTLINE_RING)
  ctx.shadowColor = 'rgba(0,0,0,0.18)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetY = 4
  ctx.fillStyle = '#ececec'
  ctx.fill()
  ctx.restore()

  ctx.save()
  traceSmoothClosed(ctx, box, BRAIN_OUTLINE_RING)
  ctx.clip()

  // Tile regions — shared anchors = no gaps
  for (const r of BRAIN_REGIONS) {
    const active = opts.selected === r.id
    const hover = opts.hover === r.id
    traceSmoothClosed(ctx, box, r.ring)
    ctx.fillStyle = active ? r.fillActive : hover ? r.fillHover : r.fill
    ctx.fill()
  }

  // Internal seams (covers sub-pixel gaps)
  ctx.strokeStyle = 'rgba(30,40,50,0.22)'
  ctx.lineWidth = 1.2
  ctx.lineJoin = 'round'
  for (const r of BRAIN_REGIONS) {
    traceSmoothClosed(ctx, box, r.ring)
    ctx.stroke()
  }

  for (const r of BRAIN_REGIONS) {
    drawSulci(ctx, box, r)
  }

  // Highlight selected / hovered
  for (const r of BRAIN_REGIONS) {
    const active = opts.selected === r.id
    const hover = opts.hover === r.id
    if (!active && !hover) continue
    traceSmoothClosed(ctx, box, r.ring)
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'
    ctx.lineWidth = active ? 2.5 : 1.8
    ctx.stroke()
  }

  ctx.restore()

  // Outer silhouette on top
  traceSmoothClosed(ctx, box, BRAIN_OUTLINE_RING)
  ctx.strokeStyle = '#2c3e50'
  ctx.lineWidth = 2.6
  ctx.lineJoin = 'round'
  ctx.stroke()

  drawRegionLabels(ctx, box, opts)
}

function drawRegionLabels(
  ctx: CanvasRenderingContext2D,
  box: BrainBox,
  opts: {
    selected: BrainRegionId
    hover: BrainRegionId | null
    fontSize: number
    canvasW: number
    canvasH: number
  },
) {
  const fs = Math.max(11, opts.fontSize - 1)
  const margin = 12
  const bottomSafe = opts.canvasH - 52
  ctx.font = `600 ${fs}px Roboto, sans-serif`
  ctx.textBaseline = 'middle'

  const slots: Record<BrainRegionId, Pt> = {
    frontal: { x: margin, y: box.y + box.h * 0.26 },
    parietal: { x: box.x + box.w * 0.5, y: Math.max(margin + 6, box.y - 22) },
    occipital: { x: opts.canvasW - margin, y: box.y + box.h * 0.34 },
    temporal: { x: margin, y: Math.min(bottomSafe - 10, box.y + box.h * 0.62) },
    cerebellum: { x: opts.canvasW - margin, y: Math.min(bottomSafe - 10, box.y + box.h * 0.78) },
    brainstem: { x: box.x + box.w * 0.5, y: Math.min(bottomSafe, box.y + box.h + 6) },
  }

  // Only label selected + hovered — avoids six overlapping callouts
  const toLabel = new Set<BrainRegionId>()
  toLabel.add(opts.selected)
  if (opts.hover && opts.hover !== opts.selected) toLabel.add(opts.hover)

  for (const r of BRAIN_REGIONS) {
    if (!toLabel.has(r.id)) continue

    const active = opts.selected === r.id
    const attach = mapPt(box, r.attach)
    const slot = slots[r.id]
    const tw = ctx.measureText(r.name).width
    const padX = 10
    const padY = 5
    const boxW = tw + padX * 2
    const boxH = fs + padY * 2

    let bx = slot.x
    let by = slot.y - boxH / 2
    if (r.labelSide === 'right') bx = slot.x - boxW
    if (r.labelSide === 'top' || r.labelSide === 'bottom') bx = slot.x - boxW / 2

    bx = Math.max(margin, Math.min(opts.canvasW - boxW - margin, bx))
    by = Math.max(margin, Math.min(bottomSafe - boxH, by))
    const lx = bx + (r.labelSide === 'left' ? boxW : r.labelSide === 'right' ? 0 : boxW / 2)
    const ly = by + boxH / 2

    ctx.strokeStyle = active ? '#1a252f' : 'rgba(44,62,80,0.5)'
    ctx.lineWidth = active ? 1.6 : 1
    ctx.beginPath()
    ctx.moveTo(attach.x, attach.y)
    const midX = (attach.x + lx) / 2
    const midY = (attach.y + ly) / 2 - 4
    ctx.quadraticCurveTo(midX, midY, lx, ly)
    ctx.stroke()

    ctx.fillStyle = active ? '#1a252f' : 'rgba(44,62,80,0.65)'
    ctx.beginPath()
    ctx.arc(attach.x, attach.y, active ? 3 : 2.5, 0, Math.PI * 2)
    ctx.fill()

    roundPill(ctx, bx, by, boxW, boxH, 8)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.strokeStyle = active ? r.fillActive : 'rgba(0,0,0,0.12)'
    ctx.lineWidth = active ? 2 : 1
    ctx.stroke()

    ctx.fillStyle = '#1a252f'
    ctx.textAlign = 'left'
    ctx.fillText(r.name, bx + padX, ly + 0.5)
  }

  // Subtle view caption (no leader)
  ctx.font = `500 ${Math.max(10, fs - 1)}px Roboto, sans-serif`
  ctx.fillStyle = 'rgba(44,62,80,0.45)'
  ctx.textAlign = 'left'
  ctx.fillText('Left side view', box.x + 4, box.y + box.h + 18)
}

export function hitTestBrainRegion(box: BrainBox, px: number, py: number): BrainRegionId | null {
  const outline = sampleRing(BRAIN_OUTLINE_RING, 14).map((p) => mapPt(box, p))
  if (!pointInPoly(px, py, outline)) return null

  for (let i = BRAIN_REGIONS.length - 1; i >= 0; i--) {
    const r = BRAIN_REGIONS[i]
    const poly = hitPoly(r).map((p) => mapPt(box, p))
    if (pointInPoly(px, py, poly)) return r.id
  }
  return null
}
