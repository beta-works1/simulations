import { sharedSoundPlayers, soundManager } from 'scenerystack/tambo'
import type { TSoundPlayer } from 'scenerystack/tambo'

/** Shared SceneryStack tambo players for Food Web / Food Chain. */
export class EcologySounds {
  private readonly click: TSoundPlayer
  private readonly soft: TSoundPlayer
  private readonly grab: TSoundPlayer
  private readonly release: TSoundPlayer
  private readonly reset: TSoundPlayer
  private readonly close: TSoundPlayer
  private readonly step: TSoundPlayer
  private readonly erase: TSoundPlayer
  private readonly toggleOn: TSoundPlayer
  private readonly toggleOff: TSoundPlayer
  private readonly collect: TSoundPlayer
  private lastSliderAt = 0

  public constructor() {
    this.click = sharedSoundPlayers.get('pushButton')
    this.soft = sharedSoundPlayers.get('generalSoftClick')
    this.grab = sharedSoundPlayers.get('grab')
    this.release = sharedSoundPlayers.get('release')
    this.reset = sharedSoundPlayers.get('resetAll')
    this.close = sharedSoundPlayers.get('generalClose')
    this.step = sharedSoundPlayers.get('stepForward')
    this.erase = sharedSoundPlayers.get('erase')
    this.toggleOn = sharedSoundPlayers.get('toggleOn')
    this.toggleOff = sharedSoundPlayers.get('toggleOff')
    this.collect = sharedSoundPlayers.get('generalOpen')
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

  public grabStart(): void {
    this.grab.play()
  }

  public dropOk(): void {
    this.release.play()
  }

  public dropMiss(): void {
    this.close.play()
  }

  public linkToggle(on: boolean): void {
    ;(on ? this.toggleOn : this.toggleOff).play()
  }

  public linkMade(): void {
    this.collect.play()
  }

  public select(): void {
    this.soft.play()
  }

  public remove(): void {
    this.erase.play()
  }

  public loadExample(): void {
    this.step.play()
  }

  public resetAll(): void {
    this.reset.play()
  }

  public sliderTick(): void {
    const now = Date.now()
    if (now - this.lastSliderAt < 70) return
    this.lastSliderAt = now
    this.soft.play()
  }
}
