import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { SpeakerMechanismModel, SpeakerScenario } from '../model/SpeakerMechanismModel.js'
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
import { SpeakerMechanismStrings } from '../SpeakerMechanismStrings.js'
import { makeLabel, makeMagnet, WIRE } from '../../../shared/circuitDraw.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions
type Wave = { radius: number; birth: number; maxRadius: number }
const SCENARIOS: readonly SpeakerScenario[] = ['quiet', 'loud', 'highPitch']
const SCENARIO_GUIDE: Record<SpeakerScenario, string> = {
  quiet: SpeakerMechanismStrings.guideQuietStringProperty.value,
  loud: SpeakerMechanismStrings.guideLoudStringProperty.value,
  highPitch: SpeakerMechanismStrings.guideHighPitchStringProperty.value,
}
const SCENARIO_TRIAD: Record<SpeakerScenario, [string, string, string]> = {
  quiet: ['Quiet drive.', 'Small current means small diaphragm motion.', 'Try Loud for bigger waves.'],
  loud: ['Loud drive.', 'Amplitude (current) sets loudness.', 'Try High pitch to change frequency.'],
  highPitch: ['High pitch.', 'Frequency sets how fast the cone vibrates.', 'Toggle sound waves in Display.'],
}

export class SpeakerMechanismScreenView extends ScreenView {
  private readonly model: SpeakerMechanismModel
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
  private readonly stageLayer: Node; private readonly labelsLayer: Node; private readonly wavesLayer: Node
  private readonly captionText: Text; private readonly titleText: Text
  private readonly scenarioButtons: Record<SpeakerScenario, SoftButton>
  private readonly runningToggleBtn: SoftButton; private readonly labelsBtn: SoftButton; private readonly wavesBtn: SoftButton
  private readonly playPauseBtn: SoftButton; private readonly soundBtn: SoftButton
  private readonly starsText: Text; private readonly statusText: RichText
  private waves: Wave[] = []
  private lastSpawn = 0

  public constructor(model: SpeakerMechanismModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    const sounds = new ElectricitySounds(); this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })
    const m = ElectricityConstants.SCREEN_VIEW_X_MARGIN; const my = ElectricityConstants.SCREEN_VIEW_Y_MARGIN; const lb = this.layoutBounds
    const leftW = 190; const rightW = 290; const gap = 14
    this.stageLeft = m + leftW + gap; this.stageTop = my + 78
    this.stageW = lb.width - m * 2 - leftW - gap - rightW - gap; this.stageH = lb.height - my * 2 - 78
    this.stageCenterX = this.stageLeft + this.stageW / 2
    this.guide = new GuidanceBanner(lb.width - m * 2, { title: SpeakerMechanismStrings.guideTitleStringProperty.value, body: SCENARIO_GUIDE.loud })
    this.guide.left = m; this.guide.top = my; this.addChild(this.guide)
    const leftCard = new DepthCard(leftW, this.stageH, { variant: 'light' }); leftCard.left = m; leftCard.top = this.stageTop; this.addChild(leftCard)
    this.teachingTriad = new TeachingTriad(leftW - 24); this.teachingTriad.left = 12; this.teachingTriad.top = 12; leftCard.content.addChild(this.teachingTriad)
    this.leftLearnTip = createPanelTip(SpeakerMechanismStrings.learnMoreStringProperty.value, { width: leftW - 24, fontSize: 11, fill: ElectricityColors.panelMuted })
    this.leftLearnTip.left = 12; this.leftLearnTip.top = this.teachingTriad.bottom + 22; leftCard.content.addChild(this.leftLearnTip)
    this.addChild(new StageBackdrop(this.stageLeft, this.stageTop, this.stageW, this.stageH, { top: '#c7d2e0', bottom: '#eef2f7' }))
    this.titleText = new Text(SpeakerMechanismStrings.stageTitleStringProperty.value, { font: new PhetFont({ size: 18, weight: 'bold' }), fill: '#0f172a', centerX: this.stageCenterX, top: this.stageTop + 10 }); this.addChild(this.titleText)
    this.captionText = new Text('', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: ElectricityColors.accent, centerX: this.stageCenterX, top: this.titleText.bottom + 4 }); this.addChild(this.captionText)
    this.stageLayer = new Node({ pickable: false }); this.labelsLayer = new Node({ pickable: false }); this.wavesLayer = new Node({ pickable: false })
    this.addChild(this.stageLayer); this.addChild(this.wavesLayer); this.addChild(this.labelsLayer)
    this.particles = new ParticleBurst(70); this.addChild(this.particles)
    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' }); this.tipCard.centerX = this.stageCenterX; this.tipCard.top = this.stageTop + 12; this.tipCard.visible = false
    this.tipCard.content.addChild(new Text(SpeakerMechanismStrings.tipTitleStringProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: ElectricityColors.accent, left: 14, top: 10 }))
    this.tipBodyText = new RichText('', { font: new PhetFont(12), fill: ElectricityColors.ink, lineWrap: 222, leading: 3, left: 14, top: 30, maxWidth: 222 }); this.tipCard.content.addChild(this.tipBodyText); this.addChild(this.tipCard)
    this.miniQuiz = new MiniQuiz(260); this.miniQuiz.centerX = this.stageCenterX; this.miniQuiz.centerY = this.stageTop + this.stageH * 0.5; this.addChild(this.miniQuiz)

    const card = new DepthCard(rightW, this.stageH); card.left = this.stageLeft + this.stageW + gap; card.top = this.stageTop; this.addChild(card)
    const panelContent = new Node(); const contentW = rightW - 42; const halfW = (contentW - 8) / 2; const btnH = 32; const gridGap = 6
    const scenarioHeader = controlSection(SpeakerMechanismStrings.sectionScenarioStringProperty.value, contentW); panelContent.addChild(scenarioHeader)
    this.scenarioButtons = {} as Record<SpeakerScenario, SoftButton>
    const scenarioLabels: Record<SpeakerScenario, string> = { quiet: SpeakerMechanismStrings.scenarioQuietStringProperty.value, loud: SpeakerMechanismStrings.scenarioLoudStringProperty.value, highPitch: SpeakerMechanismStrings.scenarioHighPitchStringProperty.value }
    for (const s of SCENARIOS) {
      const btn = new SoftButton(scenarioLabels[s], () => model.setScenario(s), { width: contentW, height: btnH, fill: s === 'loud' ? ElectricityColors.accent : '#64748b', selected: s === 'loud', fontSize: 12, onSound: () => sounds.scenario() })
      this.scenarioButtons[s] = btn; panelContent.addChild(btn)
    }
    const conditionsHeader = controlSection(SpeakerMechanismStrings.sectionConditionsStringProperty.value, contentW); panelContent.addChild(conditionsHeader)
    this.runningToggleBtn = new SoftButton(SpeakerMechanismStrings.runningOnStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: btnH, fill: ElectricityColors.accent, fontSize: 12, selected: true }); panelContent.addChild(this.runningToggleBtn)
    const currentSlider = new DepthSlider(model.currentProperty, { min: 0, max: 1, width: contentW, label: SpeakerMechanismStrings.currentSliderStringProperty.value, format: (n) => n.toFixed(2), fill: '#f59e0b', onTick: () => sounds.sliderTick() }); panelContent.addChild(currentSlider)
    const freqSlider = new DepthSlider(model.frequencyProperty, { min: 40, max: 400, width: contentW, label: SpeakerMechanismStrings.frequencySliderStringProperty.value, format: (n) => `${n.toFixed(0)} Hz`, fill: '#0ea5e9', onTick: () => sounds.sliderTick() }); panelContent.addChild(freqSlider)
    const conditionsHint = controlHint(SpeakerMechanismStrings.conditionsHintStringProperty.value, contentW); panelContent.addChild(conditionsHint)
    const displayHeader = controlSection(SpeakerMechanismStrings.sectionDisplayStringProperty.value, contentW); panelContent.addChild(displayHeader)
    this.labelsBtn = new SoftButton(SpeakerMechanismStrings.labelsOnStringProperty.value, () => { sounds.softClick(); model.showLabelsProperty.value = !model.showLabelsProperty.value }, { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true }); panelContent.addChild(this.labelsBtn)
    this.wavesBtn = new SoftButton(SpeakerMechanismStrings.wavesOnStringProperty.value, () => { sounds.softClick(); model.showWavesProperty.value = !model.showWavesProperty.value }, { width: halfW, height: btnH, fill: '#38bdf8', fontSize: 11, selected: true }); panelContent.addChild(this.wavesBtn)
    const playbackHeader = controlSection(SpeakerMechanismStrings.sectionPlaybackStringProperty.value, contentW); panelContent.addChild(playbackHeader)
    this.playPauseBtn = new SoftButton(SpeakerMechanismStrings.playButtonStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: 38, fill: ElectricityColors.accent, fontSize: 12 }); panelContent.addChild(this.playPauseBtn)
    const soundHeader = controlSection(SpeakerMechanismStrings.sectionSoundStringProperty.value, contentW); panelContent.addChild(soundHeader)
    this.soundBtn = new SoftButton(SpeakerMechanismStrings.soundOnStringProperty.value, () => { sounds.unlock(); const on = !model.soundEnabledProperty.value; model.soundEnabledProperty.value = on; sounds.toggle(on); if (on) sounds.button(); this.soundBtn.setLabel(on ? SpeakerMechanismStrings.soundOnStringProperty.value : SpeakerMechanismStrings.soundOffStringProperty.value) }, { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 }); panelContent.addChild(this.soundBtn)
    const statusHeader = controlSection(SpeakerMechanismStrings.sectionStatusStringProperty.value, contentW); panelContent.addChild(statusHeader)
    this.starsText = new Text('', { font: new PhetFont({ size: 15, weight: 'bold' }), fill: '#d97706' }); panelContent.addChild(this.starsText)
    this.statusText = new RichText(model.statusProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: ElectricityColors.panelText, lineWrap: contentW, leading: 3 }); panelContent.addChild(this.statusText)
    const learnTip = createPanelTip(SpeakerMechanismStrings.learnMoreStringProperty.value, { width: contentW, fontSize: 11 }); panelContent.addChild(learnTip)
    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false }); panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      scenarioHeader.left = 0; scenarioHeader.top = py; py = scenarioHeader.bottom + 6
      for (const s of SCENARIOS) { const btn = this.scenarioButtons[s]; btn.left = 0; btn.top = py; py = btn.bottom + gridGap }
      py += 6; conditionsHeader.left = 0; conditionsHeader.top = py; py = conditionsHeader.bottom + 6
      this.runningToggleBtn.left = 0; this.runningToggleBtn.top = py; py = this.runningToggleBtn.bottom + gridGap
      currentSlider.left = 0; currentSlider.top = py; py = currentSlider.bottom + gridGap
      freqSlider.left = 0; freqSlider.top = py; py = freqSlider.bottom + 6
      conditionsHint.left = 0; conditionsHint.top = py; py = conditionsHint.bottom + 12
      displayHeader.left = 0; displayHeader.top = py; py = displayHeader.bottom + 6
      this.labelsBtn.left = 0; this.labelsBtn.top = py; this.wavesBtn.left = halfW + 8; this.wavesBtn.top = py; py = this.labelsBtn.bottom + 12
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
    this.addChild(new ResetAllButton({ listener: () => { sounds.resetAll(); model.reset(); this.particles.clear(); this.waves = []; this.lastSpawn = 0 }, right: lb.right - m, bottom: lb.bottom - my }))

    const sync = () => this.drawStage()
    model.currentProperty.link(sync); model.frequencyProperty.link(sync); model.timeProperty.link(sync)
    model.scenarioProperty.link(() => {
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(model.scenarioProperty.value === s)
      this.guide.setGuidance(SpeakerMechanismStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[model.scenarioProperty.value])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[model.scenarioProperty.value], () => { this.leftLearnTip.top = this.teachingTriad.bottom + 22 })
      sync()
    })
    model.runningProperty.link(() => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(running ? SpeakerMechanismStrings.pauseButtonStringProperty.value : SpeakerMechanismStrings.playButtonStringProperty.value)
      this.runningToggleBtn.setLabel(running ? SpeakerMechanismStrings.runningOnStringProperty.value : SpeakerMechanismStrings.runningOffStringProperty.value)
      this.runningToggleBtn.setSelected(running)
    })
    model.showLabelsProperty.link(() => { this.labelsBtn.setSelected(model.showLabelsProperty.value); this.labelsBtn.setLabel(model.showLabelsProperty.value ? SpeakerMechanismStrings.labelsOnStringProperty.value : SpeakerMechanismStrings.labelsOffStringProperty.value); this.labelsLayer.visible = model.showLabelsProperty.value })
    model.showWavesProperty.link(() => { this.wavesBtn.setSelected(model.showWavesProperty.value); this.wavesBtn.setLabel(model.showWavesProperty.value ? SpeakerMechanismStrings.wavesOnStringProperty.value : SpeakerMechanismStrings.wavesOffStringProperty.value); this.wavesLayer.visible = model.showWavesProperty.value })
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(() => { this.starsText.string = `${SpeakerMechanismStrings.starsStringProperty.value} ${model.starsProperty.value}` })
    model.statusProperty.link((status) => { this.statusText.string = status; relayoutPanel() })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.starsProperty.lazyLink((stars, old) => { if (old !== undefined && stars > old) sounds.celebrate() })
    this.teachingTriad.setTriad(...SCENARIO_TRIAD.loud, () => { this.leftLearnTip.top = this.teachingTriad.bottom + 22 })
    sync()
  }

  private drawStage(): void {
    const w = this.stageW; const h = this.stageH; const ox = this.stageLeft; const oy = this.stageTop
    const cx = ox + w * 0.38; const cy = oy + h * 0.52
    const offset = this.model.runningProperty.value ? this.model.coilOffset() : 0
    this.stageLayer.removeAllChildren(); this.labelsLayer.removeAllChildren(); this.wavesLayer.removeAllChildren()
    this.stageLayer.addChild(new Circle(70, { fill: 'rgba(30,41,59,0.85)', stroke: '#94a3b8', lineWidth: 3, centerX: cx, centerY: cy }))
    this.stageLayer.addChild(new Circle(42 + Math.abs(offset) * 0.15, { fill: 'rgba(148,163,184,0.35)', stroke: '#e2e8f0', lineWidth: 2, centerX: cx + offset * 0.15, centerY: cy }))
    this.stageLayer.addChild(new Rectangle(cx - 18, cy - 10, 36, 20, { fill: '#334155', cornerRadius: 3 }))
    this.stageLayer.addChild(makeMagnet(cx, cy, 'N', 16, 36))
    // AC sine at bottom
    const sine = new Shape().moveTo(ox + 40, oy + h * 0.88)
    for (let i = 0; i <= 40; i++) {
      const x = ox + 40 + i * (w * 0.45) / 40
      const y = oy + h * 0.88 + Math.sin(i * 0.45 + this.model.timeProperty.value * this.model.frequencyProperty.value * 0.02) * (8 + this.model.currentProperty.value * 10)
      sine.lineTo(x, y)
    }
    this.stageLayer.addChild(new Path(sine, { stroke: WIRE, lineWidth: 2 }))
    if (this.model.showLabelsProperty.value) {
      this.labelsLayer.addChild(makeLabel('Diaphragm', cx, cy - 85, true))
      this.labelsLayer.addChild(makeLabel('Coil + magnet', cx, cy + 55, true))
      this.labelsLayer.addChild(makeLabel('AC drive', ox + w * 0.28, oy + h * 0.88 + 18, true))
    }
    if (this.model.showWavesProperty.value) {
      for (const wave of this.waves) {
        this.wavesLayer.addChild(new Path(new Shape().arc(cx + 50, cy, wave.radius, -0.9, 0.9), { stroke: `rgba(56,189,248,${Math.max(0.15, 1 - wave.radius / wave.maxRadius)})`, lineWidth: 2 }))
      }
    }
    this.captionText.string = `I=${this.model.currentProperty.value.toFixed(2)} · f=${this.model.frequencyProperty.value.toFixed(0)} Hz — AC vibrates the cone`
    this.captionText.centerX = this.stageCenterX
  }

  private showTipCard(text: string): void { this.tipBodyText.string = text; this.tipCard.visible = true; this.tipCard.opacity = 1; this.tipTimer = 4.4 }
  private showQuiz(): void {
    this.miniQuiz.showQuiz(SpeakerMechanismStrings.quizQuestionStringProperty.value, [
      { label: SpeakerMechanismStrings.quizCorrectStringProperty.value, correct: true },
      { label: SpeakerMechanismStrings.quizWrongStringProperty.value, correct: false },
    ], (correct) => { correct ? this.sounds.correct() : this.sounds.wrong(); this.model.onQuiz(correct) })
  }
  public override step(dt: number): void {
    this.model.step(dt); this.particles.step(dt)
    if (this.model.runningProperty.value) {
      const t = this.model.timeProperty.value
      if (t - this.lastSpawn > 0.35) {
        this.waves.push({ radius: 8, birth: t, maxRadius: this.stageW * 0.55 })
        this.lastSpawn = t
      }
      this.waves = this.waves.map(w => ({ ...w, radius: w.radius + (40 + this.model.currentProperty.value * 80) * dt })).filter(w => w.radius < w.maxRadius && t - w.birth < 3)
      this.drawStage()
    }
    if (this.tipTimer > 0) { this.tipTimer -= dt; if (this.tipTimer < 0.6) this.tipCard.opacity = Math.max(0, this.tipTimer / 0.6); if (this.tipTimer <= 0) this.tipCard.visible = false }
  }
}
