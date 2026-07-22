import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import {
  Circle,
  DragListener,
  LinearGradient,
  Node,
  Path,
  RadialGradient,
  Rectangle,
  Text,
} from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { EcologyConstants, clamp, damp } from '../../../shared/EcologyConstants.js'
import { EcologyColors } from '../../../shared/EcologyColors.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { DepthSlider } from '../../../shared/ui/DepthSlider.js'
import { SoftButton } from '../../../shared/ui/SoftButton.js'
import { PyramidStrings } from '../PyramidStrings.js'
import {
  formatEnergy,
  PYRAMID_COLORS,
  PYRAMID_LABELS,
  PyramidModel,
} from '../model/PyramidModel.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

type TierVisual = {
  body: Path
  side: Path
  shine: Path
  label: Text
}

/**
 * Ecological pyramid — 10% energy rule with depth, tap select, and drag handle.
 */
export class PyramidScreenView extends ScreenView {
  private readonly model: PyramidModel
  private readonly tiers: TierVisual[] = []
  private readonly energyChip: Text
  private readonly chipBg: Rectangle
  private readonly baseStat: Text
  private readonly topStat: Text
  private readonly handle: Node
  private readonly handleValue: Text
  private visualPulse = 0
  private readonly pyramidArea: { cx: number; top: number; bottom: number; maxHalf: number }

  public constructor(model: PyramidModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const bounds = this.layoutBounds
    const margin = EcologyConstants.SCREEN_VIEW_X_MARGIN
    const controlW = 220

    this.addChild(this.createBackground())

    this.pyramidArea = {
      cx: margin + (bounds.width - controlW - margin * 3) / 2,
      top: EcologyConstants.SCREEN_VIEW_Y_MARGIN + 48,
      bottom: bounds.height - EcologyConstants.SCREEN_VIEW_Y_MARGIN - 56,
      maxHalf: Math.min(210, (bounds.width - controlW - margin * 3) * 0.42),
    }

    const groundShadow = new Circle(this.pyramidArea.maxHalf * 0.95, {
      fill: 'rgba(0,0,0,0.32)',
      centerX: this.pyramidArea.cx,
      centerY: this.pyramidArea.bottom + 6,
    })
    groundShadow.setScaleMagnitude(1.35, 0.22)
    this.addChild(groundShadow)

    const pyramidRoot = new Node()
    this.addChild(pyramidRoot)

    for (let i = 0; i < 4; i++) {
      const body = new Path(null, {
        fill: PYRAMID_COLORS[i],
        stroke: 'rgba(255,255,255,0.35)',
        lineWidth: 1.5,
        cursor: 'pointer',
      })
      const side = new Path(null, {
        fill: 'rgba(0,0,0,0.2)',
        pickable: false,
      })
      const shine = new Path(null, {
        fill: 'rgba(255,255,255,0.18)',
        pickable: false,
      })
      const label = new Text(PYRAMID_LABELS[i], {
        font: new PhetFont({ size: 13, weight: 'bold' }),
        fill: '#ffffff',
        maxWidth: 160,
      })
      body.addInputListener({
        down: () => model.selectTier(i),
      })
      pyramidRoot.addChild(body)
      pyramidRoot.addChild(side)
      pyramidRoot.addChild(shine)
      pyramidRoot.addChild(label)
      this.tiers.push({ body, side, shine, label })
    }

    this.chipBg = new Rectangle(0, 0, 72, 26, {
      cornerRadius: 8,
      fill: 'rgba(15,23,42,0.82)',
      stroke: 'rgba(153,246,228,0.4)',
      lineWidth: 1,
    })
    this.energyChip = new Text('10k', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#fef3c7',
    })
    pyramidRoot.addChild(this.chipBg)
    pyramidRoot.addChild(this.energyChip)

    this.handle = new Node({ cursor: 'ns-resize' })
    this.handle.addChild(
      new Circle(16, {
        fill: 'rgba(15,23,42,0.28)',
        centerX: 2,
        centerY: 3,
      }),
    )
    this.handle.addChild(
      new Circle(14, {
        fill: '#2980b9',
        stroke: '#ffffff',
        lineWidth: 2,
      }),
    )
    this.handle.addChild(
      new Text('Base', {
        font: new PhetFont({ size: 10, weight: 'bold' }),
        fill: '#e2e8f0',
        centerX: 0,
        centerY: -30,
      }),
    )
    this.handleValue = new Text(formatEnergy(model.baseEnergyProperty.value), {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#99f6e4',
      centerX: 0,
      centerY: -16,
    })
    this.handle.addChild(this.handleValue)
    this.addChild(this.handle)

    const trackTop = this.pyramidArea.top + 20
    const trackBottom = this.pyramidArea.bottom - 20
    const handleX = this.pyramidArea.cx + this.pyramidArea.maxHalf + 40

    this.addChild(
      new Rectangle(handleX - 3, trackTop, 6, trackBottom - trackTop, {
        cornerRadius: 3,
        fill: 'rgba(148,163,184,0.35)',
      }),
    )

    this.handle.addInputListener(
      new DragListener({
        drag: event => {
          const y = this.globalToLocalPoint(event.pointer.point).y
          const t = 1 - (y - trackTop) / (trackBottom - trackTop)
          model.setBaseEnergy(1000 + clamp(t, 0, 1) * 49000)
        },
      }),
    )
    this.handle.x = handleX

    const panel = new DepthCard(controlW, 360, { title: 'Energy base' })
    panel.right = bounds.width - margin
    panel.top = EcologyConstants.SCREEN_VIEW_Y_MARGIN
    this.addChild(panel)

    panel.content.addChild(
      new Text(PyramidStrings.ruleTitleStringProperty, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: EcologyColors.accent,
        left: 14,
        top: 38,
        maxWidth: controlW - 28,
      }),
    )
    panel.content.addChild(
      new Text(PyramidStrings.ruleBodyStringProperty, {
        font: new PhetFont(11),
        fill: EcologyColors.muted,
        left: 14,
        top: 58,
        maxWidth: controlW - 28,
      }),
    )

    const slider = new DepthSlider(model.baseEnergyProperty, {
      min: 1000,
      max: 50000,
      width: controlW - 28,
      label: 'Producer energy',
      format: n => formatEnergy(n),
    })
    slider.left = 14
    slider.top = 130
    panel.content.addChild(slider)

    this.baseStat = new Text('Base energy: 10k', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: EcologyColors.ink,
      left: 14,
      top: 195,
      maxWidth: controlW - 28,
    })
    this.topStat = new Text('Top predator: 10', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: EcologyColors.carnivore,
      left: 14,
      top: 218,
      maxWidth: controlW - 28,
    })
    panel.content.addChild(this.baseStat)
    panel.content.addChild(this.topStat)

    const pauseBtn = new SoftButton(
      'Pause pulse',
      () => {
        model.runningProperty.value = !model.runningProperty.value
        pauseBtn.setLabel(model.runningProperty.value ? 'Pause pulse' : 'Play pulse')
      },
      { width: controlW - 28, fill: EcologyColors.accent },
    )
    pauseBtn.left = 14
    pauseBtn.top = 260
    panel.content.addChild(pauseBtn)

    this.addChild(
      new Text(PyramidStrings.tipStringProperty, {
        font: new PhetFont(12),
        fill: 'rgba(226,232,240,0.9)',
        centerX: this.pyramidArea.cx,
        bottom: bounds.maxY - EcologyConstants.SCREEN_VIEW_Y_MARGIN - 6,
        maxWidth: this.pyramidArea.maxHalf * 2.4,
      }),
    )

    this.addChild(
      new ResetAllButton({
        listener: () => model.reset(),
        right: bounds.maxX - margin,
        bottom: bounds.maxY - EcologyConstants.SCREEN_VIEW_Y_MARGIN,
      }),
    )

    model.baseEnergyProperty.link(() => this.layoutPyramid())
    model.selectedTierProperty.link(() => this.layoutPyramid())
    this.layoutPyramid()
  }

  private createBackground(): Node {
    const b = this.layoutBounds
    const layer = new Node()
    const gradient = new LinearGradient(0, 0, 0, b.height)
      .addColorStop(0, '#0e2433')
      .addColorStop(1, '#1a3324')
    layer.addChild(new Rectangle(b.minX, b.minY, b.width, b.height, { fill: gradient }))

    const vignette = new RadialGradient(
      b.centerX,
      b.height * 0.4,
      Math.min(b.width, b.height) * 0.12,
      b.centerX,
      b.centerY,
      Math.max(b.width, b.height) * 0.72,
    )
      .addColorStop(0, 'rgba(255,255,255,0.04)')
      .addColorStop(1, 'rgba(0,0,0,0.24)')
    layer.addChild(new Rectangle(b.minX, b.minY, b.width, b.height, { fill: vignette }))
    return layer
  }

  private layoutPyramid(): void {
    const energies = this.model.tierEnergies
    const selected = this.model.selectedTierProperty.value
    const { cx, top, bottom, maxHalf } = this.pyramidArea
    const h = (bottom - top) / 4

    for (let level = 0; level < 4; level++) {
      const visualRow = 3 - level
      const yy0 = top + visualRow * h
      const yy1 = yy0 + h - 8
      const hwBottom = maxHalf * (0.32 + 0.68 * ((level + 1) / 4))
      const hwTop = maxHalf * (0.32 + 0.68 * (level / 4))

      const bodyShape = new Shape()
        .moveTo(cx - hwBottom, yy1)
        .lineTo(cx + hwBottom, yy1)
        .lineTo(cx + hwTop, yy0)
        .lineTo(cx - hwTop, yy0)
        .close()

      const sideShape = new Shape()
        .moveTo(cx + hwBottom, yy1)
        .lineTo(cx + hwTop, yy0)
        .lineTo(cx + hwTop - 12, yy0)
        .lineTo(cx + hwBottom - 16, yy1)
        .close()

      const shineShape = new Shape()
        .moveTo(cx - hwBottom + 10, yy1 - 5)
        .lineTo(cx + hwBottom - 22, yy1 - 5)
        .lineTo(cx + hwTop - 16, yy0 + 8)
        .lineTo(cx - hwTop + 12, yy0 + 8)
        .close()

      const tier = this.tiers[level]
      tier.body.shape = bodyShape
      tier.side.shape = sideShape
      tier.shine.shape = shineShape
      tier.body.stroke = selected === level ? '#ffffff' : 'rgba(255,255,255,0.35)'
      tier.body.lineWidth = selected === level ? 3 : 1.5
      tier.label.centerX = cx
      tier.label.centerY = (yy0 + yy1) / 2

      if (selected === level) {
        this.energyChip.string = formatEnergy(energies[level])
        this.chipBg.setRectWidth(Math.max(56, this.energyChip.width + 20))
        this.chipBg.left = cx + hwBottom + 8
        this.chipBg.centerY = (yy0 + yy1) / 2
        this.energyChip.center = this.chipBg.center
        this.chipBg.visible = true
        this.energyChip.visible = true
      }
    }

    const t = (this.model.baseEnergyProperty.value - 1000) / 49000
    const trackTop = this.pyramidArea.top + 20
    const trackBottom = this.pyramidArea.bottom - 20
    this.handle.y = trackBottom - clamp(t, 0, 1) * (trackBottom - trackTop)
    this.handleValue.string = formatEnergy(this.model.baseEnergyProperty.value)

    this.baseStat.string = `Base energy: ${formatEnergy(energies[0])}`
    this.topStat.string = `Top predator: ${formatEnergy(energies[3])}`
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.visualPulse = damp(this.visualPulse, this.model.pulseProperty.value, 6, dt)
    const pulse = 0.88 + 0.1 * Math.sin(this.visualPulse * 2.4)
    const selected = this.model.selectedTierProperty.value
    for (let i = 0; i < 4; i++) {
      const opacity = i === selected ? 1 : pulse
      this.tiers[i].body.opacity = opacity
      this.tiers[i].side.opacity = opacity
      this.tiers[i].shine.opacity = i === selected ? 0.35 : 0.16
    }
  }
}
