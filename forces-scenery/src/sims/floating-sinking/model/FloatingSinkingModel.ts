import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/ForcesConstants.js'
import {
  createFloatState,
  floatVerdict,
  FloatState,
  FloatVerdict,
  stepFloat,
} from '../../../shared/floatingSinkingModel.js'

export type FloatScenario = 'explore' | 'cork' | 'suspend' | 'rock'

const SCENARIO_STATUS: Record<FloatScenario, string> = {
  explore: 'Explore — compare object density to fluid density and watch the object rise, sink, or suspend.',
  cork: 'Cork scenario: low-density object (like cork) floats on water.',
  suspend: 'Neutral buoyancy: object density nearly matches the fluid — it suspends mid-tank.',
  rock: 'Rock scenario: dense object sinks to the bottom of the tank.',
}

const SCENARIO_TIP: Record<FloatScenario, string> = {
  explore: 'Objects float when they are less dense than the fluid; they sink when denser.',
  cork: 'Cork has density around 0.24 g/cm³ — much less than water (1.0 g/cm³), so it floats.',
  suspend: 'When densities are almost equal, buoyancy and weight balance — the object hovers.',
  rock: 'Rocks are denser than water, so gravity wins and the object sinks.',
}

const INITIAL_STATUS = SCENARIO_STATUS.explore

export class FloatingSinkingModel implements TModel {
  public readonly objectDensityProperty: NumberProperty
  public readonly fluidDensityProperty: NumberProperty
  public readonly scenarioProperty: Property<FloatScenario>
  public readonly runningProperty: BooleanProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly yProperty: NumberProperty
  public readonly verdictProperty: Property<FloatVerdict>
  public readonly showLabelsProperty: BooleanProperty
  public readonly showDensitiesProperty: BooleanProperty
  public readonly showVerdictProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private state: FloatState
  private readonly visitedScenarios = new Set<FloatScenario>(['explore'])
  private hasSeenFloat = false
  private hasSeenSink = false
  private starAwarded = false

  public constructor() {
    this.objectDensityProperty = new NumberProperty(0.8)
    this.fluidDensityProperty = new NumberProperty(1.0)
    this.scenarioProperty = new Property<FloatScenario>('explore')
    this.runningProperty = new BooleanProperty(true)
    this.simSpeedProperty = new NumberProperty(1)
    this.state = createFloatState()
    this.yProperty = new NumberProperty(this.state.y)
    this.verdictProperty = new Property<FloatVerdict>(
      floatVerdict(this.objectDensityProperty.value, this.fluidDensityProperty.value),
    )
    this.showLabelsProperty = new BooleanProperty(true)
    this.showDensitiesProperty = new BooleanProperty(true)
    this.showVerdictProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(INITIAL_STATUS)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
  }

  public setScenario(scenario: FloatScenario): void {
    this.scenarioProperty.value = scenario
    if (scenario === 'cork') {
      this.objectDensityProperty.value = 0.24
      this.fluidDensityProperty.value = 1.0
    }
    else if (scenario === 'suspend') {
      this.objectDensityProperty.value = 1.0
      this.fluidDensityProperty.value = 1.0
    }
    else if (scenario === 'rock') {
      this.objectDensityProperty.value = 2.4
      this.fluidDensityProperty.value = 1.0
    }
    this.state = createFloatState()
    this.yProperty.value = this.state.y
    this.syncVerdict()
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
      ? 'Running — watch buoyancy move the object up or down.'
      : 'Paused — adjust densities, then press Play.'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value = 'Correct! Less dense objects float; denser ones sink.'
    }
    else {
      this.statusProperty.value = 'Not quite — floating depends on density compared to the fluid, not just weight.'
    }
  }

  private syncVerdict(): void {
    this.verdictProperty.value = floatVerdict(
      this.objectDensityProperty.value,
      this.fluidDensityProperty.value,
    )
  }

  public step(dt: number): void {
    if (dt <= 0) return
    const scaledDt = dt * clamp(this.simSpeedProperty.value, 0.25, 3)
    if (this.runningProperty.value) {
      this.timeProperty.value += scaledDt
      this.state = stepFloat(
        this.state,
        scaledDt,
        this.objectDensityProperty.value,
        this.fluidDensityProperty.value,
      )
      this.yProperty.value = this.state.y
    }
    this.syncVerdict()
    const v = this.verdictProperty.value
    if (v === 'float') this.hasSeenFloat = true
    if (v === 'sink') this.hasSeenSink = true

    if (!this.starAwarded && this.hasSeenFloat && this.hasSeenSink) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.statusProperty.value = 'Nice! You saw both floating and sinking. ★'
      this.quizPromptsProperty.value += 1
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    this.objectDensityProperty.reset()
    this.fluidDensityProperty.reset()
    this.scenarioProperty.reset()
    this.runningProperty.reset()
    this.simSpeedProperty.reset()
    this.state = createFloatState()
    this.yProperty.value = this.state.y
    this.syncVerdict()
    this.showLabelsProperty.reset()
    this.showDensitiesProperty.reset()
    this.showVerdictProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = INITIAL_STATUS
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.timeProperty.reset()
    this.hasSeenFloat = false
    this.hasSeenSink = false
    this.starAwarded = false
    this.visitedScenarios.clear()
    this.visitedScenarios.add('explore')
  }
}
