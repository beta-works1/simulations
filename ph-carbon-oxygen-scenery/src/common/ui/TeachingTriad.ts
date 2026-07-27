import { Node, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { SimTheme } from '../SimTheme.js'

type Card = { root: Node; bg: Rectangle; body: RichText }

/**
 * Ecology-style NOW / WHY / NEXT teaching triad.
 */
export class TeachingTriad extends Node {
  private readonly now: Card
  private readonly why: Card
  private readonly next: Card

  public constructor(width = 220) {
    super({ pickable: false })

    this.now = this.makeCard('NOW', SimTheme.accent, width)
    this.why = this.makeCard('WHY', '#0ea5e9', width)
    this.next = this.makeCard('NEXT', '#16a34a', width)

    this.addChild(this.now.root)
    this.addChild(this.why.root)
    this.addChild(this.next.root)
    this.stack()
  }

  public setTriad(now: string, why: string, next: string): void {
    this.now.body.string = now
    this.why.body.string = why
    this.next.body.string = next
    this.resize(this.now)
    this.resize(this.why)
    this.resize(this.next)
    this.stack()
  }

  private makeCard(label: string, accent: string, width: number): Card {
    const bg = new Rectangle(0, 0, width, 52, {
      cornerRadius: 10,
      fill: 'rgba(255,255,255,0.94)',
      stroke: accent,
      lineWidth: 1.5,
    })
    const title = new Text(label, {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: accent,
      left: 10,
      top: 6,
    })
    const body = new RichText('', {
      font: new PhetFont(13),
      fill: SimTheme.ink,
      lineWrap: width - 20,
      leading: 3,
      left: 10,
      top: 22,
    })
    return { root: new Node({ children: [bg, title, body] }), bg, body }
  }

  private resize(card: Card): void {
    card.bg.setRectHeight(Math.max(48, card.body.bottom + 10))
  }

  private stack(): void {
    this.now.root.top = 0
    this.why.root.top = this.now.root.bottom + 6
    this.next.root.top = this.why.root.bottom + 6
  }
}
