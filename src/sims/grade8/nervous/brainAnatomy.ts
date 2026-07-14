/**
 * Lateral brain — SVG illustration + Path2D hit/highlight regions
 * that follow the same anatomy (Gray’s / textbook lateral view).
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
  /** SVG path in viewBox units (640×480). */
  pathD: string
  accent: string
  fill: string
  fillHover: string
  fillActive: string
  /** Label anchor in viewBox px. */
  label: Pt
}

export type BrainBox = { x: number; y: number; w: number; h: number }

export const SVG_W = 640
export const SVG_H = 480

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

/**
 * Region paths aligned to the SVG drawing:
 * - frontal / parietal split by central sulcus (~x 330)
 * - temporal below Sylvian fissure
 * - occipital at the occipital pole
 * - cerebellum & brainstem match SVG paths exactly
 */
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
    fill: 'rgba(231,76,60,0.32)',
    fillHover: 'rgba(231,76,60,0.48)',
    fillActive: 'rgba(231,76,60,0.58)',
    label: { x: 230, y: 170 },
    // Left of central sulcus, above Sylvian fissure — traces cerebrum outer edge
    pathD: `
      M118,210
      C108,170 122,118 168,88
      C220,52 280,44 330,48
      L330,90
      C335,130 332,180 318,235
      C290,230 250,218 210,210
      C175,245 145,260 130,230
      C122,220 120,214 118,210
      Z`,
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
    fill: 'rgba(52,152,219,0.32)',
    fillHover: 'rgba(52,152,219,0.48)',
    fillActive: 'rgba(52,152,219,0.58)',
    label: { x: 420, y: 130 },
    // Between central sulcus and occipital, above Sylvian / lateral edge
    pathD: `
      M330,48
      C380,50 450,62 500,95
      C520,115 535,145 540,175
      C520,185 480,195 445,210
      C400,220 360,235 330,245
      C335,190 338,140 330,90
      L330,48
      Z`,
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
    fill: 'rgba(230,126,34,0.32)',
    fillHover: 'rgba(230,126,34,0.48)',
    fillActive: 'rgba(230,126,34,0.58)',
    label: { x: 300, y: 290 },
    // Below Sylvian fissure along lower cerebrum edge
    pathD: `
      M210,210
      C280,205 350,230 400,255
      C390,285 370,320 345,345
      C320,355 290,348 270,335
      C230,340 180,330 150,305
      C140,275 155,245 180,230
      C190,220 200,214 210,210
      Z`,
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
    fill: 'rgba(39,174,96,0.32)',
    fillHover: 'rgba(39,174,96,0.48)',
    fillActive: 'rgba(39,174,96,0.58)',
    label: { x: 530, y: 220 },
    // Occipital pole (rear of cerebrum)
    pathD: `
      M500,95
      C530,115 560,150 572,195
      C578,225 568,265 540,290
      C520,300 490,300 465,292
      C455,260 450,230 445,210
      C470,195 490,175 500,155
      C505,140 505,120 500,95
      Z`,
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
    fill: 'rgba(142,45,90,0.4)',
    fillHover: 'rgba(142,45,90,0.55)',
    fillActive: 'rgba(142,45,90,0.65)',
    label: { x: 465, y: 365 },
    // Exact SVG cerebellum path
    pathD: `
      M430,300
      C455,292 495,300 520,330
      C538,352 540,385 520,408
      C498,430 460,435 430,420
      C405,408 390,380 392,350
      C394,325 408,308 430,300
      Z`,
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
    fill: 'rgba(192,57,43,0.4)',
    fillHover: 'rgba(192,57,43,0.55)',
    fillActive: 'rgba(192,57,43,0.65)',
    label: { x: 378, y: 400 },
    // Exact SVG brainstem path
    pathD: `
      M360,340
      C385,335 405,350 410,380
      C414,410 405,445 390,460
      C370,472 350,460 345,430
      C340,400 345,355 360,340
      Z`,
  },
]

const pathCache = new Map<string, Path2D>()

function getPath(region: BrainRegion): Path2D {
  let p = pathCache.get(region.id)
  if (!p) {
    p = new Path2D(region.pathD)
    pathCache.set(region.id, p)
  }
  return p
}

let brainImage: HTMLImageElement | null = null
let brainImageStatus: 'idle' | 'loading' | 'ready' | 'error' = 'idle'

export function ensureBrainImage(): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null
  if (brainImageStatus === 'ready' || brainImageStatus === 'loading' || brainImageStatus === 'error')
    return brainImage
  brainImageStatus = 'loading'
  brainImage = new Image()
  brainImage.decoding = 'async'
  brainImage.onload = () => {
    brainImageStatus = 'ready'
  }
  brainImage.onerror = () => {
    brainImageStatus = 'error'
  }
  // Bust cache after art updates
  brainImage.src = `/assets/brain-lateral.svg?v=2`
  return brainImage
}

function withBrainSpace(
  ctx: CanvasRenderingContext2D,
  box: BrainBox,
  fn: () => void,
) {
  ctx.save()
  ctx.translate(box.x, box.y)
  ctx.scale(box.w / SVG_W, box.h / SVG_H)
  fn()
  ctx.restore()
}

function drawFallbackBrain(ctx: CanvasRenderingContext2D, box: BrainBox) {
  withBrainSpace(ctx, box, () => {
    ctx.shadowColor = 'rgba(0,0,0,0.16)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetY = 3
    const cere = new Path2D(`M118,210
      C108,170 122,118 168,88 C220,52 290,42 360,48
      C430,54 500,78 540,120 C568,150 580,190 572,230
      C566,260 548,285 520,298 C500,308 478,308 458,300
      C448,320 420,345 380,355 C350,362 320,352 300,335
      C270,350 220,345 180,320 C150,300 128,260 118,210 Z`)
    const g = ctx.createLinearGradient(120, 50, 560, 340)
    g.addColorStop(0, '#f7dcc8')
    g.addColorStop(0.5, '#e8b896')
    g.addColorStop(1, '#d49872')
    ctx.fillStyle = g
    ctx.fill(cere)
    ctx.shadowColor = 'transparent'
    ctx.strokeStyle = '#5a3b2a'
    ctx.lineWidth = 2.4
    ctx.stroke(cere)

    for (const id of ['cerebellum', 'brainstem'] as const) {
      const r = BRAIN_REGIONS.find((x) => x.id === id)!
      ctx.fillStyle = id === 'cerebellum' ? '#d9a088' : '#dea88a'
      ctx.fill(getPath(r))
      ctx.stroke(getPath(r))
    }
  })
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

export function regionCentroid(box: BrainBox, region: BrainRegion): Pt {
  return {
    x: box.x + (region.label.x / SVG_W) * box.w,
    y: box.y + (region.label.y / SVG_H) * box.h,
  }
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

  withBrainSpace(ctx, box, () => {
    for (const r of BRAIN_REGIONS) {
      const active = opts.selected === r.id
      const hover = opts.hover === r.id
      if (!active && !hover) continue
      const path = getPath(r)
      ctx.fillStyle = active ? r.fillActive : r.fillHover
      ctx.fill(path)
      ctx.strokeStyle = active ? r.accent : 'rgba(255,255,255,0.85)'
      ctx.lineWidth = active ? 2.8 : 2
      ctx.lineJoin = 'round'
      ctx.stroke(path)
      if (active) {
        const glow = 0.18 + 0.1 * Math.sin(opts.pulse * 3.2)
        ctx.shadowColor = `rgba(255,255,255,${glow})`
        ctx.shadowBlur = 8
        ctx.strokeStyle = r.accent
        ctx.lineWidth = 2
        ctx.stroke(path)
        ctx.shadowBlur = 0
      }
    }
  })

  const selected = BRAIN_REGIONS.find((r) => r.id === opts.selected)
  if (selected) {
    const c = regionCentroid(box, selected)
    ctx.font = '600 12px Roboto, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const tw = ctx.measureText(selected.name).width
    const padX = 10
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
  // Inverse map into SVG space, test Path2D
  const sx = ((px - box.x) / box.w) * SVG_W
  const sy = ((py - box.y) / box.h) * SVG_H

  // Prefer smaller rear structures first (stem / cerebellum over cerebrum lobes)
  const order: BrainRegionId[] = [
    'brainstem',
    'cerebellum',
    'occipital',
    'temporal',
    'parietal',
    'frontal',
  ]
  const canvas = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(1, 1)
    : document.createElement('canvas')
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null
  if (!ctx) return null

  for (const id of order) {
    const r = BRAIN_REGIONS.find((x) => x.id === id)!
    if (ctx.isPointInPath(getPath(r), sx, sy)) return id
  }
  return null
}
