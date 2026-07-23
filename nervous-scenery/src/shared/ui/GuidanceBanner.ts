import { Node, Rectangle, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { NervousColors } from '../NervousColors.js'

/** Elevated tip / guidance banner with soft layered depth. */
export class GuidanceBanner extends Node {
  private readonly titleText: Text
  private readonly bodyText: Text
  private readonly bg: Rectangle
  private readonly accent: Rectangle

  public constructor(width: number, options: { title?: string; body?: string } = {}) {
    super({ pickable: false })

    this.addChild(
      new Rectangle(3, 5, width, 64, {
        cornerRadius: 12,
        fill: 'rgba(15,23,42,0.14)',
      }),
    )
    this.bg = new Rectangle(0, 0, width, 64, {
      cornerRadius: 12,
      fill: 'rgba(255,255,255,0.96)',
      stroke: 'rgba(124,58,237,0.28)',
      lineWidth: 1.5,
    })
    this.addChild(this.bg)

    this.accent = new Rectangle(0, 0, 6, 64, {
      cornerRadius: 12,
      fill: NervousColors.accent,
    })
    this.addChild(this.accent)

    this.addChild(
      new Rectangle(14, 4, width - 28, 3, {
        cornerRadius: 2,
        fill: 'rgba(255,255,255,0.7)',
      }),
    )

    this.titleText = new Text(options.title ?? 'Try this', {
      font: new PhetFont({ size: 16, weight: 'bold' }),
      fill: NervousColors.accent,
      left: 18,
      top: 10,
      maxWidth: width - 32,
    })
    this.bodyText = new Text(options.body ?? '', {
      font: new PhetFont(16),
      fill: NervousColors.ink,
      left: 18,
      top: 34,
      maxWidth: width - 32,
    })
    this.addChild(this.titleText)
    this.addChild(this.bodyText)
  }

  public setGuidance(title: string, body: string): void {
    this.titleText.string = title
    this.bodyText.string = body
    const h = Math.max(64, this.bodyText.bottom + 12)
    this.bg.setRectHeight(h)
    this.accent.setRectHeight(h)
  }
}
