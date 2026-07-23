import { BooleanProperty, NumberProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'

/** Reflex arc pathway timing — PTB Ch 2. */
export class ReflexArcModel implements TModel {
  public readonly viaBrainProperty: BooleanProperty
  public readonly firedProperty: BooleanProperty
  public readonly runningProperty: BooleanProperty
  public readonly progressProperty: NumberProperty

  public constructor() {
    this.viaBrainProperty = new BooleanProperty(false)
    this.firedProperty = new BooleanProperty(false)
    this.runningProperty = new BooleanProperty(false)
    this.progressProperty = new NumberProperty(0)
  }

  public fire(): void {
    this.progressProperty.value = 0
    this.firedProperty.value = true
    this.runningProperty.value = true
  }

  public setViaBrain(value: boolean): void {
    this.viaBrainProperty.value = value
    this.progressProperty.value = 0
    this.firedProperty.value = false
    this.runningProperty.value = false
  }

  public step(dt: number): void {
    if (!this.runningProperty.value || !this.firedProperty.value || dt <= 0) {
      return
    }
    const speed = this.viaBrainProperty.value ? 0.32 : 0.62
    this.progressProperty.value = Math.min(1, this.progressProperty.value + dt * speed)
    if (this.progressProperty.value >= 1) {
      this.runningProperty.value = false
    }
  }

  public reset(): void {
    this.viaBrainProperty.reset()
    this.firedProperty.reset()
    this.runningProperty.reset()
    this.progressProperty.reset()
  }
}
