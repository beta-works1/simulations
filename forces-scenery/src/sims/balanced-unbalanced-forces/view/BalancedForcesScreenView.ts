import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { BalancedForcesModel, BalancedForcesScenario } from '../model/BalancedForcesModel.js'
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
import { BalancedForcesStrings } from '../BalancedForcesStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SCENARIOS: readonly BalancedForcesScenario[] = ['explore', 'balanced', 'pushRight', 'pushLeft']

const SCENARIO_GUIDE: Record<BalancedForcesScenario, string> = {
  explore: BalancedForcesStrings.guideExploreStringProperty.value,
  balanced: BalancedForcesStrings.guideBalancedStringProperty.value,
  pushRight: BalancedForcesStrings.guidePushRightStringProperty.value,
  pushLeft: BalancedForcesStrings.guidePushLeftStringProperty.value,
}

const SCENARIO_TRIAD: Record<BalancedForcesScenario, [string, string, string]> = {
  explore: [
    'Adjusting forces on a block.',
    'Forces are pushes or pulls. Net force F_net = F_right − F_left.',
    'Try Balanced forces to see zero net force.',
  ],
  balanced: [
    'Forces are balanced.',
    'Equal and opposite forces cancel — F_net = 0, so there is no acceleration.',
    'Try Push right to feel unbalanced motion.',
  ],
  pushRight: [
    'Unbalanced to the right.',
    'The right force is bigger, so F_net points right and the block accelerates.',
    'Match the forces again to stop accelerating.',
  ],
  pushLeft: [
    'Unbalanced to the left.',
    'The left force is bigger — the block accelerates leftward.',
    'Return to Explore to test your own force pairs.',
  ],
}

const SCENARIO_LABELS: Record<BalancedForcesScenario, string> = {
  explore: BalancedForcesStrings.scenarioExploreStringProperty.value,
  balanced: BalancedForcesStrings.scenarioBalancedStringProperty.value,
  pushRight: BalancedForcesStrings.scenarioPushRightStringProperty.value,
  pushLeft: BalancedForcesStrings.scenarioPushLeftStringProperty.value,
}

function makeArrow(x: number, y: number, dir: 1 | -1, len: number, color: string): Node {
  const tip = x + dir * len
  const head = 12
  const shaft = new Path(new Shape().moveTo(x, y).lineTo(tip - dir * head * 0.3, y), {
    stroke: color,
    lineWidth: 4,
    lineCap: 'round',
  })
  const headShape = new Shape()
    .moveTo(tip, y)
    .lineTo(tip - dir * head, y - head * 0.55)
    .lineTo(tip - dir * head, y + head * 0.55)
    .close()
  const headPath = new Path(headShape, { fill: color })
  return new Node({ children: [shaft, headPath] })
}

export class BalancedForcesScreenView extends ScreenView {
  private readonly model: BalancedForcesModel
  private readonly sounds: ForcesSounds
  private readonly particles: ParticleBurst
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly leftLearnTip: Node
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private tipTimer = 0

  private readonly stageW: number
  private readonly stageCenterX: number
  private readonly floorY: number

  private readonly blockNode: Rectangle
  private readonly arrowsLayer: Node
  private readonly labelsLayer: Node
  private readonly netForceText: Text
  private readonly captionText: Text
  private readonly titleText: Text

  private readonly scenarioButtons: Record<BalancedForcesScenario, SoftButton>
  private readonly runningToggleBtn: SoftButton
  private readonly labelsBtn: SoftButton
  private readonly arrowsBtn: SoftButton
  private readonly netForceBtn: SoftButton
  private readonly playPauseBtn: SoftButton
  private readonly soundBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: RichText

  public constructor(model: BalancedForcesModel, providedOptions?: Options) {
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
    this.stageW = stageW
    this.stageCenterX = stageCenterX
    this.floorY = stageTop + stageH * 0.72

    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: BalancedForcesStrings.guideTitleStringProperty.value,
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

    this.leftLearnTip = createPanelTip(BalancedForcesStrings.learnMoreStringProperty.value, {
      width: leftW - 24,
      fontSize: 11,
      fill: ForcesColors.panelMuted,
    })
    this.leftLearnTip.left = 12
    this.leftLearnTip.top = this.teachingTriad.bottom + 16
    leftCard.content.addChild(this.leftLearnTip)

    this.addChild(new StageBackdrop(stageLeft, stageTop, stageW, stageH, { top: '#c7d2e0', bottom: '#eef2f7' }))

    this.titleText = new Text(BalancedForcesStrings.stageTitleStringProperty.value, {
      font: new PhetFont({ size: 18, weight: 'bold' }),
      fill: '#0f172a',
      centerX: stageCenterX,
      top: stageTop + 10,
    })
    this.addChild(this.titleText)

    this.captionText = new Text('', {
      font: new PhetFont({ size: 14, weight: 'bold' }),
      fill: ForcesColors.accent,
      centerX: stageCenterX,
      top: this.titleText.bottom + 4,
    })
    this.addChild(this.captionText)

    this.addChild(new Rectangle(stageLeft + stageW * 0.05, this.floorY, stageW * 0.9, 4, { fill: '#94a3b8' }))
    for (let i = 0; i < 10; i++) {
      const hx = stageLeft + stageW * 0.05 + i * ((stageW * 0.9) / 9)
      this.addChild(new Path(new Shape().moveTo(hx, this.floorY).lineTo(hx - 8, this.floorY + 12), {
        stroke: '#94a3b8',
        lineWidth: 2,
      }))
    }

    this.blockNode = new Rectangle(0, 0, 40, 40, {
      fill: '#5dade2',
      stroke: '#2c3e50',
      lineWidth: 2,
      cornerRadius: 4,
    })
    this.addChild(this.blockNode)

    this.arrowsLayer = new Node({ pickable: false })
    this.addChild(this.arrowsLayer)

    this.netForceText = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#0f172a',
      centerX: stageCenterX,
      top: stageTop + stageH * 0.2,
    })
    this.addChild(this.netForceText)

    this.labelsLayer = new Node({ pickable: false })
    this.labelsLayer.addChild(
      new Text(BalancedForcesStrings.trackLabelStringProperty.value, {
        font: new PhetFont({ size: 11, weight: 'bold' }),
        fill: '#0f172a',
        left: stageLeft + 12,
        top: this.floorY + 16,
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
      new Text(BalancedForcesStrings.tipTitleStringProperty.value, {
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

    const card = new DepthCard(rightW, stageH)
    card.left = stageLeft + stageW + gap
    card.top = stageTop
    this.addChild(card)

    const panelContent = new Node()
    const contentW = rightW - 42
    const halfW = (contentW - 8) / 2
    const btnH = 32
    const gridGap = 6

    const scenarioHeader = controlSection(BalancedForcesStrings.sectionScenarioStringProperty.value, contentW)
    panelContent.addChild(scenarioHeader)

    this.scenarioButtons = {} as Record<BalancedForcesScenario, SoftButton>
    for (const scenario of SCENARIOS) {
      const btn = new SoftButton(
        SCENARIO_LABELS[scenario],
        () => model.setScenario(scenario),
        {
          width: contentW,
          height: btnH,
          fill: scenario === 'explore' ? ForcesColors.accent : '#64748b',
          selected: scenario === 'explore',
          fontSize: 12,
          onSound: () => sounds.scenario(),
        },
      )
      this.scenarioButtons[scenario] = btn
      panelContent.addChild(btn)
    }

    const conditionsHeader = controlSection(BalancedForcesStrings.sectionConditionsStringProperty.value, contentW)
    panelContent.addChild(conditionsHeader)

    this.runningToggleBtn = new SoftButton(
      BalancedForcesStrings.runningOnStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: contentW, height: btnH, fill: ForcesColors.accent, fontSize: 12, selected: true },
    )
    panelContent.addChild(this.runningToggleBtn)

    const fLeftSlider = new DepthSlider(model.fLeftProperty, {
      min: 0,
      max: 20,
      width: contentW,
      label: BalancedForcesStrings.fLeftSliderStringProperty.value,
      format: (n) => `${n.toFixed(0)} N`,
      fill: '#e74c3c',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(fLeftSlider)

    const fRightSlider = new DepthSlider(model.fRightProperty, {
      min: 0,
      max: 20,
      width: contentW,
      label: BalancedForcesStrings.fRightSliderStringProperty.value,
      format: (n) => `${n.toFixed(0)} N`,
      fill: '#27ae60',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(fRightSlider)

    const massSlider = new DepthSlider(model.massProperty, {
      min: 1,
      max: 10,
      width: contentW,
      label: BalancedForcesStrings.massSliderStringProperty.value,
      format: (n) => `${n.toFixed(0)} kg`,
      fill: '#5dade2',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(massSlider)

    const speedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: BalancedForcesStrings.speedSliderStringProperty.value,
      format: (n) => `${n.toFixed(2)}×`,
      fill: ForcesColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(speedSlider)

    const conditionsHint = controlHint(BalancedForcesStrings.conditionsHintStringProperty.value, contentW)
    panelContent.addChild(conditionsHint)

    const displayHeader = controlSection(BalancedForcesStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)

    this.labelsBtn = new SoftButton(
      BalancedForcesStrings.labelsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showLabelsProperty.value = !model.showLabelsProperty.value
      },
      { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true },
    )
    this.arrowsBtn = new SoftButton(
      BalancedForcesStrings.arrowsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showArrowsProperty.value = !model.showArrowsProperty.value
      },
      { width: halfW, height: btnH, fill: '#f59e0b', fontSize: 10, selected: true },
    )
    this.netForceBtn = new SoftButton(
      BalancedForcesStrings.netForceOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showNetForceProperty.value = !model.showNetForceProperty.value
      },
      { width: contentW, height: btnH, fill: '#0ea5e9', fontSize: 12, selected: true },
    )
    panelContent.addChild(this.labelsBtn)
    panelContent.addChild(this.arrowsBtn)
    panelContent.addChild(this.netForceBtn)

    const playbackHeader = controlSection(BalancedForcesStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)

    this.playPauseBtn = new SoftButton(
      BalancedForcesStrings.playButtonStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: contentW, height: 38, fill: ForcesColors.accent, fontSize: 12 },
    )
    panelContent.addChild(this.playPauseBtn)

    const soundHeader = controlSection(BalancedForcesStrings.sectionSoundStringProperty.value, contentW)
    panelContent.addChild(soundHeader)

    this.soundBtn = new SoftButton(
      BalancedForcesStrings.soundOnStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        this.soundBtn.setLabel(on ? BalancedForcesStrings.soundOnStringProperty.value : BalancedForcesStrings.soundOffStringProperty.value)
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.soundBtn)

    const statusHeader = controlSection(BalancedForcesStrings.sectionStatusStringProperty.value, contentW)
    panelContent.addChild(statusHeader)

    this.starsText = new Text('', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: '#d97706',
    })
    panelContent.addChild(this.starsText)

    this.statusText = new RichText(model.statusProperty.value, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: ForcesColors.panelText,
      lineWrap: contentW,
      leading: 3,
    })
    panelContent.addChild(this.statusText)

    const learnTip = createPanelTip(BalancedForcesStrings.learnMoreStringProperty.value, {
      width: contentW,
      fontSize: 11,
    })
    panelContent.addChild(learnTip)

    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false })
    panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      scenarioHeader.left = 0
      scenarioHeader.top = py
      py = scenarioHeader.bottom + 6
      for (const scenario of SCENARIOS) {
        const btn = this.scenarioButtons[scenario]
        btn.left = 0
        btn.top = py
        py = btn.bottom + gridGap
      }
      py += 6
      conditionsHeader.left = 0
      conditionsHeader.top = py
      py = conditionsHeader.bottom + 6
      this.runningToggleBtn.left = 0
      this.runningToggleBtn.top = py
      py = this.runningToggleBtn.bottom + gridGap
      fLeftSlider.left = 0
      fLeftSlider.top = py
      py = fLeftSlider.bottom + gridGap
      fRightSlider.left = 0
      fRightSlider.top = py
      py = fRightSlider.bottom + gridGap
      massSlider.left = 0
      massSlider.top = py
      py = massSlider.bottom + gridGap
      speedSlider.left = 0
      speedSlider.top = py
      py = speedSlider.bottom + 4
      conditionsHint.left = 0
      conditionsHint.top = py
      py = conditionsHint.bottom + 12
      displayHeader.left = 0
      displayHeader.top = py
      py = displayHeader.bottom + 6
      this.labelsBtn.left = 0
      this.labelsBtn.top = py
      this.arrowsBtn.left = halfW + 8
      this.arrowsBtn.top = py
      py = this.labelsBtn.bottom + gridGap
      this.netForceBtn.left = 0
      this.netForceBtn.top = py
      py = this.netForceBtn.bottom + 12
      playbackHeader.left = 0
      playbackHeader.top = py
      py = playbackHeader.bottom + 6
      this.playPauseBtn.left = 0
      this.playPauseBtn.top = py
      py = this.playPauseBtn.bottom + 12
      soundHeader.left = 0
      soundHeader.top = py
      py = soundHeader.bottom + 6
      this.soundBtn.left = 0
      this.soundBtn.top = py
      py = this.soundBtn.bottom + 12
      statusHeader.left = 0
      statusHeader.top = py
      py = statusHeader.bottom + 6
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

    const syncStars = () => {
      this.starsText.string = `${BalancedForcesStrings.starsStringProperty.value} ${model.starsProperty.value}`
    }
    const syncPlayPause = () => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(running ? BalancedForcesStrings.pauseButtonStringProperty.value : BalancedForcesStrings.playButtonStringProperty.value)
      this.runningToggleBtn.setLabel(running ? BalancedForcesStrings.runningOnStringProperty.value : BalancedForcesStrings.runningOffStringProperty.value)
      this.runningToggleBtn.setSelected(running)
    }
    const syncScenario = () => {
      const scenario = model.scenarioProperty.value
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(s === scenario)
      this.guide.setGuidance(BalancedForcesStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[scenario])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[scenario], () => {
        this.leftLearnTip.top = this.teachingTriad.bottom + 16
      })
    }
    const syncLabels = () => {
      this.labelsBtn.setSelected(model.showLabelsProperty.value)
      this.labelsBtn.setLabel(model.showLabelsProperty.value ? BalancedForcesStrings.labelsOnStringProperty.value : BalancedForcesStrings.labelsOffStringProperty.value)
      this.labelsLayer.visible = model.showLabelsProperty.value
    }
    const syncArrows = () => {
      this.arrowsBtn.setSelected(model.showArrowsProperty.value)
      this.arrowsBtn.setLabel(model.showArrowsProperty.value ? BalancedForcesStrings.arrowsOnStringProperty.value : BalancedForcesStrings.arrowsOffStringProperty.value)
      this.arrowsLayer.visible = model.showArrowsProperty.value
    }
    const syncNetForce = () => {
      this.netForceBtn.setSelected(model.showNetForceProperty.value)
      this.netForceBtn.setLabel(model.showNetForceProperty.value ? BalancedForcesStrings.netForceOnStringProperty.value : BalancedForcesStrings.netForceOffStringProperty.value)
      this.netForceText.visible = model.showNetForceProperty.value
    }
    const syncStage = () => {
      const pos = model.positionProperty.value
      const mass = model.massProperty.value
      const fL = model.fLeftProperty.value
      const fR = model.fRightProperty.value
      const fNet = model.fNet
      const box = 28 + mass * 4
      const cx = this.stageCenterX + pos * this.stageW * 0.28
      const cy = this.floorY - box / 2 - 2
      this.blockNode.setRect(cx - box / 2, cy - box / 2, box, box)
      this.arrowsLayer.removeAllChildren()
      const scale = this.stageW * 0.025
      if (fL > 0.5) this.arrowsLayer.addChild(makeArrow(cx - box / 2 - 8, cy, -1, fL * scale, '#e74c3c'))
      if (fR > 0.5) this.arrowsLayer.addChild(makeArrow(cx + box / 2 + 8, cy, 1, fR * scale, '#27ae60'))
      const verdict =
        Math.abs(fNet) < 0.5 ? 'Balanced — no acceleration' : fNet > 0 ? 'Unbalanced — accelerates right' : 'Unbalanced — accelerates left'
      this.captionText.string = verdict
      this.captionText.centerX = this.stageCenterX
      this.netForceText.string = `${BalancedForcesStrings.fNetLabelStringProperty.value} ${fNet.toFixed(1)} N · ${BalancedForcesStrings.accelLabelStringProperty.value} ${model.acceleration.toFixed(2)} m/s²`
      this.netForceText.centerX = this.stageCenterX
    }

    model.scenarioProperty.link(syncScenario)
    model.runningProperty.link(syncPlayPause)
    model.showLabelsProperty.link(syncLabels)
    model.showArrowsProperty.link(syncArrows)
    model.showNetForceProperty.link(syncNetForce)
    model.positionProperty.link(syncStage)
    model.fLeftProperty.link(syncStage)
    model.fRightProperty.link(syncStage)
    model.massProperty.link(syncStage)
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(syncStars)
    model.statusProperty.link((status) => {
      this.statusText.string = status
      relayoutPanel()
    })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.starsProperty.lazyLink((stars, oldStars) => {
      if (oldStars !== undefined && stars > oldStars) sounds.celebrate()
    })

    syncStars()
    syncPlayPause()
    syncScenario()
    syncLabels()
    syncArrows()
    syncNetForce()
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
      BalancedForcesStrings.quizQuestionStringProperty.value,
      [
        { label: BalancedForcesStrings.quizCorrectStringProperty.value, correct: true },
        { label: BalancedForcesStrings.quizWrongStringProperty.value, correct: false },
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
