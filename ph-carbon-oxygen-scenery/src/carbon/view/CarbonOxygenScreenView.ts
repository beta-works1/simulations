import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Path, Rectangle, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { CarbonOxygenModel } from '../model/CarbonOxygenModel.js'
import { CarbonControlPanel } from './CarbonControlPanel.js'

type Options = EmptySelfOptions & ScreenViewOptions

export class CarbonOxygenScreenView extends ScreenView {
  private readonly model: CarbonOxygenModel
  private readonly sceneLayer: Node
  private readonly treesLayer: Node
  private readonly factoryLayer: Node
  private readonly skyRect: Rectangle
  private readonly groundRect: Rectangle
  private readonly sun: Circle
  private readonly co2Path: Path
  private readonly o2Path: Path
  private readonly takeawayBg: Rectangle
  private readonly sceneBounds: { left: number; top: number; width: number; height: number }
  private readonly chartBounds: { left: number; top: number; width: number; height: number }

  public constructor(model: CarbonOxygenModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const margin = 14
    const panelW = 250
    const statusH = 42
    const b = this.layoutBounds

    const sceneLeft = b.left + margin
    const sceneTop = b.top + statusH + margin
    const sceneW = b.width - panelW - margin * 3
    const sceneH = (b.height - statusH - margin * 2) * 0.58
    this.sceneBounds = { left: sceneLeft, top: sceneTop, width: sceneW, height: sceneH }

    const chartTop = sceneTop + sceneH + 10
    const chartH = b.bottom - margin - chartTop
    this.chartBounds = { left: sceneLeft, top: chartTop, width: sceneW, height: chartH }

    const statusBg = new Rectangle(b.left + margin, b.top + 8, b.width - margin * 2, statusH, {
      cornerRadius: 10,
      fill: 'rgba(15, 23, 42, 0.92)',
    })
    this.addChild(statusBg)
    this.addChild(
      new Text(model.statusProperty, {
        font: new PhetFont(12),
        fill: '#ecfeff',
        maxWidth: b.width - margin * 4,
        centerX: b.centerX,
        centerY: statusBg.centerY,
      }),
    )

    this.takeawayBg = new Rectangle(b.left + margin, b.top + 54, b.width - margin * 2, 26, {
      cornerRadius: 6,
      fill: 'rgba(192, 57, 43, 0.88)',
      visible: false,
    })
    const takeawayText = new Text(model.takeawayProperty, {
      font: new PhetFont(11),
      fill: 'white',
      maxWidth: b.width - 60,
      center: this.takeawayBg.center,
    })
    model.takeawayProperty.link((t) => {
      this.takeawayBg.visible = t.length > 0
    })
    this.addChild(this.takeawayBg)
    this.addChild(takeawayText)

    this.skyRect = new Rectangle(sceneLeft, sceneTop, sceneW, sceneH * 0.72, {
      fill: '#6eb6e0',
      cornerRadius: 10,
    })
    this.groundRect = new Rectangle(sceneLeft, sceneTop + sceneH * 0.68, sceneW, sceneH * 0.32, {
      fill: '#5a8f3d',
      cornerRadius: 10,
    })
    this.sun = new Circle(28, { fill: '#f4d03f' })
    this.sun.centerX = sceneLeft + sceneW * 0.12
    this.sun.centerY = sceneTop + sceneH * 0.18

    this.sceneLayer = new Node()
    this.treesLayer = new Node()
    this.factoryLayer = new Node()

    this.addChild(this.skyRect)
    this.addChild(this.groundRect)
    this.addChild(this.sun)
    this.addChild(this.sceneLayer)
    this.sceneLayer.addChild(this.treesLayer)
    this.sceneLayer.addChild(this.factoryLayer)

    const soil = new Rectangle(sceneLeft + sceneW * 0.35, sceneTop + sceneH * 0.78, sceneW * 0.3, sceneH * 0.16, {
      fill: 'rgba(92, 64, 51, 0.75)',
      stroke: 'rgba(255,255,255,0.35)',
      lineWidth: 1,
      cornerRadius: 6,
      cursor: 'pointer',
    })
    soil.addInputListener({ up: () => model.setSceneTip('soil') })
    this.sceneLayer.addChild(soil)
    this.sceneLayer.addChild(
      new Text('Soil / decomposition', {
        font: new PhetFont(10),
        fill: 'white',
        center: soil.center,
        maxWidth: soil.width - 8,
      }),
    )

    const chartBg = new Rectangle(this.chartBounds.left, this.chartBounds.top, this.chartBounds.width, this.chartBounds.height, {
      fill: 'rgba(15, 23, 42, 0.88)',
      stroke: 'rgba(255,255,255,0.2)',
      lineWidth: 1,
      cornerRadius: 8,
    })
    this.co2Path = new Path(null, { stroke: '#e74c3c', lineWidth: 2.5 })
    this.o2Path = new Path(null, { stroke: '#3498db', lineWidth: 2.5 })
    this.addChild(chartBg)
    this.addChild(this.co2Path)
    this.addChild(this.o2Path)
    this.addChild(
      new Text('CO₂ (red) & O₂ (blue) over time', {
        font: new PhetFont(11),
        fill: '#bdc3c7',
        left: this.chartBounds.left + 10,
        top: this.chartBounds.top + 6,
      }),
    )

    const gaugeCo2 = new Text('', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: '#e74c3c' })
    const gaugeO2 = new Text('', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: '#3498db' })
    model.co2Property.link((v) => {
      gaugeCo2.string = `CO₂ ${v.toFixed(0)}%`
    })
    model.o2Property.link((v) => {
      gaugeO2.string = `O₂ ${v.toFixed(0)}%`
    })
    gaugeCo2.right = sceneLeft + sceneW - 12
    gaugeCo2.top = sceneTop + 10
    gaugeO2.right = sceneLeft + sceneW - 12
    gaugeO2.top = sceneTop + 32
    this.sceneLayer.addChild(gaugeCo2)
    this.sceneLayer.addChild(gaugeO2)

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
    model.factoryCountProperty.link(() => this.rebuildFactories())
    model.isDayProperty.link(() => this.updateSky())
    model.sunlightProperty.link(() => this.updateSky())
    model.historyProperty.link(() => this.updateChart())

    this.rebuildTrees()
    this.rebuildFactories()
    this.updateSky()
    this.updateChart()
  }

  private updateSky(): void {
    const day = this.model.isDayProperty.value
    const sun = this.model.sunlightProperty.value
    const blend = day ? 0.35 + (sun / 100) * 0.65 : 0
    const r = Math.round(11 + (110 - 11) * blend)
    const g = Math.round(22 + (182 - 22) * blend)
    const bl = Math.round(40 + (224 - 40) * blend)
    this.skyRect.fill = `rgb(${r},${g},${bl})`
    this.sun.visible = day
    this.groundRect.fill = day ? '#5a8f3d' : '#3d5c32'
  }

  private rebuildTrees(): void {
    this.treesLayer.removeAllChildren()
    const count = Math.round(this.model.plantCountProperty.value)
    const s = this.sceneBounds
    const cols = Math.max(1, Math.min(count, 10))
    for (let i = 0; i < count; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = s.left + 40 + col * ((s.width * 0.45) / cols)
      const y = s.top + s.height * 0.55 + row * 22
      const tree = this.makeTree(x, y)
      tree.cursor = 'pointer'
      tree.addInputListener({ up: () => this.model.setSceneTip('trees') })
      this.treesLayer.addChild(tree)
    }
  }

  private makeTree(x: number, y: number): Node {
    const n = new Node({ x, y })
    n.addChild(new Rectangle(-4, 0, 8, 18, { fill: '#6d4c41' }))
    n.addChild(new Circle(16, { fill: '#2ecc71', centerY: -8 }))
    return n
  }

  private rebuildFactories(): void {
    this.factoryLayer.removeAllChildren()
    const count = Math.round(this.model.factoryCountProperty.value)
    const s = this.sceneBounds
    for (let i = 0; i < count; i++) {
      const x = s.left + s.width * 0.55 + (i % 4) * 42
      const y = s.top + s.height * 0.42 + Math.floor(i / 4) * 36
      const g = new Node({ x, y, cursor: 'pointer' })
      g.addChild(new Rectangle(0, 0, 34, 40, { fill: '#7f8c8d', stroke: '#2c3e50', lineWidth: 1 }))
      g.addChild(new Rectangle(10, -16, 12, 18, { fill: '#95a5a6' }))
      g.addChild(new Circle(6, { fill: 'rgba(180,180,180,0.6)', centerX: 16, centerY: -22 }))
      g.addInputListener({ up: () => this.model.setSceneTip('factory') })
      this.factoryLayer.addChild(g)
    }
  }

  private updateChart(): void {
    const hist = this.model.historyProperty.value
    const cb = this.chartBounds
    const padL = 36
    const padT = 20
    const padB = 22
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
    this.model.step(Math.min(dt, 0.05))
  }
}
