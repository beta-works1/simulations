import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'

export type MotorScenario = 'idle' | 'spinning' | 'strongCurrent'
const SCENARIO_STATUS: Record<MotorScenario, string> = {
  idle: 'Idle — small current, slow rotation.',
  spinning: 'Spinning — moderate current and steady RPM.',
  strongCurrent: 'Strong current — maximum torque and speed.',
}
const SCENARIO_TIP: Record<MotorScenario, string> = {
  idle: 'Even a small current produces some torque in a magnetic field.',
  spinning: 'RPM rises roughly in proportion to current.',
  strongCurrent: 'Electrical energy is converted into mechanical rotation.',
}
const SCENARIO_I: Record<MotorScenario, number> = { idle: 0.15, spinning: 0.6, strongCurrent: 1 }

export class ElectricMotorModel implements TModel {
  public readonly currentProperty: NumberProperty
  public readonly angleProperty: NumberProperty
  public readonly scenarioProperty: Property<MotorScenario>
  public readonly runningProperty: BooleanProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showFieldProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty
  private readonly visited = new Set<MotorScenario>(['idle'])
  private adjusted = false
  private starAwarded = false

  public constructor() {
    this.currentProperty = new NumberProperty(0.6)
    this.angleProperty = new NumberProperty(0)
    this.scenarioProperty = new Property<MotorScenario>('spinning')
    this.runningProperty = new BooleanProperty(true)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showFieldProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(SCENARIO_STATUS.spinning)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
    this.currentProperty.lazyLink(() => { this.adjusted = true })
  }

  public get omega(): number { return this.currentProperty.value * 4.5 }
  public get rpm(): number { return this.omega * 60 / (Math.PI * 2) }

  public setScenario(scenario: MotorScenario): void {
    this.scenarioProperty.value = scenario
    this.currentProperty.value = SCENARIO_I[scenario]
    this.runningProperty.value = true
    this.statusProperty.value = SCENARIO_STATUS[scenario]
    if (!this.visited.has(scenario)) { this.visited.add(scenario); this.showTip(SCENARIO_TIP[scenario]) }
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value ? 'Running — coil rotates in the field.' : 'Paused — adjust current.'
  }

  public onQuiz(correct: boolean): void {
    this.statusProperty.value = correct
      ? 'Correct! Motors turn electrical energy into rotation.'
      : 'Not quite — motors produce mechanical motion from current.'
    if (correct) this.starsProperty.value += 1
  }

  public step(dt: number): void {
    if (dt <= 0) return
    if (this.runningProperty.value) {
      this.timeProperty.value += dt
      this.angleProperty.value = (this.angleProperty.value + this.omega * dt) % (Math.PI * 2)
    }
    if (!this.starAwarded && this.adjusted && this.visited.size >= 2) {
      this.starAwarded = true; this.starsProperty.value += 1; this.quizPromptsProperty.value += 1
    }
  }

  private showTip(text: string): void { this.tipTextProperty.value = text; this.tipsProperty.value += 1 }

  public reset(): void {
    this.currentProperty.reset(); this.angleProperty.reset(); this.scenarioProperty.reset()
    this.runningProperty.reset(); this.showLabelsProperty.reset(); this.showFieldProperty.reset()
    this.soundEnabledProperty.reset(); this.starsProperty.reset()
    this.statusProperty.value = SCENARIO_STATUS.spinning
    this.tipTextProperty.reset(); this.tipsProperty.reset(); this.quizPromptsProperty.reset(); this.timeProperty.reset()
    this.adjusted = false; this.starAwarded = false; this.visited.clear(); this.visited.add('idle')
  }
}
