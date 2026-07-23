import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { BRAIN_REGIONS, type BrainRegionId } from './brainRegions.js'

export type BrainMode = 'study' | 'quiz'

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

  private readonly explored = new Set<BrainRegionId>(['frontal'])
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
  }

  public currentQuestion(): QuizQuestion {
    return QUIZ_QUESTIONS[this.quizIndexProperty.value % QUIZ_QUESTIONS.length]
  }

  public setMode(mode: BrainMode): void {
    this.modeProperty.value = mode
    this.lastAnswerProperty.value = null
    this.feedbackUntilProperty.value = 0
    this.refreshStatus()
  }

  public selectRegion(id: BrainRegionId): void {
    this.explored.add(id)
    this.exploredCountProperty.value = this.explored.size
    this.selectedProperty.value = id

    if (this.modeProperty.value === 'study') {
      this.refreshStatus()
      return
    }

    const q = this.currentQuestion()
    const correct = id === q.answerId
    this.quizAttemptsProperty.value += 1
    if (correct) {
      this.quizScoreProperty.value += 1
      this.lastAnswerProperty.value = 'correct'
      this.feedbackUntilProperty.value = this.time + 1.1
      this.quizIndexProperty.value = (this.quizIndexProperty.value + 1) % QUIZ_QUESTIONS.length
      this.statusProperty.value = 'Correct!'
    }
    else {
      this.lastAnswerProperty.value = 'wrong'
      this.feedbackUntilProperty.value = this.time + 1.6
      const answer = BRAIN_REGIONS.find((r) => r.id === q.answerId)
      this.statusProperty.value = `Not quite — ${answer?.name ?? ''}`
    }
  }

  public step(dt: number): void {
    this.time += dt
    if (this.lastAnswerProperty.value && this.time >= this.feedbackUntilProperty.value) {
      this.lastAnswerProperty.value = null
      this.feedbackUntilProperty.value = 0
      this.refreshStatus()
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
    this.time = 0
    this.refreshStatus()
  }

  private refreshStatus(): void {
    if (this.modeProperty.value === 'quiz' && !this.lastAnswerProperty.value) {
      this.statusProperty.value = this.currentQuestion().prompt
      return
    }
    const region = BRAIN_REGIONS.find((r) => r.id === this.selectedProperty.value)
    this.statusProperty.value = region?.action ?? ''
  }
}
