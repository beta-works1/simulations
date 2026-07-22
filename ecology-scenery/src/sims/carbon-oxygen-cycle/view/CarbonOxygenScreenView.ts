import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import {
  Circle,
  DragListener,
  Node,
  Path,
  Rectangle,
  Text,
} from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { CarbonOxygenModel } from '../model/CarbonOxygenModel.js'
import { EcologyConstants, clamp, damp, lerp } from '../../../shared/EcologyConstants.js'
import { EcologyColors } from '../../../shared/EcologyColors.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { DepthSlider } from '../../../shared/ui/DepthSlider.js'
import { SoftButton } from '../../../shared/ui/SoftButton.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

type GasParticle = {
  node: Circle
  x: number
  y: number
  vx: number
  vy: number
  life: number
  kind: 'co2' | 'o2'
}

type SmokeParticle = {
  node: Circle
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
}

type TreeVisual = {
  root: Node
  trunk: Rectangle
  canopy: Circle
  canopyHighlight: Circle
  shadow: Circle
}

type FactoryVisual = {
  root: Node
  body: Rectangle
  stack: Rectangle
  roof: Rectangle
}

/**
 * Premium layered landscape view of the carbon–oxygen cycle.
 */
export class CarbonOxygenScreenView extends ScreenView {
  private readonly model: CarbonOxygenModel

  private readonly daySky: Rectangle
  private readonly nightSky: Rectangle
  private readonly sunGlow: Circle
  private readonly moonGlow: Circle
  private readonly hillsFar: Path
  private readonly hillsNear: Path
  private readonly ground: Rectangle
  private readonly groundShadow: Rectangle
  private readonly soilPatch: Rectangle

  private readonly treesLayer: Node
  private readonly animalsLayer: Node
  private readonly factoriesLayer: Node
  private readonly gasLayer: Node
  private readonly smokeLayer: Node

  private readonly co2BarFill: Rectangle
  private readonly o2BarFill: Rectangle
  private readonly co2ValueText: Text
  private readonly o2ValueText: Text
  private readonly balanceText: Text

  private readonly chartCo2Path: Path
  private readonly chartO2Path: Path
  private readonly chartScrub: Rectangle
  private readonly chartReadout: Text

  private readonly equationTitle: Text
  private readonly equationBody: Text
  private readonly processReadout: Text

  private readonly dayNightBtn: SoftButton
  private readonly autoBtn: SoftButton
  private readonly playPauseBtn: SoftButton

  private readonly tipCard: DepthCard
  private readonly tipTitle: Text
  private readonly tipBody: Text

  private readonly statusText: Text

  private readonly trees: TreeVisual[] = []
  private readonly factories: FactoryVisual[] = []
  private readonly animalDots: Circle[] = []
  private readonly gasParticles: GasParticle[] = []
  private readonly smokeParticles: SmokeParticle[] = []

  private readonly sceneLeft: number
  private readonly sceneRight: number
  private readonly sceneTop: number
  private readonly sceneBottom: number
  private readonly groundY: number
  private readonly chartBounds: { x: number; y: number; w: number; h: number }

  private visualSky = 1
  private visualPlants = 12
  private visualFactories = 2
  private visualCo2 = 42
  private visualO2 = 58
  private scrubIndex: number | null = null
  private tipTimer = 0
  private spawnAcc = 0

  public constructor(model: CarbonOxygenModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const bounds = this.layoutBounds
    const mx = EcologyConstants.SCREEN_VIEW_X_MARGIN
    const my = EcologyConstants.SCREEN_VIEW_Y_MARGIN
    const controlW = 210
    const statusH = 40

    const statusLeft = bounds.minX + mx
    const statusTop = bounds.minY + my
    const statusW = bounds.width - 2 * mx

    const controlsRight = bounds.maxX - mx
    const controlsLeft = controlsRight - controlW
    const contentTop = statusTop + statusH + 10
    const contentBottom = bounds.maxY - my - 48

    this.sceneLeft = statusLeft
    this.sceneRight = controlsLeft - 14
    this.sceneTop = contentTop
    this.sceneBottom = contentBottom
    this.groundY = this.sceneTop + (this.sceneBottom - this.sceneTop) * 0.62

    const sceneW = this.sceneRight - this.sceneLeft
    const sceneH = this.sceneBottom - this.sceneTop

    // ── Status bar ──────────────────────────────────────────────────────────
    const statusCard = new DepthCard(statusW, statusH, { cornerRadius: 12, fill: 'rgba(15,23,42,0.92)' })
    statusCard.left = statusLeft
    statusCard.top = statusTop
    this.statusText = new Text(model.statusProperty, {
      font: new PhetFont(13),
      fill: '#ecfeff',
      maxWidth: statusW - 28,
      left: 14,
      centerY: statusH / 2,
    })
    statusCard.content.addChild(this.statusText)
    this.addChild(statusCard)

    // ── Landscape stage ─────────────────────────────────────────────────────
    const stageClipShape = Shape.roundRectangle(this.sceneLeft, this.sceneTop, sceneW, sceneH, 16, 16)
    const stage = new Node({ clipArea: stageClipShape })

    this.daySky = new Rectangle(this.sceneLeft, this.sceneTop, sceneW, sceneH, {
      fill: '#7eb8e8',
    })
    this.nightSky = new Rectangle(this.sceneLeft, this.sceneTop, sceneW, sceneH, {
      fill: '#0f172a',
      opacity: 0,
    })
    stage.addChild(this.daySky)
    stage.addChild(this.nightSky)

    this.sunGlow = new Circle(28, {
      fill: 'rgba(251, 191, 36, 0.85)',
      centerX: this.sceneLeft + sceneW * 0.82,
      centerY: this.sceneTop + sceneH * 0.16,
    })
    this.moonGlow = new Circle(18, {
      fill: 'rgba(226, 232, 240, 0.7)',
      centerX: this.sceneLeft + sceneW * 0.18,
      centerY: this.sceneTop + sceneH * 0.14,
      opacity: 0,
    })
    stage.addChild(this.sunGlow)
    stage.addChild(this.moonGlow)

    // Soft sun halo
    stage.addChild(
      new Circle(48, {
        fill: 'rgba(253, 224, 71, 0.22)',
        center: this.sunGlow.center,
      }),
    )

    this.hillsFar = new Path(this.buildHillsShape(this.sceneLeft, this.groundY - 48, sceneW, 36, 0.7), {
      fill: '#6b9e6a',
    })
    this.hillsNear = new Path(this.buildHillsShape(this.sceneLeft, this.groundY - 22, sceneW, 28, 1.1), {
      fill: '#4f8a4e',
    })
    stage.addChild(this.hillsFar)
    stage.addChild(this.hillsNear)

    this.groundShadow = new Rectangle(this.sceneLeft, this.groundY + 4, sceneW, sceneH * 0.4, {
      fill: 'rgba(15, 23, 42, 0.18)',
    })
    this.ground = new Rectangle(this.sceneLeft, this.groundY, sceneW, this.sceneBottom - this.groundY, {
      fill: '#5a8f4a',
    })
    stage.addChild(this.groundShadow)
    stage.addChild(this.ground)

    // Ground depth band
    stage.addChild(
      new Rectangle(this.sceneLeft, this.groundY, sceneW, 10, {
        fill: 'rgba(255,255,255,0.12)',
      }),
    )

    this.soilPatch = new Rectangle(this.sceneLeft + 18, this.groundY + 28, 110, 36, {
      cornerRadius: 8,
      fill: '#6b4f32',
      stroke: 'rgba(15,23,42,0.25)',
      lineWidth: 1,
      cursor: 'pointer',
    })
    stage.addChild(this.soilPatch)
    stage.addChild(
      new Text('Dead matter', {
        font: new PhetFont({ size: 10, weight: 'bold' }),
        fill: '#fef3c7',
        centerX: this.soilPatch.centerX,
        centerY: this.soilPatch.centerY,
      }),
    )
    this.soilPatch.addInputListener({
      down: () =>
        this.showTip(
          'Decomposition',
          'When plants and animals die, bacteria and fungi break them down and release carbon dioxide.',
        ),
    })

    this.treesLayer = new Node()
    this.animalsLayer = new Node()
    this.factoriesLayer = new Node()
    this.gasLayer = new Node()
    this.smokeLayer = new Node()
    stage.addChild(this.treesLayer)
    stage.addChild(this.animalsLayer)
    stage.addChild(this.factoriesLayer)
    stage.addChild(this.smokeLayer)
    stage.addChild(this.gasLayer)

    // Stage frame / depth edge
    stage.addChild(
      new Rectangle(this.sceneLeft, this.sceneTop, sceneW, sceneH, {
        cornerRadius: 16,
        stroke: 'rgba(15,23,42,0.22)',
        lineWidth: 2,
        pickable: false,
      }),
    )

    this.addChild(stage)

    // ── Atmosphere gauges ───────────────────────────────────────────────────
    const gaugeCard = new DepthCard(168, 118, { title: 'Atmosphere', cornerRadius: 12 })
    gaugeCard.left = this.sceneLeft + 10
    gaugeCard.top = this.sceneTop + 10
    this.addChild(gaugeCard)

    const barTrackY = 36
    gaugeCard.content.addChild(
      new Text('CO₂', {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: EcologyColors.co2,
        left: 14,
        top: barTrackY,
      }),
    )
    gaugeCard.content.addChild(
      new Rectangle(48, barTrackY + 2, 100, 12, {
        cornerRadius: 6,
        fill: 'rgba(15,23,42,0.1)',
      }),
    )
    this.co2BarFill = new Rectangle(48, barTrackY + 2, 42, 12, {
      cornerRadius: 6,
      fill: EcologyColors.co2,
    })
    gaugeCard.content.addChild(this.co2BarFill)
    this.co2ValueText = new Text('42', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: EcologyColors.ink,
      left: 48,
      top: barTrackY + 16,
    })
    gaugeCard.content.addChild(this.co2ValueText)

    const o2Y = 72
    gaugeCard.content.addChild(
      new Text('O₂', {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: EcologyColors.o2,
        left: 14,
        top: o2Y,
      }),
    )
    gaugeCard.content.addChild(
      new Rectangle(48, o2Y + 2, 100, 12, {
        cornerRadius: 6,
        fill: 'rgba(15,23,42,0.1)',
      }),
    )
    this.o2BarFill = new Rectangle(48, o2Y + 2, 58, 12, {
      cornerRadius: 6,
      fill: EcologyColors.o2,
    })
    gaugeCard.content.addChild(this.o2BarFill)
    this.o2ValueText = new Text('58', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: EcologyColors.ink,
      left: 48,
      top: o2Y + 16,
    })
    gaugeCard.content.addChild(this.o2ValueText)

    this.balanceText = new Text('Balanced', {
      font: new PhetFont({ size: 10, weight: 'bold' }),
      fill: EcologyColors.accent,
      left: 14,
      top: 98,
      maxWidth: 140,
    })
    gaugeCard.content.addChild(this.balanceText)

    // ── History chart ───────────────────────────────────────────────────────
    const chartW = Math.min(280, sceneW * 0.42)
    const chartH = 88
    this.chartBounds = {
      x: this.sceneLeft + 10,
      y: this.sceneBottom - chartH - 10,
      w: chartW,
      h: chartH,
    }
    const chartCard = new DepthCard(chartW, chartH, { title: 'Gas history', cornerRadius: 12 })
    chartCard.left = this.chartBounds.x
    chartCard.top = this.chartBounds.y
    this.addChild(chartCard)

    this.chartCo2Path = new Path(null, {
      stroke: EcologyColors.co2,
      lineWidth: 2,
      lineJoin: 'round',
    })
    this.chartO2Path = new Path(null, {
      stroke: EcologyColors.o2,
      lineWidth: 2,
      lineJoin: 'round',
    })
    chartCard.content.addChild(this.chartCo2Path)
    chartCard.content.addChild(this.chartO2Path)

    this.chartScrub = new Rectangle(0, 28, 2, chartH - 36, {
      fill: 'rgba(15,23,42,0.45)',
      visible: false,
    })
    chartCard.content.addChild(this.chartScrub)

    this.chartReadout = new Text('', {
      font: new PhetFont(10),
      fill: EcologyColors.muted,
      left: 14,
      top: chartH - 16,
      maxWidth: chartW - 28,
    })
    chartCard.content.addChild(this.chartReadout)

    chartCard.addInputListener(
      new DragListener({
        drag: (event) => {
          const local = chartCard.globalToLocalPoint(event.pointer.point)
          const hist = this.model.historyProperty.value
          if (hist.length < 2) return
          const t = clamp((local.x - 10) / (chartW - 20), 0, 1)
          this.scrubIndex = Math.round(t * (hist.length - 1))
          this.chartScrub.visible = true
          this.chartScrub.x = 10 + t * (chartW - 20)
          const s = hist[this.scrubIndex]
          this.chartReadout.string = `t=${this.scrubIndex}  CO₂ ${s.co2.toFixed(0)}  O₂ ${s.o2.toFixed(0)}`
        },
        end: () => {
          this.scrubIndex = null
          this.chartScrub.visible = false
          this.chartReadout.string = 'Drag to scrub · amber CO₂ · cyan O₂'
        },
      }),
    )
    this.chartReadout.string = 'Drag to scrub · amber CO₂ · cyan O₂'

    // ── Equation / process panel ────────────────────────────────────────────
    const eqW = Math.min(300, sceneW * 0.46)
    const eqH = 108
    const eqCard = new DepthCard(eqW, eqH, { title: 'Process', cornerRadius: 12 })
    eqCard.right = this.sceneRight - 10
    eqCard.bottom = this.sceneBottom - 10
    this.addChild(eqCard)

    this.equationTitle = new Text('Photosynthesis', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: EcologyColors.producer,
      left: 14,
      top: 34,
      maxWidth: eqW - 28,
    })
    this.equationBody = new Text('6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂', {
      font: new PhetFont(11),
      fill: EcologyColors.ink,
      left: 14,
      top: 52,
      maxWidth: eqW - 28,
    })
    this.processReadout = new Text('', {
      font: new PhetFont(10),
      fill: EcologyColors.muted,
      left: 14,
      top: 74,
      maxWidth: eqW - 28,
    })
    eqCard.content.addChild(this.equationTitle)
    eqCard.content.addChild(this.equationBody)
    eqCard.content.addChild(this.processReadout)

    // ── Tip card (hidden until interaction) ─────────────────────────────────
    this.tipCard = new DepthCard(220, 92, { cornerRadius: 12, fill: 'rgba(255,255,255,0.96)' })
    this.tipCard.centerX = (this.sceneLeft + this.sceneRight) / 2
    this.tipCard.top = this.sceneTop + 130
    this.tipCard.visible = false
    this.tipTitle = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: EcologyColors.ink,
      left: 14,
      top: 12,
      maxWidth: 192,
    })
    this.tipBody = new Text('', {
      font: new PhetFont(11),
      fill: EcologyColors.muted,
      left: 14,
      top: 34,
      maxWidth: 192,
    })
    this.tipCard.content.addChild(this.tipTitle)
    this.tipCard.content.addChild(this.tipBody)
    this.addChild(this.tipCard)

    // ── Control panel ───────────────────────────────────────────────────────
    const panelH = contentBottom - contentTop
    const controlCard = new DepthCard(controlW, panelH, { title: 'Controls', cornerRadius: 14 })
    controlCard.left = controlsLeft
    controlCard.top = contentTop
    this.addChild(controlCard)

    let y = 36
    const sliderW = controlW - 28

    const sunSlider = new DepthSlider(model.sunlightIntensityProperty, {
      min: 0,
      max: 100,
      width: sliderW,
      label: 'Sunlight',
      format: (n) => `${Math.round(n)}%`,
    })
    sunSlider.left = 14
    sunSlider.top = y
    controlCard.content.addChild(sunSlider)
    y += 52

    const plantSlider = new DepthSlider(model.plantCountProperty, {
      min: 0,
      max: 24,
      width: sliderW,
      label: 'Plants',
      format: (n) => `${Math.round(n)}`,
    })
    plantSlider.left = 14
    plantSlider.top = y
    controlCard.content.addChild(plantSlider)
    y += 52

    const factorySlider = new DepthSlider(model.factoryVehicleCountProperty, {
      min: 0,
      max: 20,
      width: sliderW,
      label: 'Factories',
      format: (n) => `${Math.round(n)}`,
    })
    factorySlider.left = 14
    factorySlider.top = y
    controlCard.content.addChild(factorySlider)
    y += 58

    const btnW = (controlW - 36) / 2

    this.dayNightBtn = new SoftButton('Day / Night', () => model.toggleDay(), {
      width: btnW,
      height: 32,
      fill: '#0369a1',
    })
    this.dayNightBtn.left = 14
    this.dayNightBtn.top = y
    controlCard.content.addChild(this.dayNightBtn)

    this.autoBtn = new SoftButton('Auto', () => model.toggleAutoDayNight(), {
      width: btnW,
      height: 32,
      fill: '#0f766e',
    })
    this.autoBtn.left = 14 + btnW + 8
    this.autoBtn.top = y
    controlCard.content.addChild(this.autoBtn)
    y += 40

    this.playPauseBtn = new SoftButton('Pause', () => model.toggleRunning(), {
      width: btnW,
      height: 32,
      fill: EcologyColors.accent,
    })
    this.playPauseBtn.left = 14
    this.playPauseBtn.top = y
    controlCard.content.addChild(this.playPauseBtn)

    const resetBtn = new SoftButton('Reset', () => {
      model.reset()
      this.resetVisuals()
    }, {
      width: btnW,
      height: 32,
      fill: '#64748b',
    })
    resetBtn.left = 14 + btnW + 8
    resetBtn.top = y
    controlCard.content.addChild(resetBtn)
    y += 44

    const scenarioBtn = new SoftButton('Deforestation scenario', () => model.startDeforestationScenario(), {
      width: controlW - 28,
      height: 36,
      fill: EcologyColors.danger,
    })
    scenarioBtn.left = 14
    scenarioBtn.top = y
    controlCard.content.addChild(scenarioBtn)

    controlCard.content.addChild(
      new Text('Tip: tap trees, factories, or soil', {
        font: new PhetFont(10),
        fill: EcologyColors.muted,
        left: 14,
        top: panelH - 28,
        maxWidth: controlW - 28,
      }),
    )

    this.addChild(
      new ResetAllButton({
        listener: () => {
          model.reset()
          this.resetVisuals()
        },
        right: controlsRight,
        bottom: bounds.maxY - my,
      }),
    )

    // Slider changes should refresh derived rates when paused
    model.sunlightIntensityProperty.link(() => {
      /* model.step refresh when running; nudge status when paused */
      if (!model.runningProperty.value) {
        model.step(0)
      }
    })
    model.plantCountProperty.link(() => {
      if (!model.runningProperty.value) {
        model.step(0)
      }
    })
    model.factoryVehicleCountProperty.link(() => {
      if (!model.runningProperty.value) {
        model.step(0)
      }
    })

    this.rebuildTrees(Math.round(this.visualPlants))
    this.rebuildFactories(Math.round(this.visualFactories))
    this.rebuildAnimals(model.animalPopulationProperty.value)
    this.updateEquationPanel()
    this.updateChart()
  }

  private buildHillsShape(left: number, baseY: number, width: number, amp: number, seed: number): Shape {
    const shape = new Shape()
    shape.moveTo(left, this.sceneBottom)
    shape.lineTo(left, baseY)
    const steps = 8
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const x = left + t * width
      const y = baseY - Math.sin(t * Math.PI * 2.2 * seed + seed) * amp * (0.55 + 0.45 * Math.sin(t * 5 + seed))
      shape.lineTo(x, y)
    }
    shape.lineTo(left + width, this.sceneBottom)
    shape.close()
    return shape
  }

  private showTip(title: string, body: string): void {
    this.tipTitle.string = title
    this.tipBody.string = body
    this.tipCard.visible = true
    this.tipCard.opacity = 1
    this.tipTimer = 4.5
  }

  private rebuildTrees(count: number): void {
    this.treesLayer.removeAllChildren()
    this.trees.length = 0
    const n = clamp(count, 0, 24)
    const span = this.sceneRight - this.sceneLeft - 160
    for (let i = 0; i < n; i++) {
      const frac = n === 1 ? 0.35 : i / Math.max(1, n - 1)
      const x = this.sceneLeft + 40 + frac * span * 0.72 + (i % 3) * 6
      const y = this.groundY + 4 + (i % 2) * 6
      const scale = 0.75 + (i % 5) * 0.06
      const tree = this.createTree(x, y, scale)
      this.trees.push(tree)
      this.treesLayer.addChild(tree.root)
    }
  }

  private createTree(x: number, y: number, scale: number): TreeVisual {
    const root = new Node({ cursor: 'pointer' })
    const shadow = new Circle(18 * scale, {
      fill: 'rgba(15,23,42,0.2)',
      centerX: x,
      centerY: y + 2,
    })
    shadow.setScaleMagnitude(1.2, 0.35)
    const trunk = new Rectangle(-5 * scale, -28 * scale, 10 * scale, 30 * scale, {
      fill: '#6b3f24',
      centerX: x,
      bottom: y,
    })
    // Trunk highlight
    const trunkShine = new Rectangle(-2 * scale, -26 * scale, 3 * scale, 24 * scale, {
      fill: 'rgba(255,255,255,0.18)',
      centerX: x - 2 * scale,
      bottom: y - 2,
    })
    const canopy = new Circle(16 * scale, {
      fill: '#22a35a',
      centerX: x,
      centerY: y - 34 * scale,
    })
    const canopyHighlight = new Circle(7 * scale, {
      fill: 'rgba(187, 247, 208, 0.55)',
      centerX: x - 5 * scale,
      centerY: y - 40 * scale,
    })
    root.addChild(shadow)
    root.addChild(trunk)
    root.addChild(trunkShine)
    root.addChild(canopy)
    root.addChild(canopyHighlight)
    root.addInputListener({
      down: () =>
        this.showTip(
          'Photosynthesis',
          'Green plants use sunlight to change carbon dioxide and water into food (glucose) and oxygen.',
        ),
    })
    return { root, trunk, canopy, canopyHighlight, shadow }
  }

  private rebuildFactories(count: number): void {
    this.factoriesLayer.removeAllChildren()
    this.factories.length = 0
    const n = clamp(count, 0, 20)
    const baseX = this.sceneRight - 40
    for (let i = 0; i < n; i++) {
      const col = i % 5
      const row = Math.floor(i / 5)
      const x = baseX - col * 36
      const y = this.groundY - 8 - row * 4
      const factory = this.createFactory(x, y)
      this.factories.push(factory)
      this.factoriesLayer.addChild(factory.root)
    }
  }

  private createFactory(x: number, y: number): FactoryVisual {
    const root = new Node({ cursor: 'pointer' })
    const body = new Rectangle(-16, -28, 32, 28, {
      fill: '#64748b',
      stroke: 'rgba(15,23,42,0.35)',
      lineWidth: 1,
      centerX: x,
      bottom: y,
    })
    const roof = new Rectangle(-18, -34, 36, 8, {
      fill: '#475569',
      centerX: x,
      bottom: body.top + 2,
    })
    const stack = new Rectangle(-4, -52, 8, 20, {
      fill: '#334155',
      centerX: x + 8,
      bottom: roof.top + 2,
    })
    // Window lights
    const win = new Rectangle(-8, -20, 6, 6, {
      fill: '#fde68a',
      centerX: x - 4,
      centerY: y - 16,
    })
    const groundShadow = new Circle(14, {
      fill: 'rgba(15,23,42,0.18)',
      centerX: x,
      centerY: y + 2,
    })
    groundShadow.setScaleMagnitude(1.3, 0.3)
    root.addChild(groundShadow)
    root.addChild(body)
    root.addChild(roof)
    root.addChild(stack)
    root.addChild(win)
    root.addInputListener({
      down: () =>
        this.showTip(
          'Combustion',
          'Burning wood or fossil fuels uses oxygen and releases carbon dioxide into the air.',
        ),
    })
    return { root, body, stack, roof }
  }

  private rebuildAnimals(count: number): void {
    this.animalsLayer.removeAllChildren()
    this.animalDots.length = 0
    const n = clamp(Math.round(count), 0, 16)
    for (let i = 0; i < n; i++) {
      const dot = new Circle(3.5, {
        fill: '#eab308',
        stroke: 'rgba(15,23,42,0.25)',
        lineWidth: 1,
        centerX: this.sceneLeft + 80 + (i * 47) % (this.sceneRight - this.sceneLeft - 200),
        centerY: this.groundY + 14 + (i % 3) * 8,
      })
      this.animalDots.push(dot)
      this.animalsLayer.addChild(dot)
    }
  }

  private updateEquationPanel(): void {
    const photo = this.model.activeEquationProperty.value === 'photosynthesis'
    if (photo) {
      this.equationTitle.string = 'Photosynthesis'
      this.equationTitle.fill = EcologyColors.producer
      this.equationBody.string = '6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂'
    }
    else {
      this.equationTitle.string = 'Respiration / combustion'
      this.equationTitle.fill = EcologyColors.danger
      this.equationBody.string = 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O (+ energy)'
    }
    const r = this.model.computeRates()
    this.processReadout.string =
      `Photo ${r.photosynthesis.toFixed(1)} · Resp ${r.respiration.toFixed(1)} · ` +
      `Decomp ${r.decomposition.toFixed(1)} · Burn ${r.combustion.toFixed(1)}`
  }

  private updateChart(): void {
    const hist = this.model.historyProperty.value
    const padL = 10
    const padT = 30
    const padB = 20
    const padR = 10
    const w = this.chartBounds.w - padL - padR
    const h = this.chartBounds.h - padT - padB
    if (hist.length < 2) {
      this.chartCo2Path.shape = null
      this.chartO2Path.shape = null
      return
    }
    const co2 = new Shape()
    const o2 = new Shape()
    for (let i = 0; i < hist.length; i++) {
      const t = i / (hist.length - 1)
      const x = padL + t * w
      const yCo2 = padT + (1 - hist[i].co2 / 100) * h
      const yO2 = padT + (1 - hist[i].o2 / 100) * h
      if (i === 0) {
        co2.moveTo(x, yCo2)
        o2.moveTo(x, yO2)
      }
      else {
        co2.lineTo(x, yCo2)
        o2.lineTo(x, yO2)
      }
    }
    this.chartCo2Path.shape = co2
    this.chartO2Path.shape = o2
  }

  private spawnGas(dt: number): void {
    this.spawnAcc += dt
    if (this.spawnAcc < 0.08) return
    this.spawnAcc = 0

    const rates = this.model.computeRates()
    const photo = rates.photosynthesis
    const co2Out = rates.respiration + rates.decomposition + rates.combustion

    if (photo > 0.4 && this.trees.length > 0 && Math.random() < Math.min(0.9, photo / 12)) {
      const tree = this.trees[Math.floor(Math.random() * this.trees.length)]
      this.addGasParticle('o2', tree.canopy.centerX, tree.canopy.centerY - 8)
    }
    if (co2Out > 0.4 && Math.random() < Math.min(0.9, co2Out / 14)) {
      if (this.factories.length > 0 && rates.combustion > rates.respiration) {
        const f = this.factories[Math.floor(Math.random() * this.factories.length)]
        this.addGasParticle('co2', f.stack.centerX, f.stack.top - 4)
      }
      else if (this.animalDots.length > 0) {
        const a = this.animalDots[Math.floor(Math.random() * this.animalDots.length)]
        this.addGasParticle('co2', a.centerX, a.centerY - 6)
      }
      else {
        this.addGasParticle('co2', this.soilPatch.centerX, this.soilPatch.top - 4)
      }
    }

    // Smoke from factories
    if (this.factories.length > 0 && rates.combustion > 0.2) {
      for (const f of this.factories) {
        if (Math.random() < Math.min(0.35, rates.combustion / 20)) {
          this.addSmoke(f.stack.centerX, f.stack.top)
        }
      }
    }
  }

  private addGasParticle(kind: 'co2' | 'o2', x: number, y: number): void {
    if (this.gasParticles.length > 80) {
      const old = this.gasParticles.shift()
      if (old) {
        this.gasLayer.removeChild(old.node)
      }
    }
    const node = new Circle(kind === 'co2' ? 4.5 : 4, {
      fill: kind === 'co2' ? 'rgba(245, 158, 11, 0.85)' : 'rgba(56, 189, 248, 0.85)',
      stroke: 'rgba(255,255,255,0.35)',
      lineWidth: 1,
      centerX: x,
      centerY: y,
    })
    this.gasLayer.addChild(node)
    this.gasParticles.push({
      node,
      x,
      y,
      vx: (Math.random() - 0.5) * 28,
      vy: kind === 'o2' ? -18 - Math.random() * 22 : -8 - Math.random() * 16,
      life: 2.2 + Math.random() * 1.2,
      kind,
    })
  }

  private addSmoke(x: number, y: number): void {
    if (this.smokeParticles.length > 60) {
      const old = this.smokeParticles.shift()
      if (old) {
        this.smokeLayer.removeChild(old.node)
      }
    }
    const maxLife = 1.8 + Math.random()
    const node = new Circle(5 + Math.random() * 4, {
      fill: 'rgba(100, 116, 139, 0.45)',
      centerX: x,
      centerY: y,
    })
    this.smokeLayer.addChild(node)
    this.smokeParticles.push({
      node,
      x,
      y,
      vx: (Math.random() - 0.5) * 12,
      vy: -22 - Math.random() * 18,
      life: maxLife,
      maxLife,
    })
  }

  private updateParticles(dt: number): void {
    for (let i = this.gasParticles.length - 1; i >= 0; i--) {
      const p = this.gasParticles[i]
      p.life -= dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vx = damp(p.vx, p.kind === 'o2' ? 8 : -6, 0.8, dt)
      p.node.centerX = p.x
      p.node.centerY = p.y
      p.node.opacity = clamp(p.life / 1.2, 0, 1)
      if (p.life <= 0 || p.y < this.sceneTop - 10) {
        this.gasLayer.removeChild(p.node)
        this.gasParticles.splice(i, 1)
      }
    }

    for (let i = this.smokeParticles.length - 1; i >= 0; i--) {
      const p = this.smokeParticles[i]
      p.life -= dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vx += Math.sin(p.y * 0.05) * 8 * dt
      const t = 1 - p.life / p.maxLife
      p.node.centerX = p.x
      p.node.centerY = p.y
      p.node.setScaleMagnitude(1 + t * 1.4)
      p.node.opacity = clamp(1 - t, 0, 0.55)
      if (p.life <= 0) {
        this.smokeLayer.removeChild(p.node)
        this.smokeParticles.splice(i, 1)
      }
    }
  }

  private updateSky(dt: number): void {
    const sun = this.model.sunlightIntensityProperty.value
    const target = this.model.isDayProperty.value ? 0.35 + (sun / 100) * 0.65 : 0
    this.visualSky = damp(this.visualSky, target, 5, dt)
    this.nightSky.opacity = 1 - this.visualSky
    this.daySky.opacity = 0.55 + this.visualSky * 0.45
    this.sunGlow.opacity = this.visualSky
    this.moonGlow.opacity = 1 - this.visualSky

    const dayColor = lerpChannel(0x7e, 0xb8, 0xe8, 0x4a, 0x90, 0xd0, this.visualSky)
    this.daySky.fill = dayColor
  }

  private updateGauges(): void {
    this.co2BarFill.setRectWidth(Math.max(4, (this.visualCo2 / 100) * 100))
    this.o2BarFill.setRectWidth(Math.max(4, (this.visualO2 / 100) * 100))
    this.co2ValueText.string = `${this.visualCo2.toFixed(0)}%`
    this.o2ValueText.string = `${this.visualO2.toFixed(0)}%`
    this.balanceText.string = this.model.balanceStatusProperty.value
    const bal = this.model.balanceStatusProperty.value
    this.balanceText.fill =
      bal === 'Balanced' ? EcologyColors.accent : bal === 'CO₂ rising' ? EcologyColors.co2 : EcologyColors.o2
  }

  private resetVisuals(): void {
    this.visualSky = 1
    this.visualPlants = this.model.plantCountProperty.value
    this.visualFactories = this.model.factoryVehicleCountProperty.value
    this.visualCo2 = this.model.co2LevelProperty.value
    this.visualO2 = this.model.o2LevelProperty.value
    for (const p of this.gasParticles) {
      this.gasLayer.removeChild(p.node)
    }
    this.gasParticles.length = 0
    for (const p of this.smokeParticles) {
      this.smokeLayer.removeChild(p.node)
    }
    this.smokeParticles.length = 0
    this.tipCard.visible = false
    this.tipTimer = 0
    this.rebuildTrees(Math.round(this.visualPlants))
    this.rebuildFactories(Math.round(this.visualFactories))
    this.rebuildAnimals(this.model.animalPopulationProperty.value)
    this.updateChart()
    this.updateEquationPanel()
    this.updateGauges()
    this.playPauseBtn.setLabel(this.model.runningProperty.value ? 'Pause' : 'Play')
  }

  public override step(dt: number): void {
    const clampedDt = Math.min(dt, 0.05)
    this.model.step(clampedDt)

    this.visualPlants = damp(this.visualPlants, this.model.plantCountProperty.value, 6, clampedDt)
    this.visualFactories = damp(this.visualFactories, this.model.factoryVehicleCountProperty.value, 6, clampedDt)
    this.visualCo2 = damp(this.visualCo2, this.model.co2LevelProperty.value, 6, clampedDt)
    this.visualO2 = damp(this.visualO2, this.model.o2LevelProperty.value, 6, clampedDt)

    const plantN = Math.round(this.visualPlants)
    if (plantN !== this.trees.length) {
      this.rebuildTrees(plantN)
    }
    const factoryN = Math.round(this.visualFactories)
    if (factoryN !== this.factories.length) {
      this.rebuildFactories(factoryN)
    }

    const animalN = Math.round(this.model.animalPopulationProperty.value)
    if (animalN !== this.animalDots.length) {
      this.rebuildAnimals(animalN)
    }

    // Soft animal bob
    for (let i = 0; i < this.animalDots.length; i++) {
      const dot = this.animalDots[i]
      const baseY = this.groundY + 14 + (i % 3) * 8
      dot.centerY = baseY + Math.sin(this.model.timeProperty.value * 2.2 + i) * 2
    }

    this.updateSky(clampedDt)
    this.updateGauges()
    this.updateEquationPanel()
    this.updateChart()

    if (this.model.runningProperty.value) {
      this.spawnGas(clampedDt)
    }
    this.updateParticles(clampedDt)

    this.playPauseBtn.setLabel(this.model.runningProperty.value ? 'Pause' : 'Play')
    this.autoBtn.setLabel(this.model.autoDayNightProperty.value ? 'Auto ✓' : 'Auto')
    this.dayNightBtn.setLabel(this.model.isDayProperty.value ? 'Night' : 'Day')

    // Dead-matter patch scales with amount
    const dead = this.model.deadMatterAmountProperty.value
    this.soilPatch.setRectWidth(70 + dead * 3)
    this.soilPatch.opacity = 0.55 + dead / 40

    if (this.tipTimer > 0) {
      this.tipTimer -= clampedDt
      if (this.tipTimer < 0.6) {
        this.tipCard.opacity = this.tipTimer / 0.6
      }
      if (this.tipTimer <= 0) {
        this.tipCard.visible = false
      }
    }
  }
}

function lerpChannel(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
  t: number,
): string {
  const r = Math.round(lerp(r1, r2, t))
  const g = Math.round(lerp(g1, g2, t))
  const b = Math.round(lerp(b1, b2, t))
  return `rgb(${r},${g},${b})`
}
