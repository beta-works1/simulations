import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Matrix3 } from 'scenerystack/dot'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { BrainMappingModel } from '../model/BrainMappingModel.js'
import {
  BRAIN_REGIONS,
  CEREBRUM_OUTLINE,
  SVG_H,
  SVG_W,
  type BrainRegionId,
} from '../model/brainRegions.js'
import { NervousConstants } from '../../../shared/NervousConstants.js'
import { NervousColors } from '../../../shared/NervousColors.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { SoftButton } from '../../../shared/ui/SoftButton.js'
import { GuidanceBanner } from '../../../shared/ui/GuidanceBanner.js'
import { ScrollableNode } from '../../../shared/ui/ScrollableNode.js'
import { createPanelTip } from '../../../shared/ui/createPanelTip.js'
import { BrainMappingStrings } from '../BrainMappingStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

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
  private readonly studyBtn: SoftButton
  private readonly quizBtn: SoftButton
  private readonly regionButtons = new Map<BrainRegionId, SoftButton>()
  private readonly guide: GuidanceBanner
  private readonly feedbackFlash: Rectangle
  private pulse = 0

  public constructor(model: BrainMappingModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const m = NervousConstants.SCREEN_VIEW_X_MARGIN
    const my = NervousConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    const rightW = 290
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
      new Rectangle(stageLeft + 5, stageTop + 8, stageW, stageH, {
        cornerRadius: 18,
        fill: 'rgba(15,23,42,0.12)',
      }),
    )
    this.addChild(
      new Rectangle(stageLeft, stageTop, stageW, stageH, {
        cornerRadius: 18,
        fill: '#f4f6f8',
        stroke: 'rgba(71,85,105,0.2)',
        lineWidth: 1.5,
      }),
    )
    this.addChild(
      new Rectangle(stageLeft + 14, stageTop + 8, stageW - 28, 5, {
        cornerRadius: 3,
        fill: 'rgba(255,255,255,0.75)',
        pickable: false,
      }),
    )

    this.feedbackFlash = new Rectangle(stageLeft, stageTop, stageW, stageH, {
      cornerRadius: 18,
      fill: 'rgba(39,174,96,0)',
      pickable: false,
    })
    this.addChild(this.feedbackFlash)

    const bw = Math.min(stageW * 0.9, (stageH - 80) * 0.95)
    const bh = bw * (SVG_H / SVG_W)
    const bx = stageLeft + (stageW - bw) / 2
    const by = stageTop + (stageH - bh) / 2 - 6

    const brainRoot = new Node({
      matrix: Matrix3.translation(bx, by).timesMatrix(Matrix3.scaling(bw / SVG_W, bh / SVG_H)),
    })
    this.addChild(brainRoot)

    // Soft drop shadow for brain
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
      brainRoot.addChild(halo)

      const path = new Path(new Shape(region.pathD), {
        fill: region.fill,
        stroke: 'rgba(255,255,255,0.65)',
        lineWidth: 1.8,
        cursor: 'pointer',
      })
      path.addInputListener({
        down: () => model.selectRegion(id),
        enter: () => {
          if (model.selectedProperty.value !== id) {
            path.fill = region.fillHover
            halo.opacity = 0.18
          }
        },
        exit: () => {
          if (model.selectedProperty.value !== id) {
            path.fill = region.fill
            halo.opacity = 0
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

    this.quizPrompt = new Text('', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: '#fff',
      centerX: stageLeft + stageW / 2,
      top: stageTop + 14,
      maxWidth: stageW - 48,
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

    // Full panel height; Reset sits under the card so it never covers tip text.
    const resetGap = 52
    const cardH = stageH - resetGap
    const card = new DepthCard(rightW, cardH, { title: BrainMappingStrings.modeStringProperty.value })
    card.left = stageLeft + stageW + gap
    card.top = stageTop
    this.addChild(card)

    const panelContent = new Node()
    const tipWidth = rightW - 48

    this.studyBtn = new SoftButton(BrainMappingStrings.studyStringProperty.value, () => {
      model.setMode('study')
    }, { width: rightW - 40, height: 40, fill: NervousColors.accent, selected: true })
    this.studyBtn.left = 4
    panelContent.addChild(this.studyBtn)

    this.quizBtn = new SoftButton(BrainMappingStrings.quizStringProperty.value, () => {
      model.setMode('quiz')
    }, { width: rightW - 40, height: 40, fill: '#0ea5e9', selected: false })
    this.quizBtn.left = 4
    panelContent.addChild(this.quizBtn)

    this.exploredText = new Text('Explored 1 / 6', {
      font: new PhetFont({ size: 14, weight: 'bold' }),
      fill: NervousColors.ink,
      left: 4,
    })
    this.scoreText = new Text('Score —', {
      font: new PhetFont({ size: 14, weight: 'bold' }),
      fill: NervousColors.muted,
      left: 4,
    })
    panelContent.addChild(this.exploredText)
    panelContent.addChild(this.scoreText)

    this.detailTitle = new Text('', {
      font: new PhetFont({ size: 16, weight: 'bold' }),
      fill: NervousColors.accent,
      left: 4,
      maxWidth: tipWidth,
    })
    this.detailPart = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: NervousColors.muted,
      left: 4,
      maxWidth: tipWidth,
    })
    this.detailBody = createPanelTip('', {
      width: tipWidth,
      fontSize: 17,
    })
    this.detailBody.left = 4
    this.detailExamples = createPanelTip('', {
      width: tipWidth,
      fontSize: 16,
    })
    this.detailExamples.left = 4
    panelContent.addChild(this.detailTitle)
    panelContent.addChild(this.detailPart)
    panelContent.addChild(this.detailBody)
    panelContent.addChild(this.detailExamples)

    const regionsHeader = new Text(BrainMappingStrings.regionsStringProperty.value, {
      font: new PhetFont({ size: 14, weight: 'bold' }),
      fill: NervousColors.ink,
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
      })
      panelContent.addChild(btn)
      this.regionButtons.set(region.id, btn)
    }

    const learnTip = createPanelTip(BrainMappingStrings.learnMoreStringProperty.value, {
      width: tipWidth,
      fontSize: 17,
    })
    learnTip.left = 4
    panelContent.addChild(learnTip)

    const relayoutPanel = () => {
      let y = 8
      this.studyBtn.top = y
      y = this.studyBtn.bottom + 10
      this.quizBtn.top = y
      y = this.quizBtn.bottom + 14

      this.exploredText.top = y
      y = this.exploredText.bottom + 4
      this.scoreText.top = y
      y = this.scoreText.bottom + 14

      // Detail first so the region explanation is visible without scrolling.
      this.detailTitle.top = y
      y = this.detailTitle.bottom + 4
      this.detailPart.top = y
      y = this.detailPart.bottom + 6
      this.detailBody.top = y
      y = this.detailBody.bottom + 8
      this.detailExamples.top = y
      y = this.detailExamples.bottom + 16

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

    // Invisible spacer so the last tip line can scroll fully into view.
    const bottomPad = new Rectangle(0, 0, 1, 48, { fill: null, pickable: false })
    panelContent.addChild(bottomPad)

    fillDetail(BRAIN_REGIONS[0])
    relayoutPanel()

    const scroller = new ScrollableNode(panelContent, rightW - 24, cardH - 48)
    scroller.left = 12
    scroller.top = 40
    card.content.addChild(scroller)

    this.addChild(
      new ResetAllButton({
        listener: () => model.reset(),
        centerX: card.centerX,
        top: card.bottom + 2,
      }),
    )

    const syncSelection = () => {
      const selected = model.selectedProperty.value
      for (const region of BRAIN_REGIONS) {
        const path = this.regionPaths.get(region.id)!
        const halo = this.regionHalos.get(region.id)!
        const active = region.id === selected
        path.fill = active ? region.fillActive : region.fill
        path.stroke = active ? region.accent : 'rgba(255,255,255,0.65)'
        path.lineWidth = active ? 3 : 1.8
        halo.opacity = active ? 0.22 : 0
        this.regionButtons.get(region.id)?.setSelected(active)
      }

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

      fillDetail(region)
      relayoutPanel()
    }

    const syncMode = () => {
      const quiz = model.modeProperty.value === 'quiz'
      this.studyBtn.setSelected(!quiz)
      this.quizBtn.setSelected(quiz)
      this.quizPrompt.visible = quiz
      this.promptBg.visible = quiz
      this.guide.setGuidance(
        BrainMappingStrings.guideTitleStringProperty.value,
        quiz
          ? BrainMappingStrings.guideQuizStringProperty.value
          : BrainMappingStrings.guideStudyStringProperty.value,
      )
      if (quiz) {
        this.layoutQuizPrompt(stageLeft, stageW)
      }
    }

    const syncStats = () => {
      this.exploredText.string = `Explored ${model.exploredCountProperty.value} / ${BRAIN_REGIONS.length}`
      const attempts = model.quizAttemptsProperty.value
      this.scoreText.string =
        attempts > 0
          ? `Score ${model.quizScoreProperty.value} / ${attempts}`
          : 'Score —'
      this.statusText.string = model.statusProperty.value
      if (model.modeProperty.value === 'quiz') {
        this.layoutQuizPrompt(stageLeft, stageW)
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
        else {
          this.feedbackFlash.fill = 'rgba(39,174,96,0)'
        }
      }
      else {
        this.feedbackFlash.fill = 'rgba(39,174,96,0)'
      }
    }

    model.selectedProperty.link(syncSelection)
    model.modeProperty.link(syncMode)
    model.exploredCountProperty.link(syncStats)
    model.quizScoreProperty.link(syncStats)
    model.quizAttemptsProperty.link(syncStats)
    model.statusProperty.link(syncStats)
    model.quizIndexProperty.link(syncStats)
    model.lastAnswerProperty.link(syncStats)
  }

  private layoutQuizPrompt(stageLeft: number, stageW: number): void {
    this.quizPrompt.string = this.model.currentQuestion().prompt
    this.quizPrompt.centerX = stageLeft + stageW / 2
    this.promptBg.setRectWidth(Math.min(stageW - 40, this.quizPrompt.width + 28))
    this.promptBg.setRectHeight(34)
    this.promptBg.centerX = this.quizPrompt.centerX
    this.promptBg.centerY = this.quizPrompt.centerY
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.pulse += dt
    const selected = this.model.selectedProperty.value
    const path = this.regionPaths.get(selected)
    const halo = this.regionHalos.get(selected)
    if (path) {
      path.opacity = 0.82 + 0.18 * Math.sin(this.pulse * 3.0)
    }
    if (halo) {
      halo.opacity = 0.16 + 0.1 * Math.sin(this.pulse * 3.0)
    }
    for (const [id, p] of this.regionPaths) {
      if (id !== selected) {
        p.opacity = 1
      }
    }
  }
}
