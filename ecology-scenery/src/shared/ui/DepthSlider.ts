import { Node, Rectangle, Text, DragListener } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { NumberProperty } from 'scenerystack/axon'
import { clamp } from '../EcologyConstants.js'
import { EcologyColors } from '../EcologyColors.js'

/** Horizontal slider with draggable thumb and depth. */
export class DepthSlider extends Node {
  public constructor(
    property: NumberProperty,
    options: {
      min: number
      max: number
      width?: number
      label: string
      format?: (n: number) => string
    },
  ) {
    super()
    const w = options.width ?? 180
    const trackY = 28
    const format = options.format ?? ((n: number) => `${Math.round(n)}`)

    const label = new Text(options.label, {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: EcologyColors.muted,
      left: 0,
      top: 0,
      maxWidth: w - 50,
    })
    const valueText = new Text(format(property.value), {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: EcologyColors.accent,
      right: w,
      top: 0,
    })

    const trackShadow = new Rectangle(0, trackY + 2, w, 8, {
      cornerRadius: 4,
      fill: 'rgba(15,23,42,0.12)',
    })
    const track = new Rectangle(0, trackY, w, 8, {
      cornerRadius: 4,
      fill: 'rgba(148,163,184,0.45)',
    })
    const fill = new Rectangle(0, trackY, 40, 8, {
      cornerRadius: 4,
      fill: EcologyColors.accent,
    })

    const thumb = new Node()
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
        stroke: EcologyColors.accent,
        lineWidth: 2.5,
        cursor: 'pointer',
      }),
    )
    thumb.y = trackY + 4

    const sync = () => {
      const t = (property.value - options.min) / (options.max - options.min)
      const x = clamp(t, 0, 1) * w
      fill.setRectWidth(Math.max(8, x))
      thumb.x = x
      valueText.string = format(property.value)
      valueText.right = w
    }
    property.link(sync)

    const setFromX = (localX: number) => {
      const t = clamp(localX / w, 0, 1)
      property.value = options.min + t * (options.max - options.min)
    }

    track.addInputListener({
      down: (event) => {
        const pt = track.globalToLocalPoint(event.pointer.point)
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
    this.addChild(trackShadow)
    this.addChild(track)
    this.addChild(fill)
    this.addChild(thumb)
  }
}
