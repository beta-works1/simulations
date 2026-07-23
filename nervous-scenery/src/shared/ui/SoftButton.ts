import { Node, Rectangle, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { NervousColors } from '../NervousColors.js'

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
    } = {},
  ) {
    super({ cursor: 'pointer' })
    this.w = options.width ?? 140
    this.h = options.height ?? 40
    this.activeFill = options.fill ?? NervousColors.accent
    this.activeTextFill = options.textFill ?? '#f5f3ff'
    this.selected = options.selected ?? true
    const fontSize = options.fontSize ?? 14

    this.shadow = new Rectangle(3, 5, this.w, this.h, {
      cornerRadius: 12,
      fill: 'rgba(15,23,42,0.22)',
    })
    this.bg = new Rectangle(0, 0, this.w, this.h, {
      cornerRadius: 12,
      fill: this.activeFill,
      stroke: 'rgba(255,255,255,0.4)',
      lineWidth: 1.5,
    })
    this.gloss = new Rectangle(8, 4, this.w - 16, 5, {
      cornerRadius: 3,
      fill: 'rgba(255,255,255,0.35)',
      pickable: false,
    })
    this.labelText = new Text(label, {
      font: new PhetFont({ size: fontSize, weight: 'bold' }),
      fill: this.activeTextFill,
      centerX: this.w / 2,
      centerY: this.h / 2,
      maxWidth: this.w - 16,
    })

    this.addChild(this.shadow)
    this.addChild(this.bg)
    this.addChild(this.gloss)
    this.addChild(this.labelText)
    this.applySelectedStyle()

    this.addInputListener({
      down: () => {
        this.bg.y = 2
        this.gloss.y = 6
        this.labelText.centerY = this.h / 2 + 2
        this.shadow.opacity = 0.35
        onPress()
      },
      up: () => this.resetPress(),
      cancel: () => this.resetPress(),
      enter: () => {
        if (this.selected) {
          this.bg.stroke = 'rgba(255,255,255,0.85)'
          this.bg.lineWidth = 2
        }
      },
      exit: () => this.applySelectedStyle(),
    })
  }

  private resetPress(): void {
    this.bg.y = 0
    this.gloss.y = 4
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
      this.bg.stroke = 'rgba(255,255,255,0.55)'
      this.bg.lineWidth = 1.5
      this.labelText.fill = this.activeTextFill
      this.shadow.opacity = 1
      this.gloss.visible = true
      this.opacity = 1
    }
    else {
      this.bg.fill = 'rgba(148,163,184,0.28)'
      this.bg.stroke = 'rgba(71,85,105,0.28)'
      this.bg.lineWidth = 1
      this.labelText.fill = NervousColors.muted
      this.shadow.opacity = 0.4
      this.gloss.visible = false
      this.opacity = 0.95
    }
  }
}
