import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/ReactionsConstants.js'
import {
  createThermicState,
  resetThermicState,
  stepThermic,
  ThermicMode,
  ThermicState,
} from '../../../shared/exoEndoModel.js'

export type ThermicScenario = 'explore' | 'combustion' | 'meltingIce' | 'photosynthesis'

/** Scenarios that are flavors of a specific mode force that mode when selected. */
const SCENARIO_MODE: Partial<Record<ThermicScenario, ThermicMode>> = {
  combustion: 'exothermic',
  meltingIce: 'endothermic',
  photosynthesis: 'endothermic',
}

const SCENARIO_STATUS: Record<ThermicScenario, string> = {
  explore: 'Explore freely \u2014 switch between exothermic and endothermic reactions and watch the thermometer respond.',
  combustion: 'Combustion: burning fuel releases energy fast \u2014 the temperature climbs quickly (exothermic).',
  meltingIce: 'Melting ice: the reaction pulls heat in from its surroundings, so the temperature drops (endothermic).',
  photosynthesis: 'Photosynthesis-style: light energy is absorbed to build sugars \u2014 the surroundings feel cooler (endothermic).',
}

const SCENARIO_TIP: Record<ThermicScenario, string> = {
  explore:
    'Exothermic reactions release energy (often as heat) to their surroundings. Endothermic reactions absorb energy from their surroundings.',
  combustion:
    'Burning (combustion) is a classic exothermic reaction \u2014 chemical energy stored in the fuel is released as heat and light.',
  meltingIce:
    'Melting ice absorbs heat from its surroundings to break the bonds holding the solid together \u2014 that\u2019s why it feels cold (endothermic).',
  photosynthesis:
    'Plants absorb light energy during photosynthesis and store it as chemical energy in glucose \u2014 an endothermic process.',
}

const INITIAL_STATUS = SCENARIO_STATUS.explore

/** Temperature at/above which the reaction "counts" as clearly exothermic for star tracking. */
const EXO_SEEN_THRESHOLD = 40
/** Temperature at/below which the reaction "counts" as clearly endothermic for star tracking. */
const ENDO_SEEN_THRESHOLD = 14

/**
 * Exothermic vs endothermic energy lab (PTB Grade 8 Ch 4 parity):
 * wraps the shared thermic kinetics model with a full Property surface for
 * mode, scenario, conditions, display toggles, playback, and progress state.
 */
export class ExoEndoModel implements TModel {
  public readonly modeProperty: Property<ThermicMode>
  public readonly scenarioProperty: Property<ThermicScenario>
  public readonly runningProperty: BooleanProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly temperatureProperty: NumberProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showEnergyArrowsProperty: BooleanProperty
  public readonly showParticlesProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly modeSwitchesProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private state: ThermicState
  private readonly visitedScenarios = new Set<ThermicScenario>(['explore'])
  private hasSeenExo = false
  private hasSeenEndo = false
  private starAwarded = false

  public constructor() {
    this.modeProperty = new Property<ThermicMode>('exothermic')
    this.scenarioProperty = new Property<ThermicScenario>('explore')
    this.runningProperty = new BooleanProperty(true)
    this.simSpeedProperty = new NumberProperty(1)
    this.state = createThermicState()
    this.temperatureProperty = new NumberProperty(this.state.temperature)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showEnergyArrowsProperty = new BooleanProperty(true)
    this.showParticlesProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(INITIAL_STATUS)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.modeSwitchesProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
  }

  /** Direct mode switch (Mode buttons) — restarts the reaction from room temperature. */
  public setMode(mode: ThermicMode): void {
    if (this.modeProperty.value === mode) return
    this.modeProperty.value = mode
    this.scenarioProperty.value = 'explore'
    this.state = resetThermicState()
    this.temperatureProperty.value = this.state.temperature
    this.modeSwitchesProperty.value += 1
    this.statusProperty.value =
      mode === 'exothermic'
        ? 'Switched to exothermic \u2014 energy will be released as the reaction proceeds.'
        : 'Switched to endothermic \u2014 energy will be absorbed as the reaction proceeds.'
  }

  /** Scenario buttons — applies the scenario's mode (if any) and restarts the reaction. */
  public setScenario(scenario: ThermicScenario): void {
    this.scenarioProperty.value = scenario
    const targetMode = SCENARIO_MODE[scenario]
    if (targetMode && targetMode !== this.modeProperty.value) {
      this.modeProperty.value = targetMode
      this.modeSwitchesProperty.value += 1
    }
    this.state = resetThermicState()
    this.temperatureProperty.value = this.state.temperature
    this.runningProperty.value = true
    this.statusProperty.value = SCENARIO_STATUS[scenario]

    if (!this.visitedScenarios.has(scenario)) {
      this.visitedScenarios.add(scenario)
      this.showTip(SCENARIO_TIP[scenario])
    }
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Running \u2014 watch the thermometer and energy arrows respond to the reaction.'
      : 'Paused \u2014 flip the mode or scenario, then press Play to continue.'
  }

  /** Resets just the temperature/time back to room temperature without touching mode/scenario. */
  public resetTemp(): void {
    this.state = resetThermicState()
    this.temperatureProperty.value = this.state.temperature
    this.statusProperty.value = 'Temperature reset to room temperature (22\u00b0C).'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value =
        'Correct! In an exothermic reaction, energy is released to the surroundings \u2014 that\u2019s why it feels hot.'
    }
    else {
      this.statusProperty.value =
        'Not quite \u2014 exothermic means energy is released (given out) by the reaction, not taken in.'
    }
  }

  public step(dt: number): void {
    if (dt <= 0) return
    const scaledDt = dt * clamp(this.simSpeedProperty.value, 0.25, 3)
    if (this.runningProperty.value) {
      this.timeProperty.value += scaledDt
      this.state = stepThermic(this.state, scaledDt, this.modeProperty.value, true)
      this.temperatureProperty.value = this.state.temperature
    }

    if (this.modeProperty.value === 'exothermic' && this.temperatureProperty.value >= EXO_SEEN_THRESHOLD) {
      this.hasSeenExo = true
    }
    if (this.modeProperty.value === 'endothermic' && this.temperatureProperty.value <= ENDO_SEEN_THRESHOLD) {
      this.hasSeenEndo = true
    }

    if (!this.starAwarded && this.hasSeenExo && this.hasSeenEndo) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.statusProperty.value =
        'Great work! You\u2019ve seen both an exothermic reaction (releasing energy) and an endothermic one (absorbing energy). \u2b50'
      this.quizPromptsProperty.value += 1
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    this.modeProperty.reset()
    this.scenarioProperty.reset()
    this.runningProperty.reset()
    this.simSpeedProperty.reset()
    this.state = resetThermicState()
    this.temperatureProperty.value = this.state.temperature
    this.showLabelsProperty.reset()
    this.showEnergyArrowsProperty.reset()
    this.showParticlesProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = INITIAL_STATUS
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.modeSwitchesProperty.reset()
    this.timeProperty.reset()
    this.hasSeenExo = false
    this.hasSeenEndo = false
    this.starAwarded = false
    this.visitedScenarios.clear()
    this.visitedScenarios.add('explore')
  }
}
