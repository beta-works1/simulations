import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, DragListener, Node, Path, Rectangle, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont } from 'scenerystack/scenery-phet'
import { PyramidConstants } from '../../common/PyramidColors.js'
import {
  DECOMPOSER_LABEL,
  EcologicalPyramidModel,
  formatTierValue,
  PYRAMID_COLORS,
  PYRAMID_SHORT,
  tierDetail,
} from '../model/EcologicalPyramidModel.js'
import { PyramidControlPanel } from './PyramidControlPanel.js'
import { PyramidSounds } from './PyramidSounds.js'
import { createEcologyIcon } from '../../common/EcologyArt.js'

type Options = EmptySelfOptions & ScreenViewOptions

type TierGeom = { x: number; y: number; w: number; h: number; cx: number; cy: number; wTop: number }

export class EcologicalPyramidScreenView extends ScreenView {
  private readonly model: EcologicalPyramidModel
  private readonly sounds: PyramidSounds
  private readonly sceneryLayer: Node
  private readonly pyramidLayer: Node
  private readonly particleLayer: Node
  private readonly tipCard: Node
  private readonly tipText: Text
  private readonly whyCard: Node
  private readonly whyText: Text
  private readonly sun: Circle
  private readonly sunGlow: Circle
  private readonly sunLabel: Text
  private readonly sunRays: Node
  private readonly birdLayer: Node
  private readonly sceneBounds: { left: number; top: number; width: number; height: number }
  private tierGeoms: TierGeom[] = []
  private baseHandle: Node | null = null
  private lastHeatSound = 0
  private lastCascadeTier = -1
  private heatParticles: { x: number; y: number; vx: number; vy: number; life: number; r: number }[] = []
  private birds: { x: number; y: number; speed: number; phase: number }[] = []

  public constructor(model: EcologicalPyramidModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    this.sounds = new PyramidSounds()
    this.sounds.warm()

    const margin = 10
    const panelW = 268
    const statusH = 42
    const b = this.layoutBounds

    const sceneLeft = b.left + margin
    const sceneTop = b.top + statusH + margin
    const sceneW = b.width - panelW - margin * 3
    const sceneH = b.height - statusH - margin * 2
    this.sceneBounds = { left: sceneLeft, top: sceneTop, width: sceneW, height: sceneH }

    const statusBg = new Rectangle(b.left + margin, b.top + 4, b.width - margin * 2, statusH, {
      cornerRadius: 10,
      fill: 'rgba(15, 23, 42, 0.94)',
      stroke: 'rgba(168, 212, 160, 0.35)',
      lineWidth: 1,
    })
    this.addChild(statusBg)
    this.addChild(
      new Text(model.statusProperty, {
        font: new PhetFont(14),
        fill: '#ecfeff',
        maxWidth: b.width - margin * 4,
        centerX: b.centerX,
        centerY: statusBg.centerY,
      }),
    )

    // Scene backdrop
    const sceneClip = new Rectangle(sceneLeft, sceneTop, sceneW, sceneH, {
      fill: '#0e2a22',
      cornerRadius: 14,
      stroke: 'rgba(255,255,255,0.14)',
      lineWidth: 1,
    })
    this.addChild(sceneClip)

    this.sceneryLayer = new Node({ pickable: false })
    this.buildScenery(sceneLeft, sceneTop, sceneW, sceneH)
    this.addChild(this.sceneryLayer)

    // Sun: scene center, below the top badge row (never under heat/mode pills)
    const sunX = sceneLeft + sceneW * 0.5
    const sunY = sceneTop + 58
    this.sunGlow = new Circle(36, {
      fill: 'rgba(255,220,80,0.28)',
      centerX: sunX,
      centerY: sunY,
      cursor: 'pointer',
    })
    this.sun = new Circle(16, {
      fill: '#f4d03f',
      centerX: sunX,
      centerY: sunY,
      cursor: 'pointer',
    })
    const sunHit = () => {
      model.pulseSunBurst()
      this.sounds.button()
      this.spawnHeatBurst(this.sun.centerX, this.sun.centerY + 30, 8)
    }
    this.sun.addInputListener({ up: sunHit })
    this.sunGlow.addInputListener({ up: sunHit })
    this.addChild(this.sunGlow)
    this.addChild(this.sun)
    this.sunRays = new Node({ pickable: false })
    this.addChild(this.sunRays)
    this.birdLayer = new Node({ pickable: false })
    this.addChild(this.birdLayer)
    for (let i = 0; i < 3; i++) {
      this.birds.push({
        x: sceneLeft + 40 + i * (sceneW / 4),
        y: sceneTop + 22 + (i % 2) * 8,
        speed: 16 + i * 5,
        phase: i * 1.3,
      })
    }
    this.sunLabel = new Text('Sun — tap', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#f4d03f',
      centerX: sunX,
      top: this.sun.bottom + 1,
      pickable: false,
    })
    this.addChild(this.sunLabel)

    this.pyramidLayer = new Node()
    this.particleLayer = new Node({ pickable: false })
    this.addChild(this.pyramidLayer)
    this.addChild(this.particleLayer)

    this.tipText = new Text('', {
      font: new PhetFont({ size: 14, weight: 'bold' }),
      fill: '#fde68a',
      maxWidth: sceneW * 0.42,
    })
    const tipBg = new Rectangle(0, 0, 20, 20, {
      fill: 'rgba(8, 18, 32, 0.92)',
      cornerRadius: 8,
      stroke: 'rgba(250, 204, 21, 0.5)',
      lineWidth: 1.5,
    })
    this.tipCard = new Node({ children: [tipBg, this.tipText], pickable: false })
    this.addChild(this.tipCard)

    this.whyText = new Text('', {
      font: new PhetFont(13),
      fill: '#a7f3d0',
      maxWidth: sceneW * 0.42,
    })
    const whyBg = new Rectangle(0, 0, 20, 20, {
      fill: 'rgba(6, 40, 28, 0.92)',
      cornerRadius: 8,
      stroke: 'rgba(134, 239, 172, 0.4)',
      lineWidth: 1,
    })
    this.whyCard = new Node({ children: [whyBg, this.whyText], pickable: false })
    this.addChild(this.whyCard)

    const refreshTip = () => {
      const show = model.showTipsProperty.value
      const captionMax = sceneW * 0.44
      this.whyText.string = model.whyProperty.value
      whyBg.rectWidth = Math.min(captionMax, this.whyText.width + 18)
      whyBg.rectHeight = this.whyText.height + 14
      this.whyText.center = whyBg.center
      this.whyCard.left = sceneLeft + 10
      this.whyCard.top = sceneTop + 8
      this.whyCard.visible = show

      this.tipText.string = model.tipProperty.value
      tipBg.rectWidth = Math.min(captionMax, this.tipText.width + 18)
      tipBg.rectHeight = this.tipText.height + 14
      this.tipText.center = tipBg.center
      this.tipCard.left = sceneLeft + 10
      this.tipCard.top = this.whyCard.bottom + 6
      this.tipCard.visible = show
    }
    model.tipProperty.link(refreshTip)
    model.whyProperty.link(refreshTip)
    model.showTipsProperty.link(refreshTip)

    this.addChild(
      new PyramidControlPanel(model, this.sounds, {
        right: b.right - margin,
        top: sceneTop,
        maxWidth: panelW,
        panelMaxHeight: sceneH,
      }),
    )

    model.baseEnergyProperty.link(() => this.rebuildPyramid())
    model.transferProperty.link(() => this.rebuildPyramid())
    model.modeProperty.link(() => this.rebuildPyramid())
    model.selectedTierProperty.link(() => this.rebuildPyramid())
    model.decomposerFocusProperty.link(() => this.rebuildPyramid())
    model.hoverTierProperty.link(() => this.rebuildPyramid())
    model.compareTierProperty.link(() => this.rebuildPyramid())
    model.cascadeProgressProperty.link((v, oldV) => {
      if ((v === 0) !== (oldV === 0) || Math.floor(v) !== Math.floor(oldV ?? 0)) {
        this.rebuildPyramid()
      }
    })
    model.soundEnabledProperty.link(on => this.sounds.setEnabled(on))

    let lastBase = model.baseEnergyProperty.value
    model.baseEnergyProperty.lazyLink(v => {
      if (Math.abs(v - lastBase) > 80) this.sounds.sliderTick()
      lastBase = v
    })

    this.rebuildPyramid()
  }

  private buildScenery(left: number, top: number, w: number, h: number): void {
    // Sky gradient bands
    const skyH = h * 0.42
    this.sceneryLayer.addChild(
      new Rectangle(left, top, w, skyH, {
        fill: '#1a4a5c',
        cornerRadius: 14,
      }),
    )
    this.sceneryLayer.addChild(
      new Rectangle(left, top + skyH * 0.55, w, skyH * 0.55, {
        fill: 'rgba(56, 120, 110, 0.55)',
      }),
    )
    // Soft clouds
    for (let i = 0; i < 4; i++) {
      const cx = left + w * (0.12 + i * 0.22)
      const cy = top + 18 + (i % 2) * 14
      this.sceneryLayer.addChild(
        new Circle(14 + (i % 3) * 4, {
          fill: 'rgba(255,255,255,0.12)',
          centerX: cx,
          centerY: cy,
        }),
      )
      this.sceneryLayer.addChild(
        new Circle(10, {
          fill: 'rgba(255,255,255,0.1)',
          centerX: cx + 12,
          centerY: cy + 2,
        }),
      )
    }
    // Distant tree silhouettes on hills
    for (let i = 0; i < 7; i++) {
      const tx = left + w * (0.08 + i * 0.13)
      const ty = top + h * (0.62 + (i % 3) * 0.03)
      const trunk = new Rectangle(-1.5, 0, 3, 10, { fill: '#0f2418', centerX: tx, top: ty })
      const canopy = new Circle(7 + (i % 3), { fill: '#143022', centerX: tx, centerY: ty - 2 })
      this.sceneryLayer.addChild(trunk)
      this.sceneryLayer.addChild(canopy)
    }
    // Hills
    const hill = new Shape()
    hill.moveTo(left, top + h * 0.72)
    hill.quadraticCurveTo(left + w * 0.25, top + h * 0.55, left + w * 0.5, top + h * 0.68)
    hill.quadraticCurveTo(left + w * 0.75, top + h * 0.82, left + w, top + h * 0.62)
    hill.lineTo(left + w, top + h)
    hill.lineTo(left, top + h)
    hill.close()
    this.sceneryLayer.addChild(new Path(hill, { fill: '#1e4d38' }))

    const hill2 = new Shape()
    hill2.moveTo(left, top + h * 0.82)
    hill2.quadraticCurveTo(left + w * 0.35, top + h * 0.7, left + w * 0.7, top + h * 0.8)
    hill2.lineTo(left + w, top + h * 0.78)
    hill2.lineTo(left + w, top + h)
    hill2.lineTo(left, top + h)
    hill2.close()
    this.sceneryLayer.addChild(new Path(hill2, { fill: '#163828' }))

    // Ground strip
    this.sceneryLayer.addChild(
      new Rectangle(left, top + h - 28, w, 28, {
        fill: '#2c1810',
      }),
    )
  }

  private rebuildPyramid(): void {
    this.pyramidLayer.removeAllChildren()
    this.baseHandle = null

    const s = this.sceneBounds
    const base = this.model.baseEnergyProperty.value
    const transfer = this.model.transferProperty.value
    const mode = this.model.modeProperty.value
    const selected = this.model.selectedTierProperty.value
    const hover = this.model.hoverTierProperty.value
    const compare = this.model.compareTierProperty.value
    const decFocus = this.model.decomposerFocusProperty.value
    const cascading = this.model.cascadeProgressProperty.value > 0

    const pyramidTop = s.top + 118
    const pyramidBottom = s.top + s.height - 58
    const availableH = pyramidBottom - pyramidTop
    const tierH = availableH / 4.35
    const cx = s.left + s.width / 2
    const maxW = s.width * 0.7
    const minW = s.width * 0.24
    const seamGap = 12

    this.tierGeoms = []

    // Soft ground shadow under pyramid
    this.pyramidLayer.addChild(
      new EllipseShadow(cx, pyramidBottom + 8, maxW * 0.55, 14),
    )

    for (let visual = 0; visual < 4; visual++) {
      const tier = 3 - visual
      const wTop = minW + (maxW - minW) * (visual / 4)
      const wBot = minW + (maxW - minW) * ((visual + 1) / 4)
      const y = pyramidTop + visual * tierH
      const h = tierH - seamGap

      const shape = new Shape()
      shape.moveTo(cx - wTop / 2, y)
      shape.lineTo(cx + wTop / 2, y)
      shape.lineTo(cx + wBot / 2, y + h)
      shape.lineTo(cx - wBot / 2, y + h)
      shape.close()

      const selectedTier = selected === tier
      const compared = compare === tier
      const hovered = hover === tier
      const band = new Path(shape, {
        fill: PYRAMID_COLORS[tier],
        stroke: selectedTier
          ? '#ffffff'
          : compared
            ? '#fde68a'
            : hovered
              ? '#7dd3fc'
              : 'rgba(0,0,0,0.4)',
        lineWidth: selectedTier || compared ? 3.5 : hovered ? 2.5 : 1,
        cursor: 'pointer',
        opacity: cascading && !selectedTier ? 0.55 : selectedTier || !decFocus ? (selectedTier ? 1 : hovered ? 0.95 : 0.86) : 0.7,
      })
      band.addInputListener({
        enter: () => {
          this.model.hoverTierProperty.value = tier
        },
        exit: () => {
          if (this.model.hoverTierProperty.value === tier) this.model.hoverTierProperty.value = -1
        },
        up: () => {
          this.model.selectTier(tier)
          this.sounds.tierSelect()
          this.spawnHeatBurst(cx, y + h / 2, 5)
        },
      })
      this.pyramidLayer.addChild(band)

      // Inner highlight for depth
      const gloss = new Shape()
      gloss.moveTo(cx - wTop / 2 + 4, y + 3)
      gloss.lineTo(cx + wTop / 2 - 4, y + 3)
      gloss.lineTo(cx + wBot / 2 - 10, y + h * 0.35)
      gloss.lineTo(cx - wBot / 2 + 10, y + h * 0.35)
      gloss.close()
      this.pyramidLayer.addChild(
        new Path(gloss, {
          fill: 'rgba(255,255,255,0.14)',
          pickable: false,
        }),
      )

      const geom: TierGeom = { x: cx - wBot / 2, y, w: wBot, h, cx, cy: y + h / 2, wTop }
      this.tierGeoms[tier] = geom

      const label = new Text(PYRAMID_SHORT[tier], {
        font: new PhetFont({ size: 15, weight: 'bold' }),
        fill: 'white',
        centerX: cx + 10,
        centerY: y + h * 0.3,
        maxWidth: wBot * 0.55,
        pickable: false,
      })
      this.pyramidLayer.addChild(label)

      const d = tierDetail(base, tier, mode, transfer)
      const valueChip = new Text(formatTierValue(d.energy, mode), {
        font: new PhetFont({ size: 13, weight: 'bold' }),
        fill: '#0b1628',
        pickable: false,
      })
      const chipBg = new Rectangle(0, 0, valueChip.width + 16, 22, {
        fill: 'rgba(255,255,255,0.92)',
        cornerRadius: 11,
        pickable: false,
      })
      chipBg.centerX = cx + 10
      chipBg.centerY = y + h * 0.58
      valueChip.center = chipBg.center
      this.pyramidLayer.addChild(chipBg)
      this.pyramidLayer.addChild(valueChip)

      // Organism picture on each band (self-explanatory)
      this.pyramidLayer.addChild(makeTierSilhouette(tier, cx - wBot * 0.28, y + h * 0.5))

      // Transfer badge sits in the seam gutter, outside the band edge
      if (visual < 3) {
        const keepPct = (transfer * 100).toFixed(0)
        const badge = new Text(`only ${keepPct}% ↑`, {
          font: new PhetFont({ size: 11, weight: 'bold' }),
          fill: '#fecaca',
          pickable: false,
        })
        const badgeBg = new Rectangle(0, 0, badge.width + 12, 17, {
          fill: 'rgba(127, 29, 29, 0.92)',
          cornerRadius: 8,
          pickable: false,
        })
        const edge = Math.max(wTop, wBot) / 2
        badgeBg.left = Math.min(cx + edge + 8, s.left + s.width - badgeBg.width - 10)
        badgeBg.centerY = y + h + seamGap / 2
        badge.center = badgeBg.center
        this.pyramidLayer.addChild(badgeBg)
        this.pyramidLayer.addChild(badge)
      }
    }

    // Self-explanatory plant-energy bar on producers (drag left/right)
    const prod = this.tierGeoms[0]
    if (prod) {
      const barW = Math.min(132, Math.max(96, prod.w * 0.38))
      const barH = 12
      const handle = new Node({ cursor: 'ew-resize' })
      const track = new Rectangle(0, 0, barW, barH, {
        fill: 'rgba(15, 23, 42, 0.72)',
        stroke: 'rgba(255,255,255,0.85)',
        lineWidth: 1.5,
        cornerRadius: 6,
      })
      const fillFrac = Math.max(
        0.12,
        Math.min(
          1,
          (base - PyramidConstants.BASE_MIN) / (PyramidConstants.BASE_MAX - PyramidConstants.BASE_MIN),
        ),
      )
      const fill = new Rectangle(1, 1, Math.max(8, (barW - 2) * fillFrac), barH - 2, {
        fill: '#38bdf8',
        cornerRadius: 5,
        pickable: false,
      })
      const thumb = new Circle(9, {
        fill: '#7dd3fc',
        stroke: '#ffffff',
        lineWidth: 2,
        centerX: fill.right,
        centerY: barH / 2,
      })
      const leftMark = new Text('◀ less', {
        font: new PhetFont({ size: 10, weight: 'bold' }),
        fill: '#e0f2fe',
        pickable: false,
      })
      const rightMark = new Text('more ▶', {
        font: new PhetFont({ size: 10, weight: 'bold' }),
        fill: '#e0f2fe',
        pickable: false,
      })
      const handleLabel = new Text('Plant energy — drag the bar', {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#e0f2fe',
        pickable: false,
      })
      leftMark.right = -4
      leftMark.centerY = barH / 2
      rightMark.left = barW + 4
      rightMark.centerY = barH / 2
      handleLabel.centerX = barW / 2
      handleLabel.top = barH + 3
      handle.addChild(track)
      handle.addChild(fill)
      handle.addChild(thumb)
      handle.addChild(leftMark)
      handle.addChild(rightMark)
      handle.addChild(handleLabel)
      handle.centerX = prod.cx + prod.w * 0.18
      handle.centerY = prod.cy + prod.h * 0.22

      let dragStartX = 0
      let startBase = base
      handle.addInputListener(
        new DragListener({
          allowTouchSnag: true,
          start: event => {
            dragStartX = event.pointer.point.x
            startBase = this.model.baseEnergyProperty.value
            this.sounds.grabHandle()
          },
          drag: event => {
            const dx = event.pointer.point.x - dragStartX
            const span = PyramidConstants.BASE_MAX - PyramidConstants.BASE_MIN
            const delta = (dx / Math.max(80, barW)) * span
            this.model.setBaseEnergy(startBase + delta)
          },
          end: () => this.sounds.releaseHandle(),
        }),
      )
      this.pyramidLayer.addChild(handle)
      this.baseHandle = handle
    }

    // Decomposer band — exclusive bottom strip (captions live at the top)
    const decY = s.top + s.height - 48
    const dec = new Rectangle(s.left + s.width * 0.08, decY, s.width * 0.84, 38, {
      fill: decFocus ? 'rgba(161, 98, 64, 0.95)' : 'rgba(121, 85, 72, 0.88)',
      cornerRadius: 10,
      stroke: decFocus ? '#fde68a' : 'rgba(255,255,255,0.28)',
      lineWidth: decFocus ? 2.5 : 1,
      cursor: 'pointer',
    })
    dec.addInputListener({
      up: () => {
        this.model.selectDecomposers()
        this.sounds.decomposer()
        this.spawnHeatBurst(cx, decY + 18, 6)
      },
    })
    this.pyramidLayer.addChild(dec)
    this.pyramidLayer.addChild(
      new Text(`${DECOMPOSER_LABEL}  ·  recycle → nutrients → plants`, {
        font: new PhetFont({ size: 13, weight: 'bold' }),
        fill: 'white',
        center: dec.center,
        maxWidth: dec.width - 14,
        pickable: false,
      }),
    )

    // Mode + heat badges stacked on the far right (keeps sun clear in the center)
    const modeBadge = new Text(
      mode === 'energy' ? 'Energy pyramid' : mode === 'biomass' ? 'Biomass pyramid' : 'Numbers pyramid',
      {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: '#ecfeff',
        pickable: false,
      },
    )
    const modeBg = new Rectangle(0, 0, modeBadge.width + 16, 24, {
      fill: 'rgba(15, 23, 42, 0.8)',
      cornerRadius: 12,
      pickable: false,
    })
    modeBg.right = s.left + s.width - 12
    modeBg.top = s.top + 8
    modeBadge.center = modeBg.center
    this.pyramidLayer.addChild(modeBg)
    this.pyramidLayer.addChild(modeBadge)

    if (mode === 'energy') {
      const pillText = new Text(`~${((1 - transfer) * 100).toFixed(0)}% lost as heat`, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: 'white',
        pickable: false,
      })
      const pillBg = new Rectangle(0, 0, pillText.width + 16, 24, {
        fill: 'rgba(192, 57, 43, 0.92)',
        cornerRadius: 12,
        pickable: false,
      })
      pillBg.right = s.left + s.width - 12
      pillBg.top = modeBg.bottom + 6
      pillText.center = pillBg.center
      this.pyramidLayer.addChild(pillBg)
      this.pyramidLayer.addChild(pillText)
    }

    // Level index chips on the left
    for (let tier = 0; tier < 4; tier++) {
      const g = this.tierGeoms[tier]
      if (!g) continue
      const n = new Text(String(tier + 1), {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: '#0b1628',
        pickable: false,
      })
      const chip = new Circle(11, {
        fill: selected === tier ? '#f4d03f' : 'rgba(255,255,255,0.8)',
        centerX: g.x - 16,
        centerY: g.cy,
        pickable: false,
      })
      n.center = chip.center
      this.pyramidLayer.addChild(chip)
      this.pyramidLayer.addChild(n)
    }
  }

  private spawnHeatBurst(x: number, y: number, n: number): void {
    for (let i = 0; i < n; i++) {
      this.heatParticles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 40,
        vy: -30 - Math.random() * 50,
        life: 0.6 + Math.random() * 0.5,
        r: 2 + Math.random() * 3,
      })
    }
  }

  public override step(dt: number): void {
    const capped = Math.min(dt, 0.05)
    this.model.step(capped)

    const pulse = this.model.pulseProperty.value
    const r = 16 + Math.sin(pulse * 2) * 1.5
    this.sun.radius = r
    this.sunGlow.radius = 30 + Math.sin(pulse * 2) * 4
    this.sunGlow.opacity = 0.3 + Math.sin(pulse * 2.2) * 0.1
    this.sunLabel.centerX = this.sun.centerX
    this.sunLabel.top = this.sun.bottom + 1

    // Animated sun rays
    this.sunRays.removeAllChildren()
    const sx = this.sun.centerX
    const sy = this.sun.centerY
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + pulse * 0.4
      const len = 24 + Math.sin(pulse * 3 + i) * 4
      const ray = new Shape()
      ray.moveTo(sx + Math.cos(ang) * 18, sy + Math.sin(ang) * 18)
      ray.lineTo(sx + Math.cos(ang) * len, sy + Math.sin(ang) * len)
      this.sunRays.addChild(
        new Path(ray, {
          stroke: `rgba(251, 191, 36, ${0.22 + Math.sin(pulse * 2 + i) * 0.1})`,
          lineWidth: 2,
        }),
      )
    }

    // Birds drifting across sky
    this.birdLayer.removeAllChildren()
    const s = this.sceneBounds
    for (const bird of this.birds) {
      bird.x += bird.speed * capped
      if (bird.x > s.left + s.width + 20) bird.x = s.left - 20
      const wing = Math.sin(pulse * 8 + bird.phase) * 4
      const body = new Shape()
      body.moveTo(bird.x - 6, bird.y)
      body.quadraticCurveTo(bird.x, bird.y - 3 - wing, bird.x + 6, bird.y)
      body.quadraticCurveTo(bird.x, bird.y + 2, bird.x - 6, bird.y)
      this.birdLayer.addChild(new Path(body, { fill: 'rgba(15, 23, 42, 0.45)' }))
    }

    this.particleLayer.removeAllChildren()

    // Cascade spotlight particle wave
    const cascade = this.model.cascadeProgressProperty.value
    if (cascade > 0) {
      const tier = Math.min(3, Math.floor(cascade))
      if (tier !== this.lastCascadeTier) {
        this.lastCascadeTier = tier
        this.sounds.tierSelect()
        const g = this.tierGeoms[tier]
        if (g) this.spawnHeatBurst(g.cx, g.cy, 10)
      }
      const g = this.tierGeoms[tier]
      if (g) {
        const frac = cascade - tier
        this.particleLayer.addChild(
          new Circle(12 + frac * 18, {
            fill: `rgba(253, 224, 71, ${0.15 + (1 - frac) * 0.25})`,
            centerX: g.cx,
            centerY: g.cy,
          }),
        )
      }
    } else {
      this.lastCascadeTier = -1
    }

    // Rising heat + transfer particles
    if (this.model.runningProperty.value) {
      for (let tier = 1; tier < 4; tier++) {
        const above = this.tierGeoms[tier]
        const below = this.tierGeoms[tier - 1]
        if (!above || !below) continue
        for (let p = 0; p < 2; p++) {
          const t = (pulse * (0.45 + p * 0.12) + tier * 0.22 + p * 0.4) % 1
          const x = above.cx + Math.sin(pulse * 2.5 + tier + p) * (14 + p * 6)
          const y = below.cy + (above.cy - below.cy) * t
          const heat = this.model.modeProperty.value === 'energy'
          this.particleLayer.addChild(
            new Circle(2.2 + (1 - t) * 1.5, {
              fill: heat
                ? `rgba(248, 113, 113, ${0.25 + (1 - t) * 0.55})`
                : `rgba(125, 211, 252, ${0.2 + (1 - t) * 0.45})`,
              centerX: x,
              centerY: y,
            }),
          )
        }
      }

      // Occasional whoosh when highlight is active
      if (
        this.model.highlightTransferProperty.value > 1.1 &&
        Date.now() - this.lastHeatSound > 900
      ) {
        this.lastHeatSound = Date.now()
        if (this.model.modeProperty.value === 'energy') this.sounds.heatWhoosh()
      }
    }

    // Burst particles
    for (let i = this.heatParticles.length - 1; i >= 0; i--) {
      const p = this.heatParticles[i]!
      p.life -= capped
      p.x += p.vx * capped
      p.y += p.vy * capped
      p.vy += 20 * capped
      if (p.life <= 0) {
        this.heatParticles.splice(i, 1)
        continue
      }
      this.particleLayer.addChild(
        new Circle(p.r * Math.max(0.2, p.life), {
          fill: `rgba(251, 146, 60, ${Math.min(0.9, p.life)})`,
          centerX: p.x,
          centerY: p.y,
        }),
      )
    }

    // Nutrient recycle dots when decomposers focused
    if (this.model.decomposerFocusProperty.value && this.model.runningProperty.value) {
      const prod = this.tierGeoms[0]
      if (prod) {
        const t = (pulse * 0.5) % 1
        const x = prod.cx + Math.sin(pulse * 3) * 30
        const y = s.top + s.height - 40 + (prod.cy - (s.top + s.height - 40)) * t
        this.particleLayer.addChild(
          new Circle(3.5, {
            fill: `rgba(167, 243, 208, ${0.3 + t * 0.5})`,
            centerX: x,
            centerY: y,
          }),
        )
      }
    }

    // Pulse selected band via sun-driven handle nudge
    if (this.baseHandle) {
      this.baseHandle.opacity = 0.75 + Math.sin(pulse * 3) * 0.2
    }
  }
}

function makeTierSilhouette(tier: number, x: number, y: number): Node {
  const names = ['grass', 'rabbit', 'fox', 'eagle'] as const
  const n = new Node({ pickable: false })
  const icon = createEcologyIcon(names[tier] ?? 'grass', tier === 0 ? 40 : 36)
  icon.centerX = x
  icon.centerY = y
  icon.opacity = 0.95
  n.addChild(icon)
  return n
}

/** Soft elliptical ground shadow under the pyramid */
class EllipseShadow extends Node {
  public constructor(cx: number, cy: number, rx: number, ry: number) {
    super({ pickable: false })
    this.addChild(new Path(Shape.ellipse(cx, cy, rx, ry, 0), { fill: 'rgba(0,0,0,0.35)' }))
  }
}
