import { Bounds2 } from 'scenerystack/dot'
import { Shape } from 'scenerystack/kite'
import { DragListener, Node, Rectangle, Text } from 'scenerystack/scenery'
import type { SceneryEvent } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'

/**
 * Clips tall panel content and scrolls with trackpad / mouse wheel / scrollbar.
 *
 * - Full-viewport hit pad so empty gaps between controls still receive wheel.
 * - `scrollByWheel` so SoftButton/DepthSlider can forward wheel when they are on top.
 * - preventDefault so the page/browser doesn't steal the gesture mid-scroll.
 */
export class ScrollableNode extends Node {
  private readonly contentNode: Node
  private readonly content: Node
  private readonly viewportHeight: number
  private scrollY = 0
  private readonly thumb: Rectangle
  private readonly track: Rectangle
  private readonly hint: Text
  private maxScroll = 0

  public constructor(content: Node, width: number, maxHeight: number) {
    super({ pickable: true })

    this.viewportHeight = Math.max(40, maxHeight)
    this.content = content
    this.contentNode = new Node({ children: [content] })

    const hitPad = new Rectangle(0, 0, width, this.viewportHeight, {
      fill: 'rgba(0,0,0,0.001)',
      pickable: true,
    })

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
      fill: 'rgba(13, 148, 136, 0.85)',
      cornerRadius: 3,
      cursor: 'grab',
    })
    this.hint = new Text('Scroll for more ↓', {
      font: new PhetFont({ size: 10, weight: 'bold' }),
      fill: 'rgba(148,163,184,0.95)',
      centerX: (width - 10) / 2,
      bottom: this.viewportHeight - 6,
      pickable: false,
    })

    this.addChild(hitPad)
    this.addChild(clip)
    this.addChild(this.track)
    this.addChild(this.thumb)
    this.addChild(this.hint)

    const area = new Bounds2(0, 0, width, this.viewportHeight)
    this.localBounds = area
    this.mouseArea = area
    this.touchArea = area

    const applyScroll = () => {
      // Prefer content local maxY (stable) then fall back to laid-out height.
      const bottom = Math.max(
        this.content.localBounds.maxY,
        this.contentNode.bounds.height,
        this.viewportHeight,
      )
      this.maxScroll = Math.max(0, bottom - this.viewportHeight + 12)
      this.scrollY = Math.max(-this.maxScroll, Math.min(0, this.scrollY))
      this.contentNode.y = this.scrollY

      const needsScroll = this.maxScroll > 2
      this.track.visible = needsScroll
      this.thumb.visible = needsScroll
      this.hint.visible = needsScroll && this.scrollY > -10

      if (needsScroll) {
        const thumbH = Math.max(28, (this.viewportHeight / bottom) * (this.viewportHeight - 8))
        this.thumb.rectHeight = thumbH
        const t = this.maxScroll === 0 ? 0 : -this.scrollY / this.maxScroll
        this.thumb.y = 4 + t * (this.viewportHeight - 8 - thumbH)
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

  /** Called by SoftButton/DepthSlider so trackpad works while hovering controls. */
  public scrollByWheel(event: SceneryEvent<WheelEvent>): void {
    if (this.maxScroll <= 0) return
    const dom = event.domEvent
    if (!dom) return

    // Trackpads usually report pixel deltas (mode 0). Amplify slightly for feel.
    let dy = dom.deltaY
    if (dom.deltaMode === 1) dy *= 18
    else if (dom.deltaMode === 2) dy *= this.viewportHeight
    else dy *= 1.15

    // Shift+wheel / horizontal trackpad → treat as vertical scroll in panels.
    if (dy === 0 && dom.deltaX !== 0) dy = dom.deltaX * 1.15
    if (dy === 0) return

    this.scrollY -= dy
    const bottom = Math.max(
      this.content.localBounds.maxY,
      this.contentNode.bounds.height,
      this.viewportHeight,
    )
    this.maxScroll = Math.max(0, bottom - this.viewportHeight + 12)
    this.scrollY = Math.max(-this.maxScroll, Math.min(0, this.scrollY))
    this.contentNode.y = this.scrollY

    const needsScroll = this.maxScroll > 2
    this.track.visible = needsScroll
    this.thumb.visible = needsScroll
    this.hint.visible = needsScroll && this.scrollY > -10
    if (needsScroll) {
      const thumbH = Math.max(28, (this.viewportHeight / bottom) * (this.viewportHeight - 8))
      this.thumb.rectHeight = thumbH
      const t = this.maxScroll === 0 ? 0 : -this.scrollY / this.maxScroll
      this.thumb.y = 4 + t * (this.viewportHeight - 8 - thumbH)
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

/** Walk parents looking for a ScrollableNode and forward the wheel gesture. */
export function forwardWheelToScrollParent(node: Node, event: SceneryEvent<WheelEvent>): boolean {
  let current: Node | null = node
  while (current) {
    if (current instanceof ScrollableNode) {
      current.scrollByWheel(event)
      return true
    }
    // Duck-type for copies that may not share the same class identity across bundles.
    const maybe = current as Node & { scrollByWheel?: (e: SceneryEvent<WheelEvent>) => void }
    if (typeof maybe.scrollByWheel === 'function' && current !== node) {
      maybe.scrollByWheel(event)
      return true
    }
    current = current.parent
  }
  return false
}
