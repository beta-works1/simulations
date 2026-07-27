import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Node, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { PressureForceAreaModel, PressureScenario } from '../model/PressureForceAreaModel.js'
import { ForcesConstants, clamp } from '../../../shared/ForcesConstants.js'
import { ForcesColors } from '../../../shared/ForcesColors.js'
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
import { ForcesSounds } from '../../../shared/ForcesSounds.js'
import { PressureForceAreaStrings } from '../PressureForceAreaStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SCENARIOS: readonly PressureScenario[] = ['explore', 'nail', 'shoe']

const SCENARIO_GUIDE: Record<PressureScenario, string> = {
  explore: PressureForceAreaStrings.guideExploreStringProperty.value,
  nail: PressureForceAreaStrings.guideNailStringProperty.value,
  shoe: PressureForceAreaStrings.guideShoeStringProperty.value,
}

const SCENARIO_TRIAD: Record<PressureScenario, [string, string, string]> = {
  explore: [
    'Exploring P = F ÷ A.',
    'Pressure measures how concentrated a force is over a contact area.',
    'Try Nail tip for high pressure.',
  ],
  nail: [
    'Sharp nail tip.',
    'Tiny contact area concentrates force — pressure becomes very high.',
    'Compare with Wide shoe.',
  ],
  shoe: [
    'Wide shoe sole.',
    'The same force spread over a large area gives low pressure.',
    'Return to Explore to test your own values.',
  ],
}

const SCENARIO_LABELS: Record<PressureScenario, string> = {
  explore: PressureForceAreaStrings.scenarioExploreStringProperty.value,
  nail: PressureForceAreaStrings.scenarioNailStringProperty.value,
  shoe: PressureForceAreaStrings.scenarioShoeStringProperty.value,
}

export class PressureForceAreaScreenView extends ScreenView {
  private readonly model: PressureForceAreaModel
  private readonly sounds: ForcesSounds
  private readonly particles: ParticleBurst
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly leftLearnTip: Node
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private tipTimer = 0

  private readonly stageTop: number
  private readonly stageW: number
  private readonly stageH: number
  private readonly stageCenterX: number
  private readonly surfaceY: number

  private readonly blockRect: Rectangle
  private readonly imprintRect: Rectangle
  private readonly pressureText: Text
  private readonly captionText: Text
  private readonly labelsLayer: Node
  private readonly formulaText: Text
  private readonly formulaLayer: Node

  private scenarioButtons!: Record<PressureScenario, SoftButton>
  private runningToggleBtn!: SoftButton
  private labelsBtn!: SoftButton
  private imprintBtn!: SoftButton
  private formulaBtn!: SoftButton
  private playPauseBtn!: SoftButton
  private soundBtn!: SoftButton
  private starsText!: Text
  private statusText!: RichText

  public constructor(model: PressureForceAreaModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const sounds = new ForcesSounds()
    this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })

    const m = ForcesConstants.SCREEN_VIEW_X_MARGIN
    const my = ForcesConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    const leftW = 190
    const rightW = 290
    const gap = 14
    const stageLeft = m + leftW + gap
    const stageTop = my + 78
    const stageW = lb.width - m * 2 - leftW - gap - rightW - gap
    const stageH = lb.height - my * 2 - 78
    const stageCenterX = stageLeft + stageW / 2
    this.stageTop = stageTop
    this.stageW = stageW
    this.stageH = stageH
    this.stageCenterX = stageCenterX
    this.surfaceY = stageTop + stageH * 0.62

    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: PressureForceAreaStrings.guideTitleStringProperty.value,
      body: SCENARIO_GUIDE.explore,
    })
    this.guide.left = m
    this.guide.top = my
    this.addChild(this.guide)

    const leftCard = new DepthCard(leftW, stageH, { variant: 'light' })
    leftCard.left = m
    leftCard.top = stageTop
    this.addChild(leftCard)

    this.teachingTriad = new TeachingTriad(leftW - 24)
    this.teachingTriad.left = 12
    this.teachingTriad.top = 12
    leftCard.content.addChild(this.teachingTriad)

    this.leftLearnTip = createPanelTip(PressureForceAreaStrings.learnMoreStringProperty.value, {
      width: leftW - 24,
      fontSize: 11,
      fill: ForcesColors.panelMuted,
    })
    this.leftLearnTip.left = 12
    this.leftLearnTip.top = this.teachingTriad.bottom + 16
    leftCard.content.addChild(this.leftLearnTip)

    this.addChild(new StageBackdrop(stageLeft, stageTop, stageW, stageH, { top: '#c7d2e0', bottom: '#eef2f7' }))

    this.addChild(
      new Text(PressureForceAreaStrings.stageTitleStringProperty.value, {
        font: new PhetFont({ size: 18, weight: 'bold' }),
        fill: '#0f172a',
        centerX: stageCenterX,
        top: stageTop + 10,
      }),
    )

    this.captionText = new Text('', {
      font: new PhetFont({ size: 14, weight: 'bold' }),
      fill: ForcesColors.accent,
      centerX: stageCenterX,
      top: stageTop + 36,
    })
    this.addChild(this.captionText)

    this.blockRect = new Rectangle(0, 0, 80, 36, { fill: '#85929e', stroke: '#2c3e50', lineWidth: 2, cornerRadius: 6 })
    this.addChild(this.blockRect)

    this.imprintRect = new Rectangle(0, 0, 40, 8, { fill: 'rgba(231,76,60,0.5)' })
    this.addChild(this.imprintRect)

    this.addChild(new Rectangle(stageLeft + stageW * 0.08, this.surfaceY, stageW * 0.84, 4, { fill: '#bdc3c7' }))

    this.pressureText = new Text('', {
      font: new PhetFont({ size: 16, weight: 'bold' }),
      fill: '#c0392b',
      centerX: stageCenterX,
    })
    this.addChild(this.pressureText)

    this.formulaText = new Text(PressureForceAreaStrings.pressureLabelStringProperty.value, {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#0f172a',
      centerX: stageCenterX,
    })
    this.formulaLayer = new Node({ pickable: false })
    this.formulaLayer.addChild(this.formulaText)
    this.addChild(this.formulaLayer)

    this.labelsLayer = new Node({ pickable: false })
    this.labelsLayer.addChild(
      new Text(PressureForceAreaStrings.surfaceLabelStringProperty.value, {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#0f172a',
        left: stageLeft + 16,
        top: this.surfaceY + 12,
      }),
    )
    this.addChild(this.labelsLayer)

    this.particles = new ParticleBurst(70)
    this.addChild(this.particles)

    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = stageCenterX
    this.tipCard.top = stageTop + 12
    this.tipCard.visible = false
    this.tipCard.content.addChild(
      new Text(PressureForceAreaStrings.tipTitleStringProperty.value, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: ForcesColors.accent,
        left: 14,
        top: 10,
      }),
    )
    this.tipBodyText = new RichText('', {
      font: new PhetFont(12),
      fill: ForcesColors.ink,
      lineWrap: 222,
      leading: 3,
      left: 14,
      top: 30,
      maxWidth: 222,
    })
    this.tipCard.content.addChild(this.tipBodyText)
    this.addChild(this.tipCard)

    this.miniQuiz = new MiniQuiz(260)
    this.miniQuiz.centerX = stageCenterX
    this.miniQuiz.centerY = stageTop + stageH * 0.5
    this.addChild(this.miniQuiz)

    this.buildPanel(stageLeft, stageTop, stageW, stageH, rightW, gap, m, my, lb, sounds, model)
    this.wireModel(model, sounds)
  }

  private buildPanel(
    stageLeft: number,
    stageTop: number,
    stageW: number,
    stageH: number,
    rightW: number,
    gap: number,
    m: number,
    my: number,
    lb: { right: number; bottom: number },
    sounds: ForcesSounds,
    model: PressureForceAreaModel,
  ): void {
    const card = new DepthCard(rightW, stageH)
    card.left = stageLeft + stageW + gap
    card.top = stageTop
    this.addChild(card)

    const panelContent = new Node()
    const contentW = rightW - 42
    const halfW = (contentW - 8) / 2
    const btnH = 32
    const gridGap = 6

    const scenarioHeader = controlSection(PressureForceAreaStrings.sectionScenarioStringProperty.value, contentW)
    panelContent.addChild(scenarioHeader)

    this.scenarioButtons = {} as Record<PressureScenario, SoftButton>
    for (const scenario of SCENARIOS) {
      const btn = new SoftButton(
        SCENARIO_LABELS[scenario],
        () => model.setScenario(scenario),
        {
          width: contentW,
          height: btnH,
          fill: scenario === 'nail' ? '#e74c3c' : scenario === 'shoe' ? '#3498db' : ForcesColors.accent,
          selected: scenario === 'explore',
          fontSize: 12,
          onSound: () => sounds.scenario(),
        },
      )
      this.scenarioButtons[scenario] = btn
      panelContent.addChild(btn)
    }

    const conditionsHeader = controlSection(PressureForceAreaStrings.sectionConditionsStringProperty.value, contentW)
    panelContent.addChild(conditionsHeader)

    this.runningToggleBtn = new SoftButton(
      PressureForceAreaStrings.runningOnStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: contentW, height: btnH, fill: ForcesColors.accent, fontSize: 12, selected: true },
    )
    panelContent.addChild(this.runningToggleBtn)

    const forceSlider = new DepthSlider(model.forceProperty, {
      min: 10,
      max: 200,
      width: contentW,
      label: PressureForceAreaStrings.forceSliderStringProperty.value,
      format: (n) => `${n.toFixed(0)} N`,
      fill: '#85929e',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(forceSlider)

    const areaSlider = new DepthSlider(model.areaProperty, {
      min: 0.5,
      max: 40,
      width: contentW,
      label: PressureForceAreaStrings.areaSliderStringProperty.value,
      format: (n) => `${n.toFixed(1)} cm²`,
      fill: '#e74c3c',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(areaSlider)

    const speedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: PressureForceAreaStrings.speedSliderStringProperty.value,
      format: (n) => `${n.toFixed(2)}×`,
      fill: ForcesColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(speedSlider)

    const conditionsHint = controlHint(PressureForceAreaStrings.conditionsHintStringProperty.value, contentW)
    panelContent.addChild(conditionsHint)

    const displayHeader = controlSection(PressureForceAreaStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)

    this.labelsBtn = new SoftButton(
      PressureForceAreaStrings.labelsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showLabelsProperty.value = !model.showLabelsProperty.value
      },
      { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true },
    )
    this.imprintBtn = new SoftButton(
      PressureForceAreaStrings.imprintOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showImprintProperty.value = !model.showImprintProperty.value
      },
      { width: halfW, height: btnH, fill: '#f59e0b', fontSize: 10, selected: true },
    )
    this.formulaBtn = new SoftButton(
      PressureForceAreaStrings.formulaOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showFormulaProperty.value = !model.showFormulaProperty.value
      },
      { width: contentW, height: btnH, fill: '#0ea5e9', fontSize: 12, selected: true },
    )
    panelContent.addChild(this.labelsBtn)
    panelContent.addChild(this.imprintBtn)
    panelContent.addChild(this.formulaBtn)

    const playbackHeader = controlSection(PressureForceAreaStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)

    this.playPauseBtn = new SoftButton(
      PressureForceAreaStrings.playButtonStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: contentW, height: 38, fill: ForcesColors.accent, fontSize: 12 },
    )
    panelContent.addChild(this.playPauseBtn)

    const soundHeader = controlSection(PressureForceAreaStrings.sectionSoundStringProperty.value, contentW)
    panelContent.addChild(soundHeader)

    this.soundBtn = new SoftButton(
      PressureForceAreaStrings.soundOnStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        this.soundBtn.setLabel(on ? PressureForceAreaStrings.soundOnStringProperty.value : PressureForceAreaStrings.soundOffStringProperty.value)
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.soundBtn)

    const statusHeader = controlSection(PressureForceAreaStrings.sectionStatusStringProperty.value, contentW)
    panelContent.addChild(statusHeader)

    this.starsText = new Text('', { font: new PhetFont({ size: 15, weight: 'bold' }), fill: '#d97706' })
    panelContent.addChild(this.starsText)

    this.statusText = new RichText(model.statusProperty.value, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: ForcesColors.panelText,
      lineWrap: contentW,
      leading: 3,
    })
    panelContent.addChild(this.statusText)

    const learnTip = createPanelTip(PressureForceAreaStrings.learnMoreStringProperty.value, { width: contentW, fontSize: 11 })
    panelContent.addChild(learnTip)

    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false })
    panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      const stack = (n: Node) => { n.left = 0; n.top = py; py = n.bottom + gridGap }
      stack(scenarioHeader)
      for (const s of SCENARIOS) stack(this.scenarioButtons[s])
      py += 4
      stack(conditionsHeader)
      stack(this.runningToggleBtn)
      stack(forceSlider)
      stack(areaSlider)
      stack(speedSlider)
      conditionsHint.left = 0
      conditionsHint.top = py
      py = conditionsHint.bottom + 12
      stack(displayHeader)
      this.labelsBtn.left = 0
      this.labelsBtn.top = py
      this.imprintBtn.left = halfW + 8
      this.imprintBtn.top = py
      py = this.labelsBtn.bottom + gridGap
      stack(this.formulaBtn)
      py += 6
      stack(playbackHeader)
      stack(this.playPauseBtn)
      py += 6
      stack(soundHeader)
      stack(this.soundBtn)
      py += 6
      stack(statusHeader)
      stack(this.starsText)
      this.statusText.left = 0
      this.statusText.top = py
      py = this.statusText.bottom + 10
      learnTip.left = 0
      learnTip.top = py
      bottomPad.top = learnTip.bottom + 4
    }
    relayoutPanel()

    const scroller = new ScrollableNode(panelContent, rightW - 24, stageH - 72)
    scroller.left = 12
    scroller.top = 12
    card.content.addChild(scroller)

    this.addChild(
      new ResetAllButton({
        listener: () => {
          sounds.resetAll()
          model.reset()
          this.particles.clear()
        },
        right: lb.right - m,
        bottom: lb.bottom - my,
      }),
    )

    model.statusProperty.link(() => relayoutPanel())
  }

  private wireModel(model: PressureForceAreaModel, sounds: ForcesSounds): void {
    const syncStars = () => {
      this.starsText.string = `${PressureForceAreaStrings.starsStringProperty.value} ${model.starsProperty.value}`
    }
    const syncPlayPause = () => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(running ? PressureForceAreaStrings.pauseButtonStringProperty.value : PressureForceAreaStrings.playButtonStringProperty.value)
      this.runningToggleBtn.setLabel(running ? PressureForceAreaStrings.runningOnStringProperty.value : PressureForceAreaStrings.runningOffStringProperty.value)
      this.runningToggleBtn.setSelected(running)
    }
    const syncScenario = () => {
      const scenario = model.scenarioProperty.value
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(s === scenario)
      this.guide.setGuidance(PressureForceAreaStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[scenario])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[scenario], () => {
        this.leftLearnTip.top = this.teachingTriad.bottom + 16
      })
    }
    const syncDisplay = () => {
      this.labelsBtn.setSelected(model.showLabelsProperty.value)
      this.labelsBtn.setLabel(model.showLabelsProperty.value ? PressureForceAreaStrings.labelsOnStringProperty.value : PressureForceAreaStrings.labelsOffStringProperty.value)
      this.labelsLayer.visible = model.showLabelsProperty.value
      this.imprintBtn.setSelected(model.showImprintProperty.value)
      this.imprintBtn.setLabel(model.showImprintProperty.value ? PressureForceAreaStrings.imprintOnStringProperty.value : PressureForceAreaStrings.imprintOffStringProperty.value)
      this.imprintRect.visible = model.showImprintProperty.value
      this.formulaBtn.setSelected(model.showFormulaProperty.value)
      this.formulaBtn.setLabel(model.showFormulaProperty.value ? PressureForceAreaStrings.formulaOnStringProperty.value : PressureForceAreaStrings.formulaOffStringProperty.value)
      this.formulaLayer.visible = model.showFormulaProperty.value
    }
    const syncStage = () => {
      const F = model.forceProperty.value
      const A = model.areaProperty.value
      const P = model.pressureProperty.value
      const depth = model.pressDepthProperty.value
      const blockW = clamp(this.stageW * 0.35, 60, 180)
      const blockX = this.stageCenterX - blockW / 2
      const blockY = this.stageTop + this.stageH * 0.22 - depth * 28
      this.blockRect.setRect(blockX, blockY, blockW, 36)
      const contactW = clamp(A * 3.5, 8, blockW * 0.9)
      const contactX = this.stageCenterX - contactW / 2
      const intensity = clamp(P / 50, 0.2, 1)
      this.imprintRect.setRect(contactX, this.surfaceY - 4, contactW, 8)
      this.imprintRect.fill = `rgba(231, 76, 60, ${0.25 + intensity * 0.65})`
      this.pressureText.string = `P = ${P.toFixed(1)} N/cm²  (F=${F.toFixed(0)} N, A=${A.toFixed(1)} cm²)`
      this.pressureText.centerX = this.stageCenterX
      this.pressureText.top = this.surfaceY + 20
      this.formulaText.centerX = this.stageCenterX
      this.formulaText.top = this.surfaceY + 48
      const nailMode = A < 8
      this.captionText.string = nailMode ? 'Sharp tip — small A → high P' : 'Wide contact — large A → lower P'
      this.captionText.centerX = this.stageCenterX
    }

    model.scenarioProperty.link(syncScenario)
    model.runningProperty.link(syncPlayPause)
    model.showLabelsProperty.link(syncDisplay)
    model.showImprintProperty.link(syncDisplay)
    model.showFormulaProperty.link(syncDisplay)
    model.forceProperty.link(syncStage)
    model.areaProperty.link(syncStage)
    model.pressureProperty.link(syncStage)
    model.pressDepthProperty.link(syncStage)
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(syncStars)
    model.statusProperty.link((s) => { this.statusText.string = s })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.starsProperty.lazyLink((stars, old) => { if (old !== undefined && stars > old) sounds.celebrate() })

    syncStars()
    syncPlayPause()
    syncScenario()
    syncDisplay()
    syncStage()
  }

  private showTipCard(text: string): void {
    this.tipBodyText.string = text
    this.tipCard.visible = true
    this.tipCard.opacity = 1
    this.tipTimer = 4.4
  }

  private showQuiz(): void {
    this.miniQuiz.showQuiz(
      PressureForceAreaStrings.quizQuestionStringProperty.value,
      [
        { label: PressureForceAreaStrings.quizCorrectStringProperty.value, correct: true },
        { label: PressureForceAreaStrings.quizWrongStringProperty.value, correct: false },
      ],
      (correct) => {
        correct ? this.sounds.correct() : this.sounds.wrong()
        this.model.onQuiz(correct)
      },
    )
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.particles.step(dt)
    if (this.tipTimer > 0) {
      this.tipTimer -= dt
      if (this.tipTimer < 0.6) this.tipCard.opacity = Math.max(0, this.tipTimer / 0.6)
      if (this.tipTimer <= 0) this.tipCard.visible = false
    }
  }
}
