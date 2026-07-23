import { Circle, Node, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { LEVEL_COLORS } from '../../common/EcologyColors.js'
import { createEcologyIcon } from '../../common/EcologyArt.js'
import type { FoodNode } from '../model/FoodWebModel.js'
import type { EcologySounds } from './EcologySounds.js'

/**
 * Species as a circular illustrated avatar (pfp), not a solid color disk.
 * The picture fills the circle; name + energy sit under it.
 */
export class SpeciesNode extends Node {
  public readonly nodeId: string
  private readonly ring: Circle
  private readonly glow: Circle
  private readonly label: Text
  private readonly energyLabel: Text
  private readonly avatarRadius: number

  public constructor(
    node: FoodNode,
    radius: number,
    onPress: (id: string) => void,
    onDrag: (id: string, x: number, y: number) => void,
    sounds?: EcologySounds,
  ) {
    super({ cursor: 'pointer' })
    this.nodeId = node.id
    this.avatarRadius = Math.max(26, radius)

    const color = LEVEL_COLORS[node.level]

    this.glow = new Circle(this.avatarRadius + 8, {
      fill: 'rgba(255,255,255,0.14)',
      visible: false,
      pickable: false,
    })

    // Soft outer halo using level color (not a solid filled disk)
    const halo = new Circle(this.avatarRadius + 3, {
      fill: color,
      opacity: 0.28,
      pickable: false,
    })

    const avatar = createEcologyIcon(node.name, this.avatarRadius * 2)
    avatar.centerX = 0
    avatar.centerY = 0

    this.ring = new Circle(this.avatarRadius, {
      fill: null,
      stroke: 'rgba(255,255,255,0.95)',
      lineWidth: 3,
      pickable: false,
    })

    this.label = new Text(node.name, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#ffffff',
      maxWidth: this.avatarRadius * 2.8,
      centerX: 0,
      top: this.avatarRadius + 6,
    })

    // Tiny color pip so trophic role stays readable without a big disk
    const pip = new Circle(4, {
      fill: color,
      stroke: 'white',
      lineWidth: 1,
      centerX: this.avatarRadius * 0.72,
      centerY: this.avatarRadius * 0.72,
      pickable: false,
    })

    this.energyLabel = new Text('', {
      font: new PhetFont({ size: 10, weight: 'bold' }),
      fill: '#fde68a',
      centerX: 0,
      top: this.label.bottom + 1,
    })

    this.addChild(this.glow)
    this.addChild(halo)
    this.addChild(avatar)
    this.addChild(this.ring)
    this.addChild(pip)
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
    this.ring.lineWidth = selected ? 4.5 : 3
    this.ring.stroke = selected ? '#ffffff' : atRisk ? '#f87171' : 'rgba(255,255,255,0.95)'
    this.ring.lineDash = atRisk && !selected ? [5, 4] : []
    this.glow.visible = selected
  }

  public setEnergy(label: string): void {
    this.energyLabel.string = label
    this.energyLabel.centerX = 0
  }

  public setPositionNorm(x: number, y: number, areaWidth: number, areaHeight: number, ox: number, oy: number): void {
    this.centerX = ox + x * areaWidth
    // Keep avatar center on the trophic band; labels hang below
    this.centerY = oy + y * areaHeight
  }
}
