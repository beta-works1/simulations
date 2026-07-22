import { Circle, Node, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { LEVEL_COLORS } from '../../common/EcologyColors.js'
import type { FoodNode } from '../model/FoodWebModel.js'

export class SpeciesNode extends Node {
  public readonly nodeId: string
  private readonly disk: Circle
  private readonly label: Text
  private readonly energyLabel: Text
  private readonly glow: Circle

  public constructor(
    node: FoodNode,
    radius: number,
    onPress: (id: string) => void,
    onDrag: (id: string, x: number, y: number) => void,
  ) {
    super({ cursor: 'pointer' })
    this.nodeId = node.id

    this.glow = new Circle(radius + 6, {
      fill: 'rgba(255,255,255,0.08)',
      visible: false,
    })

    this.disk = new Circle(radius, {
      fill: LEVEL_COLORS[node.level],
      stroke: 'rgba(255,255,255,0.85)',
      lineWidth: 2,
    })

    this.label = new Text(node.name, {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: 'white',
      maxWidth: radius * 2.4,
      centerX: 0,
      centerY: -2,
    })

    this.energyLabel = new Text('', {
      font: new PhetFont(9),
      fill: 'rgba(255,255,255,0.9)',
      centerX: 0,
      top: radius * 0.15,
    })

    this.addChild(this.glow)
    this.addChild(this.disk)
    this.addChild(this.label)
    this.addChild(this.energyLabel)

    let dragging = false
    let start = { x: 0, y: 0 }

    this.addInputListener({
      down: (event) => {
        dragging = false
        start = { x: event.pointer.point.x, y: event.pointer.point.y }
      },
      move: (event) => {
        if (!event.pointer.isDown) return
        const dx = event.pointer.point.x - start.x
        const dy = event.pointer.point.y - start.y
        if (!dragging && Math.hypot(dx, dy) > 6) dragging = true
        if (dragging) {
          const parent = this.parent
          if (parent) {
            const local = parent.globalToLocalPoint(event.pointer.point)
            onDrag(node.id, local.x, local.y)
          }
        }
      },
      up: () => {
        if (!dragging) onPress(node.id)
      },
    })
  }

  public setSelected(selected: boolean, atRisk: boolean): void {
    this.disk.lineWidth = selected ? 3.5 : 2
    this.disk.stroke = selected ? '#ffffff' : atRisk ? '#e74c3c' : 'rgba(255,255,255,0.85)'
    this.disk.lineDash = atRisk && !selected ? [4, 3] : []
    this.glow.visible = selected
  }

  public setEnergy(label: string): void {
    this.energyLabel.string = label
    this.energyLabel.centerX = 0
  }

  public setPositionNorm(x: number, y: number, areaWidth: number, areaHeight: number, ox: number, oy: number): void {
    this.centerX = ox + x * areaWidth
    this.centerY = oy + y * areaHeight
  }
}
