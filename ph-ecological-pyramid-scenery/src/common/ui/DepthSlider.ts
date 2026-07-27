import { Node, Rectangle, Text, DragListener } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { NumberProperty } from 'scenerystack/axon'
import { clamp } from '../SimTheme.js'
import { SimTheme } from '../SimTheme.js'

/** Horizontal slider with draggable thumb and depth (ecology-style). */
export class DepthSlider extends Node {
  public constructor(
    property: NumberProperty,
    options: {
      min: number
      max: number
      width?: number
      label: string
      format?: (n: number) => string
      fill?: string
      onTick?: () => void
    },
  ) {
    super()
    const w = options.width ?? 180
    const trackY = 28
    const format = options.format ?? ((n: number) => `${Math.round(n)}`)
    const accent = options.fill ?? SimTheme.accent
    let lastValue = property.value

    const label = new Text(options.label, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: SimTheme.panelMuted,
      left: 0,
      top: 0,
      maxWidth: w - 56,
    })
    const valueText = new Text(format(property.value), {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: accent,
      right: w,
      top: 0,
    })

    this.addChild(
      new Rectangle(0, trackY + 2, w, 8, {
        cornerRadius: 4,
        fill: 'rgba(0,0,0,0.35)',
      }),
    )
    const track = new Rectangle(0, trackY, w, 8, {
      cornerRadius: 4,
      fill: 'rgba(148,163,184,0.35)',
      cursor: 'pointer',
    })
    const fillBar = new Rectangle(0, trackY, 40, 8, {
      cornerRadius: 4,
      fill: accent,
    })

    const thumb = new Node({ cursor: 'pointer' })
    thumb.addChild(
      new Rectangle(-9, -9, 18, 18, {
        cornerRadius: 9,
        fill: 'rgba(15,23,42,0.18)',
      }),
    )
    thumb.addChild(
      new Rectangle(-8, -10, 16, 16, {
        cornerRadius: 8,
        fill: '#fff',
        stroke: accent,
        lineWidth: 2.5,
      }),
    )
    thumb.y = trackY + 4

    const sync = () => {
      const t = (property.value - options.min) / (options.max - options.min)
      const x = clamp(t, 0, 1) * w
      fillBar.setRectWidth(Math.max(8, x))
      thumb.x = x
      valueText.string = format(property.value)
      valueText.right = w
      if (property.value !== lastValue) {
        lastValue = property.value
        options.onTick?.()
      }
    }
    property.link(sync)

    const setFromX = (localX: number) => {
      const t = clamp(localX / w, 0, 1)
      property.value = options.min + t * (options.max - options.min)
    }

    track.addInputListener({
      down: (event) => {
        const pt = this.globalToLocalPoint(event.pointer.point)
        setFromX(pt.x)
      },
    })

    thumb.addInputListener(
      new DragListener({
        drag: (event) => {
          const pt = this.globalToLocalPoint(event.pointer.point)
          setFromX(pt.x)
        },
      }),
    )

    this.addChild(label)
    this.addChild(valueText)
    this.addChild(track)
    this.addChild(fillBar)
    this.addChild(thumb)
  }
}
