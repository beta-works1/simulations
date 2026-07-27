import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/PeriodicConstants.js'
import {
  CATEGORY_LABELS,
  ELEMENTS,
  ElementCategory,
  ElementInfo,
} from '../../../shared/elementsData.js'

export type Scenario = 'explore' | 'alkali' | 'noble' | 'halogen'

export const SCENARIO_CATEGORY: Record<Exclude<Scenario, 'explore'>, ElementCategory> = {
  alkali: 'alkali',
  noble: 'noble',
  halogen: 'halogen',
}

/** How many *distinct* elements a student must explore before the quick-check quiz appears. */
export const QUIZ_EXPLORE_THRESHOLD = 6

function membersOf(category: ElementCategory): readonly ElementInfo[] {
  return ELEMENTS.filter((e) => e.category === category)
}

/** Short teaching blurb (NOW / WHY / NEXT) keyed by element category. */
function triadFor(el: ElementInfo): [string, string, string] {
  switch (el.category) {
    case 'alkali':
      return [
        `${el.name} is an alkali metal (Group 1).`,
        'It has just 1 electron in its outer shell, which it loses easily — that is why alkali metals react so vigorously, especially with water.',
        'Try the "Alkali metals" tour to compare it with its family.',
      ]
    case 'alkaline':
      return [
        `${el.name} is an alkaline earth metal (Group 2).`,
        'It has 2 electrons in its outer shell. It is reactive, but less violently than the alkali metal right next to it.',
        'Compare it with its Group 1 neighbor to see how one extra electron changes reactivity.',
      ]
    case 'metalloid':
      return [
        `${el.name} is a metalloid.`,
        'Metalloids sit on the "staircase" of the periodic table — they share some properties with metals and some with nonmetals.',
        'Look at the other metalloids to see this in-between pattern repeat.',
      ]
    case 'halogen':
      return [
        `${el.name} is a halogen (Group 17).`,
        'It is just 1 electron short of a full outer shell, so it grabs electrons eagerly — halogens are very reactive nonmetals.',
        'Try the "Halogens" tour to compare it with the rest of its family.',
      ]
    case 'noble':
      return [
        `${el.name} is a noble gas (Group 18).`,
        'Its outer shell is completely full, so it almost never reacts with other elements.',
        'Compare its shells with the halogen right before it — one more electron makes a big difference!',
      ]
    case 'other-metal':
      return [
        `${el.name} is a metal.`,
        'Metals tend to lose electrons easily, conduct electricity well, and are shiny and malleable.',
        'Compare its electron configuration with a nonmetal in the same period.',
      ]
    case 'other-nonmetal':
    default:
      return [
        `${el.name} is a nonmetal.`,
        'Nonmetals are poor conductors of heat and electricity, and their atoms often gain or share electrons in reactions.',
        'Compare its electron shells with a metal in the same period.',
      ]
  }
}

/** "Did you know?" fact shown the first time a student visits an element. */
function tipFor(el: ElementInfo): string {
  const shellText = el.shells.join(', ')
  switch (el.category) {
    case 'alkali':
      return `${el.name} has electron configuration ${el.electronConfig} — one lonely electron in the outer shell makes alkali metals extremely reactive.`
    case 'alkaline':
      return `${el.name} has electron configuration ${el.electronConfig} — two outer electrons make alkaline earth metals reactive, but less so than Group 1.`
    case 'metalloid':
      return `${el.name} has shells of ${shellText} electrons and behaves partway between a metal and a nonmetal.`
    case 'halogen':
      return `${el.name} has electron configuration ${el.electronConfig} — one electron short of a full shell, so it reacts eagerly to grab one.`
    case 'noble':
      return `${el.name} has electron configuration ${el.electronConfig} — a completely full outer shell means it almost never reacts.`
    case 'other-metal':
      return `${el.name} has shells of ${shellText} electrons and, like most metals, loses electrons easily in reactions.`
    case 'other-nonmetal':
    default:
      return `${el.name} has shells of ${shellText} electrons. Nonmetals like this usually gain or share electrons rather than lose them.`
  }
}

function guidanceBodyFor(scenario: Scenario): string {
  switch (scenario) {
    case 'alkali':
      return 'Alkali metals (Group 1) have just 1 electron in their outer shell — that makes them extremely reactive.'
    case 'noble':
      return 'Noble gases (Group 18) have a completely full outer shell, so they almost never react.'
    case 'halogen':
      return 'Halogens (Group 17) are one electron short of a full shell — very reactive nonmetals.'
    case 'explore':
    default:
      return 'Click a tile in the table (or use the Element controls) to see its Bohr model. Try a tour button to explore a reactive family!'
  }
}

/**
 * Dense ecology-style control surface for the periodic-table-builder (Bohr model) lab.
 */
export class PeriodicTableModel implements TModel {
  /** Atomic number 1–18 of the currently displayed element. */
  public readonly selectedZProperty: NumberProperty
  public readonly scenarioProperty: Property<Scenario>
  /** Play/pause for the electron-spin animation. */
  public readonly runningProperty: BooleanProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly spinElectronsProperty: BooleanProperty
  public readonly showCategoryColorsProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  /** Flips whenever a new "Did you know?" tip should pop up. */
  public readonly tipsProperty: BooleanProperty
  /** Flips whenever the quick-check quiz should appear. */
  public readonly quizPromptsProperty: BooleanProperty
  /** Count of distinct elements explored so far (drives the quiz threshold). */
  public readonly exploredCountProperty: NumberProperty

  /** Accumulated spin time in seconds; advanced in step(), read by the view each frame. */
  public spinTime = 0

  private readonly exploredSymbols = new Set<string>()
  private quizAwarded = false

  public constructor() {
    this.selectedZProperty = new NumberProperty(6) // Carbon — familiar starting point
    this.scenarioProperty = new Property<Scenario>('explore')
    this.runningProperty = new BooleanProperty(true)
    this.simSpeedProperty = new NumberProperty(1)
    this.showLabelsProperty = new BooleanProperty(true)
    this.spinElectronsProperty = new BooleanProperty(true)
    this.showCategoryColorsProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty('')
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new BooleanProperty(false)
    this.quizPromptsProperty = new BooleanProperty(false)
    this.exploredCountProperty = new NumberProperty(0)

    this.markExplored(this.currentElement)
    this.statusProperty.value = this.statusFor(this.currentElement)

    this.selectedZProperty.lazyLink((z, oldZ) => {
      const snapped = clamp(Math.round(z), 1, 18)
      if (snapped !== z) {
        this.selectedZProperty.value = snapped
        return
      }
      if (oldZ !== undefined && oldZ !== null && snapped !== oldZ) {
        this.onElementChanged(this.currentElement)
      }
    })
  }

  public get currentElement(): ElementInfo {
    return ELEMENTS[clamp(Math.round(this.selectedZProperty.value), 1, 18) - 1]
  }

  public get triad(): [string, string, string] {
    return triadFor(this.currentElement)
  }

  public get guidanceBody(): string {
    return guidanceBodyFor(this.scenarioProperty.value)
  }

  public setElement(z: number): void {
    this.selectedZProperty.value = clamp(Math.round(z), 1, 18)
  }

  /** Step to the next/previous element; cycles within the active tour family when one is selected. */
  public stepElement(delta: number): void {
    const scenario = this.scenarioProperty.value
    if (scenario === 'explore') {
      const z = ((this.selectedZProperty.value - 1 + delta + 18) % 18) + 1
      this.setElement(z)
      return
    }
    const members = membersOf(SCENARIO_CATEGORY[scenario])
    const idx = members.findIndex((e) => e.z === this.currentElement.z)
    const nextIdx = ((idx + delta) % members.length + members.length) % members.length
    this.setElement(members[nextIdx].z)
  }

  public setScenario(scenario: Scenario): void {
    this.scenarioProperty.value = scenario
    if (scenario !== 'explore') {
      const members = membersOf(SCENARIO_CATEGORY[scenario])
      this.setElement(members[0].z)
    }
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value = 'Correct! Electrons orbit the nucleus in fixed shells, like planets around the sun.'
    }
    else {
      this.statusProperty.value = 'Not quite — in the Bohr model, electrons travel in fixed shells (orbits) around the nucleus.'
    }
  }

  private statusFor(el: ElementInfo): string {
    return `${el.name} (${el.symbol}) — ${CATEGORY_LABELS[el.category]}, electron config ${el.electronConfig}.`
  }

  private markExplored(el: ElementInfo): boolean {
    const firstVisit = !this.exploredSymbols.has(el.symbol)
    this.exploredSymbols.add(el.symbol)
    this.exploredCountProperty.value = this.exploredSymbols.size
    return firstVisit
  }

  private onElementChanged(el: ElementInfo): void {
    const firstVisit = this.markExplored(el)
    this.statusProperty.value = this.statusFor(el)
    if (firstVisit) {
      this.starsProperty.value += 1
      this.showTip(tipFor(el))
    }
    if (!this.quizAwarded && this.exploredSymbols.size >= QUIZ_EXPLORE_THRESHOLD) {
      this.quizAwarded = true
      this.quizPromptsProperty.value = !this.quizPromptsProperty.value
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value = !this.tipsProperty.value
  }

  public step(dt: number): void {
    if (dt <= 0 || !this.runningProperty.value || !this.spinElectronsProperty.value) {
      return
    }
    const speed = clamp(this.simSpeedProperty.value, 0.25, 3)
    this.spinTime += dt * speed
  }

  public reset(): void {
    this.selectedZProperty.reset()
    this.scenarioProperty.reset()
    this.runningProperty.reset()
    this.simSpeedProperty.reset()
    this.showLabelsProperty.reset()
    this.spinElectronsProperty.reset()
    this.showCategoryColorsProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.exploredCountProperty.reset()
    this.spinTime = 0
    this.exploredSymbols.clear()
    this.quizAwarded = false
    this.markExplored(this.currentElement)
    this.statusProperty.value = this.statusFor(this.currentElement)
  }
}
