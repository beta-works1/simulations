import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, DragListener, Node, Path, Rectangle, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont } from 'scenerystack/scenery-phet'
import { PredatorPreyModel, REFUGE } from '../model/PredatorPreyModel.js'
import { PreyControlPanel } from './PreyControlPanel.js'
import { PreySounds } from './PreySounds.js'

type Options = EmptySelfOptions & ScreenViewOptions

export class PredatorPreyScreenView extends ScreenView {
  private readonly model: PredatorPreyModel
  private readonly sounds: PreySounds
  private readonly fieldBounds: { left: number; top: number; width: number; height: number }
  private readonly chartBounds: { left: number; top: number; width: number; height: number }
  private readonly skyRect: Rectangle
  private readonly nightOverlay: Rectangle
  private readonly agentLayer: Node
  private readonly fxLayer: Node
  private readonly chaseLayer: Node
  private readonly preyPath: Path
  private readonly predPath: Path
  private readonly preyFill: Path
  private readonly phasePath: Path
  private readonly tipCard: Node
  private readonly tipText: Text
  private readonly guideCard: Node
  private readonly guideText: Text
  private readonly phaseBadge: Text
  private readonly modeBadge: Text
  private readonly sun: Circle
  private readonly sunGlow: Circle
  private readonly moon: Circle
  private readonly huntPulse: Circle
  private readonly pondRipple: Circle
  private animTime = 0
  private lastHuntSound = 0
  private lastPeakSound = 0
  private grassBlades: { x: number; h: number; phase: number }[] = []
  private flowers: { x: number; y: number; c: string }[] = []
  private clouds: { x: number; y: number; r: number; speed: number }[] = []
  private birds: { x: number; y: number; speed: number; phase: number }[] = []
  private draggingId: number | null = null

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
    const sceneH = (b.height - statusH - margin * 2) * 0.56
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

    const field = new Rectangle(sceneLeft, sceneTop, sceneW, sceneH, {
      fill: '#1a5c38',
      cornerRadius: 14,
      stroke: 'rgba(255,255,255,0.14)',
      lineWidth: 1,
    })
    this.addChild(field)

    this.skyRect = new Rectangle(sceneLeft, sceneTop, sceneW, sceneH * 0.3, {
      fill: '#2a6f8f',
      cornerRadius: 14,
      pickable: false,
    })
    this.addChild(this.skyRect)
    this.addChild(
      new Rectangle(sceneLeft, sceneTop + sceneH * 0.22, sceneW, sceneH * 0.14, {
        fill: 'rgba(74, 155, 110, 0.55)',
        pickable: false,
      }),
    )

    const hills = new Shape()
    hills.moveTo(sceneLeft, sceneTop + sceneH * 0.4)
    hills.quadraticCurveTo(sceneLeft + sceneW * 0.28, sceneTop + sceneH * 0.24, sceneLeft + sceneW * 0.55, sceneTop + sceneH * 0.38)
    hills.quadraticCurveTo(sceneLeft + sceneW * 0.8, sceneTop + sceneH * 0.5, sceneLeft + sceneW, sceneTop + sceneH * 0.34)
    hills.lineTo(sceneLeft + sceneW, sceneTop + sceneH * 0.55)
    hills.lineTo(sceneLeft, sceneTop + sceneH * 0.55)
    hills.close()
    this.addChild(new Path(hills, { fill: 'rgba(34, 100, 60, 0.55)', pickable: false }))

    // Pond
    const pondX = sceneLeft + sceneW * 0.72
    const pondY = sceneTop + sceneH * 0.72
    this.addChild(
      new Path(Shape.ellipse(pondX, pondY, sceneW * 0.1, sceneH * 0.055, 0), {
        fill: 'rgba(56, 189, 248, 0.45)',
        stroke: 'rgba(186, 230, 253, 0.5)',
        lineWidth: 1.5,
        pickable: false,
      }),
    )
    this.pondRipple = new Circle(8, {
      stroke: 'rgba(186, 230, 253, 0.55)',
      lineWidth: 1.5,
      fill: null,
      centerX: pondX,
      centerY: pondY,
      pickable: false,
    })
    this.addChild(this.pondRipple)

    // Refuge bush
    const refugeCx = sceneLeft + REFUGE.x * sceneW
    const refugeCy = sceneTop + REFUGE.y * sceneH
    const refugeR = REFUGE.r * Math.min(sceneW, sceneH)
    const bush = new Circle(refugeR, {
      fill: 'rgba(22, 101, 52, 0.75)',
      stroke: 'rgba(134, 239, 172, 0.55)',
      lineWidth: 2,
      centerX: refugeCx,
      centerY: refugeCy,
      cursor: 'pointer',
    })
    bush.addInputListener({
      up: () => {
        model.refugeEnabledProperty.value = !model.refugeEnabledProperty.value
        this.sounds.button()
        model.statusProperty.value = model.refugeEnabledProperty.value
          ? 'Refuge on — prey can hide in the bush.'
          : 'Refuge off — nowhere to hide.'
      },
    })
    this.addChild(bush)
    this.addChild(
      new Text('Safe bush (prey can hide)', {
        font: new PhetFont(10),
        fill: 'rgba(255,255,255,0.75)',
        centerX: refugeCx,
        centerY: refugeCy,
        pickable: false,
      }),
    )
    model.refugeEnabledProperty.link(on => {
      bush.opacity = on ? 1 : 0.35
    })

    for (let i = 0; i < 7; i++) {
      const tx = sceneLeft + sceneW * (0.08 + i * 0.13)
      const ty = sceneTop + sceneH * (0.42 + (i % 2) * 0.04)
      this.addChild(new Rectangle(tx - 2, ty, 4, 14, { fill: '#3e2723', pickable: false }))
      this.addChild(new Circle(9, { fill: '#1b5e20', centerX: tx, centerY: ty - 2, pickable: false }))
    }

    for (let i = 0; i < 10; i++) {
      this.flowers.push({
        x: sceneLeft + 20 + Math.random() * (sceneW - 40),
        y: sceneTop + sceneH * 0.55 + Math.random() * (sceneH * 0.35),
        c: ['#f472b6', '#fbbf24', '#c084fc', '#fb7185'][i % 4]!,
      })
    }
    for (let i = 0; i < 24; i++) {
      this.grassBlades.push({
        x: sceneLeft + 10 + (i / 24) * (sceneW - 20),
        h: 6 + (i % 5) * 2,
        phase: i * 0.4,
      })
    }
    for (let i = 0; i < 2; i++) {
      this.clouds.push({
        x: sceneLeft + 50 + i * 140,
        y: sceneTop + 24 + (i % 2) * 8,
        r: 14 + i * 3,
        speed: 4 + i * 2,
      })
    }
    for (let i = 0; i < 2; i++) {
      this.birds.push({
        x: sceneLeft + 40 + i * 120,
        y: sceneTop + 20 + (i % 2) * 8,
        speed: 10 + i * 3,
        phase: i,
      })
    }

    this.fxLayer = new Node({ pickable: false })
    this.addChild(this.fxLayer)

    this.sunGlow = new Circle(36, {
      fill: 'rgba(255,220,80,0.25)',
      centerX: sceneLeft + sceneW - 48,
      centerY: sceneTop + 36,
      cursor: 'pointer',
    })
    this.sun = new Circle(16, {
      fill: '#f4d03f',
      centerX: this.sunGlow.centerX,
      centerY: this.sunGlow.centerY,
      cursor: 'pointer',
    })
    this.moon = new Circle(12, {
      fill: '#e2e8f0',
      centerX: this.sun.centerX,
      centerY: this.sun.centerY,
      visible: false,
      cursor: 'pointer',
    })
    const toggleDay = () => {
      model.autoDayNightProperty.value = false
      model.isDayProperty.value = !model.isDayProperty.value
      model.dayPhaseProperty.value = model.isDayProperty.value ? 0.2 : 0.7
      this.sounds.button()
    }
    this.sun.addInputListener({ up: toggleDay })
    this.sunGlow.addInputListener({ up: toggleDay })
    this.moon.addInputListener({ up: toggleDay })
    this.addChild(this.sunGlow)
    this.addChild(this.sun)
    this.addChild(this.moon)

    this.nightOverlay = new Rectangle(sceneLeft, sceneTop, sceneW, sceneH, {
      fill: 'rgba(15, 23, 42, 0)',
      cornerRadius: 14,
      pickable: false,
    })
    this.addChild(this.nightOverlay)

    const midX = sceneLeft + sceneW * 0.5
    this.addChild(
      new Rectangle(midX - 0.5, sceneTop + 48, 1, sceneH - 80, {
        fill: 'rgba(255,255,255,0.18)',
        pickable: false,
      }),
    )
    this.addChild(
      new Text('Tap left: add prey (rabbits)', {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: 'rgba(255,255,255,0.5)',
        centerX: sceneLeft + sceneW * 0.25,
        bottom: sceneTop + sceneH - 8,
        pickable: false,
      }),
    )
    this.addChild(
      new Text('Tap right: add predators (foxes)', {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: 'rgba(255,255,255,0.5)',
        centerX: sceneLeft + sceneW * 0.75,
        bottom: sceneTop + sceneH - 8,
        pickable: false,
      }),
    )

    this.chaseLayer = new Node({ pickable: false })
    this.addChild(this.chaseLayer)
    this.agentLayer = new Node()
    this.addChild(this.agentLayer)

    this.huntPulse = new Circle(20, {
      fill: 'rgba(248, 113, 113, 0.55)',
      visible: false,
      pickable: false,
    })
    this.addChild(this.huntPulse)

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
        if (this.draggingId !== null) return
        const local = leftZone.globalToLocalPoint(event.pointer.point)
        this.flashAt(sceneLeft + local.x, sceneTop + local.y, '#2ecc71')
        model.addPrey()
        this.sounds.spawnPrey()
      },
    })
    rightZone.addInputListener({
      up: event => {
        if (this.draggingId !== null) return
        const local = rightZone.globalToLocalPoint(event.pointer.point)
        this.flashAt(sceneLeft + sceneW * 0.5 + local.x, sceneTop + local.y, '#e74c3c')
        model.addPredators()
        this.sounds.spawnPredator()
      },
    })
    this.addChild(leftZone)
    this.addChild(rightZone)

    // Badges — only mode + phase for Grade 8 clarity
    this.modeBadge = new Text('', { font: new PhetFont({ size: 11, weight: 'bold' }), fill: '#ecfeff', pickable: false })
    this.phaseBadge = new Text(model.phaseLabelProperty, {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#fde68a',
      pickable: false,
    })

    const placeBadge = (node: Text, x: number, y: number, minW = 70) => {
      const bg = new Rectangle(0, 0, minW, 22, {
        fill: 'rgba(15,23,42,0.78)',
        cornerRadius: 10,
        pickable: false,
      })
      bg.left = x
      bg.top = y
      this.addChild(bg)
      this.addChild(node)
      const sync = () => {
        bg.rectWidth = Math.max(minW, node.width + 16)
        node.left = bg.left + 8
        node.centerY = bg.centerY
      }
      sync()
      return sync
    }

    const syncMode = placeBadge(this.modeBadge, sceneLeft + 8, sceneTop + 8, 110)
    const syncPhase = placeBadge(this.phaseBadge, sceneLeft + 130, sceneTop + 8, 160)

    model.modeProperty.link(mode => {
      this.modeBadge.string =
        mode === 'predation' ? 'Predator–prey' : mode === 'competition' ? 'Competition' : 'Mutualism'
      syncMode()
    })
    model.phaseLabelProperty.link(() => syncPhase())

    // Teaching tip + live guide
    this.tipText = new Text('', { font: new PhetFont(11), fill: '#ecfeff', maxWidth: sceneW * 0.72 })
    const tipBg = new Rectangle(0, 0, 20, 20, {
      fill: 'rgba(8, 18, 32, 0.9)',
      cornerRadius: 8,
      stroke: 'rgba(125, 211, 252, 0.45)',
      lineWidth: 1,
    })
    this.tipCard = new Node({ children: [tipBg, this.tipText], pickable: false })
    this.addChild(this.tipCard)

    this.guideText = new Text('', { font: new PhetFont(11), fill: '#fde68a', maxWidth: sceneW * 0.72 })
    const guideBg = new Rectangle(0, 0, 20, 20, {
      fill: 'rgba(30, 58, 40, 0.9)',
      cornerRadius: 8,
      stroke: 'rgba(134, 239, 172, 0.4)',
      lineWidth: 1,
    })
    this.guideCard = new Node({ children: [guideBg, this.guideText], pickable: false })
    this.addChild(this.guideCard)

    const refreshTip = () => {
      this.tipText.string = model.tipProperty.value
      tipBg.rectWidth = this.tipText.width + 16
      tipBg.rectHeight = this.tipText.height + 12
      this.tipText.center = tipBg.center
      this.tipCard.left = sceneLeft + 10
      this.tipCard.bottom = sceneTop + sceneH - 36
      this.tipCard.visible = model.showTipsProperty.value

      this.guideText.string = model.guideProperty.value
      guideBg.rectWidth = this.guideText.width + 16
      guideBg.rectHeight = this.guideText.height + 12
      this.guideText.center = guideBg.center
      this.guideCard.left = sceneLeft + 10
      this.guideCard.bottom = this.tipCard.top - 6
      this.guideCard.visible = model.showTipsProperty.value
    }
    model.tipProperty.link(refreshTip)
    model.guideProperty.link(refreshTip)
    model.showTipsProperty.link(refreshTip)

    // Chart card
    const chartBg = new Rectangle(sceneLeft, chartTop, sceneW, chartH, {
      fill: 'rgba(15, 23, 42, 0.92)',
      cornerRadius: 12,
      stroke: 'rgba(255,255,255,0.15)',
      lineWidth: 1,
    })
    this.addChild(chartBg)
    this.addChild(
      new Text('Graph: populations over time (green = prey, red = predators)', {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#bdc3c7',
        left: sceneLeft + 12,
        top: chartTop + 6,
      }),
    )
    this.addChild(new Text('Prey', { font: new PhetFont(10), fill: '#2ecc71', right: sceneLeft + sceneW - 100, top: chartTop + 6 }))
    this.addChild(new Text('Predators', { font: new PhetFont(10), fill: '#e74c3c', right: sceneLeft + sceneW - 14, top: chartTop + 6 }))

    this.preyFill = new Path(null, { fill: 'rgba(46, 204, 113, 0.12)', pickable: false })
    this.preyPath = new Path(null, { stroke: '#2ecc71', lineWidth: 2.4, lineJoin: 'round' })
    this.predPath = new Path(null, { stroke: '#e74c3c', lineWidth: 2.4, lineJoin: 'round' })
    this.phasePath = new Path(null, { stroke: 'rgba(167, 139, 250, 0.7)', lineWidth: 1.5, lineJoin: 'round' })
    this.addChild(this.preyFill)
    this.addChild(this.preyPath)
    this.addChild(this.predPath)
    this.addChild(this.phasePath)

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
    model.isDayProperty.link(() => this.updateSky())
    model.huntFlashProperty.lazyLink(v => {
      if (v > 0.5 && Date.now() - this.lastPeakSound > 800) {
        this.lastPeakSound = Date.now()
        this.sounds.cyclePeak()
      }
    })

    this.updateSky()
    this.redrawChart()
  }

  private updateSky(): void {
    const day = this.model.isDayProperty.value
    this.skyRect.fill = day ? '#2a6f8f' : '#0f172a'
    this.nightOverlay.fill = day ? 'rgba(15, 23, 42, 0)' : 'rgba(15, 23, 42, 0.35)'
    this.sun.visible = day
    this.sunGlow.visible = day
    this.moon.visible = !day
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
    const timeW = cb.width * 0.62
    const plotL = cb.left + 28
    const plotT = cb.top + 26
    const plotW = timeW - 36
    const plotH = cb.height - 36
    const hist = this.model.historyProperty.value

    const preyShape = new Shape()
    const predShape = new Shape()
    const fillShape = new Shape()
    if (hist.length > 1) {
      for (let i = 0; i < hist.length; i++) {
        const x = plotL + (i / Math.max(1, hist.length - 1)) * plotW
        const preyY = plotT + plotH - (hist[i]!.prey / 120) * (plotH - 4) - 2
        const predY = plotT + plotH - (hist[i]!.predators / 120) * (plotH - 4) - 2
        if (i === 0) {
          preyShape.moveTo(x, preyY)
          predShape.moveTo(x, predY)
          fillShape.moveTo(x, plotT + plotH)
          fillShape.lineTo(x, preyY)
        } else {
          preyShape.lineTo(x, preyY)
          predShape.lineTo(x, predY)
          fillShape.lineTo(x, preyY)
        }
      }
      fillShape.lineTo(plotL + plotW, plotT + plotH)
      fillShape.close()
    }
    this.preyPath.shape = preyShape
    this.predPath.shape = predShape
    this.preyFill.shape = fillShape

    // Phase plot on the right
    const phaseL = cb.left + timeW + 8
    const phaseW = cb.width - timeW - 20
    const phaseShape = new Shape()
    if (this.model.showPhasePlotProperty.value && hist.length > 2) {
      for (let i = 0; i < hist.length; i++) {
        const x = phaseL + (hist[i]!.prey / 120) * phaseW
        const y = plotT + plotH - (hist[i]!.predators / 80) * plotH
        if (i === 0) phaseShape.moveTo(x, y)
        else phaseShape.lineTo(x, y)
      }
    }
    this.phasePath.shape = phaseShape
    this.phasePath.visible = this.model.showPhasePlotProperty.value
  }

  public override step(dt: number): void {
    const capped = Math.min(dt, 0.05)
    this.model.step(capped)
    this.animTime += capped
    const pulse = this.animTime
    const fb = this.fieldBounds
    const day = this.model.isDayProperty.value

    this.sun.radius = 16 + Math.sin(pulse * 2) * 1.5
    this.sunGlow.radius = 30 + Math.sin(pulse * 2) * 4
    this.sunGlow.opacity = day ? 0.28 + Math.sin(pulse * 2.2) * 0.08 : 0
    this.pondRipple.radius = 8 + Math.sin(pulse * 2.5) * 4
    this.pondRipple.opacity = 0.35 + Math.sin(pulse * 2.5) * 0.2

    this.fxLayer.removeAllChildren()

    // Clouds
    for (const c of this.clouds) {
      c.x += c.speed * capped * (day ? 1 : 0.4)
      if (c.x > fb.left + fb.width + 30) c.x = fb.left - 30
      this.fxLayer.addChild(
        new Circle(c.r, {
          fill: day ? 'rgba(255,255,255,0.18)' : 'rgba(148,163,184,0.15)',
          centerX: c.x,
          centerY: c.y,
        }),
      )
      this.fxLayer.addChild(
        new Circle(c.r * 0.7, {
          fill: day ? 'rgba(255,255,255,0.14)' : 'rgba(148,163,184,0.12)',
          centerX: c.x + 12,
          centerY: c.y + 2,
        }),
      )
    }

    // Birds
    for (const bird of this.birds) {
      bird.x += bird.speed * capped
      if (bird.x > fb.left + fb.width + 20) bird.x = fb.left - 20
      const wing = Math.sin(pulse * 8 + bird.phase) * 3
      const sh = new Shape()
      sh.moveTo(bird.x - 5, bird.y)
      sh.quadraticCurveTo(bird.x, bird.y - 2 - wing, bird.x + 5, bird.y)
      this.fxLayer.addChild(new Path(sh, { stroke: 'rgba(15,23,42,0.4)', lineWidth: 1.4 }))
    }

    // Flowers
    for (const f of this.flowers) {
      this.fxLayer.addChild(new Circle(2.2, { fill: f.c, centerX: f.x, centerY: f.y, opacity: 0.75 }))
    }

    // Grass
    for (const g of this.grassBlades) {
      const sway = Math.sin(pulse * 3 + g.phase) * 3
      const sh = new Shape()
      sh.moveTo(g.x, fb.top + fb.height - 8)
      sh.quadraticCurveTo(g.x + sway, fb.top + fb.height - 8 - g.h * 0.5, g.x + sway * 1.2, fb.top + fb.height - 8 - g.h)
      this.fxLayer.addChild(new Path(sh, { stroke: 'rgba(134, 239, 172, 0.35)', lineWidth: 1.5 }))
    }

    // Chase lines
    this.chaseLayer.removeAllChildren()
    if (this.model.showChaseLinesProperty.value) {
      for (const link of this.model.chaseLinks) {
        const from = this.model.agents.find(a => a.id === link.fromId)
        const to = this.model.agents.find(a => a.id === link.toId)
        if (!from || !to) continue
        this.chaseLayer.addChild(
          new Path(
            Shape.lineSegment(
              fb.left + from.x * fb.width,
              fb.top + from.y * fb.height,
              fb.left + to.x * fb.width,
              fb.top + to.y * fb.height,
            ),
            {
              stroke: 'rgba(248, 113, 113, 0.45)',
              lineWidth: 1.5,
              lineDash: [4, 3],
            },
          ),
        )
      }
    }

    // Agents (rebuild interactive nodes)
    this.agentLayer.removeAllChildren()
    const mode = this.model.modeProperty.value
    for (const a of this.model.agents) {
      const x = fb.left + a.x * fb.width
      const y = fb.top + a.y * fb.height
      const node = new Node({ cursor: 'grab', pickable: true })
      if (a.kind === 'prey') {
        const bob = Math.sin(a.phase) * 1.5
        const body = new Circle(4.4, {
          fill: a.inRefuge ? '#86efac' : '#2ecc71',
          stroke: a.inRefuge ? '#fde68a' : 'rgba(255,255,255,0.55)',
          lineWidth: a.inRefuge ? 2 : 1,
          centerY: bob,
        })
        node.addChild(body)
        node.addChild(new Circle(2.2, { fill: '#a7f3d0', centerX: 3, centerY: bob - 2 }))
      } else {
        node.addChild(
          new Circle(5.8, {
            fill: mode === 'mutualism' ? '#f59e0b' : '#e74c3c',
            stroke: 'rgba(255,255,255,0.45)',
            lineWidth: 1,
          }),
        )
        node.addChild(
          new Circle(2.2, {
            fill: mode === 'mutualism' ? '#fbbf24' : '#c0392b',
            centerX: 4,
            centerY: -4,
          }),
        )
      }
      node.centerX = x
      node.centerY = y

      const agentId = a.id
      node.addInputListener(
        new DragListener({
          allowTouchSnag: true,
          start: () => {
            this.draggingId = agentId
            this.sounds.softClick()
          },
          drag: event => {
            const local = this.globalToLocalPoint(event.pointer.point)
            const nx = (local.x - fb.left) / fb.width
            const ny = (local.y - fb.top) / fb.height
            this.model.moveAgent(agentId, nx, ny)
          },
          end: () => {
            this.draggingId = null
          },
        }),
      )
      this.agentLayer.addChild(node)
    }

    if (this.huntPulse.visible) {
      this.huntPulse.opacity = Math.max(0, this.huntPulse.opacity - capped * 2.2)
      this.huntPulse.radius = 18 + (1 - this.huntPulse.opacity) * 20
      if (this.huntPulse.opacity <= 0.05) this.huntPulse.visible = false
    }

    if (this.model.huntFlashProperty.value > 0.2 && mode === 'predation') {
      if (Date.now() - this.lastHuntSound > 1200) {
        this.lastHuntSound = Date.now()
        this.sounds.hunt()
      }
      const preds = this.model.agents.filter(a => a.kind === 'predator')
      if (preds.length && !this.huntPulse.visible) {
        const p = preds[Math.floor(Math.random() * preds.length)]!
        this.flashAt(fb.left + p.x * fb.width, fb.top + p.y * fb.height, 'rgba(248,113,113,0.7)')
      }
    }
  }
}
