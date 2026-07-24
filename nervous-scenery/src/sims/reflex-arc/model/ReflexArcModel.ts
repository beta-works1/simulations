import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'

export type ReflexChallenge = 'explore' | 'compare' | 'scenario' | 'knee'

/**
 * Reflex arc pathway — ecology-depth model with speed scrub, compare challenge,
 * hot-iron scenario, knee-jerk scenario, pause-mid-travel, stars, tips, and
 * trial-duration history (spinal vs brain).
 */
export class ReflexArcModel implements TModel {
  public readonly viaBrainProperty: BooleanProperty
  public readonly firedProperty: BooleanProperty
  public readonly runningProperty: BooleanProperty
  public readonly progressProperty: NumberProperty
  public readonly speedScaleProperty: NumberProperty
  public readonly challengeProperty: Property<ReflexChallenge>
  public readonly spinalTrialsProperty: NumberProperty
  public readonly brainTrialsProperty: NumberProperty
  public readonly compareCompleteProperty: BooleanProperty
  public readonly scenarioPhaseProperty: NumberProperty
  public readonly kneeCompleteProperty: BooleanProperty
  public readonly statusProperty: StringProperty
  public readonly junctionIndexProperty: NumberProperty
  public readonly soundEnabledProperty: BooleanProperty

  /** Earned for: compare complete, correct quiz answer, scenario/knee finish. */
  public readonly starsProperty: NumberProperty

  /** Bumped whenever the view should pop up a timed tip; read tipTextProperty for the copy. */
  public readonly tipsProperty: NumberProperty
  public readonly tipTextProperty: StringProperty

  /** Bumped whenever the view should present the mini quiz. */
  public readonly quizPromptsProperty: NumberProperty

  /** Most recent completed trial — bump trialCountProperty, then read the other two. */
  public readonly trialCountProperty: NumberProperty
  public readonly lastTrialDurationProperty: NumberProperty
  public readonly lastTrialViaBrainProperty: BooleanProperty

  private prevSegment = -1
  private scenarioTimer = 0
  private trialElapsed = 0
  private firstFireTipShown = false

  public constructor() {
    this.viaBrainProperty = new BooleanProperty(false)
    this.firedProperty = new BooleanProperty(false)
    this.runningProperty = new BooleanProperty(false)
    this.progressProperty = new NumberProperty(0)
    this.speedScaleProperty = new NumberProperty(1)
    this.challengeProperty = new Property<ReflexChallenge>('explore')
    this.spinalTrialsProperty = new NumberProperty(0)
    this.brainTrialsProperty = new NumberProperty(0)
    this.compareCompleteProperty = new BooleanProperty(false)
    this.scenarioPhaseProperty = new NumberProperty(0)
    this.kneeCompleteProperty = new BooleanProperty(false)
    this.statusProperty = new StringProperty('Tap the receptor to fire a reflex.')
    this.junctionIndexProperty = new NumberProperty(-1)
    this.soundEnabledProperty = new BooleanProperty(true)
    this.starsProperty = new NumberProperty(0)
    this.tipsProperty = new NumberProperty(0)
    this.tipTextProperty = new StringProperty('')
    this.quizPromptsProperty = new NumberProperty(0)
    this.trialCountProperty = new NumberProperty(0)
    this.lastTrialDurationProperty = new NumberProperty(0)
    this.lastTrialViaBrainProperty = new BooleanProperty(false)
  }

  public fire(): void {
    this.progressProperty.value = 0
    this.firedProperty.value = true
    this.runningProperty.value = true
    this.prevSegment = -1
    this.trialElapsed = 0
    this.junctionIndexProperty.value = -1
    this.statusProperty.value = this.viaBrainProperty.value
      ? 'Signal climbing toward the brain…'
      : 'Fast spinal reflex in progress…'

    if (!this.firstFireTipShown) {
      this.firstFireTipShown = true
      this.showTip('Watch the gold dot race from receptor → spinal cord → effector (or up to the brain first, if toggled on).')
    }
  }

  /** Pauses or resumes a signal that is mid-travel; fires fresh if nothing is running. */
  public togglePlayPause(): void {
    if (!this.firedProperty.value || this.progressProperty.value >= 1) {
      this.fire()
      return
    }
    this.runningProperty.value = !this.runningProperty.value
    this.statusProperty.value = this.runningProperty.value
      ? 'Resumed — signal moving again…'
      : 'Paused mid-travel — press play to continue.'
  }

  public tapSpinalCord(): void {
    this.showTip('Interneurons live here! Inside the spinal cord they link the sensory (incoming) neuron straight to the motor (outgoing) neuron.')
    this.statusProperty.value = 'Interneurons live here — connecting sensory input to motor output.'
  }

  public setViaBrain(value: boolean): void {
    this.viaBrainProperty.value = value
    this.progressProperty.value = 0
    this.firedProperty.value = false
    this.runningProperty.value = false
    this.prevSegment = -1
    this.junctionIndexProperty.value = -1
    this.statusProperty.value = value
      ? 'Brain is on the path — expect a slower journey.'
      : 'Brain skipped — classic spinal reflex path.'
  }

  public setChallenge(mode: ReflexChallenge): void {
    this.challengeProperty.value = mode
    this.scenarioPhaseProperty.value = 0
    this.scenarioTimer = 0
    this.progressProperty.value = 0
    this.firedProperty.value = false
    this.runningProperty.value = false
    if (mode === 'compare') {
      this.statusProperty.value = 'Compare challenge: fire once spinal, once via brain.'
    }
    else if (mode === 'scenario') {
      this.statusProperty.value = 'Hot iron! Spinal reflex fires first — watch carefully.'
      this.viaBrainProperty.value = false
      this.fire()
      this.scenarioPhaseProperty.value = 1
    }
    else if (mode === 'knee') {
      this.statusProperty.value = 'Knee-jerk reflex — purely spinal, brain not needed!'
      this.viaBrainProperty.value = false
      this.showTip('Doctor\'s knee-tap stretches a muscle — the leg kicks back before your brain ever gets involved.')
      this.fire()
    }
    else {
      this.statusProperty.value = 'Explore freely — toggle brain and scrub signal speed.'
    }
  }

  public step(dt: number): void {
    if (this.challengeProperty.value === 'scenario') {
      this.stepScenario(dt)
    }

    if (!this.runningProperty.value || !this.firedProperty.value || dt <= 0) {
      return
    }

    this.trialElapsed += dt
    const base = this.viaBrainProperty.value ? 0.34 : 0.68
    const speed = base * Math.max(0.35, this.speedScaleProperty.value)
    this.progressProperty.value = Math.min(1, this.progressProperty.value + dt * speed)

    const segments = this.viaBrainProperty.value ? 4 : 2
    const seg = Math.min(segments - 1, Math.floor(this.progressProperty.value * segments))
    if (seg !== this.prevSegment) {
      this.junctionIndexProperty.value = seg
      this.prevSegment = seg
    }

    if (this.progressProperty.value >= 1) {
      this.runningProperty.value = false
      this.onArrival()
    }
  }

  public onQuizAnswered(correct: boolean): void {
    if (correct) {
      this.starsProperty.value += 1
      this.statusProperty.value = 'Correct — the spinal-only path skips the brain for speed!'
    }
    else {
      this.statusProperty.value = 'Not quite — the spinal path was the faster one.'
    }
  }

  private showTip(text: string): void {
    this.tipTextProperty.value = text
    this.tipsProperty.value += 1
  }

  private onArrival(): void {
    this.lastTrialDurationProperty.value = this.trialElapsed
    this.lastTrialViaBrainProperty.value = this.viaBrainProperty.value
    this.trialCountProperty.value += 1

    if (this.viaBrainProperty.value) {
      this.brainTrialsProperty.value += 1
      this.statusProperty.value = 'Arrived via brain — slower, but you “noticed” it.'
    }
    else {
      this.spinalTrialsProperty.value += 1
      this.statusProperty.value = 'Effector kicked! Fast spinal reflex finished.'
    }

    if (this.challengeProperty.value === 'knee' && !this.kneeCompleteProperty.value) {
      this.kneeCompleteProperty.value = true
      this.starsProperty.value += 1
      this.showTip('Knee-jerk complete! The spinal cord alone handled it — no brain needed for this one.')
    }

    if (this.spinalTrialsProperty.value > 0 && this.brainTrialsProperty.value > 0) {
      if (!this.compareCompleteProperty.value) {
        this.compareCompleteProperty.value = true
        this.starsProperty.value += 1
        this.quizPromptsProperty.value += 1
      }
      if (this.challengeProperty.value === 'compare') {
        this.statusProperty.value = 'Compare complete — spinal was clearly faster!'
      }
    }
  }

  private stepScenario(dt: number): void {
    const phase = this.scenarioPhaseProperty.value
    if (phase === 1 && this.firedProperty.value && this.progressProperty.value >= 1 && !this.runningProperty.value) {
      this.scenarioTimer += dt
      if (this.scenarioTimer > 1.1) {
        this.scenarioPhaseProperty.value = 2
        this.scenarioTimer = 0
        this.statusProperty.value = 'Now awareness: signal takes the brain path…'
        this.setViaBrain(true)
        this.fire()
        this.scenarioPhaseProperty.value = 3
      }
    }
    else if (phase === 3 && this.firedProperty.value && this.progressProperty.value >= 1 && !this.runningProperty.value) {
      this.scenarioPhaseProperty.value = 4
      this.statusProperty.value = 'Lesson: you pull away before the brain fully “feels” it.'
      this.starsProperty.value += 1
      this.quizPromptsProperty.value += 1
    }
  }

  public reset(): void {
    this.viaBrainProperty.reset()
    this.firedProperty.reset()
    this.runningProperty.reset()
    this.progressProperty.reset()
    this.speedScaleProperty.reset()
    this.challengeProperty.reset()
    this.spinalTrialsProperty.reset()
    this.brainTrialsProperty.reset()
    this.compareCompleteProperty.reset()
    this.scenarioPhaseProperty.reset()
    this.kneeCompleteProperty.reset()
    this.statusProperty.value = 'Tap the receptor to fire a reflex.'
    this.junctionIndexProperty.reset()
    this.soundEnabledProperty.reset()
    this.starsProperty.reset()
    this.tipsProperty.reset()
    this.tipTextProperty.reset()
    this.quizPromptsProperty.reset()
    this.trialCountProperty.reset()
    this.lastTrialDurationProperty.reset()
    this.lastTrialViaBrainProperty.reset()
    this.prevSegment = -1
    this.scenarioTimer = 0
    this.trialElapsed = 0
    this.firstFireTipShown = false
  }
}
