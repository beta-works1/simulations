import { BooleanProperty, NumberProperty, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/ReactionsConstants.js'
import { EQUATIONS, countAtoms, defaultCoefficients, isBalanced } from '../../../shared/balanceEquationsModel.js'
import type { EquationSpec, MoleculeSpec } from '../../../shared/balanceEquationsModel.js'

export const MIN_COEFFICIENT = 1
export const MAX_COEFFICIENT = 6

/** Per-equation starter status, indexed to match EQUATIONS. */
const EQUATION_STATUS: readonly string[] = [
  'Adjust the coefficients so hydrogen and oxygen atoms match on both sides.',
  'Adjust the coefficients so nitrogen and hydrogen atoms match on both sides.',
  'Adjust the coefficients so iron and oxygen atoms match on both sides.',
  'Adjust the coefficients so carbon, hydrogen, and oxygen atoms all match.',
]

/**
 * Dense ecology-style control surface for the balance-equations (conservation of atoms) lab.
 */
export class BalanceEquationsModel implements TModel {
  public readonly equationIndexProperty: NumberProperty
  public readonly runningProperty: BooleanProperty
  public readonly simSpeedProperty: NumberProperty
  /** Accumulates only while running \u2014 drives the gentle atom-rearrange animation. */
  public readonly animTimeProperty: NumberProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showAtomCountsProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  /** Flips whenever a new hint/tip should pop up (view lazyLinks this to trigger the tip card). */
  public readonly tipsProperty: BooleanProperty
  /** Flips whenever the quick-check quiz should appear. */
  public readonly quizPromptsProperty: BooleanProperty
  /** Flips whenever the active equation's molecule set changes (view rebuilds coefficient sliders). */
  public readonly equationRebuiltProperty: BooleanProperty
  public readonly balancedProperty: BooleanProperty
  /** Flips whenever the equation freshly becomes balanced (view triggers particles + sound + slider resync). */
  public readonly celebrateProperty: BooleanProperty

  private coefficients: Record<string, number>
  private readonly balancedBefore = new Set<number>()
  private hintStep = 0

  public constructor() {
    this.equationIndexProperty = new NumberProperty(0)
    this.runningProperty = new BooleanProperty(true)
    this.simSpeedProperty = new NumberProperty(1)
    this.animTimeProperty = new NumberProperty(0)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showAtomCountsProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(EQUATION_STATUS[0])
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new BooleanProperty(false)
    this.quizPromptsProperty = new BooleanProperty(false)
    this.equationRebuiltProperty = new BooleanProperty(false)
    this.balancedProperty = new BooleanProperty(false)
    this.celebrateProperty = new BooleanProperty(false)

    this.coefficients = defaultCoefficients(EQUATIONS[0])

    this.equationIndexProperty.lazyLink((index) => {
      this.coefficients = defaultCoefficients(EQUATIONS[index])
      this.hintStep = 0
      this.equationRebuiltProperty.value = !this.equationRebuiltProperty.value
      this.statusProperty.value = EQUATION_STATUS[index] ?? EQUATION_STATUS[0]
      this.refreshBalanced(false)
    })
  }

  public get equation(): EquationSpec {
    return EQUATIONS[this.equationIndexProperty.value]
  }

  public get molecules(): MoleculeSpec[] {
    return [...this.equation.reactants, ...this.equation.products]
  }

  /** Live snapshot of the current equation's coefficients, keyed by molecule id. */
  public getCoefficients(): Readonly<Record<string, number>> {
    return this.coefficients
  }

  public getCoefficient(id: string): number {
    return this.coefficients[id] ?? 1
  }

  public setEquation(index: number): void {
    this.equationIndexProperty.value = clamp(index, 0, EQUATIONS.length - 1)
  }

  public setCoefficient(id: string, value: number): void {
    const snapped = clamp(Math.round(value), MIN_COEFFICIENT, MAX_COEFFICIENT)
    if (this.coefficients[id] === snapped) return
    this.coefficients[id] = snapped
    this.refreshBalanced(true)
  }

  public incrementCoefficient(id: string, delta: number): void {
    this.setCoefficient(id, this.getCoefficient(id) + delta)
  }

  public autoBalance(): void {
    this.coefficients = { ...this.equation.balanced }
    this.statusProperty.value = 'Auto-balanced! Notice how every atom now matches on both sides.'
    this.refreshBalanced(true)
  }

  public hint(): void {
    const eq = this.equation
    const left = countAtoms(eq.reactants, this.coefficients)
    const right = countAtoms(eq.products, this.coefficients)
    const keys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort()
    const mismatch = keys.find((k) => (left[k] ?? 0) !== (right[k] ?? 0))
    if (!mismatch) {
      this.showTip('This equation is already balanced \u2014 every atom matches on both sides!')
      return
    }
    const l = left[mismatch] ?? 0
    const r = right[mismatch] ?? 0
    this.hintStep++
    if (this.hintStep % 2 === 1) {
      this.showTip(
        `Count the ${mismatch} atoms: reactants have ${l}, products have ${r}. Look for a molecule containing ${mismatch}.`,
      )
    }
    else {
      const heavierSide = l > r ? 'reactants' : 'products'
      this.showTip(`There are more ${mismatch} atoms on the ${heavierSide} side. Raise a coefficient on the other side to catch up.`)
    }
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
  }

  public onQuiz(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value =
        'Correct! Balancing conserves the number of atoms of every element \u2014 mass is never created or destroyed.'
    }
    else {
      this.statusProperty.value = 'Not quite \u2014 balancing is about keeping atom counts (and mass) equal, not appearance.'
    }
  }

  private refreshBalanced(userAction: boolean): void {
    const bal = isBalanced(this.equation, this.coefficients)
    if (bal === this.balancedProperty.value) {
      if (userAction && !bal) {
        this.statusProperty.value = EQUATION_STATUS[this.equationIndexProperty.value] ?? EQUATION_STATUS[0]
      }
      return
    }
    this.balancedProperty.value = bal
    if (bal) {
      this.celebrateProperty.value = !this.celebrateProperty.value
      const firstTime = !this.balancedBefore.has(this.equationIndexProperty.value)
      this.balancedBefore.add(this.equationIndexProperty.value)
      this.statusProperty.value = 'Balanced! The number of atoms of each element matches on both sides.'
      if (firstTime) {
        this.starsProperty.value += 1
        this.quizPromptsProperty.value = !this.quizPromptsProperty.value
      }
    }
    else if (userAction) {
      this.statusProperty.value = EQUATION_STATUS[this.equationIndexProperty.value] ?? EQUATION_STATUS[0]
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value = !this.tipsProperty.value
  }

  public step(dt: number): void {
    if (dt <= 0 || !this.runningProperty.value) return
    const speed = clamp(this.simSpeedProperty.value, 0.25, 3)
    this.animTimeProperty.value += dt * speed
  }

  public reset(): void {
    this.equationIndexProperty.reset()
    this.runningProperty.reset()
    this.simSpeedProperty.reset()
    this.animTimeProperty.reset()
    this.showLabelsProperty.reset()
    this.showAtomCountsProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.coefficients = defaultCoefficients(EQUATIONS[0])
    this.hintStep = 0
    this.balancedBefore.clear()
    this.statusProperty.value = EQUATION_STATUS[0]
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.equationRebuiltProperty.reset()
    this.balancedProperty.value = false
    this.celebrateProperty.reset()
  }
}
