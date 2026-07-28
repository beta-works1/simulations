import { sharedSoundPlayers, soundManager } from 'scenerystack/tambo'
import type { TSoundPlayer } from 'scenerystack/tambo'

/**
 * Heredity-parity sounds: SceneryStack tambo + WebAudio fallback so cues always
 * hearable after the first user gesture (even if tambo is muted/unavailable).
 */
export class ElectricitySounds {
  private readonly click: TSoundPlayer
  private readonly soft: TSoundPlayer
  private readonly grab: TSoundPlayer
  private readonly release: TSoundPlayer
  private readonly play: TSoundPlayer
  private readonly pause: TSoundPlayer
  private readonly reset: TSoundPlayer
  private readonly switchL: TSoundPlayer
  private readonly switchR: TSoundPlayer
  private readonly collect: TSoundPlayer
  private readonly boundary: TSoundPlayer
  private readonly erase: TSoundPlayer
  private readonly step: TSoundPlayer
  private readonly toggleOn: TSoundPlayer
  private readonly toggleOff: TSoundPlayer
  private readonly open: TSoundPlayer
  private readonly close: TSoundPlayer
  private lastSliderAt = 0
  private lastHopAt = 0
  private enabled = true
  private unlocked = false
  private audioCtx: AudioContext | null = null

  public constructor() {
    this.click = sharedSoundPlayers.get('pushButton')
    this.soft = sharedSoundPlayers.get('generalSoftClick')
    this.grab = sharedSoundPlayers.get('grab')
    this.release = sharedSoundPlayers.get('release')
    this.play = sharedSoundPlayers.get('play')
    this.pause = sharedSoundPlayers.get('pause')
    this.reset = sharedSoundPlayers.get('resetAll')
    this.switchL = sharedSoundPlayers.get('switchToLeft')
    this.switchR = sharedSoundPlayers.get('switchToRight')
    this.collect = sharedSoundPlayers.get('generalOpen')
    this.boundary = sharedSoundPlayers.get('generalBoundaryBoop')
    this.erase = sharedSoundPlayers.get('erase')
    this.step = sharedSoundPlayers.get('stepForward')
    this.toggleOn = sharedSoundPlayers.get('toggleOn')
    this.toggleOff = sharedSoundPlayers.get('toggleOff')
    this.open = sharedSoundPlayers.get('generalOpen')
    this.close = sharedSoundPlayers.get('generalClose')
    try {
      soundManager.enabledProperty.value = true
    }
    catch {
      /* ignore until init finishes */
    }
  }

  public setEnabled(on: boolean): void {
    this.enabled = on
    try {
      soundManager.enabledProperty.value = on
    }
    catch {
      /* ignore */
    }
  }

  /** Call from the first pointer-down so AudioContext + tambo unlock. */
  public unlock(): void {
    if (this.unlocked) return
    this.unlocked = true
    this.ensureCtx()
    try {
      soundManager.enabledProperty.value = this.enabled
    }
    catch {
      /* ignore */
    }
  }

  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    if (!this.audioCtx) this.audioCtx = new AC()
    if (this.audioCtx.state === 'suspended') {
      void this.audioCtx.resume().catch(() => {})
    }
    return this.audioCtx
  }

  private tone(
    freq: number,
    durationSec: number,
    opts?: { type?: OscillatorType; gain?: number; slideTo?: number },
  ): void {
    if (!this.enabled) return
    const audio = this.ensureCtx()
    if (!audio) return
    const now = audio.currentTime
    const osc = audio.createOscillator()
    const gain = audio.createGain()
    osc.type = opts?.type ?? 'sine'
    osc.frequency.setValueAtTime(freq, now)
    if (opts?.slideTo != null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, opts.slideTo), now + durationSec)
    }
    const peak = opts?.gain ?? 0.09
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec)
    osc.connect(gain)
    gain.connect(audio.destination)
    osc.start(now)
    osc.stop(now + durationSec + 0.02)
  }

  private playTambo(player: TSoundPlayer, fallback: () => void): void {
    if (!this.enabled) return
    this.unlock()
    try {
      player.play()
    }
    catch {
      /* fall through */
    }
    // Always layer a short WebAudio cue so the user hears feedback even when
    // tambo assets are blocked/muted by the host shell.
    fallback()
  }

  public button(): void {
    this.playTambo(this.click, () => this.tone(720, 0.07, { type: 'triangle', gain: 0.08, slideTo: 420 }))
  }

  public softClick(): void {
    this.playTambo(this.soft, () => this.tone(880, 0.04, { type: 'sine', gain: 0.045 }))
  }

  public playPause(running: boolean): void {
    this.playTambo(running ? this.play : this.pause, () =>
      this.tone(running ? 640 : 360, 0.09, { type: 'triangle', gain: 0.08 }),
    )
  }

  public resetAll(): void {
    this.playTambo(this.reset, () => this.tone(280, 0.12, { type: 'sawtooth', gain: 0.05, slideTo: 180 }))
  }

  public modeChange(forward = true): void {
    this.playTambo(forward ? this.switchR : this.switchL, () =>
      this.tone(forward ? 520 : 380, 0.08, { type: 'sine', gain: 0.07, slideTo: forward ? 780 : 280 }),
    )
  }

  /** A cross begins — parents combine. */
  public cross(): void {
    this.playTambo(this.grab, () => this.tone(240, 0.12, { type: 'square', gain: 0.06, slideTo: 520 }))
  }

  /** Zoom in/out between scale levels (cell → nucleus → chromosome → DNA → gene). */
  public zoomStep(zoomingIn: boolean): void {
    this.playTambo(this.grab, () =>
      this.tone(zoomingIn ? 320 : 620, 0.1, { type: 'square', gain: 0.06, slideTo: zoomingIn ? 640 : 300 }),
    )
  }

  /** A single offspring cell reveals. */
  public hop(): void {
    const now = Date.now()
    if (now - this.lastHopAt < 90) return
    this.lastHopAt = now
    this.playTambo(this.boundary, () => this.tone(980, 0.045, { type: 'sine', gain: 0.05 }))
  }

  public synapse(): void {
    this.playTambo(this.release, () => this.tone(660, 0.1, { type: 'triangle', gain: 0.07, slideTo: 420 }))
  }

  public reveal(): void {
    this.playTambo(this.collect, () => this.tone(180, 0.14, { type: 'square', gain: 0.07, slideTo: 90 }))
  }

  public correct(): void {
    this.playTambo(this.open, () => {
      this.tone(523, 0.08, { type: 'sine', gain: 0.07 })
      setTimeout(() => this.tone(784, 0.1, { type: 'sine', gain: 0.07 }), 70)
    })
  }

  public wrong(): void {
    this.playTambo(this.close, () => this.tone(220, 0.14, { type: 'sawtooth', gain: 0.05, slideTo: 120 }))
  }

  public celebrate(): void {
    this.playTambo(this.step, () => {
      ;[523.25, 659.25, 783.99].forEach((f, i) => {
        setTimeout(() => this.tone(f, 0.12, { type: 'sine', gain: 0.07 }), i * 55)
      })
    })
  }

  public scenario(): void {
    this.playTambo(this.step, () => this.tone(440, 0.1, { type: 'triangle', gain: 0.07, slideTo: 660 }))
  }

  public select(): void {
    this.playTambo(this.soft, () => this.tone(700, 0.05, { type: 'sine', gain: 0.05 }))
  }

  public toggle(on: boolean): void {
    this.playTambo(on ? this.toggleOn : this.toggleOff, () =>
      this.tone(on ? 560 : 320, 0.08, { type: 'sine', gain: 0.07, slideTo: on ? 820 : 220 }),
    )
  }

  public remove(): void {
    this.playTambo(this.erase, () => this.tone(300, 0.08, { type: 'triangle', gain: 0.05, slideTo: 160 }))
  }

  public sliderTick(): void {
    const now = Date.now()
    if (now - this.lastSliderAt < 70) return
    this.lastSliderAt = now
    this.playTambo(this.soft, () => this.tone(900, 0.03, { type: 'sine', gain: 0.04 }))
  }
}
