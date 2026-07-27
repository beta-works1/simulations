import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import {
  Circle,
  Color,
  DragListener,
  LinearGradient,
  Line,
  Node,
  Path,
  Rectangle,
  Text,
} from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont } from 'scenerystack/scenery-phet'
import { WarmingModel, WARMING_SCENARIOS } from '../model/WarmingModel.js'
import { EcologyConstants, clamp, damp, lerp } from '../../../shared/EcologyConstants.js'
import { createEcologyIcon } from '../../../shared/EcologyArt.js'
import { WarmingControlPanel } from './WarmingControlPanel.js'
import { WarmingSounds } from './WarmingSounds.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { GuidanceBanner } from '../../../shared/ui/GuidanceBanner.js'
import { TeachingTriad } from '../../../shared/ui/TeachingTriad.js'
import { MiniQuiz } from '../../../shared/ui/MiniQuiz.js'
import { ParticleBurst } from '../../../shared/ui/ParticleBurst.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const GAS_PARTICLE_POOL = 14
const HEAT_DOT_COUNT = 4
const CLOUD_COUNT = 3

/**
 * Ch2 SoftButton teaching shell: guidance banner + left NOW/WHY/NEXT triad,
 * dense scrollable SoftButton/DepthSlider control panel, mini quiz, and
 * particle bursts on temperature spikes — layered on top of the original
 * clarity-pass scene (model physics + one-tip/one-temp/legend UX stay intact).
 */
export class WarmingScreenView extends ScreenView {
  private readonly model: WarmingModel
  private readonly sounds: WarmingSounds

  private readonly sky: Rectangle
  private readonly hills: Path
  private readonly sunGlow: Circle
  private readonly sunShadow: Path
  private readonly sunNode: Node
  private readonly sunRays: Path[] = []
  private readonly risePath: Path
  private readonly trapPath: Path
  private readonly escapePath: Path
  private readonly escapeArrow: Path
  private readonly escapeLabel: Text
  private readonly heatDots: Circle[] = []
  private readonly gasParticles: Circle[] = []
  private readonly smokePuffs: Circle[] = []
  private readonly clouds: Node[] = []
  private readonly cloudBaseX: number[] = []

  private readonly ghgBand: Rectangle
  private readonly ghgHandle: Node
  private readonly ghgLabel: Text
  private readonly ghgPill: Rectangle
  private readonly soil: Rectangle
  private readonly soilUnderGrass: Rectangle
  private readonly grass: Rectangle
  private readonly grassBlades: { node: Node; phase: number; amp: number; baseRot: number }[] = []
  private readonly groundScene: Node
  private readonly ambientLayer: Node
  private readonly treeLayer: Node
  private readonly factoryLayer: Node
  private readonly tempBg: Rectangle
  private readonly tempChip: Text
  private readonly tempShadow: Path
  private readonly trapValueLabel: Text
  private readonly nowCard: Node
  private readonly nowText: Text
  private readonly nowBg: Rectangle
  private readonly nightOverlay: Rectangle
  private readonly captionLayer: Node
  private readonly sceneBounds: { left: number; top: number; width: number; height: number }
  private readonly sunOriginX: number
  private readonly sunOriginY: number
  private readonly bandLeft: number
  private readonly bandWidth: number
  private readonly bandMinTop: number
  private readonly bandMaxBottom: number
  private readonly groundTop: number
  private readonly beamTargets: { x: number; y: number }[]

  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly miniQuiz: MiniQuiz
  private readonly particles: ParticleBurst

  private visualHeat = 0.2
  private visualCo2 = 0.4
  private animTime = 0
  private syncingCo2 = false
  private lastBandSound = 0
  private lastSkyHeat = -1
  private lastBurstTemp = 15
  private quizShown = false

  public constructor(model: WarmingModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    this.sounds = new WarmingSounds()
    this.sounds.warm()
    this.sounds.setEnabled(model.soundEnabledProperty.value)
    model.soundEnabledProperty.link(on => this.sounds.setEnabled(on))
    this.addInputListener({ down: () => this.sounds.unlock() })

    const margin = EcologyConstants.SCREEN_VIEW_X_MARGIN
    const leftW = 190
    const panelW = 250
    const gap = 14
    const b = this.layoutBounds

    // ── Top guidance banner ─────────────────────────────────────────────────
    this.guide = new GuidanceBanner(b.width - margin * 2, {
      title: 'Explore the greenhouse effect',
      body: 'Drag the gas blanket, or try a story below, to see how CO₂ changes Earth’s temperature.',
    })
    this.guide.left = b.left + margin
    this.guide.top = b.top + margin
    this.addChild(this.guide)

    const stageTop = this.guide.bottom + gap

    const sceneLeft = b.left + margin + leftW + gap
    const sceneTop = stageTop
    const sceneW = b.width - margin * 2 - leftW - gap - panelW - gap
    const sceneH = b.bottom - margin - stageTop
    this.sceneBounds = { left: sceneLeft, top: sceneTop, width: sceneW, height: sceneH }

    // ── Left column: teaching triad ─────────────────────────────────────────
    const leftCard = new DepthCard(leftW, sceneH)
    leftCard.left = b.left + margin
    leftCard.top = stageTop
    this.addChild(leftCard)

    this.teachingTriad = new TeachingTriad(leftW - 24)
    this.teachingTriad.left = 12
    this.teachingTriad.top = 12
    leftCard.content.addChild(this.teachingTriad)

    this.captionLayer = new Node({ pickable: false })

    this.sky = new Rectangle(sceneLeft, sceneTop, sceneW, sceneH, {
      fill: '#38bdf8',
      cornerRadius: 14,
      stroke: 'rgba(255,255,255,0.14)',
      lineWidth: 1,
    })
    this.addChild(this.sky)

    // Drifting clouds (ambient motion, density driven by the Cloud cover slider)
    for (let i = 0; i < CLOUD_COUNT; i++) {
      const cloud = this.makeCloud(70 + i * 18)
      const baseX = sceneLeft + 40 + i * (sceneW * 0.28)
      this.cloudBaseX.push(baseX)
      cloud.centerX = baseX
      cloud.centerY = sceneTop + 36 + i * 22
      cloud.opacity = 0.35
      cloud.pickable = false
      this.clouds.push(cloud)
      this.addChild(cloud)
    }

    const hillShape = new Shape()
    hillShape.moveTo(sceneLeft, sceneTop + sceneH * 0.72)
    hillShape.quadraticCurveTo(
      sceneLeft + sceneW * 0.25,
      sceneTop + sceneH * 0.58,
      sceneLeft + sceneW * 0.5,
      sceneTop + sceneH * 0.68,
    )
    hillShape.quadraticCurveTo(
      sceneLeft + sceneW * 0.75,
      sceneTop + sceneH * 0.78,
      sceneLeft + sceneW,
      sceneTop + sceneH * 0.62,
    )
    hillShape.lineTo(sceneLeft + sceneW, sceneTop + sceneH)
    hillShape.lineTo(sceneLeft, sceneTop + sceneH)
    hillShape.close()
    this.hills = new Path(hillShape, { fill: 'rgba(34, 100, 60, 0.4)', pickable: false })
    this.addChild(this.hills)

    // Sun origin is the single source of truth for icon + rays
    this.sunOriginX = sceneLeft + sceneW * 0.84
    this.sunOriginY = sceneTop + sceneH * 0.14

    this.groundTop = sceneTop + sceneH * 0.76
    this.bandLeft = sceneLeft + sceneW * 0.3
    this.bandWidth = sceneW * 0.4
    this.bandMinTop = sceneTop + sceneH * 0.34
    this.bandMaxBottom = this.groundTop - 36

    // Beam targets land in the open center (clear of Earth/temp on the right)
    this.beamTargets = [
      { x: sceneLeft + sceneW * 0.34, y: this.groundTop - 4 },
      { x: sceneLeft + sceneW * 0.44, y: this.groundTop - 4 },
      { x: sceneLeft + sceneW * 0.52, y: this.groundTop - 4 },
    ]
    for (let i = 0; i < this.beamTargets.length; i++) {
      const ray = new Path(null, {
        stroke: 'rgba(250,204,21,0.55)',
        lineWidth: 2.5,
        lineCap: 'round',
        pickable: false,
      })
      this.sunRays.push(ray)
      this.addChild(ray)
    }
    this.rebuildSunRays()

    // Sun on top of rays so beams read as leaving the icon
    this.sunShadow = this.makeOval(22, 8, 'rgba(15,23,42,0.28)')
    this.sunShadow.centerX = this.sunOriginX
    this.sunShadow.centerY = this.sunOriginY + 26
    this.addChild(this.sunShadow)
    this.sunGlow = new Circle(28, {
      fill: 'rgba(250,204,21,0.22)',
      centerX: this.sunOriginX,
      centerY: this.sunOriginY,
      pickable: false,
    })
    this.addChild(this.sunGlow)
    this.sunNode = createEcologyIcon('sun', 48)
    this.sunNode.centerX = this.sunOriginX
    this.sunNode.centerY = this.sunOriginY
    this.sunNode.pickable = false
    this.addChild(this.sunNode)

    const sunLabel = new Text('Sunlight in', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#fde68a',
      pickable: false,
    })
    const sunChip = new Rectangle(0, 0, sunLabel.width + 14, 22, {
      cornerRadius: 8,
      fill: 'rgba(15,23,42,0.82)',
      pickable: false,
    })
    sunChip.centerX = this.sunOriginX
    sunChip.bottom = this.sunOriginY - this.sunNode.height * 0.5 - 6
    sunLabel.center = sunChip.center
    this.captionLayer.addChild(sunChip)
    this.captionLayer.addChild(sunLabel)

    // Atmospheric gas blanket (haze fill + subtle outline)
    this.ghgBand = new Rectangle(this.bandLeft, this.bandMinTop, this.bandWidth, 40, {
      cornerRadius: 14,
      fill: 'rgba(125, 211, 252, 0.28)',
      stroke: 'rgba(186, 230, 253, 0.45)',
      lineWidth: 1.5,
      cursor: 'ns-resize',
    })
    this.addChild(this.ghgBand)

    // Gas molecule particles (density scales with blanket %)
    for (let i = 0; i < GAS_PARTICLE_POOL; i++) {
      const p = new Circle(2.2 + (i % 3) * 0.6, {
        fill: 'rgba(224, 242, 254, 0.7)',
        pickable: false,
      })
      this.gasParticles.push(p)
      this.addChild(p)
    }

    this.ghgLabel = new Text('Gas blanket', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#ecfeff',
      pickable: false,
    })
    this.ghgPill = new Rectangle(0, 0, 120, 22, {
      cornerRadius: 8,
      fill: 'rgba(15,23,42,0.55)',
      pickable: false,
    })
    this.captionLayer.addChild(this.ghgPill)
    this.captionLayer.addChild(this.ghgLabel)

    // Vertical slider thumb on the RIGHT edge of the blanket (out of ray paths)
    this.ghgHandle = new Node({ cursor: 'ns-resize' })
    this.ghgHandle.addChild(
      new Rectangle(-11, -26, 22, 52, {
        cornerRadius: 11,
        fill: '#f8fafc',
        stroke: '#0ea5e9',
        lineWidth: 2.5,
      }),
    )
    this.ghgHandle.addChild(
      new Text('↕', {
        font: new PhetFont({ size: 14, weight: 'bold' }),
        fill: '#0f172a',
        centerX: 0,
        centerY: 0,
        pickable: false,
      }),
    )
    this.addChild(this.ghgHandle)

    this.risePath = new Path(null, {
      stroke: 'rgba(248,113,113,0.75)',
      lineWidth: 3,
      lineCap: 'round',
      pickable: false,
    })
    this.trapPath = new Path(null, {
      stroke: 'rgba(239,68,68,0.85)',
      lineWidth: 3,
      lineCap: 'round',
      pickable: false,
    })
    this.escapePath = new Path(null, {
      stroke: 'rgba(251,146,60,0.85)',
      lineWidth: 2.5,
      lineCap: 'round',
      lineDash: [6, 5],
      pickable: false,
    })
    this.escapeArrow = new Path(null, {
      fill: 'rgba(251,146,60,0.95)',
      stroke: 'rgba(254,215,170,0.9)',
      lineWidth: 1,
      pickable: false,
      visible: false,
    })
    this.addChild(this.risePath)
    this.addChild(this.trapPath)
    this.addChild(this.escapePath)
    this.addChild(this.escapeArrow)
    this.escapeLabel = new Text('Escapes to space', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#fdba74',
      pickable: false,
      visible: false,
    })
    this.captionLayer.addChild(this.escapeLabel)

    for (let i = 0; i < HEAT_DOT_COUNT; i++) {
      const dot = new Circle(5, {
        fill: '#f87171',
        stroke: '#fff',
        lineWidth: 1,
        pickable: false,
      })
      this.heatDots.push(dot)
      this.addChild(dot)
    }

    // Ground: textured soil + grass strip with blades
    const groundH = sceneTop + sceneH - this.groundTop
    this.soil = new Rectangle(sceneLeft, this.groundTop, sceneW, groundH, {
      fill: new LinearGradient(0, this.groundTop, 0, this.groundTop + groundH)
        .addColorStop(0, '#a16207')
        .addColorStop(0.45, '#92400e')
        .addColorStop(1, '#78350f'),
    })
    this.addChild(this.soil)
    // Darker band right under grass so soil/grass read as separate materials
    this.soilUnderGrass = new Rectangle(sceneLeft, this.groundTop + 14, sceneW, 10, {
      fill: 'rgba(69, 26, 3, 0.45)',
      pickable: false,
    })
    this.addChild(this.soilUnderGrass)
    this.buildSoilDetails(sceneLeft, sceneW, groundH)

    this.grass = new Rectangle(sceneLeft, this.groundTop, sceneW, 16, {
      fill: new LinearGradient(0, this.groundTop, 0, this.groundTop + 16)
        .addColorStop(0, '#4ade80')
        .addColorStop(0.55, '#22c55e')
        .addColorStop(1, '#15803d'),
    })
    this.addChild(this.grass)
    this.buildGrassTexture(sceneLeft, sceneW)

    this.groundScene = new Node({ pickable: false })
    this.ambientLayer = new Node({ pickable: false })
    this.treeLayer = new Node({ pickable: false })
    this.factoryLayer = new Node({ pickable: false })
    this.groundScene.addChild(this.ambientLayer)
    this.groundScene.addChild(this.treeLayer)
    this.groundScene.addChild(this.factoryLayer)
    this.addChild(this.groundScene)
    this.buildGroundProps(sceneLeft, sceneW)
    this.buildAmbientGround(sceneLeft, sceneW)

    for (let i = 0; i < 6; i++) {
      const puff = new Circle(6, {
        fill: 'rgba(148,163,184,0.35)',
        pickable: false,
        visible: false,
      })
      this.smokePuffs.push(puff)
      this.addChild(puff)
    }

    this.captionLayer.addChild(
      new Text('Heat radiating ↑', {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: '#fecaca',
        left: sceneLeft + 12,
        bottom: this.groundTop - 90,
        pickable: false,
      }),
    )

    this.trapValueLabel = new Text('Heat trapped: 40%', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#fecaca',
      right: sceneLeft + sceneW - 12,
      top: this.bandMinTop - 24,
      pickable: false,
    })
    this.captionLayer.addChild(this.trapValueLabel)

    // Temperature + Earth sit on the RIGHT so center ray paths stay clear
    const tempRight = sceneLeft + sceneW - 12
    this.tempShadow = this.makeOval(70, 8, 'rgba(15,23,42,0.35)')
    this.addChild(this.tempShadow)
    this.tempBg = new Rectangle(0, 0, 160, 40, {
      cornerRadius: 12,
      fill: 'rgba(15,23,42,0.9)',
      stroke: 'rgba(251,146,60,0.7)',
      lineWidth: 1.5,
      pickable: false,
    })
    this.tempChip = new Text('', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: '#fdba74',
      pickable: false,
    })
    this.addChild(this.tempBg)
    this.addChild(this.tempChip)
    const refreshTemp = (temp: number) => {
      this.tempChip.string = `Earth ${temp.toFixed(1)} °C`
      this.tempBg.rectWidth = Math.max(150, this.tempChip.width + 24)
      this.tempBg.right = tempRight
      this.tempBg.bottom = this.groundTop - 12
      this.tempChip.center = this.tempBg.center
      this.tempShadow.centerX = this.tempBg.centerX
      this.tempShadow.centerY = this.tempBg.bottom + 4
    }
    model.temperatureProperty.link(refreshTemp)

    this.nowText = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#fde68a',
      maxWidth: sceneW * 0.52,
    })
    this.nowBg = new Rectangle(0, 0, 20, 20, {
      fill: 'rgba(8, 18, 32, 0.92)',
      cornerRadius: 8,
      stroke: 'rgba(250, 204, 21, 0.45)',
      lineWidth: 1.5,
    })
    this.nowCard = new Node({ children: [this.nowBg, this.nowText], pickable: false })
    this.addChild(this.nowCard)

    const refreshNow = () => {
      this.nowText.string = model.tipProperty.value
      this.nowBg.rectWidth = Math.min(sceneW * 0.55, this.nowText.width + 20)
      this.nowBg.rectHeight = this.nowText.height + 14
      this.nowText.center = this.nowBg.center
      this.nowCard.left = sceneLeft + 10
      this.nowCard.top = sceneTop + 10
      this.nowCard.visible = model.showTipsProperty.value
    }
    model.tipProperty.link(refreshNow)
    model.showTipsProperty.link(refreshNow)

    this.captionLayer.addChild(this.buildLegend(sceneLeft + 10, this.groundTop - 78))
    this.addChild(this.captionLayer)
    model.showLabelsProperty.link(on => {
      this.captionLayer.visible = on
    })

    // Day/night dimming overlay, driven by the Auto day toggle
    this.nightOverlay = new Rectangle(sceneLeft, sceneTop, sceneW, sceneH, {
      cornerRadius: 14,
      fill: 'rgba(5,10,25,1)',
      opacity: 0,
      pickable: false,
    })
    this.addChild(this.nightOverlay)

    const applyBandFromCo2 = (co2: number) => {
      const maxThick = this.bandMaxBottom - this.bandMinTop
      const thick = 36 + co2 * (maxThick - 36)
      this.ghgBand.setRect(this.bandLeft, this.bandMinTop, this.bandWidth, thick)
      // Soft atmospheric haze (amber as it thickens)
      const cool = new Color(125, 211, 252, 0.22)
      const warm = new Color(251, 191, 36, 0.38)
      this.ghgBand.fill = Color.interpolateRGBA(cool, warm, co2)
      this.ghgBand.stroke = `rgba(255,255,255,${0.25 + co2 * 0.25})`

      this.ghgPill.rectWidth = Math.max(110, this.ghgLabel.width + 14)
      this.ghgPill.left = this.bandLeft + 8
      this.ghgPill.top = this.bandMinTop + 6
      this.ghgLabel.center = this.ghgPill.center

      // Thumb on right edge, mid-height of the current blanket
      this.ghgHandle.centerX = this.bandLeft + this.bandWidth
      this.ghgHandle.centerY = this.bandMinTop + thick * 0.5

      this.trapValueLabel.string = `Heat trapped: ${Math.round(co2 * 100)}%`
      this.trapValueLabel.right = sceneLeft + sceneW - 12

      this.rebuildHeatPaths(co2)
      this.layoutGasParticles(co2)
    }
    applyBandFromCo2(model.co2LevelProperty.value)

    const dragBand = (y: number) => {
      const maxThick = this.bandMaxBottom - this.bandMinTop
      const thick = clamp(y - this.bandMinTop, 36, maxThick)
      const co2 = clamp((thick - 36) / Math.max(1, maxThick - 36), 0.05, 1)
      this.syncingCo2 = true
      model.setCo2(co2)
      this.syncingCo2 = false
      applyBandFromCo2(co2)
      const now = Date.now()
      if (now - this.lastBandSound > 110) {
        this.lastBandSound = now
        this.sounds.sliderTick()
      }
    }

    const bandListener = new DragListener({
      start: () => this.sounds.grabHandle(),
      drag: event => {
        const pt = this.globalToLocalPoint(event.pointer.point)
        dragBand(pt.y)
      },
      end: () => this.sounds.releaseHandle(),
    })
    this.ghgBand.addInputListener(bandListener)
    this.ghgHandle.addInputListener(
      new DragListener({
        start: () => this.sounds.grabHandle(),
        drag: event => {
          const pt = this.globalToLocalPoint(event.pointer.point)
          dragBand(pt.y)
        },
        end: () => this.sounds.releaseHandle(),
      }),
    )

    model.co2LevelProperty.link(co2 => {
      if (!this.syncingCo2) applyBandFromCo2(co2)
      this.visualCo2 = co2
    })
    model.scenarioIdProperty.link(() => this.applyScenarioGround())
    this.applyScenarioGround()

    // ── Right column: dense scrollable control panel ───────────────────────
    const controlPanel = new WarmingControlPanel(model, this.sounds, {
      width: panelW,
      height: sceneH,
      onQuickCheck: () => this.showQuiz(),
    })
    controlPanel.right = b.right - margin
    controlPanel.top = sceneTop
    this.addChild(controlPanel)

    // ── Mini quiz overlay, centered over the scene ──────────────────────────
    this.miniQuiz = new MiniQuiz(Math.min(280, sceneW - 40))
    this.miniQuiz.centerX = sceneLeft + sceneW / 2
    this.miniQuiz.centerY = sceneTop + sceneH / 2
    this.addChild(this.miniQuiz)

    this.particles = new ParticleBurst(90)
    this.addChild(this.particles)

    model.scenarioIdProperty.lazyLink(() => {
      if (!this.quizShown) {
        this.quizShown = true
        this.showQuiz()
      }
    })

    const refreshGuidance = () => this.updateGuidance()
    model.co2LevelProperty.link(refreshGuidance)
    model.scenarioIdProperty.link(refreshGuidance)
    model.cloudCoverProperty.link(refreshGuidance)
    model.albedoProperty.link(refreshGuidance)

    this.visualHeat = (model.temperatureProperty.value - 10) / 28
    this.visualCo2 = model.co2LevelProperty.value
    this.lastBurstTemp = model.temperatureProperty.value
    this.updateSky(true)
  }

  private makeOval(rx: number, ry: number, fill: string): Path {
    return new Path(Shape.ellipse(0, 0, rx, ry, 0), {
      fill,
      pickable: false,
    })
  }

  private makeCloud(width: number): Node {
    const h = width * 0.38
    const cloud = new Node()
    cloud.addChild(this.makeOval(width * 0.45, h * 0.55, 'rgba(248,250,252,0.55)'))
    const left = this.makeOval(width * 0.28, h * 0.45, 'rgba(248,250,252,0.5)')
    left.centerX = -width * 0.28
    left.centerY = h * 0.08
    cloud.addChild(left)
    const right = this.makeOval(width * 0.3, h * 0.48, 'rgba(248,250,252,0.5)')
    right.centerX = width * 0.26
    right.centerY = h * 0.05
    cloud.addChild(right)
    return cloud
  }

  private addGroundIcon(parent: Node, name: string, size: number, cx: number, cy: number): void {
    const shadow = this.makeOval(size * 0.38, size * 0.12, 'rgba(15,23,42,0.35)')
    shadow.centerX = cx
    shadow.centerY = cy + size * 0.38
    parent.addChild(shadow)
    const icon = createEcologyIcon(name, size)
    icon.centerX = cx
    icon.centerY = cy
    icon.pickable = false
    parent.addChild(icon)
  }

  /** Soft soil mottling + irregular shaded rocks (no crack lines or circle-dots). */
  private buildSoilDetails(sceneLeft: number, sceneW: number, groundH: number): void {
    const details = new Node({ pickable: false })
    const mottles = [
      { x: 0.1, y: 0.4, rx: 20, ry: 6, c: 'rgba(120, 53, 15, 0.28)' },
      { x: 0.3, y: 0.55, rx: 24, ry: 7, c: 'rgba(146, 64, 14, 0.24)' },
      { x: 0.5, y: 0.45, rx: 18, ry: 5, c: 'rgba(90, 40, 10, 0.26)' },
      { x: 0.7, y: 0.58, rx: 22, ry: 6, c: 'rgba(120, 53, 15, 0.24)' },
      { x: 0.88, y: 0.42, rx: 16, ry: 5, c: 'rgba(146, 64, 14, 0.22)' },
    ]
    for (const m of mottles) {
      const oval = this.makeOval(m.rx, m.ry, m.c)
      oval.centerX = sceneLeft + sceneW * m.x
      oval.centerY = this.groundTop + 20 + m.y * (groundH - 26)
      details.addChild(oval)
    }

    // Evenly spaced rocks across the soil band (below icon centers)
    const rockXs = [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95]
    rockXs.forEach((fx, i) => {
      const scale = 0.7 + (i % 3) * 0.18
      const rot = ((i * 37) % 50 - 25) * (Math.PI / 180)
      const rock = this.makeRock(scale, rot)
      rock.centerX = sceneLeft + sceneW * fx
      rock.centerY = this.groundTop + 38 + (i % 3) * 6
      details.addChild(rock)
    })
    this.addChild(details)
  }

  /**
   * Flat-design rock: irregular polygon + two-tone shade (light from upper-right).
   */
  private makeRock(scale: number, rotation: number): Node {
    const s = 7 * scale
    // Uneven 6-vertex blob (not a circle)
    const verts = [
      { x: -s * 0.95, y: -s * 0.15 },
      { x: -s * 0.35, y: -s * 0.85 },
      { x: s * 0.55, y: -s * 0.7 },
      { x: s * 1.05, y: s * 0.05 },
      { x: s * 0.4, y: s * 0.75 },
      { x: -s * 0.5, y: s * 0.65 },
    ]
    const baseShape = new Shape()
    baseShape.moveTo(verts[0]!.x, verts[0]!.y)
    for (let i = 1; i < verts.length; i++) {
      baseShape.lineTo(verts[i]!.x, verts[i]!.y)
    }
    baseShape.close()

    const wrap = new Node({ pickable: false })
    const shadow = this.makeOval(s * 1.15, s * 0.38, 'rgba(15,23,42,0.32)')
    shadow.centerY = s * 0.55
    wrap.addChild(shadow)

    wrap.addChild(
      new Path(baseShape, {
        fill: '#6b6560',
        stroke: '#4a4541',
        lineWidth: 0.9,
        pickable: false,
      }),
    )
    // Lighter face toward upper-right (sun direction)
    const hi = new Shape()
    hi.moveTo(-s * 0.15, -s * 0.55)
    hi.lineTo(s * 0.45, -s * 0.55)
    hi.lineTo(s * 0.75, -s * 0.05)
    hi.lineTo(s * 0.15, s * 0.15)
    hi.close()
    wrap.addChild(
      new Path(hi, {
        fill: 'rgba(168, 162, 158, 0.85)',
        pickable: false,
      }),
    )
    wrap.rotation = rotation
    return wrap
  }

  /** Thin tapered curved blade (flat-design, not a blob). */
  private makeBlade(height: number, lean: number, color: string): Path {
    const base = Math.max(1.1, height * 0.12)
    const shape = new Shape()
    shape.moveTo(-base, 0)
    shape.quadraticCurveTo(lean * 0.35 - base * 0.2, -height * 0.45, lean, -height)
    shape.quadraticCurveTo(lean * 0.5 + base * 0.15, -height * 0.4, base, 0)
    shape.close()
    return new Path(shape, { fill: color, pickable: false })
  }

  /** Clump of 3–5 thin blades with soft ground shadow. */
  private makeGrassTuft(baseH: number, seed: number): Node {
    const greens = ['#86efac', '#4ade80', '#22c55e']
    const tuft = new Node({ pickable: false })
    const bladeCount = 3 + (seed % 3)
    const shadow = this.makeOval(5 + bladeCount, 1.6, 'rgba(15,23,42,0.28)')
    shadow.centerY = 1.2
    tuft.addChild(shadow)
    for (let i = 0; i < bladeCount; i++) {
      const h = baseH * (0.6 + ((seed + i * 3) % 5) * 0.08)
      const lean = ((i - (bladeCount - 1) / 2) * 2.2) + ((seed + i) % 3 - 1) * 0.6
      const blade = this.makeBlade(h, lean, greens[(seed + i) % greens.length]!)
      tuft.addChild(blade)
    }
    return tuft
  }

  /** Even grass-strip clumps: thin tapered blades only. */
  private buildGrassTexture(sceneLeft: number, sceneW: number): void {
    const clumpCount = 11
    for (let i = 0; i < clumpCount; i++) {
      const baseH = 9 + (i % 4)
      const tuft = this.makeGrassTuft(baseH, i * 5)
      const x = sceneLeft + 14 + (i / (clumpCount - 1)) * (sceneW - 28)
      tuft.x = x
      tuft.y = this.groundTop + 14
      const baseRot = ((i % 5) - 2) * 0.03
      tuft.rotation = baseRot
      this.grassBlades.push({
        node: tuft,
        phase: i * 0.85,
        amp: 0.035 + (i % 3) * 0.01,
        baseRot,
      })
      this.addChild(tuft)
    }
  }

  /** Even ambient grass tufts across open ground — no hybrid flower dots. */
  private buildAmbientGround(sceneLeft: number, sceneW: number): void {
    // Place tufts in open bands: before trees, mid gap, after factories
    const tuftXs = [0.03, 0.38, 0.43, 0.48, 0.53, 0.63, 0.97]
    tuftXs.forEach((fx, i) => {
      const tuft = this.makeGrassTuft(11 + (i % 3), i * 7 + 2)
      tuft.centerX = sceneLeft + sceneW * fx
      tuft.y = this.groundTop + 26 + (i % 2) * 3
      this.ambientLayer.addChild(tuft)
    })
  }

  private updateGrassSway(): void {
    const t = this.animTime
    for (const blade of this.grassBlades) {
      blade.node.rotation = blade.baseRot + Math.sin(t * 1.6 + blade.phase) * blade.amp
    }
  }

  private buildGroundProps(sceneLeft: number, sceneW: number): void {
    const cy = this.groundTop + 28
    // Trees stay on the LEFT — center stays open for sunlight / heat rays
    this.addGroundIcon(this.treeLayer, 'tree', 46, sceneLeft + sceneW * 0.08, cy)
    this.addGroundIcon(this.treeLayer, 'tree', 40, sceneLeft + sceneW * 0.14, cy + 2)
    this.addGroundIcon(this.treeLayer, 'grass', 32, sceneLeft + sceneW * 0.2, cy + 4)
    this.addGroundIcon(this.treeLayer, 'tree', 42, sceneLeft + sceneW * 0.26, cy)
    this.addGroundIcon(this.treeLayer, 'tree', 38, sceneLeft + sceneW * 0.32, cy + 3)

    // Earth + factories on the RIGHT (next to the temperature chip)
    this.addGroundIcon(this.groundScene, 'earth', 48, sceneLeft + sceneW * 0.58, cy + 2)
    this.addGroundIcon(this.factoryLayer, 'factory', 42, sceneLeft + sceneW * 0.7, cy)
    this.addGroundIcon(this.factoryLayer, 'factory', 40, sceneLeft + sceneW * 0.8, cy + 2)
    this.addGroundIcon(this.factoryLayer, 'factory', 44, sceneLeft + sceneW * 0.9, cy)
  }

  /**
   * Scenario buttons drive the ground scene (not just numbers).
   * "Cut fewer trees" keeps/more trees (matches the button meaning).
   */
  private applyScenarioGround(): void {
    const id = this.model.scenarioIdProperty.value
    const trees = this.treeLayer.children
    const factories = this.factoryLayer.children
    // Each prop is shadow+icon pairs — toggle by index groups of 2
    const showTreePairs = (n: number) => {
      const pairs = Math.floor(trees.length / 2)
      for (let i = 0; i < pairs; i++) {
        const on = i < n
        trees[i * 2]!.visible = on
        trees[i * 2 + 1]!.visible = on
      }
    }
    const showFactoryPairs = (n: number) => {
      const pairs = Math.floor(factories.length / 2)
      for (let i = 0; i < pairs; i++) {
        const on = i < n
        factories[i * 2]!.visible = on
        factories[i * 2 + 1]!.visible = on
      }
    }

    if (id === 'factories') {
      showTreePairs(1)
      showFactoryPairs(3)
    }
    else if (id === 'clean') {
      showTreePairs(5)
      showFactoryPairs(0)
    }
    else if (id === 'trees') {
      showTreePairs(5)
      showFactoryPairs(1)
    }
    else {
      // today — balanced baseline
      showTreePairs(3)
      showFactoryPairs(1)
    }
  }

  /** Rays always use the same origin coordinates as the sun icon. */
  private rebuildSunRays(): void {
    const ox = this.sunOriginX
    const oy = this.sunOriginY
    for (let i = 0; i < this.sunRays.length; i++) {
      const t = this.beamTargets[i]!
      this.sunRays[i]!.shape = new Shape().moveTo(ox, oy).lineTo(t.x, t.y)
    }
  }

  private layoutGasParticles(co2: number): void {
    const active = Math.round(5 + co2 * (GAS_PARTICLE_POOL - 5))
    const left = this.bandLeft + 10
    const top = this.bandMinTop + 8
    const w = this.bandWidth - 36
    const h = Math.max(20, this.ghgBand.getRectHeight() - 16)
    for (let i = 0; i < this.gasParticles.length; i++) {
      const p = this.gasParticles[i]!
      if (i >= active) {
        p.visible = false
        continue
      }
      p.visible = true
      const col = i % 5
      const row = Math.floor(i / 5)
      p.centerX = left + (col + 0.5) * (w / 5) + (i % 2) * 5
      p.centerY = top + (row + 0.35) * (h / Math.max(1, Math.ceil(active / 5)))
      p.setRadius(2.4 + (i % 3) * 0.8)
      p.opacity = 0.4 + co2 * 0.55
    }
  }

  private buildLegend(left: number, top: number): Node {
    const rows: { stroke: string; dash?: number[]; label: string; swatch?: 'dot' }[] = [
      { stroke: 'rgba(250,204,21,0.9)', label: 'Sunlight in' },
      { stroke: 'rgba(239,68,68,0.9)', label: 'Heat moving (red dots)', swatch: 'dot' },
      { stroke: 'rgba(251,146,60,0.9)', dash: [5, 4], label: 'Escapes to space' },
    ]
    const bg = new Rectangle(0, 0, 188, 72, {
      cornerRadius: 8,
      fill: 'rgba(8, 18, 32, 0.88)',
      stroke: 'rgba(255,255,255,0.2)',
      lineWidth: 1,
      pickable: false,
    })
    const title = new Text('Key', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#cbd5e1',
      left: 8,
      top: 6,
      pickable: false,
    })
    const node = new Node({ children: [bg, title], left, top, pickable: false })
    rows.forEach((row, i) => {
      const y = 26 + i * 15
      if (row.swatch === 'dot') {
        node.addChild(
          new Circle(4, {
            fill: row.stroke,
            stroke: '#fff',
            lineWidth: 0.8,
            left: 10,
            centerY: y,
            pickable: false,
          }),
        )
      }
      else {
        node.addChild(
          new Line(10, y, 34, y, {
            stroke: row.stroke,
            lineWidth: 2.5,
            lineDash: row.dash,
            pickable: false,
          }),
        )
      }
      node.addChild(
        new Text(row.label, {
          font: new PhetFont(11),
          fill: '#e2e8f0',
          left: 40,
          centerY: y,
          pickable: false,
        }),
      )
    })
    return node
  }

  private rebuildHeatPaths(co2: number): void {
    const s = this.sceneBounds
    const groundY = this.groundTop - 4
    const hitY = this.ghgBand.bottom - 2
    const midX = this.bandLeft + this.bandWidth * 0.5
    const leftX = s.left + s.width * 0.38
    const rightX = s.left + s.width * 0.52

    this.risePath.shape = new Shape().moveTo(leftX, groundY).lineTo(midX - 10, hitY)
    this.trapPath.shape = new Shape().moveTo(midX + 10, hitY).lineTo(rightX, groundY - 8)

    const escapeOn = co2 < 0.42
    this.escapePath.visible = escapeOn
    this.escapeArrow.visible = escapeOn
    this.escapeLabel.visible = escapeOn
    if (escapeOn) {
      const x0 = midX
      const y0 = this.ghgBand.top + 2
      const x1 = midX + 6
      const y1 = s.top + 52
      this.escapePath.shape = new Shape().moveTo(x0, y0).lineTo(x1, y1)
      const arrow = new Shape()
      arrow.moveTo(x1, y1 - 12)
      arrow.lineTo(x1 - 10, y1 + 2)
      arrow.lineTo(x1 + 10, y1 + 2)
      arrow.close()
      this.escapeArrow.shape = arrow
      this.escapeLabel.left = x1 + 16
      this.escapeLabel.centerY = (y0 + y1) * 0.5
    }

    this.trapPath.opacity = 0.45 + co2 * 0.55
    this.risePath.opacity = 0.55 + co2 * 0.35
  }

  private updateGuidance(): void {
    const m = this.model
    const co2 = m.co2LevelProperty.value
    const scenario = WARMING_SCENARIOS.find(s => s.id === m.scenarioIdProperty.value)
    this.guide.setGuidance(
      'Explore the greenhouse effect',
      scenario
        ? scenario.blurb
        : 'Drag the gas blanket, or try a story below, to see how CO₂ changes Earth’s temperature.',
    )
    const reflectPct = Math.round(m.getReflection() * 100)
    this.teachingTriad.setTriad(
      `Gas blanket is ${Math.round(co2 * 100)}% thick — ${reflectPct}% of sunlight is reflected by clouds/albedo.`,
      m.tipProperty.value,
      co2 < 0.5
        ? 'Try “Burn fossil fuels” to watch CO₂ and temperature climb.'
        : 'Try “Cleaner air”, or raise cloud cover, to help Earth cool back down.',
    )
  }

  private showQuiz(): void {
    this.miniQuiz.showQuiz(
      'Which gas is the main greenhouse gas warming Earth today?',
      [
        { label: 'Carbon dioxide (CO₂)', correct: true },
        { label: 'Oxygen (O₂)', correct: false },
        { label: 'Nitrogen (N₂)', correct: false },
      ],
      correct => (correct ? this.sounds.correct() : this.sounds.wrong()),
    )
  }

  public override step(dt: number): void {
    this.model.step(dt)
    const running = this.model.runningProperty.value
    if (running && dt > 0) {
      this.animTime += dt * this.model.simSpeedProperty.value
    }

    const targetHeat = clamp((this.model.temperatureProperty.value - 10) / 28, 0, 1)
    this.visualHeat = damp(this.visualHeat, targetHeat, 4, dt)
    this.visualCo2 = damp(this.visualCo2, this.model.co2LevelProperty.value, 6, dt)

    this.updateSky(false)
    this.updateReflection()
    this.updateNightOverlay(dt)
    this.updateTemperatureSpike()
    this.particles.step(dt)
    if (running) {
      this.updateHeatDots()
      this.updateGasDrift()
      this.updateSmoke()
      this.updateClouds()
      this.updateGrassSway()
      this.sunGlow.opacity = 0.45 + 0.2 * Math.sin(this.animTime * 1.2)
    }
  }

  /** Clouds/albedo reflect sunlight away — dim the beams so the knobs feel connected to the scene. */
  private updateReflection(): void {
    const reflection = this.model.getReflection()
    const rayOpacity = clamp(0.65 - reflection * 0.35, 0.15, 0.65)
    for (const ray of this.sunRays) {
      ray.opacity = rayOpacity
    }
  }

  /** Auto day toggle dims the whole scene on a slow day/night cycle. */
  private updateNightOverlay(dt: number): void {
    if (!this.model.autoDayProperty.value) {
      this.nightOverlay.opacity = damp(this.nightOverlay.opacity, 0, 6, Math.max(dt, 0.001))
      return
    }
    const dayPhase = 0.5 + 0.5 * Math.sin(this.model.timeProperty.value * 0.6)
    this.nightOverlay.opacity = (1 - dayPhase) * 0.4
  }

  /** Burst warm particles near the temperature chip whenever Earth heats up quickly. */
  private updateTemperatureSpike(): void {
    const temp = this.model.temperatureProperty.value
    if (temp - this.lastBurstTemp >= 2.5) {
      this.lastBurstTemp = temp
      const intensity = Math.max(0, this.model.particleIntensityProperty.value)
      if (intensity > 0) {
        this.particles.burst(this.tempBg.centerX, this.tempBg.top, {
          count: Math.round(14 * intensity),
          color: '#f87171',
          speed: 90,
          life: 0.6,
          radius: 3.5,
        })
      }
      this.sounds.softClick()
    }
    else if (temp < this.lastBurstTemp - 0.5) {
      this.lastBurstTemp = temp
    }
  }

  private updateSky(force: boolean): void {
    const heat = this.visualHeat
    if (!force && Math.abs(heat - this.lastSkyHeat) < 0.03) return
    this.lastSkyHeat = heat

    const top = Color.interpolateRGBA(new Color(40, 90, 150), new Color(130, 45, 80), heat)
    const bottom = Color.interpolateRGBA(new Color(170, 130, 55), new Color(240, 95, 40), heat)
    const s = this.sceneBounds
    this.sky.fill = new LinearGradient(0, s.top, 0, s.top + s.height)
      .addColorStop(0, top)
      .addColorStop(1, bottom)
    this.hills.fill = Color.interpolateRGBA(
      new Color('#22643c'),
      new Color('#50321e'),
      heat,
    ).withAlpha(0.4)
    const groundH = s.top + s.height - this.groundTop
    this.soil.fill = new LinearGradient(0, this.groundTop, 0, this.groundTop + groundH)
      .addColorStop(0, Color.interpolateRGBA(new Color(161, 98, 7), new Color(220, 80, 30), heat))
      .addColorStop(0.45, Color.interpolateRGBA(new Color(146, 64, 14), new Color(180, 60, 20), heat))
      .addColorStop(1, Color.interpolateRGBA(new Color(120, 53, 15), new Color(127, 29, 29), heat))
    this.grass.fill = new LinearGradient(0, this.groundTop, 0, this.groundTop + 16)
      .addColorStop(0, Color.interpolateRGBA(new Color(74, 222, 128), new Color(202, 138, 4), heat))
      .addColorStop(0.55, Color.interpolateRGBA(new Color(34, 197, 94), new Color(180, 120, 20), heat))
      .addColorStop(1, Color.interpolateRGBA(new Color(21, 128, 61), new Color(120, 53, 15), heat))
    this.soilUnderGrass.fill = heat > 0.55
      ? 'rgba(80, 20, 8, 0.5)'
      : 'rgba(69, 26, 3, 0.45)'
  }

  private updateHeatDots(): void {
    const co2 = this.visualCo2
    const groundY = this.groundTop - 4
    const hitY = this.ghgBand.bottom - 2
    const s = this.sceneBounds
    const midX = this.bandLeft + this.bandWidth * 0.5
    const leftX = s.left + s.width * 0.38
    const rightX = s.left + s.width * 0.52
    const t = this.animTime

    for (let i = 0; i < this.heatDots.length; i++) {
      const dot = this.heatDots[i]!
      // Continuous travel: up the rise path, then back down the trap path
      const cycle = (t * 0.45 + i * 0.25) % 1
      if (cycle < 0.55) {
        const u = cycle / 0.55
        dot.centerX = lerp(leftX, midX - 10, u)
        dot.centerY = lerp(groundY, hitY, u)
        dot.fill = '#fca5a5'
        dot.visible = true
      }
      else {
        const u = (cycle - 0.55) / 0.45
        const bounce = 0.4 + co2 * 0.6
        if (u > bounce) {
          // Escaped when blanket is thin
          dot.visible = co2 >= 0.35
          if (!dot.visible) continue
        }
        else {
          dot.visible = true
        }
        const v = Math.min(1, u / Math.max(0.25, bounce))
        dot.centerX = lerp(midX + 10, rightX, v)
        dot.centerY = lerp(hitY, groundY - 8, v)
        dot.fill = '#ef4444'
      }
      dot.opacity = 0.6 + co2 * 0.35
    }
  }

  private updateGasDrift(): void {
    const co2 = this.visualCo2
    const t = this.animTime
    const top = this.bandMinTop + 8
    const h = Math.max(16, this.ghgBand.getRectHeight() - 16)
    for (let i = 0; i < this.gasParticles.length; i++) {
      const p = this.gasParticles[i]!
      if (!p.visible) continue
      p.centerX += Math.sin(t * 0.7 + i * 1.3) * 0.15
      p.centerY = clamp(
        p.centerY + Math.cos(t * 0.5 + i) * 0.12,
        top,
        top + h,
      )
      p.opacity = 0.3 + co2 * 0.55 + 0.1 * Math.sin(t + i)
    }
  }

  private updateClouds(): void {
    const s = this.sceneBounds
    const coverage = this.model.cloudCoverProperty.value
    for (let i = 0; i < this.clouds.length; i++) {
      const cloud = this.clouds[i]!
      const base = this.cloudBaseX[i]!
      const drift = ((this.animTime * (4 + i * 1.5) + i * 40) % (s.width + 80)) - 40
      cloud.centerX = s.left + ((base - s.left + drift) % (s.width + 60))
      cloud.opacity = (0.16 + coverage * 0.62) * (0.85 + 0.15 * Math.sin(this.animTime * 0.4 + i))
    }
  }

  private updateSmoke(): void {
    const id = this.model.scenarioIdProperty.value
    const co2 = this.visualCo2
    const show = id === 'factories' || (id === 'today' && co2 >= 0.45) || co2 >= 0.7
    const s = this.sceneBounds
    const factoryXs =
      id === 'factories'
        ? [s.left + s.width * 0.7, s.left + s.width * 0.8, s.left + s.width * 0.9]
        : [s.left + s.width * 0.8]
    const fy = this.groundTop + 4
    for (let i = 0; i < this.smokePuffs.length; i++) {
      const puff = this.smokePuffs[i]!
      if (!show) {
        puff.visible = false
        continue
      }
      puff.visible = true
      const fx = factoryXs[i % factoryXs.length]!
      const u = (this.animTime * 0.22 + i * 0.18) % 1
      puff.setRadius(5 + u * 6)
      puff.centerX = fx + Math.sin(u * 5 + i) * 6
      puff.centerY = fy - u * 48
      puff.opacity = 0.4 * (1 - u) * (id === 'factories' ? 1 : Math.min(1, co2))
    }
  }
}
