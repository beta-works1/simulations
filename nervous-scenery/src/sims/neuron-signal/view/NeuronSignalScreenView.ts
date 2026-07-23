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
import { NeuronSignalStrings } from '../NeuronSignalStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

export class NeuronSignalScreenView extends ScreenView {
  private readonly model: NeuronSignalModel
  private readonly ax0: number
  private readonly ax1: number
  private readonly axonY: number
  private readonly myelinLayer: Node
  private readonly impulse: Circle
  private readonly trail: Path
  private readonly modeText: Text
  private readonly myelinLabel: Text
  private readonly progressText: Text
  private readonly myelinButton: SoftButton
  private readonly playButton: SoftButton

  public constructor(model: NeuronSignalModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const m = NervousConstants.SCREEN_VIEW_X_MARGIN
    const my = NervousConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    const rightW = 250
    const gap = 14
    const stageLeft = m
    const stageTop = my
    const stageW = lb.width - m * 2 - rightW - gap
    const stageH = lb.height - my * 2

    const bg = new Rectangle(stageLeft, stageTop, stageW, stageH, {
      cornerRadius: 16,
      fill: new LinearGradient(0, stageTop, 0, stageTop + stageH)
        .addColorStop(0, '#0b1c2e')
        .addColorStop(1, '#16324f'),
      stroke: 'rgba(255,255,255,0.12)',
      lineWidth: 1.5,
    })
    this.addChild(
      new Rectangle(stageLeft + 4, stageTop + 6, stageW, stageH, {
        cornerRadius: 16,
        fill: 'rgba(0,0,0,0.25)',
      }),
    )
    this.addChild(bg)

    const y = stageTop + stageH * 0.52
    const x0 = stageLeft + stageW * 0.12
    const x1 = stageLeft + stageW * 0.9
    this.axonY = y
    this.ax0 = x0 + 52
    this.ax1 = x1 - 56

    const soma = new Circle(Math.min(stageW, stageH) * 0.055, {
      fill: NervousColors.soma,
      stroke: '#85c1e9',
      lineWidth: 2,
      cursor: 'pointer',
      centerX: x0,
      centerY: y,
    })
    soma.addInputListener({ down: () => model.fire() })
    this.addChild(soma)

    for (let i = 0; i < 5; i++) {
      const a = -Math.PI * 0.85 + i * 0.35
      this.addChild(
        new Path(
          new Shape()
            .moveTo(x0 + Math.cos(a) * 18, y + Math.sin(a) * 18)
            .lineTo(x0 + Math.cos(a) * 48, y + Math.sin(a) * 48),
          { stroke: NervousColors.soma, lineWidth: 3.5, pickable: false },
        ),
      )
      this.addChild(
        new Circle(4, {
          fill: '#85c1e9',
          centerX: x0 + Math.cos(a) * 50,
          centerY: y + Math.sin(a) * 50,
          pickable: false,
        }),
      )
    }

    this.addChild(
      new Text(NeuronSignalStrings.somaStringProperty.value, {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#dbeafe',
        centerX: x0,
        bottom: y - Math.min(stageW, stageH) * 0.08,
        pickable: false,
      }),
    )

    this.addChild(
      new Path(new Shape().moveTo(x0 + 28, y).lineTo(x1 - 48, y), {
        stroke: NervousColors.axon,
        lineWidth: Math.max(10, Math.min(stageW, stageH) * 0.022),
        lineCap: 'round',
        pickable: false,
      }),
    )
    this.addChild(
      new Text('axon', {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#dbeafe',
        centerX: (x0 + x1) / 2,
        bottom: y - 40,
        pickable: false,
      }),
    )

    this.myelinLayer = new Node({ pickable: false })
    this.addChild(this.myelinLayer)

    this.myelinLabel = new Text('', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#fde68a',
      centerX: (x0 + x1) / 2,
      top: y + 36,
      pickable: false,
    })
    this.addChild(this.myelinLabel)

    const terminal = new Path(
      new Shape()
        .moveTo(x1 - 48, y - 18)
        .lineTo(x1 - 8, y)
        .lineTo(x1 - 48, y + 18)
        .close(),
      { fill: '#58d68d', pickable: false },
    )
    this.addChild(terminal)
    for (let i = 0; i < 3; i++) {
      this.addChild(
        new Circle(3.5, {
          fill: '#58d68d',
          centerX: x1 - 4,
          centerY: y - 12 + i * 12,
          pickable: false,
        }),
      )
    }
    this.addChild(
      new Text(NeuronSignalStrings.terminalStringProperty.value, {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#dbeafe',
        centerX: x1 - 20,
        bottom: y - 34,
        pickable: false,
      }),
    )

    this.trail = new Path(null, {
      stroke: 'rgba(244,208,63,0.4)',
      lineWidth: 4,
      pickable: false,
    })
    this.addChild(this.trail)

    this.impulse = new Circle(11, {
      fill: NervousColors.signal,
      pickable: false,
    })
    this.addChild(this.impulse)

    this.progressText = new Text('AP 0%', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#fef3c7',
      pickable: false,
    })
    this.addChild(this.progressText)

    this.modeText = new Text('', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#e2e8f0',
      left: stageLeft + 16,
      top: stageTop + 16,
      pickable: false,
    })
    this.addChild(this.modeText)

    // Controls
    const card = new DepthCard(rightW, stageH - 56, { title: NeuronSignalStrings.axonStringProperty.value })
    card.left = stageLeft + stageW + gap
    card.top = stageTop
    this.addChild(card)

    const fireBtn = new SoftButton(NeuronSignalStrings.fireStringProperty.value, () => model.fire(), {
      width: rightW - 28,
      fill: '#c0392b',
    })
    fireBtn.left = 14
    fireBtn.top = 40
    card.content.addChild(fireBtn)

    this.myelinButton = new SoftButton(NeuronSignalStrings.myelinStringProperty.value, () => {
      model.setMyelin(!model.myelinProperty.value)
    }, {
      width: rightW - 28,
      fill: NervousColors.myelin,
      textFill: '#1a1a1a',
      selected: true,
    })
    this.myelinButton.left = 14
    this.myelinButton.top = 86
    card.content.addChild(this.myelinButton)

    this.playButton = new SoftButton('Pause', () => {
      model.runningProperty.value = !model.runningProperty.value
    }, {
      width: rightW - 28,
      fill: NervousColors.accent,
      selected: true,
    })
    this.playButton.left = 14
    this.playButton.top = 132
    card.content.addChild(this.playButton)

    card.content.addChild(
      new Text(NeuronSignalStrings.hintStringProperty.value, {
        font: new PhetFont(11),
        fill: NervousColors.muted,
        left: 14,
        top: 186,
        maxWidth: rightW - 28,
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
      const segCount = 7
      const span = this.ax1 - this.ax0
      if (on) {
        for (let i = 0; i < segCount; i++) {
          const xa = this.ax0 + i * (span / segCount) + 4
          const xb = xa + (span / segCount) * 0.72
          this.myelinLayer.addChild(
            new Path(new Shape().moveTo(xa, this.axonY).lineTo(xb, this.axonY), {
              stroke: NervousColors.myelin,
              lineWidth: Math.max(16, Math.min(stageW, stageH) * 0.036),
              lineCap: 'round',
            }),
          )
        }
        for (let i = 1; i < segCount; i++) {
          const nx = this.ax0 + i * (span / segCount)
          this.myelinLayer.addChild(
            new Rectangle(nx - 3, this.axonY - 10, 6, 20, { fill: '#1b4f72' }),
          )
        }
        this.myelinLabel.string = NeuronSignalStrings.nodesStringProperty.value
        this.modeText.string = NeuronSignalStrings.saltatoryStringProperty.value
      }
      else {
        this.myelinLabel.string = NeuronSignalStrings.unmyelinatedStringProperty.value
        this.modeText.string = NeuronSignalStrings.continuousStringProperty.value
      }
      this.myelinButton.setSelected(on)
    }
    model.myelinProperty.link(syncMyelin)
    model.runningProperty.link((running) => {
      this.playButton.setLabel(running ? 'Pause' : 'Play')
      this.playButton.setSelected(running)
    })
  }

  public override step(dt: number): void {
    this.model.step(dt)
    const t = this.model.tProperty.value % 1
    const x = this.ax0 + t * (this.ax1 - this.ax0 - 10)
    this.impulse.centerX = x
    this.impulse.centerY = this.axonY
    this.trail.shape = new Shape()
      .moveTo(Math.max(this.ax0, x - 40), this.axonY)
      .lineTo(x, this.axonY)
    this.progressText.string = `AP ${Math.round(t * 100)}%`
    this.progressText.centerX = x
    this.progressText.bottom = this.axonY - 28
  }
}
