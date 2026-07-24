import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { PyramidConstants } from '../../common/PyramidColors.js'

export const PYRAMID_LABELS = [
  'Plants (producers)',
  'Rabbits & plant-eaters',
  'Foxes & meat-eaters',
  'Eagles (top hunters)',
] as const
export const PYRAMID_SHORT = ['Plants', 'Rabbits', 'Foxes', 'Eagles'] as const
export const PYRAMID_COLORS = ['#27ae60', '#f1c40f', '#e67e22', '#c0392b'] as const
export const PYRAMID_ICONS = ['🌿', '🐰', '🦊', '🦅'] as const
export const DECOMPOSER_LABEL = 'Decomposers'

export type PyramidMode = 'energy' | 'biomass' | 'numbers'

export interface EcosystemScenario {
  id: string
  name: string
  base: number
  transfer: number
  blurb: string
}

export const SCENARIOS: EcosystemScenario[] = [
  {
    id: 'grassland',
    name: '1. Grassland',
    base: 4000,
    transfer: 0.1,
    blurb: 'Fewer plants → less energy for eagles at the top.',
  },
  {
    id: 'forest',
    name: '2. Forest (start here)',
    base: 10000,
    transfer: 0.1,
    blurb: 'Classic Class-8 pyramid: about 10% moves up each step.',
  },
  {
    id: 'ocean',
    name: '3. Ocean',
    base: 22000,
    transfer: 0.12,
    blurb: 'Huge plankton base — a bit more energy can reach the top.',
  },
  {
    id: 'rainforest',
    name: '4. Rainforest',
    base: 40000,
    transfer: 0.08,
    blurb: 'Lots of plants, but more heat loss — top can still stay small.',
  },
]

export interface QuizQuestion {
  prompt: string
  choices: string[]
  correct: number
  explain: string
}

export const QUIZ_BANK: QuizQuestion[] = [
  {
    prompt: 'About how much energy moves up one trophic level?',
    choices: ['100%', '50%', '10%', '1%'],
    correct: 2,
    explain: 'The 10% rule: roughly one-tenth of the energy reaches the next level; the rest is used or lost as heat.',
  },
  {
    prompt: 'Which trophic level holds the most energy?',
    choices: ['Tertiary consumers', 'Secondary consumers', 'Primary consumers', 'Producers'],
    correct: 3,
    explain: 'Producers capture sunlight first, so they form the wide energy base of the pyramid.',
  },
  {
    prompt: 'What happens to most energy between levels?',
    choices: ['Stored forever', 'Lost as heat / used in life processes', 'Becomes more biomass', 'Goes to the sun'],
    correct: 1,
    explain: '~90% is used for movement, growth, and heat — so food chains rarely have many levels.',
  },
  {
    prompt: 'Decomposers mainly…',
    choices: ['Eat only top predators', 'Make sunlight', 'Recycle nutrients back to producers', 'Stop energy flow'],
    correct: 2,
    explain: 'Fungi and bacteria break down dead matter and return nutrients so plants can grow again.',
  },
  {
    prompt: 'Why are there usually fewer top predators?',
    choices: ['They dislike plants', 'Less energy reaches the top', 'They never reproduce', 'Oceans are too deep'],
    correct: 1,
    explain: 'Each step up keeps only ~10% of the energy below, so top levels support far fewer organisms.',
  },
  {
    prompt: 'A biomass pyramid usually looks…',
    choices: ['Wider at the top', 'Wider at the producer base', 'A perfect rectangle', 'Only one level'],
    correct: 1,
    explain: 'Producers make up most of the living mass; each consumer level is typically smaller.',
  },
  {
    prompt: 'If transfer efficiency rises from 10% to 20%, the top of the pyramid…',
    choices: ['Gets even tinier', 'Holds more energy than before', 'Disappears', 'Stops losing heat'],
    correct: 1,
    explain: 'Higher transfer means more energy (and often more organisms) can be supported higher up.',
  },
]

export function tierEnergies(base: number, transfer = PyramidConstants.ENERGY_TRANSFER): number[] {
  const t = transfer
  return [base, base * t, base * t * t, base * t * t * t]
}

export function tierOrganismCounts(base: number, transfer = PyramidConstants.ENERGY_TRANSFER): number[] {
  const scale = base / 10000
  const t = transfer / 0.1
  return [
    Math.round(10000 * scale),
    Math.round(1000 * scale * t),
    Math.round(100 * scale * t * t),
    Math.round(10 * scale * t * t * t),
  ]
}

export function tierBiomass(base: number, transfer = PyramidConstants.ENERGY_TRANSFER): number[] {
  const scale = base / 10000
  const t = transfer / 0.1
  return [9000 * scale, 900 * scale * t, 90 * scale * t * t, 9 * scale * t * t * t]
}

export function tierValues(base: number, mode: PyramidMode, transfer = PyramidConstants.ENERGY_TRANSFER): number[] {
  if (mode === 'biomass') return tierBiomass(base, transfer)
  if (mode === 'numbers') return tierOrganismCounts(base, transfer)
  return tierEnergies(base, transfer)
}

export function formatEnergy(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return n.toFixed(n < 10 ? 1 : 0)
}

export function formatTierValue(n: number, mode: PyramidMode): string {
  if (mode === 'numbers') return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n))
  if (mode === 'biomass') return n >= 1000 ? `${(n / 1000).toFixed(1)}k kg` : `${Math.round(n)} kg`
  return formatEnergy(n)
}

export function modeUnit(mode: PyramidMode): string {
  if (mode === 'numbers') return 'organisms'
  if (mode === 'biomass') return 'biomass'
  return 'energy'
}

export interface TierDetail {
  label: string
  energy: number
  pctOfBase: number
  pctFromBelow: number
  lostFromBelow: number
  organisms: number
  biomass: number
}

export function tierDetail(
  base: number,
  tier: number,
  mode: PyramidMode = 'energy',
  transfer = PyramidConstants.ENERGY_TRANSFER,
): TierDetail {
  const energies = tierEnergies(base, transfer)
  const counts = tierOrganismCounts(base, transfer)
  const biomass = tierBiomass(base, transfer)
  const energy = energies[tier] ?? 0
  const below = tier > 0 ? energies[tier - 1]! : base
  const pctOfBase = base > 0 ? (energy / base) * 100 : 0
  const pctFromBelow = below > 0 ? (energy / below) * 100 : 0
  const values = tierValues(base, mode, transfer)
  return {
    label: PYRAMID_LABELS[tier] ?? '',
    energy: values[tier] ?? 0,
    pctOfBase,
    pctFromBelow,
    lostFromBelow: Math.max(0, 100 - pctFromBelow),
    organisms: counts[tier] ?? 0,
    biomass: biomass[tier] ?? 0,
  }
}

export function tierDotCount(base: number, tier: number, mode: PyramidMode, transfer = PyramidConstants.ENERGY_TRANSFER): number {
  const n = tierValues(base, mode, transfer)[tier] ?? 0
  if (mode === 'numbers') return Math.min(48, Math.max(4, Math.round(Math.sqrt(n))))
  if (mode === 'biomass') return Math.min(40, Math.max(4, Math.round(n / 250)))
  return Math.min(36, Math.max(4, Math.round(Math.log10(n + 1) * 8)))
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

export class EcologicalPyramidModel implements TModel {
  public readonly baseEnergyProperty: NumberProperty
  public readonly transferProperty: NumberProperty
  public readonly modeProperty: Property<PyramidMode>
  public readonly selectedTierProperty: NumberProperty
  public readonly hoverTierProperty: NumberProperty
  public readonly pulseProperty: NumberProperty
  public readonly runningProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly decomposerFocusProperty: BooleanProperty
  public readonly showTipsProperty: BooleanProperty
  /** Extra tools stay tucked away so the first lesson stays simple. */
  public readonly showAdvancedProperty: BooleanProperty
  public readonly statusProperty: StringProperty
  public readonly tipProperty: StringProperty
  /** Plain “why it happens” line for Class 8. */
  public readonly whyProperty: StringProperty
  public readonly quizIndexProperty: NumberProperty
  public readonly quizScoreProperty: NumberProperty
  public readonly quizFeedbackProperty: StringProperty
  public readonly scenarioIdProperty: StringProperty
  public readonly highlightTransferProperty: NumberProperty
  /** 0 = idle; 0→4 animates energy cascade from producers to tertiary. */
  public readonly cascadeProgressProperty: NumberProperty
  public readonly compareTierProperty: NumberProperty

  public constructor() {
    this.baseEnergyProperty = new NumberProperty(PyramidConstants.BASE_DEFAULT)
    this.transferProperty = new NumberProperty(PyramidConstants.ENERGY_TRANSFER)
    this.modeProperty = new Property<PyramidMode>('energy')
    this.selectedTierProperty = new NumberProperty(0)
    this.hoverTierProperty = new NumberProperty(-1)
    this.pulseProperty = new NumberProperty(0)
    this.runningProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.decomposerFocusProperty = new BooleanProperty(false)
    this.showTipsProperty = new BooleanProperty(true)
    this.showAdvancedProperty = new BooleanProperty(false)
    this.statusProperty = new StringProperty(
      'Tap Plants → Rabbits → Foxes → Eagles. Watch how little energy is left at the top.',
    )
    this.tipProperty = new StringProperty(
      'NOW: Plants make food from sunlight — that wide base holds the most energy.',
    )
    this.whyProperty = new StringProperty(
      'Why: only about 10% moves up each step. The rest is used or lost as heat.',
    )
    this.quizIndexProperty = new NumberProperty(0)
    this.quizScoreProperty = new NumberProperty(0)
    this.quizFeedbackProperty = new StringProperty('Answer to check the 10% rule.')
    this.scenarioIdProperty = new StringProperty('forest')
    this.highlightTransferProperty = new NumberProperty(0)
    this.cascadeProgressProperty = new NumberProperty(0)
    this.compareTierProperty = new NumberProperty(-1)
  }

  public reset(): void {
    this.baseEnergyProperty.value = PyramidConstants.BASE_DEFAULT
    this.transferProperty.value = PyramidConstants.ENERGY_TRANSFER
    this.modeProperty.value = 'energy'
    this.selectedTierProperty.value = 0
    this.hoverTierProperty.value = -1
    this.pulseProperty.value = 0
    this.runningProperty.value = true
    this.decomposerFocusProperty.value = false
    this.showTipsProperty.value = true
    this.showAdvancedProperty.value = false
    this.statusProperty.value =
      'Tap Plants → Rabbits → Foxes → Eagles. Watch how little energy is left at the top.'
    this.tipProperty.value =
      'NOW: Plants make food from sunlight — that wide base holds the most energy.'
    this.whyProperty.value =
      'Why: only about 10% moves up each step. The rest is used or lost as heat.'
    this.quizIndexProperty.value = 0
    this.quizScoreProperty.value = 0
    this.quizFeedbackProperty.value = 'Answer to check the 10% rule.'
    this.scenarioIdProperty.value = 'forest'
    this.highlightTransferProperty.value = 0
    this.cascadeProgressProperty.value = 0
    this.compareTierProperty.value = -1
  }

  public step(dt: number): void {
    if (dt <= 0) return
    if (this.cascadeProgressProperty.value > 0 && this.cascadeProgressProperty.value < 4) {
      this.cascadeProgressProperty.value = Math.min(4, this.cascadeProgressProperty.value + dt * 0.85)
      const tier = Math.min(3, Math.floor(this.cascadeProgressProperty.value))
      if (this.selectedTierProperty.value !== tier) {
        this.selectedTierProperty.value = tier
        this.decomposerFocusProperty.value = false
        this.updateTipForSelection()
        const d = tierDetail(
          this.baseEnergyProperty.value,
          tier,
          this.modeProperty.value,
          this.transferProperty.value,
        )
        const keep = (this.transferProperty.value * 100).toFixed(0)
        this.statusProperty.value =
          tier === 0
            ? `Cascade: sunlight → ${d.label} (${formatTierValue(d.energy, this.modeProperty.value)})`
            : `Cascade: ~${keep}% kept → ${d.label} (${formatTierValue(d.energy, this.modeProperty.value)})`
      }
      if (this.cascadeProgressProperty.value >= 4) {
        this.cascadeProgressProperty.value = 0
        this.statusProperty.value = 'Cascade complete — most energy was lost as heat along the way.'
      }
      return
    }
    if (!this.runningProperty.value) return
    this.pulseProperty.value += dt
    if (this.highlightTransferProperty.value > 0) {
      this.highlightTransferProperty.value = Math.max(0, this.highlightTransferProperty.value - dt)
    }
  }

  public setMode(mode: PyramidMode): void {
    this.modeProperty.value = mode
    const unit = modeUnit(mode)
    this.statusProperty.value = `Showing ${unit} pyramid — each level keeps about ${(this.transferProperty.value * 100).toFixed(0)}% of the level below.`
    this.updateTipForSelection()
  }

  public selectTier(tier: number): void {
    const t = clamp(Math.round(tier), 0, 3)
    this.selectedTierProperty.value = t
    this.decomposerFocusProperty.value = false
    const d = tierDetail(
      this.baseEnergyProperty.value,
      t,
      this.modeProperty.value,
      this.transferProperty.value,
    )
    this.statusProperty.value = `${d.label}: ${formatTierValue(d.energy, this.modeProperty.value)} (${d.pctOfBase.toFixed(1)}% of producer base).`
    this.updateTipForSelection()
    this.highlightTransferProperty.value = 1.4
  }

  public selectDecomposers(): void {
    this.decomposerFocusProperty.value = true
    this.selectedTierProperty.value = -1
    this.statusProperty.value = 'Decomposers recycle dead matter back into nutrients for plants.'
    this.tipProperty.value = 'NOW: Decomposers break down dead plants and animals.'
    this.whyProperty.value = 'Why: nutrients return to soil so plants can grow again.'
  }

  public setBaseEnergy(v: number): void {
    this.baseEnergyProperty.value = clamp(v, PyramidConstants.BASE_MIN, PyramidConstants.BASE_MAX)
  }

  public setTransfer(v: number): void {
    this.transferProperty.value = clamp(v, PyramidConstants.TRANSFER_MIN, PyramidConstants.TRANSFER_MAX)
    this.statusProperty.value = `Keep ${(this.transferProperty.value * 100).toFixed(0)}% each step — watch the pyramid reshape.`
    this.highlightTransferProperty.value = 1.2
    this.updateTipForSelection()
  }

  public applyScenario(id: string): void {
    const s = SCENARIOS.find(x => x.id === id) ?? SCENARIOS[1]!
    this.scenarioIdProperty.value = s.id
    this.baseEnergyProperty.value = s.base
    this.transferProperty.value = s.transfer
    this.highlightTransferProperty.value = 1.6
    this.selectTier(0)
    this.statusProperty.value = `${s.name}: ${s.blurb}`
    this.whyProperty.value = `Why: ${s.blurb}`
  }

  public answerQuiz(choiceIndex: number): void {
    const q = QUIZ_BANK[this.quizIndexProperty.value % QUIZ_BANK.length]!
    if (choiceIndex === q.correct) {
      this.quizScoreProperty.value += 1
      this.quizFeedbackProperty.value = `Correct! ${q.explain}`
      this.statusProperty.value = `Quiz ✓ — score ${this.quizScoreProperty.value}`
    } else {
      this.quizFeedbackProperty.value = `Not quite. ${q.explain}`
      this.statusProperty.value = 'Quiz — try again or advance to the next question.'
    }
  }

  public nextQuiz(): void {
    this.quizIndexProperty.value = (this.quizIndexProperty.value + 1) % QUIZ_BANK.length
    this.quizFeedbackProperty.value = 'New question — pick the best answer.'
  }

  public nudgeTier(delta: number): void {
    const cur = this.selectedTierProperty.value < 0 ? 0 : this.selectedTierProperty.value
    this.selectTier(clamp(cur + delta, 0, 3))
  }

  public pulseSunBurst(): void {
    this.pulseProperty.value += 0.8
    this.statusProperty.value = 'Sunlight fuels Plants — energy enters the pyramid here.'
    this.tipProperty.value = 'NOW: Sunlight hits Plants — that is where energy starts.'
    this.whyProperty.value = 'Why: photosynthesis stores light energy in plant food.'
  }

  public startCascadeDemo(): void {
    this.modeProperty.value = 'energy'
    this.decomposerFocusProperty.value = false
    this.compareTierProperty.value = -1
    this.selectedTierProperty.value = 0
    this.cascadeProgressProperty.value = 0.01
    this.runningProperty.value = true
    this.statusProperty.value = 'Watch energy climb — only about 10% survives each step.'
    this.tipProperty.value = 'NOW: Energy is climbing Plants → Rabbits → Foxes → Eagles.'
    this.whyProperty.value = 'Why: most energy is used to live or lost as heat along the way.'
    this.highlightTransferProperty.value = 2
  }

  public toggleCompareNext(): void {
    const cur = this.selectedTierProperty.value < 0 ? 0 : this.selectedTierProperty.value
    const next = cur < 3 ? cur + 1 : -1
    this.compareTierProperty.value = next
    if (next < 0) {
      this.statusProperty.value = 'Compare cleared.'
      this.updateTipForSelection()
      return
    }
    const transfer = this.transferProperty.value
    const base = this.baseEnergyProperty.value
    const mode = this.modeProperty.value
    const a = tierDetail(base, cur, mode, transfer)
    const b = tierDetail(base, next, mode, transfer)
    this.statusProperty.value = `Compare: ${a.label} (${formatTierValue(a.energy, mode)}) vs ${b.label} (${formatTierValue(b.energy, mode)})`
    this.tipProperty.value = `NOW: Comparing ${PYRAMID_SHORT[cur]} with ${PYRAMID_SHORT[next]}.`
    this.whyProperty.value = `Why: ${PYRAMID_SHORT[next]} keeps only ~${(transfer * 100).toFixed(0)}% of ${PYRAMID_SHORT[cur]}.`
  }

  private updateTipForSelection(): void {
    const tier = this.selectedTierProperty.value
    const transferPct = (this.transferProperty.value * 100).toFixed(0)
    if (tier < 0) return
    const now = [
      'NOW: Plants (producers) — wide base that makes food from sunlight.',
      `NOW: Rabbits (plant-eaters) — get about ${transferPct}% of the plant energy.`,
      `NOW: Foxes (meat-eaters) — get about ${transferPct}% of the rabbit energy.`,
      `NOW: Eagles (top hunters) — tiny energy left, so few can live here.`,
    ]
    const why = [
      'Why: photosynthesis stores Sun energy in plants — that is the pyramid base.',
      `Why: rabbits use most energy to live; only ~${transferPct}% can go up.`,
      `Why: foxes also burn energy moving and growing — more heat loss.`,
      'Why: so little energy reaches the top that food chains stay short.',
    ]
    this.tipProperty.value = now[tier] ?? now[0]!
    this.whyProperty.value = why[tier] ?? why[0]!
  }
}
