import { RichText } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { NervousColors } from '../NervousColors.js'

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
  const fontSize = options.fontSize ?? 18
  return new RichText(string, {
    font: new PhetFont({ size: fontSize, weight: options.bold ? 'bold' : 'normal' }),
    fill: options.fill ?? NervousColors.ink,
    lineWrap: options.width,
    leading: Math.round(fontSize * 0.35),
  })
}
