import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/LightConstants.js'
import {
  defaultCurvedState,
  type CurvedMirrorsState,
  type MirrorType,
} from '../../../shared/curvedMirrorsModel.js'

export type CurvedScenario = 'explore' | 'concaveDemo' | 'convexDemo'

const SCENARIO_STATUS: Record<CurvedScenario, string> = {
  explore: 'Explore — switch mirror type and move the object to see image changes.',
  concaveDemo: 'Concave mirror — can form real inverted images beyond F.',
  convexDemo: 'Convex mirror — always forms a virtual upright diminished image.',
}

const SCENARIO_TIP: Record<CurvedScenario, string> = {
  explore: 'F is the focal point; C is the centre of curvature (2F).',
  concaveDemo: 'When the object is beyond C, the image is real and inverted.',
  convexDemo: 'Convex mirrors are used as wide-angle security mirrors.',
}

const INITIAL_STATUS = SCENARIO_STATUS.explore

export class CurvedMirrorsModel implements TModel {
  public readonly typeProperty: Property<MirrorType>
  public readonly objectDistProperty: NumberProperty
  public readonly scenarioProperty: Property<CurvedScenario>
  public readonly runningProperty: BooleanProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showRaysProperty: BooleanProperty
  public readonly showFocalProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private readonly visitedScenarios = new Set<CurvedScenario>(['explore'])
  private hasSwitchedType = false
  private starAwarded = false

  public constructor() {
    const s = defaultCurvedState()
    this.typeProperty = new Property<MirrorType>(s.type)
    this.objectDistProperty = new NumberProperty(s.objectDist)
    this.scenarioProperty = new Property<CurvedScenario>('explore')
    this.runningProperty = new BooleanProperty(true)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showRaysProperty = new BooleanProperty(true)
    this.showFocalProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(INITIAL_STATUS)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
  }

  public setType(type: MirrorType): void {
    this.typeProperty.value = type
    this.hasSwitchedType = true
    this.statusProperty.value =
      type === 'concave'
        ? 'Concave mirror — converging; can form real inverted images.'
        : 'Convex mirror — diverging; always virtual upright image.'
  }

  public setScenario(scenario: CurvedScenario): void {
    this.scenarioProperty.value = scenario
    if (scenario === 'concaveDemo') {
      this.setType('concave')
      this.objectDistProperty.value = 0.65
    }
    else if (scenario === 'convexDemo') {
      this.setType('convex')
      this.objectDistProperty.value = 0.45
    }
    else this.statusProperty.value = SCENARIO_STATUS[scenario]
    if (!this.visitedScenarios.has(scenario)) {
      this.visitedScenarios.add(scenario)
      this.showTip(SCENARIO_TIP[scenario])
    }
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Running — trace rays to locate the image.'
      : 'Paused — move the object or switch mirror type.'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value = 'Correct! Concave mirrors can project real inverted images.'
    }
    else {
      this.statusProperty.value = 'Not quite — concave mirrors can form real images; convex mirrors cannot.'
    }
  }

  public step(dt: number): void {
    if (dt <= 0) return
    if (this.runningProperty.value) this.timeProperty.value += dt
    if (!this.starAwarded && this.hasSwitchedType && this.visitedScenarios.size >= 2) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.statusProperty.value = 'Great! You compared concave and convex mirror images. ★'
      this.quizPromptsProperty.value += 1
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public get state(): CurvedMirrorsState {
    return {
      type: this.typeProperty.value,
      objectDist: clamp(this.objectDistProperty.value, 0.2, 0.9),
    }
  }

  public reset(): void {
    const s = defaultCurvedState()
    this.typeProperty.value = s.type
    this.objectDistProperty.reset()
    this.scenarioProperty.reset()
    this.runningProperty.reset()
    this.showLabelsProperty.reset()
    this.showRaysProperty.reset()
    this.showFocalProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = INITIAL_STATUS
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.timeProperty.reset()
    this.hasSwitchedType = false
    this.starAwarded = false
    this.visitedScenarios.clear()
    this.visitedScenarios.add('explore')
  }
}
