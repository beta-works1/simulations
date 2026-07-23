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

export const SCENARIOS: ScenarioDef[] = [
  {
    id: 'classic',
    name: 'Classic cycle',
    mode: 'predation',
    prey: 40,
    predators: 12,
    growth: 1.1,
    predation: 0.028,
    predatorGrowth: 0.025,
    death: 0.7,
    blurb: 'Classic Lotka–Volterra boom–bust: prey rise, predators follow, then both crash.',
  },
  {
    id: 'prey-boom',
    name: 'Prey boom',
    mode: 'predation',
    prey: 70,
    predators: 6,
    growth: 1.5,
    predation: 0.02,
    predatorGrowth: 0.02,
    death: 0.85,
    blurb: 'High prey growth and few predators — watch prey explode, then predators catch up.',
  },
  {
    id: 'overhunt',
    name: 'Overhunting risk',
    mode: 'predation',
    prey: 25,
    predators: 28,
    growth: 0.7,
    predation: 0.045,
    predatorGrowth: 0.03,
    death: 0.45,
    blurb: 'Too many predators / high kill rate — prey can crash and starve the predators.',
  },
  {
    id: 'compete',
    name: 'Competition',
    mode: 'competition',
    prey: 45,
    predators: 30,
    growth: 1.0,
    predation: 0.028,
    predatorGrowth: 0.025,
    death: 0.7,
    blurb: 'Two species compete for limited resources — both grow slower when crowded.',
  },
  {
    id: 'mutual',
    name: 'Mutualism garden',
    mode: 'mutualism',
    prey: 35,
    predators: 20,
    growth: 0.9,
    predation: 0.028,
    predatorGrowth: 0.025,
    death: 0.7,
    blurb: 'Each species helps the other — populations climb together toward carrying capacity.',
  },
]

export const QUIZ_BANK: QuizQuestion[] = [
  {
    prompt: 'In predation, which population usually peaks first?',
    choices: ['Predators', 'Prey', 'They peak together', 'Neither changes'],
    correct: 1,
    explain: 'Prey rise first; predators catch up after, so predator peaks lag behind prey.',
  },
  {
    prompt: 'Why do predator numbers fall after a prey crash?',
    choices: ['They migrate to space', 'Not enough food left', 'Sunlight decreases', 'Mutualism stops'],
    correct: 1,
    explain: 'Fewer prey means less food, so predator births drop and deaths rise.',
  },
  {
    prompt: 'Competition differs from predation because…',
    choices: ['Both species hurt each other when crowded', 'Only prey grow', 'Predators always win', 'No carrying capacity'],
    correct: 0,
    explain: 'Competitors share limited resources — dense populations slow each other’s growth.',
  },
  {
    prompt: 'Mutualism tends to make the graph…',
    choices: ['Crash to zero', 'Oscillate forever', 'Rise together toward a limit', 'Only show predators'],
    correct: 2,
    explain: 'Helpers boost each other, so both climb toward carrying capacity instead of boom–bust.',
  },
  {
    prompt: 'A bush refuge mainly helps…',
    choices: ['Predators hunt better', 'Prey avoid being eaten', 'Increase kill rate', 'Stop all growth'],
    correct: 1,
    explain: 'Hiding spots lower effective predation — a key idea in real ecosystems.',
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
  public readonly timeProperty: NumberProperty
  public readonly dayPhaseProperty: NumberProperty
  public readonly cycleCountProperty: NumberProperty
  public readonly ratioProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipProperty: StringProperty
  public readonly phaseLabelProperty: StringProperty
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

  public constructor() {
    this.preyProperty = new NumberProperty(40)
    this.predatorsProperty = new NumberProperty(12)
    this.growthProperty = new NumberProperty(1.1)
    this.predationRateProperty = new NumberProperty(0.028)
    this.predatorGrowthProperty = new NumberProperty(0.025)
    this.deathProperty = new NumberProperty(0.7)
    this.simSpeedProperty = new NumberProperty(1)
    this.carryingCapacityProperty = new NumberProperty(100)
    this.modeProperty = new Property<InteractionMode>('predation')
    this.runningProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.showTipsProperty = new BooleanProperty(true)
    this.isDayProperty = new BooleanProperty(true)
    this.autoDayNightProperty = new BooleanProperty(true)
    this.refugeEnabledProperty = new BooleanProperty(true)
    this.showChaseLinesProperty = new BooleanProperty(true)
    this.showPhasePlotProperty = new BooleanProperty(true)
    this.timeProperty = new NumberProperty(0)
    this.dayPhaseProperty = new NumberProperty(0.25)
    this.cycleCountProperty = new NumberProperty(0)
    this.ratioProperty = new NumberProperty(40 / 12)
    this.statusProperty = new StringProperty(
      'Tap left = prey · right = predators · drag animals · try events & quiz.',
    )
    this.tipProperty = new StringProperty(
      'Predation: prey rise first, predators follow, then both fall — a classic boom–bust cycle.',
    )
    this.phaseLabelProperty = new StringProperty('Prey rising')
    this.eventLabelProperty = new StringProperty('')
    this.historyProperty = new Property<PopulationSample[]>([{ prey: 40, predators: 12 }])
    this.huntFlashProperty = new NumberProperty(0)
    this.eventTimerProperty = new NumberProperty(0)
    this.quizIndexProperty = new NumberProperty(0)
    this.quizScoreProperty = new NumberProperty(0)
    this.quizFeedbackProperty = new StringProperty('Test yourself on predator–prey cycles.')
    this.rebuildAgents()
  }

  public reset(): void {
    this.preyProperty.value = 40
    this.predatorsProperty.value = 12
    this.growthProperty.value = 1.1
    this.predationRateProperty.value = 0.028
    this.predatorGrowthProperty.value = 0.025
    this.deathProperty.value = 0.7
    this.simSpeedProperty.value = 1
    this.carryingCapacityProperty.value = 100
    this.modeProperty.value = 'predation'
    this.runningProperty.value = true
    this.showTipsProperty.value = true
    this.isDayProperty.value = true
    this.autoDayNightProperty.value = true
    this.refugeEnabledProperty.value = true
    this.showChaseLinesProperty.value = true
    this.showPhasePlotProperty.value = true
    this.timeProperty.value = 0
    this.dayPhaseProperty.value = 0.25
    this.cycleCountProperty.value = 0
    this.ratioProperty.value = 40 / 12
    this.historyProperty.value = [{ prey: 40, predators: 12 }]
    this.huntFlashProperty.value = 0
    this.eventTimerProperty.value = 0
    this.eventKind = 'none'
    this.eventLabelProperty.value = ''
    this.statusProperty.value =
      'Tap left = prey · right = predators · drag animals · try events & quiz.'
    this.tipProperty.value =
      'Predation: prey rise first, predators follow, then both fall — a classic boom–bust cycle.'
    this.phaseLabelProperty.value = 'Prey rising'
    this.quizIndexProperty.value = 0
    this.quizScoreProperty.value = 0
    this.quizFeedbackProperty.value = 'Test yourself on predator–prey cycles.'
    this.lastPhase = ''
    this.sawPreyPeak = false
    this.chaseLinks = []
    this.rebuildAgents()
  }

  public clearHistory(): void {
    this.historyProperty.value = [
      { prey: this.preyProperty.value, predators: this.predatorsProperty.value },
    ]
    this.statusProperty.value = 'Chart cleared — new trajectory starts now.'
  }

  public setMode(mode: InteractionMode): void {
    this.modeProperty.value = mode
    const tips: Record<InteractionMode, string> = {
      predation:
        'Predation: prey rise first, predators follow, then both fall — a classic boom–bust cycle.',
      competition:
        'Competition: both species hurt each other when dense — neither “follows” the other in a clean lag.',
      mutualism:
        'Mutualism: each species boosts the other — populations climb together instead of oscillating.',
    }
    this.tipProperty.value = tips[mode]
    this.statusProperty.value = `Mode: ${mode} — compare how the graph shape changes.`
  }

  public addPrey(amount = 8): void {
    this.preyProperty.value = Math.min(PreyConstants.PREY_MAX, this.preyProperty.value + amount)
    this.spawnAgents('prey', Math.min(6, Math.round(amount / 2)))
    this.updateRatio()
    this.statusProperty.value = `Added prey → ${this.preyProperty.value.toFixed(0)}`
  }

  public addPredators(amount = 4): void {
    this.predatorsProperty.value = Math.min(PreyConstants.PRED_MAX, this.predatorsProperty.value + amount)
    this.spawnAgents('predator', Math.min(4, Math.round(amount / 2)))
    this.updateRatio()
    this.statusProperty.value = `Added predators → ${this.predatorsProperty.value.toFixed(0)}`
  }

  public cullPrey(amount = 8): void {
    this.preyProperty.value = Math.max(PreyConstants.PREY_MIN, this.preyProperty.value - amount)
    this.trimAgents('prey')
    this.updateRatio()
    this.statusProperty.value = `Removed prey → ${this.preyProperty.value.toFixed(0)}`
  }

  public cullPredators(amount = 4): void {
    this.predatorsProperty.value = Math.max(PreyConstants.PRED_MIN, this.predatorsProperty.value - amount)
    this.trimAgents('predator')
    this.updateRatio()
    this.statusProperty.value = `Removed predators → ${this.predatorsProperty.value.toFixed(0)}`
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
    const s = SCENARIOS.find(x => x.id === id) ?? SCENARIOS[0]!
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
    this.setMode(s.mode)
    this.statusProperty.value = `${s.name}: ${s.blurb}`
    this.tipProperty.value = s.blurb
    this.updateRatio()
    this.rebuildAgents()
  }

  public triggerEvent(kind: 'drought' | 'disease' | 'bloom'): void {
    this.eventKind = kind
    this.eventTimerProperty.value = 8
    if (kind === 'drought') {
      this.eventLabelProperty.value = 'Drought — prey growth cut'
      this.statusProperty.value = 'Drought: plants wither, prey grow slower for a while.'
      this.tipProperty.value = 'Environmental stress can shift the whole cycle — watch the graph bend.'
    } else if (kind === 'disease') {
      this.eventLabelProperty.value = 'Predator disease — deaths up'
      this.statusProperty.value = 'Disease hits predators — their death rate spikes temporarily.'
      this.tipProperty.value = 'When predators drop, prey often rebound — then predators may recover.'
    } else {
      this.eventLabelProperty.value = 'Plant bloom — prey surge'
      this.statusProperty.value = 'Bloom: extra food fuels a prey surge.'
      this.tipProperty.value = 'A sudden resource boom can kick off a new boom–bust wave.'
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
      this.dayPhaseProperty.value = (this.dayPhaseProperty.value + dt * 0.04 * this.simSpeedProperty.value) % 1
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

    const hist = this.historyProperty.value.slice()
    hist.push({ prey, predators })
    if (hist.length > PreyConstants.HISTORY_MAX) hist.shift()
    this.historyProperty.value = hist

    this.updatePhase(prevPrey, prevPred, prey, predators)
    this.syncAgentCounts()
    this.stepAgents(scaled)
  }

  private updateRatio(): void {
    this.ratioProperty.value = this.preyProperty.value / Math.max(0.5, this.predatorsProperty.value)
  }

  private updatePhase(prevPrey: number, prevPred: number, prey: number, predators: number): void {
    if (this.modeProperty.value !== 'predation') {
      this.phaseLabelProperty.value =
        this.modeProperty.value === 'competition' ? 'Competing for resources' : 'Mutual growth'
      return
    }
    const dPrey = prey - prevPrey
    const dPred = predators - prevPred
    let phase = 'Steady'
    if (dPrey > 0.05 && dPred <= 0.05) phase = 'Prey rising'
    else if (dPrey > 0 && dPred > 0) phase = 'Predators catching up'
    else if (dPrey <= 0 && dPred > 0.02) phase = 'Predator peak'
    else if (dPrey < 0 && dPred < 0) phase = 'Crash / recovery'
    else if (dPrey < 0 && dPred <= 0) phase = 'Prey falling'

    if (phase === 'Prey rising' || phase === 'Predators catching up') this.sawPreyPeak = true
    if (phase === 'Predator peak' && this.sawPreyPeak && this.lastPhase !== 'Predator peak') {
      this.cycleCountProperty.value += 1
      this.sawPreyPeak = false
      this.huntFlashProperty.value = 0.9
    }

    this.phaseLabelProperty.value = phase
    this.lastPhase = phase
  }

  private rebuildAgents(): void {
    this.agents = []
    this.nextAgentId = 1
    const preyN = Math.min(48, Math.round(this.preyProperty.value))
    const predN = Math.min(28, Math.round(this.predatorsProperty.value))
    for (let i = 0; i < preyN; i++) this.spawnAgents('prey', 1)
    for (let i = 0; i < predN; i++) this.spawnAgents('predator', 1)
  }

  private spawnAgents(kind: 'prey' | 'predator', n: number): void {
    for (let i = 0; i < n; i++) {
      const speed = kind === 'prey' ? 0.08 + Math.random() * 0.12 : 0.1 + Math.random() * 0.16
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
        ? Math.min(48, Math.round(this.preyProperty.value))
        : Math.min(28, Math.round(this.predatorsProperty.value))
    let count = this.agents.filter(a => a.kind === kind).length
    while (count > target) {
      const idx = this.agents.findIndex(a => a.kind === kind)
      if (idx < 0) break
      this.agents.splice(idx, 1)
      count--
    }
  }

  private syncAgentCounts(): void {
    const preyTarget = Math.min(48, Math.round(this.preyProperty.value))
    const predTarget = Math.min(28, Math.round(this.predatorsProperty.value))
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

    for (const a of this.agents) {
      a.phase += dt * 3
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
        a.vx += (dx / dist) * 0.4 * dt
        a.vy += (dy / dist) * 0.4 * dt
        if (dist < 0.22) this.chaseLinks.push({ fromId: a.id, toId: nearest.id })
        if (dist < 0.04 && !nearest.inRefuge) {
          this.huntFlashProperty.value = Math.max(this.huntFlashProperty.value, 0.35)
          nearest.vx += (Math.random() - 0.5) * 0.5
          nearest.vy += (Math.random() - 0.5) * 0.5
          nearest.energy = Math.max(0.2, nearest.energy - 0.15)
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
        if (dist < 0.22) {
          a.vx += (dx / dist) * 0.55 * dt
          a.vy += (dy / dist) * 0.55 * dt
          // Seek refuge when scared
          if (this.refugeEnabledProperty.value) {
            const rx = REFUGE.x - a.x
            const ry = REFUGE.y - a.y
            a.vx += rx * 0.35 * dt
            a.vy += ry * 0.35 * dt
          }
        }
      } else if (mode === 'mutualism') {
        a.vx += (0.5 - a.x) * 0.05 * dt
        a.vy += (0.5 - a.y) * 0.05 * dt
      } else if (mode === 'competition') {
        // Spread out / avoid same kind crowding
        for (const o of this.agents) {
          if (o.id === a.id || o.kind !== a.kind) continue
          const dx = a.x - o.x
          const dy = a.y - o.y
          const d2 = dx * dx + dy * dy
          if (d2 < 0.01 && d2 > 0) {
            a.vx += (dx / Math.sqrt(d2)) * 0.2 * dt
            a.vy += (dy / Math.sqrt(d2)) * 0.2 * dt
          }
        }
      }

      a.vx += (Math.random() - 0.5) * 0.15 * dt
      a.vy += (Math.random() - 0.5) * 0.15 * dt
      const maxSp = a.kind === 'prey' ? 0.24 : 0.3
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
        a.vx *= 0.85
        a.vy *= 0.85
      }
    }
  }
}
