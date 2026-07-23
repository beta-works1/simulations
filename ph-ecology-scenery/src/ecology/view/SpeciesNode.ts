import { Circle, Node, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { LEVEL_COLORS } from '../../common/EcologyColors.js'
import { createEcologyAvatar } from '../../common/EcologyArt.js'
import type { FoodNode } from '../model/FoodWebModel.js'
import type { EcologySounds } from './EcologySounds.js'

/**
 * Clean circular avatar: picture + thin ring locked to the same center,
 * with name/energy under it. Position uses translation of local (0,0)
 * so the avatar — not the label-shifted bounds — sits on the trophic band.
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

    const { root: avatar, ring } = createEcologyAvatar(
      node.name,
      this.avatarRadius,
      'rgba(255,255,255,0.75)',
    )
    this.ring = ring

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
    this.ring.lineWidth = selected ? 3.5 : 2.5
    this.ring.stroke = selected
      ? '#ffffff'
      : atRisk
        ? this.levelColor
        : 'rgba(255,255,255,0.75)'
    this.ring.lineDash = []
    this.label.fill = atRisk && !selected ? '#fecaca' : '#f8fafc'
  }

  public setEnergy(label: string): void {
    this.energyLabel.string = label
    this.energyLabel.centerX = 0
  }

  public setPositionNorm(x: number, y: number, areaWidth: number, areaHeight: number, ox: number, oy: number): void {
    // Place local origin (avatar center) on the band — do NOT use centerX/centerY,
    // which would shift by the label below the avatar.
    this.x = ox + x * areaWidth
    this.y = oy + y * areaHeight
  }
}
