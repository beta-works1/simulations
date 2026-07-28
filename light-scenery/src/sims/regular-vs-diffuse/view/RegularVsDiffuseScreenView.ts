import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { RegularVsDiffuseModel, RegularScenario } from '../model/RegularVsDiffuseModel.js'
import type { SurfaceType } from '../../../shared/regularVsDiffuseModel.js'
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
import { RegularVsDiffuseStrings } from '../RegularVsDiffuseStrings.js'
import {
  DEG2RAD,
  makeLabel,
  makeLightSource,
  makeRay,
  MIRROR_COLOR,
  normalize,
  RAY_CYAN,
  RAY_YELLOW,
  seededScatter,
  type Vec2,
} from '../../../shared/opticsDraw.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SCENARIOS: readonly RegularScenario[] = ['explore', 'regularDemo', 'diffuseDemo']
const SURFACES: readonly SurfaceType[] = ['regular', 'diffuse']

const SCENARIO_GUIDE: Record<RegularScenario, string> = {
  explore: RegularVsDiffuseStrings.guideExploreStringProperty.value,
  regularDemo: RegularVsDiffuseStrings.guideRegularStringProperty.value,
  diffuseDemo: RegularVsDiffuseStrings.guideDiffuseStringProperty.value,
}

const SCENARIO_TRIAD: Record<RegularScenario, [string, string, string]> = {
  explore: [
    'Comparing surface types.',
    'Smooth surfaces give regular (specular) reflection — parallel rays stay parallel.',
    'Try Diffuse demo to see scattered rays.',
  ],
  regularDemo: [
    'Regular reflection.',
    'Polished mirrors reflect evenly — you get a clear image.',
    'Switch to Diffuse to see the difference.',
  ],
  diffuseDemo: [
    'Diffuse reflection.',
    'Rough surfaces scatter light in many directions — no sharp image forms.',
    'Return to Explore to adjust ray count and angle.',
  ],
}

export class RegularVsDiffuseScreenView extends ScreenView {
  private readonly model: RegularVsDiffuseModel
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
  private readonly raysLayer: Node
  private readonly captionText: Text
  private readonly titleText: Text
  private readonly scenarioButtons: Record<RegularScenario, SoftButton>
  private readonly surfaceButtons: Record<SurfaceType, SoftButton>
  private readonly runningToggleBtn: SoftButton
  private readonly labelsBtn: SoftButton
  private readonly raysBtn: SoftButton
  private readonly playPauseBtn: SoftButton
  private readonly soundBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: RichText

  public constructor(model: RegularVsDiffuseModel, providedOptions?: Options) {
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
      title: RegularVsDiffuseStrings.guideTitleStringProperty.value,
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
    this.leftLearnTip = createPanelTip(RegularVsDiffuseStrings.learnMoreStringProperty.value, {
      width: leftW - 24, fontSize: 11, fill: LightColors.panelMuted,
    })
    this.leftLearnTip.left = 12
    this.leftLearnTip.top = this.teachingTriad.bottom + 16
    leftCard.content.addChild(this.leftLearnTip)

    this.addChild(new StageBackdrop(this.stageLeft, this.stageTop, this.stageW, this.stageH, { top: '#c7d2e0', bottom: '#eef2f7' }))
    this.titleText = new Text(RegularVsDiffuseStrings.stageTitleStringProperty.value, {
      font: new PhetFont({ size: 18, weight: 'bold' }), fill: '#0f172a', centerX: this.stageCenterX, top: this.stageTop + 10,
    })
    this.addChild(this.titleText)
    this.captionText = new Text('', {
      font: new PhetFont({ size: 14, weight: 'bold' }), fill: LightColors.accent, centerX: this.stageCenterX, top: this.titleText.bottom + 4,
    })
    this.addChild(this.captionText)
    this.stageLayer = new Node({ pickable: false })
    this.raysLayer = new Node({ pickable: false })
    this.labelsLayer = new Node({ pickable: false })
    this.addChild(this.stageLayer)
    this.addChild(this.raysLayer)
    this.addChild(this.labelsLayer)
    this.particles = new ParticleBurst(70)
    this.addChild(this.particles)

    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = this.stageCenterX
    this.tipCard.top = this.stageTop + 12
    this.tipCard.visible = false
    this.tipCard.content.addChild(new Text(RegularVsDiffuseStrings.tipTitleStringProperty.value, {
      font: new PhetFont({ size: 12, weight: 'bold' }), fill: LightColors.accent, left: 14, top: 10,
    }))
    this.tipBodyText = new RichText('', { font: new PhetFont(12), fill: LightColors.ink, lineWrap: 222, leading: 3, left: 14, top: 30, maxWidth: 222 })
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

    const surfaceHeader = controlSection(RegularVsDiffuseStrings.sectionSurfaceStringProperty.value, contentW)
    panelContent.addChild(surfaceHeader)
    this.surfaceButtons = {} as Record<SurfaceType, SoftButton>
    for (const surface of SURFACES) {
      const btn = new SoftButton(
        surface === 'regular' ? RegularVsDiffuseStrings.surfaceRegularStringProperty.value : RegularVsDiffuseStrings.surfaceDiffuseStringProperty.value,
        () => { model.setSurface(surface); sounds.modeChange(surface === 'diffuse') },
        { width: halfW, height: btnH, fill: surface === 'regular' ? '#64748b' : '#475569', selected: surface === 'regular', fontSize: 11 },
      )
      this.surfaceButtons[surface] = btn
      panelContent.addChild(btn)
    }

    const scenarioHeader = controlSection(RegularVsDiffuseStrings.sectionScenarioStringProperty.value, contentW)
    panelContent.addChild(scenarioHeader)
    this.scenarioButtons = {} as Record<RegularScenario, SoftButton>
    const scenarioLabels: Record<RegularScenario, string> = {
      explore: RegularVsDiffuseStrings.scenarioExploreStringProperty.value,
      regularDemo: RegularVsDiffuseStrings.scenarioRegularStringProperty.value,
      diffuseDemo: RegularVsDiffuseStrings.scenarioDiffuseStringProperty.value,
    }
    for (const scenario of SCENARIOS) {
      const btn = new SoftButton(scenarioLabels[scenario], () => model.setScenario(scenario), {
        width: contentW, height: btnH, fill: scenario === 'explore' ? LightColors.accent : '#64748b', selected: scenario === 'explore', fontSize: 12, onSound: () => sounds.scenario(),
      })
      this.scenarioButtons[scenario] = btn
      panelContent.addChild(btn)
    }

    const conditionsHeader = controlSection(RegularVsDiffuseStrings.sectionConditionsStringProperty.value, contentW)
    panelContent.addChild(conditionsHeader)
    this.runningToggleBtn = new SoftButton(RegularVsDiffuseStrings.runningOnStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: btnH, fill: LightColors.accent, fontSize: 12, selected: true })
    panelContent.addChild(this.runningToggleBtn)
    const rayCountSlider = new DepthSlider(model.rayCountProperty, { min: 3, max: 11, width: contentW, label: RegularVsDiffuseStrings.rayCountSliderStringProperty.value, format: (n) => `${n.toFixed(0)}`, fill: RAY_YELLOW, onTick: () => sounds.sliderTick() })
    panelContent.addChild(rayCountSlider)
    const incidenceSlider = new DepthSlider(model.incidenceDegProperty, { min: -50, max: 50, width: contentW, label: RegularVsDiffuseStrings.incidenceSliderStringProperty.value, format: (n) => `${n.toFixed(0)}°`, fill: LightColors.accent, onTick: () => sounds.sliderTick() })
    panelContent.addChild(incidenceSlider)
    const conditionsHint = controlHint(RegularVsDiffuseStrings.conditionsHintStringProperty.value, contentW)
    panelContent.addChild(conditionsHint)

    const displayHeader = controlSection(RegularVsDiffuseStrings.sectionDisplayStringProperty.value, contentW)
    panelContent.addChild(displayHeader)
    this.labelsBtn = new SoftButton(RegularVsDiffuseStrings.labelsOnStringProperty.value, () => { sounds.softClick(); model.showLabelsProperty.value = !model.showLabelsProperty.value }, { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true })
    this.raysBtn = new SoftButton(RegularVsDiffuseStrings.raysOnStringProperty.value, () => { sounds.softClick(); model.showRaysProperty.value = !model.showRaysProperty.value }, { width: halfW, height: btnH, fill: '#0ea5e9', fontSize: 10, selected: true })
    panelContent.addChild(this.labelsBtn)
    panelContent.addChild(this.raysBtn)

    const playbackHeader = controlSection(RegularVsDiffuseStrings.sectionPlaybackStringProperty.value, contentW)
    panelContent.addChild(playbackHeader)
    this.playPauseBtn = new SoftButton(RegularVsDiffuseStrings.playButtonStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: 38, fill: LightColors.accent, fontSize: 12 })
    panelContent.addChild(this.playPauseBtn)

    const soundHeader = controlSection(RegularVsDiffuseStrings.sectionSoundStringProperty.value, contentW)
    panelContent.addChild(soundHeader)
    this.soundBtn = new SoftButton(RegularVsDiffuseStrings.soundOnStringProperty.value, () => {
      sounds.unlock(); const on = !model.soundEnabledProperty.value; model.soundEnabledProperty.value = on; sounds.toggle(on); if (on) sounds.button()
      this.soundBtn.setLabel(on ? RegularVsDiffuseStrings.soundOnStringProperty.value : RegularVsDiffuseStrings.soundOffStringProperty.value)
    }, { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 })
    panelContent.addChild(this.soundBtn)

    const statusHeader = controlSection(RegularVsDiffuseStrings.sectionStatusStringProperty.value, contentW)
    panelContent.addChild(statusHeader)
    this.starsText = new Text('', { font: new PhetFont({ size: 15, weight: 'bold' }), fill: '#d97706' })
    panelContent.addChild(this.starsText)
    this.statusText = new RichText(model.statusProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: LightColors.panelText, lineWrap: contentW, leading: 3 })
    panelContent.addChild(this.statusText)
    const learnTip = createPanelTip(RegularVsDiffuseStrings.learnMoreStringProperty.value, { width: contentW, fontSize: 11 })
    panelContent.addChild(learnTip)
    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false })
    panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      surfaceHeader.left = 0; surfaceHeader.top = py; py = surfaceHeader.bottom + 6
      this.surfaceButtons.regular.left = 0; this.surfaceButtons.regular.top = py
      this.surfaceButtons.diffuse.left = halfW + 8; this.surfaceButtons.diffuse.top = py; py = this.surfaceButtons.regular.bottom + 12
      scenarioHeader.left = 0; scenarioHeader.top = py; py = scenarioHeader.bottom + 6
      for (const s of SCENARIOS) { const btn = this.scenarioButtons[s]; btn.left = 0; btn.top = py; py = btn.bottom + gridGap }
      py += 6
      conditionsHeader.left = 0; conditionsHeader.top = py; py = conditionsHeader.bottom + 6
      this.runningToggleBtn.left = 0; this.runningToggleBtn.top = py; py = this.runningToggleBtn.bottom + gridGap
      rayCountSlider.left = 0; rayCountSlider.top = py; py = rayCountSlider.bottom + gridGap
      incidenceSlider.left = 0; incidenceSlider.top = py; py = incidenceSlider.bottom + 4
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
      learnTip.left = 0; learnTip.top = py; py = learnTip.bottom + 4; bottomPad.top = py
    }
    relayoutPanel()
    const scroller = new ScrollableNode(panelContent, rightW - 24, this.stageH - 72)
    scroller.left = 12; scroller.top = 12; card.content.addChild(scroller)

    this.addChild(new ResetAllButton({ listener: () => { sounds.resetAll(); model.reset(); this.particles.clear() }, right: lb.right - m, bottom: lb.bottom - my }))

    const syncStars = () => { this.starsText.string = `${RegularVsDiffuseStrings.starsStringProperty.value} ${model.starsProperty.value}` }
    const syncPlayPause = () => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(running ? RegularVsDiffuseStrings.pauseButtonStringProperty.value : RegularVsDiffuseStrings.playButtonStringProperty.value)
      this.runningToggleBtn.setLabel(running ? RegularVsDiffuseStrings.runningOnStringProperty.value : RegularVsDiffuseStrings.runningOffStringProperty.value)
      this.runningToggleBtn.setSelected(running)
    }
    const syncSurface = () => {
      for (const s of SURFACES) this.surfaceButtons[s].setSelected(model.surfaceProperty.value === s)
      this.drawStage()
    }
    const syncScenario = () => {
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(model.scenarioProperty.value === s)
      this.guide.setGuidance(RegularVsDiffuseStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[model.scenarioProperty.value])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[model.scenarioProperty.value], () => { this.leftLearnTip.top = this.teachingTriad.bottom + 16 })
    }
    const syncLabels = () => {
      this.labelsBtn.setSelected(model.showLabelsProperty.value)
      this.labelsBtn.setLabel(model.showLabelsProperty.value ? RegularVsDiffuseStrings.labelsOnStringProperty.value : RegularVsDiffuseStrings.labelsOffStringProperty.value)
      this.labelsLayer.visible = model.showLabelsProperty.value
    }
    const syncRays = () => {
      this.raysBtn.setSelected(model.showRaysProperty.value)
      this.raysBtn.setLabel(model.showRaysProperty.value ? RegularVsDiffuseStrings.raysOnStringProperty.value : RegularVsDiffuseStrings.raysOffStringProperty.value)
      this.raysLayer.visible = model.showRaysProperty.value
    }

    model.surfaceProperty.link(syncSurface)
    model.rayCountProperty.link(() => this.drawStage())
    model.incidenceDegProperty.link(() => this.drawStage())
    model.scenarioProperty.link(syncScenario)
    model.runningProperty.link(syncPlayPause)
    model.showLabelsProperty.link(syncLabels)
    model.showRaysProperty.link(syncRays)
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(syncStars)
    model.statusProperty.link((status) => { this.statusText.string = status; relayoutPanel() })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.surfaceProperty.lazyLink(() => this.particles.burst(this.stageCenterX, this.stageTop + this.stageH * 0.68, { count: 16, color: RAY_CYAN, speed: 80, life: 0.5, radius: 2.8 }))
    model.starsProperty.lazyLink((stars, old) => { if (old !== undefined && stars > old) sounds.celebrate() })

    syncStars(); syncPlayPause(); syncSurface(); syncScenario(); syncLabels(); syncRays()
  }

  private drawStage(): void {
    const state = this.model.state
    const w = this.stageW; const h = this.stageH; const ox = this.stageLeft; const oy = this.stageTop
    const surfaceY = oy + h * 0.68
    const surfaceX1 = ox + w * 0.1; const surfaceX2 = ox + w * 0.9
    const rayLen = h * 0.38
    const spacing = (surfaceX2 - surfaceX1) / (state.rayCount + 1)
    const isSmooth = state.surface === 'regular'

    this.stageLayer.removeAllChildren(); this.raysLayer.removeAllChildren(); this.labelsLayer.removeAllChildren()

    if (isSmooth) {
      this.stageLayer.addChild(new Rectangle(surfaceX1, surfaceY, surfaceX2 - surfaceX1, oy + h - surfaceY, { fill: 'rgba(148,163,184,0.25)' }))
      this.stageLayer.addChild(new Path(new Shape().moveTo(surfaceX1, surfaceY).lineTo(surfaceX2, surfaceY), { stroke: MIRROR_COLOR, lineWidth: 3, lineCap: 'round' }))
    } else {
      this.stageLayer.addChild(new Rectangle(surfaceX1, surfaceY, surfaceX2 - surfaceX1, oy + h - surfaceY, { fill: 'rgba(71,85,105,0.38)' }))
      const bumpShape = new Shape()
      for (let x = surfaceX1; x <= surfaceX2; x += 6) {
        const bump = Math.sin(x * 0.08) * 4 + Math.sin(x * 0.23) * 2
        if (x === surfaceX1) bumpShape.moveTo(x, surfaceY + bump)
        else bumpShape.lineTo(x, surfaceY + bump)
      }
      this.stageLayer.addChild(new Path(bumpShape, { stroke: '#94a3b8', lineWidth: 2, lineCap: 'round' }))
    }

    const theta = state.incidenceDeg * DEG2RAD
    const incidentDir = normalize({ x: Math.sin(theta), y: Math.cos(theta) })
    for (let i = 0; i < state.rayCount; i++) {
      const hitX = surfaceX1 + spacing * (i + 1)
      const hit: Vec2 = { x: hitX, y: surfaceY }
      const incidentFrom: Vec2 = { x: hitX - incidentDir.x * rayLen, y: surfaceY - incidentDir.y * rayLen }
      this.raysLayer.addChild(makeLightSource(incidentFrom.x, incidentFrom.y))
      this.raysLayer.addChild(makeRay(incidentFrom, incidentDir, rayLen, RAY_YELLOW, 2))
      const outAngle = theta + seededScatter(i, !isSmooth)
      const reflectDir = normalize({ x: Math.sin(outAngle), y: -Math.cos(outAngle) })
      this.raysLayer.addChild(makeRay(hit, reflectDir, rayLen * 0.85, RAY_CYAN, 2))
    }

    this.captionText.string = isSmooth ? 'Regular — parallel reflected rays stay parallel' : 'Diffuse — rays scatter in many directions'
    this.captionText.centerX = this.stageCenterX
    this.labelsLayer.addChild(makeLabel(isSmooth ? 'Smooth surface' : 'Rough surface', ox + w * 0.5, surfaceY + 28, true))
  }

  private showTipCard(text: string): void { this.tipBodyText.string = text; this.tipCard.visible = true; this.tipCard.opacity = 1; this.tipTimer = 4.4 }
  private showQuiz(): void {
    this.miniQuiz.showQuiz(RegularVsDiffuseStrings.quizQuestionStringProperty.value, [
      { label: RegularVsDiffuseStrings.quizCorrectStringProperty.value, correct: true },
      { label: RegularVsDiffuseStrings.quizWrongStringProperty.value, correct: false },
    ], (correct) => { correct ? this.sounds.correct() : this.sounds.wrong(); this.model.onQuiz(correct) })
  }
  public override step(dt: number): void {
    this.model.step(dt); this.particles.step(dt)
    if (this.tipTimer > 0) { this.tipTimer -= dt; if (this.tipTimer < 0.6) this.tipCard.opacity = Math.max(0, this.tipTimer / 0.6); if (this.tipTimer <= 0) this.tipCard.visible = false }
  }
}
