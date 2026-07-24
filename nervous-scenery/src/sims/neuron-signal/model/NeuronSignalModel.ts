import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'

export type NeuronChallenge = 'explore' | 'race' | 'demyelination'

export type LapResult = { time: number; myelinOn: boolean }

const DEMYELINATION_SPEED_CAP = 0.6

/**
 * Action potential along axon — dense ecology-style controls (carbon parity).
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
  public readonly showIonsProperty: BooleanProperty
  public readonly raceUnlockedProperty: BooleanProperty
  public readonly raceCompletedProperty: BooleanProperty
  public readonly quizCorrectProperty: BooleanProperty
  public readonly starsProperty: NumberProperty
  public readonly fireCountProperty: NumberProperty
  public readonly lastLapResultProperty: Property<LapResult | null>
  public readonly soundEnabledProperty: BooleanProperty

  // Dense controls
  public readonly axonLengthProperty: NumberProperty
  public readonly nodeCountProperty: NumberProperty
  public readonly axonDiameterProperty: NumberProperty
  public readonly thresholdProperty: NumberProperty
  public readonly stimulusStrengthProperty: NumberProperty
  public readonly synapseDelayProperty: NumberProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly showPartsProperty: BooleanProperty
  public readonly showAPTraceProperty: BooleanProperty
  public readonly autoRepeatProperty: BooleanProperty
  public readonly temperatureProperty: NumberProperty

  private raceClock = 0
  private lastHop = -1
  private lapClock = 0
  private lapMyelinAtFire = true
  private triedMyelinOn = false
  private triedMyelinOff = false
  private awaitingSynapse = false
  private synapseTimer = 0
  private autoRepeatCooldown = 0

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
    this.statusProperty = new StringProperty('Fire a signal — scrub every control to compare.')
    this.showIonsProperty = new BooleanProperty(false)
    this.raceUnlockedProperty = new BooleanProperty(false)
    this.raceCompletedProperty = new BooleanProperty(false)
    this.quizCorrectProperty = new BooleanProperty(false)
    this.starsProperty = new NumberProperty(0)
    this.fireCountProperty = new NumberProperty(0)
    this.lastLapResultProperty = new Property<LapResult | null>(null)
    this.soundEnabledProperty = new BooleanProperty(true)

    this.axonLengthProperty = new NumberProperty(1)
    this.nodeCountProperty = new NumberProperty(7)
    this.axonDiameterProperty = new NumberProperty(1)
    this.thresholdProperty = new NumberProperty(40)
    this.stimulusStrengthProperty = new NumberProperty(80)
    this.synapseDelayProperty = new NumberProperty(0.25)
    this.simSpeedProperty = new NumberProperty(1)
    this.showPartsProperty = new BooleanProperty(true)
    this.showAPTraceProperty = new BooleanProperty(true)
    this.autoRepeatProperty = new BooleanProperty(false)
    this.temperatureProperty = new NumberProperty(37)
  }

  public nodeCount(): number {
    return Math.max(3, Math.round(this.nodeCountProperty.value))
  }

  /** Conduction multiplier from diameter × temp × length inverse. */
  public effectiveSpeed(): number {
    const diam = 0.55 + this.axonDiameterProperty.value * 0.55
    const tempFactor = 0.7 + ((this.temperatureProperty.value - 20) / 37) * 0.55
    const lengthPenalty = 1 / Math.max(0.55, this.axonLengthProperty.value)
    return diam * tempFactor * lengthPenalty
  }

  public fire(): void {
    if (this.stimulusStrengthProperty.value < this.thresholdProperty.value) {
      this.statusProperty.value = 'Below threshold — raise stimulus strength or lower threshold.'
      return
    }

    this.tProperty.value = 0
    this.runningProperty.value = true
    this.arrivedProperty.value = false
    this.lastHop = -1
    this.hopIndexProperty.value = -1
    this.lapClock = 0
    this.lapMyelinAtFire = this.myelinProperty.value
    this.awaitingSynapse = false
    this.synapseTimer = 0
    this.fireCountProperty.value += 1
    this.registerTried()
    this.statusProperty.value = this.myelinProperty.value
      ? 'Saltatory conduction — watch it hop node to node!'
      : this.challengeProperty.value === 'demyelination'
        ? 'Demyelinated axon firing — a slow, effortful crawl.'
        : 'Continuous conduction — slower crawl along the axon.'
  }

  public fireAt(t: number): void {
    if (this.stimulusStrengthProperty.value < this.thresholdProperty.value) {
      this.statusProperty.value = 'Below threshold — raise stimulus strength or lower threshold.'
      return
    }
    this.tProperty.value = Math.max(0, Math.min(0.98, t))
    this.runningProperty.value = true
    this.arrivedProperty.value = false
    this.lastHop = -1
    this.hopIndexProperty.value = -1
    this.lapClock = 0
    this.lapMyelinAtFire = this.myelinProperty.value
    this.awaitingSynapse = false
    this.fireCountProperty.value += 1
    this.registerTried()
  }

  public stepOnce(): void {
    if (this.tProperty.value % 1 > 0.92 || !this.runningProperty.value) {
      this.fire()
      this.runningProperty.value = false
      this.step(0.1)
      this.runningProperty.value = false
      return
    }
    const was = this.runningProperty.value
    this.runningProperty.value = true
    this.step(0.1)
    this.runningProperty.value = was && false
    this.statusProperty.value = 'Stepped once — press Step again or Play.'
  }

  private registerTried(): void {
    if (this.myelinProperty.value) {
      this.triedMyelinOn = true
    }
    else {
      this.triedMyelinOff = true
    }
    if (this.triedMyelinOn && this.triedMyelinOff && !this.raceUnlockedProperty.value) {
      this.raceUnlockedProperty.value = true
    }
  }

  public setMyelin(value: boolean): void {
    if (this.challengeProperty.value === 'demyelination') {
      this.statusProperty.value = 'Myelin is damaged in this challenge — leave it to see the effect.'
      return
    }
    this.myelinProperty.value = value
    this.tProperty.value = 0
    this.arrivedProperty.value = false
    this.lastHop = -1
    this.hopIndexProperty.value = -1
    this.statusProperty.value = value
      ? 'Myelin ON — saltatory (fast jumps).'
      : 'Myelin OFF — continuous (slow).'
  }

  public setShowIons(value: boolean): void {
    this.showIonsProperty.value = value
    this.statusProperty.value = value
      ? 'Na⁺ ions shown — watch them rush in at each hop.'
      : 'Ion labels hidden.'
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
    if (mode === 'race' && !this.raceUnlockedProperty.value) {
      this.statusProperty.value = 'Try firing with myelin ON and OFF once each in Explore to unlock the race!'
      return
    }
    this.challengeProperty.value = mode
    this.racePhaseProperty.value = 0
    if (mode === 'race') {
      this.startRace()
    }
    else if (mode === 'demyelination') {
      this.myelinProperty.value = false
      this.speedScaleProperty.value = Math.min(this.speedScaleProperty.value, DEMYELINATION_SPEED_CAP)
      this.fire()
      this.statusProperty.value = 'Demyelination challenge: disease strips the sheath — myelin locked OFF.'
    }
    else {
      this.statusProperty.value = 'Explore — scrub every axon control and compare.'
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
    const n = this.nodeCount()
    const scaled = t * n
    const i = Math.min(n - 1, Math.floor(scaled))
    const f = scaled - i
    const eased = f < 0.22 ? 0 : smoothHop((f - 0.22) / 0.78)
    return (i + eased) / n
  }

  public step(dt: number): void {
    const scaledDt = dt * Math.max(0.25, this.simSpeedProperty.value)

    if (this.challengeProperty.value === 'demyelination' && this.speedScaleProperty.value > DEMYELINATION_SPEED_CAP) {
      this.speedScaleProperty.value = DEMYELINATION_SPEED_CAP
    }

    if (this.awaitingSynapse) {
      this.synapseTimer += scaledDt
      if (this.synapseTimer >= this.synapseDelayProperty.value) {
        this.awaitingSynapse = false
        this.statusProperty.value = 'Neurotransmitters crossed the gap — next neuron can fire!'
      }
    }

    if (this.autoRepeatProperty.value && this.arrivedProperty.value && !this.runningProperty.value) {
      this.autoRepeatCooldown += scaledDt
      if (this.autoRepeatCooldown > 0.9) {
        this.autoRepeatCooldown = 0
        this.fire()
      }
    }

    if (!this.runningProperty.value || scaledDt <= 0) {
      return
    }

    const demyelinated = this.challengeProperty.value === 'demyelination'
    const base = this.myelinProperty.value ? 1.25 : (demyelinated ? 0.2 : 0.36)
    const speed = base * Math.max(0.35, this.speedScaleProperty.value) * this.effectiveSpeed()
    const prev = this.tProperty.value
    this.tProperty.value += scaledDt * speed
    this.lapClock += scaledDt

    if (this.myelinProperty.value) {
      const hop = Math.floor((this.tProperty.value % 1) * this.nodeCount())
      if (hop !== this.lastHop && this.tProperty.value % 1 > 0.01) {
        this.hopIndexProperty.value = hop
        this.lastHop = hop
      }
    }

    if (this.challengeProperty.value === 'race' && this.racePhaseProperty.value > 0) {
      this.raceClock += scaledDt
    }

    if (prev % 1 < 0.92 && this.tProperty.value % 1 >= 0.92) {
      this.arrivedProperty.value = true
      this.onArrive()
    }
    else if (this.tProperty.value % 1 < 0.2) {
      this.arrivedProperty.value = false
    }
  }

  private onArrive(): void {
    this.lastLapResultProperty.value = { time: this.lapClock, myelinOn: this.lapMyelinAtFire }

    if (this.synapseDelayProperty.value > 0.05) {
      this.awaitingSynapse = true
      this.synapseTimer = 0
      this.runningProperty.value = this.challengeProperty.value === 'race'
    }

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
        this.raceCompletedProperty.value = true
        this.recomputeStars()
      }
    }
    else if (this.challengeProperty.value === 'demyelination') {
      this.statusProperty.value = 'Signal survived — but slowly. Real MS can also block signals entirely.'
      this.runningProperty.value = false
    }
    else {
      this.statusProperty.value = this.awaitingSynapse
        ? 'Reached terminal — waiting across the synaptic cleft…'
        : 'Signal reached the synaptic terminal — transmitters release!'
      this.runningProperty.value = false
    }
  }

  public recordQuizAnswer(correct: boolean): void {
    if (correct) {
      this.quizCorrectProperty.value = true
    }
    this.recomputeStars()
  }

  private recomputeStars(): void {
    let stars = 0
    if (this.raceCompletedProperty.value) {
      stars += 1
    }
    if (this.quizCorrectProperty.value) {
      stars += 1
    }
    this.starsProperty.value = stars
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
    this.showIonsProperty.reset()
    this.raceUnlockedProperty.reset()
    this.raceCompletedProperty.reset()
    this.quizCorrectProperty.reset()
    this.starsProperty.reset()
    this.fireCountProperty.reset()
    this.lastLapResultProperty.value = null
    this.soundEnabledProperty.reset()
    this.axonLengthProperty.reset()
    this.nodeCountProperty.reset()
    this.axonDiameterProperty.reset()
    this.thresholdProperty.reset()
    this.stimulusStrengthProperty.reset()
    this.synapseDelayProperty.reset()
    this.simSpeedProperty.reset()
    this.showPartsProperty.reset()
    this.showAPTraceProperty.reset()
    this.autoRepeatProperty.reset()
    this.temperatureProperty.reset()
    this.statusProperty.value = 'Fire a signal — scrub every control to compare.'
    this.raceClock = 0
    this.lastHop = -1
    this.lapClock = 0
    this.lapMyelinAtFire = true
    this.triedMyelinOn = false
    this.triedMyelinOff = false
    this.awaitingSynapse = false
    this.synapseTimer = 0
    this.autoRepeatCooldown = 0
  }
}

function smoothHop(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}
