import { NumberProperty, Property } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/EcologyConstants.js'

export const PYRAMID_LABELS = ['Producers', 'Primary consumers', 'Secondary', 'Tertiary'] as const

export const PYRAMID_COLORS = ['#27ae60', '#f1c40f', '#e67e22', '#c0392b'] as const

/** Energy at each trophic level (10% rule). */
export function tierEnergies(base: number): number[] {
  return [base, base * 0.1, base * 0.01, base * 0.001]
}

export function formatEnergy(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`
  return n.toFixed(n < 10 ? 1 : 0)
}

/**
 * Ecological pyramid model — base producer energy and 10% transfer rule.
 */
export class PyramidModel implements TModel {
  public readonly baseEnergyProperty: NumberProperty
  public readonly selectedTierProperty: NumberProperty
  public readonly pulseProperty: NumberProperty
  public readonly runningProperty: Property<boolean>

  public constructor() {
    this.baseEnergyProperty = new NumberProperty(10000)
    this.selectedTierProperty = new NumberProperty(0)
    this.pulseProperty = new NumberProperty(0)
    this.runningProperty = new Property(true)
  }

  public get tierEnergies(): number[] {
    return tierEnergies(this.baseEnergyProperty.value)
  }

  public setBaseEnergy(value: number): void {
    this.baseEnergyProperty.value = clamp(Math.round(value), 1000, 50000)
  }

  public selectTier(index: number): void {
    this.selectedTierProperty.value = clamp(Math.round(index), 0, 3)
  }

  public step(dt: number): void {
    if (!this.runningProperty.value || dt <= 0) return
    this.pulseProperty.value += dt
  }

  public reset(): void {
    this.baseEnergyProperty.reset()
    this.selectedTierProperty.reset()
    this.pulseProperty.reset()
    this.runningProperty.reset()
  }
}
