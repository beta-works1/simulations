import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/ReactionsConstants.js'
import {
  createMassConservationState,
  displayedMass,
  ESCAPED_MASS,
  stepMassConservation,
  type MassConservationState,
} from '../../../shared/conservationOfMassModel.js'

export type MassScenario = 'explore' | 'sealed-demo' | 'open-demo'

/** Grade 8 Ch 6 parity — law of conservation of mass via a sealed vs. open container demo. */
const SCENARIO_STATUS: Record<MassScenario, string> = {
  explore: 'Explore freely — toggle the seal and press Play to watch the reaction happen.',
  'sealed-demo': 'Sealed demo: nothing can escape, so the balance stays level — mass is conserved.',
  'open-demo': 'Open demo: gas escapes into the air, so the container looks lighter on the scale.',
}

const SCENARIO_TIP: Record<MassScenario, string> = {
  explore:
    'The law of conservation of mass says matter is neither created nor destroyed in a chemical reaction \u2014 the total mass of the reactants always equals the total mass of the products.',
  'sealed-demo':
    'In a sealed container, any gas made by the reaction stays trapped inside, so the measured mass never changes \u2014 that is conservation of mass in action.',
  'open-demo':
    'In an open container, gas produced by the reaction escapes into the air. The container looks lighter, but the escaped gas still has mass \u2014 none of it actually vanished.',
}

const INITIAL_STATUS = SCENARIO_STATUS.explore

export class ConservationOfMassModel implements TModel {
  public readonly scenarioProperty: Property<MassScenario>
  public readonly sealedProperty: BooleanProperty
  public readonly runningProperty: BooleanProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showBalanceProperty: BooleanProperty
  public readonly showEscapeGasProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly progressProperty: NumberProperty
  public readonly massProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private reactionState: MassConservationState
  private readonly visitedScenarios = new Set<MassScenario>(['explore'])
  private sealedRunCompleted = false
  private openRunCompleted = false

  public constructor() {
    this.scenarioProperty = new Property<MassScenario>('explore')
    this.sealedProperty = new BooleanProperty(true)
    this.runningProperty = new BooleanProperty(true)
    this.simSpeedProperty = new NumberProperty(1)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showBalanceProperty = new BooleanProperty(true)
    this.showEscapeGasProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(INITIAL_STATUS)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.reactionState = createMassConservationState()
    this.progressProperty = new NumberProperty(this.reactionState.progress)
    this.massProperty = new NumberProperty(displayedMass(this.reactionState.progress, this.sealedProperty.value))
    this.timeProperty = new NumberProperty(0)
  }

  /** Switch scenario, applying its recipe defaults and refreshing the status/tip. */
  public setScenario(scenario: MassScenario): void {
    this.scenarioProperty.value = scenario
    this.statusProperty.value = SCENARIO_STATUS[scenario]

    if (scenario === 'sealed-demo') {
      this.sealedProperty.value = true
      this.restartReaction()
      this.runningProperty.value = true
    }
    else if (scenario === 'open-demo') {
      this.sealedProperty.value = false
      this.restartReaction()
      this.runningProperty.value = true
    }

    if (!this.visitedScenarios.has(scenario)) {
      this.visitedScenarios.add(scenario)
      this.showTip(SCENARIO_TIP[scenario])
    }
  }

  public toggleSealed(): void {
    this.sealedProperty.value = !this.sealedProperty.value
    this.massProperty.value = displayedMass(this.reactionState.progress, this.sealedProperty.value)
    this.statusProperty.value = this.sealedProperty.value
      ? 'Sealed \u2014 nothing can get in or out. Watch the balance stay level as the reaction runs.'
      : 'Open \u2014 gas made by the reaction can escape. Watch the balance tip as mass seems to "disappear".'
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Running \u2014 watch the reaction progress and the mass readout.'
      : 'Paused \u2014 toggle the seal or scenario, then press Play to continue.'
  }

  /** Restarts the reaction (progress/time back to zero) without changing running state. */
  private restartReaction(): void {
    this.reactionState = createMassConservationState()
    this.progressProperty.value = this.reactionState.progress
    this.massProperty.value = displayedMass(this.reactionState.progress, this.sealedProperty.value)
  }

  /** Playback "Reset" — rewinds just the reaction so it can be run again. */
  public resetReaction(): void {
    this.restartReaction()
    this.runningProperty.value = false
    this.statusProperty.value = 'Reaction reset \u2014 press Play to run it again.'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value =
        'Correct! In a sealed container no matter can enter or leave, so the total mass always stays the same.'
    }
    else {
      this.statusProperty.value =
        'Not quite \u2014 in a sealed container nothing escapes, so the total mass stays exactly the same.'
    }
  }

  public step(dt: number): void {
    if (dt <= 0 || !this.runningProperty.value) return
    const scaledDt = dt * clamp(this.simSpeedProperty.value, 0.25, 3)
    this.timeProperty.value += scaledDt

    const wasComplete = this.reactionState.progress >= 1
    this.reactionState = stepMassConservation(this.reactionState, scaledDt, true)
    this.progressProperty.value = this.reactionState.progress
    this.massProperty.value = displayedMass(this.reactionState.progress, this.sealedProperty.value)

    if (!wasComplete && this.reactionState.progress >= 1) {
      if (this.sealedProperty.value && !this.sealedRunCompleted) {
        this.sealedRunCompleted = true
        this.starsProperty.value += 1
        this.statusProperty.value =
          'Reaction complete! The sealed container never lost mass \u2014 the scale stayed level the whole time. \u2b50'
        this.quizPromptsProperty.value += 1
      }
      else if (!this.sealedProperty.value && !this.openRunCompleted) {
        this.openRunCompleted = true
        this.starsProperty.value += 1
        this.statusProperty.value = `Reaction complete! ${ESCAPED_MASS.toFixed(1)} g of gas escaped, so the scale looks lighter \u2014 but that mass just went into the air. \u2b50`
      }
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    this.scenarioProperty.reset()
    this.sealedProperty.reset()
    this.runningProperty.reset()
    this.simSpeedProperty.reset()
    this.showLabelsProperty.reset()
    this.showBalanceProperty.reset()
    this.showEscapeGasProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = INITIAL_STATUS
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.timeProperty.reset()
    this.restartReaction()
    this.sealedRunCompleted = false
    this.openRunCompleted = false
    this.visitedScenarios.clear()
    this.visitedScenarios.add('explore')
  }
}
