import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { PHET_RESISTANCE, PHET_VOLTAGE, computeCurrentMilliamps } from '../../../shared/ohmPhysics.js'

export type OhmScenario = 'explore' | 'highVoltage' | 'highResistance' | 'openCircuit'

const SCENARIO_STATUS: Record<OhmScenario, string> = {
  explore: 'Explore — adjust voltage and resistance; watch I = V/R light the bulb.',
  highVoltage: 'High voltage — more push means more current and a brighter bulb.',
  highResistance: 'High resistance — the circuit resists flow; current and brightness drop.',
  openCircuit: 'Open circuit — the switch breaks the path so current is zero.',
}

const SCENARIO_TIP: Record<OhmScenario, string> = {
  explore: 'Current only flows when the switch is closed and the loop is complete.',
  highVoltage: 'I scales with V when R stays the same.',
  highResistance: 'I falls when R rises — Ohm\'s law in action.',
  openCircuit: 'An open switch means I = 0 no matter how large V is.',
}

const SCENARIO_VALUES: Record<OhmScenario, { v: number; r: number; closed: boolean }> = {
  explore: { v: 4.5, r: 500, closed: true },
  highVoltage: { v: 9, r: 200, closed: true },
  highResistance: { v: 3, r: 900, closed: true },
  openCircuit: { v: 4.5, r: 500, closed: false },
}

export class OhmLawCircuitModel implements TModel {
  public readonly voltageProperty: NumberProperty
  public readonly resistanceProperty: NumberProperty
  public readonly switchClosedProperty: BooleanProperty
  public readonly scenarioProperty: Property<OhmScenario>
  public readonly runningProperty: BooleanProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showFormulaProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private readonly visited = new Set<OhmScenario>(['explore'])
  private adjusted = false
  private starAwarded = false

  public constructor() {
    this.voltageProperty = new NumberProperty(PHET_VOLTAGE.default)
    this.resistanceProperty = new NumberProperty(PHET_RESISTANCE.default)
    this.switchClosedProperty = new BooleanProperty(true)
    this.scenarioProperty = new Property<OhmScenario>('explore')
    this.runningProperty = new BooleanProperty(true)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showFormulaProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(SCENARIO_STATUS.explore)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)

    this.voltageProperty.lazyLink(() => this.markAdjusted())
    this.resistanceProperty.lazyLink(() => this.markAdjusted())
  }

  public get milliamps(): number {
    if (!this.switchClosedProperty.value) return 0
    return computeCurrentMilliamps(this.voltageProperty.value, this.resistanceProperty.value)
  }

  public setScenario(scenario: OhmScenario): void {
    this.scenarioProperty.value = scenario
    const v = SCENARIO_VALUES[scenario]
    this.voltageProperty.value = v.v
    this.resistanceProperty.value = v.r
    this.switchClosedProperty.value = v.closed
    this.statusProperty.value = SCENARIO_STATUS[scenario]
    if (!this.visited.has(scenario)) {
      this.visited.add(scenario)
      this.showTip(SCENARIO_TIP[scenario])
    }
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Running — charge particles show current around the loop.'
      : 'Paused — tweak V, R, or the switch.'
  }

  public toggleSwitch(): void {
    this.switchClosedProperty.value = !this.switchClosedProperty.value
    this.markAdjusted()
    this.statusProperty.value = this.switchClosedProperty.value
      ? 'Switch closed — the circuit path is complete.'
      : 'Switch open — current is zero.'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value = 'Correct! I = V / R links voltage, current, and resistance.'
    }
    else {
      this.statusProperty.value = 'Not quite — current equals voltage divided by resistance.'
    }
  }

  public step(dt: number): void {
    if (dt <= 0) return
    if (this.runningProperty.value) this.timeProperty.value += dt
    if (!this.starAwarded && this.adjusted && this.visited.size >= 3) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.quizPromptsProperty.value += 1
    }
  }

  private markAdjusted(): void {
    this.adjusted = true
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    this.voltageProperty.reset()
    this.resistanceProperty.reset()
    this.switchClosedProperty.reset()
    this.scenarioProperty.reset()
    this.runningProperty.reset()
    this.showLabelsProperty.reset()
    this.showFormulaProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = SCENARIO_STATUS.explore
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.timeProperty.reset()
    this.adjusted = false
    this.starAwarded = false
    this.visited.clear()
    this.visited.add('explore')
  }
}
