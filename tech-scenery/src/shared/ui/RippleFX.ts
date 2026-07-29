import { Circle, Node } from 'scenerystack/scenery'

type Ripple = {
  node: Circle
  life: number
  maxLife: number
  maxR: number
}

/** Expanding ripple rings for fire / select / celebrate moments. */
export class RippleFX extends Node {
  private readonly ripples: Ripple[] = []

  public constructor() {
    super({ pickable: false })
  }

  public burst(
    x: number,
    y: number,
    options: { color?: string; count?: number; maxR?: number; life?: number } = {},
  ): void {
    const count = options.count ?? 3
    const color = options.color ?? 'rgba(124,58,237,0.7)'
    const maxR = options.maxR ?? 48
    const life = options.life ?? 0.55
    for (let i = 0; i < count; i++) {
      const node = new Circle(4, {
        stroke: color,
        lineWidth: 2.5,
        fill: null,
        centerX: x,
        centerY: y,
        pickable: false,
        opacity: 0.9,
      })
      this.addChild(node)
      this.ripples.push({
        node,
        life: life + i * 0.08,
        maxLife: life + i * 0.08,
        maxR: maxR + i * 14,
      })
    }
  }

  public step(dt: number): void {
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i]
      r.life -= dt
      if (r.life <= 0) {
        this.removeChild(r.node)
        this.ripples.splice(i, 1)
        continue
      }
      const t = 1 - r.life / r.maxLife
      r.node.radius = 4 + t * r.maxR
      r.node.opacity = Math.max(0, 1 - t)
      r.node.lineWidth = Math.max(0.5, 2.5 * (1 - t))
    }
  }

  public clear(): void {
    for (const r of this.ripples) {
      this.removeChild(r.node)
    }
    this.ripples.length = 0
  }
}
