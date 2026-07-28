import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/LightConstants.js'
import {
  defaultRainbowState,
  stepRainbow,
  type RainbowState,
} from '../../../shared/rainbowDispersionModel.js'

export type RainbowScenario = 'explore' | 'slow' | 'fast'

const SCENARIO_STATUS: Record<RainbowScenario, string> = {
  explore: 'Explore — press Play to watch white light disperse inside a water droplet.',
  slow: 'Slow motion — step through refraction, reflection, and spectrum exit.',
  fast: 'Fast demo — quick playback to the full rainbow arc.',
}

const SCENARIO_TIP: Record<RainbowScenario, string> = {
  explore: 'Each color has a slightly different index — that is dispersion.',
  slow: 'Watch the white ray split into ROYGBIV inside the droplet.',
  fast: 'A secondary rainbow hint appears when the animation completes.',
}

const SCENARIO_SPEED: Record<RainbowScenario, number> = {
  explore: 1,
  slow: 0.4,
  fast: 2.5,
}

const INITIAL_STATUS = SCENARIO_STATUS.explore

export class RainbowDispersionModel implements TModel {
  public readonly phaseProperty: NumberProperty
  public readonly speedProperty: NumberProperty
  public readonly scenarioProperty: Property<RainbowScenario>
  public readonly runningProperty: BooleanProperty
  public readonly showSpectrumProperty: BooleanProperty
  public readonly showSecondaryProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private readonly visitedScenarios = new Set<RainbowScenario>(['explore'])
  private hasCompletedAnimation = false
  private starAwarded = false
  private rainbowState: RainbowState

  public constructor() {
    this.rainbowState = defaultRainbowState()
    this.phaseProperty = new NumberProperty(this.rainbowState.phase)
    this.speedProperty = new NumberProperty(this.rainbowState.speed)
    this.scenarioProperty = new Property<RainbowScenario>('explore')
    this.runningProperty = new BooleanProperty(false)
    this.showSpectrumProperty = new BooleanProperty(true)
    this.showSecondaryProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(INITIAL_STATUS)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
  }

  public setScenario(scenario: RainbowScenario): void {
    this.scenarioProperty.value = scenario
    this.speedProperty.value = SCENARIO_SPEED[scenario]
    this.rainbowState = { ...this.rainbowState, speed: SCENARIO_SPEED[scenario] }
    this.statusProperty.value = SCENARIO_STATUS[scenario]
    if (!this.visitedScenarios.has(scenario)) {
      this.visitedScenarios.add(scenario)
      this.showTip(SCENARIO_TIP[scenario])
    }
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    if (this.runningProperty.value && this.phaseProperty.value >= 1) {
      this.rainbowState = { phase: 0, speed: this.speedProperty.value }
      this.phaseProperty.value = 0
      this.hasCompletedAnimation = false
    }
    this.statusProperty.value = this.runningProperty.value
      ? 'Playing — white light refracts, reflects, and disperses in the droplet.'
      : 'Paused — press Play to advance the rainbow animation.'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value = 'Correct! Rainbows need dispersion plus refraction and reflection in droplets.'
    }
    else {
      this.statusProperty.value = 'Not quite — mirrors alone do not split light into a spectrum.'
    }
  }

  public step(dt: number): void {
    if (dt <= 0) return
    if (this.runningProperty.value) {
      this.timeProperty.value += dt
      this.rainbowState = stepRainbow(
        { phase: this.phaseProperty.value, speed: clamp(this.speedProperty.value, 0.25, 3) },
        dt,
      )
      this.phaseProperty.value = this.rainbowState.phase
      if (this.rainbowState.phase >= 1 && !this.hasCompletedAnimation) {
        this.hasCompletedAnimation = true
        this.runningProperty.value = false
        this.statusProperty.value = 'Animation complete — rainbow spectrum exits the droplet. ★'
      }
    }
    if (!this.starAwarded && this.hasCompletedAnimation && this.visitedScenarios.size >= 2) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.quizPromptsProperty.value += 1
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    this.rainbowState = defaultRainbowState()
    this.phaseProperty.value = 0
    this.speedProperty.reset()
    this.scenarioProperty.reset()
    this.runningProperty.value = false
    this.showSpectrumProperty.reset()
    this.showSecondaryProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = INITIAL_STATUS
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.timeProperty.reset()
    this.hasCompletedAnimation = false
    this.starAwarded = false
    this.visitedScenarios.clear()
    this.visitedScenarios.add('explore')
  }
}
