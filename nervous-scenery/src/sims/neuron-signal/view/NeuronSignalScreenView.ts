import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import {
  Circle,
  Node,
  Path,
  Rectangle,
  RichText,
  Text,
} from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { NeuronSignalModel } from '../model/NeuronSignalModel.js'
import { NervousConstants, damp } from '../../../shared/NervousConstants.js'
import { NervousColors } from '../../../shared/NervousColors.js'
import { NervousSounds } from '../../../shared/NervousSounds.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { DepthSlider } from '../../../shared/ui/DepthSlider.js'
import { SoftButton } from '../../../shared/ui/SoftButton.js'
import { StageBackdrop } from '../../../shared/ui/StageBackdrop.js'
import { GuidanceBanner } from '../../../shared/ui/GuidanceBanner.js'
import { ParticleBurst } from '../../../shared/ui/ParticleBurst.js'
import { SignalTrail } from '../../../shared/ui/SignalTrail.js'
import { RippleFX } from '../../../shared/ui/RippleFX.js'
import { createPanelTip } from '../../../shared/ui/createPanelTip.js'
import { ScrollableNode } from '../../../shared/ui/ScrollableNode.js'
import { TeachingTriad } from '../../../shared/ui/TeachingTriad.js'
import { MiniQuiz } from '../../../shared/ui/MiniQuiz.js'
import { HistoryChart } from '../../../shared/ui/HistoryChart.js'
import { NeuronSignalStrings } from '../NeuronSignalStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const NODE_COUNT = 7
const TIP_OVERLAY_DURATION = 7

export class NeuronSignalScreenView extends ScreenView {
  private readonly model: NeuronSignalModel
  private readonly sounds: NervousSounds
  private readonly ax0: number
  private readonly ax1: number
  private readonly terminalX: number
  private readonly axonY: number
  private readonly myelinLayer: Node
  private readonly membraneShimmer: Path
  private readonly nodeButtons: Circle[] = []
  private readonly impulse: Circle
  private readonly impulseGlow: Circle
  private readonly trail: Path
  private readonly signalTrail: SignalTrail
  private readonly rippleFX: RippleFX
  private readonly particles: ParticleBurst
  private readonly ionLayer: Node
  private readonly modeText: Text
  private readonly myelinLabel: Text
  private readonly progressText: Text
  private readonly speedFill: Rectangle
  private readonly speedTrackW: number
  private readonly myelinButton: SoftButton
  private readonly playButton: SoftButton
  private readonly exploreButton: SoftButton
  private readonly raceButton: SoftButton
  private readonly demyelinationButton: SoftButton
  private readonly showIonsButton: SoftButton
  private readonly soundButton: SoftButton
  private readonly statusText: Text
  private readonly raceTimeText: Text
  private readonly raceLockHint: Text
  private readonly starsText: Text
  private readonly teachingTriad: TeachingTriad
  private readonly miniQuiz: MiniQuiz
  private readonly historyChart: HistoryChart
  private readonly historyMyelinSeries: number
  private readonly historyBareSeries: number
  private readonly guide: GuidanceBanner
  private readonly somaHalo: Circle
  private readonly tipOverlay: Node
  private readonly relayoutPanel: () => void
  private pulse = 0
  private hopFlash = 0
  private hopFlashIndex = -1
  private lastArrived = false
  private raceDisplayTime = 0
  private trailFrame = 0
  private tipTimer = 0
  private quizWasVisible = false
  private ionLabels: { node: Text; life: number; maxLife: number }[] = []

  public constructor(model: NeuronSignalModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    this.sounds = new NervousSounds()
    this.sounds.setEnabled(model.soundEnabledProperty.value)
    this.addInputListener({ down: () => this.sounds.unlock() })

    const m = NervousConstants.SCREEN_VIEW_X_MARGIN
    const my = NervousConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    const rightW = 280
    const gap = 14
    const stageLeft = m
    const stageTop = my + 78
    const stageW = lb.width - m * 2 - rightW - gap
    const stageH = lb.height - my * 2 - 78

    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: NeuronSignalStrings.guideTitleStringProperty.value,
      body: NeuronSignalStrings.guideIdleStringProperty.value,
    })
    this.guide.left = m
    this.guide.top = my
    this.addChild(this.guide)

    this.addChild(
      new StageBackdrop(stageLeft, stageTop, stageW, stageH, {
        top: '#0b1c2e',
        bottom: '#16324f',
        stroke: 'rgba(255,255,255,0.14)',
      }),
    )

    const y = stageTop + stageH * 0.52
    const x0 = stageLeft + stageW * 0.12
    const x1 = stageLeft + stageW * 0.9
    this.axonY = y
    this.ax0 = x0 + 52
    this.ax1 = x1 - 56
    this.terminalX = x1

    this.somaHalo = new Circle(Math.min(stageW, stageH) * 0.08, {
      fill: 'rgba(93,173,226,0.22)',
      centerX: x0,
      centerY: y,
      pickable: false,
    })
    this.addChild(this.somaHalo)

    const soma = new Circle(Math.min(stageW, stageH) * 0.06, {
      fill: NervousColors.soma,
      stroke: '#85c1e9',
      lineWidth: 3,
      cursor: 'pointer',
      centerX: x0,
      centerY: y,
    })
    soma.addInputListener({
      down: () => model.fire(),
      enter: () => {
        this.somaHalo.radius = Math.min(stageW, stageH) * 0.1
      },
      exit: () => {
        this.somaHalo.radius = Math.min(stageW, stageH) * 0.08
      },
    })
    this.addChild(soma)

    for (let i = 0; i < 5; i++) {
      const a = -Math.PI * 0.85 + i * 0.35
      this.addChild(
        new Path(
          new Shape()
            .moveTo(x0 + Math.cos(a) * 20, y + Math.sin(a) * 20)
            .lineTo(x0 + Math.cos(a) * 52, y + Math.sin(a) * 52),
          { stroke: NervousColors.soma, lineWidth: 4, pickable: false },
        ),
      )
      this.addChild(
        new Circle(5, {
          fill: '#85c1e9',
          centerX: x0 + Math.cos(a) * 54,
          centerY: y + Math.sin(a) * 54,
          pickable: false,
        }),
      )
    }

    this.addChild(
      new Text(NeuronSignalStrings.somaStringProperty.value, {
        font: new PhetFont({ size: 14, weight: 'bold' }),
        fill: '#dbeafe',
        centerX: x0,
        bottom: y - Math.min(stageW, stageH) * 0.09,
        pickable: false,
      }),
    )

    this.addChild(
      new Path(new Shape().moveTo(x0 + 28, y + 3).lineTo(x1 - 48, y + 3), {
        stroke: 'rgba(0,0,0,0.35)',
        lineWidth: Math.max(14, Math.min(stageW, stageH) * 0.028),
        lineCap: 'round',
        pickable: false,
      }),
    )
    this.addChild(
      new Path(new Shape().moveTo(x0 + 28, y).lineTo(x1 - 48, y), {
        stroke: NervousColors.axon,
        lineWidth: Math.max(12, Math.min(stageW, stageH) * 0.024),
        lineCap: 'round',
        pickable: false,
      }),
    )
    this.membraneShimmer = new Path(
      new Shape().moveTo(x0 + 28, y - 2).lineTo(x1 - 48, y - 2),
      {
        stroke: 'rgba(255,255,255,0.5)',
        lineWidth: Math.max(4, Math.min(stageW, stageH) * 0.008),
        lineCap: 'round',
        pickable: false,
      },
    )
    this.addChild(this.membraneShimmer)
    this.addChild(
      new Text('axon', {
        font: new PhetFont({ size: 14, weight: 'bold' }),
        fill: '#dbeafe',
        centerX: (x0 + x1) / 2,
        bottom: y - 48,
        pickable: false,
      }),
    )

    this.myelinLayer = new Node({ pickable: false })
    this.addChild(this.myelinLayer)

    const segCount = NODE_COUNT
    const span = this.ax1 - this.ax0
    for (let i = 1; i < segCount; i++) {
      const nx = this.ax0 + i * (span / segCount)
      const node = new Circle(9, {
        fill: '#1b4f72',
        stroke: '#7dd3fc',
        lineWidth: 2,
        cursor: 'pointer',
        centerX: nx,
        centerY: y,
      })
      const frac = (nx - this.ax0) / (this.ax1 - this.ax0)
      node.addInputListener({
        down: () => model.fireAt(frac),
        enter: () => {
          if (this.hopFlashIndex !== i - 1) {
            node.radius = 12
          }
        },
        exit: () => {
          if (this.hopFlashIndex !== i - 1) {
            node.radius = 9
          }
        },
      })
      this.nodeButtons.push(node)
      this.addChild(node)
    }

    this.myelinLabel = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#fde68a',
      centerX: (x0 + x1) / 2,
      top: y + 40,
      pickable: false,
    })
    this.addChild(this.myelinLabel)

    const terminal = new Path(
      new Shape()
        .moveTo(x1 - 48, y - 20)
        .lineTo(x1 - 4, y)
        .lineTo(x1 - 48, y + 20)
        .close(),
      { fill: '#58d68d', stroke: 'rgba(255,255,255,0.35)', lineWidth: 1.5, pickable: false },
    )
    this.addChild(terminal)
    for (let i = 0; i < 3; i++) {
      this.addChild(
        new Circle(4, {
          fill: '#58d68d',
          centerX: x1,
          centerY: y - 14 + i * 14,
          pickable: false,
        }),
      )
    }
    this.addChild(
      new Text(NeuronSignalStrings.terminalStringProperty.value, {
        font: new PhetFont({ size: 13, weight: 'bold' }),
        fill: '#dbeafe',
        centerX: x1 - 16,
        bottom: y - 36,
        pickable: false,
      }),
    )

    this.trail = new Path(null, {
      stroke: 'rgba(244,208,63,0.45)',
      lineWidth: 5,
      pickable: false,
    })
    this.addChild(this.trail)

    this.particles = new ParticleBurst(90)
    this.addChild(this.particles)
    this.ionLayer = new Node({ pickable: false })
    this.addChild(this.ionLayer)
    this.signalTrail = new SignalTrail({ color: 'rgba(244,208,63,0.5)', maxGhosts: 16 })
    this.addChild(this.signalTrail)
    this.rippleFX = new RippleFX()
    this.addChild(this.rippleFX)

    this.impulseGlow = new Circle(18, {
      fill: 'rgba(244,208,63,0.3)',
      pickable: false,
    })
    this.impulse = new Circle(12, {
      fill: NervousColors.signal,
      stroke: '#fff',
      lineWidth: 1.5,
      pickable: false,
    })
    this.addChild(this.impulseGlow)
    this.addChild(this.impulse)

    this.progressText = new Text('AP 0%', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#fef3c7',
      pickable: false,
    })
    this.addChild(this.progressText)

    this.modeText = new Text('', {
      font: new PhetFont({ size: 14, weight: 'bold' }),
      fill: '#e2e8f0',
      left: stageLeft + 18,
      top: stageTop + 16,
      pickable: false,
    })
    this.addChild(this.modeText)

    this.addChild(
      new Text(NeuronSignalStrings.speedStringProperty.value, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: '#94a3b8',
        left: stageLeft + 18,
        top: stageTop + 40,
        pickable: false,
      }),
    )
    this.speedTrackW = 160
    this.addChild(
      new Rectangle(stageLeft + 18, stageTop + 60, this.speedTrackW, 10, {
        cornerRadius: 5,
        fill: 'rgba(148,163,184,0.35)',
        pickable: false,
      }),
    )
    this.speedFill = new Rectangle(stageLeft + 18, stageTop + 60, 40, 10, {
      cornerRadius: 5,
      fill: NervousColors.myelin,
      pickable: false,
    })
    this.addChild(this.speedFill)

    // ---- Right panel (scrollable, ecology-density) ----
    const card = new DepthCard(rightW, stageH, { title: NeuronSignalStrings.axonStringProperty.value })
    card.left = stageLeft + stageW + gap
    card.top = stageTop
    this.addChild(card)

    const panelContent = new Node()
    const contentW = rightW - 40
    const halfBtnW = Math.floor((contentW - 8) / 2)

    this.exploreButton = new SoftButton(NeuronSignalStrings.exploreStringProperty.value, () => {
      model.setChallenge('explore')
    }, {
      width: halfBtnW,
      height: 36,
      fill: NervousColors.accent,
      selected: true,
      onSound: () => this.sounds.softClick(),
    })
    panelContent.addChild(this.exploreButton)

    this.raceButton = new SoftButton(NeuronSignalStrings.raceStringProperty.value, () => {
      model.setChallenge('race')
    }, {
      width: halfBtnW,
      height: 36,
      fill: '#7c3aed',
      onSound: () => this.sounds.softClick(),
    })
    panelContent.addChild(this.raceButton)

    this.demyelinationButton = new SoftButton(NeuronSignalStrings.demyelinationStringProperty.value, () => {
      model.setChallenge('demyelination')
    }, {
      width: contentW,
      height: 34,
      fill: '#dc2626',
      onSound: () => this.sounds.softClick(),
    })
    panelContent.addChild(this.demyelinationButton)

    this.raceLockHint = new Text(NeuronSignalStrings.raceLockedStringProperty.value, {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: NervousColors.panelMuted,
      maxWidth: contentW,
    })
    panelContent.addChild(this.raceLockHint)

    this.statusText = new Text(model.statusProperty.value, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: NervousColors.panelMuted,
      maxWidth: contentW,
    })
    panelContent.addChild(this.statusText)

    this.raceTimeText = new Text('', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#fde68a',
      maxWidth: contentW,
      visible: false,
    })
    panelContent.addChild(this.raceTimeText)

    this.teachingTriad = new TeachingTriad(contentW)
    panelContent.addChild(this.teachingTriad)

    this.starsText = new Text('★ 0', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: '#d97706',
    })
    panelContent.addChild(this.starsText)

    const speedSlider = new DepthSlider(model.speedScaleProperty, {
      min: 0.5,
      max: 1.8,
      width: contentW,
      label: NeuronSignalStrings.conductionSpeedStringProperty.value,
      format: (n) => `${n.toFixed(1)}×`,
      fill: NervousColors.signal,
      onTick: () => this.sounds.sliderTick(),
    })
    panelContent.addChild(speedSlider)

    const fireBtn = new SoftButton(NeuronSignalStrings.fireStringProperty.value, () => model.fire(), {
      width: contentW,
      height: 42,
      fill: '#c0392b',
      onSound: () => this.sounds.softClick(),
    })
    panelContent.addChild(fireBtn)

    this.myelinButton = new SoftButton(NeuronSignalStrings.myelinStringProperty.value, () => {
      model.setMyelin(!model.myelinProperty.value)
    }, {
      width: contentW,
      height: 42,
      fill: NervousColors.myelin,
      textFill: '#1a1a1a',
      selected: true,
      onSound: () => this.sounds.softClick(),
    })
    panelContent.addChild(this.myelinButton)

    this.showIonsButton = new SoftButton(NeuronSignalStrings.showIonsStringProperty.value, () => {
      model.setShowIons(!model.showIonsProperty.value)
    }, {
      width: contentW,
      height: 38,
      fill: '#0ea5e9',
      selected: false,
      onSound: () => this.sounds.softClick(),
    })
    panelContent.addChild(this.showIonsButton)

    this.playButton = new SoftButton(NeuronSignalStrings.pauseStringProperty.value, () => {
      model.runningProperty.value = !model.runningProperty.value
    }, {
      width: contentW,
      height: 42,
      fill: NervousColors.accent,
      selected: true,
      onSound: () => this.sounds.softClick(),
    })
    panelContent.addChild(this.playButton)

    this.soundButton = new SoftButton(
      model.soundEnabledProperty.value
        ? NeuronSignalStrings.soundOnStringProperty.value
        : NeuronSignalStrings.soundOffStringProperty.value,
      () => {
        this.sounds.unlock()
        model.soundEnabledProperty.value = !model.soundEnabledProperty.value
        this.sounds.setEnabled(model.soundEnabledProperty.value)
        if (model.soundEnabledProperty.value) {
          this.sounds.button()
        }
      },
      {
        width: contentW,
        height: 38,
        fill: '#0f766e',
        selected: true,
        onSound: () => this.sounds.button(),
      },
    )
    panelContent.addChild(this.soundButton)

    const historyHeader = new Text(NeuronSignalStrings.historyStringProperty.value, {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: NervousColors.panelText,
    })
    panelContent.addChild(historyHeader)

    const legendMyelin = new Text(NeuronSignalStrings.legendMyelinStringProperty.value, {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: NervousColors.myelin,
    })
    const legendBare = new Text(NeuronSignalStrings.legendBareStringProperty.value, {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#94a3b8',
    })
    panelContent.addChild(legendMyelin)
    panelContent.addChild(legendBare)

    this.historyChart = new HistoryChart(contentW, 90, {
      title: NeuronSignalStrings.historyStringProperty.value,
      maxPoints: 12,
    })
    this.historyMyelinSeries = this.historyChart.addSeries(NervousColors.myelin)
    this.historyBareSeries = this.historyChart.addSeries('#94a3b8')
    panelContent.addChild(this.historyChart)

    this.miniQuiz = new MiniQuiz(contentW)
    panelContent.addChild(this.miniQuiz)

    const tapTip = createPanelTip(NeuronSignalStrings.tapNodeStringProperty.value, {
      width: contentW,
      fontSize: 15,
    })
    panelContent.addChild(tapTip)

    const learnTip = createPanelTip(NeuronSignalStrings.learnMoreStringProperty.value, {
      width: contentW,
      fontSize: 15,
    })
    panelContent.addChild(learnTip)

    const bottomPad = new Rectangle(0, 0, contentW, 20, {
      fill: 'rgba(255,255,255,0)',
      pickable: false,
    })
    panelContent.addChild(bottomPad)

    this.relayoutPanel = () => {
      let py = 4
      this.exploreButton.left = 0
      this.exploreButton.top = py
      this.raceButton.left = halfBtnW + 8
      this.raceButton.top = py
      py = this.exploreButton.bottom + 8

      this.demyelinationButton.left = 0
      this.demyelinationButton.top = py
      py = this.demyelinationButton.bottom + 6

      this.raceLockHint.left = 0
      this.raceLockHint.top = py
      py = this.raceLockHint.visible ? this.raceLockHint.bottom + 8 : py + 2

      this.statusText.left = 0
      this.statusText.top = py
      py = this.statusText.bottom + 8

      this.raceTimeText.left = 0
      this.raceTimeText.top = py
      py = this.raceTimeText.visible ? this.raceTimeText.bottom + 10 : py

      this.teachingTriad.left = 0
      this.teachingTriad.top = py
      py = this.teachingTriad.bottom + 10

      this.starsText.left = 0
      this.starsText.top = py
      py = this.starsText.bottom + 10

      speedSlider.left = 0
      speedSlider.top = py
      py = speedSlider.bottom + 16

      fireBtn.left = 0
      fireBtn.top = py
      py = fireBtn.bottom + 10

      this.myelinButton.left = 0
      this.myelinButton.top = py
      py = this.myelinButton.bottom + 10

      this.showIonsButton.left = 0
      this.showIonsButton.top = py
      py = this.showIonsButton.bottom + 10

      this.playButton.left = 0
      this.playButton.top = py
      py = this.playButton.bottom + 10

      this.soundButton.left = 0
      this.soundButton.top = py
      py = this.soundButton.bottom + 16

      historyHeader.left = 0
      historyHeader.top = py
      py = historyHeader.bottom + 4

      legendMyelin.left = 0
      legendMyelin.top = py
      legendBare.left = Math.floor(contentW / 2)
      legendBare.top = py
      py = legendMyelin.bottom + 4

      this.historyChart.left = 0
      this.historyChart.top = py
      py = this.historyChart.bottom + 14

      this.miniQuiz.left = 0
      this.miniQuiz.top = py
      py = this.miniQuiz.visible ? this.miniQuiz.bottom + 14 : py

      tapTip.left = 0
      tapTip.top = py
      py = tapTip.bottom + 12

      learnTip.left = 0
      learnTip.top = py
      py = learnTip.bottom + 4

      bottomPad.top = py
    }
    this.relayoutPanel()

    const scroller = new ScrollableNode(panelContent, rightW - 24, stageH - 56)
    scroller.left = 12
    scroller.top = 38
    card.content.addChild(scroller)

    this.addChild(
      new ResetAllButton({
        listener: () => {
          model.reset()
          this.particles.clear()
          this.ionLayer.removeAllChildren()
          this.ionLabels.length = 0
          this.historyChart.clear()
          this.miniQuiz.hideQuiz()
          this.raceDisplayTime = 0
          this.lastArrived = false
          this.tipTimer = 0
          this.tipOverlay.visible = false
          this.signalTrail.clear()
          this.rippleFX.clear()
          this.sounds.resetAll()
          this.relayoutPanel()
        },
        right: lb.right - m,
        bottom: lb.bottom - my,
      }),
    )

    // ---- Timed tip overlay (first fire) ----
    const tipCardW = Math.min(460, stageW - 40)
    const tipBg = new Rectangle(0, 0, tipCardW, 100, {
      cornerRadius: 14,
      fill: 'rgba(15,23,42,0.94)',
      stroke: 'rgba(244,208,63,0.6)',
      lineWidth: 2,
    })
    const tipText = new RichText(NeuronSignalStrings.tipOverlayStringProperty.value, {
      font: new PhetFont({ size: 14, weight: 'bold' }),
      fill: '#fef3c7',
      lineWrap: tipCardW - 32,
      leading: 4,
      left: 16,
      top: 14,
    })
    const tipDismiss = new SoftButton(NeuronSignalStrings.tipDismissStringProperty.value, () => {
      this.tipTimer = 0
      this.tipOverlay.visible = false
    }, {
      width: 110,
      height: 30,
      fill: NervousColors.myelin,
      textFill: '#1a1a1a',
      fontSize: 12,
      onSound: () => this.sounds.softClick(),
    })
    tipBg.setRectHeight(Math.max(90, tipText.bottom + 44))
    tipDismiss.left = 16
    tipDismiss.top = tipBg.rectHeight - 40
    this.tipOverlay = new Node({
      children: [tipBg, tipText, tipDismiss],
      visible: false,
      centerX: stageLeft + stageW / 2,
      top: stageTop + 24,
    })
    this.addChild(this.tipOverlay)

    const hopX = (hop: number) => this.ax0 + hop * (this.ax1 - this.ax0) / NODE_COUNT

    model.hopIndexProperty.link((hop) => {
      if (hop < 0) {
        return
      }
      const x = hopX(hop)
      this.sounds.hop()
      this.rippleFX.burst(x, this.axonY, {
        color: 'rgba(34,211,238,0.75)',
        count: 2,
        maxR: 30,
        life: 0.4,
      })
      this.particles.burst(x, this.axonY, {
        count: 10,
        color: '#22d3ee',
        speed: 75,
        life: 0.42,
        radius: 2.4,
      })
      this.particles.burst(x, this.axonY, {
        count: 8,
        color: '#fbbf24',
        speed: 55,
        life: 0.38,
        radius: 2,
      })
      if (hop >= 1 && hop <= this.nodeButtons.length) {
        this.hopFlashIndex = hop - 1
        this.hopFlash = 0.28
        this.nodeButtons[hop - 1].radius = 14
      }
      if (model.showIonsProperty.value) {
        this.particles.burst(x, this.axonY - 8, {
          count: 9,
          color: '#3b82f6',
          speed: 70,
          life: 0.5,
          radius: 2.6,
        })
        this.particles.burst(x, this.axonY - 8, {
          count: 6,
          color: '#f59e0b',
          speed: 50,
          life: 0.45,
          radius: 2.2,
        })
        this.spawnIonLabel(x, this.axonY - 26)
      }
    })

    model.arrivedProperty.link((arrived) => {
      if (arrived && !this.lastArrived) {
        this.sounds.synapse()
        this.rippleFX.burst(this.terminalX, this.axonY, {
          color: 'rgba(88,214,141,0.8)',
          count: 3,
          maxR: 60,
          life: 0.6,
        })
        this.particles.burst(this.terminalX, this.axonY, {
          count: 22,
          color: '#58d68d',
          speed: 85,
          life: 0.7,
          radius: 3.5,
        })
        this.particles.burst(this.terminalX - 18, this.axonY, {
          count: 14,
          color: '#86efac',
          speed: 65,
          life: 0.55,
          radius: 2.8,
        })
      }
      this.lastArrived = arrived
    })

    const syncTriad = () => {
      const challenge = model.challengeProperty.value
      const myelinOn = model.myelinProperty.value
      const phase = model.racePhaseProperty.value

      let nowStr: string
      let whyStr: string
      let nextStr: string

      if (challenge === 'race') {
        nowStr = phase === 1
          ? NeuronSignalStrings.triadNowRaceHeat1StringProperty.value
          : phase === 2
            ? NeuronSignalStrings.triadNowRaceHeat2StringProperty.value
            : NeuronSignalStrings.triadNowRaceDoneStringProperty.value
        whyStr = myelinOn
          ? NeuronSignalStrings.triadWhyMyelinStringProperty.value
          : NeuronSignalStrings.triadWhyBareStringProperty.value
        nextStr = phase >= 3
          ? NeuronSignalStrings.triadNextQuizStringProperty.value
          : NeuronSignalStrings.triadNextToggleStringProperty.value
      }
      else if (challenge === 'demyelination') {
        nowStr = NeuronSignalStrings.triadNowDemyelinationStringProperty.value
        whyStr = NeuronSignalStrings.triadWhyDemyelinationStringProperty.value
        nextStr = NeuronSignalStrings.triadNextIonsStringProperty.value
      }
      else {
        nowStr = myelinOn
          ? NeuronSignalStrings.triadNowMyelinStringProperty.value
          : NeuronSignalStrings.triadNowBareStringProperty.value
        whyStr = myelinOn
          ? NeuronSignalStrings.triadWhyMyelinStringProperty.value
          : NeuronSignalStrings.triadWhyBareStringProperty.value
        nextStr = !model.raceUnlockedProperty.value
          ? NeuronSignalStrings.triadNextRaceLockedStringProperty.value
          : NeuronSignalStrings.triadNextRaceStringProperty.value
      }

      this.teachingTriad.setTriad(nowStr, whyStr, nextStr)
      this.relayoutPanel()
    }

    const syncMyelin = () => {
      const on = model.myelinProperty.value
      this.myelinLayer.removeAllChildren()
      const spanLocal = this.ax1 - this.ax0
      if (on) {
        for (let i = 0; i < segCount; i++) {
          const xa = this.ax0 + i * (spanLocal / segCount) + 4
          const xb = xa + (spanLocal / segCount) * 0.72
          this.myelinLayer.addChild(
            new Path(new Shape().moveTo(xa, this.axonY + 2).lineTo(xb, this.axonY + 2), {
              stroke: 'rgba(0,0,0,0.25)',
              lineWidth: Math.max(18, Math.min(stageW, stageH) * 0.04),
              lineCap: 'round',
            }),
          )
          this.myelinLayer.addChild(
            new Path(new Shape().moveTo(xa, this.axonY).lineTo(xb, this.axonY), {
              stroke: NervousColors.myelin,
              lineWidth: Math.max(16, Math.min(stageW, stageH) * 0.036),
              lineCap: 'round',
            }),
          )
        }
        this.myelinLabel.string = NeuronSignalStrings.nodesStringProperty.value
        this.modeText.string = NeuronSignalStrings.saltatoryStringProperty.value
        this.myelinButton.setLabel(NeuronSignalStrings.myelinStringProperty.value)
      }
      else {
        this.myelinLabel.string = NeuronSignalStrings.unmyelinatedStringProperty.value
        this.modeText.string = NeuronSignalStrings.continuousStringProperty.value
        this.myelinButton.setLabel(NeuronSignalStrings.myelinOffStringProperty.value)
      }
      for (const node of this.nodeButtons) {
        node.visible = on
      }
      this.myelinButton.setSelected(on)
      this.myelinButton.opacity = model.challengeProperty.value === 'demyelination' ? 0.5 : 1
      const speedFrac = (on ? 1 : 0.28) * model.speedScaleProperty.value / 1.8
      this.speedFill.setRectWidth(Math.max(10, speedFrac * this.speedTrackW))
      this.speedFill.fill = on ? NervousColors.myelin : '#64748b'
      syncTriad()
    }
    model.myelinProperty.link(syncMyelin)
    model.myelinProperty.lazyLink((on) => this.sounds.toggle(on))
    model.speedScaleProperty.link(() => syncMyelin())

    model.runningProperty.link((running) => {
      this.playButton.setLabel(
        running
          ? NeuronSignalStrings.pauseStringProperty.value
          : NeuronSignalStrings.playStringProperty.value,
      )
      this.playButton.setSelected(running)
    })
    model.runningProperty.lazyLink((running) => this.sounds.playPause(running))

    model.showIonsProperty.link((show) => {
      this.showIonsButton.setLabel(
        show
          ? NeuronSignalStrings.hideIonsStringProperty.value
          : NeuronSignalStrings.showIonsStringProperty.value,
      )
      this.showIonsButton.setSelected(show)
      if (!show) {
        this.ionLayer.removeAllChildren()
        this.ionLabels.length = 0
      }
    })

    const syncChallenge = () => {
      const mode = model.challengeProperty.value
      this.exploreButton.setSelected(mode === 'explore')
      this.raceButton.setSelected(mode === 'race')
      this.demyelinationButton.setSelected(mode === 'demyelination')
      this.raceButton.opacity = model.raceUnlockedProperty.value ? 1 : 0.55
      this.myelinButton.opacity = mode === 'demyelination' ? 0.5 : 1
      syncTriad()
      this.relayoutPanel()
    }

    model.challengeProperty.link(syncChallenge)
    model.challengeProperty.lazyLink(() => this.sounds.modeChange())
    model.soundEnabledProperty.link((on) => {
      this.soundButton.setLabel(
        on
          ? NeuronSignalStrings.soundOnStringProperty.value
          : NeuronSignalStrings.soundOffStringProperty.value,
      )
      this.soundButton.setSelected(on)
    })
    model.raceUnlockedProperty.link((unlocked) => {
      this.raceLockHint.visible = !unlocked
      this.raceButton.opacity = unlocked ? 1 : 0.55
      syncTriad()
      this.relayoutPanel()
    })

    model.statusProperty.link((status) => {
      this.guide.setGuidance(
        NeuronSignalStrings.guideTitleStringProperty.value,
        status,
      )
      this.statusText.string = status
      this.relayoutPanel()
    })

    model.starsProperty.link((stars) => {
      this.starsText.string = `★ ${stars}`
    })

    model.lastLapResultProperty.link((result) => {
      if (!result) {
        return
      }
      if (result.myelinOn) {
        this.historyChart.push(this.historyMyelinSeries, result.time)
      }
      else {
        this.historyChart.push(this.historyBareSeries, result.time)
      }
    })

    model.fireCountProperty.link((count, oldCount) => {
      if (count === 1 && (oldCount === 0 || oldCount === null)) {
        this.tipOverlay.visible = true
        this.tipTimer = TIP_OVERLAY_DURATION
      }
    })
    model.fireCountProperty.lazyLink(() => {
      this.sounds.fireSignal()
      this.rippleFX.burst(x0, y, {
        color: 'rgba(93,173,226,0.8)',
        count: 2,
        maxR: 40,
        life: 0.45,
      })
    })

    const syncRaceReadout = () => {
      const phase = model.racePhaseProperty.value
      this.raceTimeText.visible = phase >= 1
      if (phase === 1) {
        this.raceTimeText.string = `${NeuronSignalStrings.raceHeat1StringProperty.value} · ${this.raceDisplayTime.toFixed(1)}s`
      }
      else if (phase === 2) {
        const mm = model.raceMyelinTimeProperty.value
        this.raceTimeText.string = `${mm.toFixed(1)}s · ${NeuronSignalStrings.raceHeat2StringProperty.value} · ${this.raceDisplayTime.toFixed(1)}s`
      }
      else if (phase === 3) {
        const mm = model.raceMyelinTimeProperty.value
        const bb = model.raceBareTimeProperty.value
        this.raceTimeText.string = NeuronSignalStrings.raceTimesStringProperty.value
          .replace('{{myelin}}', mm.toFixed(1))
          .replace('{{bare}}', bb.toFixed(1))
      }
      this.relayoutPanel()
    }
    model.racePhaseProperty.link((phase) => {
      this.raceDisplayTime = 0
      syncRaceReadout()
      if (phase === 0) {
        this.raceTimeText.visible = false
      }
      if (phase === 3) {
        this.sounds.celebrate()
        this.miniQuiz.showQuiz(
          NeuronSignalStrings.quizQuestionStringProperty.value,
          [
            { label: NeuronSignalStrings.quizOptionJumpStringProperty.value, correct: true },
            { label: NeuronSignalStrings.quizOptionContinuousStringProperty.value, correct: false },
            { label: NeuronSignalStrings.quizOptionThickerStringProperty.value, correct: false },
          ],
          (correct) => {
            correct ? this.sounds.correct() : this.sounds.wrong()
            model.recordQuizAnswer(correct)
          },
        )
      }
      syncTriad()
      this.relayoutPanel()
    })
    model.raceMyelinTimeProperty.link(syncRaceReadout)
    model.raceBareTimeProperty.link(syncRaceReadout)

    syncMyelin()
    syncChallenge()
    syncRaceReadout()
    syncTriad()
    this.raceLockHint.visible = !model.raceUnlockedProperty.value
  }

  private spawnIonLabel(x: number, y: number): void {
    const node = new Text('Na⁺', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#60a5fa',
      centerX: x,
      centerY: y,
      pickable: false,
    })
    this.ionLayer.addChild(node)
    this.ionLabels.push({ node, life: 0.9, maxLife: 0.9 })
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.pulse += dt
    this.somaHalo.opacity = 0.45 + 0.3 * Math.sin(this.pulse * 2.2)

    if (
      this.model.challengeProperty.value === 'race'
      && this.model.racePhaseProperty.value > 0
      && this.model.racePhaseProperty.value < 3
      && this.model.runningProperty.value
    ) {
      this.raceDisplayTime += dt
      const phase = this.model.racePhaseProperty.value
      if (phase === 1) {
        this.raceTimeText.string = `${NeuronSignalStrings.raceHeat1StringProperty.value} · ${this.raceDisplayTime.toFixed(1)}s`
      }
      else if (phase === 2) {
        const mm = this.model.raceMyelinTimeProperty.value
        this.raceTimeText.string = `${mm.toFixed(1)}s · ${NeuronSignalStrings.raceHeat2StringProperty.value} · ${this.raceDisplayTime.toFixed(1)}s`
      }
      this.raceTimeText.visible = true
    }

    if (this.hopFlash > 0) {
      this.hopFlash -= dt
    }
    else if (this.hopFlashIndex >= 0) {
      const node = this.nodeButtons[this.hopFlashIndex]
      node.radius = damp(node.radius, 9, 14, dt)
      if (Math.abs(node.radius - 9) < 0.08) {
        node.radius = 9
        this.hopFlashIndex = -1
      }
    }

    this.membraneShimmer.opacity = 0.18 + 0.18 * Math.sin(this.pulse * 1.6)

    if (this.model.myelinProperty.value) {
      const segs = this.myelinLayer.children
      for (let i = 0; i < segs.length; i++) {
        segs[i].opacity = 0.82 + 0.18 * Math.sin(this.pulse * 2.6 + i * 0.7)
      }
    }

    for (let i = this.ionLabels.length - 1; i >= 0; i--) {
      const label = this.ionLabels[i]
      label.life -= dt
      if (label.life <= 0) {
        this.ionLayer.removeChild(label.node)
        this.ionLabels.splice(i, 1)
        continue
      }
      label.node.centerY -= dt * 22
      label.node.opacity = Math.max(0, label.life / label.maxLife)
    }

    if (this.tipTimer > 0) {
      this.tipTimer -= dt
      if (this.tipTimer <= 0) {
        this.tipOverlay.visible = false
      }
    }

    if (this.miniQuiz.visible !== this.quizWasVisible) {
      this.quizWasVisible = this.miniQuiz.visible
      this.relayoutPanel()
    }

    const vt = this.model.visualT()
    const x = this.ax0 + vt * (this.ax1 - this.ax0 - 10)
    this.impulse.centerX = x
    this.impulse.centerY = this.axonY
    this.impulseGlow.centerX = x
    this.impulseGlow.centerY = this.axonY
    this.impulseGlow.radius = 14 + 5 * Math.sin(this.pulse * 10)
    this.trail.shape = new Shape()
      .moveTo(Math.max(this.ax0, x - 48), this.axonY)
      .lineTo(x, this.axonY)
    this.progressText.string = `AP ${Math.round(vt * 100)}%`
    this.progressText.centerX = x
    this.progressText.bottom = this.axonY - 30

    if (this.model.runningProperty.value) {
      this.signalTrail.push(x, this.axonY, 9)
    }
    this.signalTrail.step(dt)
    this.rippleFX.step(dt)

    const lapT = this.model.tProperty.value % 1
    if (
      this.model.runningProperty.value
      && lapT > 0.02
      && lapT < 0.92
    ) {
      this.trailFrame++
      const spawnCount = this.trailFrame % 2 === 0 ? 2 : 1
      for (let i = 0; i < spawnCount; i++) {
        this.particles.burst(
          x - Math.random() * 10,
          this.axonY + (Math.random() - 0.5) * 8,
          {
            count: 1,
            color: 'rgba(244,208,63,0.5)',
            speed: 12 + Math.random() * 18,
            life: 0.2 + Math.random() * 0.12,
            radius: 1.4,
          },
        )
      }
    }

    this.particles.step(dt, 20)
  }
}
