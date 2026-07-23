import { BooleanProperty, NumberProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'

/** Neuron action potential along axon — PTB Ch 2. */
export class NeuronSignalModel implements TModel {
  public readonly myelinProperty: BooleanProperty
  public readonly runningProperty: BooleanProperty
  public readonly tProperty: NumberProperty

  public constructor() {
    this.myelinProperty = new BooleanProperty(true)
    this.runningProperty = new BooleanProperty(true)
    this.tProperty = new NumberProperty(0)
  }

  public fire(): void {
    this.tProperty.value = 0
    this.runningProperty.value = true
  }

  public setMyelin(value: boolean): void {
    this.myelinProperty.value = value
    this.tProperty.value = 0
  }

  public step(dt: number): void {
    if (!this.runningProperty.value || dt <= 0) {
      return
    }
    const speed = this.myelinProperty.value ? 1.35 : 0.38
    this.tProperty.value += dt * speed
  }

  public reset(): void {
    this.myelinProperty.reset()
    this.runningProperty.reset()
    this.tProperty.reset()
  }
}
