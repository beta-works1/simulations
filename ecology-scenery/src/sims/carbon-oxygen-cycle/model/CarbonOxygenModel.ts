import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp, lerp } from '../../../shared/EcologyConstants.js'

export const HISTORY_MAX = 180
export const CO2_MIN = 5
export const CO2_MAX = 95
export const O2_MIN = 5
export const O2_MAX = 95
export const DAY_NIGHT_PERIOD = 16

const SCENARIO_DURATION = 6

export interface GasSample {
  co2: number
  o2: number
}

export interface ProcessRates {
  photosynthesis: number
  respiration: number
  decomposition: number
  combustion: number
}

export type BalanceStatus = 'Balanced' | 'CO₂ rising' | 'O₂ rising'

type ScenarioFrom = {
  plantCount: number
  factoryVehicleCount: number
  animalPopulation: number
}

/**
 * Carbon–oxygen cycle model — photosynthesis, respiration, decomposition, combustion.
 */
export class CarbonOxygenModel implements TModel {
  public readonly co2LevelProperty: NumberProperty
  public readonly o2LevelProperty: NumberProperty
  public readonly sunlightIntensityProperty: NumberProperty
  public readonly isDayProperty: BooleanProperty
  public readonly autoDayNightProperty: BooleanProperty
  public readonly plantCountProperty: NumberProperty
  public readonly animalPopulationProperty: NumberProperty
  public readonly factoryVehicleCountProperty: NumberProperty
  public readonly deadMatterAmountProperty: NumberProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly timeProperty: NumberProperty
  public readonly runningProperty: BooleanProperty
  public readonly historyProperty: Property<GasSample[]>
  public readonly netCo2RateProperty: NumberProperty
  public readonly netO2RateProperty: NumberProperty
  public readonly photosynthesisRateProperty: NumberProperty
  public readonly respirationRateProperty: NumberProperty
  public readonly decompositionRateProperty: NumberProperty
  public readonly combustionRateProperty: NumberProperty
  public readonly balanceStatusProperty: StringProperty
  public readonly activeEquationProperty: StringProperty
  public readonly takeawayProperty: Property<string | null>
  public readonly statusProperty: StringProperty
  public readonly scenarioProgressProperty: Property<number | null>

  private scenarioFrom: ScenarioFrom | null = null

  public constructor() {
    this.co2LevelProperty = new NumberProperty(42)
    this.o2LevelProperty = new NumberProperty(58)
    this.sunlightIntensityProperty = new NumberProperty(80)
    this.isDayProperty = new BooleanProperty(true)
    this.autoDayNightProperty = new BooleanProperty(false)
    this.plantCountProperty = new NumberProperty(12)
    this.animalPopulationProperty = new NumberProperty(6)
    this.factoryVehicleCountProperty = new NumberProperty(2)
    this.deadMatterAmountProperty = new NumberProperty(8)
    this.simSpeedProperty = new NumberProperty(1)
    this.timeProperty = new NumberProperty(0)
    this.runningProperty = new BooleanProperty(true)
    this.historyProperty = new Property<GasSample[]>([{ co2: 42, o2: 58 }])
    this.netCo2RateProperty = new NumberProperty(0)
    this.netO2RateProperty = new NumberProperty(0)
    this.photosynthesisRateProperty = new NumberProperty(0)
    this.respirationRateProperty = new NumberProperty(0)
    this.decompositionRateProperty = new NumberProperty(0)
    this.combustionRateProperty = new NumberProperty(0)
    this.balanceStatusProperty = new StringProperty('Balanced')
    this.activeEquationProperty = new StringProperty('photosynthesis')
    this.takeawayProperty = new Property<string | null>(null)
    this.statusProperty = new StringProperty(
      'Daylight drives photosynthesis — plants take in CO₂ and release O₂.',
    )
    this.scenarioProgressProperty = new Property<number | null>(null)
    this.refreshRates()
  }

  public effectiveSunlight(): number {
    return this.isDayProperty.value ? this.sunlightIntensityProperty.value : 0
  }

  public computeRates(): ProcessRates {
    const sun = this.effectiveSunlight()
    const plants = this.plantCountProperty.value
    const animals = this.animalPopulationProperty.value
    const factories = this.factoryVehicleCountProperty.value
    const dead = this.deadMatterAmountProperty.value

    return {
      photosynthesis: (sun / 100) * plants * 1.35,
      respiration: (plants * 0.22 + animals * 0.55) * 1.15,
      decomposition: dead * 0.18,
      combustion: factories * 2.1,
    }
  }

  public static netGasRates(rates: ProcessRates): { netCo2: number; netO2: number } {
    const netCo2 = rates.respiration + rates.decomposition + rates.combustion - rates.photosynthesis
    const netO2 = rates.photosynthesis - rates.respiration - rates.combustion * 0.7
    return { netCo2, netO2 }
  }

  public static balanceStatus(netCo2: number): BalanceStatus {
    if (netCo2 > 0.8) return 'CO₂ rising'
    if (netCo2 < -0.8) return 'O₂ rising'
    return 'Balanced'
  }

  private refreshRates(): void {
    const rates = this.computeRates()
    const { netCo2, netO2 } = CarbonOxygenModel.netGasRates(rates)
    this.photosynthesisRateProperty.value = rates.photosynthesis
    this.respirationRateProperty.value = rates.respiration
    this.decompositionRateProperty.value = rates.decomposition
    this.combustionRateProperty.value = rates.combustion
    this.netCo2RateProperty.value = netCo2
    this.netO2RateProperty.value = netO2
    this.balanceStatusProperty.value = CarbonOxygenModel.balanceStatus(netCo2)

    if (rates.photosynthesis > rates.respiration * 0.35 && this.effectiveSunlight() > 5) {
      this.activeEquationProperty.value = 'photosynthesis'
    }
    else {
      this.activeEquationProperty.value = 'respiration'
    }
  }

  public toggleDay(): void {
    this.autoDayNightProperty.value = false
    this.isDayProperty.value = !this.isDayProperty.value
    this.refreshRates()
    this.statusProperty.value = this.isDayProperty.value
      ? 'Day — sunlight powers photosynthesis.'
      : 'Night — photosynthesis pauses; respiration continues.'
  }

  public toggleAutoDayNight(): void {
    this.autoDayNightProperty.value = !this.autoDayNightProperty.value
    this.statusProperty.value = this.autoDayNightProperty.value
      ? 'Auto day/night cycling enabled.'
      : 'Auto day/night off — toggle Day/Night manually.'
  }

  public toggleRunning(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value ? 'Simulation running.' : 'Paused.'
  }

  public startDeforestationScenario(): void {
    this.scenarioProgressProperty.value = 0
    this.scenarioFrom = {
      plantCount: this.plantCountProperty.value,
      factoryVehicleCount: this.factoryVehicleCountProperty.value,
      animalPopulation: this.animalPopulationProperty.value,
    }
    this.takeawayProperty.value = null
    this.isDayProperty.value = true
    this.autoDayNightProperty.value = false
    this.sunlightIntensityProperty.value = Math.max(this.sunlightIntensityProperty.value, 75)
    this.runningProperty.value = true
    this.statusProperty.value = 'Scenario: deforestation + industry…'
    this.refreshRates()
  }

  private advanceScenario(dt: number): void {
    const progress = Math.min(
      1,
      (this.scenarioProgressProperty.value ?? 0) + (dt * this.simSpeedProperty.value) / SCENARIO_DURATION,
    )
    const from = this.scenarioFrom ?? {
      plantCount: this.plantCountProperty.value,
      factoryVehicleCount: this.factoryVehicleCountProperty.value,
      animalPopulation: this.animalPopulationProperty.value,
    }
    const t = progress
    const done = progress >= 1

    this.plantCountProperty.value = lerp(from.plantCount, 2, t)
    this.factoryVehicleCountProperty.value = lerp(from.factoryVehicleCount, 18, t)
    this.animalPopulationProperty.value = lerp(from.animalPopulation, 3, t)
    this.scenarioProgressProperty.value = done ? null : progress
    this.scenarioFrom = done ? null : from
    if (progress >= 0.25) {
      this.takeawayProperty.value =
        'Cutting forests and burning fuels raise CO₂ and lower O₂ — the cycle falls out of balance.'
    }
    this.isDayProperty.value = true
    this.autoDayNightProperty.value = false
    this.sunlightIntensityProperty.value = Math.max(this.sunlightIntensityProperty.value, 70)
  }

  public step(dt: number): void {
    if (!this.runningProperty.value) {
      this.refreshRates()
      return
    }

    if (this.scenarioProgressProperty.value !== null) {
      this.advanceScenario(dt)
    }

    const h = dt * this.simSpeedProperty.value

    if (this.autoDayNightProperty.value) {
      const phase = ((this.timeProperty.value + h) / DAY_NIGHT_PERIOD) % 1
      this.isDayProperty.value = phase < 0.5
    }

    this.refreshRates()
    const netCo2 = this.netCo2RateProperty.value
    const netO2 = this.netO2RateProperty.value

    this.co2LevelProperty.value = clamp(this.co2LevelProperty.value + netCo2 * h, CO2_MIN, CO2_MAX)
    this.o2LevelProperty.value = clamp(this.o2LevelProperty.value + netO2 * h, O2_MIN, O2_MAX)
    this.deadMatterAmountProperty.value = clamp(4 + this.plantCountProperty.value * 0.55, 2, 22)

    const sample: GasSample = {
      co2: this.co2LevelProperty.value,
      o2: this.o2LevelProperty.value,
    }
    const history = [...this.historyProperty.value, sample]
    if (history.length > HISTORY_MAX) {
      history.shift()
    }
    this.historyProperty.value = history
    this.timeProperty.value += h

    const takeaway = this.takeawayProperty.value
    if (takeaway) {
      this.statusProperty.value = takeaway
    }
    else {
      const bal = this.balanceStatusProperty.value
      const eq = this.activeEquationProperty.value
      this.statusProperty.value =
        `${bal} · ${eq === 'photosynthesis' ? 'Photosynthesis active' : 'Respiration dominant'} · ` +
        `CO₂ ${this.co2LevelProperty.value.toFixed(0)}% · O₂ ${this.o2LevelProperty.value.toFixed(0)}%`
    }
  }

  public reset(): void {
    this.scenarioFrom = null
    this.co2LevelProperty.reset()
    this.o2LevelProperty.reset()
    this.sunlightIntensityProperty.reset()
    this.isDayProperty.reset()
    this.autoDayNightProperty.reset()
    this.plantCountProperty.reset()
    this.animalPopulationProperty.reset()
    this.factoryVehicleCountProperty.reset()
    this.deadMatterAmountProperty.reset()
    this.simSpeedProperty.reset()
    this.timeProperty.reset()
    this.runningProperty.reset()
    this.historyProperty.reset()
    this.netCo2RateProperty.reset()
    this.netO2RateProperty.reset()
    this.photosynthesisRateProperty.reset()
    this.respirationRateProperty.reset()
    this.decompositionRateProperty.reset()
    this.combustionRateProperty.reset()
    this.balanceStatusProperty.reset()
    this.activeEquationProperty.reset()
    this.takeawayProperty.reset()
    this.statusProperty.reset()
    this.scenarioProgressProperty.reset()
    this.refreshRates()
  }
}
