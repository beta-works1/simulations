import { Vector2 } from 'scenerystack/dot'
import { DragListener, Node, Rectangle, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { LEVEL_COLORS } from '../../common/EcologyColors.js'
import { createEcologyIcon } from '../../common/EcologyArt.js'
import type { TrophicLevel } from '../model/FoodWebModel.js'
import type { EcologySounds } from './EcologySounds.js'

export type DropTarget = {
  containsGlobalPoint: (x: number, y: number) => boolean
  globalToNormalized: (x: number, y: number) => { x: number; y: number } | null
  setHighlight?: (on: boolean) => void
}

const LEVEL_ICON: Record<TrophicLevel, string> = {
  producer: 'grass',
  herbivore: 'rabbit',
  carnivore: 'fox',
  decomposer: 'fungi',
}

/**
 * Side-panel chip: drag onto the ecosystem scene to place a species.
 */
export class SpeciesPaletteChip extends Node {
  public constructor(
    level: TrophicLevel,
    label: string,
    width: number,
    dropTarget: DropTarget,
    onDrop: (level: TrophicLevel, nx: number, ny: number) => void,
    ghostLayer: Node,
    sounds?: EcologySounds,
  ) {
    super({ cursor: 'grab' })

    const color = LEVEL_COLORS[level]
    const bg = new Rectangle(0, 0, width, 40, {
      fill: color,
      cornerRadius: 8,
      stroke: 'rgba(255,255,255,0.35)',
      lineWidth: 1,
    })
    const icon = createEcologyIcon(LEVEL_ICON[level], 26)
    icon.left = 6
    icon.centerY = 20
    const text = new Text(label, {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: 'white',
      left: 36,
      centerY: 20,
      maxWidth: width - 70,
    })
    const hint = new Text('drag →', {
      font: new PhetFont(8),
      fill: 'rgba(255,255,255,0.7)',
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
      const local = ghostLayer.globalToLocalPoint(globalPoint)
      ghost.center = local
      const ok = dropTarget.containsGlobalPoint(globalPoint.x, globalPoint.y)
      ghost.opacity = ok ? 1 : 0.45
      dropTarget.setHighlight?.(ok)
    }

    this.addInputListener(
      new DragListener({
        allowTouchSnag: true,
        start: (event) => {
          this.opacity = 0.45
          sounds?.grabStart()
          ghost = new Node({ pickable: false })
          ghost.addChild(createEcologyIcon(LEVEL_ICON[level], 44))
          ghost.addChild(
            new Text(label, {
              font: new PhetFont(10),
              fill: 'white',
              centerY: 22,
              centerX: 0,
              maxWidth: 70,
            }),
          )
          ghostLayer.addChild(ghost)
          placeGhost(event.pointer.point)
        },
        drag: (event) => {
          placeGhost(event.pointer.point)
        },
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
            const norm = dropTarget.globalToNormalized(point.x, point.y)
            if (norm) {
              onDrop(level, norm.x, norm.y)
              sounds?.dropOk()
            }
          } else {
            sounds?.dropMiss()
          }
        },
      }),
    )
  }
}
