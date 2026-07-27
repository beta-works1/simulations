import { Node, Rectangle, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { PeriodicColors } from '../PeriodicColors.js'

/**
 * Dark elevated control card matching Ch1 carbon-oxygen panel look.
 * Use for right-side control columns.
 */
export class DepthCard extends Node {
  public readonly content: Node
  private readonly bg: Rectangle
  private readonly titleNode: Text | null = null

  public constructor(
    width: number,
    height: number,
    options: {
      title?: string
      cornerRadius?: number
      fill?: string
      /** 'dark' = ecology carbon panel; 'light' = floating tip cards */
      variant?: 'dark' | 'light'
    } = {},
  ) {
    super()
    const r = options.cornerRadius ?? 14
    const variant = options.variant ?? 'dark'
    const fill =
      options.fill ??
      (variant === 'dark' ? PeriodicColors.panelDark : PeriodicColors.panelFill)
    const stroke = variant === 'dark' ? PeriodicColors.panelDarkStroke : PeriodicColors.panelStroke
    const titleFill = variant === 'dark' ? '#ecf0f1' : PeriodicColors.ink

    this.addChild(
      new Rectangle(4, 6, width, height, {
        cornerRadius: r,
        fill: 'rgba(0,0,0,0.35)',
      }),
    )
    this.addChild(
      new Rectangle(2, 3, width, height, {
        cornerRadius: r,
        fill: 'rgba(0,0,0,0.18)',
      }),
    )
    this.bg = new Rectangle(0, 0, width, height, {
      cornerRadius: r,
      fill,
      stroke,
      lineWidth: 1.5,
    })
    this.addChild(this.bg)

    this.addChild(
      new Rectangle(10, 4, width - 20, 3, {
        cornerRadius: 2,
        fill: variant === 'dark' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.65)',
      }),
    )

    this.content = new Node()
    this.addChild(this.content)

    if (options.title) {
      this.titleNode = new Text(options.title, {
        font: new PhetFont({ size: 14, weight: 'bold' }),
        fill: titleFill,
        left: 14,
        top: 12,
        maxWidth: width - 28,
      })
      this.content.addChild(this.titleNode)
    }
  }

  public setCardSize(width: number, height: number): void {
    this.bg.setRect(0, 0, width, height)
  }
}
