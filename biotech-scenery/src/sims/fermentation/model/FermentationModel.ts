import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/BiotechConstants.js'

export type FermentationScenario = 'explore' | 'bread' | 'brewing' | 'optimal'

/** How much sim time between history-chart samples. */
const HISTORY_INTERVAL = 0.25
/** CO2 level that unlocks the first star and quiz prompt. */
const CO2_STAR_THRESHOLD = 50
const SUGAR_ADD_AMOUNT = 30

const SCENARIO_TEMP: Record<FermentationScenario, number> = {
  explore: 0.6,
  bread: 0.75,
  brewing: 0.45,
  optimal: 0.65,
}

const SCENARIO_YEAST: Record<FermentationScenario, number> = {
  explore: 20,
  bread: 40,
  brewing: 22,
  optimal: 30,
}

const SCENARIO_STATUS: Record<FermentationScenario, string> = {
  explore: 'Explore freely — adjust temperature and yeast, then watch sugar turn into CO₂ and alcohol.',
  bread: 'Bread dough: a warm kitchen and extra yeast make CO₂ quickly — that gas is what makes dough rise.',
  brewing: 'Brewing: a cooler, steady temperature ferments slowly for a smoother, more controlled flavor.',
  optimal: 'Optimal: yeast enzymes work fastest around this temperature — watch fermentation speed up.',
}

const SCENARIO_TIP: Record<FermentationScenario, string> = {
  explore: 'Yeast are single-celled fungi. Given sugar and warmth, they respire without oxygen (fermentation), releasing CO₂ and alcohol.',
  bread: 'The CO₂ gas produced by fermentation gets trapped in the dough\u2019s gluten network, forming the bubbles you see in baked bread.',
  brewing: 'Brewers control temperature closely — too cool and fermentation stalls, too warm and it produces off-flavors.',
  optimal: 'Like most enzymes, yeast enzymes have a "sweet spot" temperature. Too hot and the enzymes denature, slowing fermentation back down.',
}

/** Cool / Warm / Hot band used by the thermometer readout and slider display. */
export function tempBand(temp: number): 'Cool' | 'Warm' | 'Hot' {
  if (temp < 0.35) return 'Cool'
  if (temp < 0.7) return 'Warm'
  return 'Hot'
}

const INITIAL_STATUS = SCENARIO_STATUS.explore

/**
 * Yeast fermentation kinetics (PTB Grade 8 Ch 6 parity):
 *   rate = temp × yeast × 0.04 × dt
 *   used = min(sugar, rate × 8)
 *   sugar -= used; alcohol += used×0.45; co2 += used×0.55; yeast += used×0.05×temp
 */
export class FermentationModel implements TModel {
  public readonly scenarioProperty: Property<FermentationScenario>
  public readonly tempProperty: NumberProperty
  public readonly yeastProperty: NumberProperty
  public readonly sugarProperty: NumberProperty
  public readonly alcoholProperty: NumberProperty
  public readonly co2Property: NumberProperty
  public readonly runningProperty: BooleanProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly showBubblesProperty: BooleanProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  /** Increments every ~0.25s of running sim time; view lazy-links to push the history chart. */
  public readonly historyPushProperty: NumberProperty

  private readonly visitedScenarios = new Set<FermentationScenario>(['explore'])
  private historyTimer = 0
  private starAwarded = false

  public constructor() {
    this.scenarioProperty = new Property<FermentationScenario>('explore')
    this.tempProperty = new NumberProperty(0.6)
    this.yeastProperty = new NumberProperty(20)
    this.sugarProperty = new NumberProperty(100)
    this.alcoholProperty = new NumberProperty(0)
    this.co2Property = new NumberProperty(0)
    this.runningProperty = new BooleanProperty(true)
    this.simSpeedProperty = new NumberProperty(1)
    this.showBubblesProperty = new BooleanProperty(true)
    this.showLabelsProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(INITIAL_STATUS)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.historyPushProperty = new NumberProperty(0)
  }

  /** Switch scenario, applying its recipe temperature/yeast and starting a fresh batch. */
  public setScenario(scenario: FermentationScenario): void {
    this.scenarioProperty.value = scenario
    this.tempProperty.value = SCENARIO_TEMP[scenario]
    this.resetBatch()
    this.statusProperty.value = SCENARIO_STATUS[scenario]

    if (!this.visitedScenarios.has(scenario)) {
      this.visitedScenarios.add(scenario)
      this.showTip(SCENARIO_TIP[scenario])
    }
  }

  /** Starts a fresh batch (sugar/alcohol/CO2/yeast) using the current scenario's recipe, keeping temperature. */
  public resetBatch(): void {
    this.sugarProperty.value = 100
    this.alcoholProperty.value = 0
    this.co2Property.value = 0
    this.yeastProperty.value = SCENARIO_YEAST[this.scenarioProperty.value]
    this.starAwarded = false
    this.historyTimer = 0
  }

  /** Top up the substrate mid-batch instead of using the (deliberately absent) sugar slider. */
  public addSugar(): void {
    if (this.sugarProperty.value >= 99.5) {
      this.statusProperty.value = 'The batch already has plenty of sugar.'
      return
    }
    this.sugarProperty.value = Math.min(100, this.sugarProperty.value + SUGAR_ADD_AMOUNT)
    this.statusProperty.value = 'Added more sugar — fermentation has fresh fuel to keep going.'
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Fermenting — watch sugar convert into CO₂ bubbles and alcohol.'
      : 'Paused — tweak the conditions, then press Play to continue.'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value =
        'Correct! Warmer conditions speed up enzyme activity — until it gets too hot and the enzymes denature.'
    }
    else {
      this.statusProperty.value = 'Not quite — within a safe range, warmer conditions usually ferment faster.'
    }
  }

  public step(dt: number): void {
    if (dt <= 0 || !this.runningProperty.value) return
    const scaledDt = dt * clamp(this.simSpeedProperty.value, 0.25, 3)

    const temp = this.tempProperty.value
    const yeast = this.yeastProperty.value
    const rate = temp * yeast * 0.04 * scaledDt
    const sugarBefore = this.sugarProperty.value
    const used = Math.min(sugarBefore, rate * 8)

    this.sugarProperty.value = Math.max(0, sugarBefore - used)
    this.alcoholProperty.value = Math.min(100, this.alcoholProperty.value + used * 0.45)
    const co2After = Math.min(100, this.co2Property.value + used * 0.55)
    this.co2Property.value = co2After
    this.yeastProperty.value = Math.min(80, yeast + used * 0.05 * temp)

    if (!this.starAwarded && co2After >= CO2_STAR_THRESHOLD) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.statusProperty.value = 'CO₂ has passed 50 — this batch is fermenting well! ⭐'
      this.quizPromptsProperty.value += 1
    }
    else if (sugarBefore > 0.5 && this.sugarProperty.value <= 0.5) {
      this.statusProperty.value = 'All the sugar is used up — fermentation has stopped. Reset the batch to try again.'
    }

    this.historyTimer += scaledDt
    if (this.historyTimer >= HISTORY_INTERVAL) {
      this.historyTimer -= HISTORY_INTERVAL
      this.historyPushProperty.value += 1
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    this.scenarioProperty.reset()
    this.tempProperty.reset()
    this.yeastProperty.reset()
    this.sugarProperty.reset()
    this.alcoholProperty.reset()
    this.co2Property.reset()
    this.runningProperty.reset()
    this.simSpeedProperty.reset()
    this.showBubblesProperty.reset()
    this.showLabelsProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = INITIAL_STATUS
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.historyPushProperty.reset()
    this.starAwarded = false
    this.historyTimer = 0
    this.visitedScenarios.clear()
    this.visitedScenarios.add('explore')
  }
}
