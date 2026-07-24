import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { ReflexArcModel } from '../model/ReflexArcModel.js'
import { NervousConstants, damp } from '../../../shared/NervousConstants.js'
import { NervousColors } from '../../../shared/NervousColors.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { DepthSlider } from '../../../shared/ui/DepthSlider.js'
import { SoftButton } from '../../../shared/ui/SoftButton.js'
import { GuidanceBanner } from '../../../shared/ui/GuidanceBanner.js'
import { ParticleBurst } from '../../../shared/ui/ParticleBurst.js'
import { createPanelTip } from '../../../shared/ui/createPanelTip.js'
import { TeachingTriad } from '../../../shared/ui/TeachingTriad.js'
import { MiniQuiz } from '../../../shared/ui/MiniQuiz.js'
import { HistoryChart } from '../../../shared/ui/HistoryChart.js'
import { NervousSounds } from '../../../shared/NervousSounds.js'
import { SignalTrail } from '../../../shared/ui/SignalTrail.js'
import { RippleFX } from '../../../shared/ui/RippleFX.js'
import { ReflexArcStrings } from '../ReflexArcStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

type Pt = { x: number; y: number }
type Curve = { a: Pt; c1: Pt; c2: Pt; b: Pt }

function cubic(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  }
}

function curveShape(c: Curve): Shape {
  return new Shape()
    .moveTo(c.a.x, c.a.y)
    .cubicCurveTo(c.c1.x, c.c1.y, c.c2.x, c.c2.y, c.b.x, c.b.y)
}

export class ReflexArcScreenView extends ScreenView {
  private readonly model: ReflexArcModel
  private readonly curvesNoBrain: Curve[]
  private readonly curvesViaBrain: Curve[]
  private readonly pathLayer: Node
  private readonly completedLayer: Node
  private readonly particles: ParticleBurst
  private readonly sounds: NervousSounds
  private readonly signalTrail: SignalTrail
  private readonly ripples: RippleFX
  private readonly soundBtn: SoftButton
  private readonly signalDot: Circle
  private readonly signalGlow: Circle
  private readonly progressText: Text
  private readonly resultText: Text
  private readonly brainLabel: Text
  private readonly brainNode: Path
  private readonly viaBrainButton: SoftButton
  private readonly exploreBtn: SoftButton
  private readonly compareBtn: SoftButton
  private readonly scenarioBtn: SoftButton
  private readonly kneeBtn: SoftButton
  private readonly playPauseBtn: SoftButton
  private readonly statusText: Text
  private readonly trialText: Text
  private readonly starsText: Text
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly historyChart: HistoryChart
  private readonly spinalSeriesIndex: number
  private readonly brainSeriesIndex: number
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private readonly stepLabels: Text[] = []
  private readonly sensoryLabel: Text
  private readonly motorLabel: Text
  private readonly toBrainLabel: Text
  private readonly receptorHalo: Circle
  private readonly effectorHalo: Circle
  private readonly effectorNode: Circle
  private readonly spineHalo: Circle
  private readonly receptorX: number
  private readonly receptorY: number
  private readonly effectorX: number
  private readonly effectorY: number
  private readonly stageCenterX: number
  private readonly stageCenterY: number
  private pulse = 0
  private effectorFlash = 0
  private effectorKickT = 0
  private effectorScale = 1
  private prevProgress = 0
  private tipTimer = 0
  private spineHaloT = 0

  public constructor(model: ReflexArcModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const sounds = new NervousSounds()
    this.sounds = sounds

    const m = NervousConstants.SCREEN_VIEW_X_MARGIN
    const my = NervousConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    const leftW = 190
    const rightW = 270
    const gap = 14
    const stageLeft = m + leftW + gap
    const stageTop = my + 78
    const stageW = lb.width - m * 2 - leftW - gap - rightW - gap
    const stageH = lb.height - my * 2 - 78
    this.stageCenterX = stageLeft + stageW / 2
    this.stageCenterY = stageTop + stageH / 2

    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: ReflexArcStrings.guideTitleStringProperty.value,
      body: ReflexArcStrings.guideIdleStringProperty.value,
    })
    this.guide.left = m
    this.guide.top = my
    this.addChild(this.guide)

    // ── Left column: teaching triad + trial-time history ─────────────────────
    const leftCard = new DepthCard(leftW, stageH, { fill: NervousColors.panelFill })
    leftCard.left = m
    leftCard.top = stageTop
    this.addChild(leftCard)

    this.teachingTriad = new TeachingTriad(leftW - 24)
    this.teachingTriad.left = 12
    this.teachingTriad.top = 12
    leftCard.content.addChild(this.teachingTriad)

    this.historyChart = new HistoryChart(leftW - 24, 88, {
      title: ReflexArcStrings.historyChartTitleStringProperty.value,
      maxPoints: 24,
    })
    this.historyChart.left = 12
    this.historyChart.top = 306
    leftCard.content.addChild(this.historyChart)
    this.spinalSeriesIndex = this.historyChart.addSeries('#1e8449')
    this.brainSeriesIndex = this.historyChart.addSeries('#2980b9')

    const historyLegend = createPanelTip(ReflexArcStrings.historyChartLegendStringProperty.value, {
      width: leftW - 24,
      fontSize: 10,
      fill: NervousColors.muted,
    })
    historyLegend.left = 12
    historyLegend.top = this.historyChart.bottom + 6
    leftCard.content.addChild(historyLegend)

    this.soundBtn = new SoftButton(
      model.soundEnabledProperty.value
        ? ReflexArcStrings.soundOnStringProperty.value
        : ReflexArcStrings.soundOffStringProperty.value,
      () => {
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        this.soundBtn.setLabel(
          on ? ReflexArcStrings.soundOnStringProperty.value : ReflexArcStrings.soundOffStringProperty.value,
        )
      },
      { width: leftW - 24, height: 32, fill: '#64748b', fontSize: 12 },
    )
    this.soundBtn.left = 12
    this.soundBtn.top = historyLegend.bottom + 12
    leftCard.content.addChild(this.soundBtn)

    this.addChild(
      new Rectangle(stageLeft + 5, stageTop + 8, stageW, stageH, {
        cornerRadius: 18,
        fill: 'rgba(15,23,42,0.14)',
      }),
    )
    this.addChild(
      new Rectangle(stageLeft, stageTop, stageW, stageH, {
        cornerRadius: 18,
        fill: '#f5f7fb',
        stroke: 'rgba(71,85,105,0.22)',
        lineWidth: 1.5,
      }),
    )
    this.addChild(
      new Rectangle(stageLeft + 14, stageTop + 8, stageW - 28, 5, {
        cornerRadius: 3,
        fill: 'rgba(255,255,255,0.7)',
        pickable: false,
      }),
    )

    const receptor = { x: stageLeft + stageW * 0.14, y: stageTop + stageH * 0.68 }
    const spine = { x: stageLeft + stageW * 0.48, y: stageTop + stageH * 0.5 }
    const brain = { x: stageLeft + stageW * 0.52, y: stageTop + stageH * 0.22 }
    const effector = { x: stageLeft + stageW * 0.86, y: stageTop + stageH * 0.68 }
    this.receptorX = receptor.x
    this.receptorY = receptor.y
    this.effectorX = effector.x
    this.effectorY = effector.y

    this.addChild(
      new Path(Shape.ellipse(spine.x, stageTop + stageH * 0.52, stageW * 0.09, stageH * 0.28, 0), {
        fill: 'rgba(210,185,160,0.32)',
        pickable: false,
      }),
    )
    this.addChild(
      new Circle(Math.min(stageW, stageH) * 0.055, {
        fill: 'rgba(210,185,160,0.32)',
        centerX: brain.x - 4,
        centerY: brain.y + 10,
        pickable: false,
      }),
    )

    const afferent: Curve = {
      a: receptor,
      c1: { x: stageLeft + stageW * 0.28, y: stageTop + stageH * 0.72 },
      c2: { x: stageLeft + stageW * 0.38, y: stageTop + stageH * 0.62 },
      b: spine,
    }
    const toBrain: Curve = {
      a: spine,
      c1: { x: spine.x - 10, y: stageTop + stageH * 0.36 },
      c2: { x: brain.x - 20, y: stageTop + stageH * 0.3 },
      b: brain,
    }
    const fromBrain: Curve = {
      a: brain,
      c1: { x: brain.x + 10, y: stageTop + stageH * 0.32 },
      c2: { x: spine.x + 16, y: stageTop + stageH * 0.38 },
      b: spine,
    }
    const efferent: Curve = {
      a: spine,
      c1: { x: stageLeft + stageW * 0.6, y: stageTop + stageH * 0.58 },
      c2: { x: stageLeft + stageW * 0.72, y: stageTop + stageH * 0.7 },
      b: effector,
    }
    this.curvesNoBrain = [afferent, efferent]
    this.curvesViaBrain = [afferent, toBrain, fromBrain, efferent]

    this.pathLayer = new Node({ pickable: false })
    this.completedLayer = new Node({ pickable: false })
    this.particles = new ParticleBurst(90)
    this.signalTrail = new SignalTrail({ color: 'rgba(241,196,15,0.5)' })
    this.ripples = new RippleFX()
    this.addChild(this.pathLayer)
    this.addChild(this.completedLayer)
    this.addChild(this.signalTrail)
    this.addChild(this.particles)
    this.addChild(this.ripples)

    // ── Pathway segment labels ────────────────────────────────────────────────
    const afferentMid = cubic(afferent.a, afferent.c1, afferent.c2, afferent.b, 0.5)
    const efferentMid = cubic(efferent.a, efferent.c1, efferent.c2, efferent.b, 0.5)
    const toBrainMid = cubic(toBrain.a, toBrain.c1, toBrain.c2, toBrain.b, 0.5)
    this.sensoryLabel = new Text(ReflexArcStrings.sensoryLabelStringProperty.value, {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#1e8449',
      centerX: afferentMid.x,
      bottom: afferentMid.y - 8,
      pickable: false,
    })
    this.motorLabel = new Text(ReflexArcStrings.motorLabelStringProperty.value, {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#1e8449',
      centerX: efferentMid.x,
      bottom: efferentMid.y - 8,
      pickable: false,
    })
    this.toBrainLabel = new Text(ReflexArcStrings.toBrainLabelStringProperty.value, {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#2980b9',
      centerX: toBrainMid.x,
      top: toBrainMid.y + 4,
      visible: false,
      pickable: false,
    })
    this.addChild(this.sensoryLabel)
    this.addChild(this.motorLabel)
    this.addChild(this.toBrainLabel)

    this.spineHalo = new Circle(22, {
      fill: 'rgba(47,111,237,0.28)',
      centerX: spine.x,
      centerY: spine.y,
      visible: false,
      pickable: false,
    })
    this.addChild(this.spineHalo)
    this.addChild(
      new Rectangle(spine.x - 10, stageTop + stageH * 0.3, 20, stageH * 0.4, {
        cornerRadius: 10,
        fill: '#aeb6bf',
        stroke: 'rgba(255,255,255,0.5)',
        lineWidth: 1.5,
        pickable: false,
      }),
    )
    this.addChild(
      new Text(ReflexArcStrings.spinalStringProperty.value, {
        font: new PhetFont({ size: 14, weight: 'bold' }),
        fill: NervousColors.ink,
        left: spine.x + 24,
        top: stageTop + stageH * 0.3 + 6,
        pickable: false,
      }),
    )

    const brainShape = new Shape()
      .moveTo(-26, 4)
      .cubicCurveTo(-28, -22, -6, -34, 10, -30)
      .cubicCurveTo(28, -26, 34, -6, 30, 10)
      .cubicCurveTo(28, 20, 16, 22, 8, 16)
      .cubicCurveTo(14, 28, 10, 36, 0, 34)
      .cubicCurveTo(-8, 36, -10, 26, -8, 18)
      .cubicCurveTo(-18, 22, -28, 14, -26, 4)
      .close()
    this.brainNode = new Path(brainShape, {
      fill: '#e5d0b8',
      stroke: '#8d6e4c',
      lineWidth: 2.2,
      cursor: 'pointer',
      scale: Math.min(stageW, stageH) * 0.0024,
      centerX: brain.x,
      centerY: brain.y,
    })
    this.brainNode.addInputListener({
      down: () => model.setViaBrain(!model.viaBrainProperty.value),
      enter: () => {
        this.brainNode.stroke = '#7c3aed'
        this.brainNode.lineWidth = 3
      },
      exit: () => {
        const via = model.viaBrainProperty.value
        this.brainNode.stroke = via ? '#2980b9' : '#8d6e4c'
        this.brainNode.lineWidth = via ? 2.6 : 2.2
      },
    })
    this.addChild(this.brainNode)

    this.brainLabel = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: NervousColors.ink,
      centerX: brain.x,
      bottom: brain.y - 40,
      pickable: false,
    })
    this.addChild(this.brainLabel)

    this.receptorHalo = new Circle(28, {
      fill: 'rgba(230,126,34,0.18)',
      centerX: receptor.x,
      centerY: receptor.y,
      pickable: false,
    })
    this.addChild(this.receptorHalo)

    const receptorNode = new Circle(18, {
      fill: NervousColors.receptor,
      stroke: '#fff',
      lineWidth: 3,
      cursor: 'pointer',
      centerX: receptor.x,
      centerY: receptor.y,
    })
    receptorNode.addInputListener({
      down: () => model.fire(),
      enter: () => {
        this.receptorHalo.radius = 34
      },
      exit: () => {
        this.receptorHalo.radius = 28
      },
    })
    this.addChild(receptorNode)
    this.addChild(
      new Text(ReflexArcStrings.receptorStringProperty.value, {
        font: new PhetFont({ size: 14, weight: 'bold' }),
        fill: NervousColors.ink,
        centerX: receptor.x,
        bottom: receptor.y - 28,
        pickable: false,
      }),
    )
    this.addChild(
      new Text(ReflexArcStrings.tapToFireStringProperty.value, {
        font: new PhetFont(14),
        fill: NervousColors.muted,
        centerX: receptor.x,
        top: receptor.y + 26,
        pickable: false,
      }),
    )

    this.effectorHalo = new Circle(28, {
      fill: 'rgba(39,174,96,0.16)',
      centerX: effector.x,
      centerY: effector.y,
      pickable: false,
    })
    this.addChild(this.effectorHalo)
    this.effectorNode = new Circle(18, {
      fill: NervousColors.effector,
      stroke: '#fff',
      lineWidth: 3,
      cursor: 'pointer',
      centerX: effector.x,
      centerY: effector.y,
    })
    this.effectorNode.addInputListener({
      down: () => {
        this.effectorFlash = 0.6
      },
    })
    this.addChild(this.effectorNode)
    this.addChild(
      new Text(ReflexArcStrings.effectorStringProperty.value, {
        font: new PhetFont({ size: 14, weight: 'bold' }),
        fill: NervousColors.ink,
        centerX: effector.x,
        bottom: effector.y - 28,
        pickable: false,
      }),
    )

    const spineNode = new Circle(14, {
      fill: NervousColors.spine,
      stroke: '#fff',
      lineWidth: 2.5,
      cursor: 'pointer',
      centerX: spine.x,
      centerY: spine.y,
    })
    spineNode.addInputListener({
      down: () => {
        model.tapSpinalCord()
        this.spineHaloT = 0.7
        this.particles.burst(spine.x, spine.y, {
          count: 16,
          color: NervousColors.spine,
          speed: 75,
          life: 0.5,
          radius: 3,
        })
      },
      enter: () => {
        this.spineHalo.visible = true
      },
      exit: () => {
        if (this.spineHaloT <= 0) {
          this.spineHalo.visible = false
        }
      },
    })
    this.addChild(spineNode)
    this.addChild(
      new Text(ReflexArcStrings.spinalCordTipStringProperty.value, {
        font: new PhetFont(10),
        fill: NervousColors.muted,
        centerX: spine.x,
        top: spine.y + 20,
        pickable: false,
      }),
    )

    const stepNames = [
      ReflexArcStrings.stepReceptorStringProperty.value,
      ReflexArcStrings.stepSpineStringProperty.value,
      ReflexArcStrings.stepBrainStringProperty.value,
      ReflexArcStrings.stepEffectorStringProperty.value,
    ]
    const labelGap = (stageW - 32) / (stepNames.length - 1)
    stepNames.forEach((name, i) => {
      const t = new Text(name, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: NervousColors.muted,
        left: stageLeft + 16 + i * labelGap,
        top: stageTop + 14,
        pickable: false,
      })
      this.stepLabels.push(t)
      this.addChild(t)
    })

    this.signalGlow = new Circle(16, {
      fill: 'rgba(241,196,15,0.35)',
      visible: false,
      pickable: false,
    })
    this.signalDot = new Circle(8, {
      fill: NervousColors.signal,
      stroke: '#b7950b',
      lineWidth: 2,
      visible: false,
      pickable: false,
    })
    this.addChild(this.signalGlow)
    this.addChild(this.signalDot)

    this.progressText = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: NervousColors.ink,
      visible: false,
      pickable: false,
    })
    this.addChild(this.progressText)

    this.resultText = new Text('', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: '#fff',
      centerX: stageLeft + stageW / 2,
      bottom: stageTop + stageH - 16,
      visible: false,
      pickable: false,
    })
    this.addChild(this.resultText)

    // ── Timed tip card (fades ~4s after appearing) ────────────────────────────
    this.tipCard = new DepthCard(240, 108, { cornerRadius: 12, fill: 'rgba(255,255,255,0.97)' })
    this.tipCard.centerX = this.stageCenterX
    this.tipCard.top = stageTop + 40
    this.tipCard.visible = false
    this.tipCard.content.addChild(
      new Text(ReflexArcStrings.tipTitleStringProperty.value, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: NervousColors.accent,
        left: 14,
        top: 10,
      }),
    )
    this.tipBodyText = new RichText('', {
      font: new PhetFont(12),
      fill: NervousColors.ink,
      lineWrap: 212,
      leading: 3,
      left: 14,
      top: 30,
      maxWidth: 212,
    })
    this.tipCard.content.addChild(this.tipBodyText)
    this.addChild(this.tipCard)

    // ── Mini quiz overlay ──────────────────────────────────────────────────────
    this.miniQuiz = new MiniQuiz(230)
    this.miniQuiz.centerX = this.stageCenterX
    this.miniQuiz.centerY = stageTop + stageH * 0.44
    this.addChild(this.miniQuiz)

    const card = new DepthCard(rightW, stageH, { title: ReflexArcStrings.pathwayStringProperty.value })
    card.left = stageLeft + stageW + gap
    card.top = stageTop
    this.addChild(card)

    const btnW = rightW - 32
    const halfW = (btnW - 10) / 2

    this.exploreBtn = new SoftButton(ReflexArcStrings.challengeExploreStringProperty.value, () => {
      model.setChallenge('explore')
    }, {
      width: btnW,
      height: 36,
      fill: NervousColors.accent,
      selected: true,
      onSound: () => sounds.modeChange(true),
    })
    this.exploreBtn.left = 16
    this.exploreBtn.top = 44
    card.content.addChild(this.exploreBtn)

    this.compareBtn = new SoftButton(ReflexArcStrings.challengeCompareStringProperty.value, () => {
      model.setChallenge('compare')
    }, {
      width: btnW,
      height: 36,
      fill: '#0ea5e9',
      selected: false,
      onSound: () => sounds.modeChange(true),
    })
    this.compareBtn.left = 16
    this.compareBtn.top = 88
    card.content.addChild(this.compareBtn)

    this.scenarioBtn = new SoftButton(ReflexArcStrings.challengeScenarioStringProperty.value, () => {
      model.setChallenge('scenario')
    }, {
      width: btnW,
      height: 36,
      fill: '#e74c3c',
      selected: false,
      onSound: () => sounds.scenario(),
    })
    this.scenarioBtn.left = 16
    this.scenarioBtn.top = 132
    card.content.addChild(this.scenarioBtn)

    this.kneeBtn = new SoftButton(ReflexArcStrings.challengeKneeStringProperty.value, () => {
      model.setChallenge('knee')
    }, {
      width: btnW,
      height: 36,
      fill: '#f39c12',
      selected: false,
      onSound: () => sounds.scenario(),
    })
    this.kneeBtn.left = 16
    this.kneeBtn.top = 176
    card.content.addChild(this.kneeBtn)

    const stimulateBtn = new SoftButton(ReflexArcStrings.stimulateStringProperty.value, () => model.fire(), {
      width: halfW,
      height: 42,
      fill: NervousColors.receptor,
      fontSize: 13,
      onSound: () => sounds.fireSignal(),
    })
    stimulateBtn.left = 16
    stimulateBtn.top = 220
    card.content.addChild(stimulateBtn)

    this.playPauseBtn = new SoftButton(ReflexArcStrings.pauseButtonStringProperty.value, () => {
      model.togglePlayPause()
      sounds.playPause(model.runningProperty.value)
    }, {
      width: halfW,
      height: 42,
      fill: '#7c3aed',
      fontSize: 13,
    })
    this.playPauseBtn.left = 16 + halfW + 10
    this.playPauseBtn.top = 220
    card.content.addChild(this.playPauseBtn)

    this.viaBrainButton = new SoftButton(ReflexArcStrings.viaBrainStringProperty.value, () => {
      model.setViaBrain(!model.viaBrainProperty.value)
    }, {
      width: btnW,
      height: 42,
      fill: '#2980b9',
      selected: false,
      onSound: () => sounds.toggle(!model.viaBrainProperty.value),
    })
    this.viaBrainButton.left = 16
    this.viaBrainButton.top = 270
    card.content.addChild(this.viaBrainButton)

    const speedSlider = new DepthSlider(model.speedScaleProperty, {
      min: 0.5,
      max: 1.8,
      width: btnW,
      label: ReflexArcStrings.signalSpeedStringProperty.value,
      format: (n) => `${n.toFixed(1)}×`,
      fill: NervousColors.signal,
      onTick: () => sounds.sliderTick(),
    })
    speedSlider.left = 16
    speedSlider.top = 320
    card.content.addChild(speedSlider)

    this.starsText = new Text('', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: '#d97706',
      left: 16,
      top: 376,
    })
    card.content.addChild(this.starsText)

    this.statusText = new Text(model.statusProperty.value, {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: NervousColors.ink,
      left: 16,
      top: 404,
      maxWidth: btnW,
    })
    card.content.addChild(this.statusText)

    this.trialText = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: NervousColors.muted,
      left: 16,
      top: 434,
    })
    card.content.addChild(this.trialText)

    const learnTip = createPanelTip(ReflexArcStrings.learnMoreStringProperty.value, {
      width: btnW,
      fontSize: 13,
    })
    learnTip.left = 16
    learnTip.top = 464
    card.content.addChild(learnTip)

    this.addChild(
      new ResetAllButton({
        listener: () => {
          sounds.resetAll()
          model.reset()
        },
        right: lb.right - m,
        bottom: lb.bottom - my,
      }),
    )

    const syncTrials = () => {
      const s = model.spinalTrialsProperty.value
      const b = model.brainTrialsProperty.value
      this.trialText.string =
        `${ReflexArcStrings.trialSpinalStringProperty.value} ${s} · ${ReflexArcStrings.trialBrainStringProperty.value} ${b}`
    }

    const syncStars = () => {
      this.starsText.string = `${ReflexArcStrings.starsStringProperty.value} ${model.starsProperty.value}`
    }

    const syncPlayPause = () => {
      const fired = model.firedProperty.value
      const done = model.progressProperty.value >= 1
      if (!fired || done) {
        this.playPauseBtn.setLabel(ReflexArcStrings.fireButtonStringProperty.value)
      }
      else if (model.runningProperty.value) {
        this.playPauseBtn.setLabel(ReflexArcStrings.pauseButtonStringProperty.value)
      }
      else {
        this.playPauseBtn.setLabel(ReflexArcStrings.resumeButtonStringProperty.value)
      }
    }

    const syncChallenge = () => {
      const mode = model.challengeProperty.value
      this.exploreBtn.setSelected(mode === 'explore')
      this.compareBtn.setSelected(mode === 'compare')
      this.scenarioBtn.setSelected(mode === 'scenario')
      this.kneeBtn.setSelected(mode === 'knee')
      this.updateGuidance()
    }

    const syncPathway = () => {
      const via = model.viaBrainProperty.value
      this.pathLayer.removeAllChildren()
      const curves = via ? this.curvesViaBrain : this.curvesNoBrain
      const color = via ? '#2980b9' : '#1e8449'
      for (const c of curves) {
        this.pathLayer.addChild(
          new Path(curveShape(c), {
            stroke: 'rgba(15,23,42,0.1)',
            lineWidth: 8,
            lineCap: 'round',
          }),
        )
        this.pathLayer.addChild(
          new Path(curveShape(c), {
            stroke: color,
            lineWidth: 3.5,
            lineCap: 'round',
            lineJoin: 'round',
          }),
        )
      }
      this.brainNode.fill = via ? '#f2d0b0' : '#e5d0b8'
      this.brainNode.stroke = via ? '#2980b9' : '#8d6e4c'
      this.brainLabel.string = via
        ? ReflexArcStrings.brainOnStringProperty.value
        : ReflexArcStrings.brainOffStringProperty.value
      this.brainLabel.centerX = brain.x
      this.viaBrainButton.setSelected(via)
      this.toBrainLabel.visible = via
      this.stepLabels[2].opacity = via ? 1 : 0.35
      this.completedLayer.removeAllChildren()
      this.signalDot.visible = false
      this.signalGlow.visible = false
      this.progressText.visible = false
      this.resultText.visible = false
      this.prevProgress = 0
      this.updateGuidance()
    }

    const burstAtJunction = (seg: number) => {
      if (seg < 0) {
        return
      }
      const via = model.viaBrainProperty.value
      const curves = via ? this.curvesViaBrain : this.curvesNoBrain
      const c = curves[Math.min(seg, curves.length - 1)]
      this.particles.burst(c.a.x, c.a.y, {
        count: 14,
        color: NervousColors.signal,
        speed: 85,
        life: 0.5,
        radius: 3.4,
      })
      sounds.hop()
      this.ripples.burst(c.a.x, c.a.y, { color: 'rgba(241,196,15,0.7)', count: 2, maxR: 30, life: 0.4 })
    }

    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.viaBrainProperty.link(syncPathway)
    model.challengeProperty.link(syncChallenge)
    model.statusProperty.link((status) => {
      this.statusText.string = status
    })
    model.spinalTrialsProperty.link(syncTrials)
    model.brainTrialsProperty.link(syncTrials)
    model.starsProperty.link(syncStars)
    model.firedProperty.link(syncPlayPause)
    model.runningProperty.link(syncPlayPause)
    model.progressProperty.link(syncPlayPause)
    model.firedProperty.link((fired, oldFired) => {
      if (fired && !oldFired) {
        this.particles.burst(this.receptorX, this.receptorY, {
          count: 22,
          color: NervousColors.receptor,
          speed: 95,
          life: 0.55,
          radius: 3.6,
        })
        sounds.fireSignal()
        this.ripples.burst(this.receptorX, this.receptorY, { color: NervousColors.receptor })
        this.signalTrail.clear()
      }
      this.updateGuidance()
    })
    model.progressProperty.link(() => this.updateGuidance())
    model.junctionIndexProperty.link(burstAtJunction)
    model.tipsProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.trialCountProperty.lazyLink(() => {
      const idx = model.lastTrialViaBrainProperty.value ? this.brainSeriesIndex : this.spinalSeriesIndex
      this.historyChart.push(idx, model.lastTrialDurationProperty.value)
    })
    model.compareCompleteProperty.link((complete, wasComplete) => {
      if (complete && !wasComplete) {
        this.guide.setGuidance(
          ReflexArcStrings.guideTitleStringProperty.value,
          ReflexArcStrings.guideCompareCompleteStringProperty.value,
        )
        this.particles.burst(this.stageCenterX, this.stageCenterY - 20, {
          count: 28,
          color: NervousColors.signal,
          speed: 110,
          life: 0.75,
          radius: 4,
        })
        sounds.celebrate()
        this.ripples.burst(this.stageCenterX, this.stageCenterY - 20, { color: NervousColors.accent, count: 3, maxR: 60 })
        this.resultText.visible = true
        this.resultText.string = ReflexArcStrings.guideCompareCompleteStringProperty.value
        this.resultText.fill = NervousColors.accent
      }
    })

    syncTrials()
    syncChallenge()
    syncStars()
    syncPlayPause()
  }

  private showTipCard(text: string): void {
    this.tipBodyText.string = text
    this.tipCard.visible = true
    this.tipCard.opacity = 1
    this.tipTimer = 4.2
  }

  private showQuiz(): void {
    this.miniQuiz.showQuiz(
      ReflexArcStrings.quizQuestionStringProperty.value,
      [
        { label: ReflexArcStrings.quizSpinalStringProperty.value, correct: true },
        { label: ReflexArcStrings.quizBrainStringProperty.value, correct: false },
      ],
      (correct) => {
        correct ? this.sounds.correct() : this.sounds.wrong()
        this.model.onQuizAnswered(correct)
      },
    )
  }

  private updateGuidance(): void {
    const fired = this.model.firedProperty.value
    const progress = this.model.progressProperty.value
    const via = this.model.viaBrainProperty.value
    const challenge = this.model.challengeProperty.value

    if (this.model.compareCompleteProperty.value) {
      this.guide.setGuidance(
        ReflexArcStrings.guideTitleStringProperty.value,
        ReflexArcStrings.guideCompareCompleteStringProperty.value,
      )
      this.teachingTriad.setTriad(
        'Compare complete!',
        'Spinal reflexes skip the brain, so they finish before you consciously notice.',
        'Answer the quiz, or try the Hot-iron / Knee-jerk scenario.',
      )
      return
    }

    if (!fired) {
      if (challenge === 'compare') {
        this.guide.setGuidance(
          ReflexArcStrings.guideTitleStringProperty.value,
          ReflexArcStrings.guideCompareStringProperty.value,
        )
        this.teachingTriad.setTriad(
          'Ready to compare.',
          'Firing once spinal-only and once via the brain reveals the speed gap.',
          'Tap the receptor with Brain off, then toggle Brain on and fire again.',
        )
      }
      else if (challenge === 'scenario') {
        this.guide.setGuidance(
          ReflexArcStrings.guideTitleStringProperty.value,
          ReflexArcStrings.guideScenarioStringProperty.value,
        )
        this.teachingTriad.setTriad(
          'Hot-iron scenario armed.',
          'A painful stimulus triggers an instant pull-away, before you consciously feel it.',
          'Watch the spinal reflex fire first, then a slower brain-awareness pass.',
        )
      }
      else if (challenge === 'knee') {
        this.teachingTriad.setTriad(
          'Knee-jerk scenario armed.',
          'A tendon stretch reflex is a simple 2-neuron loop — no brain required at all.',
          'Watch the leg kick using only the spinal cord.',
        )
        this.guide.setGuidance(
          ReflexArcStrings.guideTitleStringProperty.value,
          'Knee-jerk! Purely spinal — the brain is never involved in this reflex.',
        )
      }
      else if (challenge === 'explore') {
        this.guide.setGuidance(
          ReflexArcStrings.guideTitleStringProperty.value,
          ReflexArcStrings.guideExploreStringProperty.value,
        )
        this.teachingTriad.setTriad(
          'Explore freely.',
          'Toggle Brain and drag the speed slider to feel the timing difference.',
          'Tap the receptor (or Fire) to send a signal down the pathway.',
        )
      }
      else {
        this.guide.setGuidance(
          ReflexArcStrings.guideTitleStringProperty.value,
          ReflexArcStrings.guideIdleStringProperty.value,
        )
        this.teachingTriad.setTriad(
          'Tap the receptor.',
          'A stimulus (like a pin-prick) starts every reflex arc.',
          'Watch the gold signal travel to the spinal cord.',
        )
      }
    }
    else if (progress < 1) {
      this.guide.setGuidance(
        ReflexArcStrings.guideTitleStringProperty.value,
        ReflexArcStrings.guideFiredStringProperty.value,
      )
      this.teachingTriad.setTriad(
        via ? 'Signal climbing to the brain…' : 'Signal racing through the spinal cord…',
        via ? 'Extra distance and processing time make this path slower.' : 'A short, direct circuit makes this path very fast.',
        'Watch for the effector kick at the end of the path.',
      )
    }
    else {
      this.guide.setGuidance(
        ReflexArcStrings.guideTitleStringProperty.value,
        via
          ? ReflexArcStrings.guideDoneSlowStringProperty.value
          : ReflexArcStrings.guideDoneFastStringProperty.value,
      )
      this.teachingTriad.setTriad(
        via ? 'Arrived via brain — slower.' : 'Arrived via spinal cord — fast!',
        via ? 'You now consciously notice the stimulus.' : 'The reflex finished before conscious awareness kicked in.',
        'Toggle Brain, or try Compare / Hot-iron / Knee-jerk.',
      )
    }
  }

  private triggerEffectorKick(): void {
    this.effectorKickT = 0.55
    this.effectorFlash = 0.7
    this.particles.burst(this.effectorX, this.effectorY, {
      count: 24,
      color: NervousColors.effector,
      speed: 100,
      life: 0.6,
      radius: 3.8,
    })
    this.sounds.effectorKick()
    this.ripples.burst(this.effectorX, this.effectorY, { color: NervousColors.effector })
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.pulse += dt
    this.particles.step(dt)
    this.signalTrail.step(dt)
    this.ripples.step(dt)
    this.receptorHalo.opacity = 0.55 + 0.35 * Math.sin(this.pulse * 2.4)

    if (this.tipTimer > 0) {
      this.tipTimer -= dt
      if (this.tipTimer < 0.6) {
        this.tipCard.opacity = Math.max(0, this.tipTimer / 0.6)
      }
      if (this.tipTimer <= 0) {
        this.tipCard.visible = false
      }
    }

    if (this.spineHaloT > 0) {
      this.spineHaloT -= dt
      this.spineHalo.visible = true
      this.spineHalo.opacity = Math.max(0, this.spineHaloT / 0.7)
      this.spineHalo.radius = 22 + 10 * (1 - Math.max(0, this.spineHaloT / 0.7))
    }
    else if (this.spineHalo.opacity <= 0.02) {
      this.spineHalo.visible = false
    }

    if (this.effectorKickT > 0) {
      this.effectorKickT -= dt
      const phase = Math.max(0, this.effectorKickT / 0.55)
      const kick = 16 * Math.sin((1 - phase) * Math.PI)
      this.effectorNode.centerX = this.effectorX + kick
      this.effectorNode.centerY = this.effectorY - kick * 0.35
      this.effectorHalo.centerX = this.effectorNode.centerX
      this.effectorHalo.centerY = this.effectorNode.centerY
      this.effectorScale = 1 + 0.4 * Math.sin((1 - phase) * Math.PI)
    }
    else {
      this.effectorNode.centerX = damp(this.effectorNode.centerX, this.effectorX, 14, dt)
      this.effectorNode.centerY = damp(this.effectorNode.centerY, this.effectorY, 14, dt)
      this.effectorHalo.centerX = this.effectorNode.centerX
      this.effectorHalo.centerY = this.effectorNode.centerY
      this.effectorScale = damp(this.effectorScale, 1, 12, dt)
    }
    this.effectorNode.setScaleMagnitude(this.effectorScale)

    if (this.effectorFlash > 0) {
      this.effectorFlash -= dt
      this.effectorHalo.radius = 28 + 20 * Math.max(0, this.effectorFlash)
      this.effectorHalo.opacity = 0.45 + 0.55 * Math.max(0, this.effectorFlash)
    }
    else if (this.effectorKickT <= 0) {
      this.effectorHalo.radius = 28
      this.effectorHalo.opacity = 0.5
    }

    if (!this.model.firedProperty.value) {
      this.prevProgress = 0
      return
    }

    const via = this.model.viaBrainProperty.value
    const curves = via ? this.curvesViaBrain : this.curvesNoBrain
    const progress = this.model.progressProperty.value
    const n = curves.length
    const tAll = progress * n
    const i = Math.min(n - 1, Math.floor(tAll))
    const f = tAll - i
    const c = curves[i]
    const pos = cubic(c.a, c.c1, c.c2, c.b, f)

    if (progress >= 1 && this.prevProgress < 1) {
      this.triggerEffectorKick()
    }
    this.prevProgress = progress

    const stepIndex = via
      ? (i === 0 ? 0 : i === 1 || i === 2 ? (i === 1 ? 2 : 1) : 3)
      : (i === 0 ? 0 : 3)
    this.stepLabels.forEach((label, idx) => {
      const active = idx === stepIndex || (via && i >= 1 && idx === 1 && i < 3)
      label.fill = active ? NervousColors.accent : NervousColors.muted
    })

    this.completedLayer.removeAllChildren()
    for (let k = 0; k < i; k++) {
      this.completedLayer.addChild(
        new Path(curveShape(curves[k]), {
          stroke: NervousColors.signal,
          lineWidth: 4,
          lineCap: 'round',
        }),
      )
    }
    const partial = new Shape().moveTo(c.a.x, c.a.y)
    const steps = Math.max(2, Math.floor(f * 28))
    for (let s = 1; s <= steps; s++) {
      const p = cubic(c.a, c.c1, c.c2, c.b, (s / steps) * f)
      partial.lineTo(p.x, p.y)
    }
    this.completedLayer.addChild(
      new Path(partial, {
        stroke: NervousColors.signal,
        lineWidth: 4,
        lineCap: 'round',
      }),
    )

    this.signalDot.visible = true
    this.signalGlow.visible = true
    this.signalDot.centerX = pos.x
    this.signalDot.centerY = pos.y
    this.signalGlow.centerX = pos.x
    this.signalGlow.centerY = pos.y
    this.signalGlow.radius = 14 + 4 * Math.sin(this.pulse * 8)
    this.signalGlow.opacity = 0.7 + 0.3 * Math.sin(this.pulse * 8)
    this.signalTrail.push(pos.x, pos.y, 6)
    this.progressText.visible = true
    this.progressText.string = `${Math.round(progress * 100)}%`
    this.progressText.centerX = pos.x
    this.progressText.bottom = pos.y - 18

    if (progress >= 1) {
      this.resultText.visible = true
      if (!this.model.compareCompleteProperty.value) {
        this.resultText.string = via
          ? ReflexArcStrings.slowStringProperty.value
          : ReflexArcStrings.fastStringProperty.value
        this.resultText.fill = via ? '#2980b9' : '#27ae60'
      }
    }
    else {
      this.resultText.visible = false
    }
  }
}
