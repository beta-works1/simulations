import { sharedSoundPlayers, soundManager } from 'scenerystack/tambo'
import type { TSoundPlayer } from 'scenerystack/tambo'

/** Shared SceneryStack tambo players for Global Warming. */
export class WarmingSounds {
  private readonly click: TSoundPlayer
  private readonly soft: TSoundPlayer
  private readonly grab: TSoundPlayer
  private readonly release: TSoundPlayer
  private readonly play: TSoundPlayer
  private readonly pause: TSoundPlayer
  private readonly reset: TSoundPlayer
  private readonly step: TSoundPlayer
  private readonly toggleOn: TSoundPlayer
  private readonly toggleOff: TSoundPlayer
  private lastSliderAt = 0

  public constructor() {
    this.click = sharedSoundPlayers.get('pushButton')
    this.soft = sharedSoundPlayers.get('generalSoftClick')
    this.grab = sharedSoundPlayers.get('grab')
    this.release = sharedSoundPlayers.get('release')
    this.play = sharedSoundPlayers.get('play')
    this.pause = sharedSoundPlayers.get('pause')
    this.reset = sharedSoundPlayers.get('resetAll')
    this.step = sharedSoundPlayers.get('stepForward')
    this.toggleOn = sharedSoundPlayers.get('toggleOn')
    this.toggleOff = sharedSoundPlayers.get('toggleOff')
  }

  public warm(): void {
    // Ensure audio unlock path is ready in browsers that gate playback.
    soundManager.enabledProperty.value = true
  }

  public setEnabled(on: boolean): void {
    soundManager.enabledProperty.value = on
  }

  public button(): void {
    this.click.play()
  }

  public softClick(): void {
    this.soft.play()
  }

  public playPause(running: boolean): void {
    ;(running ? this.play : this.pause).play()
  }

  public resetAll(): void {
    this.reset.play()
  }

  public scenario(): void {
    this.step.play()
  }

  public toggle(on: boolean): void {
    ;(on ? this.toggleOn : this.toggleOff).play()
  }

  public grabHandle(): void {
    this.grab.play()
  }

  public releaseHandle(): void {
    this.release.play()
  }

  public sliderTick(): void {
    const now = Date.now()
    if (now - this.lastSliderAt < 70) return
    this.lastSliderAt = now
    this.soft.play()
  }
}
