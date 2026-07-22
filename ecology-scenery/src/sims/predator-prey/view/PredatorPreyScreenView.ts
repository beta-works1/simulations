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
import { PredatorPreyModel, InteractionMode } from '../model/PredatorPreyModel.js'
import { EcologyConstants, damp } from '../../../shared/EcologyConstants.js'
import { EcologyColors } from '../../../shared/EcologyColors.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { DepthSlider } from '../../../shared/ui/DepthSlider.js'
import { SoftButton } from '../../../shared/ui/SoftButton.js'
import { PredatorPreyStrings } from '../PredatorPreyStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const MAX_PREY_DOTS = 90
const MAX_PRED_DOTS = 45

export class PredatorPreyScreenView extends ScreenView {
  private readonly model: PredatorPreyModel

  private readonly fieldBounds: { left: number; top: number; width: number; height: number }
  private readonly plotLocal: { left: number; top: number; width: number; height: number }
  private readonly preyDots: Circle[] = []
  private readonly predDots: Circle[] = []
  private readonly preyLayer: Node
  private readonly predLayer: Node
  private readonly spawnFlash: Circle

  private readonly preyPath: Path
  private readonly predPath: Path

  private readonly preyStatText: Text
  private readonly predStatText: Text
  private readonly playPauseButton: SoftButton
  private readonly modeButtons: { mode: InteractionMode; button: SoftButton }[]

  private visualPrey = 40
  private visualPred = 12
  private animTime = 0
  private flashLife = 0

  public constructor(model: PredatorPreyModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const m = EcologyConstants.SCREEN_VIEW_X_MARGIN
    const my = EcologyConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds

    const rightW = 280
    const gap = 14
    const fieldLeft = m
    const fieldTop = my
    const fieldW = lb.width - m * 2 - rightW - gap
    const fieldH = 340
    this.fieldBounds = { left: fieldLeft, top: fieldTop, width: fieldW, height: fieldH }

    const chartTop = fieldTop + fieldH + 12
    const chartH = lb.height - chartTop - my - 8
    const rightLeft = fieldLeft + fieldW + gap

    // ── Meadow field with depth ────────────────────────────────────────────
    const fieldShadow = new Rectangle(fieldLeft + 4, fieldTop + 6, fieldW, fieldH, {
      cornerRadius: 16,
      fill: 'rgba(15,23,42,0.16)',
    })
    const meadowFill = new LinearGradient(0, fieldTop, 0, fieldTop + fieldH)
      .addColorStop(0, '#86efac')
      .addColorStop(0.45, '#4ade80')
      .addColorStop(1, '#15803d')
    const field = new Rectangle(fieldLeft, fieldTop, fieldW, fieldH, {
      cornerRadius: 16,
      fill: meadowFill,
      stroke: 'rgba(22,101,52,0.35)',
      lineWidth: 1.5,
      cursor: 'pointer',
    })
    const haze = new Rectangle(fieldLeft + 10, fieldTop + 8, fieldW - 20, 28, {
      cornerRadius: 10,
      fill: 'rgba(255,255,255,0.22)',
      pickable: false,
    })
    const groundShadow = new Rectangle(fieldLeft + 18, fieldTop + fieldH - 22, fieldW - 36, 12, {
      cornerRadius: 6,
      fill: 'rgba(15,23,42,0.12)',
      pickable: false,
    })

    const midX = fieldLeft + fieldW * 0.5
    const leftHint = new Text(`＋ ${PredatorPreyStrings.preyStringProperty.value}`, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: 'rgba(15,23,42,0.35)',
      centerX: fieldLeft + fieldW * 0.25,
      bottom: fieldTop + fieldH - 14,
      pickable: false,
    })
    const rightHint = new Text(`＋ ${PredatorPreyStrings.predatorsStringProperty.value}`, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: 'rgba(15,23,42,0.35)',
      centerX: fieldLeft + fieldW * 0.75,
      bottom: fieldTop + fieldH - 14,
      pickable: false,
    })
    const divider = new Rectangle(midX - 0.5, fieldTop + 16, 1, fieldH - 48, {
      fill: 'rgba(255,255,255,0.22)',
      pickable: false,
    })

    this.preyLayer = new Node({ pickable: false })
    this.predLayer = new Node({ pickable: false })
    for (let i = 0; i < MAX_PREY_DOTS; i++) {
      const c = new Circle(4, { fill: '#22c55e', stroke: 'rgba(255,255,255,0.45)', lineWidth: 1 })
      c.visible = false
      this.preyDots.push(c)
      this.preyLayer.addChild(c)
    }
    for (let i = 0; i < MAX_PRED_DOTS; i++) {
      const c = new Circle(5.5, { fill: '#ef4444', stroke: 'rgba(255,255,255,0.4)', lineWidth: 1 })
      c.visible = false
      this.predDots.push(c)
      this.predLayer.addChild(c)
    }

    this.spawnFlash = new Circle(14, {
      fill: 'rgba(255,255,255,0.75)',
      visible: false,
      pickable: false,
    })

    field.addInputListener({
      down: (event) => {
        const pt = field.globalToLocalPoint(event.pointer.point)
        this.spawnFlash.centerX = fieldLeft + pt.x
        this.spawnFlash.centerY = fieldTop + pt.y
        this.spawnFlash.visible = true
        this.spawnFlash.opacity = 1
        this.flashLife = 0.35
        if (pt.x < fieldW * 0.5) {
          model.addPrey()
        }
        else {
          model.addPredators()
        }
      },
    })

    this.addChild(fieldShadow)
    this.addChild(field)
    this.addChild(haze)
    this.addChild(groundShadow)
    this.addChild(divider)
    this.addChild(leftHint)
    this.addChild(rightHint)
    this.addChild(this.preyLayer)
    this.addChild(this.predLayer)
    this.addChild(this.spawnFlash)

    // ── Population chart card ──────────────────────────────────────────────
    const chartCard = new DepthCard(fieldW, chartH, {
      title: PredatorPreyStrings.chartTitleStringProperty.value,
    })
    chartCard.left = fieldLeft
    chartCard.top = chartTop
    this.addChild(chartCard)

    const plotLeft = 16
    const plotTop = 36
    const plotW = fieldW - 32
    const plotH = chartH - 48
    this.plotLocal = { left: plotLeft, top: plotTop, width: plotW, height: plotH }

    chartCard.content.addChild(
      new Rectangle(plotLeft, plotTop, plotW, plotH, {
        cornerRadius: 8,
        fill: 'rgba(15,23,42,0.04)',
        stroke: 'rgba(71,85,105,0.15)',
      }),
    )

    this.preyPath = new Path(null, {
      stroke: '#16a34a',
      lineWidth: 2.4,
      lineJoin: 'round',
    })
    this.predPath = new Path(null, {
      stroke: '#dc2626',
      lineWidth: 2.4,
      lineJoin: 'round',
    })
    chartCard.content.addChild(this.preyPath)
    chartCard.content.addChild(this.predPath)

    // ── Right control column ───────────────────────────────────────────────
    const statsCard = new DepthCard(rightW, 96, { title: 'Live populations' })
    statsCard.left = rightLeft
    statsCard.top = fieldTop
    this.addChild(statsCard)

    const preyChip = makeChip(
      PredatorPreyStrings.preyStringProperty.value,
      '#16a34a',
      14,
      38,
      rightW - 28,
    )
    const predChip = makeChip(
      PredatorPreyStrings.predatorsStringProperty.value,
      '#dc2626',
      14,
      38 + 30,
      rightW - 28,
    )
    statsCard.content.addChild(preyChip.node)
    statsCard.content.addChild(predChip.node)
    this.preyStatText = preyChip.value
    this.predStatText = predChip.value

    const modeCard = new DepthCard(rightW, 130, {
      title: PredatorPreyStrings.modeStringProperty.value,
    })
    modeCard.left = rightLeft
    modeCard.top = statsCard.bottom + 12
    this.addChild(modeCard)

    const modes: { mode: InteractionMode; labelKey: 'predation' | 'competition' | 'mutualism' }[] = [
      { mode: 'predation', labelKey: 'predation' },
      { mode: 'competition', labelKey: 'competition' },
      { mode: 'mutualism', labelKey: 'mutualism' },
    ]
    const labels = {
      predation: PredatorPreyStrings.predationStringProperty.value,
      competition: PredatorPreyStrings.competitionStringProperty.value,
      mutualism: PredatorPreyStrings.mutualismStringProperty.value,
    }
    this.modeButtons = modes.map((entry, i) => {
      const button = new SoftButton(labels[entry.labelKey], () => model.setMode(entry.mode), {
        width: rightW - 28,
        height: 28,
        selected: model.modeProperty.value === entry.mode,
        fill: EcologyColors.accent,
      })
      button.left = 14
      button.top = 36 + i * 30
      modeCard.content.addChild(button)
      return { mode: entry.mode, button }
    })
    model.modeProperty.link((mode) => {
      for (const entry of this.modeButtons) {
        entry.button.setSelected(entry.mode === mode)
      }
    })

    const growthCard = new DepthCard(rightW, 72, {})
    growthCard.left = rightLeft
    growthCard.top = modeCard.bottom + 12
    this.addChild(growthCard)
    const growthSlider = new DepthSlider(model.growthProperty, {
      min: 0.4,
      max: 1.8,
      width: rightW - 28,
      label: PredatorPreyStrings.growthStringProperty.value,
      format: (n) => n.toFixed(2),
    })
    growthSlider.left = 14
    growthSlider.top = 14
    growthCard.content.addChild(growthSlider)

    this.playPauseButton = new SoftButton(
      PredatorPreyStrings.pauseStringProperty.value,
      () => {
        model.runningProperty.value = !model.runningProperty.value
      },
      {
        width: rightW,
        height: 36,
        fill: '#0f766e',
      },
    )
    this.playPauseButton.left = rightLeft
    this.playPauseButton.top = growthCard.bottom + 12
    this.addChild(this.playPauseButton)
    model.runningProperty.link((running) => {
      this.playPauseButton.setLabel(
        running
          ? PredatorPreyStrings.pauseStringProperty.value
          : PredatorPreyStrings.playStringProperty.value,
      )
    })

    this.addChild(
      new ResetAllButton({
        listener: () => {
          model.reset()
          this.visualPrey = model.preyProperty.value
          this.visualPred = model.predatorsProperty.value
          this.flashLife = 0
          this.spawnFlash.visible = false
        },
        right: lb.maxX - m,
        bottom: lb.maxY - my,
      }),
    )

    this.visualPrey = model.preyProperty.value
    this.visualPred = model.predatorsProperty.value
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.animTime += dt

    this.visualPrey = damp(this.visualPrey, this.model.preyProperty.value, 8, dt)
    this.visualPred = damp(this.visualPred, this.model.predatorsProperty.value, 8, dt)

    this.preyStatText.string = this.visualPrey.toFixed(1)
    this.predStatText.string = this.visualPred.toFixed(1)

    this.updateDots()
    this.redrawChart()

    if (this.flashLife > 0) {
      this.flashLife -= dt
      this.spawnFlash.opacity = Math.max(0, this.flashLife / 0.35)
      if (this.flashLife <= 0) {
        this.spawnFlash.visible = false
      }
    }
  }

  private updateDots(): void {
    const { left, top, width, height } = this.fieldBounds
    const preyN = Math.min(MAX_PREY_DOTS, Math.round(this.visualPrey))
    const predN = Math.min(MAX_PRED_DOTS, Math.round(this.visualPred))
    const t = this.animTime

    for (let i = 0; i < MAX_PREY_DOTS; i++) {
      const c = this.preyDots[i]
      if (i < preyN) {
        c.visible = true
        c.centerX = left + 12 + ((i * 47 + t * 22) % Math.max(20, width - 24))
        c.centerY = top + 16 + ((i * 31) % Math.max(20, height - 40))
        c.opacity = 0.75 + 0.25 * Math.sin(t * 3 + i)
      }
      else {
        c.visible = false
      }
    }
    for (let i = 0; i < MAX_PRED_DOTS; i++) {
      const c = this.predDots[i]
      if (i < predN) {
        c.visible = true
        c.centerX = left + 12 + ((i * 53 + t * 14) % Math.max(20, width - 24))
        c.centerY = top + 18 + ((i * 41 + 20) % Math.max(20, height - 42))
        c.opacity = 0.8 + 0.2 * Math.sin(t * 2.4 + i * 0.7)
      }
      else {
        c.visible = false
      }
    }
  }

  private redrawChart(): void {
    const plot = this.plotLocal
    const hist = this.model.history
    const preyShape = new Shape()
    const predShape = new Shape()
    if (hist.length > 1) {
      for (let i = 0; i < hist.length; i++) {
        const x = plot.left + (i / Math.max(1, hist.length - 1)) * plot.width
        const preyY = plot.top + plot.height - (hist[i].prey / 120) * (plot.height - 8) - 4
        const predY = plot.top + plot.height - (hist[i].predators / 120) * (plot.height - 8) - 4
        if (i === 0) {
          preyShape.moveTo(x, preyY)
          predShape.moveTo(x, predY)
        }
        else {
          preyShape.lineTo(x, preyY)
          predShape.lineTo(x, predY)
        }
      }
    }
    this.preyPath.shape = preyShape
    this.predPath.shape = predShape
  }
}

function makeChip(
  label: string,
  color: string,
  x: number,
  y: number,
  width: number,
): { node: Node; value: Text } {
  const node = new Node()
  node.addChild(
    new Rectangle(x, y, width, 26, {
      cornerRadius: 8,
      fill: 'rgba(255,255,255,0.72)',
      stroke: 'rgba(71,85,105,0.18)',
    }),
  )
  node.addChild(
    new Circle(5, {
      fill: color,
      left: x + 10,
      centerY: y + 13,
    }),
  )
  node.addChild(
    new Text(label, {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: EcologyColors.muted,
      left: x + 26,
      centerY: y + 13,
    }),
  )
  const value = new Text('0', {
    font: new PhetFont({ size: 13, weight: 'bold' }),
    fill: EcologyColors.ink,
    right: x + width - 10,
    centerY: y + 13,
  })
  node.addChild(value)
  return { node, value }
}
