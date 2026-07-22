/** Energy flow, stability, and trophic analysis for food webs. */

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
  linkFromId: string | null
  removedIds: string[]
}

export const BASE_PRODUCER_ENERGY = 10000
export const ENERGY_TRANSFER = 0.1

const COLORS: Record<TrophicLevel, string> = {
  producer: '#27ae60',
  herbivore: '#f1c40f',
  carnivore: '#e74c3c',
  decomposer: '#8e44ad',
}

export function levelColor(level: TrophicLevel) {
  return COLORS[level]
}

export function canLink(from: FoodNode, to: FoodNode): boolean {
  if (from.id === to.id) return false
  if (to.level === 'producer') return false
  if (from.level === 'decomposer') return false
  if (to.level === 'decomposer') return true
  if (from.level === 'producer' && to.level === 'herbivore') return true
  if (from.level === 'herbivore' && to.level === 'carnivore') return true
  if (from.level === 'carnivore' && to.level === 'carnivore') return true
  return false
}

export function linkExists(links: FoodLink[], fromId: string, toId: string): boolean {
  return links.some((l) => l.from === fromId && l.to === toId)
}

function withDefaults(s: FoodWebState): FoodWebState {
  return { ...s, removedIds: s.removedIds ?? [] }
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
    linkFromId: null,
    removedIds: [],
  }
}

/** Linear grassland chain: grass → grasshopper → frog → snake → eagle. */
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
    linkFromId: null,
    removedIds: [],
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
    linkFromId: null,
    removedIds: [],
  }
}

export function stepFoodWeb(s: FoodWebState, dt: number): FoodWebState {
  return { ...s, energyPulse: s.energyPulse + dt }
}

/** Consumer links only (exclude decomposer edges for energy transfer). */
function consumerLinks(s: FoodWebState): FoodLink[] {
  return s.links.filter((l) => {
    const to = s.nodes.find((n) => n.id === l.to)
    return to && to.level !== 'decomposer'
  })
}

/** Energy at each node using the 10% rule from producers downward. */
export function computeNodeEnergy(s: FoodWebState, base = BASE_PRODUCER_ENERGY): Map<string, number> {
  const energy = new Map<string, number>()
  const producers = s.nodes.filter((n) => n.level === 'producer')
  if (producers.length === 0) return energy

  const perProducer = base / producers.length
  producers.forEach((p) => energy.set(p.id, perProducer))

  const links = consumerLinks(s)
  let changed = true
  let guard = 0
  while (changed && guard++ < s.nodes.length * 3) {
    changed = false
    for (const node of s.nodes) {
      if (node.level === 'producer' || node.level === 'decomposer') continue
      const incoming = links.filter((l) => l.to === node.id)
      if (incoming.length === 0) continue
      let sum = 0
      for (const l of incoming) {
        const src = energy.get(l.from) ?? 0
        sum += src * ENERGY_TRANSFER
      }
      const prev = energy.get(node.id) ?? 0
      if (Math.abs(sum - prev) > 0.01) {
        energy.set(node.id, sum)
        changed = true
      }
    }
  }

  for (const node of s.nodes.filter((n) => n.level === 'decomposer')) {
    const incoming = s.links.filter((l) => l.to === node.id)
    let sum = 0
    for (const l of incoming) {
      sum += (energy.get(l.from) ?? BASE_PRODUCER_ENERGY * 0.01) * 0.05
    }
    energy.set(node.id, sum)
  }

  return energy
}

/** Longest feeding path from a producer (trophic depth). */
export function trophicDepth(s: FoodWebState, id: string): number {
  const node = s.nodes.find((n) => n.id === id)
  if (!node) return 0
  if (node.level === 'producer') return 1
  if (node.level === 'decomposer') return 0

  const preds = consumerLinks(s)
    .filter((l) => l.to === id)
    .map((l) => l.from)
  if (preds.length === 0) return node.level === 'herbivore' ? 2 : 3
  return 1 + Math.max(...preds.map((p) => trophicDepth(s, p)))
}

export interface StabilityReport {
  score: number
  atRisk: string[]
  message: string
}

/** Web stability: redundancy of food sources for consumers. */
export function webStability(s: FoodWebState): StabilityReport {
  const consumers = s.nodes.filter((n) => n.level !== 'producer' && n.level !== 'decomposer')
  if (consumers.length === 0) {
    return { score: 100, atRisk: [], message: 'Add consumers to explore stability.' }
  }

  const atRisk: string[] = []
  let redundancy = 0
  for (const c of consumers) {
    const preyLinks = s.links.filter((l) => l.to === c.id && l.from !== c.id)
    const preyCount = preyLinks.length
    if (c.level !== 'decomposer' && preyCount === 0) atRisk.push(c.id)
    else if (c.level !== 'decomposer' && preyCount === 1) atRisk.push(c.id)
    redundancy += Math.min(preyCount, 3)
  }

  const maxRedundancy = consumers.length * 3
  const score = Math.round((redundancy / Math.max(1, maxRedundancy)) * 70 + (atRisk.length === 0 ? 30 : 0))
  const names = atRisk.map((id) => s.nodes.find((n) => n.id === id)?.name ?? id)

  let message = 'This web is stable — most consumers have backup food sources.'
  if (atRisk.length > 0) {
    message =
      atRisk.length === 1
        ? `${names[0]} depends on a single food source. Removing it could cause a population crash.`
        : `${names.slice(0, 3).join(', ')} rely on only one food source. A diverse web is more resilient.`
  }

  return { score: Math.min(100, score), atRisk, message }
}

export interface RemovalImpact {
  starved: string[]
  message: string
}

/** Who loses a food source if this species is removed? */
export function removalImpact(s: FoodWebState, id: string): RemovalImpact {
  const target = s.nodes.find((n) => n.id === id)
  if (!target) return { starved: [], message: '' }

  const starved = s.nodes
    .filter((n) => {
      if (n.id === id) return false
      const prey = s.links.filter((l) => l.to === n.id).map((l) => l.from)
      if (!prey.includes(id)) return false
      return prey.length <= 1
    })
    .map((n) => n.name)

  let message = `Removing ${target.name} breaks ${s.links.filter((l) => l.from === id || l.to === id).length} link(s).`
  if (starved.length > 0) {
    message += ` ${starved.join(' and ')} would lose their only food source.`
  } else if (target.level === 'producer') {
    message += ' Other producers may still support herbivores in a diverse web.'
  } else {
    message += ' Other paths in the web may absorb the change.'
  }

  return { starved, message }
}

export function formatEnergy(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return n.toFixed(n < 10 ? 1 : 0)
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
  return withDefaults({ ...s, nodes: [...s.nodes, node], links, selectedId: id, linkFromId: null })
}

export function removeNode(s: FoodWebState, id: string): FoodWebState {
  return withDefaults({
    ...s,
    nodes: s.nodes.filter((n) => n.id !== id),
    links: s.links.filter((l) => l.from !== id && l.to !== id),
    selectedId: s.selectedId === id ? null : s.selectedId,
    linkFromId: s.linkFromId === id ? null : s.linkFromId,
    removedIds: [...(s.removedIds ?? []), id],
  })
}

export function toggleLink(s: FoodWebState, fromId: string, toId: string): FoodWebState {
  const from = s.nodes.find((n) => n.id === fromId)
  const to = s.nodes.find((n) => n.id === toId)
  if (!from || !to || !canLink(from, to)) return withDefaults({ ...s, linkFromId: null })

  if (linkExists(s.links, fromId, toId)) {
    return withDefaults({
      ...s,
      links: s.links.filter((l) => !(l.from === fromId && l.to === toId)),
      linkFromId: null,
      selectedId: toId,
    })
  }
  return withDefaults({
    ...s,
    links: [...s.links, { from: fromId, to: toId }],
    linkFromId: null,
    selectedId: toId,
  })
}

export function setLinkFrom(s: FoodWebState, id: string | null): FoodWebState {
  return withDefaults({ ...s, linkFromId: id })
}

export function connectionsFor(s: FoodWebState, id: string): { inCount: number; outCount: number } {
  return {
    inCount: s.links.filter((l) => l.to === id).length,
    outCount: s.links.filter((l) => l.from === id).length,
  }
}

export function moveNode(s: FoodWebState, id: string, x: number, y: number): FoodWebState {
  return withDefaults({
    ...s,
    nodes: s.nodes.map((n) => (n.id === id ? { ...n, x: clamp01(x), y: clamp01(y) } : n)),
  })
}

function clamp01(n: number) {
  return Math.max(0.08, Math.min(0.92, n))
}
