import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { AcidsPhScaleModel } from '../model/AcidsPhScaleModel.js'
import { AcidsConstants, clamp } from '../../../shared/AcidsConstants.js'
import { AcidsColors } from '../../../shared/AcidsColors.js'
import { AcidsSounds } from '../../../shared/AcidsSounds.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { DepthSlider } from '../../../shared/ui/DepthSlider.js'
import { SoftButton } from '../../../shared/ui/SoftButton.js'
import { StageBackdrop } from '../../../shared/ui/StageBackdrop.js'
import { GuidanceBanner } from '../../../shared/ui/GuidanceBanner.js'
import { ParticleBurst } from '../../../shared/ui/ParticleBurst.js'
import { createPanelTip } from '../../../shared/ui/createPanelTip.js'
import { controlHint, controlSection } from '../../../shared/ui/controlPanelBits.js'
import { ScrollableNode } from '../../../shared/ui/ScrollableNode.js'
import { TeachingTriad } from '../../../shared/ui/TeachingTriad.js'
import { MiniQuiz } from '../../../shared/ui/MiniQuiz.js'
import { PH_RANGE, SUBSTANCES, phLabel, phToColor } from '../../../shared/phScaleModel.js'
import { AcidsPhScaleStrings } from '../AcidsPhScaleStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

function buildPhGradientBar(x: number, y: number, w: number, h: number): Node {
  const steps = 140
  const node = new Node({ pickable: false })
  const stepW = w / steps
  for (let i = 0; i < steps; i++) {
    const ph = (i / (steps - 1)) * 14
    node.addChild(
      new Rectangle(x + i * stepW, y, stepW + 0.6, h, {
        fill: phToColor(ph),
      }),
    )
  }
  return node
}

function buildBeakerShape(w: number, h: number): Shape {
  const shoulder = 12
  return new Shape()
    .moveTo(-w / 2, -h / 2)
    .lineTo(-w / 2, h / 2 - shoulder)
    .quadraticCurveTo(-w / 2, h / 2, -w / 2 + shoulder, h / 2)
    .lineTo(w / 2 - shoulder, h / 2)
    .quadraticCurveTo(w / 2, h / 2, w / 2, h / 2 - shoulder)
    .lineTo(w / 2, -h / 2)
}

function labelFor(ph: number): string {
  const l = phLabel(ph)
  if (l === 'Acidic') return AcidsPhScaleStrings.acidicWordStringProperty.value
  if (l === 'Basic (alkaline)') return AcidsPhScaleStrings.basicWordStringProperty.value
  return AcidsPhScaleStrings.neutralWordStringProperty.value
}

function colorForLabel(ph: number): string {
  const l = phLabel(ph)
  if (l === 'Acidic') return '#dc2626'
  if (l === 'Basic (alkaline)') return '#5b21b6'
  return '#16a34a'
}

export class AcidsPhScaleScreenView extends ScreenView {
  private readonly model: AcidsPhScaleModel
  private readonly sounds: AcidsSounds
  private readonly particles: ParticleBurst
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly leftTip: RichText
  private readonly miniQuiz: MiniQuiz

  private readonly scaleX: number
  private readonly scaleWidth: number
  private readonly beakerCenterX: number
  private readonly beakerCenterY: number

  private readonly markerNode: Node
  private readonly liquidRect: Rectangle
  private readonly indicatorGroup: Node
  private readonly indicatorRect: Rectangle
  private readonly meterGroup: Node
  private readonly meterScreenText: Text
  private readonly substanceNameText: Text
  private readonly phLabelBadgeBg: Rectangle
  private readonly phLabelBadgeText: Text
  private readonly numericPhText: Text
  private readonly labelNodes: Node[] = []

  private readonly exploreBtn: SoftButton
  private readonly strongAcidBtn: SoftButton
  private readonly neutralBtn: SoftButton
  private readonly strongBaseBtn: SoftButton
  private readonly substanceButtons: { id: string; btn: SoftButton }[] = []
  private readonly labelsBtn: SoftButton
  private readonly indicatorBtn: SoftButton
  private readonly meterBtn: SoftButton
  private readonly runningBtn: SoftButton
  private readonly soundBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: Text

  public constructor(model: AcidsPhScaleModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const sounds = new AcidsSounds()
    this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })

    const m = AcidsConstants.SCREEN_VIEW_X_MARGIN
    const my = AcidsConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    const leftW = 190
    const rightW = 280
    const gap = 14
    const stageLeft = m + leftW + gap
    const stageTop = my + 78
    const stageW = lb.width - m * 2 - leftW - gap - rightW - gap
    const stageH = lb.height - my * 2 - 78

    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: AcidsPhScaleStrings.guideTitleStringProperty.value,
      body: AcidsPhScaleStrings.guideExploreStringProperty.value,
    })
    this.guide.left = m
    this.guide.top = my
    this.addChild(this.guide)

    // ── Left column: teaching triad + static tip ──────────────────────────────
    const leftCard = new DepthCard(leftW, stageH)
    leftCard.left = m
    leftCard.top = stageTop
    this.addChild(leftCard)

    this.teachingTriad = new TeachingTriad(leftW - 24)
    this.teachingTriad.left = 12
    this.teachingTriad.top = 12
    leftCard.content.addChild(this.teachingTriad)

    this.leftTip = createPanelTip(AcidsPhScaleStrings.leftTipStringProperty.value, {
      width: leftW - 24,
      fontSize: 11,
      fill: AcidsColors.muted,
    })
    this.leftTip.left = 12
    leftCard.content.addChild(this.leftTip)
    this.repositionLeftTip()

    // ── Stage ──────────────────────────────────────────────────────────────────
    this.addChild(new StageBackdrop(stageLeft, stageTop, stageW, stageH, { top: '#cbd9ec', bottom: '#f4f8fb' }))

    this.scaleX = stageLeft + 30
    this.scaleWidth = stageW - 60
    const scaleY = stageTop + 46
    const scaleHeight = 40

    const barClip = new Node({
      clipArea: Shape.roundRect(this.scaleX, scaleY, this.scaleWidth, scaleHeight, 8, 8),
    })
    barClip.addChild(buildPhGradientBar(this.scaleX, scaleY, this.scaleWidth, scaleHeight))
    this.addChild(barClip)
    this.addChild(
      new Rectangle(this.scaleX, scaleY, this.scaleWidth, scaleHeight, {
        cornerRadius: 8,
        stroke: 'rgba(15,23,42,0.35)',
        lineWidth: 2,
        pickable: false,
      }),
    )

    for (let i = 0; i <= 14; i++) {
      const tx = this.scaleX + (i / 14) * this.scaleWidth
      this.addChild(
        new Rectangle(tx - 0.75, scaleY + scaleHeight, 1.5, 6, {
          fill: 'rgba(15,23,42,0.45)',
          pickable: false,
        }),
      )
      if (i % 2 === 0) {
        const label = new Text(String(i), {
          font: new PhetFont({ size: 10, weight: 'bold' }),
          fill: AcidsColors.ink,
          centerX: tx,
          top: scaleY + scaleHeight + 8,
          pickable: false,
        })
        this.labelNodes.push(label)
        this.addChild(label)
      }
    }

    const legendY = scaleY + scaleHeight + 24
    const acidLegend = new Text(AcidsPhScaleStrings.acidicWordStringProperty.value, {
      font: new PhetFont({ size: 10, weight: 'bold' }),
      fill: '#dc2626',
      left: this.scaleX,
      top: legendY,
      pickable: false,
    })
    const neutralLegend = new Text(AcidsPhScaleStrings.neutralWordStringProperty.value, {
      font: new PhetFont({ size: 10, weight: 'bold' }),
      fill: '#16a34a',
      centerX: this.scaleX + (7 / 14) * this.scaleWidth,
      top: legendY,
      pickable: false,
    })
    const basicLegend = new Text(AcidsPhScaleStrings.basicWordStringProperty.value, {
      font: new PhetFont({ size: 10, weight: 'bold' }),
      fill: '#5b21b6',
      right: this.scaleX + this.scaleWidth,
      top: legendY,
      pickable: false,
    })
    this.labelNodes.push(acidLegend, neutralLegend, basicLegend)
    this.addChild(acidLegend)
    this.addChild(neutralLegend)
    this.addChild(basicLegend)

    // Marker: arrow + stem tracking displayPh along the bar.
    const markerShape = new Shape().moveTo(-7, -12).lineTo(7, -12).lineTo(0, 0).close()
    const markerTriangle = new Path(markerShape, {
      fill: AcidsColors.ink,
      stroke: '#fff',
      lineWidth: 1,
    })
    const markerStem = new Rectangle(-1.5, 0, 3, scaleHeight, {
      fill: 'rgba(255,255,255,0.9)',
      stroke: 'rgba(15,23,42,0.45)',
      lineWidth: 1,
    })
    this.markerNode = new Node({ children: [markerStem, markerTriangle], y: scaleY, pickable: false })
    this.addChild(this.markerNode)

    // ── Beaker ───────────────────────────────────────────────────────────────
    const beakerW = 100
    const beakerH = 130
    this.beakerCenterX = stageLeft + 112
    this.beakerCenterY = stageTop + stageH * 0.62
    const beakerShape = buildBeakerShape(beakerW, beakerH)

    const liquidClip = new Node({ clipArea: beakerShape })
    const liquidTopY = -beakerH / 2 + 22
    this.liquidRect = new Rectangle(
      -beakerW / 2 - 2,
      liquidTopY,
      beakerW + 4,
      beakerH / 2 - liquidTopY + beakerH / 2 + 6,
      { fill: '#c8dcff' },
    )
    liquidClip.addChild(this.liquidRect)
    liquidClip.addChild(
      new Rectangle(-beakerW / 2, liquidTopY - 1.5, beakerW, 3, { fill: 'rgba(255,255,255,0.55)' }),
    )

    const beakerGlass = new Path(beakerShape, {
      stroke: 'rgba(15,23,42,0.4)',
      lineWidth: 2.5,
    })
    const beakerShine = new Rectangle(-beakerW / 2 + 6, -beakerH / 2 + 6, 6, beakerH - 30, {
      cornerRadius: 3,
      fill: 'rgba(255,255,255,0.35)',
      pickable: false,
    })

    const beakerGroup = new Node({
      children: [liquidClip, beakerGlass, beakerShine],
      x: this.beakerCenterX,
      y: this.beakerCenterY,
    })
    this.addChild(beakerGroup)

    const solutionLabel = new Text(AcidsPhScaleStrings.solutionLabelStringProperty.value, {
      font: new PhetFont({ size: 10, weight: 'bold' }),
      fill: AcidsColors.muted,
      centerX: this.beakerCenterX,
      top: this.beakerCenterY + beakerH / 2 + 8,
      pickable: false,
    })
    this.addChild(solutionLabel)

    // ── Readouts beside the beaker ─────────────────────────────────────────────
    const readoutX = this.beakerCenterX + beakerW / 2 + 30
    this.substanceNameText = new Text('', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: AcidsColors.ink,
      left: readoutX,
      top: this.beakerCenterY - beakerH / 2,
      maxWidth: stageLeft + stageW - readoutX - 90,
      pickable: false,
    })
    this.addChild(this.substanceNameText)

    this.phLabelBadgeBg = new Rectangle(0, 0, 130, 24, {
      cornerRadius: 12,
      fill: '#16a34a',
      left: readoutX,
      top: this.substanceNameText.bottom + 8,
      pickable: false,
    })
    this.addChild(this.phLabelBadgeBg)
    this.phLabelBadgeText = new Text('', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#fff',
      pickable: false,
    })
    this.addChild(this.phLabelBadgeText)

    this.numericPhText = new Text('', {
      font: new PhetFont({ size: 26, weight: 'bold' }),
      fill: AcidsColors.accent,
      left: readoutX,
      top: this.phLabelBadgeBg.bottom + 10,
      pickable: false,
    })
    this.addChild(this.numericPhText)

    // ── pH meter gadget (toggleable) ────────────────────────────────────────────
    const meterBody = new Rectangle(0, 0, 54, 76, {
      cornerRadius: 10,
      fill: '#1f2937',
      stroke: AcidsColors.accent,
      lineWidth: 2,
    })
    const meterScreenBg = new Rectangle(6, 10, 42, 26, { cornerRadius: 4, fill: '#052e2b' })
    this.meterScreenText = new Text('7.0', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#5eead4',
      centerX: 27,
      centerY: 23,
    })
    const meterCaption = new Text(AcidsPhScaleStrings.meterLabelStringProperty.value, {
      font: new PhetFont({ size: 9, weight: 'bold' }),
      fill: '#cbd5e1',
      centerX: 27,
      top: 42,
      maxWidth: 48,
    })
    const meterRod = new Rectangle(23, 76, 8, 30, { fill: '#94a3b8', cornerRadius: 3 })
    const meterTip = new Circle(5, { fill: '#334155', centerX: 27, centerY: 108 })
    this.meterGroup = new Node({
      children: [meterBody, meterScreenBg, this.meterScreenText, meterCaption, meterRod, meterTip],
      right: stageLeft + stageW - 16,
      top: this.beakerCenterY - beakerH / 2 - 6,
      pickable: false,
    })
    this.addChild(this.meterGroup)

    // ── Universal indicator strip (toggleable) ─────────────────────────────────
    const indicatorY = stageTop + stageH - 66
    const indicatorLabel = new Text(AcidsPhScaleStrings.indicatorStripLabelStringProperty.value, {
      font: new PhetFont({ size: 10, weight: 'bold' }),
      fill: AcidsColors.muted,
      left: this.scaleX,
      bottom: indicatorY - 4,
      pickable: false,
    })
    const indicatorBg = new Rectangle(this.scaleX, indicatorY, this.scaleWidth, 24, {
      cornerRadius: 6,
      fill: '#fff',
      stroke: 'rgba(15,23,42,0.3)',
      lineWidth: 1.5,
      pickable: false,
    })
    this.indicatorRect = new Rectangle(this.scaleX + 3, indicatorY + 3, this.scaleWidth - 6, 18, {
      cornerRadius: 4,
      fill: '#fff',
      pickable: false,
    })
    this.indicatorGroup = new Node({ children: [indicatorLabel, indicatorBg, this.indicatorRect] })
    this.addChild(this.indicatorGroup)

    // ── Mini quiz overlay ──────────────────────────────────────────────────────
    this.particles = new ParticleBurst(80)
    this.addChild(this.particles)

    this.miniQuiz = new MiniQuiz(240)
    this.miniQuiz.centerX = stageLeft + stageW / 2
    this.miniQuiz.centerY = stageTop + stageH * 0.42
    this.addChild(this.miniQuiz)

    // ── Right control panel ─────────────────────────────────────────────────────
    const card = new DepthCard(rightW, stageH, { title: AcidsPhScaleStrings.controlsTitleStringProperty.value })
    card.left = stageLeft + stageW + gap
    card.top = stageTop
    this.addChild(card)

    const panelContent = new Node()
    const contentW = rightW - 42
    const halfW = (contentW - 8) / 2
    const gridGap = 6
    const btnH = 32

    const scenariosHeader = controlSection(AcidsPhScaleStrings.sectionScenariosStringProperty.value, contentW)
    panelContent.addChild(scenariosHeader)

    this.exploreBtn = new SoftButton(
      AcidsPhScaleStrings.scenarioExploreStringProperty.value,
      () => model.setScenario('explore'),
      { width: contentW, height: btnH, fill: AcidsColors.accent, selected: true, onSound: () => sounds.modeChange(true) },
    )
    panelContent.addChild(this.exploreBtn)

    this.strongAcidBtn = new SoftButton(
      AcidsPhScaleStrings.scenarioStrongAcidStringProperty.value,
      () => model.setScenario('strongAcid'),
      { width: contentW, height: btnH, fill: '#dc2626', selected: false, onSound: () => sounds.scenario() },
    )
    panelContent.addChild(this.strongAcidBtn)

    this.neutralBtn = new SoftButton(
      AcidsPhScaleStrings.scenarioNeutralStringProperty.value,
      () => model.setScenario('neutral'),
      { width: contentW, height: btnH, fill: '#16a34a', selected: false, onSound: () => sounds.scenario() },
    )
    panelContent.addChild(this.neutralBtn)

    this.strongBaseBtn = new SoftButton(
      AcidsPhScaleStrings.scenarioStrongBaseStringProperty.value,
      () => model.setScenario('strongBase'),
      { width: contentW, height: btnH, fill: '#5b21b6', selected: false, onSound: () => sounds.scenario() },
    )
    panelContent.addChild(this.strongBaseBtn)

    const substancesHeader = controlSection(AcidsPhScaleStrings.sectionSubstancesStringProperty.value, contentW)
    panelContent.addChild(substancesHeader)

    SUBSTANCES.forEach((s) => {
      const btn = new SoftButton(s.label, () => model.selectSubstance(s.id), {
        width: halfW,
        height: 30,
        fill: '#64748b',
        fontSize: 10,
        selected: s.id === model.selectedSubstanceIdProperty.value,
        onSound: () => sounds.select(),
      })
      this.substanceButtons.push({ id: s.id, btn })
      panelContent.addChild(btn)
    })

    const customHeader = controlSection(AcidsPhScaleStrings.sectionCustomStringProperty.value, contentW)
    panelContent.addChild(customHeader)

    const customSlider = new DepthSlider(model.customPhProperty, {
      min: PH_RANGE.min,
      max: PH_RANGE.max,
      width: contentW,
      label: AcidsPhScaleStrings.customPhLabelStringProperty.value,
      format: (n) => n.toFixed(1),
      fill: '#0ea5e9',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(customSlider)

    const customHint = controlHint('Drag to blend a custom solution', contentW)
    panelContent.addChild(customHint)

    const displayHeader = controlSection(AcidsPhScaleStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)

    this.labelsBtn = new SoftButton(
      AcidsPhScaleStrings.labelsOnStringProperty.value,
      () => {
        model.showLabelsProperty.value = !model.showLabelsProperty.value
      },
      { width: contentW, height: btnH, fill: '#64748b', selected: model.showLabelsProperty.value, fontSize: 11, onSound: () => sounds.softClick() },
    )
    panelContent.addChild(this.labelsBtn)

    this.indicatorBtn = new SoftButton(
      AcidsPhScaleStrings.indicatorOnStringProperty.value,
      () => {
        model.showIndicatorProperty.value = !model.showIndicatorProperty.value
      },
      { width: contentW, height: btnH, fill: '#0ea5e9', selected: model.showIndicatorProperty.value, fontSize: 11, onSound: () => sounds.softClick() },
    )
    panelContent.addChild(this.indicatorBtn)

    this.meterBtn = new SoftButton(
      AcidsPhScaleStrings.meterOnStringProperty.value,
      () => {
        model.meterOnProperty.value = !model.meterOnProperty.value
      },
      { width: contentW, height: btnH, fill: '#7c3aed', selected: model.meterOnProperty.value, fontSize: 11, onSound: () => sounds.softClick() },
    )
    panelContent.addChild(this.meterBtn)

    const playbackHeader = controlSection(AcidsPhScaleStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)

    this.runningBtn = new SoftButton(
      AcidsPhScaleStrings.animateOnStringProperty.value,
      () => {
        const on = !model.runningProperty.value
        model.runningProperty.value = on
        sounds.toggle(on)
      },
      { width: contentW, height: btnH, fill: '#f59e0b', selected: model.runningProperty.value, fontSize: 11 },
    )
    panelContent.addChild(this.runningBtn)

    const speedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: AcidsPhScaleStrings.simSpeedStringProperty.value,
      format: (n) => `${n.toFixed(2)}×`,
      fill: '#f59e0b',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(speedSlider)

    const soundHeader = controlSection(AcidsPhScaleStrings.sectionSoundStringProperty.value, contentW)
    panelContent.addChild(soundHeader)

    this.soundBtn = new SoftButton(
      model.soundEnabledProperty.value
        ? AcidsPhScaleStrings.soundOnStringProperty.value
        : AcidsPhScaleStrings.soundOffStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.setEnabled(on)
        if (on) sounds.button()
        this.soundBtn.setLabel(
          on ? AcidsPhScaleStrings.soundOnStringProperty.value : AcidsPhScaleStrings.soundOffStringProperty.value,
        )
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.soundBtn)

    this.starsText = new Text('', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: '#d97706',
    })
    panelContent.addChild(this.starsText)

    this.statusText = new Text(model.statusProperty.value, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: AcidsColors.panelText,
      maxWidth: contentW,
    })
    panelContent.addChild(this.statusText)

    const learnTip = createPanelTip(AcidsPhScaleStrings.learnMoreStringProperty.value, {
      width: contentW,
      fontSize: 12,
    })
    panelContent.addChild(learnTip)

    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false })
    panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      scenariosHeader.left = 0
      scenariosHeader.top = py
      py = scenariosHeader.bottom + 6

      this.exploreBtn.left = 0
      this.exploreBtn.top = py
      py = this.exploreBtn.bottom + gridGap
      this.strongAcidBtn.left = 0
      this.strongAcidBtn.top = py
      py = this.strongAcidBtn.bottom + gridGap
      this.neutralBtn.left = 0
      this.neutralBtn.top = py
      py = this.neutralBtn.bottom + gridGap
      this.strongBaseBtn.left = 0
      this.strongBaseBtn.top = py
      py = this.strongBaseBtn.bottom + 12

      substancesHeader.left = 0
      substancesHeader.top = py
      py = substancesHeader.bottom + 6
      this.substanceButtons.forEach(({ btn }, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        btn.left = col === 0 ? 0 : halfW + 8
        btn.top = py + row * (30 + gridGap)
      })
      const rows = Math.ceil(this.substanceButtons.length / 2)
      py = py + rows * (30 + gridGap) - gridGap + 12

      customHeader.left = 0
      customHeader.top = py
      py = customHeader.bottom + 6
      customSlider.left = 0
      customSlider.top = py
      py = customSlider.bottom + 4
      customHint.left = 0
      customHint.top = py
      py = customHint.bottom + 12

      displayHeader.left = 0
      displayHeader.top = py
      py = displayHeader.bottom + 6
      this.labelsBtn.left = 0
      this.labelsBtn.top = py
      py = this.labelsBtn.bottom + gridGap
      this.indicatorBtn.left = 0
      this.indicatorBtn.top = py
      py = this.indicatorBtn.bottom + gridGap
      this.meterBtn.left = 0
      this.meterBtn.top = py
      py = this.meterBtn.bottom + 12

      playbackHeader.left = 0
      playbackHeader.top = py
      py = playbackHeader.bottom + 6
      this.runningBtn.left = 0
      this.runningBtn.top = py
      py = this.runningBtn.bottom + 8
      speedSlider.left = 0
      speedSlider.top = py
      py = speedSlider.bottom + 12

      soundHeader.left = 0
      soundHeader.top = py
      py = soundHeader.bottom + 6
      this.soundBtn.left = 0
      this.soundBtn.top = py
      py = this.soundBtn.bottom + 10

      this.starsText.left = 0
      this.starsText.top = py
      py = this.starsText.bottom + 6
      this.statusText.left = 0
      this.statusText.top = py
      py = this.statusText.bottom + 10

      learnTip.left = 0
      learnTip.top = py
      py = learnTip.bottom + 4
      bottomPad.top = py
    }
    relayoutPanel()

    const scroller = new ScrollableNode(panelContent, rightW - 24, stageH - 72)
    scroller.left = 12
    scroller.top = 38
    card.content.addChild(scroller)

    this.addChild(
      new ResetAllButton({
        listener: () => {
          sounds.resetAll()
          model.reset()
        },
        right: lb.right - m,
        bottom: lb.bottom - my,
      }),
    )

    // ── Wiring ──────────────────────────────────────────────────────────────────
    const syncStars = () => {
      this.starsText.string = `${AcidsPhScaleStrings.starsStringProperty.value} ${model.starsProperty.value}`
    }

    const syncScenario = () => {
      const s = model.scenarioProperty.value
      this.exploreBtn.setSelected(s === 'explore')
      this.strongAcidBtn.setSelected(s === 'strongAcid')
      this.neutralBtn.setSelected(s === 'neutral')
      this.strongBaseBtn.setSelected(s === 'strongBase')
    }

    const syncSubstanceButtons = () => {
      const id = model.selectedSubstanceIdProperty.value
      this.substanceButtons.forEach((entry) => entry.btn.setSelected(entry.id === id))
      this.substanceNameText.string = model.substanceLabel()
    }

    const syncLabels = () => {
      const show = model.showLabelsProperty.value
      for (const n of this.labelNodes) {
        n.visible = show
      }
      this.labelsBtn.setLabel(
        show ? AcidsPhScaleStrings.labelsOnStringProperty.value : AcidsPhScaleStrings.labelsOffStringProperty.value,
      )
      this.labelsBtn.setSelected(show)
    }

    const syncIndicator = () => {
      const show = model.showIndicatorProperty.value
      this.indicatorGroup.visible = show
      this.indicatorBtn.setLabel(
        show ? AcidsPhScaleStrings.indicatorOnStringProperty.value : AcidsPhScaleStrings.indicatorOffStringProperty.value,
      )
      this.indicatorBtn.setSelected(show)
    }

    const syncMeter = () => {
      const on = model.meterOnProperty.value
      this.meterGroup.visible = on
      this.numericPhText.visible = on
      this.meterBtn.setLabel(
        on ? AcidsPhScaleStrings.meterOnStringProperty.value : AcidsPhScaleStrings.meterOffStringProperty.value,
      )
      this.meterBtn.setSelected(on)
    }

    const syncRunning = () => {
      const on = model.runningProperty.value
      this.runningBtn.setLabel(
        on ? AcidsPhScaleStrings.animateOnStringProperty.value : AcidsPhScaleStrings.animateOffStringProperty.value,
      )
      this.runningBtn.setSelected(on)
    }

    model.scenarioProperty.link(() => {
      syncScenario()
      this.updateGuidance()
    })
    model.selectedSubstanceIdProperty.link(() => {
      syncSubstanceButtons()
      this.updateGuidance()
    })
    model.customPhProperty.link(() => this.updateGuidance())
    model.showLabelsProperty.link(syncLabels)
    model.showIndicatorProperty.link(syncIndicator)
    model.meterOnProperty.link(syncMeter)
    model.runningProperty.link(syncRunning)
    model.starsProperty.link(syncStars)
    model.statusProperty.link((status) => {
      this.statusText.string = status
      relayoutPanel()
    })
    model.substanceChangesProperty.lazyLink(() => {
      this.particles.burst(this.beakerCenterX, this.beakerCenterY, {
        count: 20,
        color: phToColor(model.targetPh()),
        speed: 90,
        life: 0.55,
        radius: 3.4,
      })
      sounds.hop()
    })
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.scenarioTourCompleteProperty.link((complete) => {
      if (complete) {
        sounds.celebrate()
        this.particles.burst(this.beakerCenterX, this.beakerCenterY - 30, {
          count: 26,
          color: '#f59e0b',
          speed: 110,
          life: 0.7,
          radius: 4,
        })
        this.updateGuidance()
      }
    })

    syncScenario()
    syncSubstanceButtons()
    syncLabels()
    syncIndicator()
    syncMeter()
    syncRunning()
    syncStars()
    this.updateGuidance()
    this.syncStageReadouts(model.displayPhProperty.value)
  }

  private showQuiz(): void {
    this.miniQuiz.showQuiz(
      AcidsPhScaleStrings.quizQuestionStringProperty.value,
      [
        { label: AcidsPhScaleStrings.quizNeutralStringProperty.value, correct: true },
        { label: AcidsPhScaleStrings.quizAcidicStringProperty.value, correct: false },
        { label: AcidsPhScaleStrings.quizBasicStringProperty.value, correct: false },
      ],
      (correct) => {
        correct ? this.sounds.correct() : this.sounds.wrong()
        this.model.onQuizAnswered(correct)
      },
    )
  }

  private updateGuidance(): void {
    if (this.model.scenarioTourCompleteProperty.value) {
      this.guide.setGuidance(
        AcidsPhScaleStrings.guideTitleStringProperty.value,
        AcidsPhScaleStrings.guideTourCompleteStringProperty.value,
      )
      this.teachingTriad.setTriad(
        'Tour complete!',
        'A strong acid, a neutral solution, and a strong base sit at very different points on the scale.',
        'Try the quiz, or drag Custom pH anywhere between −1 and 15.',
        () => this.repositionLeftTip(),
      )
      return
    }

    const target = this.model.targetPh()
    const label = phLabel(target)
    const name = this.model.substanceLabel()

    if (label === 'Acidic') {
      this.guide.setGuidance(AcidsPhScaleStrings.guideTitleStringProperty.value, AcidsPhScaleStrings.guideAcidicStringProperty.value)
      this.teachingTriad.setTriad(
        `${name} — pH ${target.toFixed(1)}.`,
        'Acids have extra hydrogen ions, so pH sits below 7 and the scale glows red-orange.',
        'Try a Strong base or the Custom pH slider to compare.',
        () => this.repositionLeftTip(),
      )
    }
    else if (label === 'Basic (alkaline)') {
      this.guide.setGuidance(AcidsPhScaleStrings.guideTitleStringProperty.value, AcidsPhScaleStrings.guideBasicStringProperty.value)
      this.teachingTriad.setTriad(
        `${name} — pH ${target.toFixed(1)}.`,
        'Bases have fewer hydrogen ions, so pH sits above 7 and the scale glows blue-purple.',
        'Try a Strong acid or the Custom pH slider to compare.',
        () => this.repositionLeftTip(),
      )
    }
    else {
      this.guide.setGuidance(AcidsPhScaleStrings.guideTitleStringProperty.value, AcidsPhScaleStrings.guideNeutralStringProperty.value)
      this.teachingTriad.setTriad(
        `${name} — pH ${target.toFixed(1)}.`,
        'Pure water splits evenly into H⁺ and OH⁻ ions, landing exactly at pH 7.',
        'Try the scenario buttons to see a strong acid and a strong base.',
        () => this.repositionLeftTip(),
      )
    }
  }

  private repositionLeftTip(): void {
    this.leftTip.top = this.teachingTriad.bottom + 10
  }

  private syncStageReadouts(ph: number): void {
    const t = clamp(ph, 0, 14) / 14
    this.markerNode.x = this.scaleX + t * this.scaleWidth

    const color = phToColor(ph)
    this.liquidRect.fill = color
    this.indicatorRect.fill = color

    this.phLabelBadgeText.string = labelFor(ph)
    this.phLabelBadgeBg.fill = colorForLabel(ph)
    this.phLabelBadgeText.centerX = this.phLabelBadgeBg.centerX
    this.phLabelBadgeText.centerY = this.phLabelBadgeBg.centerY

    this.numericPhText.string = `pH ${ph.toFixed(1)}`
    this.meterScreenText.string = ph.toFixed(1)
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.particles.step(dt)
    this.syncStageReadouts(this.model.displayPhProperty.value)
  }
}
