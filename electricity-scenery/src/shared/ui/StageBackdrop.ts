import { LinearGradient, Node, Rectangle } from 'scenerystack/scenery'

/**
 * Layered scenic stage frame (ecology carbon landscape pattern).
 */
export class StageBackdrop extends Node {
  public constructor(
    x: number,
    y: number,
    w: number,
    h: number,
    options: { top?: string; bottom?: string; stroke?: string } = {},
  ) {
    super({ pickable: false })
    const top = options.top ?? '#9ec5e8'
    const bottom = options.bottom ?? '#e8f0f6'
    const stroke = options.stroke ?? 'rgba(15,23,42,0.22)'

    this.addChild(
      new Rectangle(x + 5, y + 8, w, h, {
        cornerRadius: 18,
        fill: 'rgba(15,23,42,0.22)',
      }),
    )
    this.addChild(
      new Rectangle(x, y, w, h, {
        cornerRadius: 18,
        fill: new LinearGradient(0, y, 0, y + h).addColorStop(0, top).addColorStop(1, bottom),
        stroke,
        lineWidth: 1.5,
      }),
    )
    this.addChild(
      new Rectangle(x + 14, y + 8, w - 28, 5, {
        cornerRadius: 3,
        fill: 'rgba(255,255,255,0.45)',
      }),
    )
    // Soft vignette / depth band at bottom
    this.addChild(
      new Rectangle(x + 10, y + h - 28, w - 20, 18, {
        cornerRadius: 8,
        fill: 'rgba(15,23,42,0.08)',
      }),
    )
  }
}
