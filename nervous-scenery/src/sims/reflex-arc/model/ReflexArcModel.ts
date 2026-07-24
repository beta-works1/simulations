import { BooleanProperty, NumberProperty, Property, StringProperty } from 'scenerystack/axon'
import { TModel } from 'scenerystack/joist'

export type ReflexChallenge = 'explore' | 'compare' | 'scenario' | 'knee'
export type StimulusType = 'touch' | 'heat' | 'pinch' | 'stretch'
export type EffectorType = 'muscle' | 'gland'

/**
 * Dense ecology-style control surface for the reflex arc (Ch1 carbon parity).
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
  public readonly starsProperty: NumberProperty
  public readonly tipsProperty: NumberProperty
  public readonly tipTextProperty: StringProperty
  public readonly quizPromptsProperty: NumberProperty
  public readonly trialCountProperty: NumberProperty
  public readonly lastTrialDurationProperty: NumberProperty
  public readonly lastTrialViaBrainProperty: BooleanProperty

  // ── Dense controls (Ch1 carbon-style) ────────────────────────────────────
  public readonly stimulusTypeProperty: Property<StimulusType>
  public readonly stimulusIntensityProperty: NumberProperty
  public readonly receptorSensitivityProperty: NumberProperty
  public readonly interneuronCountProperty: NumberProperty
  public readonly awarenessDelayProperty: NumberProperty
  public readonly simSpeedProperty: NumberProperty
  public readonly showLabelsProperty: BooleanProperty
  public readonly showSynapsesProperty: BooleanProperty
  public readonly showPathGlowProperty: BooleanProperty
  public readonly effectorTypeProperty: Property<EffectorType>
  public readonly autoRepeatProperty: BooleanProperty

  private prevSegment = -1
  private scenarioTimer = 0
  private trialElapsed = 0
  private firstFireTipShown = false
  private awarenessTimer = 0
  private awaitingAwareness = false
  private autoRepeatCooldown = 0

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

    this.stimulusTypeProperty = new Property<StimulusType>('touch')
    this.stimulusIntensityProperty = new NumberProperty(70)
    this.receptorSensitivityProperty = new NumberProperty(1)
    this.interneuronCountProperty = new NumberProperty(1)
    this.awarenessDelayProperty = new NumberProperty(0.6)
    this.simSpeedProperty = new NumberProperty(1)
    this.showLabelsProperty = new BooleanProperty(true)
    this.showSynapsesProperty = new BooleanProperty(true)
    this.showPathGlowProperty = new BooleanProperty(true)
    this.effectorTypeProperty = new Property<EffectorType>('muscle')
    this.autoRepeatProperty = new BooleanProperty(false)
  }

  /** Effective conduction multiplier from intensity × sensitivity × interneuron lag. */
  public effectiveSpeed(): number {
    const intensity = 0.55 + (this.stimulusIntensityProperty.value / 100) * 0.7
    const sens = Math.max(0.35, this.receptorSensitivityProperty.value)
    const inter = 1 / (1 + this.interneuronCountProperty.value * 0.22)
    const mono = this.interneuronCountProperty.value < 0.5 ? 1.25 : 1
    return intensity * sens * inter * mono
  }

  public fire(): void {
    // Weak stimulus + low sensitivity → refuse to fire (threshold teaching).
    const drive = (this.stimulusIntensityProperty.value / 100) * this.receptorSensitivityProperty.value
    if (drive < 0.28) {
      this.statusProperty.value = 'Too weak — raise intensity or receptor sensitivity.'
      this.showTip('Receptors need a strong enough stimulus to reach threshold and fire.')
      return
    }

    if (this.interneuronCountProperty.value < 0.5) {
      this.viaBrainProperty.value = false
    }

    this.progressProperty.value = 0
    this.firedProperty.value = true
    this.runningProperty.value = true
    this.prevSegment = -1
    this.trialElapsed = 0
    this.junctionIndexProperty.value = -1
    this.awaitingAwareness = false
    this.awarenessTimer = 0
    this.statusProperty.value = this.viaBrainProperty.value
      ? 'Signal climbing toward the brain…'
      : 'Fast spinal reflex in progress…'

    if (!this.firstFireTipShown) {
      this.firstFireTipShown = true
      this.showTip('Watch the gold dot: receptor → spinal cord → effector. Toggle brain to compare timing.')
    }
  }

  public stepOnce(): void {
    if (!this.firedProperty.value || this.progressProperty.value >= 1) {
      this.fire()
      return
    }
    this.runningProperty.value = true
    this.step(0.12)
    this.runningProperty.value = false
    this.statusProperty.value = 'Stepped once — press Step again or Play.'
  }

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
    this.showTip(
      `Interneurons live here! Current count ≈ ${Math.round(this.interneuronCountProperty.value)}. ` +
        '0 ≈ monosynaptic (knee-jerk). More interneurons = slightly slower relay.',
    )
    this.statusProperty.value = 'Interneurons connect sensory input to motor output.'
  }

  public setViaBrain(value: boolean): void {
    if (value && this.interneuronCountProperty.value < 0.5) {
      this.statusProperty.value = 'Monosynaptic mode (0 interneurons) stays spinal-only.'
      return
    }
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
      this.statusProperty.value = 'Compare: fire once spinal, once via brain.'
    }
    else if (mode === 'scenario') {
      this.stimulusTypeProperty.value = 'heat'
      this.stimulusIntensityProperty.value = 90
      this.statusProperty.value = 'Hot iron! Spinal reflex fires first…'
      this.viaBrainProperty.value = false
      this.fire()
      this.scenarioPhaseProperty.value = 1
    }
    else if (mode === 'knee') {
      this.stimulusTypeProperty.value = 'stretch'
      this.interneuronCountProperty.value = 0
      this.viaBrainProperty.value = false
      this.statusProperty.value = 'Knee-jerk — monosynaptic, brain not needed!'
      this.showTip("Doctor's knee-tap stretches a muscle — the kick returns before the brain gets involved.")
      this.fire()
    }
    else {
      this.statusProperty.value = 'Explore — scrub every control and compare paths.'
    }
  }

  public step(dt: number): void {
    const scaledDt = dt * Math.max(0.25, this.simSpeedProperty.value)

    if (this.awaitingAwareness) {
      this.awarenessTimer += scaledDt
      if (this.awarenessTimer >= this.awarenessDelayProperty.value) {
        this.awaitingAwareness = false
        this.statusProperty.value =
          this.effectorTypeProperty.value === 'gland'
            ? 'Gland responded — and now the brain “notices” the stimulus.'
            : 'Muscle kicked — and now the brain “notices” the stimulus.'
      }
    }

    if (this.challengeProperty.value === 'scenario') {
      this.stepScenario(scaledDt)
    }

    if (this.autoRepeatProperty.value && !this.runningProperty.value && this.progressProperty.value >= 1) {
      this.autoRepeatCooldown += scaledDt
      if (this.autoRepeatCooldown > 0.85) {
        this.autoRepeatCooldown = 0
        this.fire()
      }
    }

    if (!this.runningProperty.value || !this.firedProperty.value || scaledDt <= 0) {
      return
    }

    this.trialElapsed += scaledDt
    const base = this.viaBrainProperty.value ? 0.34 : 0.68
    const speed = base * Math.max(0.35, this.speedScaleProperty.value) * this.effectiveSpeed()
    this.progressProperty.value = Math.min(1, this.progressProperty.value + scaledDt * speed)

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

    const effectorWord = this.effectorTypeProperty.value === 'gland' ? 'Gland secreted' : 'Effector kicked'
    if (this.viaBrainProperty.value) {
      this.brainTrialsProperty.value += 1
      this.statusProperty.value = `${effectorWord} via brain — slower, but you “noticed” it.`
    }
    else {
      this.spinalTrialsProperty.value += 1
      this.statusProperty.value = `${effectorWord}! Fast spinal reflex finished.`
      if (this.awarenessDelayProperty.value > 0.05) {
        this.awaitingAwareness = true
        this.awarenessTimer = 0
      }
    }

    if (this.challengeProperty.value === 'knee' && !this.kneeCompleteProperty.value) {
      this.kneeCompleteProperty.value = true
      this.starsProperty.value += 1
      this.showTip('Knee-jerk complete! Spinal cord alone — no brain needed.')
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
    this.stimulusTypeProperty.reset()
    this.stimulusIntensityProperty.reset()
    this.receptorSensitivityProperty.reset()
    this.interneuronCountProperty.reset()
    this.awarenessDelayProperty.reset()
    this.simSpeedProperty.reset()
    this.showLabelsProperty.reset()
    this.showSynapsesProperty.reset()
    this.showPathGlowProperty.reset()
    this.effectorTypeProperty.reset()
    this.autoRepeatProperty.reset()
    this.prevSegment = -1
    this.scenarioTimer = 0
    this.trialElapsed = 0
    this.firstFireTipShown = false
    this.awaitingAwareness = false
    this.awarenessTimer = 0
    this.autoRepeatCooldown = 0
  }
}
