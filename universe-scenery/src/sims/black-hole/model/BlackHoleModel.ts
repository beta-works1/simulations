import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/UniverseConstants.js'
import {
  BEND_CYCLE,
  BlackHolePhase,
  COLLAPSE_DURATION,
  phaseLabel,
  timelineProgress,
} from '../../../shared/blackHolePhysics.js'

export type BlackHoleScenario = 'explore' | 'collapse' | 'bending'

const SCENARIO_STATUS: Record<BlackHoleScenario, string> = {
  explore: 'Explore — scrub from stellar collapse to light bending at the event horizon.',
  collapse: 'Stellar collapse — watch the core shrink toward the event horizon.',
  bending: 'Light bending — photon paths curve and some fall past the event horizon.',
}

const SCENARIO_TIP: Record<BlackHoleScenario, string> = {
  explore: 'A massive star can collapse until gravity traps even light at the event horizon.',
  collapse: 'During collapse the star shrinks until nothing visible remains inside the horizon.',
  bending: 'Near a black hole, light paths bend — some photons escape, others are captured.',
}

export class BlackHoleModel implements TModel {
  public readonly scenarioProperty: Property<BlackHoleScenario>
  public readonly phaseProperty: Property<BlackHolePhase>
  public readonly collapseProgressProperty: NumberProperty
  public readonly bendTimeProperty: NumberProperty
  public readonly timelineProperty: NumberProperty
  public readonly runningProperty: BooleanProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showRaysProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private readonly visited = new Set<BlackHoleScenario>(['explore'])
  private scrubbed = false
  private starAwarded = false

  public constructor() {
    this.scenarioProperty = new Property<BlackHoleScenario>('explore')
    this.phaseProperty = new Property<BlackHolePhase>('collapse')
    this.collapseProgressProperty = new NumberProperty(0)
    this.bendTimeProperty = new NumberProperty(0)
    this.timelineProperty = new NumberProperty(0)
    this.runningProperty = new BooleanProperty(true)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showRaysProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(SCENARIO_STATUS.explore)
    this.tipTextProperty = new StringProperty('')
    this.tipsProperty = new NumberProperty(0)
    this.quizPromptsProperty = new NumberProperty(0)
    this.timeProperty = new NumberProperty(0)
  }

  public get phaseLabelText(): string {
    return phaseLabel(this.phaseProperty.value)
  }

  public setScenario(scenario: BlackHoleScenario): void {
    this.scenarioProperty.value = scenario
    this.runningProperty.value = true
    if (scenario === 'explore') {
      this.applyScrubState(0)
    }
    else if (scenario === 'collapse') {
      this.phaseProperty.value = 'collapse'
      this.collapseProgressProperty.value = 0.35
      this.bendTimeProperty.value = 0
      this.syncTimeline()
    }
    else {
      this.phaseProperty.value = 'bending'
      this.collapseProgressProperty.value = 1
      this.bendTimeProperty.value = 2
      this.syncTimeline()
    }
    this.statusProperty.value = SCENARIO_STATUS[scenario]
    if (!this.visited.has(scenario)) {
      this.visited.add(scenario)
      this.showTip(SCENARIO_TIP[scenario])
    }
  }

  public scrubTimeline(t: number): void {
    this.applyScrubState(clamp(t, 0, 1))
    this.scrubbed = true
    this.runningProperty.value = false
    this.statusProperty.value = `${this.phaseLabelText} — timeline ${(this.timelineProperty.value * 100).toFixed(0)}%`
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Running — collapse then light-bending cycle.'
      : 'Paused — scrub the timeline to jump ahead.'
  }

  public toggleShowRays(): void {
    this.showRaysProperty.value = !this.showRaysProperty.value
    this.statusProperty.value = this.showRaysProperty.value
      ? 'Photon paths visible — watch light bend near the horizon.'
      : 'Photon paths hidden.'
  }

  public onQuiz(correct: boolean): void {
    this.statusProperty.value = correct
      ? 'Correct! The event horizon is the boundary where light cannot escape.'
      : 'Not quite — a black hole has no solid surface; the event horizon is the light-trap boundary.'
    if (correct) this.starsProperty.value += 1
  }

  public step(dt: number): void {
    if (dt <= 0) return
    if (this.runningProperty.value) {
      this.timeProperty.value += dt
      if (this.phaseProperty.value === 'collapse') {
        const next = this.collapseProgressProperty.value + dt / COLLAPSE_DURATION
        if (next >= 1) {
          this.phaseProperty.value = 'bending'
          this.collapseProgressProperty.value = 1
          this.bendTimeProperty.value = 0
        }
        else {
          this.collapseProgressProperty.value = next
        }
      }
      else {
        this.bendTimeProperty.value = (this.bendTimeProperty.value + dt) % BEND_CYCLE
      }
      this.syncTimeline()
      this.statusProperty.value = this.phaseProperty.value === 'collapse'
        ? `${this.phaseLabelText} — ${(this.collapseProgressProperty.value * 100).toFixed(0)}%`
        : this.phaseLabelText
    }
    if (!this.starAwarded && this.scrubbed && this.visited.size >= 2) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.quizPromptsProperty.value += 1
    }
  }

  private applyScrubState(t: number): void {
    const u = clamp(t, 0, 1)
    if (u < 0.5) {
      this.phaseProperty.value = 'collapse'
      this.collapseProgressProperty.value = u / 0.5
      this.bendTimeProperty.value = 0
    }
    else {
      this.phaseProperty.value = 'bending'
      this.collapseProgressProperty.value = 1
      this.bendTimeProperty.value = ((u - 0.5) / 0.5) * BEND_CYCLE
    }
    this.syncTimeline()
  }

  private syncTimeline(): void {
    this.timelineProperty.value = timelineProgress(
      this.phaseProperty.value,
      this.collapseProgressProperty.value,
      this.bendTimeProperty.value,
    )
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    this.scenarioProperty.reset()
    this.phaseProperty.reset()
    this.collapseProgressProperty.reset()
    this.bendTimeProperty.reset()
    this.timelineProperty.reset()
    this.runningProperty.value = true
    this.showLabelsProperty.reset()
    this.showRaysProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.statusProperty.value = SCENARIO_STATUS.explore
    this.tipTextProperty.reset()
    this.tipsProperty.reset()
    this.quizPromptsProperty.reset()
    this.timeProperty.reset()
    this.visited.clear()
    this.visited.add('explore')
    this.scrubbed = false
    this.starAwarded = false
  }
}
