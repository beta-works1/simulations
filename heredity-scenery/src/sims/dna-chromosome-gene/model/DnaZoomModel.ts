import { BooleanProperty, NumberProperty, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/HeredityConstants.js'

/** Scale levels from whole cell down to a single gene — PTB Grade 8 Ch 5 parity. */
export const DNA_ZOOM_MIN_LEVEL = 0
export const DNA_ZOOM_MAX_LEVEL = 4
export const DNA_ZOOM_LEVEL_COUNT = DNA_ZOOM_MAX_LEVEL - DNA_ZOOM_MIN_LEVEL + 1

export const ZOOM_LEVEL_NAMES = ['Cell', 'Nucleus', 'Chromosome', 'DNA double helix', 'Gene'] as const

/** Approximate real-world scale shown on the on-stage scale bar at each level. */
export const ZOOM_LEVEL_SCALE = [
  '≈ 20 µm wide',
  '≈ 6 µm wide',
  '≈ 1.4 µm long',
  '≈ 2 nm wide',
  '≈ 600 base pairs',
] as const

const LEVEL_STATUS = [
  'Whole cell — every organelle, including the nucleus, floats in the cytoplasm.',
  'Zoomed into the nucleus — this is where all the DNA is stored.',
  'A chromosome — DNA tightly coiled and packed around proteins.',
  'The DNA double helix — two twisted strands held together by base pairs.',
  'A gene — one meaningful segment of the DNA strand.',
]

const LEVEL_TIPS = [
  'Every cell (almost) has a nucleus — the control center that holds the DNA.',
  'Uncoil the nucleus far enough and you would find long threads of DNA called chromatin.',
  'Humans have 46 chromosomes — 23 from each parent — each one a single, very long DNA molecule.',
  'The two backbones twist around each other like a spiral staircase; the "steps" are base pairs.',
  'A gene is a specific stretch of DNA with instructions for one trait, like eye color.',
]

export class DnaZoomModel implements TModel {
  public readonly zoomLevelProperty: NumberProperty
  public readonly runningProperty: BooleanProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly twistSpeedProperty: NumberProperty
  public readonly chromatinDensityProperty: NumberProperty
  public readonly membraneThicknessProperty: NumberProperty
  public readonly strandGapProperty: NumberProperty
  public readonly glowIntensityProperty: NumberProperty
  public readonly basePairVisibilityProperty: NumberProperty
  public readonly geneHighlightLengthProperty: NumberProperty
  public readonly showHistonesProperty: BooleanProperty
  public readonly showOrganellesProperty: BooleanProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showScaleBarProperty: BooleanProperty
  public readonly autoTourProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tourUnlockedProperty: BooleanProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly tipsProperty: NumberProperty
  public readonly tipTextProperty: StringProperty
  /** Continuously advancing spin phase for the helix drawing (radians). */
  public readonly helixPhaseProperty: NumberProperty

  private readonly visited = new Set<number>()
  private autoTourTimer = 0
  private static readonly AUTO_TOUR_INTERVAL = 2.5

  public constructor() {
    this.zoomLevelProperty = new NumberProperty(0)
    this.runningProperty = new BooleanProperty(true)
    this.simSpeedProperty = new NumberProperty(1)
    this.twistSpeedProperty = new NumberProperty(1)
    this.chromatinDensityProperty = new NumberProperty(1)
    this.membraneThicknessProperty = new NumberProperty(1)
    this.strandGapProperty = new NumberProperty(0.35)
    this.glowIntensityProperty = new NumberProperty(1)
    this.basePairVisibilityProperty = new NumberProperty(1)
    this.geneHighlightLengthProperty = new NumberProperty(0.45)
    this.showHistonesProperty = new BooleanProperty(true)
    this.showOrganellesProperty = new BooleanProperty(true)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showScaleBarProperty = new BooleanProperty(true)
    this.autoTourProperty = new BooleanProperty(false)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(LEVEL_STATUS[0])
    this.tourUnlockedProperty = new BooleanProperty(false)
    this.quizPromptsProperty = new NumberProperty(0)
    this.tipsProperty = new NumberProperty(0)
    this.tipTextProperty = new StringProperty('')
    this.helixPhaseProperty = new NumberProperty(0)

    this.visited.add(0)
  }

  /** Jump directly to a zoom level (0 = Cell … 4 = Gene). */
  public setZoom(level: number): void {
    const clamped = clamp(Math.round(level), DNA_ZOOM_MIN_LEVEL, DNA_ZOOM_MAX_LEVEL)
    if (clamped === this.zoomLevelProperty.value) return
    this.zoomLevelProperty.value = clamped
    this.onLevelChanged(clamped)
  }

  /** Step the zoom level by +1 / -1, clamped to the valid range. */
  public stepZoom(delta: number): void {
    this.setZoom(this.zoomLevelProperty.value + delta)
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Helix spinning — watch the two strands twist around each other.'
      : 'Paused — take a closer look at the structure.'
  }

  /** Advance the helix one visible quarter-turn (for step-by-step study). */
  public stepSpinOnce(): void {
    this.helixPhaseProperty.value += Math.PI / 2
    this.statusProperty.value = 'Step spin — one quarter-turn of the double helix.'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value = 'Correct! A gene is a segment of DNA within a chromosome.'
    }
    else {
      this.statusProperty.value = 'Not quite — a gene is a short segment inside the DNA strand, not a separate part.'
    }
  }

  private onLevelChanged(level: number): void {
    this.statusProperty.value = LEVEL_STATUS[level]

    const firstVisit = !this.visited.has(level)
    this.visited.add(level)
    if (firstVisit) {
      this.starsProperty.value += 1
      this.showTip(LEVEL_TIPS[level])
    }

    if (!this.tourUnlockedProperty.value && this.visited.size >= DNA_ZOOM_LEVEL_COUNT) {
      this.tourUnlockedProperty.value = true
      this.starsProperty.value += 1
      this.statusProperty.value = 'Tour complete! You zoomed all the way from a whole cell to a single gene.'
      this.quizPromptsProperty.value += 1
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public step(dt: number): void {
    if (dt <= 0) return
    const scaledDt = dt * clamp(this.simSpeedProperty.value, 0.25, 3)

    if (this.runningProperty.value) {
      this.helixPhaseProperty.value += scaledDt * this.twistSpeedProperty.value
    }

    if (this.autoTourProperty.value) {
      this.autoTourTimer += scaledDt
      if (this.autoTourTimer >= DnaZoomModel.AUTO_TOUR_INTERVAL) {
        this.autoTourTimer = 0
        const next = (this.zoomLevelProperty.value + 1) % DNA_ZOOM_LEVEL_COUNT
        this.setZoom(next)
      }
    }
    else {
      this.autoTourTimer = 0
    }
  }

  public reset(): void {
    this.zoomLevelProperty.reset()
    this.runningProperty.reset()
    this.simSpeedProperty.reset()
    this.twistSpeedProperty.reset()
    this.chromatinDensityProperty.reset()
    this.membraneThicknessProperty.reset()
    this.strandGapProperty.reset()
    this.glowIntensityProperty.reset()
    this.basePairVisibilityProperty.reset()
    this.geneHighlightLengthProperty.reset()
    this.showHistonesProperty.reset()
    this.showOrganellesProperty.reset()
    this.showLabelsProperty.reset()
    this.showScaleBarProperty.reset()
    this.autoTourProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = LEVEL_STATUS[0]
    this.tourUnlockedProperty.reset()
    this.quizPromptsProperty.reset()
    this.tipsProperty.reset()
    this.tipTextProperty.reset()
    this.helixPhaseProperty.reset()
    this.visited.clear()
    this.visited.add(0)
    this.autoTourTimer = 0
  }
}
