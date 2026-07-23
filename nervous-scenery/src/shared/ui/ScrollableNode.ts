import { Bounds2 } from 'scenerystack/dot'
import { Shape } from 'scenerystack/kite'
import { DragListener, Node, Rectangle, Text } from 'scenerystack/scenery'
import type { SceneryEvent } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'

/**
 * Clips tall panel content and scrolls with mouse wheel / trackpad / scrollbar drag.
 * Reserves a bottom band for the scroll hint so it never covers controls.
 */
export class ScrollableNode extends Node {
  private readonly contentNode: Node
  private readonly viewportHeight: number
  private scrollY = 0
  private readonly thumb: Rectangle
  private readonly track: Rectangle
  private readonly hint: Text
  private readonly hintBand: Rectangle
  private maxScroll = 0

  public constructor(content: Node, width: number, maxHeight: number) {
    super({ pickable: true })

    const hintBandH = 22
    this.viewportHeight = Math.max(40, maxHeight - hintBandH)
    this.contentNode = new Node({ children: [content] })

    const clip = new Node({
      clipArea: Shape.bounds(new Bounds2(0, 0, width - 10, this.viewportHeight)),
      children: [this.contentNode],
    })

    this.track = new Rectangle(width - 8, 4, 6, this.viewportHeight - 8, {
      fill: 'rgba(148,163,184,0.35)',
      cornerRadius: 3,
      cursor: 'pointer',
    })
    this.thumb = new Rectangle(width - 8, 4, 6, 40, {
      fill: 'rgba(124, 58, 237, 0.75)',
      cornerRadius: 3,
      cursor: 'grab',
    })

    this.hintBand = new Rectangle(0, this.viewportHeight, width, hintBandH, {
      fill: 'rgba(255,255,255,0.92)',
      pickable: false,
    })
    this.hint = new Text('Scroll for more ↓', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#64748b',
      centerX: width / 2,
      centerY: this.viewportHeight + hintBandH / 2,
      pickable: false,
    })

    this.addChild(clip)
    this.addChild(this.track)
    this.addChild(this.thumb)
    this.addChild(this.hintBand)
    this.addChild(this.hint)

    this.localBounds = new Bounds2(0, 0, width, maxHeight)

    const applyScroll = () => {
      const contentH = Math.max(this.contentNode.bounds.height, this.viewportHeight)
      this.maxScroll = Math.max(0, contentH - this.viewportHeight)
      this.scrollY = Math.max(-this.maxScroll, Math.min(0, this.scrollY))
      this.contentNode.y = this.scrollY

      const needsScroll = this.maxScroll > 2
      this.track.visible = needsScroll
      this.thumb.visible = needsScroll
      this.hint.visible = needsScroll && this.scrollY > -8
      this.hintBand.visible = this.hint.visible

      if (needsScroll) {
        const thumbH = Math.max(28, (this.viewportHeight / contentH) * (this.viewportHeight - 8))
        this.thumb.rectHeight = thumbH
        const t = this.maxScroll === 0 ? 0 : -this.scrollY / this.maxScroll
        this.thumb.y = 4 + t * (this.viewportHeight - 8 - thumbH)
      }
    }

    content.boundsProperty.link(() => applyScroll())
    setTimeout(applyScroll, 0)
    applyScroll()

    this.addInputListener({
      wheel: (event: SceneryEvent<WheelEvent>) => {
        if (this.maxScroll <= 0) return
        const dom = event.domEvent
        if (!dom) return
        const dy = dom.deltaY * (dom.deltaMode === 1 ? 18 : dom.deltaMode === 2 ? this.viewportHeight : 0.6)
        if (dy === 0) return
        this.scrollY -= dy
        applyScroll()
        event.handle()
      },
    })

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
          const trackTravel = this.viewportHeight - 8 - this.thumb.rectHeight
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
        const ratio = localY / this.viewportHeight
        this.scrollY = -ratio * this.maxScroll
        applyScroll()
      },
    })
  }
}
