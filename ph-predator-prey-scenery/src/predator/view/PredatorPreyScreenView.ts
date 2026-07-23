import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Path, Rectangle, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont } from 'scenerystack/scenery-phet'
import { PredatorPreyModel } from '../model/PredatorPreyModel.js'
import { PreyControlPanel } from './PreyControlPanel.js'
import { PreySounds } from './PreySounds.js'

type Options = EmptySelfOptions & ScreenViewOptions

export class PredatorPreyScreenView extends ScreenView {
  private readonly model: PredatorPreyModel
  private readonly sounds: PreySounds
  private readonly fieldBounds: { left: number; top: number; width: number; height: number }
  private readonly chartBounds: { left: number; top: number; width: number; height: number }
  private readonly agentLayer: Node
  private readonly fxLayer: Node
  private readonly preyPath: Path
  private readonly predPath: Path
  private readonly tipCard: Node
  private readonly tipText: Text
  private readonly phaseBadge: Text
  private readonly modeBadge: Text
  private readonly sun: Circle
  private readonly sunGlow: Circle
  private readonly huntPulse: Circle
  private animTime = 0
  private lastHuntSound = 0
  private lastPeakSound = 0
  private grassBlades: { x: number; h: number; phase: number }[] = []

  public constructor(model: PredatorPreyModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    this.sounds = new PreySounds()

    const margin = 10
    const panelW = 268
    const statusH = 36
    const b = this.layoutBounds

    const sceneLeft = b.left + margin
    const sceneTop = b.top + statusH + margin
    const sceneW = b.width - panelW - margin * 3
    const sceneH = (b.height - statusH - margin * 2) * 0.58
    this.fieldBounds = { left: sceneLeft, top: sceneTop, width: sceneW, height: sceneH }

    const chartTop = sceneTop + sceneH + 10
    const chartH = b.bottom - margin - chartTop
    this.chartBounds = { left: sceneLeft, top: chartTop, width: sceneW, height: chartH }

    const statusBg = new Rectangle(b.left + margin, b.top + 4, b.width - margin * 2, statusH, {
      cornerRadius: 10,
      fill: 'rgba(15, 23, 42, 0.94)',
      stroke: 'rgba(125, 211, 252, 0.3)',
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

    // Meadow field
    const field = new Rectangle(sceneLeft, sceneTop, sceneW, sceneH, {
      fill: '#1a5c38',
      cornerRadius: 14,
      stroke: 'rgba(255,255,255,0.14)',
      lineWidth: 1,
      cursor: 'pointer',
    })
    this.addChild(field)

    // Sky band
    this.addChild(
      new Rectangle(sceneLeft, sceneTop, sceneW, sceneH * 0.28, {
        fill: '#2a6f8f',
        cornerRadius: 14,
        pickable: false,
      }),
    )
    this.addChild(
      new Rectangle(sceneLeft, sceneTop + sceneH * 0.2, sceneW, sceneH * 0.14, {
        fill: 'rgba(74, 155, 110, 0.55)',
        pickable: false,
      }),
    )

    // Distant hills
    const hills = new Shape()
    hills.moveTo(sceneLeft, sceneTop + sceneH * 0.38)
    hills.quadraticCurveTo(
      sceneLeft + sceneW * 0.3,
      sceneTop + sceneH * 0.22,
      sceneLeft + sceneW * 0.55,
      sceneTop + sceneH * 0.36,
    )
    hills.quadraticCurveTo(
      sceneLeft + sceneW * 0.8,
      sceneTop + sceneH * 0.48,
      sceneLeft + sceneW,
      sceneTop + sceneH * 0.32,
    )
    hills.lineTo(sceneLeft + sceneW, sceneTop + sceneH * 0.55)
    hills.lineTo(sceneLeft, sceneTop + sceneH * 0.55)
    hills.close()
    this.addChild(new Path(hills, { fill: 'rgba(34, 100, 60, 0.55)', pickable: false }))

    // Trees
    for (let i = 0; i < 6; i++) {
      const tx = sceneLeft + sceneW * (0.1 + i * 0.15)
      const ty = sceneTop + sceneH * (0.42 + (i % 2) * 0.04)
      this.addChild(new Rectangle(tx - 2, ty, 4, 14, { fill: '#3e2723', pickable: false }))
      this.addChild(new Circle(9, { fill: '#1b5e20', centerX: tx, centerY: ty - 2, pickable: false }))
    }

    // Grass blades (animated in step)
    for (let i = 0; i < 40; i++) {
      this.grassBlades.push({
        x: sceneLeft + 10 + (i / 40) * (sceneW - 20),
        h: 6 + (i % 5) * 2,
        phase: i * 0.4,
      })
    }
    this.fxLayer = new Node({ pickable: false })
    this.addChild(this.fxLayer)

    this.sunGlow = new Circle(36, {
      fill: 'rgba(255,220,80,0.25)',
      centerX: sceneLeft + sceneW - 48,
      centerY: sceneTop + 36,
      pickable: false,
    })
    this.sun = new Circle(16, {
      fill: '#f4d03f',
      centerX: this.sunGlow.centerX,
      centerY: this.sunGlow.centerY,
      pickable: false,
    })
    this.addChild(this.sunGlow)
    this.addChild(this.sun)

    // Divider + hints
    const midX = sceneLeft + sceneW * 0.5
    this.addChild(
      new Rectangle(midX - 0.5, sceneTop + 20, 1, sceneH - 50, {
        fill: 'rgba(255,255,255,0.2)',
        pickable: false,
      }),
    )
    this.addChild(
      new Text('＋ Prey (tap)', {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: 'rgba(255,255,255,0.45)',
        centerX: sceneLeft + sceneW * 0.25,
        bottom: sceneTop + sceneH - 10,
        pickable: false,
      }),
    )
    this.addChild(
      new Text('＋ Predators (tap)', {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: 'rgba(255,255,255,0.45)',
        centerX: sceneLeft + sceneW * 0.75,
        bottom: sceneTop + sceneH - 10,
        pickable: false,
      }),
    )

    this.agentLayer = new Node({ pickable: false })
    this.addChild(this.agentLayer)

    this.huntPulse = new Circle(20, {
      fill: 'rgba(248, 113, 113, 0.55)',
      visible: false,
      pickable: false,
    })
    this.addChild(this.huntPulse)

    // Field tap zones
    const leftZone = new Rectangle(sceneLeft, sceneTop, sceneW * 0.5, sceneH, {
      fill: 'rgba(0,0,0,0)',
      cursor: 'pointer',
    })
    const rightZone = new Rectangle(sceneLeft + sceneW * 0.5, sceneTop, sceneW * 0.5, sceneH, {
      fill: 'rgba(0,0,0,0)',
      cursor: 'pointer',
    })
    leftZone.addInputListener({
      up: event => {
        const local = leftZone.globalToLocalPoint(event.pointer.point)
        this.flashAt(sceneLeft + local.x, sceneTop + local.y, '#2ecc71')
        model.addPrey()
        this.sounds.spawnPrey()
      },
    })
    rightZone.addInputListener({
      up: event => {
        const local = rightZone.globalToLocalPoint(event.pointer.point)
        this.flashAt(sceneLeft + sceneW * 0.5 + local.x, sceneTop + local.y, '#e74c3c')
        model.addPredators()
        this.sounds.spawnPredator()
      },
    })
    this.addChild(leftZone)
    this.addChild(rightZone)

    this.modeBadge = new Text('', {
      font: new PhetFont({ size: 10, weight: 'bold' }),
      fill: '#ecfeff',
      pickable: false,
    })
    const modeBg = new Rectangle(0, 0, 120, 20, {
      fill: 'rgba(15,23,42,0.7)',
      cornerRadius: 10,
      pickable: false,
    })
    modeBg.left = sceneLeft + 10
    modeBg.top = sceneTop + 10
    this.modeBadge.center = modeBg.center
    this.addChild(modeBg)
    this.addChild(this.modeBadge)

    this.phaseBadge = new Text(model.phaseLabelProperty, {
      font: new PhetFont({ size: 10, weight: 'bold' }),
      fill: '#fde68a',
      pickable: false,
    })
    const phaseBg = new Rectangle(0, 0, 140, 20, {
      fill: 'rgba(15,23,42,0.7)',
      cornerRadius: 10,
      pickable: false,
    })
    phaseBg.left = sceneLeft + 140
    phaseBg.top = sceneTop + 10
    this.phaseBadge.left = phaseBg.left + 8
    this.phaseBadge.centerY = phaseBg.centerY
    this.addChild(phaseBg)
    this.addChild(this.phaseBadge)
    model.phaseLabelProperty.link(() => {
      this.phaseBadge.left = phaseBg.left + 8
      this.phaseBadge.centerY = phaseBg.centerY
    })

    model.modeProperty.link(mode => {
      this.modeBadge.string =
        mode === 'predation' ? 'Predation' : mode === 'competition' ? 'Competition' : 'Mutualism'
      this.modeBadge.center = modeBg.center
    })

    // Tip card
    this.tipText = new Text('', {
      font: new PhetFont(10),
      fill: '#ecfeff',
      maxWidth: sceneW * 0.7,
    })
    const tipBg = new Rectangle(0, 0, 20, 20, {
      fill: 'rgba(8, 18, 32, 0.88)',
      cornerRadius: 8,
      stroke: 'rgba(125, 211, 252, 0.4)',
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
      this.tipCard.bottom = sceneTop + sceneH - 28
      this.tipCard.visible = model.showTipsProperty.value
    }
    model.tipProperty.link(refreshTip)
    model.showTipsProperty.link(refreshTip)

    // Chart
    const chartBg = new Rectangle(sceneLeft, chartTop, sceneW, chartH, {
      fill: 'rgba(15, 23, 42, 0.9)',
      cornerRadius: 12,
      stroke: 'rgba(255,255,255,0.15)',
      lineWidth: 1,
    })
    this.addChild(chartBg)
    this.addChild(
      new Text('Population over time', {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#bdc3c7',
        left: sceneLeft + 12,
        top: chartTop + 8,
      }),
    )
    this.addChild(
      new Text('Prey', {
        font: new PhetFont(10),
        fill: '#2ecc71',
        right: sceneLeft + sceneW - 90,
        top: chartTop + 8,
      }),
    )
    this.addChild(
      new Text('Predators', {
        font: new PhetFont(10),
        fill: '#e74c3c',
        right: sceneLeft + sceneW - 14,
        top: chartTop + 8,
      }),
    )

    this.preyPath = new Path(null, { stroke: '#2ecc71', lineWidth: 2.4, lineJoin: 'round' })
    this.predPath = new Path(null, { stroke: '#e74c3c', lineWidth: 2.4, lineJoin: 'round' })
    this.addChild(this.preyPath)
    this.addChild(this.predPath)

    // Chart grid
    const plotL = sceneLeft + 36
    const plotT = chartTop + 28
    const plotW = sceneW - 48
    const plotH = chartH - 40
    for (let i = 0; i <= 4; i++) {
      const y = plotT + (i / 4) * plotH
      this.addChild(
        new Path(Shape.lineSegment(plotL, y, plotL + plotW, y), {
          stroke: 'rgba(255,255,255,0.08)',
          lineWidth: 1,
        }),
      )
    }

    this.addChild(
      new PreyControlPanel(model, this.sounds, {
        right: b.right - margin,
        top: sceneTop,
        maxWidth: panelW,
        panelMaxHeight: b.bottom - sceneTop - margin,
      }),
    )

    model.soundEnabledProperty.link(on => this.sounds.setEnabled(on))
    model.historyProperty.link(() => this.redrawChart())
    model.huntFlashProperty.lazyLink(v => {
      if (v > 0.5 && Date.now() - this.lastPeakSound > 800) {
        this.lastPeakSound = Date.now()
        this.sounds.cyclePeak()
      }
    })

    this.redrawChart()
  }

  private flashAt(x: number, y: number, color: string): void {
    this.huntPulse.fill = color
    this.huntPulse.centerX = x
    this.huntPulse.centerY = y
    this.huntPulse.visible = true
    this.huntPulse.opacity = 1
    this.huntPulse.radius = 18
  }

  private redrawChart(): void {
    const cb = this.chartBounds
    const plotL = cb.left + 36
    const plotT = cb.top + 28
    const plotW = cb.width - 48
    const plotH = cb.height - 40
    const hist = this.model.historyProperty.value
    const preyShape = new Shape()
    const predShape = new Shape()
    if (hist.length > 1) {
      for (let i = 0; i < hist.length; i++) {
        const x = plotL + (i / Math.max(1, hist.length - 1)) * plotW
        const preyY = plotT + plotH - (hist[i]!.prey / 120) * (plotH - 6) - 2
        const predY = plotT + plotH - (hist[i]!.predators / 120) * (plotH - 6) - 2
        if (i === 0) {
          preyShape.moveTo(x, preyY)
          predShape.moveTo(x, predY)
        } else {
          preyShape.lineTo(x, preyY)
          predShape.lineTo(x, predY)
        }
      }
    }
    this.preyPath.shape = preyShape
    this.predPath.shape = predShape
  }

  public override step(dt: number): void {
    const capped = Math.min(dt, 0.05)
    this.model.step(capped)
    this.animTime += capped

    const pulse = this.animTime
    this.sun.radius = 16 + Math.sin(pulse * 2) * 1.5
    this.sunGlow.radius = 30 + Math.sin(pulse * 2) * 4
    this.sunGlow.opacity = 0.28 + Math.sin(pulse * 2.2) * 0.08

    // Grass sway
    this.fxLayer.removeAllChildren()
    const fb = this.fieldBounds
    for (const g of this.grassBlades) {
      const sway = Math.sin(pulse * 3 + g.phase) * 3
      const sh = new Shape()
      sh.moveTo(g.x, fb.top + fb.height - 8)
      sh.quadraticCurveTo(g.x + sway, fb.top + fb.height - 8 - g.h * 0.5, g.x + sway * 1.2, fb.top + fb.height - 8 - g.h)
      this.fxLayer.addChild(
        new Path(sh, {
          stroke: 'rgba(134, 239, 172, 0.35)',
          lineWidth: 1.5,
        }),
      )
    }

    // Agents
    this.agentLayer.removeAllChildren()
    const mode = this.model.modeProperty.value
    for (const a of this.model.agents) {
      const x = fb.left + a.x * fb.width
      const y = fb.top + a.y * fb.height
      if (a.kind === 'prey') {
        const bob = Math.sin(a.phase) * 1.5
        this.agentLayer.addChild(
          new Circle(4.2, {
            fill: '#2ecc71',
            stroke: 'rgba(255,255,255,0.5)',
            lineWidth: 1,
            centerX: x,
            centerY: y + bob,
          }),
        )
        this.agentLayer.addChild(
          new Circle(2.2, {
            fill: '#a7f3d0',
            centerX: x + 3,
            centerY: y + bob - 2,
          }),
        )
      } else {
        const node = new Node()
        const body = new Circle(5.5, {
          fill: mode === 'mutualism' ? '#f59e0b' : '#e74c3c',
          stroke: 'rgba(255,255,255,0.45)',
          lineWidth: 1,
        })
        const ear = new Circle(2, { fill: mode === 'mutualism' ? '#fbbf24' : '#c0392b', centerX: 4, centerY: -4 })
        node.addChild(body)
        node.addChild(ear)
        node.centerX = x
        node.centerY = y
        this.agentLayer.addChild(node)
      }
    }

    // Hunt flash / spawn flash decay
    if (this.huntPulse.visible) {
      this.huntPulse.opacity = Math.max(0, this.huntPulse.opacity - capped * 2.2)
      this.huntPulse.radius = 18 + (1 - this.huntPulse.opacity) * 20
      if (this.huntPulse.opacity <= 0.05) this.huntPulse.visible = false
    }

    if (this.model.huntFlashProperty.value > 0.2 && mode === 'predation') {
      if (Date.now() - this.lastHuntSound > 400) {
        this.lastHuntSound = Date.now()
        this.sounds.hunt()
      }
      // Center pulse on a random predator for drama
      const preds = this.model.agents.filter(a => a.kind === 'predator')
      if (preds.length && !this.huntPulse.visible) {
        const p = preds[Math.floor(Math.random() * preds.length)]!
        this.flashAt(fb.left + p.x * fb.width, fb.top + p.y * fb.height, 'rgba(248,113,113,0.7)')
      }
    }
  }
}
