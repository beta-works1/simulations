import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Node, Path, Rectangle, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Matrix3 } from 'scenerystack/dot'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { BrainMappingModel } from '../model/BrainMappingModel.js'
import {
  BRAIN_PARTS,
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
import { BrainMappingStrings } from '../BrainMappingStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

export class BrainMappingScreenView extends ScreenView {
  private readonly model: BrainMappingModel
  private readonly regionPaths = new Map<BrainRegionId, Path>()
  private readonly labelBadge: Node
  private readonly labelText: Text
  private readonly statusText: Text
  private readonly quizPrompt: Text
  private readonly detailTitle: Text
  private readonly detailBody: Text
  private readonly detailExamples: Text
  private readonly exploredText: Text
  private readonly scoreText: Text
  private readonly studyBtn: SoftButton
  private readonly quizBtn: SoftButton
  private readonly regionButtons = new Map<BrainRegionId, SoftButton>()
  private pulse = 0

  public constructor(model: BrainMappingModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const m = NervousConstants.SCREEN_VIEW_X_MARGIN
    const my = NervousConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    const rightW = 280
    const gap = 14
    const stageLeft = m
    const stageTop = my
    const stageW = lb.width - m * 2 - rightW - gap
    const stageH = lb.height - my * 2

    this.addChild(
      new Rectangle(stageLeft + 4, stageTop + 6, stageW, stageH, {
        cornerRadius: 16,
        fill: 'rgba(15,23,42,0.1)',
      }),
    )
    this.addChild(
      new Rectangle(stageLeft, stageTop, stageW, stageH, {
        cornerRadius: 16,
        fill: '#f4f6f8',
        stroke: 'rgba(71,85,105,0.18)',
        lineWidth: 1.5,
      }),
    )

    const bw = Math.min(stageW * 0.9, (stageH - 70) * 0.95)
    const bh = bw * (SVG_H / SVG_W)
    const bx = stageLeft + (stageW - bw) / 2
    const by = stageTop + (stageH - bh) / 2 - 8

    const brainRoot = new Node({
      matrix: Matrix3.translation(bx, by).timesMatrix(Matrix3.scaling(bw / SVG_W, bh / SVG_H)),
    })
    this.addChild(brainRoot)

    brainRoot.addChild(
      new Path(new Shape(CEREBRUM_OUTLINE), {
        fill: '#e8b896',
        stroke: '#5a3b2a',
        lineWidth: 2.4,
        pickable: false,
      }),
    )

    // Draw larger lobes first, small structures last so stem/cerebellum stay clickable
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
      const path = new Path(new Shape(region.pathD), {
        fill: region.fill,
        stroke: 'rgba(255,255,255,0.55)',
        lineWidth: 1.5,
        cursor: 'pointer',
      })
      path.addInputListener({
        down: () => model.selectRegion(id),
        enter: () => {
          if (model.selectedProperty.value !== id) {
            path.fill = region.fillHover
          }
        },
        exit: () => {
          if (model.selectedProperty.value !== id) {
            path.fill = region.fill
          }
        },
      })
      this.regionPaths.set(id, path)
      brainRoot.addChild(path)
    }

    this.labelBadge = new Node({ pickable: false })
    this.labelText = new Text('', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#1a252f',
    })
    const badgeBg = new Rectangle(0, 0, 10, 22, {
      cornerRadius: 8,
      fill: 'rgba(255,255,255,0.96)',
      stroke: '#e74c3c',
      lineWidth: 1.8,
    })
    this.labelBadge.addChild(badgeBg)
    this.labelBadge.addChild(this.labelText)
    brainRoot.addChild(this.labelBadge)

    this.quizPrompt = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#fff',
      centerX: stageLeft + stageW / 2,
      top: stageTop + 12,
      maxWidth: stageW - 40,
      visible: false,
      pickable: false,
    })
    const promptBg = new Rectangle(0, 0, 100, 28, {
      cornerRadius: 10,
      fill: 'rgba(21,32,51,0.9)',
      visible: false,
      pickable: false,
    })
    this.addChild(promptBg)
    this.addChild(this.quizPrompt)

    this.statusText = new Text('', {
      font: new PhetFont({ size: 12 }),
      fill: NervousColors.ink,
      left: stageLeft + 20,
      bottom: stageTop + stageH - 16,
      maxWidth: stageW - 40,
      pickable: false,
    })
    this.addChild(
      new Rectangle(stageLeft + 14, stageTop + stageH - 44, stageW - 28, 32, {
        cornerRadius: 8,
        fill: '#fff',
        stroke: 'rgba(71,85,105,0.25)',
      }),
    )
    this.addChild(this.statusText)

    // Controls
    const card = new DepthCard(rightW, stageH - 56, { title: BrainMappingStrings.modeStringProperty.value })
    card.left = stageLeft + stageW + gap
    card.top = stageTop
    this.addChild(card)

    this.studyBtn = new SoftButton(BrainMappingStrings.studyStringProperty.value, () => {
      model.setMode('study')
    }, { width: rightW - 28, fill: NervousColors.accent, selected: true })
    this.studyBtn.left = 14
    this.studyBtn.top = 40
    card.content.addChild(this.studyBtn)

    this.quizBtn = new SoftButton(BrainMappingStrings.quizStringProperty.value, () => {
      model.setMode('quiz')
    }, { width: rightW - 28, fill: '#0ea5e9', selected: false })
    this.quizBtn.left = 14
    this.quizBtn.top = 82
    card.content.addChild(this.quizBtn)

    this.exploredText = new Text('Explored 1 / 6', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: NervousColors.ink,
      left: 14,
      top: 130,
    })
    this.scoreText = new Text('Score —', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: NervousColors.muted,
      left: 14,
      top: 150,
    })
    card.content.addChild(this.exploredText)
    card.content.addChild(this.scoreText)

    this.detailTitle = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: NervousColors.accent,
      left: 14,
      top: 180,
      maxWidth: rightW - 28,
    })
    this.detailBody = new Text('', {
      font: new PhetFont(11),
      fill: NervousColors.ink,
      left: 14,
      top: 202,
      maxWidth: rightW - 28,
    })
    this.detailExamples = new Text('', {
      font: new PhetFont(11),
      fill: NervousColors.muted,
      left: 14,
      top: 270,
      maxWidth: rightW - 28,
    })
    card.content.addChild(this.detailTitle)
    card.content.addChild(this.detailBody)
    card.content.addChild(this.detailExamples)

    let yBtn = 330
    for (const region of BRAIN_REGIONS) {
      const btn = new SoftButton(region.name, () => model.selectRegion(region.id), {
        width: rightW - 28,
        height: 28,
        fill: region.accent,
        selected: region.id === 'frontal',
      })
      btn.left = 14
      btn.top = yBtn
      yBtn += 34
      card.content.addChild(btn)
      this.regionButtons.set(region.id, btn)
    }

    this.addChild(
      new ResetAllButton({
        listener: () => model.reset(),
        right: lb.right - m,
        bottom: lb.bottom - my,
      }),
    )

    const syncSelection = () => {
      const selected = model.selectedProperty.value
      for (const region of BRAIN_REGIONS) {
        const path = this.regionPaths.get(region.id)!
        const active = region.id === selected
        path.fill = active ? region.fillActive : region.fill
        path.stroke = active ? region.accent : 'rgba(255,255,255,0.55)'
        path.lineWidth = active ? 2.8 : 1.5
        this.regionButtons.get(region.id)?.setSelected(active)
      }

      const region = BRAIN_REGIONS.find((r) => r.id === selected)!
      this.labelText.string = region.name
      const pad = 10
      const tw = Math.max(40, this.labelText.width)
      badgeBg.setRect(0, 0, tw + pad * 2, 22)
      badgeBg.stroke = region.accent
      this.labelText.centerX = badgeBg.width / 2
      this.labelText.centerY = 11
      this.labelBadge.centerX = region.label.x
      this.labelBadge.centerY = region.label.y

      const part = BRAIN_PARTS.find((p) => p.id === region.part)
      this.detailTitle.string = region.name
      this.detailBody.string = `${part?.label ?? ''}: ${region.detail}`
      this.detailExamples.string = `Examples: ${region.examples.join(' · ')}`
    }

    const syncMode = () => {
      const quiz = model.modeProperty.value === 'quiz'
      this.studyBtn.setSelected(!quiz)
      this.quizBtn.setSelected(quiz)
      this.quizPrompt.visible = quiz
      promptBg.visible = quiz
      if (quiz) {
        this.quizPrompt.string = model.currentQuestion().prompt
        this.quizPrompt.centerX = stageLeft + stageW / 2
        promptBg.setRectWidth(Math.min(stageW - 40, this.quizPrompt.width + 24))
        promptBg.centerX = this.quizPrompt.centerX
        promptBg.centerY = this.quizPrompt.centerY
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
        this.quizPrompt.string = model.currentQuestion().prompt
        this.quizPrompt.centerX = stageLeft + stageW / 2
        promptBg.setRectWidth(Math.min(stageW - 40, this.quizPrompt.width + 24))
        promptBg.centerX = this.quizPrompt.centerX
        promptBg.centerY = this.quizPrompt.centerY
      }
    }

    model.selectedProperty.link(syncSelection)
    model.modeProperty.link(syncMode)
    model.exploredCountProperty.link(syncStats)
    model.quizScoreProperty.link(syncStats)
    model.quizAttemptsProperty.link(syncStats)
    model.statusProperty.link(syncStats)
    model.quizIndexProperty.link(syncStats)
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.pulse += dt
    const selected = this.model.selectedProperty.value
    const path = this.regionPaths.get(selected)
    if (path) {
      const glow = 0.75 + 0.25 * Math.sin(this.pulse * 3.2)
      path.opacity = glow
    }
    for (const [id, p] of this.regionPaths) {
      if (id !== selected) {
        p.opacity = 1
      }
    }
  }
}
