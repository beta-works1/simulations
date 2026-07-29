import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { StarLifeCycleModel, StarScenario } from '../model/StarLifeCycleModel.js'
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
import { StarLifeCycleStrings } from '../StarLifeCycleStrings.js'
import { StarStageId } from '../../../shared/starPhysics.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SCENARIOS: readonly StarScenario[] = ['explore', 'low', 'high']
const SCENARIO_GUIDE: Record<StarScenario, string> = {
  explore: StarLifeCycleStrings.guideExploreStringProperty.value,
  low: StarLifeCycleStrings.guideLowStringProperty.value,
  high: StarLifeCycleStrings.guideHighStringProperty.value,
}
const SCENARIO_TRIAD: Record<StarScenario, [string, string, string]> = {
  explore: ['Following stellar evolution.', "A star's fate depends on its mass.", 'Compare Low and High mass paths.'],
  low: ['Low-mass path.', 'Ends as a cooling white dwarf.', 'Try High mass for supernova.'],
  high: ['High-mass path.', 'Supernova can leave a neutron star or black hole.', 'Scrub stages to review.'],
}

function makePillLabel(text: string, x: number, y: number, center = true): Node {
  const t = new Text(text, { font: new PhetFont({ size: 11, weight: 'bold' }), fill: '#0f172a' })
  const bg = new Rectangle(-5, -2, t.width + 10, t.height + 4, { cornerRadius: 4, fill: 'rgba(248,250,252,0.92)', stroke: 'rgba(15,23,42,0.12)', lineWidth: 1 })
  const root = new Node({ children: [bg, t], pickable: false })
  t.left = 0; t.top = 0
  if (center) { root.centerX = x; root.centerY = y } else { root.left = x; root.top = y }
  return root
}

export class StarLifeCycleScreenView extends ScreenView {
  private readonly model: StarLifeCycleModel
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
  private readonly stageLayer: Node; private readonly labelsLayer: Node
  private readonly captionText: Text; private readonly titleText: Text
  private readonly scenarioButtons: Record<StarScenario, SoftButton>
  private readonly runningToggleBtn: SoftButton; private readonly labelsBtn: SoftButton
  private readonly playPauseBtn: SoftButton; private readonly soundBtn: SoftButton
  private readonly starsText: Text; private readonly statusText: RichText
  private readonly stageSlider: DepthSlider
  private stageSliderMax = 4

  public constructor(model: StarLifeCycleModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    const sounds = new UniverseSounds(); this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })
    const m = UniverseConstants.SCREEN_VIEW_X_MARGIN; const my = UniverseConstants.SCREEN_VIEW_Y_MARGIN; const lb = this.layoutBounds
    const leftW = 190; const rightW = 290; const gap = 14
    this.stageLeft = m + leftW + gap; this.stageTop = my + 78
    this.stageW = lb.width - m * 2 - leftW - gap - rightW - gap; this.stageH = lb.height - my * 2 - 78
    this.stageCenterX = this.stageLeft + this.stageW / 2

    this.guide = new GuidanceBanner(lb.width - m * 2, { title: StarLifeCycleStrings.guideTitleStringProperty.value, body: SCENARIO_GUIDE.explore })
    this.guide.left = m; this.guide.top = my; this.addChild(this.guide)
    const leftCard = new DepthCard(leftW, this.stageH, { variant: 'light' }); leftCard.left = m; leftCard.top = this.stageTop; this.addChild(leftCard)
    this.teachingTriad = new TeachingTriad(leftW - 24); this.teachingTriad.left = 12; this.teachingTriad.top = 12; leftCard.content.addChild(this.teachingTriad)
    this.leftLearnTip = createPanelTip(StarLifeCycleStrings.learnMoreStringProperty.value, { width: leftW - 24, fontSize: 11, fill: UniverseColors.panelMuted })
    this.leftLearnTip.left = 12; this.leftLearnTip.top = this.teachingTriad.bottom + 22; leftCard.content.addChild(this.leftLearnTip)

    this.addChild(new StageBackdrop(this.stageLeft, this.stageTop, this.stageW, this.stageH, { top: '#070b18', bottom: '#1a1040' }))
    this.titleText = new Text(StarLifeCycleStrings.stageTitleStringProperty.value, { font: new PhetFont({ size: 18, weight: 'bold' }), fill: '#f8fafc', centerX: this.stageCenterX, top: this.stageTop + 10 }); this.addChild(this.titleText)
    this.captionText = new Text('', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: '#fbbf24', centerX: this.stageCenterX, top: this.titleText.bottom + 4 }); this.addChild(this.captionText)
    this.stageLayer = new Node({ pickable: false }); this.labelsLayer = new Node({ pickable: false })
    this.addChild(this.stageLayer); this.addChild(this.labelsLayer)
    this.particles = new ParticleBurst(70); this.addChild(this.particles)

    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' }); this.tipCard.centerX = this.stageCenterX; this.tipCard.top = this.stageTop + 12; this.tipCard.visible = false
    this.tipCard.content.addChild(new Text(StarLifeCycleStrings.tipTitleStringProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: UniverseColors.accent, left: 14, top: 10 }))
    this.tipBodyText = new RichText('', { font: new PhetFont(12), fill: UniverseColors.ink, lineWrap: 222, leading: 3, left: 14, top: 30, maxWidth: 222 }); this.tipCard.content.addChild(this.tipBodyText); this.addChild(this.tipCard)
    this.miniQuiz = new MiniQuiz(260); this.miniQuiz.centerX = this.stageCenterX; this.miniQuiz.centerY = this.stageTop + this.stageH * 0.5; this.addChild(this.miniQuiz)

    const card = new DepthCard(rightW, this.stageH); card.left = this.stageLeft + this.stageW + gap; card.top = this.stageTop; this.addChild(card)
    const panelContent = new Node(); const contentW = rightW - 42; const btnH = 32; const gridGap = 6

    const scenarioHeader = controlSection(StarLifeCycleStrings.sectionScenarioStringProperty.value, contentW); panelContent.addChild(scenarioHeader)
    this.scenarioButtons = {} as Record<StarScenario, SoftButton>
    const scenarioLabels: Record<StarScenario, string> = {
      explore: StarLifeCycleStrings.scenarioExploreStringProperty.value,
      low: StarLifeCycleStrings.scenarioLowStringProperty.value,
      high: StarLifeCycleStrings.scenarioHighStringProperty.value,
    }
    for (const s of SCENARIOS) {
      const btn = new SoftButton(scenarioLabels[s], () => model.setScenario(s), { width: contentW, height: btnH, fill: s === 'explore' ? UniverseColors.accent : '#64748b', selected: s === 'explore', fontSize: 12, onSound: () => sounds.scenario() })
      this.scenarioButtons[s] = btn; panelContent.addChild(btn)
    }
    const conditionsHeader = controlSection(StarLifeCycleStrings.sectionConditionsStringProperty.value, contentW); panelContent.addChild(conditionsHeader)
    this.runningToggleBtn = new SoftButton(StarLifeCycleStrings.runningOnStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: btnH, fill: UniverseColors.accent, fontSize: 12, selected: true }); panelContent.addChild(this.runningToggleBtn)
    this.stageSliderMax = model.stageSliderMax
    this.stageSlider = new DepthSlider(model.stageIndexProperty, { min: 0, max: this.stageSliderMax, width: contentW, label: StarLifeCycleStrings.stageSliderStringProperty.value, format: (n) => `${Math.round(n) + 1}/${this.stageSliderMax + 1}`, fill: '#f59e0b', onTick: () => { sounds.sliderTick(); model.scrubToStage(Math.round(model.stageIndexProperty.value)) } }); panelContent.addChild(this.stageSlider)
    const conditionsHint = controlHint(StarLifeCycleStrings.conditionsHintStringProperty.value, contentW); panelContent.addChild(conditionsHint)
    const displayHeader = controlSection(StarLifeCycleStrings.sectionDisplayStringProperty.value, contentW); panelContent.addChild(displayHeader)
    this.labelsBtn = new SoftButton(StarLifeCycleStrings.labelsOnStringProperty.value, () => { sounds.softClick(); model.showLabelsProperty.value = !model.showLabelsProperty.value }, { width: contentW, height: btnH, fill: '#64748b', fontSize: 11, selected: true }); panelContent.addChild(this.labelsBtn)
    const playbackHeader = controlSection(StarLifeCycleStrings.sectionPlaybackStringProperty.value, contentW); panelContent.addChild(playbackHeader)
    this.playPauseBtn = new SoftButton(StarLifeCycleStrings.playButtonStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: 38, fill: UniverseColors.accent, fontSize: 12 }); panelContent.addChild(this.playPauseBtn)
    const soundHeader = controlSection(StarLifeCycleStrings.sectionSoundStringProperty.value, contentW); panelContent.addChild(soundHeader)
    this.soundBtn = new SoftButton(StarLifeCycleStrings.soundOnStringProperty.value, () => { sounds.unlock(); const on = !model.soundEnabledProperty.value; model.soundEnabledProperty.value = on; sounds.toggle(on); if (on) sounds.button(); this.soundBtn.setLabel(on ? StarLifeCycleStrings.soundOnStringProperty.value : StarLifeCycleStrings.soundOffStringProperty.value) }, { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 }); panelContent.addChild(this.soundBtn)
    const statusHeader = controlSection(StarLifeCycleStrings.sectionStatusStringProperty.value, contentW); panelContent.addChild(statusHeader)
    this.starsText = new Text('', { font: new PhetFont({ size: 15, weight: 'bold' }), fill: '#d97706' }); panelContent.addChild(this.starsText)
    this.statusText = new RichText(model.statusProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: UniverseColors.panelText, lineWrap: contentW, leading: 3 }); panelContent.addChild(this.statusText)
    const learnTip = createPanelTip(StarLifeCycleStrings.learnMoreStringProperty.value, { width: contentW, fontSize: 11 }); panelContent.addChild(learnTip)
    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false }); panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      scenarioHeader.left = 0; scenarioHeader.top = py; py = scenarioHeader.bottom + 6
      for (const s of SCENARIOS) { const btn = this.scenarioButtons[s]; btn.left = 0; btn.top = py; py = btn.bottom + gridGap }
      py += 6; conditionsHeader.left = 0; conditionsHeader.top = py; py = conditionsHeader.bottom + 6
      this.runningToggleBtn.left = 0; this.runningToggleBtn.top = py; py = this.runningToggleBtn.bottom + gridGap
      this.stageSlider.left = 0; this.stageSlider.top = py; py = this.stageSlider.bottom + 6
      conditionsHint.left = 0; conditionsHint.top = py; py = conditionsHint.bottom + 12
      displayHeader.left = 0; displayHeader.top = py; py = displayHeader.bottom + 6
      this.labelsBtn.left = 0; this.labelsBtn.top = py; py = this.labelsBtn.bottom + 12
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
    model.stageIndexProperty.link(sync)
    model.stageProgressProperty.link(sync)
    model.massProperty.link(sync)
    model.scenarioProperty.link(() => {
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(model.scenarioProperty.value === s)
      this.guide.setGuidance(StarLifeCycleStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[model.scenarioProperty.value])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[model.scenarioProperty.value], () => { this.leftLearnTip.top = this.teachingTriad.bottom + 22 })
      this.stageSliderMax = model.stageSliderMax
      sync()
    })
    model.runningProperty.link(() => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(running ? StarLifeCycleStrings.pauseButtonStringProperty.value : StarLifeCycleStrings.playButtonStringProperty.value)
      this.runningToggleBtn.setLabel(running ? StarLifeCycleStrings.runningOnStringProperty.value : StarLifeCycleStrings.runningOffStringProperty.value)
      this.runningToggleBtn.setSelected(running)
    })
    model.showLabelsProperty.link(() => { this.labelsBtn.setSelected(model.showLabelsProperty.value); this.labelsBtn.setLabel(model.showLabelsProperty.value ? StarLifeCycleStrings.labelsOnStringProperty.value : StarLifeCycleStrings.labelsOffStringProperty.value); this.labelsLayer.visible = model.showLabelsProperty.value })
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(() => { this.starsText.string = `${StarLifeCycleStrings.starsStringProperty.value} ${model.starsProperty.value}` })
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
    const stage = this.model.currentStage
    const t = this.model.stageProgressProperty.value
    const mass = this.model.massProperty.value
    this.stageLayer.removeAllChildren(); this.labelsLayer.removeAllChildren()

    for (let i = 0; i < 40; i++) {
      const sx = ox + 12 + (i * 47) % (w - 24)
      const sy = oy + 40 + (i * 31) % (h - 80)
      this.stageLayer.addChild(new Circle(0.8 + (i % 3) * 0.4, { fill: 'rgba(255,255,255,0.55)', centerX: sx, centerY: sy }))
    }

    this.drawStarVisual(cx, cy, stage.id, t, mass)

    if (this.model.showLabelsProperty.value) {
      this.labelsLayer.addChild(makePillLabel(stage.label, cx, cy - 110))
      this.labelsLayer.addChild(makePillLabel(mass === 'low' ? 'Low mass' : 'High mass', ox + 16, oy + h - 28, false))
    }

    this.captionText.string = `${this.model.stageIndexProperty.value + 1}/${this.model.stages.length}: ${stage.label}`
    this.captionText.centerX = this.stageCenterX
  }

  private drawStarVisual(cx: number, cy: number, id: StarStageId, t: number, mass: 'low' | 'high'): void {
    switch (id) {
      case 'nebula':
        for (let i = 0; i < 18; i++) {
          const a = (i / 18) * Math.PI * 2
          const dist = 34 + (i % 5) * 10 + t * 10
          this.stageLayer.addChild(new Circle(10 + (i % 4) * 3, {
            fill: `rgba(${120 + (i % 3) * 40},${80 + (i % 4) * 30},200,0.35)`,
            centerX: cx + Math.cos(a) * dist, centerY: cy + Math.sin(a) * dist * 0.55,
          }))
        }
        break
      case 'protostar': {
        const r = 18 + t * 22
        this.stageLayer.addChild(new Circle(r + 28, { fill: 'rgba(255,179,71,0.25)', centerX: cx, centerY: cy }))
        this.stageLayer.addChild(new Circle(r, { fill: '#ffb347', centerX: cx, centerY: cy }))
        break
      }
      case 'main-sequence': {
        const r = mass === 'low' ? 28 : 42
        this.stageLayer.addChild(new Circle(r + 22, { fill: 'rgba(255,152,0,0.28)', centerX: cx, centerY: cy }))
        this.stageLayer.addChild(new Circle(r, { fill: '#ffeb3b', centerX: cx, centerY: cy }))
        this.stageLayer.addChild(new Circle(r * 0.55, { fill: '#fff9c4', centerX: cx, centerY: cy }))
        break
      }
      case 'red-giant': {
        const r = (mass === 'low' ? 55 : 72) + Math.sin(t * Math.PI) * 6
        this.stageLayer.addChild(new Circle(r + 20, { fill: 'rgba(183,28,28,0.25)', centerX: cx, centerY: cy }))
        this.stageLayer.addChild(new Circle(r, { fill: '#ef5350', centerX: cx, centerY: cy }))
        break
      }
      case 'white-dwarf':
        this.stageLayer.addChild(new Circle(18, { fill: 'rgba(179,229,252,0.35)', centerX: cx, centerY: cy }))
        this.stageLayer.addChild(new Circle(10, { fill: '#ffffff', centerX: cx, centerY: cy }))
        break
      case 'supernova': {
        const blast = 40 + t * 70
        this.stageLayer.addChild(new Circle(blast, { fill: 'rgba(255,235,59,0.2)', centerX: cx, centerY: cy }))
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2
          this.stageLayer.addChild(new Path(new Shape().moveTo(cx, cy).lineTo(cx + Math.cos(a) * blast, cy + Math.sin(a) * blast), { stroke: '#ffe082', lineWidth: 2 }))
        }
        this.stageLayer.addChild(new Circle(14, { fill: '#fffde7', centerX: cx, centerY: cy }))
        break
      }
      case 'neutron-star':
        this.stageLayer.addChild(new Circle(16, { fill: 'rgba(129,212,250,0.35)', centerX: cx, centerY: cy }))
        this.stageLayer.addChild(new Circle(8, { fill: '#e3f2fd', centerX: cx, centerY: cy }))
        this.stageLayer.addChild(new Path(new Shape().ellipse(cx, cy, 28, 10, t * Math.PI), { stroke: 'rgba(144,202,249,0.7)', lineWidth: 2 }))
        break
      case 'black-hole':
        this.stageLayer.addChild(new Path(new Shape().ellipse(cx, cy, 70, 22, 0), { fill: 'rgba(255,130,50,0.35)' }))
        this.stageLayer.addChild(new Circle(26, { fill: '#000000', centerX: cx, centerY: cy }))
        this.stageLayer.addChild(new Circle(28, { stroke: '#7dd3fc', lineWidth: 2, centerX: cx, centerY: cy }))
        break
    }
  }

  private showTipCard(text: string): void { this.tipBodyText.string = text; this.tipCard.visible = true; this.tipCard.opacity = 1; this.tipTimer = 4.4 }
  private showQuiz(): void {
    this.miniQuiz.showQuiz(StarLifeCycleStrings.quizQuestionStringProperty.value, [
      { label: StarLifeCycleStrings.quizCorrectStringProperty.value, correct: true },
      { label: StarLifeCycleStrings.quizWrongStringProperty.value, correct: false },
    ], (correct) => { correct ? this.sounds.correct() : this.sounds.wrong(); this.model.onQuiz(correct) })
  }
  public override step(dt: number): void {
    this.model.step(dt); this.particles.step(dt)
    if (this.model.runningProperty.value) this.drawStage()
    if (this.tipTimer > 0) { this.tipTimer -= dt; if (this.tipTimer < 0.6) this.tipCard.opacity = Math.max(0, this.tipTimer / 0.6); if (this.tipTimer <= 0) this.tipCard.visible = false }
  }
}
