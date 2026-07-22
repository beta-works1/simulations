import { Vector2 } from 'scenerystack/dot'
import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Line, Node, Path, Rectangle, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont } from 'scenerystack/scenery-phet'
import {
  computeNodeEnergy,
  FoodWebModel,
  formatEnergy,
  webStability,
  type FoodNode,
} from '../model/FoodWebModel.js'
import { EcologyControlPanel } from './EcologyControlPanel.js'
import { SpeciesNode } from './SpeciesNode.js'

type Options = EmptySelfOptions & ScreenViewOptions

export class FoodWebScreenView extends ScreenView {
  private readonly model: FoodWebModel
  private readonly webLayer: Node
  private readonly linkLayer: Node
  private readonly speciesLayer: Node
  private readonly ghostLayer: Node
  private readonly speciesNodes = new Map<string, SpeciesNode>()
  private readonly areaBounds: Rectangle
  private readonly dropHighlight: Rectangle
  private readonly sun: Circle
  private readonly sunGlow: Circle
  private pulseLine = 0

  public constructor(model: FoodWebModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const margin = 14
    const panelW = 248
    const statusH = 42
    const bounds = this.layoutBounds

    const areaLeft = bounds.left + margin
    const areaTop = bounds.top + statusH + margin
    const areaWidth = bounds.width - panelW - margin * 3
    const areaHeight = bounds.height - statusH - margin * 2

    // Layered landscape background
    this.areaBounds = new Rectangle(areaLeft, areaTop, areaWidth, areaHeight, {
      fill: '#0f2a22',
      stroke: 'rgba(255,255,255,0.14)',
      lineWidth: 1,
      cornerRadius: 14,
    })
    this.addChild(this.areaBounds)

    // Sky band
    this.addChild(
      new Rectangle(areaLeft, areaTop, areaWidth, areaHeight * 0.28, {
        fill: '#1a3a4a',
        cornerRadius: 14,
      }),
    )

    // Distant hills
    const hills = new Path(
      new Shape()
        .moveTo(areaLeft, areaTop + areaHeight * 0.42)
        .quadraticCurveTo(areaLeft + areaWidth * 0.25, areaTop + areaHeight * 0.28, areaLeft + areaWidth * 0.5, areaTop + areaHeight * 0.4)
        .quadraticCurveTo(areaLeft + areaWidth * 0.75, areaTop + areaHeight * 0.52, areaLeft + areaWidth, areaTop + areaHeight * 0.38)
        .lineTo(areaLeft + areaWidth, areaTop + areaHeight * 0.55)
        .lineTo(areaLeft, areaTop + areaHeight * 0.55)
        .close(),
      { fill: 'rgba(46, 125, 80, 0.35)' },
    )
    this.addChild(hills)

    // Trophic bands with labels
    const bands: { fill: string; label: string; yFrac: number; hFrac: number }[] = [
      { fill: 'rgba(231,76,60,0.1)', label: 'Top consumers', yFrac: 0.12, hFrac: 0.2 },
      { fill: 'rgba(241,196,15,0.1)', label: 'Primary consumers', yFrac: 0.34, hFrac: 0.22 },
      { fill: 'rgba(39,174,96,0.12)', label: 'Producers', yFrac: 0.58, hFrac: 0.24 },
      { fill: 'rgba(142,68,173,0.12)', label: 'Decomposers', yFrac: 0.84, hFrac: 0.14 },
    ]
    for (const band of bands) {
      this.addChild(
        new Rectangle(areaLeft + 2, areaTop + areaHeight * band.yFrac, areaWidth - 4, areaHeight * band.hFrac, {
          fill: band.fill,
        }),
      )
      this.addChild(
        new Text(band.label, {
          font: new PhetFont(9),
          fill: 'rgba(255,255,255,0.35)',
          left: areaLeft + 10,
          top: areaTop + areaHeight * band.yFrac + 4,
        }),
      )
    }

    this.dropHighlight = new Rectangle(areaLeft, areaTop, areaWidth, areaHeight, {
      fill: 'rgba(125, 211, 252, 0.12)',
      stroke: 'rgba(125, 211, 252, 0.7)',
      lineWidth: 2,
      cornerRadius: 14,
      visible: false,
      pickable: false,
    })
    this.addChild(this.dropHighlight)

    this.sunGlow = new Circle(36, {
      fill: 'rgba(255,220,80,0.22)',
      centerX: areaLeft + 40,
      centerY: areaTop + 40,
    })
    this.sun = new Circle(20, {
      fill: '#f4d03f',
      centerX: this.sunGlow.centerX,
      centerY: this.sunGlow.centerY,
    })
    this.addChild(this.sunGlow)
    this.addChild(this.sun)
    this.addChild(
      new Text('Sun', {
        font: new PhetFont(10),
        fill: '#f4d03f',
        centerX: this.sun.centerX,
        top: this.sun.bottom + 2,
      }),
    )

    const statusBg = new Rectangle(bounds.left + margin, bounds.top + 6, bounds.width - margin * 2, statusH, {
      cornerRadius: 10,
      fill: 'rgba(15, 23, 42, 0.94)',
    })
    this.addChild(statusBg)
    this.addChild(
      new Text(model.statusProperty, {
        font: new PhetFont(12),
        fill: '#ecfeff',
        maxWidth: bounds.width - margin * 4,
        centerX: bounds.centerX,
        centerY: statusBg.centerY,
      }),
    )

    this.webLayer = new Node()
    this.linkLayer = new Node()
    this.speciesLayer = new Node()
    this.ghostLayer = new Node()
    this.addChild(this.webLayer)
    this.webLayer.addChild(this.linkLayer)
    this.webLayer.addChild(this.speciesLayer)

    this.addChild(
      new Text('Energy flows along arrows  ·  ~10% per trophic step', {
        font: new PhetFont(11),
        fill: '#f4d03f',
        centerX: areaLeft + areaWidth / 2,
        top: areaTop + 8,
      }),
    )

    // Legend
    const legendY = areaTop + areaHeight - 22
    const legendItems = [
      { c: '#27ae60', t: 'Producer' },
      { c: '#f1c40f', t: 'Herbivore' },
      { c: '#e74c3c', t: 'Carnivore' },
      { c: '#8e44ad', t: 'Decomposer' },
    ]
    legendItems.forEach((item, i) => {
      const x = areaLeft + 12 + i * 90
      this.addChild(new Circle(5, { fill: item.c, centerX: x, centerY: legendY }))
      this.addChild(
        new Text(item.t, {
          font: new PhetFont(9),
          fill: 'rgba(255,255,255,0.7)',
          left: x + 8,
          centerY: legendY,
        }),
      )
    })

    const dropTarget = {
      containsGlobalPoint: (gx: number, gy: number) => {
        const pt = this.globalToLocalPoint(new Vector2(gx, gy))
        return (
          pt.x >= areaLeft &&
          pt.x <= areaLeft + areaWidth &&
          pt.y >= areaTop &&
          pt.y <= areaTop + areaHeight
        )
      },
      globalToNormalized: (gx: number, gy: number) => {
        const pt = this.globalToLocalPoint(new Vector2(gx, gy))
        if (
          pt.x < areaLeft ||
          pt.x > areaLeft + areaWidth ||
          pt.y < areaTop ||
          pt.y > areaTop + areaHeight
        ) {
          return null
        }
        return {
          x: (pt.x - areaLeft) / areaWidth,
          y: (pt.y - areaTop) / areaHeight,
        }
      },
      setHighlight: (on: boolean) => {
        this.dropHighlight.visible = on
      },
    }

    this.addChild(
      new EcologyControlPanel(
        model,
        {
          right: bounds.right - margin,
          top: areaTop,
          maxWidth: panelW,
        },
        {
          dropTarget,
          ghostLayer: this.ghostLayer,
          panelMaxHeight: bounds.bottom - areaTop - margin,
        },
      ),
    )

    // Ghost layer on top of everything so drag chips float above UI
    this.addChild(this.ghostLayer)

    model.webProperty.link(() => this.syncSpeciesNodes())
    model.selectedIdProperty.link(() => this.updateSelection())
    model.linkFromIdProperty.link(() => this.updateSelection())
    model.energyPulseProperty.link((p) => {
      this.pulseLine = p
      this.drawLinks()
    })
    model.baseEnergyProperty.link(() => {
      this.drawLinks()
      this.updateEnergyLabels()
    })

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
    const r = Math.min(30, b.width * 0.042)

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
    this.updateEnergyLabels()
    this.drawLinks()
  }

  private updateEnergyLabels(): void {
    const snap = this.model.webProperty.value
    const energies = computeNodeEnergy(snap, this.model.baseEnergyProperty.value)
    for (const [id, node] of this.speciesNodes) {
      const e = energies.get(id)
      node.setEnergy(e !== undefined && e > 0 ? formatEnergy(e) : '—')
    }
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

      this.linkLayer.addChild(
        new Line(x1, y1, x2, y2, {
          stroke: `rgba(244,208,63,${0.22 + flow * 0.55})`,
          lineWidth: 1.5 + flow * 3.5,
          lineCap: 'round',
        }),
      )

      // Arrow head
      const angle = Math.atan2(y2 - y1, x2 - x1)
      const ax = x2 - Math.cos(angle) * 18
      const ay = y2 - Math.sin(angle) * 18
      const arrow = new Path(
        new Shape()
          .moveTo(ax, ay)
          .lineTo(ax - Math.cos(angle - 0.4) * 10, ay - Math.sin(angle - 0.4) * 10)
          .lineTo(ax - Math.cos(angle + 0.4) * 10, ay - Math.sin(angle + 0.4) * 10)
          .close(),
        { fill: `rgba(244,208,63,${0.35 + flow * 0.5})` },
      )
      this.linkLayer.addChild(arrow)

      const px = x1 + (x2 - x1) * p
      const py = y1 + (y2 - y1) * p
      this.linkLayer.addChild(
        new Circle(3.5 + flow * 3, {
          fill: '#f4d03f',
          centerX: px,
          centerY: py,
        }),
      )
    }

    const sx = b.left + 40
    const sy = b.top + 40
    for (const n of snap.nodes.filter((x: FoodNode) => x.level === 'producer')) {
      this.linkLayer.addChild(
        new Line(sx, sy, b.left + n.x * b.width, b.top + n.y * b.height, {
          stroke: 'rgba(244,208,63,0.18)',
          lineWidth: 1.5,
          lineDash: [4, 4],
        }),
      )
    }
  }

  public override step(dt: number): void {
    this.model.step(dt)
    const pulse = this.model.energyPulseProperty.value
    this.sun.radius = 18 + Math.sin(pulse * 2) * 2
    this.sunGlow.radius = 32 + Math.sin(pulse * 2) * 4
    this.sunGlow.opacity = 0.3 + Math.sin(pulse * 2) * 0.1
    // Clear drop highlight when not dragging (palette chip sets it during drag)
    if (!this.ghostLayer.hasChildren()) {
      this.dropHighlight.visible = false
    }
  }
}
