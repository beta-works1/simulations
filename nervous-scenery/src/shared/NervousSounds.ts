import { sharedSoundPlayers, soundManager } from 'scenerystack/tambo'
import type { TSoundPlayer } from 'scenerystack/tambo'

/**
 * SceneryStack tambo sounds for nervous-system sims (ecology / Ch1 pattern).
 */
export class NervousSounds {
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
  private lastPulseAt = 0

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

  public modeChange(forward = true): void {
    ;(forward ? this.switchR : this.switchL).play()
  }

  public fireSignal(): void {
    this.grab.play()
  }

  public hop(): void {
    const now = Date.now()
    if (now - this.lastHopAt < 90) return
    this.lastHopAt = now
    this.boundary.play()
  }

  public pulseTick(): void {
    const now = Date.now()
    if (now - this.lastPulseAt < 160) return
    this.lastPulseAt = now
    this.soft.play()
  }

  public synapse(): void {
    this.release.play()
  }

  public effectorKick(): void {
    this.collect.play()
  }

  public correct(): void {
    this.open.play()
  }

  public wrong(): void {
    this.close.play()
  }

  public celebrate(): void {
    this.step.play()
  }

  public scenario(): void {
    this.step.play()
  }

  public select(): void {
    this.soft.play()
  }

  public toggle(on: boolean): void {
    ;(on ? this.toggleOn : this.toggleOff).play()
  }

  public remove(): void {
    this.erase.play()
  }

  public sliderTick(): void {
    const now = Date.now()
    if (now - this.lastSliderAt < 70) return
    this.lastSliderAt = now
    this.soft.play()
  }
}
