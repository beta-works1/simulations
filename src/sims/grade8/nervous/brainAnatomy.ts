/**
 * Lateral brain — Gray's Anatomy–style reference art + hit regions.
 * Base illustration: /assets/brain-lateral.svg
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
  /** Hit polygon in normalized SVG viewBox space (0–1). */
  poly: Pt[]
  accent: string
  fill: string
  fillHover: string
  fillActive: string
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

/** SVG viewBox is 640×480 — regions match the drawing. */
export const BRAIN_REGIONS: BrainRegion[] = [
  {
    id: 'frontal',
    name: 'Frontal lobe',
    part: 'cerebrum',
    action: 'Thinking, planning, and voluntary movement',
    detail:
      'Part of the cerebrum. Controls reasoning, decision-making, and voluntary muscle movements.',
    examples: ['Planning homework', 'Speaking', 'Kicking a ball'],
    accent: '#e74c3c',
    fill: 'rgba(231,76,60,0.28)',
    fillHover: 'rgba(231,76,60,0.42)',
    fillActive: 'rgba(231,76,60,0.55)',
    poly: [
      { x: 0.18, y: 0.42 },
      { x: 0.2, y: 0.28 },
      { x: 0.28, y: 0.18 },
      { x: 0.4, y: 0.14 },
      { x: 0.5, y: 0.2 },
      { x: 0.48, y: 0.42 },
      { x: 0.4, y: 0.52 },
      { x: 0.3, y: 0.55 },
      { x: 0.22, y: 0.5 },
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
    accent: '#3498db',
    fill: 'rgba(52,152,219,0.28)',
    fillHover: 'rgba(52,152,219,0.42)',
    fillActive: 'rgba(52,152,219,0.55)',
    poly: [
      { x: 0.5, y: 0.14 },
      { x: 0.58, y: 0.12 },
      { x: 0.7, y: 0.18 },
      { x: 0.76, y: 0.28 },
      { x: 0.72, y: 0.42 },
      { x: 0.6, y: 0.44 },
      { x: 0.52, y: 0.36 },
      { x: 0.5, y: 0.22 },
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
    accent: '#e67e22',
    fill: 'rgba(230,126,34,0.28)',
    fillHover: 'rgba(230,126,34,0.42)',
    fillActive: 'rgba(230,126,34,0.55)',
    poly: [
      { x: 0.3, y: 0.52 },
      { x: 0.42, y: 0.48 },
      { x: 0.55, y: 0.48 },
      { x: 0.62, y: 0.55 },
      { x: 0.58, y: 0.68 },
      { x: 0.45, y: 0.72 },
      { x: 0.32, y: 0.68 },
      { x: 0.28, y: 0.58 },
    ],
  },
  {
    id: 'occipital',
    name: 'Occipital lobe',
    part: 'cerebrum',
    action: 'Vision — processing what the eyes see',
    detail:
      'Part of the cerebrum. Visual centre at the back of the brain; interprets images from the eyes.',
    examples: ['Reading words on a page', 'Recognising colours', 'Catching a moving ball'],
    accent: '#27ae60',
    fill: 'rgba(39,174,96,0.28)',
    fillHover: 'rgba(39,174,96,0.42)',
    fillActive: 'rgba(39,174,96,0.55)',
    poly: [
      { x: 0.72, y: 0.24 },
      { x: 0.82, y: 0.28 },
      { x: 0.88, y: 0.4 },
      { x: 0.86, y: 0.52 },
      { x: 0.78, y: 0.56 },
      { x: 0.7, y: 0.46 },
      { x: 0.7, y: 0.32 },
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
    accent: '#8e2d5a',
    fill: 'rgba(142,45,90,0.32)',
    fillHover: 'rgba(142,45,90,0.45)',
    fillActive: 'rgba(142,45,90,0.6)',
    poly: [
      { x: 0.66, y: 0.64 },
      { x: 0.74, y: 0.62 },
      { x: 0.82, y: 0.68 },
      { x: 0.84, y: 0.8 },
      { x: 0.78, y: 0.88 },
      { x: 0.68, y: 0.86 },
      { x: 0.62, y: 0.76 },
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
    accent: '#c0392b',
    fill: 'rgba(192,57,43,0.32)',
    fillHover: 'rgba(192,57,43,0.45)',
    fillActive: 'rgba(192,57,43,0.6)',
    poly: [
      { x: 0.55, y: 0.72 },
      { x: 0.62, y: 0.72 },
      { x: 0.64, y: 0.84 },
      { x: 0.62, y: 0.94 },
      { x: 0.56, y: 0.94 },
      { x: 0.54, y: 0.82 },
    ],
  },
]

let brainImage: HTMLImageElement | null = null
let brainImageStatus: 'idle' | 'loading' | 'ready' | 'error' = 'idle'

export function ensureBrainImage(): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null
  if (brainImageStatus === 'ready') return brainImage
  if (brainImageStatus === 'loading' || brainImageStatus === 'error') return brainImage
  brainImageStatus = 'loading'
  brainImage = new Image()
  brainImage.decoding = 'async'
  brainImage.onload = () => {
    brainImageStatus = 'ready'
  }
  brainImage.onerror = () => {
    brainImageStatus = 'error'
  }
  brainImage.src = '/assets/brain-lateral.svg'
  return brainImage
}

export function mapPt(box: BrainBox, p: Pt): Pt {
  return { x: box.x + p.x * box.w, y: box.y + p.y * box.h }
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

/** Fallback canvas drawing if SVG fails to load. */
function drawFallbackBrain(ctx: CanvasRenderingContext2D, box: BrainBox) {
  ctx.save()
  ctx.translate(box.x, box.y)
  ctx.scale(box.w / 640, box.h / 480)

  ctx.shadowColor = 'rgba(0,0,0,0.18)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetY = 4

  // Cerebrum
  ctx.beginPath()
  ctx.moveTo(118, 210)
  ctx.bezierCurveTo(108, 170, 122, 118, 168, 88)
  ctx.bezierCurveTo(220, 52, 290, 42, 360, 48)
  ctx.bezierCurveTo(430, 54, 500, 78, 540, 120)
  ctx.bezierCurveTo(568, 150, 580, 190, 572, 230)
  ctx.bezierCurveTo(566, 260, 548, 285, 520, 298)
  ctx.bezierCurveTo(500, 308, 478, 308, 458, 300)
  ctx.bezierCurveTo(448, 320, 420, 345, 380, 355)
  ctx.bezierCurveTo(350, 362, 320, 352, 300, 335)
  ctx.bezierCurveTo(270, 350, 220, 345, 180, 320)
  ctx.bezierCurveTo(150, 300, 128, 260, 118, 210)
  ctx.closePath()
  const g = ctx.createLinearGradient(120, 50, 560, 340)
  g.addColorStop(0, '#f6d7c3')
  g.addColorStop(0.5, '#e8b896')
  g.addColorStop(1, '#d49872')
  ctx.fillStyle = g
  ctx.fill()
  ctx.shadowColor = 'transparent'
  ctx.strokeStyle = '#5a3b2a'
  ctx.lineWidth = 2.4
  ctx.stroke()

  // Cerebellum
  ctx.beginPath()
  ctx.moveTo(430, 300)
  ctx.bezierCurveTo(455, 292, 495, 300, 520, 330)
  ctx.bezierCurveTo(538, 352, 540, 385, 520, 408)
  ctx.bezierCurveTo(498, 430, 460, 435, 430, 420)
  ctx.bezierCurveTo(405, 408, 390, 380, 392, 350)
  ctx.bezierCurveTo(394, 325, 408, 308, 430, 300)
  ctx.closePath()
  ctx.fillStyle = '#d49880'
  ctx.fill()
  ctx.stroke()

  // Stem
  ctx.beginPath()
  ctx.moveTo(360, 340)
  ctx.bezierCurveTo(385, 335, 405, 350, 410, 380)
  ctx.bezierCurveTo(414, 410, 405, 445, 390, 460)
  ctx.bezierCurveTo(370, 472, 350, 460, 345, 430)
  ctx.bezierCurveTo(340, 400, 345, 355, 360, 340)
  ctx.closePath()
  ctx.fillStyle = '#dea88a'
  ctx.fill()
  ctx.stroke()
  ctx.restore()
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
    pulse: number
    feedback: 'correct' | 'wrong' | null
  },
) {
  const img = ensureBrainImage()
  if (img && brainImageStatus === 'ready' && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, box.x, box.y, box.w, box.h)
  } else {
    ensureBrainImage()
    drawFallbackBrain(ctx, box)
  }

  // Soft translucent tints only — let the illustration stay readable
  for (const r of BRAIN_REGIONS) {
    const active = opts.selected === r.id
    const hover = opts.hover === r.id
    if (!active && !hover) continue
    tracePoly(ctx, box, r.poly)
    ctx.fillStyle = active ? r.fillActive : r.fillHover
    ctx.fill()
    ctx.strokeStyle = active ? r.accent : 'rgba(255,255,255,0.7)'
    ctx.lineWidth = active ? 2.5 : 1.8
    ctx.lineJoin = 'round'
    ctx.stroke()

    if (active) {
      const glow = 0.2 + 0.12 * Math.sin(opts.pulse * 3.2)
      ctx.save()
      ctx.shadowColor = `rgba(255,255,255,${glow})`
      ctx.shadowBlur = 10
      tracePoly(ctx, box, r.poly)
      ctx.strokeStyle = r.accent
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.restore()
    }
  }

  // Single clean label on selected region only
  const selected = BRAIN_REGIONS.find((r) => r.id === opts.selected)
  if (selected) {
    const c = regionCentroid(box, selected)
    ctx.font = '600 12px Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const tw = ctx.measureText(selected.name).width
    const padX = 10
    const padY = 6
    roundRect(ctx, c.x - tw / 2 - padX, c.y - 11, tw + padX * 2, 22, 8)
    ctx.fillStyle = 'rgba(255,255,255,0.96)'
    ctx.fill()
    ctx.strokeStyle = selected.accent
    ctx.lineWidth = 1.8
    ctx.stroke()
    ctx.fillStyle = '#1a252f'
    ctx.fillText(selected.name, c.x, c.y + 0.5)
  }

  if (opts.feedback) {
    ctx.fillStyle =
      opts.feedback === 'correct' ? 'rgba(39,174,96,0.12)' : 'rgba(231,76,60,0.12)'
    roundRect(ctx, box.x - 6, box.y - 6, box.w + 12, box.h + 12, 12)
    ctx.fill()
  }
}

export function hitTestBrainRegion(box: BrainBox, px: number, py: number): BrainRegionId | null {
  for (let i = BRAIN_REGIONS.length - 1; i >= 0; i--) {
    const r = BRAIN_REGIONS[i]
    const mapped = r.poly.map((p) => mapPt(box, p))
    if (pointInPoly(px, py, mapped)) return r.id
  }
  return null
}
