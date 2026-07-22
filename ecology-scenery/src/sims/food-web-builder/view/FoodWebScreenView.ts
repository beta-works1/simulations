import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import {
  Circle,
  DragListener,
  LinearGradient,
  Node,
  Path,
  RadialGradient,
  Rectangle,
  Text,
} from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { EcologyConstants } from '../../../shared/EcologyConstants.js'
import { EcologyColors } from '../../../shared/EcologyColors.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { SoftButton } from '../../../shared/ui/SoftButton.js'
import { FoodWebStrings } from '../FoodWebStrings.js'
import {
  FoodWebModel,
  levelBadge,
  levelColor,
  type FoodLink,
  type FoodNode,
} from '../model/FoodWebModel.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

type Workspace = { left: number; top: number; width: number; height: number }

type PulseMeta = {
  link: FoodLink
  ctrl: { x: number; y: number }
}

/**
 * Food-web builder view — draggable species, curved energy links, and add controls.
 */
export class FoodWebScreenView extends ScreenView {
  private readonly model: FoodWebModel
  private readonly workspace: Workspace
  private readonly linksLayer: Node
  private readonly nodesLayer: Node
  private readonly pulseLayer: Node
  private readonly pulseMeta = new Map<Circle, PulseMeta>()
  private readonly nodeViews = new Map<string, SpeciesNode>()
  private structureKey = ''

  public constructor(model: FoodWebModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const bounds = this.layoutBounds
    const controlW = 200
    const margin = EcologyConstants.SCREEN_VIEW_X_MARGIN
    this.workspace = {
      left: margin + 8,
      top: EcologyConstants.SCREEN_VIEW_Y_MARGIN + 36,
      width: bounds.width - controlW - margin * 3 - 16,
      height: bounds.height - EcologyConstants.SCREEN_VIEW_Y_MARGIN * 2 - 56,
    }

    this.addChild(this.createBackground())

    this.addChild(
      new Rectangle(
        this.workspace.left + 3,
        this.workspace.top + 5,
        this.workspace.width,
        this.workspace.height,
        {
          cornerRadius: 16,
          fill: 'rgba(15, 23, 42, 0.18)',
        },
      ),
    )
    this.addChild(
      new Rectangle(this.workspace.left, this.workspace.top, this.workspace.width, this.workspace.height, {
        cornerRadius: 16,
        fill: 'rgba(8, 40, 36, 0.35)',
        stroke: 'rgba(153, 246, 228, 0.18)',
        lineWidth: 1,
      }),
    )

    this.linksLayer = new Node()
    this.pulseLayer = new Node()
    this.nodesLayer = new Node()
    this.addChild(this.linksLayer)
    this.addChild(this.pulseLayer)
    this.addChild(this.nodesLayer)

    this.addChild(
      new Text(FoodWebStrings.tipStringProperty, {
        font: new PhetFont({ size: 13, weight: 'bold' }),
        fill: '#f4d03f',
        centerX: this.workspace.left + this.workspace.width / 2,
        top: EcologyConstants.SCREEN_VIEW_Y_MARGIN + 6,
        maxWidth: this.workspace.width - 20,
      }),
    )

    const card = new DepthCard(controlW, 320, { title: 'Add species' })
    card.right = bounds.maxX - margin
    card.top = this.workspace.top

    const btnW = controlW - 28
    const playBtn = new SoftButton('Pause energy', () => model.toggleRunning(), {
      width: btnW,
      fill: EcologyColors.accent,
    })
    model.runningProperty.link(running => {
      playBtn.setLabel(running ? 'Pause energy' : 'Play energy')
    })

    const buttons = [
      new SoftButton('+ Producer (Algae)', () => model.addSpecies('producer', 'Algae'), {
        width: btnW,
        fill: EcologyColors.producer,
      }),
      new SoftButton('+ Herbivore (Deer)', () => model.addSpecies('herbivore', 'Deer'), {
        width: btnW,
        fill: EcologyColors.herbivore,
        textFill: '#1e293b',
      }),
      new SoftButton('+ Carnivore (Hawk)', () => model.addSpecies('carnivore', 'Hawk'), {
        width: btnW,
        fill: EcologyColors.carnivore,
      }),
      new SoftButton('+ Decomposer (Bacteria)', () => model.addSpecies('decomposer', 'Bacteria'), {
        width: btnW,
        fill: EcologyColors.decomposer,
      }),
      new SoftButton('Reset', () => model.reset(), {
        width: btnW,
        fill: '#475569',
      }),
      playBtn,
    ]

    let y = 40
    for (const btn of buttons) {
      btn.left = 14
      btn.top = y
      card.content.addChild(btn)
      y += 42
    }

    card.content.addChild(
      new Text('Producers make energy; consumers eat; decomposers recycle.', {
        font: new PhetFont(10),
        fill: EcologyColors.muted,
        left: 14,
        top: y + 4,
        maxWidth: btnW,
      }),
    )
    this.addChild(card)

    this.addChild(
      new ResetAllButton({
        listener: () => model.reset(),
        right: bounds.maxX - margin,
        bottom: bounds.maxY - EcologyConstants.SCREEN_VIEW_Y_MARGIN,
      }),
    )

    const onGraphChange = () => this.syncGraph()
    model.nodesProperty.link(onGraphChange)
    model.linksProperty.link(onGraphChange)
    model.selectedIdProperty.link(() => this.syncSelection())
    model.energyPulseProperty.link(() => this.updatePulses())
    model.runningProperty.link(() => this.updatePulses())
  }

  private createBackground(): Node {
    const b = this.layoutBounds
    const layer = new Node()
    const gradient = new LinearGradient(0, 0, 0, b.height)
      .addColorStop(0, '#102a3c')
      .addColorStop(0.55, '#143d36')
      .addColorStop(1, '#1a3d2f')
    layer.addChild(new Rectangle(b.minX, b.minY, b.width, b.height, { fill: gradient }))

    const vignette = new RadialGradient(
      b.centerX,
      b.height * 0.4,
      Math.min(b.width, b.height) * 0.12,
      b.centerX,
      b.centerY,
      Math.max(b.width, b.height) * 0.72,
    )
      .addColorStop(0, 'rgba(255,255,255,0.05)')
      .addColorStop(1, 'rgba(0,0,0,0.28)')
    layer.addChild(new Rectangle(b.minX, b.minY, b.width, b.height, { fill: vignette }))
    return layer
  }

  private toScreen(node: FoodNode): { x: number; y: number } {
    return {
      x: this.workspace.left + node.x * this.workspace.width,
      y: this.workspace.top + node.y * this.workspace.height,
    }
  }

  private toNormalized(sx: number, sy: number): { x: number; y: number } {
    return {
      x: (sx - this.workspace.left) / this.workspace.width,
      y: (sy - this.workspace.top) / this.workspace.height,
    }
  }

  private structureSignature(): string {
    const nodeIds = this.model.nodesProperty.value.map(n => n.id).join('|')
    const links = this.model.linksProperty.value.map(l => `${l.from}>${l.to}`).join('|')
    return `${nodeIds}::${links}`
  }

  private syncGraph(): void {
    const key = this.structureSignature()
    if (key !== this.structureKey) {
      this.structureKey = key
      this.rebuildGraph()
      return
    }
    this.syncPositionsAndLinks()
  }

  private rebuildGraph(): void {
    this.linksLayer.removeAllChildren()
    this.pulseLayer.removeAllChildren()
    this.nodesLayer.removeAllChildren()
    this.nodeViews.clear()
    this.pulseMeta.clear()

    for (const node of this.model.nodesProperty.value) {
      const view = new SpeciesNode(node, this.model, {
        toScreen: n => this.toScreen(n),
        toNormalized: (sx, sy) => this.toNormalized(sx, sy),
        parent: this.nodesLayer,
        onMoved: () => this.syncPositionsAndLinks(),
      })
      this.nodeViews.set(node.id, view)
      this.nodesLayer.addChild(view)
    }

    this.redrawLinks()
    this.syncSelection()
    this.updatePulses()
  }

  private syncPositionsAndLinks(): void {
    for (const node of this.model.nodesProperty.value) {
      this.nodeViews.get(node.id)?.syncFromModel(node)
    }
    this.redrawLinks()
    this.updatePulses()
  }

  private redrawLinks(): void {
    this.linksLayer.removeAllChildren()
    this.pulseLayer.removeAllChildren()
    this.pulseMeta.clear()

    const byId = new Map(this.model.nodesProperty.value.map(n => [n.id, n]))
    for (const link of this.model.linksProperty.value) {
      const a = byId.get(link.from)
      const b = byId.get(link.to)
      if (!a || !b) continue

      const p1 = this.toScreen(a)
      const p2 = this.toScreen(b)
      const mx = (p1.x + p2.x) / 2
      const my = (p1.y + p2.y) / 2
      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const len = Math.hypot(dx, dy) || 1
      const bend = Math.min(36, len * 0.18)
      const cx = mx - (dy / len) * bend
      const cy = my + (dx / len) * bend

      const shape = new Shape().moveTo(p1.x, p1.y).quadraticCurveTo(cx, cy, p2.x, p2.y)
      this.linksLayer.addChild(
        new Path(shape, {
          stroke: 'rgba(236, 240, 241, 0.38)',
          lineWidth: 2.5,
          lineCap: 'round',
        }),
      )

      const pulse = new Circle(5.5, {
        fill: '#f4d03f',
        stroke: 'rgba(255,255,255,0.55)',
        lineWidth: 1,
      })
      this.pulseMeta.set(pulse, { link, ctrl: { x: cx, y: cy } })
      this.pulseLayer.addChild(pulse)
    }
  }

  private syncSelection(): void {
    const id = this.model.selectedIdProperty.value
    this.nodeViews.forEach((view, key) => view.setSelected(key === id))
  }

  private updatePulses(): void {
    const byId = new Map(this.model.nodesProperty.value.map(n => [n.id, n]))
    const phase = (this.model.energyPulseProperty.value % 1.6) / 1.6
    const running = this.model.runningProperty.value

    this.pulseMeta.forEach((meta, pulse) => {
      const a = byId.get(meta.link.from)
      const b = byId.get(meta.link.to)
      if (!a || !b) {
        pulse.visible = false
        return
      }
      pulse.visible = running
      const p1 = this.toScreen(a)
      const p2 = this.toScreen(b)
      const t = phase
      const u = 1 - t
      const c = meta.ctrl
      pulse.centerX = u * u * p1.x + 2 * u * t * c.x + t * t * p2.x
      pulse.centerY = u * u * p1.y + 2 * u * t * c.y + t * t * p2.y
    })
  }

  public override step(dt: number): void {
    this.model.step(dt)
  }
}

type SpeciesHelpers = {
  toScreen: (n: FoodNode) => { x: number; y: number }
  toNormalized: (sx: number, sy: number) => { x: number; y: number }
  parent: Node
  onMoved: () => void
}

class SpeciesNode extends Node {
  private readonly highlight: Circle
  private readonly helpers: SpeciesHelpers
  private data: FoodNode

  public constructor(data: FoodNode, model: FoodWebModel, helpers: SpeciesHelpers) {
    super({ cursor: 'pointer' })
    this.data = data
    this.helpers = helpers
    const r = 28

    this.addChild(
      new Circle(r, {
        fill: 'rgba(0,0,0,0.35)',
        centerX: 3,
        centerY: 4,
      }),
    )
    this.highlight = new Circle(r + 6, {
      stroke: '#ffffff',
      lineWidth: 3,
      opacity: 0,
    })
    this.addChild(this.highlight)
    this.addChild(
      new Circle(r, {
        fill: levelColor(data.level),
        stroke: 'rgba(255,255,255,0.45)',
        lineWidth: 1.5,
      }),
    )
    this.addChild(
      new Text(data.name, {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#ffffff',
        centerX: 0,
        centerY: 0,
        maxWidth: r * 1.7,
      }),
    )
    const badge = new Text(levelBadge(data.level), {
      font: new PhetFont({ size: 9, weight: 'bold' }),
      fill: '#0f172a',
      centerX: r * 0.65,
      centerY: -r * 0.7,
    })
    this.addChild(
      new Circle(8, {
        fill: 'rgba(255,255,255,0.9)',
        centerX: badge.centerX,
        centerY: badge.centerY,
      }),
    )
    this.addChild(badge)

    this.syncFromModel(data)

    this.addInputListener(
      new DragListener({
        start: () => model.select(this.data.id),
        drag: event => {
          const pt = helpers.parent.globalToLocalPoint(event.pointer.point)
          const n = helpers.toNormalized(pt.x, pt.y)
          model.moveNode(this.data.id, n.x, n.y)
          const updated = model.nodesProperty.value.find(x => x.id === this.data.id)
          if (updated) {
            this.syncFromModel(updated)
            helpers.onMoved()
          }
        },
      }),
    )
  }

  public syncFromModel(data: FoodNode): void {
    this.data = data
    const p = this.helpers.toScreen(data)
    this.centerX = p.x
    this.centerY = p.y
  }

  public setSelected(selected: boolean): void {
    this.highlight.opacity = selected ? 1 : 0
  }
}
