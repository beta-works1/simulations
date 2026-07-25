import { BooleanProperty, NumberProperty, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/EcologyConstants.js'

export interface WarmingScenario {
  id: string
  name: string
  co2: number
  blurb: string
}

/** Short Class-8 stories — core lesson uses “Start here”; extras stay under More options. */
export const WARMING_SCENARIOS: WarmingScenario[] = [
  {
    id: 'today',
    name: '1. Start here (today)',
    co2: 0.4,
    blurb: 'A normal gas blanket. Watch heat bounce back to Earth.',
  },
  {
    id: 'clean',
    name: '2. Cleaner air',
    co2: 0.15,
    blurb: 'Thin gas blanket — more heat escapes to space. Earth stays cooler.',
  },
  {
    id: 'factories',
    name: '3. More factories',
    co2: 0.85,
    blurb: 'Thick gas blanket — lots of heat is trapped. Earth gets hotter.',
  },
  {
    id: 'trees',
    name: '4. More trees help',
    co2: 0.28,
    blurb: 'Plants take in CO₂, so the blanket can thin a little.',
  },
]

/**
 * Greenhouse / global warming mechanism — Class-8 carbon story.
 * Sunlight in → Earth warms → heat rises → gas blanket traps heat → temperature rises.
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
      'Drag the gas blanket thicker. Watch heat bounce back and Earth warm up.',
    )
    this.tipProperty = new StringProperty(
      'NOW: Medium blanket — some heat bounces back.',
    )
    this.whyProperty = new StringProperty(
      'Why: gases trap heat rising from Earth (greenhouse effect).',
    )
    this.nextHintProperty = new StringProperty(
      'Next: try Thicker, then Cleaner air.',
    )
    this.scenarioIdProperty = new StringProperty('today')

    this.co2LevelProperty.link(() => this.updateTeachingCopy())
  }

  public setCo2(value: number): void {
    this.co2LevelProperty.value = clamp(value, 0.05, 1)
  }

  /** Easy Class-8 nudges for the gas blanket. */
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
      'Sunlight warms Earth. Drag the gas blanket thicker — watch temperature rise.'
    this.updateTeachingCopy()
  }

  private updateTeachingCopy(): void {
    const co2 = this.co2LevelProperty.value
    const temp = 10 + co2 * 28
    if (co2 < 0.28) {
      this.tipProperty.value = 'NOW: Thin blanket — heat escapes to space.'
      this.whyProperty.value = 'Why: fewer gases → less heat trapped → cooler Earth.'
      this.nextHintProperty.value = 'Next: make the blanket thicker.'
      this.statusProperty.value = `Cooler (~${temp.toFixed(0)} °C). Thin blanket lets heat escape.`
    }
    else if (co2 < 0.55) {
      this.tipProperty.value = 'NOW: Medium blanket — some heat bounces back.'
      this.whyProperty.value = 'Why: gases trap heat rising from Earth (greenhouse effect).'
      this.nextHintProperty.value = 'Next: try More factories, then Cleaner air.'
      this.statusProperty.value = `Warming (~${temp.toFixed(0)} °C). Red dots bounce off the gas blanket.`
    }
    else {
      this.tipProperty.value = 'NOW: Thick blanket — lots of heat is trapped.'
      this.whyProperty.value = 'Why: more gases send more heat back down → hotter Earth.'
      this.nextHintProperty.value = 'Next: thin the blanket and compare.'
      this.statusProperty.value = `Hot (~${temp.toFixed(0)} °C). Thick blanket traps heat.`
    }
  }
}
