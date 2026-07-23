import { Node, Rectangle, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { NervousColors } from '../NervousColors.js'

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
    const r = options.cornerRadius ?? 16
    const fill = options.fill ?? NervousColors.panelFill

    this.addChild(
      new Rectangle(5, 8, width, height, {
        cornerRadius: r,
        fill: 'rgba(15, 23, 42, 0.16)',
      }),
    )
    this.addChild(
      new Rectangle(2, 3, width, height, {
        cornerRadius: r,
        fill: 'rgba(15, 23, 42, 0.07)',
      }),
    )
    this.bg = new Rectangle(0, 0, width, height, {
      cornerRadius: r,
      fill,
      stroke: NervousColors.panelStroke,
      lineWidth: 1.25,
    })
    this.addChild(this.bg)

    this.addChild(
      new Rectangle(12, 5, width - 24, 4, {
        cornerRadius: 2,
        fill: 'rgba(255,255,255,0.65)',
      }),
    )

    this.content = new Node()
    this.addChild(this.content)

    if (options.title) {
      this.content.addChild(
        new Text(options.title, {
          font: new PhetFont({ size: 15, weight: 'bold' }),
          fill: NervousColors.ink,
          left: 16,
          top: 14,
          maxWidth: width - 32,
        }),
      )
    }
  }

  public setCardSize(width: number, height: number): void {
    this.bg.setRect(0, 0, width, height)
  }
}
