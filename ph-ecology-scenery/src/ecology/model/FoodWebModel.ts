import { NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { EcologyConstants } from '../../common/EcologyConstants.js'

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

export interface FoodWebSnapshot {
  nodes: FoodNode[]
  links: FoodLink[]
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

function starterWeb(): FoodWebSnapshot {
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
  }
}

export function grasslandChain(): FoodWebSnapshot {
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
  }
}

export function grasslandWeb(): FoodWebSnapshot {
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
  }
}

function consumerLinks(snapshot: FoodWebSnapshot): FoodLink[] {
  return snapshot.links.filter((l) => {
    const to = snapshot.nodes.find((n) => n.id === l.to)
    return to && to.level !== 'decomposer'
  })
}

export function computeNodeEnergy(snapshot: FoodWebSnapshot, base = EcologyConstants.BASE_ENERGY): Map<string, number> {
  const energy = new Map<string, number>()
  const producers = snapshot.nodes.filter((n) => n.level === 'producer')
  if (producers.length === 0) return energy
  const per = base / producers.length
  producers.forEach((p) => energy.set(p.id, per))
  const links = consumerLinks(snapshot)
  for (let pass = 0; pass < snapshot.nodes.length * 3; pass++) {
    for (const node of snapshot.nodes) {
      if (node.level === 'producer' || node.level === 'decomposer') continue
      const incoming = links.filter((l) => l.to === node.id)
      if (incoming.length === 0) continue
      let sum = 0
      for (const l of incoming) sum += (energy.get(l.from) ?? 0) * EcologyConstants.ENERGY_TRANSFER
      energy.set(node.id, sum)
    }
  }
  return energy
}

export function webStability(snapshot: FoodWebSnapshot): { score: number; atRisk: string[]; message: string } {
  const consumers = snapshot.nodes.filter((n) => n.level !== 'producer' && n.level !== 'decomposer')
  if (consumers.length === 0) return { score: 100, atRisk: [], message: 'Add consumers to explore stability.' }
  const atRisk: string[] = []
  let redundancy = 0
  for (const c of consumers) {
    const preyCount = snapshot.links.filter((l) => l.to === c.id).length
    if (preyCount <= 1) atRisk.push(c.id)
    redundancy += Math.min(preyCount, 3)
  }
  const score = Math.min(
    100,
    Math.round((redundancy / Math.max(1, consumers.length * 3)) * 70 + (atRisk.length === 0 ? 30 : 0)),
  )
  const names = atRisk.map((id) => snapshot.nodes.find((n) => n.id === id)?.name ?? id)
  const message =
    atRisk.length === 0
      ? 'Stable web — consumers have backup food sources.'
      : `${names.slice(0, 2).join(', ')} depend on a single food source.`
  return { score, atRisk, message }
}

export class FoodWebModel implements TModel {
  public readonly webProperty: Property<FoodWebSnapshot>
  public readonly selectedIdProperty: Property<string | null>
  public readonly linkModeProperty: Property<boolean>
  public readonly linkFromIdProperty: Property<string | null>
  public readonly energyPulseProperty: NumberProperty
  public readonly baseEnergyProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly stabilityScoreProperty: NumberProperty
  public readonly stabilityMessageProperty: StringProperty

  public constructor() {
    this.webProperty = new Property(starterWeb())
    this.selectedIdProperty = new Property<string | null>(null)
    this.linkModeProperty = new Property(false)
    this.linkFromIdProperty = new Property<string | null>(null)
    this.energyPulseProperty = new NumberProperty(0)
    this.baseEnergyProperty = new NumberProperty(EcologyConstants.BASE_ENERGY)
    this.statusProperty = new StringProperty(
      'Drag species · toggle Link mode to connect eaters to food · ~10% energy up each link.',
    )
    this.stabilityScoreProperty = new NumberProperty(0)
    this.stabilityMessageProperty = new StringProperty('')
    this.refreshStability()
    this.webProperty.link(this.refreshStability.bind(this))
  }

  private refreshStability(): void {
    const s = webStability(this.webProperty.value)
    this.stabilityScoreProperty.value = s.score
    this.stabilityMessageProperty.value = s.message
  }

  public reset(): void {
    this.webProperty.value = starterWeb()
    this.selectedIdProperty.value = null
    this.linkModeProperty.value = false
    this.linkFromIdProperty.value = null
    this.energyPulseProperty.value = 0
    this.baseEnergyProperty.value = EcologyConstants.BASE_ENERGY
    this.statusProperty.value =
      'Drag species · toggle Link mode to connect eaters to food · ~10% energy up each link.'
    this.refreshStability()
  }

  public step(dt: number): void {
    if (dt > 0) this.energyPulseProperty.value += dt
  }

  public load(snapshot: FoodWebSnapshot): void {
    this.webProperty.value = snapshot
    this.selectedIdProperty.value = null
    this.linkFromIdProperty.value = null
  }

  public selectNode(id: string | null): void {
    this.selectedIdProperty.value = id
  }

  public moveNode(id: string, x: number, y: number): void {
    const snap = this.webProperty.value
    this.webProperty.value = {
      ...snap,
      nodes: snap.nodes.map((n) =>
        n.id === id ? { ...n, x: Math.max(0.06, Math.min(0.94, x)), y: Math.max(0.06, Math.min(0.94, y)) } : n,
      ),
    }
  }

  public toggleLinkMode(on: boolean): void {
    this.linkModeProperty.value = on
    this.linkFromIdProperty.value = null
  }

  public handleNodePress(id: string): void {
    if (this.linkModeProperty.value) {
      const snap = this.webProperty.value
      const fromId = this.linkFromIdProperty.value
      if (!fromId) {
        this.linkFromIdProperty.value = id
        this.statusProperty.value = 'Now tap its food (or eater).'
        return
      }
      const a = snap.nodes.find((n) => n.id === fromId)
      const b = snap.nodes.find((n) => n.id === id)
      if (a && b) {
        const pair = canLink(a, b) ? [a, b] : canLink(b, a) ? [b, a] : null
        if (pair) {
          const [from, to] = pair
          const exists = snap.links.some((l) => l.from === from.id && l.to === to.id)
          const links = exists
            ? snap.links.filter((l) => !(l.from === from.id && l.to === to.id))
            : [...snap.links, { from: from.id, to: to.id }]
          this.webProperty.value = { ...snap, links }
          this.statusProperty.value = exists ? 'Link removed.' : 'Link added — energy flows along arrows.'
        }
      }
      this.linkFromIdProperty.value = null
      this.selectedIdProperty.value = id
      return
    }
    this.selectedIdProperty.value = id
    const node = this.webProperty.value.nodes.find((n) => n.id === id)
    if (node) {
      const e = computeNodeEnergy(this.webProperty.value, this.baseEnergyProperty.value).get(id) ?? 0
      this.statusProperty.value = `${node.name} · ${node.level} · energy ${Math.round(e)}`
    }
  }

  public removeSelected(): void {
    const id = this.selectedIdProperty.value
    if (!id) return
    const snap = this.webProperty.value
    const name = snap.nodes.find((n) => n.id === id)?.name ?? 'Species'
    this.webProperty.value = {
      nodes: snap.nodes.filter((n) => n.id !== id),
      links: snap.links.filter((l) => l.from !== id && l.to !== id),
    }
    this.selectedIdProperty.value = null
    this.statusProperty.value = `Removed ${name}. See which links broke.`
  }

  public addSpecies(level: TrophicLevel, name: string): void {
    const snap = this.webProperty.value
    const id = `${level}-${Date.now()}`
    const node: FoodNode = {
      id,
      name,
      level,
      x: 0.3 + Math.random() * 0.4,
      y: 0.25 + Math.random() * 0.5,
    }
    const prey = snap.nodes.find((n) => {
      if (level === 'herbivore') return n.level === 'producer'
      if (level === 'carnivore') return n.level === 'herbivore'
      if (level === 'decomposer') return n.level !== 'decomposer'
      return false
    })
    const links = prey ? [...snap.links, { from: prey.id, to: id }] : snap.links
    this.webProperty.value = { nodes: [...snap.nodes, node], links }
    this.selectedIdProperty.value = id
  }
}
