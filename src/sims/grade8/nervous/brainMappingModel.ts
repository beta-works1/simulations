import type { BrainRegionId } from './brainAnatomy'

export type BrainMode = 'study' | 'quiz'

export type QuizQuestion = {
  prompt: string
  answerId: BrainRegionId
}

/** PTB Grade 8 Ch 2 — Human Nervous System (brain regions). */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  { prompt: 'Which lobe processes what your eyes see?', answerId: 'occipital' },
  { prompt: 'Which lobe controls voluntary movement and thinking?', answerId: 'frontal' },
  { prompt: 'Which lobe receives touch, pain, and temperature?', answerId: 'parietal' },
  { prompt: 'Which lobe is involved in hearing and memory?', answerId: 'temporal' },
  { prompt: 'Which part coordinates balance and muscle movements?', answerId: 'cerebellum' },
  { prompt: 'Which part controls heartbeat and breathing?', answerId: 'brainstem' },
]

export type BrainMappingState = {
  mode: BrainMode
  selected: BrainRegionId
  explored: Set<BrainRegionId>
  quizIndex: number
  quizScore: number
  quizAttempts: number
  lastAnswer: 'correct' | 'wrong' | null
  feedbackUntil: number
  showLabels: boolean
  showParts: boolean
}

export function createBrainMappingState(): BrainMappingState {
  return {
    mode: 'study',
    selected: 'frontal',
    explored: new Set(['frontal']),
    quizIndex: 0,
    quizScore: 0,
    quizAttempts: 0,
    lastAnswer: null,
    feedbackUntil: 0,
    showLabels: true,
    showParts: true,
  }
}

export function currentQuestion(s: BrainMappingState): QuizQuestion {
  return QUIZ_QUESTIONS[s.quizIndex % QUIZ_QUESTIONS.length]
}

export function selectRegion(s: BrainMappingState, id: BrainRegionId, now = 0): BrainMappingState {
  const explored = new Set(s.explored)
  explored.add(id)

  if (s.mode === 'study') {
    return { ...s, selected: id, explored }
  }

  const q = currentQuestion(s)
  const correct = id === q.answerId
  const next: BrainMappingState = {
    ...s,
    selected: id,
    explored,
    quizAttempts: s.quizAttempts + 1,
    quizScore: s.quizScore + (correct ? 1 : 0),
    lastAnswer: correct ? 'correct' : 'wrong',
    feedbackUntil: now + (correct ? 1.1 : 1.6),
  }

  if (correct) {
    next.quizIndex = (s.quizIndex + 1) % QUIZ_QUESTIONS.length
  }

  return next
}

export function tickFeedback(s: BrainMappingState, now: number): BrainMappingState {
  if (s.lastAnswer && now >= s.feedbackUntil) {
    return { ...s, lastAnswer: null, feedbackUntil: 0 }
  }
  return s
}
