import { BooleanProperty, NumberProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/EcologyConstants.js'

/**
 * Greenhouse / global warming mechanism model.
 */
export class WarmingModel implements TModel {
  public readonly co2LevelProperty: NumberProperty
  public readonly temperatureProperty: NumberProperty
  public readonly timeProperty: NumberProperty
  public readonly runningProperty: BooleanProperty

  public constructor() {
    this.co2LevelProperty = new NumberProperty(0.4)
    this.temperatureProperty = new NumberProperty(15)
    this.timeProperty = new NumberProperty(0)
    this.runningProperty = new BooleanProperty(true)
  }

  public setCo2(value: number): void {
    this.co2LevelProperty.value = clamp(value, 0.05, 1)
  }

  public step(dt: number): void {
    if (!this.runningProperty.value || dt <= 0) {
      return
    }
    const target = 10 + this.co2LevelProperty.value * 28
    const t = this.temperatureProperty.value
    this.temperatureProperty.value = t + (target - t) * Math.min(1, dt * 0.35)
    this.timeProperty.value += dt
  }

  public reset(): void {
    this.co2LevelProperty.reset()
    this.temperatureProperty.reset()
    this.timeProperty.reset()
    this.runningProperty.reset()
  }
}
