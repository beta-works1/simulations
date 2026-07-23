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
  TROPHIC_BANDS,
  webStability,
  type FoodNode,
  type TrophicLevel,
} from '../model/FoodWebModel.js'
import { EcologyControlPanel } from './EcologyControlPanel.js'
import { EcologySounds } from './EcologySounds.js'
import { SpeciesNode } from './SpeciesNode.js'
import { createEcologyIcon } from '../../common/EcologyArt.js'

type Options = EmptySelfOptions & ScreenViewOptions

const BAND_ORDER: TrophicLevel[] = ['carnivore', 'herbivore', 'producer', 'decomposer']

export class FoodWebScreenView extends ScreenView {
  private readonly model: FoodWebModel
  private readonly sounds: EcologySounds
  private readonly webLayer: Node
  private readonly linkLayer: Node
  private readonly speciesLayer: Node
  private readonly ghostLayer: Node
  private readonly speciesNodes = new Map<string, SpeciesNode>()
  private readonly areaBounds: Rectangle
  private readonly dropHighlight: Rectangle
  private readonly sunNode: Node
  private pulseLine = 0

  public constructor(model: FoodWebModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    this.sounds = new EcologySounds()

    const margin = 14
    const panelW = 248
    const statusH = 42
    const bounds = this.layoutBounds

    const areaLeft = bounds.left + margin
    const areaTop = bounds.top + statusH + margin
    const areaWidth = bounds.width - panelW - margin * 3
    const areaHeight = bounds.height - statusH - margin * 2

    this.areaBounds = new Rectangle(areaLeft, areaTop, areaWidth, areaHeight, {
      fill: '#0d1f28',
      stroke: 'rgba(255,255,255,0.12)',
      lineWidth: 1,
      cornerRadius: 14,
    })
    this.addChild(this.areaBounds)

    // Quiet sky strip (no busy hills)
    this.addChild(
      new Rectangle(areaLeft, areaTop, areaWidth, areaHeight * TROPHIC_BANDS.carnivore.h + areaHeight * 0.04, {
        fill: '#152a38',
        cornerRadius: 14,
      }),
    )

    // Trophic bands — same geometry as model snap targets
    for (const level of BAND_ORDER) {
      const band = TROPHIC_BANDS[level]
      this.addChild(
        new Rectangle(areaLeft + 2, areaTop + areaHeight * band.y, areaWidth - 4, areaHeight * band.h, {
          fill: band.fill,
        }),
      )
      this.addChild(
        new Text(band.label, {
          font: new PhetFont({ size: 11, weight: 'bold' }),
          fill: 'rgba(255,255,255,0.4)',
          left: areaLeft + 12,
          centerY: areaTop + areaHeight * (band.y + band.h * 0.45),
        }),
      )
    }

    this.dropHighlight = new Rectangle(areaLeft, areaTop, areaWidth, areaHeight, {
      fill: 'rgba(125, 211, 252, 0.1)',
      stroke: 'rgba(125, 211, 252, 0.55)',
      lineWidth: 2,
      cornerRadius: 14,
      visible: false,
      pickable: false,
    })
    this.addChild(this.dropHighlight)

    // Illustrated sun (pfp-style)
    this.sunNode = new Node({ pickable: false })
    const sunIcon = createEcologyIcon('sun', 52)
    sunIcon.centerX = 0
    sunIcon.centerY = 0
    this.sunNode.addChild(sunIcon)
    this.sunNode.addChild(
      new Text('Sun', {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#fde68a',
        centerX: 0,
        top: 28,
      }),
    )
    this.sunNode.centerX = areaLeft + 48
    this.sunNode.centerY = areaTop + 44
    this.addChild(this.sunNode)

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
      new Text('Energy flows ↑ along arrows  ·  about 10% kept each step', {
        font: new PhetFont(11),
        fill: '#fde68a',
        right: areaLeft + areaWidth - 14,
        top: areaTop + 10,
      }),
    )

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
          sounds: this.sounds,
        },
      ),
    )

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
          (id) => {
            const before = this.model.webProperty.value.links.length
            this.model.handleNodePress(id)
            if (this.model.linkModeProperty.value) {
              const after = this.model.webProperty.value.links.length
              if (after > before) this.sounds.linkMade()
              else if (after < before) this.sounds.remove()
            }
          },
          (id, lx, ly) => {
            const nx = (lx - b.left) / b.width
            const ny = (ly - b.top) / b.height
            this.model.moveNode(id, nx, ny)
            const updated = this.model.webProperty.value.nodes.find((nn) => nn.id === id)
            if (updated) {
              view!.setPositionNorm(updated.x, updated.y, b.width, b.height, b.left, b.top)
            }
            this.drawLinks()
          },
          this.sounds,
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
      node.setEnergy(e !== undefined && e > 0 ? formatEnergy(e) : '')
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
    const p = (this.pulseLine % 2.2) / 2.2

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
          stroke: `rgba(250, 204, 21, ${0.28 + flow * 0.4})`,
          lineWidth: 2 + flow * 2,
          lineCap: 'round',
        }),
      )

      const angle = Math.atan2(y2 - y1, x2 - x1)
      const ax = x2 - Math.cos(angle) * 22
      const ay = y2 - Math.sin(angle) * 22
      this.linkLayer.addChild(
        new Path(
          new Shape()
            .moveTo(ax, ay)
            .lineTo(ax - Math.cos(angle - 0.45) * 9, ay - Math.sin(angle - 0.45) * 9)
            .lineTo(ax - Math.cos(angle + 0.45) * 9, ay - Math.sin(angle + 0.45) * 9)
            .close(),
          { fill: `rgba(250, 204, 21, ${0.45 + flow * 0.4})` },
        ),
      )

      // One soft energy bead (less clutter)
      this.linkLayer.addChild(
        new Circle(3 + flow * 1.5, {
          fill: 'rgba(253, 224, 71, 0.85)',
          centerX: x1 + (x2 - x1) * p,
          centerY: y1 + (y2 - y1) * p,
        }),
      )
    }

    const sx = this.sunNode.centerX
    const sy = this.sunNode.centerY
    for (const n of snap.nodes.filter((x: FoodNode) => x.level === 'producer')) {
      this.linkLayer.addChild(
        new Line(sx, sy + 10, b.left + n.x * b.width, b.top + n.y * b.height, {
          stroke: 'rgba(253, 224, 71, 0.22)',
          lineWidth: 1.5,
          lineDash: [5, 5],
        }),
      )
    }
  }

  public override step(dt: number): void {
    this.model.step(dt)
    const pulse = this.model.energyPulseProperty.value
    this.sunNode.opacity = 0.88 + Math.sin(pulse * 1.5) * 0.08
    if (!this.ghostLayer.hasChildren()) {
      this.dropHighlight.visible = false
    }
  }
}
