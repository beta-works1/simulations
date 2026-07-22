import { Node, Rectangle, Text, Path, Circle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont } from 'scenerystack/scenery-phet'

/** Pivot is at bottom-center of the glass; rotation tilts from here. */
export const BEAKER_PIVOT_FRAC_Y = 0.78
const PIVOT_FRAC_Y = BEAKER_PIVOT_FRAC_Y
const LIP_FRAC_X = 0.88
const LIP_FRAC_Y = 0.11

/**
 * Glass beaker with depth cues, liquid fill, and pour-pivot transforms.
 */
export class BeakerNode extends Node {
  public readonly beakerWidth: number
  public readonly beakerHeight: number
  private readonly liquid: Rectangle
  private readonly liquidShine: Rectangle
  private readonly glass: Path
  private readonly innerShadow: Path
  private readonly maxLiquidHeight: number
  private readonly liquidBottomPad: number

  public constructor(
    options: {
      width?: number
      height?: number
      label?: string
      liquidColor?: string
      interactive?: boolean
      onPress?: () => void
    } = {},
  ) {
    super()

    const w = options.width ?? 120
    const h = options.height ?? 160
    this.beakerWidth = w
    this.beakerHeight = h
    this.maxLiquidHeight = h * 0.7
    this.liquidBottomPad = 8

    const pivotX = w / 2
    const pivotY = h * PIVOT_FRAC_Y
    const body = new Node()

    // Ground shadow (ellipse for depth)
    const groundShadow = new Circle(w * 0.42, {
      fill: 'rgba(15, 23, 42, 0.16)',
      x: pivotX,
      y: h - 4,
    })
    groundShadow.setScaleMagnitude(1.15, 0.35)
    body.addChild(groundShadow)

    // Back interior wall (darker, behind liquid)
    const backWall = new Shape()
      .moveTo(10, h * 0.14)
      .lineTo(w - 10, h * 0.14)
      .lineTo(w - 14, h - 10)
      .lineTo(14, h - 10)
      .close()
    body.addChild(
      new Path(backWall, {
        fill: 'rgba(12, 28, 48, 0.14)',
      }),
    )

    // Liquid body
    this.liquid = new Rectangle(12, h * 0.26, w - 24, this.maxLiquidHeight, {
      cornerRadius: 6,
      fill: options.liquidColor ?? 'rgba(125, 211, 252, 0.78)',
    })
    this.liquid.bottom = h - this.liquidBottomPad
    this.liquid.visible = false

    // Liquid surface highlight
    this.liquidShine = new Rectangle(14, 0, w - 32, 7, {
      cornerRadius: 4,
      fill: 'rgba(255,255,255,0.35)',
    })
    this.liquidShine.visible = false

    // Glass shell
    const glassShape = new Shape()
      .moveTo(7, h * 0.12)
      .lineTo(w - 7, h * 0.12)
      .lineTo(w - 5, h - 5)
      .quadraticCurveTo(w / 2, h + 1, 5, h - 5)
      .close()

    this.innerShadow = new Path(glassShape, {
      fill: 'rgba(15, 23, 42, 0.06)',
    })

    this.glass = new Path(glassShape, {
      fill: 'rgba(255,255,255,0.18)',
      stroke: 'rgba(100, 116, 139, 0.9)',
      lineWidth: 2.5,
    })

    // 3D rim ellipse
    const rimEllipse = new Circle((w - 10) / 2, {
      fill: 'rgba(255,255,255,0.32)',
      stroke: 'rgba(148, 163, 184, 0.75)',
      lineWidth: 1.5,
      x: pivotX,
      y: h * 0.12,
    })
    rimEllipse.setScaleMagnitude(1, 0.28)
    body.addChild(rimEllipse)

    const rim = new Rectangle(3, h * 0.07, w - 6, 9, {
      cornerRadius: 3,
      fill: 'rgba(255,255,255,0.5)',
      stroke: 'rgba(71, 85, 105, 0.55)',
      lineWidth: 1,
    })

    const ticks = new Node()
    for (let i = 1; i <= 4; i++) {
      const ty = h - this.liquidBottomPad - (i / 4) * this.maxLiquidHeight
      ticks.addChild(
        new Rectangle(14, ty, 12, 1.5, {
          fill: 'rgba(71, 85, 105, 0.4)',
        }),
      )
    }

    const shine = new Rectangle(16, h * 0.17, 7, h * 0.52, {
      cornerRadius: 4,
      fill: 'rgba(255,255,255,0.32)',
    })

    const rightShade = new Rectangle(w - 18, h * 0.18, 5, h * 0.5, {
      cornerRadius: 3,
      fill: 'rgba(15, 23, 42, 0.08)',
    })

    body.addChild(this.liquid)
    body.addChild(this.liquidShine)
    body.addChild(this.innerShadow)
    body.addChild(this.glass)
    body.addChild(rim)
    body.addChild(ticks)
    body.addChild(shine)
    body.addChild(rightShade)

    // Offset so node (x,y) is the pour pivot at bottom-center
    body.x = -pivotX
    body.y = -pivotY
    this.addChild(body)

    if (options.label) {
      this.addChild(
        new Text(options.label, {
          font: new PhetFont({ size: 12, weight: 'bold' }),
          fill: '#334155',
          centerX: 0,
          top: h - pivotY + 6,
          maxWidth: w + 16,
        }),
      )
    }

    if (options.interactive && options.onPress) {
      this.cursor = 'pointer'
      const hit = new Rectangle(-w / 2, -pivotY, w, h + 20, { fill: 'rgba(0,0,0,0)' })
      this.addChild(hit)
      hit.moveToBack()
      hit.addInputListener({
        down: () => options.onPress?.(),
      })
    }
  }

  /** Place pivot point (bottom-center of glass). */
  public setPivot(x: number, y: number): void {
    this.x = x
    this.y = y
  }

  public placeAtCenter(cx: number, cy: number): void {
    this.x = cx
    this.y = cy + this.beakerHeight * (PIVOT_FRAC_Y - 0.5)
  }

  public get centerX(): number {
    return this.x
  }

  public get centerY(): number {
    return this.y - this.beakerHeight * (PIVOT_FRAC_Y - 0.5)
  }

  public get top(): number {
    return this.y - this.beakerHeight * PIVOT_FRAC_Y
  }

  public get pivotX(): number {
    return this.x
  }

  public get pivotY(): number {
    return this.y
  }

  public getPourLip(): { x: number; y: number } {
    const w = this.beakerWidth
    const h = this.beakerHeight
    const lipLocalX = w * LIP_FRAC_X - w / 2
    const lipLocalY = h * LIP_FRAC_Y - h * PIVOT_FRAC_Y
    const cos = Math.cos(this.rotation)
    const sin = Math.sin(this.rotation)
    return {
      x: this.x + lipLocalX * cos - lipLocalY * sin,
      y: this.y + lipLocalX * sin + lipLocalY * cos,
    }
  }

  public getRimTarget(): { x: number; y: number } {
    return {
      x: this.x,
      y: this.y - this.beakerHeight * (PIVOT_FRAC_Y - 0.13),
    }
  }

  public setLiquidLevel(fraction: number, color: string): void {
    const f = Math.max(0, Math.min(1, fraction))
    const h = Math.max(3, f * this.maxLiquidHeight)
    this.liquid.rectHeight = h
    this.liquid.bottom = this.beakerHeight - this.liquidBottomPad
    this.liquid.fill = color
    this.liquid.visible = f >= 0.01
    this.liquidShine.visible = f >= 0.08
    if (this.liquidShine.visible) {
      this.liquidShine.top = this.liquid.top + 2
    }
  }

  public setHighlight(on: boolean): void {
    this.glass.stroke = on ? '#2dd4bf' : 'rgba(100, 116, 139, 0.9)'
    this.glass.lineWidth = on ? 3.5 : 2.5
  }
}

/**
 * Pour stream aimed from source lip into target beaker opening.
 */
export class PourStreamNode extends Node {
  private readonly stream: Rectangle
  private readonly drops: Circle[]
  private readonly splash: Circle

  public constructor() {
    super()
    this.stream = new Rectangle(0, 0, 6, 20, {
      cornerRadius: 3,
      fill: 'rgb(255,210,80)',
    })
    this.addChild(this.stream)
    this.drops = [0, 1, 2].map(() => {
      const d = new Circle(3.5, { fill: 'rgb(255,210,80)' })
      this.addChild(d)
      return d
    })
    this.splash = new Circle(6, {
      fill: 'rgba(255,255,255,0.55)',
      visible: false,
    })
    this.addChild(this.splash)
    this.visible = false
  }

  public update(
    active: boolean,
    progress: number,
    color: string,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
  ): void {
    this.visible = active && progress > 0.15 && progress < 0.95
    if (!this.visible) {
      this.splash.visible = false
      return
    }

    const dx = toX - fromX
    const dy = toY - fromY
    const dist = Math.hypot(dx, dy)
    if (dist < 4) {
      this.visible = false
      return
    }

    const angle = Math.atan2(dy, dx)
    const t = Math.min(1, Math.max(0, (progress - 0.15) / 0.65))
    const streamLen = Math.max(10, dist * t)

    this.stream.fill = color
    this.stream.setRect(-3, 0, 6, streamLen)
    this.stream.x = fromX
    this.stream.y = fromY
    this.stream.rotation = angle - Math.PI / 2

    this.drops.forEach((d, i) => {
      const phase = (progress * 2.8 + i * 0.33) % 1
      const along = phase * streamLen
      d.fill = color
      d.x = fromX + Math.cos(angle) * along + Math.sin(angle) * (i - 1) * 2
      d.y = fromY + Math.sin(angle) * along - Math.cos(angle) * (i - 1) * 2
      d.opacity = 0.45 + 0.5 * Math.sin(phase * Math.PI)
    })

    this.splash.fill = color
    this.splash.x = toX
    this.splash.y = toY
    this.splash.visible = t > 0.55
    this.splash.opacity = 0.35 + 0.45 * Math.sin(progress * 14)
    this.splash.radius = 4 + t * 5
  }
}
