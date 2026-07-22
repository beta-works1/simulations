import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Path, Rectangle, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont } from 'scenerystack/scenery-phet'
import {
  DECOMPOSER_LABEL,
  EcologicalPyramidModel,
  formatTierValue,
  PYRAMID_COLORS,
  PYRAMID_LABELS,
  tierDetail,
  tierDotCount,
} from '../model/EcologicalPyramidModel.js'
import { PyramidControlPanel } from './PyramidControlPanel.js'

type Options = EmptySelfOptions & ScreenViewOptions

type TierGeom = { x: number; y: number; w: number; h: number; cx: number; cy: number }

export class EcologicalPyramidScreenView extends ScreenView {
  private readonly model: EcologicalPyramidModel
  private readonly pyramidLayer: Node
  private readonly particleLayer: Node
  private readonly sun: Circle
  private readonly sunGlow: Circle
  private readonly sceneBounds: { left: number; top: number; width: number; height: number }
  private tierGeoms: TierGeom[] = []
  private heatPill: Node | null = null

  public constructor(model: EcologicalPyramidModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const margin = 12
    const panelW = 260
    const statusH = 40
    const b = this.layoutBounds

    const sceneLeft = b.left + margin
    const sceneTop = b.top + statusH + margin
    const sceneW = b.width - panelW - margin * 3
    const sceneH = b.height - statusH - margin * 2
    this.sceneBounds = { left: sceneLeft, top: sceneTop, width: sceneW, height: sceneH }

    const statusBg = new Rectangle(b.left + margin, b.top + 6, b.width - margin * 2, statusH, {
      cornerRadius: 10,
      fill: 'rgba(15, 23, 42, 0.92)',
    })
    this.addChild(statusBg)
    this.addChild(
      new Text(model.statusProperty, {
        font: new PhetFont(11),
        fill: '#ecfeff',
        maxWidth: b.width - margin * 4,
        centerX: b.centerX,
        centerY: statusBg.centerY,
      }),
    )

    const sceneBg = new Rectangle(sceneLeft, sceneTop, sceneW, sceneH, {
      fill: '#143028',
      cornerRadius: 12,
      stroke: 'rgba(255,255,255,0.12)',
      lineWidth: 1,
    })
    this.addChild(sceneBg)

    this.sunGlow = new Circle(40, {
      fill: 'rgba(255,220,80,0.25)',
      centerX: sceneLeft + sceneW / 2,
      centerY: sceneTop + 36,
    })
    this.sun = new Circle(18, {
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

    this.pyramidLayer = new Node()
    this.particleLayer = new Node()
    this.addChild(this.pyramidLayer)
    this.addChild(this.particleLayer)

    this.addChild(
      new PyramidControlPanel(model, {
        right: b.right - margin,
        top: sceneTop,
        maxWidth: panelW,
      }),
    )

    model.baseEnergyProperty.link(() => this.rebuildPyramid())
    model.modeProperty.link(() => this.rebuildPyramid())
    model.selectedTierProperty.link(() => this.rebuildPyramid())

    this.rebuildPyramid()
  }

  private rebuildPyramid(): void {
    this.pyramidLayer.removeAllChildren()
    this.heatPill = null

    const s = this.sceneBounds
    const base = this.model.baseEnergyProperty.value
    const mode = this.model.modeProperty.value
    const selected = this.model.selectedTierProperty.value

    const pyramidTop = s.top + 70
    const pyramidBottom = s.top + s.height - 56
    const availableH = pyramidBottom - pyramidTop
    const tierH = availableH / 4.4
    const cx = s.left + s.width / 2
    const maxW = s.width * 0.82
    const minW = s.width * 0.28

    this.tierGeoms = []

    // Draw from tertiary (top, narrow) to producers (bottom, wide) — visual top is tier 3
    for (let visual = 0; visual < 4; visual++) {
      const tier = 3 - visual
      const wTop = minW + (maxW - minW) * (visual / 4)
      const wBot = minW + (maxW - minW) * ((visual + 1) / 4)
      const y = pyramidTop + visual * tierH
      const h = tierH - 4
      const x = cx - wBot / 2

      const shape = new Shape()
      shape.moveTo(cx - wTop / 2, y)
      shape.lineTo(cx + wTop / 2, y)
      shape.lineTo(cx + wBot / 2, y + h)
      shape.lineTo(cx - wBot / 2, y + h)
      shape.close()

      const selectedTier = selected === tier
      const band = new Path(shape, {
        fill: PYRAMID_COLORS[tier],
        stroke: selectedTier ? '#ffffff' : 'rgba(0,0,0,0.35)',
        lineWidth: selectedTier ? 3 : 1,
        cursor: 'pointer',
        opacity: selectedTier ? 1 : 0.88,
      })
      band.addInputListener({
        up: () => this.model.selectTier(tier),
      })
      this.pyramidLayer.addChild(band)

      const geom: TierGeom = { x, y, w: wBot, h, cx, cy: y + h / 2 }
      this.tierGeoms[tier] = geom

      const label = new Text(PYRAMID_LABELS[tier], {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: 'white',
        centerX: cx,
        centerY: y + h * 0.38,
        maxWidth: wBot * 0.9,
      })
      label.pickable = false
      this.pyramidLayer.addChild(label)

      const d = tierDetail(base, tier, mode)
      const valueChip = new Text(formatTierValue(d.energy, mode), {
        font: new PhetFont(10),
        fill: '#0b1628',
        centerX: cx,
        centerY: y + h * 0.68,
      })
      const chipBg = new Rectangle(0, 0, valueChip.width + 12, 16, {
        fill: 'rgba(255,255,255,0.85)',
        cornerRadius: 8,
        center: valueChip.center,
      })
      chipBg.pickable = false
      valueChip.pickable = false
      this.pyramidLayer.addChild(chipBg)
      this.pyramidLayer.addChild(valueChip)

      // Relative dots
      const dots = tierDotCount(base, tier, mode)
      for (let i = 0; i < dots; i++) {
        const col = i % Math.max(1, Math.ceil(Math.sqrt(dots)))
        const row = Math.floor(i / Math.max(1, Math.ceil(Math.sqrt(dots))))
        const dx = (col - 2) * 7
        const dy = row * 6 - 4
        this.pyramidLayer.addChild(
          new Circle(2, {
            fill: 'rgba(255,255,255,0.45)',
            centerX: cx + dx + (tier % 2 === 0 ? -18 : 18),
            centerY: y + h * 0.55 + dy,
            pickable: false,
          }),
        )
      }
    }

    // Decomposer band
    const decY = pyramidBottom + 4
    const dec = new Rectangle(s.left + s.width * 0.08, decY, s.width * 0.84, 36, {
      fill: 'rgba(121, 85, 72, 0.85)',
      cornerRadius: 8,
      stroke: 'rgba(255,255,255,0.25)',
      lineWidth: 1,
    })
    this.pyramidLayer.addChild(dec)
    this.pyramidLayer.addChild(
      new Text(`${DECOMPOSER_LABEL} — recycle nutrients → producers`, {
        font: new PhetFont(10),
        fill: 'white',
        center: dec.center,
        maxWidth: dec.width - 12,
      }),
    )

    if (mode === 'energy') {
      this.heatPill = new Node()
      const pillBg = new Rectangle(0, 0, 150, 22, {
        fill: 'rgba(192, 57, 43, 0.9)',
        cornerRadius: 11,
      })
      const pillText = new Text('~90% lost as heat', {
        font: new PhetFont({ size: 10, weight: 'bold' }),
        fill: 'white',
        center: pillBg.center,
      })
      this.heatPill.addChild(pillBg)
      this.heatPill.addChild(pillText)
      this.heatPill.right = s.left + s.width - 12
      this.heatPill.top = s.top + 12
      this.pyramidLayer.addChild(this.heatPill)
    }
  }

  public override step(dt: number): void {
    const capped = Math.min(dt, 0.05)
    this.model.step(capped)

    const pulse = this.model.pulseProperty.value
    const r = 18 + Math.sin(pulse * 2) * 2
    this.sun.radius = r
    this.sunGlow.radius = 32 + Math.sin(pulse * 2) * 4
    this.sunGlow.opacity = 0.35 + Math.sin(pulse * 2) * 0.1

    // Energy-loss particles between tiers (energy mode only)
    this.particleLayer.removeAllChildren()
    if (this.model.modeProperty.value !== 'energy' || !this.model.runningProperty.value) return

    for (let tier = 1; tier < 4; tier++) {
      const above = this.tierGeoms[tier]
      const below = this.tierGeoms[tier - 1]
      if (!above || !below) continue
      const t = (pulse * 0.6 + tier * 0.25) % 1
      const x = above.cx + Math.sin(pulse * 3 + tier) * 12
      const y = below.cy + (above.cy - below.cy) * t
      this.particleLayer.addChild(
        new Circle(3, {
          fill: `rgba(231, 76, 60, ${0.35 + (1 - t) * 0.45})`,
          centerX: x,
          centerY: y,
        }),
      )
    }
  }
}
