import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'

export type ReflexChallenge = 'explore' | 'compare' | 'scenario'

/**
 * Reflex arc pathway — ecology-depth model with speed scrub, compare challenge,
 * and hot-iron scenario (spinal first, then brain awareness).
 */
export class ReflexArcModel implements TModel {
  public readonly viaBrainProperty: BooleanProperty
  public readonly firedProperty: BooleanProperty
  public readonly runningProperty: BooleanProperty
  public readonly progressProperty: NumberProperty
  public readonly speedScaleProperty: NumberProperty
  public readonly challengeProperty: Property<ReflexChallenge>
  public readonly spinalTrialsProperty: NumberProperty
  public readonly brainTrialsProperty: NumberProperty
  public readonly compareCompleteProperty: BooleanProperty
  public readonly scenarioPhaseProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly junctionIndexProperty: NumberProperty

  private prevSegment = -1
  private scenarioTimer = 0

  public constructor() {
    this.viaBrainProperty = new BooleanProperty(false)
    this.firedProperty = new BooleanProperty(false)
    this.runningProperty = new BooleanProperty(false)
    this.progressProperty = new NumberProperty(0)
    this.speedScaleProperty = new NumberProperty(1)
    this.challengeProperty = new Property<ReflexChallenge>('explore')
    this.spinalTrialsProperty = new NumberProperty(0)
    this.brainTrialsProperty = new NumberProperty(0)
    this.compareCompleteProperty = new BooleanProperty(false)
    this.scenarioPhaseProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty('Tap the receptor to fire a reflex.')
    this.junctionIndexProperty = new NumberProperty(-1)
  }

  public fire(): void {
    this.progressProperty.value = 0
    this.firedProperty.value = true
    this.runningProperty.value = true
    this.prevSegment = -1
    this.junctionIndexProperty.value = -1
    this.statusProperty.value = this.viaBrainProperty.value
      ? 'Signal climbing toward the brain…'
      : 'Fast spinal reflex in progress…'
  }

  public setViaBrain(value: boolean): void {
    this.viaBrainProperty.value = value
    this.progressProperty.value = 0
    this.firedProperty.value = false
    this.runningProperty.value = false
    this.prevSegment = -1
    this.junctionIndexProperty.value = -1
    this.statusProperty.value = value
      ? 'Brain is on the path — expect a slower journey.'
      : 'Brain skipped — classic spinal reflex path.'
  }

  public setChallenge(mode: ReflexChallenge): void {
    this.challengeProperty.value = mode
    this.scenarioPhaseProperty.value = 0
    this.scenarioTimer = 0
    this.progressProperty.value = 0
    this.firedProperty.value = false
    this.runningProperty.value = false
    if (mode === 'compare') {
      this.statusProperty.value = 'Compare challenge: fire once spinal, once via brain.'
    }
    else if (mode === 'scenario') {
      this.statusProperty.value = 'Hot iron! Spinal reflex fires first — watch carefully.'
      this.viaBrainProperty.value = false
      this.fire()
      this.scenarioPhaseProperty.value = 1
    }
    else {
      this.statusProperty.value = 'Explore freely — toggle brain and scrub signal speed.'
    }
  }

  public step(dt: number): void {
    if (this.challengeProperty.value === 'scenario') {
      this.stepScenario(dt)
    }

    if (!this.runningProperty.value || !this.firedProperty.value || dt <= 0) {
      return
    }

    const base = this.viaBrainProperty.value ? 0.34 : 0.68
    const speed = base * Math.max(0.35, this.speedScaleProperty.value)
    this.progressProperty.value = Math.min(1, this.progressProperty.value + dt * speed)

    const segments = this.viaBrainProperty.value ? 4 : 2
    const seg = Math.min(segments - 1, Math.floor(this.progressProperty.value * segments))
    if (seg !== this.prevSegment) {
      this.junctionIndexProperty.value = seg
      this.prevSegment = seg
    }

    if (this.progressProperty.value >= 1) {
      this.runningProperty.value = false
      this.onArrival()
    }
  }

  private onArrival(): void {
    if (this.viaBrainProperty.value) {
      this.brainTrialsProperty.value += 1
      this.statusProperty.value = 'Arrived via brain — slower, but you “noticed” it.'
    }
    else {
      this.spinalTrialsProperty.value += 1
      this.statusProperty.value = 'Effector kicked! Fast spinal reflex finished.'
    }
    if (this.spinalTrialsProperty.value > 0 && this.brainTrialsProperty.value > 0) {
      this.compareCompleteProperty.value = true
      if (this.challengeProperty.value === 'compare') {
        this.statusProperty.value = 'Compare complete — spinal was clearly faster!'
      }
    }
  }

  private stepScenario(dt: number): void {
    const phase = this.scenarioPhaseProperty.value
    if (phase === 1 && this.firedProperty.value && this.progressProperty.value >= 1 && !this.runningProperty.value) {
      this.scenarioTimer += dt
      if (this.scenarioTimer > 1.1) {
        this.scenarioPhaseProperty.value = 2
        this.scenarioTimer = 0
        this.statusProperty.value = 'Now awareness: signal takes the brain path…'
        this.setViaBrain(true)
        this.fire()
        this.scenarioPhaseProperty.value = 3
      }
    }
    else if (phase === 3 && this.firedProperty.value && this.progressProperty.value >= 1 && !this.runningProperty.value) {
      this.scenarioPhaseProperty.value = 4
      this.statusProperty.value = 'Lesson: you pull away before the brain fully “feels” it.'
    }
  }

  public reset(): void {
    this.viaBrainProperty.reset()
    this.firedProperty.reset()
    this.runningProperty.reset()
    this.progressProperty.reset()
    this.speedScaleProperty.reset()
    this.challengeProperty.reset()
    this.spinalTrialsProperty.reset()
    this.brainTrialsProperty.reset()
    this.compareCompleteProperty.reset()
    this.scenarioPhaseProperty.reset()
    this.statusProperty.value = 'Tap the receptor to fire a reflex.'
    this.junctionIndexProperty.reset()
    this.prevSegment = -1
    this.scenarioTimer = 0
  }
}
