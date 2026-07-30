import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { BlackHoleModel, BlackHoleScenario } from '../model/BlackHoleModel.js'
import { UniverseConstants } from '../../../shared/UniverseConstants.js'
import { UniverseColors } from '../../../shared/UniverseColors.js'
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
import { BlackHoleStrings } from '../BlackHoleStrings.js'
import { collapseRadius, eventHorizonRadius, photonPaths } from '../../../shared/blackHolePhysics.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SCENARIOS: readonly BlackHoleScenario[] = ['explore', 'collapse', 'bending']
const SCENARIO_GUIDE: Record<BlackHoleScenario, string> = {
  explore: BlackHoleStrings.guideExploreStringProperty.value,
  collapse: BlackHoleStrings.guideCollapseStringProperty.value,
  bending: BlackHoleStrings.guideBendingStringProperty.value,
}
const SCENARIO_TRIAD: Record<BlackHoleScenario, [string, string, string]> = {
  explore: ['Black hole formation.', 'Massive stars can collapse until light cannot escape.', 'Scrub collapse then bending.'],
  collapse: ['Stellar collapse.', 'The core shrinks toward the event horizon.', 'Continue into light bending.'],
  bending: ['Light bending.', 'Photon paths curve; some are captured.', 'Toggle light paths on/off.'],
}

function makePillLabel(text: string, x: number, y: number, center = true): Node {
  const t = new Text(text, { font: new PhetFont({ size: 11, weight: 'bold' }), fill: '#0f172a' })
  const bg = new Rectangle(-5, -2, t.width + 10, t.height + 4, { cornerRadius: 4, fill: 'rgba(248,250,252,0.92)', stroke: 'rgba(15,23,42,0.12)', lineWidth: 1 })
  const root = new Node({ children: [bg, t], pickable: false })
  t.left = 0; t.top = 0
  if (center) { root.centerX = x; root.centerY = y } else { root.left = x; root.top = y }
  return root
}

export class BlackHoleScreenView extends ScreenView {
  private readonly model: BlackHoleModel
  private readonly sounds: UniverseSounds
  private readonly particles: ParticleBurst
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly leftLearnTip: Node
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private tipTimer = 0
  private readonly stageLeft: number; private readonly stageTop: number; private readonly stageW: number; private readonly stageH: number; private readonly stageCenterX: number
  private readonly stageLayer: Node; private readonly raysLayer: Node; private readonly labelsLayer: Node
  private readonly captionText: Text; private readonly titleText: Text
  private readonly scenarioButtons: Record<BlackHoleScenario, SoftButton>
  private readonly runningToggleBtn: SoftButton; private readonly labelsBtn: SoftButton; private readonly raysBtn: SoftButton
  private readonly playPauseBtn: SoftButton; private readonly soundBtn: SoftButton
  private readonly starsText: Text; private readonly statusText: RichText

  public constructor(model: BlackHoleModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    const sounds = new UniverseSounds(); this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })
    const m = UniverseConstants.SCREEN_VIEW_X_MARGIN; const my = UniverseConstants.SCREEN_VIEW_Y_MARGIN; const lb = this.layoutBounds
    const leftW = 190; const rightW = 290; const gap = 14
    this.stageLeft = m + leftW + gap; this.stageTop = my + 78
    this.stageW = lb.width - m * 2 - leftW - gap - rightW - gap; this.stageH = lb.height - my * 2 - 78
    this.stageCenterX = this.stageLeft + this.stageW / 2

    this.guide = new GuidanceBanner(lb.width - m * 2, { title: BlackHoleStrings.guideTitleStringProperty.value, body: SCENARIO_GUIDE.explore })
    this.guide.left = m; this.guide.top = my; this.addChild(this.guide)
    const leftCard = new DepthCard(leftW, this.stageH, { variant: 'light' }); leftCard.left = m; leftCard.top = this.stageTop; this.addChild(leftCard)
    this.teachingTriad = new TeachingTriad(leftW - 24); this.teachingTriad.left = 12; this.teachingTriad.top = 12; leftCard.content.addChild(this.teachingTriad)
    this.leftLearnTip = createPanelTip(BlackHoleStrings.learnMoreStringProperty.value, { width: leftW - 24, fontSize: 11, fill: UniverseColors.panelMuted })
    this.leftLearnTip.left = 12; this.leftLearnTip.top = this.teachingTriad.bottom + 22; leftCard.content.addChild(this.leftLearnTip)

    this.addChild(new StageBackdrop(this.stageLeft, this.stageTop, this.stageW, this.stageH, { top: '#050508', bottom: '#1a0a20', gloss: false }))
    this.titleText = new Text(BlackHoleStrings.stageTitleStringProperty.value, { font: new PhetFont({ size: 18, weight: 'bold' }), fill: '#f8fafc', centerX: this.stageCenterX, top: this.stageTop + 10 }); this.addChild(this.titleText)
    this.captionText = new Text('', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: '#7dd3fc', centerX: this.stageCenterX, top: this.titleText.bottom + 4 }); this.addChild(this.captionText)
    this.stageLayer = new Node({ pickable: false }); this.raysLayer = new Node({ pickable: false }); this.labelsLayer = new Node({ pickable: false })
    this.addChild(this.stageLayer); this.addChild(this.raysLayer); this.addChild(this.labelsLayer)
    this.particles = new ParticleBurst(70); this.addChild(this.particles)

    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' }); this.tipCard.centerX = this.stageCenterX; this.tipCard.top = this.stageTop + 12; this.tipCard.visible = false
    this.tipCard.content.addChild(new Text(BlackHoleStrings.tipTitleStringProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: UniverseColors.accent, left: 14, top: 10 }))
    this.tipBodyText = new RichText('', { font: new PhetFont(12), fill: UniverseColors.ink, lineWrap: 222, leading: 3, left: 14, top: 30, maxWidth: 222 }); this.tipCard.content.addChild(this.tipBodyText); this.addChild(this.tipCard)
    this.miniQuiz = new MiniQuiz(260); this.miniQuiz.centerX = this.stageCenterX; this.miniQuiz.centerY = this.stageTop + this.stageH * 0.5; this.addChild(this.miniQuiz)

    const card = new DepthCard(rightW, this.stageH); card.left = this.stageLeft + this.stageW + gap; card.top = this.stageTop; this.addChild(card)
    const panelContent = new Node(); const contentW = rightW - 42; const halfW = (contentW - 8) / 2; const btnH = 32; const gridGap = 6

    const scenarioHeader = controlSection(BlackHoleStrings.sectionScenarioStringProperty.value, contentW); panelContent.addChild(scenarioHeader)
    this.scenarioButtons = {} as Record<BlackHoleScenario, SoftButton>
    const scenarioLabels: Record<BlackHoleScenario, string> = {
      explore: BlackHoleStrings.scenarioExploreStringProperty.value,
      collapse: BlackHoleStrings.scenarioCollapseStringProperty.value,
      bending: BlackHoleStrings.scenarioBendingStringProperty.value,
    }
    for (const s of SCENARIOS) {
      const btn = new SoftButton(scenarioLabels[s], () => model.setScenario(s), { width: contentW, height: btnH, fill: s === 'explore' ? UniverseColors.accent : '#64748b', selected: s === 'explore', fontSize: 12, onSound: () => sounds.scenario() })
      this.scenarioButtons[s] = btn; panelContent.addChild(btn)
    }
    const timelineHeader = controlSection(BlackHoleStrings.sectionTimelineStringProperty.value, contentW); panelContent.addChild(timelineHeader)
    this.runningToggleBtn = new SoftButton(BlackHoleStrings.runningOnStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: btnH, fill: UniverseColors.accent, fontSize: 12, selected: true }); panelContent.addChild(this.runningToggleBtn)
    const timelineSlider = new DepthSlider(model.timelineProperty, { min: 0, max: 1, width: contentW, label: BlackHoleStrings.timelineSliderStringProperty.value, format: (n) => `${Math.round(n * 100)}%`, fill: '#38bdf8', onTick: () => { sounds.sliderTick(); model.scrubTimeline(model.timelineProperty.value) } }); panelContent.addChild(timelineSlider)
    const conditionsHint = controlHint(BlackHoleStrings.conditionsHintStringProperty.value, contentW); panelContent.addChild(conditionsHint)
    const displayHeader = controlSection(BlackHoleStrings.sectionDisplayStringProperty.value, contentW); panelContent.addChild(displayHeader)
    this.labelsBtn = new SoftButton(BlackHoleStrings.labelsOnStringProperty.value, () => { sounds.softClick(); model.showLabelsProperty.value = !model.showLabelsProperty.value }, { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true }); panelContent.addChild(this.labelsBtn)
    this.raysBtn = new SoftButton(BlackHoleStrings.raysOnStringProperty.value, () => { sounds.softClick(); model.toggleShowRays() }, { width: halfW, height: btnH, fill: '#0ea5e9', fontSize: 10, selected: true }); panelContent.addChild(this.raysBtn)
    const playbackHeader = controlSection(BlackHoleStrings.sectionPlaybackStringProperty.value, contentW); panelContent.addChild(playbackHeader)
    this.playPauseBtn = new SoftButton(BlackHoleStrings.playButtonStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: 38, fill: UniverseColors.accent, fontSize: 12 }); panelContent.addChild(this.playPauseBtn)
    const soundHeader = controlSection(BlackHoleStrings.sectionSoundStringProperty.value, contentW); panelContent.addChild(soundHeader)
    this.soundBtn = new SoftButton(BlackHoleStrings.soundOnStringProperty.value, () => { sounds.unlock(); const on = !model.soundEnabledProperty.value; model.soundEnabledProperty.value = on; sounds.toggle(on); if (on) sounds.button(); this.soundBtn.setLabel(on ? BlackHoleStrings.soundOnStringProperty.value : BlackHoleStrings.soundOffStringProperty.value) }, { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 }); panelContent.addChild(this.soundBtn)
    const statusHeader = controlSection(BlackHoleStrings.sectionStatusStringProperty.value, contentW); panelContent.addChild(statusHeader)
    this.starsText = new Text('', { font: new PhetFont({ size: 15, weight: 'bold' }), fill: '#d97706' }); panelContent.addChild(this.starsText)
    this.statusText = new RichText(model.statusProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: UniverseColors.panelText, lineWrap: contentW, leading: 3 }); panelContent.addChild(this.statusText)
    const learnTip = createPanelTip(BlackHoleStrings.learnMoreStringProperty.value, { width: contentW, fontSize: 11 }); panelContent.addChild(learnTip)
    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false }); panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      scenarioHeader.left = 0; scenarioHeader.top = py; py = scenarioHeader.bottom + 6
      for (const s of SCENARIOS) { const btn = this.scenarioButtons[s]; btn.left = 0; btn.top = py; py = btn.bottom + gridGap }
      py += 6; timelineHeader.left = 0; timelineHeader.top = py; py = timelineHeader.bottom + 6
      this.runningToggleBtn.left = 0; this.runningToggleBtn.top = py; py = this.runningToggleBtn.bottom + gridGap
      timelineSlider.left = 0; timelineSlider.top = py; py = timelineSlider.bottom + 6
      conditionsHint.left = 0; conditionsHint.top = py; py = conditionsHint.bottom + 12
      displayHeader.left = 0; displayHeader.top = py; py = displayHeader.bottom + 6
      this.labelsBtn.left = 0; this.labelsBtn.top = py; this.raysBtn.left = halfW + 8; this.raysBtn.top = py; py = this.labelsBtn.bottom + 12
      playbackHeader.left = 0; playbackHeader.top = py; py = playbackHeader.bottom + 6
      this.playPauseBtn.left = 0; this.playPauseBtn.top = py; py = this.playPauseBtn.bottom + 12
      soundHeader.left = 0; soundHeader.top = py; py = soundHeader.bottom + 6
      this.soundBtn.left = 0; this.soundBtn.top = py; py = this.soundBtn.bottom + 12
      statusHeader.left = 0; statusHeader.top = py; py = statusHeader.bottom + 6
      this.starsText.left = 0; this.starsText.top = py; py = this.starsText.bottom + 6
      this.statusText.left = 0; this.statusText.top = py; py = this.statusText.bottom + 10
      learnTip.left = 0; learnTip.top = py; bottomPad.top = learnTip.bottom + 4
    }
    relayoutPanel()
    const scroller = new ScrollableNode(panelContent, rightW - 24, this.stageH - 72); scroller.left = 12; scroller.top = 12; card.content.addChild(scroller)
    this.addChild(new ResetAllButton({ listener: () => { sounds.resetAll(); model.reset(); this.particles.clear() }, right: lb.right - m, bottom: lb.bottom - my }))

    const sync = () => this.drawStage()
    model.collapseProgressProperty.link(sync)
    model.bendTimeProperty.link(sync)
    model.phaseProperty.link(sync)
    model.showRaysProperty.link(() => {
      this.raysBtn.setSelected(model.showRaysProperty.value)
      this.raysBtn.setLabel(model.showRaysProperty.value ? BlackHoleStrings.raysOnStringProperty.value : BlackHoleStrings.raysOffStringProperty.value)
      this.raysLayer.visible = model.showRaysProperty.value
      sync()
    })
    model.scenarioProperty.link(() => {
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(model.scenarioProperty.value === s)
      this.guide.setGuidance(BlackHoleStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[model.scenarioProperty.value])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[model.scenarioProperty.value], () => { this.leftLearnTip.top = this.teachingTriad.bottom + 22 })
      sync()
    })
    model.runningProperty.link(() => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(running ? BlackHoleStrings.pauseButtonStringProperty.value : BlackHoleStrings.playButtonStringProperty.value)
      this.runningToggleBtn.setLabel(running ? BlackHoleStrings.runningOnStringProperty.value : BlackHoleStrings.runningOffStringProperty.value)
      this.runningToggleBtn.setSelected(running)
    })
    model.showLabelsProperty.link(() => { this.labelsBtn.setSelected(model.showLabelsProperty.value); this.labelsBtn.setLabel(model.showLabelsProperty.value ? BlackHoleStrings.labelsOnStringProperty.value : BlackHoleStrings.labelsOffStringProperty.value); this.labelsLayer.visible = model.showLabelsProperty.value })
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(() => { this.starsText.string = `${BlackHoleStrings.starsStringProperty.value} ${model.starsProperty.value}` })
    model.statusProperty.link((status) => { this.statusText.string = status; relayoutPanel() })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.starsProperty.lazyLink((stars, old) => { if (old !== undefined && stars > old) sounds.celebrate() })
    this.teachingTriad.setTriad(...SCENARIO_TRIAD.explore, () => { this.leftLearnTip.top = this.teachingTriad.bottom + 22 })
    sync()
  }

  private drawStage(): void {
    const w = this.stageW; const h = this.stageH; const ox = this.stageLeft; const oy = this.stageTop
    const cx = ox + w * 0.5; const cy = oy + h * 0.52
    this.stageLayer.removeAllChildren(); this.raysLayer.removeAllChildren(); this.labelsLayer.removeAllChildren()
    for (let i = 0; i < 40; i++) {
      this.stageLayer.addChild(new Circle(0.7 + (i % 3) * 0.35, { fill: 'rgba(255,255,255,0.45)', centerX: ox + 8 + (i * 49) % (w - 16), centerY: oy + 40 + (i * 33) % (h - 80) }))
    }
    if (this.model.phaseProperty.value === 'collapse') {
      const p = this.model.collapseProgressProperty.value
      const r = collapseRadius(p) * 70
      this.stageLayer.addChild(new Circle(r + 36, { fill: 'rgba(255,138,101,0.28)', centerX: cx, centerY: cy }))
      this.stageLayer.addChild(new Circle(r, { fill: '#ff8a65', centerX: cx, centerY: cy }))
      this.stageLayer.addChild(new Circle(Math.max(4, r * 0.45), { fill: '#fff8e1', centerX: cx, centerY: cy }))
      if (p > 0.5) {
        const bhR = eventHorizonRadius() * (p - 0.5) * 2
        this.stageLayer.addChild(new Circle(bhR, { fill: '#000', centerX: cx, centerY: cy }))
      }
    } else {
      const ehR = eventHorizonRadius()
      this.stageLayer.addChild(new Path(new Shape().ellipse(cx, cy, ehR * 2.8, ehR * 0.9, 0), { fill: 'rgba(255,130,50,0.4)' }))
      if (this.model.showRaysProperty.value) {
        for (const p of photonPaths(cx, cy, this.model.bendTimeProperty.value)) {
          const shape = new Shape().moveTo(p.startX, p.startY).cubicCurveTo(p.cp1X, p.cp1Y, p.cp2X, p.cp2Y, p.endX, p.endY)
          this.raysLayer.addChild(new Path(shape, { stroke: p.captured ? 'rgba(255,100,80,0.85)' : 'rgba(120,220,255,0.8)', lineWidth: p.captured ? 2.5 : 1.6 }))
        }
      }
      this.stageLayer.addChild(new Circle(ehR, { fill: '#000', centerX: cx, centerY: cy }))
      this.stageLayer.addChild(new Circle(ehR + 2, { stroke: '#7dd3fc', lineWidth: 2, centerX: cx, centerY: cy }))
    }
    if (this.model.showLabelsProperty.value) {
      // Keep status pill clear of the caption band (TeachingShellLayout metric #2).
      const phasePill = makePillLabel(this.model.phaseLabelText, 0, 0, false)
      phasePill.right = ox + w - 14
      phasePill.top = oy + 12
      this.labelsLayer.addChild(phasePill)
      if (this.model.phaseProperty.value === 'bending') {
        this.labelsLayer.addChild(makePillLabel('Event horizon', cx, cy + eventHorizonRadius() + 18))
      }
    }
    this.captionText.string = this.model.phaseLabelText
    this.captionText.centerX = this.stageCenterX
  }

  private showTipCard(text: string): void { this.tipBodyText.string = text; this.tipCard.visible = true; this.tipCard.opacity = 1; this.tipTimer = 4.4 }
  private showQuiz(): void {
    this.miniQuiz.showQuiz(BlackHoleStrings.quizQuestionStringProperty.value, [
      { label: BlackHoleStrings.quizCorrectStringProperty.value, correct: true },
      { label: BlackHoleStrings.quizWrongStringProperty.value, correct: false },
    ], (correct) => { correct ? this.sounds.correct() : this.sounds.wrong(); this.model.onQuiz(correct) })
  }
  public override step(dt: number): void {
    this.model.step(dt); this.particles.step(dt)
    if (this.model.runningProperty.value) this.drawStage()
    if (this.tipTimer > 0) { this.tipTimer -= dt; if (this.tipTimer < 0.6) this.tipCard.opacity = Math.max(0, this.tipTimer / 0.6); if (this.tipTimer <= 0) this.tipCard.visible = false }
  }
}
