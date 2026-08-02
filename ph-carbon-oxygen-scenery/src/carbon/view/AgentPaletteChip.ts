import { Vector2 } from 'scenerystack/dot'
import { DragListener, Node, Rectangle, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { createEcologyIcon } from '../../common/EcologyArt.js'
import type { AgentKind } from '../model/agents.js'
import type { CarbonSounds } from './CarbonSounds.js'

export type LandDropTarget = {
  containsGlobalPoint: (x: number, y: number) => boolean
  globalToLandNorm: (x: number, y: number) => { nx: number; ny: number } | null
  setHighlight?: (on: boolean) => void
}

const CHIP: Record<AgentKind, { icon: string; label: string; fill: string }> = {
  plant: { icon: 'tree', label: 'Tree', fill: '#16a34a' },
  animal: { icon: 'cow', label: 'Animal', fill: '#ea580c' },
  factory: { icon: 'factory', label: 'Factory', fill: '#64748b' },
}

/**
 * Drag from the control panel onto the meadow to place an agent.
 */
export class AgentPaletteChip extends Node {
  public constructor(
    kind: AgentKind,
    width: number,
    dropTarget: LandDropTarget,
    onDrop: (kind: AgentKind, nx: number, ny: number) => void,
    ghostLayer: Node,
    sounds?: CarbonSounds,
  ) {
    super({ cursor: 'grab' })

    const meta = CHIP[kind]
    const bg = new Rectangle(0, 0, width, 40, {
      fill: meta.fill,
      cornerRadius: 8,
      stroke: 'rgba(255,255,255,0.35)',
      lineWidth: 1,
    })
    const icon = createEcologyIcon(meta.icon, 30)
    icon.left = 6
    icon.centerY = 20
    const text = new Text(meta.label, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: 'white',
      left: 40,
      centerY: 20,
      maxWidth: width - 88,
    })
    const hint = new Text('drag →', {
      font: new PhetFont(9),
      fill: 'rgba(255,255,255,0.75)',
      right: width - 8,
      centerY: 20,
    })
    this.addChild(bg)
    this.addChild(icon)
    this.addChild(text)
    this.addChild(hint)

    let ghost: Node | null = null

    const placeGhost = (globalPoint: Vector2) => {
      if (!ghost) return
      ghost.center = ghostLayer.globalToLocalPoint(globalPoint)
      const ok = dropTarget.containsGlobalPoint(globalPoint.x, globalPoint.y)
      ghost.opacity = ok ? 1 : 0.4
      dropTarget.setHighlight?.(ok)
    }

    this.addInputListener(
      new DragListener({
        allowTouchSnag: true,
        start: (event) => {
          this.opacity = 0.4
          sounds?.softClick()
          ghost = new Node({ pickable: false })
          ghost.addChild(createEcologyIcon(meta.icon, 48))
          ghostLayer.addChild(ghost)
          placeGhost(event.pointer.point)
        },
        drag: (event) => placeGhost(event.pointer.point),
        end: (event) => {
          this.opacity = 1
          dropTarget.setHighlight?.(false)
          const point = event?.pointer.point
          if (ghost) {
            ghostLayer.removeChild(ghost)
            ghost = null
          }
          if (!point) return
          if (dropTarget.containsGlobalPoint(point.x, point.y)) {
            const norm = dropTarget.globalToLandNorm(point.x, point.y)
            if (norm) {
              onDrop(kind, norm.nx, norm.ny)
              sounds?.softClick()
            }
          }
        },
      }),
    )
  }
}
