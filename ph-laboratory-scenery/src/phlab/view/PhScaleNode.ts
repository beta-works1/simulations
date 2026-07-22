import { Node, Rectangle, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { universalPhColor } from '../model/PhLabGuide.js'

/**
 * Rainbow pH 0–14 scale with a live marker.
 */
export class PhScaleNode extends Node {
  private readonly marker: Rectangle
  private readonly trackWidth: number
  private readonly trackLeft: number
  private readonly highlightRing: Rectangle

  public constructor(width = 420) {
    super()
    this.trackWidth = width
    this.trackLeft = 28

    const title = new Text('pH color scale (universal indicator)', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#0f172a',
      left: this.trackLeft,
      top: 0,
    })
    this.addChild(title)

    const trackY = 26
    const trackH = 22
    const segments = 28
    for (let i = 0; i < segments; i++) {
      const ph = (i / (segments - 1)) * 14
      const segW = this.trackWidth / segments
      this.addChild(
        new Rectangle(this.trackLeft + i * segW, trackY, segW + 0.5, trackH, {
          fill: universalPhColor(ph),
        }),
      )
    }

    const border = new Rectangle(this.trackLeft, trackY, this.trackWidth, trackH, {
      stroke: 'rgba(15,23,42,0.35)',
      lineWidth: 1.5,
      cornerRadius: 4,
    })
    this.addChild(border)

    // Tick labels
    ;[0, 3, 7, 11, 14].forEach((ph) => {
      const x = this.trackLeft + (ph / 14) * this.trackWidth
      this.addChild(
        new Text(String(ph), {
          font: new PhetFont(11),
          fill: '#475569',
          centerX: x,
          top: trackY + trackH + 4,
        }),
      )
    })

    this.addChild(
      new Text('Acid', {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#b91c1c',
        left: this.trackLeft,
        top: trackY + trackH + 20,
      }),
    )
    this.addChild(
      new Text('Neutral', {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#15803d',
        centerX: this.trackLeft + this.trackWidth / 2,
        top: trackY + trackH + 20,
      }),
    )
    this.addChild(
      new Text('Base', {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#1d4ed8',
        right: this.trackLeft + this.trackWidth,
        top: trackY + trackH + 20,
      }),
    )

    this.marker = new Rectangle(0, 0, 6, trackH + 10, {
      cornerRadius: 2,
      fill: '#0f172a',
      stroke: '#fff',
      lineWidth: 1.5,
    })
    this.marker.centerY = trackY + trackH / 2
    this.addChild(this.marker)

    this.highlightRing = new Rectangle(
      this.trackLeft - 8,
      trackY - 8,
      this.trackWidth + 16,
      trackH + 40,
      {
        cornerRadius: 10,
        stroke: '#2dd4bf',
        lineWidth: 3,
        visible: false,
      },
    )
    this.addChild(this.highlightRing)

    this.setPh(7, false)
  }

  public setPh(ph: number, hasLiquid: boolean): void {
    const p = hasLiquid ? Math.max(0, Math.min(14, ph)) : 7
    this.marker.centerX = this.trackLeft + (p / 14) * this.trackWidth
    this.marker.opacity = hasLiquid ? 1 : 0.35
  }

  public setHighlight(on: boolean): void {
    this.highlightRing.visible = on
  }
}
