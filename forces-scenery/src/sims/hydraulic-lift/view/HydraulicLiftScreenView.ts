import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Node, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { HydraulicLiftModel, HydraulicScenario } from '../model/HydraulicLiftModel.js'
import { LOAD_WEIGHT } from '../../../shared/hydraulicLiftModel.js'
import { ForcesConstants } from '../../../shared/ForcesConstants.js'
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
import { HydraulicLiftStrings } from '../HydraulicLiftStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SCENARIOS: readonly HydraulicScenario[] = ['explore', 'carJack', 'heavyLoad']

const SCENARIO_GUIDE: Record<HydraulicScenario, string> = {
  explore: HydraulicLiftStrings.guideExploreStringProperty.value,
  carJack: HydraulicLiftStrings.guideCarJackStringProperty.value,
  heavyLoad: HydraulicLiftStrings.guideHeavyLoadStringProperty.value,
}

const SCENARIO_TRIAD: Record<HydraulicScenario, [string, string, string]> = {
  explore: [
    'Small piston pushes fluid.',
    'Pascal\'s law: pressure is transmitted equally — F₂ = F₁ × (A₂/A₁).',
    'Lift happens when F₂ ≥ load weight.',
  ],
  carJack: [
    'Car jack preset.',
    'A modest input force on a small piston can lift a car via area multiplication.',
    'Try Heavy load if F₂ is too small.',
  ],
  heavyLoad: [
    'Heavy load resists.',
    'Increase F₁ or widen A₂ until output force F₂ reaches 800 N.',
    'Watch the large piston rise when F₂ ≥ load.',
  ],
}

const SCENARIO_LABELS: Record<HydraulicScenario, string> = {
  explore: HydraulicLiftStrings.scenarioExploreStringProperty.value,
  carJack: HydraulicLiftStrings.scenarioCarJackStringProperty.value,
  heavyLoad: HydraulicLiftStrings.scenarioHeavyLoadStringProperty.value,
}

export class HydraulicLiftScreenView extends ScreenView {
  private readonly model: HydraulicLiftModel
  private readonly sounds: ForcesSounds
  private readonly particles: ParticleBurst
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly leftLearnTip: Node
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private tipTimer = 0

  private readonly stageCenterX: number
  private readonly baseY: number
  private readonly smallX: number
  private readonly largeX: number

  private readonly smallPiston: Rectangle
  private readonly largePiston: Rectangle
  private readonly loadBlock: Rectangle
  private readonly readoutText: Text
  private readonly captionText: Text
  private readonly labelsLayer: Node
  private readonly forcesLayer: Node

  private scenarioButtons!: Record<HydraulicScenario, SoftButton>
  private runningToggleBtn!: SoftButton
  private labelsBtn!: SoftButton
  private forcesBtn!: SoftButton
  private loadBtn!: SoftButton
  private playPauseBtn!: SoftButton
  private soundBtn!: SoftButton
  private starsText!: Text
  private statusText!: RichText

  public constructor(model: HydraulicLiftModel, providedOptions?: Options) {
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
    this.stageCenterX = stageCenterX

    this.baseY = stageTop + stageH * 0.78
    this.smallX = stageLeft + stageW * 0.22
    this.largeX = stageLeft + stageW * 0.72

    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: HydraulicLiftStrings.guideTitleStringProperty.value,
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

    this.leftLearnTip = createPanelTip(HydraulicLiftStrings.learnMoreStringProperty.value, {
      width: leftW - 24,
      fontSize: 11,
      fill: ForcesColors.panelMuted,
    })
    this.leftLearnTip.left = 12
    this.leftLearnTip.top = this.teachingTriad.bottom + 16
    leftCard.content.addChild(this.leftLearnTip)

    this.addChild(new StageBackdrop(stageLeft, stageTop, stageW, stageH, { top: '#c7d2e0', bottom: '#eef2f7' }))

    this.addChild(
      new Text(HydraulicLiftStrings.stageTitleStringProperty.value, {
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

    this.addChild(
      new Rectangle(stageLeft + stageW * 0.12, this.baseY - 20, stageW * 0.76, 24, {
        fill: 'rgba(52,152,219,0.35)',
        stroke: '#2980b9',
        lineWidth: 2,
      }),
    )

    this.smallPiston = new Rectangle(0, 0, 40, 36, { fill: '#7f8c8d', stroke: '#2c3e50', lineWidth: 2, cornerRadius: 4 })
    this.largePiston = new Rectangle(0, 0, 70, 36, { fill: '#7f8c8d', stroke: '#2c3e50', lineWidth: 2, cornerRadius: 4 })
    this.loadBlock = new Rectangle(0, 0, 90, 24, { fill: '#e67e22', stroke: '#d35400', lineWidth: 2, cornerRadius: 4 })
    this.addChild(this.smallPiston)
    this.addChild(this.largePiston)
    this.addChild(this.loadBlock)

    this.readoutText = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#0f172a',
      centerX: stageCenterX,
      top: stageTop + stageH * 0.14,
    })
    this.addChild(this.readoutText)

    this.forcesLayer = new Node({ pickable: false })
    this.addChild(this.forcesLayer)

    this.labelsLayer = new Node({ pickable: false })
    this.labelsLayer.addChild(
      new Text(HydraulicLiftStrings.fluidLabelStringProperty.value, {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#0f172a',
        centerX: stageCenterX,
        top: this.baseY - 36,
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
      new Text(HydraulicLiftStrings.tipTitleStringProperty.value, {
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
    model: HydraulicLiftModel,
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

    const scenarioHeader = controlSection(HydraulicLiftStrings.sectionScenarioStringProperty.value, contentW)
    panelContent.addChild(scenarioHeader)

    this.scenarioButtons = {} as Record<HydraulicScenario, SoftButton>
    for (const scenario of SCENARIOS) {
      const btn = new SoftButton(
        SCENARIO_LABELS[scenario],
        () => model.setScenario(scenario),
        {
          width: contentW,
          height: btnH,
          fill: ForcesColors.accent,
          selected: scenario === 'explore',
          fontSize: 12,
          onSound: () => sounds.scenario(),
        },
      )
      this.scenarioButtons[scenario] = btn
      panelContent.addChild(btn)
    }

    const conditionsHeader = controlSection(HydraulicLiftStrings.sectionConditionsStringProperty.value, contentW)
    panelContent.addChild(conditionsHeader)

    this.runningToggleBtn = new SoftButton(
      HydraulicLiftStrings.runningOnStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: contentW, height: btnH, fill: ForcesColors.accent, fontSize: 12, selected: true },
    )
    panelContent.addChild(this.runningToggleBtn)

    const f1Slider = new DepthSlider(model.f1Property, {
      min: 10,
      max: 200,
      width: contentW,
      label: HydraulicLiftStrings.f1SliderStringProperty.value,
      format: (n) => `${n.toFixed(0)} N`,
      fill: '#27ae60',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(f1Slider)

    const a1Slider = new DepthSlider(model.a1Property, {
      min: 1,
      max: 20,
      width: contentW,
      label: HydraulicLiftStrings.a1SliderStringProperty.value,
      format: (n) => `${n.toFixed(0)} cm²`,
      fill: '#3498db',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(a1Slider)

    const a2Slider = new DepthSlider(model.a2Property, {
      min: 10,
      max: 80,
      width: contentW,
      label: HydraulicLiftStrings.a2SliderStringProperty.value,
      format: (n) => `${n.toFixed(0)} cm²`,
      fill: '#9b59b6',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(a2Slider)

    const speedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: HydraulicLiftStrings.speedSliderStringProperty.value,
      format: (n) => `${n.toFixed(2)}×`,
      fill: ForcesColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(speedSlider)

    const conditionsHint = controlHint(HydraulicLiftStrings.conditionsHintStringProperty.value, contentW)
    panelContent.addChild(conditionsHint)

    const displayHeader = controlSection(HydraulicLiftStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)

    this.labelsBtn = new SoftButton(
      HydraulicLiftStrings.labelsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showLabelsProperty.value = !model.showLabelsProperty.value
      },
      { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true },
    )
    this.forcesBtn = new SoftButton(
      HydraulicLiftStrings.forcesOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showForcesProperty.value = !model.showForcesProperty.value
      },
      { width: halfW, height: btnH, fill: '#f59e0b', fontSize: 10, selected: true },
    )
    this.loadBtn = new SoftButton(
      HydraulicLiftStrings.loadOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showLoadProperty.value = !model.showLoadProperty.value
      },
      { width: contentW, height: btnH, fill: '#0ea5e9', fontSize: 12, selected: true },
    )
    panelContent.addChild(this.labelsBtn)
    panelContent.addChild(this.forcesBtn)
    panelContent.addChild(this.loadBtn)

    const playbackHeader = controlSection(HydraulicLiftStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)

    this.playPauseBtn = new SoftButton(
      HydraulicLiftStrings.playButtonStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: contentW, height: 38, fill: ForcesColors.accent, fontSize: 12 },
    )
    panelContent.addChild(this.playPauseBtn)

    const soundHeader = controlSection(HydraulicLiftStrings.sectionSoundStringProperty.value, contentW)
    panelContent.addChild(soundHeader)

    this.soundBtn = new SoftButton(
      HydraulicLiftStrings.soundOnStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        this.soundBtn.setLabel(on ? HydraulicLiftStrings.soundOnStringProperty.value : HydraulicLiftStrings.soundOffStringProperty.value)
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.soundBtn)

    const statusHeader = controlSection(HydraulicLiftStrings.sectionStatusStringProperty.value, contentW)
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

    const learnTip = createPanelTip(HydraulicLiftStrings.learnMoreStringProperty.value, { width: contentW, fontSize: 11 })
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
      stack(f1Slider)
      stack(a1Slider)
      stack(a2Slider)
      stack(speedSlider)
      conditionsHint.left = 0
      conditionsHint.top = py
      py = conditionsHint.bottom + 12
      stack(displayHeader)
      this.labelsBtn.left = 0
      this.labelsBtn.top = py
      this.forcesBtn.left = halfW + 8
      this.forcesBtn.top = py
      py = this.labelsBtn.bottom + gridGap
      stack(this.loadBtn)
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

  private wireModel(model: HydraulicLiftModel, sounds: ForcesSounds): void {
    const syncStars = () => {
      this.starsText.string = `${HydraulicLiftStrings.starsStringProperty.value} ${model.starsProperty.value}`
    }
    const syncPlayPause = () => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(running ? HydraulicLiftStrings.pauseButtonStringProperty.value : HydraulicLiftStrings.playButtonStringProperty.value)
      this.runningToggleBtn.setLabel(running ? HydraulicLiftStrings.runningOnStringProperty.value : HydraulicLiftStrings.runningOffStringProperty.value)
      this.runningToggleBtn.setSelected(running)
    }
    const syncScenario = () => {
      const scenario = model.scenarioProperty.value
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(s === scenario)
      this.guide.setGuidance(HydraulicLiftStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[scenario])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[scenario], () => {
        this.leftLearnTip.top = this.teachingTriad.bottom + 16
      })
    }
    const syncDisplay = () => {
      this.labelsBtn.setSelected(model.showLabelsProperty.value)
      this.labelsBtn.setLabel(model.showLabelsProperty.value ? HydraulicLiftStrings.labelsOnStringProperty.value : HydraulicLiftStrings.labelsOffStringProperty.value)
      this.labelsLayer.visible = model.showLabelsProperty.value
      this.forcesBtn.setSelected(model.showForcesProperty.value)
      this.forcesBtn.setLabel(model.showForcesProperty.value ? HydraulicLiftStrings.forcesOnStringProperty.value : HydraulicLiftStrings.forcesOffStringProperty.value)
      this.forcesLayer.visible = model.showForcesProperty.value
      this.loadBtn.setSelected(model.showLoadProperty.value)
      this.loadBtn.setLabel(model.showLoadProperty.value ? HydraulicLiftStrings.loadOnStringProperty.value : HydraulicLiftStrings.loadOffStringProperty.value)
      this.loadBlock.visible = model.showLoadProperty.value
    }
    const syncStage = () => {
      const F1 = model.f1Property.value
      const A1 = model.a1Property.value
      const A2 = model.a2Property.value
      const F2 = model.f2Property.value
      const lift = model.liftHeightProperty.value
      const smallW = 20 + Math.sqrt(A1) * 6
      const largeW = 30 + Math.sqrt(A2) * 6
      const smallY = this.baseY - 28 - F1 * 0.06
      const largeY = this.baseY - 36 - lift * 55
      this.smallPiston.setRect(this.smallX - smallW / 2, smallY - 36, smallW, 36)
      this.largePiston.setRect(this.largeX - largeW / 2, largeY - 36, largeW, 36)
      this.loadBlock.setRect(this.largeX - 45, largeY - 62, 90, 24)
      this.forcesLayer.removeAllChildren()
      this.forcesLayer.addChild(
        new Text(`F₁=${F1.toFixed(0)} N  A₁=${A1.toFixed(0)} cm²`, {
          font: new PhetFont({ size: 11, weight: 'bold' }),
          fill: '#27ae60',
          centerX: this.smallX,
          bottom: smallY - 42,
        }),
      )
      this.forcesLayer.addChild(
        new Text(`F₂=${F2.toFixed(0)} N  A₂=${A2.toFixed(0)} cm²`, {
          font: new PhetFont({ size: 11, weight: 'bold' }),
          fill: '#8e44ad',
          centerX: this.largeX,
          bottom: largeY - 68,
        }),
      )
      this.readoutText.string = `Load ${LOAD_WEIGHT} N · F₂ = ${F2.toFixed(0)} N`
      this.readoutText.centerX = this.stageCenterX
      this.captionText.string = model.canLift
        ? HydraulicLiftStrings.liftingStringProperty.value
        : HydraulicLiftStrings.notLiftingStringProperty.value
      this.captionText.centerX = this.stageCenterX
      this.captionText.fill = model.canLift ? '#16a34a' : '#dc2626'
    }

    model.scenarioProperty.link(syncScenario)
    model.runningProperty.link(syncPlayPause)
    model.showLabelsProperty.link(syncDisplay)
    model.showForcesProperty.link(syncDisplay)
    model.showLoadProperty.link(syncDisplay)
    model.f1Property.link(syncStage)
    model.a1Property.link(syncStage)
    model.a2Property.link(syncStage)
    model.f2Property.link(syncStage)
    model.liftHeightProperty.link(syncStage)
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
      HydraulicLiftStrings.quizQuestionStringProperty.value,
      [
        { label: HydraulicLiftStrings.quizCorrectStringProperty.value, correct: true },
        { label: HydraulicLiftStrings.quizWrongStringProperty.value, correct: false },
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
