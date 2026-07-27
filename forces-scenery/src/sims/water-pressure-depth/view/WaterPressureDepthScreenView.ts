import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { WaterPressureDepthModel, WaterScenario } from '../model/WaterPressureDepthModel.js'
import { FLUIDS } from '../../../shared/waterPressureModel.js'
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
import { WaterPressureDepthStrings } from '../WaterPressureDepthStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SCENARIOS: readonly WaterScenario[] = ['explore', 'shallow', 'deep']

const SCENARIO_GUIDE: Record<WaterScenario, string> = {
  explore: WaterPressureDepthStrings.guideExploreStringProperty.value,
  shallow: WaterPressureDepthStrings.guideShallowStringProperty.value,
  deep: WaterPressureDepthStrings.guideDeepStringProperty.value,
}

const SCENARIO_TRIAD: Record<WaterScenario, [string, string, string]> = {
  explore: [
    'Probing water depth.',
    'Gauge pressure P = ρgh — deeper means more fluid weight above.',
    'Side jets shoot farther where pressure is higher.',
  ],
  shallow: [
    'Shallow probe.',
    'Near the top, depth is small so pressure and jet speed stay weak.',
    'Try Deep probe to compare.',
  ],
  deep: [
    'Deep probe.',
    'More depth → higher ρgh → stronger jets from side holes.',
    'Switch fluids to see density effects.',
  ],
}

const SCENARIO_LABELS: Record<WaterScenario, string> = {
  explore: WaterPressureDepthStrings.scenarioExploreStringProperty.value,
  shallow: WaterPressureDepthStrings.scenarioShallowStringProperty.value,
  deep: WaterPressureDepthStrings.scenarioDeepStringProperty.value,
}

export class WaterPressureDepthScreenView extends ScreenView {
  private readonly model: WaterPressureDepthModel
  private readonly sounds: ForcesSounds
  private readonly particles: ParticleBurst
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly leftLearnTip: Node
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private tipTimer = 0

  private readonly stageLeft: number
  private readonly stageTop: number
  private readonly stageW: number
  private readonly stageH: number
  private readonly tankL: number
  private readonly tankR: number
  private readonly tankT: number
  private readonly tankB: number

  private readonly waterRect: Rectangle
  private readonly probeLine: Rectangle
  private readonly gaugeText: Text
  private readonly captionText: Text
  private readonly jetsLayer: Node
  private readonly labelsLayer: Node
  private readonly gaugeLayer: Node
  private readonly holeMarks: Node

  private scenarioButtons!: Record<WaterScenario, SoftButton>
  private readonly fluidButtons: SoftButton[] = []
  private runningToggleBtn!: SoftButton
  private labelsBtn!: SoftButton
  private jetsBtn!: SoftButton
  private gaugeBtn!: SoftButton
  private playPauseBtn!: SoftButton
  private soundBtn!: SoftButton
  private starsText!: Text
  private statusText!: RichText

  public constructor(model: WaterPressureDepthModel, providedOptions?: Options) {
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
    this.stageLeft = stageLeft
    this.stageTop = stageTop
    this.stageW = stageW
    this.stageH = stageH
    this.tankL = stageLeft + stageW * 0.28
    this.tankR = stageLeft + stageW * 0.72
    this.tankT = stageTop + stageH * 0.12
    this.tankB = stageTop + stageH * 0.82

    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: WaterPressureDepthStrings.guideTitleStringProperty.value,
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

    this.leftLearnTip = createPanelTip(WaterPressureDepthStrings.learnMoreStringProperty.value, {
      width: leftW - 24,
      fontSize: 11,
      fill: ForcesColors.panelMuted,
    })
    this.leftLearnTip.left = 12
    this.leftLearnTip.top = this.teachingTriad.bottom + 16
    leftCard.content.addChild(this.leftLearnTip)

    this.addChild(new StageBackdrop(stageLeft, stageTop, stageW, stageH, { top: '#c7d2e0', bottom: '#eef2f7' }))

    this.addChild(
      new Text(WaterPressureDepthStrings.stageTitleStringProperty.value, {
        font: new PhetFont({ size: 18, weight: 'bold' }),
        fill: '#0f172a',
        centerX: stageCenterX,
        top: stageTop + 10,
      }),
    )

    this.captionText = new Text(WaterPressureDepthStrings.depthCaptionStringProperty.value, {
      font: new PhetFont({ size: 14, weight: 'bold' }),
      fill: ForcesColors.accent,
      centerX: stageCenterX,
      top: stageTop + 36,
    })
    this.addChild(this.captionText)

    this.addChild(
      new Rectangle(this.tankL, this.tankT, this.tankR - this.tankL, this.tankB - this.tankT, {
        cornerRadius: 6,
        fill: 'rgba(248,250,252,0.15)',
        stroke: '#5d6d7e',
        lineWidth: 3,
      }),
    )

    this.waterRect = new Rectangle(this.tankL + 3, this.tankT + 20, this.tankR - this.tankL - 6, this.tankB - this.tankT - 23, {
      fill: 'rgba(52,152,219,0.5)',
    })
    this.addChild(this.waterRect)

    this.holeMarks = new Node({ pickable: false })
    for (const frac of [0.25, 0.5, 0.75]) {
      const hy = this.tankT + frac * (this.tankB - this.tankT)
      this.holeMarks.addChild(new Circle(4, { fill: '#2c3e50', centerX: this.tankR, centerY: hy }))
    }
    this.addChild(this.holeMarks)

    this.probeLine = new Rectangle(this.tankL - 30, 0, 30, 3, { fill: '#e74c3c' })
    this.addChild(this.probeLine)
    this.addChild(
      new Rectangle(this.tankL - 52, 0, 22, 28, { fill: '#e74c3c', cornerRadius: 4 }),
    )

    this.gaugeText = new Text('', {
      font: new PhetFont({ size: 14, weight: 'bold' }),
      fill: '#c0392b',
    })
    this.addChild(this.gaugeText)

    this.gaugeLayer = new Node({ pickable: false })
    this.gaugeLayer.addChild(this.gaugeText)
    this.addChild(this.gaugeLayer)

    this.jetsLayer = new Node({ pickable: false })
    this.addChild(this.jetsLayer)

    this.labelsLayer = new Node({ pickable: false })
    this.labelsLayer.addChild(
      new Text(WaterPressureDepthStrings.tankLabelStringProperty.value, {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#0f172a',
        centerX: stageCenterX,
        top: this.tankB + 8,
      }),
    )
    this.labelsLayer.addChild(
      new Text(WaterPressureDepthStrings.probeLabelStringProperty.value, {
        font: new PhetFont({ size: 10, weight: 'bold' }),
        fill: '#e74c3c',
        left: this.tankL - 70,
        top: this.tankT,
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
      new Text(WaterPressureDepthStrings.tipTitleStringProperty.value, {
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
    model: WaterPressureDepthModel,
  ): void {
    const card = new DepthCard(rightW, stageH)
    card.left = stageLeft + stageW + gap
    card.top = stageTop
    this.addChild(card)

    const panelContent = new Node()
    const contentW = rightW - 42
    const btnH = 32
    const gridGap = 6

    const scenarioHeader = controlSection(WaterPressureDepthStrings.sectionScenarioStringProperty.value, contentW)
    panelContent.addChild(scenarioHeader)

    this.scenarioButtons = {} as Record<WaterScenario, SoftButton>
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

    const conditionsHeader = controlSection(WaterPressureDepthStrings.sectionConditionsStringProperty.value, contentW)
    panelContent.addChild(conditionsHeader)

    this.runningToggleBtn = new SoftButton(
      WaterPressureDepthStrings.runningOnStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: contentW, height: btnH, fill: ForcesColors.accent, fontSize: 12, selected: true },
    )
    panelContent.addChild(this.runningToggleBtn)

    const fillSlider = new DepthSlider(model.fillHeightProperty, {
      min: 0.3,
      max: 1,
      width: contentW,
      label: WaterPressureDepthStrings.fillSliderStringProperty.value,
      format: (n) => `${Math.round(n * 100)}%`,
      fill: '#3498db',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(fillSlider)

    const probeSlider = new DepthSlider(model.probeDepthProperty, {
      min: 0.1,
      max: 0.95,
      width: contentW,
      label: WaterPressureDepthStrings.probeSliderStringProperty.value,
      format: (n) => `${Math.round(n * 100)}%`,
      fill: '#e74c3c',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(probeSlider)

    const speedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: WaterPressureDepthStrings.speedSliderStringProperty.value,
      format: (n) => `${n.toFixed(2)}×`,
      fill: ForcesColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(speedSlider)

    const conditionsHint = controlHint(WaterPressureDepthStrings.conditionsHintStringProperty.value, contentW)
    panelContent.addChild(conditionsHint)

    const fluidHeader = controlSection(WaterPressureDepthStrings.sectionFluidStringProperty.value, contentW)
    panelContent.addChild(fluidHeader)

    for (const fluid of FLUIDS) {
      const btn = new SoftButton(
        fluid.id === 'water' ? 'Water' : fluid.id === 'salt' ? 'Salt water' : 'Mercury-like',
        () => {
          model.setFluid(fluid.id)
          sounds.select()
          for (const b of this.fluidButtons) b.setSelected(false)
          btn.setSelected(true)
        },
        {
          width: contentW,
          height: btnH,
          fill: fluid.rho > 5 ? '#95a5a6' : '#3498db',
          selected: fluid.id === 'water',
          fontSize: 11,
        },
      )
      this.fluidButtons.push(btn)
      panelContent.addChild(btn)
    }

    const displayHeader = controlSection(WaterPressureDepthStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)

    this.labelsBtn = new SoftButton(
      WaterPressureDepthStrings.labelsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showLabelsProperty.value = !model.showLabelsProperty.value
      },
      { width: (contentW - 8) / 2, height: btnH, fill: '#64748b', fontSize: 11, selected: true },
    )
    this.jetsBtn = new SoftButton(
      WaterPressureDepthStrings.jetsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showJetsProperty.value = !model.showJetsProperty.value
      },
      { width: (contentW - 8) / 2, height: btnH, fill: '#f59e0b', fontSize: 10, selected: true },
    )
    this.gaugeBtn = new SoftButton(
      WaterPressureDepthStrings.gaugeOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showGaugeProperty.value = !model.showGaugeProperty.value
      },
      { width: contentW, height: btnH, fill: '#0ea5e9', fontSize: 12, selected: true },
    )
    panelContent.addChild(this.labelsBtn)
    panelContent.addChild(this.jetsBtn)
    panelContent.addChild(this.gaugeBtn)

    const playbackHeader = controlSection(WaterPressureDepthStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)

    this.playPauseBtn = new SoftButton(
      WaterPressureDepthStrings.playButtonStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: contentW, height: 38, fill: ForcesColors.accent, fontSize: 12 },
    )
    panelContent.addChild(this.playPauseBtn)

    const soundHeader = controlSection(WaterPressureDepthStrings.sectionSoundStringProperty.value, contentW)
    panelContent.addChild(soundHeader)

    this.soundBtn = new SoftButton(
      WaterPressureDepthStrings.soundOnStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        this.soundBtn.setLabel(on ? WaterPressureDepthStrings.soundOnStringProperty.value : WaterPressureDepthStrings.soundOffStringProperty.value)
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.soundBtn)

    const statusHeader = controlSection(WaterPressureDepthStrings.sectionStatusStringProperty.value, contentW)
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

    const learnTip = createPanelTip(WaterPressureDepthStrings.learnMoreStringProperty.value, { width: contentW, fontSize: 11 })
    panelContent.addChild(learnTip)

    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false })
    panelContent.addChild(bottomPad)

    const halfW = (contentW - 8) / 2
    const relayoutPanel = () => {
      let py = 4
      const stack = (n: Node) => { n.left = 0; n.top = py; py = n.bottom + gridGap }
      stack(scenarioHeader)
      for (const s of SCENARIOS) stack(this.scenarioButtons[s])
      py += 4
      stack(conditionsHeader)
      stack(this.runningToggleBtn)
      stack(fillSlider)
      stack(probeSlider)
      stack(speedSlider)
      conditionsHint.left = 0
      conditionsHint.top = py
      py = conditionsHint.bottom + 12
      stack(fluidHeader)
      for (const btn of this.fluidButtons) stack(btn)
      py += 4
      stack(displayHeader)
      this.labelsBtn.left = 0
      this.labelsBtn.top = py
      this.jetsBtn.left = halfW + 8
      this.jetsBtn.top = py
      py = this.labelsBtn.bottom + gridGap
      stack(this.gaugeBtn)
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
          for (let i = 0; i < this.fluidButtons.length; i++) {
            this.fluidButtons[i].setSelected(FLUIDS[i].id === 'water')
          }
        },
        right: lb.right - m,
        bottom: lb.bottom - my,
      }),
    )

    model.statusProperty.link(() => relayoutPanel())
  }

  private wireModel(model: WaterPressureDepthModel, sounds: ForcesSounds): void {
    const syncStars = () => {
      this.starsText.string = `${WaterPressureDepthStrings.starsStringProperty.value} ${model.starsProperty.value}`
    }
    const syncPlayPause = () => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(running ? WaterPressureDepthStrings.pauseButtonStringProperty.value : WaterPressureDepthStrings.playButtonStringProperty.value)
      this.runningToggleBtn.setLabel(running ? WaterPressureDepthStrings.runningOnStringProperty.value : WaterPressureDepthStrings.runningOffStringProperty.value)
      this.runningToggleBtn.setSelected(running)
    }
    const syncScenario = () => {
      const scenario = model.scenarioProperty.value
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(s === scenario)
      this.guide.setGuidance(WaterPressureDepthStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[scenario])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[scenario], () => {
        this.leftLearnTip.top = this.teachingTriad.bottom + 16
      })
    }
    const syncDisplay = () => {
      this.labelsBtn.setSelected(model.showLabelsProperty.value)
      this.labelsBtn.setLabel(model.showLabelsProperty.value ? WaterPressureDepthStrings.labelsOnStringProperty.value : WaterPressureDepthStrings.labelsOffStringProperty.value)
      this.labelsLayer.visible = model.showLabelsProperty.value
      this.jetsBtn.setSelected(model.showJetsProperty.value)
      this.jetsBtn.setLabel(model.showJetsProperty.value ? WaterPressureDepthStrings.jetsOnStringProperty.value : WaterPressureDepthStrings.jetsOffStringProperty.value)
      this.jetsLayer.visible = model.showJetsProperty.value
      this.gaugeBtn.setSelected(model.showGaugeProperty.value)
      this.gaugeBtn.setLabel(model.showGaugeProperty.value ? WaterPressureDepthStrings.gaugeOnStringProperty.value : WaterPressureDepthStrings.gaugeOffStringProperty.value)
      this.gaugeLayer.visible = model.showGaugeProperty.value
    }
    const syncStage = () => {
      const fh = model.fillHeightProperty.value
      const pd = model.probeDepthProperty.value
      const rho = model.rho
      const waterTop = this.tankB - fh * (this.tankB - this.tankT - 10)
      this.waterRect.setRect(this.tankL + 3, waterTop, this.tankR - this.tankL - 6, this.tankB - waterTop - 3)
      this.waterRect.fill = rho > 5 ? 'rgba(149,165,166,0.7)' : 'rgba(52,152,219,0.5)'

      const probeY = this.tankT + pd * (this.tankB - this.tankT)
      this.probeLine.centerY = probeY
      this.probeLine.left = this.tankL - 30

      const p = model.probePressureProperty.value
      this.gaugeText.string = `P = ${p.toFixed(1)} kPa (ρgh)`
      this.gaugeText.left = this.tankL - 90
      this.gaugeText.centerY = probeY - 24

      this.jetsLayer.removeAllChildren()
    }

    model.scenarioProperty.link(syncScenario)
    model.runningProperty.link(syncPlayPause)
    model.showLabelsProperty.link(syncDisplay)
    model.showJetsProperty.link(syncDisplay)
    model.showGaugeProperty.link(syncDisplay)
    model.fillHeightProperty.link(syncStage)
    model.probeDepthProperty.link(syncStage)
    model.probePressureProperty.link(syncStage)
    model.fluidIdProperty.link(syncStage)
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
      WaterPressureDepthStrings.quizQuestionStringProperty.value,
      [
        { label: WaterPressureDepthStrings.quizCorrectStringProperty.value, correct: true },
        { label: WaterPressureDepthStrings.quizWrongStringProperty.value, correct: false },
      ],
      (correct) => {
        correct ? this.sounds.correct() : this.sounds.wrong()
        this.model.onQuiz(correct)
      },
    )
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.syncJets()
    this.particles.step(dt)
    if (this.tipTimer > 0) {
      this.tipTimer -= dt
      if (this.tipTimer < 0.6) this.tipCard.opacity = Math.max(0, this.tipTimer / 0.6)
      if (this.tipTimer <= 0) this.tipCard.visible = false
    }
  }

  private syncJets(): void {
    if (!this.model.showJetsProperty.value) return
    const rho = this.model.rho
    const jetColor = rho > 5 ? 'rgba(127,140,141,0.85)' : 'rgba(41,128,185,0.75)'
    this.jetsLayer.removeAllChildren()
    for (const j of this.model.jets) {
      const stageX = this.stageLeft + (j.x / 800) * this.stageW
      const stageY = this.stageTop + (j.y / 500) * this.stageH
      this.jetsLayer.addChild(
        new Circle(2 + j.life * 2, { fill: jetColor, centerX: stageX, centerY: stageY, opacity: j.life }),
      )
    }
  }
}
