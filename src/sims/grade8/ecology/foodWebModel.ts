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

export function createFoodWebState(): FoodWebState {
  return {
    nodes: [
      { id: 'grass', name: 'Grass', level: 'producer', x: 0.2, y: 0.7 },
      { id: 'rabbit', name: 'Rabbit', level: 'herbivore', x: 0.45, y: 0.5 },
      { id: 'fox', name: 'Fox', level: 'carnivore', x: 0.7, y: 0.3 },
      { id: 'fungi', name: 'Fungi', level: 'decomposer', x: 0.75, y: 0.75 },
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
