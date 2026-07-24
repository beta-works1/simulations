import { Node, Path, Rectangle, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont } from 'scenerystack/scenery-phet'
import { NervousColors } from '../NervousColors.js'

/**
 * Tiny multi-series history chart (ecology carbon/predator pattern, compact).
 */
export class HistoryChart extends Node {
  private readonly series: { values: number[]; color: string }[] = []
  private readonly plot: Path[] = []
  private readonly w: number
  private readonly h: number
  private readonly title: Text
  private maxPoints: number

  public constructor(
    width: number,
    height: number,
    options: { title?: string; maxPoints?: number } = {},
  ) {
    super({ pickable: false })
    this.w = width
    this.h = height
    this.maxPoints = options.maxPoints ?? 40

    this.addChild(
      new Rectangle(0, 0, width, height, {
        cornerRadius: 8,
        fill: 'rgba(255,255,255,0.05)',
        stroke: 'rgba(148,163,184,0.25)',
      }),
    )
    this.title = new Text(options.title ?? 'History', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: NervousColors.panelMuted,
      left: 8,
      top: 4,
    })
    this.addChild(this.title)
  }

  public addSeries(color: string): number {
    const path = new Path(null, { stroke: color, lineWidth: 2, pickable: false })
    this.plot.push(path)
    this.addChild(path)
    this.series.push({ values: [], color })
    return this.series.length - 1
  }

  public push(seriesIndex: number, value: number): void {
    const s = this.series[seriesIndex]
    if (!s) return
    s.values.push(value)
    if (s.values.length > this.maxPoints) {
      s.values.shift()
    }
    this.redraw()
  }

  public clear(): void {
    for (const s of this.series) {
      s.values.length = 0
    }
    this.redraw()
  }

  private redraw(): void {
    let max = 1
    for (const s of this.series) {
      for (const v of s.values) {
        max = Math.max(max, v)
      }
    }
    const top = 18
    const bottom = this.h - 6
    const left = 6
    const right = this.w - 6
    this.series.forEach((s, i) => {
      if (s.values.length < 2) {
        this.plot[i].shape = null
        return
      }
      const shape = new Shape()
      s.values.forEach((v, j) => {
        const x = left + (j / (this.maxPoints - 1)) * (right - left)
        const y = bottom - (v / max) * (bottom - top)
        if (j === 0) shape.moveTo(x, y)
        else shape.lineTo(x, y)
      })
      this.plot[i].shape = shape
    })
  }
}
