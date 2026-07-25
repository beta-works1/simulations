import { Circle, Node } from 'scenerystack/scenery'
import { damp } from '../HeredityConstants.js'

type AfterImage = {
  node: Circle
  life: number
  maxLife: number
}

/**
 * Soft glowing afterimage trail behind a moving signal (ecology-style motion polish).
 */
export class SignalTrail extends Node {
  private readonly ghosts: AfterImage[] = []
  private readonly maxGhosts: number
  private readonly color: string
  private spawnAcc = 0

  public constructor(options: { color?: string; maxGhosts?: number } = {}) {
    super({ pickable: false })
    this.color = options.color ?? 'rgba(241,196,15,0.55)'
    this.maxGhosts = options.maxGhosts ?? 18
  }

  public push(x: number, y: number, radius = 10): void {
    this.spawnAcc += 1
    if (this.spawnAcc < 2) return
    this.spawnAcc = 0
    if (this.ghosts.length >= this.maxGhosts) {
      const old = this.ghosts.shift()
      if (old) this.removeChild(old.node)
    }
    const node = new Circle(radius, {
      fill: this.color,
      centerX: x,
      centerY: y,
      pickable: false,
      opacity: 0.55,
    })
    this.addChild(node)
    this.ghosts.push({ node, life: 0.45, maxLife: 0.45 })
  }

  public step(dt: number): void {
    for (let i = this.ghosts.length - 1; i >= 0; i--) {
      const g = this.ghosts[i]
      g.life -= dt
      if (g.life <= 0) {
        this.removeChild(g.node)
        this.ghosts.splice(i, 1)
        continue
      }
      const t = g.life / g.maxLife
      g.node.opacity = t * 0.55
      g.node.radius = damp(g.node.radius, 2, 4, dt)
    }
  }

  public clear(): void {
    for (const g of this.ghosts) {
      this.removeChild(g.node)
    }
    this.ghosts.length = 0
  }
}
