import { LinearGradient, Node, Rectangle } from 'scenerystack/scenery'
import { TeachingShellLayout } from '../TeachingShellLayout.js'

/**
 * Layered scenic stage frame.
 * Dark cosmic stages must pass `{ gloss: false }` — the white highlight bar
 * otherwise reads as a transparent hairline over the title (TeachingShellLayout metric #1).
 * When gloss is off, stroke and top highlight are both suppressed.
 */
export class StageBackdrop extends Node {
  public constructor(
    x: number,
    y: number,
    w: number,
    h: number,
    options: { top?: string; bottom?: string; stroke?: string; gloss?: boolean } = {},
  ) {
    super({ pickable: false })
    const top = options.top ?? '#9ec5e8'
    const bottom = options.bottom ?? '#e8f0f6'
    const gloss = options.gloss ?? true
    const stroke = options.stroke ?? (gloss ? 'rgba(15,23,42,0.22)' : 'rgba(0,0,0,0)')
    const r = TeachingShellLayout.STAGE_CORNER_RADIUS

    if (gloss) {
      this.addChild(
        new Rectangle(x + 5, y + 8, w, h, {
          cornerRadius: r,
          fill: 'rgba(15,23,42,0.22)',
        }),
      )
    }
    this.addChild(
      new Rectangle(x, y, w, h, {
        cornerRadius: r,
        fill: new LinearGradient(0, y, 0, y + h).addColorStop(0, top).addColorStop(1, bottom),
        stroke,
        lineWidth: gloss ? 1.5 : 0,
      }),
    )
    if (gloss) {
      this.addChild(
        new Rectangle(x + 14, y + 8, w - 28, 5, {
          cornerRadius: 3,
          fill: 'rgba(255,255,255,0.45)',
        }),
      )
      // Soft vignette / depth band at bottom — light stages only
      this.addChild(
        new Rectangle(x + 10, y + h - 28, w - 20, 18, {
          cornerRadius: 8,
          fill: 'rgba(15,23,42,0.08)',
        }),
      )
    }
  }
}
