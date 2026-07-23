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
import { GuidanceBanner } from '../../../shared/ui/GuidanceBanner.js'
import { createPanelTip } from '../../../shared/ui/createPanelTip.js'
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
  private readonly signalGlow: Circle
  private readonly progressText: Text
  private readonly resultText: Text
  private readonly brainLabel: Text
  private readonly brainNode: Path
  private readonly viaBrainButton: SoftButton
  private readonly guide: GuidanceBanner
  private readonly stepLabels: Text[] = []
  private readonly receptorHalo: Circle
  private readonly effectorHalo: Circle
  private readonly effectorNode: Circle
  private pulse = 0
  private effectorFlash = 0

  public constructor(model: ReflexArcModel, providedOptions?: Options) {
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
      title: ReflexArcStrings.guideTitleStringProperty.value,
      body: ReflexArcStrings.guideIdleStringProperty.value,
    })
    this.guide.left = m
    this.guide.top = my
    this.addChild(this.guide)

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
    this.addChild(this.pathLayer)
    this.addChild(this.completedLayer)

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
      new Text('tap to fire', {
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

    this.addChild(
      new Circle(14, {
        fill: NervousColors.spine,
        stroke: '#fff',
        lineWidth: 2.5,
        centerX: spine.x,
        centerY: spine.y,
        pickable: false,
      }),
    )

    // Step chips
    const stepNames = [
      ReflexArcStrings.stepReceptorStringProperty.value,
      ReflexArcStrings.stepSpineStringProperty.value,
      ReflexArcStrings.stepBrainStringProperty.value,
      ReflexArcStrings.stepEffectorStringProperty.value,
    ]
    stepNames.forEach((name, i) => {
      const t = new Text(name, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: NervousColors.muted,
        left: stageLeft + 16 + i * 150,
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

    // Controls
    const card = new DepthCard(rightW, stageH, { title: ReflexArcStrings.pathwayStringProperty.value })
    card.left = stageLeft + stageW + gap
    card.top = stageTop
    this.addChild(card)

    const stimulateBtn = new SoftButton(ReflexArcStrings.stimulateStringProperty.value, () => model.fire(), {
      width: rightW - 32,
      height: 42,
      fill: NervousColors.receptor,
    })
    stimulateBtn.left = 16
    stimulateBtn.top = 44
    card.content.addChild(stimulateBtn)

    this.viaBrainButton = new SoftButton(ReflexArcStrings.viaBrainStringProperty.value, () => {
      model.setViaBrain(!model.viaBrainProperty.value)
    }, {
      width: rightW - 32,
      height: 42,
      fill: '#2980b9',
      selected: false,
    })
    this.viaBrainButton.left = 16
    this.viaBrainButton.top = 96
    card.content.addChild(this.viaBrainButton)

    const learnTip = createPanelTip(ReflexArcStrings.learnMoreStringProperty.value, {
      width: rightW - 32,
      fontSize: 18,
    })
    learnTip.left = 16
    learnTip.top = 156
    card.content.addChild(learnTip)

    this.addChild(
      new ResetAllButton({
        listener: () => model.reset(),
        right: lb.right - m,
        bottom: lb.bottom - my,
      }),
    )

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
      this.stepLabels[2].opacity = via ? 1 : 0.35
      this.completedLayer.removeAllChildren()
      this.signalDot.visible = false
      this.signalGlow.visible = false
      this.progressText.visible = false
      this.resultText.visible = false
      this.updateGuide()
    }
    model.viaBrainProperty.link(syncPathway)
    model.firedProperty.link(() => this.updateGuide())
    model.progressProperty.link(() => this.updateGuide())
  }

  private updateGuide(): void {
    const fired = this.model.firedProperty.value
    const progress = this.model.progressProperty.value
    const via = this.model.viaBrainProperty.value
    if (!fired) {
      this.guide.setGuidance(
        ReflexArcStrings.guideTitleStringProperty.value,
        ReflexArcStrings.guideIdleStringProperty.value,
      )
    }
    else if (progress < 1) {
      this.guide.setGuidance(
        ReflexArcStrings.guideTitleStringProperty.value,
        ReflexArcStrings.guideFiredStringProperty.value,
      )
    }
    else {
      this.guide.setGuidance(
        ReflexArcStrings.guideTitleStringProperty.value,
        via
          ? ReflexArcStrings.guideDoneSlowStringProperty.value
          : ReflexArcStrings.guideDoneFastStringProperty.value,
      )
    }
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.pulse += dt
    this.receptorHalo.opacity = 0.55 + 0.35 * Math.sin(this.pulse * 2.4)

    if (this.effectorFlash > 0) {
      this.effectorFlash -= dt
      this.effectorHalo.radius = 28 + 18 * Math.max(0, this.effectorFlash)
      this.effectorHalo.opacity = Math.max(0, this.effectorFlash)
    }
    else {
      this.effectorHalo.radius = 28
      this.effectorHalo.opacity = 0.5
    }

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

    // Highlight step chips
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
    this.progressText.visible = true
    this.progressText.string = `${Math.round(progress * 100)}%`
    this.progressText.centerX = pos.x
    this.progressText.bottom = pos.y - 18

    if (progress >= 1) {
      this.resultText.visible = true
      this.resultText.string = via
        ? ReflexArcStrings.slowStringProperty.value
        : ReflexArcStrings.fastStringProperty.value
      this.resultText.fill = via ? '#2980b9' : '#27ae60'
      this.effectorFlash = Math.max(this.effectorFlash, 0.45)
    }
    else {
      this.resultText.visible = false
    }
  }
}
