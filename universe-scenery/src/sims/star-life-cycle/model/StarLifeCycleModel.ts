import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { StarMass, StarStage, stagesForMass } from '../../../shared/starPhysics.js'

export type StarScenario = 'explore' | 'low' | 'high'

const SCENARIO_STATUS: Record<StarScenario, string> = {
  explore: 'Explore — follow a low-mass star from nebula toward white dwarf.',
  low: 'Low mass — Sun-like path ending as a white dwarf.',
  high: 'High mass — supernova path toward neutron star or black hole.',
}
const SCENARIO_TIP: Record<StarScenario, string> = {
  explore: "A star's fate depends on its mass.",
  low: 'Low-mass stars shed outer layers and leave a white dwarf core.',
  high: 'Massive stars can explode as supernovae and leave dense remnants.',
}
const SCENARIO_MASS: Record<StarScenario, StarMass> = {
  explore: 'low', low: 'low', high: 'high',
}

export class StarLifeCycleModel implements TModel {
  public readonly massProperty: Property<StarMass>
  public readonly stageIndexProperty: NumberProperty
  public readonly stageProgressProperty: NumberProperty
  public readonly scenarioProperty: Property<StarScenario>
  public readonly runningProperty: BooleanProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private readonly visited = new Set<StarScenario>(['explore'])
  private scrubbed = false
  private finished = false
  private starAwarded = false

  public constructor() {
    this.massProperty = new Property<StarMass>('low')
    this.stageIndexProperty = new NumberProperty(0)
    this.stageProgressProperty = new NumberProperty(0)
    this.scenarioProperty = new Property<StarScenario>('explore')
    this.runningProperty = new BooleanProperty(true)
    this.showLabelsProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(SCENARIO_STATUS.explore)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
  }

  public get stages(): StarStage[] {
    return stagesForMass(this.massProperty.value)
  }

  public get currentStage(): StarStage {
    const stages = this.stages
    return stages[Math.min(this.stageIndexProperty.value, stages.length - 1)]
  }

  public get stageSliderMax(): number {
    return Math.max(0, this.stages.length - 1)
  }

  public setScenario(scenario: StarScenario): void {
    this.scenarioProperty.value = scenario
    this.massProperty.value = SCENARIO_MASS[scenario]
    this.stageIndexProperty.value = 0
    this.stageProgressProperty.value = 0
    this.runningProperty.value = true
    this.statusProperty.value = SCENARIO_STATUS[scenario]
    if (!this.visited.has(scenario)) {
      this.visited.add(scenario)
      this.showTip(SCENARIO_TIP[scenario])
    }
  }

  public scrubToStage(index: number): void {
    const max = this.stageSliderMax
    this.stageIndexProperty.value = Math.max(0, Math.min(index, max))
    this.stageProgressProperty.value = 0
    this.scrubbed = true
    this.statusProperty.value = `${this.currentStage.label}: ${this.currentStage.description}`
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Running — stages advance with time.'
      : 'Paused — scrub the stage slider to jump ahead.'
  }

  public onQuiz(correct: boolean): void {
    this.statusProperty.value = correct
      ? 'Correct! Low-mass stars end as white dwarfs.'
      : 'Not quite — Sun-like stars become white dwarfs, not supernovae.'
    if (correct) this.starsProperty.value += 1
  }

  public step(dt: number): void {
    if (dt <= 0) return
    if (this.runningProperty.value) {
      this.timeProperty.value += dt
      const stages = this.stages
      const stage = stages[this.stageIndexProperty.value]
      if (!stage) return
      let progress = this.stageProgressProperty.value + dt / stage.duration
      let idx = this.stageIndexProperty.value
      while (progress >= 1 && idx < stages.length - 1) {
        progress -= 1
        idx += 1
      }
      if (idx >= stages.length - 1) {
        progress = Math.min(1, progress)
        this.finished = true
      }
      this.stageIndexProperty.value = idx
      this.stageProgressProperty.value = progress
      this.statusProperty.value = `${stage.label}: ${stage.description}`
    }
    if (!this.starAwarded && this.scrubbed && this.finished && this.visited.size >= 2) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.quizPromptsProperty.value += 1
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    this.massProperty.reset()
    this.stageIndexProperty.reset()
    this.stageProgressProperty.reset()
    this.scenarioProperty.reset()
    this.runningProperty.value = true
    this.showLabelsProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = SCENARIO_STATUS.explore
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.timeProperty.reset()
    this.visited.clear()
    this.visited.add('explore')
    this.scrubbed = false
    this.finished = false
    this.starAwarded = false
  }
}
