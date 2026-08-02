import { Bounds2, Matrix3, Vector2 } from 'scenerystack/dot'
import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Path, Rectangle, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont } from 'scenerystack/scenery-phet'
import { RectangularPushButton } from 'scenerystack/sun'
import { CarbonOxygenModel } from '../model/CarbonOxygenModel.js'
import { cycleStepById, dominantProcess, triadForDominant } from '../model/cycleSteps.js'
import { CarbonControlPanel } from './CarbonControlPanel.js'
import { CarbonSounds } from './CarbonSounds.js'
import { createEcologyIcon } from '../../common/EcologyArt.js'
import { DepthCard } from '../../common/ui/DepthCard.js'
import { SoftButton } from '../../common/ui/SoftButton.js'
import { GuidanceBanner } from '../../common/ui/GuidanceBanner.js'
import { TeachingTriad } from '../../common/ui/TeachingTriad.js'
import { MiniQuiz } from '../../common/ui/MiniQuiz.js'
import { ParticleBurst } from '../../common/ui/ParticleBurst.js'
import { LandscapeAgentNode } from './LandscapeAgentNode.js'
import type { LandDropTarget } from './AgentPaletteChip.js'
import {
  CarbonCloudLayer,
  CarbonParticleLayer,
  makeAtmosphereGauge,
  makeClouds,
  makeEquationPanel,
  makeProcessChip,
} from './CarbonSceneHelpers.js'

type Options = EmptySelfOptions & ScreenViewOptions
type HoverZone = 'trees' | 'animals' | 'factory' | 'soil' | 'ocean'

/** Widescreen landscape frame — cover-scaled to the window without distortion. */
const LAYOUT = new Bounds2(0, 0, 1280, 720)

const DEFAULT_STATUS =
  'Drag trees, animals, or factories onto the land. Gases come from each one you place.'

function isProcessTip(status: string): boolean {
  return (
    status.startsWith('Photosynthesis:') ||
    status.startsWith('Respiration:') ||
    status.startsWith('Combustion:') ||
    status.startsWith('Decomposition:') ||
    status.startsWith('Oceans:')
  )
}

function tipTitle(status: string): string {
  const i = status.indexOf(':')
  return i > 0 ? status.slice(0, i) : 'Info'
}

function tipBody(status: string): string {
  const i = status.indexOf(':')
  return i > 0 ? status.slice(i + 1).trim() : status
}

/**
 * Full-bleed landscape stage with floating teaching chrome.
 * Interactive panels sit on top of the scene; the scene keeps a fixed aspect
 * and cover-scales to the browser (no stretch).
 */
export class CarbonOxygenScreenView extends ScreenView {
  private readonly model: CarbonOxygenModel
  private readonly sounds: CarbonSounds
  private readonly agentsLayer: Node
  private readonly ghostLayer: Node
  private readonly landHighlight: Rectangle
  private readonly agentNodes = new Map<string, LandscapeAgentNode>()
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
  private readonly tipCard: Node
  private readonly tipTitleText: Text
  private readonly tipBodyText: Text
  private readonly soilHit: Rectangle
  private readonly oceanHit: Rectangle
  private readonly oceanWater: Rectangle
  private readonly oceanLayer: Node
  private readonly runningBadge: Rectangle
  private readonly runningText: Text
  private readonly scenarioBadge: Rectangle
  private readonly scenarioText: Text
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly soundBtnLeft: SoftButton
  private readonly particles: ParticleBurst
  private readonly miniQuiz: MiniQuiz
  private readonly sceneBounds: { left: number; top: number; width: number; height: number }
  private readonly chartBounds: { left: number; top: number; width: number; height: number }
  private readonly sceneCenterX: number
  private readonly sceneCenterY: number
  private readonly gaugeCenterX: number
  private readonly gaugeCenterY: number
  private skyBlend = 1
  private hoverZone: HoverZone | null = null
  private relayoutLeftColumn: () => void = () => undefined
  private dropTarget!: LandDropTarget

  public constructor(model: CarbonOxygenModel, providedOptions?: Options) {
    super({ ...providedOptions, layoutBounds: LAYOUT.copy() })
    this.model = model
    this.sounds = new CarbonSounds()
    this.addInputListener({ down: () => this.sounds.unlock() })

    const b = this.layoutBounds
    const sceneLeft = 0
    const sceneTop = 0
    const sceneW = b.width
    const sceneH = b.height
    this.sceneBounds = { left: sceneLeft, top: sceneTop, width: sceneW, height: sceneH }
    this.sceneCenterX = sceneW / 2
    this.sceneCenterY = sceneH / 2

    // Compact chart strip floating over the meadow (not a separate column)
    const chartW = 420
    const chartH = 110
    this.chartBounds = {
      left: sceneW * 0.28,
      top: sceneH - chartH - 14,
      width: chartW,
      height: chartH,
    }

    // ── Full-bleed landscape ────────────────────────────────────────────────
    this.skyRect = new Rectangle(sceneLeft, sceneTop, sceneW, sceneH, { fill: '#6eb6e0' })
    this.hillsPath = new Path(null, { fill: 'rgba(106,143,120,0.55)' })
    const oceanW = sceneW * 0.22
    this.oceanWater = new Rectangle(sceneLeft, sceneTop + sceneH * 0.62, oceanW, sceneH * 0.38, {
      fill: '#0ea5e9',
    })
    this.groundRect = new Rectangle(
      sceneLeft + oceanW - 10,
      sceneTop + sceneH * 0.68,
      sceneW - oceanW + 10,
      sceneH * 0.32,
      { fill: '#5a8f3d' },
    )

    this.sun = new Circle(28, { fill: '#f4d03f' })
    this.sun.centerX = sceneLeft + sceneW * 0.42
    this.sun.centerY = sceneTop + sceneH * 0.14
    this.moon = new Circle(14, { fill: '#e8eef8', visible: false })
    this.moon.centerX = this.sun.centerX
    this.moon.centerY = this.sun.centerY

    this.agentsLayer = new Node()
    this.oceanLayer = new Node()
    this.processLayer = new Node()
    this.particleLayer = new CarbonParticleLayer()
    this.cloudLayer = new CarbonCloudLayer(makeClouds())

    const land = {
      left: sceneLeft + sceneW * 0.22,
      top: sceneTop + sceneH * 0.42,
      width: sceneW * 0.55,
      height: sceneH * 0.45,
    }
    this.landHighlight = new Rectangle(land.left, land.top, land.width, land.height, {
      fill: 'rgba(255,255,255,0.14)',
      stroke: 'rgba(255,255,255,0.45)',
      lineWidth: 2,
      cornerRadius: 10,
      visible: false,
      pickable: false,
    })

    const landscape = new Node({
      clipArea: Shape.bounds(new Bounds2(sceneLeft, sceneTop, sceneLeft + sceneW, sceneTop + sceneH)),
    })
    landscape.addChild(this.skyRect)
    landscape.addChild(this.hillsPath)
    landscape.addChild(this.oceanWater)
    landscape.addChild(this.groundRect)
    landscape.addChild(this.landHighlight)
    landscape.addChild(this.cloudLayer)
    landscape.addChild(this.sun)
    landscape.addChild(this.moon)
    landscape.addChild(this.agentsLayer)
    landscape.addChild(this.oceanLayer)
    landscape.addChild(this.particleLayer)
    landscape.addChild(this.processLayer)
    this.addChild(landscape)

    this.ghostLayer = new Node()
    this.dropTarget = this.makeDropTarget()

    // Hit targets live with the landscape (under floating chrome)
    this.oceanHit = new Rectangle(sceneLeft + 4, sceneTop + sceneH * 0.64, oceanW - 8, sceneH * 0.34, {
      fill: 'rgba(14, 165, 233, 0)',
      stroke: 'rgba(255,255,255,0)',
      lineWidth: 1.5,
      cornerRadius: 8,
      cursor: 'pointer',
    })
    this.oceanHit.addInputListener({
      up: () => {
        model.setSceneTip('ocean')
        this.sounds.processTap('ocean')
      },
      enter: () => {
        this.hoverZone = 'ocean'
        this.oceanHit.fill = 'rgba(56, 189, 248, 0.28)'
        this.oceanHit.stroke = 'rgba(255,255,255,0.5)'
      },
      exit: () => {
        if (this.hoverZone === 'ocean') this.hoverZone = null
        this.oceanHit.fill = 'rgba(14, 165, 233, 0)'
        this.oceanHit.stroke = 'rgba(255,255,255,0)'
      },
    })
    this.addChild(this.oceanHit)

    this.soilHit = new Rectangle(sceneLeft + sceneW * 0.36, sceneTop + sceneH * 0.82, sceneW * 0.28, sceneH * 0.12, {
      fill: 'rgba(92, 64, 51, 0)',
      stroke: 'rgba(255,255,255,0)',
      lineWidth: 1.5,
      cornerRadius: 6,
      cursor: 'pointer',
    })
    this.soilHit.addInputListener({
      up: () => {
        model.setSceneTip('soil')
        this.sounds.processTap('soil')
      },
      enter: () => {
        this.hoverZone = 'soil'
        this.soilHit.fill = 'rgba(92, 64, 51, 0.35)'
        this.soilHit.stroke = 'rgba(255,255,255,0.45)'
      },
      exit: () => {
        if (this.hoverZone === 'soil') this.hoverZone = null
        this.soilHit.fill = 'rgba(92, 64, 51, 0)'
        this.soilHit.stroke = 'rgba(255,255,255,0)'
      },
    })
    this.addChild(this.soilHit)

    // ── Floating HUD on top of the landscape ────────────────────────────────
    const gaugeW = 150
    this.gaugeCenterX = 16 + (gaugeW + 8) / 2
    this.gaugeCenterY = 16 + 31
    this.addChild(makeAtmosphereGauge(model, 16, 16, gaugeW))

    this.runningBadge = new Rectangle(16, 84, 72, 20, {
      cornerRadius: 6,
      fill: 'rgba(39,174,96,0.85)',
    })
    this.runningText = new Text('Running', {
      font: new PhetFont(9),
      fill: 'white',
      center: this.runningBadge.center,
    })
    this.addChild(this.runningBadge)
    this.addChild(this.runningText)
    model.runningProperty.link((running) => {
      this.runningBadge.fill = running ? 'rgba(39,174,96,0.85)' : 'rgba(0,0,0,0.45)'
      this.runningText.string = running ? 'Running' : 'Paused'
      this.runningText.center = this.runningBadge.center
    })

    this.scenarioBadge = new Rectangle(96, 84, 110, 20, {
      cornerRadius: 6,
      fill: 'rgba(192,57,43,0.9)',
      visible: false,
    })
    this.scenarioText = new Text('', {
      font: new PhetFont(9),
      fill: 'white',
      center: this.scenarioBadge.center,
    })
    this.addChild(this.scenarioBadge)
    this.addChild(this.scenarioText)
    model.scenarioProgressProperty.link((p) => {
      const active = p >= 0
      this.scenarioBadge.visible = active
      if (active) {
        this.scenarioText.string = `Scenario ${Math.round(p * 100)}%`
        this.scenarioText.center = this.scenarioBadge.center
      }
    })

    const eqW = 260
    this.addChild(makeEquationPanel(model.activeProcessProperty, sceneW - eqW - 280, 16, eqW))

    this.takeawayBg = new Rectangle(sceneW / 2 - 220, 16, 440, 28, {
      cornerRadius: 8,
      fill: 'rgba(192, 57, 43, 0.92)',
      visible: false,
    })
    const takeawayText = new Text('', {
      font: new PhetFont(11),
      fill: 'white',
      maxWidth: this.takeawayBg.width - 16,
      center: this.takeawayBg.center,
    })
    model.takeawayProperty.link((t) => {
      this.takeawayBg.visible = t.length > 0
      takeawayText.string = t
      takeawayText.center = this.takeawayBg.center
    })
    this.addChild(this.takeawayBg)
    this.addChild(takeawayText)

    // Guidance strip — centered top, floats over sky
    const guideW = Math.min(640, sceneW - 520)
    this.guide = new GuidanceBanner(guideW, {
      title: 'Carbon–Oxygen Cycle',
      body: DEFAULT_STATUS,
    })
    this.guide.centerX = sceneW / 2
    this.guide.top = 12
    this.addChild(this.guide)

    // NOW / WHY / NEXT — left overlay card
    const leftW = 188
    const leftCard = new DepthCard(leftW, 320, { fill: 'rgba(11, 22, 40, 0.82)' })
    leftCard.left = 12
    leftCard.top = 118
    this.addChild(leftCard)

    this.teachingTriad = new TeachingTriad(leftW - 24)
    this.teachingTriad.left = 12
    this.teachingTriad.top = 12
    leftCard.content.addChild(this.teachingTriad)

    this.soundBtnLeft = new SoftButton(
      model.soundEnabledProperty.value ? 'Sound: On' : 'Sound: Off',
      () => {
        this.sounds.unlock()
        model.soundEnabledProperty.value = !model.soundEnabledProperty.value
      },
      { width: leftW - 24, height: 32, fill: '#64748b', fontSize: 12, selected: model.soundEnabledProperty.value },
    )
    this.soundBtnLeft.left = 12
    leftCard.content.addChild(this.soundBtnLeft)

    this.relayoutLeftColumn = () => {
      this.soundBtnLeft.top = this.teachingTriad.bottom + 12
    }
    this.relayoutLeftColumn()

    model.soundEnabledProperty.link((on) => {
      this.sounds.setEnabled(on)
      this.soundBtnLeft.setLabel(on ? 'Sound: On' : 'Sound: Off')
      this.soundBtnLeft.setSelected(on)
    })

    // Tip popover
    const tipW = 340
    this.tipCard = new Node({ visible: false })
    const tipBg = new Rectangle(0, 0, tipW, 96, {
      fill: 'rgba(15, 23, 42, 0.96)',
      stroke: 'rgba(125, 211, 252, 0.55)',
      lineWidth: 1.5,
      cornerRadius: 10,
    })
    this.tipTitleText = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#7dd3fc',
      left: 12,
      top: 10,
      maxWidth: tipW - 56,
    })
    this.tipBodyText = new Text('', {
      font: new PhetFont(11),
      fill: '#ecfeff',
      left: 12,
      top: 32,
      maxWidth: tipW - 24,
    })
    const closeBtn = new RectangularPushButton({
      content: new Text('✕', { font: new PhetFont(12), fill: 'white' }),
      baseColor: '#334155',
      xMargin: 6,
      yMargin: 2,
      listener: () => {
        model.statusProperty.value = DEFAULT_STATUS
        this.sounds.tipClose()
      },
    })
    closeBtn.right = tipW - 8
    closeBtn.top = 8
    this.tipCard.addChild(tipBg)
    this.tipCard.addChild(this.tipTitleText)
    this.tipCard.addChild(this.tipBodyText)
    this.tipCard.addChild(closeBtn)
    this.tipCard.centerX = sceneW / 2
    this.tipCard.top = 100
    this.addChild(this.tipCard)

    model.statusProperty.link((t) => {
      if (isProcessTip(t)) {
        const wasHidden = !this.tipCard.visible
        this.tipTitleText.string = tipTitle(t)
        this.tipBodyText.string = tipBody(t)
        this.tipCard.visible = true
        if (wasHidden) this.sounds.tipOpen()
      } else {
        this.tipCard.visible = false
      }
    })

    // History chart — floating over meadow
    const chartBg = new Rectangle(this.chartBounds.left, this.chartBounds.top, this.chartBounds.width, this.chartBounds.height, {
      fill: 'rgba(15, 23, 42, 0.82)',
      stroke: 'rgba(255,255,255,0.22)',
      lineWidth: 1,
      cornerRadius: 10,
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
        left: this.chartBounds.left + 40,
        top: this.chartBounds.top + 5,
        maxWidth: this.chartBounds.width - 50,
      }),
    )

    // Controls — right overlay (scrollable SoftButton panel)
    const rightW = 260
    const rightH = sceneH - 24
    const controlPanel = new CarbonControlPanel(model, this.sounds, rightW, rightH, {
      dropTarget: this.dropTarget,
      ghostLayer: this.ghostLayer,
    })
    controlPanel.right = sceneW - 10
    controlPanel.top = 12
    this.addChild(controlPanel)

    this.particles = new ParticleBurst(70)
    this.addChild(this.particles)

    this.miniQuiz = new MiniQuiz(230)
    this.miniQuiz.centerX = this.sceneCenterX
    this.miniQuiz.centerY = this.sceneCenterY
    this.addChild(this.miniQuiz)

    this.addChild(this.ghostLayer)

    model.agentsProperty.link(() => this.rebuildAgents())
    model.oceanStrengthProperty.link(() => this.rebuildOcean())
    model.isDayProperty.link(() => this.updateSky())
    model.sunlightProperty.link(() => this.updateSky())
    model.historyProperty.link(() => this.updateChart())
    model.ratesProperty.link(() => {
      this.updateProcessChips()
      this.updateGuidance()
    })

    model.balanceProperty.link(() => this.updateGuidance())
    model.scenarioProgressProperty.link(() => this.updateGuidance())
    model.cycleStepProperty.link(() => this.updateGuidance())
    model.scenarioKindProperty.link(() => this.updateGuidance())

    model.balanceProperty.lazyLink((s) => {
      const color = s === 'CO₂ rising' ? '#e74c3c' : s === 'O₂ rising' ? '#2ecc71' : '#0d9488'
      this.particles.burst(this.gaugeCenterX, this.gaugeCenterY, {
        count: 18,
        color,
        speed: 65,
        life: 0.55,
        radius: 3,
      })
    })

    model.scenarioKindProperty.lazyLink((kind) => {
      if (kind === 'none') return
      this.particles.burst(this.sceneCenterX, this.sceneCenterY, {
        count: 22,
        color: kind === 'deforestation' ? '#c0392b' : '#16a34a',
        speed: 85,
        life: 0.6,
        radius: 3.5,
      })
    })
    model.scenarioProgressProperty.lazyLink((p, oldP) => {
      if (p < 0 && oldP !== null && oldP >= 0.999) {
        this.onScenarioComplete(model.scenarioKindProperty.value)
      }
    })

    this.rebuildAgents()
    this.rebuildOcean()
    this.updateSky()
    this.updateChart()
    this.updateProcessChips()
    this.updateHills()
    this.updateGuidance()
  }

  private landRect(): { left: number; top: number; width: number; height: number } {
    const s = this.sceneBounds
    return {
      left: s.left + s.width * 0.22,
      top: s.top + s.height * 0.42,
      width: s.width * 0.55,
      height: s.height * 0.45,
    }
  }

  private landToLocal(nx: number, ny: number): { x: number; y: number } {
    const land = this.landRect()
    return {
      x: land.left + nx * land.width,
      y: land.top + ny * land.height,
    }
  }

  private makeDropTarget(): LandDropTarget {
    return {
      containsGlobalPoint: (gx, gy) => {
        const local = this.globalToLocalPoint(new Vector2(gx, gy))
        const land = this.landRect()
        return (
          local.x >= land.left &&
          local.x <= land.left + land.width &&
          local.y >= land.top &&
          local.y <= land.top + land.height
        )
      },
      globalToLandNorm: (gx, gy) => {
        const local = this.globalToLocalPoint(new Vector2(gx, gy))
        const land = this.landRect()
        if (
          local.x < land.left ||
          local.x > land.left + land.width ||
          local.y < land.top ||
          local.y > land.top + land.height
        ) {
          return null
        }
        return {
          nx: (local.x - land.left) / land.width,
          ny: (local.y - land.top) / land.height,
        }
      },
      setHighlight: (on) => {
        this.landHighlight.visible = on
      },
    }
  }

  private rebuildAgents(): void {
    const agents = this.model.agentsProperty.value
    const ids = new Set(agents.map((a) => a.id))
    for (const [id, node] of this.agentNodes) {
      if (!ids.has(id)) {
        this.agentsLayer.removeChild(node)
        this.agentNodes.delete(id)
      }
    }
    for (const agent of agents) {
      let node = this.agentNodes.get(agent.id)
      if (!node) {
        node = new LandscapeAgentNode(
          agent,
          (nx, ny) => this.landToLocal(nx, ny),
          this.dropTarget,
          (id, nx, ny) => this.model.moveAgent(id, nx, ny),
          (id) => this.model.removeAgent(id),
          (kind) => {
            const zone = kind === 'plant' ? 'trees' : kind === 'animal' ? 'animals' : 'factory'
            this.model.setSceneTip(zone)
            this.sounds.processTap(zone)
          },
          this.sounds,
        )
        this.agentNodes.set(agent.id, node)
        this.agentsLayer.addChild(node)
      } else {
        node.syncPosition(agent, (nx, ny) => this.landToLocal(nx, ny))
      }
    }
    this.updateProcessChips()
  }

  private onScenarioComplete(kind: string): void {
    this.particles.burst(this.sceneCenterX, this.sceneCenterY, {
      count: 32,
      color: kind === 'deforestation' ? '#c0392b' : '#16a34a',
      speed: 110,
      life: 0.75,
      radius: 4,
    })
    this.sounds.celebrate()
    this.miniQuiz.showQuiz(
      'What raises CO₂ the most?',
      [
        { label: 'Combustion', correct: true },
        { label: 'Photosynthesis', correct: false },
      ],
      (correct) => {
        correct ? this.sounds.correct() : this.sounds.wrong()
      },
    )
  }

  private updateGuidance(): void {
    if (this.model.scenarioActive) {
      const kind = this.model.scenarioKindProperty.value
      const pct = Math.round(this.model.scenarioProgressProperty.value * 100)
      if (kind === 'deforestation') {
        this.guide.setGuidance(
          'Deforestation + industry — running',
          `${pct}% — cutting down trees and adding factories.`,
        )
        this.teachingTriad.setTriad(
          `Deforestation scenario — ${pct}%`,
          'Fewer trees mean less photosynthesis; more factories mean more combustion.',
          'Watch CO₂ climb and O₂ fall on the chart.',
        )
      } else if (kind === 'reforestation') {
        this.guide.setGuidance(
          'Reforestation recovery — running',
          `${pct}% — planting trees and cutting emissions.`,
        )
        this.teachingTriad.setTriad(
          `Reforestation scenario — ${pct}%`,
          'More trees add photosynthesis; fewer factories cut combustion.',
          'Watch CO₂ fall and O₂ rise on the chart.',
        )
      }
      this.relayoutLeftColumn()
      return
    }

    const stepId = this.model.cycleStepProperty.value
    if (stepId !== 'free') {
      const step = cycleStepById(stepId)
      if (step) {
        this.guide.setGuidance(step.guideTitle, step.guideBody)
        this.teachingTriad.setTriad(step.now, step.why, step.next)
        this.relayoutLeftColumn()
        return
      }
    }

    const rates = this.model.ratesProperty.value
    const [now, why, next] = triadForDominant(dominantProcess(rates))
    const balance = this.model.balanceProperty.value
    if (balance === 'CO₂ rising') {
      this.guide.setGuidance(
        'CO₂ is rising',
        'Breathing, decay, and burning are outpacing plants and the ocean.',
      )
      this.teachingTriad.setTriad(
        'CO₂ is rising.',
        'Animals, soil, and factories release more CO₂ than plants and oceans take up.',
        'Raise Plants or Ocean strength, or lower Factories.',
      )
    } else if (balance === 'O₂ rising') {
      this.guide.setGuidance('O₂ is rising', 'Photosynthesis is outpacing respiration and combustion.')
      this.teachingTriad.setTriad(
        'O₂ is rising.',
        'Plants are making more oxygen than animals, soil, and factories are using up.',
        'Try Steps 1–5, or the Deforestation scenario to tip the balance.',
      )
    } else {
      this.guide.setGuidance('Free play — cycle balanced', 'CO₂ and O₂ are holding roughly steady. Use Steps 1–5 anytime.')
      this.teachingTriad.setTriad(now, why, next)
    }
    this.relayoutLeftColumn()
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
    shape.quadraticCurveTo(s.left + w * 0.18, groundY - 48, s.left + w * 0.35, groundY - 28)
    shape.quadraticCurveTo(s.left + w * 0.55, groundY - 64, s.left + w * 0.72, groundY - 30)
    shape.quadraticCurveTo(s.left + w * 0.88, groundY - 52, s.left + w, groundY - 22)
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
    this.oceanWater.fill = day ? '#0ea5e9' : '#0369a1'
    this.hillsPath.fill = day ? 'rgba(106,143,120,0.55)' : 'rgba(45,74,58,0.65)'
  }

  private rebuildOcean(): void {
    this.oceanLayer.removeAllChildren()
    const s = this.sceneBounds
    const strength = this.model.oceanStrengthProperty.value
    const rates = this.model.ratesProperty.value
    const absorbing = rates.oceanAbsorb > 0.2
    const cx = s.left + s.width * 0.11
    const cy = s.top + s.height * 0.78
    const earth = createEcologyIcon('earth', 28 + Math.min(10, strength))
    earth.centerX = 0
    earth.centerY = 0
    const algae = createEcologyIcon('algae', 22)
    algae.centerX = 22
    algae.centerY = 8
    const phyto = createEcologyIcon('phytoplankton', 18)
    phyto.centerX = -18
    phyto.centerY = 10
    const n = new Node({ x: cx, y: cy, cursor: 'pointer' })
    if (absorbing) {
      n.addChild(new Circle(26, { fill: 'rgba(56,189,248,0.28)', centerX: 0, centerY: 0 }))
    }
    n.addChild(earth)
    if (strength > 4) n.addChild(algae)
    if (strength > 8) n.addChild(phyto)
    n.addInputListener({
      up: () => {
        this.model.setSceneTip('ocean')
        this.sounds.processTap('ocean')
      },
      enter: () => {
        this.hoverZone = 'ocean'
      },
      exit: () => {
        if (this.hoverZone === 'ocean') this.hoverZone = null
      },
    })
    this.oceanLayer.addChild(n)
  }

  private updateProcessChips(): void {
    this.processLayer.removeAllChildren()
    const rates = this.model.ratesProperty.value
    const s = this.sceneBounds
    const plants = this.model.agentsOfKind('plant')
    const animals = this.model.agentsOfKind('animal')
    const factories = this.model.agentsOfKind('factory')
    const avg = (list: { nx: number; ny: number }[], fallbackX: number, fallbackY: number) => {
      if (!list.length) return { x: fallbackX, y: fallbackY }
      let sx = 0
      let sy = 0
      for (const a of list) {
        const p = this.landToLocal(a.nx, a.ny)
        sx += p.x
        sy += p.y
      }
      return { x: sx / list.length, y: sy / list.length }
    }
    const pPos = avg(plants, s.left + s.width * 0.38, s.top + s.height * 0.4)
    const aPos = avg(animals, s.left + s.width * 0.42, s.top + s.height * 0.58)
    const fPos = avg(factories, s.left + s.width * 0.68, s.top + s.height * 0.46)
    const items: { label: string; x: number; y: number; on: boolean; hot: boolean }[] = [
      {
        label: 'Photosynthesis',
        x: pPos.x,
        y: pPos.y - 28,
        on: rates.photosynthesis > 0.15,
        hot: this.hoverZone === 'trees',
      },
      {
        label: 'Respiration',
        x: aPos.x,
        y: aPos.y - 24,
        on: rates.respiration > 0.1,
        hot: this.hoverZone === 'animals',
      },
      {
        label: 'Decomposition',
        x: s.left + s.width * 0.48,
        y: s.top + s.height * 0.78,
        on: rates.decomposition > 0.15,
        hot: this.hoverZone === 'soil',
      },
      {
        label: 'Ocean absorb',
        x: s.left + s.width * 0.11,
        y: s.top + s.height * 0.7,
        on: rates.oceanAbsorb > 0.15,
        hot: this.hoverZone === 'ocean',
      },
      {
        label: 'Combustion',
        x: fPos.x,
        y: fPos.y - 36,
        on: rates.combustion > 0.2,
        hot: this.hoverZone === 'factory',
      },
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

  /**
   * Cover-scale: fill the window with one uniform scale (keeps ratio, no stretch).
   * Slight edge crop when the window aspect differs from 1280×720.
   */
  public override layout(viewBounds: Bounds2): void {
    const lb = this.layoutBounds
    const scale = Math.max(viewBounds.width / lb.width, viewBounds.height / lb.height)
    this.matrix = Matrix3.translation(viewBounds.centerX, viewBounds.centerY)
      .timesMatrix(Matrix3.scaling(scale, scale))
      .timesMatrix(Matrix3.translation(-lb.centerX, -lb.centerY))
    this.visibleBoundsProperty.value = this.parentToLocalBounds(viewBounds)
  }

  public override step(dt: number): void {
    const capped = Math.min(dt, 0.05)
    this.model.step(capped)
    this.particles.step(capped)

    const day = this.model.isDayProperty.value
    const sun = this.model.sunlightProperty.value
    const target = day ? 0.35 + (sun / 100) * 0.65 : 0
    this.skyBlend += (target - this.skyBlend) * (1 - Math.exp(-capped * 6))

    this.cloudLayer.step(capped, this.sceneBounds, this.skyBlend)
    const toLocal = (a: { nx: number; ny: number }) => this.landToLocal(a.nx, a.ny)
    this.particleLayer.update(capped, this.sceneBounds, day, sun, this.model.ratesProperty.value, {
      plants: this.model.agentsOfKind('plant').map(toLocal),
      animals: this.model.agentsOfKind('animal').map(toLocal),
      factories: this.model.agentsOfKind('factory').map(toLocal),
    })
    this.updateProcessChips()
  }
}
