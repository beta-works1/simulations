import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/ForcesConstants.js'
import {
  createWaterPressureState,
  FLUIDS,
  stepWaterPressure,
  WaterPressureState,
  waterPressure,
} from '../../../shared/waterPressureModel.js'

export type WaterScenario = 'explore' | 'shallow' | 'deep'

export type FluidId = (typeof FLUIDS)[number]['id']

const SCENARIO_STATUS: Record<WaterScenario, string> = {
  explore: 'Explore — move the probe deeper and watch pressure rise with depth (P = ρgh).',
  shallow: 'Shallow probe: low depth means low gauge pressure and weak side jets.',
  deep: 'Deep probe: greater depth gives stronger pressure and faster jets.',
}

const SCENARIO_TIP: Record<WaterScenario, string> = {
  explore: 'In a fluid, pressure increases with depth because of the weight of fluid above.',
  shallow: 'Near the surface, there is less fluid column above — pressure is smaller.',
  deep: 'Deeper holes feel more water pushing in — jets shoot farther.',
}

const INITIAL_STATUS = SCENARIO_STATUS.explore

export class WaterPressureDepthModel implements TModel {
  public readonly fillHeightProperty: NumberProperty
  public readonly probeDepthProperty: NumberProperty
  public readonly fluidIdProperty: Property<FluidId>
  public readonly scenarioProperty: Property<WaterScenario>
  public readonly runningProperty: BooleanProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly probePressureProperty: NumberProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showJetsProperty: BooleanProperty
  public readonly showGaugeProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private state: WaterPressureState
  private readonly visitedScenarios = new Set<WaterScenario>(['explore'])
  private hasSeenShallow = false
  private hasSeenDeep = false
  private starAwarded = false

  public constructor() {
    this.fillHeightProperty = new NumberProperty(0.85)
    this.probeDepthProperty = new NumberProperty(0.55)
    this.fluidIdProperty = new Property<FluidId>('water')
    this.scenarioProperty = new Property<WaterScenario>('explore')
    this.runningProperty = new BooleanProperty(true)
    this.simSpeedProperty = new NumberProperty(1)
    this.state = createWaterPressureState()
    this.probePressureProperty = new NumberProperty(0)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showJetsProperty = new BooleanProperty(true)
    this.showGaugeProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(INITIAL_STATUS)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
    this.syncProbePressure()
  }

  public get rho(): number {
    return FLUIDS.find((f) => f.id === this.fluidIdProperty.value)?.rho ?? 1.0
  }

  public get jets(): WaterPressureState['jets'] {
    return this.state.jets
  }

  public setScenario(scenario: WaterScenario): void {
    this.scenarioProperty.value = scenario
    if (scenario === 'shallow') {
      this.probeDepthProperty.value = 0.25
      this.fillHeightProperty.value = 0.7
    }
    else if (scenario === 'deep') {
      this.probeDepthProperty.value = 0.85
      this.fillHeightProperty.value = 0.95
    }
    this.state = createWaterPressureState()
    this.syncProbePressure()
    this.runningProperty.value = true
    this.statusProperty.value = SCENARIO_STATUS[scenario]
    if (!this.visitedScenarios.has(scenario)) {
      this.visitedScenarios.add(scenario)
      this.showTip(SCENARIO_TIP[scenario])
    }
  }

  public setFluid(id: FluidId): void {
    this.fluidIdProperty.value = id
    this.state = createWaterPressureState()
    this.syncProbePressure()
    const label = FLUIDS.find((f) => f.id === id)?.label ?? id
    this.statusProperty.value = `Fluid changed to ${label} — denser fluids give higher pressure at the same depth.`
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Running — watch side jets grow stronger at greater depth.'
      : 'Paused — move the probe or change fluid, then press Play.'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value = 'Correct! Pressure in a fluid increases with depth.'
    }
    else {
      this.statusProperty.value = 'Not quite — deeper in a fluid means more weight above, so higher pressure.'
    }
  }

  private syncProbePressure(): void {
    const depthM = this.probeDepthProperty.value * this.fillHeightProperty.value * 2.5
    this.probePressureProperty.value = waterPressure(this.rho, depthM)
  }

  public step(dt: number): void {
    if (dt <= 0) return
    const scaledDt = dt * clamp(this.simSpeedProperty.value, 0.25, 3)
    this.syncProbePressure()
    if (this.runningProperty.value) {
      this.timeProperty.value += scaledDt
      this.state = stepWaterPressure(
        this.state,
        scaledDt,
        this.runningProperty.value,
        this.fillHeightProperty.value,
        this.probeDepthProperty.value,
        this.rho,
        800,
        500,
      )
    }

    if (this.probeDepthProperty.value < 0.35) this.hasSeenShallow = true
    if (this.probeDepthProperty.value > 0.7) this.hasSeenDeep = true

    if (!this.starAwarded && this.hasSeenShallow && this.hasSeenDeep) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.statusProperty.value = 'Nice! You compared shallow and deep pressure. ★'
      this.quizPromptsProperty.value += 1
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    this.fillHeightProperty.reset()
    this.probeDepthProperty.reset()
    this.fluidIdProperty.reset()
    this.scenarioProperty.reset()
    this.runningProperty.reset()
    this.simSpeedProperty.reset()
    this.state = createWaterPressureState()
    this.syncProbePressure()
    this.showLabelsProperty.reset()
    this.showJetsProperty.reset()
    this.showGaugeProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = INITIAL_STATUS
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.timeProperty.reset()
    this.hasSeenShallow = false
    this.hasSeenDeep = false
    this.starAwarded = false
    this.visitedScenarios.clear()
    this.visitedScenarios.add('explore')
  }
}
