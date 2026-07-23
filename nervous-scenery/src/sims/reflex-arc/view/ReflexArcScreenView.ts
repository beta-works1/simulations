import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Path, Rectangle, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { ReflexArcModel } from '../model/ReflexArcModel.js'
import { NervousConstants } from '../../../shared/NervousConstants.js'
import { NervousColors } from '../../../shared/NervousColors.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { SoftButton } from '../../../shared/ui/SoftButton.js'
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
  private readonly signalDot: Circle
  private readonly progressText: Text
  private readonly resultText: Text
  private readonly brainLabel: Text
  private readonly brainNode: Path
  private readonly viaBrainButton: SoftButton

  public constructor(model: ReflexArcModel, providedOptions?: Options) {
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

    const stageShadow = new Rectangle(stageLeft + 4, stageTop + 6, stageW, stageH, {
      cornerRadius: 16,
      fill: 'rgba(15,23,42,0.12)',
    })
    const stage = new Rectangle(stageLeft, stageTop, stageW, stageH, {
      cornerRadius: 16,
      fill: '#f5f7fa',
      stroke: 'rgba(71,85,105,0.2)',
      lineWidth: 1.5,
    })
    this.addChild(stageShadow)
    this.addChild(stage)

    const receptor = { x: stageLeft + stageW * 0.14, y: stageTop + stageH * 0.68 }
    const spine = { x: stageLeft + stageW * 0.48, y: stageTop + stageH * 0.5 }
    const brain = { x: stageLeft + stageW * 0.52, y: stageTop + stageH * 0.2 }
    const effector = { x: stageLeft + stageW * 0.86, y: stageTop + stageH * 0.68 }

    const body = new Path(
      Shape.ellipse(spine.x, stageTop + stageH * 0.52, stageW * 0.08, stageH * 0.26, 0),
      { fill: 'rgba(210,185,160,0.28)', pickable: false },
    )
    const head = new Circle(Math.min(stageW, stageH) * 0.05, {
      fill: 'rgba(210,185,160,0.28)',
      centerX: brain.x - 4,
      centerY: brain.y + 8,
      pickable: false,
    })
    this.addChild(body)
    this.addChild(head)

    const afferent: Curve = {
      a: receptor,
      c1: { x: stageLeft + stageW * 0.28, y: stageTop + stageH * 0.72 },
      c2: { x: stageLeft + stageW * 0.38, y: stageTop + stageH * 0.62 },
      b: spine,
    }
    const toBrain: Curve = {
      a: spine,
      c1: { x: spine.x - 10, y: stageTop + stageH * 0.36 },
      c2: { x: brain.x - 20, y: stageTop + stageH * 0.28 },
      b: brain,
    }
    const fromBrain: Curve = {
      a: brain,
      c1: { x: brain.x + 10, y: stageTop + stageH * 0.3 },
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
    this.addChild(this.pathLayer)
    this.addChild(this.completedLayer)

    const colW = 16
    const colTop = stageTop + stageH * 0.3
    const colH = stageH * 0.38
    this.addChild(
      new Rectangle(spine.x - colW / 2, colTop, colW, colH, {
        cornerRadius: 8,
        fill: '#aeb6bf',
        pickable: false,
      }),
    )
    this.addChild(
      new Text(ReflexArcStrings.spinalStringProperty.value, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: NervousColors.ink,
        left: spine.x + 22,
        top: colTop + 8,
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
      lineWidth: 1.8,
      cursor: 'pointer',
      scale: Math.min(stageW, stageH) * 0.0021,
      centerX: brain.x,
      centerY: brain.y,
    })
    this.brainNode.addInputListener({
      down: () => model.setViaBrain(!model.viaBrainProperty.value),
    })
    this.addChild(this.brainNode)

    this.brainLabel = new Text('', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: NervousColors.ink,
      centerX: brain.x,
      bottom: brain.y - 36,
      pickable: false,
    })
    this.addChild(this.brainLabel)

    const receptorNode = new Circle(16, {
      fill: NervousColors.receptor,
      stroke: '#fff',
      lineWidth: 2.5,
      cursor: 'pointer',
      centerX: receptor.x,
      centerY: receptor.y,
    })
    receptorNode.addInputListener({ down: () => model.fire() })
    this.addChild(receptorNode)
    this.addChild(
      new Text(ReflexArcStrings.receptorStringProperty.value, {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: NervousColors.ink,
        centerX: receptor.x,
        bottom: receptor.y - 22,
        pickable: false,
      }),
    )

    this.addChild(
      new Circle(16, {
        fill: NervousColors.effector,
        stroke: '#fff',
        lineWidth: 2.5,
        centerX: effector.x,
        centerY: effector.y,
        pickable: false,
      }),
    )
    this.addChild(
      new Text(ReflexArcStrings.effectorStringProperty.value, {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: NervousColors.ink,
        centerX: effector.x,
        bottom: effector.y - 22,
        pickable: false,
      }),
    )

    this.addChild(
      new Circle(12, {
        fill: NervousColors.spine,
        stroke: '#fff',
        lineWidth: 2,
        centerX: spine.x,
        centerY: spine.y,
        pickable: false,
      }),
    )

    this.signalDot = new Circle(7, {
      fill: NervousColors.signal,
      stroke: '#b7950b',
      lineWidth: 1.5,
      visible: false,
      pickable: false,
    })
    this.addChild(this.signalDot)

    this.progressText = new Text('', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: NervousColors.ink,
      visible: false,
      pickable: false,
    })
    this.addChild(this.progressText)

    this.resultText = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#fff',
      centerX: stageLeft + stageW / 2,
      bottom: stageTop + stageH - 14,
      visible: false,
      pickable: false,
    })
    this.addChild(this.resultText)

    // Controls
    const card = new DepthCard(rightW, stageH - 56, { title: ReflexArcStrings.pathwayStringProperty.value })
    card.left = stageLeft + stageW + gap
    card.top = stageTop
    this.addChild(card)

    const stimulateBtn = new SoftButton(ReflexArcStrings.stimulateStringProperty.value, () => model.fire(), {
      width: rightW - 28,
      fill: NervousColors.receptor,
    })
    stimulateBtn.left = 14
    stimulateBtn.top = 40
    card.content.addChild(stimulateBtn)

    this.viaBrainButton = new SoftButton(ReflexArcStrings.viaBrainStringProperty.value, () => {
      model.setViaBrain(!model.viaBrainProperty.value)
    }, {
      width: rightW - 28,
      fill: '#2980b9',
      selected: false,
    })
    this.viaBrainButton.left = 14
    this.viaBrainButton.top = 86
    card.content.addChild(this.viaBrainButton)

    const hint = new Text(ReflexArcStrings.hintStringProperty.value, {
      font: new PhetFont(11),
      fill: NervousColors.muted,
      left: 14,
      top: 140,
      maxWidth: rightW - 28,
    })
    card.content.addChild(hint)

    const resetAllButton = new ResetAllButton({
      listener: () => model.reset(),
      right: lb.right - m,
      bottom: lb.bottom - my,
    })
    this.addChild(resetAllButton)

    const syncPathway = () => {
      const via = model.viaBrainProperty.value
      this.pathLayer.removeAllChildren()
      const curves = via ? this.curvesViaBrain : this.curvesNoBrain
      const color = via ? '#2980b9' : '#1e8449'
      for (const c of curves) {
        this.pathLayer.addChild(
          new Path(curveShape(c), {
            stroke: color,
            lineWidth: 3,
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
      this.completedLayer.removeAllChildren()
      this.signalDot.visible = false
      this.progressText.visible = false
      this.resultText.visible = false
    }
    model.viaBrainProperty.link(syncPathway)
    model.firedProperty.link(() => {
      if (!model.firedProperty.value) {
        this.completedLayer.removeAllChildren()
        this.signalDot.visible = false
        this.progressText.visible = false
        this.resultText.visible = false
      }
    })
  }

  public override step(dt: number): void {
    this.model.step(dt)
    if (!this.model.firedProperty.value) {
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

    this.completedLayer.removeAllChildren()
    for (let k = 0; k < i; k++) {
      this.completedLayer.addChild(
        new Path(curveShape(curves[k]), {
          stroke: NervousColors.signal,
          lineWidth: 3,
          lineCap: 'round',
        }),
      )
    }
    const partial = new Shape().moveTo(c.a.x, c.a.y)
    const steps = Math.max(2, Math.floor(f * 24))
    for (let s = 1; s <= steps; s++) {
      const p = cubic(c.a, c.c1, c.c2, c.b, (s / steps) * f)
      partial.lineTo(p.x, p.y)
    }
    this.completedLayer.addChild(
      new Path(partial, {
        stroke: NervousColors.signal,
        lineWidth: 3,
        lineCap: 'round',
      }),
    )

    this.signalDot.visible = true
    this.signalDot.centerX = pos.x
    this.signalDot.centerY = pos.y
    this.progressText.visible = true
    this.progressText.string = `${Math.round(progress * 100)}%`
    this.progressText.centerX = pos.x
    this.progressText.bottom = pos.y - 14

    if (progress >= 1) {
      this.resultText.visible = true
      this.resultText.string = via
        ? ReflexArcStrings.slowStringProperty.value
        : ReflexArcStrings.fastStringProperty.value
      this.resultText.fill = via ? '#2980b9' : '#27ae60'
    }
    else {
      this.resultText.visible = false
    }
  }
}
