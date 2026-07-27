import { Circle, Node } from 'scenerystack/scenery'

type Spark = {
  node: Circle
  vx: number
  vy: number
  life: number
  maxLife: number
}

/**
 * Lightweight particle bursts for synapse sparks, ion hops, and celebrations.
 * Caps pool size so frame cost stays predictable (ecology-style).
 */
export class ParticleBurst extends Node {
  private readonly sparks: Spark[] = []
  private readonly maxSparks: number

  public constructor(maxSparks = 80) {
    super({ pickable: false })
    this.maxSparks = maxSparks
  }

  public burst(
    x: number,
    y: number,
    options: {
      count?: number
      color?: string
      speed?: number
      life?: number
      radius?: number
      gravity?: number
    } = {},
  ): void {
    const count = options.count ?? 14
    const color = options.color ?? '#f1c40f'
    const speed = options.speed ?? 90
    const life = options.life ?? 0.55
    const radius = options.radius ?? 3.2
    for (let i = 0; i < count; i++) {
      if (this.sparks.length >= this.maxSparks) {
        const old = this.sparks.shift()
        if (old) {
          this.removeChild(old.node)
        }
      }
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4
      const mag = speed * (0.45 + Math.random() * 0.7)
      const node = new Circle(radius * (0.7 + Math.random() * 0.6), {
        fill: color,
        centerX: x,
        centerY: y,
        pickable: false,
      })
      this.addChild(node)
      this.sparks.push({
        node,
        vx: Math.cos(angle) * mag,
        vy: Math.sin(angle) * mag,
        life,
        maxLife: life,
      })
    }
  }

  public step(dt: number, gravity = 40): void {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i]
      s.life -= dt
      if (s.life <= 0) {
        this.removeChild(s.node)
        this.sparks.splice(i, 1)
        continue
      }
      s.vy += gravity * dt
      s.node.centerX += s.vx * dt
      s.node.centerY += s.vy * dt
      s.node.opacity = Math.max(0, s.life / s.maxLife)
      s.node.radius = Math.max(0.5, s.node.radius * (1 - dt * 0.35))
    }
  }

  public clear(): void {
    for (const s of this.sparks) {
      this.removeChild(s.node)
    }
    this.sparks.length = 0
  }
}
