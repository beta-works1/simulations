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
import { WarmingStrings } from '../WarmingStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SUN_RAY_COUNT = 7
const IR_RAY_MAX = 9

export class WarmingScreenView extends ScreenView {
  private readonly model: WarmingModel

  private readonly sky: Rectangle
  private readonly sunGlow: Circle
  private readonly sunCore: Circle
  private readonly sunRays: Path[] = []
  private readonly ghgBand: Rectangle
  private readonly ghgHandle: Node
  private readonly irRays: Path[] = []
  private readonly ground: Rectangle
  private readonly shimmer: Rectangle
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

  public constructor(model: WarmingModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

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

    // Scene clip / sky
    this.sky = new Rectangle(sceneLeft, sceneTop, sceneW, sceneH, {
      fill: '#38bdf8',
      cornerRadius: 14,
      stroke: 'rgba(255,255,255,0.14)',
      lineWidth: 1,
    })
    this.addChild(this.sky)

    this.sunX = sceneLeft + sceneW * 0.18
    this.sunY = sceneTop + sceneH * 0.2

    this.sunGlow = new Circle(40, {
      fill: 'rgba(250,204,21,0.28)',
      centerX: this.sunX,
      centerY: this.sunY,
      pickable: false,
    })
    this.sunCore = new Circle(18, {
      fill: '#facc15',
      stroke: 'rgba(255,255,255,0.55)',
      lineWidth: 2,
      centerX: this.sunX,
      centerY: this.sunY,
      pickable: false,
    })
    this.addChild(this.sunGlow)
    this.addChild(this.sunCore)
    const sunPic = createEcologyIcon('sun', 44)
    sunPic.centerX = this.sunX
    sunPic.centerY = this.sunY
    sunPic.pickable = false
    this.addChild(sunPic)

    const sunLabel = new Text(WarmingStrings.sunStringProperty, {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#0f172a',
      centerX: this.sunX,
      top: this.sunY + 28,
      pickable: false,
    })
    const sunPill = new Rectangle(0, 0, 110, 24, {
      cornerRadius: 8,
      fill: 'rgba(255,255,255,0.7)',
      centerX: this.sunX,
      top: this.sunY + 26,
      pickable: false,
    })
    this.addChild(sunPill)
    this.addChild(sunLabel)
    sunPill.rectWidth = Math.max(110, sunLabel.width + 16)
    sunPill.centerX = this.sunX
    sunLabel.centerX = this.sunX
    sunLabel.centerY = sunPill.centerY

    for (let i = 0; i < SUN_RAY_COUNT; i++) {
      const ray = new Path(null, {
        stroke: 'rgba(250,204,21,0.55)',
        lineWidth: 2.6,
        lineCap: 'round',
        pickable: false,
      })
      this.sunRays.push(ray)
      this.addChild(ray)
    }

    this.groundTop = sceneTop + sceneH * 0.78
    this.bandLeft = sceneLeft + sceneW * 0.3
    this.bandWidth = sceneW * 0.42
    this.bandMinTop = sceneTop + sceneH * 0.28
    this.bandMaxBottom = this.groundTop - 18

    this.ghgBand = new Rectangle(this.bandLeft, this.bandMinTop, this.bandWidth, 40, {
      cornerRadius: 10,
      fill: 'rgba(120,113,108,0.42)',
      stroke: 'rgba(255,255,255,0.35)',
      lineWidth: 1.5,
      cursor: 'ns-resize',
    })
    this.addChild(this.ghgBand)

    const ghgLabel = new Text('Gas blanket — drag thicker', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#fff',
      pickable: false,
    })
    const ghgPill = new Rectangle(0, 0, 190, 24, {
      cornerRadius: 8,
      fill: 'rgba(15,23,42,0.55)',
      pickable: false,
    })
    this.addChild(ghgPill)
    this.addChild(ghgLabel)

    this.ghgHandle = new Node({ cursor: 'ns-resize' })
    this.ghgHandle.addChild(
      new Rectangle(-28, -10, 56, 20, {
        cornerRadius: 10,
        fill: '#e7e5e4',
        stroke: '#fff',
        lineWidth: 2,
      }),
    )
    this.ghgHandle.addChild(
      new Text('↕ thickness', {
        font: new PhetFont({ size: 10, weight: 'bold' }),
        fill: '#334155',
        centerX: 0,
        centerY: 0,
        pickable: false,
      }),
    )
    this.addChild(this.ghgHandle)

    const applyBandFromCo2 = (co2: number) => {
      const maxThick = this.bandMaxBottom - this.bandMinTop
      const thick = 28 + co2 * (maxThick - 28)
      const top = this.bandMinTop
      this.ghgBand.setRect(this.bandLeft, top, this.bandWidth, thick)
      this.ghgBand.fill = `rgba(120, 113, 108, ${0.22 + co2 * 0.45})`
      this.ghgHandle.centerX = this.bandLeft + this.bandWidth * 0.5
      this.ghgHandle.centerY = top + thick
      ghgPill.rectWidth = Math.max(190, ghgLabel.width + 16)
      ghgPill.centerX = this.bandLeft + this.bandWidth * 0.5
      ghgPill.centerY = top + Math.min(thick * 0.4, thick - 14)
      ghgLabel.center = ghgPill.center
    }
    applyBandFromCo2(model.co2LevelProperty.value)

    const dragBand = (y: number) => {
      const maxThick = this.bandMaxBottom - this.bandMinTop
      const thick = clamp(y - this.bandMinTop, 28, maxThick)
      const co2 = clamp((thick - 28) / Math.max(1, maxThick - 28), 0.05, 1)
      this.syncingCo2 = true
      model.setCo2(co2)
      this.syncingCo2 = false
      applyBandFromCo2(co2)
    }

    this.ghgBand.addInputListener(
      new DragListener({
        drag: event => {
          const pt = this.globalToLocalPoint(event.pointer.point)
          dragBand(pt.y)
        },
      }),
    )
    this.ghgHandle.addInputListener(
      new DragListener({
        drag: event => {
          const pt = this.globalToLocalPoint(event.pointer.point)
          dragBand(pt.y)
        },
      }),
    )

    model.co2LevelProperty.link(co2 => {
      if (!this.syncingCo2) applyBandFromCo2(co2)
      this.visualCo2 = co2
    })

    for (let i = 0; i < IR_RAY_MAX; i++) {
      const ray = new Path(null, {
        stroke: 'rgba(239,68,68,0.75)',
        lineWidth: 2.4,
        lineCap: 'round',
        pickable: false,
      })
      this.irRays.push(ray)
      this.addChild(ray)
    }

    const irLabel = new Text(WarmingStrings.infraredStringProperty, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#fff',
      pickable: false,
    })
    const irPill = new Rectangle(0, 0, 120, 24, {
      cornerRadius: 8,
      fill: 'rgba(185,28,28,0.6)',
      right: sceneLeft + sceneW - 10,
      top: this.groundTop - 90,
      pickable: false,
    })
    this.addChild(irPill)
    this.addChild(irLabel)
    irPill.rectWidth = Math.max(120, irLabel.width + 16)
    irPill.right = sceneLeft + sceneW - 10
    irLabel.center = irPill.center

    this.ground = new Rectangle(sceneLeft, this.groundTop, sceneW, sceneTop + sceneH - this.groundTop, {
      fill: '#a16207',
    })
    this.shimmer = new Rectangle(sceneLeft, this.groundTop - 10, sceneW, 18, {
      fill: 'rgba(251,146,60,0.25)',
      pickable: false,
    })
    this.addChild(this.ground)
    this.addChild(this.shimmer)

    const earth = createEcologyIcon('earth', 52)
    earth.centerX = sceneLeft + sceneW * 0.5
    earth.centerY = this.groundTop + 34
    earth.pickable = false
    this.addChild(earth)

    const treeL = createEcologyIcon('tree', 38)
    treeL.centerX = sceneLeft + sceneW * 0.2
    treeL.centerY = this.groundTop + 30
    treeL.pickable = false
    this.addChild(treeL)

    const grass = createEcologyIcon('grass', 32)
    grass.centerX = sceneLeft + sceneW * 0.32
    grass.centerY = this.groundTop + 32
    grass.pickable = false
    this.addChild(grass)

    const factory = createEcologyIcon('factory', 42)
    factory.centerX = sceneLeft + sceneW * 0.78
    factory.centerY = this.groundTop + 30
    factory.pickable = false
    this.addChild(factory)

    const treeR = createEcologyIcon('tree', 34)
    treeR.centerX = sceneLeft + sceneW * 0.9
    treeR.centerY = this.groundTop + 30
    treeR.pickable = false
    this.addChild(treeR)

    // NOW / Why teaching cards (left of scene — never cover the gas band handle)
    this.tipText = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#fde68a',
      maxWidth: sceneW * 0.48,
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
      maxWidth: sceneW * 0.48,
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
      whyBg.rectWidth = Math.min(sceneW * 0.5, this.whyText.width + 18)
      whyBg.rectHeight = this.whyText.height + 12
      this.whyText.center = whyBg.center
      this.whyCard.left = sceneLeft + 10
      this.whyCard.top = sceneTop + 10
      this.whyCard.visible = show

      this.tipText.string = model.tipProperty.value
      tipBg.rectWidth = Math.min(sceneW * 0.5, this.tipText.width + 18)
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
      new WarmingControlPanel(model, {
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
    this.updateIrRays()
    this.updateGround()

    this.sunGlow.opacity = 0.55 + 0.35 * Math.sin(this.animTime * 1.6)
    this.sunGlow.setRadius(36 + 5 * Math.sin(this.animTime * 1.2))
  }

  private updateSky(): void {
    const heat = this.visualHeat
    const top = Color.interpolateRGBA(new Color(40, 90, 150), new Color(130, 45, 80), heat)
    const bottom = Color.interpolateRGBA(new Color(170, 130, 55), new Color(240, 95, 40), heat)
    const s = this.sceneBounds
    this.sky.fill = new LinearGradient(0, s.top, 0, s.top + s.height)
      .addColorStop(0, top)
      .addColorStop(1, bottom)
  }

  private updateSunRays(): void {
    const t = this.animTime
    const s = this.sceneBounds
    for (let i = 0; i < SUN_RAY_COUNT; i++) {
      const phase = (t * 0.35 + i * 0.14) % 1
      const y0 = this.sunY + 18
      const y1 = lerp(s.top + s.height * 0.14, this.groundTop - 8, (i + 0.5) / SUN_RAY_COUNT)
      const x1 = s.left + s.width * 0.52 + Math.sin(phase * Math.PI * 2 + i) * 8
      this.sunRays[i]!.shape = new Shape().moveTo(this.sunX + 22, y0).lineTo(x1, y1)
      this.sunRays[i]!.opacity = 0.35 + 0.35 * Math.sin(t * 2 + i)
    }
  }

  private updateIrRays(): void {
    const co2 = this.visualCo2
    const bounce = Math.floor(2 + co2 * 7)
    const bandBottom = this.ghgBand.bottom
    const t = this.model.timeProperty.value
    const s = this.sceneBounds

    for (let i = 0; i < IR_RAY_MAX; i++) {
      const ray = this.irRays[i]!
      if (i >= bounce) {
        ray.visible = false
        continue
      }
      ray.visible = true
      const cycle = (t * 0.45 + i * 0.28) % 1
      const startX = s.left + s.width * 0.68 + (i % 3) * 16
      const baseY =
        this.groundTop - 12 - ((i * 41 + t * 50) % Math.max(40, this.groundTop - bandBottom - 30))
      if (cycle < 0.5) {
        const u = cycle / 0.5
        const x = lerp(startX, this.bandLeft + this.bandWidth * 0.55, u)
        const y = lerp(baseY, bandBottom + 4, u)
        ray.shape = new Shape().moveTo(startX, baseY).lineTo(x, y)
      }
      else {
        const u = (cycle - 0.5) / 0.5
        const midX = this.bandLeft + this.bandWidth * 0.55
        const midY = bandBottom + 4
        const endX = midX + Math.sin(u * Math.PI) * (28 + co2 * 36)
        const endY = lerp(midY, this.groundTop - 8, u)
        ray.shape = new Shape().moveTo(midX, midY).lineTo(endX, endY)
      }
      ray.opacity = 0.45 + 0.4 * Math.sin(t + i) * (0.5 + co2 * 0.5)
    }
  }

  private updateGround(): void {
    const heat = this.visualHeat
    this.ground.fill = Color.interpolateRGBA(new Color(161, 98, 7), new Color(220, 80, 30), heat)
    this.shimmer.opacity = 0.2 + heat * 0.55 + 0.15 * Math.sin(this.animTime * 4)
    this.shimmer.y = Math.sin(this.animTime * 3) * 2
  }
}
