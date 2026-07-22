import { BooleanProperty, NumberProperty, Property } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/EcologyConstants.js'

export type InteractionMode = 'predation' | 'competition' | 'mutualism'

export type PopulationSample = { prey: number; predators: number }

/**
 * Lotka–Volterra style predator–prey model (discrete Euler).
 */
export class PredatorPreyModel implements TModel {
  public readonly preyProperty: NumberProperty
  public readonly predatorsProperty: NumberProperty
  public readonly growthProperty: NumberProperty
  public readonly modeProperty: Property<InteractionMode>
  public readonly runningProperty: BooleanProperty
  public readonly timeProperty: NumberProperty

  public history: PopulationSample[] = []

  private predation = 0.028
  private predatorGrowth = 0.025
  private death = 0.7

  public constructor() {
    this.preyProperty = new NumberProperty(40)
    this.predatorsProperty = new NumberProperty(12)
    this.growthProperty = new NumberProperty(1.1)
    this.modeProperty = new Property<InteractionMode>('predation')
    this.runningProperty = new BooleanProperty(true)
    this.timeProperty = new NumberProperty(0)
    this.history = [{ prey: 40, predators: 12 }]
  }

  public addPrey(amount = 8): void {
    this.preyProperty.value = Math.min(120, this.preyProperty.value + amount)
  }

  public addPredators(amount = 4): void {
    this.predatorsProperty.value = Math.min(80, this.predatorsProperty.value + amount)
  }

  public setGrowth(value: number): void {
    this.growthProperty.value = clamp(value, 0.4, 1.8)
  }

  public setMode(mode: InteractionMode): void {
    this.modeProperty.value = mode
  }

  public step(dt: number): void {
    if (!this.runningProperty.value || dt <= 0) {
      return
    }

    const steps = Math.max(1, Math.floor(dt / 0.016))
    let prey = this.preyProperty.value
    let predators = this.predatorsProperty.value
    const h = dt / steps
    const growth = this.growthProperty.value
    const mode = this.modeProperty.value

    for (let i = 0; i < steps; i++) {
      if (mode === 'predation') {
        const dp = growth * prey - this.predation * prey * predators
        const dq = this.predatorGrowth * prey * predators - this.death * predators
        prey += dp * h
        predators += dq * h
      }
      else if (mode === 'competition') {
        const dp = growth * prey * (1 - prey / 80) - 0.015 * prey * predators
        const dq = 0.9 * predators * (1 - predators / 50) - 0.012 * prey * predators
        prey += dp * h
        predators += dq * h
      }
      else {
        const dp = growth * prey * (1 - prey / 90) + 0.01 * prey * predators
        const dq = 0.6 * predators * (1 - predators / 60) + 0.008 * prey * predators
        prey += dp * h
        predators += dq * h
      }
      prey = Math.max(0.5, Math.min(120, prey))
      predators = Math.max(0.5, Math.min(80, predators))
    }

    this.preyProperty.value = prey
    this.predatorsProperty.value = predators
    this.timeProperty.value += dt

    this.history.push({ prey, predators })
    if (this.history.length > 180) {
      this.history.shift()
    }
  }

  public reset(): void {
    this.preyProperty.reset()
    this.predatorsProperty.reset()
    this.growthProperty.reset()
    this.modeProperty.reset()
    this.runningProperty.reset()
    this.timeProperty.reset()
    this.history = [{ prey: this.preyProperty.value, predators: this.predatorsProperty.value }]
  }
}
