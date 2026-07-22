import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Path, Rectangle, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { CarbonOxygenModel } from '../model/CarbonOxygenModel.js'
import { CarbonControlPanel } from './CarbonControlPanel.js'
import {
  CarbonCloudLayer,
  CarbonParticleLayer,
  makeAtmosphereGauge,
  makeClouds,
  makeEquationPanel,
  makeProcessChip,
} from './CarbonSceneHelpers.js'

type Options = EmptySelfOptions & ScreenViewOptions

export class CarbonOxygenScreenView extends ScreenView {
  private readonly model: CarbonOxygenModel
  private readonly treesLayer: Node
  private readonly animalsLayer: Node
  private readonly factoryLayer: Node
  private readonly processLayer: Node
  private readonly particleLayer: CarbonParticleLayer
  private readonly cloudLayer: CarbonCloudLayer
  private readonly skyRect: Rectangle
  private readonly hillsPath: Path
  private readonly groundRect: Rectangle
  private readonly sun: Circle
  private readonly moon: Circle
  private readonly co2Path: Path
  private readonly o2Path: Path
  private readonly takeawayBg: Rectangle
  private readonly runningBadge: Rectangle
  private readonly runningText: Text
  private readonly scenarioBadge: Rectangle
  private readonly scenarioText: Text
  private readonly sceneBounds: { left: number; top: number; width: number; height: number }
  private readonly chartBounds: { left: number; top: number; width: number; height: number }
  private skyBlend = 1
  private hoverZone: 'trees' | 'animals' | 'factory' | 'soil' | null = null

  public constructor(model: CarbonOxygenModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const margin = 12
    const panelW = 268
    const statusH = 40
    const b = this.layoutBounds

    const sceneLeft = b.left + margin
    const sceneTop = b.top + statusH + margin
    const sceneW = b.width - panelW - margin * 3
    const sceneH = (b.height - statusH - margin * 2) * 0.52
    this.sceneBounds = { left: sceneLeft, top: sceneTop, width: sceneW, height: sceneH }

    const chartTop = sceneTop + sceneH + 8
    const chartH = b.bottom - margin - chartTop
    this.chartBounds = { left: sceneLeft, top: chartTop, width: sceneW, height: chartH }

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

    this.takeawayBg = new Rectangle(b.left + margin, b.top + 50, b.width - margin * 2 - panelW - 20, 24, {
      cornerRadius: 6,
      fill: 'rgba(192, 57, 43, 0.88)',
      visible: false,
    })
    const takeawayText = new Text(model.takeawayProperty, {
      font: new PhetFont(10),
      fill: 'white',
      maxWidth: this.takeawayBg.width - 12,
      center: this.takeawayBg.center,
    })
    model.takeawayProperty.link((t) => {
      this.takeawayBg.visible = t.length > 0
    })
    this.addChild(this.takeawayBg)
    this.addChild(takeawayText)

    this.skyRect = new Rectangle(sceneLeft, sceneTop, sceneW, sceneH, { fill: '#6eb6e0', cornerRadius: 10 })
    this.hillsPath = new Path(null, { fill: 'rgba(106,143,120,0.55)' })
    this.groundRect = new Rectangle(sceneLeft, sceneTop + sceneH * 0.68, sceneW, sceneH * 0.32, {
      fill: '#5a8f3d',
      cornerRadius: 10,
    })
    this.sun = new Circle(24, { fill: '#f4d03f' })
    this.sun.centerX = sceneLeft + sceneW * 0.48
    this.sun.centerY = sceneTop + sceneH * 0.14
    this.moon = new Circle(11, { fill: '#e8eef8', visible: false })
    this.moon.centerX = this.sun.centerX
    this.moon.centerY = this.sun.centerY

    this.treesLayer = new Node()
    this.animalsLayer = new Node()
    this.factoryLayer = new Node()
    this.processLayer = new Node()
    this.particleLayer = new CarbonParticleLayer()
    this.cloudLayer = new CarbonCloudLayer(makeClouds())

    this.addChild(this.skyRect)
    this.addChild(this.hillsPath)
    this.addChild(this.groundRect)
    this.addChild(this.cloudLayer)
    this.addChild(this.sun)
    this.addChild(this.moon)
    this.addChild(this.treesLayer)
    this.addChild(this.animalsLayer)
    this.addChild(this.factoryLayer)
    this.addChild(this.particleLayer)
    this.addChild(this.processLayer)

    const gaugeW = Math.min(140, sceneW * 0.32)
    this.addChild(makeAtmosphereGauge(model, sceneLeft + 8, sceneTop + 8, gaugeW))
    this.addChild(
      makeEquationPanel(model.activeProcessProperty, sceneLeft + sceneW - Math.min(240, sceneW * 0.42) - 8, sceneTop + 8, Math.min(240, sceneW * 0.42)),
    )

    const soil = new Rectangle(sceneLeft + sceneW * 0.32, sceneTop + sceneH * 0.82, sceneW * 0.36, sceneH * 0.14, {
      fill: 'rgba(92, 64, 51, 0.75)',
      stroke: 'rgba(255,255,255,0.35)',
      lineWidth: 1,
      cornerRadius: 6,
      cursor: 'pointer',
    })
    soil.addInputListener({
      up: () => model.setSceneTip('soil'),
      enter: () => { this.hoverZone = 'soil' },
      exit: () => { if (this.hoverZone === 'soil') this.hoverZone = null },
    })
    this.addChild(soil)
    this.addChild(
      new Text('Soil / decomposition', {
        font: new PhetFont(9),
        fill: 'white',
        center: soil.center,
        maxWidth: soil.width - 8,
      }),
    )

    this.runningBadge = new Rectangle(sceneLeft + 8, sceneTop + sceneH - 28, 72, 20, {
      cornerRadius: 6,
      fill: 'rgba(39,174,96,0.85)',
    })
    this.runningText = new Text('Running', { font: new PhetFont(9), fill: 'white', center: this.runningBadge.center })
    this.addChild(this.runningBadge)
    this.addChild(this.runningText)
    model.runningProperty.link((running) => {
      this.runningBadge.fill = running ? 'rgba(39,174,96,0.85)' : 'rgba(0,0,0,0.45)'
      this.runningText.string = running ? 'Running' : 'Paused'
    })

    this.scenarioBadge = new Rectangle(sceneLeft + 88, sceneTop + sceneH - 28, 110, 20, {
      cornerRadius: 6,
      fill: 'rgba(192,57,43,0.9)',
      visible: false,
    })
    this.scenarioText = new Text('', { font: new PhetFont(9), fill: 'white', center: this.scenarioBadge.center })
    this.addChild(this.scenarioBadge)
    this.addChild(this.scenarioText)
    model.scenarioProgressProperty.link((p) => {
      const active = p >= 0
      this.scenarioBadge.visible = active
      if (active) this.scenarioText.string = `Scenario ${Math.round(p * 100)}%`
    })

    const chartBg = new Rectangle(this.chartBounds.left, this.chartBounds.top, this.chartBounds.width, this.chartBounds.height, {
      fill: 'rgba(15, 23, 42, 0.88)',
      stroke: 'rgba(255,255,255,0.2)',
      lineWidth: 1,
      cornerRadius: 8,
    })
    this.co2Path = new Path(null, { stroke: '#e74c3c', lineWidth: 2.5 })
    this.o2Path = new Path(null, { stroke: '#2ecc71', lineWidth: 2.5 })
    this.addChild(chartBg)
    this.drawChartGrid()
    this.addChild(this.co2Path)
    this.addChild(this.o2Path)
    this.addChild(
      new Text('CO₂ (red) & O₂ (green) over time', {
        font: new PhetFont(10),
        fill: '#bdc3c7',
        left: this.chartBounds.left + 10,
        top: this.chartBounds.top + 5,
      }),
    )

    this.addChild(
      new CarbonControlPanel(model, {
        right: b.right - margin,
        top: sceneTop,
        maxWidth: panelW,
      }),
    )

    this.addChild(
      new ResetAllButton({
        listener: () => model.reset(),
        right: b.right - margin - panelW - 52,
        bottom: b.bottom - margin,
      }),
    )

    model.plantCountProperty.link(() => this.rebuildTrees())
    model.animalCountProperty.link(() => this.rebuildAnimals())
    model.factoryCountProperty.link(() => this.rebuildFactories())
    model.isDayProperty.link(() => this.updateSky())
    model.sunlightProperty.link(() => this.updateSky())
    model.historyProperty.link(() => this.updateChart())
    model.ratesProperty.link(() => this.updateProcessChips())

    this.rebuildTrees()
    this.rebuildAnimals()
    this.rebuildFactories()
    this.updateSky()
    this.updateChart()
    this.updateProcessChips()
    this.updateHills()
  }

  private drawChartGrid(): void {
    const cb = this.chartBounds
    const padL = 36
    const padT = 18
    const padB = 20
    const plotW = cb.width - padL - 10
    const plotH = cb.height - padT - padB
    const x0 = cb.left + padL
    const y0 = cb.top + padT
    for (let i = 0; i <= 4; i++) {
      const gy = y0 + (i / 4) * plotH
      this.addChild(
        new Path(new Shape().moveTo(x0, gy).lineTo(x0 + plotW, gy), {
          stroke: 'rgba(255,255,255,0.1)',
          lineWidth: 1,
        }),
      )
      this.addChild(
        new Text(String(100 - i * 25), {
          font: new PhetFont(8),
          fill: 'rgba(255,255,255,0.45)',
          right: x0 - 4,
          centerY: gy,
        }),
      )
    }
  }

  private updateHills(): void {
    const s = this.sceneBounds
    const groundY = s.top + s.height * 0.68
    const w = s.width
    const shape = new Shape()
    shape.moveTo(s.left, groundY)
    shape.quadraticCurveTo(s.left + w * 0.18, groundY - 36, s.left + w * 0.35, groundY - 22)
    shape.quadraticCurveTo(s.left + w * 0.55, groundY - 48, s.left + w * 0.72, groundY - 24)
    shape.quadraticCurveTo(s.left + w * 0.88, groundY - 40, s.left + w, groundY - 18)
    shape.lineTo(s.left + w, groundY)
    shape.close()
    this.hillsPath.shape = shape
  }

  private updateSky(): void {
    const day = this.model.isDayProperty.value
    const sun = this.model.sunlightProperty.value
    const target = day ? 0.35 + (sun / 100) * 0.65 : 0
    this.skyBlend = target
    const blend = target
    const r = Math.round(11 + (110 - 11) * blend)
    const g = Math.round(22 + (182 - 22) * blend)
    const bl = Math.round(40 + (224 - 40) * blend)
    this.skyRect.fill = `rgb(${r},${g},${bl})`
    this.sun.visible = day
    this.moon.visible = !day
    this.groundRect.fill = day ? '#5a8f3d' : '#3d5c32'
    this.hillsPath.fill = day ? 'rgba(106,143,120,0.55)' : 'rgba(45,74,58,0.65)'
  }

  private rebuildTrees(): void {
    this.treesLayer.removeAllChildren()
    const count = Math.round(this.model.plantCountProperty.value)
    const s = this.sceneBounds
    const rates = this.model.ratesProperty.value
    const glowing = rates.photosynthesis > 0.3 && this.model.isDayProperty.value
    const cols = Math.max(1, Math.min(count, 10))
    for (let i = 0; i < count; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = s.left + 36 + col * ((s.width * 0.42) / cols) + (((i * 19) % 7) - 3) * 2
      const y = s.top + s.height * 0.54 + row * 20 + ((i * 23) % 9) - 4
      const scale = 0.75 + ((i * 41) % 11) / 18
      const tree = this.makeTree(x, y, scale, glowing)
      tree.cursor = 'pointer'
      tree.addInputListener({
        up: () => this.model.setSceneTip('trees'),
        enter: () => { this.hoverZone = 'trees' },
        exit: () => { if (this.hoverZone === 'trees') this.hoverZone = null },
      })
      this.treesLayer.addChild(tree)
    }
  }

  private makeTree(x: number, y: number, scale: number, glowing: boolean): Node {
    const n = new Node({ x, y })
    n.addChild(new Rectangle(-3 * scale, 0, 6 * scale, 18 * scale, { fill: '#6d4c41' }))
    const canopy = new Circle(14 * scale, { fill: this.model.isDayProperty.value ? '#2ecc71' : '#1a6b3a', centerY: -8 * scale })
    n.addChild(canopy)
    if (glowing) {
      n.addChild(new Circle(16 * scale, { fill: 'rgba(46,204,113,0.2)', centerY: -8 * scale }))
    }
    return n
  }

  private rebuildAnimals(): void {
    this.animalsLayer.removeAllChildren()
    const count = Math.round(this.model.animalCountProperty.value)
    const s = this.sceneBounds
    const groundY = s.top + s.height * 0.68 - 6
    for (let i = 0; i < count; i++) {
      const x = s.left + s.width * (0.1 + (i / Math.max(1, count)) * 0.38)
      const animal = new Node({ x, y: groundY, cursor: 'pointer' })
      animal.addChild(new Circle(6, { fill: this.model.isDayProperty.value ? '#8e5a2b' : '#5c3a1a', centerX: 0, centerY: 0 }))
      animal.addChild(new Circle(4, { fill: this.model.isDayProperty.value ? '#8e5a2b' : '#5c3a1a', centerX: 8, centerY: -4 }))
      animal.addInputListener({
        up: () => this.model.setSceneTip('animals'),
        enter: () => { this.hoverZone = 'animals' },
        exit: () => { if (this.hoverZone === 'animals') this.hoverZone = null },
      })
      this.animalsLayer.addChild(animal)
    }
  }

  private rebuildFactories(): void {
    this.factoryLayer.removeAllChildren()
    const count = Math.round(this.model.factoryCountProperty.value)
    const s = this.sceneBounds
    const rates = this.model.ratesProperty.value
    const groundY = s.top + s.height * 0.68
    for (let i = 0; i < Math.min(count, 10); i++) {
      const x = s.left + s.width * (0.58 + (i / 10) * 0.36)
      const g = new Node({ x, y: groundY, cursor: 'pointer' })
      g.addChild(new Rectangle(-14, -36, 28, 36, { fill: '#7f8c8d', stroke: '#2c3e50', lineWidth: 1 }))
      g.addChild(new Rectangle(4, -52, 8, 16, { fill: '#95a5a6' }))
      const smoke = rates.combustion * (0.4 + i * 0.05)
      if (smoke > 0.15) {
        const puffs = Math.min(3, 1 + Math.floor(smoke))
        for (let p = 0; p < puffs; p++) {
          g.addChild(
            new Circle(5 + p * 2, {
              fill: `rgba(70,70,70,${Math.min(0.55, 0.15 + smoke * 0.08)})`,
              centerX: 8 + p * 5,
              centerY: -58 - p * 10,
            }),
          )
        }
      }
      g.addInputListener({
        up: () => this.model.setSceneTip('factory'),
        enter: () => { this.hoverZone = 'factory' },
        exit: () => { if (this.hoverZone === 'factory') this.hoverZone = null },
      })
      this.factoryLayer.addChild(g)
    }
    for (let i = 10; i < count; i++) {
      const x = s.left + s.width * (0.55 + ((i - 10) / 10) * 0.4)
      const car = new Node({ x, y: groundY })
      car.addChild(new Rectangle(0, -8, 14, 6, { fill: '#555' }))
      car.addChild(new Circle(2.5, { fill: '#222', centerX: 3, centerY: -2 }))
      car.addChild(new Circle(2.5, { fill: '#222', centerX: 11, centerY: -2 }))
      this.factoryLayer.addChild(car)
    }
  }

  private updateProcessChips(): void {
    this.processLayer.removeAllChildren()
    const rates = this.model.ratesProperty.value
    const s = this.sceneBounds
    const items: { label: string; x: number; y: number; on: boolean; hot: boolean }[] = [
      { label: 'Photosynthesis', x: s.left + s.width * 0.28, y: s.top + s.height * 0.42, on: rates.photosynthesis > 0.15, hot: this.hoverZone === 'trees' },
      { label: 'Respiration', x: s.left + s.width * 0.42, y: s.top + s.height * 0.58, on: rates.respiration > 0.1, hot: this.hoverZone === 'animals' },
      { label: 'Decomposition', x: s.left + s.width * 0.3, y: s.top + s.height * 0.88, on: rates.decomposition > 0.15, hot: this.hoverZone === 'soil' },
      { label: 'Combustion', x: s.left + s.width * 0.78, y: s.top + s.height * 0.46, on: rates.combustion > 0.2, hot: this.hoverZone === 'factory' },
    ]
    for (const it of items) {
      if (it.on || it.hot) this.processLayer.addChild(makeProcessChip(it.label, it.x, it.y, it.hot))
    }
  }

  private updateChart(): void {
    const hist = this.model.historyProperty.value
    const cb = this.chartBounds
    const padL = 36
    const padT = 18
    const padB = 20
    const plotW = cb.width - padL - 10
    const plotH = cb.height - padT - padB
    const x0 = cb.left + padL
    const y0 = cb.top + padT
    const yBase = y0 + plotH

    if (hist.length < 2) {
      this.co2Path.shape = null
      this.o2Path.shape = null
      return
    }

    const co2Shape = new Shape()
    const o2Shape = new Shape()
    hist.forEach((sample, i) => {
      const x = x0 + (i / (hist.length - 1)) * plotW
      const yCo2 = yBase - (sample.co2 / 100) * plotH
      const yO2 = yBase - (sample.o2 / 100) * plotH
      if (i === 0) {
        co2Shape.moveTo(x, yCo2)
        o2Shape.moveTo(x, yO2)
      } else {
        co2Shape.lineTo(x, yCo2)
        o2Shape.lineTo(x, yO2)
      }
    })
    this.co2Path.shape = co2Shape
    this.o2Path.shape = o2Shape
  }

  public override step(dt: number): void {
    const capped = Math.min(dt, 0.05)
    this.model.step(capped)

    const day = this.model.isDayProperty.value
    const sun = this.model.sunlightProperty.value
    const target = day ? 0.35 + (sun / 100) * 0.65 : 0
    this.skyBlend += (target - this.skyBlend) * (1 - Math.exp(-capped * 6))

    this.cloudLayer.step(capped, this.sceneBounds, this.skyBlend)
    this.particleLayer.update(
      capped,
      this.sceneBounds,
      day,
      sun,
      this.model.plantCountProperty.value,
      this.model.factoryCountProperty.value,
      this.model.ratesProperty.value,
    )
    this.updateProcessChips()
  }
}
