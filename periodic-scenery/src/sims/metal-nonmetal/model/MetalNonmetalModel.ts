import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/PeriodicConstants.js'

export type MetalNonmetalScenario = 'explore' | 'conductivity' | 'reactivity' | 'compare'

export interface ElementSpec {
  symbol: string
  label: string
  color: string
}

/** PTB Grade 8 Ch 5 parity — a small representative set of metals and non-metals. */
export const METALS: readonly ElementSpec[] = [
  { symbol: 'Na', label: 'Sodium (Na)', color: '#bdc3c7' },
  { symbol: 'Mg', label: 'Magnesium (Mg)', color: '#aeb6bf' },
  { symbol: 'Al', label: 'Aluminum (Al)', color: '#95a5a6' },
  { symbol: 'Fe', label: 'Iron (Fe)', color: '#7f8c8d' },
]

export const NONMETALS: readonly ElementSpec[] = [
  { symbol: 'C', label: 'Carbon (C)', color: '#2c3e50' },
  { symbol: 'N', label: 'Nitrogen (N)', color: '#3498db' },
  { symbol: 'O', label: 'Oxygen (O)', color: '#e74c3c' },
  { symbol: 'Cl', label: 'Chlorine (Cl)', color: '#27ae60' },
]

/** Sea-of-electrons threshold: once the conductivity demo has run this long (sim seconds), it counts as "seen". */
const CONDUCTIVITY_SEEN_SECONDS = 1.5
/** Reactivity level that, combined with having seen conductivity, unlocks the star + quiz. */
const REACTIVITY_STAR_THRESHOLD = 0.7

const SCENARIO_STATUS: Record<MetalNonmetalScenario, string> = {
  explore: 'Explore freely — pick any metal and non-metal, then compare conductivity and reactivity.',
  conductivity: 'Conductivity lab: electrons flow freely through the metal wire but stay stuck in the non-metal.',
  reactivity: 'Reactivity lab: turn up reactivity and watch the metal react with the non-metal to form an oxide.',
  compare: 'Compare: metals are shiny, malleable, and conduct well — non-metals are dull, brittle, and mostly insulate.',
}

const SCENARIO_TIP: Record<MetalNonmetalScenario, string> = {
  explore:
    'Metals have loosely held outer (valence) electrons that move freely — that\u2019s what makes them good conductors and reactive with non-metals.',
  conductivity:
    'In a metal, outer electrons form a \u201csea of electrons\u201d that drifts and carries electric current. Non-metals hold their electrons tightly, so current can\u2019t flow easily.',
  reactivity:
    'When a metal reacts with a non-metal like oxygen, it loses electrons to form a compound (an oxide) \u2014 this is what causes rusting and corrosion.',
  compare:
    'Metals: shiny, malleable, ductile, good conductors. Non-metals: dull, brittle, poor conductors (except graphite, a form of carbon).',
}

const INITIAL_STATUS = SCENARIO_STATUS.explore

function cycleSymbol(list: readonly ElementSpec[], current: string): string {
  const idx = list.findIndex((e) => e.symbol === current)
  return list[(idx + 1) % list.length].symbol
}

export function findElement(list: readonly ElementSpec[], symbol: string): ElementSpec {
  return list.find((e) => e.symbol === symbol) ?? list[0]
}

/**
 * Metal vs non-metal properties lab (PTB Grade 8 Ch 5 parity):
 * conductivity is qualitative (metals conduct, non-metals mostly don't), while
 * reactivity is a 0-1 slider that drives an oxidation/rust demo.
 */
export class MetalNonmetalModel implements TModel {
  public readonly scenarioProperty: Property<MetalNonmetalScenario>
  public readonly metalProperty: Property<string>
  public readonly nonmetalProperty: Property<string>
  public readonly reactivityProperty: NumberProperty
  public readonly runningProperty: BooleanProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly showConductivityProperty: BooleanProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showSparksProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private readonly visitedScenarios = new Set<MetalNonmetalScenario>(['explore'])
  private conductivityTimer = 0
  private conductivitySeen = false
  private starAwarded = false

  public constructor() {
    this.scenarioProperty = new Property<MetalNonmetalScenario>('explore')
    this.metalProperty = new Property<string>('Fe')
    this.nonmetalProperty = new Property<string>('O')
    this.reactivityProperty = new NumberProperty(0.5)
    this.runningProperty = new BooleanProperty(true)
    this.simSpeedProperty = new NumberProperty(1)
    this.showConductivityProperty = new BooleanProperty(true)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showSparksProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(INITIAL_STATUS)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
  }

  public cycleMetal(): void {
    this.metalProperty.value = cycleSymbol(METALS, this.metalProperty.value)
    const info = findElement(METALS, this.metalProperty.value)
    this.statusProperty.value = `Now showing ${info.label} as the metal.`
  }

  public cycleNonmetal(): void {
    this.nonmetalProperty.value = cycleSymbol(NONMETALS, this.nonmetalProperty.value)
    const info = findElement(NONMETALS, this.nonmetalProperty.value)
    this.statusProperty.value = `Now showing ${info.label} as the non-metal.`
  }

  public setMetal(symbol: string): void {
    this.metalProperty.value = symbol
    const info = findElement(METALS, symbol)
    this.statusProperty.value = `Now showing ${info.label} as the metal.`
  }

  public setNonmetal(symbol: string): void {
    this.nonmetalProperty.value = symbol
    const info = findElement(NONMETALS, symbol)
    this.statusProperty.value = `Now showing ${info.label} as the non-metal.`
  }

  /** Switch scenario, applying its recipe defaults and refreshing the status/tip. */
  public setScenario(scenario: MetalNonmetalScenario): void {
    this.scenarioProperty.value = scenario
    this.statusProperty.value = SCENARIO_STATUS[scenario]

    if (scenario === 'conductivity') {
      this.showConductivityProperty.value = true
    }
    else if (scenario === 'reactivity') {
      this.reactivityProperty.value = 0.6
      this.runningProperty.value = true
    }
    else if (scenario === 'compare') {
      this.metalProperty.value = 'Fe'
      this.nonmetalProperty.value = 'O'
      this.showConductivityProperty.value = true
    }

    if (!this.visitedScenarios.has(scenario)) {
      this.visitedScenarios.add(scenario)
      this.showTip(SCENARIO_TIP[scenario])
    }
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Running — watch the electron flow and reactivity demo animate.'
      : 'Paused — tweak the materials or conditions, then press Play to continue.'
  }

  /** Resets materials/conditions to defaults without resetting scenario or panel toggles. */
  public resetDemo(): void {
    this.metalProperty.reset()
    this.nonmetalProperty.reset()
    this.reactivityProperty.reset()
    this.conductivityTimer = 0
    this.conductivitySeen = false
    this.starAwarded = false
    this.statusProperty.value = 'Demo reset — pick materials and try again.'
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value =
        'Correct! A metal\u2019s free, mobile electrons (the "sea of electrons") carry electric current through it.'
    }
    else {
      this.statusProperty.value = 'Not quite — metals conduct because their outer electrons are free to move, not fixed in place.'
    }
  }

  public step(dt: number): void {
    if (dt <= 0 || !this.runningProperty.value) return
    const scaledDt = dt * clamp(this.simSpeedProperty.value, 0.25, 3)
    this.timeProperty.value += scaledDt

    if (this.showConductivityProperty.value) {
      this.conductivityTimer += scaledDt
      if (!this.conductivitySeen && this.conductivityTimer >= CONDUCTIVITY_SEEN_SECONDS) {
        this.conductivitySeen = true
      }
    }

    if (!this.starAwarded && this.conductivitySeen && this.reactivityProperty.value > REACTIVITY_STAR_THRESHOLD) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.statusProperty.value = 'Great work! You\u2019ve seen both conductivity and a strong reaction — that\u2019s the sea of electrons at play! \u2b50'
      this.quizPromptsProperty.value += 1
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    this.scenarioProperty.reset()
    this.metalProperty.reset()
    this.nonmetalProperty.reset()
    this.reactivityProperty.reset()
    this.runningProperty.reset()
    this.simSpeedProperty.reset()
    this.showConductivityProperty.reset()
    this.showLabelsProperty.reset()
    this.showSparksProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = INITIAL_STATUS
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.timeProperty.reset()
    this.conductivityTimer = 0
    this.conductivitySeen = false
    this.starAwarded = false
    this.visitedScenarios.clear()
    this.visitedScenarios.add('explore')
  }
}
