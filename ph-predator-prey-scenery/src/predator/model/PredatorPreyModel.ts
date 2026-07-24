import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'
import { PreyConstants } from '../../common/PreyColors.js'

export type InteractionMode = 'predation' | 'competition' | 'mutualism'

export type PopulationSample = { prey: number; predators: number }

export interface MeadowAgent {
  id: number
  kind: 'prey' | 'predator'
  x: number
  y: number
  vx: number
  vy: number
  phase: number
  inRefuge: boolean
  energy: number
}

export interface ScenarioDef {
  id: string
  name: string
  mode: InteractionMode
  prey: number
  predators: number
  growth: number
  predation: number
  predatorGrowth: number
  death: number
  blurb: string
}

export interface QuizQuestion {
  prompt: string
  choices: string[]
  correct: number
  explain: string
}

/** The 4-step predator–prey story students should learn to spot. */
export const CYCLE_STEPS = [
  {
    n: 1,
    short: 'Rabbits go UP',
    what: 'Step 1 of 4 — Rabbits (green) go UP',
    why: 'Why: few foxes → rabbits can eat and have babies safely',
    next: 'Next: more rabbits means more food for foxes',
  },
  {
    n: 2,
    short: 'Foxes catch up',
    what: 'Step 2 of 4 — Foxes (red) go UP after rabbits',
    why: 'Why: lots of rabbits = lots of food → foxes have more babies',
    next: 'Next: many foxes will eat many rabbits',
  },
  {
    n: 3,
    short: 'Rabbits go DOWN',
    what: 'Step 3 of 4 — Rabbits (green) go DOWN',
    why: 'Why: many foxes are eating rabbits → rabbit numbers fall',
    next: 'Next: foxes will run out of food',
  },
  {
    n: 4,
    short: 'Foxes go DOWN',
    what: 'Step 4 of 4 — Foxes (red) go DOWN too',
    why: 'Why: fewer rabbits = less food → fox numbers fall',
    next: 'Then Step 1 starts again — that is the cycle!',
  },
] as const

/** Keep the starter list short for Grade 8 — advanced scenarios stay available by id. */
export const SCENARIOS: ScenarioDef[] = [
  {
    id: 'classic',
    name: '1. Start here: rabbit ↔ fox cycle',
    mode: 'predation',
    prey: 52,
    predators: 8,
    growth: 1.05,
    predation: 0.024,
    predatorGrowth: 0.022,
    death: 0.65,
    blurb: 'Watch the graph: green (rabbits) goes up first, then red (foxes).',
  },
  {
    id: 'compete',
    name: '2. Both fight for the same food',
    mode: 'competition',
    prey: 45,
    predators: 28,
    growth: 0.95,
    predation: 0.028,
    predatorGrowth: 0.025,
    death: 0.7,
    blurb: 'Compare: do you still see the 4-step chase? Usually no.',
  },
  {
    id: 'mutual',
    name: '3. Both help each other',
    mode: 'mutualism',
    prey: 35,
    predators: 20,
    growth: 0.85,
    predation: 0.028,
    predatorGrowth: 0.025,
    death: 0.7,
    blurb: 'Compare: both lines rise together — not a chase.',
  },
]

export const ADVANCED_SCENARIOS: ScenarioDef[] = [
  {
    id: 'prey-boom',
    name: 'Many rabbits, few foxes',
    mode: 'predation',
    prey: 65,
    predators: 6,
    growth: 1.35,
    predation: 0.02,
    predatorGrowth: 0.02,
    death: 0.8,
    blurb: 'Extra rabbits first. Then foxes catch up. Watch Step 1 → Step 2 carefully.',
  },
  {
    id: 'overhunt',
    name: 'Too many foxes',
    mode: 'predation',
    prey: 28,
    predators: 24,
    growth: 0.75,
    predation: 0.04,
    predatorGrowth: 0.028,
    death: 0.5,
    blurb: 'Lots of foxes eat rabbits down. Then foxes also struggle — Step 3 → Step 4.',
  },
]

export const QUIZ_BANK: QuizQuestion[] = [
  {
    prompt: 'In the rabbit–fox cycle, which number goes UP first?',
    choices: ['Foxes (red)', 'Rabbits (green)', 'Both at the same time'],
    correct: 1,
    explain: 'Rabbits go up first (Step 1). Foxes go up later because they need rabbits for food (Step 2).',
  },
  {
    prompt: 'After rabbit numbers fall, foxes usually…',
    choices: ['Keep rising forever', 'Also fall (less food)', 'Turn into rabbits'],
    correct: 1,
    explain: 'Fewer rabbits means less food, so foxes fall too (Step 4). Then the cycle can start again.',
  },
  {
    prompt: '“Competition” means…',
    choices: ['One animal eats the other', 'Both struggle for the same limited food', 'Both always help each other'],
    correct: 1,
    explain: 'In competition, both use similar food, so a crowded meadow slows both of them down.',
  },
]

/** Normalized refuge bush region in meadow coords. */
export const REFUGE = { x: 0.18, y: 0.62, r: 0.11 }

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

function inRefuge(x: number, y: number): boolean {
  const dx = x - REFUGE.x
  const dy = y - REFUGE.y
  return dx * dx + dy * dy <= REFUGE.r * REFUGE.r
}

export class PredatorPreyModel implements TModel {
  public readonly preyProperty: NumberProperty
  public readonly predatorsProperty: NumberProperty
  public readonly growthProperty: NumberProperty
  public readonly predationRateProperty: NumberProperty
  public readonly predatorGrowthProperty: NumberProperty
  public readonly deathProperty: NumberProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly carryingCapacityProperty: NumberProperty
  public readonly modeProperty: Property<InteractionMode>
  public readonly runningProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly showTipsProperty: BooleanProperty
  public readonly isDayProperty: BooleanProperty
  public readonly autoDayNightProperty: BooleanProperty
  public readonly refugeEnabledProperty: BooleanProperty
  public readonly showChaseLinesProperty: BooleanProperty
  public readonly showPhasePlotProperty: BooleanProperty
  public readonly showAdvancedProperty: BooleanProperty
  public readonly timeProperty: NumberProperty
  public readonly dayPhaseProperty: NumberProperty
  public readonly cycleCountProperty: NumberProperty
  public readonly ratioProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipProperty: StringProperty
  public readonly phaseLabelProperty: StringProperty
  public readonly guideProperty: StringProperty
  /** Plain cause → effect line for Class 8. */
  public readonly whyProperty: StringProperty
  /** What to look at next. */
  public readonly nextHintProperty: StringProperty
  /** Current cycle step 1–4 (0 = not in predation cycle). */
  public readonly storyStepProperty: NumberProperty
  public readonly eventLabelProperty: StringProperty
  public readonly historyProperty: Property<PopulationSample[]>
  public readonly huntFlashProperty: NumberProperty
  public readonly quizIndexProperty: NumberProperty
  public readonly quizScoreProperty: NumberProperty
  public readonly quizFeedbackProperty: StringProperty

  /** Active event timer seconds remaining (0 = none). */
  public readonly eventTimerProperty: NumberProperty
  public eventKind: 'none' | 'drought' | 'disease' | 'bloom' = 'none'

  public agents: MeadowAgent[] = []
  public chaseLinks: { fromId: number; toId: number }[] = []

  private nextAgentId = 1
  private lastPhase = ''
  private sawPreyPeak = false
  private historyAcc = 0

  public constructor() {
    this.preyProperty = new NumberProperty(52)
    this.predatorsProperty = new NumberProperty(8)
    this.growthProperty = new NumberProperty(1.05)
    this.predationRateProperty = new NumberProperty(0.024)
    this.predatorGrowthProperty = new NumberProperty(0.022)
    this.deathProperty = new NumberProperty(0.65)
    this.simSpeedProperty = new NumberProperty(PreyConstants.SPEED_DEFAULT)
    this.carryingCapacityProperty = new NumberProperty(100)
    this.modeProperty = new Property<InteractionMode>('predation')
    this.runningProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.showTipsProperty = new BooleanProperty(true)
    this.isDayProperty = new BooleanProperty(true)
    this.autoDayNightProperty = new BooleanProperty(false)
    this.refugeEnabledProperty = new BooleanProperty(true)
    this.showChaseLinesProperty = new BooleanProperty(false)
    this.showPhasePlotProperty = new BooleanProperty(false)
    this.showAdvancedProperty = new BooleanProperty(false)
    this.timeProperty = new NumberProperty(0)
    this.dayPhaseProperty = new NumberProperty(0.25)
    this.cycleCountProperty = new NumberProperty(0)
    this.ratioProperty = new NumberProperty(52 / 8)
    this.statusProperty = new StringProperty(
      'Main lesson: foxes eat rabbits. Watch the graph — green goes up first.',
    )
    this.tipProperty = new StringProperty(
      'Remember: rabbits ↑ → foxes ↑ → rabbits ↓ → foxes ↓ → repeat.',
    )
    this.phaseLabelProperty = new StringProperty(CYCLE_STEPS[0]!.what)
    this.guideProperty = new StringProperty(CYCLE_STEPS[0]!.next)
    this.whyProperty = new StringProperty(CYCLE_STEPS[0]!.why)
    this.nextHintProperty = new StringProperty(CYCLE_STEPS[0]!.next)
    this.storyStepProperty = new NumberProperty(1)
    this.eventLabelProperty = new StringProperty('')
    this.historyProperty = new Property<PopulationSample[]>([{ prey: 52, predators: 8 }])
    this.huntFlashProperty = new NumberProperty(0)
    this.eventTimerProperty = new NumberProperty(0)
    this.quizIndexProperty = new NumberProperty(0)
    this.quizScoreProperty = new NumberProperty(0)
    this.quizFeedbackProperty = new StringProperty('Try the quiz after you watch one full cycle.')
    this.rebuildAgents()
  }

  public reset(): void {
    this.preyProperty.value = 52
    this.predatorsProperty.value = 8
    this.growthProperty.value = 1.05
    this.predationRateProperty.value = 0.024
    this.predatorGrowthProperty.value = 0.022
    this.deathProperty.value = 0.65
    this.simSpeedProperty.value = PreyConstants.SPEED_DEFAULT
    this.carryingCapacityProperty.value = 100
    this.modeProperty.value = 'predation'
    this.runningProperty.value = true
    this.showTipsProperty.value = true
    this.isDayProperty.value = true
    this.autoDayNightProperty.value = false
    this.refugeEnabledProperty.value = true
    this.showChaseLinesProperty.value = false
    this.showPhasePlotProperty.value = false
    this.showAdvancedProperty.value = false
    this.timeProperty.value = 0
    this.dayPhaseProperty.value = 0.25
    this.cycleCountProperty.value = 0
    this.ratioProperty.value = 52 / 8
    this.historyProperty.value = [{ prey: 52, predators: 8 }]
    this.huntFlashProperty.value = 0
    this.eventTimerProperty.value = 0
    this.eventKind = 'none'
    this.eventLabelProperty.value = ''
    this.statusProperty.value =
      'Main lesson: foxes eat rabbits. Watch the graph — green goes up first.'
    this.tipProperty.value =
      'Remember: rabbits ↑ → foxes ↑ → rabbits ↓ → foxes ↓ → repeat.'
    this.phaseLabelProperty.value = CYCLE_STEPS[0]!.what
    this.guideProperty.value = CYCLE_STEPS[0]!.next
    this.whyProperty.value = CYCLE_STEPS[0]!.why
    this.nextHintProperty.value = CYCLE_STEPS[0]!.next
    this.storyStepProperty.value = 1
    this.quizIndexProperty.value = 0
    this.quizScoreProperty.value = 0
    this.quizFeedbackProperty.value = 'Try the quiz after you watch one full cycle.'
    this.lastPhase = ''
    this.sawPreyPeak = false
    this.chaseLinks = []
    this.historyAcc = 0
    this.rebuildAgents()
  }

  public clearHistory(): void {
    this.historyProperty.value = [
      { prey: this.preyProperty.value, predators: this.predatorsProperty.value },
    ]
    this.statusProperty.value = 'Graph cleared — watch the new lines from the start.'
  }

  public setMode(mode: InteractionMode): void {
    this.modeProperty.value = mode
    if (mode === 'predation') {
      this.tipProperty.value = 'Remember: rabbits ↑ → foxes ↑ → rabbits ↓ → foxes ↓ → repeat.'
      this.phaseLabelProperty.value = CYCLE_STEPS[0]!.what
      this.whyProperty.value = CYCLE_STEPS[0]!.why
      this.nextHintProperty.value = CYCLE_STEPS[0]!.next
      this.guideProperty.value = CYCLE_STEPS[0]!.next
      this.storyStepProperty.value = 1
      this.statusProperty.value = 'Main lesson: foxes eat rabbits. Watch all 4 steps on the graph.'
    } else if (mode === 'competition') {
      this.tipProperty.value = 'Extra lesson: both need the same food.'
      this.phaseLabelProperty.value = 'Both fighting for the same food'
      this.whyProperty.value = 'Why: when crowded, food runs short for both'
      this.nextHintProperty.value = 'Compare: do you still see the 4-step chase?'
      this.guideProperty.value = 'Look: both lines grow more slowly when crowded.'
      this.storyStepProperty.value = 0
      this.statusProperty.value = 'Extra lesson: competition — both struggle for limited food.'
    } else {
      this.tipProperty.value = 'Extra lesson: both help each other.'
      this.phaseLabelProperty.value = 'Both helping each other'
      this.whyProperty.value = 'Why: each group makes life easier for the other'
      this.nextHintProperty.value = 'Compare: lines rise together, not chase.'
      this.guideProperty.value = 'Look: green and red climb together — no boom–bust chase.'
      this.storyStepProperty.value = 0
      this.statusProperty.value = 'Extra lesson: mutualism — both help each other grow.'
    }
  }

  public addPrey(amount = 8): void {
    this.preyProperty.value = Math.min(PreyConstants.PREY_MAX, this.preyProperty.value + amount)
    this.spawnAgents('prey', Math.min(6, Math.round(amount / 2)))
    this.updateRatio()
    this.statusProperty.value = `Added rabbits → now ${this.preyProperty.value.toFixed(0)}. Watch the green line.`
  }

  public addPredators(amount = 4): void {
    this.predatorsProperty.value = Math.min(PreyConstants.PRED_MAX, this.predatorsProperty.value + amount)
    this.spawnAgents('predator', Math.min(4, Math.round(amount / 2)))
    this.updateRatio()
    this.statusProperty.value = `Added foxes → now ${this.predatorsProperty.value.toFixed(0)}. Watch the red line.`
  }

  public cullPrey(amount = 8): void {
    this.preyProperty.value = Math.max(PreyConstants.PREY_MIN, this.preyProperty.value - amount)
    this.trimAgents('prey')
    this.updateRatio()
    this.statusProperty.value = `Removed rabbits → now ${this.preyProperty.value.toFixed(0)}`
  }

  public cullPredators(amount = 4): void {
    this.predatorsProperty.value = Math.max(PreyConstants.PRED_MIN, this.predatorsProperty.value - amount)
    this.trimAgents('predator')
    this.updateRatio()
    this.statusProperty.value = `Removed foxes → now ${this.predatorsProperty.value.toFixed(0)}`
  }

  public moveAgent(id: number, nx: number, ny: number): void {
    const a = this.agents.find(x => x.id === id)
    if (!a) return
    a.x = clamp(nx, 0.04, 0.96)
    a.y = clamp(ny, 0.06, 0.9)
    a.vx *= 0.3
    a.vy *= 0.3
    a.inRefuge = this.refugeEnabledProperty.value && a.kind === 'prey' && inRefuge(a.x, a.y)
  }

  public applyScenario(id: string): void {
    const s =
      SCENARIOS.find(x => x.id === id) ??
      ADVANCED_SCENARIOS.find(x => x.id === id) ??
      SCENARIOS[0]!
    this.growthProperty.value = s.growth
    this.predationRateProperty.value = s.predation
    this.predatorGrowthProperty.value = s.predatorGrowth
    this.deathProperty.value = s.death
    this.preyProperty.value = s.prey
    this.predatorsProperty.value = s.predators
    this.historyProperty.value = [{ prey: s.prey, predators: s.predators }]
    this.timeProperty.value = 0
    this.cycleCountProperty.value = 0
    this.eventTimerProperty.value = 0
    this.eventKind = 'none'
    this.eventLabelProperty.value = ''
    this.historyAcc = 0
    this.setMode(s.mode)
    this.statusProperty.value = s.blurb
    this.tipProperty.value = s.blurb
    this.updateRatio()
    this.rebuildAgents()
  }

  public triggerEvent(kind: 'drought' | 'disease' | 'bloom'): void {
    this.eventKind = kind
    this.eventTimerProperty.value = 8
    if (kind === 'drought') {
      this.eventLabelProperty.value = 'Drought — less food for rabbits'
      this.statusProperty.value = 'Drought: plants dry up → rabbits grow slower.'
      this.tipProperty.value = 'Less plant food → rabbit growth slows → the cycle can bend.'
      this.whyProperty.value = 'Why: dry plants mean rabbits have less to eat'
      this.nextHintProperty.value = 'Watch the green line rise more slowly.'
    } else if (kind === 'disease') {
      this.eventLabelProperty.value = 'Fox disease — foxes die faster'
      this.statusProperty.value = 'Disease hits foxes → fox numbers fall for a while.'
      this.tipProperty.value = 'When foxes fall, rabbits often bounce back (back toward Step 1).'
      this.whyProperty.value = 'Why: sick foxes die faster → fewer hunters'
      this.nextHintProperty.value = 'Watch red fall, then green often rises.'
    } else {
      this.eventLabelProperty.value = 'Plant bloom — extra rabbit food'
      this.statusProperty.value = 'Bloom: extra plants → rabbits surge (strong Step 1).'
      this.tipProperty.value = 'Extra food can start a bigger rabbit boom — then foxes follow.'
      this.whyProperty.value = 'Why: more plants → rabbits can increase faster'
      this.nextHintProperty.value = 'Watch green jump, then red catch up.'
      this.addPrey(12)
    }
  }

  public answerQuiz(choiceIndex: number): void {
    const q = QUIZ_BANK[this.quizIndexProperty.value % QUIZ_BANK.length]!
    if (choiceIndex === q.correct) {
      this.quizScoreProperty.value += 1
      this.quizFeedbackProperty.value = `Correct! ${q.explain}`
      this.statusProperty.value = `Quiz ✓ — score ${this.quizScoreProperty.value}`
    } else {
      this.quizFeedbackProperty.value = `Not quite. ${q.explain}`
      this.statusProperty.value = 'Quiz — try again or go to the next question.'
    }
  }

  public nextQuiz(): void {
    this.quizIndexProperty.value = (this.quizIndexProperty.value + 1) % QUIZ_BANK.length
    this.quizFeedbackProperty.value = 'New question — pick the best answer.'
  }

  public step(dt: number): void {
    if (this.huntFlashProperty.value > 0) {
      this.huntFlashProperty.value = Math.max(0, this.huntFlashProperty.value - dt)
    }
    if (this.eventTimerProperty.value > 0) {
      this.eventTimerProperty.value = Math.max(0, this.eventTimerProperty.value - dt)
      if (this.eventTimerProperty.value <= 0) {
        this.eventKind = 'none'
        this.eventLabelProperty.value = ''
      }
    }

    if (this.autoDayNightProperty.value && this.runningProperty.value) {
      this.dayPhaseProperty.value = (this.dayPhaseProperty.value + dt * 0.012 * this.simSpeedProperty.value) % 1
      this.isDayProperty.value = this.dayPhaseProperty.value < 0.55
    }

    if (!this.runningProperty.value || dt <= 0) {
      this.stepAgents(dt * 0.3)
      return
    }

    const speed = this.simSpeedProperty.value
    const scaled = dt * speed
    const steps = Math.max(1, Math.floor(scaled / 0.016))
    let prey = this.preyProperty.value
    let predators = this.predatorsProperty.value
    const h = scaled / steps
    let growth = this.growthProperty.value
    let pred = this.predationRateProperty.value
    const pGrowth = this.predatorGrowthProperty.value
    let death = this.deathProperty.value
    const mode = this.modeProperty.value
    const K = this.carryingCapacityProperty.value
    const prevPrey = prey
    const prevPred = predators

    // Day/night: prey grow a bit faster in daylight
    if (!this.isDayProperty.value) growth *= 0.72

    // Events
    if (this.eventKind === 'drought') growth *= 0.45
    if (this.eventKind === 'disease') death *= 1.8
    if (this.eventKind === 'bloom') growth *= 1.35

    // Refuge lowers effective predation
    if (this.refugeEnabledProperty.value && mode === 'predation') {
      const sheltered = this.agents.filter(a => a.kind === 'prey' && a.inRefuge).length
      const preyAgents = Math.max(1, this.agents.filter(a => a.kind === 'prey').length)
      const shelterFrac = sheltered / preyAgents
      pred *= 1 - shelterFrac * 0.55
    }

    for (let i = 0; i < steps; i++) {
      if (mode === 'predation') {
        const logistic = 1 - prey / Math.max(20, K)
        const dp = growth * prey * Math.max(0.15, logistic) - pred * prey * predators
        const dq = pGrowth * prey * predators - death * predators
        prey += dp * h
        predators += dq * h
      } else if (mode === 'competition') {
        const dp = growth * prey * (1 - prey / K) - 0.015 * prey * predators
        const dq = 0.9 * predators * (1 - predators / (K * 0.55)) - 0.012 * prey * predators
        prey += dp * h
        predators += dq * h
      } else {
        const dp = growth * prey * (1 - prey / K) + 0.01 * prey * predators
        const dq = 0.6 * predators * (1 - predators / (K * 0.65)) + 0.008 * prey * predators
        prey += dp * h
        predators += dq * h
      }
      prey = clamp(prey, PreyConstants.PREY_MIN, PreyConstants.PREY_MAX)
      predators = clamp(predators, PreyConstants.PRED_MIN, PreyConstants.PRED_MAX)
    }

    this.preyProperty.value = prey
    this.predatorsProperty.value = predators
    this.timeProperty.value += scaled
    this.updateRatio()

    // Sample history less often so the chart stays calm and readable
    this.historyAcc += scaled
    if (this.historyAcc >= 0.12) {
      this.historyAcc = 0
      const hist = this.historyProperty.value.slice()
      hist.push({ prey, predators })
      if (hist.length > PreyConstants.HISTORY_MAX) hist.shift()
      this.historyProperty.value = hist
    }

    this.updatePhase(prevPrey, prevPred, prey, predators)
    this.syncAgentCounts()
    this.stepAgents(scaled)
  }

  private updateRatio(): void {
    this.ratioProperty.value = this.preyProperty.value / Math.max(0.5, this.predatorsProperty.value)
  }

  private updatePhase(prevPrey: number, prevPred: number, prey: number, predators: number): void {
    if (this.modeProperty.value !== 'predation') {
      this.storyStepProperty.value = 0
      if (this.modeProperty.value === 'competition') {
        this.phaseLabelProperty.value = 'Both fighting for the same food'
        this.whyProperty.value = 'Why: when crowded, food runs short for both'
        this.nextHintProperty.value = 'Compare with the rabbit–fox cycle: no clear 4-step chase.'
        this.guideProperty.value = this.nextHintProperty.value
      } else {
        this.phaseLabelProperty.value = 'Both helping each other'
        this.whyProperty.value = 'Why: each group makes life easier for the other'
        this.nextHintProperty.value = 'Compare: both lines rise together, not chase.'
        this.guideProperty.value = this.nextHintProperty.value
      }
      return
    }

    const dPrey = prey - prevPrey
    const dPred = predators - prevPred
    let step = this.storyStepProperty.value || 1

    // Map population change to the 4-step story students can follow.
    if (dPrey > 0.04 && dPred <= 0.02) step = 1
    else if (dPrey > 0 && dPred > 0) step = 2
    else if (dPrey <= 0 && dPred > 0.01) step = 3
    else if (dPrey < 0 && dPred < 0) step = 4
    else if (dPrey < 0 && dPred <= 0.01) step = 3
    else if (dPrey >= 0 && dPred < 0) step = 1

    const story = CYCLE_STEPS[step - 1]!
    let why: string = story.why
    let next: string = story.next
    let phase: string = story.what

    if (step === 1 || step === 2) this.sawPreyPeak = true
    if (step === 3 && this.sawPreyPeak && this.lastPhase !== phase) {
      this.cycleCountProperty.value += 1
      this.sawPreyPeak = false
      this.huntFlashProperty.value = 0.7
      next = `Cycle ${this.cycleCountProperty.value} turning — foxes high, rabbits falling.`
      this.statusProperty.value = `You spotted a turn in the cycle (cycle #${this.cycleCountProperty.value}).`
    }
    if (step === 4 && this.lastPhase !== phase) {
      next = 'Almost done — when foxes are low, rabbits can rise again (back to Step 1).'
    }
    if (step === 1 && this.lastPhase.includes('Step 4')) {
      this.statusProperty.value = 'Back to Step 1 — the cycle is repeating. Great noticing!'
    }

    this.storyStepProperty.value = step
    this.phaseLabelProperty.value = phase
    this.whyProperty.value = why
    this.nextHintProperty.value = next
    this.guideProperty.value = next
    this.lastPhase = phase
  }

  private rebuildAgents(): void {
    this.agents = []
    this.nextAgentId = 1
    const preyN = Math.min(PreyConstants.MAX_PREY_AGENTS, Math.round(this.preyProperty.value * 0.7))
    const predN = Math.min(PreyConstants.MAX_PRED_AGENTS, Math.round(this.predatorsProperty.value * 0.7))
    for (let i = 0; i < preyN; i++) this.spawnAgents('prey', 1)
    for (let i = 0; i < predN; i++) this.spawnAgents('predator', 1)
  }

  private spawnAgents(kind: 'prey' | 'predator', n: number): void {
    for (let i = 0; i < n; i++) {
      const speed = kind === 'prey' ? 0.035 + Math.random() * 0.05 : 0.045 + Math.random() * 0.06
      const ang = Math.random() * Math.PI * 2
      const x = 0.08 + Math.random() * 0.84
      const y = 0.1 + Math.random() * 0.75
      this.agents.push({
        id: this.nextAgentId++,
        kind,
        x,
        y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        phase: Math.random() * Math.PI * 2,
        inRefuge: kind === 'prey' && this.refugeEnabledProperty.value && inRefuge(x, y),
        energy: 0.6 + Math.random() * 0.4,
      })
    }
  }

  private trimAgents(kind: 'prey' | 'predator'): void {
    const target =
      kind === 'prey'
        ? Math.min(PreyConstants.MAX_PREY_AGENTS, Math.round(this.preyProperty.value * 0.7))
        : Math.min(PreyConstants.MAX_PRED_AGENTS, Math.round(this.predatorsProperty.value * 0.7))
    let count = this.agents.filter(a => a.kind === kind).length
    while (count > target) {
      const idx = this.agents.findIndex(a => a.kind === kind)
      if (idx < 0) break
      this.agents.splice(idx, 1)
      count--
    }
  }

  private syncAgentCounts(): void {
    const preyTarget = Math.min(PreyConstants.MAX_PREY_AGENTS, Math.round(this.preyProperty.value * 0.7))
    const predTarget = Math.min(PreyConstants.MAX_PRED_AGENTS, Math.round(this.predatorsProperty.value * 0.7))
    let preyN = this.agents.filter(a => a.kind === 'prey').length
    let predN = this.agents.filter(a => a.kind === 'predator').length
    while (preyN < preyTarget) {
      this.spawnAgents('prey', 1)
      preyN++
    }
    while (predN < predTarget) {
      this.spawnAgents('predator', 1)
      predN++
    }
    while (preyN > preyTarget) {
      const idx = this.agents.findIndex(a => a.kind === 'prey')
      if (idx >= 0) this.agents.splice(idx, 1)
      preyN--
    }
    while (predN > predTarget) {
      const idx = this.agents.findIndex(a => a.kind === 'predator')
      if (idx >= 0) this.agents.splice(idx, 1)
      predN--
    }
  }

  private stepAgents(dt: number): void {
    const mode = this.modeProperty.value
    const prey = this.agents.filter(a => a.kind === 'prey')
    const preds = this.agents.filter(a => a.kind === 'predator')
    this.chaseLinks = []
    const chaseStrength = 0.18

    for (const a of this.agents) {
      a.phase += dt * 1.6
      a.inRefuge = false

      if (mode === 'predation' && a.kind === 'predator' && prey.length) {
        let nearest = prey[0]!
        let best = 99
        for (const p of prey) {
          if (p.inRefuge) continue
          const d = (p.x - a.x) ** 2 + (p.y - a.y) ** 2
          if (d < best) {
            best = d
            nearest = p
          }
        }
        const dx = nearest.x - a.x
        const dy = nearest.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001
        a.vx += (dx / dist) * chaseStrength * dt
        a.vy += (dy / dist) * chaseStrength * dt
        if (dist < 0.18) this.chaseLinks.push({ fromId: a.id, toId: nearest.id })
        if (dist < 0.045 && !nearest.inRefuge) {
          this.huntFlashProperty.value = Math.max(this.huntFlashProperty.value, 0.25)
          nearest.vx += (Math.random() - 0.5) * 0.25
          nearest.vy += (Math.random() - 0.5) * 0.25
        }
      } else if (mode === 'predation' && a.kind === 'prey' && preds.length) {
        let nearest = preds[0]!
        let best = 99
        for (const p of preds) {
          const d = (p.x - a.x) ** 2 + (p.y - a.y) ** 2
          if (d < best) {
            best = d
            nearest = p
          }
        }
        const dx = a.x - nearest.x
        const dy = a.y - nearest.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001
        if (dist < 0.2) {
          a.vx += (dx / dist) * 0.28 * dt
          a.vy += (dy / dist) * 0.28 * dt
          if (this.refugeEnabledProperty.value) {
            a.vx += (REFUGE.x - a.x) * 0.2 * dt
            a.vy += (REFUGE.y - a.y) * 0.2 * dt
          }
        }
      } else if (mode === 'mutualism') {
        a.vx += (0.5 - a.x) * 0.03 * dt
        a.vy += (0.5 - a.y) * 0.03 * dt
      } else if (mode === 'competition') {
        for (const o of this.agents) {
          if (o.id === a.id || o.kind !== a.kind) continue
          const dx = a.x - o.x
          const dy = a.y - o.y
          const d2 = dx * dx + dy * dy
          if (d2 < 0.012 && d2 > 0) {
            a.vx += (dx / Math.sqrt(d2)) * 0.12 * dt
            a.vy += (dy / Math.sqrt(d2)) * 0.12 * dt
          }
        }
      }

      a.vx += (Math.random() - 0.5) * 0.06 * dt
      a.vy += (Math.random() - 0.5) * 0.06 * dt
      const maxSp = a.kind === 'prey' ? 0.11 : 0.14
      const sp = Math.hypot(a.vx, a.vy)
      if (sp > maxSp) {
        a.vx = (a.vx / sp) * maxSp
        a.vy = (a.vy / sp) * maxSp
      }
      a.x += a.vx * dt
      a.y += a.vy * dt
      if (a.x < 0.04 || a.x > 0.96) {
        a.vx *= -1
        a.x = clamp(a.x, 0.04, 0.96)
      }
      if (a.y < 0.06 || a.y > 0.9) {
        a.vy *= -1
        a.y = clamp(a.y, 0.06, 0.9)
      }

      if (this.refugeEnabledProperty.value && a.kind === 'prey' && inRefuge(a.x, a.y)) {
        a.inRefuge = true
        a.vx *= 0.9
        a.vy *= 0.9
      }
    }
  }
}
