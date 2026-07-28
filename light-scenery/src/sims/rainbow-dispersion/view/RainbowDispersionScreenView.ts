import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { RainbowDispersionModel, RainbowScenario } from '../model/RainbowDispersionModel.js'
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
import { RainbowDispersionStrings } from '../RainbowDispersionStrings.js'
import {
  makeLabel,
  makeRay,
  normalize,
  RAY_WHITE,
  SPECTRUM,
  type Vec2,
} from '../../../shared/opticsDraw.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SCENARIOS: readonly RainbowScenario[] = ['explore', 'slow', 'fast']

const SCENARIO_GUIDE: Record<RainbowScenario, string> = {
  explore: RainbowDispersionStrings.guideExploreStringProperty.value,
  slow: RainbowDispersionStrings.guideSlowStringProperty.value,
  fast: RainbowDispersionStrings.guideFastStringProperty.value,
}

const SCENARIO_TRIAD: Record<RainbowScenario, [string, string, string]> = {
  explore: ['Watching dispersion.', 'White light splits into colors inside a water droplet.', 'Press Play to advance the animation.'],
  slow: ['Slow motion.', 'Refraction, internal reflection, and dispersion happen step by step.', 'Try Fast demo when ready.'],
  fast: ['Fast playback.', 'Quickly see the full spectrum exit and the rainbow arc hint.', 'Toggle the spectrum fan in Display.'],
}

export class RainbowDispersionScreenView extends ScreenView {
  private readonly model: RainbowDispersionModel
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
  private readonly spectrumLayer: Node
  private readonly secondaryLayer: Node
  private readonly labelsLayer: Node
  private readonly captionText: Text
  private readonly titleText: Text
  private readonly scenarioButtons: Record<RainbowScenario, SoftButton>
  private readonly runningToggleBtn: SoftButton
  private readonly spectrumBtn: SoftButton
  private readonly secondaryBtn: SoftButton
  private readonly playPauseBtn: SoftButton
  private readonly soundBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: RichText

  public constructor(model: RainbowDispersionModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    const sounds = new LightSounds()
    this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })

    const m = LightConstants.SCREEN_VIEW_X_MARGIN
    const my = LightConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    const leftW = 190; const rightW = 290; const gap = 14
    this.stageLeft = m + leftW + gap; this.stageTop = my + 78
    this.stageW = lb.width - m * 2 - leftW - gap - rightW - gap
    this.stageH = lb.height - my * 2 - 78
    this.stageCenterX = this.stageLeft + this.stageW / 2

    this.guide = new GuidanceBanner(lb.width - m * 2, { title: RainbowDispersionStrings.guideTitleStringProperty.value, body: SCENARIO_GUIDE.explore })
    this.guide.left = m; this.guide.top = my; this.addChild(this.guide)

    const leftCard = new DepthCard(leftW, this.stageH, { variant: 'light' })
    leftCard.left = m; leftCard.top = this.stageTop; this.addChild(leftCard)
    this.teachingTriad = new TeachingTriad(leftW - 24); this.teachingTriad.left = 12; this.teachingTriad.top = 12; leftCard.content.addChild(this.teachingTriad)
    this.leftLearnTip = createPanelTip(RainbowDispersionStrings.learnMoreStringProperty.value, { width: leftW - 24, fontSize: 11, fill: LightColors.panelMuted })
    this.leftLearnTip.left = 12; this.leftLearnTip.top = this.teachingTriad.bottom + 16; leftCard.content.addChild(this.leftLearnTip)

    this.addChild(new StageBackdrop(this.stageLeft, this.stageTop, this.stageW, this.stageH, { top: '#c7d2e0', bottom: '#eef2f7' }))
    this.titleText = new Text(RainbowDispersionStrings.stageTitleStringProperty.value, { font: new PhetFont({ size: 18, weight: 'bold' }), fill: '#0f172a', centerX: this.stageCenterX, top: this.stageTop + 10 })
    this.addChild(this.titleText)
    this.captionText = new Text('', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: LightColors.accent, centerX: this.stageCenterX, top: this.titleText.bottom + 4 })
    this.addChild(this.captionText)
    this.stageLayer = new Node({ pickable: false }); this.spectrumLayer = new Node({ pickable: false })
    this.secondaryLayer = new Node({ pickable: false }); this.labelsLayer = new Node({ pickable: false })
    this.addChild(this.stageLayer); this.addChild(this.spectrumLayer); this.addChild(this.secondaryLayer); this.addChild(this.labelsLayer)
    this.particles = new ParticleBurst(70); this.addChild(this.particles)

    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = this.stageCenterX; this.tipCard.top = this.stageTop + 12; this.tipCard.visible = false
    this.tipCard.content.addChild(new Text(RainbowDispersionStrings.tipTitleStringProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: LightColors.accent, left: 14, top: 10 }))
    this.tipBodyText = new RichText('', { font: new PhetFont(12), fill: LightColors.ink, lineWrap: 222, leading: 3, left: 14, top: 30, maxWidth: 222 })
    this.tipCard.content.addChild(this.tipBodyText); this.addChild(this.tipCard)
    this.miniQuiz = new MiniQuiz(260); this.miniQuiz.centerX = this.stageCenterX; this.miniQuiz.centerY = this.stageTop + this.stageH * 0.5; this.addChild(this.miniQuiz)

    const card = new DepthCard(rightW, this.stageH); card.left = this.stageLeft + this.stageW + gap; card.top = this.stageTop; this.addChild(card)
    const panelContent = new Node(); const contentW = rightW - 42; const halfW = (contentW - 8) / 2; const btnH = 32; const gridGap = 6

    const scenarioHeader = controlSection(RainbowDispersionStrings.sectionScenarioStringProperty.value, contentW); panelContent.addChild(scenarioHeader)
    this.scenarioButtons = {} as Record<RainbowScenario, SoftButton>
    const scenarioLabels: Record<RainbowScenario, string> = { explore: RainbowDispersionStrings.scenarioExploreStringProperty.value, slow: RainbowDispersionStrings.scenarioSlowStringProperty.value, fast: RainbowDispersionStrings.scenarioFastStringProperty.value }
    for (const scenario of SCENARIOS) {
      const btn = new SoftButton(scenarioLabels[scenario], () => model.setScenario(scenario), { width: contentW, height: btnH, fill: scenario === 'explore' ? LightColors.accent : '#64748b', selected: scenario === 'explore', fontSize: 12, onSound: () => sounds.scenario() })
      this.scenarioButtons[scenario] = btn; panelContent.addChild(btn)
    }

    const conditionsHeader = controlSection(RainbowDispersionStrings.sectionConditionsStringProperty.value, contentW); panelContent.addChild(conditionsHeader)
    this.runningToggleBtn = new SoftButton(RainbowDispersionStrings.runningOnStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: btnH, fill: LightColors.accent, fontSize: 12, selected: false })
    panelContent.addChild(this.runningToggleBtn)
    const speedSlider = new DepthSlider(model.speedProperty, { min: 0.25, max: 3, width: contentW, label: RainbowDispersionStrings.speedSliderStringProperty.value, format: (n) => `${n.toFixed(2)}×`, fill: LightColors.accent, onTick: () => sounds.sliderTick() })
    panelContent.addChild(speedSlider)
    panelContent.addChild(controlHint(RainbowDispersionStrings.conditionsHintStringProperty.value, contentW))

    const displayHeader = controlSection(RainbowDispersionStrings.sectionDisplayStringProperty.value, contentW); panelContent.addChild(displayHeader)
    this.spectrumBtn = new SoftButton(RainbowDispersionStrings.spectrumOnStringProperty.value, () => { sounds.softClick(); model.showSpectrumProperty.value = !model.showSpectrumProperty.value }, { width: halfW, height: btnH, fill: '#64748b', fontSize: 10, selected: true })
    this.secondaryBtn = new SoftButton(RainbowDispersionStrings.secondaryOnStringProperty.value, () => { sounds.softClick(); model.showSecondaryProperty.value = !model.showSecondaryProperty.value }, { width: halfW, height: btnH, fill: '#f59e0b', fontSize: 10, selected: true })
    panelContent.addChild(this.spectrumBtn); panelContent.addChild(this.secondaryBtn)

    const playbackHeader = controlSection(RainbowDispersionStrings.sectionPlaybackStringProperty.value, contentW); panelContent.addChild(playbackHeader)
    this.playPauseBtn = new SoftButton(RainbowDispersionStrings.playButtonStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: 38, fill: LightColors.accent, fontSize: 12 })
    panelContent.addChild(this.playPauseBtn)
    const soundHeader = controlSection(RainbowDispersionStrings.sectionSoundStringProperty.value, contentW); panelContent.addChild(soundHeader)
    this.soundBtn = new SoftButton(RainbowDispersionStrings.soundOnStringProperty.value, () => { sounds.unlock(); const on = !model.soundEnabledProperty.value; model.soundEnabledProperty.value = on; sounds.toggle(on); if (on) sounds.button(); this.soundBtn.setLabel(on ? RainbowDispersionStrings.soundOnStringProperty.value : RainbowDispersionStrings.soundOffStringProperty.value) }, { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 })
    panelContent.addChild(this.soundBtn)
    const statusHeader = controlSection(RainbowDispersionStrings.sectionStatusStringProperty.value, contentW); panelContent.addChild(statusHeader)
    this.starsText = new Text('', { font: new PhetFont({ size: 15, weight: 'bold' }), fill: '#d97706' }); panelContent.addChild(this.starsText)
    this.statusText = new RichText(model.statusProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: LightColors.panelText, lineWrap: contentW, leading: 3 }); panelContent.addChild(this.statusText)
    panelContent.addChild(createPanelTip(RainbowDispersionStrings.learnMoreStringProperty.value, { width: contentW, fontSize: 11 }))
    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false }); panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      scenarioHeader.left = 0; scenarioHeader.top = py; py = scenarioHeader.bottom + 6
      for (const s of SCENARIOS) { const btn = this.scenarioButtons[s]; btn.left = 0; btn.top = py; py = btn.bottom + gridGap }
      py += 6; conditionsHeader.left = 0; conditionsHeader.top = py; py = conditionsHeader.bottom + 6
      this.runningToggleBtn.left = 0; this.runningToggleBtn.top = py; py = this.runningToggleBtn.bottom + gridGap
      speedSlider.left = 0; speedSlider.top = py; py = speedSlider.bottom + 12
      displayHeader.left = 0; displayHeader.top = py; py = displayHeader.bottom + 6
      this.spectrumBtn.left = 0; this.spectrumBtn.top = py; this.secondaryBtn.left = halfW + 8; this.secondaryBtn.top = py; py = this.spectrumBtn.bottom + 12
      playbackHeader.left = 0; playbackHeader.top = py; py = playbackHeader.bottom + 6
      this.playPauseBtn.left = 0; this.playPauseBtn.top = py; py = this.playPauseBtn.bottom + 12
      soundHeader.left = 0; soundHeader.top = py; py = soundHeader.bottom + 6
      this.soundBtn.left = 0; this.soundBtn.top = py; py = this.soundBtn.bottom + 12
      statusHeader.left = 0; statusHeader.top = py; py = statusHeader.bottom + 6
      this.starsText.left = 0; this.starsText.top = py; py = this.starsText.bottom + 6
      this.statusText.left = 0; this.statusText.top = py; bottomPad.top = this.statusText.bottom + 10
    }
    relayoutPanel()
    const scroller = new ScrollableNode(panelContent, rightW - 24, this.stageH - 72); scroller.left = 12; scroller.top = 12; card.content.addChild(scroller)
    this.addChild(new ResetAllButton({ listener: () => { sounds.resetAll(); model.reset(); this.particles.clear() }, right: lb.right - m, bottom: lb.bottom - my }))

    model.phaseProperty.link(() => this.drawStage())
    model.scenarioProperty.link(() => {
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(model.scenarioProperty.value === s)
      this.guide.setGuidance(RainbowDispersionStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[model.scenarioProperty.value])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[model.scenarioProperty.value], () => { this.leftLearnTip.top = this.teachingTriad.bottom + 16 })
    })
    model.runningProperty.link(() => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(running ? RainbowDispersionStrings.pauseButtonStringProperty.value : RainbowDispersionStrings.playButtonStringProperty.value)
      this.runningToggleBtn.setLabel(running ? RainbowDispersionStrings.runningOnStringProperty.value : RainbowDispersionStrings.runningOffStringProperty.value)
      this.runningToggleBtn.setSelected(running)
    })
    model.showSpectrumProperty.link(() => { this.spectrumBtn.setSelected(model.showSpectrumProperty.value); this.spectrumBtn.setLabel(model.showSpectrumProperty.value ? RainbowDispersionStrings.spectrumOnStringProperty.value : RainbowDispersionStrings.spectrumOffStringProperty.value); this.spectrumLayer.visible = model.showSpectrumProperty.value; this.drawStage() })
    model.showSecondaryProperty.link(() => { this.secondaryBtn.setSelected(model.showSecondaryProperty.value); this.secondaryBtn.setLabel(model.showSecondaryProperty.value ? RainbowDispersionStrings.secondaryOnStringProperty.value : RainbowDispersionStrings.secondaryOffStringProperty.value); this.secondaryLayer.visible = model.showSecondaryProperty.value; this.drawStage() })
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(() => { this.starsText.string = `${RainbowDispersionStrings.starsStringProperty.value} ${model.starsProperty.value}` })
    model.statusProperty.link((status) => { this.statusText.string = status; relayoutPanel() })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.phaseProperty.lazyLink((phase, old) => { if (old !== undefined && phase > old) this.particles.burst(this.stageCenterX + this.stageW * 0.1, this.stageTop + this.stageH * 0.5, { count: 6, color: SPECTRUM[3]!.color, speed: 50, life: 0.35, radius: 2 }) })
    model.starsProperty.lazyLink((stars, old) => { if (old !== undefined && stars > old) sounds.celebrate() })
    this.drawStage()
  }

  private drawStage(): void {
    const phase = this.model.phaseProperty.value
    const w = this.stageW; const h = this.stageH; const ox = this.stageLeft; const oy = this.stageTop
    const drop: Vec2 = { x: ox + w * 0.58, y: oy + h * 0.52 }
    const dropR = Math.min(w, h) * 0.14
    const entry: Vec2 = { x: drop.x - dropR * 0.85, y: drop.y - dropR * 0.2 }
    const exitBase: Vec2 = { x: drop.x + dropR * 0.75, y: drop.y + dropR * 0.35 }
    const lightSrc: Vec2 = { x: ox + w * 0.08, y: oy + h * 0.38 }

    this.stageLayer.removeAllChildren(); this.spectrumLayer.removeAllChildren(); this.secondaryLayer.removeAllChildren(); this.labelsLayer.removeAllChildren()

    this.stageLayer.addChild(new Circle(dropR, { fill: 'rgba(56,189,248,0.35)', stroke: 'rgba(125,211,252,0.8)', lineWidth: 2, centerX: drop.x, centerY: drop.y }))
    this.stageLayer.addChild(new Circle(6, { fill: RAY_WHITE, centerX: lightSrc.x, centerY: lightSrc.y }))
    this.labelsLayer.addChild(makeLabel('Water droplet', drop.x, drop.y + dropR + 22, true))

    if (phase < 0.35) {
      const t = phase / 0.35
      const to = { x: lightSrc.x + (entry.x - lightSrc.x) * t, y: lightSrc.y + (entry.y - lightSrc.y) * t }
      this.stageLayer.addChild(makeRay(lightSrc, normalize({ x: to.x - lightSrc.x, y: to.y - lightSrc.y }), Math.hypot(to.x - lightSrc.x, to.y - lightSrc.y), RAY_WHITE, 3))
      this.captionText.string = 'White light enters the droplet'
    } else if (phase < 0.55) {
      this.stageLayer.addChild(makeRay(lightSrc, normalize({ x: entry.x - lightSrc.x, y: entry.y - lightSrc.y }), Math.hypot(entry.x - lightSrc.x, entry.y - lightSrc.y), RAY_WHITE, 3))
      const t = (phase - 0.35) / 0.2
      SPECTRUM.forEach((band, i) => {
        const spread = (i - 3) * 0.04
        const internalEnd = { x: drop.x + dropR * 0.3 * Math.cos(spread), y: drop.y + dropR * 0.3 * Math.sin(spread) }
        const pt = { x: entry.x + (internalEnd.x - entry.x) * t, y: entry.y + (internalEnd.y - entry.y) * t }
        this.spectrumLayer.addChild(makeRay(entry, normalize({ x: pt.x - entry.x, y: pt.y - entry.y }), Math.hypot(pt.x - entry.x, pt.y - entry.y), band.color, 2))
      })
      this.captionText.string = 'Dispersion inside the droplet'
    } else {
      this.stageLayer.addChild(makeRay(lightSrc, normalize({ x: entry.x - lightSrc.x, y: entry.y - lightSrc.y }), Math.hypot(entry.x - lightSrc.x, entry.y - lightSrc.y), RAY_WHITE, 2))
      const t = Math.min(1, (phase - 0.55) / 0.45)
      SPECTRUM.forEach((band, i) => {
        const spread = (i - 3) * 0.12
        const dir = normalize({ x: Math.cos(-0.35 + spread), y: Math.sin(0.55 + spread * 0.5) })
        this.spectrumLayer.addChild(makeRay(exitBase, dir, w * 0.38 * t, band.color, 2.5))
      })
      this.captionText.string = 'Spectrum exits — rainbow forms'
    }

    if (phase >= 1 && this.model.showSecondaryProperty.value) {
      const arcX = ox + w * 0.72; const arcY = oy + h * 0.88; const arcR = w * 0.28
      const arcShape = new Shape().arc(arcX, arcY, arcR, Math.PI, 0, false)
      this.secondaryLayer.addChild(new Path(arcShape, { stroke: SPECTRUM[0]!.color, lineWidth: 10, opacity: 0.35 }))
      this.labelsLayer.addChild(makeLabel('Rainbow arc', arcX, arcY - arcR - 16, true))
    }

    this.captionText.centerX = this.stageCenterX
  }

  private showTipCard(text: string): void { this.tipBodyText.string = text; this.tipCard.visible = true; this.tipCard.opacity = 1; this.tipTimer = 4.4 }
  private showQuiz(): void {
    this.miniQuiz.showQuiz(RainbowDispersionStrings.quizQuestionStringProperty.value, [
      { label: RainbowDispersionStrings.quizCorrectStringProperty.value, correct: true },
      { label: RainbowDispersionStrings.quizWrongStringProperty.value, correct: false },
    ], (correct) => { correct ? this.sounds.correct() : this.sounds.wrong(); this.model.onQuiz(correct) })
  }
  public override step(dt: number): void {
    this.model.step(dt); this.particles.step(dt)
    if (this.tipTimer > 0) { this.tipTimer -= dt; if (this.tipTimer < 0.6) this.tipCard.opacity = Math.max(0, this.tipTimer / 0.6); if (this.tipTimer <= 0) this.tipCard.visible = false }
  }
}
