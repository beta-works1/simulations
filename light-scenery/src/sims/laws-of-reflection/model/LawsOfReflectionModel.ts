import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/LightConstants.js'

export type LawsScenario = 'explore' | 'grazing' | 'nearNormal'

const SCENARIO_STATUS: Record<LawsScenario, string> = {
  explore: 'Explore — adjust ∠i and confirm the reflected ray stays equal.',
  grazing: 'Grazing incidence — light skims the mirror with a large equal angle.',
  nearNormal: 'Near-normal — light hits almost straight on; ∠i and ∠r stay small and equal.',
}

const SCENARIO_TIP: Record<LawsScenario, string> = {
  explore: 'The normal is a dashed line perpendicular to the mirror. Angles are measured from it.',
  grazing: 'At grazing incidence both ∠i and ∠r are large — the ray barely bounces off the surface.',
  nearNormal: 'When light hits nearly straight on, both angles are small but still equal.',
}

const SCENARIO_INCIDENCE: Record<LawsScenario, number> = {
  explore: 35,
  grazing: 78,
  nearNormal: 12,
}

const INITIAL_STATUS = SCENARIO_STATUS.explore

export class LawsOfReflectionModel implements TModel {
  public readonly incidenceDegProperty: NumberProperty
  public readonly scenarioProperty: Property<LawsScenario>
  public readonly runningProperty: BooleanProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showNormalProperty: BooleanProperty
  public readonly showAnglesProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private readonly visitedScenarios = new Set<LawsScenario>(['explore'])
  private hasAdjustedAngle = false
  private starAwarded = false
  private lastIncidence = 35

  public constructor() {
    this.incidenceDegProperty = new NumberProperty(35)
    this.scenarioProperty = new Property<LawsScenario>('explore')
    this.runningProperty = new BooleanProperty(true)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showNormalProperty = new BooleanProperty(true)
    this.showAnglesProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(INITIAL_STATUS)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
  }

  public setScenario(scenario: LawsScenario): void {
    this.scenarioProperty.value = scenario
    this.incidenceDegProperty.value = SCENARIO_INCIDENCE[scenario]
    this.statusProperty.value = SCENARIO_STATUS[scenario]
    if (!this.visitedScenarios.has(scenario)) {
      this.visitedScenarios.add(scenario)
      this.showTip(SCENARIO_TIP[scenario])
    }
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Running — watch how ∠r always matches ∠i.'
      : 'Paused — change the incidence angle or try another scenario.'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value = 'Correct! The reflected angle always equals the incident angle.'
    }
    else {
      this.statusProperty.value = 'Not quite — the law says ∠i = ∠r, not that incidence is always 90°.'
    }
  }

  public step(dt: number): void {
    if (dt <= 0) return
    if (this.runningProperty.value) this.timeProperty.value += dt

    const inc = this.incidenceDegProperty.value
    if (Math.abs(inc - this.lastIncidence) > 2) this.hasAdjustedAngle = true
    this.lastIncidence = inc

    if (!this.starAwarded && this.hasAdjustedAngle && this.visitedScenarios.size >= 2) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.statusProperty.value = 'Great! You explored different angles — ∠i always equals ∠r. ★'
      this.quizPromptsProperty.value += 1
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    this.incidenceDegProperty.reset()
    this.scenarioProperty.reset()
    this.runningProperty.reset()
    this.showLabelsProperty.reset()
    this.showNormalProperty.reset()
    this.showAnglesProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = INITIAL_STATUS
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.timeProperty.reset()
    this.hasAdjustedAngle = false
    this.starAwarded = false
    this.lastIncidence = 35
    this.visitedScenarios.clear()
    this.visitedScenarios.add('explore')
  }

  public clampIncidence(deg: number): number {
    return clamp(deg, 0, 80)
  }
}
