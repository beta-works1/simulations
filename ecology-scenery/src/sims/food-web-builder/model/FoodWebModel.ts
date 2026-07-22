import { NumberProperty, Property } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { EcologyColors } from '../../../shared/EcologyColors.js'
import { clamp } from '../../../shared/EcologyConstants.js'

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

const LEVEL_COLORS: Record<TrophicLevel, string> = {
  producer: EcologyColors.producer,
  herbivore: EcologyColors.herbivore,
  carnivore: EcologyColors.carnivore,
  decomposer: EcologyColors.decomposer,
}

export function levelColor(level: TrophicLevel): string {
  return LEVEL_COLORS[level]
}

export function levelBadge(level: TrophicLevel): string {
  if (level === 'producer') return 'P'
  if (level === 'herbivore') return 'H'
  if (level === 'carnivore') return 'C'
  return 'D'
}

function initialNodes(): FoodNode[] {
  return [
    { id: 'grass', name: 'Grass', level: 'producer', x: 0.22, y: 0.72 },
    { id: 'rabbit', name: 'Rabbit', level: 'herbivore', x: 0.48, y: 0.48 },
    { id: 'fox', name: 'Fox', level: 'carnivore', x: 0.72, y: 0.28 },
    { id: 'fungi', name: 'Fungi', level: 'decomposer', x: 0.78, y: 0.76 },
  ]
}

function initialLinks(): FoodLink[] {
  return [
    { from: 'grass', to: 'rabbit' },
    { from: 'rabbit', to: 'fox' },
    { from: 'grass', to: 'fungi' },
    { from: 'rabbit', to: 'fungi' },
  ]
}

/**
 * Food-web builder model — species nodes, feeding links, and energy pulse phase.
 */
export class FoodWebModel implements TModel {
  public readonly nodesProperty: Property<FoodNode[]>
  public readonly linksProperty: Property<FoodLink[]>
  public readonly energyPulseProperty: NumberProperty
  public readonly selectedIdProperty: Property<string | null>
  public readonly runningProperty: Property<boolean>

  public constructor() {
    this.nodesProperty = new Property(initialNodes())
    this.linksProperty = new Property(initialLinks())
    this.energyPulseProperty = new NumberProperty(0)
    this.selectedIdProperty = new Property<string | null>(null)
    this.runningProperty = new Property(true)
  }

  public addSpecies(level: TrophicLevel, name: string): void {
    const id = `${level}-${Date.now()}`
    const node: FoodNode = {
      id,
      name,
      level,
      x: 0.3 + Math.random() * 0.4,
      y: 0.25 + Math.random() * 0.5,
    }
    const nodes = this.nodesProperty.value
    const prey = nodes.find(n => {
      if (level === 'herbivore') return n.level === 'producer'
      if (level === 'carnivore') return n.level === 'herbivore'
      if (level === 'decomposer') return n.level !== 'decomposer'
      return false
    })
    this.nodesProperty.value = [...nodes, node]
    if (prey) {
      this.linksProperty.value = [...this.linksProperty.value, { from: prey.id, to: id }]
    }
  }

  public moveNode(id: string, x: number, y: number): void {
    const nx = clamp(x, 0.08, 0.92)
    const ny = clamp(y, 0.08, 0.92)
    this.nodesProperty.value = this.nodesProperty.value.map(n =>
      n.id === id ? { ...n, x: nx, y: ny } : n,
    )
  }

  public select(id: string | null): void {
    this.selectedIdProperty.value = id
  }

  public toggleRunning(): void {
    this.runningProperty.value = !this.runningProperty.value
  }

  public step(dt: number): void {
    if (!this.runningProperty.value || dt <= 0) return
    this.energyPulseProperty.value += dt
  }

  public reset(): void {
    this.nodesProperty.value = initialNodes()
    this.linksProperty.value = initialLinks()
    this.energyPulseProperty.reset()
    this.selectedIdProperty.value = null
    this.runningProperty.reset()
  }
}
