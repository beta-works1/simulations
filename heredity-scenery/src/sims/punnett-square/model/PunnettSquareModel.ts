import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'

export type Allele = 'A' | 'a'
export type Genotype = 'AA' | 'Aa' | 'aa'
export type TraitId = 'seedColor' | 'height' | 'flower'

export interface TraitDef {
  id: TraitId
  label: string
  dominantLabel: string
  recessiveLabel: string
  dominantColor: string
  recessiveColor: string
}

/** Trait labels: seedColor yellow/green, height tall/short, flower purple/white (dominant first). */
export const TRAITS: Record<TraitId, TraitDef> = {
  seedColor: {
    id: 'seedColor',
    label: 'Seed Color',
    dominantLabel: 'Yellow seeds',
    recessiveLabel: 'Green seeds',
    dominantColor: '#f4d03f',
    recessiveColor: '#27ae60',
  },
  height: {
    id: 'height',
    label: 'Plant Height',
    dominantLabel: 'Tall plant',
    recessiveLabel: 'Short plant',
    dominantColor: '#58d68d',
    recessiveColor: '#935116',
  },
  flower: {
    id: 'flower',
    label: 'Flower Color',
    dominantLabel: 'Purple flower',
    recessiveLabel: 'White flower',
    dominantColor: '#8e44ad',
    recessiveColor: '#ecf0f1',
  },
}

export const GENOTYPES: Genotype[] = ['AA', 'Aa', 'aa']

export function genotypeToAlleles(g: Genotype): [Allele, Allele] {
  if (g === 'AA') return ['A', 'A']
  if (g === 'aa') return ['a', 'a']
  return ['A', 'a']
}

export function allelesToGenotype(pair: [Allele, Allele]): Genotype {
  const aCount = (pair[0] === 'A' ? 1 : 0) + (pair[1] === 'A' ? 1 : 0)
  if (aCount === 2) return 'AA'
  if (aCount === 0) return 'aa'
  return 'Aa'
}

export type GridCell = { genotype: Genotype; dominant: boolean }

/** Classic 2×2 monohybrid cross. phenotype = includes 'A' ? Dominant : Recessive. */
function punnett(mother: [Allele, Allele], father: [Allele, Allele]): GridCell[][] {
  const grid: GridCell[][] = []
  for (let r = 0; r < 2; r++) {
    const row: GridCell[] = []
    for (let c = 0; c < 2; c++) {
      const genotype = allelesToGenotype([mother[r], father[c]])
      row.push({ genotype, dominant: genotype.includes('A') })
    }
    grid.push(row)
  }
  return grid
}

export function phenotypeLabel(trait: TraitId, dominant: boolean): string {
  const def = TRAITS[trait]
  return dominant ? def.dominantLabel : def.recessiveLabel
}

export function phenotypeColor(trait: TraitId, dominant: boolean): string {
  const def = TRAITS[trait]
  return dominant ? def.dominantColor : def.recessiveColor
}

export type QuizOption = { label: string; correct: boolean }

/**
 * Monohybrid-cross Punnett square model (Ch3 Heredity — mirrors the reflex arc's
 * dense control surface: one clear stage interaction plus a rich right-side panel).
 */
export class PunnettSquareModel implements TModel {
  public readonly traitProperty: Property<TraitId>
  public readonly motherGenotypeProperty: Property<Genotype>
  public readonly fatherGenotypeProperty: Property<Genotype>
  public readonly showLettersProperty: BooleanProperty
  public readonly showPhenotypeIconsProperty: BooleanProperty
  public readonly showProbabilitiesProperty: BooleanProperty
  public readonly animateFillProperty: BooleanProperty
  public readonly fillProgressProperty: NumberProperty
  public readonly fillSpeedProperty: NumberProperty
  public readonly fillingProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly generationProperty: NumberProperty
  /** Increments each time a quiz should be (re)shown; view lazy-links to it. */
  public readonly quizPromptsProperty: NumberProperty
  /** 0..4 — how many cells have crossed their reveal threshold. Drives bursts/sounds in the view. */
  public readonly cellRevealProperty: NumberProperty
  /** Increments once per completed cross; view lazy-links to push into the history chart. */
  public readonly historyPushProperty: NumberProperty

  private firstFillDone = false
  private quizShown = false

  public constructor() {
    this.traitProperty = new Property<TraitId>('seedColor')
    this.motherGenotypeProperty = new Property<Genotype>('Aa')
    this.fatherGenotypeProperty = new Property<Genotype>('Aa')
    this.showLettersProperty = new BooleanProperty(true)
    this.showPhenotypeIconsProperty = new BooleanProperty(true)
    this.showProbabilitiesProperty = new BooleanProperty(true)
    this.animateFillProperty = new BooleanProperty(true)
    this.fillProgressProperty = new NumberProperty(0)
    this.fillSpeedProperty = new NumberProperty(1)
    this.fillingProperty = new BooleanProperty(false)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty('')
    this.generationProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.cellRevealProperty = new NumberProperty(0)
    this.historyPushProperty = new NumberProperty(0)

    this.motherGenotypeProperty.lazyLink(() => this.onParentsChanged())
    this.fatherGenotypeProperty.lazyLink(() => this.onParentsChanged())
    this.traitProperty.lazyLink(() => this.onParentsChanged())

    this.updateStatusForParents()
  }

  public setTrait(trait: TraitId): void {
    this.traitProperty.value = trait
  }

  public setMotherGenotype(g: Genotype): void {
    this.motherGenotypeProperty.value = g
  }

  public setFatherGenotype(g: Genotype): void {
    this.fatherGenotypeProperty.value = g
  }

  public toggleMotherAllele(i: 0 | 1): void {
    const pair = genotypeToAlleles(this.motherGenotypeProperty.value)
    pair[i] = pair[i] === 'A' ? 'a' : 'A'
    this.motherGenotypeProperty.value = allelesToGenotype(pair)
  }

  public toggleFatherAllele(i: 0 | 1): void {
    const pair = genotypeToAlleles(this.fatherGenotypeProperty.value)
    pair[i] = pair[i] === 'A' ? 'a' : 'A'
    this.fatherGenotypeProperty.value = allelesToGenotype(pair)
  }

  public computeGrid(): GridCell[][] {
    return punnett(
      genotypeToAlleles(this.motherGenotypeProperty.value),
      genotypeToAlleles(this.fatherGenotypeProperty.value),
    )
  }

  public dominantCount(): number {
    let n = 0
    for (const row of this.computeGrid()) {
      for (const cell of row) {
        if (cell.dominant) n++
      }
    }
    return n
  }

  /** Starts (or instantly finishes) the fill animation, depending on animateFillProperty. */
  public fillAnimate(): void {
    if (this.fillingProperty.value) return
    this.cellRevealProperty.value = 0
    if (this.animateFillProperty.value) {
      this.fillProgressProperty.value = 0
      this.fillingProperty.value = true
      this.statusProperty.value = 'Crossing parents… watch the grid fill in.'
    }
    else {
      this.fillProgressProperty.value = 1
      this.completeFill()
    }
  }

  public clearFill(): void {
    this.fillProgressProperty.value = 0
    this.fillingProperty.value = false
    this.cellRevealProperty.value = 0
    this.updateStatusForParents()
  }

  public step(dt: number): void {
    if (!this.fillingProperty.value) return
    const rate = 0.85 * Math.max(0.4, this.fillSpeedProperty.value)
    const next = Math.min(1, this.fillProgressProperty.value + dt * rate)
    this.fillProgressProperty.value = next

    const revealed = Math.min(4, Math.floor(next * 4 + 1e-6))
    if (revealed > this.cellRevealProperty.value) {
      this.cellRevealProperty.value = revealed
    }

    if (next >= 1) {
      this.fillingProperty.value = false
      this.completeFill()
    }
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value = 'Correct — a recessive trait only shows up with two lowercase alleles (aa)!'
    }
    else {
      this.statusProperty.value = 'Not quite — recessive traits need aa (two lowercase letters) to appear.'
    }
  }

  /** Builds a fresh two-option quiz from the current trait. */
  public quizOptions(): QuizOption[] {
    const trait = this.traitProperty.value
    const dominant = { label: phenotypeLabel(trait, true), correct: false }
    const recessive = { label: phenotypeLabel(trait, false), correct: true }
    return Math.random() < 0.5 ? [recessive, dominant] : [dominant, recessive]
  }

  private onParentsChanged(): void {
    this.clearFill()
  }

  private completeFill(): void {
    this.cellRevealProperty.value = 4
    this.generationProperty.value += 1
    this.historyPushProperty.value += 1

    const dom = this.dominantCount()
    const trait = this.traitProperty.value
    const domLabel = phenotypeLabel(trait, true)
    const recLabel = phenotypeLabel(trait, false)
    const pct = Math.round((dom / 4) * 100)

    if (dom === 4 || dom === 0) {
      this.statusProperty.value = `Cross complete! All 4 offspring are ${dom === 4 ? domLabel : recLabel}.`
    }
    else {
      this.statusProperty.value =
        `Cross complete! ${dom}/4 (${pct}%) are ${domLabel} · ${4 - dom}/4 are ${recLabel}.`
    }

    if (!this.firstFillDone) {
      this.firstFillDone = true
      this.starsProperty.value += 1
    }
    if (!this.quizShown && dom > 0 && dom < 4) {
      this.quizShown = true
      this.quizPromptsProperty.value += 1
    }
  }

  private updateStatusForParents(): void {
    const trait = TRAITS[this.traitProperty.value]
    this.statusProperty.value =
      `${trait.label}: ${trait.dominantLabel} (dominant, A) vs ${trait.recessiveLabel} (recessive, a). Tap Cross to fill the grid.`
  }

  public reset(): void {
    this.traitProperty.reset()
    this.motherGenotypeProperty.reset()
    this.fatherGenotypeProperty.reset()
    this.showLettersProperty.reset()
    this.showPhenotypeIconsProperty.reset()
    this.showProbabilitiesProperty.reset()
    this.animateFillProperty.reset()
    this.fillProgressProperty.reset()
    this.fillSpeedProperty.reset()
    this.fillingProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.generationProperty.reset()
    this.quizPromptsProperty.reset()
    this.cellRevealProperty.reset()
    this.historyPushProperty.reset()
    this.firstFillDone = false
    this.quizShown = false
    this.updateStatusForParents()
  }
}
