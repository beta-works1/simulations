import { Node, Rectangle, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { EcologyColors } from '../EcologyColors.js'

/** Soft elevated card with layered shadow for depth. */
export class DepthCard extends Node {
  public readonly content: Node
  private readonly bg: Rectangle

  public constructor(
    width: number,
    height: number,
    options: { title?: string; cornerRadius?: number; fill?: string } = {},
  ) {
    super()
    const r = options.cornerRadius ?? 14
    const fill = options.fill ?? EcologyColors.panelFill

    this.addChild(
      new Rectangle(4, 6, width, height, {
        cornerRadius: r,
        fill: 'rgba(15, 23, 42, 0.12)',
      }),
    )
    this.addChild(
      new Rectangle(2, 3, width, height, {
        cornerRadius: r,
        fill: 'rgba(15, 23, 42, 0.06)',
      }),
    )
    this.bg = new Rectangle(0, 0, width, height, {
      cornerRadius: r,
      fill,
      stroke: EcologyColors.panelStroke,
      lineWidth: 1,
    })
    this.addChild(this.bg)

    // Top shine strip
    this.addChild(
      new Rectangle(10, 4, width - 20, 3, {
        cornerRadius: 2,
        fill: 'rgba(255,255,255,0.55)',
      }),
    )

    this.content = new Node()
    this.addChild(this.content)

    if (options.title) {
      this.content.addChild(
        new Text(options.title, {
          font: new PhetFont({ size: 13, weight: 'bold' }),
          fill: EcologyColors.ink,
          left: 14,
          top: 12,
          maxWidth: width - 28,
        }),
      )
    }
  }

  public setCardSize(width: number, height: number): void {
    this.bg.setRect(0, 0, width, height)
  }
}
