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
  type BrainPart,
  type BrainRegionId,
} from '../model/brainRegions.js'
import { NervousConstants } from '../../../shared/NervousConstants.js'
import { NervousColors } from '../../../shared/NervousColors.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { SoftButton } from '../../../shared/ui/SoftButton.js'
import { GuidanceBanner } from '../../../shared/ui/GuidanceBanner.js'
import { ScrollableNode } from '../../../shared/ui/ScrollableNode.js'
import { createPanelTip } from '../../../shared/ui/createPanelTip.js'
import { ParticleBurst } from '../../../shared/ui/ParticleBurst.js'
import { BrainMappingStrings } from '../BrainMappingStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

type PartFilterId = BrainPart | 'all'

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
  private readonly filterButtons = new Map<PartFilterId, SoftButton>()
  private readonly regionButtons = new Map<BrainRegionId, SoftButton>()
  private readonly guide: GuidanceBanner
  private readonly feedbackFlash: Rectangle
  private readonly confetti: ParticleBurst
  private readonly brainCenterX: number
  private readonly brainCenterY: number
  private pulse = 0
  private labelFlash = 0
  private wasCelebrating = false

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
    this.brainCenterX = bx + bw / 2
    this.brainCenterY = by + bh / 2

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

    this.confetti = new ParticleBurst(120)
    this.addChild(this.confetti)

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

    this.studyBtn = new SoftButton(BrainMappingStrings.studyStringProperty.value, () => {
      model.setMode('study')
    }, { width: modeBtnW, height: 38, fill: NervousColors.accent, selected: true })
    this.studyBtn.left = 4
    panelContent.addChild(this.studyBtn)

    this.quizBtn = new SoftButton(BrainMappingStrings.quizStringProperty.value, () => {
      model.setMode('quiz')
    }, { width: modeBtnW, height: 38, fill: '#64748b', selected: false })
    this.quizBtn.left = 4
    panelContent.addChild(this.quizBtn)

    this.missionBtn = new SoftButton(BrainMappingStrings.missionStringProperty.value, () => {
      model.setMode('mission')
    }, { width: modeBtnW, height: 38, fill: '#10b981', selected: false })
    this.missionBtn.left = 4
    panelContent.addChild(this.missionBtn)

    this.unlockHint = new Text(BrainMappingStrings.unlockQuizStringProperty.value, {
      font: new PhetFont({ size: 12 }),
      fill: NervousColors.muted,
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

    const filterLabel = new Text(BrainMappingStrings.filterLabelStringProperty.value, {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: NervousColors.ink,
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
      })
      panelContent.addChild(btn)
      this.filterButtons.set(def.id, btn)
    }

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
      y = this.studyBtn.bottom + 8
      this.quizBtn.top = y
      y = this.quizBtn.bottom + 8
      this.missionBtn.top = y
      y = this.missionBtn.bottom + 6
      this.unlockHint.top = y
      y = this.unlockHint.visible ? this.unlockHint.bottom + 8 : y
      this.starsText.top = y
      y = this.starsText.bottom + 10

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
      y = this.detailExamples.bottom + 12

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

      this.labelFlash = 0.32
      fillDetail(region)
      syncPartFilterOpacity()
      relayoutPanel()
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

    const syncMode = () => {
      const mode = model.modeProperty.value
      this.studyBtn.setSelected(mode === 'study')
      this.quizBtn.setSelected(mode === 'quiz')
      this.missionBtn.setSelected(mode === 'mission')
      this.quizPrompt.visible = mode === 'quiz'
      this.promptBg.visible = mode === 'quiz'

      const title = BrainMappingStrings.guideTitleStringProperty.value
      if (model.celebrateProperty.value) {
        // celebrate handler owns guide text while active
      }
      else if (mode === 'quiz') {
        this.guide.setGuidance(title, BrainMappingStrings.guideQuizStringProperty.value)
        this.layoutQuizPrompt(stageLeft, stageW)
      }
      else if (mode === 'mission') {
        this.guide.setGuidance(title, BrainMappingStrings.guideMissionStringProperty.value)
      }
      else {
        this.guide.setGuidance(title, BrainMappingStrings.guideStudyStringProperty.value)
      }
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

    const syncStats = () => {
      this.exploredText.string = `${BrainMappingStrings.exploredStringProperty.value} ${model.exploredCountProperty.value} / ${BRAIN_REGIONS.length}`
      const attempts = model.quizAttemptsProperty.value
      this.scoreText.string =
        attempts > 0
          ? `${BrainMappingStrings.scoreStringProperty.value} ${model.quizScoreProperty.value} / ${attempts}`
          : `${BrainMappingStrings.scoreStringProperty.value} —`
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
        else if (!model.celebrateProperty.value) {
          this.feedbackFlash.fill = 'rgba(39,174,96,0)'
        }
      }
      else if (!model.celebrateProperty.value) {
        this.feedbackFlash.fill = 'rgba(39,174,96,0)'
      }
    }

    const syncCelebrate = () => {
      const celebrating = model.celebrateProperty.value
      if (celebrating && !this.wasCelebrating) {
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
        const title = BrainMappingStrings.guideTitleStringProperty.value
        if (model.quizRoundCompleteProperty.value) {
          this.guide.setGuidance(title, BrainMappingStrings.celebrateQuizStringProperty.value)
        }
        else if (model.missionCompleteProperty.value) {
          this.guide.setGuidance(title, BrainMappingStrings.celebrateMissionStringProperty.value)
        }
      }
      this.wasCelebrating = celebrating
    }

    model.selectedProperty.link(syncSelection)
    model.modeProperty.link(syncMode)
    model.partFilterProperty.link(syncPartFilter)
    model.quizUnlockedProperty.link(syncQuizUnlock)
    model.starsProperty.link(syncStars)
    model.celebrateProperty.link(syncCelebrate)
    model.exploredCountProperty.link(syncStats)
    model.quizScoreProperty.link(syncStats)
    model.quizAttemptsProperty.link(syncStats)
    model.statusProperty.link(syncStats)
    model.quizIndexProperty.link(syncStats)
    model.lastAnswerProperty.link(syncStats)

    syncQuizUnlock()
    syncStars()
    syncPartFilter()
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
    this.confetti.step(dt, 55)

    const selected = this.model.selectedProperty.value
    const filter = this.model.partFilterProperty.value
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
        const region = BRAIN_REGIONS.find((r) => r.id === id)!
        const dimmed = filter !== 'all' && region.part !== filter
        p.opacity = dimmed ? 0.3 : 1
      }
    }

    if (this.labelFlash > 0) {
      this.labelFlash = Math.max(0, this.labelFlash - dt)
      const t = this.labelFlash / 0.32
      const scale = 1 + 0.22 * t
      this.labelBadge.setScaleMagnitude(scale)
    }
    else {
      this.labelBadge.setScaleMagnitude(1)
    }
  }
}
