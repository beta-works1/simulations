import { Node, Rectangle, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { EcologyColors } from '../EcologyColors.js'

export class SoftButton extends Node {
  private readonly bg: Rectangle
  private readonly shadow: Rectangle
  private readonly labelText: Text
  private readonly activeFill: string
  private readonly activeTextFill: string
  private selected: boolean

  public constructor(
    label: string,
    onPress: () => void,
    options: {
      width?: number
      height?: number
      fill?: string
      textFill?: string
      selected?: boolean
    } = {},
  ) {
    super({ cursor: 'pointer' })
    const w = options.width ?? 120
    const h = options.height ?? 34
    this.activeFill = options.fill ?? EcologyColors.accent
    this.activeTextFill = options.textFill ?? '#ecfeff'
    this.selected = options.selected ?? true

    this.shadow = new Rectangle(2, 3, w, h, {
      cornerRadius: 10,
      fill: 'rgba(15,23,42,0.18)',
    })
    this.bg = new Rectangle(0, 0, w, h, {
      cornerRadius: 10,
      fill: this.activeFill,
      stroke: 'rgba(255,255,255,0.35)',
      lineWidth: 1,
    })
    this.labelText = new Text(label, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: this.activeTextFill,
      centerX: w / 2,
      centerY: h / 2,
      maxWidth: w - 12,
    })

    this.addChild(this.shadow)
    this.addChild(this.bg)
    this.addChild(this.labelText)
    this.applySelectedStyle()

    this.addInputListener({
      down: () => {
        this.bg.y = 1
        this.shadow.opacity = 0.4
        onPress()
      },
      up: () => {
        this.bg.y = 0
        this.shadow.opacity = 1
      },
      cancel: () => {
        this.bg.y = 0
        this.shadow.opacity = 1
      },
    })
  }

  public setLabel(label: string): void {
    this.labelText.string = label
    this.labelText.centerX = this.bg.width / 2
    this.labelText.centerY = this.bg.height / 2
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
      this.opacity = 1
    }
    else {
      this.bg.fill = 'rgba(148,163,184,0.32)'
      this.bg.stroke = 'rgba(71,85,105,0.25)'
      this.bg.lineWidth = 1
      this.labelText.fill = EcologyColors.muted
      this.shadow.opacity = 0.45
      this.opacity = 0.92
    }
  }
}
