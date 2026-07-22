import { NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import {
  advanceGuideAfterAction,
  getGuideStep,
  solutionIndicatorColor,
  type GuideStepId,
  type IndicatorKind,
} from './PhLabGuide.js'

export type Category = 'acid' | 'base' | 'neutral' | 'empty'
export type PourKind = 'acid' | 'base' | 'water' | null

function computePh(acidUnits: number, baseUnits: number, volume: number): number {
  if (volume < 0.5) return 7
  const neutralized = Math.min(acidUnits, baseUnits)
  const excessAcid = acidUnits - neutralized
  const excessBase = baseUnits - neutralized
  if (excessAcid > 0.05) {
    const strength = Math.min(1, excessAcid / Math.max(volume * 0.4, 1))
    return 7 - 6.2 * strength
  }
  if (excessBase > 0.05) {
    const strength = Math.min(1, excessBase / Math.max(volume * 0.4, 1))
    return 7 + 6.2 * strength
  }
  return 7
}

function categoryFor(ph: number, volume: number): Category {
  if (volume < 0.5) return 'empty'
  if (ph < 6.5) return 'acid'
  if (ph > 7.5) return 'base'
  return 'neutral'
}

export function litmusColor(ph: number, wet: boolean): string {
  if (!wet) return 'rgb(230, 210, 200)'
  if (ph < 6.5) return 'rgb(220, 55, 70)'
  if (ph > 7.5) return 'rgb(55, 90, 210)'
  return 'rgb(180, 120, 160)'
}

export function reagentColor(kind: 'acid' | 'base' | 'water'): string {
  if (kind === 'acid') return 'rgb(255, 210, 80)'
  if (kind === 'base') return 'rgb(160, 200, 255)'
  return 'rgb(190, 220, 255)'
}

/**
 * pH Laboratory model — pour + litmus animations, indicators, guided steps.
 */
export class PhLabModel implements TModel {
  public readonly volumeProperty: NumberProperty
  public readonly phProperty: NumberProperty
  public readonly categoryProperty: StringProperty
  public readonly liquidColorProperty: Property<string>
  public readonly litmusWetProperty: Property<boolean>
  public readonly litmusColorProperty: Property<string>
  public readonly statusProperty: StringProperty

  public readonly pourProgressProperty: NumberProperty
  public readonly isPouringProperty: Property<boolean>
  public readonly pourKindProperty: Property<PourKind>
  public readonly pourColorProperty: Property<string>
  public readonly mixRippleProperty: NumberProperty

  /** Litmus dip animation 0–1 */
  public readonly litmusDipProgressProperty: NumberProperty
  public readonly isDippingProperty: Property<boolean>

  public readonly indicatorProperty: Property<IndicatorKind>
  public readonly guideIdProperty: Property<GuideStepId>
  public readonly guideTitleProperty: StringProperty
  public readonly guideDoProperty: StringProperty
  public readonly guideWhyProperty: StringProperty
  public readonly guideTipProperty: StringProperty
  public readonly guideStepLabelProperty: StringProperty

  private acidUnits = 0
  private baseUnits = 0
  private pendingKind: PourKind = null
  private pendingAmount = 0
  private appliedPour = false
  private dipApplied = false

  public constructor() {
    this.volumeProperty = new NumberProperty(0)
    this.phProperty = new NumberProperty(7)
    this.categoryProperty = new StringProperty('empty')
    this.liquidColorProperty = new Property(solutionIndicatorColor('universal', 7, 0))
    this.litmusWetProperty = new Property(false)
    this.litmusColorProperty = new Property(litmusColor(7, false))
    this.statusProperty = new StringProperty(
      'Follow the guide: pour acid, read the meter, dip litmus, then explore indicators.',
    )
    this.pourProgressProperty = new NumberProperty(0)
    this.isPouringProperty = new Property(false)
    this.pourKindProperty = new Property<PourKind>(null)
    this.pourColorProperty = new Property(reagentColor('acid'))
    this.mixRippleProperty = new NumberProperty(0)

    this.litmusDipProgressProperty = new NumberProperty(0)
    this.isDippingProperty = new Property(false)

    this.indicatorProperty = new Property<IndicatorKind>('universal')
    this.guideIdProperty = new Property<GuideStepId>('welcome')
    this.guideTitleProperty = new StringProperty('')
    this.guideDoProperty = new StringProperty('')
    this.guideWhyProperty = new StringProperty('')
    this.guideTipProperty = new StringProperty('')
    this.guideStepLabelProperty = new StringProperty('')
    this.refreshGuideTexts()
  }

  private refreshGuideTexts(): void {
    const g = getGuideStep(this.guideIdProperty.value)
    this.guideTitleProperty.value = g.title
    this.guideDoProperty.value = g.doThis
    this.guideWhyProperty.value = g.why
    this.guideTipProperty.value = g.litmusTip ?? ''
    this.guideStepLabelProperty.value = `Step ${g.step} of 9`
  }

  private setGuide(id: GuideStepId): void {
    this.guideIdProperty.value = id
    this.refreshGuideTexts()
  }

  private advance(
    action:
      | 'start'
      | 'poured'
      | 'viewed-meter'
      | 'dipped-litmus'
      | 'changed-indicator'
      | 'viewed-scale'
      | 'skip',
  ): void {
    const next = advanceGuideAfterAction(
      this.guideIdProperty.value,
      action,
      this.volumeProperty.value,
      this.categoryProperty.value,
    )
    if (next !== this.guideIdProperty.value) {
      this.setGuide(next)
    }
  }

  private sync(): void {
    const volume = this.volumeProperty.value
    const ph = computePh(this.acidUnits, this.baseUnits, volume)
    this.phProperty.value = ph
    this.categoryProperty.value = categoryFor(ph, volume)
    this.liquidColorProperty.value = solutionIndicatorColor(
      this.indicatorProperty.value,
      ph,
      volume,
    )
    this.litmusColorProperty.value = litmusColor(ph, this.litmusWetProperty.value)
  }

  public startGuide(): void {
    this.advance('start')
    this.statusProperty.value = 'Great — pour acid from the HCl beaker.'
  }

  public skipGuideStep(): void {
    this.advance('skip')
  }

  public replayGuide(): void {
    this.setGuide('welcome')
    this.statusProperty.value = 'Guide restarted. Press Start guided lab when ready.'
  }

  public noticeMeter(): void {
    this.advance('viewed-meter')
  }

  public noticeScale(): void {
    this.advance('viewed-scale')
  }

  public setIndicator(kind: IndicatorKind): void {
    this.indicatorProperty.value = kind
    this.sync()
    this.advance('changed-indicator')
    const labels: Record<IndicatorKind, string> = {
      universal: 'Universal indicator — rainbow across the pH scale.',
      litmus: 'Litmus in solution — red in acid, blue in base.',
      phenolphthalein: 'Phenolphthalein — colorless in acid, pink in base.',
      'methyl-orange': 'Methyl orange — red in strong acid, yellow above ~4.4.',
    }
    this.statusProperty.value = labels[kind]
  }

  public pour(kind: 'acid' | 'base' | 'water', amount = 18): void {
    if (this.isPouringProperty.value || this.isDippingProperty.value) return
    const room = Math.max(0, 100 - this.volumeProperty.value)
    const add = Math.min(amount, room)
    if (add < 0.5) {
      this.statusProperty.value = 'Main beaker is full — empty it first.'
      return
    }
    this.pendingKind = kind
    this.pendingAmount = add
    this.appliedPour = false
    this.pourKindProperty.value = kind
    this.pourColorProperty.value = reagentColor(kind)
    this.pourProgressProperty.value = 0
    this.isPouringProperty.value = true
    this.mixRippleProperty.value = 0
    this.litmusWetProperty.value = false
    this.sync()
    this.statusProperty.value =
      kind === 'acid'
        ? 'Pouring acid… watch the stream into the mix beaker.'
        : kind === 'base'
          ? 'Pouring base… watch the stream into the mix beaker.'
          : 'Pouring water… diluting the mixture.'
  }

  public dipLitmus(): void {
    if (this.isPouringProperty.value || this.isDippingProperty.value) {
      this.statusProperty.value = 'Wait for the current animation to finish.'
      return
    }
    if (this.volumeProperty.value < 1) {
      this.statusProperty.value = 'Beaker empty — pour a liquid before dipping litmus.'
      this.litmusWetProperty.value = false
      this.sync()
      return
    }
    this.dipApplied = false
    this.litmusDipProgressProperty.value = 0
    this.isDippingProperty.value = true
    this.statusProperty.value = 'Dipping litmus… watching it enter the liquid.'
  }

  public empty(): void {
    if (this.isPouringProperty.value || this.isDippingProperty.value) return
    this.acidUnits = 0
    this.baseUnits = 0
    this.volumeProperty.value = 0
    this.litmusWetProperty.value = false
    this.statusProperty.value = 'Beaker emptied. Tap a reagent beaker to pour again.'
    this.sync()
  }

  /** Advance pour / dip / mix animations. */
  public step(dt: number): void {
    if (this.isPouringProperty.value) {
      const next = Math.min(1, this.pourProgressProperty.value + dt * 1.15)
      this.pourProgressProperty.value = next

      if (!this.appliedPour && next >= 0.45 && this.pendingKind) {
        this.applyPending()
        this.appliedPour = true
        this.mixRippleProperty.value = 1
      }

      if (next >= 1) {
        this.isPouringProperty.value = false
        this.pourKindProperty.value = null
        this.pourProgressProperty.value = 0
        this.pendingKind = null
        this.pendingAmount = 0
        this.advance('poured')
        const ph = this.phProperty.value
        const cat = this.categoryProperty.value
        if (cat === 'acid') {
          this.statusProperty.value = `Mixed. Acidic (pH ${ph.toFixed(1)}). Dip litmus — expect RED.`
        } else if (cat === 'base') {
          this.statusProperty.value = `Mixed. Basic (pH ${ph.toFixed(1)}). Dip litmus — expect BLUE.`
        } else if (cat === 'neutral') {
          this.statusProperty.value = `Mixed. Near neutral (pH ${ph.toFixed(1)}). Litmus stays muted.`
        }
      }
    }

    if (this.isDippingProperty.value) {
      const next = Math.min(1, this.litmusDipProgressProperty.value + dt * 1.35)
      this.litmusDipProgressProperty.value = next

      // Mid-dip: paper becomes wet and takes color
      if (!this.dipApplied && next >= 0.42) {
        this.litmusWetProperty.value = true
        this.sync()
        this.dipApplied = true
        const ph = this.phProperty.value
        const cat = this.categoryProperty.value
        if (cat === 'acid') {
          this.statusProperty.value = `Litmus turned RED → acidic (pH ${ph.toFixed(1)}).`
        } else if (cat === 'base') {
          this.statusProperty.value = `Litmus turned BLUE → basic (pH ${ph.toFixed(1)}).`
        } else {
          this.statusProperty.value = `Litmus barely changes → near neutral (pH ${ph.toFixed(1)}).`
        }
      }

      if (next >= 1) {
        this.isDippingProperty.value = false
        this.litmusDipProgressProperty.value = 0
        this.advance('dipped-litmus')
      }
    }

    if (this.mixRippleProperty.value > 0) {
      this.mixRippleProperty.value = Math.max(0, this.mixRippleProperty.value - dt * 1.4)
    }
  }

  private applyPending(): void {
    const kind = this.pendingKind
    const add = this.pendingAmount
    if (!kind || add < 0.5) return
    this.volumeProperty.value += add
    if (kind === 'acid') this.acidUnits += add * 1.1
    else if (kind === 'base') this.baseUnits += add * 1.1
    this.sync()
  }

  public reset(): void {
    this.acidUnits = 0
    this.baseUnits = 0
    this.pendingKind = null
    this.pendingAmount = 0
    this.appliedPour = false
    this.dipApplied = false
    this.volumeProperty.reset()
    this.phProperty.reset()
    this.categoryProperty.reset()
    this.liquidColorProperty.reset()
    this.litmusWetProperty.reset()
    this.litmusColorProperty.reset()
    this.statusProperty.reset()
    this.pourProgressProperty.reset()
    this.isPouringProperty.reset()
    this.pourKindProperty.reset()
    this.pourColorProperty.reset()
    this.mixRippleProperty.reset()
    this.litmusDipProgressProperty.reset()
    this.isDippingProperty.reset()
    this.indicatorProperty.reset()
    this.setGuide('welcome')
    this.sync()
  }
}
