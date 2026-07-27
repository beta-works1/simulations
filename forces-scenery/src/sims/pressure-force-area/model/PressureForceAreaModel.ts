import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/ForcesConstants.js'
import {
  calcPressure,
  createPressureState,
  PressureState,
  stepPressure,
} from '../../../shared/pressureForceAreaModel.js'

export type PressureScenario = 'explore' | 'nail' | 'shoe'

const SCENARIO_STATUS: Record<PressureScenario, string> = {
  explore: 'Explore — change force and contact area to see pressure P = F ÷ A.',
  nail: 'Nail tip: tiny area concentrates force into very high pressure.',
  shoe: 'Wide shoe: same force spread over a large area gives low pressure.',
}

const SCENARIO_TIP: Record<PressureScenario, string> = {
  explore: 'Pressure depends on both force and area — same force on smaller area means higher pressure.',
  nail: 'A sharp nail has a tiny contact area, so even moderate force creates huge pressure.',
  shoe: 'Snow shoes spread your weight over more area so you don\'t sink into soft snow.',
}

const INITIAL_STATUS = SCENARIO_STATUS.explore

export class PressureForceAreaModel implements TModel {
  public readonly forceProperty: NumberProperty
  public readonly areaProperty: NumberProperty
  public readonly scenarioProperty: Property<PressureScenario>
  public readonly runningProperty: BooleanProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly pressDepthProperty: NumberProperty
  public readonly pressureProperty: NumberProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showImprintProperty: BooleanProperty
  public readonly showFormulaProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private state: PressureState
  private readonly visitedScenarios = new Set<PressureScenario>(['explore'])
  private hasSeenHighP = false
  private hasSeenLowP = false
  private starAwarded = false

  public constructor() {
    this.forceProperty = new NumberProperty(100)
    this.areaProperty = new NumberProperty(10)
    this.scenarioProperty = new Property<PressureScenario>('explore')
    this.runningProperty = new BooleanProperty(true)
    this.simSpeedProperty = new NumberProperty(1)
    this.state = createPressureState()
    this.pressDepthProperty = new NumberProperty(this.state.pressDepth)
    this.pressureProperty = new NumberProperty(calcPressure(100, 10))
    this.showLabelsProperty = new BooleanProperty(true)
    this.showImprintProperty = new BooleanProperty(true)
    this.showFormulaProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(INITIAL_STATUS)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
  }

  public setScenario(scenario: PressureScenario): void {
    this.scenarioProperty.value = scenario
    if (scenario === 'nail') {
      this.forceProperty.value = 80
      this.areaProperty.value = 1
    }
    else if (scenario === 'shoe') {
      this.forceProperty.value = 80
      this.areaProperty.value = 35
    }
    this.state = createPressureState()
    this.pressDepthProperty.value = this.state.pressDepth
    this.syncPressure()
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
      ? 'Pressing — watch the imprint deepen as pressure rises.'
      : 'Paused — adjust force or area, then press Play.'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value = 'Correct! Smaller contact area means higher pressure for the same force.'
    }
    else {
      this.statusProperty.value = 'Not quite — pressure increases when area decreases (P = F ÷ A).'
    }
  }

  private syncPressure(): void {
    this.pressureProperty.value = calcPressure(this.forceProperty.value, this.areaProperty.value)
  }

  public step(dt: number): void {
    if (dt <= 0) return
    const scaledDt = dt * clamp(this.simSpeedProperty.value, 0.25, 3)
    if (this.runningProperty.value) {
      this.timeProperty.value += scaledDt
      this.state = stepPressure(this.state, scaledDt, this.runningProperty.value)
      this.pressDepthProperty.value = this.state.pressDepth
    }
    this.syncPressure()
    const p = this.pressureProperty.value
    if (p >= 40) this.hasSeenHighP = true
    if (p <= 5) this.hasSeenLowP = true

    if (!this.starAwarded && this.hasSeenHighP && this.hasSeenLowP) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.statusProperty.value = 'Great! You compared high and low pressure. ★'
      this.quizPromptsProperty.value += 1
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    this.forceProperty.reset()
    this.areaProperty.reset()
    this.scenarioProperty.reset()
    this.runningProperty.reset()
    this.simSpeedProperty.reset()
    this.state = createPressureState()
    this.pressDepthProperty.value = this.state.pressDepth
    this.syncPressure()
    this.showLabelsProperty.reset()
    this.showImprintProperty.reset()
    this.showFormulaProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = INITIAL_STATUS
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.timeProperty.reset()
    this.hasSeenHighP = false
    this.hasSeenLowP = false
    this.starAwarded = false
    this.visitedScenarios.clear()
    this.visitedScenarios.add('explore')
  }
}
