import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/ReactionsConstants.js'
import {
  BondAnimState,
  BondMode,
  createBondAnimState,
  ionicElectronPos,
  stepBondAnim,
} from '../../../shared/ionicCovalentModel.js'

export type Scenario = 'explore' | 'transfer' | 'sharing'

/** Fixed nudge applied by the "Step phase" button so a paused learner can still see motion. */
const MANUAL_STEP_DT = 0.45
/** How long (sim seconds) a covalent mode must run before "sharing" counts as seen. */
const SHARING_SEEN_SECONDS = 2

export const MODE_TITLE: Record<BondMode, string> = {
  ionic: 'Ionic bond \u2014 NaCl',
  'covalent-h2': 'Covalent bond \u2014 H\u2082',
  'covalent-h2o': 'Covalent bond \u2014 H\u2082O',
}

export const MODE_CAPTION: Record<BondMode, string> = {
  ionic: 'Sodium gives up its outer electron completely to chlorine, forming Na\u207a and Cl\u207b ions.',
  'covalent-h2': 'Two hydrogen atoms share a pair of electrons equally, holding the molecule together.',
  'covalent-h2o': 'Oxygen shares one electron pair with each hydrogen atom, forming a bent H\u2082O molecule.',
}

const SCENARIO_STATUS: Record<Scenario, string> = {
  explore: 'Explore freely \u2014 pick a bond type and watch how its electrons behave.',
  transfer: 'Transfer focus: watch the electron move completely from Na to Cl, forming charged ions.',
  sharing: 'Sharing focus: watch the shared electron pair oscillate between the bonded atoms.',
}

const SCENARIO_TIP: Record<Scenario, string> = {
  explore:
    'Ionic bonds transfer electrons between a metal and a non-metal. Covalent bonds share electrons between non-metals.',
  transfer:
    'In an ionic bond, one atom (like Na) loses an electron completely, and the other (like Cl) gains it \u2014 forming oppositely charged ions that attract each other.',
  sharing:
    'In a covalent bond, atoms share electron pairs instead of transferring them, so neither atom becomes charged.',
}

/** Scenario focus auto-selects a sensible bond mode; explore leaves the current mode alone. */
const SCENARIO_MODE: Record<Scenario, BondMode | null> = {
  explore: null,
  transfer: 'ionic',
  sharing: 'covalent-h2',
}

const INITIAL_STATUS = SCENARIO_STATUS.explore

/**
 * Ionic vs covalent bonding lab (PTB Grade 8 Ch 6 parity): an ionic mode where a
 * single electron transfers completely (Na \u2192 Cl, forming ions), and two covalent
 * modes (H\u2082, H\u2082O) where electron pairs are shared and oscillate in place.
 */
export class IonicCovalentModel implements TModel {
  public readonly bondModeProperty: Property<BondMode>
  public readonly scenarioProperty: Property<Scenario>
  public readonly runningProperty: BooleanProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly showChargesProperty: BooleanProperty
  public readonly showElectronLabelsProperty: BooleanProperty
  public readonly showOrbitHintsProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty
  /** 0\u20131 bond animation phase \u2014 electron transfer progress (ionic) or share-pair cycle (covalent). */
  public readonly phaseProperty: NumberProperty
  /** True once the ionic electron has (this cycle) fully transferred to Cl. */
  public readonly transferredProperty: BooleanProperty

  private readonly visitedScenarios = new Set<Scenario>(['explore'])
  private readonly seenModes = new Set<BondMode>()
  private bondAnimState: BondAnimState = createBondAnimState()
  private sharingTimer = 0
  private seenTransfer = false
  private seenSharing = false
  private starAwarded = false

  public constructor() {
    this.bondModeProperty = new Property<BondMode>('ionic')
    this.scenarioProperty = new Property<Scenario>('explore')
    this.runningProperty = new BooleanProperty(true)
    this.simSpeedProperty = new NumberProperty(1)
    this.showChargesProperty = new BooleanProperty(true)
    this.showElectronLabelsProperty = new BooleanProperty(true)
    this.showOrbitHintsProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(INITIAL_STATUS)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
    this.phaseProperty = new NumberProperty(0)
    this.transferredProperty = new BooleanProperty(false)
  }

  public setBondMode(mode: BondMode): void {
    this.bondModeProperty.value = mode
    this.bondAnimState = createBondAnimState()
    this.phaseProperty.value = 0
    this.transferredProperty.value = false
    this.sharingTimer = 0
    this.statusProperty.value = MODE_CAPTION[mode]
    if (!this.seenModes.has(mode)) {
      this.seenModes.add(mode)
      this.showTip(MODE_CAPTION[mode])
    }
  }

  /** Switch scenario, applying its recipe defaults and refreshing the status/tip. */
  public setScenario(scenario: Scenario): void {
    this.scenarioProperty.value = scenario
    this.statusProperty.value = SCENARIO_STATUS[scenario]

    const targetMode = SCENARIO_MODE[scenario]
    if (targetMode && targetMode !== this.bondModeProperty.value) {
      this.setBondMode(targetMode)
    }
    if (scenario !== 'explore') {
      this.runningProperty.value = true
    }

    if (!this.visitedScenarios.has(scenario)) {
      this.visitedScenarios.add(scenario)
      this.showTip(SCENARIO_TIP[scenario])
    }
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Running \u2014 watch the electrons animate.'
      : 'Paused \u2014 press Step phase to nudge the animation, or Play to continue.'
  }

  /** Advance the bond animation by one fixed nudge, even while paused. */
  public stepPhaseOnce(): void {
    this.advance(MANUAL_STEP_DT)
  }

  /** Resets bond animation + panel toggles to defaults without resetting scenario/mode. */
  public resetDemo(): void {
    this.bondAnimState = createBondAnimState()
    this.phaseProperty.value = 0
    this.transferredProperty.value = false
    this.sharingTimer = 0
    this.showChargesProperty.reset()
    this.showElectronLabelsProperty.reset()
    this.showOrbitHintsProperty.reset()
    this.statusProperty.value = 'Demo reset \u2014 watch the animation from the start.'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value =
        'Correct! Ionic bonds transfer electrons completely \u2014 covalent bonds share them instead.'
    }
    else {
      this.statusProperty.value =
        'Not quite \u2014 ionic bonding is electron transfer (forming ions), not sharing.'
    }
  }

  public step(dt: number): void {
    if (dt <= 0 || !this.runningProperty.value) return
    const scaledDt = dt * clamp(this.simSpeedProperty.value, 0.25, 3)
    this.advance(scaledDt)
  }

  private advance(scaledDt: number): void {
    this.bondAnimState = stepBondAnim(this.bondAnimState, scaledDt, true)
    this.phaseProperty.value = this.bondAnimState.phase
    this.timeProperty.value += scaledDt

    const mode = this.bondModeProperty.value
    if (mode === 'ionic') {
      const { transferred } = ionicElectronPos(this.bondAnimState.phase)
      this.transferredProperty.value = transferred
      if (transferred) this.seenTransfer = true
    }
    else {
      this.sharingTimer += scaledDt
      if (this.sharingTimer >= SHARING_SEEN_SECONDS) this.seenSharing = true
    }

    if (!this.starAwarded && this.seenTransfer && this.seenSharing) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.statusProperty.value =
        'Great work! You\u2019ve seen both electron transfer and electron sharing. \u2b50'
      this.quizPromptsProperty.value += 1
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    this.bondModeProperty.reset()
    this.scenarioProperty.reset()
    this.runningProperty.reset()
    this.simSpeedProperty.reset()
    this.showChargesProperty.reset()
    this.showElectronLabelsProperty.reset()
    this.showOrbitHintsProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = INITIAL_STATUS
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.timeProperty.reset()
    this.phaseProperty.reset()
    this.transferredProperty.reset()
    this.bondAnimState = createBondAnimState()
    this.sharingTimer = 0
    this.seenTransfer = false
    this.seenSharing = false
    this.starAwarded = false
    this.visitedScenarios.clear()
    this.visitedScenarios.add('explore')
    this.seenModes.clear()
  }
}
