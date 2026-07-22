import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Line, Node, Rectangle, Text } from 'scenerystack/scenery'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import {
  computeNodeEnergy,
  FoodWebModel,
  webStability,
  type FoodNode,
} from '../model/FoodWebModel.js'
import { EcologyControlPanel } from './EcologyControlPanel.js'
import { SpeciesNode } from './SpeciesNode.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

export class FoodWebScreenView extends ScreenView {
  private readonly model: FoodWebModel
  private readonly webLayer: Node
  private readonly linkLayer: Node
  private readonly speciesLayer: Node
  private readonly speciesNodes = new Map<string, SpeciesNode>()
  private readonly areaBounds: Rectangle
  private pulseLine = 0

  public constructor(model: FoodWebModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const margin = 16
    const panelW = 240
    const statusH = 44
    const bounds = this.layoutBounds

    // Play area (left of control panel)
    const areaLeft = bounds.left + margin
    const areaTop = bounds.top + statusH + margin
    const areaWidth = bounds.width - panelW - margin * 3
    const areaHeight = bounds.height - statusH - margin * 2

    this.areaBounds = new Rectangle(areaLeft, areaTop, areaWidth, areaHeight, {
      fill: 'linear-gradient(180deg, #102a3c 0%, #1a3324 100%)',
      stroke: 'rgba(255,255,255,0.12)',
      lineWidth: 1,
      cornerRadius: 12,
    })
    // Scenery doesn't support CSS gradient on Rectangle fill directly — use solid layers
    this.areaBounds.fill = '#143028'
    this.addChild(this.areaBounds)

    const bandColors = ['rgba(39,174,96,0.1)', 'rgba(241,196,15,0.08)', 'rgba(231,76,60,0.08)']
    bandColors.forEach((fill, i) => {
      this.addChild(
        new Rectangle(areaLeft, areaTop + areaHeight * (0.68 - i * 0.22), areaWidth, areaHeight * 0.22, {
          fill,
          cornerRadius: i === 0 ? 12 : 0,
        }),
      )
    })

    // Sun
    const sun = new Circle(22, { fill: '#f4d03f', centerX: areaLeft + 36, centerY: areaTop + 36 })
    const sunLabel = new Text('Sun', {
      font: new PhetFont(11),
      fill: '#f4d03f',
      centerX: sun.centerX,
      top: sun.bottom + 4,
    })
    this.addChild(sun)
    this.addChild(sunLabel)

    // Status bar
    const statusBg = new Rectangle(bounds.left + margin, bounds.top + 8, bounds.width - margin * 2, statusH, {
      cornerRadius: 10,
      fill: 'rgba(15, 23, 42, 0.92)',
    })
    const statusText = new Text(model.statusProperty, {
      font: new PhetFont(13),
      fill: '#ecfeff',
      maxWidth: bounds.width - margin * 4,
      centerX: bounds.centerX,
      centerY: statusBg.centerY,
    })
    this.addChild(statusBg)
    this.addChild(statusText)

    this.webLayer = new Node()
    this.linkLayer = new Node()
    this.speciesLayer = new Node()
    this.addChild(this.webLayer)
    this.webLayer.addChild(this.linkLayer)
    this.webLayer.addChild(this.speciesLayer)

    // Control panel
    this.addChild(
      new EcologyControlPanel(model, {
        right: bounds.right - margin,
        top: areaTop,
        maxWidth: panelW,
      }),
    )

    // Reset
    this.addChild(
      new ResetAllButton({
        listener: () => model.reset(),
        right: bounds.right - margin - panelW - 52,
        bottom: bounds.bottom - margin,
      }),
    )

    const caption = new Text('energy flows along arrows →', {
      font: new PhetFont(12),
      fill: '#f4d03f',
      centerX: areaLeft + areaWidth / 2,
      top: areaTop + 8,
    })
    this.addChild(caption)

    model.webProperty.link(() => this.syncSpeciesNodes())
    model.selectedIdProperty.link(() => this.updateSelection())
    model.linkFromIdProperty.link(() => this.updateSelection())
    model.energyPulseProperty.link((p) => {
      this.pulseLine = p
      this.drawLinks()
    })
    model.baseEnergyProperty.link(() => this.drawLinks())

    this.syncSpeciesNodes()
  }

  private syncSpeciesNodes(): void {
    const snap = this.model.webProperty.value
    const ids = new Set(snap.nodes.map((n) => n.id))

    for (const [id, node] of this.speciesNodes) {
      if (!ids.has(id)) {
        this.speciesLayer.removeChild(node)
        this.speciesNodes.delete(id)
      }
    }

    const b = this.areaBounds
    const r = Math.min(28, b.width * 0.04)

    for (const n of snap.nodes) {
      let view = this.speciesNodes.get(n.id)
      if (!view) {
        view = new SpeciesNode(
          n,
          r,
          (id) => this.model.handleNodePress(id),
          (id, lx, ly) => {
            const nx = (lx - b.left) / b.width
            const ny = (ly - b.top) / b.height
            this.model.moveNode(id, nx, ny)
            view!.setPositionNorm(nx, ny, b.width, b.height, b.left, b.top)
            this.drawLinks()
          },
        )
        this.speciesNodes.set(n.id, view)
        this.speciesLayer.addChild(view)
      }
      view.setPositionNorm(n.x, n.y, b.width, b.height, b.left, b.top)
    }
    this.updateSelection()
    this.drawLinks()
  }

  private updateSelection(): void {
    const stability = webStability(this.model.webProperty.value)
    const sel = this.model.selectedIdProperty.value
    const linkFrom = this.model.linkFromIdProperty.value
    for (const [id, node] of this.speciesNodes) {
      node.setSelected(id === sel || id === linkFrom, stability.atRisk.includes(id))
    }
  }

  private drawLinks(): void {
    this.linkLayer.removeAllChildren()
    const snap = this.model.webProperty.value
    const b = this.areaBounds
    const energies = computeNodeEnergy(snap, this.model.baseEnergyProperty.value)
    const maxE = this.model.baseEnergyProperty.value
    const p = (this.pulseLine % 1.6) / 1.6

    for (const link of snap.links) {
      const a = snap.nodes.find((n) => n.id === link.from)
      const to = snap.nodes.find((n) => n.id === link.to)
      if (!a || !to) continue
      const x1 = b.left + a.x * b.width
      const y1 = b.top + a.y * b.height
      const x2 = b.left + to.x * b.width
      const y2 = b.top + to.y * b.height
      const flow = (energies.get(a.id) ?? 0) / maxE

      const line = new Line(x1, y1, x2, y2, {
        stroke: `rgba(244,208,63,${0.25 + flow * 0.55})`,
        lineWidth: 1.5 + flow * 3,
        lineCap: 'round',
      })
      this.linkLayer.addChild(line)

      const px = x1 + (x2 - x1) * p
      const py = y1 + (y2 - y1) * p
      this.linkLayer.addChild(
        new Circle(4 + flow * 3, {
          fill: '#f4d03f',
          centerX: px,
          centerY: py,
        }),
      )
    }

    // Sun rays to producers
    const sx = b.left + 36
    const sy = b.top + 36
    for (const n of snap.nodes.filter((x: FoodNode) => x.level === 'producer')) {
      this.linkLayer.addChild(
        new Line(sx, sy, b.left + n.x * b.width, b.top + n.y * b.height, {
          stroke: 'rgba(244,208,63,0.12)',
          lineWidth: 1,
        }),
      )
    }
  }

  public override step(dt: number): void {
    this.model.step(dt)
  }
}
