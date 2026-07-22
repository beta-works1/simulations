import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import {
  DragListener,
  LinearGradient,
  Node,
  Path,
  Rectangle,
  Text,
} from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { EcologyConstants, damp } from '../../../shared/EcologyConstants.js'
import { EcologyColors } from '../../../shared/EcologyColors.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { DepthSlider } from '../../../shared/ui/DepthSlider.js'
import { SoftButton } from '../../../shared/ui/SoftButton.js'
import {
  formatEnergy,
  PYRAMID_COLORS,
  PYRAMID_LABELS,
  PyramidModel,
} from '../model/PyramidModel.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

/**
 * Ecological pyramid — 10% energy rule with depth, tap select, and drag handle.
 */
export class PyramidScreenView extends ScreenView {
  private readonly model: PyramidModel
  private readonly tierNodes: Path[] = []
  private readonly tierLabels: Text[] = []
  private readonly energyChip: Text
  private readonly chipBg: Rectangle
  private readonly baseStat: Text
  private readonly topStat: Text
  private readonly handle: Node
  private readonly pyramidRoot: Node
  private visualPulse = 0
  private readonly pyramidArea: { cx: number; top: number; bottom: number; maxHalf: number }

  public constructor(model: PyramidModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const bounds = this.layoutBounds
    const margin = EcologyConstants.SCREEN_VIEW_X_MARGIN
    const controlW = 220

    this.addChild(this.createBackground())

    const title = new Text('Ecological Pyramid', {
      font: new PhetFont({ size: 18, weight: 'bold' }),
      fill: EcologyColors.ink,
      left: margin + 8,
      top: EcologyConstants.SCREEN_VIEW_Y_MARGIN,
    })
    this.addChild(title)
    this.addChild(
      new Text('Tap a tier · drag the handle to change producer energy', {
        font: new PhetFont(12),
        fill: EcologyColors.muted,
        left: title.left,
        top: title.bottom + 4,
      }),
    )

    this.pyramidArea = {
      cx: margin + (bounds.width - controlW - margin * 3) / 2,
      top: EcologyConstants.SCREEN_VIEW_Y_MARGIN + 56,
      bottom: bounds.height - EcologyConstants.SCREEN_VIEW_Y_MARGIN - 70,
      maxHalf: Math.min(210, (bounds.width - controlW - margin * 3) * 0.42),
    }

    // Ground shadow under pyramid
    this.addChild(
      new Rectangle(
        this.pyramidArea.cx - this.pyramidArea.maxHalf - 10,
        this.pyramidArea.bottom - 8,
        this.pyramidArea.maxHalf * 2 + 20,
        18,
        {
          cornerRadius: 10,
          fill: 'rgba(15, 23, 42, 0.14)',
        },
      ),
    )

    this.pyramidRoot = new Node()
    this.addChild(this.pyramidRoot)

    for (let i = 0; i < 4; i++) {
      const path = new Path(null, {
        fill: PYRAMID_COLORS[i],
        stroke: 'rgba(15,23,42,0.25)',
        lineWidth: 1.5,
        cursor: 'pointer',
      })
      const label = new Text(PYRAMID_LABELS[i], {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: '#fff',
        maxWidth: 140,
      })
      path.addInputListener({
        down: () => model.selectTier(i),
      })
      this.tierNodes.push(path)
      this.tierLabels.push(label)
      this.pyramidRoot.addChild(path)
      this.pyramidRoot.addChild(label)
    }

    this.chipBg = new Rectangle(0, 0, 88, 28, {
      cornerRadius: 8,
      fill: 'rgba(15,23,42,0.82)',
      stroke: 'rgba(255,255,255,0.2)',
      lineWidth: 1,
    })
    this.energyChip = new Text('10k', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#fef3c7',
    })
    this.pyramidRoot.addChild(this.chipBg)
    this.pyramidRoot.addChild(this.energyChip)

    // Drag handle for base energy
    this.handle = new Node({ cursor: 'ns-resize' })
    this.handle.addChild(
      new Rectangle(-14, -18, 28, 36, {
        cornerRadius: 8,
        fill: 'rgba(15,23,42,0.16)',
      }),
    )
    this.handle.addChild(
      new Rectangle(-12, -16, 24, 32, {
        cornerRadius: 8,
        fill: '#38bdf8',
        stroke: '#fff',
        lineWidth: 2,
      }),
    )
    this.handle.addChild(
      new Text('↕', {
        font: new PhetFont({ size: 14, weight: 'bold' }),
        fill: '#0f172a',
        centerX: 0,
        centerY: 0,
      }),
    )
    this.addChild(this.handle)

    const trackTop = this.pyramidArea.top + 20
    const trackBottom = this.pyramidArea.bottom - 20
    const handleX = this.pyramidArea.cx + this.pyramidArea.maxHalf + 36

    this.handle.addInputListener(
      new DragListener({
        drag: event => {
          const y = this.globalToLocalPoint(event.pointer.point).y
          const t = 1 - (y - trackTop) / (trackBottom - trackTop)
          model.setBaseEnergy(1000 + clamp01(t) * 49000)
        },
      }),
    )

    // Side panel
    const panel = new DepthCard(controlW, bounds.height - EcologyConstants.SCREEN_VIEW_Y_MARGIN * 2 - 8, {
      title: '10% energy rule',
    })
    panel.right = bounds.width - margin
    panel.top = EcologyConstants.SCREEN_VIEW_Y_MARGIN
    this.addChild(panel)

    panel.content.addChild(
      new Text('Only about 10% of energy moves up each trophic level. The rest is used or lost as heat.', {
        font: new PhetFont(11),
        fill: EcologyColors.muted,
        left: 14,
        top: 36,
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
    slider.top = 110
    panel.content.addChild(slider)

    this.baseStat = new Text('Base: 10k', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: EcologyColors.ink,
      left: 14,
      top: 175,
    })
    this.topStat = new Text('Top: 10', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: EcologyColors.danger,
      left: 14,
      top: 198,
    })
    panel.content.addChild(this.baseStat)
    panel.content.addChild(this.topStat)

    const pauseBtn = new SoftButton('Pause', () => {
      model.runningProperty.value = !model.runningProperty.value
      pauseBtn.setLabel(model.runningProperty.value ? 'Pause' : 'Play')
    }, { width: controlW - 28, fill: '#0f766e' })
    pauseBtn.left = 14
    pauseBtn.top = 240
    panel.content.addChild(pauseBtn)

    this.addChild(
      new ResetAllButton({
        listener: () => model.reset(),
        right: bounds.maxX - EcologyConstants.SCREEN_VIEW_X_MARGIN,
        bottom: bounds.maxY - EcologyConstants.SCREEN_VIEW_Y_MARGIN,
      }),
    )

    // Keep handle X fixed; Y updated in layoutPyramid
    this.handle.x = handleX

    model.baseEnergyProperty.link(() => this.layoutPyramid())
    model.selectedTierProperty.link(() => this.layoutPyramid())
    this.layoutPyramid()
  }

  private createBackground(): Node {
    const b = this.layoutBounds
    const g = new LinearGradient(0, 0, 0, b.height)
      .addColorStop(0, '#dbeafe')
      .addColorStop(0.45, '#e8f5e9')
      .addColorStop(1, '#c8e6c9')
    return new Rectangle(b.minX, b.minY, b.width, b.height, { fill: g })
  }

  private layoutPyramid(): void {
    const energies = this.model.tierEnergies
    const selected = this.model.selectedTierProperty.value
    const { cx, top, bottom, maxHalf } = this.pyramidArea
    const h = (bottom - top) / 4

    for (let i = 0; i < 4; i++) {
      const level = i // 0 producers at bottom
      const visualRow = 3 - level
      const yy0 = top + visualRow * h
      const yy1 = yy0 + h - 6
      const hw0 = maxHalf * (0.28 + 0.72 * ((level + 1) / 4))
      const hw1 = maxHalf * (0.28 + 0.72 * (level / 4))

      const shape = new Shape()
        .moveTo(cx - hw0, yy1)
        .lineTo(cx + hw0, yy1)
        .lineTo(cx + hw1, yy0)
        .lineTo(cx - hw1, yy0)
        .close()
      this.tierNodes[level].shape = shape
      this.tierNodes[level].opacity = selected === level ? 1 : 0.88
      this.tierNodes[level].stroke = selected === level ? '#0f172a' : 'rgba(15,23,42,0.25)'
      this.tierNodes[level].lineWidth = selected === level ? 3 : 1.5

      this.tierLabels[level].centerX = cx
      this.tierLabels[level].centerY = (yy0 + yy1) / 2
      this.tierLabels[level].string = PYRAMID_LABELS[level]

      if (selected === level) {
        this.energyChip.string = formatEnergy(energies[level])
        this.chipBg.centerX = cx + hw0 * 0.55 + 36
        this.chipBg.centerY = (yy0 + yy1) / 2
        this.energyChip.center = this.chipBg.center
        this.chipBg.visible = true
        this.energyChip.visible = true
      }
    }

    const t = (this.model.baseEnergyProperty.value - 1000) / 49000
    const trackTop = this.pyramidArea.top + 20
    const trackBottom = this.pyramidArea.bottom - 20
    this.handle.y = trackBottom - t * (trackBottom - trackTop)

    this.baseStat.string = `Base: ${formatEnergy(energies[0])}`
    this.topStat.string = `Top predator: ${formatEnergy(energies[3])}`
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.visualPulse = damp(this.visualPulse, this.model.pulseProperty.value, 6, dt)
    const pulse = 0.92 + 0.08 * Math.sin(this.visualPulse * 2.4)
    for (let i = 0; i < 4; i++) {
      if (i !== this.model.selectedTierProperty.value) {
        this.tierNodes[i].opacity = pulse
      }
    }
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}
