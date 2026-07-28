import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import {
  clampIncidence,
  defaultRegularState,
  type RegularVsDiffuseState,
  type SurfaceType,
} from '../../../shared/regularVsDiffuseModel.js'

export type RegularScenario = 'explore' | 'regularDemo' | 'diffuseDemo'

const SCENARIO_STATUS: Record<RegularScenario, string> = {
  explore: 'Explore — switch surface type and watch parallel vs scattered reflected rays.',
  regularDemo: 'Regular reflection — parallel incident rays stay parallel after bouncing.',
  diffuseDemo: 'Diffuse reflection — rays scatter; no clear image forms.',
}

const SCENARIO_TIP: Record<RegularScenario, string> = {
  explore: 'Smooth mirrors give regular reflection. Rough walls scatter light in many directions.',
  regularDemo: 'Specular surfaces like still water or polished metal reflect evenly.',
  diffuseDemo: 'Paper, chalk, and walls look bright because they scatter light diffusely.',
}

const INITIAL_STATUS = SCENARIO_STATUS.explore

export class RegularVsDiffuseModel implements TModel {
  public readonly surfaceProperty: Property<SurfaceType>
  public readonly rayCountProperty: NumberProperty
  public readonly incidenceDegProperty: NumberProperty
  public readonly scenarioProperty: Property<RegularScenario>
  public readonly runningProperty: BooleanProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showRaysProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private readonly visitedScenarios = new Set<RegularScenario>(['explore'])
  private hasSwitchedSurface = false
  private starAwarded = false

  public constructor() {
    const s = defaultRegularState()
    this.surfaceProperty = new Property<SurfaceType>(s.surface)
    this.rayCountProperty = new NumberProperty(s.rayCount)
    this.incidenceDegProperty = new NumberProperty(s.incidenceDeg)
    this.scenarioProperty = new Property<RegularScenario>('explore')
    this.runningProperty = new BooleanProperty(true)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showRaysProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(INITIAL_STATUS)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
  }

  public setSurface(surface: SurfaceType): void {
    this.surfaceProperty.value = surface
    this.hasSwitchedSurface = true
    this.statusProperty.value =
      surface === 'regular'
        ? 'Regular surface — reflected rays stay parallel.'
        : 'Diffuse surface — reflected rays scatter in many directions.'
  }

  public setScenario(scenario: RegularScenario): void {
    this.scenarioProperty.value = scenario
    if (scenario === 'regularDemo') this.setSurface('regular')
    else if (scenario === 'diffuseDemo') this.setSurface('diffuse')
    this.statusProperty.value = SCENARIO_STATUS[scenario]
    if (!this.visitedScenarios.has(scenario)) {
      this.visitedScenarios.add(scenario)
      this.showTip(SCENARIO_TIP[scenario])
    }
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Running — compare how each surface reflects light.'
      : 'Paused — adjust rays or switch surface type.'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value = 'Correct! Diffuse surfaces scatter light — they do not form clear images.'
    }
    else {
      this.statusProperty.value = 'Not quite — only smooth surfaces give sharp mirror images.'
    }
  }

  public step(dt: number): void {
    if (dt <= 0) return
    if (this.runningProperty.value) this.timeProperty.value += dt
    if (!this.starAwarded && this.hasSwitchedSurface && this.visitedScenarios.size >= 2) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.statusProperty.value = 'Great! You compared regular and diffuse reflection. ★'
      this.quizPromptsProperty.value += 1
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    const s = defaultRegularState()
    this.surfaceProperty.value = s.surface
    this.rayCountProperty.reset()
    this.incidenceDegProperty.reset()
    this.scenarioProperty.reset()
    this.runningProperty.reset()
    this.showLabelsProperty.reset()
    this.showRaysProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = INITIAL_STATUS
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.timeProperty.reset()
    this.hasSwitchedSurface = false
    this.starAwarded = false
    this.visitedScenarios.clear()
    this.visitedScenarios.add('explore')
  }

  public get state(): RegularVsDiffuseState {
    return {
      surface: this.surfaceProperty.value,
      rayCount: Math.round(this.rayCountProperty.value),
      incidenceDeg: clampIncidence(this.incidenceDegProperty.value),
    }
  }
}
