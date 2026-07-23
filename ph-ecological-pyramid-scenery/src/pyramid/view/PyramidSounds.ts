import { sharedSoundPlayers, soundManager } from 'scenerystack/tambo'
import type { TSoundPlayer } from 'scenerystack/tambo'

/**
 * Thin wrapper around SceneryStack sharedSoundPlayers.
 * Call warm() once during view construction so first plays are not delayed.
 */
export class PyramidSounds {
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
  private lastSliderAt = 0

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
  }

  /** Prefetch shared players (already done in ctor) — kept for API clarity. */
  public warm(): void {
    // players created in constructor
  }

  public setEnabled(on: boolean): void {
    soundManager.enabledProperty.value = on
  }

  public get enabled(): boolean {
    return soundManager.enabledProperty.value
  }

  public tierSelect(): void {
    this.soft.play()
  }

  public modeChange(forward: boolean): void {
    ;(forward ? this.switchR : this.switchL).play()
  }

  public button(): void {
    this.click.play()
  }

  public grabHandle(): void {
    this.grab.play()
  }

  public releaseHandle(): void {
    this.release.play()
  }

  public playPause(running: boolean): void {
    ;(running ? this.play : this.pause).play()
  }

  public resetAll(): void {
    this.reset.play()
  }

  public quizCorrect(): void {
    this.collect.play()
  }

  public quizWrong(): void {
    this.boundary.play()
  }

  public scenario(): void {
    this.step.play()
  }

  public decomposer(): void {
    this.erase.play()
  }

  public sliderTick(): void {
    const now = Date.now()
    if (now - this.lastSliderAt < 70) return
    this.lastSliderAt = now
    this.soft.play()
  }

  public heatWhoosh(): void {
    this.boundary.play()
  }
}
