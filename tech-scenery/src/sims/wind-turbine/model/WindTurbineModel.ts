import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { bladeRpm, formatPower, powerOutputKw, stepBladeAngle } from '../../../shared/windPhysics.js'

export type WindScenario = 'explore' | 'breezy' | 'gale'

const SCENARIO_STATUS: Record<WindScenario, string> = {
  explore: 'Explore — change wind speed and watch RPM and power.',
  breezy: 'Breezy — blades turn slowly with modest power.',
  gale: 'Gale — high wind drives strong electrical output.',
}
const SCENARIO_TIP: Record<WindScenario, string> = {
  explore: 'Power rises faster than wind speed — roughly with the cube of wind.',
  breezy: 'Near cut-in, blades barely move and power is tiny.',
  gale: 'Strong winds mean high mechanical and electrical power.',
}
const SCENARIO_WIND: Record<WindScenario, number> = { explore: 8, breezy: 5, gale: 20 }

export class WindTurbineModel implements TModel {
  public readonly windSpeedProperty: NumberProperty
  public readonly bladeAngleProperty: NumberProperty
  public readonly scenarioProperty: Property<WindScenario>
  public readonly runningProperty: BooleanProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showReadoutProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private readonly visited = new Set<WindScenario>(['explore'])
  private adjusted = false
  private starAwarded = false

  public constructor() {
    this.windSpeedProperty = new NumberProperty(8)
    this.bladeAngleProperty = new NumberProperty(0)
    this.scenarioProperty = new Property<WindScenario>('explore')
    this.runningProperty = new BooleanProperty(true)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showReadoutProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(SCENARIO_STATUS.explore)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
    this.windSpeedProperty.lazyLink(() => { this.adjusted = true })
  }

  public get rpm(): number { return bladeRpm(this.windSpeedProperty.value) }
  public get powerKw(): number { return powerOutputKw(this.windSpeedProperty.value) }
  public get powerLabel(): string { return formatPower(this.powerKw) }

  public setScenario(scenario: WindScenario): void {
    this.scenarioProperty.value = scenario
    this.windSpeedProperty.value = SCENARIO_WIND[scenario]
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
      ? 'Running — blades convert wind into rotation and power.'
      : 'Paused — adjust wind speed.'
  }

  public onQuiz(correct: boolean): void {
    this.statusProperty.value = correct
      ? 'Correct! Wind → spin → electricity.'
      : 'Not quite — turbines turn wind into electricity, not the reverse.'
    if (correct) this.starsProperty.value += 1
  }

  public step(dt: number): void {
    if (dt <= 0) return
    if (this.runningProperty.value) {
      this.timeProperty.value += dt
      this.bladeAngleProperty.value = stepBladeAngle(
        this.bladeAngleProperty.value,
        this.windSpeedProperty.value,
        true,
        dt,
      )
    }
    if (!this.starAwarded && this.adjusted && this.visited.size >= 2) {
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
    this.windSpeedProperty.reset()
    this.bladeAngleProperty.reset()
    this.scenarioProperty.reset()
    this.runningProperty.reset()
    this.showLabelsProperty.reset()
    this.showReadoutProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = SCENARIO_STATUS.explore
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.timeProperty.reset()
    this.adjusted = false
    this.starAwarded = false
    this.visited.clear()
    this.visited.add('explore')
  }
}
