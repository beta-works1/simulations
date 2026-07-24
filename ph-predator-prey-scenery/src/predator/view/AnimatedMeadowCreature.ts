/**
 * Animated meadow creatures drawn with Scenery Paths (no async Image loads).
 * Prey hops; predators prowl — Grade-8 readable rabbits / foxes.
 */
import { Bounds2 } from 'scenerystack/dot'
import { Circle, Node, Path } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import type { MeadowAgent } from '../model/PredatorPreyModel.js'

function buildRabbit(): { root: Node; ears: Node; body: Node } {
  const root = new Node({ pickable: false })
  const ears = new Node({ pickable: false })
  const earL = new Path(Shape.ellipse(-7, -16, 3.2, 9, 0), {
    fill: '#f8fafc',
    stroke: '#94a3b8',
    lineWidth: 1,
  })
  const earR = new Path(Shape.ellipse(7, -16, 3.2, 9, 0), {
    fill: '#f8fafc',
    stroke: '#94a3b8',
    lineWidth: 1,
  })
  const earPinkL = new Path(Shape.ellipse(-7, -15, 1.4, 5, 0), { fill: '#fda4af' })
  const earPinkR = new Path(Shape.ellipse(7, -15, 1.4, 5, 0), { fill: '#fda4af' })
  ears.addChild(earL)
  ears.addChild(earR)
  ears.addChild(earPinkL)
  ears.addChild(earPinkR)

  const body = new Node({ pickable: false })
  body.addChild(
    new Path(Shape.ellipse(0, 2, 11, 9, 0), {
      fill: '#f1f5f9',
      stroke: '#64748b',
      lineWidth: 1.2,
    }),
  )
  body.addChild(
    new Path(Shape.ellipse(10, 4, 4, 3.2, 0), {
      fill: '#e2e8f0',
      stroke: '#94a3b8',
      lineWidth: 0.8,
    }),
  )
  body.addChild(new Circle(1.6, { fill: '#0f172a', centerX: -3.5, centerY: 0 }))
  body.addChild(new Circle(1.6, { fill: '#0f172a', centerX: 3.5, centerY: 0 }))
  body.addChild(new Path(Shape.ellipse(0, 4, 2.2, 1.4, 0), { fill: '#fda4af' }))
  // Soft green ring so graph colour matches the meadow
  body.addChild(
    new Circle(13, {
      fill: null,
      stroke: 'rgba(46, 204, 113, 0.55)',
      lineWidth: 1.5,
      centerX: 0,
      centerY: 1,
    }),
  )

  root.addChild(ears)
  root.addChild(body)
  return { root, ears, body }
}

function buildFox(): { root: Node; tail: Node; body: Node } {
  const root = new Node({ pickable: false })
  const body = new Node({ pickable: false })
  const tail = new Node({ pickable: false })

  const earL = new Path(new Shape().moveTo(-10, -2).lineTo(-14, -14).lineTo(-4, -6).close(), {
    fill: '#ea580c',
    stroke: '#9a3412',
    lineWidth: 1,
  })
  const earR = new Path(new Shape().moveTo(10, -2).lineTo(14, -14).lineTo(4, -6).close(), {
    fill: '#ea580c',
    stroke: '#9a3412',
    lineWidth: 1,
  })
  body.addChild(earL)
  body.addChild(earR)
  body.addChild(
    new Path(Shape.ellipse(0, 2, 12, 9, 0), {
      fill: '#ea580c',
      stroke: '#9a3412',
      lineWidth: 1.2,
    }),
  )
  body.addChild(new Path(Shape.ellipse(0, 5, 5, 2.5, 0), { fill: '#ffedd5' }))
  body.addChild(new Circle(1.7, { fill: '#0f172a', centerX: -4, centerY: 0 }))
  body.addChild(new Circle(1.7, { fill: '#0f172a', centerX: 4, centerY: 0 }))
  body.addChild(new Path(Shape.ellipse(0, 3.5, 2.4, 1.5, 0), { fill: '#0f172a' }))
  body.addChild(
    new Circle(14, {
      fill: null,
      stroke: 'rgba(231, 76, 60, 0.55)',
      lineWidth: 1.5,
      centerX: 0,
      centerY: 1,
    }),
  )

  tail.addChild(
    new Path(Shape.ellipse(14, 4, 7, 3.5, 0), {
      fill: '#ea580c',
      stroke: '#9a3412',
      lineWidth: 1,
    }),
  )
  tail.addChild(new Path(Shape.ellipse(18, 4, 3.5, 2.2, 0), { fill: '#fff7ed' }))

  root.addChild(tail)
  root.addChild(body)
  return { root, tail, body }
}

/** Tiny static icon for legends (matches meadow art). */
export function createCreatureLegendIcon(kind: 'prey' | 'predator', scale = 1): Node {
  const built = kind === 'prey' ? buildRabbit() : buildFox()
  built.root.setScaleMagnitude(scale)
  return built.root
}

/**
 * One pooled, interactive meadow creature. Update in place each frame — do not recreate.
 */
export class AnimatedMeadowCreature extends Node {
  public readonly agentId: number
  public readonly kind: 'prey' | 'predator'
  private readonly art: Node
  private readonly earsOrTail: Node
  private readonly body: Node
  private readonly refugeRing: Circle
  private facing = 1

  public constructor(agent: MeadowAgent) {
    super({ cursor: 'grab', pickable: true })
    this.agentId = agent.id
    this.kind = agent.kind

    if (agent.kind === 'prey') {
      const built = buildRabbit()
      this.art = built.root
      this.earsOrTail = built.ears
      this.body = built.body
    } else {
      const built = buildFox()
      this.art = built.root
      this.earsOrTail = built.tail
      this.body = built.body
    }

    this.refugeRing = new Circle(16, {
      fill: null,
      stroke: '#fde68a',
      lineWidth: 2,
      visible: false,
      pickable: false,
    })

    this.addChild(this.art)
    this.addChild(this.refugeRing)
    // Stable hit target so drag works even while parts bob
    this.mouseArea = new Bounds2(-18, -20, 18, 16)
    this.touchArea = new Bounds2(-22, -24, 22, 18)
  }

  /** Sync pose/position from model; `time` drives hop / prowl animation. */
  public sync(agent: MeadowAgent, time: number): void {
    if (agent.kind !== this.kind) return

    const speed = Math.hypot(agent.vx, agent.vy)
    const moving = speed > 0.008

    if (Math.abs(agent.vx) > 0.004) {
      this.facing = agent.vx >= 0 ? 1 : -1
    }
    this.art.setScaleMagnitude(this.facing, 1)

    if (this.kind === 'prey') {
      // Hop cycle when moving; gentle breathe when still
      const hop = moving ? Math.abs(Math.sin(time * 10 + agent.phase)) * 5 : Math.sin(time * 2 + agent.phase) * 1.2
      const squash = moving ? 1 - hop * 0.03 : 1
      this.body.setScaleMagnitude(1 / squash, squash)
      this.body.y = -hop
      this.earsOrTail.rotation = Math.sin(time * 6 + agent.phase) * 0.12
      this.earsOrTail.y = -hop * 0.6
      this.art.opacity = agent.inRefuge ? 0.82 : 1
      this.refugeRing.visible = agent.inRefuge
      this.refugeRing.centerY = -hop
    } else {
      // Prowl: body lean + tail sway
      const bob = Math.sin(time * 7 + agent.phase) * (moving ? 2.2 : 0.8)
      this.body.y = bob
      this.body.rotation = moving ? Math.sin(time * 5 + agent.phase) * 0.08 : 0
      this.earsOrTail.rotation = Math.sin(time * 4 + agent.phase) * 0.25
      this.earsOrTail.y = bob * 0.5
      this.art.opacity = 1
      this.refugeRing.visible = false
    }
  }
}
