import { RichText } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'

/**
 * Panel tip / body copy that wraps instead of shrinking.
 * (Scenery `Text.maxWidth` scales glyphs down — that made tips look tiny.)
 */
export function createPanelTip(
  string: string,
  options: {
    width: number
    fontSize?: number
    fill?: string
    bold?: boolean
  },
): RichText {
  // Default 12 — large tips (18+) caused overlapping text in dense scroll panels.
  const fontSize = options.fontSize ?? 12
  return new RichText(string, {
    font: new PhetFont({ size: fontSize, weight: options.bold ? 'bold' : 'normal' }),
    fill: options.fill ?? '#e2e8f0',
    lineWrap: options.width,
    leading: Math.round(fontSize * 0.35),
  })
}
