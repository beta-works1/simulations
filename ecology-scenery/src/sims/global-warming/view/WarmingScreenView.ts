import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import {
  Circle,
  Color,
  DragListener,
  LinearGradient,
  Node,
  Path,
  Rectangle,
  Text,
} from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont } from 'scenerystack/scenery-phet'
import { WarmingModel } from '../model/WarmingModel.js'
import { clamp, damp, lerp } from '../../../shared/EcologyConstants.js'
import { createEcologyIcon } from '../../../shared/EcologyArt.js'
import { WarmingControlPanel } from './WarmingControlPanel.js'
import { WarmingSounds } from './WarmingSounds.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SUN_RAY_COUNT = 6
const HEAT_RAY_MAX = 8

export class WarmingScreenView extends ScreenView {
  private readonly model: WarmingModel
  private readonly sounds: WarmingSounds

  private readonly sky: Rectangle
  private readonly hills: Path
  private readonly sunGlow: Circle
  private readonly sunNode: Node
  private readonly sunRays: Path[] = []
  private readonly heatRays: Path[] = []
  private readonly escapeRays: Path[] = []
  private readonly smokeLayer: Node
  private readonly ghgBand: Rectangle
  private readonly ghgHandle: Node
  private readonly ground: Rectangle
  private readonly shimmer: Rectangle
  private readonly tempChip: Text
  private readonly tipCard: Node
  private readonly tipText: Text
  private readonly whyCard: Node
  private readonly whyText: Text
  private readonly sceneBounds: { left: number; top: number; width: number; height: number }
  private readonly sunX: number
  private readonly sunY: number
  private readonly bandLeft: number
  private readonly bandWidth: number
  private readonly bandMinTop: number
  private readonly bandMaxBottom: number
  private readonly groundTop: number

  private visualHeat = 0.2
  private visualCo2 = 0.4
  private animTime = 0
  private syncingCo2 = false
  private lastBandSound = 0

  public constructor(model: WarmingModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    this.sounds = new WarmingSounds()
    this.sounds.warm()
    this.sounds.setEnabled(model.soundEnabledProperty.value)
    model.soundEnabledProperty.link(on => this.sounds.setEnabled(on))

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
      stroke: 'rgba(125, 211, 252, 0.35)',
      lineWidth: 1,
    })
    this.addChild(statusBg)
    this.addChild(
      new Text(model.statusProperty, {
        font: new PhetFont(13),
        fill: '#ecfeff',
        maxWidth: b.width - margin * 4,
        centerX: b.centerX,
        centerY: statusBg.centerY,
      }),
    )

    this.sky = new Rectangle(sceneLeft, sceneTop, sceneW, sceneH, {
      fill: '#38bdf8',
      cornerRadius: 14,
      stroke: 'rgba(255,255,255,0.14)',
      lineWidth: 1,
    })
    this.addChild(this.sky)

    // Distant hills for depth
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
    this.hills = new Path(hillShape, { fill: 'rgba(34, 100, 60, 0.45)', pickable: false })
    this.addChild(this.hills)

    // One sun only: soft glow + illustrated icon (no second yellow ball)
    this.sunX = sceneLeft + sceneW * 0.78
    this.sunY = sceneTop + sceneH * 0.16
    this.sunGlow = new Circle(34, {
      fill: 'rgba(250,204,21,0.3)',
      centerX: this.sunX,
      centerY: this.sunY,
      pickable: false,
    })
    this.addChild(this.sunGlow)
    this.sunNode = createEcologyIcon('sun', 52)
    this.sunNode.centerX = this.sunX
    this.sunNode.centerY = this.sunY
    this.sunNode.pickable = false
    this.addChild(this.sunNode)

    const sunPill = new Rectangle(0, 0, 120, 24, {
      cornerRadius: 8,
      fill: 'rgba(15,23,42,0.72)',
      centerX: this.sunX,
      top: this.sunY + 30,
      pickable: false,
    })
    const sunLabel = new Text('1. Sunlight in', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#fde68a',
      center: sunPill.center,
      pickable: false,
    })
    this.addChild(sunPill)
    this.addChild(sunLabel)
    sunPill.rectWidth = Math.max(120, sunLabel.width + 16)
    sunPill.centerX = this.sunX
    sunLabel.center = sunPill.center

    for (let i = 0; i < SUN_RAY_COUNT; i++) {
      const ray = new Path(null, {
        stroke: 'rgba(250,204,21,0.65)',
        lineWidth: 2.8,
        lineCap: 'round',
        pickable: false,
      })
      this.sunRays.push(ray)
      this.addChild(ray)
    }

    this.groundTop = sceneTop + sceneH * 0.76
    this.bandLeft = sceneLeft + sceneW * 0.28
    this.bandWidth = sceneW * 0.44
    this.bandMinTop = sceneTop + sceneH * 0.3
    this.bandMaxBottom = this.groundTop - 20

    this.ghgBand = new Rectangle(this.bandLeft, this.bandMinTop, this.bandWidth, 40, {
      cornerRadius: 12,
      fill: 'rgba(120,113,108,0.42)',
      stroke: 'rgba(255,255,255,0.4)',
      lineWidth: 2,
      cursor: 'ns-resize',
    })
    this.addChild(this.ghgBand)

    const ghgLabel = new Text('3. Gas blanket — drag ↕', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#fff',
      pickable: false,
    })
    const ghgPill = new Rectangle(0, 0, 200, 26, {
      cornerRadius: 8,
      fill: 'rgba(15,23,42,0.6)',
      pickable: false,
    })
    this.addChild(ghgPill)
    this.addChild(ghgLabel)

    this.ghgHandle = new Node({ cursor: 'ns-resize' })
    this.ghgHandle.addChild(
      new Rectangle(-36, -12, 72, 24, {
        cornerRadius: 12,
        fill: '#f8fafc',
        stroke: '#0ea5e9',
        lineWidth: 2.5,
      }),
    )
    this.ghgHandle.addChild(
      new Text('Drag thicker', {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#0f172a',
        centerX: 0,
        centerY: 0,
        pickable: false,
      }),
    )
    this.addChild(this.ghgHandle)

    const applyBandFromCo2 = (co2: number) => {
      const maxThick = this.bandMaxBottom - this.bandMinTop
      const thick = 32 + co2 * (maxThick - 32)
      const top = this.bandMinTop
      this.ghgBand.setRect(this.bandLeft, top, this.bandWidth, thick)
      this.ghgBand.fill = `rgba(100, 90, 80, ${0.25 + co2 * 0.5})`
      this.ghgHandle.centerX = this.bandLeft + this.bandWidth * 0.5
      this.ghgHandle.centerY = top + thick
      ghgPill.rectWidth = Math.max(200, ghgLabel.width + 16)
      ghgPill.centerX = this.bandLeft + this.bandWidth * 0.5
      ghgPill.centerY = top + Math.min(thick * 0.35, thick - 16)
      ghgLabel.center = ghgPill.center
    }
    applyBandFromCo2(model.co2LevelProperty.value)

    const dragBand = (y: number) => {
      const maxThick = this.bandMaxBottom - this.bandMinTop
      const thick = clamp(y - this.bandMinTop, 32, maxThick)
      const co2 = clamp((thick - 32) / Math.max(1, maxThick - 32), 0.05, 1)
      this.syncingCo2 = true
      model.setCo2(co2)
      this.syncingCo2 = false
      applyBandFromCo2(co2)
      const now = Date.now()
      if (now - this.lastBandSound > 90) {
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

    // Heat rays (rise + bounce) and escape rays (to space when blanket is thin)
    for (let i = 0; i < HEAT_RAY_MAX; i++) {
      const ray = new Path(null, {
        stroke: 'rgba(239,68,68,0.8)',
        lineWidth: 2.5,
        lineCap: 'round',
        pickable: false,
      })
      this.heatRays.push(ray)
      this.addChild(ray)
    }
    for (let i = 0; i < 4; i++) {
      const ray = new Path(null, {
        stroke: 'rgba(251,146,60,0.55)',
        lineWidth: 2,
        lineCap: 'round',
        lineDash: [5, 4],
        pickable: false,
      })
      this.escapeRays.push(ray)
      this.addChild(ray)
    }

    const heatUpPill = new Rectangle(0, 0, 130, 24, {
      cornerRadius: 8,
      fill: 'rgba(185,28,28,0.65)',
      left: sceneLeft + 12,
      bottom: this.groundTop - 8,
      pickable: false,
    })
    const heatUpLabel = new Text('2. Heat rises ↑', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#fff',
      center: heatUpPill.center,
      pickable: false,
    })
    this.addChild(heatUpPill)
    this.addChild(heatUpLabel)
    heatUpPill.rectWidth = Math.max(130, heatUpLabel.width + 16)
    heatUpLabel.center = heatUpPill.center

    const trapPill = new Rectangle(0, 0, 150, 24, {
      cornerRadius: 8,
      fill: 'rgba(127,29,29,0.7)',
      right: sceneLeft + sceneW - 12,
      top: this.bandMinTop - 28,
      pickable: false,
    })
    const trapLabel = new Text('Heat trapped ↓', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#fecaca',
      center: trapPill.center,
      pickable: false,
    })
    this.addChild(trapPill)
    this.addChild(trapLabel)
    trapPill.rectWidth = Math.max(150, trapLabel.width + 16)
    trapPill.right = sceneLeft + sceneW - 12
    trapLabel.center = trapPill.center

    this.ground = new Rectangle(sceneLeft, this.groundTop, sceneW, sceneTop + sceneH - this.groundTop, {
      fill: '#a16207',
    })
    this.shimmer = new Rectangle(sceneLeft, this.groundTop - 10, sceneW, 18, {
      fill: 'rgba(251,146,60,0.25)',
      pickable: false,
    })
    this.addChild(this.ground)
    this.addChild(this.shimmer)

    const earth = createEcologyIcon('earth', 56)
    earth.centerX = sceneLeft + sceneW * 0.5
    earth.centerY = this.groundTop + 36
    earth.pickable = false
    this.addChild(earth)

    const treeL = createEcologyIcon('tree', 40)
    treeL.centerX = sceneLeft + sceneW * 0.18
    treeL.centerY = this.groundTop + 32
    treeL.pickable = false
    this.addChild(treeL)

    const grass = createEcologyIcon('grass', 34)
    grass.centerX = sceneLeft + sceneW * 0.3
    grass.centerY = this.groundTop + 34
    grass.pickable = false
    this.addChild(grass)

    const factory = createEcologyIcon('factory', 44)
    factory.centerX = sceneLeft + sceneW * 0.78
    factory.centerY = this.groundTop + 32
    factory.pickable = false
    this.addChild(factory)

    const treeR = createEcologyIcon('tree', 36)
    treeR.centerX = sceneLeft + sceneW * 0.9
    treeR.centerY = this.groundTop + 32
    treeR.pickable = false
    this.addChild(treeR)

    this.smokeLayer = new Node({ pickable: false })
    this.addChild(this.smokeLayer)

    // Temperature chip — 4. Earth warms
    const tempBg = new Rectangle(0, 0, 180, 44, {
      cornerRadius: 12,
      fill: 'rgba(15,23,42,0.88)',
      stroke: 'rgba(251,146,60,0.65)',
      lineWidth: 1.5,
      left: sceneLeft + sceneW / 2 - 90,
      bottom: this.groundTop - 14,
      pickable: false,
    })
    this.tempChip = new Text('4. Earth 15.0 °C', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: '#fdba74',
      center: tempBg.center,
      pickable: false,
    })
    this.addChild(tempBg)
    this.addChild(this.tempChip)

    // Teaching cards — left side, clear of the sun
    this.tipText = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
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
      font: new PhetFont(12),
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
      this.whyText.string = model.whyProperty.value
      whyBg.rectWidth = Math.min(sceneW * 0.44, this.whyText.width + 18)
      whyBg.rectHeight = this.whyText.height + 12
      this.whyText.center = whyBg.center
      this.whyCard.left = sceneLeft + 10
      this.whyCard.top = sceneTop + 10
      this.whyCard.visible = show

      this.tipText.string = model.tipProperty.value
      tipBg.rectWidth = Math.min(sceneW * 0.44, this.tipText.width + 18)
      tipBg.rectHeight = this.tipText.height + 12
      this.tipText.center = tipBg.center
      this.tipCard.left = sceneLeft + 10
      this.tipCard.top = this.whyCard.bottom + 6
      this.tipCard.visible = show
    }
    model.tipProperty.link(refreshTip)
    model.whyProperty.link(refreshTip)
    model.showTipsProperty.link(refreshTip)

    this.addChild(
      new WarmingControlPanel(model, this.sounds, {
        right: b.right - margin,
        top: sceneTop,
        maxWidth: panelW,
        panelMaxHeight: sceneH,
      }),
    )

    this.visualHeat = (model.temperatureProperty.value - 10) / 28
    this.visualCo2 = model.co2LevelProperty.value
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.animTime += dt

    const targetHeat = clamp((this.model.temperatureProperty.value - 10) / 28, 0, 1)
    this.visualHeat = damp(this.visualHeat, targetHeat, 5, dt)
    this.visualCo2 = damp(this.visualCo2, this.model.co2LevelProperty.value, 8, dt)

    this.updateSky()
    this.updateSunRays()
    this.updateHeatRays()
    this.updateGround()
    this.updateSmoke()

    this.tempChip.string = `4. Earth ${this.model.temperatureProperty.value.toFixed(1)} °C`
    this.sunGlow.opacity = 0.5 + 0.3 * Math.sin(this.animTime * 1.5)
    this.sunGlow.setRadius(30 + 4 * Math.sin(this.animTime * 1.2))
  }

  private updateSky(): void {
    const heat = this.visualHeat
    const top = Color.interpolateRGBA(new Color(40, 90, 150), new Color(130, 45, 80), heat)
    const bottom = Color.interpolateRGBA(new Color(170, 130, 55), new Color(240, 95, 40), heat)
    const s = this.sceneBounds
    this.sky.fill = new LinearGradient(0, s.top, 0, s.top + s.height)
      .addColorStop(0, top)
      .addColorStop(1, bottom)
    this.hills.fill = Color.interpolateRGBA(
      new Color(34, 100, 60, 0.45),
      new Color(80, 50, 30, 0.5),
      heat,
    )
  }

  private updateSunRays(): void {
    const t = this.animTime
    const s = this.sceneBounds
    for (let i = 0; i < SUN_RAY_COUNT; i++) {
      const phase = (t * 0.4 + i * 0.15) % 1
      const y0 = this.sunY + 22
      const y1 = lerp(s.top + s.height * 0.2, this.groundTop - 10, (i + 0.4) / SUN_RAY_COUNT)
      const x1 = s.left + s.width * 0.45 + Math.sin(phase * Math.PI * 2 + i) * 10
      this.sunRays[i]!.shape = new Shape().moveTo(this.sunX - 18, y0).lineTo(x1, y1)
      this.sunRays[i]!.opacity = 0.4 + 0.35 * Math.sin(t * 2 + i)
    }
  }

  private updateHeatRays(): void {
    const co2 = this.visualCo2
    const bounceCount = Math.floor(2 + co2 * 6)
    const bandBottom = this.ghgBand.bottom
    const bandTop = this.ghgBand.top
    const t = this.model.timeProperty.value
    const s = this.sceneBounds

    // Rise from ground → hit blanket → bounce back (self-explanatory greenhouse)
    for (let i = 0; i < HEAT_RAY_MAX; i++) {
      const ray = this.heatRays[i]!
      if (i >= bounceCount) {
        ray.visible = false
        continue
      }
      ray.visible = true
      const cycle = (t * 0.5 + i * 0.22) % 1
      const startX = s.left + s.width * 0.35 + (i % 4) * 28
      const groundY = this.groundTop - 6
      const hitX = this.bandLeft + this.bandWidth * (0.25 + (i % 5) * 0.12)
      const hitY = bandBottom - 2

      if (cycle < 0.55) {
        // Rising heat
        const u = cycle / 0.55
        const x = lerp(startX, hitX, u)
        const y = lerp(groundY, hitY, u)
        ray.shape = new Shape().moveTo(startX, groundY).lineTo(x, y)
        ray.stroke = 'rgba(248,113,113,0.85)'
      }
      else {
        // Trapped / bouncing down
        const u = (cycle - 0.55) / 0.45
        const endX = hitX + Math.sin(u * Math.PI + i) * (20 + co2 * 30)
        const endY = lerp(hitY, groundY - 4, u)
        ray.shape = new Shape().moveTo(hitX, hitY).lineTo(endX, endY)
        ray.stroke = 'rgba(239,68,68,0.9)'
      }
      ray.opacity = 0.5 + 0.35 * (0.5 + co2 * 0.5)
    }

    // Thin blanket: some heat escapes to space
    const escapeOn = co2 < 0.45
    for (let i = 0; i < this.escapeRays.length; i++) {
      const ray = this.escapeRays[i]!
      if (!escapeOn) {
        ray.visible = false
        continue
      }
      ray.visible = true
      const u = (t * 0.35 + i * 0.3) % 1
      const x0 = this.bandLeft + this.bandWidth * (0.2 + i * 0.2)
      const y0 = bandTop + 2
      const x1 = x0 + 8
      const y1 = lerp(y0, s.top + 20, u)
      ray.shape = new Shape().moveTo(x0, y0).lineTo(x1, y1)
      ray.opacity = (1 - co2) * 0.55 * (0.4 + 0.6 * Math.sin(t + i))
    }
  }

  private updateGround(): void {
    const heat = this.visualHeat
    this.ground.fill = Color.interpolateRGBA(new Color(161, 98, 7), new Color(220, 80, 30), heat)
    this.shimmer.opacity = 0.2 + heat * 0.55 + 0.15 * Math.sin(this.animTime * 4)
    this.shimmer.y = Math.sin(this.animTime * 3) * 2
  }

  private updateSmoke(): void {
    this.smokeLayer.removeAllChildren()
    const co2 = this.visualCo2
    if (co2 < 0.35) return
    const s = this.sceneBounds
    const fx = s.left + s.width * 0.78
    const fy = this.groundTop + 8
    const n = Math.floor(2 + co2 * 5)
    for (let i = 0; i < n; i++) {
      const u = (this.animTime * 0.25 + i * 0.18) % 1
      this.smokeLayer.addChild(
        new Circle(4 + u * 6, {
          fill: `rgba(148,163,184,${0.35 * (1 - u)})`,
          centerX: fx + Math.sin(u * 6 + i) * 8,
          centerY: fy - u * 50,
          pickable: false,
        }),
      )
    }
  }
}
