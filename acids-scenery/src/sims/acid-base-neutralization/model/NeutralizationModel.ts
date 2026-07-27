import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/AcidsConstants.js'
import {
  createNeutralizationState,
  NeutralizationState,
  stepNeutralization,
} from '../../../shared/neutralizationModel.js'

export type NeutralizationScenario = 'explore' | 'equalVolumes' | 'excessAcid' | 'excessBase'

/** Scenarios that force specific acid/base volumes when selected. 'explore' leaves the sliders alone. */
const SCENARIO_VOLUMES: Partial<Record<NeutralizationScenario, { acid: number; base: number }>> = {
  equalVolumes: { acid: 50, base: 50 },
  excessAcid: { acid: 80, base: 30 },
  excessBase: { acid: 30, base: 80 },
}

const SCENARIO_STATUS: Record<NeutralizationScenario, string> = {
  explore:
    'Explore freely \u2014 set the acid and base volumes, then pour and watch the pH move toward or away from neutral.',
  equalVolumes:
    'Equal volumes: pouring the same amount of acid and base \u2014 both should react completely, leaving salt and water at pH 7.',
  excessAcid:
    'Excess acid: more acid than base is poured \u2014 the leftover acid keeps the final mixture acidic (pH below 7).',
  excessBase:
    'Excess base: more base than acid is poured \u2014 the leftover base keeps the final mixture basic (pH above 7).',
}

const SCENARIO_TIP: Record<NeutralizationScenario, string> = {
  explore:
    'A strong acid and a strong base neutralize each other: Acid + Base \u2192 Salt + Water. Whichever reactant is left over decides the final pH.',
  equalVolumes:
    'When acid and base react in matching amounts, both are used up completely \u2014 the pH settles right at 7 (neutral).',
  excessAcid:
    'The reactant left over after the reaction determines the final pH \u2014 extra acid keeps the mixture acidic.',
  excessBase:
    'Extra base left over after the reaction keeps the mixture basic (alkaline), even though some acid did react.',
}

const INITIAL_STATUS = SCENARIO_STATUS.explore

/** pH window (inclusive) that counts as "reached neutral" for star/quiz/particle triggers. */
const NEUTRAL_WINDOW = 0.5

/**
 * Acid\u2013base neutralization lab (PTB Grade 8 Ch 7 parity): wraps the shared
 * pour/mix kinetics model with a full Property surface for scenario, conditions,
 * display toggles, playback, and progress state.
 */
export class NeutralizationModel implements TModel {
  public readonly scenarioProperty: Property<NeutralizationScenario>
  public readonly acidVolumeProperty: NumberProperty
  public readonly baseVolumeProperty: NumberProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly runningProperty: BooleanProperty
  public readonly phProperty: NumberProperty
  public readonly mixedAcidProperty: NumberProperty
  public readonly mixedBaseProperty: NumberProperty
  public readonly pourProgressProperty: NumberProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showPhMeterProperty: BooleanProperty
  public readonly showSaltCrystalsProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly scenarioSwitchesProperty: NumberProperty
  /** Increments each time the mixture freshly reaches ~neutral \u2014 view triggers a particle burst. */
  public readonly neutralHitsProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private state: NeutralizationState
  private applyingScenario = false
  private readonly visitedScenarios = new Set<NeutralizationScenario>(['explore'])
  private hasSeenNeutral = false
  private neutralStarAwarded = false
  private explorerStarAwarded = false

  public constructor() {
    this.scenarioProperty = new Property<NeutralizationScenario>('explore')
    this.state = createNeutralizationState()
    this.acidVolumeProperty = new NumberProperty(this.state.acidVol)
    this.baseVolumeProperty = new NumberProperty(this.state.baseVol)
    this.simSpeedProperty = new NumberProperty(1)
    this.runningProperty = new BooleanProperty(false)
    this.phProperty = new NumberProperty(this.state.ph)
    this.mixedAcidProperty = new NumberProperty(this.state.mixedAcid)
    this.mixedBaseProperty = new NumberProperty(this.state.mixedBase)
    this.pourProgressProperty = new NumberProperty(this.state.pourProgress)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showPhMeterProperty = new BooleanProperty(true)
    this.showSaltCrystalsProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(INITIAL_STATUS)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.scenarioSwitchesProperty = new NumberProperty(0)
    this.neutralHitsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)

    this.acidVolumeProperty.lazyLink(() => this.onSliderChanged())
    this.baseVolumeProperty.lazyLink(() => this.onSliderChanged())
  }

  /** Dragging a volume slider by hand implicitly switches to the Explore scenario. */
  private onSliderChanged(): void {
    if (this.applyingScenario) return
    if (this.scenarioProperty.value !== 'explore') {
      this.scenarioProperty.value = 'explore'
      this.statusProperty.value = SCENARIO_STATUS.explore
    }
  }

  /** Scenario buttons \u2014 applies forced volumes (if any) and restarts the pour. */
  public setScenario(scenario: NeutralizationScenario): void {
    this.scenarioProperty.value = scenario
    this.scenarioSwitchesProperty.value += 1

    const forced = SCENARIO_VOLUMES[scenario]
    if (forced) {
      this.applyingScenario = true
      this.acidVolumeProperty.value = forced.acid
      this.baseVolumeProperty.value = forced.base
      this.applyingScenario = false
    }

    this.state = createNeutralizationState()
    this.pourProgressProperty.value = 0
    this.mixedAcidProperty.value = 0
    this.mixedBaseProperty.value = 0
    this.phProperty.value = this.state.ph
    this.runningProperty.value = true
    this.statusProperty.value = SCENARIO_STATUS[scenario]

    if (!this.visitedScenarios.has(scenario)) {
      this.visitedScenarios.add(scenario)
      this.showTip(SCENARIO_TIP[scenario])
    }

    if (
      !this.explorerStarAwarded &&
      this.visitedScenarios.has('equalVolumes') &&
      this.visitedScenarios.has('excessAcid') &&
      this.visitedScenarios.has('excessBase')
    ) {
      this.explorerStarAwarded = true
      this.starsProperty.value += 1
      this.statusProperty.value =
        'Great work! You\u2019ve tried equal volumes, excess acid, and excess base. \u2b50'
    }
  }

  /** Pour/Play button \u2014 (re)starts pouring if not begun, or resumes after Pause. */
  public startPour(): void {
    this.runningProperty.value = true
    this.statusProperty.value =
      this.pourProgressProperty.value > 0.02
        ? 'Pouring resumed \u2014 watch the pH readout and the mixture color.'
        : 'Pouring \u2014 acid and base are flowing into the mixture beaker.'
  }

  public pause(): void {
    this.runningProperty.value = false
    this.statusProperty.value = 'Paused \u2014 adjust the sliders, then press Pour/Play to continue.'
  }

  /** Resets just the pour/mix progress, keeping the current scenario and volume sliders. */
  public resetMix(): void {
    this.state = createNeutralizationState()
    this.pourProgressProperty.value = 0
    this.mixedAcidProperty.value = 0
    this.mixedBaseProperty.value = 0
    this.phProperty.value = this.state.ph
    this.runningProperty.value = false
    this.hasSeenNeutral = false
    this.statusProperty.value = 'Mix reset \u2014 press Pour/Play to start pouring again.'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value =
        'Correct! A strong acid and a strong base react to form a salt and water \u2014 that\u2019s neutralization.'
    }
    else {
      this.statusProperty.value =
        'Not quite \u2014 neutralization always produces a salt plus water, not just one or the other.'
    }
  }

  public step(dt: number): void {
    if (dt <= 0) return
    const scaledDt = dt * clamp(this.simSpeedProperty.value, 0.25, 3)
    if (this.runningProperty.value) {
      this.timeProperty.value += scaledDt
      this.state = stepNeutralization(
        this.state,
        scaledDt,
        this.acidVolumeProperty.value,
        this.baseVolumeProperty.value,
      )
      this.phProperty.value = this.state.ph
      this.pourProgressProperty.value = this.state.pourProgress
      this.mixedAcidProperty.value = this.state.mixedAcid
      this.mixedBaseProperty.value = this.state.mixedBase
    }

    const ph = this.phProperty.value
    const poured = this.pourProgressProperty.value > 0.05
    const isNeutralNow = poured && Math.abs(ph - 7) <= NEUTRAL_WINDOW
    if (isNeutralNow && !this.hasSeenNeutral) {
      this.hasSeenNeutral = true
      this.neutralHitsProperty.value += 1
      this.quizPromptsProperty.value += 1
      if (!this.neutralStarAwarded) {
        this.neutralStarAwarded = true
        this.starsProperty.value += 1
      }
    }
    else if (!isNeutralNow) {
      this.hasSeenNeutral = false
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    this.scenarioProperty.reset()
    this.applyingScenario = true
    this.acidVolumeProperty.reset()
    this.baseVolumeProperty.reset()
    this.applyingScenario = false
    this.simSpeedProperty.reset()
    this.runningProperty.reset()
    this.state = createNeutralizationState()
    this.phProperty.value = this.state.ph
    this.mixedAcidProperty.value = 0
    this.mixedBaseProperty.value = 0
    this.pourProgressProperty.value = 0
    this.showLabelsProperty.reset()
    this.showPhMeterProperty.reset()
    this.showSaltCrystalsProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = INITIAL_STATUS
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.scenarioSwitchesProperty.reset()
    this.neutralHitsProperty.reset()
    this.timeProperty.reset()
    this.hasSeenNeutral = false
    this.neutralStarAwarded = false
    this.explorerStarAwarded = false
    this.visitedScenarios.clear()
    this.visitedScenarios.add('explore')
  }
}
