import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/ForcesConstants.js'
import {
  calcF2,
  createHydraulicState,
  HydraulicState,
  LOAD_WEIGHT,
  stepHydraulic,
} from '../../../shared/hydraulicLiftModel.js'

export type HydraulicScenario = 'explore' | 'carJack' | 'heavyLoad'

const SCENARIO_STATUS: Record<HydraulicScenario, string> = {
  explore: 'Explore Pascal\'s principle — small force on a small piston can lift a heavy load.',
  carJack: 'Car jack: moderate input force with a large area ratio lifts the load slowly.',
  heavyLoad: 'Heavy load needs enough F₂ — increase F₁ or enlarge A₂ relative to A₁.',
}

const SCENARIO_TIP: Record<HydraulicScenario, string> = {
  explore: 'Pressure is transmitted equally through the fluid: F₁/A₁ = F₂/A₂.',
  carJack: 'Hydraulic jacks multiply force because the large piston has much more area.',
  heavyLoad: 'If F₂ < load weight, the piston cannot rise — push harder or widen A₂.',
}

const INITIAL_STATUS = SCENARIO_STATUS.explore

export class HydraulicLiftModel implements TModel {
  public readonly f1Property: NumberProperty
  public readonly a1Property: NumberProperty
  public readonly a2Property: NumberProperty
  public readonly scenarioProperty: Property<HydraulicScenario>
  public readonly runningProperty: BooleanProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly liftHeightProperty: NumberProperty
  public readonly f2Property: NumberProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showForcesProperty: BooleanProperty
  public readonly showLoadProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private state: HydraulicState
  private readonly visitedScenarios = new Set<HydraulicScenario>(['explore'])
  private hasLifted = false
  private starAwarded = false

  public constructor() {
    this.f1Property = new NumberProperty(50)
    this.a1Property = new NumberProperty(4)
    this.a2Property = new NumberProperty(40)
    this.scenarioProperty = new Property<HydraulicScenario>('explore')
    this.runningProperty = new BooleanProperty(true)
    this.simSpeedProperty = new NumberProperty(1)
    this.state = createHydraulicState()
    this.liftHeightProperty = new NumberProperty(this.state.liftHeight)
    this.f2Property = new NumberProperty(calcF2(50, 4, 40))
    this.showLabelsProperty = new BooleanProperty(true)
    this.showForcesProperty = new BooleanProperty(true)
    this.showLoadProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(INITIAL_STATUS)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
  }

  public get loadWeight(): number {
    return LOAD_WEIGHT
  }

  public get canLift(): boolean {
    return this.f2Property.value >= LOAD_WEIGHT
  }

  public setScenario(scenario: HydraulicScenario): void {
    this.scenarioProperty.value = scenario
    if (scenario === 'carJack') {
      this.f1Property.value = 60
      this.a1Property.value = 3
      this.a2Property.value = 50
    }
    else if (scenario === 'heavyLoad') {
      this.f1Property.value = 30
      this.a1Property.value = 5
      this.a2Property.value = 30
    }
    this.state = createHydraulicState()
    this.liftHeightProperty.value = this.state.liftHeight
    this.syncF2()
    this.runningProperty.value = true
    this.statusProperty.value = SCENARIO_STATUS[scenario]
    if (!this.visitedScenarios.has(scenario)) {
      this.visitedScenarios.add(scenario)
      this.showTip(SCENARIO_TIP[scenario])
    }
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Running — watch the large piston rise when F₂ ≥ load.'
      : 'Paused — adjust F₁ or piston areas, then press Play.'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value =
        'Correct! Pascal\'s principle: pressure is transmitted equally throughout the fluid.'
    }
    else {
      this.statusProperty.value =
        'Not quite — in a hydraulic system, pressure (not force alone) is equal everywhere in the fluid.'
    }
  }

  private syncF2(): void {
    this.f2Property.value = calcF2(
      this.f1Property.value,
      this.a1Property.value,
      this.a2Property.value,
    )
  }

  public step(dt: number): void {
    if (dt <= 0) return
    const scaledDt = dt * clamp(this.simSpeedProperty.value, 0.25, 3)
    this.syncF2()
    if (this.runningProperty.value) {
      this.timeProperty.value += scaledDt
      this.state = stepHydraulic(
        this.state,
        scaledDt,
        this.f1Property.value,
        this.a1Property.value,
        this.a2Property.value,
        LOAD_WEIGHT,
        this.runningProperty.value,
      )
      this.liftHeightProperty.value = this.state.liftHeight
    }

    if (this.canLift && this.liftHeightProperty.value > 0.5) this.hasLifted = true

    if (!this.starAwarded && this.hasLifted) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.statusProperty.value = 'Load lifted! You used Pascal\'s principle. ★'
      this.quizPromptsProperty.value += 1
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    this.f1Property.reset()
    this.a1Property.reset()
    this.a2Property.reset()
    this.scenarioProperty.reset()
    this.runningProperty.reset()
    this.simSpeedProperty.reset()
    this.state = createHydraulicState()
    this.liftHeightProperty.value = this.state.liftHeight
    this.syncF2()
    this.showLabelsProperty.reset()
    this.showForcesProperty.reset()
    this.showLoadProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = INITIAL_STATUS
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.timeProperty.reset()
    this.hasLifted = false
    this.starAwarded = false
    this.visitedScenarios.clear()
    this.visitedScenarios.add('explore')
  }
}
