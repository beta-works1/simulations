import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import {
  clampIncidence,
  computeRefraction,
  defaultRefractionState,
  type RefractionState,
} from '../../../shared/refractionMediaModel.js'

export type RefractionScenario = 'explore' | 'water' | 'glass' | 'diamond'

const SCENARIO_STATUS: Record<RefractionScenario, string> = {
  explore: 'Explore — pick a medium and change incidence to see refraction or TIR.',
  water: 'Water (n ≈ 1.33) — moderate bending toward the normal.',
  glass: 'Glass (n = 1.50) — stronger bending than water.',
  diamond: 'Diamond (n ≈ 2.42) — very strong bending; watch for total internal reflection.',
}

const SCENARIO_TIP: Record<RefractionScenario, string> = {
  explore: 'The normal is perpendicular to the boundary. Angles are measured from it.',
  water: 'Water slows light slightly — the ray bends toward the normal entering from air.',
  glass: 'Higher index means more bending toward the normal.',
  diamond: 'Very dense media can cause total internal reflection at large incidence angles.',
}

const SCENARIO_MEDIUM: Record<RefractionScenario, string | null> = {
  explore: null,
  water: 'water',
  glass: 'glass',
  diamond: 'diamond',
}

const INITIAL_STATUS = SCENARIO_STATUS.explore

export class RefractionMediaModel implements TModel {
  public readonly mediumIdProperty: Property<string>
  public readonly incidenceDegProperty: NumberProperty
  public readonly scenarioProperty: Property<RefractionScenario>
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

  private readonly visitedScenarios = new Set<RefractionScenario>(['explore'])
  private hasChangedMedium = false
  private starAwarded = false

  public constructor() {
    const s = defaultRefractionState()
    this.mediumIdProperty = new Property<string>(s.mediumId)
    this.incidenceDegProperty = new NumberProperty(s.incidenceDeg)
    this.scenarioProperty = new Property<RefractionScenario>('explore')
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

  public setMedium(mediumId: string): void {
    this.mediumIdProperty.value = mediumId
    this.hasChangedMedium = true
    const { isTir } = computeRefraction(this.state)
    this.statusProperty.value = isTir
      ? 'Total internal reflection — no refracted ray enters the medium.'
      : 'Ray bends toward the normal entering the denser medium.'
  }

  public setScenario(scenario: RefractionScenario): void {
    this.scenarioProperty.value = scenario
    const medium = SCENARIO_MEDIUM[scenario]
    if (medium) this.setMedium(medium)
    else this.statusProperty.value = SCENARIO_STATUS[scenario]
    if (scenario === 'explore') this.statusProperty.value = SCENARIO_STATUS.explore
    else if (!medium) this.statusProperty.value = SCENARIO_STATUS[scenario]
    if (!this.visitedScenarios.has(scenario)) {
      this.visitedScenarios.add(scenario)
      this.showTip(SCENARIO_TIP[scenario])
    }
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Running — watch Snell\'s law at the air–medium boundary.'
      : 'Paused — change medium or incidence angle.'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value = 'Correct! Entering a denser medium, light bends toward the normal.'
    }
    else {
      this.statusProperty.value = 'Not quite — denser media bend light toward the normal, not away.'
    }
  }

  public step(dt: number): void {
    if (dt <= 0) return
    if (this.runningProperty.value) this.timeProperty.value += dt
    if (!this.starAwarded && this.hasChangedMedium && this.visitedScenarios.size >= 2) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.statusProperty.value = 'Great! You compared refraction in different media. ★'
      this.quizPromptsProperty.value += 1
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public get state(): RefractionState {
    return {
      mediumId: this.mediumIdProperty.value,
      incidenceDeg: clampIncidence(this.incidenceDegProperty.value),
    }
  }

  public reset(): void {
    const s = defaultRefractionState()
    this.mediumIdProperty.value = s.mediumId
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
    this.hasChangedMedium = false
    this.starAwarded = false
    this.visitedScenarios.clear()
    this.visitedScenarios.add('explore')
  }
}
