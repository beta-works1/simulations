import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { CurvedMirrorsModel, CurvedScenario } from '../model/CurvedMirrorsModel.js'
import { computeCurvedLayout, type MirrorType } from '../../../shared/curvedMirrorsModel.js'
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
import { CurvedMirrorsStrings } from '../CurvedMirrorsStrings.js'
import {
  makeArrowObject,
  makeDashedLine,
  makeLabel,
  makeRay,
  MUTED,
  normalize,
  OBJECT_COLOR,
  RAY_CYAN,
  RAY_WHITE,
  RAY_YELLOW,
  type Vec2,
} from '../../../shared/opticsDraw.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SCENARIOS: readonly CurvedScenario[] = ['explore', 'concaveDemo', 'convexDemo']
const TYPES: readonly MirrorType[] = ['concave', 'convex']

const SCENARIO_GUIDE: Record<CurvedScenario, string> = {
  explore: CurvedMirrorsStrings.guideExploreStringProperty.value,
  concaveDemo: CurvedMirrorsStrings.guideConcaveStringProperty.value,
  convexDemo: CurvedMirrorsStrings.guideConvexStringProperty.value,
}

const SCENARIO_TRIAD: Record<CurvedScenario, [string, string, string]> = {
  explore: ['Exploring curved mirrors.', 'Concave mirrors converge light; convex mirrors diverge it.', 'Try Concave demo for a real inverted image.'],
  concaveDemo: ['Concave mirror.', 'When the object is beyond F, a real inverted image forms.', 'Switch to Convex to compare image type.'],
  convexDemo: ['Convex mirror.', 'Always forms a virtual, upright, diminished image.', 'Move the object distance in Explore.'],
}

export class CurvedMirrorsScreenView extends ScreenView {
  private readonly model: CurvedMirrorsModel
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
  private readonly focalLayer: Node
  private readonly raysLayer: Node
  private readonly labelsLayer: Node
  private readonly captionText: Text
  private readonly titleText: Text
  private readonly scenarioButtons: Record<CurvedScenario, SoftButton>
  private readonly typeButtons: Record<MirrorType, SoftButton>
  private readonly runningToggleBtn: SoftButton
  private readonly labelsBtn: SoftButton
  private readonly raysBtn: SoftButton
  private readonly focalBtn: SoftButton
  private readonly playPauseBtn: SoftButton
  private readonly soundBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: RichText

  public constructor(model: CurvedMirrorsModel, providedOptions?: Options) {
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

    this.guide = new GuidanceBanner(lb.width - m * 2, { title: CurvedMirrorsStrings.guideTitleStringProperty.value, body: SCENARIO_GUIDE.explore })
    this.guide.left = m; this.guide.top = my; this.addChild(this.guide)

    const leftCard = new DepthCard(leftW, this.stageH, { variant: 'light' })
    leftCard.left = m; leftCard.top = this.stageTop; this.addChild(leftCard)
    this.teachingTriad = new TeachingTriad(leftW - 24); this.teachingTriad.left = 12; this.teachingTriad.top = 12; leftCard.content.addChild(this.teachingTriad)
    this.leftLearnTip = createPanelTip(CurvedMirrorsStrings.learnMoreStringProperty.value, { width: leftW - 24, fontSize: 11, fill: LightColors.panelMuted })
    this.leftLearnTip.left = 12; this.leftLearnTip.top = this.teachingTriad.bottom + 22; leftCard.content.addChild(this.leftLearnTip)

    this.addChild(new StageBackdrop(this.stageLeft, this.stageTop, this.stageW, this.stageH, { top: '#c7d2e0', bottom: '#eef2f7' }))
    this.titleText = new Text(CurvedMirrorsStrings.stageTitleStringProperty.value, { font: new PhetFont({ size: 18, weight: 'bold' }), fill: '#0f172a', centerX: this.stageCenterX, top: this.stageTop + 10 })
    this.addChild(this.titleText)
    this.captionText = new Text('', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: LightColors.accent, centerX: this.stageCenterX, top: this.titleText.bottom + 4 })
    this.addChild(this.captionText)
    this.stageLayer = new Node({ pickable: false }); this.focalLayer = new Node({ pickable: false })
    this.raysLayer = new Node({ pickable: false }); this.labelsLayer = new Node({ pickable: false })
    this.addChild(this.stageLayer); this.addChild(this.focalLayer); this.addChild(this.raysLayer); this.addChild(this.labelsLayer)
    this.particles = new ParticleBurst(70); this.addChild(this.particles)

    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = this.stageCenterX; this.tipCard.top = this.stageTop + 12; this.tipCard.visible = false
    this.tipCard.content.addChild(new Text(CurvedMirrorsStrings.tipTitleStringProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: LightColors.accent, left: 14, top: 10 }))
    this.tipBodyText = new RichText('', { font: new PhetFont(12), fill: LightColors.ink, lineWrap: 222, leading: 3, left: 14, top: 30, maxWidth: 222 })
    this.tipCard.content.addChild(this.tipBodyText); this.addChild(this.tipCard)
    this.miniQuiz = new MiniQuiz(260); this.miniQuiz.centerX = this.stageCenterX; this.miniQuiz.centerY = this.stageTop + this.stageH * 0.5; this.addChild(this.miniQuiz)

    const card = new DepthCard(rightW, this.stageH); card.left = this.stageLeft + this.stageW + gap; card.top = this.stageTop; this.addChild(card)
    const panelContent = new Node(); const contentW = rightW - 42; const halfW = (contentW - 8) / 2; const btnH = 32; const gridGap = 6

    const typeHeader = controlSection(CurvedMirrorsStrings.sectionTypeStringProperty.value, contentW); panelContent.addChild(typeHeader)
    this.typeButtons = {} as Record<MirrorType, SoftButton>
    for (const type of TYPES) {
      const btn = new SoftButton(type === 'concave' ? CurvedMirrorsStrings.typeConcaveStringProperty.value : CurvedMirrorsStrings.typeConvexStringProperty.value,
        () => { model.setType(type); sounds.modeChange(type === 'convex') },
        { width: halfW, height: btnH, fill: type === 'concave' ? LightColors.accent : '#64748b', selected: type === 'concave', fontSize: 11 })
      this.typeButtons[type] = btn; panelContent.addChild(btn)
    }

    const scenarioHeader = controlSection(CurvedMirrorsStrings.sectionScenarioStringProperty.value, contentW); panelContent.addChild(scenarioHeader)
    this.scenarioButtons = {} as Record<CurvedScenario, SoftButton>
    const scenarioLabels: Record<CurvedScenario, string> = { explore: CurvedMirrorsStrings.scenarioExploreStringProperty.value, concaveDemo: CurvedMirrorsStrings.scenarioConcaveStringProperty.value, convexDemo: CurvedMirrorsStrings.scenarioConvexStringProperty.value }
    for (const scenario of SCENARIOS) {
      const btn = new SoftButton(scenarioLabels[scenario], () => model.setScenario(scenario), { width: contentW, height: btnH, fill: scenario === 'explore' ? LightColors.accent : '#64748b', selected: scenario === 'explore', fontSize: 12, onSound: () => sounds.scenario() })
      this.scenarioButtons[scenario] = btn; panelContent.addChild(btn)
    }

    const conditionsHeader = controlSection(CurvedMirrorsStrings.sectionConditionsStringProperty.value, contentW); panelContent.addChild(conditionsHeader)
    this.runningToggleBtn = new SoftButton(CurvedMirrorsStrings.runningOnStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: btnH, fill: LightColors.accent, fontSize: 12, selected: true })
    panelContent.addChild(this.runningToggleBtn)
    const objectDistSlider = new DepthSlider(model.objectDistProperty, { min: 0.2, max: 0.9, width: contentW, label: CurvedMirrorsStrings.objectDistSliderStringProperty.value, format: (n) => `${(n * 100).toFixed(0)}%`, fill: OBJECT_COLOR, onTick: () => sounds.sliderTick() })
    panelContent.addChild(objectDistSlider)
    const conditionsHint = controlHint(CurvedMirrorsStrings.conditionsHintStringProperty.value, contentW)
    panelContent.addChild(conditionsHint)

    const displayHeader = controlSection(CurvedMirrorsStrings.sectionDisplayStringProperty.value, contentW); panelContent.addChild(displayHeader)
    this.labelsBtn = new SoftButton(CurvedMirrorsStrings.labelsOnStringProperty.value, () => { sounds.softClick(); model.showLabelsProperty.value = !model.showLabelsProperty.value }, { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true })
    this.raysBtn = new SoftButton(CurvedMirrorsStrings.raysOnStringProperty.value, () => { sounds.softClick(); model.showRaysProperty.value = !model.showRaysProperty.value }, { width: halfW, height: btnH, fill: '#f59e0b', fontSize: 10, selected: true })
    this.focalBtn = new SoftButton(CurvedMirrorsStrings.focalOnStringProperty.value, () => { sounds.softClick(); model.showFocalProperty.value = !model.showFocalProperty.value }, { width: contentW, height: btnH, fill: '#0ea5e9', fontSize: 12, selected: true })
    panelContent.addChild(this.labelsBtn); panelContent.addChild(this.raysBtn); panelContent.addChild(this.focalBtn)

    const playbackHeader = controlSection(CurvedMirrorsStrings.sectionPlaybackStringProperty.value, contentW); panelContent.addChild(playbackHeader)
    this.playPauseBtn = new SoftButton(CurvedMirrorsStrings.playButtonStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: 38, fill: LightColors.accent, fontSize: 12 })
    panelContent.addChild(this.playPauseBtn)
    const soundHeader = controlSection(CurvedMirrorsStrings.sectionSoundStringProperty.value, contentW); panelContent.addChild(soundHeader)
    this.soundBtn = new SoftButton(CurvedMirrorsStrings.soundOnStringProperty.value, () => { sounds.unlock(); const on = !model.soundEnabledProperty.value; model.soundEnabledProperty.value = on; sounds.toggle(on); if (on) sounds.button(); this.soundBtn.setLabel(on ? CurvedMirrorsStrings.soundOnStringProperty.value : CurvedMirrorsStrings.soundOffStringProperty.value) }, { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 })
    panelContent.addChild(this.soundBtn)
    const statusHeader = controlSection(CurvedMirrorsStrings.sectionStatusStringProperty.value, contentW); panelContent.addChild(statusHeader)
    this.starsText = new Text('', { font: new PhetFont({ size: 15, weight: 'bold' }), fill: '#d97706' }); panelContent.addChild(this.starsText)
    this.statusText = new RichText(model.statusProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: LightColors.panelText, lineWrap: contentW, leading: 3 }); panelContent.addChild(this.statusText)
    const learnTip = createPanelTip(CurvedMirrorsStrings.learnMoreStringProperty.value, { width: contentW, fontSize: 11 })
    panelContent.addChild(learnTip)
    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false }); panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      typeHeader.left = 0; typeHeader.top = py; py = typeHeader.bottom + 6
      this.typeButtons.concave.left = 0; this.typeButtons.concave.top = py; this.typeButtons.convex.left = halfW + 8; this.typeButtons.convex.top = py; py = this.typeButtons.concave.bottom + 12
      scenarioHeader.left = 0; scenarioHeader.top = py; py = scenarioHeader.bottom + 6
      for (const s of SCENARIOS) { const btn = this.scenarioButtons[s]; btn.left = 0; btn.top = py; py = btn.bottom + gridGap }
      py += 6; conditionsHeader.left = 0; conditionsHeader.top = py; py = conditionsHeader.bottom + 6
      this.runningToggleBtn.left = 0; this.runningToggleBtn.top = py; py = this.runningToggleBtn.bottom + gridGap
      objectDistSlider.left = 0; objectDistSlider.top = py; py = objectDistSlider.bottom + 6
      conditionsHint.left = 0; conditionsHint.top = py; py = conditionsHint.bottom + 12
      displayHeader.left = 0; displayHeader.top = py; py = displayHeader.bottom + 6
      this.labelsBtn.left = 0; this.labelsBtn.top = py; this.raysBtn.left = halfW + 8; this.raysBtn.top = py; py = this.labelsBtn.bottom + gridGap
      this.focalBtn.left = 0; this.focalBtn.top = py; py = this.focalBtn.bottom + 12
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

    const syncStage = () => this.drawStage()
    model.typeProperty.link(() => { for (const t of TYPES) this.typeButtons[t].setSelected(model.typeProperty.value === t); syncStage() })
    model.objectDistProperty.link(syncStage)
    model.scenarioProperty.link(() => {
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(model.scenarioProperty.value === s)
      this.guide.setGuidance(CurvedMirrorsStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[model.scenarioProperty.value])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[model.scenarioProperty.value], () => { this.leftLearnTip.top = this.teachingTriad.bottom + 22 })
      syncStage()
    })
    model.runningProperty.link(() => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(running ? CurvedMirrorsStrings.pauseButtonStringProperty.value : CurvedMirrorsStrings.playButtonStringProperty.value)
      this.runningToggleBtn.setLabel(running ? CurvedMirrorsStrings.runningOnStringProperty.value : CurvedMirrorsStrings.runningOffStringProperty.value)
      this.runningToggleBtn.setSelected(running)
    })
    model.showLabelsProperty.link(() => { this.labelsBtn.setSelected(model.showLabelsProperty.value); this.labelsBtn.setLabel(model.showLabelsProperty.value ? CurvedMirrorsStrings.labelsOnStringProperty.value : CurvedMirrorsStrings.labelsOffStringProperty.value); this.labelsLayer.visible = model.showLabelsProperty.value })
    model.showRaysProperty.link(() => { this.raysBtn.setSelected(model.showRaysProperty.value); this.raysBtn.setLabel(model.showRaysProperty.value ? CurvedMirrorsStrings.raysOnStringProperty.value : CurvedMirrorsStrings.raysOffStringProperty.value); this.raysLayer.visible = model.showRaysProperty.value })
    model.showFocalProperty.link(() => { this.focalBtn.setSelected(model.showFocalProperty.value); this.focalBtn.setLabel(model.showFocalProperty.value ? CurvedMirrorsStrings.focalOnStringProperty.value : CurvedMirrorsStrings.focalOffStringProperty.value); this.focalLayer.visible = model.showFocalProperty.value })
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(() => { this.starsText.string = `${CurvedMirrorsStrings.starsStringProperty.value} ${model.starsProperty.value}` })
    model.statusProperty.link((status) => { this.statusText.string = status; relayoutPanel() })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.starsProperty.lazyLink((stars, old) => { if (old !== undefined && stars > old) sounds.celebrate() })
    syncStage()
  }

  private drawStage(): void {
    const state = this.model.state
    const w = this.stageW; const h = this.stageH; const ox = this.stageLeft; const oy = this.stageTop
    const layout = computeCurvedLayout(w, h, state)
    const { pole, axisY, f, r, objectX, imageX, objectH, imageH, imageVirtual } = layout
    const px = ox + pole.x; const ay = oy + axisY

    this.stageLayer.removeAllChildren(); this.focalLayer.removeAllChildren(); this.raysLayer.removeAllChildren(); this.labelsLayer.removeAllChildren()

    this.stageLayer.addChild(makeDashedLine({ x: ox, y: ay }, { x: ox + w, y: ay }, MUTED))

    const arcShape = new Shape()
    if (state.type === 'concave') arcShape.arc(ox + pole.x + r, ay, r, Math.PI * 0.65, Math.PI * 1.35)
    else arcShape.arc(ox + pole.x - r, ay, r, -Math.PI * 0.35, Math.PI * 0.35)
    this.stageLayer.addChild(new Path(arcShape, { stroke: '#e2e8f0', lineWidth: 4, lineCap: 'round' }))

    const fPoint: Vec2 = { x: state.type === 'concave' ? px - f : px + f, y: ay }
    const cPoint: Vec2 = { x: state.type === 'concave' ? px - r : px + r, y: ay }
    for (const p of [fPoint, cPoint, { x: px, y: ay }]) {
      this.focalLayer.addChild(new Circle(4, { fill: RAY_WHITE, centerX: p.x, centerY: p.y }))
    }
    this.labelsLayer.addChild(makeLabel('F', fPoint.x, fPoint.y + 18, true))
    this.labelsLayer.addChild(makeLabel('C', cPoint.x, cPoint.y + 18, true))
    this.labelsLayer.addChild(makeLabel('P', px, ay - 16, true))

    const objX = ox + objectX; const imgX = ox + imageX
    this.stageLayer.addChild(makeArrowObject({ x: objX, y: ay }, objectH, OBJECT_COLOR))
    this.stageLayer.addChild(makeArrowObject({ x: imgX, y: ay }, imageH, RAY_CYAN, imageVirtual))

    const objTip = { x: objX, y: ay - objectH }
    const parallelHit = { x: px - 8, y: objTip.y }
    this.raysLayer.addChild(makeRay(objTip, normalize({ x: parallelHit.x - objTip.x, y: 0 }), Math.abs(parallelHit.x - objTip.x), RAY_YELLOW, 2))
    const reflDir = normalize({ x: fPoint.x - parallelHit.x, y: fPoint.y - parallelHit.y })
    this.raysLayer.addChild(makeRay(parallelHit, reflDir, w * (state.type === 'concave' ? 0.55 : 0.35), RAY_CYAN, 2))
    this.raysLayer.addChild(makeRay(objTip, normalize({ x: px - objTip.x, y: ay - objTip.y }), Math.hypot(px - objTip.x, ay - objTip.y) * 0.95, RAY_YELLOW, 2))

    this.captionText.string = state.type === 'concave'
      ? (imageVirtual ? 'Concave — virtual image' : 'Concave — real inverted image')
      : 'Convex — virtual upright image'
    this.captionText.centerX = this.stageCenterX
    const objLabel = makeLabel('Object', objX, ay - objectH - 14, true)
    this.labelsLayer.addChild(objLabel)
    const imgLabelText = imageVirtual ? 'Virtual image' : 'Real image'
    const imgLabel = makeLabel(imgLabelText, imgX, ay - imageH - 14, true, { maxWidth: 90 })
    // Keep image label inside the stage so it is not clipped by the right panel.
    if (imgLabel.right > ox + w - 8) imgLabel.right = ox + w - 8
    if (imgLabel.left < ox + 8) imgLabel.left = ox + 8
    this.labelsLayer.addChild(imgLabel)
  }

  private showTipCard(text: string): void { this.tipBodyText.string = text; this.tipCard.visible = true; this.tipCard.opacity = 1; this.tipTimer = 4.4 }
  private showQuiz(): void {
    this.miniQuiz.showQuiz(CurvedMirrorsStrings.quizQuestionStringProperty.value, [
      { label: CurvedMirrorsStrings.quizCorrectStringProperty.value, correct: true },
      { label: CurvedMirrorsStrings.quizWrongStringProperty.value, correct: false },
    ], (correct) => { correct ? this.sounds.correct() : this.sounds.wrong(); this.model.onQuiz(correct) })
  }
  public override step(dt: number): void {
    this.model.step(dt); this.particles.step(dt)
    if (this.tipTimer > 0) { this.tipTimer -= dt; if (this.tipTimer < 0.6) this.tipCard.opacity = Math.max(0, this.tipTimer / 0.6); if (this.tipTimer <= 0) this.tipCard.visible = false }
  }
}
