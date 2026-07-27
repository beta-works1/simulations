import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Matrix3, Vector2 } from 'scenerystack/dot'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { BrainMappingModel } from '../model/BrainMappingModel.js'
import {
  BRAIN_REGIONS,
  CEREBRUM_OUTLINE,
  SVG_H,
  SVG_W,
  type BrainPart,
  type BrainRegionId,
} from '../model/brainRegions.js'
import { NervousConstants, damp } from '../../../shared/NervousConstants.js'
import { NervousColors } from '../../../shared/NervousColors.js'
import { NervousSounds } from '../../../shared/NervousSounds.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { DepthSlider } from '../../../shared/ui/DepthSlider.js'
import { SoftButton } from '../../../shared/ui/SoftButton.js'
import { StageBackdrop } from '../../../shared/ui/StageBackdrop.js'
import { GuidanceBanner } from '../../../shared/ui/GuidanceBanner.js'
import { ScrollableNode } from '../../../shared/ui/ScrollableNode.js'
import { createPanelTip } from '../../../shared/ui/createPanelTip.js'
import { ParticleBurst } from '../../../shared/ui/ParticleBurst.js'
import { RippleFX } from '../../../shared/ui/RippleFX.js'
import { TeachingTriad } from '../../../shared/ui/TeachingTriad.js'
import { HistoryChart } from '../../../shared/ui/HistoryChart.js'
import { BrainMappingStrings } from '../BrainMappingStrings.js'
import { controlSection } from '../../../shared/ui/controlPanelBits.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

type PartFilterId = BrainPart | 'all'

const REVEAL_STROKE = '#f1c40f'

/** Trims a detail sentence down to its first clause for the compact WHY card. */
function shortenDetail(detail: string): string {
  const idx = detail.indexOf('. ')
  return idx > 0 ? detail.slice(0, idx + 1) : detail
}

export class BrainMappingScreenView extends ScreenView {
  private readonly model: BrainMappingModel
  private readonly regionPaths = new Map<BrainRegionId, Path>()
  private readonly regionHalos = new Map<BrainRegionId, Path>()
  private readonly labelBadge: Node
  private readonly labelText: Text
  private readonly statusText: Text
  private readonly quizPrompt: Text
  private readonly promptBg: Rectangle
  private readonly detailTitle: Text
  private readonly detailPart: Text
  private readonly detailBody: RichText
  private readonly detailExamples: RichText
  private readonly exploredText: Text
  private readonly scoreText: Text
  private readonly starsText: Text
  private readonly unlockHint: Text
  private readonly studyBtn: SoftButton
  private readonly quizBtn: SoftButton
  private readonly missionBtn: SoftButton
  private readonly scenarioBtn: SoftButton
  private readonly tipsBtn: SoftButton
  private readonly soundBtn: SoftButton
  private readonly bordersBtn: SoftButton
  private readonly calloutsBtn: SoftButton
  private readonly homunculusBtn: SoftButton
  private readonly autoTourBtn: SoftButton
  private readonly homunculusTip: Text
  private readonly filterButtons = new Map<PartFilterId, SoftButton>()
  private readonly regionButtons = new Map<BrainRegionId, SoftButton>()
  private readonly checklistRows = new Map<BrainRegionId, Text>()
  private readonly guide: GuidanceBanner
  private readonly feedbackFlash: Rectangle
  private readonly confetti: ParticleBurst
  private readonly ripples: RippleFX
  private readonly sounds: NervousSounds
  private readonly teachingTriad: TeachingTriad
  private readonly streakChart: HistoryChart
  private readonly streakSeries: number
  private readonly brainCenterX: number
  private readonly brainCenterY: number
  private readonly promptCenterX: number
  private readonly promptMaxWidth: number
  /** Fade target (before ×glowIntensity) for each non-selected halo — damped toward in step(). */
  private readonly haloTarget = new Map<BrainRegionId, number>()
  /** Original (unscaled) center of each region path, used to re-center the subtle selection pulse. */
  private readonly regionCenter = new Map<BrainRegionId, { x: number; y: number }>()
  private pulse = 0
  private labelFlash = 0
  private wasCelebrating = false
  private prevLastAnswer: 'correct' | 'wrong' | null = null
  private celebrateWavesLeft = 0
  private celebrateWaveTimer = 0

  public constructor(model: BrainMappingModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    this.sounds = new NervousSounds()
    this.addInputListener({ down: () => this.sounds.unlock() })

    const m = NervousConstants.SCREEN_VIEW_X_MARGIN
    const my = NervousConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    const rightW = 300
    const gap = 14
    const stageLeft = m
    const stageTop = my + 78
    const stageW = lb.width - m * 2 - rightW - gap
    const stageH = lb.height - my * 2 - 78

    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: BrainMappingStrings.guideTitleStringProperty.value,
      body: BrainMappingStrings.guideStudyStringProperty.value,
    })
    this.guide.left = m
    this.guide.top = my
    this.addChild(this.guide)

    this.addChild(
      new StageBackdrop(stageLeft, stageTop, stageW, stageH, { top: '#c5d4e8', bottom: '#f0f4f8' }),
    )

    this.feedbackFlash = new Rectangle(stageLeft, stageTop, stageW, stageH, {
      cornerRadius: 18,
      fill: 'rgba(39,174,96,0)',
      pickable: false,
    })
    this.addChild(this.feedbackFlash)

    // Left dock reserved on-stage for the NOW/WHY/NEXT teaching triad (ecology pattern).
    const teachDockW = 172
    const teachGap = 12
    const brainAreaLeft = stageLeft + teachDockW + teachGap
    const brainAreaW = stageW - teachDockW - teachGap

    this.teachingTriad = new TeachingTriad(teachDockW - 20)
    this.teachingTriad.left = stageLeft + 14
    this.teachingTriad.top = stageTop + 46
    this.addChild(this.teachingTriad)

    const bw = Math.min(brainAreaW * 0.94, (stageH - 80) * 0.95)
    const bh = bw * (SVG_H / SVG_W)
    const bx = brainAreaLeft + (brainAreaW - bw) / 2
    const by = stageTop + (stageH - bh) / 2 - 6
    this.brainCenterX = bx + bw / 2
    this.brainCenterY = by + bh / 2
    this.promptCenterX = brainAreaLeft + brainAreaW / 2
    this.promptMaxWidth = brainAreaW - 40

    const brainRoot = new Node({
      matrix: Matrix3.translation(bx, by).timesMatrix(Matrix3.scaling(bw / SVG_W, bh / SVG_H)),
    })
    this.addChild(brainRoot)

    const brainShadow = new Path(new Shape(CEREBRUM_OUTLINE), {
      fill: 'rgba(15,23,42,0.14)',
      pickable: false,
    })
    brainShadow.x = 6
    brainShadow.y = 10
    brainRoot.addChild(brainShadow)
    brainRoot.addChild(
      new Path(new Shape(CEREBRUM_OUTLINE), {
        fill: '#e8b896',
        stroke: '#5a3b2a',
        lineWidth: 2.6,
        pickable: false,
      }),
    )

    const drawOrder: BrainRegionId[] = [
      'frontal',
      'parietal',
      'temporal',
      'occipital',
      'cerebellum',
      'brainstem',
    ]
    for (const id of drawOrder) {
      const region = BRAIN_REGIONS.find((r) => r.id === id)!
      const halo = new Path(new Shape(region.pathD), {
        fill: region.accent,
        opacity: 0,
        pickable: false,
      })
      this.regionHalos.set(id, halo)
      this.haloTarget.set(id, 0)
      brainRoot.addChild(halo)

      const path = new Path(new Shape(region.pathD), {
        fill: region.fill,
        stroke: 'rgba(255,255,255,0.65)',
        lineWidth: 1.8,
        cursor: 'pointer',
      })
      this.regionCenter.set(id, { x: path.centerX, y: path.centerY })
      path.addInputListener({
        down: () => model.selectRegion(id),
        enter: () => {
          if (model.selectedProperty.value !== id) {
            path.fill = region.fillHover
            this.haloTarget.set(id, 0.18)
          }
        },
        exit: () => {
          if (model.selectedProperty.value !== id) {
            path.fill = region.fill
            this.haloTarget.set(id, 0)
          }
        },
      })
      this.regionPaths.set(id, path)
      brainRoot.addChild(path)
    }

    this.labelBadge = new Node({ pickable: false })
    this.labelText = new Text('', {
      font: new PhetFont({ size: 14, weight: 'bold' }),
      fill: '#1a252f',
    })
    const badgeBg = new Rectangle(0, 0, 10, 28, {
      cornerRadius: 10,
      fill: 'rgba(255,255,255,0.97)',
      stroke: '#e74c3c',
      lineWidth: 2,
    })
    this.labelBadge.addChild(
      new Rectangle(2, 3, 10, 28, {
        cornerRadius: 10,
        fill: 'rgba(15,23,42,0.12)',
      }),
    )
    this.labelBadge.addChild(badgeBg)
    this.labelBadge.addChild(this.labelText)
    brainRoot.addChild(this.labelBadge)

    this.homunculusTip = new Text(BrainMappingStrings.homunculusTipStringProperty.value, {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#5b21b6',
      centerX: BRAIN_REGIONS.find((r) => r.id === 'parietal')!.label.x,
      centerY: BRAIN_REGIONS.find((r) => r.id === 'parietal')!.label.y + 36,
      maxWidth: 120,
      visible: false,
      pickable: false,
    })
    brainRoot.addChild(this.homunculusTip)

    this.quizPrompt = new Text('', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: '#fff',
      centerX: this.promptCenterX,
      top: stageTop + 14,
      maxWidth: this.promptMaxWidth,
      visible: false,
      pickable: false,
    })
    this.promptBg = new Rectangle(0, 0, 100, 34, {
      cornerRadius: 12,
      fill: 'rgba(21,32,51,0.92)',
      visible: false,
      pickable: false,
    })
    this.addChild(this.promptBg)
    this.addChild(this.quizPrompt)

    this.confetti = new ParticleBurst(120)
    this.addChild(this.confetti)

    this.ripples = new RippleFX()
    this.addChild(this.ripples)

    this.addChild(
      new Rectangle(stageLeft + 14, stageTop + stageH - 48, stageW - 28, 36, {
        cornerRadius: 10,
        fill: '#fff',
        stroke: 'rgba(71,85,105,0.28)',
        lineWidth: 1.5,
      }),
    )
    this.statusText = new Text('', {
      font: new PhetFont({ size: 14 }),
      fill: NervousColors.ink,
      left: stageLeft + 24,
      centerY: stageTop + stageH - 30,
      maxWidth: stageW - 48,
      pickable: false,
    })
    this.addChild(this.statusText)

    const resetGap = 52
    const cardH = stageH - resetGap
    const card = new DepthCard(rightW, cardH, { title: BrainMappingStrings.modeStringProperty.value })
    card.left = stageLeft + stageW + gap
    card.top = stageTop
    this.addChild(card)

    const panelContent = new Node()
    const tipWidth = rightW - 48
    const modeBtnW = rightW - 40

    const modesSection = controlSection(BrainMappingStrings.sectionModesStringProperty.value, modeBtnW)
    panelContent.addChild(modesSection)

    this.studyBtn = new SoftButton(BrainMappingStrings.studyStringProperty.value, () => {
      model.setMode('study')
    }, { width: modeBtnW, height: 36, fill: NervousColors.accent, selected: true, onSound: () => this.sounds.button() })
    this.studyBtn.left = 4
    panelContent.addChild(this.studyBtn)

    this.quizBtn = new SoftButton(BrainMappingStrings.quizStringProperty.value, () => {
      model.setMode('quiz')
    }, { width: modeBtnW, height: 36, fill: '#64748b', selected: false, onSound: () => this.sounds.button() })
    this.quizBtn.left = 4
    panelContent.addChild(this.quizBtn)

    this.missionBtn = new SoftButton(BrainMappingStrings.missionStringProperty.value, () => {
      model.setMode('mission')
    }, { width: modeBtnW, height: 36, fill: '#10b981', selected: false, onSound: () => this.sounds.button() })
    this.missionBtn.left = 4
    panelContent.addChild(this.missionBtn)

    this.scenarioBtn = new SoftButton(BrainMappingStrings.scenarioStringProperty.value, () => {
      model.setMode('scenario')
    }, { width: modeBtnW, height: 36, fill: '#f59e0b', selected: false, onSound: () => this.sounds.button() })
    this.scenarioBtn.left = 4
    panelContent.addChild(this.scenarioBtn)

    this.unlockHint = new Text(BrainMappingStrings.unlockQuizStringProperty.value, {
      font: new PhetFont({ size: 12 }),
      fill: NervousColors.panelMuted,
      left: 4,
      maxWidth: modeBtnW,
    })
    panelContent.addChild(this.unlockHint)

    this.starsText = new Text('★ 0', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: '#d97706',
      left: 4,
    })
    panelContent.addChild(this.starsText)

    this.tipsBtn = new SoftButton(BrainMappingStrings.tipsOnStringProperty.value, () => {
      model.tipsVisibleProperty.value = !model.tipsVisibleProperty.value
    }, { width: modeBtnW, height: 32, fill: '#0ea5e9', selected: true, fontSize: 13, onSound: () => this.sounds.button() })
    this.tipsBtn.left = 4
    panelContent.addChild(this.tipsBtn)

    this.soundBtn = new SoftButton(BrainMappingStrings.soundOnStringProperty.value, () => {
      this.sounds.unlock()
      model.soundEnabledProperty.value = !model.soundEnabledProperty.value
      if (model.soundEnabledProperty.value) this.sounds.button()
    }, { width: modeBtnW, height: 32, fill: '#ef4444', selected: true, fontSize: 13 })
    this.soundBtn.left = 4
    panelContent.addChild(this.soundBtn)

    const displaySection = controlSection(BrainMappingStrings.sectionDisplayStringProperty.value, modeBtnW)
    panelContent.addChild(displaySection)

    this.bordersBtn = new SoftButton(BrainMappingStrings.bordersOnStringProperty.value, () => {
      model.showBordersProperty.value = !model.showBordersProperty.value
    }, { width: modeBtnW, height: 32, fill: '#475569', selected: true, fontSize: 13, onSound: () => this.sounds.softClick() })
    panelContent.addChild(this.bordersBtn)

    this.calloutsBtn = new SoftButton(BrainMappingStrings.calloutsOnStringProperty.value, () => {
      model.showCalloutsProperty.value = !model.showCalloutsProperty.value
    }, { width: modeBtnW, height: 32, fill: '#6366f1', selected: true, fontSize: 13, onSound: () => this.sounds.softClick() })
    panelContent.addChild(this.calloutsBtn)

    this.homunculusBtn = new SoftButton(BrainMappingStrings.homunculusOnStringProperty.value, () => {
      model.showHomunculusProperty.value = !model.showHomunculusProperty.value
    }, { width: modeBtnW, height: 32, fill: '#8b5cf6', selected: false, fontSize: 13, onSound: () => this.sounds.softClick() })
    panelContent.addChild(this.homunculusBtn)

    const glowSlider = new DepthSlider(model.glowIntensityProperty, {
      min: 0.4,
      max: 1.2,
      width: modeBtnW,
      label: BrainMappingStrings.glowLabelStringProperty.value,
      format: (n) => `${n.toFixed(1)}×`,
      fill: '#a855f7',
      onTick: () => this.sounds.sliderTick(),
    })
    glowSlider.left = 4
    panelContent.addChild(glowSlider)

    const pulseSpeedSlider = new DepthSlider(model.pulseSpeedProperty, {
      min: 0.4,
      max: 2,
      width: modeBtnW,
      label: BrainMappingStrings.pulseSpeedStringProperty.value,
      format: (n) => `${n.toFixed(1)}×`,
      fill: '#ec4899',
      onTick: () => this.sounds.sliderTick(),
    })
    pulseSpeedSlider.left = 4
    panelContent.addChild(pulseSpeedSlider)

    const labelScaleSlider = new DepthSlider(model.labelScaleProperty, {
      min: 0.8,
      max: 1.4,
      width: modeBtnW,
      label: BrainMappingStrings.labelScaleStringProperty.value,
      format: (n) => `${n.toFixed(1)}×`,
      fill: '#14b8a6',
      onTick: () => this.sounds.sliderTick(),
    })
    labelScaleSlider.left = 4
    panelContent.addChild(labelScaleSlider)

    const scenarioSection = controlSection(BrainMappingStrings.sectionScenariosStringProperty.value, modeBtnW)
    panelContent.addChild(scenarioSection)

    const scenarioHalfW = Math.floor((modeBtnW - 8) / 2)
    const scenarioBikeBtn = new SoftButton(BrainMappingStrings.scenarioBikeStringProperty.value, () => {
      model.setMode('scenario')
    }, { width: modeBtnW, height: 32, fill: '#f59e0b', fontSize: 12, onSound: () => this.sounds.button() })
    panelContent.addChild(scenarioBikeBtn)

    const scenarioHearingBtn = new SoftButton(BrainMappingStrings.scenarioHearingStringProperty.value, () => {
      model.setMode('study')
      model.selectRegion('temporal')
      model.statusProperty.value = BrainMappingStrings.statusHearingStringProperty.value
    }, { width: scenarioHalfW, height: 32, fill: '#a855f7', fontSize: 11, onSound: () => this.sounds.button() })
    panelContent.addChild(scenarioHearingBtn)

    const scenarioCatchBtn = new SoftButton(BrainMappingStrings.scenarioCatchStringProperty.value, () => {
      model.setMode('study')
      model.selectRegion('cerebellum')
      model.statusProperty.value = BrainMappingStrings.statusCatchStringProperty.value
    }, { width: scenarioHalfW, height: 32, fill: '#0ea5e9', fontSize: 11, onSound: () => this.sounds.button() })
    panelContent.addChild(scenarioCatchBtn)

    const quizSettingsSection = controlSection(BrainMappingStrings.sectionQuizSettingsStringProperty.value, modeBtnW)
    panelContent.addChild(quizSettingsSection)

    const difficultySlider = new DepthSlider(model.difficultyProperty, {
      min: 1,
      max: 2,
      width: modeBtnW,
      label: BrainMappingStrings.difficultyStringProperty.value,
      format: (n) => (n >= 1.5 ? 'Hard' : 'Easy'),
      fill: '#ef4444',
      onTick: () => this.sounds.sliderTick(),
    })
    difficultySlider.left = 4
    panelContent.addChild(difficultySlider)

    this.autoTourBtn = new SoftButton(BrainMappingStrings.autoTourOnStringProperty.value, () => {
      model.autoTourProperty.value = !model.autoTourProperty.value
    }, { width: modeBtnW, height: 32, fill: '#059669', selected: false, fontSize: 13, onSound: () => this.sounds.softClick() })
    panelContent.addChild(this.autoTourBtn)

    const filterLabel = new Text(BrainMappingStrings.filterLabelStringProperty.value, {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: NervousColors.panelText,
      left: 4,
    })
    panelContent.addChild(filterLabel)

    const filterDefs: { id: PartFilterId; label: string; fill: string }[] = [
      { id: 'all', label: BrainMappingStrings.filterAllStringProperty.value, fill: '#64748b' },
      { id: 'cerebrum', label: BrainMappingStrings.filterCerebrumStringProperty.value, fill: '#6366f1' },
      { id: 'cerebellum', label: BrainMappingStrings.filterCerebellumStringProperty.value, fill: '#0ea5e9' },
      { id: 'brainstem', label: BrainMappingStrings.filterBrainstemStringProperty.value, fill: '#14b8a6' },
    ]
    const filterBtnW = Math.floor((rightW - 40 - 8) / 2)
    for (const def of filterDefs) {
      const btn = new SoftButton(def.label, () => model.setPartFilter(def.id), {
        width: filterBtnW,
        height: 28,
        fill: def.fill,
        selected: def.id === 'all',
        fontSize: 11,
        onSound: () => this.sounds.softClick(),
      })
      panelContent.addChild(btn)
      this.filterButtons.set(def.id, btn)
    }

    this.exploredText = new Text('Explored 1 / 6', {
      font: new PhetFont({ size: 14, weight: 'bold' }),
      fill: NervousColors.panelText,
      left: 4,
    })
    this.scoreText = new Text('Score —', {
      font: new PhetFont({ size: 14, weight: 'bold' }),
      fill: NervousColors.panelMuted,
      left: 4,
    })
    panelContent.addChild(this.exploredText)
    panelContent.addChild(this.scoreText)

    const checklistTitle = new Text(BrainMappingStrings.checklistTitleStringProperty.value, {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: NervousColors.panelText,
      left: 4,
    })
    panelContent.addChild(checklistTitle)

    const checklistColW = Math.floor((tipWidth - 8) / 2)
    for (const region of BRAIN_REGIONS) {
      const row = new Text('', {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: NervousColors.panelMuted,
        left: 4,
        maxWidth: checklistColW - 4,
      })
      this.checklistRows.set(region.id, row)
      panelContent.addChild(row)
    }

    this.streakChart = new HistoryChart(tipWidth, 64, {
      title: BrainMappingStrings.streakChartTitleStringProperty.value,
      maxPoints: 20,
    })
    this.streakChart.left = 4
    this.streakSeries = this.streakChart.addSeries(NervousColors.accent)
    panelContent.addChild(this.streakChart)

    this.detailTitle = new Text('', {
      font: new PhetFont({ size: 16, weight: 'bold' }),
      fill: NervousColors.accent,
      left: 4,
      maxWidth: tipWidth,
    })
    this.detailPart = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: NervousColors.panelMuted,
      left: 4,
      maxWidth: tipWidth,
    })
    this.detailBody = createPanelTip('', {
      width: tipWidth,
      fontSize: 12,
    })
    this.detailBody.left = 4
    this.detailExamples = createPanelTip('', {
      width: tipWidth,
      fontSize: 12,
    })
    this.detailExamples.left = 4
    panelContent.addChild(this.detailTitle)
    panelContent.addChild(this.detailPart)
    panelContent.addChild(this.detailBody)
    panelContent.addChild(this.detailExamples)

    const regionsHeader = new Text(BrainMappingStrings.regionsStringProperty.value, {
      font: new PhetFont({ size: 14, weight: 'bold' }),
      fill: NervousColors.panelText,
      left: 4,
    })
    panelContent.addChild(regionsHeader)

    const regionBtnW = Math.floor((rightW - 40 - 8) / 2)
    for (const region of BRAIN_REGIONS) {
      const btn = new SoftButton(region.name, () => model.selectRegion(region.id), {
        width: regionBtnW,
        height: 34,
        fill: region.accent,
        selected: region.id === 'frontal',
        fontSize: 12,
        onSound: () => this.sounds.button(),
      })
      panelContent.addChild(btn)
      this.regionButtons.set(region.id, btn)
    }

    const learnTip = createPanelTip(BrainMappingStrings.learnMoreStringProperty.value, {
      width: tipWidth,
      fontSize: 12,
    })
    learnTip.left = 4
    panelContent.addChild(learnTip)

    const relayoutPanel = () => {
      let y = 8
      modesSection.left = 4
      modesSection.top = y
      y = modesSection.bottom + 6
      this.studyBtn.top = y
      y = this.studyBtn.bottom + 6
      this.quizBtn.top = y
      y = this.quizBtn.bottom + 6
      this.missionBtn.top = y
      y = this.missionBtn.bottom + 6
      this.scenarioBtn.top = y
      y = this.scenarioBtn.bottom + 6
      this.unlockHint.top = y
      y = this.unlockHint.visible ? this.unlockHint.bottom + 8 : y
      this.starsText.top = y
      y = this.starsText.bottom + 10

      this.tipsBtn.top = y
      y = this.tipsBtn.bottom + 6
      this.soundBtn.top = y
      y = this.soundBtn.bottom + 10

      displaySection.left = 4
      displaySection.top = y
      y = displaySection.bottom + 6
      this.bordersBtn.left = 4
      this.bordersBtn.top = y
      y = this.bordersBtn.bottom + 6
      this.calloutsBtn.left = 4
      this.calloutsBtn.top = y
      y = this.calloutsBtn.bottom + 6
      this.homunculusBtn.left = 4
      this.homunculusBtn.top = y
      y = this.homunculusBtn.bottom + 8
      glowSlider.top = y
      y = glowSlider.bottom + 10
      pulseSpeedSlider.top = y
      y = pulseSpeedSlider.bottom + 10
      labelScaleSlider.top = y
      y = labelScaleSlider.bottom + 12

      scenarioSection.left = 4
      scenarioSection.top = y
      y = scenarioSection.bottom + 6
      scenarioBikeBtn.left = 4
      scenarioBikeBtn.top = y
      y = scenarioBikeBtn.bottom + 6
      scenarioHearingBtn.left = 4
      scenarioHearingBtn.top = y
      scenarioCatchBtn.left = 4 + scenarioHalfW + 8
      scenarioCatchBtn.top = y
      y = scenarioHearingBtn.bottom + 12

      quizSettingsSection.left = 4
      quizSettingsSection.top = y
      y = quizSettingsSection.bottom + 6
      difficultySlider.top = y
      y = difficultySlider.bottom + 8
      this.autoTourBtn.left = 4
      this.autoTourBtn.top = y
      y = this.autoTourBtn.bottom + 12

      filterLabel.top = y
      y = filterLabel.bottom + 6
      const filterCols = 2
      const filterColGap = 8
      const filterRowGap = 6
      filterDefs.forEach((def, i) => {
        const btn = this.filterButtons.get(def.id)!
        const col = i % filterCols
        const row = Math.floor(i / filterCols)
        btn.left = 4 + col * (filterBtnW + filterColGap)
        btn.top = y + row * (28 + filterRowGap)
      })
      y += 2 * 28 + filterRowGap + 12

      this.exploredText.top = y
      y = this.exploredText.bottom + 4
      this.scoreText.top = y
      y = this.scoreText.bottom + 14

      checklistTitle.top = y
      y = checklistTitle.bottom + 6
      const checklistCols = 2
      const checklistColGap = 8
      const checklistRowGap = 6
      BRAIN_REGIONS.forEach((region, i) => {
        const row = this.checklistRows.get(region.id)!
        const col = i % checklistCols
        const rowIdx = Math.floor(i / checklistCols)
        row.left = 4 + col * (checklistColW + checklistColGap)
        row.top = y + rowIdx * (18 + checklistRowGap)
      })
      const checklistRows = Math.ceil(BRAIN_REGIONS.length / checklistCols)
      y += checklistRows * 18 + (checklistRows - 1) * checklistRowGap + 14

      this.streakChart.top = y
      y = this.streakChart.bottom + 14

      regionsHeader.top = y
      y = regionsHeader.bottom + 8
      const cols = 2
      const colGap = 8
      const rowGap = 8
      BRAIN_REGIONS.forEach((region, i) => {
        const btn = this.regionButtons.get(region.id)!
        const col = i % cols
        const row = Math.floor(i / cols)
        btn.left = 4 + col * (regionBtnW + colGap)
        btn.top = y + row * (34 + rowGap)
      })
      const rows = Math.ceil(BRAIN_REGIONS.length / cols)
      y += rows * 34 + (rows - 1) * rowGap + 14

      this.detailTitle.top = y
      y = this.detailTitle.bottom + 4
      this.detailPart.top = y
      y = this.detailPart.bottom + 6
      this.detailBody.top = y
      y = this.detailBody.bottom + 8
      this.detailExamples.top = y
      y = this.detailExamples.visible ? this.detailExamples.bottom + 12 : this.detailBody.bottom + 12

      learnTip.top = y
      bottomPad.top = learnTip.bottom + 4
    }

    const partLabelFor = (region: (typeof BRAIN_REGIONS)[number]): string => {
      if (region.part === 'cerebrum') {
        return 'Brain part: Cerebrum (one of four lobes)'
      }
      if (region.part === 'cerebellum') {
        return 'Brain part: Cerebellum (not a cerebrum lobe)'
      }
      return 'Brain part: Brain stem (not a cerebrum lobe)'
    }

    const fillDetail = (region: (typeof BRAIN_REGIONS)[number]) => {
      this.detailTitle.string = region.name
      this.detailPart.string = partLabelFor(region)
      this.detailBody.string = region.detail
      this.detailExamples.string = `Examples: ${region.examples.join(' · ')}`
    }

    const bottomPad = new Rectangle(0, 0, tipWidth, 56, {
      fill: 'rgba(255,255,255,0)',
      pickable: false,
    })
    panelContent.addChild(bottomPad)

    fillDetail(BRAIN_REGIONS[0])
    relayoutPanel()

    const scroller = new ScrollableNode(panelContent, rightW - 24, cardH - 56)
    scroller.left = 12
    scroller.top = 38
    card.content.addChild(scroller)

    this.addChild(
      new ResetAllButton({
        listener: () => {
          this.sounds.resetAll()
          model.reset()
          this.streakChart.clear()
          this.ripples.clear()
        },
        centerX: card.centerX,
        top: card.bottom + 2,
      }),
    )

    const syncSelection = () => {
      const selected = model.selectedProperty.value
      const glow = model.glowIntensityProperty.value
      const showBorders = model.showBordersProperty.value
      for (const region of BRAIN_REGIONS) {
        const path = this.regionPaths.get(region.id)!
        const halo = this.regionHalos.get(region.id)!
        const active = region.id === selected
        path.fill = active ? region.fillActive : region.fill
        if (active) {
          path.stroke = region.accent
        }
        else if (showBorders) {
          path.stroke = 'rgba(255,255,255,0.65)'
        }
        else {
          path.stroke = 'transparent'
        }
        path.lineWidth = active ? 3 : 1.8
        // Only the freshly-selected halo snaps up; deselected halos damp back down in step().
        if (active) {
          halo.opacity = 0.22 * glow
        }
        this.regionButtons.get(region.id)?.setSelected(active)
      }
      this.applyReveal()

      const region = BRAIN_REGIONS.find((r) => r.id === selected)!
      this.labelText.string = region.name
      const pad = 12
      const tw = Math.max(48, this.labelText.width)
      badgeBg.setRect(0, 0, tw + pad * 2, 28)
      badgeBg.stroke = region.accent
      const shadow = this.labelBadge.children[0] as Rectangle
      shadow.setRect(2, 3, tw + pad * 2, 28)
      this.labelText.centerX = badgeBg.width / 2
      this.labelText.centerY = 14
      this.labelBadge.centerX = region.label.x
      this.labelBadge.centerY = region.label.y

      this.labelFlash = 0.32
      fillDetail(region)
      syncCallouts()
      syncPartFilterOpacity()
      updateTriad()
      relayoutPanel()
    }

    const syncCallouts = () => {
      const show = model.showCalloutsProperty.value
      this.detailTitle.visible = show
      this.detailPart.visible = show
      this.detailBody.visible = show
      this.detailExamples.visible = show
      relayoutPanel()
    }

    const syncDisplayToggles = () => {
      const borders = model.showBordersProperty.value
      this.bordersBtn.setLabel(
        borders
          ? BrainMappingStrings.bordersOnStringProperty.value
          : BrainMappingStrings.bordersOffStringProperty.value,
      )
      this.bordersBtn.setSelected(borders)

      const callouts = model.showCalloutsProperty.value
      this.calloutsBtn.setLabel(
        callouts
          ? BrainMappingStrings.calloutsOnStringProperty.value
          : BrainMappingStrings.calloutsOffStringProperty.value,
      )
      this.calloutsBtn.setSelected(callouts)

      const hom = model.showHomunculusProperty.value
      this.homunculusBtn.setLabel(
        hom
          ? BrainMappingStrings.homunculusOnStringProperty.value
          : BrainMappingStrings.homunculusOffStringProperty.value,
      )
      this.homunculusBtn.setSelected(hom)
      this.homunculusTip.visible = hom

      const tour = model.autoTourProperty.value
      this.autoTourBtn.setLabel(
        tour
          ? BrainMappingStrings.autoTourOnStringProperty.value
          : BrainMappingStrings.autoTourOffStringProperty.value,
      )
      this.autoTourBtn.setSelected(tour)
    }

    const syncPartFilterOpacity = () => {
      const filter = model.partFilterProperty.value
      const selected = model.selectedProperty.value
      for (const region of BRAIN_REGIONS) {
        const path = this.regionPaths.get(region.id)!
        const dimmed = filter !== 'all' && region.part !== filter
        if (region.id !== selected) {
          path.opacity = dimmed ? 0.3 : 1
        }
      }
    }

    const syncPartFilter = () => {
      const filter = model.partFilterProperty.value
      for (const [id, btn] of this.filterButtons) {
        btn.setSelected(id === filter)
      }
      syncPartFilterOpacity()
    }

    const layoutTopPrompt = () => {
      const mode = model.modeProperty.value
      this.quizPrompt.string = mode === 'scenario'
        ? BrainMappingStrings.scenarioPromptStringProperty.value
        : this.model.currentQuestion().prompt
      this.quizPrompt.centerX = this.promptCenterX
      this.quizPrompt.maxWidth = this.promptMaxWidth
      this.promptBg.setRectWidth(Math.min(this.promptMaxWidth + 12, this.quizPrompt.width + 28))
      this.promptBg.setRectHeight(34)
      this.promptBg.centerX = this.quizPrompt.centerX
      this.promptBg.centerY = this.quizPrompt.centerY
    }

    const syncMode = () => {
      const mode = model.modeProperty.value
      this.studyBtn.setSelected(mode === 'study')
      this.quizBtn.setSelected(mode === 'quiz')
      this.missionBtn.setSelected(mode === 'mission')
      this.scenarioBtn.setSelected(mode === 'scenario')
      const showPrompt = mode === 'quiz' || mode === 'scenario'
      this.quizPrompt.visible = showPrompt
      this.promptBg.visible = showPrompt

      const title = BrainMappingStrings.guideTitleStringProperty.value
      if (model.celebrateProperty.value) {
        // celebrate handler owns guide text while active
      }
      else if (mode === 'quiz') {
        this.guide.setGuidance(title, BrainMappingStrings.guideQuizStringProperty.value)
        layoutTopPrompt()
      }
      else if (mode === 'mission') {
        this.guide.setGuidance(title, BrainMappingStrings.guideMissionStringProperty.value)
      }
      else if (mode === 'scenario') {
        this.guide.setGuidance(title, BrainMappingStrings.guideScenarioStringProperty.value)
        layoutTopPrompt()
      }
      else {
        this.guide.setGuidance(title, BrainMappingStrings.guideStudyStringProperty.value)
      }
      updateTriad()
    }

    const syncQuizUnlock = () => {
      const unlocked = model.quizUnlockedProperty.value
      this.quizBtn.opacity = unlocked ? 1 : 0.48
      this.unlockHint.visible = !unlocked
      if (!unlocked && model.modeProperty.value === 'quiz') {
        model.setMode('study')
      }
      relayoutPanel()
    }

    const syncStars = () => {
      this.starsText.string = `★ ${model.starsProperty.value}`
    }

    const syncChecklist = () => {
      for (const region of BRAIN_REGIONS) {
        const row = this.checklistRows.get(region.id)!
        const done = model.isExplored(region.id)
        row.string = `${done ? '✓' : '○'} ${region.name}`
        row.fill = done ? '#4ade80' : NervousColors.panelMuted
      }
      updateTriad()
    }

    const syncTips = () => {
      const visible = model.tipsVisibleProperty.value
      this.teachingTriad.visible = visible
      this.tipsBtn.setLabel(
        visible
          ? BrainMappingStrings.tipsOnStringProperty.value
          : BrainMappingStrings.tipsOffStringProperty.value,
      )
      this.tipsBtn.setSelected(visible)
    }

    let soundSyncedOnce = false
    const syncSound = () => {
      const on = model.soundEnabledProperty.value
      if (on) {
        // Enable first so the confirming chime below is actually audible.
        this.sounds.setEnabled(true)
        if (soundSyncedOnce) this.sounds.toggle(true)
      }
      else {
        if (soundSyncedOnce) this.sounds.toggle(false)
        this.sounds.setEnabled(false)
      }
      soundSyncedOnce = true
      this.soundBtn.setLabel(
        on
          ? BrainMappingStrings.soundOnStringProperty.value
          : BrainMappingStrings.soundOffStringProperty.value,
      )
      this.soundBtn.setSelected(on)
    }

    const updateTriad = () => {
      const region = BRAIN_REGIONS.find((r) => r.id === model.selectedProperty.value)!
      const why = shortenDetail(region.detail)
      const nextId = model.nextUnexploredId()
      let next: string
      if (nextId) {
        const nextRegion = BRAIN_REGIONS.find((r) => r.id === nextId)!
        next = BrainMappingStrings.nextTryRegionStringProperty.value.replace('{{name}}', nextRegion.name)
      }
      else if (model.quizUnlockedProperty.value && model.modeProperty.value !== 'quiz') {
        next = BrainMappingStrings.nextTryQuizStringProperty.value
      }
      else {
        next = BrainMappingStrings.nextKeepGoingStringProperty.value
      }
      this.teachingTriad.setTriad(region.action, why, next)
    }

    const syncStats = () => {
      this.exploredText.string = `${BrainMappingStrings.exploredStringProperty.value} ${model.exploredCountProperty.value} / ${BRAIN_REGIONS.length}`
      const attempts = model.quizAttemptsProperty.value
      this.scoreText.string =
        attempts > 0
          ? `${BrainMappingStrings.scoreStringProperty.value} ${model.quizScoreProperty.value} / ${attempts}`
          : `${BrainMappingStrings.scoreStringProperty.value} —`
      this.statusText.string = model.statusProperty.value
      if (model.modeProperty.value === 'quiz' || model.modeProperty.value === 'scenario') {
        layoutTopPrompt()
      }
      if (model.modeProperty.value === 'quiz') {
        if (model.lastAnswerProperty.value === 'correct') {
          this.guide.setGuidance(
            BrainMappingStrings.guideTitleStringProperty.value,
            BrainMappingStrings.guideCorrectStringProperty.value,
          )
          this.feedbackFlash.fill = 'rgba(39,174,96,0.12)'
        }
        else if (model.lastAnswerProperty.value === 'wrong') {
          this.guide.setGuidance(
            BrainMappingStrings.guideTitleStringProperty.value,
            BrainMappingStrings.guideWrongStringProperty.value,
          )
          this.feedbackFlash.fill = 'rgba(231,76,60,0.12)'
        }
        else if (!model.celebrateProperty.value) {
          this.feedbackFlash.fill = 'rgba(39,174,96,0)'
        }
      }
      else if (!model.celebrateProperty.value) {
        this.feedbackFlash.fill = 'rgba(39,174,96,0)'
      }

      const lastAnswer = model.lastAnswerProperty.value
      if (lastAnswer !== null && this.prevLastAnswer === null) {
        this.streakChart.push(this.streakSeries, lastAnswer === 'correct' ? 1 : 0)
      }
      this.prevLastAnswer = lastAnswer
    }

    const syncCelebrate = () => {
      const celebrating = model.celebrateProperty.value
      if (celebrating && !this.wasCelebrating) {
        this.sounds.celebrate()
        this.confettiWave()
        // Two more staggered waves so the celebration reads as a burst, not one flat pop.
        this.celebrateWavesLeft = 2
        this.celebrateWaveTimer = 0.28
        const title = BrainMappingStrings.guideTitleStringProperty.value
        if (model.quizRoundCompleteProperty.value) {
          this.guide.setGuidance(title, BrainMappingStrings.celebrateQuizStringProperty.value)
        }
        else if (model.missionCompleteProperty.value) {
          this.guide.setGuidance(title, BrainMappingStrings.celebrateMissionStringProperty.value)
        }
        else if (model.scenarioCompleteProperty.value) {
          this.guide.setGuidance(title, BrainMappingStrings.celebrateScenarioStringProperty.value)
        }
      }
      else if (!celebrating) {
        this.celebrateWavesLeft = 0
      }
      this.wasCelebrating = celebrating
    }

    model.selectedProperty.link(syncSelection)
    model.modeProperty.link(syncMode)
    model.partFilterProperty.link(syncPartFilter)
    model.quizUnlockedProperty.link(syncQuizUnlock)
    model.starsProperty.link(syncStars)
    model.celebrateProperty.link(syncCelebrate)
    model.exploredCountProperty.link(() => {
      syncStats()
      syncChecklist()
    })
    model.quizScoreProperty.link(syncStats)
    model.quizAttemptsProperty.link(syncStats)
    model.statusProperty.link(syncStats)
    model.quizIndexProperty.link(syncStats)
    model.lastAnswerProperty.link(syncStats)
    model.tipsVisibleProperty.link(syncTips)
    model.soundEnabledProperty.link(syncSound)
    model.glowIntensityProperty.link(() => syncSelection())
    model.showBordersProperty.link(() => syncSelection())
    model.showCalloutsProperty.link(syncCallouts)
    model.showHomunculusProperty.link(syncDisplayToggles)
    model.autoTourProperty.link(syncDisplayToggles)
    model.showBordersProperty.link(syncDisplayToggles)
    model.showCalloutsProperty.link(syncDisplayToggles)
    model.labelScaleProperty.link(() => {
      const base = model.labelScaleProperty.value
      this.labelBadge.setScaleMagnitude(base)
    })
    model.revealCorrectIdProperty.link(() => this.applyReveal())
    model.quizUnlockedProperty.link(() => updateTriad())

    // ── Sound + ripple cues (ecology pattern) ─────────────────────────────────
    model.selectedProperty.lazyLink((id) => {
      this.sounds.select()
      const region = BRAIN_REGIONS.find((r) => r.id === id)!
      const pt = brainRoot.localToParentPoint(new Vector2(region.label.x, region.label.y))
      this.ripples.burst(pt.x, pt.y, { color: region.accent, count: 3, maxR: 44, life: 0.45 })
    })
    model.modeProperty.lazyLink(() => this.sounds.modeChange())
    model.lastAnswerProperty.lazyLink((answer) => {
      if (answer === 'correct') this.sounds.correct()
      else if (answer === 'wrong') this.sounds.wrong()
    })
    model.revealCorrectIdProperty.lazyLink((id) => {
      if (id !== null) this.sounds.select()
    })

    syncQuizUnlock()
    syncStars()
    syncPartFilter()
    syncChecklist()
    syncTips()
    syncDisplayToggles()
    syncCallouts()
  }

  /** Overlays a gold outline on the correct region while a wrong quiz answer's reveal window is active. */
  private applyReveal(): void {
    const revealId = this.model.revealCorrectIdProperty.value
    const showBorders = this.model.showBordersProperty.value
    for (const [id, path] of this.regionPaths) {
      if (id === revealId) {
        path.stroke = REVEAL_STROKE
        path.lineWidth = 5
      }
      else if (id !== this.model.selectedProperty.value) {
        path.stroke = showBorders ? 'rgba(255,255,255,0.65)' : 'transparent'
        path.lineWidth = 1.8
      }
    }
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.pulse += dt
    this.confetti.step(dt, 55)
    this.ripples.step(dt)

    if (this.celebrateWavesLeft > 0) {
      this.celebrateWaveTimer -= dt
      if (this.celebrateWaveTimer <= 0) {
        this.celebrateWaveTimer = 0.28
        this.celebrateWavesLeft -= 1
        this.confettiWave()
      }
    }

    const selected = this.model.selectedProperty.value
    const filter = this.model.partFilterProperty.value
    const glow = this.model.glowIntensityProperty.value
    const revealId = this.model.revealCorrectIdProperty.value
    const pulseRate = this.model.pulseSpeedProperty.value

    // Region path opacity + a subtle selection scale-pulse (damped back to 1× when deselected).
    for (const [id, p] of this.regionPaths) {
      const center = this.regionCenter.get(id)!
      if (id === selected) {
        if (revealId !== selected) {
          p.opacity = 0.82 + 0.18 * Math.sin(this.pulse * 3.0 * pulseRate)
        }
        const scale = 1 + 0.018 * Math.sin(this.pulse * 3.0 * pulseRate)
        p.setScaleMagnitude(scale)
      }
      else {
        const region = BRAIN_REGIONS.find((r) => r.id === id)!
        const dimmed = filter !== 'all' && region.part !== filter
        p.opacity = dimmed ? 0.3 : 1
        p.setScaleMagnitude(1)
      }
      p.centerX = center.x
      p.centerY = center.y
    }

    // Halo opacity: selected/revealed regions pulse; everyone else damps toward its hover target.
    for (const [id, halo] of this.regionHalos) {
      if (id === selected) {
        halo.opacity = (0.16 + 0.1 * Math.sin(this.pulse * 3.0 * pulseRate)) * glow
      }
      else if (id === revealId) {
        halo.opacity = (0.3 + 0.2 * Math.sin(this.pulse * 8.0 * pulseRate)) * glow
      }
      else {
        const target = (this.haloTarget.get(id) ?? 0) * glow
        halo.opacity = damp(halo.opacity, target, 10, dt)
      }
    }

    if (this.labelFlash > 0) {
      this.labelFlash = Math.max(0, this.labelFlash - dt)
      const t = this.labelFlash / 0.32
      const scale = 1 + 0.22 * t
      this.labelBadge.setScaleMagnitude(this.model.labelScaleProperty.value * scale)
    }
    else {
      this.labelBadge.setScaleMagnitude(this.model.labelScaleProperty.value)
    }
  }

  /** One staggered wave of celebration confetti + a ripple ring at brain-center. */
  private confettiWave(): void {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#e67e22', '#1abc9c']
    for (let i = 0; i < 6; i++) {
      this.confetti.burst(
        this.brainCenterX + (Math.random() - 0.5) * 60,
        this.brainCenterY + (Math.random() - 0.5) * 40,
        {
          count: 14,
          color: colors[i % colors.length],
          speed: 100 + Math.random() * 50,
          life: 0.65,
          radius: 3.5,
        },
      )
    }
    this.ripples.burst(this.brainCenterX, this.brainCenterY, {
      color: 'rgba(217,119,6,0.75)',
      count: 3,
      maxR: 80,
      life: 0.7,
    })
  }
}
