import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/ForcesConstants.js'
import {
  BalancedForcesState,
  createBalancedForcesState,
  stepBalancedForces,
} from '../../../shared/balancedForcesModel.js'

export type BalancedForcesScenario = 'explore' | 'balanced' | 'pushRight' | 'pushLeft'

const SCENARIO_STATUS: Record<BalancedForcesScenario, string> = {
  explore: 'Explore freely — adjust left/right forces and mass, then press Play to see motion.',
  balanced: 'Balanced forces: equal left and right pulls — the block should stay still (no net force).',
  pushRight: 'Unbalanced to the right — the right force is stronger, so the block accelerates right.',
  pushLeft: 'Unbalanced to the left — the left force is stronger, so the block accelerates left.',
}

const SCENARIO_TIP: Record<BalancedForcesScenario, string> = {
  explore: 'When forces are equal and opposite, they cancel — net force is zero and the object does not accelerate.',
  balanced: 'Balanced forces mean F_net = 0. The object stays at rest or keeps moving at constant speed.',
  pushRight: 'Unbalanced forces produce acceleration. Stronger right force → motion to the right.',
  pushLeft: 'Net force points toward the bigger pull. Try matching forces again to stop acceleration.',
}

const INITIAL_STATUS = SCENARIO_STATUS.explore

export class BalancedForcesModel implements TModel {
  public readonly fLeftProperty: NumberProperty
  public readonly fRightProperty: NumberProperty
  public readonly massProperty: NumberProperty
  public readonly scenarioProperty: Property<BalancedForcesScenario>
  public readonly runningProperty: BooleanProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly positionProperty: NumberProperty
  public readonly velocityProperty: NumberProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showArrowsProperty: BooleanProperty
  public readonly showNetForceProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private state: BalancedForcesState
  private readonly visitedScenarios = new Set<BalancedForcesScenario>(['explore'])
  private hasSeenBalanced = false
  private hasSeenUnbalanced = false
  private starAwarded = false

  public constructor() {
    this.fLeftProperty = new NumberProperty(10)
    this.fRightProperty = new NumberProperty(10)
    this.massProperty = new NumberProperty(5)
    this.scenarioProperty = new Property<BalancedForcesScenario>('explore')
    this.runningProperty = new BooleanProperty(true)
    this.simSpeedProperty = new NumberProperty(1)
    this.state = createBalancedForcesState()
    this.positionProperty = new NumberProperty(this.state.position)
    this.velocityProperty = new NumberProperty(this.state.velocity)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showArrowsProperty = new BooleanProperty(true)
    this.showNetForceProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(INITIAL_STATUS)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
  }

  public setScenario(scenario: BalancedForcesScenario): void {
    this.scenarioProperty.value = scenario
    if (scenario === 'balanced') {
      this.fLeftProperty.value = 10
      this.fRightProperty.value = 10
    }
    else if (scenario === 'pushRight') {
      this.fLeftProperty.value = 4
      this.fRightProperty.value = 16
    }
    else if (scenario === 'pushLeft') {
      this.fLeftProperty.value = 16
      this.fRightProperty.value = 4
    }
    this.state = createBalancedForcesState()
    this.positionProperty.value = this.state.position
    this.velocityProperty.value = this.state.velocity
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
      ? 'Running — watch how net force changes motion on the track.'
      : 'Paused — change forces or mass, then press Play again.'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value =
        'Correct! Equal and opposite forces cancel — the object is in equilibrium (balanced).'
    }
    else {
      this.statusProperty.value =
        'Not quite — balanced means equal opposite forces with zero net force, not unequal pulls.'
    }
  }

  public get fNet(): number {
    return this.fRightProperty.value - this.fLeftProperty.value
  }

  public get acceleration(): number {
    return this.fNet / this.massProperty.value
  }

  public step(dt: number): void {
    if (dt <= 0) return
    const scaledDt = dt * clamp(this.simSpeedProperty.value, 0.25, 3)
    if (this.runningProperty.value) {
      this.timeProperty.value += scaledDt
      this.state = stepBalancedForces(
        this.state,
        scaledDt,
        this.fLeftProperty.value,
        this.fRightProperty.value,
        this.massProperty.value,
      )
      this.positionProperty.value = this.state.position
      this.velocityProperty.value = this.state.velocity
    }

    if (Math.abs(this.fNet) < 0.5) this.hasSeenBalanced = true
    if (Math.abs(this.fNet) >= 2) this.hasSeenUnbalanced = true

    if (!this.starAwarded && this.hasSeenBalanced && this.hasSeenUnbalanced) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.statusProperty.value = 'Great! You saw both balanced and unbalanced forces. ★'
      this.quizPromptsProperty.value += 1
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    this.fLeftProperty.reset()
    this.fRightProperty.reset()
    this.massProperty.reset()
    this.scenarioProperty.reset()
    this.runningProperty.reset()
    this.simSpeedProperty.reset()
    this.state = createBalancedForcesState()
    this.positionProperty.value = this.state.position
    this.velocityProperty.value = this.state.velocity
    this.showLabelsProperty.reset()
    this.showArrowsProperty.reset()
    this.showNetForceProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = INITIAL_STATUS
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.timeProperty.reset()
    this.hasSeenBalanced = false
    this.hasSeenUnbalanced = false
    this.starAwarded = false
    this.visitedScenarios.clear()
    this.visitedScenarios.add('explore')
  }
}
