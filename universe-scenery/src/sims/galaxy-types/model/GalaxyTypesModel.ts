import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import {
  galaxyById,
  GalaxyType,
  rotationSpeed,
} from '../../../shared/galaxyPhysics.js'

export type GalaxyScenario = 'explore' | 'spiral' | 'elliptical' | 'irregular'

const SCENARIO_TYPE: Record<GalaxyScenario, GalaxyType> = {
  explore: 'spiral',
  spiral: 'spiral',
  elliptical: 'elliptical',
  irregular: 'irregular',
}

const SCENARIO_STATUS: Record<GalaxyScenario, string> = {
  explore: 'Explore — compare galaxy shapes and watch spiral arms rotate.',
  spiral: 'Spiral galaxy — flat disk with rotating arms, like the Milky Way.',
  elliptical: 'Elliptical galaxy — smooth oval with older stars and little gas.',
  irregular: 'Irregular galaxy — no defined shape, often from collisions or star bursts.',
}

const SCENARIO_TIP: Record<GalaxyScenario, string> = {
  explore: 'Astronomers classify galaxies by shape: spiral, elliptical, or irregular.',
  spiral: 'Spiral arms trace regions where stars and gas orbit the galactic core.',
  elliptical: 'Elliptical galaxies look like smooth footballs — mostly old red stars.',
  irregular: 'Irregular galaxies can be stretched or clumpy when galaxies collide.',
}

export class GalaxyTypesModel implements TModel {
  public readonly scenarioProperty: Property<GalaxyScenario>
  public readonly selectedTypeProperty: Property<GalaxyType>
  public readonly rotationProperty: NumberProperty
  public readonly runningProperty: BooleanProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private readonly visited = new Set<GalaxyScenario>(['explore'])
  private triedTypes = new Set<GalaxyType>(['spiral'])
  private starAwarded = false

  public constructor() {
    this.scenarioProperty = new Property<GalaxyScenario>('explore')
    this.selectedTypeProperty = new Property<GalaxyType>('spiral')
    this.rotationProperty = new NumberProperty(0)
    this.runningProperty = new BooleanProperty(true)
    this.showLabelsProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(SCENARIO_STATUS.explore)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
  }

  public get selectedInfo() {
    return galaxyById(this.selectedTypeProperty.value)
  }

  public setScenario(scenario: GalaxyScenario): void {
    this.scenarioProperty.value = scenario
    this.selectedTypeProperty.value = SCENARIO_TYPE[scenario]
    this.runningProperty.value = true
    this.statusProperty.value = SCENARIO_STATUS[scenario]
    this.registerTried(this.selectedTypeProperty.value)
    if (!this.visited.has(scenario)) {
      this.visited.add(scenario)
      this.showTip(SCENARIO_TIP[scenario])
    }
  }

  public selectType(type: GalaxyType): void {
    this.selectedTypeProperty.value = type
    this.registerTried(type)
    const info = galaxyById(type)
    this.statusProperty.value = `${info.label}: ${info.description}`
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Running — spiral arms rotate as stars orbit the core.'
      : 'Paused — pick another galaxy type to compare.'
  }

  public onQuiz(correct: boolean): void {
    this.statusProperty.value = correct
      ? 'Correct! Spiral galaxies have rotating arms of stars and gas.'
      : 'Not quite — galaxies are not all spheres; spirals have flat disks and arms.'
    if (correct) this.starsProperty.value += 1
  }

  public step(dt: number): void {
    if (dt <= 0) return
    if (this.runningProperty.value) {
      this.timeProperty.value += dt
      const speed = rotationSpeed(this.selectedTypeProperty.value)
      this.rotationProperty.value = (this.rotationProperty.value + speed * dt) % 360
    }
    if (!this.starAwarded && this.triedTypes.size >= 3) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.quizPromptsProperty.value += 1
    }
  }

  private registerTried(type: GalaxyType): void {
    this.triedTypes.add(type)
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    this.scenarioProperty.reset()
    this.selectedTypeProperty.reset()
    this.rotationProperty.reset()
    this.runningProperty.value = true
    this.showLabelsProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = SCENARIO_STATUS.explore
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.timeProperty.reset()
    this.visited.clear()
    this.visited.add('explore')
    this.triedTypes.clear()
    this.triedTypes.add('spiral')
    this.starAwarded = false
  }
}
