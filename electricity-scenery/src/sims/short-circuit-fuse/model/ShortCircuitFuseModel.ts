import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { computeFuseCircuit } from '../../../shared/fusePhysics.js'

export type FuseScenario = 'normal' | 'short' | 'blown'
const VOLTAGE = 12
const LOAD_R = 24

const SCENARIO_STATUS: Record<FuseScenario, string> = {
  normal: 'Normal — load powered; current below fuse rating.',
  short: 'Short — low-resistance bypass; watch for overload.',
  blown: 'Fuse blown — circuit open until you replace the fuse.',
}
const SCENARIO_TIP: Record<FuseScenario, string> = {
  normal: 'The fuse stays intact while current ≤ rating.',
  short: 'A short dumps huge current — the fuse should open to protect wiring.',
  blown: 'Replace the fuse only after clearing the short.',
}

export class ShortCircuitFuseModel implements TModel {
  public readonly fuseRatingProperty: NumberProperty
  public readonly shortedProperty: BooleanProperty
  public readonly fuseBlownProperty: BooleanProperty
  public readonly scenarioProperty: Property<FuseScenario>
  public readonly runningProperty: BooleanProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty
  private readonly visited = new Set<FuseScenario>(['normal'])
  private sawBlow = false
  private starAwarded = false

  public constructor() {
    this.fuseRatingProperty = new NumberProperty(2)
    this.shortedProperty = new BooleanProperty(false)
    this.fuseBlownProperty = new BooleanProperty(false)
    this.scenarioProperty = new Property<FuseScenario>('normal')
    this.runningProperty = new BooleanProperty(true)
    this.showLabelsProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(SCENARIO_STATUS.normal)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
  }

  public get readout() {
    return computeFuseCircuit(VOLTAGE, LOAD_R, this.fuseRatingProperty.value, this.shortedProperty.value, this.fuseBlownProperty.value)
  }

  public setScenario(scenario: FuseScenario): void {
    this.scenarioProperty.value = scenario
    if (scenario === 'normal') { this.shortedProperty.value = false; this.fuseBlownProperty.value = false }
    if (scenario === 'short') { this.shortedProperty.value = true; this.fuseBlownProperty.value = false }
    if (scenario === 'blown') { this.shortedProperty.value = true; this.fuseBlownProperty.value = true }
    this.statusProperty.value = SCENARIO_STATUS[scenario]
    if (!this.visited.has(scenario)) { this.visited.add(scenario); this.showTip(SCENARIO_TIP[scenario]) }
  }

  public toggleShort(): void {
    if (this.fuseBlownProperty.value) return
    this.shortedProperty.value = !this.shortedProperty.value
    this.statusProperty.value = this.shortedProperty.value ? 'Short enabled — current will spike.' : 'Short cleared — load path restored.'
  }

  public replaceFuse(): void {
    this.fuseBlownProperty.value = false
    this.shortedProperty.value = false
    this.statusProperty.value = 'Fuse replaced — circuit ready again.'
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
  }

  public onQuiz(correct: boolean): void {
    this.statusProperty.value = correct
      ? 'Correct! Fuses open when current is too high.'
      : 'Not quite — fuses melt/open; they do not raise voltage.'
    if (correct) this.starsProperty.value += 1
  }

  public step(dt: number): void {
    if (dt <= 0) return
    if (this.runningProperty.value) this.timeProperty.value += dt
    const r = this.readout
    if (!this.fuseBlownProperty.value && !r.fuseIntact) {
      this.fuseBlownProperty.value = true
      this.sawBlow = true
      this.statusProperty.value = 'Fuse blown — overload opened the circuit!'
    }
    if (!this.starAwarded && this.sawBlow && this.visited.size >= 2) {
      this.starAwarded = true; this.starsProperty.value += 1; this.quizPromptsProperty.value += 1
    }
  }

  private showTip(text: string): void { this.tipTextProperty.value = text; this.tipsProperty.value += 1 }

  public reset(): void {
    this.fuseRatingProperty.reset(); this.shortedProperty.reset(); this.fuseBlownProperty.reset()
    this.scenarioProperty.reset(); this.runningProperty.reset(); this.showLabelsProperty.reset()
    this.soundEnabledProperty.reset(); this.starsProperty.reset()
    this.statusProperty.value = SCENARIO_STATUS.normal
    this.tipTextProperty.reset(); this.tipsProperty.reset(); this.quizPromptsProperty.reset(); this.timeProperty.reset()
    this.sawBlow = false; this.starAwarded = false; this.visited.clear(); this.visited.add('normal')
  }
}
