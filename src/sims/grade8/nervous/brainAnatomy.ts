/**
 * Side-view brain: anatomical base illustration + translucent lobe overlays.
 * Overlays sit on top of the skin-toned brain — no gap tiles needed.
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
  poly: Pt[]
  fill: string
  fillHover: string
  fillActive: string
}

export type BrainBox = { x: number; y: number; w: number; h: number }

export function mapPt(box: BrainBox, p: Pt): Pt {
  return { x: box.x + p.x * box.w, y: box.y + p.y * box.h }
}

/** Smooth lateral silhouette — front = left (normalized 0–1). */
const OUTLINE: Pt[] = [
  { x: 0.1, y: 0.48 },
  { x: 0.12, y: 0.32 },
  { x: 0.2, y: 0.16 },
  { x: 0.34, y: 0.1 },
  { x: 0.5, y: 0.09 },
  { x: 0.64, y: 0.12 },
  { x: 0.76, y: 0.2 },
  { x: 0.84, y: 0.32 },
  { x: 0.88, y: 0.44 },
  { x: 0.86, y: 0.54 },
  { x: 0.8, y: 0.6 },
  { x: 0.82, y: 0.7 },
  { x: 0.78, y: 0.8 },
  { x: 0.7, y: 0.86 },
  { x: 0.6, y: 0.82 },
  { x: 0.54, y: 0.92 },
  { x: 0.46, y: 0.94 },
  { x: 0.4, y: 0.82 },
  { x: 0.3, y: 0.72 },
  { x: 0.2, y: 0.64 },
  { x: 0.14, y: 0.56 },
]

export const BRAIN_REGIONS: BrainRegion[] = [
  {
    id: 'frontal',
    name: 'Frontal lobe',
    action: 'Planning, decisions, voluntary movement, speech',
    fill: 'rgba(231, 76, 60, 0.42)',
    fillHover: 'rgba(231, 76, 60, 0.58)',
    fillActive: 'rgba(231, 76, 60, 0.72)',
    poly: [
      { x: 0.12, y: 0.46 },
      { x: 0.14, y: 0.28 },
      { x: 0.24, y: 0.14 },
      { x: 0.38, y: 0.11 },
      { x: 0.46, y: 0.18 },
      { x: 0.44, y: 0.38 },
      { x: 0.36, y: 0.5 },
      { x: 0.24, y: 0.54 },
      { x: 0.16, y: 0.5 },
    ],
  },
  {
    id: 'parietal',
    name: 'Parietal lobe',
    action: 'Touch, pressure, pain, and spatial awareness',
    fill: 'rgba(52, 152, 219, 0.4)',
    fillHover: 'rgba(52, 152, 219, 0.56)',
    fillActive: 'rgba(52, 152, 219, 0.7)',
    poly: [
      { x: 0.46, y: 0.14 },
      { x: 0.58, y: 0.11 },
      { x: 0.7, y: 0.16 },
      { x: 0.74, y: 0.28 },
      { x: 0.68, y: 0.4 },
      { x: 0.54, y: 0.4 },
      { x: 0.46, y: 0.28 },
    ],
  },
  {
    id: 'temporal',
    name: 'Temporal lobe',
    action: 'Hearing, language comprehension, and memory',
    fill: 'rgba(230, 160, 60, 0.42)',
    fillHover: 'rgba(230, 160, 60, 0.58)',
    fillActive: 'rgba(230, 160, 60, 0.72)',
    poly: [
      { x: 0.24, y: 0.52 },
      { x: 0.38, y: 0.48 },
      { x: 0.54, y: 0.44 },
      { x: 0.64, y: 0.5 },
      { x: 0.6, y: 0.64 },
      { x: 0.48, y: 0.7 },
      { x: 0.34, y: 0.66 },
      { x: 0.22, y: 0.6 },
    ],
  },
  {
    id: 'occipital',
    name: 'Occipital lobe',
    action: 'Vision — processing what the eyes see',
    fill: 'rgba(46, 204, 113, 0.4)',
    fillHover: 'rgba(46, 204, 113, 0.56)',
    fillActive: 'rgba(46, 204, 113, 0.7)',
    poly: [
      { x: 0.7, y: 0.22 },
      { x: 0.8, y: 0.28 },
      { x: 0.86, y: 0.4 },
      { x: 0.84, y: 0.52 },
      { x: 0.74, y: 0.54 },
      { x: 0.68, y: 0.42 },
    ],
  },
  {
    id: 'cerebellum',
    name: 'Cerebellum',
    action: 'Balance, posture, and coordinated movement',
    fill: 'rgba(142, 45, 90, 0.45)',
    fillHover: 'rgba(142, 45, 90, 0.6)',
    fillActive: 'rgba(142, 45, 90, 0.75)',
    poly: [
      { x: 0.58, y: 0.62 },
      { x: 0.7, y: 0.58 },
      { x: 0.8, y: 0.64 },
      { x: 0.78, y: 0.78 },
      { x: 0.68, y: 0.84 },
      { x: 0.58, y: 0.78 },
    ],
  },
  {
    id: 'brainstem',
    name: 'Brain stem',
    action: 'Breathing, heart rate, and basic life functions',
    fill: 'rgba(217, 90, 90, 0.48)',
    fillHover: 'rgba(217, 90, 90, 0.62)',
    fillActive: 'rgba(217, 90, 90, 0.78)',
    poly: [
      { x: 0.44, y: 0.68 },
      { x: 0.52, y: 0.66 },
      { x: 0.54, y: 0.84 },
      { x: 0.48, y: 0.9 },
      { x: 0.42, y: 0.84 },
      { x: 0.42, y: 0.72 },
    ],
  },
]

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
    const cp1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
    const cp2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
    if (i === 0) ctx.moveTo(p1.x, p1.y)
    ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y)
  }
  ctx.closePath()
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

/** Anatomical flesh-toned brain with sulci — always drawn first. */
function drawBrainIllustration(ctx: CanvasRenderingContext2D, box: BrainBox) {
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.2)'
  ctx.shadowBlur = 16
  ctx.shadowOffsetY = 5
  traceSmoothClosed(ctx, box, OUTLINE)
  const skin = ctx.createLinearGradient(box.x, box.y, box.x + box.w * 0.7, box.y + box.h)
  skin.addColorStop(0, '#fceee3')
  skin.addColorStop(0.35, '#e8c4a8')
  skin.addColorStop(0.7, '#d4a882')
  skin.addColorStop(1, '#c4956a')
  ctx.fillStyle = skin
  ctx.fill()
  ctx.restore()

  // Central fissure + gyri
  ctx.save()
  traceSmoothClosed(ctx, box, OUTLINE)
  ctx.clip()
  ctx.strokeStyle = 'rgba(120, 80, 55, 0.35)'
  ctx.lineWidth = 1.3
  ctx.lineCap = 'round'
  const sulci: [Pt, Pt, Pt][] = [
    [{ x: 0.2, y: 0.34 }, { x: 0.3, y: 0.28 }, { x: 0.4, y: 0.34 }],
    [{ x: 0.28, y: 0.46 }, { x: 0.38, y: 0.4 }, { x: 0.48, y: 0.46 }],
    [{ x: 0.46, y: 0.22 }, { x: 0.56, y: 0.26 }, { x: 0.66, y: 0.22 }],
    [{ x: 0.54, y: 0.48 }, { x: 0.62, y: 0.52 }, { x: 0.7, y: 0.46 }],
    [{ x: 0.62, y: 0.68 }, { x: 0.68, y: 0.72 }, { x: 0.74, y: 0.68 }],
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

  // Cerebellum folds
  ctx.strokeStyle = 'rgba(90, 40, 55, 0.3)'
  for (let i = 0; i < 4; i++) {
    const y = 0.62 + i * 0.04
    const p0 = mapPt(box, { x: 0.6, y })
    const p1 = mapPt(box, { x: 0.68, y: y + 0.012 })
    const p2 = mapPt(box, { x: 0.76, y })
    ctx.beginPath()
    ctx.moveTo(p0.x, p0.y)
    ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y)
    ctx.stroke()
  }
  ctx.restore()

  // Crisp outer edge
  traceSmoothClosed(ctx, box, OUTLINE)
  ctx.strokeStyle = '#6b4e35'
  ctx.lineWidth = 2.2
  ctx.lineJoin = 'round'
  ctx.stroke()
}

export function drawAnatomicalBrain(
  ctx: CanvasRenderingContext2D,
  box: BrainBox,
  opts: {
    selected: BrainRegionId
    hover: BrainRegionId | null
  },
) {
  drawBrainIllustration(ctx, box)

  ctx.save()
  traceSmoothClosed(ctx, box, OUTLINE)
  ctx.clip()

  for (const r of BRAIN_REGIONS) {
    const active = opts.selected === r.id
    const hover = opts.hover === r.id
    tracePoly(ctx, box, r.poly)
    ctx.fillStyle = active ? r.fillActive : hover ? r.fillHover : r.fill
    ctx.fill()
  }

  // White ring on active / hovered lobe
  for (const r of BRAIN_REGIONS) {
    const active = opts.selected === r.id
    const hover = opts.hover === r.id
    if (!active && !hover) continue
    tracePoly(ctx, box, r.poly)
    ctx.strokeStyle = 'rgba(255,255,255,0.92)'
    ctx.lineWidth = active ? 2.5 : 1.8
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  ctx.restore()

  // Re-stroke silhouette so edge stays crisp over overlays
  traceSmoothClosed(ctx, box, OUTLINE)
  ctx.strokeStyle = '#4a3525'
  ctx.lineWidth = 2
  ctx.stroke()
}

export function hitTestBrainRegion(box: BrainBox, px: number, py: number): BrainRegionId | null {
  for (let i = BRAIN_REGIONS.length - 1; i >= 0; i--) {
    const r = BRAIN_REGIONS[i]
    const mapped = r.poly.map((p) => mapPt(box, p))
    if (pointInPoly(px, py, mapped)) return r.id
  }
  return null
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
