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
import { SoftButton } from '../../../shared/ui/SoftButton.js'
import { GuidanceBanner } from '../../../shared/ui/GuidanceBanner.js'
import { NeuronSignalStrings } from '../NeuronSignalStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

export class NeuronSignalScreenView extends ScreenView {
  private readonly model: NeuronSignalModel
  private readonly ax0: number
  private readonly ax1: number
  private readonly axonY: number
  private readonly myelinLayer: Node
  private readonly nodeButtons: Circle[] = []
  private readonly impulse: Circle
  private readonly impulseGlow: Circle
  private readonly trail: Path
  private readonly modeText: Text
  private readonly myelinLabel: Text
  private readonly progressText: Text
  private readonly speedFill: Rectangle
  private readonly speedTrackW: number
  private readonly myelinButton: SoftButton
  private readonly playButton: SoftButton
  private readonly guide: GuidanceBanner
  private readonly somaHalo: Circle
  private pulse = 0

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

    // Axon depth underlay + core
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

    // Interactive nodes of Ranvier
    const segCount = 7
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
          node.radius = 12
        },
        exit: () => {
          node.radius = 9
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

    // Speed meter
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

    // Controls
    const card = new DepthCard(rightW, stageH, { title: NeuronSignalStrings.axonStringProperty.value })
    card.left = stageLeft + stageW + gap
    card.top = stageTop
    this.addChild(card)

    const fireBtn = new SoftButton(NeuronSignalStrings.fireStringProperty.value, () => model.fire(), {
      width: rightW - 32,
      height: 42,
      fill: '#c0392b',
    })
    fireBtn.left = 16
    fireBtn.top = 44
    card.content.addChild(fireBtn)

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
    this.myelinButton.top = 96
    card.content.addChild(this.myelinButton)

    this.playButton = new SoftButton('Pause', () => {
      model.runningProperty.value = !model.runningProperty.value
    }, {
      width: rightW - 32,
      height: 42,
      fill: NervousColors.accent,
      selected: true,
    })
    this.playButton.left = 16
    this.playButton.top = 148
    card.content.addChild(this.playButton)

    card.content.addChild(
      new Text(NeuronSignalStrings.tapNodeStringProperty.value, {
        font: new PhetFont(16),
        fill: NervousColors.ink,
        left: 16,
        top: 208,
        maxWidth: rightW - 32,
      }),
    )
    card.content.addChild(
      new Text(NeuronSignalStrings.learnMoreStringProperty.value, {
        font: new PhetFont(17),
        fill: NervousColors.ink,
        left: 16,
        top: 270,
        maxWidth: rightW - 32,
      }),
    )

    this.addChild(
      new ResetAllButton({
        listener: () => model.reset(),
        right: lb.right - m,
        bottom: lb.bottom - my,
      }),
    )

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
        this.guide.setGuidance(
          NeuronSignalStrings.guideTitleStringProperty.value,
          NeuronSignalStrings.guideMyelinStringProperty.value,
        )
      }
      else {
        this.myelinLabel.string = NeuronSignalStrings.unmyelinatedStringProperty.value
        this.modeText.string = NeuronSignalStrings.continuousStringProperty.value
        this.myelinButton.setLabel(NeuronSignalStrings.myelinOffStringProperty.value)
        this.guide.setGuidance(
          NeuronSignalStrings.guideTitleStringProperty.value,
          NeuronSignalStrings.guideNoMyelinStringProperty.value,
        )
      }
      for (const node of this.nodeButtons) {
        node.visible = on
      }
      this.myelinButton.setSelected(on)
      const speedFrac = on ? 1 : 0.28
      this.speedFill.setRectWidth(Math.max(10, speedFrac * this.speedTrackW))
      this.speedFill.fill = on ? NervousColors.myelin : '#64748b'
    }
    model.myelinProperty.link(syncMyelin)
    model.runningProperty.link((running) => {
      this.playButton.setLabel(running ? 'Pause' : 'Play')
      this.playButton.setSelected(running)
    })
    model.tProperty.link(() => {
      if (model.tProperty.value > 0.02) {
        this.guide.setGuidance(
          NeuronSignalStrings.guideTitleStringProperty.value,
          NeuronSignalStrings.guideFiredStringProperty.value,
        )
      }
    })
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.pulse += dt
    this.somaHalo.opacity = 0.45 + 0.3 * Math.sin(this.pulse * 2.2)

    const t = this.model.tProperty.value % 1
    const x = this.ax0 + t * (this.ax1 - this.ax0 - 10)
    this.impulse.centerX = x
    this.impulse.centerY = this.axonY
    this.impulseGlow.centerX = x
    this.impulseGlow.centerY = this.axonY
    this.impulseGlow.radius = 14 + 5 * Math.sin(this.pulse * 10)
    this.trail.shape = new Shape()
      .moveTo(Math.max(this.ax0, x - 48), this.axonY)
      .lineTo(x, this.axonY)
    this.progressText.string = `AP ${Math.round(t * 100)}%`
    this.progressText.centerX = x
    this.progressText.bottom = this.axonY - 30
  }
}
