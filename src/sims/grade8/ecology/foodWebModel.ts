export type TrophicLevel = 'producer' | 'herbivore' | 'carnivore' | 'decomposer'

export interface FoodNode {
  id: string
  name: string
  level: TrophicLevel
  x: number
  y: number
}

export interface FoodLink {
  from: string
  to: string
}

export interface FoodWebState {
  nodes: FoodNode[]
  links: FoodLink[]
  energyPulse: number
  selectedId: string | null
}

const COLORS: Record<TrophicLevel, string> = {
  producer: '#27ae60',
  herbivore: '#f1c40f',
  carnivore: '#e74c3c',
  decomposer: '#8e44ad',
}

export function levelColor(level: TrophicLevel) {
  return COLORS[level]
}

/** Simple starter web: grass → rabbit → fox, plus decomposer links. */
export function createFoodWebState(): FoodWebState {
  return {
    nodes: [
      { id: 'grass', name: 'Grass', level: 'producer', x: 0.18, y: 0.72 },
      { id: 'rabbit', name: 'Rabbit', level: 'herbivore', x: 0.42, y: 0.52 },
      { id: 'fox', name: 'Fox', level: 'carnivore', x: 0.68, y: 0.32 },
      { id: 'fungi', name: 'Fungi', level: 'decomposer', x: 0.78, y: 0.78 },
    ],
    links: [
      { from: 'grass', to: 'rabbit' },
      { from: 'rabbit', to: 'fox' },
      { from: 'grass', to: 'fungi' },
      { from: 'rabbit', to: 'fungi' },
    ],
    energyPulse: 0,
    selectedId: null,
  }
}

/** Linear grassland chain: Sun → grass → grasshopper → frog → snake → eagle. */
export function createGrasslandChainState(): FoodWebState {
  return {
    nodes: [
      { id: 'grass', name: 'Grass', level: 'producer', x: 0.12, y: 0.78 },
      { id: 'grasshopper', name: 'Grasshopper', level: 'herbivore', x: 0.3, y: 0.62 },
      { id: 'frog', name: 'Frog', level: 'carnivore', x: 0.48, y: 0.46 },
      { id: 'snake', name: 'Snake', level: 'carnivore', x: 0.66, y: 0.3 },
      { id: 'eagle', name: 'Eagle', level: 'carnivore', x: 0.84, y: 0.16 },
    ],
    links: [
      { from: 'grass', to: 'grasshopper' },
      { from: 'grasshopper', to: 'frog' },
      { from: 'frog', to: 'snake' },
      { from: 'snake', to: 'eagle' },
    ],
    energyPulse: 0,
    selectedId: null,
  }
}

/** Grassland food web with branching links (Grade 8 example). */
export function createGrasslandWebState(): FoodWebState {
  return {
    nodes: [
      { id: 'grass', name: 'Grass', level: 'producer', x: 0.14, y: 0.8 },
      { id: 'grasshopper', name: 'Grasshopper', level: 'herbivore', x: 0.32, y: 0.62 },
      { id: 'rabbit', name: 'Rabbit', level: 'herbivore', x: 0.28, y: 0.42 },
      { id: 'mouse', name: 'Mouse', level: 'herbivore', x: 0.22, y: 0.22 },
      { id: 'frog', name: 'Frog', level: 'carnivore', x: 0.5, y: 0.55 },
      { id: 'bird', name: 'Bird', level: 'carnivore', x: 0.52, y: 0.28 },
      { id: 'snake', name: 'Snake', level: 'carnivore', x: 0.72, y: 0.42 },
      { id: 'eagle', name: 'Eagle', level: 'carnivore', x: 0.88, y: 0.18 },
      { id: 'fungi', name: 'Fungi', level: 'decomposer', x: 0.86, y: 0.82 },
    ],
    links: [
      { from: 'grass', to: 'grasshopper' },
      { from: 'grass', to: 'rabbit' },
      { from: 'grass', to: 'mouse' },
      { from: 'grasshopper', to: 'frog' },
      { from: 'grasshopper', to: 'bird' },
      { from: 'frog', to: 'snake' },
      { from: 'mouse', to: 'snake' },
      { from: 'snake', to: 'eagle' },
      { from: 'bird', to: 'eagle' },
      { from: 'grass', to: 'fungi' },
      { from: 'rabbit', to: 'fungi' },
      { from: 'grasshopper', to: 'fungi' },
      { from: 'mouse', to: 'fungi' },
      { from: 'frog', to: 'fungi' },
      { from: 'snake', to: 'fungi' },
    ],
    energyPulse: 0,
    selectedId: null,
  }
}

export function stepFoodWeb(s: FoodWebState, dt: number): FoodWebState {
  return { ...s, energyPulse: s.energyPulse + dt }
}

export function addSpecies(s: FoodWebState, level: TrophicLevel, name: string): FoodWebState {
  const id = `${level}-${Date.now()}`
  const node: FoodNode = {
    id,
    name,
    level,
    x: 0.3 + Math.random() * 0.4,
    y: 0.25 + Math.random() * 0.5,
  }
  const prey = s.nodes.find((n) => {
    if (level === 'herbivore') return n.level === 'producer'
    if (level === 'carnivore') return n.level === 'herbivore'
    if (level === 'decomposer') return n.level !== 'decomposer'
    return false
  })
  const links = prey ? [...s.links, { from: prey.id, to: id }] : s.links
  return { ...s, nodes: [...s.nodes, node], links }
}

export function moveNode(s: FoodWebState, id: string, x: number, y: number): FoodWebState {
  return {
    ...s,
    nodes: s.nodes.map((n) => (n.id === id ? { ...n, x: clamp01(x), y: clamp01(y) } : n)),
  }
}

function clamp01(n: number) {
  return Math.max(0.08, Math.min(0.92, n))
}
