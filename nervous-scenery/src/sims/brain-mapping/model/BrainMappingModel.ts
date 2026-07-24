import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { BRAIN_REGIONS, type BrainPart, type BrainRegionId } from './brainRegions.js'

export type BrainMode = 'study' | 'quiz' | 'mission' | 'scenario'

export type QuizQuestion = {
  prompt: string
  answerId: BrainRegionId
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  { prompt: 'Which lobe processes what your eyes see?', answerId: 'occipital' },
  { prompt: 'Which lobe controls voluntary movement and thinking?', answerId: 'frontal' },
  { prompt: 'Which lobe receives touch, pain, and temperature?', answerId: 'parietal' },
  { prompt: 'Which lobe is involved in hearing and memory?', answerId: 'temporal' },
  { prompt: 'Which part coordinates balance and muscle movements?', answerId: 'cerebellum' },
  { prompt: 'Which part controls heartbeat and breathing?', answerId: 'brainstem' },
]

/** The two regions a bike rider leans on most: balance (cerebellum) + planning (frontal). */
const SCENARIO_TARGET_IDS: BrainRegionId[] = ['cerebellum', 'frontal']

export class BrainMappingModel implements TModel {
  public readonly modeProperty: Property<BrainMode>
  public readonly selectedProperty: Property<BrainRegionId>
  public readonly quizIndexProperty: NumberProperty
  public readonly quizScoreProperty: NumberProperty
  public readonly quizAttemptsProperty: NumberProperty
  public readonly lastAnswerProperty: Property<'correct' | 'wrong' | null>
  public readonly feedbackUntilProperty: NumberProperty
  public readonly exploredCountProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly runningProperty: BooleanProperty
  public readonly quizUnlockedProperty: BooleanProperty
  public readonly quizRoundCompleteProperty: BooleanProperty
  public readonly missionCompleteProperty: BooleanProperty
  public readonly celebrateProperty: BooleanProperty
  public readonly partFilterProperty: Property<BrainPart | 'all'>
  public readonly starsProperty: NumberProperty

  /** Ecology-style depth additions: glow scrub, tips toggle, scenario mode, wrong-answer reveal. */
  public readonly glowIntensityProperty: NumberProperty
  public readonly tipsVisibleProperty: BooleanProperty
  public readonly revealCorrectIdProperty: Property<BrainRegionId | null>
  public readonly revealUntilProperty: NumberProperty
  public readonly scenarioProgressProperty: NumberProperty
  public readonly scenarioCompleteProperty: BooleanProperty

  /** Ecology-style sound toggle, mirrors reflex-arc / neuron-signal. */
  public readonly soundEnabledProperty: BooleanProperty

  private readonly explored = new Set<BrainRegionId>(['frontal'])
  private readonly quizCorrect = new Set<BrainRegionId>()
  private readonly missionParts = new Set<BrainPart>(['cerebrum'])
  private readonly scenarioFound = new Set<BrainRegionId>()
  private time = 0

  public constructor() {
    this.modeProperty = new Property<BrainMode>('study')
    this.selectedProperty = new Property<BrainRegionId>('frontal')
    this.quizIndexProperty = new NumberProperty(0)
    this.quizScoreProperty = new NumberProperty(0)
    this.quizAttemptsProperty = new NumberProperty(0)
    this.lastAnswerProperty = new Property<'correct' | 'wrong' | null>(null)
    this.feedbackUntilProperty = new NumberProperty(0)
    this.exploredCountProperty = new NumberProperty(1)
    this.statusProperty = new StringProperty(BRAIN_REGIONS[0].action)
    this.runningProperty = new BooleanProperty(true)
    this.quizUnlockedProperty = new BooleanProperty(false)
    this.quizRoundCompleteProperty = new BooleanProperty(false)
    this.missionCompleteProperty = new BooleanProperty(false)
    this.celebrateProperty = new BooleanProperty(false)
    this.partFilterProperty = new Property<BrainPart | 'all'>('all')
    this.starsProperty = new NumberProperty(0)

    this.glowIntensityProperty = new NumberProperty(1)
    this.tipsVisibleProperty = new BooleanProperty(true)
    this.revealCorrectIdProperty = new Property<BrainRegionId | null>(null)
    this.revealUntilProperty = new NumberProperty(0)
    this.scenarioProgressProperty = new NumberProperty(0)
    this.scenarioCompleteProperty = new BooleanProperty(false)
    this.soundEnabledProperty = new BooleanProperty(true)
  }

  public currentQuestion(): QuizQuestion {
    return QUIZ_QUESTIONS[this.quizIndexProperty.value % QUIZ_QUESTIONS.length]
  }

  public isExplored(id: BrainRegionId): boolean {
    return this.explored.has(id)
  }

  /** First region the learner hasn't clicked yet, in canonical order — used for the TeachingTriad's NEXT card. */
  public nextUnexploredId(): BrainRegionId | null {
    for (const region of BRAIN_REGIONS) {
      if (!this.explored.has(region.id)) {
        return region.id
      }
    }
    return null
  }

  public setMode(mode: BrainMode): void {
    if (mode === 'quiz' && !this.quizUnlockedProperty.value) {
      this.statusProperty.value = `Explore ${Math.max(0, 4 - this.explored.size)} more regions to unlock Quiz.`
      return
    }
    this.modeProperty.value = mode
    this.lastAnswerProperty.value = null
    this.feedbackUntilProperty.value = 0
    this.celebrateProperty.value = false
    this.revealCorrectIdProperty.value = null
    this.revealUntilProperty.value = 0
    if (mode === 'mission') {
      this.statusProperty.value = 'Mission: discover all 3 brain parts (cerebrum, cerebellum, brain stem).'
    }
    else if (mode === 'scenario') {
      this.scenarioFound.clear()
      this.scenarioProgressProperty.value = 0
      this.scenarioCompleteProperty.value = false
      this.statusProperty.value = 'Which parts help you balance & plan while riding? Click both.'
    }
    else {
      this.refreshStatus()
    }
  }

  public setPartFilter(part: BrainPart | 'all'): void {
    this.partFilterProperty.value = part
  }

  public selectRegion(id: BrainRegionId): void {
    const region = BRAIN_REGIONS.find((r) => r.id === id)
    if (!region) return

    const filter = this.partFilterProperty.value
    if (filter !== 'all' && region.part !== filter && this.modeProperty.value === 'study') {
      this.statusProperty.value = `Filtered to ${filter} — pick a matching region or clear filter.`
    }

    this.explored.add(id)
    this.exploredCountProperty.value = this.explored.size
    this.selectedProperty.value = id
    this.missionParts.add(region.part)

    if (this.explored.size >= 4) {
      this.quizUnlockedProperty.value = true
    }

    if (this.missionParts.size >= 3 && !this.missionCompleteProperty.value) {
      this.missionCompleteProperty.value = true
      this.celebrateProperty.value = true
      this.feedbackUntilProperty.value = this.time + 2.2
      this.statusProperty.value = 'Mission complete — you found all 3 main brain parts! ★'
    }

    if (this.modeProperty.value === 'scenario') {
      this.selectScenarioRegion(id)
      this.recomputeStars()
      return
    }

    if (this.modeProperty.value === 'study' || this.modeProperty.value === 'mission') {
      if (!this.celebrateProperty.value) {
        this.refreshStatus()
      }
      this.recomputeStars()
      return
    }

    const q = this.currentQuestion()
    const correct = id === q.answerId
    this.quizAttemptsProperty.value += 1
    if (correct) {
      this.quizScoreProperty.value += 1
      this.quizCorrect.add(id)
      this.lastAnswerProperty.value = 'correct'
      this.feedbackUntilProperty.value = this.time + 1.1
      this.revealCorrectIdProperty.value = null
      this.revealUntilProperty.value = 0
      this.quizIndexProperty.value = (this.quizIndexProperty.value + 1) % QUIZ_QUESTIONS.length
      this.statusProperty.value = 'Correct!'
      if (this.quizCorrect.size >= QUIZ_QUESTIONS.length && !this.quizRoundCompleteProperty.value) {
        this.quizRoundCompleteProperty.value = true
        this.celebrateProperty.value = true
        this.feedbackUntilProperty.value = this.time + 2.8
        this.statusProperty.value = 'Quiz mastered — all 6 regions correct! ★★'
      }
    }
    else {
      this.lastAnswerProperty.value = 'wrong'
      this.feedbackUntilProperty.value = this.time + 1.6
      const answer = BRAIN_REGIONS.find((r) => r.id === q.answerId)
      this.statusProperty.value = `Not quite — ${answer?.name ?? ''}`
      this.revealCorrectIdProperty.value = q.answerId
      this.revealUntilProperty.value = this.time + 1.2
    }
    this.recomputeStars()
  }

  private selectScenarioRegion(id: BrainRegionId): void {
    if (this.scenarioCompleteProperty.value) {
      return
    }
    if (!SCENARIO_TARGET_IDS.includes(id)) {
      this.statusProperty.value = 'Not quite — think about balance and planning ahead.'
      return
    }
    this.scenarioFound.add(id)
    this.scenarioProgressProperty.value = this.scenarioFound.size
    if (this.scenarioFound.size >= SCENARIO_TARGET_IDS.length) {
      this.scenarioCompleteProperty.value = true
      this.celebrateProperty.value = true
      this.feedbackUntilProperty.value = this.time + 2.4
      this.statusProperty.value = 'Balance (cerebellum) + planning (frontal) — that\u2019s how you ride safely! \u2605'
    }
    else {
      this.statusProperty.value = `Found ${this.scenarioFound.size} / 2 — keep going!`
    }
  }

  private recomputeStars(): void {
    let stars = 0
    if (this.explored.size >= 6) stars += 1
    if (this.missionCompleteProperty.value) stars += 1
    if (this.quizRoundCompleteProperty.value) stars += 2
    if (this.scenarioCompleteProperty.value) stars += 1
    this.starsProperty.value = stars
  }

  public step(dt: number): void {
    this.time += dt
    if (this.lastAnswerProperty.value && this.time >= this.feedbackUntilProperty.value) {
      this.lastAnswerProperty.value = null
      this.feedbackUntilProperty.value = 0
      if (this.celebrateProperty.value) {
        this.celebrateProperty.value = false
      }
      this.refreshStatus()
    }
    else if (this.celebrateProperty.value && this.time >= this.feedbackUntilProperty.value) {
      this.celebrateProperty.value = false
      this.refreshStatus()
    }

    if (this.revealCorrectIdProperty.value !== null && this.time >= this.revealUntilProperty.value) {
      this.revealCorrectIdProperty.value = null
    }
  }

  public reset(): void {
    this.modeProperty.reset()
    this.selectedProperty.reset()
    this.quizIndexProperty.reset()
    this.quizScoreProperty.reset()
    this.quizAttemptsProperty.reset()
    this.lastAnswerProperty.reset()
    this.feedbackUntilProperty.reset()
    this.explored.clear()
    this.explored.add('frontal')
    this.exploredCountProperty.value = 1
    this.quizCorrect.clear()
    this.missionParts.clear()
    this.missionParts.add('cerebrum')
    this.quizUnlockedProperty.reset()
    this.quizRoundCompleteProperty.reset()
    this.missionCompleteProperty.reset()
    this.celebrateProperty.reset()
    this.partFilterProperty.reset()
    this.starsProperty.reset()
    this.glowIntensityProperty.reset()
    this.revealCorrectIdProperty.reset()
    this.revealUntilProperty.reset()
    this.scenarioFound.clear()
    this.scenarioProgressProperty.reset()
    this.scenarioCompleteProperty.reset()
    this.soundEnabledProperty.reset()
    this.time = 0
    this.refreshStatus()
  }

  private refreshStatus(): void {
    if (this.modeProperty.value === 'quiz' && !this.lastAnswerProperty.value) {
      this.statusProperty.value = this.currentQuestion().prompt
      return
    }
    if (this.modeProperty.value === 'mission' && !this.missionCompleteProperty.value) {
      const left = 3 - this.missionParts.size
      this.statusProperty.value = `Mission: ${this.missionParts.size}/3 brain parts found (${left} to go).`
      return
    }
    if (this.modeProperty.value === 'scenario' && !this.scenarioCompleteProperty.value) {
      this.statusProperty.value = 'Which parts help you balance & plan while riding? Click both.'
      return
    }
    const region = BRAIN_REGIONS.find((r) => r.id === this.selectedProperty.value)
    this.statusProperty.value = region?.action ?? ''
  }
}
