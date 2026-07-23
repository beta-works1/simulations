export type BrainRegionId =
  | 'frontal'
  | 'parietal'
  | 'temporal'
  | 'occipital'
  | 'cerebellum'
  | 'brainstem'

export type BrainPart = 'cerebrum' | 'cerebellum' | 'brainstem'

export type BrainRegion = {
  id: BrainRegionId
  name: string
  part: BrainPart
  action: string
  detail: string
  examples: string[]
  pathD: string
  accent: string
  fill: string
  fillHover: string
  fillActive: string
  label: { x: number; y: number }
}

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

export const BRAIN_REGIONS: BrainRegion[] = [
  {
    id: 'frontal',
    name: 'Frontal lobe',
    part: 'cerebrum',
    action: 'Thinking, planning, and voluntary movement',
    detail:
      'Controls reasoning, decision-making, and voluntary muscle movements.',
    examples: ['Planning homework', 'Speaking', 'Kicking a ball'],
    accent: '#e74c3c',
    fill: 'rgba(231,76,60,0.38)',
    fillHover: 'rgba(231,76,60,0.52)',
    fillActive: 'rgba(231,76,60,0.65)',
    label: { x: 230, y: 170 },
    pathD: `M118,210 C108,170 122,118 168,88 C220,52 280,44 330,48 L330,90 C335,130 332,180 318,235 C290,230 250,218 210,210 C175,245 145,260 130,230 C122,220 120,214 118,210 Z`,
  },
  {
    id: 'parietal',
    name: 'Parietal lobe',
    part: 'cerebrum',
    action: 'Touch, pain, temperature, and body position',
    detail:
      'Receives and processes sensory information from the skin and body.',
    examples: ['Feeling heat from a cup', 'Touching a textured surface', 'Knowing where your hand is'],
    accent: '#3498db',
    fill: 'rgba(52,152,219,0.38)',
    fillHover: 'rgba(52,152,219,0.52)',
    fillActive: 'rgba(52,152,219,0.65)',
    label: { x: 420, y: 130 },
    pathD: `M330,48 C380,50 450,62 500,95 C520,115 535,145 540,175 C520,185 480,195 445,210 C400,220 360,235 330,245 C335,190 338,140 330,90 L330,48 Z`,
  },
  {
    id: 'temporal',
    name: 'Temporal lobe',
    part: 'cerebrum',
    action: 'Hearing, memory, and language',
    detail:
      'Interprets sounds and helps store and recall memories and language.',
    examples: ['Listening to music', 'Remembering a lesson', 'Understanding speech'],
    accent: '#e67e22',
    fill: 'rgba(230,126,34,0.38)',
    fillHover: 'rgba(230,126,34,0.52)',
    fillActive: 'rgba(230,126,34,0.65)',
    label: { x: 300, y: 290 },
    pathD: `M210,210 C280,205 350,230 400,255 C390,285 370,320 345,345 C320,355 290,348 270,335 C230,340 180,330 150,305 C140,275 155,245 180,230 C190,220 200,214 210,210 Z`,
  },
  {
    id: 'occipital',
    name: 'Occipital lobe',
    part: 'cerebrum',
    action: 'Vision — processing what the eyes see',
    detail:
      'Visual centre at the back of the brain; interprets images from the eyes.',
    examples: ['Reading words on a page', 'Recognising colours', 'Catching a moving ball'],
    accent: '#27ae60',
    fill: 'rgba(39,174,96,0.38)',
    fillHover: 'rgba(39,174,96,0.52)',
    fillActive: 'rgba(39,174,96,0.65)',
    label: { x: 530, y: 220 },
    pathD: `M500,95 C530,115 560,150 572,195 C578,225 568,265 540,290 C520,300 490,300 465,292 C455,260 450,230 445,210 C470,195 490,175 500,155 C505,140 505,120 500,95 Z`,
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
    fill: 'rgba(142,45,90,0.45)',
    fillHover: 'rgba(142,45,90,0.58)',
    fillActive: 'rgba(142,45,90,0.7)',
    label: { x: 465, y: 365 },
    pathD: `M430,300 C455,292 495,300 520,330 C538,352 540,385 520,408 C498,430 460,435 430,420 C405,408 390,380 392,350 C394,325 408,308 430,300 Z`,
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
    fill: 'rgba(192,57,43,0.45)',
    fillHover: 'rgba(192,57,43,0.58)',
    fillActive: 'rgba(192,57,43,0.7)',
    label: { x: 378, y: 400 },
    pathD: `M360,340 C385,335 405,350 410,380 C414,410 405,445 390,460 C370,472 350,460 345,430 C340,400 345,355 360,340 Z`,
  },
]

export const CEREBRUM_OUTLINE = `M118,210 C108,170 122,118 168,88 C220,52 290,42 360,48 C430,54 500,78 540,120 C568,150 580,190 572,230 C566,260 548,285 520,298 C500,308 478,308 458,300 C448,320 420,345 380,355 C350,362 320,352 300,335 C270,350 220,345 180,320 C150,300 128,260 118,210 Z`
