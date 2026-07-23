import { Node, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { NervousColors } from '../NervousColors.js'

/** Elevated tip / guidance banner with soft layered depth. */
export class GuidanceBanner extends Node {
  private readonly titleText: Text
  private readonly bodyText: RichText
  private readonly bg: Rectangle
  private readonly accent: Rectangle
  private readonly bodyWidth: number

  public constructor(width: number, options: { title?: string; body?: string } = {}) {
    super({ pickable: false })
    this.bodyWidth = width - 36

    this.addChild(
      new Rectangle(3, 5, width, 72, {
        cornerRadius: 12,
        fill: 'rgba(15,23,42,0.14)',
      }),
    )
    this.bg = new Rectangle(0, 0, width, 72, {
      cornerRadius: 12,
      fill: 'rgba(255,255,255,0.96)',
      stroke: 'rgba(124,58,237,0.28)',
      lineWidth: 1.5,
    })
    this.addChild(this.bg)

    this.accent = new Rectangle(0, 0, 6, 72, {
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
    this.bodyText = new RichText(options.body ?? '', {
      font: new PhetFont(16),
      fill: NervousColors.ink,
      lineWrap: this.bodyWidth,
      leading: 5,
      left: 18,
      top: 34,
    })
    this.addChild(this.titleText)
    this.addChild(this.bodyText)
    this.resizeToContent()
  }

  public setGuidance(title: string, body: string): void {
    this.titleText.string = title
    this.bodyText.string = body
    this.resizeToContent()
  }

  private resizeToContent(): void {
    const h = Math.max(72, this.bodyText.bottom + 14)
    this.bg.setRectHeight(h)
    this.accent.setRectHeight(h)
  }
}
