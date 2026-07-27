import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { FloatScenario, FloatingSinkingModel } from '../model/FloatingSinkingModel.js'
import { FloatVerdict } from '../../../shared/floatingSinkingModel.js'
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
import { FloatingSinkingStrings } from '../FloatingSinkingStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SCENARIOS: readonly FloatScenario[] = ['explore', 'cork', 'suspend', 'rock']

const SCENARIO_GUIDE: Record<FloatScenario, string> = {
  explore: FloatingSinkingStrings.guideExploreStringProperty.value,
  cork: FloatingSinkingStrings.guideCorkStringProperty.value,
  suspend: FloatingSinkingStrings.guideSuspendStringProperty.value,
  rock: FloatingSinkingStrings.guideRockStringProperty.value,
}

const SCENARIO_TRIAD: Record<FloatScenario, [string, string, string]> = {
  explore: [
    'Comparing densities.',
    'Objects float when less dense than the fluid; they sink when denser.',
    'Try Cork or Rock presets.',
  ],
  cork: [
    'Cork on water.',
    'Low-density cork is pushed up by buoyancy — it floats at the top.',
    'Try Rock to see the opposite.',
  ],
  suspend: [
    'Neutral buoyancy.',
    'When object and fluid densities match, the object suspends mid-tank.',
    'Small density changes tip float vs sink.',
  ],
  rock: [
    'Dense rock sinks.',
    'Gravity pulls the dense object down — it settles at the bottom.',
    'Return to Explore to find your own float/sink cases.',
  ],
}

const SCENARIO_LABELS: Record<FloatScenario, string> = {
  explore: FloatingSinkingStrings.scenarioExploreStringProperty.value,
  cork: FloatingSinkingStrings.scenarioCorkStringProperty.value,
  suspend: FloatingSinkingStrings.scenarioSuspendStringProperty.value,
  rock: FloatingSinkingStrings.scenarioRockStringProperty.value,
}

const VERDICT_TEXT: Record<FloatVerdict, string> = {
  float: FloatingSinkingStrings.floatsStringProperty.value,
  sink: FloatingSinkingStrings.sinksStringProperty.value,
  suspend: FloatingSinkingStrings.suspendsStringProperty.value,
}

export class FloatingSinkingScreenView extends ScreenView {
  private readonly model: FloatingSinkingModel
  private readonly sounds: ForcesSounds
  private readonly particles: ParticleBurst
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly leftLearnTip: Node
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private tipTimer = 0

  private readonly tankL: number
  private readonly tankR: number
  private readonly tankT: number
  private readonly tankB: number
  private readonly stageCenterX: number

  private readonly waterRect: Rectangle
  private readonly objectCircle: Circle
  private readonly densityLabel: Text
  private readonly verdictText: Text
  private readonly labelsLayer: Node

  private scenarioButtons!: Record<FloatScenario, SoftButton>
  private runningToggleBtn!: SoftButton
  private labelsBtn!: SoftButton
  private densitiesBtn!: SoftButton
  private verdictBtn!: SoftButton
  private playPauseBtn!: SoftButton
  private soundBtn!: SoftButton
  private starsText!: Text
  private statusText!: RichText

  public constructor(model: FloatingSinkingModel, providedOptions?: Options) {
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

    this.tankL = stageLeft + stageW * 0.22
    this.tankR = stageLeft + stageW * 0.78
    this.tankT = stageTop + stageH * 0.18
    this.tankB = stageTop + stageH * 0.72

    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: FloatingSinkingStrings.guideTitleStringProperty.value,
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

    this.leftLearnTip = createPanelTip(FloatingSinkingStrings.learnMoreStringProperty.value, {
      width: leftW - 24,
      fontSize: 11,
      fill: ForcesColors.panelMuted,
    })
    this.leftLearnTip.left = 12
    this.leftLearnTip.top = this.teachingTriad.bottom + 16
    leftCard.content.addChild(this.leftLearnTip)

    this.addChild(new StageBackdrop(stageLeft, stageTop, stageW, stageH, { top: '#c7d2e0', bottom: '#eef2f7' }))

    this.addChild(
      new Text(FloatingSinkingStrings.stageTitleStringProperty.value, {
        font: new PhetFont({ size: 18, weight: 'bold' }),
        fill: '#0f172a',
        centerX: stageCenterX,
        top: stageTop + 10,
      }),
    )

    this.verdictText = new Text('', {
      font: new PhetFont({ size: 14, weight: 'bold' }),
      fill: ForcesColors.accent,
      centerX: stageCenterX,
      top: stageTop + 36,
    })
    this.addChild(this.verdictText)

    this.addChild(
      new Rectangle(this.tankL, this.tankT, this.tankR - this.tankL, this.tankB - this.tankT, {
        cornerRadius: 8,
        fill: 'rgba(248,250,252,0.2)',
        stroke: '#5d6d7e',
        lineWidth: 3,
      }),
    )

    this.waterRect = new Rectangle(this.tankL + 3, this.tankT + 40, this.tankR - this.tankL - 6, this.tankB - this.tankT - 43, {
      fill: 'rgba(52,152,219,0.45)',
    })
    this.addChild(this.waterRect)

    this.objectCircle = new Circle(24, { fill: '#f5b041', stroke: '#2c3e50', lineWidth: 2 })
    this.addChild(this.objectCircle)

    this.densityLabel = new Text('', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#0f172a',
    })
    this.addChild(this.densityLabel)

    this.labelsLayer = new Node({ pickable: false })
    this.labelsLayer.addChild(
      new Text(FloatingSinkingStrings.tankLabelStringProperty.value, {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#0f172a',
        centerX: stageCenterX,
        top: this.tankB + 8,
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
      new Text(FloatingSinkingStrings.tipTitleStringProperty.value, {
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
    lb: { width: number; height: number; right: number; bottom: number },
    sounds: ForcesSounds,
    model: FloatingSinkingModel,
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

    const scenarioHeader = controlSection(FloatingSinkingStrings.sectionScenarioStringProperty.value, contentW)
    panelContent.addChild(scenarioHeader)

    this.scenarioButtons = {} as Record<FloatScenario, SoftButton>
    for (const scenario of SCENARIOS) {
      const btn = new SoftButton(
        SCENARIO_LABELS[scenario],
        () => model.setScenario(scenario),
        {
          width: contentW,
          height: btnH,
          fill: scenario === 'cork' ? '#f5b041' : scenario === 'rock' ? '#64748b' : ForcesColors.accent,
          selected: scenario === 'explore',
          fontSize: 12,
          onSound: () => sounds.scenario(),
        },
      )
      this.scenarioButtons[scenario] = btn
      panelContent.addChild(btn)
    }

    const conditionsHeader = controlSection(FloatingSinkingStrings.sectionConditionsStringProperty.value, contentW)
    panelContent.addChild(conditionsHeader)

    this.runningToggleBtn = new SoftButton(
      FloatingSinkingStrings.runningOnStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: contentW, height: btnH, fill: ForcesColors.accent, fontSize: 12, selected: true },
    )
    panelContent.addChild(this.runningToggleBtn)

    const objSlider = new DepthSlider(model.objectDensityProperty, {
      min: 0.2,
      max: 2.5,
      width: contentW,
      label: FloatingSinkingStrings.objectDensitySliderStringProperty.value,
      format: (n) => `${n.toFixed(2)} g/cm³`,
      fill: '#f59e0b',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(objSlider)

    const fluidSlider = new DepthSlider(model.fluidDensityProperty, {
      min: 0.5,
      max: 2.0,
      width: contentW,
      label: FloatingSinkingStrings.fluidDensitySliderStringProperty.value,
      format: (n) => `${n.toFixed(2)} g/cm³`,
      fill: '#3498db',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(fluidSlider)

    const speedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: FloatingSinkingStrings.speedSliderStringProperty.value,
      format: (n) => `${n.toFixed(2)}×`,
      fill: ForcesColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(speedSlider)

    const conditionsHint = controlHint(FloatingSinkingStrings.conditionsHintStringProperty.value, contentW)
    panelContent.addChild(conditionsHint)

    const displayHeader = controlSection(FloatingSinkingStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)

    this.labelsBtn = new SoftButton(
      FloatingSinkingStrings.labelsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showLabelsProperty.value = !model.showLabelsProperty.value
      },
      { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true },
    )
    this.densitiesBtn = new SoftButton(
      FloatingSinkingStrings.densitiesOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showDensitiesProperty.value = !model.showDensitiesProperty.value
      },
      { width: halfW, height: btnH, fill: '#f59e0b', fontSize: 10, selected: true },
    )
    this.verdictBtn = new SoftButton(
      FloatingSinkingStrings.verdictOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showVerdictProperty.value = !model.showVerdictProperty.value
      },
      { width: contentW, height: btnH, fill: '#0ea5e9', fontSize: 12, selected: true },
    )
    panelContent.addChild(this.labelsBtn)
    panelContent.addChild(this.densitiesBtn)
    panelContent.addChild(this.verdictBtn)

    const playbackHeader = controlSection(FloatingSinkingStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)

    this.playPauseBtn = new SoftButton(
      FloatingSinkingStrings.playButtonStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: contentW, height: 38, fill: ForcesColors.accent, fontSize: 12 },
    )
    panelContent.addChild(this.playPauseBtn)

    const soundHeader = controlSection(FloatingSinkingStrings.sectionSoundStringProperty.value, contentW)
    panelContent.addChild(soundHeader)

    this.soundBtn = new SoftButton(
      FloatingSinkingStrings.soundOnStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        this.soundBtn.setLabel(on ? FloatingSinkingStrings.soundOnStringProperty.value : FloatingSinkingStrings.soundOffStringProperty.value)
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.soundBtn)

    const statusHeader = controlSection(FloatingSinkingStrings.sectionStatusStringProperty.value, contentW)
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

    const learnTip = createPanelTip(FloatingSinkingStrings.learnMoreStringProperty.value, { width: contentW, fontSize: 11 })
    panelContent.addChild(learnTip)

    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false })
    panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      const stack = (n: Node) => {
        n.left = 0
        n.top = py
        py = n.bottom + gridGap
      }
      stack(scenarioHeader)
      for (const scenario of SCENARIOS) stack(this.scenarioButtons[scenario])
      py += 4
      stack(conditionsHeader)
      stack(this.runningToggleBtn)
      stack(objSlider)
      stack(fluidSlider)
      stack(speedSlider)
      conditionsHint.left = 0
      conditionsHint.top = py
      py = conditionsHint.bottom + 12
      stack(displayHeader)
      this.labelsBtn.left = 0
      this.labelsBtn.top = py
      this.densitiesBtn.left = halfW + 8
      this.densitiesBtn.top = py
      py = this.labelsBtn.bottom + gridGap
      stack(this.verdictBtn)
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

  private wireModel(model: FloatingSinkingModel, sounds: ForcesSounds): void {
    const syncStars = () => {
      this.starsText.string = `${FloatingSinkingStrings.starsStringProperty.value} ${model.starsProperty.value}`
    }
    const syncPlayPause = () => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(running ? FloatingSinkingStrings.pauseButtonStringProperty.value : FloatingSinkingStrings.playButtonStringProperty.value)
      this.runningToggleBtn.setLabel(running ? FloatingSinkingStrings.runningOnStringProperty.value : FloatingSinkingStrings.runningOffStringProperty.value)
      this.runningToggleBtn.setSelected(running)
    }
    const syncScenario = () => {
      const scenario = model.scenarioProperty.value
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(s === scenario)
      this.guide.setGuidance(FloatingSinkingStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[scenario])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[scenario], () => {
        this.leftLearnTip.top = this.teachingTriad.bottom + 16
      })
    }
    const syncDisplay = () => {
      this.labelsBtn.setSelected(model.showLabelsProperty.value)
      this.labelsBtn.setLabel(model.showLabelsProperty.value ? FloatingSinkingStrings.labelsOnStringProperty.value : FloatingSinkingStrings.labelsOffStringProperty.value)
      this.labelsLayer.visible = model.showLabelsProperty.value
      this.densitiesBtn.setSelected(model.showDensitiesProperty.value)
      this.densitiesBtn.setLabel(model.showDensitiesProperty.value ? FloatingSinkingStrings.densitiesOnStringProperty.value : FloatingSinkingStrings.densitiesOffStringProperty.value)
      this.densityLabel.visible = model.showDensitiesProperty.value
      this.verdictBtn.setSelected(model.showVerdictProperty.value)
      this.verdictBtn.setLabel(model.showVerdictProperty.value ? FloatingSinkingStrings.verdictOnStringProperty.value : FloatingSinkingStrings.verdictOffStringProperty.value)
      this.verdictText.visible = model.showVerdictProperty.value
    }
    const syncStage = () => {
      const y = model.yProperty.value
      const od = model.objectDensityProperty.value
      const fd = model.fluidDensityProperty.value
      const v = model.verdictProperty.value
      const ox = (this.tankL + this.tankR) / 2
      const oy = this.tankT + y * (this.tankB - this.tankT)
      this.objectCircle.centerX = ox
      this.objectCircle.centerY = oy
      this.objectCircle.fill = od < fd ? '#f5b041' : od > fd ? '#7f8c8d' : '#abebc6'
      this.densityLabel.string = `ρ_obj ${od.toFixed(2)} · ρ_fluid ${fd.toFixed(2)}`
      this.densityLabel.centerX = ox
      this.densityLabel.bottom = oy - 30
      this.verdictText.string = VERDICT_TEXT[v]
      this.verdictText.centerX = this.stageCenterX
    }

    model.scenarioProperty.link(syncScenario)
    model.runningProperty.link(syncPlayPause)
    model.showLabelsProperty.link(syncDisplay)
    model.showDensitiesProperty.link(syncDisplay)
    model.showVerdictProperty.link(syncDisplay)
    model.yProperty.link(syncStage)
    model.objectDensityProperty.link(syncStage)
    model.fluidDensityProperty.link(syncStage)
    model.verdictProperty.link(syncStage)
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
      FloatingSinkingStrings.quizQuestionStringProperty.value,
      [
        { label: FloatingSinkingStrings.quizCorrectStringProperty.value, correct: true },
        { label: FloatingSinkingStrings.quizWrongStringProperty.value, correct: false },
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
