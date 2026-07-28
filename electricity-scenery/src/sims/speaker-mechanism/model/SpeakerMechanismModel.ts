import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'

export type SpeakerScenario = 'quiet' | 'loud' | 'highPitch'
const SCENARIO_STATUS: Record<SpeakerScenario, string> = {
  quiet: 'Quiet — small current, gentle cone motion.',
  loud: 'Loud — large amplitude waves from stronger current.',
  highPitch: 'High pitch — faster vibration from higher frequency.',
}
const SCENARIO_TIP: Record<SpeakerScenario, string> = {
  quiet: 'Loudness tracks current amplitude.',
  loud: 'Bigger pushes on the diaphragm make stronger sound waves.',
  highPitch: 'Pitch tracks frequency of the AC drive.',
}
const SCENARIO_VALUES: Record<SpeakerScenario, { i: number; f: number }> = {
  quiet: { i: 0.25, f: 80 },
  loud: { i: 1, f: 120 },
  highPitch: { i: 0.7, f: 320 },
}

export class SpeakerMechanismModel implements TModel {
  public readonly currentProperty: NumberProperty
  public readonly frequencyProperty: NumberProperty
  public readonly scenarioProperty: Property<SpeakerScenario>
  public readonly runningProperty: BooleanProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showWavesProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty
  private readonly visited = new Set<SpeakerScenario>(['quiet'])
  private adjusted = false
  private starAwarded = false

  public constructor() {
    this.currentProperty = new NumberProperty(0.7)
    this.frequencyProperty = new NumberProperty(120)
    this.scenarioProperty = new Property<SpeakerScenario>('loud')
    this.runningProperty = new BooleanProperty(true)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showWavesProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(SCENARIO_STATUS.loud)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
    this.currentProperty.lazyLink(() => { this.adjusted = true })
    this.frequencyProperty.lazyLink(() => { this.adjusted = true })
  }

  public coilOffset(): number {
    const I = this.currentProperty.value
    const f = this.frequencyProperty.value
    const t = this.timeProperty.value
    return I * 18 * Math.sin(2 * Math.PI * f * t)
  }

  public setScenario(scenario: SpeakerScenario): void {
    this.scenarioProperty.value = scenario
    const v = SCENARIO_VALUES[scenario]
    this.currentProperty.value = v.i
    this.frequencyProperty.value = v.f
    this.runningProperty.value = true
    this.statusProperty.value = SCENARIO_STATUS[scenario]
    if (!this.visited.has(scenario)) { this.visited.add(scenario); this.showTip(SCENARIO_TIP[scenario]) }
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value ? 'Running — cone vibrates and launches waves.' : 'Paused — tweak current or frequency.'
  }

  public onQuiz(correct: boolean): void {
    this.statusProperty.value = correct
      ? 'Correct! Frequency sets pitch; current sets loudness.'
      : 'Not quite — frequency mainly changes pitch.'
    if (correct) this.starsProperty.value += 1
  }

  public step(dt: number): void {
    if (dt <= 0) return
    if (this.runningProperty.value) this.timeProperty.value += dt
    if (!this.starAwarded && this.adjusted && this.visited.size >= 2) {
      this.starAwarded = true; this.starsProperty.value += 1; this.quizPromptsProperty.value += 1
    }
  }

  private showTip(text: string): void { this.tipTextProperty.value = text; this.tipsProperty.value += 1 }

  public reset(): void {
    this.currentProperty.reset(); this.frequencyProperty.reset(); this.scenarioProperty.reset()
    this.runningProperty.reset(); this.showLabelsProperty.reset(); this.showWavesProperty.reset()
    this.soundEnabledProperty.reset(); this.starsProperty.reset()
    this.statusProperty.value = SCENARIO_STATUS.loud
    this.tipTextProperty.reset(); this.tipsProperty.reset(); this.quizPromptsProperty.reset(); this.timeProperty.reset()
    this.adjusted = false; this.starAwarded = false; this.visited.clear(); this.visited.add('quiet')
  }
}
