import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { CarbonConstants } from '../../common/CarbonColors.js'

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
export type ScenarioKind = 'none' | 'deforestation' | 'reforestation'

export function effectiveSunlight(isDay: boolean, sunlight: number): number {
  return isDay ? sunlight : 0
}

export function computeRates(
  plantCount: number,
  animalPopulation: number,
  factoryVehicleCount: number,
  deadMatterAmount: number,
  isDay: boolean,
  sunlightIntensity: number,
): ProcessRates {
  const sun = effectiveSunlight(isDay, sunlightIntensity)
  return {
    photosynthesis: (sun / 100) * plantCount * 1.35,
    respiration: (plantCount * 0.22 + animalPopulation * 0.55) * 1.15,
    decomposition: deadMatterAmount * 0.18,
    combustion: factoryVehicleCount * 2.1,
  }
}

export function netGasRates(rates: ProcessRates): { netCo2: number; netO2: number } {
  const netCo2 = rates.respiration + rates.decomposition + rates.combustion - rates.photosynthesis
  const netO2 = rates.photosynthesis - rates.respiration - rates.combustion * 0.7
  return { netCo2, netO2 }
}

export function balanceStatus(netCo2: number): BalanceStatus {
  if (netCo2 > 0.8) return 'CO₂ rising'
  if (netCo2 < -0.8) return 'O₂ rising'
  return 'Balanced'
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * clamp(t, 0, 1)
}

const SCENARIO_DURATION = 6

const EMPTY_RATES: ProcessRates = {
  photosynthesis: 0,
  respiration: 0,
  decomposition: 0,
  combustion: 0,
}

export class CarbonOxygenModel implements TModel {
  public readonly co2Property: NumberProperty
  public readonly o2Property: NumberProperty
  public readonly sunlightProperty: NumberProperty
  public readonly isDayProperty: BooleanProperty
  public readonly autoDayNightProperty: BooleanProperty
  public readonly plantCountProperty: NumberProperty
  public readonly animalCountProperty: NumberProperty
  public readonly factoryCountProperty: NumberProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly runningProperty: BooleanProperty
  public readonly deadMatterProperty: NumberProperty
  public readonly netCo2RateProperty: NumberProperty
  public readonly netO2RateProperty: NumberProperty
  public readonly scenarioProgressProperty: NumberProperty
  public readonly historyProperty: Property<GasSample[]>
  public readonly ratesProperty: Property<ProcessRates>
  public readonly statusProperty: StringProperty
  public readonly takeawayProperty: StringProperty
  public readonly balanceProperty: StringProperty
  public readonly activeProcessProperty: StringProperty
  public readonly scenarioKindProperty: StringProperty

  private time = 0
  private scenarioFrom: { plants: number; factories: number; animals: number } | null = null
  private scenarioUpdating = false

  public constructor() {
    this.co2Property = new NumberProperty(42)
    this.o2Property = new NumberProperty(58)
    this.sunlightProperty = new NumberProperty(80)
    this.isDayProperty = new BooleanProperty(true)
    this.autoDayNightProperty = new BooleanProperty(false)
    this.plantCountProperty = new NumberProperty(12)
    this.animalCountProperty = new NumberProperty(6)
    this.factoryCountProperty = new NumberProperty(2)
    this.simSpeedProperty = new NumberProperty(1)
    this.runningProperty = new BooleanProperty(true)
    this.deadMatterProperty = new NumberProperty(8)
    this.netCo2RateProperty = new NumberProperty(0)
    this.netO2RateProperty = new NumberProperty(0)
    this.scenarioProgressProperty = new NumberProperty(-1)
    this.historyProperty = new Property<GasSample[]>([{ co2: 42, o2: 58 }])
    this.ratesProperty = new Property<ProcessRates>({ ...EMPTY_RATES })
    this.statusProperty = new StringProperty(
      'Tap trees, animals, factory, or soil. Adjust sliders and watch how each process shifts CO₂ and O₂.',
    )
    this.takeawayProperty = new StringProperty('')
    this.balanceProperty = new StringProperty('Balanced')
    this.activeProcessProperty = new StringProperty('photosynthesis')
    this.scenarioKindProperty = new StringProperty('none')
    this.wireUserInputListeners()
    this.refreshDerived()
  }

  private wireUserInputListeners(): void {
    const cancelIfUserEdit = () => {
      if (this.scenarioActive && !this.scenarioUpdating) this.clearScenario()
    }
    this.plantCountProperty.lazyLink(cancelIfUserEdit)
    this.animalCountProperty.lazyLink(cancelIfUserEdit)
    this.factoryCountProperty.lazyLink(cancelIfUserEdit)
    this.sunlightProperty.lazyLink(cancelIfUserEdit)
  }

  public get scenarioActive(): boolean {
    return this.scenarioProgressProperty.value >= 0
  }

  private refreshDerived(): void {
    const rates = computeRates(
      this.plantCountProperty.value,
      this.animalCountProperty.value,
      this.factoryCountProperty.value,
      this.deadMatterProperty.value,
      this.isDayProperty.value,
      this.sunlightProperty.value,
    )
    const { netCo2, netO2 } = netGasRates(rates)
    this.ratesProperty.value = rates
    this.netCo2RateProperty.value = netCo2
    this.netO2RateProperty.value = netO2
    this.balanceProperty.value = balanceStatus(netCo2)
    this.activeProcessProperty.value =
      rates.photosynthesis > rates.respiration * 0.35 &&
      effectiveSunlight(this.isDayProperty.value, this.sunlightProperty.value) > 5
        ? 'photosynthesis'
        : 'respiration'
  }

  private clearScenario(): void {
    this.scenarioProgressProperty.value = -1
    this.scenarioFrom = null
    this.scenarioKindProperty.value = 'none'
  }

  public reset(): void {
    this.co2Property.value = 42
    this.o2Property.value = 58
    this.sunlightProperty.value = 80
    this.isDayProperty.value = true
    this.autoDayNightProperty.value = false
    this.plantCountProperty.value = 12
    this.animalCountProperty.value = 6
    this.factoryCountProperty.value = 2
    this.simSpeedProperty.value = 1
    this.runningProperty.value = true
    this.deadMatterProperty.value = 8
    this.historyProperty.value = [{ co2: 42, o2: 58 }]
    this.statusProperty.value =
      'Tap trees, animals, factory, or soil. Adjust sliders and watch how each process shifts CO₂ and O₂.'
    this.takeawayProperty.value = ''
    this.time = 0
    this.clearScenario()
    this.refreshDerived()
  }

  public step(dt: number): void {
    if (!this.runningProperty.value || dt <= 0) return
    const h = dt * this.simSpeedProperty.value

    if (this.scenarioActive) {
      const progress = Math.min(1, this.scenarioProgressProperty.value + h / SCENARIO_DURATION)
      const from = this.scenarioFrom ?? {
        plants: this.plantCountProperty.value,
        factories: this.factoryCountProperty.value,
        animals: this.animalCountProperty.value,
      }
      const kind = this.scenarioKindProperty.value
      this.scenarioUpdating = true
      if (kind === 'deforestation') {
        this.plantCountProperty.value = lerp(from.plants, 2, progress)
        this.factoryCountProperty.value = lerp(from.factories, 18, progress)
        this.animalCountProperty.value = lerp(from.animals, 3, progress)
        if (progress >= 0.25) {
          this.takeawayProperty.value =
            'Cutting forests and burning fuels raise CO₂ and lower O₂ — the cycle falls out of balance.'
        }
      } else if (kind === 'reforestation') {
        this.plantCountProperty.value = lerp(from.plants, 18, progress)
        this.factoryCountProperty.value = lerp(from.factories, 1, progress)
        this.animalCountProperty.value = lerp(from.animals, 10, progress)
        if (progress >= 0.25) {
          this.takeawayProperty.value =
            'More plants and fewer smokestacks pull CO₂ down and push O₂ up — the cycle moves toward balance.'
        }
      }
      this.isDayProperty.value = true
      this.autoDayNightProperty.value = false
      this.sunlightProperty.value = Math.max(this.sunlightProperty.value, 70)
      this.scenarioProgressProperty.value = progress >= 1 ? -1 : progress
      if (progress >= 1) {
        this.scenarioFrom = null
        this.scenarioKindProperty.value = 'none'
      }
      this.scenarioUpdating = false
    }

    if (this.autoDayNightProperty.value) {
      const phase = ((this.time + h) / CarbonConstants.DAY_NIGHT_PERIOD) % 1
      this.isDayProperty.value = phase < 0.5
    }

    const rates = computeRates(
      this.plantCountProperty.value,
      this.animalCountProperty.value,
      this.factoryCountProperty.value,
      this.deadMatterProperty.value,
      this.isDayProperty.value,
      this.sunlightProperty.value,
    )
    const { netCo2, netO2 } = netGasRates(rates)

    this.co2Property.value = clamp(
      this.co2Property.value + netCo2 * h,
      CarbonConstants.CO2_MIN,
      CarbonConstants.CO2_MAX,
    )
    this.o2Property.value = clamp(this.o2Property.value + netO2 * h, CarbonConstants.O2_MIN, CarbonConstants.O2_MAX)

    this.deadMatterProperty.value = clamp(4 + this.plantCountProperty.value * 0.55, 2, 22)

    const history = [...this.historyProperty.value, { co2: this.co2Property.value, o2: this.o2Property.value }]
    if (history.length > CarbonConstants.HISTORY_MAX) history.shift()
    this.historyProperty.value = history

    this.time += h
    this.refreshDerived()
  }

  public stepOnce(): void {
    this.step(0.05)
  }

  private startScenario(kind: ScenarioKind): void {
    this.scenarioFrom = {
      plants: this.plantCountProperty.value,
      factories: this.factoryCountProperty.value,
      animals: this.animalCountProperty.value,
    }
    this.scenarioProgressProperty.value = 0
    this.scenarioKindProperty.value = kind
    this.takeawayProperty.value = ''
    this.runningProperty.value = true
  }

  public startDeforestationScenario(): void {
    this.startScenario('deforestation')
    this.statusProperty.value = 'Deforestation + industry scenario running…'
  }

  public startReforestationScenario(): void {
    this.startScenario('reforestation')
    this.statusProperty.value = 'Reforestation scenario running — planting trees and cutting emissions…'
  }

  public cancelScenario(): void {
    this.clearScenario()
    this.takeawayProperty.value = ''
    this.statusProperty.value = 'Scenario cancelled. Adjust the ecosystem and keep exploring.'
  }

  public setSceneTip(zone: 'trees' | 'animals' | 'factory' | 'soil'): void {
    if (zone === 'trees') {
      this.statusProperty.value =
        'Photosynthesis: plants use sunlight to turn CO₂ + H₂O into food and release O₂. 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂'
    } else if (zone === 'animals') {
      this.statusProperty.value =
        'Respiration: animals (and plants at night) use O₂ and release CO₂. C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + energy'
    } else if (zone === 'factory') {
      this.statusProperty.value =
        'Combustion: burning fuels uses O₂ and releases CO₂ into the atmosphere.'
    } else {
      this.statusProperty.value =
        'Decomposition: bacteria and fungi break down dead matter and release CO₂.'
    }
  }

  public bumpPlants(delta: number): void {
    this.plantCountProperty.value = clamp(this.plantCountProperty.value + delta, 0, 20)
    this.clearScenario()
    this.refreshDerived()
  }

  public bumpAnimals(delta: number): void {
    this.animalCountProperty.value = clamp(this.animalCountProperty.value + delta, 0, 12)
    this.clearScenario()
    this.refreshDerived()
  }

  public bumpFactories(delta: number): void {
    this.factoryCountProperty.value = clamp(this.factoryCountProperty.value + delta, 0, 20)
    this.clearScenario()
    this.refreshDerived()
  }

  public bumpSunlight(delta: number): void {
    this.sunlightProperty.value = clamp(this.sunlightProperty.value + delta, 0, 100)
    this.refreshDerived()
  }

  public toggleDay(): void {
    this.isDayProperty.value = !this.isDayProperty.value
    this.autoDayNightProperty.value = false
    this.refreshDerived()
  }

  public toggleAutoDayNight(): void {
    this.autoDayNightProperty.value = !this.autoDayNightProperty.value
    this.refreshDerived()
  }
}
