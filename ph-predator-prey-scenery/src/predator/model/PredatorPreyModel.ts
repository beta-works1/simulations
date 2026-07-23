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

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n))
}

export class PredatorPreyModel implements TModel {
  public readonly preyProperty: NumberProperty
  public readonly predatorsProperty: NumberProperty
  public readonly growthProperty: NumberProperty
  public readonly predationRateProperty: NumberProperty
  public readonly predatorGrowthProperty: NumberProperty
  public readonly deathProperty: NumberProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly modeProperty: Property<InteractionMode>
  public readonly runningProperty: BooleanProperty
  public readonly soundEnabledProperty: BooleanProperty
  public readonly showTipsProperty: BooleanProperty
  public readonly timeProperty: NumberProperty
  public readonly statusProperty: StringProperty
  public readonly tipProperty: StringProperty
  public readonly phaseLabelProperty: StringProperty
  public readonly historyProperty: Property<PopulationSample[]>
  public readonly huntFlashProperty: NumberProperty

  public agents: MeadowAgent[] = []
  private nextAgentId = 1
  private lastPhase: string = ''
  private preyPeak = 40
  private predPeak = 12

  public constructor() {
    this.preyProperty = new NumberProperty(40)
    this.predatorsProperty = new NumberProperty(12)
    this.growthProperty = new NumberProperty(1.1)
    this.predationRateProperty = new NumberProperty(0.028)
    this.predatorGrowthProperty = new NumberProperty(0.025)
    this.deathProperty = new NumberProperty(0.7)
    this.simSpeedProperty = new NumberProperty(1)
    this.modeProperty = new Property<InteractionMode>('predation')
    this.runningProperty = new BooleanProperty(true)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.showTipsProperty = new BooleanProperty(true)
    this.timeProperty = new NumberProperty(0)
    this.statusProperty = new StringProperty(
      'Tap left meadow to add prey · right to add predators · watch the cycle.',
    )
    this.tipProperty = new StringProperty(
      'Predation: prey rise first, predators follow, then both fall — a classic boom–bust cycle.',
    )
    this.phaseLabelProperty = new StringProperty('Prey rising')
    this.historyProperty = new Property<PopulationSample[]>([{ prey: 40, predators: 12 }])
    this.huntFlashProperty = new NumberProperty(0)
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
    this.modeProperty.value = 'predation'
    this.runningProperty.value = true
    this.showTipsProperty.value = true
    this.timeProperty.value = 0
    this.historyProperty.value = [{ prey: 40, predators: 12 }]
    this.huntFlashProperty.value = 0
    this.statusProperty.value =
      'Tap left meadow to add prey · right to add predators · watch the cycle.'
    this.tipProperty.value =
      'Predation: prey rise first, predators follow, then both fall — a classic boom–bust cycle.'
    this.phaseLabelProperty.value = 'Prey rising'
    this.lastPhase = ''
    this.preyPeak = 40
    this.predPeak = 12
    this.rebuildAgents()
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
    this.statusProperty.value = `Added prey → ${this.preyProperty.value.toFixed(0)}`
  }

  public addPredators(amount = 4): void {
    this.predatorsProperty.value = Math.min(PreyConstants.PRED_MAX, this.predatorsProperty.value + amount)
    this.spawnAgents('predator', Math.min(4, Math.round(amount / 2)))
    this.statusProperty.value = `Added predators → ${this.predatorsProperty.value.toFixed(0)}`
  }

  public cullPrey(amount = 8): void {
    this.preyProperty.value = Math.max(PreyConstants.PREY_MIN, this.preyProperty.value - amount)
    this.trimAgents('prey')
    this.statusProperty.value = `Removed prey → ${this.preyProperty.value.toFixed(0)}`
  }

  public cullPredators(amount = 4): void {
    this.predatorsProperty.value = Math.max(PreyConstants.PRED_MIN, this.predatorsProperty.value - amount)
    this.trimAgents('predator')
    this.statusProperty.value = `Removed predators → ${this.predatorsProperty.value.toFixed(0)}`
  }

  public applyScenario(id: string): void {
    const s = SCENARIOS.find(x => x.id === id) ?? SCENARIOS[0]!
    this.modeProperty.value = s.mode
    this.preyProperty.value = s.prey
    this.predatorsProperty.value = s.predators
    this.growthProperty.value = s.growth
    this.predationRateProperty.value = s.predation
    this.predatorGrowthProperty.value = s.predatorGrowth
    this.deathProperty.value = s.death
    this.historyProperty.value = [{ prey: s.prey, predators: s.predators }]
    this.timeProperty.value = 0
    this.statusProperty.value = `${s.name}: ${s.blurb}`
    this.tipProperty.value = s.blurb
    this.setMode(s.mode)
    this.statusProperty.value = `${s.name}: ${s.blurb}`
    this.rebuildAgents()
  }

  public step(dt: number): void {
    if (this.huntFlashProperty.value > 0) {
      this.huntFlashProperty.value = Math.max(0, this.huntFlashProperty.value - dt)
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
    const growth = this.growthProperty.value
    const pred = this.predationRateProperty.value
    const pGrowth = this.predatorGrowthProperty.value
    const death = this.deathProperty.value
    const mode = this.modeProperty.value
    const prevPrey = prey
    const prevPred = predators

    for (let i = 0; i < steps; i++) {
      if (mode === 'predation') {
        const dp = growth * prey - pred * prey * predators
        const dq = pGrowth * prey * predators - death * predators
        prey += dp * h
        predators += dq * h
      } else if (mode === 'competition') {
        const dp = growth * prey * (1 - prey / 80) - 0.015 * prey * predators
        const dq = 0.9 * predators * (1 - predators / 50) - 0.012 * prey * predators
        prey += dp * h
        predators += dq * h
      } else {
        const dp = growth * prey * (1 - prey / 90) + 0.01 * prey * predators
        const dq = 0.6 * predators * (1 - predators / 60) + 0.008 * prey * predators
        prey += dp * h
        predators += dq * h
      }
      prey = clamp(prey, PreyConstants.PREY_MIN, PreyConstants.PREY_MAX)
      predators = clamp(predators, PreyConstants.PRED_MIN, PreyConstants.PRED_MAX)
    }

    this.preyProperty.value = prey
    this.predatorsProperty.value = predators
    this.timeProperty.value += scaled

    const hist = this.historyProperty.value.slice()
    hist.push({ prey, predators })
    if (hist.length > PreyConstants.HISTORY_MAX) hist.shift()
    this.historyProperty.value = hist

    this.updatePhase(prevPrey, prevPred, prey, predators)
    this.syncAgentCounts()
    this.stepAgents(scaled)
  }

  private updatePhase(prevPrey: number, prevPred: number, prey: number, predators: number): void {
    if (this.modeProperty.value !== 'predation') {
      const label =
        this.modeProperty.value === 'competition' ? 'Competing for resources' : 'Mutual growth'
      this.phaseLabelProperty.value = label
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

    this.phaseLabelProperty.value = phase
    if (phase !== this.lastPhase && phase === 'Predator peak') {
      this.huntFlashProperty.value = 0.8
    }
    this.lastPhase = phase
    this.preyPeak = Math.max(this.preyPeak * 0.999, prey)
    this.predPeak = Math.max(this.predPeak * 0.999, predators)
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
      this.agents.push({
        id: this.nextAgentId++,
        kind,
        x: 0.08 + Math.random() * 0.84,
        y: 0.1 + Math.random() * 0.75,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        phase: Math.random() * Math.PI * 2,
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

    for (const a of this.agents) {
      a.phase += dt * 3
      if (mode === 'predation' && a.kind === 'predator' && prey.length) {
        let nearest = prey[0]!
        let best = 99
        for (const p of prey) {
          const d = (p.x - a.x) ** 2 + (p.y - a.y) ** 2
          if (d < best) {
            best = d
            nearest = p
          }
        }
        const dx = nearest.x - a.x
        const dy = nearest.y - a.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001
        a.vx += (dx / dist) * 0.35 * dt
        a.vy += (dy / dist) * 0.35 * dt
        if (dist < 0.04) {
          this.huntFlashProperty.value = Math.max(this.huntFlashProperty.value, 0.35)
          nearest.vx += (Math.random() - 0.5) * 0.4
          nearest.vy += (Math.random() - 0.5) * 0.4
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
          a.vx += (dx / dist) * 0.5 * dt
          a.vy += (dy / dist) * 0.5 * dt
        }
      } else if (mode === 'mutualism') {
        // drift gently toward center-ish clusters
        a.vx += (0.5 - a.x) * 0.05 * dt
        a.vy += (0.5 - a.y) * 0.05 * dt
      }

      // Wander
      a.vx += (Math.random() - 0.5) * 0.15 * dt
      a.vy += (Math.random() - 0.5) * 0.15 * dt
      const maxSp = a.kind === 'prey' ? 0.22 : 0.28
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
    }
  }
}
