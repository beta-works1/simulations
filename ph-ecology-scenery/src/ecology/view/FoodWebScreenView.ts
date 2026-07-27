import { Vector2 } from 'scenerystack/dot'
import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Line, Node, Path, Rectangle, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont } from 'scenerystack/scenery-phet'
import { DepthCard } from '../../common/ui/DepthCard.js'
import { GuidanceBanner } from '../../common/ui/GuidanceBanner.js'
import { MiniQuiz } from '../../common/ui/MiniQuiz.js'
import { ParticleBurst } from '../../common/ui/ParticleBurst.js'
import { TeachingTriad } from '../../common/ui/TeachingTriad.js'
import {
  computeNodeEnergy,
  FoodWebModel,
  formatEnergy,
  grasslandWeb,
  starterWeb,
  TROPHIC_BANDS,
  webStability,
  type FoodNode,
  type FoodWebSnapshot,
  type TrophicLevel,
} from '../model/FoodWebModel.js'
import { EcologyControlPanel } from './EcologyControlPanel.js'
import { EcologySounds } from './EcologySounds.js'
import { SpeciesNode } from './SpeciesNode.js'
import { createEcologyIcon } from '../../common/EcologyArt.js'

type Options = EmptySelfOptions & ScreenViewOptions

const BAND_ORDER: TrophicLevel[] = ['carnivore', 'herbivore', 'producer', 'decomposer']

/** Node ids present when the grassland web scenario is loaded (drives the mini-quiz trigger). */
const GRASSLAND_IDS = new Set(grasslandWeb().nodes.map((n) => n.id))
const STARTER_IDS = new Set(starterWeb().nodes.map((n) => n.id))

function sameIds(nodes: FoodNode[], ids: Set<string>): boolean {
  return nodes.length === ids.size && nodes.every((n) => ids.has(n.id))
}

export class FoodWebScreenView extends ScreenView {
  private readonly model: FoodWebModel
  private readonly sounds: EcologySounds
  private readonly webLayer: Node
  private readonly linkLayer: Node
  private readonly speciesLayer: Node
  private readonly ghostLayer: Node
  private readonly particleBurst: ParticleBurst
  private readonly leftColW: number
  private readonly speciesNodes = new Map<string, SpeciesNode>()
  private readonly areaBounds: Rectangle
  private readonly dropHighlight: Rectangle
  private readonly sunNode: Node
  private readonly guidanceBanner: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly teachingCard: DepthCard
  private readonly miniQuiz: MiniQuiz
  private readonly energyCaption: Text
  private pulseLine = 0
  private previousLinkKeys = new Set<string>()
  private quizShown = false

  public constructor(model: FoodWebModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    this.sounds = new EcologySounds()

    this.addInputListener({ down: () => this.sounds.unlock() })

    const margin = 14
    const leftColW = 196
    this.leftColW = leftColW
    const panelW = 248
    const bounds = this.layoutBounds

    this.guidanceBanner = new GuidanceBanner(bounds.width - margin * 2, {
      title: 'Build the food web',
      body: '',
    })
    this.guidanceBanner.left = bounds.left + margin
    this.guidanceBanner.top = bounds.top + 6
    this.addChild(this.guidanceBanner)

    const stageTop = this.guidanceBanner.bottom + margin
    const leftColLeft = bounds.left + margin
    const areaLeft = leftColLeft + leftColW + margin
    const areaTop = stageTop
    const areaWidth = bounds.width - leftColW - panelW - margin * 4
    const areaHeight = bounds.height - stageTop - margin

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

    this.webLayer = new Node()
    this.linkLayer = new Node()
    this.speciesLayer = new Node()
    this.ghostLayer = new Node()
    this.addChild(this.webLayer)
    this.webLayer.addChild(this.linkLayer)
    this.webLayer.addChild(this.speciesLayer)

    this.particleBurst = new ParticleBurst(60)
    this.addChild(this.particleBurst)

    this.energyCaption = new Text('', {
      font: new PhetFont(11),
      fill: '#fde68a',
      right: areaLeft + areaWidth - 14,
      top: areaTop + 10,
    })
    this.addChild(this.energyCaption)

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

    // --- Left teaching column: NOW/WHY/NEXT card + mini-quiz -------------------
    this.teachingCard = new DepthCard(leftColW, 220, { title: 'Energy flow' })
    this.teachingCard.left = leftColLeft
    this.teachingCard.top = areaTop
    this.teachingTriad = new TeachingTriad(leftColW - 24)
    this.teachingTriad.left = 12
    this.teachingTriad.top = 38
    this.teachingCard.content.addChild(this.teachingTriad)
    this.addChild(this.teachingCard)

    this.miniQuiz = new MiniQuiz(leftColW)
    this.miniQuiz.left = leftColLeft
    this.miniQuiz.top = this.teachingCard.bottom + 12
    this.addChild(this.miniQuiz)

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

    // Seed with the starting links so the initial web doesn't spawn bursts on load.
    this.previousLinkKeys = new Set(model.webProperty.value.links.map((l) => `${l.from}>${l.to}`))

    model.webProperty.link((snap) => {
      this.syncSpeciesNodes()
      this.detectNewLinks(snap)
      this.checkMiniQuiz(snap)
    })
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
    model.energyTransferPercentProperty.link(() => {
      this.drawLinks()
      this.updateEnergyLabels()
      this.refreshTeachingTriad()
      this.refreshEnergyCaption()
    })
    model.showLabelsProperty.link(() => this.refreshVisibility())
    model.showPopulationsProperty.link(() => this.refreshVisibility())
    model.soundEnabledProperty.link((on) => this.sounds.setEnabled(on))
    model.statusProperty.link((status) => this.guidanceBanner.setGuidance('Tip', status))

    this.refreshTeachingTriad()
    this.refreshEnergyCaption()
    this.syncSpeciesNodes()
  }

  private refreshTeachingTriad(): void {
    const pct = this.model.energyTransferPercentProperty.value
    this.teachingTriad.setTriad(
      `About <b>${pct}%</b> of the energy an organism eats moves up to the next link.`,
      `The rest is used for breathing, moving and growing — it does not pass on, so energy shrinks at every step.`,
      `Add a link or species, then watch the yellow beads travel along the arrows.`,
    )
    this.teachingCard.setCardSize(this.leftColW, Math.max(200, this.teachingTriad.bottom + 50))
    this.miniQuiz.top = this.teachingCard.bottom + 12
  }

  private refreshEnergyCaption(): void {
    const pct = this.model.energyTransferPercentProperty.value
    this.energyCaption.string = `Energy flows ↑ along arrows  ·  about ${pct}% kept each step`
  }

  private refreshVisibility(): void {
    const showLabels = this.model.showLabelsProperty.value
    const showPopulations = this.model.showPopulationsProperty.value
    for (const node of this.speciesNodes.values()) {
      node.setLabelVisible(showLabels)
      node.setEnergyVisible(showPopulations)
    }
  }

  private detectNewLinks(snap: FoodWebSnapshot): void {
    const keys = new Set(snap.links.map((l) => `${l.from}>${l.to}`))
    for (const key of keys) {
      if (this.previousLinkKeys.has(key)) continue
      const [fromId, toId] = key.split('>')
      const a = snap.nodes.find((n) => n.id === fromId)
      const b = snap.nodes.find((n) => n.id === toId)
      if (a && b) {
        const bnd = this.areaBounds
        const mx = bnd.left + ((a.x + b.x) / 2) * bnd.width
        const my = bnd.top + ((a.y + b.y) / 2) * bnd.height
        this.particleBurst.burst(mx, my, { color: '#fde047', count: 12, speed: 60, life: 0.45, radius: 2.6 })
      }
    }
    this.previousLinkKeys = keys
  }

  private checkMiniQuiz(snap: FoodWebSnapshot): void {
    if (sameIds(snap.nodes, STARTER_IDS)) {
      this.quizShown = false
      this.miniQuiz.hideQuiz()
      return
    }
    if (this.quizShown) return
    const isGrassland = sameIds(snap.nodes, GRASSLAND_IDS)
    const stability = webStability(snap).score
    if (isGrassland || stability > 85) {
      this.quizShown = true
      this.miniQuiz.showQuiz(
        'Which trophic level starts the food web?',
        [
          { label: 'Producer', correct: true },
          { label: 'Carnivore', correct: false },
        ],
        (correct) => {
          if (correct) {
            this.model.starsProperty.value += 1
            this.sounds.loadExample()
          }
          else {
            this.sounds.remove()
          }
        },
      )
    }
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
    const showLabels = this.model.showLabelsProperty.value
    const showPopulations = this.model.showPopulationsProperty.value

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
        view.setLabelVisible(showLabels)
        view.setEnergyVisible(showPopulations)
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
    const energies = computeNodeEnergy(
      snap,
      this.model.baseEnergyProperty.value,
      this.model.energyTransferPercentProperty.value / 100,
    )
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
    const energies = computeNodeEnergy(
      snap,
      this.model.baseEnergyProperty.value,
      this.model.energyTransferPercentProperty.value / 100,
    )
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
    this.particleBurst.step(dt)
    if (!this.ghostLayer.hasChildren()) {
      this.dropHighlight.visible = false
    }
  }
}
