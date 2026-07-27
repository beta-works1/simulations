import { Node, Rectangle, Text } from 'scenerystack/scenery'
import type { SceneryEvent } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { BiotechColors } from '../BiotechColors.js'
import { forwardWheelToScrollParent } from './ScrollableNode.js'

/** Compact depth button — ecology carbon-panel density. */
export class SoftButton extends Node {
  private readonly bg: Rectangle
  private readonly shadow: Rectangle
  private readonly gloss: Rectangle
  private readonly labelText: Text
  private readonly activeFill: string
  private readonly activeTextFill: string
  private selected: boolean
  private readonly w: number
  private readonly h: number

  public constructor(
    label: string,
    onPress: () => void,
    options: {
      width?: number
      height?: number
      fill?: string
      textFill?: string
      selected?: boolean
      fontSize?: number
      onSound?: () => void
    } = {},
  ) {
    super({ cursor: 'pointer' })
    this.w = options.width ?? 140
    this.h = options.height ?? 34
    this.activeFill = options.fill ?? BiotechColors.accent
    this.activeTextFill = options.textFill ?? '#ecfeff'
    this.selected = options.selected ?? true
    const fontSize = options.fontSize ?? 12

    this.shadow = new Rectangle(2, 3, this.w, this.h, {
      cornerRadius: 10,
      fill: 'rgba(0,0,0,0.4)',
    })
    this.bg = new Rectangle(0, 0, this.w, this.h, {
      cornerRadius: 10,
      fill: this.activeFill,
      stroke: 'rgba(255,255,255,0.28)',
      lineWidth: 1,
    })
    this.gloss = new Rectangle(8, 3, this.w - 16, 4, {
      cornerRadius: 2,
      fill: 'rgba(255,255,255,0.28)',
      pickable: false,
    })
    this.labelText = new Text(label, {
      font: new PhetFont({ size: fontSize, weight: 'bold' }),
      fill: this.activeTextFill,
      centerX: this.w / 2,
      centerY: this.h / 2,
      maxWidth: this.w - 14,
    })

    this.addChild(this.shadow)
    this.addChild(this.bg)
    this.addChild(this.gloss)
    this.addChild(this.labelText)
    this.applySelectedStyle()

    this.addInputListener({
      down: () => {
        this.bg.y = 1
        this.gloss.y = 4
        this.labelText.centerY = this.h / 2 + 1
        this.shadow.opacity = 0.45
        options.onSound?.()
        onPress()
      },
      up: () => this.resetPress(),
      cancel: () => this.resetPress(),
      enter: () => {
        if (this.selected) {
          this.bg.stroke = 'rgba(255,255,255,0.7)'
          this.bg.lineWidth = 1.5
        }
      },
      exit: () => this.applySelectedStyle(),
      wheel: (event: SceneryEvent<WheelEvent>) => {
        forwardWheelToScrollParent(this, event)
      },
    })
  }

  private resetPress(): void {
    this.bg.y = 0
    this.gloss.y = 3
    this.labelText.centerY = this.h / 2
    this.shadow.opacity = 1
  }

  public setLabel(label: string): void {
    this.labelText.string = label
    this.labelText.centerX = this.w / 2
    this.labelText.centerY = this.h / 2
  }

  public setSelected(selected: boolean): void {
    this.selected = selected
    this.applySelectedStyle()
  }

  private applySelectedStyle(): void {
    if (this.selected) {
      this.bg.fill = this.activeFill
      this.bg.stroke = 'rgba(255,255,255,0.35)'
      this.bg.lineWidth = 1
      this.labelText.fill = this.activeTextFill
      this.shadow.opacity = 1
      this.gloss.visible = true
      this.opacity = 1
    }
    else {
      // Readable on dark ecology-style panels
      this.bg.fill = 'rgba(148,163,184,0.22)'
      this.bg.stroke = 'rgba(148,163,184,0.35)'
      this.bg.lineWidth = 1
      this.labelText.fill = '#cbd5e1'
      this.shadow.opacity = 0.35
      this.gloss.visible = false
      this.opacity = 1
    }
  }
}
