import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/BiotechConstants.js'

export type Scenario = 'explore' | 'insulin' | 'antibiotic'

/** Restriction-cut → insert → ligate → transform → replicate, in order. */
export const PLASMID_STAGES: readonly string[] = [
  'Cut plasmid',
  'Insert gene',
  'Join recombinant DNA',
  'Insert into bacterium',
  'Replication',
]

export const STAGE_DURATION = 1.65

const STAGE_STATUS: readonly string[] = [
  'A restriction enzyme cuts the circular plasmid open at a specific site.',
  'The target gene, cut with the same enzyme, lines up with the open plasmid.',
  'DNA ligase seals the gene into the plasmid, forming recombinant DNA.',
  'The recombinant plasmid is inserted into a bacterium — transformation.',
  'The bacterium divides again and again, copying the plasmid and gene each time.',
]

const STAGE_TIPS: readonly string[] = [
  'Restriction enzymes act like molecular scissors — they cut DNA only at specific short sequences.',
  'The same restriction enzyme is used on both the plasmid and the gene, so their cut ends match perfectly.',
  'DNA ligase acts like glue, sealing the gene into the plasmid to form recombinant DNA.',
  'Bacteria can be tricked into taking up plasmids from their surroundings — this is called transformation.',
  'Every time the bacterium divides, it copies the recombinant plasmid too — mass-producing the gene product.',
]

function snapInt(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)))
}

/**
 * Dense ecology-style control surface for the plasmid-insertion (genetic engineering) lab.
 */
export class PlasmidInsertionModel implements TModel {
  public readonly scenarioProperty: Property<Scenario>
  public readonly stageProperty: NumberProperty
  /** 0..1 progress within the current stage (drives in-stage animation). */
  public readonly stageBlendProperty: NumberProperty
  public readonly runningProperty: BooleanProperty
  public readonly autoAdvanceProperty: BooleanProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showEnzymeProperty: BooleanProperty
  public readonly showBacteriumProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  /** Flips whenever a new tip should pop up (view lazyLinks this to trigger the tip card). */
  public readonly tipsProperty: BooleanProperty
  /** Flips whenever the quick-check quiz should appear. */
  public readonly quizPromptsProperty: BooleanProperty
  public readonly cycleCountProperty: NumberProperty

  private readonly visited = new Set<number>()
  private cycleStarAwarded = false

  public constructor() {
    this.scenarioProperty = new Property<Scenario>('explore')
    this.stageProperty = new NumberProperty(0)
    this.stageBlendProperty = new NumberProperty(0)
    this.runningProperty = new BooleanProperty(false)
    this.autoAdvanceProperty = new BooleanProperty(true)
    this.simSpeedProperty = new NumberProperty(1)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showEnzymeProperty = new BooleanProperty(true)
    this.showBacteriumProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(STAGE_STATUS[0])
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new BooleanProperty(false)
    this.quizPromptsProperty = new BooleanProperty(false)
    this.cycleCountProperty = new NumberProperty(0)

    this.visited.add(0)

    this.stageProperty.lazyLink((n, oldN) => {
      const snapped = snapInt(n, 0, PLASMID_STAGES.length - 1)
      if (snapped !== n) {
        this.stageProperty.value = snapped
        return
      }
      if (oldN !== undefined && snapped !== oldN) {
        this.stageBlendProperty.value = 0
        this.onStageChanged(snapped)
      }
    })
  }

  public setScenario(scenario: Scenario): void {
    this.scenarioProperty.value = scenario
    this.stageProperty.value = 0
    this.stageBlendProperty.value = 0
    this.cycleStarAwarded = false
    if (scenario === 'insulin') {
      this.statusProperty.value = 'Goal: engineer bacteria to make insulin — follow every step.'
    }
    else if (scenario === 'antibiotic') {
      this.statusProperty.value = 'Goal: add an antibiotic-resistance marker gene to the plasmid.'
    }
    else {
      this.statusProperty.value = 'Explore freely — walk through cutting, inserting, and copying a gene.'
    }
  }

  public setStage(index: number): void {
    this.stageProperty.value = snapInt(index, 0, PLASMID_STAGES.length - 1)
    this.stageBlendProperty.value = 0
  }

  /** Step by whole stages; +1 wraps forward (completing a cycle), -1 wraps backward. */
  public stepStage(delta: number): void {
    const stages = PLASMID_STAGES.length
    const next = this.stageProperty.value + delta
    this.stageBlendProperty.value = 0
    if (next >= stages) {
      this.completeCycle()
      this.stageProperty.value = 0
    }
    else if (next < 0) {
      this.stageProperty.value = stages - 1
    }
    else {
      this.stageProperty.value = next
    }
  }

  public stepOnce(): void {
    this.runningProperty.value = false
    this.stepStage(1)
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Playing — watch the process advance automatically.'
      : 'Paused — step through manually or press Play to resume.'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value = 'Correct! Restriction enzymes cut DNA at specific recognition sites.'
    }
    else {
      this.statusProperty.value = 'Not quite — that\u2019s the job of DNA ligase, not the restriction enzyme.'
    }
  }

  private completeCycle(): void {
    this.cycleCountProperty.value += 1
    if (!this.cycleStarAwarded) {
      this.cycleStarAwarded = true
      this.starsProperty.value += 1
    }
    this.statusProperty.value = 'Cycle complete! The bacterium has copied the recombinant plasmid many times over.'
    this.quizPromptsProperty.value = !this.quizPromptsProperty.value
  }

  private onStageChanged(stage: number): void {
    this.statusProperty.value = `Step ${stage + 1}: ${PLASMID_STAGES[stage]} — ${STAGE_STATUS[stage]}`
    const firstVisit = !this.visited.has(stage)
    this.visited.add(stage)
    if (firstVisit) {
      this.starsProperty.value += 1
      this.showTip(STAGE_TIPS[stage])
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value = !this.tipsProperty.value
  }

  public step(dt: number): void {
    if (dt <= 0 || !this.runningProperty.value) {
      return
    }
    const speed = clamp(this.simSpeedProperty.value, 0.25, 3)
    const interval = STAGE_DURATION / speed
    this.stageBlendProperty.value = Math.min(1, this.stageBlendProperty.value + dt / interval)
    if (!this.autoAdvanceProperty.value) {
      return
    }
    if (this.stageBlendProperty.value >= 1) {
      this.stepStage(1)
    }
  }

  public reset(): void {
    this.scenarioProperty.reset()
    this.stageProperty.reset()
    this.stageBlendProperty.reset()
    this.runningProperty.reset()
    this.autoAdvanceProperty.reset()
    this.simSpeedProperty.reset()
    this.showLabelsProperty.reset()
    this.showEnzymeProperty.reset()
    this.showBacteriumProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = STAGE_STATUS[0]
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.cycleCountProperty.reset()
    this.visited.clear()
    this.visited.add(0)
    this.cycleStarAwarded = false
  }
}
