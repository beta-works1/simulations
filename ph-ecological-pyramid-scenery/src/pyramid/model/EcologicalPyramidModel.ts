import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { PyramidConstants } from '../../common/PyramidColors.js'

export const PYRAMID_LABELS = ['Producers', 'Primary consumers', 'Secondary', 'Tertiary'] as const
export const PYRAMID_COLORS = ['#27ae60', '#f1c40f', '#e67e22', '#c0392b'] as const
export const DECOMPOSER_LABEL = 'Decomposers'

export type PyramidMode = 'energy' | 'biomass' | 'numbers'

export function tierEnergies(base: number): number[] {
  return [base, base * 0.1, base * 0.01, base * 0.001]
}

export function tierOrganismCounts(base: number): number[] {
  const scale = base / 10000
  return [
    Math.round(10000 * scale),
    Math.round(1000 * scale),
    Math.round(100 * scale),
    Math.round(10 * scale),
  ]
}

export function tierBiomass(base: number): number[] {
  const scale = base / 10000
  return [9000 * scale, 900 * scale, 90 * scale, 9 * scale]
}

export function tierValues(base: number, mode: PyramidMode): number[] {
  if (mode === 'biomass') return tierBiomass(base)
  if (mode === 'numbers') return tierOrganismCounts(base)
  return tierEnergies(base)
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

export function tierDetail(base: number, tier: number, mode: PyramidMode = 'energy'): TierDetail {
  const energies = tierEnergies(base)
  const counts = tierOrganismCounts(base)
  const biomass = tierBiomass(base)
  const energy = energies[tier] ?? 0
  const below = tier > 0 ? energies[tier - 1]! : base
  const pctOfBase = base > 0 ? (energy / base) * 100 : 0
  const pctFromBelow = below > 0 ? (energy / below) * 100 : 0
  const values = tierValues(base, mode)
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

export function tierDotCount(base: number, tier: number, mode: PyramidMode): number {
  const n = tierValues(base, mode)[tier] ?? 0
  if (mode === 'numbers') return Math.min(48, Math.max(4, Math.round(Math.sqrt(n))))
  if (mode === 'biomass') return Math.min(40, Math.max(4, Math.round(n / 250)))
  return Math.min(36, Math.max(4, Math.round(Math.log10(n + 1) * 8)))
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

export class EcologicalPyramidModel implements TModel {
  public readonly baseEnergyProperty: NumberProperty
  public readonly modeProperty: Property<PyramidMode>
  public readonly selectedTierProperty: NumberProperty
  public readonly pulseProperty: NumberProperty
  public readonly runningProperty: BooleanProperty
  public readonly statusProperty: StringProperty

  public constructor() {
    this.baseEnergyProperty = new NumberProperty(PyramidConstants.BASE_DEFAULT)
    this.modeProperty = new Property<PyramidMode>('energy')
    this.selectedTierProperty = new NumberProperty(0)
    this.pulseProperty = new NumberProperty(0)
    this.runningProperty = new BooleanProperty(true)
    this.statusProperty = new StringProperty(
      'Tap a trophic level to inspect it. Switch pyramid type and adjust producer energy to see the 10% rule.',
    )
  }

  public reset(): void {
    this.baseEnergyProperty.value = PyramidConstants.BASE_DEFAULT
    this.modeProperty.value = 'energy'
    this.selectedTierProperty.value = 0
    this.pulseProperty.value = 0
    this.runningProperty.value = true
    this.statusProperty.value =
      'Tap a trophic level to inspect it. Switch pyramid type and adjust producer energy to see the 10% rule.'
  }

  public step(dt: number): void {
    if (!this.runningProperty.value || dt <= 0) return
    this.pulseProperty.value += dt
  }

  public setMode(mode: PyramidMode): void {
    this.modeProperty.value = mode
    const unit = modeUnit(mode)
    this.statusProperty.value = `Showing ${unit} pyramid — each level keeps about 10% of the level below.`
  }

  public selectTier(tier: number): void {
    const t = clamp(Math.round(tier), 0, 3)
    this.selectedTierProperty.value = t
    const d = tierDetail(this.baseEnergyProperty.value, t, this.modeProperty.value)
    this.statusProperty.value = `${d.label}: ${formatTierValue(d.energy, this.modeProperty.value)} (${d.pctOfBase.toFixed(1)}% of producer base).`
  }

  public setBaseEnergy(v: number): void {
    this.baseEnergyProperty.value = clamp(v, PyramidConstants.BASE_MIN, PyramidConstants.BASE_MAX)
  }
}
