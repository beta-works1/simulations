import { Bounds2 } from 'scenerystack/dot'
import { Shape } from 'scenerystack/kite'
import { DragListener, Node, Rectangle, Text } from 'scenerystack/scenery'
import type { SceneryEvent } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'

const SCROLLBAR_W = 10
const HINT_H = 22

/**
 * Clips tall panel content and scrolls with trackpad / mouse wheel / scrollbar.
 * Hint bar sits in a reserved bottom strip so it never overlaps controls.
 * Clip width leaves room for the scrollbar so value text is not cut off.
 */
export class ScrollableNode extends Node {
  private readonly contentNode: Node
  private readonly content: Node
  private readonly viewportHeight: number
  private readonly clipHeight: number
  private readonly contentWidth: number
  private scrollY = 0
  private readonly thumb: Rectangle
  private readonly track: Rectangle
  private readonly hintBg: Rectangle
  private readonly hint: Text
  private maxScroll = 0

  public constructor(content: Node, width: number, maxHeight: number) {
    super({ pickable: true })

    this.viewportHeight = Math.max(60, maxHeight)
    this.clipHeight = Math.max(40, this.viewportHeight - HINT_H)
    this.contentWidth = Math.max(40, width - SCROLLBAR_W)
    this.content = content
    this.contentNode = new Node({ children: [content] })

    const hitPad = new Rectangle(0, 0, width, this.viewportHeight, {
      fill: 'rgba(0,0,0,0.001)',
      pickable: true,
    })

    const clip = new Node({
      clipArea: Shape.bounds(new Bounds2(0, 0, this.contentWidth, this.clipHeight)),
      children: [this.contentNode],
    })

    this.track = new Rectangle(width - 8, 4, 6, this.clipHeight - 8, {
      fill: 'rgba(148,163,184,0.35)',
      cornerRadius: 3,
      cursor: 'pointer',
    })
    this.thumb = new Rectangle(width - 8, 4, 6, 40, {
      fill: 'rgba(13, 148, 136, 0.85)',
      cornerRadius: 3,
      cursor: 'grab',
    })

    this.hintBg = new Rectangle(0, this.clipHeight, width, HINT_H, {
      fill: 'rgba(11, 22, 40, 0.92)',
      pickable: false,
    })
    this.hint = new Text('Scroll for more ↓', {
      font: new PhetFont({ size: 10, weight: 'bold' }),
      fill: '#94a3b8',
      centerX: this.contentWidth / 2,
      centerY: this.clipHeight + HINT_H / 2,
      pickable: false,
    })

    this.addChild(hitPad)
    this.addChild(clip)
    this.addChild(this.track)
    this.addChild(this.thumb)
    this.addChild(this.hintBg)
    this.addChild(this.hint)

    const area = new Bounds2(0, 0, width, this.viewportHeight)
    this.localBounds = area
    this.mouseArea = area
    this.touchArea = area

    const applyScroll = () => {
      const bottom = Math.max(
        this.content.localBounds.maxY,
        this.contentNode.bounds.height,
        this.clipHeight,
      )
      // Extra pad so last control clears the reserved hint strip.
      this.maxScroll = Math.max(0, bottom - this.clipHeight + 16)
      this.scrollY = Math.max(-this.maxScroll, Math.min(0, this.scrollY))
      this.contentNode.y = this.scrollY

      const needsScroll = this.maxScroll > 2
      this.track.visible = needsScroll
      this.thumb.visible = needsScroll
      this.hintBg.visible = needsScroll && this.scrollY > -8
      this.hint.visible = needsScroll && this.scrollY > -8

      if (needsScroll) {
        const thumbH = Math.max(28, (this.clipHeight / bottom) * (this.clipHeight - 8))
        this.thumb.rectHeight = thumbH
        const t = this.maxScroll === 0 ? 0 : -this.scrollY / this.maxScroll
        this.thumb.y = 4 + t * (this.clipHeight - 8 - thumbH)
      }
    }

    content.boundsProperty.link(() => applyScroll())
    setTimeout(applyScroll, 0)
    setTimeout(applyScroll, 50)
    applyScroll()

    const onWheel = (event: SceneryEvent<WheelEvent>) => {
      this.scrollByWheel(event)
    }

    hitPad.addInputListener({ wheel: onWheel })
    this.addInputListener({ wheel: onWheel })

    let thumbDragStart = 0
    let scrollAtStart = 0
    this.thumb.addInputListener(
      new DragListener({
        allowTouchSnag: true,
        start: (event) => {
          thumbDragStart = event.pointer.point.y
          scrollAtStart = this.scrollY
        },
        drag: (event) => {
          if (this.maxScroll <= 0) return
          const trackTravel = this.clipHeight - 8 - this.thumb.rectHeight
          if (trackTravel <= 0) return
          const dy = event.pointer.point.y - thumbDragStart
          this.scrollY = scrollAtStart - (dy / trackTravel) * this.maxScroll
          applyScroll()
        },
      }),
    )

    this.track.addInputListener({
      up: (event) => {
        if (this.maxScroll <= 0) return
        const localY = this.globalToLocalPoint(event.pointer.point).y
        const ratio = Math.max(0, Math.min(1, localY / this.clipHeight))
        this.scrollY = -ratio * this.maxScroll
        applyScroll()
      },
    })
  }

  public scrollByWheel(event: SceneryEvent<WheelEvent>): void {
    if (this.maxScroll <= 0) return
    const dom = event.domEvent
    if (!dom) return

    let dy = dom.deltaY
    if (dom.deltaMode === 1) dy *= 18
    else if (dom.deltaMode === 2) dy *= this.clipHeight
    else dy *= 1.15

    if (dy === 0 && dom.deltaX !== 0) dy = dom.deltaX * 1.15
    if (dy === 0) return

    this.scrollY -= dy
    const bottom = Math.max(
      this.content.localBounds.maxY,
      this.contentNode.bounds.height,
      this.clipHeight,
    )
    this.maxScroll = Math.max(0, bottom - this.clipHeight + 16)
    this.scrollY = Math.max(-this.maxScroll, Math.min(0, this.scrollY))
    this.contentNode.y = this.scrollY

    const needsScroll = this.maxScroll > 2
    this.track.visible = needsScroll
    this.thumb.visible = needsScroll
    this.hintBg.visible = needsScroll && this.scrollY > -8
    this.hint.visible = needsScroll && this.scrollY > -8
    if (needsScroll) {
      const thumbH = Math.max(28, (this.clipHeight / bottom) * (this.clipHeight - 8))
      this.thumb.rectHeight = thumbH
      const t = this.maxScroll === 0 ? 0 : -this.scrollY / this.maxScroll
      this.thumb.y = 4 + t * (this.clipHeight - 8 - thumbH)
    }

    event.handle()
    try {
      dom.preventDefault()
      dom.stopPropagation()
    }
    catch {
      /* ignore */
    }
  }
}

export function forwardWheelToScrollParent(node: Node, event: SceneryEvent<WheelEvent>): boolean {
  let current: Node | null = node
  while (current) {
    if (current instanceof ScrollableNode) {
      current.scrollByWheel(event)
      return true
    }
    const maybe = current as Node & { scrollByWheel?: (e: SceneryEvent<WheelEvent>) => void }
    if (typeof maybe.scrollByWheel === 'function' && current !== node) {
      maybe.scrollByWheel(event)
      return true
    }
    current = current.parent
  }
  return false
}
