import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/AcidsConstants.js'
import {
  createIndicatorState,
  IndicatorState,
  IndicatorType,
  stepIndicator,
  SubstanceType,
  targetPhForSubstance,
} from '../../../shared/naturalIndicatorModel.js'

export type IndicatorScenario = 'explore' | 'acidTest' | 'baseTest'

/** Scenarios that force a specific substance (what gets dripped in) when selected. */
const SCENARIO_SUBSTANCE: Partial<Record<IndicatorScenario, SubstanceType>> = {
  acidTest: 'acid',
  baseTest: 'base',
}

const SCENARIO_STATUS: Record<IndicatorScenario, string> = {
  explore:
    'Explore freely \u2014 choose an indicator and a substance, then press Start drip and watch the beaker change color.',
  acidTest: 'Acid test: an acid drips in automatically \u2014 watch how the indicator reacts to something sour/acidic.',
  baseTest: 'Base test: a base drips in automatically \u2014 watch how the indicator reacts to something alkaline.',
}

const SCENARIO_TIP: Record<IndicatorScenario, string> = {
  explore:
    'Natural indicators are dyes from plants that change color depending on whether a substance is acidic, neutral, or basic.',
  acidTest:
    'Cabbage juice turns pink/red in acids, while turmeric stays yellow \u2014 acids don\u2019t change turmeric\u2019s color much.',
  baseTest:
    'Cabbage juice turns blue/green in bases, and turmeric turns a distinct red-brown \u2014 a classic test for alkalis.',
}

const INITIAL_STATUS = SCENARIO_STATUS.explore

/** Display pH at/below which the drip clearly "counts" as acidic for star tracking. */
const ACID_SEEN_THRESHOLD = 3.5
/** Display pH at/above which the drip clearly "counts" as basic for star tracking. */
const BASE_SEEN_THRESHOLD = 9.5

/**
 * Natural indicator lab (PTB Grade 8 Ch 7 parity): wraps the shared cabbage/turmeric
 * kinetics model with a full Property surface for indicator, substance, scenario,
 * conditions, display toggles, playback, and progress state.
 */
export class NaturalIndicatorModel implements TModel {
  public readonly indicatorProperty: Property<IndicatorType>
  public readonly substanceProperty: Property<SubstanceType>
  public readonly scenarioProperty: Property<IndicatorScenario>
  public readonly runningProperty: BooleanProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly displayPhProperty: NumberProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showExpectedProperty: BooleanProperty
  public readonly showPhMeterProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly indicatorSwitchesProperty: NumberProperty
  public readonly substanceSwitchesProperty: NumberProperty
  public readonly beakerResetsProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private state: IndicatorState
  private readonly visitedScenarios = new Set<IndicatorScenario>(['explore'])
  private hasSeenAcid = false
  private hasSeenBase = false
  private starAwarded = false

  public constructor() {
    this.indicatorProperty = new Property<IndicatorType>('cabbage')
    this.substanceProperty = new Property<SubstanceType>('acid')
    this.scenarioProperty = new Property<IndicatorScenario>('explore')
    this.runningProperty = new BooleanProperty(false)
    this.simSpeedProperty = new NumberProperty(1)
    this.state = createIndicatorState()
    this.displayPhProperty = new NumberProperty(this.state.displayPh)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showExpectedProperty = new BooleanProperty(true)
    this.showPhMeterProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(INITIAL_STATUS)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.indicatorSwitchesProperty = new NumberProperty(0)
    this.substanceSwitchesProperty = new NumberProperty(0)
    this.beakerResetsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
  }

  /** Indicator buttons — swaps the dye and restarts the beaker fresh. */
  public setIndicator(indicator: IndicatorType): void {
    if (this.indicatorProperty.value === indicator) return
    this.indicatorProperty.value = indicator
    this.state = createIndicatorState()
    this.displayPhProperty.value = this.state.displayPh
    this.indicatorSwitchesProperty.value += 1
    this.statusProperty.value =
      indicator === 'cabbage'
        ? 'Switched to cabbage juice \u2014 pink/red in acids, purple when neutral, blue/green in bases.'
        : 'Switched to turmeric \u2014 stays yellow in acids and neutral liquids, turns red-brown in bases.'
  }

  /** Substance buttons — chooses what gets dripped into the beaker. */
  public setSubstance(substance: SubstanceType): void {
    if (this.substanceProperty.value === substance) return
    this.substanceProperty.value = substance
    this.state = createIndicatorState()
    this.displayPhProperty.value = this.state.displayPh
    this.substanceSwitchesProperty.value += 1
    this.statusProperty.value =
      substance === 'acid'
        ? 'Now dripping an acid \u2014 press Start drip to see the indicator react.'
        : substance === 'base'
          ? 'Now dripping a base (alkali) \u2014 press Start drip to see the indicator react.'
          : 'Now dripping a neutral liquid (like water) \u2014 the indicator should barely change.'
  }

  /** Scenario buttons — applies the scenario's substance (if any) and restarts the beaker. */
  public setScenario(scenario: IndicatorScenario): void {
    this.scenarioProperty.value = scenario
    const targetSubstance = SCENARIO_SUBSTANCE[scenario]
    if (targetSubstance && targetSubstance !== this.substanceProperty.value) {
      this.substanceProperty.value = targetSubstance
      this.substanceSwitchesProperty.value += 1
    }
    this.state = createIndicatorState()
    this.displayPhProperty.value = this.state.displayPh
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
      ? 'Dripping \u2014 watch the beaker color shift toward the expected result.'
      : 'Paused \u2014 change the indicator or substance, then press Start drip to continue.'
  }

  /** Resets just the beaker's drip/color back to a clean start without touching indicator/substance. */
  public resetBeaker(): void {
    this.state = createIndicatorState()
    this.displayPhProperty.value = this.state.displayPh
    this.beakerResetsProperty.value += 1
    this.statusProperty.value = 'Beaker reset \u2014 clean indicator liquid, ready for a fresh drip.'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value =
        'Correct! Turmeric turns red-brown in a base (alkaline) substance \u2014 that\u2019s the classic turmeric test.'
    }
    else {
      this.statusProperty.value =
        'Not quite \u2014 turmeric turns red-brown in a base (alkaline), not an acid. Acids leave it yellow.'
    }
  }

  public step(dt: number): void {
    if (dt <= 0) return
    const scaledDt = dt * clamp(this.simSpeedProperty.value, 0.25, 3)
    if (this.runningProperty.value) {
      this.timeProperty.value += scaledDt
      this.state = stepIndicator(this.state, scaledDt, this.substanceProperty.value, true)
      this.displayPhProperty.value = this.state.displayPh
    }

    const ph = this.displayPhProperty.value
    if (ph <= ACID_SEEN_THRESHOLD) this.hasSeenAcid = true
    if (ph >= BASE_SEEN_THRESHOLD) this.hasSeenBase = true

    if (!this.starAwarded && this.hasSeenAcid && this.hasSeenBase) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.statusProperty.value =
        'Great work! You\u2019ve seen the indicator react to both an acid and a base. \u2b50'
      this.quizPromptsProperty.value += 1
    }
  }

  /** Target pH the current substance drips toward — used by the view for readouts/animation. */
  public get targetPh(): number {
    return targetPhForSubstance(this.substanceProperty.value)
  }

  public get dripProgress(): number {
    return this.state.dripProgress
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    this.indicatorProperty.reset()
    this.substanceProperty.reset()
    this.scenarioProperty.reset()
    this.runningProperty.reset()
    this.simSpeedProperty.reset()
    this.state = createIndicatorState()
    this.displayPhProperty.value = this.state.displayPh
    this.showLabelsProperty.reset()
    this.showExpectedProperty.reset()
    this.showPhMeterProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = INITIAL_STATUS
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.indicatorSwitchesProperty.reset()
    this.substanceSwitchesProperty.reset()
    this.beakerResetsProperty.reset()
    this.timeProperty.reset()
    this.hasSeenAcid = false
    this.hasSeenBase = false
    this.starAwarded = false
    this.visitedScenarios.clear()
    this.visitedScenarios.add('explore')
  }
}
