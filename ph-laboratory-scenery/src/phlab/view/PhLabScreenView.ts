import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Rectangle, Text, Node } from 'scenerystack/scenery'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { PhLabModel } from '../model/PhLabModel.js'
import { PhLabControlPanel } from './PhLabControlPanel.js'
import { GuidePanel } from './GuidePanel.js'
import { PhScaleNode } from './PhScaleNode.js'
import { PhLabConstants } from '../../common/PhLabConstants.js'
import { BeakerNode, PourStreamNode, BEAKER_PIVOT_FRAC_Y } from './BeakerNode.js'
import { reagentColor } from '../model/PhLabModel.js'
import { getGuideStep } from '../model/PhLabGuide.js'
import { computePhLabLayout, spacedCenters } from './PhLabLayout.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

export class PhLabScreenView extends ScreenView {
  private readonly model: PhLabModel
  private readonly layoutRegions: ReturnType<typeof computePhLabLayout>
  private readonly mainBeaker: BeakerNode
  private readonly acidBeaker: BeakerNode
  private readonly baseBeaker: BeakerNode
  private readonly waterBeaker: BeakerNode
  private readonly stream: PourStreamNode
  private readonly ripple: Rectangle
  private readonly litmusGroup: Node
  private readonly litmus: Rectangle
  private readonly litmusLabel: Text
  private readonly litmusHomeY: number
  private readonly meterHighlight: Rectangle
  private readonly litmusHighlight: Rectangle
  private readonly meterBg: Rectangle
  private readonly phScale: PhScaleNode
  private readonly acidHome: { x: number; y: number; rotation: number }
  private readonly baseHome: { x: number; y: number; rotation: number }
  private readonly waterHome: { x: number; y: number; rotation: number }
  private pulseTime = 0

  public constructor(model: PhLabModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    this.layoutRegions = computePhLabLayout(this.layoutBounds)

    const { center, status, guide, controls, bench, meter, litmus, reagentY, mainBeaker, scaleY } =
      this.layoutRegions

    // ── Status bar (full width) ─────────────────────────────────────────────
    const statusBg = new Rectangle(status.left, status.top, status.width, status.height, {
      cornerRadius: 12,
      fill: 'rgba(15, 23, 42, 0.92)',
    })
    const statusText = new Text(model.statusProperty, {
      font: new PhetFont(14),
      fill: '#ecfeff',
      maxWidth: status.width - 36,
      centerX: status.left + status.width / 2,
      centerY: status.top + status.height / 2,
    })
    this.addChild(statusBg)
    this.addChild(statusText)

    // ── Left column: guided steps ───────────────────────────────────────────
    this.addChild(
      new GuidePanel(model, {
        left: guide.left,
        top: guide.top,
        maxWidth: guide.width,
      }),
    )

    // ── Right column: controls ──────────────────────────────────────────────
    this.addChild(
      new PhLabControlPanel(model, {
        right: controls.right,
        top: controls.top,
        maxWidth: controls.width,
      }),
    )

    // ── Center: lab bench (layered for depth) ───────────────────────────────
    const benchShadow = new Rectangle(bench.left + 3, bench.top + 6, bench.width, bench.height, {
      cornerRadius: 14,
      fill: 'rgba(15, 23, 42, 0.1)',
    })
    const benchNode = new Rectangle(bench.left, bench.top, bench.width, bench.height, {
      cornerRadius: 14,
      fill: 'rgba(248, 250, 252, 0.55)',
      stroke: 'rgba(148, 163, 184, 0.45)',
      lineWidth: 1,
    })
    const benchFront = new Rectangle(bench.left + 8, bench.top + bench.height - 10, bench.width - 16, 8, {
      cornerRadius: 4,
      fill: 'rgba(15, 23, 42, 0.06)',
    })
    this.addChild(benchShadow)
    this.addChild(benchNode)
    this.addChild(benchFront)

    const reagentsLabel = new Text('Reagents — tap to pour', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#475569',
      centerX: center.centerX,
      top: this.layoutRegions.contentTop + 40,
    })
    this.addChild(reagentsLabel)

    // Reagent beakers — evenly spaced row (above mix beaker)
    const [acidX, waterX, baseX] = spacedCenters(center.left, center.width, 3)

    this.acidBeaker = new BeakerNode({
      width: 86,
      height: 116,
      label: 'HCl (acid)',
      liquidColor: reagentColor('acid'),
      interactive: true,
      onPress: () => model.pour('acid'),
    })
    this.acidBeaker.setLiquidLevel(0.7, reagentColor('acid'))
    this.acidHome = { x: acidX, y: reagentY, rotation: 0 }
    this.acidBeaker.placeAtCenter(this.acidHome.x, this.acidHome.y)

    this.waterBeaker = new BeakerNode({
      width: 76,
      height: 106,
      label: 'H₂O',
      liquidColor: reagentColor('water'),
      interactive: true,
      onPress: () => model.pour('water'),
    })
    this.waterBeaker.setLiquidLevel(0.65, reagentColor('water'))
    this.waterHome = { x: waterX, y: reagentY + 6, rotation: 0 }
    this.waterBeaker.placeAtCenter(this.waterHome.x, this.waterHome.y)

    this.baseBeaker = new BeakerNode({
      width: 86,
      height: 116,
      label: 'NaOH (base)',
      liquidColor: reagentColor('base'),
      interactive: true,
      onPress: () => model.pour('base'),
    })
    this.baseBeaker.setLiquidLevel(0.7, reagentColor('base'))
    this.baseHome = { x: baseX, y: reagentY, rotation: 0 }
    this.baseBeaker.placeAtCenter(this.baseHome.x, this.baseHome.y)

    // Main mixing beaker — centered in workspace with clear gap below reagents
    this.mainBeaker = new BeakerNode({
      width: mainBeaker.width,
      height: mainBeaker.height,
      label: 'Mix beaker',
    })
    this.mainBeaker.placeAtCenter(mainBeaker.centerX, mainBeaker.centerY)

    this.ripple = new Rectangle(0, 0, 40, 8, {
      cornerRadius: 4,
      fill: 'rgba(255,255,255,0.45)',
      visible: false,
    })
    this.ripple.centerX = this.mainBeaker.centerX
    this.ripple.centerY = this.mainBeaker.centerY + 40

    this.stream = new PourStreamNode()

    // ── Center instruments (meter + litmus) — inside workspace, not over controls ──
    const instrumentsLabel = new Text('Instruments', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#475569',
      left: meter.left,
      top: meter.top - 18,
    })
    this.addChild(instrumentsLabel)

    this.litmus = new Rectangle(0, 0, litmus.width, litmus.height, {
      cornerRadius: 4,
      fill: model.litmusColorProperty.value,
      stroke: '#94a3b8',
      lineWidth: 1.5,
      cursor: 'pointer',
    })
    this.litmus.left = litmus.left
    this.litmus.top = litmus.top
    this.litmusHomeY = litmus.top

    this.litmusHighlight = new Rectangle(-6, -6, litmus.width + 12, litmus.height + 12, {
      cornerRadius: 8,
      stroke: '#2dd4bf',
      lineWidth: 3,
      visible: false,
    })

    this.litmusLabel = new Text('Litmus paper', {
      font: new PhetFont({ size: 9, weight: 'bold' }),
      fill: '#475569',
      maxWidth: 56,
    })
    this.syncLitmusLabels()

    model.litmusColorProperty.link((c) => {
      this.litmus.fill = c
    })
    this.litmus.addInputListener({
      down: () => model.dipLitmus(),
    })

    this.litmusGroup = new Node({
      children: [this.litmusHighlight, this.litmus, this.litmusLabel],
    })
    this.syncLitmusHighlight()

    this.meterBg = new Rectangle(0, 0, meter.width, meter.height, {
      cornerRadius: 12,
      fill: '#0f172a',
      stroke: '#2dd4bf',
      lineWidth: 2,
      cursor: 'pointer',
    })
    this.meterBg.left = meter.left
    this.meterBg.top = meter.top
    this.meterBg.addInputListener({
      down: () => model.noticeMeter(),
    })

    this.meterHighlight = new Rectangle(-6, -6, meter.width + 12, meter.height + 12, {
      cornerRadius: 14,
      stroke: '#2dd4bf',
      lineWidth: 3,
      visible: false,
    })
    this.meterHighlight.left = this.meterBg.left - 6
    this.meterHighlight.top = this.meterBg.top - 6

    const meterTitle = new Text('DIGITAL pH', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#94a3b8',
      left: this.meterBg.left + 12,
      top: this.meterBg.top + 10,
    })
    const phValue = new Text('—', {
      font: new PhetFont({ size: 32, weight: 'bold' }),
      fill: '#5eead4',
      left: this.meterBg.left + 12,
      top: this.meterBg.top + 28,
    })
    const categoryValue = new Text('Empty', {
      font: new PhetFont(13),
      fill: '#e2e8f0',
      left: this.meterBg.left + 12,
      top: this.meterBg.top + 70,
    })
    const volumeText = new Text('0 mL', {
      font: new PhetFont(12),
      fill: '#94a3b8',
      left: this.meterBg.left + 88,
      top: this.meterBg.top + 70,
    })

    const updateMeter = () => {
      const vol = model.volumeProperty.value
      phValue.string = vol < 0.5 ? '—' : model.phProperty.value.toFixed(1)
      const cat = model.categoryProperty.value
      categoryValue.string =
        cat === 'empty' ? 'Empty' : cat === 'acid' ? 'Acidic' : cat === 'base' ? 'Basic' : 'Neutral'
      volumeText.string = `${vol.toFixed(0)} mL`
    }
    model.phProperty.link(updateMeter)
    model.categoryProperty.link(updateMeter)
    model.volumeProperty.link(updateMeter)

    const updateMainLiquid = () => {
      this.mainBeaker.setLiquidLevel(model.volumeProperty.value / 100, model.liquidColorProperty.value)
    }
    model.volumeProperty.link(updateMainLiquid)
    model.liquidColorProperty.link(updateMainLiquid)

    // pH scale — centered under mix beaker, width matches center column
    const scaleWidth = Math.min(360, center.width - 16)
    this.phScale = new PhScaleNode(scaleWidth)
    this.phScale.centerX = center.centerX
    this.phScale.top = scaleY
    this.phScale.cursor = 'pointer'
    this.phScale.addInputListener({
      down: () => model.noticeScale(),
    })

    const updateScale = () => {
      this.phScale.setPh(model.phProperty.value, model.volumeProperty.value >= 0.5)
    }
    model.phProperty.link(updateScale)
    model.volumeProperty.link(updateScale)

    model.guideIdProperty.link(() => this.updateGuideHighlights())

    const stage = new Node({
      children: [
        this.waterBeaker,
        this.baseBeaker,
        this.acidBeaker,
        this.mainBeaker,
        this.ripple,
        this.stream,
        this.litmusGroup,
        this.meterHighlight,
        this.meterBg,
        meterTitle,
        phValue,
        categoryValue,
        volumeText,
        this.phScale,
      ],
    })
    this.addChild(stage)

    this.addChild(
      new ResetAllButton({
        listener: () => {
          model.reset()
          this.reset()
        },
        right: controls.right,
        bottom: this.layoutBounds.maxY - PhLabConstants.SCREEN_VIEW_Y_MARGIN,
      }),
    )

    this.updateGuideHighlights()
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.pulseTime += dt
    this.updatePourAnimation()
    this.updateLitmusAnimation()
    this.updateGuideHighlights()
  }

  private syncLitmusLabels(): void {
    this.litmusLabel.left = this.litmus.left - 4
    this.litmusLabel.top = this.litmus.bottom + 10
  }

  private syncLitmusHighlight(): void {
    this.litmusHighlight.left = this.litmus.left - 6
    this.litmusHighlight.top = this.litmus.top - 6
    this.syncLitmusLabels()
  }

  private updateGuideHighlights(): void {
    const target = getGuideStep(this.model.guideIdProperty.value).target
    const pulse = 0.55 + 0.45 * Math.sin(this.pulseTime * 4)

    this.acidBeaker.setHighlight(target === 'acid')
    this.baseBeaker.setHighlight(target === 'base')
    this.mainBeaker.setHighlight(target === 'beaker')

    this.litmusHighlight.visible = target === 'litmus'
    this.litmusHighlight.opacity = pulse
    this.syncLitmusHighlight()

    this.meterHighlight.visible = target === 'meter'
    this.meterHighlight.opacity = pulse

    this.phScale.setHighlight(target === 'scale')
  }

  private updateLitmusAnimation(): void {
    const dipping = this.model.isDippingProperty.value
    const p = this.model.litmusDipProgressProperty.value
    const wet = this.model.litmusWetProperty.value

    let dipY = 0
    if (dipping) {
      if (p < 0.45) {
        dipY = (p / 0.45) * 42
      } else if (p < 0.65) {
        dipY = 42
      } else {
        dipY = 42 - ((p - 0.65) / 0.35) * 20
      }
    } else if (wet) {
      dipY = 22
    }

    this.litmus.top = this.litmusHomeY + dipY
    this.syncLitmusHighlight()
  }

  private updatePourAnimation(): void {
    const pouring = this.model.isPouringProperty.value
    const kind = this.model.pourKindProperty.value
    const p = this.model.pourProgressProperty.value
    const color = this.model.pourColorProperty.value

    const resetBeaker = (
      node: BeakerNode,
      home: { x: number; y: number; rotation: number },
    ) => {
      node.placeAtCenter(home.x, home.y)
      node.rotation = home.rotation
    }

    const homePivot = (home: { x: number; y: number }, h: number) => ({
      x: home.x,
      y: home.y + h * (BEAKER_PIVOT_FRAC_Y - 0.5),
    })

    if (!pouring || !kind) {
      if (!this.model.isDippingProperty.value) {
        resetBeaker(this.acidBeaker, this.acidHome)
        resetBeaker(this.baseBeaker, this.baseHome)
        resetBeaker(this.waterBeaker, this.waterHome)
      }
      this.stream.visible = false
      const ripple = this.model.mixRippleProperty.value
      this.ripple.visible = ripple > 0.05
      if (this.ripple.visible) {
        this.ripple.opacity = ripple
        this.ripple.setRectWidth(30 + (1 - ripple) * 70)
        this.ripple.centerX = this.mainBeaker.centerX
        this.ripple.centerY = this.mainBeaker.centerY + 20
        this.ripple.fill = this.model.liquidColorProperty.value
      }
      return
    }

    const active =
      kind === 'acid' ? this.acidBeaker : kind === 'base' ? this.baseBeaker : this.waterBeaker
    const home = kind === 'acid' ? this.acidHome : kind === 'base' ? this.baseHome : this.waterHome
    const pairs: Array<[BeakerNode, { x: number; y: number; rotation: number }]> = [
      [this.acidBeaker, this.acidHome],
      [this.baseBeaker, this.baseHome],
      [this.waterBeaker, this.waterHome],
    ]
    pairs.forEach(([node, h]) => {
      if (node !== active) resetBeaker(node, h)
    })

    const tilt = Math.min(1, p / 0.35) * (-Math.PI / 3.1)
    const lift = Math.min(1, p / 0.35)
    const h = active.beakerHeight
    const start = homePivot(home, h)
    const rim = this.mainBeaker.getRimTarget()
    const towardX = rim.x - active.beakerWidth * 0.42
    const towardY = rim.y + h * 0.12
    active.setPivot(
      start.x + (towardX - start.x) * lift,
      start.y + (towardY - start.y) * lift * 0.65,
    )
    active.rotation = tilt

    const lip = active.getPourLip()
    this.stream.update(true, p, color, lip.x, lip.y, rim.x, rim.y)

    const ripple = this.model.mixRippleProperty.value
    this.ripple.visible = ripple > 0.05
    if (this.ripple.visible) {
      this.ripple.opacity = Math.min(1, ripple)
      this.ripple.setRectWidth(36 + (1 - ripple) * 90)
      this.ripple.centerX = this.mainBeaker.centerX
      this.ripple.centerY = this.mainBeaker.centerY + 18
      this.ripple.fill = color
    }
  }

  public reset(): void {
    this.acidBeaker.placeAtCenter(this.acidHome.x, this.acidHome.y)
    this.acidBeaker.rotation = 0
    this.baseBeaker.placeAtCenter(this.baseHome.x, this.baseHome.y)
    this.baseBeaker.rotation = 0
    this.waterBeaker.placeAtCenter(this.waterHome.x, this.waterHome.y)
    this.waterBeaker.rotation = 0
    this.stream.visible = false
    this.ripple.visible = false
    this.litmus.top = this.litmusHomeY
    this.syncLitmusHighlight()
    this.updateGuideHighlights()
  }
}
