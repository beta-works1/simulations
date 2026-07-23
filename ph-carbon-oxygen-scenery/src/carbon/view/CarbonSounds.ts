import { sharedSoundPlayers, soundManager } from 'scenerystack/tambo'
import type { TSoundPlayer } from 'scenerystack/tambo'

/** Shared SceneryStack tambo players for Carbon–Oxygen Cycle. */
export class CarbonSounds {
  private readonly click: TSoundPlayer
  private readonly soft: TSoundPlayer
  private readonly grab: TSoundPlayer
  private readonly play: TSoundPlayer
  private readonly pause: TSoundPlayer
  private readonly reset: TSoundPlayer
  private readonly switchL: TSoundPlayer
  private readonly switchR: TSoundPlayer
  private readonly open: TSoundPlayer
  private readonly close: TSoundPlayer
  private readonly step: TSoundPlayer
  private readonly erase: TSoundPlayer
  private readonly toggleOn: TSoundPlayer
  private readonly toggleOff: TSoundPlayer
  private lastSliderAt = 0

  public constructor() {
    this.click = sharedSoundPlayers.get('pushButton')
    this.soft = sharedSoundPlayers.get('generalSoftClick')
    this.grab = sharedSoundPlayers.get('grab')
    this.play = sharedSoundPlayers.get('play')
    this.pause = sharedSoundPlayers.get('pause')
    this.reset = sharedSoundPlayers.get('resetAll')
    this.switchL = sharedSoundPlayers.get('switchToLeft')
    this.switchR = sharedSoundPlayers.get('switchToRight')
    this.open = sharedSoundPlayers.get('generalOpen')
    this.close = sharedSoundPlayers.get('generalClose')
    this.step = sharedSoundPlayers.get('stepForward')
    this.erase = sharedSoundPlayers.get('erase')
    this.toggleOn = sharedSoundPlayers.get('toggleOn')
    this.toggleOff = sharedSoundPlayers.get('toggleOff')
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

  public tipOpen(): void {
    this.open.play()
  }

  public tipClose(): void {
    this.close.play()
  }

  public dayNight(isDay: boolean): void {
    ;(isDay ? this.switchR : this.switchL).play()
  }

  public toggle(on: boolean): void {
    ;(on ? this.toggleOn : this.toggleOff).play()
  }

  public processTap(kind: 'trees' | 'animals' | 'factory' | 'soil'): void {
    if (kind === 'soil') this.erase.play()
    else if (kind === 'factory') this.grab.play()
    else this.soft.play()
  }

  public sliderTick(): void {
    const now = Date.now()
    if (now - this.lastSliderAt < 70) return
    this.lastSliderAt = now
    this.soft.play()
  }
}
