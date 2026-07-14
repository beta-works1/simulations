/**
 * Smooth PhET-style lateral brain — Bézier lobes + silhouette.
 * Fills are drawn under a post-stroke outline so colors never look like they spill.
 */

export type BrainRegionId =
  | 'frontal'
  | 'parietal'
  | 'temporal'
  | 'occipital'
  | 'cerebellum'
  | 'brainstem'

export type Pt = { x: number; y: number }

/** Cubic Bézier segment: end point + two control points (relative to previous point). */
export type BezierSeg = { cp1: Pt; cp2: Pt; to: Pt }

export type SmoothPath = {
  start: Pt
  segs: BezierSeg[]
}

export type BrainRegion = {
  id: BrainRegionId
  name: string
  action: string
  path: SmoothPath
  fill: string
  fillHover: string
  fillActive: string
  attach: Pt
  /** Preferred label side: left | right | top | bottom */
  labelSide: 'left' | 'right' | 'top' | 'bottom'
}

export type BrainBox = { x: number; y: number; w: number; h: number }

export function mapPt(box: BrainBox, p: Pt): Pt {
  return { x: box.x + p.x * box.w, y: box.y + p.y * box.h }
}

/** Outer silhouette — smooth textbook profile (front = left). */
export const BRAIN_OUTLINE: SmoothPath = {
  start: { x: 0.1, y: 0.45 },
  segs: [
    { cp1: { x: 0.1, y: 0.28 }, cp2: { x: 0.2, y: 0.12 }, to: { x: 0.38, y: 0.1 } },
    { cp1: { x: 0.52, y: 0.08 }, cp2: { x: 0.68, y: 0.12 }, to: { x: 0.78, y: 0.24 } },
    { cp1: { x: 0.86, y: 0.32 }, cp2: { x: 0.88, y: 0.44 }, to: { x: 0.84, y: 0.54 } },
    { cp1: { x: 0.82, y: 0.6 }, cp2: { x: 0.76, y: 0.6 }, to: { x: 0.72, y: 0.58 } },
    // cerebellum bulge
    { cp1: { x: 0.78, y: 0.64 }, cp2: { x: 0.82, y: 0.74 }, to: { x: 0.76, y: 0.84 } },
    { cp1: { x: 0.7, y: 0.9 }, cp2: { x: 0.6, y: 0.86 }, to: { x: 0.56, y: 0.76 } },
    // brainstem
    { cp1: { x: 0.54, y: 0.82 }, cp2: { x: 0.52, y: 0.92 }, to: { x: 0.48, y: 0.94 } },
    { cp1: { x: 0.44, y: 0.94 }, cp2: { x: 0.42, y: 0.84 }, to: { x: 0.42, y: 0.74 } },
    // temporal underside
    { cp1: { x: 0.36, y: 0.7 }, cp2: { x: 0.24, y: 0.64 }, to: { x: 0.16, y: 0.56 } },
    { cp1: { x: 0.12, y: 0.52 }, cp2: { x: 0.1, y: 0.48 }, to: { x: 0.1, y: 0.45 } },
  ],
}

export const BRAIN_REGIONS: BrainRegion[] = [
  {
    id: 'frontal',
    name: 'Frontal lobe',
    action: 'Planning, decisions, voluntary movement, speech',
    fill: '#e89b8c',
    fillHover: '#f0b0a4',
    fillActive: '#d97768',
    attach: { x: 0.28, y: 0.3 },
    labelSide: 'left',
    path: {
      start: { x: 0.12, y: 0.44 },
      segs: [
        { cp1: { x: 0.12, y: 0.3 }, cp2: { x: 0.22, y: 0.14 }, to: { x: 0.4, y: 0.12 } },
        { cp1: { x: 0.46, y: 0.12 }, cp2: { x: 0.5, y: 0.18 }, to: { x: 0.5, y: 0.28 } },
        { cp1: { x: 0.5, y: 0.4 }, cp2: { x: 0.44, y: 0.5 }, to: { x: 0.36, y: 0.52 } },
        { cp1: { x: 0.26, y: 0.54 }, cp2: { x: 0.16, y: 0.52 }, to: { x: 0.12, y: 0.44 } },
      ],
    },
  },
  {
    id: 'parietal',
    name: 'Parietal lobe',
    action: 'Touch, pressure, pain, and spatial awareness',
    fill: '#6b7c93',
    fillHover: '#8494a8',
    fillActive: '#556578',
    attach: { x: 0.6, y: 0.26 },
    labelSide: 'top',
    path: {
      start: { x: 0.5, y: 0.14 },
      segs: [
        { cp1: { x: 0.58, y: 0.1 }, cp2: { x: 0.7, y: 0.14 }, to: { x: 0.76, y: 0.24 } },
        { cp1: { x: 0.78, y: 0.32 }, cp2: { x: 0.74, y: 0.4 }, to: { x: 0.66, y: 0.42 } },
        { cp1: { x: 0.58, y: 0.42 }, cp2: { x: 0.52, y: 0.36 }, to: { x: 0.5, y: 0.28 } },
        { cp1: { x: 0.48, y: 0.2 }, cp2: { x: 0.48, y: 0.14 }, to: { x: 0.5, y: 0.14 } },
      ],
    },
  },
  {
    id: 'temporal',
    name: 'Temporal lobe',
    action: 'Hearing, language comprehension, and memory',
    fill: '#e8b87a',
    fillHover: '#f0c890',
    fillActive: '#d4a05e',
    attach: { x: 0.42, y: 0.56 },
    labelSide: 'left',
    path: {
      start: { x: 0.28, y: 0.52 },
      segs: [
        { cp1: { x: 0.38, y: 0.48 }, cp2: { x: 0.52, y: 0.44 }, to: { x: 0.62, y: 0.48 } },
        { cp1: { x: 0.68, y: 0.52 }, cp2: { x: 0.66, y: 0.62 }, to: { x: 0.56, y: 0.66 } },
        { cp1: { x: 0.46, y: 0.7 }, cp2: { x: 0.34, y: 0.66 }, to: { x: 0.28, y: 0.58 } },
        { cp1: { x: 0.26, y: 0.54 }, cp2: { x: 0.26, y: 0.52 }, to: { x: 0.28, y: 0.52 } },
      ],
    },
  },
  {
    id: 'occipital',
    name: 'Occipital lobe',
    action: 'Vision — processing what the eyes see',
    fill: '#5fbfb0',
    fillHover: '#78cfc2',
    fillActive: '#4aa898',
    attach: { x: 0.78, y: 0.4 },
    labelSide: 'right',
    path: {
      start: { x: 0.7, y: 0.28 },
      segs: [
        { cp1: { x: 0.78, y: 0.28 }, cp2: { x: 0.86, y: 0.36 }, to: { x: 0.84, y: 0.48 } },
        { cp1: { x: 0.82, y: 0.56 }, cp2: { x: 0.74, y: 0.56 }, to: { x: 0.7, y: 0.5 } },
        { cp1: { x: 0.66, y: 0.42 }, cp2: { x: 0.66, y: 0.32 }, to: { x: 0.7, y: 0.28 } },
      ],
    },
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
    path: {
      start: { x: 0.58, y: 0.66 },
      segs: [
        { cp1: { x: 0.68, y: 0.6 }, cp2: { x: 0.8, y: 0.64 }, to: { x: 0.8, y: 0.74 } },
        { cp1: { x: 0.8, y: 0.84 }, cp2: { x: 0.7, y: 0.88 }, to: { x: 0.62, y: 0.82 } },
        { cp1: { x: 0.56, y: 0.76 }, cp2: { x: 0.54, y: 0.7 }, to: { x: 0.58, y: 0.66 } },
      ],
    },
  },
  {
    id: 'brainstem',
    name: 'Brain stem',
    action: 'Breathing, heart rate, and basic life functions',
    fill: '#d95a5a',
    fillHover: '#e57474',
    fillActive: '#c04040',
    attach: { x: 0.48, y: 0.82 },
    labelSide: 'bottom',
    path: {
      start: { x: 0.44, y: 0.7 },
      segs: [
        { cp1: { x: 0.48, y: 0.68 }, cp2: { x: 0.54, y: 0.7 }, to: { x: 0.54, y: 0.8 } },
        { cp1: { x: 0.54, y: 0.9 }, cp2: { x: 0.5, y: 0.94 }, to: { x: 0.48, y: 0.94 } },
        { cp1: { x: 0.44, y: 0.94 }, cp2: { x: 0.42, y: 0.86 }, to: { x: 0.42, y: 0.76 } },
        { cp1: { x: 0.42, y: 0.72 }, cp2: { x: 0.42, y: 0.7 }, to: { x: 0.44, y: 0.7 } },
      ],
    },
  },
]

function buildPath(ctx: CanvasRenderingContext2D, box: BrainBox, path: SmoothPath) {
  const s = mapPt(box, path.start)
  ctx.beginPath()
  ctx.moveTo(s.x, s.y)
  for (const seg of path.segs) {
    const c1 = mapPt(box, seg.cp1)
    const c2 = mapPt(box, seg.cp2)
    const to = mapPt(box, seg.to)
    ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, to.x, to.y)
  }
  ctx.closePath()
}

/** Sample Bézier path to polygon for hit-testing. */
function samplePath(path: SmoothPath, rootSteps = 16): Pt[] {
  const pts: Pt[] = [path.start]
  let cur = path.start
  for (const seg of path.segs) {
    for (let i = 1; i <= rootSteps; i++) {
      const t = i / rootSteps
      pts.push(cubic(cur, seg.cp1, seg.cp2, seg.to, t))
    }
    cur = seg.to
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
    cached = samplePath(region.path, 20)
    HIT_CACHE.set(region.id, cached)
  }
  return cached
}

function drawSulci(
  ctx: CanvasRenderingContext2D,
  box: BrainBox,
  region: BrainRegion,
) {
  ctx.strokeStyle = 'rgba(0,0,0,0.16)'
  ctx.lineWidth = 1.15
  ctx.lineCap = 'round'
  const a = mapPt(box, region.attach)

  if (region.id === 'cerebellum') {
    for (let i = 0; i < 5; i++) {
      const y = 0.66 + i * 0.035
      ctx.beginPath()
      const p0 = mapPt(box, { x: 0.6, y })
      const p1 = mapPt(box, { x: 0.7, y: y + 0.01 })
      const p2 = mapPt(box, { x: 0.78, y })
      ctx.moveTo(p0.x, p0.y)
      ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y)
      ctx.stroke()
    }
    return
  }

  for (let i = 0; i < 3; i++) {
    const ox = (i - 1) * 0.04
    const oy = (i % 2) * 0.03
    ctx.beginPath()
    ctx.moveTo(a.x - box.w * 0.06 + ox * box.w, a.y - box.h * 0.05 + oy * box.h)
    ctx.quadraticCurveTo(a.x + ox * box.w, a.y + oy * box.h, a.x + box.w * 0.07, a.y + box.h * 0.05)
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
  // Soft shadow under whole brain
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.22)'
  ctx.shadowBlur = 14
  ctx.shadowOffsetY = 4
  buildPath(ctx, box, BRAIN_OUTLINE)
  ctx.fillStyle = '#e8e8e8'
  ctx.fill()
  ctx.restore()

  // Clip fills to silhouette
  ctx.save()
  buildPath(ctx, box, BRAIN_OUTLINE)
  ctx.clip()

  for (const r of BRAIN_REGIONS) {
    const active = opts.selected === r.id
    const hover = opts.hover === r.id
    buildPath(ctx, box, r.path)
    ctx.fillStyle = active ? r.fillActive : hover ? r.fillHover : r.fill
    ctx.fill()
    drawSulci(ctx, box, r)
  }

  // Soft dim of non-selected
  for (const r of BRAIN_REGIONS) {
    if (r.id === opts.selected) continue
    buildPath(ctx, box, r.path)
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.fill()
  }

  // Inner highlight stroke for hover/selected (inside clip)
  for (const r of BRAIN_REGIONS) {
    const active = opts.selected === r.id
    const hover = opts.hover === r.id
    if (!active && !hover) continue
    buildPath(ctx, box, r.path)
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = active ? 2.4 : 1.8
    ctx.stroke()
  }
  ctx.restore()

  // Crisp outline ON TOP — covers any antialias fringe
  buildPath(ctx, box, BRAIN_OUTLINE)
  ctx.strokeStyle = '#2c3e50'
  ctx.lineWidth = 2.4
  ctx.lineJoin = 'round'
  ctx.stroke()

  drawExteriorLabels(ctx, box, opts)
}

function drawExteriorLabels(
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
  const margin = 10
  const bottomSafe = opts.canvasH - 58 // leave room for info strip
  ctx.font = `600 ${fs}px Roboto, sans-serif`
  ctx.textBaseline = 'middle'

  // Fixed non-overlapping anchor slots around the brain
  const slots: Record<BrainRegionId, Pt> = {
    frontal: { x: margin, y: box.y + box.h * 0.28 },
    parietal: { x: box.x + box.w * 0.48, y: Math.max(margin + 8, box.y - 18) },
    occipital: { x: opts.canvasW - margin, y: box.y + box.h * 0.36 },
    temporal: { x: margin, y: Math.min(bottomSafe - 8, box.y + box.h * 0.7) },
    cerebellum: { x: opts.canvasW - margin, y: Math.min(bottomSafe - 8, box.y + box.h * 0.82) },
    brainstem: { x: box.x + box.w * 0.48, y: Math.min(bottomSafe - 4, box.y + box.h + 4) },
  }

  for (const r of BRAIN_REGIONS) {
    const active = opts.selected === r.id || opts.hover === r.id
    const attach = mapPt(box, r.attach)
    const slot = slots[r.id]
    const text = r.name
    const tw = ctx.measureText(text).width
    const padX = 9
    const padY = 5
    const boxW = tw + padX * 2
    const boxH = fs + padY * 2

    let bx = slot.x
    let by = slot.y - boxH / 2
    if (r.labelSide === 'left') bx = slot.x
    if (r.labelSide === 'right') bx = slot.x - boxW
    if (r.labelSide === 'top' || r.labelSide === 'bottom') bx = slot.x - boxW / 2

    bx = Math.max(margin, Math.min(opts.canvasW - boxW - margin, bx))
    by = Math.max(margin, Math.min(bottomSafe - boxH, by))
    const lx = bx + (r.labelSide === 'left' ? boxW : r.labelSide === 'right' ? 0 : boxW / 2)
    const ly = by + boxH / 2

    // Leader
    ctx.strokeStyle = active ? '#1a252f' : 'rgba(44,62,80,0.45)'
    ctx.lineWidth = active ? 1.5 : 1
    ctx.beginPath()
    ctx.moveTo(attach.x, attach.y)
    const midX = (attach.x + lx) / 2
    const midY = (attach.y + ly) / 2 - 6
    ctx.quadraticCurveTo(midX, midY, lx, ly)
    ctx.stroke()

    ctx.fillStyle = active ? '#1a252f' : 'rgba(44,62,80,0.7)'
    ctx.beginPath()
    ctx.arc(attach.x, attach.y, active ? 3.2 : 2.4, 0, Math.PI * 2)
    ctx.fill()

    roundPill(ctx, bx, by, boxW, boxH, 7)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.strokeStyle = active ? r.fillActive : 'rgba(0,0,0,0.1)'
    ctx.lineWidth = active ? 2 : 1
    ctx.stroke()

    ctx.fillStyle = '#1a252f'
    ctx.textAlign = 'left'
    ctx.fillText(text, bx + padX, ly + 0.5)
  }
}

export function hitTestBrainRegion(box: BrainBox, px: number, py: number): BrainRegionId | null {
  const outline = samplePath(BRAIN_OUTLINE, 24).map((p) => mapPt(box, p))
  if (!pointInPoly(px, py, outline)) return null

  for (let i = BRAIN_REGIONS.length - 1; i >= 0; i--) {
    const r = BRAIN_REGIONS[i]
    const poly = hitPoly(r).map((p) => mapPt(box, p))
    if (pointInPoly(px, py, poly)) return r.id
  }
  return null
}
