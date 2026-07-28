import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { RefractionMediaModel, RefractionScenario } from '../model/RefractionMediaModel.js'
import { computeRefraction, MEDIA, N_AIR } from '../../../shared/refractionMediaModel.js'
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
import { RefractionMediaStrings } from '../RefractionMediaStrings.js'
import {
  DEG2RAD,
  makeAngleArc,
  makeDashedLine,
  makeLabel,
  makeLightSource,
  makeRay,
  MUTED,
  normalize,
  RAY_CYAN,
  RAY_WHITE,
  RAY_YELLOW,
  type Vec2,
} from '../../../shared/opticsDraw.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SCENARIOS: readonly RefractionScenario[] = ['explore', 'water', 'glass', 'diamond']

const SCENARIO_GUIDE: Record<RefractionScenario, string> = {
  explore: RefractionMediaStrings.guideExploreStringProperty.value,
  water: RefractionMediaStrings.guideWaterStringProperty.value,
  glass: RefractionMediaStrings.guideWaterStringProperty.value,
  diamond: RefractionMediaStrings.guideDiamondStringProperty.value,
}

const SCENARIO_TRIAD: Record<RefractionScenario, [string, string, string]> = {
  explore: ['Exploring refraction.', 'At an air–medium boundary, light bends according to Snell\'s law.', 'Try Diamond for strong bending.'],
  water: ['Water medium.', 'Light slows in water and bends toward the normal.', 'Compare with Glass or Diamond.'],
  glass: ['Glass medium.', 'Higher index than water — more bending toward the normal.', 'Increase incidence to see the effect.'],
  diamond: ['Diamond medium.', 'Very high index — rays bend sharply; watch for total internal reflection.', 'Return to Explore to compare all media.'],
}

export class RefractionMediaScreenView extends ScreenView {
  private readonly model: RefractionMediaModel
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
  private readonly normalLayer: Node
  private readonly anglesLayer: Node
  private readonly raysLayer: Node
  private readonly labelsLayer: Node
  private readonly captionText: Text
  private readonly titleText: Text
  private readonly scenarioButtons: Record<RefractionScenario, SoftButton>
  private readonly mediumButtons: Record<string, SoftButton>
  private readonly runningToggleBtn: SoftButton
  private readonly labelsBtn: SoftButton
  private readonly normalBtn: SoftButton
  private readonly anglesBtn: SoftButton
  private readonly playPauseBtn: SoftButton
  private readonly soundBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: RichText

  public constructor(model: RefractionMediaModel, providedOptions?: Options) {
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

    this.guide = new GuidanceBanner(lb.width - m * 2, { title: RefractionMediaStrings.guideTitleStringProperty.value, body: SCENARIO_GUIDE.explore })
    this.guide.left = m; this.guide.top = my; this.addChild(this.guide)

    const leftCard = new DepthCard(leftW, this.stageH, { variant: 'light' })
    leftCard.left = m; leftCard.top = this.stageTop; this.addChild(leftCard)
    this.teachingTriad = new TeachingTriad(leftW - 24); this.teachingTriad.left = 12; this.teachingTriad.top = 12; leftCard.content.addChild(this.teachingTriad)
    this.leftLearnTip = createPanelTip(RefractionMediaStrings.learnMoreStringProperty.value, { width: leftW - 24, fontSize: 11, fill: LightColors.panelMuted })
    this.leftLearnTip.left = 12; this.leftLearnTip.top = this.teachingTriad.bottom + 16; leftCard.content.addChild(this.leftLearnTip)

    this.addChild(new StageBackdrop(this.stageLeft, this.stageTop, this.stageW, this.stageH, { top: '#c7d2e0', bottom: '#eef2f7' }))
    this.titleText = new Text(RefractionMediaStrings.stageTitleStringProperty.value, { font: new PhetFont({ size: 18, weight: 'bold' }), fill: '#0f172a', centerX: this.stageCenterX, top: this.stageTop + 10 })
    this.addChild(this.titleText)
    this.captionText = new Text('', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: LightColors.accent, centerX: this.stageCenterX, top: this.titleText.bottom + 4 })
    this.addChild(this.captionText)
    this.stageLayer = new Node({ pickable: false }); this.normalLayer = new Node({ pickable: false })
    this.anglesLayer = new Node({ pickable: false }); this.raysLayer = new Node({ pickable: false }); this.labelsLayer = new Node({ pickable: false })
    this.addChild(this.stageLayer); this.addChild(this.normalLayer); this.addChild(this.anglesLayer); this.addChild(this.raysLayer); this.addChild(this.labelsLayer)
    this.particles = new ParticleBurst(70); this.addChild(this.particles)

    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = this.stageCenterX; this.tipCard.top = this.stageTop + 12; this.tipCard.visible = false
    this.tipCard.content.addChild(new Text(RefractionMediaStrings.tipTitleStringProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: LightColors.accent, left: 14, top: 10 }))
    this.tipBodyText = new RichText('', { font: new PhetFont(12), fill: LightColors.ink, lineWrap: 222, leading: 3, left: 14, top: 30, maxWidth: 222 })
    this.tipCard.content.addChild(this.tipBodyText); this.addChild(this.tipCard)
    this.miniQuiz = new MiniQuiz(260); this.miniQuiz.centerX = this.stageCenterX; this.miniQuiz.centerY = this.stageTop + this.stageH * 0.5; this.addChild(this.miniQuiz)

    const card = new DepthCard(rightW, this.stageH); card.left = this.stageLeft + this.stageW + gap; card.top = this.stageTop; this.addChild(card)
    const panelContent = new Node(); const contentW = rightW - 42; const thirdW = (contentW - 12) / 3; const halfW = (contentW - 8) / 2; const btnH = 32; const gridGap = 6

    const mediumHeader = controlSection(RefractionMediaStrings.sectionMediumStringProperty.value, contentW); panelContent.addChild(mediumHeader)
    this.mediumButtons = {}
    const mediumLabels: Record<string, string> = { water: RefractionMediaStrings.mediumWaterStringProperty.value, glass: RefractionMediaStrings.mediumGlassStringProperty.value, diamond: RefractionMediaStrings.mediumDiamondStringProperty.value }
    MEDIA.forEach((med) => {
      const btn = new SoftButton(mediumLabels[med.id] ?? med.label, () => { model.setMedium(med.id); sounds.select() }, { width: thirdW, height: btnH, fill: med.id === 'water' ? LightColors.accent : '#64748b', selected: med.id === 'water', fontSize: 10 })
      this.mediumButtons[med.id] = btn
      panelContent.addChild(btn)
    })

    const scenarioHeader = controlSection(RefractionMediaStrings.sectionScenarioStringProperty.value, contentW); panelContent.addChild(scenarioHeader)
    this.scenarioButtons = {} as Record<RefractionScenario, SoftButton>
    const scenarioLabels: Record<RefractionScenario, string> = { explore: RefractionMediaStrings.scenarioExploreStringProperty.value, water: RefractionMediaStrings.scenarioWaterStringProperty.value, glass: RefractionMediaStrings.scenarioGlassStringProperty.value, diamond: RefractionMediaStrings.scenarioDiamondStringProperty.value }
    for (const scenario of SCENARIOS) {
      const btn = new SoftButton(scenarioLabels[scenario], () => model.setScenario(scenario), { width: contentW, height: btnH, fill: scenario === 'explore' ? LightColors.accent : '#64748b', selected: scenario === 'explore', fontSize: 12, onSound: () => sounds.scenario() })
      this.scenarioButtons[scenario] = btn; panelContent.addChild(btn)
    }

    const conditionsHeader = controlSection(RefractionMediaStrings.sectionConditionsStringProperty.value, contentW); panelContent.addChild(conditionsHeader)
    this.runningToggleBtn = new SoftButton(RefractionMediaStrings.runningOnStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: btnH, fill: LightColors.accent, fontSize: 12, selected: true })
    panelContent.addChild(this.runningToggleBtn)
    const incidenceSlider = new DepthSlider(model.incidenceDegProperty, { min: 0, max: 85, width: contentW, label: RefractionMediaStrings.incidenceSliderStringProperty.value, format: (n) => `${n.toFixed(0)}°`, fill: RAY_YELLOW, onTick: () => sounds.sliderTick() })
    panelContent.addChild(incidenceSlider)
    panelContent.addChild(controlHint(RefractionMediaStrings.conditionsHintStringProperty.value, contentW))

    const displayHeader = controlSection(RefractionMediaStrings.sectionDisplayStringProperty.value, contentW); panelContent.addChild(displayHeader)
    this.labelsBtn = new SoftButton(RefractionMediaStrings.labelsOnStringProperty.value, () => { sounds.softClick(); model.showLabelsProperty.value = !model.showLabelsProperty.value }, { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true })
    this.normalBtn = new SoftButton(RefractionMediaStrings.normalOnStringProperty.value, () => { sounds.softClick(); model.showNormalProperty.value = !model.showNormalProperty.value }, { width: halfW, height: btnH, fill: '#f59e0b', fontSize: 10, selected: true })
    this.anglesBtn = new SoftButton(RefractionMediaStrings.anglesOnStringProperty.value, () => { sounds.softClick(); model.showAnglesProperty.value = !model.showAnglesProperty.value }, { width: contentW, height: btnH, fill: '#0ea5e9', fontSize: 12, selected: true })
    panelContent.addChild(this.labelsBtn); panelContent.addChild(this.normalBtn); panelContent.addChild(this.anglesBtn)

    const playbackHeader = controlSection(RefractionMediaStrings.sectionPlaybackStringProperty.value, contentW); panelContent.addChild(playbackHeader)
    this.playPauseBtn = new SoftButton(RefractionMediaStrings.playButtonStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: 38, fill: LightColors.accent, fontSize: 12 })
    panelContent.addChild(this.playPauseBtn)
    const soundHeader = controlSection(RefractionMediaStrings.sectionSoundStringProperty.value, contentW); panelContent.addChild(soundHeader)
    this.soundBtn = new SoftButton(RefractionMediaStrings.soundOnStringProperty.value, () => { sounds.unlock(); const on = !model.soundEnabledProperty.value; model.soundEnabledProperty.value = on; sounds.toggle(on); if (on) sounds.button(); this.soundBtn.setLabel(on ? RefractionMediaStrings.soundOnStringProperty.value : RefractionMediaStrings.soundOffStringProperty.value) }, { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 })
    panelContent.addChild(this.soundBtn)
    const statusHeader = controlSection(RefractionMediaStrings.sectionStatusStringProperty.value, contentW); panelContent.addChild(statusHeader)
    this.starsText = new Text('', { font: new PhetFont({ size: 15, weight: 'bold' }), fill: '#d97706' }); panelContent.addChild(this.starsText)
    this.statusText = new RichText(model.statusProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: LightColors.panelText, lineWrap: contentW, leading: 3 }); panelContent.addChild(this.statusText)
    panelContent.addChild(createPanelTip(RefractionMediaStrings.learnMoreStringProperty.value, { width: contentW, fontSize: 11 }))
    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false }); panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      mediumHeader.left = 0; mediumHeader.top = py; py = mediumHeader.bottom + 6
      MEDIA.forEach((med, i) => { const btn = this.mediumButtons[med.id]!; btn.left = i * (thirdW + 6); btn.top = py })
      py = mediumHeader.bottom + 6 + btnH + 12
      scenarioHeader.left = 0; scenarioHeader.top = py; py = scenarioHeader.bottom + 6
      for (const s of SCENARIOS) { const btn = this.scenarioButtons[s]; btn.left = 0; btn.top = py; py = btn.bottom + gridGap }
      py += 6; conditionsHeader.left = 0; conditionsHeader.top = py; py = conditionsHeader.bottom + 6
      this.runningToggleBtn.left = 0; this.runningToggleBtn.top = py; py = this.runningToggleBtn.bottom + gridGap
      incidenceSlider.left = 0; incidenceSlider.top = py; py = incidenceSlider.bottom + 12
      displayHeader.left = 0; displayHeader.top = py; py = displayHeader.bottom + 6
      this.labelsBtn.left = 0; this.labelsBtn.top = py; this.normalBtn.left = halfW + 8; this.normalBtn.top = py; py = this.labelsBtn.bottom + gridGap
      this.anglesBtn.left = 0; this.anglesBtn.top = py; py = this.anglesBtn.bottom + 12
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

    const syncStage = () => this.drawStage()
    model.mediumIdProperty.link(() => { MEDIA.forEach((med) => this.mediumButtons[med.id]?.setSelected(model.mediumIdProperty.value === med.id)); syncStage() })
    model.incidenceDegProperty.link(syncStage)
    model.scenarioProperty.link(() => {
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(model.scenarioProperty.value === s)
      this.guide.setGuidance(RefractionMediaStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[model.scenarioProperty.value])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[model.scenarioProperty.value], () => { this.leftLearnTip.top = this.teachingTriad.bottom + 16 })
      syncStage()
    })
    model.runningProperty.link(() => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(running ? RefractionMediaStrings.pauseButtonStringProperty.value : RefractionMediaStrings.playButtonStringProperty.value)
      this.runningToggleBtn.setLabel(running ? RefractionMediaStrings.runningOnStringProperty.value : RefractionMediaStrings.runningOffStringProperty.value)
      this.runningToggleBtn.setSelected(running)
    })
    model.showLabelsProperty.link(() => { this.labelsBtn.setSelected(model.showLabelsProperty.value); this.labelsBtn.setLabel(model.showLabelsProperty.value ? RefractionMediaStrings.labelsOnStringProperty.value : RefractionMediaStrings.labelsOffStringProperty.value); this.labelsLayer.visible = model.showLabelsProperty.value })
    model.showNormalProperty.link(() => { this.normalBtn.setSelected(model.showNormalProperty.value); this.normalBtn.setLabel(model.showNormalProperty.value ? RefractionMediaStrings.normalOnStringProperty.value : RefractionMediaStrings.normalOffStringProperty.value); this.normalLayer.visible = model.showNormalProperty.value })
    model.showAnglesProperty.link(() => { this.anglesBtn.setSelected(model.showAnglesProperty.value); this.anglesBtn.setLabel(model.showAnglesProperty.value ? RefractionMediaStrings.anglesOnStringProperty.value : RefractionMediaStrings.anglesOffStringProperty.value); this.anglesLayer.visible = model.showAnglesProperty.value })
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(() => { this.starsText.string = `${RefractionMediaStrings.starsStringProperty.value} ${model.starsProperty.value}` })
    model.statusProperty.link((status) => { this.statusText.string = status; relayoutPanel() })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.starsProperty.lazyLink((stars, old) => { if (old !== undefined && stars > old) sounds.celebrate() })
    syncStage()
  }

  private drawStage(): void {
    const state = this.model.state
    const { medium, refractedDeg } = computeRefraction(state)
    const w = this.stageW; const h = this.stageH; const ox = this.stageLeft; const oy = this.stageTop
    const boundaryY = oy + h * 0.55
    const hit: Vec2 = { x: ox + w * 0.5, y: boundaryY }
    const rayLen = Math.min(w, h) * 0.45

    this.stageLayer.removeAllChildren(); this.normalLayer.removeAllChildren(); this.anglesLayer.removeAllChildren(); this.raysLayer.removeAllChildren(); this.labelsLayer.removeAllChildren()

    this.stageLayer.addChild(new Rectangle(ox, oy, w, boundaryY - oy, { fill: 'rgba(15,23,42,0.5)' }))
    this.stageLayer.addChild(new Rectangle(ox, boundaryY, w, oy + h - boundaryY, { fill: medium.color }))
    this.stageLayer.addChild(new Path(new Shape().moveTo(ox, boundaryY).lineTo(ox + w, boundaryY), { stroke: MUTED, lineWidth: 2 }))

    const iRad = state.incidenceDeg * DEG2RAD
    const incidentDir = normalize({ x: -Math.sin(iRad), y: -Math.cos(iRad) })
    const incidentStart: Vec2 = { x: hit.x - incidentDir.x * rayLen, y: hit.y - incidentDir.y * rayLen }
    this.raysLayer.addChild(makeLightSource(incidentStart.x, incidentStart.y))
    this.raysLayer.addChild(makeRay(incidentStart, incidentDir, rayLen, RAY_YELLOW))

    const normalTop: Vec2 = { x: hit.x, y: hit.y - rayLen * 0.5 }
    const normalBottom: Vec2 = { x: hit.x, y: hit.y + rayLen * 0.45 }
    this.normalLayer.addChild(makeDashedLine(hit, normalTop, RAY_WHITE))
    this.normalLayer.addChild(makeDashedLine(hit, normalBottom, RAY_WHITE))
    this.anglesLayer.addChild(makeAngleArc(hit, -Math.PI / 2 - iRad, -Math.PI / 2, 34, `∠i = ${state.incidenceDeg}°`, RAY_YELLOW))

    if (refractedDeg !== null) {
      const rRad = refractedDeg * DEG2RAD
      const refractedDir = normalize({ x: Math.sin(rRad), y: Math.cos(rRad) })
      this.raysLayer.addChild(makeRay(hit, refractedDir, rayLen, RAY_CYAN))
      this.anglesLayer.addChild(makeAngleArc(hit, Math.PI / 2, Math.PI / 2 + rRad, 46, `∠r = ${Math.round(refractedDeg)}°`, RAY_CYAN))
      this.captionText.string = `n₁ sin ∠i = n₂ sin ∠r (${medium.label.split('(')[0]?.trim()})`
    } else {
      const reflectedDir = normalize({ x: Math.sin(iRad), y: -Math.cos(iRad) })
      this.raysLayer.addChild(makeRay(hit, reflectedDir, rayLen, RAY_CYAN))
      this.captionText.string = 'Total internal reflection!'
    }

    this.labelsLayer.addChild(makeLabel(`Air (n ≈ ${N_AIR.toFixed(3)})`, ox + w * 0.14, oy + (boundaryY - oy) * 0.35))
    this.labelsLayer.addChild(makeLabel(medium.label.split('(')[0]?.trim() ?? medium.id, ox + w * 0.14, boundaryY + (oy + h - boundaryY) * 0.35))
    this.labelsLayer.addChild(makeLabel('Normal', hit.x + 32, hit.y - rayLen * 0.25))
    this.captionText.centerX = this.stageCenterX
  }

  private showTipCard(text: string): void { this.tipBodyText.string = text; this.tipCard.visible = true; this.tipCard.opacity = 1; this.tipTimer = 4.4 }
  private showQuiz(): void {
    this.miniQuiz.showQuiz(RefractionMediaStrings.quizQuestionStringProperty.value, [
      { label: RefractionMediaStrings.quizCorrectStringProperty.value, correct: true },
      { label: RefractionMediaStrings.quizWrongStringProperty.value, correct: false },
    ], (correct) => { correct ? this.sounds.correct() : this.sounds.wrong(); this.model.onQuiz(correct) })
  }
  public override step(dt: number): void {
    this.model.step(dt); this.particles.step(dt)
    if (this.tipTimer > 0) { this.tipTimer -= dt; if (this.tipTimer < 0.6) this.tipCard.opacity = Math.max(0, this.tipTimer / 0.6); if (this.tipTimer <= 0) this.tipCard.visible = false }
  }
}
