import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { SolarSystemTimelineModel, TimelineScenario } from '../model/SolarSystemTimelineModel.js'
import { UniverseConstants } from '../../../shared/UniverseConstants.js'
import { UniverseColors } from '../../../shared/UniverseColors.js'
import {
  TeachingShellLayout,
  computeTeachingShellStage,
  stageClipShape,
  type TeachingShellStageGeom,
} from '../../../shared/TeachingShellLayout.js'
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
import { UniverseSounds } from '../../../shared/UniverseSounds.js'
import { SolarSystemTimelineStrings } from '../SolarSystemTimelineStrings.js'
import { eraColor, MAX_PROGRESS } from '../../../shared/timelinePhysics.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SCENARIOS: readonly TimelineScenario[] = ['explore', 'formation', 'exploration', 'modern']
const SCENARIO_GUIDE: Record<TimelineScenario, string> = {
  explore: SolarSystemTimelineStrings.guideExploreStringProperty.value,
  formation: SolarSystemTimelineStrings.guideFormationStringProperty.value,
  exploration: SolarSystemTimelineStrings.guideExplorationStringProperty.value,
  modern: SolarSystemTimelineStrings.guideModernStringProperty.value,
}
const SCENARIO_TRIAD: Record<TimelineScenario, [string, string, string]> = {
  explore: ['Solar system history.', 'Scrub from formation to modern missions.', 'Jump eras with the buttons.'],
  formation: ['Formation era.', 'Gas and dust collapse into the Sun and planets.', 'Advance to exploration.'],
  exploration: ['Exploration era.', 'Telescopes and Apollo expand our reach.', 'Try modern observatories.'],
  modern: ['Modern era.', 'Space telescopes and rovers keep discovering.', 'Replay from Explore.'],
}

function makePillLabel(text: string, x: number, y: number, fill = 'rgba(248,250,252,0.92)', center = true): Node {
  const t = new Text(text, { font: new PhetFont({ size: 11, weight: 'bold' }), fill: '#0f172a' })
  const bg = new Rectangle(-5, -2, t.width + 10, t.height + 4, {
    cornerRadius: 4,
    fill,
    stroke: 'rgba(15,23,42,0.12)',
    lineWidth: 1,
  })
  const root = new Node({ children: [bg, t], pickable: false })
  t.left = 0
  t.top = 0
  if (center) {
    root.centerX = x
    root.centerY = y
  } else {
    root.left = x
    root.top = y
  }
  return root
}

export class SolarSystemTimelineScreenView extends ScreenView {
  private readonly model: SolarSystemTimelineModel
  private readonly sounds: UniverseSounds
  private readonly particles: ParticleBurst
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly leftLearnTip: Node
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private tipTimer = 0
  private readonly stage: TeachingShellStageGeom
  private readonly stageLayer: Node
  private readonly labelsLayer: Node
  private readonly captionText: Text
  private readonly titleText: Text
  private readonly scenarioButtons: Record<TimelineScenario, SoftButton>
  private readonly runningToggleBtn: SoftButton
  private readonly labelsBtn: SoftButton
  private readonly playPauseBtn: SoftButton
  private readonly soundBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: RichText
  private animT = 0

  public constructor(model: SolarSystemTimelineModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    const sounds = new UniverseSounds()
    this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })

    const m = UniverseConstants.SCREEN_VIEW_X_MARGIN
    const my = UniverseConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    const leftW = TeachingShellLayout.LEFT_PANEL_W
    const rightW = TeachingShellLayout.RIGHT_PANEL_W
    const gap = TeachingShellLayout.PANEL_GAP

    this.guide = new GuidanceBanner(lb.width - m * 2, {
      title: SolarSystemTimelineStrings.guideTitleStringProperty.value,
      body: SCENARIO_GUIDE.explore,
    })
    this.guide.left = m
    this.guide.top = my
    this.addChild(this.guide)

    const guideH = Math.max(TeachingShellLayout.GUIDE_RESERVE_H, this.guide.height + TeachingShellLayout.GUIDE_TO_STAGE_GAP)
    this.stage = computeTeachingShellStage(lb.width, lb.height, { leftW, rightW, guideReserveH: guideH })
    const { left: stageLeft, top: stageTop, width: stageW, height: stageH, centerX: stageCenterX } = this.stage

    const leftCard = new DepthCard(leftW, stageH, { variant: 'light' })
    leftCard.left = m
    leftCard.top = stageTop
    this.addChild(leftCard)
    this.teachingTriad = new TeachingTriad(leftW - 24)
    this.teachingTriad.left = 12
    this.teachingTriad.top = 12
    leftCard.content.addChild(this.teachingTriad)
    this.leftLearnTip = createPanelTip(SolarSystemTimelineStrings.learnMoreStringProperty.value, {
      width: leftW - 24,
      fontSize: 11,
      fill: UniverseColors.panelMuted,
    })
    this.leftLearnTip.left = 12
    this.leftLearnTip.top = this.teachingTriad.bottom + 22
    leftCard.content.addChild(this.leftLearnTip)

    this.addChild(
      new StageBackdrop(stageLeft, stageTop, stageW, stageH, {
        top: '#070b18',
        bottom: '#102038',
        stroke: 'rgba(148,163,184,0.18)',
        gloss: false,
      }),
    )

    this.titleText = new Text(SolarSystemTimelineStrings.stageTitleStringProperty.value, {
      font: new PhetFont({ size: 18, weight: 'bold' }),
      fill: '#f8fafc',
      centerX: stageCenterX,
      top: stageTop + 10,
      maxWidth: stageW - 120,
    })
    this.addChild(this.titleText)
    this.captionText = new Text('', {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#86efac',
      centerX: stageCenterX,
      top: this.titleText.bottom + 4,
      maxWidth: stageW - 120,
    })
    this.addChild(this.captionText)

    const clip = stageClipShape(stageLeft, stageTop, stageW, stageH)
    this.stageLayer = new Node({ pickable: false, clipArea: clip })
    this.labelsLayer = new Node({ pickable: false, clipArea: clip })
    this.addChild(this.stageLayer)
    this.addChild(this.labelsLayer)
    this.particles = new ParticleBurst(70)
    this.addChild(this.particles)

    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = stageCenterX
    this.tipCard.top = stageTop + TeachingShellLayout.STAGE_TITLE_BAND + 4
    this.tipCard.visible = false
    this.tipCard.content.addChild(
      new Text(SolarSystemTimelineStrings.tipTitleStringProperty.value, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: UniverseColors.accent,
        left: 14,
        top: 10,
      }),
    )
    this.tipBodyText = new RichText('', {
      font: new PhetFont(12),
      fill: UniverseColors.ink,
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
    this.miniQuiz.centerY = this.stage.sceneCenterY
    this.addChild(this.miniQuiz)

    const card = new DepthCard(rightW, stageH)
    card.left = stageLeft + stageW + gap
    card.top = stageTop
    this.addChild(card)
    const panelContent = new Node()
    const contentW = rightW - 42
    const btnH = 32
    const gridGap = 6

    const scenarioHeader = controlSection(SolarSystemTimelineStrings.sectionScenarioStringProperty.value, contentW)
    panelContent.addChild(scenarioHeader)
    this.scenarioButtons = {} as Record<TimelineScenario, SoftButton>
    const scenarioLabels: Record<TimelineScenario, string> = {
      explore: SolarSystemTimelineStrings.scenarioExploreStringProperty.value,
      formation: SolarSystemTimelineStrings.scenarioFormationStringProperty.value,
      exploration: SolarSystemTimelineStrings.scenarioExplorationStringProperty.value,
      modern: SolarSystemTimelineStrings.scenarioModernStringProperty.value,
    }
    for (const s of SCENARIOS) {
      const btn = new SoftButton(scenarioLabels[s], () => model.setScenario(s), {
        width: contentW,
        height: btnH,
        fill: s === 'explore' ? UniverseColors.accent : '#64748b',
        selected: s === 'explore',
        fontSize: 12,
        onSound: () => sounds.scenario(),
      })
      this.scenarioButtons[s] = btn
      panelContent.addChild(btn)
    }
    const timelineHeader = controlSection(SolarSystemTimelineStrings.sectionTimelineStringProperty.value, contentW)
    panelContent.addChild(timelineHeader)
    this.runningToggleBtn = new SoftButton(
      SolarSystemTimelineStrings.runningOnStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: contentW, height: btnH, fill: UniverseColors.accent, fontSize: 12, selected: true },
    )
    panelContent.addChild(this.runningToggleBtn)
    const timelineSlider = new DepthSlider(model.progressProperty, {
      min: 0,
      max: MAX_PROGRESS,
      width: contentW,
      label: SolarSystemTimelineStrings.timelineSliderStringProperty.value,
      format: (n) => `${Math.round(n) + 1}/${MAX_PROGRESS + 1}`,
      fill: '#34d399',
      onTick: () => {
        sounds.sliderTick()
        model.scrubProgress(model.progressProperty.value)
      },
    })
    panelContent.addChild(timelineSlider)
    const conditionsHint = controlHint(SolarSystemTimelineStrings.conditionsHintStringProperty.value, contentW)
    panelContent.addChild(conditionsHint)
    const displayHeader = controlSection(SolarSystemTimelineStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)
    this.labelsBtn = new SoftButton(
      SolarSystemTimelineStrings.labelsOnStringProperty.value,
      () => {
        sounds.softClick()
        model.showLabelsProperty.value = !model.showLabelsProperty.value
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 11, selected: true },
    )
    panelContent.addChild(this.labelsBtn)
    const playbackHeader = controlSection(SolarSystemTimelineStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)
    this.playPauseBtn = new SoftButton(
      SolarSystemTimelineStrings.playButtonStringProperty.value,
      () => {
        model.togglePlay()
        sounds.playPause(model.runningProperty.value)
      },
      { width: contentW, height: 38, fill: UniverseColors.accent, fontSize: 12 },
    )
    panelContent.addChild(this.playPauseBtn)
    const soundHeader = controlSection(SolarSystemTimelineStrings.sectionSoundStringProperty.value, contentW)
    panelContent.addChild(soundHeader)
    this.soundBtn = new SoftButton(
      SolarSystemTimelineStrings.soundOnStringProperty.value,
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
        sounds.toggle(on)
        if (on) sounds.button()
        this.soundBtn.setLabel(
          on
            ? SolarSystemTimelineStrings.soundOnStringProperty.value
            : SolarSystemTimelineStrings.soundOffStringProperty.value,
        )
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 },
    )
    panelContent.addChild(this.soundBtn)
    const statusHeader = controlSection(SolarSystemTimelineStrings.sectionStatusStringProperty.value, contentW)
    panelContent.addChild(statusHeader)
    this.starsText = new Text('', { font: new PhetFont({ size: 15, weight: 'bold' }), fill: '#d97706' })
    panelContent.addChild(this.starsText)
    this.statusText = new RichText(model.statusProperty.value, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: UniverseColors.panelText,
      lineWrap: contentW,
      leading: 3,
    })
    panelContent.addChild(this.statusText)
    const learnTip = createPanelTip(SolarSystemTimelineStrings.learnMoreStringProperty.value, {
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
      for (const s of SCENARIOS) {
        const btn = this.scenarioButtons[s]
        btn.left = 0
        btn.top = py
        py = btn.bottom + gridGap
      }
      py += 6
      timelineHeader.left = 0
      timelineHeader.top = py
      py = timelineHeader.bottom + 6
      this.runningToggleBtn.left = 0
      this.runningToggleBtn.top = py
      py = this.runningToggleBtn.bottom + gridGap
      timelineSlider.left = 0
      timelineSlider.top = py
      py = timelineSlider.bottom + 6
      conditionsHint.left = 0
      conditionsHint.top = py
      py = conditionsHint.bottom + 12
      displayHeader.left = 0
      displayHeader.top = py
      py = displayHeader.bottom + 6
      this.labelsBtn.left = 0
      this.labelsBtn.top = py
      py = this.labelsBtn.bottom + 12
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

    const sync = () => this.drawStage()
    model.progressProperty.link(sync)
    model.scenarioProperty.link(() => {
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(model.scenarioProperty.value === s)
      this.guide.setGuidance(
        SolarSystemTimelineStrings.guideTitleStringProperty.value,
        SCENARIO_GUIDE[model.scenarioProperty.value],
      )
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[model.scenarioProperty.value], () => {
        this.leftLearnTip.top = this.teachingTriad.bottom + 22
      })
      sync()
    })
    model.runningProperty.link(() => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(
        running
          ? SolarSystemTimelineStrings.pauseButtonStringProperty.value
          : SolarSystemTimelineStrings.playButtonStringProperty.value,
      )
      this.runningToggleBtn.setLabel(
        running
          ? SolarSystemTimelineStrings.runningOnStringProperty.value
          : SolarSystemTimelineStrings.runningOffStringProperty.value,
      )
      this.runningToggleBtn.setSelected(running)
    })
    model.showLabelsProperty.link(() => {
      this.labelsBtn.setSelected(model.showLabelsProperty.value)
      this.labelsBtn.setLabel(
        model.showLabelsProperty.value
          ? SolarSystemTimelineStrings.labelsOnStringProperty.value
          : SolarSystemTimelineStrings.labelsOffStringProperty.value,
      )
      this.labelsLayer.visible = model.showLabelsProperty.value
    })
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(() => {
      this.starsText.string = `${SolarSystemTimelineStrings.starsStringProperty.value} ${model.starsProperty.value}`
    })
    model.statusProperty.link((status) => {
      this.statusText.string = status
      relayoutPanel()
    })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.starsProperty.lazyLink((stars, old) => {
      if (old !== undefined && stars > old) sounds.celebrate()
    })
    this.teachingTriad.setTriad(...SCENARIO_TRIAD.explore, () => {
      this.leftLearnTip.top = this.teachingTriad.bottom + 22
    })
    sync()
  }

  private drawStage(): void {
    const { left: ox, top: oy, width: w, height: h, sceneCenterX: cx, sceneCenterY: cy, maxOrbitR } =
      this.stage
    const ev = this.model.currentEvent
    const t = this.animT
    this.stageLayer.removeAllChildren()
    this.labelsLayer.removeAllChildren()

    for (let i = 0; i < 34; i++) {
      this.stageLayer.addChild(
        new Circle(0.7 + (i % 3) * 0.35, {
          fill: 'rgba(255,255,255,0.45)',
          centerX: ox + 10 + (i * 51) % (w - 20),
          centerY: oy + TeachingShellLayout.STAGE_TITLE_BAND + (i * 37) % Math.max(40, h - TeachingShellLayout.STAGE_TITLE_BAND - 20),
        }),
      )
    }

    if (ev.era === 'formation') {
      const diskR = maxOrbitR * 0.92
      const sunR = Math.max(14, maxOrbitR * 0.22)
      this.stageLayer.addChild(new Circle(sunR * 2.2, { fill: 'rgba(255,152,0,0.25)', centerX: cx, centerY: cy }))
      this.stageLayer.addChild(new Circle(sunR, { fill: '#ffeb3b', centerX: cx, centerY: cy }))
      this.stageLayer.addChild(
        new Path(new Shape().ellipse(cx, cy, diskR, diskR * 0.32, 0), {
          stroke: 'rgba(200,180,255,0.45)',
          lineWidth: 2,
        }),
      )
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + t * 0.5
        const r = diskR * (0.45 + (i % 3) * 0.12)
        this.stageLayer.addChild(
          new Circle(5 + (i % 2) * 2, {
            fill: '#78909c',
            centerX: cx + Math.cos(a) * r,
            centerY: cy + Math.sin(a) * r * 0.35,
          }),
        )
      }
    } else if (ev.era === 'planets') {
      const sunR = Math.max(10, maxOrbitR * 0.14)
      this.stageLayer.addChild(new Circle(sunR, { fill: '#ffeb3b', centerX: cx, centerY: cy }))
      const planets = [
        { frac: 0.28, size: 4, c: '#9e9e9e' },
        { frac: 0.4, size: 6, c: '#ff7043' },
        { frac: 0.55, size: 7, c: '#42a5f5' },
        { frac: 0.68, size: 5, c: '#ef5350' },
        { frac: 0.82, size: 10, c: '#ffb74d' },
        { frac: 0.95, size: 8, c: '#ffcc80' },
      ]
      for (const p of planets) {
        const r = maxOrbitR * p.frac
        this.stageLayer.addChild(
          new Path(new Shape().ellipse(cx, cy, r, r * 0.35, 0), {
            stroke: 'rgba(255,255,255,0.12)',
            lineWidth: 1,
          }),
        )
        this.stageLayer.addChild(new Circle(p.size, { fill: p.c, centerX: cx + r, centerY: cy }))
      }
    } else if (ev.era === 'exploration') {
      this.stageLayer.addChild(new Circle(42, { fill: '#78909c', centerX: cx - 50, centerY: cy + 20 }))
      const rocketX = cx + 60
      const rocketY = cy - 20 - Math.sin(t * 2) * 5
      this.stageLayer.addChild(
        new Path(
          new Shape().moveTo(rocketX, rocketY - 28).lineTo(rocketX + 11, rocketY + 18).lineTo(rocketX - 11, rocketY + 18).close(),
          { fill: '#eceff1' },
        ),
      )
      this.stageLayer.addChild(
        new Path(
          new Shape().moveTo(rocketX - 7, rocketY + 18).lineTo(rocketX, rocketY + 32).lineTo(rocketX + 7, rocketY + 18).close(),
          { fill: '#ff7043' },
        ),
      )
    } else {
      this.stageLayer.addChild(
        new Path(new Shape().moveTo(cx - 80, cy + 30).lineTo(cx + 40, cy - 40), {
          stroke: 'rgba(167,139,250,0.7)',
          lineWidth: 3,
        }),
      )
      this.stageLayer.addChild(
        new Circle(10 + Math.sin(t * 3) * 2, { fill: '#a78bfa', centerX: cx + 50, centerY: cy - 45 }),
      )
      this.stageLayer.addChild(new Rectangle(cx - 90, cy + 20, 36, 22, { cornerRadius: 4, fill: '#94a3b8' }))
    }

    // Caption in reserved title band; era badge top-right — never overlapping (metric #2).
    this.captionText.string = `${ev.yearLabel}: ${ev.title}`
    this.captionText.maxWidth = w - 120
    this.captionText.centerX = this.stage.centerX
    this.captionText.top = this.titleText.bottom + 4

    if (this.model.showLabelsProperty.value) {
      const eraPill = makePillLabel(ev.era.toUpperCase(), 0, 0, eraColor(ev.era) + 'cc', false)
      eraPill.right = ox + w - 14
      eraPill.top = oy + 12
      this.labelsLayer.addChild(eraPill)
      this.labelsLayer.addChild(
        makePillLabel(ev.yearLabel, ox + 14, oy + h - 28, 'rgba(248,250,252,0.92)', false),
      )
    }
  }

  private showTipCard(text: string): void {
    this.tipBodyText.string = text
    this.tipCard.visible = true
    this.tipCard.opacity = 1
    this.tipTimer = 4.4
  }

  private showQuiz(): void {
    this.miniQuiz.showQuiz(
      SolarSystemTimelineStrings.quizQuestionStringProperty.value,
      [
        { label: SolarSystemTimelineStrings.quizCorrectStringProperty.value, correct: true },
        { label: SolarSystemTimelineStrings.quizWrongStringProperty.value, correct: false },
      ],
      (correct) => {
        if (correct) this.sounds.correct()
        else this.sounds.wrong()
        this.model.onQuiz(correct)
      },
    )
  }

  public override step(dt: number): void {
    this.model.step(dt)
    this.particles.step(dt)
    this.animT += dt
    this.drawStage()
    if (this.tipTimer > 0) {
      this.tipTimer -= dt
      if (this.tipTimer < 0.6) this.tipCard.opacity = Math.max(0, this.tipTimer / 0.6)
      if (this.tipTimer <= 0) this.tipCard.visible = false
    }
  }
}
