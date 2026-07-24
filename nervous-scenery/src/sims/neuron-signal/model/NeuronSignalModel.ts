import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'

export type NeuronChallenge = 'explore' | 'race'

/**
 * Action potential along axon — saltatory hops, speed scrub, and myelin race challenge.
 */
export class NeuronSignalModel implements TModel {
  public readonly myelinProperty: BooleanProperty
  public readonly runningProperty: BooleanProperty
  public readonly tProperty: NumberProperty
  public readonly speedScaleProperty: NumberProperty
  public readonly challengeProperty: Property<NeuronChallenge>
  public readonly raceMyelinTimeProperty: NumberProperty
  public readonly raceBareTimeProperty: NumberProperty
  public readonly racePhaseProperty: NumberProperty
  public readonly hopIndexProperty: NumberProperty
  public readonly arrivedProperty: BooleanProperty
  public readonly statusProperty: StringProperty

  private raceClock = 0
  private lastHop = -1
  private readonly nodeCount = 7

  public constructor() {
    this.myelinProperty = new BooleanProperty(true)
    this.runningProperty = new BooleanProperty(true)
    this.tProperty = new NumberProperty(0)
    this.speedScaleProperty = new NumberProperty(1)
    this.challengeProperty = new Property<NeuronChallenge>('explore')
    this.raceMyelinTimeProperty = new NumberProperty(0)
    this.raceBareTimeProperty = new NumberProperty(0)
    this.racePhaseProperty = new NumberProperty(0)
    this.hopIndexProperty = new NumberProperty(-1)
    this.arrivedProperty = new BooleanProperty(false)
    this.statusProperty = new StringProperty('Fire a signal — toggle myelin to compare.')
  }

  public fire(): void {
    this.tProperty.value = 0
    this.runningProperty.value = true
    this.arrivedProperty.value = false
    this.lastHop = -1
    this.hopIndexProperty.value = -1
    this.statusProperty.value = this.myelinProperty.value
      ? 'Saltatory conduction — watch it hop node to node!'
      : 'Continuous conduction — slower crawl along the axon.'
  }

  public fireAt(t: number): void {
    this.tProperty.value = Math.max(0, Math.min(0.98, t))
    this.runningProperty.value = true
    this.arrivedProperty.value = false
    this.lastHop = -1
    this.hopIndexProperty.value = -1
  }

  public setMyelin(value: boolean): void {
    this.myelinProperty.value = value
    this.tProperty.value = 0
    this.arrivedProperty.value = false
    this.lastHop = -1
    this.hopIndexProperty.value = -1
    this.statusProperty.value = value
      ? 'Myelin ON — saltatory (fast jumps).'
      : 'Myelin OFF — continuous (slow).'
  }

  public startRace(): void {
    this.challengeProperty.value = 'race'
    this.racePhaseProperty.value = 1
    this.raceMyelinTimeProperty.value = 0
    this.raceBareTimeProperty.value = 0
    this.raceClock = 0
    this.myelinProperty.value = true
    this.fire()
    this.statusProperty.value = 'Race heat 1/2 — myelinated axon…'
  }

  public setChallenge(mode: NeuronChallenge): void {
    this.challengeProperty.value = mode
    this.racePhaseProperty.value = 0
    if (mode === 'race') {
      this.startRace()
    }
    else {
      this.statusProperty.value = 'Explore — scrub speed, tap nodes, toggle myelin.'
    }
  }

  /**
   * Visual position along axon 0–1.
   * With myelin: dwell near nodes and ease between them (true saltatory feel).
   */
  public visualT(): number {
    const t = this.tProperty.value % 1
    if (!this.myelinProperty.value) {
      return t
    }
    const n = this.nodeCount
    const scaled = t * n
    const i = Math.min(n - 1, Math.floor(scaled))
    const f = scaled - i
    // Ease hop: spend time near node, then leap
    const eased = f < 0.22 ? 0 : smoothHop((f - 0.22) / 0.78)
    return (i + eased) / n
  }

  public step(dt: number): void {
    if (!this.runningProperty.value || dt <= 0) {
      return
    }

    const base = this.myelinProperty.value ? 1.25 : 0.36
    const speed = base * Math.max(0.35, this.speedScaleProperty.value)
    const prev = this.tProperty.value
    this.tProperty.value += dt * speed

    if (this.myelinProperty.value) {
      const hop = Math.floor((this.tProperty.value % 1) * this.nodeCount)
      if (hop !== this.lastHop && this.tProperty.value % 1 > 0.01) {
        this.hopIndexProperty.value = hop
        this.lastHop = hop
      }
    }

    if (this.challengeProperty.value === 'race' && this.racePhaseProperty.value > 0) {
      this.raceClock += dt
    }

    // Arrival once per lap
    if (prev % 1 < 0.92 && this.tProperty.value % 1 >= 0.92) {
      this.arrivedProperty.value = true
      this.onArrive()
    }
    else if (this.tProperty.value % 1 < 0.2) {
      this.arrivedProperty.value = false
    }
  }

  private onArrive(): void {
    if (this.challengeProperty.value === 'race') {
      if (this.racePhaseProperty.value === 1) {
        this.raceMyelinTimeProperty.value = this.raceClock
        this.racePhaseProperty.value = 2
        this.raceClock = 0
        this.myelinProperty.value = false
        this.fire()
        this.statusProperty.value = 'Race heat 2/2 — unmyelinated axon…'
      }
      else if (this.racePhaseProperty.value === 2) {
        this.raceBareTimeProperty.value = this.raceClock
        this.racePhaseProperty.value = 3
        this.runningProperty.value = false
        const m = this.raceMyelinTimeProperty.value
        const b = this.raceBareTimeProperty.value
        const ratio = b > 0 ? (b / Math.max(0.01, m)).toFixed(1) : '—'
        this.statusProperty.value = `Race done! Myelin ~${ratio}× faster (${m.toFixed(1)}s vs ${b.toFixed(1)}s).`
        this.myelinProperty.value = true
      }
    }
    else {
      this.statusProperty.value = 'Signal reached the synaptic terminal — transmitters release!'
    }
  }

  public reset(): void {
    this.myelinProperty.reset()
    this.runningProperty.reset()
    this.tProperty.reset()
    this.speedScaleProperty.reset()
    this.challengeProperty.reset()
    this.raceMyelinTimeProperty.reset()
    this.raceBareTimeProperty.reset()
    this.racePhaseProperty.reset()
    this.hopIndexProperty.reset()
    this.arrivedProperty.reset()
    this.statusProperty.value = 'Fire a signal — toggle myelin to compare.'
    this.raceClock = 0
    this.lastHop = -1
  }
}

function smoothHop(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}
