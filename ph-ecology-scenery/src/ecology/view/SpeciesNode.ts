import { Circle, Node, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { LEVEL_COLORS } from '../../common/EcologyColors.js'
import { createEcologyIcon } from '../../common/EcologyArt.js'
import type { FoodNode } from '../model/FoodWebModel.js'
import type { EcologySounds } from './EcologySounds.js'

/**
 * Clean circular avatar: picture + thin ring + name/energy under it.
 */
export class SpeciesNode extends Node {
  public readonly nodeId: string
  private readonly ring: Circle
  private readonly label: Text
  private readonly energyLabel: Text
  private readonly avatarRadius: number
  private readonly levelColor: string

  public constructor(
    node: FoodNode,
    radius: number,
    onPress: (id: string) => void,
    onDrag: (id: string, x: number, y: number) => void,
    sounds?: EcologySounds,
  ) {
    super({ cursor: 'pointer' })
    this.nodeId = node.id
    this.avatarRadius = Math.max(24, radius)
    this.levelColor = LEVEL_COLORS[node.level]

    const avatar = createEcologyIcon(node.name, this.avatarRadius * 2)
    avatar.centerX = 0
    avatar.centerY = 0

    this.ring = new Circle(this.avatarRadius, {
      fill: null,
      stroke: 'rgba(255,255,255,0.7)',
      lineWidth: 2,
      pickable: false,
    })

    this.label = new Text(node.name, {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#f8fafc',
      maxWidth: this.avatarRadius * 2.6,
      centerX: 0,
      top: this.avatarRadius + 5,
    })

    this.energyLabel = new Text('', {
      font: new PhetFont(10),
      fill: '#fde68a',
      centerX: 0,
      top: this.label.bottom,
    })

    this.addChild(avatar)
    this.addChild(this.ring)
    this.addChild(this.label)
    this.addChild(this.energyLabel)

    let dragging = false
    let start = { x: 0, y: 0 }
    let grabSounded = false

    this.addInputListener({
      down: (event) => {
        dragging = false
        grabSounded = false
        start = { x: event.pointer.point.x, y: event.pointer.point.y }
      },
      move: (event) => {
        if (!event.pointer.isDown) return
        const dx = event.pointer.point.x - start.x
        const dy = event.pointer.point.y - start.y
        if (!dragging && Math.hypot(dx, dy) > 6) {
          dragging = true
          if (!grabSounded) {
            sounds?.grabStart()
            grabSounded = true
          }
        }
        if (dragging) {
          const parent = this.parent
          if (parent) {
            const local = parent.globalToLocalPoint(event.pointer.point)
            onDrag(node.id, local.x, local.y)
          }
        }
      },
      up: () => {
        if (dragging) sounds?.dropOk()
        else {
          onPress(node.id)
          sounds?.select()
        }
      },
    })
  }

  public setSelected(selected: boolean, atRisk: boolean): void {
    this.ring.lineWidth = selected ? 3.5 : 2
    this.ring.stroke = selected
      ? '#ffffff'
      : atRisk
        ? this.levelColor
        : 'rgba(255,255,255,0.7)'
    this.ring.lineDash = []
    this.label.fill = atRisk && !selected ? '#fecaca' : '#f8fafc'
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
