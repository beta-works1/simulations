import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { SUBSTANCES, createPhScaleState, phLabel, stepPhScale } from '../../../shared/phScaleModel.js'
import type { PhScaleState } from '../../../shared/phScaleModel.js'

export type PhScenario = 'explore' | 'strongAcid' | 'neutral' | 'strongBase'

const CUSTOM_ID = 'custom'
const CUSTOM_LABEL = 'Custom mixture'

/**
 * Dense ecology-style control surface for the pH scale (Ch7 acids parity).
 */
export class AcidsPhScaleModel implements TModel {
  public readonly selectedSubstanceIdProperty: Property<string>
  public readonly customPhProperty: NumberProperty
  public readonly scenarioProperty: Property<PhScenario>
  public readonly displayPhProperty: NumberProperty

  // ── Dense controls (Ch1 carbon-style) ────────────────────────────────────
  public readonly showLabelsProperty: BooleanProperty
  public readonly showIndicatorProperty: BooleanProperty
  public readonly meterOnProperty: BooleanProperty
  public readonly runningProperty: BooleanProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly soundEnabledProperty: BooleanProperty

  public readonly statusProperty: StringProperty
  public readonly starsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly substanceChangesProperty: NumberProperty
  public readonly scenarioTourCompleteProperty: BooleanProperty

  private phState: PhScaleState
  private neutralQuizShown = false
  private readonly visitedScenarios = new Set<PhScenario>()

  public constructor() {
    this.selectedSubstanceIdProperty = new Property<string>('water')
    this.customPhProperty = new NumberProperty(7)
    this.scenarioProperty = new Property<PhScenario>('explore')
    this.phState = createPhScaleState()
    this.displayPhProperty = new NumberProperty(this.phState.displayPh)

    this.showLabelsProperty = new BooleanProperty(true)
    this.showIndicatorProperty = new BooleanProperty(true)
    this.meterOnProperty = new BooleanProperty(true)
    this.runningProperty = new BooleanProperty(true)
    this.simSpeedProperty = new NumberProperty(1)
    this.soundEnabledProperty = new BooleanProperty(true)

    this.statusProperty = new StringProperty('Pick a substance or drag the Custom pH slider.')
    this.starsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.substanceChangesProperty = new NumberProperty(0)
    this.scenarioTourCompleteProperty = new BooleanProperty(false)

    this.customPhProperty.lazyLink(() => {
      this.scenarioProperty.value = 'explore'
      if (this.selectedSubstanceIdProperty.value !== CUSTOM_ID) {
        this.selectedSubstanceIdProperty.value = CUSTOM_ID
      }
    })

    this.selectedSubstanceIdProperty.lazyLink((id) => this.onSelectionChanged(id))
  }

  public get isCustom(): boolean {
    return this.selectedSubstanceIdProperty.value === CUSTOM_ID
  }

  public targetPh(): number {
    if (this.isCustom) {
      return this.customPhProperty.value
    }
    const s = SUBSTANCES.find((sub) => sub.id === this.selectedSubstanceIdProperty.value)
    return s ? s.ph : 7
  }

  public substanceLabel(): string {
    if (this.isCustom) {
      return CUSTOM_LABEL
    }
    const s = SUBSTANCES.find((sub) => sub.id === this.selectedSubstanceIdProperty.value)
    return s ? s.label : 'Water'
  }

  /** Manual pick from the substance list — always drops back into Explore mode. */
  public selectSubstance(id: string): void {
    this.scenarioProperty.value = 'explore'
    this.selectedSubstanceIdProperty.value = id
  }

  public setScenario(scenario: PhScenario): void {
    this.scenarioProperty.value = scenario
    if (scenario !== 'explore') {
      this.visitedScenarios.add(scenario)
      if (this.visitedScenarios.size >= 3 && !this.scenarioTourCompleteProperty.value) {
        this.scenarioTourCompleteProperty.value = true
        this.starsProperty.value += 1
      }
    }
    if (scenario === 'strongAcid') {
      this.selectedSubstanceIdProperty.value = 'battery'
      this.statusProperty.value = 'Strong acid — very low pH, far below 7.'
    }
    else if (scenario === 'neutral') {
      this.selectedSubstanceIdProperty.value = 'water'
      this.statusProperty.value = 'Neutral — pH 7, neither acidic nor basic.'
    }
    else if (scenario === 'strongBase') {
      this.selectedSubstanceIdProperty.value = 'drain'
      this.statusProperty.value = 'Strong base — very high pH, far above 7.'
    }
    else {
      this.statusProperty.value = 'Explore freely — tap any substance or drag Custom pH.'
    }
  }

  private onSelectionChanged(id: string): void {
    this.substanceChangesProperty.value += 1
    if (id !== CUSTOM_ID) {
      const s = SUBSTANCES.find((sub) => sub.id === id)
      if (s) {
        this.statusProperty.value = `${s.label} — pH ${s.ph} (${phLabel(s.ph)}).`
      }
    }
    else {
      this.statusProperty.value = 'Custom mixture — drag the Custom pH slider to set the value.'
    }
  }

  public onQuizAnswered(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value = 'Correct — pH 7 is neutral, like pure water.'
    }
    else {
      this.statusProperty.value = 'Not quite — pH 7 is neutral, neither acidic nor basic.'
    }
  }

  public step(dt: number): void {
    const scaledDt = dt * Math.max(0.25, this.simSpeedProperty.value)
    const target = this.targetPh()

    if (this.runningProperty.value) {
      this.phState = stepPhScale(this.phState, scaledDt, target)
    }
    else {
      this.phState = { ...this.phState, displayPh: target, targetPh: target, time: this.phState.time + scaledDt }
    }
    this.displayPhProperty.value = this.phState.displayPh

    if (!this.neutralQuizShown && phLabel(target) === 'Neutral') {
      this.neutralQuizShown = true
      this.quizPromptsProperty.value += 1
    }
  }

  public reset(): void {
    this.selectedSubstanceIdProperty.reset()
    this.customPhProperty.reset()
    this.scenarioProperty.reset()
    this.phState = createPhScaleState()
    this.displayPhProperty.value = this.phState.displayPh

    this.showLabelsProperty.reset()
    this.showIndicatorProperty.reset()
    this.meterOnProperty.reset()
    this.runningProperty.reset()
    this.simSpeedProperty.reset()
    this.soundEnabledProperty.reset()

    this.statusProperty.value = 'Pick a substance or drag the Custom pH slider.'
    this.starsProperty.reset()
    this.quizPromptsProperty.reset()
    this.substanceChangesProperty.reset()
    this.scenarioTourCompleteProperty.reset()

    this.neutralQuizShown = false
    this.visitedScenarios.clear()
  }
}
