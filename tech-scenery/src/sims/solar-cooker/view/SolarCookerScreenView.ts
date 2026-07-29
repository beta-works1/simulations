import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { SolarCookerModel, SolarScenario } from '../model/SolarCookerModel.js'
import { TechConstants } from '../../../shared/TechConstants.js'
import { TechColors } from '../../../shared/TechColors.js'
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
import { TechSounds } from '../../../shared/TechSounds.js'
import { SolarCookerStrings } from '../SolarCookerStrings.js'
import { focusIntensity, MAX_ANGLE, MIN_ANGLE } from '../../../shared/solarPhysics.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SCENARIOS: readonly SolarScenario[] = ['explore', 'aligned', 'misaligned']
const SCENARIO_GUIDE: Record<SolarScenario, string> = {
  explore: SolarCookerStrings.guideExploreStringProperty.value,
  aligned: SolarCookerStrings.guideAlignedStringProperty.value,
  misaligned: SolarCookerStrings.guideMisalignedStringProperty.value,
}
const SCENARIO_TRIAD: Record<SolarScenario, [string, string, string]> = {
  explore: ['Aligning the cooker.', 'A reflector concentrates sunlight onto the pot.', 'Try Well aligned.'],
  aligned: ['Good focus.', 'Strong intensity heats the pot quickly.', 'Compare with Misaligned.'],
  misaligned: ['Poor aim.', 'Sunlight misses the pot so heating slows.', 'Nudge the reflector angle.'],
}

function makePillLabel(text: string, x: number, y: number, center = true): Node {
  const t = new Text(text, { font: new PhetFont({ size: 11, weight: 'bold' }), fill: '#0f172a' })
  const bg = new Rectangle(-5, -2, t.width + 10, t.height + 4, { cornerRadius: 4, fill: 'rgba(248,250,252,0.92)', stroke: 'rgba(15,23,42,0.12)', lineWidth: 1 })
  const root = new Node({ children: [bg, t], pickable: false })
  t.left = 0; t.top = 0
  if (center) { root.centerX = x; root.centerY = y } else { root.left = x; root.top = y }
  return root
}

export class SolarCookerScreenView extends ScreenView {
  private readonly model: SolarCookerModel
  private readonly sounds: TechSounds
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
  private readonly scenarioButtons: Record<SolarScenario, SoftButton>
  private readonly runningToggleBtn: SoftButton; private readonly labelsBtn: SoftButton; private readonly raysBtn: SoftButton
  private readonly playPauseBtn: SoftButton; private readonly soundBtn: SoftButton
  private readonly starsText: Text; private readonly statusText: RichText

  public constructor(model: SolarCookerModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    const sounds = new TechSounds(); this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })
    const m = TechConstants.SCREEN_VIEW_X_MARGIN; const my = TechConstants.SCREEN_VIEW_Y_MARGIN; const lb = this.layoutBounds
    const leftW = 190; const rightW = 290; const gap = 14
    this.stageLeft = m + leftW + gap; this.stageTop = my + 78
    this.stageW = lb.width - m * 2 - leftW - gap - rightW - gap; this.stageH = lb.height - my * 2 - 78
    this.stageCenterX = this.stageLeft + this.stageW / 2

    this.guide = new GuidanceBanner(lb.width - m * 2, { title: SolarCookerStrings.guideTitleStringProperty.value, body: SCENARIO_GUIDE.explore })
    this.guide.left = m; this.guide.top = my; this.addChild(this.guide)
    const leftCard = new DepthCard(leftW, this.stageH, { variant: 'light' }); leftCard.left = m; leftCard.top = this.stageTop; this.addChild(leftCard)
    this.teachingTriad = new TeachingTriad(leftW - 24); this.teachingTriad.left = 12; this.teachingTriad.top = 12; leftCard.content.addChild(this.teachingTriad)
    this.leftLearnTip = createPanelTip(SolarCookerStrings.learnMoreStringProperty.value, { width: leftW - 24, fontSize: 11, fill: TechColors.panelMuted })
    this.leftLearnTip.left = 12; this.leftLearnTip.top = this.teachingTriad.bottom + 22; leftCard.content.addChild(this.leftLearnTip)

    this.addChild(new StageBackdrop(this.stageLeft, this.stageTop, this.stageW, this.stageH, { top: '#5ba3e8', bottom: '#ffd89b' }))
    this.titleText = new Text(SolarCookerStrings.stageTitleStringProperty.value, { font: new PhetFont({ size: 18, weight: 'bold' }), fill: '#0f172a', centerX: this.stageCenterX, top: this.stageTop + 10 }); this.addChild(this.titleText)
    this.captionText = new Text('', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: TechColors.accent, centerX: this.stageCenterX, top: this.titleText.bottom + 4 }); this.addChild(this.captionText)
    this.stageLayer = new Node({ pickable: false }); this.raysLayer = new Node({ pickable: false }); this.labelsLayer = new Node({ pickable: false })
    this.addChild(this.stageLayer); this.addChild(this.raysLayer); this.addChild(this.labelsLayer)
    this.particles = new ParticleBurst(70); this.addChild(this.particles)

    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' }); this.tipCard.centerX = this.stageCenterX; this.tipCard.top = this.stageTop + 12; this.tipCard.visible = false
    this.tipCard.content.addChild(new Text(SolarCookerStrings.tipTitleStringProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: TechColors.accent, left: 14, top: 10 }))
    this.tipBodyText = new RichText('', { font: new PhetFont(12), fill: TechColors.ink, lineWrap: 222, leading: 3, left: 14, top: 30, maxWidth: 222 }); this.tipCard.content.addChild(this.tipBodyText); this.addChild(this.tipCard)
    this.miniQuiz = new MiniQuiz(260); this.miniQuiz.centerX = this.stageCenterX; this.miniQuiz.centerY = this.stageTop + this.stageH * 0.5; this.addChild(this.miniQuiz)

    const card = new DepthCard(rightW, this.stageH); card.left = this.stageLeft + this.stageW + gap; card.top = this.stageTop; this.addChild(card)
    const panelContent = new Node(); const contentW = rightW - 42; const halfW = (contentW - 8) / 2; const btnH = 32; const gridGap = 6

    const scenarioHeader = controlSection(SolarCookerStrings.sectionScenarioStringProperty.value, contentW); panelContent.addChild(scenarioHeader)
    this.scenarioButtons = {} as Record<SolarScenario, SoftButton>
    const scenarioLabels: Record<SolarScenario, string> = {
      explore: SolarCookerStrings.scenarioExploreStringProperty.value,
      aligned: SolarCookerStrings.scenarioAlignedStringProperty.value,
      misaligned: SolarCookerStrings.scenarioMisalignedStringProperty.value,
    }
    for (const s of SCENARIOS) {
      const btn = new SoftButton(scenarioLabels[s], () => model.setScenario(s), { width: contentW, height: btnH, fill: s === 'explore' ? TechColors.accent : '#64748b', selected: s === 'explore', fontSize: 12, onSound: () => sounds.scenario() })
      this.scenarioButtons[s] = btn; panelContent.addChild(btn)
    }
    const conditionsHeader = controlSection(SolarCookerStrings.sectionConditionsStringProperty.value, contentW); panelContent.addChild(conditionsHeader)
    this.runningToggleBtn = new SoftButton(SolarCookerStrings.runningOnStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: btnH, fill: TechColors.accent, fontSize: 12, selected: true }); panelContent.addChild(this.runningToggleBtn)
    const angleSlider = new DepthSlider(model.reflectorAngleProperty, { min: MIN_ANGLE, max: MAX_ANGLE, width: contentW, label: SolarCookerStrings.angleSliderStringProperty.value, format: (n) => `${n.toFixed(0)}°`, fill: '#f59e0b', onTick: () => sounds.sliderTick() }); panelContent.addChild(angleSlider)
    const sunSlider = new DepthSlider(model.sunElevationProperty, { min: 20, max: 70, width: contentW, label: SolarCookerStrings.sunSliderStringProperty.value, format: (n) => `${n.toFixed(0)}°`, fill: '#eab308', onTick: () => sounds.sliderTick() }); panelContent.addChild(sunSlider)
    const conditionsHint = controlHint(SolarCookerStrings.conditionsHintStringProperty.value, contentW); panelContent.addChild(conditionsHint)
    const displayHeader = controlSection(SolarCookerStrings.sectionDisplayStringProperty.value, contentW); panelContent.addChild(displayHeader)
    this.labelsBtn = new SoftButton(SolarCookerStrings.labelsOnStringProperty.value, () => { sounds.softClick(); model.showLabelsProperty.value = !model.showLabelsProperty.value }, { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true }); panelContent.addChild(this.labelsBtn)
    this.raysBtn = new SoftButton(SolarCookerStrings.raysOnStringProperty.value, () => { sounds.softClick(); model.showRaysProperty.value = !model.showRaysProperty.value }, { width: halfW, height: btnH, fill: '#f59e0b', fontSize: 11, selected: true }); panelContent.addChild(this.raysBtn)
    const playbackHeader = controlSection(SolarCookerStrings.sectionPlaybackStringProperty.value, contentW); panelContent.addChild(playbackHeader)
    this.playPauseBtn = new SoftButton(SolarCookerStrings.playButtonStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: 38, fill: TechColors.accent, fontSize: 12 }); panelContent.addChild(this.playPauseBtn)
    const soundHeader = controlSection(SolarCookerStrings.sectionSoundStringProperty.value, contentW); panelContent.addChild(soundHeader)
    this.soundBtn = new SoftButton(SolarCookerStrings.soundOnStringProperty.value, () => { sounds.unlock(); const on = !model.soundEnabledProperty.value; model.soundEnabledProperty.value = on; sounds.toggle(on); if (on) sounds.button(); this.soundBtn.setLabel(on ? SolarCookerStrings.soundOnStringProperty.value : SolarCookerStrings.soundOffStringProperty.value) }, { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 }); panelContent.addChild(this.soundBtn)
    const statusHeader = controlSection(SolarCookerStrings.sectionStatusStringProperty.value, contentW); panelContent.addChild(statusHeader)
    this.starsText = new Text('', { font: new PhetFont({ size: 15, weight: 'bold' }), fill: '#d97706' }); panelContent.addChild(this.starsText)
    this.statusText = new RichText(model.statusProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: TechColors.panelText, lineWrap: contentW, leading: 3 }); panelContent.addChild(this.statusText)
    const learnTip = createPanelTip(SolarCookerStrings.learnMoreStringProperty.value, { width: contentW, fontSize: 11 }); panelContent.addChild(learnTip)
    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false }); panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      scenarioHeader.left = 0; scenarioHeader.top = py; py = scenarioHeader.bottom + 6
      for (const s of SCENARIOS) { const btn = this.scenarioButtons[s]; btn.left = 0; btn.top = py; py = btn.bottom + gridGap }
      py += 6; conditionsHeader.left = 0; conditionsHeader.top = py; py = conditionsHeader.bottom + 6
      this.runningToggleBtn.left = 0; this.runningToggleBtn.top = py; py = this.runningToggleBtn.bottom + gridGap
      angleSlider.left = 0; angleSlider.top = py; py = angleSlider.bottom + gridGap
      sunSlider.left = 0; sunSlider.top = py; py = sunSlider.bottom + 6
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
    model.reflectorAngleProperty.link(sync); model.sunElevationProperty.link(sync); model.temperatureProperty.link(sync)
    model.scenarioProperty.link(() => {
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(model.scenarioProperty.value === s)
      this.guide.setGuidance(SolarCookerStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[model.scenarioProperty.value])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[model.scenarioProperty.value], () => { this.leftLearnTip.top = this.teachingTriad.bottom + 22 })
      sync()
    })
    model.runningProperty.link(() => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(running ? SolarCookerStrings.pauseButtonStringProperty.value : SolarCookerStrings.playButtonStringProperty.value)
      this.runningToggleBtn.setLabel(running ? SolarCookerStrings.runningOnStringProperty.value : SolarCookerStrings.runningOffStringProperty.value)
      this.runningToggleBtn.setSelected(running)
    })
    model.showLabelsProperty.link(() => { this.labelsBtn.setSelected(model.showLabelsProperty.value); this.labelsBtn.setLabel(model.showLabelsProperty.value ? SolarCookerStrings.labelsOnStringProperty.value : SolarCookerStrings.labelsOffStringProperty.value); this.labelsLayer.visible = model.showLabelsProperty.value })
    model.showRaysProperty.link(() => { this.raysBtn.setSelected(model.showRaysProperty.value); this.raysBtn.setLabel(model.showRaysProperty.value ? SolarCookerStrings.raysOnStringProperty.value : SolarCookerStrings.raysOffStringProperty.value); this.raysLayer.visible = model.showRaysProperty.value })
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(() => { this.starsText.string = `${SolarCookerStrings.starsStringProperty.value} ${model.starsProperty.value}` })
    model.statusProperty.link((status) => { this.statusText.string = status; relayoutPanel() })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.starsProperty.lazyLink((stars, old) => { if (old !== undefined && stars > old) sounds.celebrate() })
    this.teachingTriad.setTriad(...SCENARIO_TRIAD.explore, () => { this.leftLearnTip.top = this.teachingTriad.bottom + 22 })
    sync()
  }

  private drawStage(): void {
    const w = this.stageW; const h = this.stageH; const ox = this.stageLeft; const oy = this.stageTop
    const alignment = this.model.alignment
    const intensity = focusIntensity(alignment)
    const temp = this.model.temperatureProperty.value
    this.stageLayer.removeAllChildren(); this.raysLayer.removeAllChildren(); this.labelsLayer.removeAllChildren()

    this.stageLayer.addChild(new Rectangle(ox, oy + h * 0.72, w, h * 0.28, { fill: '#c4a574' }))
    const sunX = ox + w * 0.78; const sunY = oy + h * 0.16
    this.stageLayer.addChild(new Circle(40 + intensity * 10, { fill: `rgba(255,235,59,${0.2 + intensity * 0.35})`, centerX: sunX, centerY: sunY }))
    this.stageLayer.addChild(new Circle(22, { fill: '#fff9c4', centerX: sunX, centerY: sunY }))

    const potX = ox + w * 0.42; const potY = oy + h * 0.62
    const pivotX = potX - 20; const pivotY = potY + 28
    const rad = (this.model.reflectorAngleProperty.value * Math.PI) / 180
    const dish = new Node()
    dish.addChild(new Path(new Shape().moveTo(-110, 0).quadraticCurveTo(0, -95, 110, 0).lineTo(110, 12).quadraticCurveTo(0, -83, -110, 12).close(), { fill: '#78909c', stroke: 'rgba(255,220,100,0.4)', lineWidth: 2 }))
    dish.x = pivotX; dish.y = pivotY; dish.rotation = rad
    this.stageLayer.addChild(dish)
    this.stageLayer.addChild(new Rectangle(pivotX - 8, pivotY, 16, 36, { fill: '#455a64' }))

    if (this.model.showRaysProperty.value && intensity > 0.05) {
      for (let i = -2; i <= 2; i++) {
        this.raysLayer.addChild(new Path(new Shape().moveTo(sunX - i * 6, sunY + 20).quadraticCurveTo(ox + w * 0.6 + i * 8, oy + h * 0.35, potX + i * 4, potY - 18), {
          stroke: `rgba(255,220,80,${0.25 + intensity * 0.55})`, lineWidth: 1.5 + intensity * 2,
        }))
      }
    }

    const potHeat = Math.min(1, (temp - 20) / 80)
    this.stageLayer.addChild(new Path(Shape.ellipse(potX, potY + 8, 38, 10, 0), { fill: '#37474f' }))
    this.stageLayer.addChild(new Path(Shape.ellipse(potX, potY - 6, 32, 22, 0), { fill: `rgb(${55 + potHeat * 140},${71},${79})` }))
    this.stageLayer.addChild(new Rectangle(potX - 28, potY - 28, 56, 10, { fill: '#263238', cornerRadius: 2 }))

    if (this.model.showLabelsProperty.value) {
      this.labelsLayer.addChild(makePillLabel('Sun', sunX, sunY + 40))
      this.labelsLayer.addChild(makePillLabel('Reflector', pivotX - 40, pivotY - 70, false))
      this.labelsLayer.addChild(makePillLabel('Pot', potX, potY + 28))
    }

    this.captionText.string = `${temp.toFixed(0)}°C · ${this.model.tempStatus} · focus ${(intensity * 100).toFixed(0)}%`
    this.captionText.centerX = this.stageCenterX
  }

  private showTipCard(text: string): void { this.tipBodyText.string = text; this.tipCard.visible = true; this.tipCard.opacity = 1; this.tipTimer = 4.4 }
  private showQuiz(): void {
    this.miniQuiz.showQuiz(SolarCookerStrings.quizQuestionStringProperty.value, [
      { label: SolarCookerStrings.quizCorrectStringProperty.value, correct: true },
      { label: SolarCookerStrings.quizWrongStringProperty.value, correct: false },
    ], (correct) => { correct ? this.sounds.correct() : this.sounds.wrong(); this.model.onQuiz(correct) })
  }
  public override step(dt: number): void {
    this.model.step(dt); this.particles.step(dt)
    if (this.model.runningProperty.value) this.drawStage()
    if (this.tipTimer > 0) { this.tipTimer -= dt; if (this.tipTimer < 0.6) this.tipCard.opacity = Math.max(0, this.tipTimer / 0.6); if (this.tipTimer <= 0) this.tipCard.visible = false }
  }
}
