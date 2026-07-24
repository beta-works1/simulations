import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import {
  Circle,
  LinearGradient,
  Node,
  Path,
  Rectangle,
  Text,
} from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { NeuronSignalModel } from '../model/NeuronSignalModel.js'
import { NervousConstants } from '../../../shared/NervousConstants.js'
import { NervousColors } from '../../../shared/NervousColors.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { DepthSlider } from '../../../shared/ui/DepthSlider.js'
import { SoftButton } from '../../../shared/ui/SoftButton.js'
import { GuidanceBanner } from '../../../shared/ui/GuidanceBanner.js'
import { ParticleBurst } from '../../../shared/ui/ParticleBurst.js'
import { createPanelTip } from '../../../shared/ui/createPanelTip.js'
import { NeuronSignalStrings } from '../NeuronSignalStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const NODE_COUNT = 7

export class NeuronSignalScreenView extends ScreenView {
  private readonly model: NeuronSignalModel
  private readonly ax0: number
  private readonly ax1: number
  private readonly terminalX: number
  private readonly axonY: number
  private readonly myelinLayer: Node
  private readonly nodeButtons: Circle[] = []
  private readonly impulse: Circle
  private readonly impulseGlow: Circle
  private readonly trail: Path
  private readonly particles: ParticleBurst
  private readonly modeText: Text
  private readonly myelinLabel: Text
  private readonly progressText: Text
  private readonly speedFill: Rectangle
  private readonly speedTrackW: number
  private readonly myelinButton: SoftButton
  private readonly playButton: SoftButton
  private readonly exploreButton: SoftButton
  private readonly raceButton: SoftButton
  private readonly statusText: Text
  private readonly raceTimeText: Text
  private readonly guide: GuidanceBanner
  private readonly somaHalo: Circle
  private pulse = 0
  private hopFlash = 0
  private hopFlashIndex = -1
  private lastArrived = false
  private raceDisplayTime = 0
  private trailFrame = 0

  public constructor(model: NeuronSignalModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const m = NervousConstants.SCREEN_VIEW_X_MARGIN
    const my = NervousConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    const rightW = 270
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
      new Rectangle(stageLeft + 5, stageTop + 8, stageW, stageH, {
        cornerRadius: 18,
        fill: 'rgba(0,0,0,0.28)',
      }),
    )
    const bg = new Rectangle(stageLeft, stageTop, stageW, stageH, {
      cornerRadius: 18,
      fill: new LinearGradient(0, stageTop, 0, stageTop + stageH)
        .addColorStop(0, '#0b1c2e')
        .addColorStop(1, '#16324f'),
      stroke: 'rgba(255,255,255,0.14)',
      lineWidth: 1.5,
    })
    this.addChild(bg)
    this.addChild(
      new Rectangle(stageLeft + 14, stageTop + 8, stageW - 28, 5, {
        cornerRadius: 3,
        fill: 'rgba(255,255,255,0.18)',
        pickable: false,
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

    const card = new DepthCard(rightW, stageH, { title: NeuronSignalStrings.axonStringProperty.value })
    card.left = stageLeft + stageW + gap
    card.top = stageTop
    this.addChild(card)

    let panelY = 36
    const halfBtnW = Math.floor((rightW - 32 - 8) / 2)

    this.exploreButton = new SoftButton(NeuronSignalStrings.exploreStringProperty.value, () => {
      model.setChallenge('explore')
    }, {
      width: halfBtnW,
      height: 36,
      fill: NervousColors.accent,
      selected: true,
    })
    this.exploreButton.left = 16
    this.exploreButton.top = panelY
    card.content.addChild(this.exploreButton)

    this.raceButton = new SoftButton(NeuronSignalStrings.raceStringProperty.value, () => {
      model.setChallenge('race')
    }, {
      width: halfBtnW,
      height: 36,
      fill: '#7c3aed',
    })
    this.raceButton.left = 16 + halfBtnW + 8
    this.raceButton.top = panelY
    card.content.addChild(this.raceButton)
    panelY += 44

    this.statusText = new Text(model.statusProperty, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: NervousColors.muted,
      left: 16,
      top: panelY,
      maxWidth: rightW - 32,
    })
    card.content.addChild(this.statusText)
    panelY += 38

    this.raceTimeText = new Text('', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#fde68a',
      left: 16,
      top: panelY,
      maxWidth: rightW - 32,
      visible: false,
    })
    card.content.addChild(this.raceTimeText)
    panelY += 28

    const speedSlider = new DepthSlider(model.speedScaleProperty, {
      min: 0.5,
      max: 1.8,
      width: rightW - 32,
      label: NeuronSignalStrings.conductionSpeedStringProperty.value,
      format: (n) => `${n.toFixed(1)}×`,
      fill: NervousColors.signal,
    })
    speedSlider.left = 16
    speedSlider.top = panelY
    card.content.addChild(speedSlider)
    panelY += 54

    const fireBtn = new SoftButton(NeuronSignalStrings.fireStringProperty.value, () => model.fire(), {
      width: rightW - 32,
      height: 42,
      fill: '#c0392b',
    })
    fireBtn.left = 16
    fireBtn.top = panelY
    card.content.addChild(fireBtn)
    panelY += 50

    this.myelinButton = new SoftButton(NeuronSignalStrings.myelinStringProperty.value, () => {
      model.setMyelin(!model.myelinProperty.value)
    }, {
      width: rightW - 32,
      height: 42,
      fill: NervousColors.myelin,
      textFill: '#1a1a1a',
      selected: true,
    })
    this.myelinButton.left = 16
    this.myelinButton.top = panelY
    card.content.addChild(this.myelinButton)
    panelY += 50

    this.playButton = new SoftButton(NeuronSignalStrings.pauseStringProperty.value, () => {
      model.runningProperty.value = !model.runningProperty.value
    }, {
      width: rightW - 32,
      height: 42,
      fill: NervousColors.accent,
      selected: true,
    })
    this.playButton.left = 16
    this.playButton.top = panelY
    card.content.addChild(this.playButton)
    panelY += 54

    const tapTip = createPanelTip(NeuronSignalStrings.tapNodeStringProperty.value, {
      width: rightW - 32,
      fontSize: 16,
    })
    tapTip.left = 16
    tapTip.top = panelY
    card.content.addChild(tapTip)
    panelY += 58

    const learnTip = createPanelTip(NeuronSignalStrings.learnMoreStringProperty.value, {
      width: rightW - 32,
      fontSize: 18,
    })
    learnTip.left = 16
    learnTip.top = panelY
    card.content.addChild(learnTip)

    this.addChild(
      new ResetAllButton({
        listener: () => {
          model.reset()
          this.particles.clear()
          this.raceDisplayTime = 0
          this.lastArrived = false
        },
        right: lb.right - m,
        bottom: lb.bottom - my,
      }),
    )

    const hopX = (hop: number) => this.ax0 + hop * (this.ax1 - this.ax0) / NODE_COUNT

    model.hopIndexProperty.link((hop) => {
      if (hop < 0) {
        return
      }
      const x = hopX(hop)
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
    })

    model.arrivedProperty.link((arrived) => {
      if (arrived && !this.lastArrived) {
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
      const speedFrac = (on ? 1 : 0.28) * model.speedScaleProperty.value / 1.8
      this.speedFill.setRectWidth(Math.max(10, speedFrac * this.speedTrackW))
      this.speedFill.fill = on ? NervousColors.myelin : '#64748b'
    }
    model.myelinProperty.link(syncMyelin)
    model.speedScaleProperty.link(() => syncMyelin())

    model.runningProperty.link((running) => {
      this.playButton.setLabel(
        running
          ? NeuronSignalStrings.pauseStringProperty.value
          : NeuronSignalStrings.playStringProperty.value,
      )
      this.playButton.setSelected(running)
    })

    model.challengeProperty.link((mode) => {
      this.exploreButton.setSelected(mode === 'explore')
      this.raceButton.setSelected(mode === 'race')
    })

    model.statusProperty.link((status) => {
      this.guide.setGuidance(
        NeuronSignalStrings.guideTitleStringProperty.value,
        status,
      )
    })

    const syncRaceReadout = () => {
      const phase = model.racePhaseProperty.value
      this.raceTimeText.visible = phase >= 1
      if (phase === 1) {
        this.raceTimeText.string = `${NeuronSignalStrings.raceHeat1StringProperty.value} · ${this.raceDisplayTime.toFixed(1)}s`
      }
      else if (phase === 2) {
        const m = model.raceMyelinTimeProperty.value
        this.raceTimeText.string = `${m.toFixed(1)}s · ${NeuronSignalStrings.raceHeat2StringProperty.value} · ${this.raceDisplayTime.toFixed(1)}s`
      }
      else if (phase === 3) {
        const m = model.raceMyelinTimeProperty.value
        const b = model.raceBareTimeProperty.value
        this.raceTimeText.string = NeuronSignalStrings.raceTimesStringProperty.value
          .replace('{{myelin}}', m.toFixed(1))
          .replace('{{bare}}', b.toFixed(1))
      }
    }
    model.racePhaseProperty.link((phase) => {
      this.raceDisplayTime = 0
      syncRaceReadout()
      if (phase === 0) {
        this.raceTimeText.visible = false
      }
    })
    model.raceMyelinTimeProperty.link(syncRaceReadout)
    model.raceBareTimeProperty.link(syncRaceReadout)
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
        const m = this.model.raceMyelinTimeProperty.value
        this.raceTimeText.string = `${m.toFixed(1)}s · ${NeuronSignalStrings.raceHeat2StringProperty.value} · ${this.raceDisplayTime.toFixed(1)}s`
      }
      this.raceTimeText.visible = true
    }

    if (this.hopFlash > 0) {
      this.hopFlash -= dt
      if (this.hopFlash <= 0 && this.hopFlashIndex >= 0) {
        this.nodeButtons[this.hopFlashIndex].radius = 9
        this.hopFlashIndex = -1
      }
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
