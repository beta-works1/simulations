import { BooleanProperty, NumberProperty, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/EcologyConstants.js'

export interface WarmingScenario {
  id: string
  name: string
  co2: number
  blurb: string
}

/**
 * Class-8 stories: natural greenhouse vs human thickening of the gas blanket.
 * Science: sunlight in → Earth re-emits heat → GHGs absorb/re-radiate → more gas → warming.
 */
export const WARMING_SCENARIOS: WarmingScenario[] = [
  {
    id: 'today',
    name: '1. Start here (today)',
    co2: 0.4,
    blurb: 'A medium gas blanket traps some heat (greenhouse effect).',
  },
  {
    id: 'clean',
    name: '2. Cleaner air',
    co2: 0.15,
    blurb: 'A thinner gas blanket lets more heat escape to space.',
  },
  {
    id: 'factories',
    name: '3. Burn fossil fuels',
    co2: 0.85,
    blurb: 'Extra CO₂ thickens the gas blanket and traps more heat.',
  },
  {
    id: 'trees',
    name: '4. Cut fewer trees',
    co2: 0.28,
    blurb: 'Trees take in CO₂, so the gas blanket can stay thinner.',
  },
]

/**
 * Global warming mechanism model for Grade 8.
 * Extra greenhouse gases thicken Earth’s “blanket,” so more outgoing heat returns to the surface.
 * Physics/step logic is intentional — presentation copy lives in tipProperty only for the scene.
 */
export class WarmingModel implements TModel {
  public readonly co2LevelProperty: NumberProperty
  public readonly cloudCoverProperty: NumberProperty
  public readonly albedoProperty: NumberProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly particleIntensityProperty: NumberProperty
  public readonly temperatureProperty: NumberProperty
  public readonly timeProperty: NumberProperty
  public readonly runningProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly showTipsProperty: BooleanProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly autoDayProperty: BooleanProperty
  public readonly showAdvancedProperty: BooleanProperty
  public readonly statusProperty: StringProperty
  /** Single live scene explanation (Grade 8, one idea per line). */
  public readonly tipProperty: StringProperty
  public readonly whyProperty: StringProperty
  public readonly nextHintProperty: StringProperty
  public readonly effectProperty: StringProperty
  public readonly scenarioIdProperty: StringProperty

  public constructor() {
    this.co2LevelProperty = new NumberProperty(0.4)
    this.cloudCoverProperty = new NumberProperty(0.3)
    this.albedoProperty = new NumberProperty(0.3)
    this.simSpeedProperty = new NumberProperty(1)
    this.particleIntensityProperty = new NumberProperty(1)
    this.temperatureProperty = new NumberProperty(15)
    this.timeProperty = new NumberProperty(0)
    this.runningProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.showTipsProperty = new BooleanProperty(true)
    this.showLabelsProperty = new BooleanProperty(true)
    this.autoDayProperty = new BooleanProperty(false)
    this.showAdvancedProperty = new BooleanProperty(false)
    this.statusProperty = new StringProperty('')
    this.tipProperty = new StringProperty(
      'Medium gas blanket → some heat sent back → Earth warming',
    )
    this.whyProperty = new StringProperty('')
    this.nextHintProperty = new StringProperty('')
    this.effectProperty = new StringProperty('')
    this.scenarioIdProperty = new StringProperty('today')

    this.co2LevelProperty.link(() => this.updateTeachingCopy())
  }

  public setCo2(value: number): void {
    this.co2LevelProperty.value = clamp(value, 0.05, 1)
  }

  public nudgeCo2(delta: number): void {
    this.setCo2(this.co2LevelProperty.value + delta)
  }

  public applyScenario(id: string): void {
    const s = WARMING_SCENARIOS.find(x => x.id === id) ?? WARMING_SCENARIOS[0]!
    this.scenarioIdProperty.value = s.id
    this.setCo2(s.co2)
    this.updateTeachingCopy()
  }

  /** How much incoming sunlight is bounced away before it can warm Earth (0..~1.4). */
  public getReflection(): number {
    return clamp(this.albedoProperty.value + this.cloudCoverProperty.value * 0.6, 0, 1.4)
  }

  /** Day/night brightness multiplier on incoming sunlight when the auto-day cycle is on. */
  public getSolarFactor(): number {
    if (!this.autoDayProperty.value) return 1
    return 0.85 + 0.3 * (0.5 + 0.5 * Math.sin(this.timeProperty.value * 0.6))
  }

  public step(dt: number): void {
    if (!this.runningProperty.value || dt <= 0) {
      return
    }
    const scaledDt = dt * this.simSpeedProperty.value
    this.timeProperty.value += scaledDt
    const solarFactor = this.getSolarFactor()
    const reflection = this.getReflection()
    const target = 10 + this.co2LevelProperty.value * 28 * solarFactor - reflection * 5
    const t = this.temperatureProperty.value
    this.temperatureProperty.value = t + (target - t) * Math.min(1, scaledDt * 0.35)
  }

  public reset(): void {
    this.co2LevelProperty.value = 0.4
    this.cloudCoverProperty.value = 0.3
    this.albedoProperty.value = 0.3
    this.simSpeedProperty.value = 1
    this.particleIntensityProperty.value = 1
    this.temperatureProperty.value = 15
    this.timeProperty.value = 0
    this.runningProperty.value = true
    this.showTipsProperty.value = true
    this.showLabelsProperty.value = true
    this.autoDayProperty.value = false
    this.showAdvancedProperty.value = false
    this.scenarioIdProperty.value = 'today'
    this.updateTeachingCopy()
  }

  private updateTeachingCopy(): void {
    const co2 = this.co2LevelProperty.value
    if (co2 < 0.28) {
      this.tipProperty.value = 'Thin gas blanket → heat escapes to space → Earth cooler'
    }
    else if (co2 < 0.55) {
      this.tipProperty.value = 'Medium gas blanket → some heat sent back → Earth warming'
    }
    else {
      this.tipProperty.value = 'Thick gas blanket → more heat trapped → Earth hotter'
    }
  }
}
