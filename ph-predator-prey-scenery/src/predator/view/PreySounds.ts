import { sharedSoundPlayers, soundManager } from 'scenerystack/tambo'
import type { TSoundPlayer } from 'scenerystack/tambo'

/** SceneryStack tambo sounds for Predator–Prey Dynamics. */
export class PreySounds {
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
  private lastHuntAt = 0

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

  public modeChange(forward: boolean): void {
    ;(forward ? this.switchR : this.switchL).play()
  }

  public spawnPrey(): void {
    this.collect.play()
  }

  public spawnPredator(): void {
    this.grab.play()
  }

  public cull(): void {
    this.erase.play()
  }

  public scenario(): void {
    this.step.play()
  }

  public hunt(): void {
    const now = Date.now()
    if (now - this.lastHuntAt < 220) return
    this.lastHuntAt = now
    this.boundary.play()
  }

  public cyclePeak(): void {
    this.release.play()
  }

  public sliderTick(): void {
    const now = Date.now()
    if (now - this.lastSliderAt < 70) return
    this.lastSliderAt = now
    this.soft.play()
  }
}
