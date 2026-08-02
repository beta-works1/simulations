import { DragListener, Node } from 'scenerystack/scenery'
import { createEcologyIcon } from '../../common/EcologyArt.js'
import type { AgentKind, LandscapeAgent } from '../model/agents.js'
import type { LandDropTarget } from './AgentPaletteChip.js'
import type { CarbonSounds } from './CarbonSounds.js'

const ICON: Record<AgentKind, string> = {
  plant: 'tree',
  animal: 'cow',
  factory: 'factory',
}

const SIZE: Record<AgentKind, number> = {
  plant: 44,
  animal: 36,
  factory: 50,
}

/**
 * One placeable landscape toy — drag to move; drag off the land to remove.
 */
export class LandscapeAgentNode extends Node {
  public readonly agentId: string
  public readonly kind: AgentKind
  private startCenter: { x: number; y: number } | null = null

  public constructor(
    agent: LandscapeAgent,
    landToLocal: (nx: number, ny: number) => { x: number; y: number },
    dropTarget: LandDropTarget,
    onMove: (id: string, nx: number, ny: number) => void,
    onRemove: (id: string) => void,
    onTap: (kind: AgentKind) => void,
    sounds?: CarbonSounds,
  ) {
    super({ cursor: 'grab' })
    this.agentId = agent.id
    this.kind = agent.kind

    const useDeer = agent.kind === 'animal' && agent.id.length % 2 === 0
    const icon = createEcologyIcon(useDeer ? 'deer' : ICON[agent.kind], SIZE[agent.kind])
    this.addChild(icon)

    const pos = landToLocal(agent.nx, agent.ny)
    this.centerX = pos.x
    this.centerY = pos.y

    this.addInputListener(
      new DragListener({
        allowTouchSnag: true,
        start: () => {
          this.startCenter = { x: this.centerX, y: this.centerY }
          sounds?.softClick()
          this.moveToFront()
        },
        drag: (event) => {
          if (!this.parent) return
          const local = this.parent.globalToLocalPoint(event.pointer.point)
          this.center = local
          const ok = dropTarget.containsGlobalPoint(event.pointer.point.x, event.pointer.point.y)
          this.opacity = ok ? 1 : 0.4
          dropTarget.setHighlight?.(ok)
        },
        end: (event) => {
          dropTarget.setHighlight?.(false)
          this.opacity = 1
          const point = event?.pointer.point
          const start = this.startCenter
          this.startCenter = null
          if (!point || !this.parent) return

          const moved =
            start !== null &&
            (Math.abs(this.centerX - start.x) > 8 || Math.abs(this.centerY - start.y) > 8)

          if (!moved) {
            // Tap without drag → tip
            const p = landToLocal(agent.nx, agent.ny)
            this.centerX = p.x
            this.centerY = p.y
            onTap(agent.kind)
            return
          }

          if (dropTarget.containsGlobalPoint(point.x, point.y)) {
            const norm = dropTarget.globalToLandNorm(point.x, point.y)
            if (norm) {
              onMove(agent.id, norm.nx, norm.ny)
              const p = landToLocal(norm.nx, norm.ny)
              this.centerX = p.x
              this.centerY = p.y
              return
            }
          }
          onRemove(agent.id)
        },
      }),
    )
  }

  public syncPosition(agent: LandscapeAgent, landToLocal: (nx: number, ny: number) => { x: number; y: number }): void {
    const p = landToLocal(agent.nx, agent.ny)
    this.centerX = p.x
    this.centerY = p.y
  }
}
