import { Node, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'

/** Section header for dense dark control panels (Ch1 carbon pattern). */
export function controlSection(title: string, width: number): Text {
  return new Text(title, {
    font: new PhetFont({ size: 11, weight: 'bold' }),
    fill: '#7cb068',
    maxWidth: width,
  })
}

export function controlHint(text: string, width: number): Text {
  return new Text(text, {
    font: new PhetFont(9),
    fill: '#95a5a6',
    maxWidth: width,
  })
}

/** Stack children vertically with spacing; returns total height used. */
export function stackPanel(
  parent: Node,
  children: Node[],
  options: { left?: number; top?: number; gap?: number } = {},
): number {
  const left = options.left ?? 14
  const gap = options.gap ?? 8
  let y = options.top ?? 40
  for (const child of children) {
    child.left = left
    child.top = y
    parent.addChild(child)
    y = child.bottom + gap
  }
  return y
}
