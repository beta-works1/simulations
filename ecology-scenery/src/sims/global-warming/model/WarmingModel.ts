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
    blurb: 'Today’s greenhouse gases trap some heat. This is the greenhouse effect.',
  },
  {
    id: 'clean',
    name: '2. Cleaner air',
    co2: 0.15,
    blurb: 'Fewer greenhouse gases — more heat escapes to space. Earth stays cooler.',
  },
  {
    id: 'factories',
    name: '3. Burn fossil fuels',
    co2: 0.85,
    blurb: 'Coal, oil, and gas add CO₂. A thicker blanket traps more heat → global warming.',
  },
  {
    id: 'trees',
    name: '4. Cut fewer trees',
    co2: 0.28,
    blurb: 'Trees take in CO₂. Keeping forests helps keep the gas blanket thinner.',
  },
]

/**
 * Global warming mechanism model for Grade 8.
 * Extra greenhouse gases thicken Earth’s “blanket,” so more outgoing heat returns to the surface.
 */
export class WarmingModel implements TModel {
  public readonly co2LevelProperty: NumberProperty
  public readonly temperatureProperty: NumberProperty
  public readonly timeProperty: NumberProperty
  public readonly runningProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly showTipsProperty: BooleanProperty
  public readonly showAdvancedProperty: BooleanProperty
  public readonly statusProperty: StringProperty
  public readonly tipProperty: StringProperty
  public readonly whyProperty: StringProperty
  public readonly nextHintProperty: StringProperty
  /** Brief consequence line when the blanket is thick / Earth is hot. */
  public readonly effectProperty: StringProperty
  public readonly scenarioIdProperty: StringProperty

  public constructor() {
    this.co2LevelProperty = new NumberProperty(0.4)
    this.temperatureProperty = new NumberProperty(15)
    this.timeProperty = new NumberProperty(0)
    this.runningProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.showTipsProperty = new BooleanProperty(true)
    this.showAdvancedProperty = new BooleanProperty(false)
    this.statusProperty = new StringProperty(
      'Sunlight warms Earth. Drag the greenhouse-gas blanket thicker — watch heat stay and Earth warm.',
    )
    this.tipProperty = new StringProperty(
      'NOW: Some heat is trapped and sent back toward Earth.',
    )
    this.whyProperty = new StringProperty(
      'Why: CO₂ and other greenhouse gases absorb heat and re-radiate it (greenhouse effect).',
    )
    this.nextHintProperty = new StringProperty(
      'Next: try “Burn fossil fuels,” then “Cleaner air.”',
    )
    this.effectProperty = new StringProperty(
      'Result: Earth stays livable — but extra gases make it warmer over time.',
    )
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
    this.statusProperty.value = `${s.name}: ${s.blurb}`
    this.updateTeachingCopy()
    this.whyProperty.value = `Why: ${s.blurb}`
  }

  public step(dt: number): void {
    if (!this.runningProperty.value || dt <= 0) {
      return
    }
    const target = 10 + this.co2LevelProperty.value * 28
    const t = this.temperatureProperty.value
    this.temperatureProperty.value = t + (target - t) * Math.min(1, dt * 0.35)
    this.timeProperty.value += dt
  }

  public reset(): void {
    this.co2LevelProperty.value = 0.4
    this.temperatureProperty.value = 15
    this.timeProperty.value = 0
    this.runningProperty.value = true
    this.showTipsProperty.value = true
    this.showAdvancedProperty.value = false
    this.scenarioIdProperty.value = 'today'
    this.statusProperty.value =
      'Sunlight warms Earth. Drag the greenhouse-gas blanket thicker — watch heat stay and Earth warm.'
    this.updateTeachingCopy()
  }

  private updateTeachingCopy(): void {
    const co2 = this.co2LevelProperty.value
    const temp = 10 + co2 * 28
    if (co2 < 0.28) {
      this.tipProperty.value = 'NOW: Thin gas blanket — more heat escapes to space.'
      this.whyProperty.value =
        'Why: with fewer greenhouse gases, less heat is absorbed and sent back down.'
      this.nextHintProperty.value = 'Next: thicken the blanket (more CO₂) and compare.'
      this.effectProperty.value =
        'Result: cooler Earth. Extra heat can leave the planet into space.'
      this.statusProperty.value = `Cooler (~${temp.toFixed(0)} °C). More heat escapes to space.`
    }
    else if (co2 < 0.55) {
      this.tipProperty.value = 'NOW: Some heat is trapped and sent back toward Earth.'
      this.whyProperty.value =
        'Why: CO₂ and other greenhouse gases absorb heat and re-radiate it (greenhouse effect).'
      this.nextHintProperty.value = 'Next: try “Burn fossil fuels,” then “Cleaner air.”'
      this.effectProperty.value =
        'Result: Earth stays warm enough for life — extra gases tip us hotter.'
      this.statusProperty.value = `Warming (~${temp.toFixed(0)} °C). Greenhouse gases trap outgoing heat.`
    }
    else {
      this.tipProperty.value = 'NOW: Thick blanket — lots of heat is trapped (global warming).'
      this.whyProperty.value =
        'Why: more CO₂ (from burning fuels, cutting forests) traps more heat than escapes.'
      this.nextHintProperty.value = 'Next: thin the blanket again and watch temperature fall.'
      this.effectProperty.value =
        'Result: hotter Earth → heatwaves, melting ice, rising seas, stressed ecosystems.'
      this.statusProperty.value = `Hot (~${temp.toFixed(0)} °C). Extra greenhouse gases → global warming.`
    }
  }
}
