import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { LawsOfReflectionModel, LawsScenario } from '../model/LawsOfReflectionModel.js'
import { sourceFromIncidence } from '../../../shared/lawsOfReflectionModel.js'
import { LightConstants } from '../../../shared/LightConstants.js'
import { LightColors } from '../../../shared/LightColors.js'
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
import { LightSounds } from '../../../shared/LightSounds.js'
import { LawsOfReflectionStrings } from '../LawsOfReflectionStrings.js'
import {
  dot2,
  makeAngleArc,
  makeDashedLine,
  makeLabel,
  makeLightSource,
  makeRay,
  MIRROR_COLOR,
  normalize,
  RAY_CYAN,
  RAY_WHITE,
  RAY_YELLOW,
  RAD2DEG,
  type Vec2,
} from '../../../shared/opticsDraw.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SCENARIOS: readonly LawsScenario[] = ['explore', 'grazing', 'nearNormal']

const SCENARIO_GUIDE: Record<LawsScenario, string> = {
  explore: LawsOfReflectionStrings.guideExploreStringProperty.value,
  grazing: LawsOfReflectionStrings.guideGrazingStringProperty.value,
  nearNormal: LawsOfReflectionStrings.guideNearNormalStringProperty.value,
}

const SCENARIO_TRIAD: Record<LawsScenario, [string, string, string]> = {
  explore: [
    'Adjusting the incidence angle.',
    'Light reflects from a mirror so ∠i (incident) equals ∠r (reflected) — both measured from the normal.',
    'Try Grazing to see a large skimming angle.',
  ],
  grazing: [
    'Grazing incidence.',
    'The ray hits at a shallow angle — ∠i and ∠r are both large but still equal.',
    'Try Near-normal for a small-angle comparison.',
  ],
  nearNormal: [
    'Near-normal incidence.',
    'Light hits almost straight on — both angles are small and equal.',
    'Return to Explore to test your own angles.',
  ],
}

const SCENARIO_LABELS: Record<LawsScenario, string> = {
  explore: LawsOfReflectionStrings.scenarioExploreStringProperty.value,
  grazing: LawsOfReflectionStrings.scenarioGrazingStringProperty.value,
  nearNormal: LawsOfReflectionStrings.scenarioNearNormalStringProperty.value,
}

export class LawsOfReflectionScreenView extends ScreenView {
  private readonly model: LawsOfReflectionModel
  private readonly sounds: LightSounds
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
  private readonly stageCenterX: number

  private readonly stageLayer: Node
  private readonly labelsLayer: Node
  private readonly normalLayer: Node
  private readonly anglesLayer: Node
  private readonly captionText: Text
  private readonly titleText: Text

  private readonly scenarioButtons: Record<LawsScenario, SoftButton>
  private readonly runningToggleBtn: SoftButton
  private readonly labelsBtn: SoftButton
  private readonly normalBtn: SoftButton
  private readonly anglesBtn: SoftButton
  private readonly playPauseBtn: SoftButton
  private readonly soundBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: RichText

  public constructor(model: LawsOfReflectionModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model

    const sounds = new LightSounds()
    this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })

    const m = LightConstants.SCREEN_VIEW_X_MARGIN
    const my = LightConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    const leftW = 190
    const rightW = 290
    const gap = 14
    this.stageLeft = m + leftW + gap
    this.stageTop = my + 78
    this.stageW = lb.width - m * 2 - leftW - gap - rightW - gap
    this.stageH = lb.height - my * 2 - 78
    this.stageCenterX = this.stageLeft + this.stageW / 2

    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: LawsOfReflectionStrings.guideTitleStringProperty.value,
      body: SCENARIO_GUIDE.explore,
    })
    this.guide.left = m
    this.guide.top = my
    this.addChild(this.guide)

    const leftCard = new DepthCard(leftW, this.stageH, { variant: 'light' })
    leftCard.left = m
    leftCard.top = this.stageTop
    this.addChild(leftCard)

    this.teachingTriad = new TeachingTriad(leftW - 24)
    this.teachingTriad.left = 12
    this.teachingTriad.top = 12
    leftCard.content.addChild(this.teachingTriad)

    this.leftLearnTip = createPanelTip(LawsOfReflectionStrings.learnMoreStringProperty.value, {
      width: leftW - 24,
      fontSize: 11,
      fill: LightColors.panelMuted,
    })
    this.leftLearnTip.left = 12
    this.leftLearnTip.top = this.teachingTriad.bottom + 16
    leftCard.content.addChild(this.leftLearnTip)

    this.addChild(new StageBackdrop(this.stageLeft, this.stageTop, this.stageW, this.stageH, {
      top: '#c7d2e0',
      bottom: '#eef2f7',
    }))

    this.titleText = new Text(LawsOfReflectionStrings.stageTitleStringProperty.value, {
      font: new PhetFont({ size: 18, weight: 'bold' }),
      fill: '#0f172a',
      centerX: this.stageCenterX,
      top: this.stageTop + 10,
    })
    this.addChild(this.titleText)

    this.captionText = new Text('', {
      font: new PhetFont({ size: 14, weight: 'bold' }),
      fill: LightColors.accent,
      centerX: this.stageCenterX,
      top: this.titleText.bottom + 4,
    })
    this.addChild(this.captionText)

    this.stageLayer = new Node({ pickable: false })
    this.labelsLayer = new Node({ pickable: false })
    this.normalLayer = new Node({ pickable: false })
    this.anglesLayer = new Node({ pickable: false })
    this.addChild(this.stageLayer)
    this.addChild(this.normalLayer)
    this.addChild(this.anglesLayer)
    this.addChild(this.labelsLayer)

    this.particles = new ParticleBurst(70)
    this.addChild(this.particles)

    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = this.stageCenterX
    this.tipCard.top = this.stageTop + 12
    this.tipCard.visible = false
    this.tipCard.content.addChild(
      new Text(LawsOfReflectionStrings.tipTitleStringProperty.value, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: LightColors.accent,
        left: 14,
        top: 10,
      }),
    )
    this.tipBodyText = new RichText('', {
      font: new PhetFont(12),
      fill: LightColors.ink,
      lineWrap: 222,
      leading: 3,
      left: 14,
      top: 30,
      maxWidth: 222,
    })
    this.tipCard.content.addChild(this.tipBodyText)
    this.addChild(this.tipCard)

    this.miniQuiz = new MiniQuiz(260)
    this.miniQuiz.centerX = this.stageCenterX
    this.miniQuiz.centerY = this.stageTop + this.stageH * 0.5
    this.addChild(this.miniQuiz)

    const card = new DepthCard(rightW, this.stageH)
    card.left = this.stageLeft + this.stageW + gap
    card.top = this.stageTop
    this.addChild(card)

    const panelContent = new Node()
    const contentW = rightW - 42
    const halfW = (contentW - 8) / 2
    const btnH = 32
    const gridGap = 6

    const scenarioHeader = controlSection(LawsOfReflectionStrings.sectionScenarioStringProperty.value, contentW)
    panelContent.addChild(scenarioHeader)

    this.scenarioButtons = {} as Record<LawsScenario, SoftButton>
    for (const scenario of SCENARIOS) {
      const btn = new SoftButton(
        SCENARIO_LABELS[scenario],
        () => model.setScenario(scenario),
        {
          width: contentW,
          height: btnH,
          fill: scenario === 'explore' ? LightColors.accent : '#64748b',
          selected: scenario === 'explore',
          fontSize: 12,
          onSound: () => sounds.scenario(),
        },
      )
      this.scenarioButtons[scenario] = btn
      panelContent.addChild(btn)
    }

    const conditionsHeader = controlSection(LawsOfReflectionStrings.sectionConditionsStringProperty.value, contentW)
    panelContent.addChild(conditionsHeader)

    this.runningToggleBtn = new SoftButton(
      LawsOfReflectionStrings.runningOnStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: contentW, height: btnH, fill: LightColors.accent, fontSize: 12, selected: true },
    )
    panelContent.addChild(this.runningToggleBtn)

    const incidenceSlider = new DepthSlider(model.incidenceDegProperty, {
      min: 0,
      max: 80,
      width: contentW,
      label: LawsOfReflectionStrings.incidenceSliderStringProperty.value,
      format: (n) => `${n.toFixed(0)}°`,
      fill: RAY_YELLOW,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(incidenceSlider)

    const conditionsHint = controlHint(LawsOfReflectionStrings.conditionsHintStringProperty.value, contentW)
    panelContent.addChild(conditionsHint)

    const displayHeader = controlSection(LawsOfReflectionStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)

    this.labelsBtn = new SoftButton(
      LawsOfReflectionStrings.labelsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showLabelsProperty.value = !model.showLabelsProperty.value
      },
      { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true },
    )
    this.normalBtn = new SoftButton(
      LawsOfReflectionStrings.normalOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showNormalProperty.value = !model.showNormalProperty.value
      },
      { width: halfW, height: btnH, fill: '#f59e0b', fontSize: 10, selected: true },
    )
    this.anglesBtn = new SoftButton(
      LawsOfReflectionStrings.anglesOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showAnglesProperty.value = !model.showAnglesProperty.value
      },
      { width: contentW, height: btnH, fill: '#0ea5e9', fontSize: 12, selected: true },
    )
    panelContent.addChild(this.labelsBtn)
    panelContent.addChild(this.normalBtn)
    panelContent.addChild(this.anglesBtn)

    const playbackHeader = controlSection(LawsOfReflectionStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)

    this.playPauseBtn = new SoftButton(
      LawsOfReflectionStrings.playButtonStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: contentW, height: 38, fill: LightColors.accent, fontSize: 12 },
    )
    panelContent.addChild(this.playPauseBtn)

    const soundHeader = controlSection(LawsOfReflectionStrings.sectionSoundStringProperty.value, contentW)
    panelContent.addChild(soundHeader)

    this.soundBtn = new SoftButton(
      LawsOfReflectionStrings.soundOnStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        this.soundBtn.setLabel(on ? LawsOfReflectionStrings.soundOnStringProperty.value : LawsOfReflectionStrings.soundOffStringProperty.value)
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.soundBtn)

    const statusHeader = controlSection(LawsOfReflectionStrings.sectionStatusStringProperty.value, contentW)
    panelContent.addChild(statusHeader)

    this.starsText = new Text('', {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: '#d97706',
    })
    panelContent.addChild(this.starsText)

    this.statusText = new RichText(model.statusProperty.value, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: LightColors.panelText,
      lineWrap: contentW,
      leading: 3,
    })
    panelContent.addChild(this.statusText)

    const learnTip = createPanelTip(LawsOfReflectionStrings.learnMoreStringProperty.value, {
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
      incidenceSlider.left = 0
      incidenceSlider.top = py
      py = incidenceSlider.bottom + 4
      conditionsHint.left = 0
      conditionsHint.top = py
      py = conditionsHint.bottom + 12
      displayHeader.left = 0
      displayHeader.top = py
      py = displayHeader.bottom + 6
      this.labelsBtn.left = 0
      this.labelsBtn.top = py
      this.normalBtn.left = halfW + 8
      this.normalBtn.top = py
      py = this.labelsBtn.bottom + gridGap
      this.anglesBtn.left = 0
      this.anglesBtn.top = py
      py = this.anglesBtn.bottom + 12
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

    const scroller = new ScrollableNode(panelContent, rightW - 24, this.stageH - 72)
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
      this.starsText.string = `${LawsOfReflectionStrings.starsStringProperty.value} ${model.starsProperty.value}`
    }
    const syncPlayPause = () => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(running ? LawsOfReflectionStrings.pauseButtonStringProperty.value : LawsOfReflectionStrings.playButtonStringProperty.value)
      this.runningToggleBtn.setLabel(running ? LawsOfReflectionStrings.runningOnStringProperty.value : LawsOfReflectionStrings.runningOffStringProperty.value)
      this.runningToggleBtn.setSelected(running)
    }
    const syncScenario = () => {
      const scenario = model.scenarioProperty.value
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(s === scenario)
      this.guide.setGuidance(LawsOfReflectionStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[scenario])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[scenario], () => {
        this.leftLearnTip.top = this.teachingTriad.bottom + 16
      })
    }
    const syncLabels = () => {
      this.labelsBtn.setSelected(model.showLabelsProperty.value)
      this.labelsBtn.setLabel(model.showLabelsProperty.value ? LawsOfReflectionStrings.labelsOnStringProperty.value : LawsOfReflectionStrings.labelsOffStringProperty.value)
      this.labelsLayer.visible = model.showLabelsProperty.value
    }
    const syncNormal = () => {
      this.normalBtn.setSelected(model.showNormalProperty.value)
      this.normalBtn.setLabel(model.showNormalProperty.value ? LawsOfReflectionStrings.normalOnStringProperty.value : LawsOfReflectionStrings.normalOffStringProperty.value)
      this.normalLayer.visible = model.showNormalProperty.value
    }
    const syncAngles = () => {
      this.anglesBtn.setSelected(model.showAnglesProperty.value)
      this.anglesBtn.setLabel(model.showAnglesProperty.value ? LawsOfReflectionStrings.anglesOnStringProperty.value : LawsOfReflectionStrings.anglesOffStringProperty.value)
      this.anglesLayer.visible = model.showAnglesProperty.value
    }
    const syncStage = () => this.drawStage()

    model.scenarioProperty.link(syncScenario)
    model.runningProperty.link(syncPlayPause)
    model.showLabelsProperty.link(syncLabels)
    model.showNormalProperty.link(syncNormal)
    model.showAnglesProperty.link(syncAngles)
    model.incidenceDegProperty.link(syncStage)
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(syncStars)
    model.statusProperty.link((status) => {
      this.statusText.string = status
      relayoutPanel()
    })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.incidenceDegProperty.lazyLink(() => {
      this.particles.burst(this.stageCenterX, this.stageTop + this.stageH * 0.45, {
        count: 8,
        color: RAY_CYAN,
        speed: 60,
        life: 0.4,
        radius: 2.5,
      })
    })
    model.starsProperty.lazyLink((stars, oldStars) => {
      if (oldStars !== undefined && stars > oldStars) sounds.celebrate()
    })

    syncStars()
    syncPlayPause()
    syncScenario()
    syncLabels()
    syncNormal()
    syncAngles()
    syncStage()
  }

  private drawStage(): void {
    const w = this.stageW
    const h = this.stageH
    const ox = this.stageLeft
    const oy = this.stageTop
    const mirrorY = oy + h * 0.72
    const mirrorX1 = ox + w * 0.12
    const mirrorX2 = ox + w * 0.88
    const hit: Vec2 = { x: ox + w * 0.5, y: mirrorY }
    const rayLen = Math.min(w, h) * 0.42
    const incidenceDeg = this.model.incidenceDegProperty.value
    const source = sourceFromIncidence(hit, incidenceDeg, rayLen)

    this.stageLayer.removeAllChildren()
    this.normalLayer.removeAllChildren()
    this.anglesLayer.removeAllChildren()
    this.labelsLayer.removeAllChildren()

    this.stageLayer.addChild(
      new Rectangle(mirrorX1, mirrorY, mirrorX2 - mirrorX1, oy + h - mirrorY, {
        fill: 'rgba(148, 163, 184, 0.28)',
      }),
    )
    this.stageLayer.addChild(
      new Path(new Shape().moveTo(mirrorX1, mirrorY).lineTo(mirrorX2, mirrorY), {
        stroke: MIRROR_COLOR,
        lineWidth: 4,
        lineCap: 'round',
      }),
    )

    const toHit = normalize({ x: hit.x - source.x, y: hit.y - source.y })
    const incidenceRad = Math.acos(Math.min(1, Math.abs(dot2(toHit, { x: 0, y: -1 }))))
    const reflectedDir = normalize({ x: Math.sin(incidenceRad), y: -Math.cos(incidenceRad) })
    const iDeg = Math.round(incidenceRad * RAD2DEG)

    const normalTop: Vec2 = { x: hit.x, y: hit.y - rayLen * 0.55 }
    this.normalLayer.addChild(makeDashedLine(hit, normalTop, RAY_WHITE))

    this.stageLayer.addChild(makeRay(source, toHit, Math.hypot(hit.x - source.x, hit.y - source.y), RAY_YELLOW))
    this.stageLayer.addChild(makeRay(hit, reflectedDir, rayLen, RAY_CYAN))
    this.stageLayer.addChild(makeLightSource(source.x, source.y))

    this.anglesLayer.addChild(
      makeAngleArc(hit, -Math.PI / 2 - incidenceRad, -Math.PI / 2, 36, `∠i = ${iDeg}°`, RAY_YELLOW),
    )
    this.anglesLayer.addChild(
      makeAngleArc(hit, -Math.PI / 2, -Math.PI / 2 + incidenceRad, 48, `∠r = ${iDeg}°`, RAY_CYAN),
    )

    this.labelsLayer.addChild(makeLabel('Normal', hit.x + 36, hit.y - rayLen * 0.3))
    this.labelsLayer.addChild(makeLabel('Mirror', (mirrorX1 + mirrorX2) / 2, mirrorY + 22, true))
    this.labelsLayer.addChild(makeLabel('Light source', source.x, source.y - 22, true))

    this.captionText.string = `∠i = ${iDeg}° · ∠r = ${iDeg}° — equal angles`
    this.captionText.centerX = this.stageCenterX
  }

  private showTipCard(text: string): void {
    this.tipBodyText.string = text
    this.tipCard.visible = true
    this.tipCard.opacity = 1
    this.tipTimer = 4.4
  }

  private showQuiz(): void {
    this.miniQuiz.showQuiz(
      LawsOfReflectionStrings.quizQuestionStringProperty.value,
      [
        { label: LawsOfReflectionStrings.quizCorrectStringProperty.value, correct: true },
        { label: LawsOfReflectionStrings.quizWrongStringProperty.value, correct: false },
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
