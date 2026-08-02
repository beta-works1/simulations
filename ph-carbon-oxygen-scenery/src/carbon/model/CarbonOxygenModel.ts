import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { CarbonConstants } from '../../common/CarbonColors.js'
import {
  AGENT_LIMITS,
  buildAgentsForCounts,
  clampNorm,
  countAgents,
  layoutSlot,
  nextAgentId,
  type AgentKind,
  type LandscapeAgent,
} from './agents.js'
import {
  cycleStepById,
  type CycleStepId,
  dominantProcess,
} from './cycleSteps.js'

export interface GasSample {
  co2: number
  o2: number
}

export interface ProcessRates {
  photosynthesis: number
  respiration: number
  decomposition: number
  combustion: number
  /** CO₂ dissolved / taken up by the ocean sink. */
  oceanAbsorb: number
}

export type BalanceStatus = 'Balanced' | 'CO₂ rising' | 'O₂ rising'
export type ScenarioKind = 'none' | 'deforestation' | 'reforestation'

/** Illustrative baseline CO₂ (%) — oceans pull harder above this. */
const OCEAN_BASELINE_CO2 = 38

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
  oceanStrength: number,
  co2Level: number,
): ProcessRates {
  const sun = effectiveSunlight(isDay, sunlightIntensity)
  const excess = Math.max(0, co2Level - OCEAN_BASELINE_CO2)
  // Per-agent rates scaled for toy counts (≤8 / 6 / 4)
  return {
    photosynthesis: (sun / 100) * plantCount * 2.2,
    respiration: (plantCount * 0.18 + animalPopulation * 0.85) * 1.15,
    decomposition: deadMatterAmount * 0.18,
    combustion: factoryVehicleCount * 4.5,
    oceanAbsorb: oceanStrength * 0.22 * (0.35 + excess / 40),
  }
}

export function netGasRates(rates: ProcessRates): { netCo2: number; netO2: number } {
  const netCo2 =
    rates.respiration + rates.decomposition + rates.combustion - rates.photosynthesis - rates.oceanAbsorb
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

const EMPTY_RATES: ProcessRates = {
  photosynthesis: 0,
  respiration: 0,
  decomposition: 0,
  combustion: 0,
  oceanAbsorb: 0,
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
  public readonly oceanStrengthProperty: NumberProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly runningProperty: BooleanProperty
  public readonly deadMatterProperty: NumberProperty
  public readonly netCo2RateProperty: NumberProperty
  public readonly netO2RateProperty: NumberProperty
  public readonly scenarioProgressProperty: NumberProperty
  public readonly historyProperty: Property<GasSample[]>
  public readonly ratesProperty: Property<ProcessRates>
  public readonly photosynthesisRateProperty: NumberProperty
  public readonly respirationRateProperty: NumberProperty
  public readonly decompositionRateProperty: NumberProperty
  public readonly combustionRateProperty: NumberProperty
  public readonly oceanAbsorbRateProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly takeawayProperty: StringProperty
  public readonly balanceProperty: StringProperty
  public readonly activeProcessProperty: StringProperty
  public readonly cycleStepProperty: Property<CycleStepId>
  public readonly scenarioKindProperty: StringProperty
  public readonly soundEnabledProperty: BooleanProperty
  /** Placeable landscape toys — source of truth for plant/animal/factory counts. */
  public readonly agentsProperty: Property<LandscapeAgent[]>

  private time = 0
  private scenarioUpdating = false
  private syncingRatesFromEnv = false
  private applyingRateSlider = false
  private syncingAgentsFromCounts = false
  private syncingCountsFromAgents = false

  public constructor() {
    this.co2Property = new NumberProperty(42)
    this.o2Property = new NumberProperty(58)
    this.sunlightProperty = new NumberProperty(80)
    this.isDayProperty = new BooleanProperty(true)
    this.autoDayNightProperty = new BooleanProperty(false)
    this.plantCountProperty = new NumberProperty(5)
    this.animalCountProperty = new NumberProperty(3)
    this.factoryCountProperty = new NumberProperty(1)
    this.oceanStrengthProperty = new NumberProperty(6)
    this.simSpeedProperty = new NumberProperty(1)
    this.runningProperty = new BooleanProperty(true)
    this.deadMatterProperty = new NumberProperty(7)
    this.netCo2RateProperty = new NumberProperty(0)
    this.netO2RateProperty = new NumberProperty(0)
    this.scenarioProgressProperty = new NumberProperty(-1)
    this.historyProperty = new Property<GasSample[]>([{ co2: 42, o2: 58 }])
    this.ratesProperty = new Property<ProcessRates>({ ...EMPTY_RATES })
    this.photosynthesisRateProperty = new NumberProperty(0)
    this.respirationRateProperty = new NumberProperty(0)
    this.decompositionRateProperty = new NumberProperty(0)
    this.combustionRateProperty = new NumberProperty(0)
    this.oceanAbsorbRateProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(
      'Drag trees, animals, or factories onto the land. Watch gases come from each one.',
    )
    this.takeawayProperty = new StringProperty('')
    this.balanceProperty = new StringProperty('Balanced')
    this.activeProcessProperty = new StringProperty('photosynthesis')
    this.cycleStepProperty = new Property<CycleStepId>('free')
    this.scenarioKindProperty = new StringProperty('none')
    this.soundEnabledProperty = new BooleanProperty(true)
    this.agentsProperty = new Property<LandscapeAgent[]>(
      buildAgentsForCounts(5, 3, 1),
    )
    this.wireUserInputListeners()
    this.wireRateSliderListeners()
    this.refreshDerived()
  }

  public get scenarioActive(): boolean {
    return this.scenarioProgressProperty.value >= 0
  }

  private wireUserInputListeners(): void {
    const cancelIfUserEdit = () => {
      if (this.scenarioActive && !this.scenarioUpdating) this.clearScenario()
    }
    this.plantCountProperty.lazyLink(cancelIfUserEdit)
    this.animalCountProperty.lazyLink(cancelIfUserEdit)
    this.factoryCountProperty.lazyLink(cancelIfUserEdit)
    this.oceanStrengthProperty.lazyLink(cancelIfUserEdit)
    this.sunlightProperty.lazyLink(cancelIfUserEdit)
    this.agentsProperty.lazyLink(cancelIfUserEdit)

    const cancelTourIfUserEdit = () => {
      if (this.applyingRateSlider || this.syncingAgentsFromCounts || this.scenarioUpdating) return
      if (this.cycleStepProperty.value !== 'free') this.cycleStepProperty.value = 'free'
    }
    this.agentsProperty.lazyLink(cancelTourIfUserEdit)
    this.oceanStrengthProperty.lazyLink(cancelTourIfUserEdit)
    this.sunlightProperty.lazyLink(cancelTourIfUserEdit)

    const onEnvChange = () => {
      if (this.applyingRateSlider || this.scenarioUpdating) return
      if (!this.syncingCountsFromAgents) {
        this.syncAgentsFromCounts()
      }
      this.deadMatterProperty.value = clamp(3 + this.plantCountProperty.value * 0.7, 2, 16)
      this.refreshDerived()
    }
    this.plantCountProperty.lazyLink(onEnvChange)
    this.animalCountProperty.lazyLink(onEnvChange)
    this.factoryCountProperty.lazyLink(onEnvChange)
    this.oceanStrengthProperty.lazyLink(onEnvChange)
    this.sunlightProperty.lazyLink(onEnvChange)
    this.isDayProperty.lazyLink(onEnvChange)

    this.agentsProperty.lazyLink(() => {
      if (this.syncingAgentsFromCounts) return
      this.syncCountsFromAgents()
      this.deadMatterProperty.value = clamp(3 + this.plantCountProperty.value * 0.7, 2, 16)
      this.refreshDerived()
    })
  }

  private wireRateSliderListeners(): void {
    this.photosynthesisRateProperty.lazyLink((v) => {
      if (this.syncingRatesFromEnv) return
      this.applyPhotosynthesisRate(v)
    })
    this.respirationRateProperty.lazyLink((v) => {
      if (this.syncingRatesFromEnv) return
      this.applyRespirationRate(v)
    })
    this.decompositionRateProperty.lazyLink((v) => {
      if (this.syncingRatesFromEnv) return
      this.applyDecompositionRate(v)
    })
    this.combustionRateProperty.lazyLink((v) => {
      if (this.syncingRatesFromEnv) return
      this.applyCombustionRate(v)
    })
    this.oceanAbsorbRateProperty.lazyLink((v) => {
      if (this.syncingRatesFromEnv) return
      this.applyOceanAbsorbRate(v)
    })
  }

  private syncCountsFromAgents(): void {
    this.syncingCountsFromAgents = true
    const agents = this.agentsProperty.value
    this.plantCountProperty.value = countAgents(agents, 'plant')
    this.animalCountProperty.value = countAgents(agents, 'animal')
    this.factoryCountProperty.value = countAgents(agents, 'factory')
    this.syncingCountsFromAgents = false
  }

  private syncAgentsFromCounts(): void {
    if (this.syncingCountsFromAgents) return
    const wantP = Math.round(clamp(this.plantCountProperty.value, 0, AGENT_LIMITS.plant))
    const wantA = Math.round(clamp(this.animalCountProperty.value, 0, AGENT_LIMITS.animal))
    const wantF = Math.round(clamp(this.factoryCountProperty.value, 0, AGENT_LIMITS.factory))
    const cur = this.agentsProperty.value
    const haveP = countAgents(cur, 'plant')
    const haveA = countAgents(cur, 'animal')
    const haveF = countAgents(cur, 'factory')
    if (haveP === wantP && haveA === wantA && haveF === wantF) return

    this.syncingAgentsFromCounts = true
    let next = [...cur]

    const trim = (kind: AgentKind, want: number) => {
      const ofKind = next.filter((a) => a.kind === kind)
      if (ofKind.length > want) {
        const removeIds = new Set(ofKind.slice(want).map((a) => a.id))
        next = next.filter((a) => !removeIds.has(a.id))
      } else {
        while (countAgents(next, kind) < want) {
          const i = countAgents(next, kind)
          const slot = layoutSlot(kind, i, want)
          next.push({ id: nextAgentId(kind), kind, ...slot })
        }
      }
    }
    trim('plant', wantP)
    trim('animal', wantA)
    trim('factory', wantF)
    this.agentsProperty.value = next
    this.syncingAgentsFromCounts = false
  }

  /** Drop a new agent onto the land (normalized land coords). */
  public addAgent(kind: AgentKind, nx: number, ny: number): boolean {
    const limit = AGENT_LIMITS[kind]
    if (countAgents(this.agentsProperty.value, kind) >= limit) {
      this.statusProperty.value = `Max ${limit} ${kind === 'plant' ? 'trees' : kind === 'animal' ? 'animals' : 'factories'} — drag one off to remove.`
      return false
    }
    this.clearScenario()
    const agent: LandscapeAgent = {
      id: nextAgentId(kind),
      kind,
      nx: clampNorm(nx),
      ny: clampNorm(ny),
    }
    this.agentsProperty.value = [...this.agentsProperty.value, agent]
    this.statusProperty.value =
      kind === 'plant'
        ? 'Tree planted — it makes O₂ in daylight.'
        : kind === 'animal'
          ? 'Animal added — it breathes out CO₂.'
          : 'Factory added — it burns fuel and releases CO₂.'
    return true
  }

  public removeAgent(id: string): void {
    this.clearScenario()
    this.agentsProperty.value = this.agentsProperty.value.filter((a) => a.id !== id)
    this.statusProperty.value = 'Removed — watch how the gases change.'
  }

  public moveAgent(id: string, nx: number, ny: number): void {
    this.agentsProperty.value = this.agentsProperty.value.map((a) =>
      a.id === id ? { ...a, nx: clampNorm(nx), ny: clampNorm(ny) } : a,
    )
  }

  /** Agents of a kind with absolute scene coordinates for particle spawn. */
  public agentsOfKind(kind: AgentKind): LandscapeAgent[] {
    return this.agentsProperty.value.filter((a) => a.kind === kind)
  }

  private refreshDerived(): void {
    const rates = computeRates(
      this.plantCountProperty.value,
      this.animalCountProperty.value,
      this.factoryCountProperty.value,
      this.deadMatterProperty.value,
      this.isDayProperty.value,
      this.sunlightProperty.value,
      this.oceanStrengthProperty.value,
      this.co2Property.value,
    )
    const { netCo2, netO2 } = netGasRates(rates)
    this.ratesProperty.value = rates
    this.netCo2RateProperty.value = netCo2
    this.netO2RateProperty.value = netO2
    this.balanceProperty.value = balanceStatus(netCo2)
    this.activeProcessProperty.value = dominantProcess(rates)

    if (!this.applyingRateSlider) {
      this.syncingRatesFromEnv = true
      this.photosynthesisRateProperty.value = rates.photosynthesis
      this.respirationRateProperty.value = rates.respiration
      this.decompositionRateProperty.value = rates.decomposition
      this.combustionRateProperty.value = rates.combustion
      this.oceanAbsorbRateProperty.value = rates.oceanAbsorb
      this.syncingRatesFromEnv = false
    }
  }

  private applyPhotosynthesisRate(target: number): void {
    this.applyingRateSlider = true
    this.clearScenario()
    this.cycleStepProperty.value = 'free'
    if (!this.isDayProperty.value) this.isDayProperty.value = true
    this.autoDayNightProperty.value = false
    if (this.sunlightProperty.value < 15) this.sunlightProperty.value = 80
    const sunFrac = this.sunlightProperty.value / 100
    let plants = sunFrac > 0.01 ? target / (sunFrac * 2.2) : 0
    plants = clamp(plants, 0, AGENT_LIMITS.plant)
    this.plantCountProperty.value = plants
    this.statusProperty.value = 'Photosynthesis linked to trees + sunlight.'
    this.refreshDerived()
    this.applyingRateSlider = false
  }

  private applyRespirationRate(target: number): void {
    this.applyingRateSlider = true
    this.clearScenario()
    this.cycleStepProperty.value = 'free'
    const plants = this.plantCountProperty.value
    const animals = clamp((target / 1.15 - plants * 0.18) / 0.85, 0, AGENT_LIMITS.animal)
    this.animalCountProperty.value = animals
    this.statusProperty.value = 'Respiration linked to animals.'
    this.refreshDerived()
    this.applyingRateSlider = false
  }

  private applyDecompositionRate(target: number): void {
    this.applyingRateSlider = true
    this.clearScenario()
    this.cycleStepProperty.value = 'free'
    const dead = clamp(target / 0.18, 2, 16)
    this.deadMatterProperty.value = dead
    this.plantCountProperty.value = clamp((dead - 3) / 0.7, 0, AGENT_LIMITS.plant)
    this.statusProperty.value = 'Decomposition linked to soil / plant cover.'
    this.refreshDerived()
    this.applyingRateSlider = false
  }

  private applyCombustionRate(target: number): void {
    this.applyingRateSlider = true
    this.clearScenario()
    this.cycleStepProperty.value = 'free'
    this.factoryCountProperty.value = clamp(target / 4.5, 0, AGENT_LIMITS.factory)
    this.statusProperty.value = 'Combustion linked to factories.'
    this.refreshDerived()
    this.applyingRateSlider = false
  }

  private applyOceanAbsorbRate(target: number): void {
    this.applyingRateSlider = true
    this.clearScenario()
    this.cycleStepProperty.value = 'free'
    const excess = Math.max(0.35, 0.35 + Math.max(0, this.co2Property.value - OCEAN_BASELINE_CO2) / 40)
    this.oceanStrengthProperty.value = clamp(target / (0.22 * excess), 0, 16)
    this.statusProperty.value = 'Ocean sink linked — pull more CO₂ from the air.'
    this.refreshDerived()
    this.applyingRateSlider = false
  }

  public setCycleStep(id: CycleStepId): void {
    this.clearScenario()
    this.cycleStepProperty.value = id
    if (id === 'free') {
      this.statusProperty.value = 'Free play — drag trees, animals, and factories onto the land.'
      this.takeawayProperty.value = ''
      this.refreshDerived()
      return
    }
    const step = cycleStepById(id)
    if (!step) return
    this.applyingRateSlider = true
    this.isDayProperty.value = step.preset.isDay
    this.autoDayNightProperty.value = false
    this.sunlightProperty.value = step.preset.sunlight
    this.plantCountProperty.value = step.preset.plants
    this.animalCountProperty.value = step.preset.animals
    this.factoryCountProperty.value = step.preset.factories
    this.oceanStrengthProperty.value = step.preset.ocean
    this.deadMatterProperty.value = clamp(3 + step.preset.plants * 0.7, 2, 16)
    this.runningProperty.value = true
    this.takeawayProperty.value = ''
    this.statusProperty.value = `${step.guideTitle}: ${step.guideBody}`
    this.applyingRateSlider = false
    this.refreshDerived()
  }

  public nextCycleStep(): void {
    const order: CycleStepId[] = ['plants', 'breathe', 'decay', 'ocean', 'burn', 'free']
    const i = order.indexOf(this.cycleStepProperty.value)
    const next = order[Math.min(order.length - 1, Math.max(0, i) + 1)] ?? 'free'
    this.setCycleStep(next)
  }

  private clearScenario(): void {
    this.scenarioProgressProperty.value = -1
    this.scenarioKindProperty.value = 'none'
  }

  public reset(): void {
    this.co2Property.value = 42
    this.o2Property.value = 58
    this.sunlightProperty.value = 80
    this.isDayProperty.value = true
    this.autoDayNightProperty.value = false
    this.plantCountProperty.value = 5
    this.animalCountProperty.value = 3
    this.factoryCountProperty.value = 1
    this.oceanStrengthProperty.value = 6
    this.simSpeedProperty.value = 1
    this.runningProperty.value = true
    this.deadMatterProperty.value = 7
    this.historyProperty.value = [{ co2: 42, o2: 58 }]
    this.statusProperty.value =
      'Drag trees, animals, or factories onto the land. Watch gases come from each one.'
    this.takeawayProperty.value = ''
    this.cycleStepProperty.value = 'free'
    this.time = 0
    this.clearScenario()
    this.soundEnabledProperty.reset()
    this.syncingAgentsFromCounts = true
    this.agentsProperty.value = buildAgentsForCounts(5, 3, 1)
    this.syncingAgentsFromCounts = false
    this.refreshDerived()
  }

  public step(dt: number): void {
    if (!this.runningProperty.value || dt <= 0) return
    const h = dt * this.simSpeedProperty.value

    // Scenarios are applied instantly (see startScenario) — no auto-lerp movie.

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
      this.oceanStrengthProperty.value,
      this.co2Property.value,
    )
    const { netCo2, netO2 } = netGasRates(rates)

    this.co2Property.value = clamp(
      this.co2Property.value + netCo2 * h,
      CarbonConstants.CO2_MIN,
      CarbonConstants.CO2_MAX,
    )
    this.o2Property.value = clamp(this.o2Property.value + netO2 * h, CarbonConstants.O2_MIN, CarbonConstants.O2_MAX)

    const history = [...this.historyProperty.value, { co2: this.co2Property.value, o2: this.o2Property.value }]
    if (history.length > CarbonConstants.HISTORY_MAX) history.shift()
    this.historyProperty.value = history

    this.time += h
    this.refreshDerived()
  }

  public stepOnce(): void {
    this.step(0.05)
  }

  /**
   * Challenge cards — apply a starting world once. Student then plays;
   * nothing auto-animates. Cancel restores free play messaging.
   */
  private applyChallenge(kind: ScenarioKind): void {
    this.scenarioUpdating = true
    this.cycleStepProperty.value = 'free'
    if (kind === 'deforestation') {
      this.plantCountProperty.value = 2
      this.factoryCountProperty.value = 4
      this.animalCountProperty.value = 2
      this.oceanStrengthProperty.value = 4
      this.takeawayProperty.value =
        'Fewer trees + more factories → CO₂ rises. Drag trees back to recover.'
      this.statusProperty.value = 'Challenge: Deforestation — fix it by dragging agents.'
    } else if (kind === 'reforestation') {
      this.plantCountProperty.value = 8
      this.factoryCountProperty.value = 1
      this.animalCountProperty.value = 4
      this.oceanStrengthProperty.value = 8
      this.takeawayProperty.value =
        'More trees + fewer smokestacks → O₂ rises. Experiment from here.'
      this.statusProperty.value = 'Challenge: Reforestation — explore this healthier world.'
    }
    this.isDayProperty.value = true
    this.autoDayNightProperty.value = false
    this.sunlightProperty.value = Math.max(this.sunlightProperty.value, 70)
    this.runningProperty.value = true
    this.scenarioKindProperty.value = kind
    this.scenarioProgressProperty.value = -1 // not an animated scenario
    this.scenarioUpdating = false
    this.refreshDerived()
  }

  public startDeforestationScenario(): void {
    this.applyChallenge('deforestation')
  }

  public startReforestationScenario(): void {
    this.applyChallenge('reforestation')
  }

  public cancelScenario(): void {
    this.clearScenario()
    this.takeawayProperty.value = ''
    this.statusProperty.value = 'Challenge cleared. Keep dragging agents to explore.'
  }

  public setSceneTip(zone: 'trees' | 'animals' | 'factory' | 'soil' | 'ocean'): void {
    if (zone === 'trees') {
      this.statusProperty.value =
        'Photosynthesis: This tree takes CO₂ and releases O₂ in daylight. Drag to move · drag off land to remove.'
    } else if (zone === 'animals') {
      this.statusProperty.value =
        'Respiration: This animal uses O₂ and breathes out CO₂. Drag to move · drag off land to remove.'
    } else if (zone === 'factory') {
      this.statusProperty.value =
        'Combustion: This factory burns fuel → lots of CO₂. Drag to move · drag off land to remove.'
    } else if (zone === 'ocean') {
      this.statusProperty.value =
        'Oceans: CO₂ dissolves in seawater. Raise Ocean strength in Controls.'
    } else {
      this.statusProperty.value =
        'Decomposition: Dead matter in the soil releases CO₂. More trees → more leaf litter.'
    }
  }

  public bumpPlants(delta: number): void {
    this.plantCountProperty.value = clamp(this.plantCountProperty.value + delta, 0, AGENT_LIMITS.plant)
    this.clearScenario()
    this.refreshDerived()
  }

  public bumpAnimals(delta: number): void {
    this.animalCountProperty.value = clamp(this.animalCountProperty.value + delta, 0, AGENT_LIMITS.animal)
    this.clearScenario()
    this.refreshDerived()
  }

  public bumpFactories(delta: number): void {
    this.factoryCountProperty.value = clamp(this.factoryCountProperty.value + delta, 0, AGENT_LIMITS.factory)
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
