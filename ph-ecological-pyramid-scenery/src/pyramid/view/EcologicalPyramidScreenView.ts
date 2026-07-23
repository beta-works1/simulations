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
  tierDotCount,
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
  private readonly sun: Circle
  private readonly sunGlow: Circle
  private readonly sunRays: Node
  private readonly birdLayer: Node
  private readonly sceneBounds: { left: number; top: number; width: number; height: number }
  private tierGeoms: TierGeom[] = []
  private baseHandle: Circle | null = null
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
    const statusH = 36
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
        font: new PhetFont(11),
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

    this.sunGlow = new Circle(48, {
      fill: 'rgba(255,220,80,0.28)',
      centerX: sceneLeft + sceneW / 2,
      centerY: sceneTop + 40,
      cursor: 'pointer',
    })
    this.sun = new Circle(20, {
      fill: '#f4d03f',
      centerX: this.sunGlow.centerX,
      centerY: this.sunGlow.centerY,
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
    for (let i = 0; i < 5; i++) {
      this.birds.push({
        x: sceneLeft + 20 + i * (sceneW / 5),
        y: sceneTop + 24 + (i % 3) * 10,
        speed: 18 + i * 6,
        phase: i * 1.3,
      })
    }
    this.addChild(
      new Text('☀ Sun — tap', {
        font: new PhetFont(10),
        fill: '#f4d03f',
        centerX: this.sun.centerX,
        top: this.sun.bottom + 2,
        pickable: false,
      }),
    )

    this.pyramidLayer = new Node()
    this.particleLayer = new Node({ pickable: false })
    this.addChild(this.pyramidLayer)
    this.addChild(this.particleLayer)

    this.tipText = new Text('', {
      font: new PhetFont(10),
      fill: '#ecfeff',
      maxWidth: sceneW * 0.55,
    })
    const tipBg = new Rectangle(0, 0, 20, 20, {
      fill: 'rgba(8, 18, 32, 0.88)',
      cornerRadius: 8,
      stroke: 'rgba(125, 211, 252, 0.45)',
      lineWidth: 1,
    })
    this.tipCard = new Node({ children: [tipBg, this.tipText], pickable: false })
    this.addChild(this.tipCard)

    const refreshTip = () => {
      this.tipText.string = model.tipProperty.value
      tipBg.rectWidth = this.tipText.width + 16
      tipBg.rectHeight = this.tipText.height + 12
      this.tipText.center = tipBg.center
      this.tipCard.left = sceneLeft + 10
      this.tipCard.bottom = sceneTop + sceneH - 10
      this.tipCard.visible = model.showTipsProperty.value
    }
    model.tipProperty.link(refreshTip)
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

    const pyramidTop = s.top + 78
    const pyramidBottom = s.top + s.height - 62
    const availableH = pyramidBottom - pyramidTop
    const tierH = availableH / 4.35
    const cx = s.left + s.width / 2
    const maxW = s.width * 0.8
    const minW = s.width * 0.26

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
      const h = tierH - 5

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
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: 'white',
        centerX: cx,
        centerY: y + h * 0.32,
        maxWidth: wBot * 0.85,
        pickable: false,
      })
      this.pyramidLayer.addChild(label)

      const d = tierDetail(base, tier, mode, transfer)
      const valueChip = new Text(formatTierValue(d.energy, mode), {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#0b1628',
        pickable: false,
      })
      const chipBg = new Rectangle(0, 0, valueChip.width + 14, 18, {
        fill: 'rgba(255,255,255,0.9)',
        cornerRadius: 9,
        pickable: false,
      })
      chipBg.centerX = cx
      chipBg.centerY = y + h * 0.62
      valueChip.center = chipBg.center
      this.pyramidLayer.addChild(chipBg)
      this.pyramidLayer.addChild(valueChip)

      // Simple organism silhouette markers (depth cue per trophic role)
      this.pyramidLayer.addChild(makeTierSilhouette(tier, cx - wBot * 0.32, y + h * 0.55))

      // Organism / mass dots
      const dots = tierDotCount(base, tier, mode, transfer)
      const cols = Math.max(1, Math.ceil(Math.sqrt(dots)))
      for (let i = 0; i < dots; i++) {
        const col = i % cols
        const row = Math.floor(i / cols)
        const dx = (col - (cols - 1) / 2) * 6.5
        const dy = row * 5.5 - 2
        const side = tier % 2 === 0 ? -1 : 1
        this.pyramidLayer.addChild(
          new Circle(mode === 'biomass' ? 2.4 : 1.9, {
            fill: mode === 'numbers' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)',
            centerX: cx + side * (wBot * 0.28) + dx,
            centerY: y + h * 0.55 + dy,
            pickable: false,
          }),
        )
      }

      // Transfer label between this tier and the one below (visual)
      if (visual < 3) {
        const keepPct = (transfer * 100).toFixed(0)
        const midY = y + h + 1
        const badge = new Text(`${keepPct}% ↑`, {
          font: new PhetFont({ size: 9, weight: 'bold' }),
          fill: '#fecaca',
          pickable: false,
        })
        const badgeBg = new Rectangle(0, 0, badge.width + 10, 14, {
          fill: 'rgba(127, 29, 29, 0.85)',
          cornerRadius: 7,
          pickable: false,
        })
        badgeBg.centerX = cx + wBot * 0.38
        badgeBg.centerY = midY
        badge.center = badgeBg.center
        this.pyramidLayer.addChild(badgeBg)
        this.pyramidLayer.addChild(badge)
      }
    }

    // Draggable base-energy handle on producers
    const prod = this.tierGeoms[0]
    if (prod) {
      const handle = new Circle(13, {
        fill: '#7dd3fc',
        stroke: '#ffffff',
        lineWidth: 2,
        centerX: prod.cx + prod.w * 0.42,
        centerY: prod.cy + prod.h * 0.15,
        cursor: 'ew-resize',
      })
      const handleLabel = new Text('⟷ energy', {
        font: new PhetFont(8),
        fill: '#e0f2fe',
        centerX: handle.centerX,
        top: handle.bottom + 1,
        pickable: false,
      })
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
            const delta = (dx / (s.width * 0.35)) * span
            this.model.setBaseEnergy(startBase + delta)
          },
          end: () => this.sounds.releaseHandle(),
        }),
      )
      this.pyramidLayer.addChild(handle)
      this.pyramidLayer.addChild(handleLabel)
      this.baseHandle = handle
    }

    // Decomposer band
    const decY = pyramidBottom + 4
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
      new Text(`${DECOMPOSER_LABEL}  ·  recycle → nutrients → producers`, {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: 'white',
        center: dec.center,
        maxWidth: dec.width - 14,
        pickable: false,
      }),
    )

    // Mode badge
    const modeBadge = new Text(
      mode === 'energy' ? 'Energy pyramid' : mode === 'biomass' ? 'Biomass pyramid' : 'Numbers pyramid',
      {
        font: new PhetFont({ size: 10, weight: 'bold' }),
        fill: '#ecfeff',
        pickable: false,
      },
    )
    const modeBg = new Rectangle(0, 0, modeBadge.width + 14, 20, {
      fill: 'rgba(15, 23, 42, 0.75)',
      cornerRadius: 10,
      pickable: false,
    })
    modeBg.left = s.left + 10
    modeBg.top = s.top + 10
    modeBadge.center = modeBg.center
    this.pyramidLayer.addChild(modeBg)
    this.pyramidLayer.addChild(modeBadge)

    if (mode === 'energy') {
      const pillText = new Text(`~${((1 - transfer) * 100).toFixed(0)}% lost as heat`, {
        font: new PhetFont({ size: 10, weight: 'bold' }),
        fill: 'white',
        pickable: false,
      })
      const pillBg = new Rectangle(0, 0, pillText.width + 14, 22, {
        fill: 'rgba(192, 57, 43, 0.92)',
        cornerRadius: 11,
        pickable: false,
      })
      pillBg.right = s.left + s.width - 12
      pillBg.top = s.top + 10
      pillText.center = pillBg.center
      this.pyramidLayer.addChild(pillBg)
      this.pyramidLayer.addChild(pillText)
    }

    // Level index chips on the left
    for (let tier = 0; tier < 4; tier++) {
      const g = this.tierGeoms[tier]
      if (!g) continue
      const n = new Text(String(tier + 1), {
        font: new PhetFont({ size: 10, weight: 'bold' }),
        fill: '#0b1628',
        pickable: false,
      })
      const chip = new Circle(9, {
        fill: selected === tier ? '#f4d03f' : 'rgba(255,255,255,0.75)',
        centerX: g.x - 14,
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
    const r = 20 + Math.sin(pulse * 2) * 2.5
    this.sun.radius = r
    this.sunGlow.radius = 36 + Math.sin(pulse * 2) * 6
    this.sunGlow.opacity = 0.32 + Math.sin(pulse * 2.2) * 0.12

    // Animated sun rays
    this.sunRays.removeAllChildren()
    const sx = this.sun.centerX
    const sy = this.sun.centerY
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2 + pulse * 0.4
      const len = 28 + Math.sin(pulse * 3 + i) * 6
      const ray = new Shape()
      ray.moveTo(sx + Math.cos(ang) * 22, sy + Math.sin(ang) * 22)
      ray.lineTo(sx + Math.cos(ang) * len, sy + Math.sin(ang) * len)
      this.sunRays.addChild(
        new Path(ray, {
          stroke: `rgba(251, 191, 36, ${0.25 + Math.sin(pulse * 2 + i) * 0.12})`,
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
  const icon = createEcologyIcon(names[tier] ?? 'grass', tier === 0 ? 34 : 30)
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
