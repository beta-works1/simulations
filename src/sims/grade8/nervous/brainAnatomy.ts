/**
 * Lateral (side-view) human brain outline + lobe polygons for Canvas 2D.
 * Coordinates are normalized 0–1 within a bounding box; map with mapBrainPoint.
 */

export type BrainRegionId =
  | 'frontal'
  | 'parietal'
  | 'temporal'
  | 'occipital'
  | 'cerebellum'
  | 'brainstem'

export type BrainRegion = {
  id: BrainRegionId
  name: string
  action: string
  /** Polygon in normalized brain space (0–1). */
  poly: { x: number; y: number }[]
  fill: string
  fillActive: string
}

/** Outer silhouette path in normalized coords (left = frontal, right = occipital). */
export const BRAIN_OUTLINE: { x: number; y: number }[] = [
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
    action: 'Planning, decisions, voluntary movement',
    fill: 'rgba(231, 76, 60, 0.55)',
    fillActive: 'rgba(231, 76, 60, 0.88)',
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
    action: 'Touch and spatial awareness',
    fill: 'rgba(52, 152, 219, 0.5)',
    fillActive: 'rgba(52, 152, 219, 0.88)',
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
    action: 'Hearing, language, memory',
    fill: 'rgba(155, 89, 182, 0.5)',
    fillActive: 'rgba(155, 89, 182, 0.88)',
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
    action: 'Vision processing',
    fill: 'rgba(46, 204, 113, 0.5)',
    fillActive: 'rgba(46, 204, 113, 0.88)',
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
    action: 'Balance and coordination',
    fill: 'rgba(241, 196, 15, 0.55)',
    fillActive: 'rgba(241, 196, 15, 0.9)',
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
    action: 'Breathing and heart rate',
    fill: 'rgba(149, 165, 166, 0.65)',
    fillActive: 'rgba(127, 140, 141, 0.95)',
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

export type BrainBox = { x: number; y: number; w: number; h: number }

export function mapBrainPoint(box: BrainBox, p: { x: number; y: number }) {
  return { x: box.x + p.x * box.w, y: box.y + p.y * box.h }
}

export function pointInPoly(px: number, py: number, poly: { x: number; y: number }[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x
    const yi = poly[i].y
    const xj = poly[j].x
    const yj = poly[j].y
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

function pathFromPoly(
  ctx: CanvasRenderingContext2D,
  box: BrainBox,
  poly: { x: number; y: number }[],
) {
  const first = mapBrainPoint(box, poly[0])
  ctx.beginPath()
  ctx.moveTo(first.x, first.y)
  for (let i = 1; i < poly.length; i++) {
    const p = mapBrainPoint(box, poly[i])
    ctx.lineTo(p.x, p.y)
  }
  ctx.closePath()
}

/** Draw anatomical brain base (silhouette + sulci hints). */
export function drawBrainBase(ctx: CanvasRenderingContext2D, box: BrainBox) {
  // Soft shadow
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 6
  pathFromPoly(ctx, box, BRAIN_OUTLINE)
  const skin = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h)
  skin.addColorStop(0, '#f8e8d8')
  skin.addColorStop(0.45, '#e8c9a8')
  skin.addColorStop(1, '#d4a574')
  ctx.fillStyle = skin
  ctx.fill()
  ctx.restore()

  ctx.strokeStyle = '#a67c52'
  ctx.lineWidth = 2.5
  pathFromPoly(ctx, box, BRAIN_OUTLINE)
  ctx.stroke()

  // Sulci / gyrus hints
  ctx.strokeStyle = 'rgba(166, 124, 82, 0.45)'
  ctx.lineWidth = 1.4
  const curves: [number, number, number, number, number, number][] = [
    [0.22, 0.34, 0.32, 0.28, 0.4, 0.36],
    [0.3, 0.48, 0.4, 0.4, 0.5, 0.48],
    [0.48, 0.24, 0.58, 0.3, 0.66, 0.26],
    [0.56, 0.5, 0.64, 0.54, 0.7, 0.48],
    [0.64, 0.7, 0.7, 0.74, 0.74, 0.7],
  ]
  for (const c of curves) {
    const a = mapBrainPoint(box, { x: c[0], y: c[1] })
    const b = mapBrainPoint(box, { x: c[2], y: c[3] })
    const d = mapBrainPoint(box, { x: c[4], y: c[5] })
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.quadraticCurveTo(b.x, b.y, d.x, d.y)
    ctx.stroke()
  }
}

export function drawBrainRegion(
  ctx: CanvasRenderingContext2D,
  box: BrainBox,
  region: BrainRegion,
  opts: { active?: boolean; hover?: boolean },
) {
  pathFromPoly(ctx, box, region.poly)
  ctx.fillStyle = opts.active ? region.fillActive : opts.hover ? region.fillActive : region.fill
  ctx.fill()
  ctx.strokeStyle = opts.active || opts.hover ? '#fff' : 'rgba(255,255,255,0.35)'
  ctx.lineWidth = opts.active ? 2.5 : opts.hover ? 2 : 1
  ctx.stroke()
}

export function hitTestBrainRegion(
  box: BrainBox,
  px: number,
  py: number,
): BrainRegionId | null {
  // Test reverse so smaller/overlapping regions win (brainstem over temporal)
  for (let i = BRAIN_REGIONS.length - 1; i >= 0; i--) {
    const r = BRAIN_REGIONS[i]
    const mapped = r.poly.map((p) => mapBrainPoint(box, p))
    if (pointInPoly(px, py, mapped)) return r.id
  }
  return null
}

export function brainLabelAnchor(box: BrainBox, region: BrainRegion) {
  let sx = 0
  let sy = 0
  for (const p of region.poly) {
    sx += p.x
    sy += p.y
  }
  const n = region.poly.length
  return mapBrainPoint(box, { x: sx / n, y: sy / n })
}
