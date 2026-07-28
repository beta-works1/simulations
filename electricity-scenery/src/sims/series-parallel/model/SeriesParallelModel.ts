import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { computeSeriesParallel, type CircuitMode } from '../../../shared/seriesPhysics.js'

export type SeriesScenario = 'explore' | 'series' | 'parallel'

const SCENARIO_STATUS: Record<SeriesScenario, string> = {
  explore: 'Explore — switch series vs parallel and compare brightness.',
  series: 'Series focus — one path, shared current, usually dimmer bulbs.',
  parallel: 'Parallel focus — each bulb gets full V and shines brighter.',
}
const SCENARIO_TIP: Record<SeriesScenario, string> = {
  explore: 'Watch total current and per-bulb brightness in the caption.',
  series: 'Total resistance is 2R — current is V/(2R) through both bulbs.',
  parallel: 'Total resistance is R/2 — total current is larger; each bulb still bright.',
}

export class SeriesParallelModel implements TModel {
  public readonly modeProperty: Property<CircuitMode>
  public readonly voltageProperty: NumberProperty
  public readonly bulbResistanceProperty: NumberProperty
  public readonly scenarioProperty: Property<SeriesScenario>
  public readonly runningProperty: BooleanProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty
  private readonly visited = new Set<SeriesScenario>(['explore'])
  private switchedMode = false
  private starAwarded = false

  public constructor() {
    this.modeProperty = new Property<CircuitMode>('series')
    this.voltageProperty = new NumberProperty(9)
    this.bulbResistanceProperty = new NumberProperty(10)
    this.scenarioProperty = new Property<SeriesScenario>('explore')
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

  public get readout() {
    return computeSeriesParallel(this.modeProperty.value, this.voltageProperty.value, this.bulbResistanceProperty.value)
  }

  public setMode(mode: CircuitMode): void {
    this.modeProperty.value = mode
    this.switchedMode = true
    this.statusProperty.value = mode === 'series'
      ? 'Series — one path; bulbs share current.'
      : 'Parallel — two paths; bulbs are usually brighter.'
  }

  public setScenario(scenario: SeriesScenario): void {
    this.scenarioProperty.value = scenario
    if (scenario === 'series') this.setMode('series')
    if (scenario === 'parallel') this.setMode('parallel')
    if (scenario === 'explore') { this.voltageProperty.value = 9; this.bulbResistanceProperty.value = 10 }
    this.statusProperty.value = SCENARIO_STATUS[scenario]
    if (!this.visited.has(scenario)) { this.visited.add(scenario); this.showTip(SCENARIO_TIP[scenario]) }
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value ? 'Running — particles show charge flow.' : 'Paused — change mode or sliders.'
  }

  public onQuiz(correct: boolean): void {
    this.statusProperty.value = correct
      ? 'Correct! Series bulbs share current; parallel bulbs get full voltage.'
      : 'Not quite — series bulbs do not each get the full battery voltage.'
    if (correct) this.starsProperty.value += 1
  }

  public step(dt: number): void {
    if (dt <= 0) return
    if (this.runningProperty.value) this.timeProperty.value += dt
    if (!this.starAwarded && this.switchedMode && this.visited.size >= 2) {
      this.starAwarded = true; this.starsProperty.value += 1; this.quizPromptsProperty.value += 1
    }
  }

  private showTip(text: string): void { this.tipTextProperty.value = text; this.tipsProperty.value += 1 }

  public reset(): void {
    this.modeProperty.reset(); this.voltageProperty.reset(); this.bulbResistanceProperty.reset()
    this.scenarioProperty.reset(); this.runningProperty.reset(); this.showLabelsProperty.reset()
    this.soundEnabledProperty.reset(); this.starsProperty.reset()
    this.statusProperty.value = SCENARIO_STATUS.explore
    this.tipTextProperty.reset(); this.tipsProperty.reset(); this.quizPromptsProperty.reset(); this.timeProperty.reset()
    this.switchedMode = false; this.starAwarded = false; this.visited.clear(); this.visited.add('explore')
  }
}
