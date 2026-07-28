import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { ElectricMotorModel, MotorScenario } from '../model/ElectricMotorModel.js'
import { ElectricityConstants } from '../../../shared/ElectricityConstants.js'
import { ElectricityColors } from '../../../shared/ElectricityColors.js'
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
import { ElectricitySounds } from '../../../shared/ElectricitySounds.js'
import { ElectricMotorStrings } from '../ElectricMotorStrings.js'
import { makeLabel, makeMagnet, WIRE } from '../../../shared/circuitDraw.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions
const SCENARIOS: readonly MotorScenario[] = ['idle', 'spinning', 'strongCurrent']
const SCENARIO_GUIDE: Record<MotorScenario, string> = {
  idle: ElectricMotorStrings.guideIdleStringProperty.value,
  spinning: ElectricMotorStrings.guideSpinningStringProperty.value,
  strongCurrent: ElectricMotorStrings.guideStrongStringProperty.value,
}
const SCENARIO_TRIAD: Record<MotorScenario, [string, string, string]> = {
  idle: ['Low current.', 'A small current still produces some torque in the field.', 'Raise current to Spinning.'],
  spinning: ['Motor spinning.', 'Current in a magnetic field produces continuous rotation.', 'Try Strong current.'],
  strongCurrent: ['Strong current.', 'RPM scales with current — electrical energy becomes mechanical.', 'Toggle field lines in Display.'],
}

export class ElectricMotorScreenView extends ScreenView {
  private readonly model: ElectricMotorModel
  private readonly sounds: ElectricitySounds
  private readonly particles: ParticleBurst
  private readonly guide: GuidanceBanner
  private readonly teachingTriad: TeachingTriad
  private readonly leftLearnTip: Node
  private readonly miniQuiz: MiniQuiz
  private readonly tipCard: DepthCard
  private readonly tipBodyText: RichText
  private tipTimer = 0
  private readonly stageLeft: number; private readonly stageTop: number; private readonly stageW: number; private readonly stageH: number; private readonly stageCenterX: number
  private readonly stageLayer: Node; private readonly labelsLayer: Node; private readonly coilNode: Node
  private readonly captionText: Text; private readonly titleText: Text
  private readonly scenarioButtons: Record<MotorScenario, SoftButton>
  private readonly runningToggleBtn: SoftButton; private readonly labelsBtn: SoftButton; private readonly fieldBtn: SoftButton
  private readonly playPauseBtn: SoftButton; private readonly soundBtn: SoftButton
  private readonly starsText: Text; private readonly statusText: RichText

  public constructor(model: ElectricMotorModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    const sounds = new ElectricitySounds(); this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })
    const m = ElectricityConstants.SCREEN_VIEW_X_MARGIN; const my = ElectricityConstants.SCREEN_VIEW_Y_MARGIN; const lb = this.layoutBounds
    const leftW = 190; const rightW = 290; const gap = 14
    this.stageLeft = m + leftW + gap; this.stageTop = my + 78
    this.stageW = lb.width - m * 2 - leftW - gap - rightW - gap; this.stageH = lb.height - my * 2 - 78
    this.stageCenterX = this.stageLeft + this.stageW / 2
    this.guide = new GuidanceBanner(lb.width - m * 2, { title: ElectricMotorStrings.guideTitleStringProperty.value, body: SCENARIO_GUIDE.spinning })
    this.guide.left = m; this.guide.top = my; this.addChild(this.guide)
    const leftCard = new DepthCard(leftW, this.stageH, { variant: 'light' }); leftCard.left = m; leftCard.top = this.stageTop; this.addChild(leftCard)
    this.teachingTriad = new TeachingTriad(leftW - 24); this.teachingTriad.left = 12; this.teachingTriad.top = 12; leftCard.content.addChild(this.teachingTriad)
    this.leftLearnTip = createPanelTip(ElectricMotorStrings.learnMoreStringProperty.value, { width: leftW - 24, fontSize: 11, fill: ElectricityColors.panelMuted })
    this.leftLearnTip.left = 12; this.leftLearnTip.top = this.teachingTriad.bottom + 22; leftCard.content.addChild(this.leftLearnTip)
    this.addChild(new StageBackdrop(this.stageLeft, this.stageTop, this.stageW, this.stageH, { top: '#c7d2e0', bottom: '#eef2f7' }))
    this.titleText = new Text(ElectricMotorStrings.stageTitleStringProperty.value, { font: new PhetFont({ size: 18, weight: 'bold' }), fill: '#0f172a', centerX: this.stageCenterX, top: this.stageTop + 10 }); this.addChild(this.titleText)
    this.captionText = new Text('', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: ElectricityColors.accent, centerX: this.stageCenterX, top: this.titleText.bottom + 4 }); this.addChild(this.captionText)
    this.stageLayer = new Node({ pickable: false }); this.labelsLayer = new Node({ pickable: false }); this.coilNode = new Node({ pickable: false })
    this.addChild(this.stageLayer); this.addChild(this.coilNode); this.addChild(this.labelsLayer)
    this.particles = new ParticleBurst(70); this.addChild(this.particles)
    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' }); this.tipCard.centerX = this.stageCenterX; this.tipCard.top = this.stageTop + 12; this.tipCard.visible = false
    this.tipCard.content.addChild(new Text(ElectricMotorStrings.tipTitleStringProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: ElectricityColors.accent, left: 14, top: 10 }))
    this.tipBodyText = new RichText('', { font: new PhetFont(12), fill: ElectricityColors.ink, lineWrap: 222, leading: 3, left: 14, top: 30, maxWidth: 222 }); this.tipCard.content.addChild(this.tipBodyText); this.addChild(this.tipCard)
    this.miniQuiz = new MiniQuiz(260); this.miniQuiz.centerX = this.stageCenterX; this.miniQuiz.centerY = this.stageTop + this.stageH * 0.5; this.addChild(this.miniQuiz)

    const card = new DepthCard(rightW, this.stageH); card.left = this.stageLeft + this.stageW + gap; card.top = this.stageTop; this.addChild(card)
    const panelContent = new Node(); const contentW = rightW - 42; const halfW = (contentW - 8) / 2; const btnH = 32; const gridGap = 6
    const scenarioHeader = controlSection(ElectricMotorStrings.sectionScenarioStringProperty.value, contentW); panelContent.addChild(scenarioHeader)
    this.scenarioButtons = {} as Record<MotorScenario, SoftButton>
    const scenarioLabels: Record<MotorScenario, string> = { idle: ElectricMotorStrings.scenarioIdleStringProperty.value, spinning: ElectricMotorStrings.scenarioSpinningStringProperty.value, strongCurrent: ElectricMotorStrings.scenarioStrongStringProperty.value }
    for (const s of SCENARIOS) {
      const btn = new SoftButton(scenarioLabels[s], () => model.setScenario(s), { width: contentW, height: btnH, fill: s === 'spinning' ? ElectricityColors.accent : '#64748b', selected: s === 'spinning', fontSize: 12, onSound: () => sounds.scenario() })
      this.scenarioButtons[s] = btn; panelContent.addChild(btn)
    }
    const conditionsHeader = controlSection(ElectricMotorStrings.sectionConditionsStringProperty.value, contentW); panelContent.addChild(conditionsHeader)
    this.runningToggleBtn = new SoftButton(ElectricMotorStrings.runningOnStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: btnH, fill: ElectricityColors.accent, fontSize: 12, selected: true }); panelContent.addChild(this.runningToggleBtn)
    const currentSlider = new DepthSlider(model.currentProperty, { min: 0, max: 1, width: contentW, label: ElectricMotorStrings.currentSliderStringProperty.value, format: (n) => n.toFixed(2), fill: WIRE, onTick: () => sounds.sliderTick() }); panelContent.addChild(currentSlider)
    const conditionsHint = controlHint(ElectricMotorStrings.conditionsHintStringProperty.value, contentW); panelContent.addChild(conditionsHint)
    const displayHeader = controlSection(ElectricMotorStrings.sectionDisplayStringProperty.value, contentW); panelContent.addChild(displayHeader)
    this.labelsBtn = new SoftButton(ElectricMotorStrings.labelsOnStringProperty.value, () => { sounds.softClick(); model.showLabelsProperty.value = !model.showLabelsProperty.value }, { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true }); panelContent.addChild(this.labelsBtn)
    this.fieldBtn = new SoftButton(ElectricMotorStrings.fieldOnStringProperty.value, () => { sounds.softClick(); model.showFieldProperty.value = !model.showFieldProperty.value }, { width: halfW, height: btnH, fill: '#0ea5e9', fontSize: 11, selected: true }); panelContent.addChild(this.fieldBtn)
    const playbackHeader = controlSection(ElectricMotorStrings.sectionPlaybackStringProperty.value, contentW); panelContent.addChild(playbackHeader)
    this.playPauseBtn = new SoftButton(ElectricMotorStrings.playButtonStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: 38, fill: ElectricityColors.accent, fontSize: 12 }); panelContent.addChild(this.playPauseBtn)
    const soundHeader = controlSection(ElectricMotorStrings.sectionSoundStringProperty.value, contentW); panelContent.addChild(soundHeader)
    this.soundBtn = new SoftButton(ElectricMotorStrings.soundOnStringProperty.value, () => { sounds.unlock(); const on = !model.soundEnabledProperty.value; model.soundEnabledProperty.value = on; sounds.toggle(on); if (on) sounds.button(); this.soundBtn.setLabel(on ? ElectricMotorStrings.soundOnStringProperty.value : ElectricMotorStrings.soundOffStringProperty.value) }, { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 }); panelContent.addChild(this.soundBtn)
    const statusHeader = controlSection(ElectricMotorStrings.sectionStatusStringProperty.value, contentW); panelContent.addChild(statusHeader)
    this.starsText = new Text('', { font: new PhetFont({ size: 15, weight: 'bold' }), fill: '#d97706' }); panelContent.addChild(this.starsText)
    this.statusText = new RichText(model.statusProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: ElectricityColors.panelText, lineWrap: contentW, leading: 3 }); panelContent.addChild(this.statusText)
    const learnTip = createPanelTip(ElectricMotorStrings.learnMoreStringProperty.value, { width: contentW, fontSize: 11 }); panelContent.addChild(learnTip)
    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false }); panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      scenarioHeader.left = 0; scenarioHeader.top = py; py = scenarioHeader.bottom + 6
      for (const s of SCENARIOS) { const btn = this.scenarioButtons[s]; btn.left = 0; btn.top = py; py = btn.bottom + gridGap }
      py += 6; conditionsHeader.left = 0; conditionsHeader.top = py; py = conditionsHeader.bottom + 6
      this.runningToggleBtn.left = 0; this.runningToggleBtn.top = py; py = this.runningToggleBtn.bottom + gridGap
      currentSlider.left = 0; currentSlider.top = py; py = currentSlider.bottom + 6
      conditionsHint.left = 0; conditionsHint.top = py; py = conditionsHint.bottom + 12
      displayHeader.left = 0; displayHeader.top = py; py = displayHeader.bottom + 6
      this.labelsBtn.left = 0; this.labelsBtn.top = py; this.fieldBtn.left = halfW + 8; this.fieldBtn.top = py; py = this.labelsBtn.bottom + 12
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
    model.currentProperty.link(sync); model.angleProperty.link(() => { this.coilNode.rotation = model.angleProperty.value })
    model.scenarioProperty.link(() => {
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(model.scenarioProperty.value === s)
      this.guide.setGuidance(ElectricMotorStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[model.scenarioProperty.value])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[model.scenarioProperty.value], () => { this.leftLearnTip.top = this.teachingTriad.bottom + 22 })
      sync()
    })
    model.runningProperty.link(() => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(running ? ElectricMotorStrings.pauseButtonStringProperty.value : ElectricMotorStrings.playButtonStringProperty.value)
      this.runningToggleBtn.setLabel(running ? ElectricMotorStrings.runningOnStringProperty.value : ElectricMotorStrings.runningOffStringProperty.value)
      this.runningToggleBtn.setSelected(running)
    })
    model.showLabelsProperty.link(() => { this.labelsBtn.setSelected(model.showLabelsProperty.value); this.labelsBtn.setLabel(model.showLabelsProperty.value ? ElectricMotorStrings.labelsOnStringProperty.value : ElectricMotorStrings.labelsOffStringProperty.value); this.labelsLayer.visible = model.showLabelsProperty.value })
    model.showFieldProperty.link(() => { this.fieldBtn.setSelected(model.showFieldProperty.value); this.fieldBtn.setLabel(model.showFieldProperty.value ? ElectricMotorStrings.fieldOnStringProperty.value : ElectricMotorStrings.fieldOffStringProperty.value); sync() })
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(() => { this.starsText.string = `${ElectricMotorStrings.starsStringProperty.value} ${model.starsProperty.value}` })
    model.statusProperty.link((status) => { this.statusText.string = status; relayoutPanel() })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.starsProperty.lazyLink((stars, old) => { if (old !== undefined && stars > old) sounds.celebrate() })
    this.teachingTriad.setTriad(...SCENARIO_TRIAD.spinning, () => { this.leftLearnTip.top = this.teachingTriad.bottom + 22 })
    sync()
  }

  private drawStage(): void {
    const w = this.stageW; const h = this.stageH; const ox = this.stageLeft; const oy = this.stageTop
    const cx = ox + w * 0.5; const cy = oy + h * 0.55
    this.stageLayer.removeAllChildren(); this.labelsLayer.removeAllChildren(); this.coilNode.removeAllChildren()
    this.stageLayer.addChild(makeMagnet(ox + w * 0.18, cy, 'N', 32, 110))
    this.stageLayer.addChild(makeMagnet(ox + w * 0.82, cy, 'S', 32, 110))
    if (this.model.showFieldProperty.value) {
      for (let i = 0; i < 5; i++) {
        const y = cy - 40 + i * 20
        this.stageLayer.addChild(new Path(new Shape().moveTo(ox + w * 0.24, y).quadraticCurveTo(cx, y - 8 + (i % 2) * 16, ox + w * 0.76, y), { stroke: 'rgba(148,163,184,0.7)', lineWidth: 1.5, lineDash: [5, 4] }))
      }
    }
    const coil = new Path(Shape.ellipse(0, 0, 55, 28, 0), { stroke: WIRE, lineWidth: 4 })
    for (let i = -2; i <= 2; i++) {
      this.coilNode.addChild(new Path(new Shape().moveTo(-40, i * 6).lineTo(40, i * 6), { stroke: '#fde68a', lineWidth: 2 }))
    }
    this.coilNode.addChild(coil)
    this.coilNode.x = cx; this.coilNode.y = cy; this.coilNode.rotation = this.model.angleProperty.value
    this.stageLayer.addChild(new Path(new Shape().moveTo(cx - 20, cy + 70).lineTo(cx + 20, cy + 70), { stroke: WIRE, lineWidth: 3 }))
    this.stageLayer.addChild(new Text('I →', { font: new PhetFont({ size: 12, weight: 'bold' }), fill: WIRE, centerX: cx, top: cy + 78 }))
    if (this.model.showLabelsProperty.value) {
      this.labelsLayer.addChild(makeLabel('Coil', cx, cy - 50, true))
      this.labelsLayer.addChild(makeLabel('N', ox + w * 0.18, cy - 70, true))
      this.labelsLayer.addChild(makeLabel('S', ox + w * 0.82, cy - 70, true))
    }
    this.captionText.string = `Current ${this.model.currentProperty.value.toFixed(2)} · ${this.model.rpm.toFixed(0)} RPM — torque from I × B`
    this.captionText.centerX = this.stageCenterX
  }

  private showTipCard(text: string): void { this.tipBodyText.string = text; this.tipCard.visible = true; this.tipCard.opacity = 1; this.tipTimer = 4.4 }
  private showQuiz(): void {
    this.miniQuiz.showQuiz(ElectricMotorStrings.quizQuestionStringProperty.value, [
      { label: ElectricMotorStrings.quizCorrectStringProperty.value, correct: true },
      { label: ElectricMotorStrings.quizWrongStringProperty.value, correct: false },
    ], (correct) => { correct ? this.sounds.correct() : this.sounds.wrong(); this.model.onQuiz(correct) })
  }
  public override step(dt: number): void {
    this.model.step(dt); this.particles.step(dt)
    if (this.tipTimer > 0) { this.tipTimer -= dt; if (this.tipTimer < 0.6) this.tipCard.opacity = Math.max(0, this.tipTimer / 0.6); if (this.tipTimer <= 0) this.tipCard.visible = false }
  }
}
