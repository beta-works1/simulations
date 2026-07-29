import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { clamp } from '../../../shared/UniverseConstants.js'
import {
  eventAtProgress,
  MAX_PROGRESS,
  MIN_PROGRESS,
  TimelineEvent,
} from '../../../shared/timelinePhysics.js'

export type TimelineScenario = 'explore' | 'formation' | 'exploration' | 'modern'

const SCENARIO_PROGRESS: Record<TimelineScenario, number> = {
  explore: 0,
  formation: 0,
  exploration: 6,
  modern: 8,
}

const SCENARIO_STATUS: Record<TimelineScenario, string> = {
  explore: 'Explore — scrub from solar system formation to modern observatories.',
  formation: 'Formation era — gas and dust collapse into the Sun and planets.',
  exploration: 'Exploration era — telescopes and the Apollo Moon landings.',
  modern: 'Modern era — space telescopes and rovers extend our reach.',
}

const SCENARIO_TIP: Record<TimelineScenario, string> = {
  explore: 'Cosmic time spans billions of years — human exploration is a blink at the end.',
  formation: 'About 4.6 billion years ago a cloud collapsed, forming the Sun and a dusty disk.',
  exploration: 'From Galileo’s moons to Apollo 11, humans learned the solar system is vast.',
  modern: 'Hubble, rovers, and JWST keep rewriting what we know about our cosmic neighborhood.',
}

const TIMELINE_SPEED = 0.35

export class SolarSystemTimelineModel implements TModel {
  public readonly scenarioProperty: Property<TimelineScenario>
  public readonly progressProperty: NumberProperty
  public readonly runningProperty: BooleanProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipTextProperty: StringProperty
  public readonly tipsProperty: NumberProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly timeProperty: NumberProperty

  private readonly visited = new Set<TimelineScenario>(['explore'])
  private scrubbed = false
  private starAwarded = false

  public constructor() {
    this.scenarioProperty = new Property<TimelineScenario>('explore')
    this.progressProperty = new NumberProperty(0)
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

  public get currentEvent(): TimelineEvent {
    return eventAtProgress(this.progressProperty.value)
  }

  public setScenario(scenario: TimelineScenario): void {
    this.scenarioProperty.value = scenario
    this.progressProperty.value = SCENARIO_PROGRESS[scenario]
    this.runningProperty.value = true
    this.updateStatusFromEvent()
    if (!this.visited.has(scenario)) {
      this.visited.add(scenario)
      this.showTip(SCENARIO_TIP[scenario])
    }
  }

  public scrubProgress(value: number): void {
    this.progressProperty.value = clamp(value, MIN_PROGRESS, MAX_PROGRESS)
    this.scrubbed = true
    this.runningProperty.value = false
    this.updateStatusFromEvent()
  }

  public togglePlay(): void {
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Running — timeline advances through key milestones.'
      : 'Paused — scrub to any event on the timeline.'
  }

  public onQuiz(correct: boolean): void {
    this.statusProperty.value = correct
      ? 'Correct! Apollo 11 (1969) was the first crewed Moon landing.'
      : 'Not quite — Voyager probes explored the outer planets; they did not land on the Moon.'
    if (correct) this.starsProperty.value += 1
  }

  public step(dt: number): void {
    if (dt <= 0) return
    if (this.runningProperty.value) {
      this.timeProperty.value += dt
      let next = this.progressProperty.value + TIMELINE_SPEED * dt
      if (next >= MAX_PROGRESS) {
        next = MAX_PROGRESS
        this.progressProperty.value = next
        this.runningProperty.value = false
        this.updateStatusFromEvent()
        return
      }
      this.progressProperty.value = next
      this.updateStatusFromEvent()
    }
    if (!this.starAwarded && this.scrubbed && this.visited.size >= 3) {
      this.starAwarded = true
      this.starsProperty.value += 1
      this.quizPromptsProperty.value += 1
    }
  }

  private updateStatusFromEvent(): void {
    const event = this.currentEvent
    this.statusProperty.value = `${event.yearLabel} — ${event.title}: ${event.description}`
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  public reset(): void {
    this.scenarioProperty.reset()
    this.progressProperty.reset()
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
    this.scrubbed = false
    this.starAwarded = false
  }
}
