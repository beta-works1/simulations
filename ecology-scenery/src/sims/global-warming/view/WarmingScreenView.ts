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
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { WarmingModel } from '../model/WarmingModel.js'
import { EcologyConstants, clamp, damp, lerp } from '../../../shared/EcologyConstants.js'
import { EcologyColors } from '../../../shared/EcologyColors.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { DepthSlider } from '../../../shared/ui/DepthSlider.js'
import { SoftButton } from '../../../shared/ui/SoftButton.js'
import { WarmingStrings } from '../WarmingStrings.js'
import { createEcologyIcon } from '../../../shared/EcologyArt.js'

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
  private readonly tempValue: Text
  private readonly sceneW: number
  private readonly sceneH: number
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

  /** Sync guard so slider ↔ band drag do not fight. */
  private syncingCo2 = false

  public constructor(model: WarmingModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const m = EcologyConstants.SCREEN_VIEW_X_MARGIN
    const my = EcologyConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    this.sceneW = lb.width
    this.sceneH = lb.height

    // Full-bleed sky
    this.sky = new Rectangle(0, 0, this.sceneW, this.sceneH, {
      fill: '#38bdf8',
    })
    this.addChild(this.sky)

    this.sunX = this.sceneW * 0.16
    this.sunY = this.sceneH * 0.18

    this.sunGlow = new Circle(42, {
      fill: 'rgba(250,204,21,0.28)',
      centerX: this.sunX,
      centerY: this.sunY,
      pickable: false,
    })
    this.sunCore = new Circle(22, {
      fill: '#facc15',
      stroke: 'rgba(255,255,255,0.55)',
      lineWidth: 2,
      centerX: this.sunX,
      centerY: this.sunY,
      pickable: false,
    })
    this.addChild(this.sunGlow)
    this.addChild(this.sunCore)
    const sunPic = createEcologyIcon('sun', 48)
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
    // pill behind label
    const sunPill = new Rectangle(0, 0, 52, 22, {
      cornerRadius: 8,
      fill: 'rgba(255,255,255,0.55)',
      centerX: this.sunX,
      top: this.sunY + 26,
      pickable: false,
    })
    this.addChild(sunPill)
    this.addChild(sunLabel)

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

    this.groundTop = this.sceneH * 0.78
    this.bandLeft = this.sceneW * 0.28
    this.bandWidth = this.sceneW * 0.44
    this.bandMinTop = this.sceneH * 0.22
    this.bandMaxBottom = this.groundTop - 20

    // Greenhouse gas band (vertical thickness ↔ co2)
    this.ghgBand = new Rectangle(this.bandLeft, this.bandMinTop, this.bandWidth, 40, {
      cornerRadius: 10,
      fill: 'rgba(120,113,108,0.42)',
      stroke: 'rgba(255,255,255,0.28)',
      lineWidth: 1.5,
      cursor: 'ns-resize',
    })
    this.addChild(this.ghgBand)

    const ghgLabel = new Text(WarmingStrings.greenhouseGasesStringProperty, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#fff',
      pickable: false,
    })
    const ghgPill = new Rectangle(0, 0, 140, 22, {
      cornerRadius: 8,
      fill: 'rgba(15,23,42,0.45)',
      pickable: false,
    })
    this.addChild(ghgPill)
    this.addChild(ghgLabel)

    // Depth handle on bottom edge of band
    this.ghgHandle = new Node({ cursor: 'ns-resize' })
    this.ghgHandle.addChild(
      new Rectangle(-14, -6, 28, 16, {
        cornerRadius: 8,
        fill: 'rgba(15,23,42,0.2)',
      }),
    )
    this.ghgHandle.addChild(
      new Rectangle(-12, -8, 24, 14, {
        cornerRadius: 7,
        fill: '#e7e5e4',
        stroke: '#fff',
        lineWidth: 2,
      }),
    )
    this.ghgHandle.addChild(
      new Rectangle(-6, -2, 12, 2, {
        cornerRadius: 1,
        fill: 'rgba(71,85,105,0.55)',
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
      ghgPill.centerX = this.bandLeft + this.bandWidth * 0.5
      ghgPill.centerY = top + thick * 0.45
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
        drag: (event) => {
          const pt = this.globalToLocalPoint(event.pointer.point)
          dragBand(pt.y)
        },
      }),
    )
    this.ghgHandle.addInputListener(
      new DragListener({
        drag: (event) => {
          const pt = this.globalToLocalPoint(event.pointer.point)
          dragBand(pt.y)
        },
      }),
    )

    model.co2LevelProperty.link((co2) => {
      if (!this.syncingCo2) {
        applyBandFromCo2(co2)
      }
      this.visualCo2 = co2
    })

    // IR bounce rays
    for (let i = 0; i < IR_RAY_MAX; i++) {
      const ray = new Path(null, {
        stroke: 'rgba(239,68,68,0.7)',
        lineWidth: 2.2,
        lineCap: 'round',
        pickable: false,
      })
      this.irRays.push(ray)
      this.addChild(ray)
    }

    const irLabel = new Text(WarmingStrings.infraredStringProperty, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#fff',
      right: this.sceneW - m - 8,
      top: this.groundTop - 80,
      pickable: false,
    })
    const irPill = new Rectangle(0, 0, 72, 22, {
      cornerRadius: 8,
      fill: 'rgba(185,28,28,0.55)',
      right: this.sceneW - m,
      top: this.groundTop - 84,
      pickable: false,
    })
    this.addChild(irPill)
    this.addChild(irLabel)

    // Ground / surface with heat shimmer suggestion
    this.ground = new Rectangle(0, this.groundTop, this.sceneW, this.sceneH - this.groundTop, {
      fill: '#a16207',
    })
    this.shimmer = new Rectangle(0, this.groundTop - 10, this.sceneW, 18, {
      fill: 'rgba(251,146,60,0.25)',
      pickable: false,
    })
    this.addChild(this.ground)
    this.addChild(this.shimmer)

    const earth = createEcologyIcon('earth', 56)
    earth.centerX = this.sceneW * 0.5
    earth.centerY = this.groundTop + 36
    earth.pickable = false
    this.addChild(earth)
    const treeL = createEcologyIcon('tree', 36)
    treeL.centerX = this.sceneW * 0.22
    treeL.centerY = this.groundTop + 28
    treeL.pickable = false
    this.addChild(treeL)
    const treeR = createEcologyIcon('factory', 40)
    treeR.centerX = this.sceneW * 0.78
    treeR.centerY = this.groundTop + 28
    treeR.pickable = false
    this.addChild(treeR)

    const howBg = new Rectangle(0, 0, this.sceneW - m * 2, 44, {
      cornerRadius: 10,
      fill: 'rgba(15,23,42,0.82)',
      stroke: 'rgba(125,211,252,0.35)',
      lineWidth: 1,
      left: m,
      top: my,
      pickable: false,
    })
    const howText = new Text(
      'How it works: sunlight warms Earth → Earth sends heat up → thicker gas layer traps more heat → temperature rises.',
      {
        font: new PhetFont(12),
        fill: '#e2e8f0',
        maxWidth: this.sceneW - m * 2 - 20,
        left: m + 10,
        centerY: howBg.centerY,
        pickable: false,
      },
    )
    this.addChild(howBg)
    this.addChild(howText)

    // Temperature chip with depth
    const tempCard = new DepthCard(200, 72, {
      title: WarmingStrings.temperatureStringProperty.value,
    })
    tempCard.left = m
    tempCard.bottom = this.groundTop - 12
    this.addChild(tempCard)
    this.tempValue = new Text('15.0 °C', {
      font: new PhetFont({ size: 28, weight: 'bold' }),
      fill: EcologyColors.ink,
      left: 14,
      top: 32,
    })
    tempCard.content.addChild(this.tempValue)

    // Controls card bottom-right above ground? Put on ground strip or overlay
    const controlsW = 240
    const controlsCard = new DepthCard(controlsW, 100, {})
    controlsCard.right = this.sceneW - m
    controlsCard.bottom = this.sceneH - my
    this.addChild(controlsCard)

    const gasSlider = new DepthSlider(model.co2LevelProperty, {
      min: 0.05,
      max: 1,
      width: controlsW - 28,
      label: WarmingStrings.greenhouseGasesStringProperty.value,
      format: (n) => `${Math.round(n * 100)}%`,
    })
    gasSlider.left = 14
    gasSlider.top = 10
    controlsCard.content.addChild(gasSlider)

    const resetBtn = new SoftButton(WarmingStrings.resetStringProperty.value, () => {
      model.reset()
      this.visualHeat = (model.temperatureProperty.value - 10) / 28
      this.visualCo2 = model.co2LevelProperty.value
      applyBandFromCo2(model.co2LevelProperty.value)
    }, {
      width: controlsW - 28,
      height: 32,
      fill: EcologyColors.accent,
    })
    resetBtn.left = 14
    resetBtn.top = 58
    controlsCard.content.addChild(resetBtn)

    this.addChild(
      new ResetAllButton({
        listener: () => {
          model.reset()
          this.visualHeat = (model.temperatureProperty.value - 10) / 28
          this.visualCo2 = model.co2LevelProperty.value
          applyBandFromCo2(model.co2LevelProperty.value)
        },
        left: m,
        bottom: this.sceneH - my,
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

    this.tempValue.string = `${this.model.temperatureProperty.value.toFixed(1)} °C`
    this.sunGlow.opacity = 0.55 + 0.35 * Math.sin(this.animTime * 1.6)
    this.sunGlow.setRadius(38 + 6 * Math.sin(this.animTime * 1.2))
  }

  private updateSky(): void {
    const heat = this.visualHeat
    const top = Color.interpolateRGBA(
      new Color(40, 90, 150),
      new Color(130, 45, 80),
      heat,
    )
    const bottom = Color.interpolateRGBA(
      new Color(170, 130, 55),
      new Color(240, 95, 40),
      heat,
    )
    this.sky.fill = new LinearGradient(0, 0, 0, this.sceneH)
      .addColorStop(0, top)
      .addColorStop(1, bottom)
  }

  private updateSunRays(): void {
    const t = this.animTime
    for (let i = 0; i < SUN_RAY_COUNT; i++) {
      const phase = (t * 0.35 + i * 0.14) % 1
      const y0 = this.sunY + 18
      const y1 = lerp(this.sceneH * 0.12, this.groundTop - 8, (i + 0.5) / SUN_RAY_COUNT)
      const x1 = this.sceneW * 0.52 + Math.sin(phase * Math.PI * 2 + i) * 8
      const shape = new Shape().moveTo(this.sunX + 24, y0).lineTo(x1, y1)
      this.sunRays[i].shape = shape
      this.sunRays[i].opacity = 0.35 + 0.35 * Math.sin(t * 2 + i)
    }
  }

  private updateIrRays(): void {
    const co2 = this.visualCo2
    const bounce = Math.floor(2 + co2 * 7)
    const bandBottom = this.ghgBand.bottom
    const t = this.model.timeProperty.value

    for (let i = 0; i < IR_RAY_MAX; i++) {
      const ray = this.irRays[i]
      if (i >= bounce) {
        ray.visible = false
        continue
      }
      ray.visible = true
      const cycle = (t * 0.45 + i * 0.28) % 1
      const startX = this.sceneW * 0.72 + (i % 3) * 18
      const baseY = this.groundTop - 12 - ((i * 41 + t * 50) % Math.max(40, this.groundTop - bandBottom - 30))
      // Up toward GHG layer then reflect back down
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
        const endX = midX + Math.sin(u * Math.PI) * (30 + co2 * 40)
        const endY = lerp(midY, this.groundTop - 8, u)
        ray.shape = new Shape().moveTo(midX, midY).lineTo(endX, endY)
      }
      ray.opacity = 0.45 + 0.4 * Math.sin(t + i) * (0.5 + co2 * 0.5)
    }
  }

  private updateGround(): void {
    const heat = this.visualHeat
    this.ground.fill = Color.interpolateRGBA(
      new Color(161, 98, 7),
      new Color(220, 80, 30),
      heat,
    )
    this.shimmer.opacity = 0.2 + heat * 0.55 + 0.15 * Math.sin(this.animTime * 4)
    this.shimmer.y = Math.sin(this.animTime * 3) * 2
  }
}
