import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/LightConstants.js'
import {
  defaultPlaneState,
  type MirrorMode,
  type PlaneMirrorState,
} from '../../../shared/planeMirrorPeriscopeModel.js'

export type PlaneScenario = 'explore' | 'planeDemo' | 'periscopeDemo'

const SCENARIO_STATUS: Record<PlaneScenario, string> = {
  explore: 'Explore — switch plane mirror vs periscope and adjust object size.',
  planeDemo: 'Plane mirror — virtual image forms the same distance behind the mirror.',
  periscopeDemo: 'Periscope — two 45° mirrors redirect light to your eye.',
}

const SCENARIO_TIP: Record<PlaneScenario, string> = {
  explore: 'Virtual images cannot be projected on a screen — they appear behind the mirror.',
  planeDemo: 'Object distance equals image distance from the mirror surface.',
  periscopeDemo: 'Each mirror obeys ∠i = ∠r; together they bend light around corners.',
}

const INITIAL_STATUS = SCENARIO_STATUS.explore

export class PlaneMirrorPeriscopeModel implements TModel {
  public readonly modeProperty: Property<MirrorMode>
  public readonly objectDistProperty: NumberProperty
  public readonly objectHeightProperty: NumberProperty
  public readonly scenarioProperty: Property<PlaneScenario>
  public readonly runningProperty: BooleanProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showRaysProperty: BooleanProperty
  public readonly showImageProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private readonly visitedScenarios = new Set<PlaneScenario>(['explore'])
  private hasSwitchedMode = false
  private starAwarded = false

  public constructor() {
    const s = defaultPlaneState()
    this.modeProperty = new Property<MirrorMode>(s.mode)
    this.objectDistProperty = new NumberProperty(s.objectDist)
    this.objectHeightProperty = new NumberProperty(s.objectHeight)
    this.scenarioProperty = new Property<PlaneScenario>('explore')
    this.runningProperty = new BooleanProperty(true)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showRaysProperty = new BooleanProperty(true)
    this.showImageProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(INITIAL_STATUS)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
  }

  public setMode(mode: MirrorMode): void {
    this.modeProperty.value = mode
    this.hasSwitchedMode = true
    this.statusProperty.value =
      mode === 'plane'
        ? 'Plane mirror mode — object and virtual image are equidistant from the mirror.'
        : 'Periscope mode — light zig-zags through two 45° mirrors.'
  }

  public setScenario(scenario: PlaneScenario): void {
    this.scenarioProperty.value = scenario
    if (scenario === 'planeDemo') this.setMode('plane')
    else if (scenario === 'periscopeDemo') this.setMode('periscope')
    this.statusProperty.value = SCENARIO_STATUS[scenario]
    if (!this.visitedScenarios.has(scenario)) {
      this.visitedScenarios.add(scenario)
      this.showTip(SCENARIO_TIP[scenario])
    }
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Running — trace how mirrors redirect light.'
      : 'Paused — adjust object distance or switch mode.'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value = 'Correct! Plane mirror images are virtual — they appear behind the mirror.'
    }
    else {
      this.statusProperty.value = 'Not quite — plane mirror images are virtual, not real.'
    }
  }

  public step(dt: number): void {
    if (dt <= 0) return
    if (this.runningProperty.value) this.timeProperty.value += dt
    if (!this.starAwarded && this.hasSwitchedMode && this.visitedScenarios.size >= 2) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.statusProperty.value = 'Great! You explored plane mirrors and periscopes. ★'
      this.quizPromptsProperty.value += 1
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    const s = defaultPlaneState()
    this.modeProperty.value = s.mode
    this.objectDistProperty.reset()
    this.objectHeightProperty.reset()
    this.scenarioProperty.reset()
    this.runningProperty.reset()
    this.showLabelsProperty.reset()
    this.showRaysProperty.reset()
    this.showImageProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = INITIAL_STATUS
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.timeProperty.reset()
    this.hasSwitchedMode = false
    this.starAwarded = false
    this.visitedScenarios.clear()
    this.visitedScenarios.add('explore')
  }

  public get state(): PlaneMirrorState {
    return {
      mode: this.modeProperty.value,
      objectDist: clamp(this.objectDistProperty.value, 0.15, 0.55),
      objectHeight: clamp(this.objectHeightProperty.value, 0.1, 0.4),
    }
  }
}
