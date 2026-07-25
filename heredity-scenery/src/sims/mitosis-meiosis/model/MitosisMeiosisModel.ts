import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'

export type DivisionMode = 'mitosis' | 'meiosis'
export type Scenario = 'explore' | 'growth' | 'gametes'

/** Stage captions shown while walking through mitosis, in order. */
export const MITOSIS_STAGES: readonly string[] = [
  'Prophase',
  'Metaphase',
  'Anaphase',
  'Telophase',
  '2 Identical Cells',
]

/** Stage captions shown while walking through meiosis, in order. */
export const MEIOSIS_STAGES: readonly string[] = [
  'Prophase I',
  'Metaphase I',
  'Anaphase I',
  'Telophase I',
  'Meiosis II',
  '4 Unique Gametes',
]

const AUTO_ADVANCE_SECONDS = 1.4

function snapInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function snapEven(value: number, min: number, max: number): number {
  const rounded = Math.round(value / 2) * 2
  return Math.max(min, Math.min(max, rounded))
}

/**
 * Dense ecology-style control surface for the mitosis vs meiosis lab.
 */
export class MitosisMeiosisModel implements TModel {
  public readonly modeProperty: Property<DivisionMode>
  public readonly scenarioProperty: Property<Scenario>
  public readonly stageProperty: NumberProperty
  public readonly runningProperty: BooleanProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly autoAdvanceProperty: BooleanProperty
  public readonly chromosomeCountProperty: NumberProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showSpindleProperty: BooleanProperty
  public readonly showEnvelopeProperty: BooleanProperty
  public readonly showCentriolesProperty: BooleanProperty
  public readonly compareModeProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly cycleCountProperty: NumberProperty
  /** 0..1 progress within the current stage (drives in-stage animation). */
  public readonly stageBlendProperty: NumberProperty
  /** Visual scale of the cell membrane (0.7–1.3). */
  public readonly cellSizeProperty: NumberProperty
  /** Chromosome thickness / compactness (0.4–1.4). */
  public readonly condensationProperty: NumberProperty
  public readonly showCytoplasmProperty: BooleanProperty
  /** Meiosis-only crossing-over X marks at prophase I. */
  public readonly showCrossingOverProperty: BooleanProperty
  /** Multiplier for celebration / stage particle bursts (0–2). */
  public readonly particleIntensityProperty: NumberProperty
  /** When true, auto-advance stops on the final stage instead of looping. */
  public readonly pauseAtEndProperty: BooleanProperty
  /** When false, reaching the last stage stops instead of restarting. */
  public readonly loopProperty: BooleanProperty

  private cycleStarAwarded = false

  public constructor() {
    this.modeProperty = new Property<DivisionMode>('mitosis')
    this.scenarioProperty = new Property<Scenario>('explore')
    this.stageProperty = new NumberProperty(0)
    this.runningProperty = new BooleanProperty(false)
    this.simSpeedProperty = new NumberProperty(1)
    this.autoAdvanceProperty = new BooleanProperty(true)
    this.chromosomeCountProperty = new NumberProperty(4)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showSpindleProperty = new BooleanProperty(true)
    this.showEnvelopeProperty = new BooleanProperty(true)
    this.showCentriolesProperty = new BooleanProperty(true)
    this.compareModeProperty = new BooleanProperty(false)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty('Explore how mitosis and meiosis divide a cell.')
    this.cycleCountProperty = new NumberProperty(0)
    this.stageBlendProperty = new NumberProperty(0)
    this.cellSizeProperty = new NumberProperty(1)
    this.condensationProperty = new NumberProperty(1)
    this.showCytoplasmProperty = new BooleanProperty(true)
    this.showCrossingOverProperty = new BooleanProperty(true)
    this.particleIntensityProperty = new NumberProperty(1)
    this.pauseAtEndProperty = new BooleanProperty(false)
    this.loopProperty = new BooleanProperty(true)

    this.chromosomeCountProperty.lazyLink((n) => {
      const snapped = snapEven(n, 2, 6)
      if (snapped !== n) {
        this.chromosomeCountProperty.value = snapped
      }
    })

    this.stageProperty.lazyLink((n, oldN) => {
      const snapped = snapInt(n, 0, this.stagesCount() - 1)
      if (snapped !== n) {
        this.stageProperty.value = snapped
      }
      if (oldN !== undefined && snapped !== oldN) {
        this.stageBlendProperty.value = 0
      }
    })

    this.modeProperty.link(() => {
      this.stageProperty.value = Math.min(this.stageProperty.value, this.stagesCount() - 1)
    })
  }

  /** Stage caption list for the currently selected division mode. */
  public getStageNames(): readonly string[] {
    return this.modeProperty.value === 'mitosis' ? MITOSIS_STAGES : MEIOSIS_STAGES
  }

  public stagesCount(): number {
    return this.getStageNames().length
  }

  public setMode(mode: DivisionMode): void {
    if (this.modeProperty.value === mode) {
      return
    }
    this.modeProperty.value = mode
    this.stageProperty.value = 0
    this.stageBlendProperty.value = 0
    this.cycleStarAwarded = false
    this.statusProperty.value =
      mode === 'mitosis'
        ? 'Mitosis: one cell copies itself into two identical cells.'
        : 'Meiosis: one cell makes four unique sex cells (gametes) with half the chromosomes.'
  }

  public setScenario(scenario: Scenario): void {
    this.scenarioProperty.value = scenario
    if (scenario === 'growth') {
      this.setMode('mitosis')
      this.statusProperty.value = 'Body growth & repair uses mitosis to make identical replacement cells.'
    }
    else if (scenario === 'gametes') {
      this.setMode('meiosis')
      this.statusProperty.value = 'Making sex cells uses meiosis — 4 gametes, each with half the chromosomes.'
    }
    else {
      this.statusProperty.value = 'Explore freely — switch division type and scrub through every stage.'
    }
  }

  public setStage(index: number): void {
    this.stageProperty.value = snapInt(index, 0, this.stagesCount() - 1)
    this.stageBlendProperty.value = 0
  }

  public nextStage(): void {
    const stages = this.stagesCount()
    const next = this.stageProperty.value + 1
    this.stageBlendProperty.value = 0
    if (next >= stages) {
      this.cycleCountProperty.value += 1
      if (!this.cycleStarAwarded) {
        this.cycleStarAwarded = true
        this.starsProperty.value += 1
      }
      if (this.pauseAtEndProperty.value || !this.loopProperty.value) {
        this.stageProperty.value = stages - 1
        this.runningProperty.value = false
        this.statusProperty.value =
          this.modeProperty.value === 'mitosis'
            ? 'Cycle complete! Two identical cells — paused at the final stage.'
            : 'Cycle complete! Four unique gametes — paused at the final stage.'
        return
      }
      this.stageProperty.value = 0
      this.statusProperty.value =
        this.modeProperty.value === 'mitosis'
          ? 'Cycle complete! Two identical cells — restarting from Prophase.'
          : 'Cycle complete! Four unique gametes — restarting from Prophase I.'
    }
    else {
      this.stageProperty.value = next
      this.statusProperty.value = `${this.modeProperty.value === 'mitosis' ? 'Mitosis' : 'Meiosis'}: ${this.getStageNames()[next]}`
    }
  }

  public prevStage(): void {
    this.stageBlendProperty.value = 0
    if (this.stageProperty.value <= 0) {
      this.statusProperty.value = 'Already at the first stage.'
      return
    }
    this.stageProperty.value -= 1
    this.statusProperty.value = `${this.modeProperty.value === 'mitosis' ? 'Mitosis' : 'Meiosis'}: ${this.getStageNames()[this.stageProperty.value]}`
  }

  public stepOnce(): void {
    this.runningProperty.value = false
    this.nextStage()
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Playing — watch the stages advance automatically.'
      : 'Paused — step through manually or press play to resume.'
  }

  public onQuizAnswered(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value = 'Correct! Meiosis produces 4 gametes; mitosis produces 2 identical cells.'
    }
    else {
      this.statusProperty.value = 'Not quite — compare the final stage cell counts and try again.'
    }
  }

  public step(dt: number): void {
    if (!this.runningProperty.value) {
      return
    }
    const speed = Math.max(0.25, this.simSpeedProperty.value)
    const interval = AUTO_ADVANCE_SECONDS / speed
    this.stageBlendProperty.value = Math.min(
      1,
      this.stageBlendProperty.value + dt / interval,
    )
    if (!this.autoAdvanceProperty.value) {
      return
    }
    if (this.stageBlendProperty.value >= 1) {
      const atLast = this.stageProperty.value >= this.stagesCount() - 1
      if (atLast && this.pauseAtEndProperty.value) {
        this.runningProperty.value = false
        this.stageBlendProperty.value = 1
        this.statusProperty.value = 'Paused at the final stage — press Play or Step to continue.'
        return
      }
      this.nextStage()
    }
  }

  public reset(): void {
    this.modeProperty.reset()
    this.scenarioProperty.reset()
    this.stageProperty.reset()
    this.runningProperty.reset()
    this.simSpeedProperty.reset()
    this.autoAdvanceProperty.reset()
    this.chromosomeCountProperty.reset()
    this.showLabelsProperty.reset()
    this.showSpindleProperty.reset()
    this.showEnvelopeProperty.reset()
    this.showCentriolesProperty.reset()
    this.compareModeProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = 'Explore how mitosis and meiosis divide a cell.'
    this.cycleCountProperty.reset()
    this.stageBlendProperty.reset()
    this.cellSizeProperty.reset()
    this.condensationProperty.reset()
    this.showCytoplasmProperty.reset()
    this.showCrossingOverProperty.reset()
    this.particleIntensityProperty.reset()
    this.pauseAtEndProperty.reset()
    this.loopProperty.reset()
    this.cycleStarAwarded = false
  }
}
