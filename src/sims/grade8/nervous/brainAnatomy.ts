/**
 * Lateral brain diagram matching textbook-style lobe layout.
 * All region fills are clipped to BRAIN_OUTLINE so colors never spill outside.
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
  /** Closed polygon — must stay inside outline. */
  poly: Pt[]
  fill: string
  fillHover: string
  fillActive: string
  /** Exterior label slot (normalized) + leader attach on lobe. */
  labelPos: Pt
  attach: Pt
}

export type BrainBox = { x: number; y: number; w: number; h: number }

/** Clean lateral silhouette (front = left). */
export const BRAIN_OUTLINE: Pt[] = [
  { x: 0.1, y: 0.42 },
  { x: 0.12, y: 0.32 },
  { x: 0.18, y: 0.2 },
  { x: 0.28, y: 0.12 },
  { x: 0.42, y: 0.08 },
  { x: 0.55, y: 0.1 },
  { x: 0.68, y: 0.16 },
  { x: 0.78, y: 0.26 },
  { x: 0.84, y: 0.38 },
  { x: 0.86, y: 0.48 },
  { x: 0.84, y: 0.56 },
  { x: 0.78, y: 0.6 },
  // occipital into cerebellum seam
  { x: 0.74, y: 0.62 },
  { x: 0.8, y: 0.7 },
  { x: 0.78, y: 0.82 },
  { x: 0.7, y: 0.86 },
  { x: 0.62, y: 0.82 },
  { x: 0.58, y: 0.72 },
  // brainstem
  { x: 0.54, y: 0.78 },
  { x: 0.52, y: 0.9 },
  { x: 0.46, y: 0.9 },
  { x: 0.44, y: 0.76 },
  { x: 0.4, y: 0.68 },
  // temporal underside
  { x: 0.32, y: 0.64 },
  { x: 0.22, y: 0.58 },
  { x: 0.14, y: 0.52 },
  { x: 0.1, y: 0.46 },
]

/**
 * Lobe polygons hugging the reference: coral frontal, blue parietal,
 * teal occipital, ochre temporal, maroon cerebellum, red brainstem.
 * Edges meet at shared sulci so they tile the outline without gaps/overflow.
 */
export const BRAIN_REGIONS: BrainRegion[] = [
  {
    id: 'frontal',
    name: 'Frontal lobe',
    action: 'Planning, decisions, voluntary movement, speech',
    fill: '#e89b8c',
    fillHover: '#f0b0a4',
    fillActive: '#d97768',
    labelPos: { x: -0.02, y: 0.22 },
    attach: { x: 0.28, y: 0.28 },
    poly: [
      { x: 0.11, y: 0.42 },
      { x: 0.13, y: 0.3 },
      { x: 0.2, y: 0.18 },
      { x: 0.3, y: 0.12 },
      { x: 0.42, y: 0.1 },
      { x: 0.48, y: 0.14 },
      // central sulcus boundary with parietal
      { x: 0.5, y: 0.22 },
      { x: 0.48, y: 0.38 },
      { x: 0.44, y: 0.48 },
      // sylvian upper edge with temporal
      { x: 0.36, y: 0.52 },
      { x: 0.26, y: 0.54 },
      { x: 0.16, y: 0.5 },
      { x: 0.12, y: 0.46 },
    ],
  },
  {
    id: 'parietal',
    name: 'Parietal lobe',
    action: 'Touch, pressure, pain, and spatial awareness',
    fill: '#6b7c93',
    fillHover: '#8494a8',
    fillActive: '#556578',
    labelPos: { x: 0.52, y: -0.02 },
    attach: { x: 0.58, y: 0.24 },
    poly: [
      { x: 0.5, y: 0.12 },
      { x: 0.58, y: 0.12 },
      { x: 0.68, y: 0.16 },
      { x: 0.74, y: 0.24 },
      { x: 0.74, y: 0.34 },
      { x: 0.68, y: 0.4 },
      { x: 0.58, y: 0.42 },
      { x: 0.5, y: 0.4 },
      { x: 0.48, y: 0.28 },
      { x: 0.5, y: 0.18 },
    ],
  },
  {
    id: 'temporal',
    name: 'Temporal lobe',
    action: 'Hearing, language comprehension, and memory',
    fill: '#e8b87a',
    fillHover: '#f0c890',
    fillActive: '#d4a05e',
    labelPos: { x: 0.18, y: 0.78 },
    attach: { x: 0.4, y: 0.58 },
    poly: [
      { x: 0.26, y: 0.54 },
      { x: 0.36, y: 0.52 },
      { x: 0.48, y: 0.46 },
      { x: 0.58, y: 0.44 },
      { x: 0.66, y: 0.48 },
      { x: 0.66, y: 0.58 },
      { x: 0.58, y: 0.66 },
      { x: 0.48, y: 0.68 },
      { x: 0.38, y: 0.66 },
      { x: 0.3, y: 0.62 },
      { x: 0.24, y: 0.58 },
    ],
  },
  {
    id: 'occipital',
    name: 'Occipital lobe',
    action: 'Vision — processing what the eyes see',
    fill: '#5fbfb0',
    fillHover: '#78cfc2',
    fillActive: '#4aa898',
    labelPos: { x: 0.98, y: 0.36 },
    attach: { x: 0.8, y: 0.42 },
    poly: [
      { x: 0.72, y: 0.26 },
      { x: 0.8, y: 0.28 },
      { x: 0.85, y: 0.38 },
      { x: 0.85, y: 0.5 },
      { x: 0.8, y: 0.56 },
      { x: 0.72, y: 0.54 },
      { x: 0.68, y: 0.42 },
      { x: 0.7, y: 0.32 },
    ],
  },
  {
    id: 'cerebellum',
    name: 'Cerebellum',
    action: 'Balance, posture, and coordinated movement',
    fill: '#8b3a5c',
    fillHover: '#a34f72',
    fillActive: '#722a48',
    labelPos: { x: 0.92, y: 0.88 },
    attach: { x: 0.72, y: 0.76 },
    poly: [
      { x: 0.62, y: 0.64 },
      { x: 0.72, y: 0.6 },
      { x: 0.8, y: 0.64 },
      { x: 0.82, y: 0.74 },
      { x: 0.78, y: 0.84 },
      { x: 0.68, y: 0.86 },
      { x: 0.6, y: 0.8 },
      { x: 0.58, y: 0.7 },
    ],
  },
  {
    id: 'brainstem',
    name: 'Brain stem',
    action: 'Breathing, heart rate, and basic life functions',
    fill: '#d95a5a',
    fillHover: '#e57474',
    fillActive: '#c04040',
    labelPos: { x: 0.62, y: 0.98 },
    attach: { x: 0.5, y: 0.82 },
    poly: [
      { x: 0.46, y: 0.7 },
      { x: 0.54, y: 0.7 },
      { x: 0.54, y: 0.88 },
      { x: 0.5, y: 0.92 },
      { x: 0.46, y: 0.88 },
    ],
  },
]

export function mapBrainPoint(box: BrainBox, p: Pt): Pt {
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

export function outlinePath(ctx: CanvasRenderingContext2D, box: BrainBox) {
  const first = mapBrainPoint(box, BRAIN_OUTLINE[0])
  ctx.beginPath()
  ctx.moveTo(first.x, first.y)
  for (let i = 1; i < BRAIN_OUTLINE.length; i++) {
    const p = mapBrainPoint(box, BRAIN_OUTLINE[i])
    ctx.lineTo(p.x, p.y)
  }
  ctx.closePath()
}

export function regionPath(ctx: CanvasRenderingContext2D, box: BrainBox, poly: Pt[]) {
  const first = mapBrainPoint(box, poly[0])
  ctx.beginPath()
  ctx.moveTo(first.x, first.y)
  for (let i = 1; i < poly.length; i++) {
    const p = mapBrainPoint(box, poly[i])
    ctx.lineTo(p.x, p.y)
  }
  ctx.closePath()
}

function drawSulci(
  ctx: CanvasRenderingContext2D,
  box: BrainBox,
  region: BrainRegion,
  active: boolean,
) {
  const ink = active ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.18)'
  ctx.strokeStyle = ink
  ctx.lineWidth = 1.1
  ctx.lineCap = 'round'

  if (region.id === 'cerebellum') {
    // Horizontal striations like the reference
    for (let i = 0; i < 6; i++) {
      const t = 0.12 + i * 0.12
      const y = region.poly[0].y + t * 0.22
      const a = mapBrainPoint(box, { x: 0.62, y })
      const b = mapBrainPoint(box, { x: 0.78, y: y + 0.01 })
      ctx.beginPath()
      ctx.moveTo(a.x, a.y)
      ctx.lineTo(b.x, b.y)
      ctx.stroke()
    }
    return
  }

  const c = brainCentroid(region.poly)
  for (let i = 0; i < 4; i++) {
    const a = mapBrainPoint(box, {
      x: c.x - 0.06 + i * 0.02,
      y: c.y - 0.08 + (i % 2) * 0.04,
    })
    const mid = mapBrainPoint(box, {
      x: c.x + 0.02 + i * 0.015,
      y: c.y - 0.02,
    })
    const b = mapBrainPoint(box, {
      x: c.x + 0.08,
      y: c.y + 0.06 - i * 0.015,
    })
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.quadraticCurveTo(mid.x, mid.y, b.x, b.y)
    ctx.stroke()
  }
}

function brainCentroid(poly: Pt[]): Pt {
  let sx = 0
  let sy = 0
  for (const p of poly) {
    sx += p.x
    sy += p.y
  }
  return { x: sx / poly.length, y: sy / poly.length }
}

/** Full brain: clipped lobe colors + outline stroke + exterior leader labels. */
export function drawAnatomicalBrain(
  ctx: CanvasRenderingContext2D,
  box: BrainBox,
  opts: {
    selected: BrainRegionId
    hover: BrainRegionId | null
    fontSize: number
    showLeaders?: boolean
  },
) {
  // Soft drop shadow (outside clip)
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.28)'
  ctx.shadowBlur = 16
  ctx.shadowOffsetY = 5
  outlinePath(ctx, box)
  ctx.fillStyle = '#ddd'
  ctx.fill()
  ctx.restore()

  // Clip ALL fills to silhouette — never bleed
  ctx.save()
  outlinePath(ctx, box)
  ctx.clip()

  for (const r of BRAIN_REGIONS) {
    const active = opts.selected === r.id
    const hover = opts.hover === r.id
    regionPath(ctx, box, r.poly)
    ctx.fillStyle = active ? r.fillActive : hover ? r.fillHover : r.fill
    ctx.fill()
    drawSulci(ctx, box, r, active || hover)
  }

  // Dim non-selected slightly when one is active (clarity)
  if (opts.selected) {
    for (const r of BRAIN_REGIONS) {
      if (r.id === opts.selected) continue
      regionPath(ctx, box, r.poly)
      ctx.fillStyle = 'rgba(255,255,255,0.08)'
      ctx.fill()
    }
  }

  // Highlight selected / hover stroke inside clip
  for (const r of BRAIN_REGIONS) {
    const active = opts.selected === r.id
    const hover = opts.hover === r.id
    if (!active && !hover) continue
    regionPath(ctx, box, r.poly)
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = active ? 2.8 : 2
    ctx.stroke()
  }

  ctx.restore()

  // Crisp outer contour
  outlinePath(ctx, box)
  ctx.strokeStyle = '#2c3e50'
  ctx.lineWidth = 2.2
  ctx.stroke()

  if (opts.showLeaders !== false) {
    drawLeaderLabels(ctx, box, opts.selected, opts.hover, opts.fontSize)
  }
}

function drawLeaderLabels(
  ctx: CanvasRenderingContext2D,
  box: BrainBox,
  selected: BrainRegionId,
  hover: BrainRegionId | null,
  fs: number,
) {
  const canvasW = ctx.canvas.clientWidth || box.x + box.w + 80
  const canvasH = ctx.canvas.clientHeight || box.y + box.h + 80
  ctx.font = `600 ${Math.max(11, fs - 1)}px Roboto, sans-serif`
  ctx.textBaseline = 'middle'

  for (const r of BRAIN_REGIONS) {
    const active = selected === r.id || hover === r.id
    const attach = mapBrainPoint(box, r.attach)
    let lx = box.x + r.labelPos.x * box.w
    let ly = box.y + r.labelPos.y * box.h

    // Push labels clearly outside the silhouette
    if (r.id === 'frontal') {
      lx = Math.max(8, box.x - 8)
      ly = box.y + box.h * 0.28
    } else if (r.id === 'parietal') {
      lx = box.x + box.w * 0.45
      ly = Math.max(16, box.y - 10)
    } else if (r.id === 'occipital') {
      lx = Math.min(canvasW - 8, box.x + box.w + 8)
      ly = box.y + box.h * 0.38
    } else if (r.id === 'temporal') {
      lx = Math.max(8, box.x - 4)
      ly = Math.min(canvasH - 56, box.y + box.h * 0.72)
    } else if (r.id === 'cerebellum') {
      lx = Math.min(canvasW - 8, box.x + box.w + 4)
      ly = Math.min(canvasH - 56, box.y + box.h * 0.85)
    } else {
      lx = box.x + box.w * 0.55
      ly = Math.min(canvasH - 56, box.y + box.h + 6)
    }

    ctx.strokeStyle = active ? '#1a252f' : 'rgba(44,62,80,0.55)'
    ctx.lineWidth = active ? 1.6 : 1.1
    ctx.beginPath()
    ctx.moveTo(attach.x, attach.y)
    ctx.lineTo(lx, ly)
    ctx.stroke()

    ctx.fillStyle = active ? '#1a252f' : 'rgba(44,62,80,0.75)'
    ctx.beginPath()
    ctx.arc(attach.x, attach.y, active ? 3.5 : 2.5, 0, Math.PI * 2)
    ctx.fill()

    const text = r.name
    const tw = ctx.measureText(text).width
    const padX = 8
    const padY = 5
    const boxW = tw + padX * 2
    const boxH = fs + padY * 2
    let bx = lx
    if (r.id === 'frontal' || r.id === 'temporal') bx = lx - boxW
    if (r.id === 'parietal') bx = lx - boxW / 2
    if (r.id === 'brainstem') bx = lx - boxW / 2
    bx = Math.max(4, Math.min(canvasW - boxW - 4, bx))
    const by = ly - boxH / 2

    ctx.fillStyle = active ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.9)'
    roundRect(ctx, bx, by, boxW, boxH, 6)
    ctx.fill()
    ctx.strokeStyle = active ? r.fillActive : 'rgba(0,0,0,0.08)'
    ctx.lineWidth = active ? 2 : 1
    ctx.stroke()

    ctx.fillStyle = '#1a252f'
    ctx.textAlign = 'left'
    ctx.fillText(text, bx + padX, ly + 0.5)
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

export function hitTestBrainRegion(box: BrainBox, px: number, py: number): BrainRegionId | null {
  const outlineMapped = BRAIN_OUTLINE.map((p) => mapBrainPoint(box, p))
  if (!pointInPoly(px, py, outlineMapped)) return null

  // Prefer smaller / later regions (brainstem, cerebellum) when overlapping edges
  for (let i = BRAIN_REGIONS.length - 1; i >= 0; i--) {
    const r = BRAIN_REGIONS[i]
    const mapped = r.poly.map((p) => mapBrainPoint(box, p))
    if (pointInPoly(px, py, mapped)) return r.id
  }
  return null
}

export function brainLabelAnchor(box: BrainBox, region: BrainRegion): Pt {
  return mapBrainPoint(box, brainCentroid(region.poly))
}
