import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { alignmentFactor, stepTemperature, tempLabel } from '../../../shared/solarPhysics.js'

export type SolarScenario = 'explore' | 'aligned' | 'misaligned'

const SCENARIO_STATUS: Record<SolarScenario, string> = {
  explore: 'Explore — tilt the reflector and watch pot temperature change.',
  aligned: 'Well aligned — sunlight concentrates on the pot.',
  misaligned: 'Misaligned — focus misses the pot; heating slows.',
}
const SCENARIO_TIP: Record<SolarScenario, string> = {
  explore: 'Aim for the angle that matches the sun elevation.',
  aligned: 'Good focus means faster heating and higher temperatures.',
  misaligned: 'Even bright sun fails if the reflector is aimed wrong.',
}
const SCENARIO_VALUES: Record<SolarScenario, { angle: number; sun: number }> = {
  explore: { angle: 0, sun: 42 },
  aligned: { angle: 23, sun: 42 },
  misaligned: { angle: -28, sun: 42 },
}

export class SolarCookerModel implements TModel {
  public readonly reflectorAngleProperty: NumberProperty
  public readonly sunElevationProperty: NumberProperty
  public readonly temperatureProperty: NumberProperty
  public readonly scenarioProperty: Property<SolarScenario>
  public readonly runningProperty: BooleanProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showRaysProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private readonly visited = new Set<SolarScenario>(['explore'])
  private adjusted = false
  private cooked = false
  private starAwarded = false

  public constructor() {
    this.reflectorAngleProperty = new NumberProperty(0)
    this.sunElevationProperty = new NumberProperty(42)
    this.temperatureProperty = new NumberProperty(22)
    this.scenarioProperty = new Property<SolarScenario>('explore')
    this.runningProperty = new BooleanProperty(true)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showRaysProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(SCENARIO_STATUS.explore)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
    this.reflectorAngleProperty.lazyLink(() => { this.adjusted = true })
  }

  public get alignment(): number {
    return alignmentFactor(this.reflectorAngleProperty.value, this.sunElevationProperty.value)
  }

  public get tempStatus(): string {
    return tempLabel(this.temperatureProperty.value)
  }

  public setScenario(scenario: SolarScenario): void {
    this.scenarioProperty.value = scenario
    const v = SCENARIO_VALUES[scenario]
    this.reflectorAngleProperty.value = v.angle
    this.sunElevationProperty.value = v.sun
    this.runningProperty.value = true
    this.statusProperty.value = SCENARIO_STATUS[scenario]
    if (!this.visited.has(scenario)) {
      this.visited.add(scenario)
      this.showTip(SCENARIO_TIP[scenario])
    }
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Running — temperature responds to focus alignment.'
      : 'Paused — adjust reflector angle or sun elevation.'
  }

  public onQuiz(correct: boolean): void {
    this.statusProperty.value = correct
      ? 'Correct! Reflectors concentrate sunlight onto the cooking pot.'
      : 'Not quite — solar cookers focus sunlight; they do not burn fuel in the dish.'
    if (correct) this.starsProperty.value += 1
  }

  public step(dt: number): void {
    if (dt <= 0) return
    if (this.runningProperty.value) {
      this.timeProperty.value += dt
      this.temperatureProperty.value = stepTemperature(
        this.temperatureProperty.value,
        this.reflectorAngleProperty.value,
        this.sunElevationProperty.value,
        true,
        dt,
      )
      if (this.temperatureProperty.value >= 80) this.cooked = true
    }
    if (!this.starAwarded && this.adjusted && this.cooked && this.visited.size >= 2) {
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
    this.reflectorAngleProperty.reset()
    this.sunElevationProperty.reset()
    this.temperatureProperty.reset()
    this.scenarioProperty.reset()
    this.runningProperty.value = true
    this.showLabelsProperty.reset()
    this.showRaysProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = SCENARIO_STATUS.explore
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.timeProperty.reset()
    this.adjusted = false
    this.cooked = false
    this.starAwarded = false
    this.visited.clear()
    this.visited.add('explore')
  }
}
