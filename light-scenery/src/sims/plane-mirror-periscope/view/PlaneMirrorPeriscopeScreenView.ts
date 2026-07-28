import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { PlaneMirrorPeriscopeModel, PlaneScenario } from '../model/PlaneMirrorPeriscopeModel.js'
import type { MirrorMode } from '../../../shared/planeMirrorPeriscopeModel.js'
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
import { PlaneMirrorPeriscopeStrings } from '../PlaneMirrorPeriscopeStrings.js'
import {
  DEG2RAD,
  makeArrowObject,
  makeDashedLine,
  makeLabel,
  makeLightSource,
  makeRay,
  MIRROR_COLOR,
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

const SCENARIOS: readonly PlaneScenario[] = ['explore', 'planeDemo', 'periscopeDemo']
const MODES: readonly MirrorMode[] = ['plane', 'periscope']

const SCENARIO_GUIDE: Record<PlaneScenario, string> = {
  explore: PlaneMirrorPeriscopeStrings.guideExploreStringProperty.value,
  planeDemo: PlaneMirrorPeriscopeStrings.guidePlaneStringProperty.value,
  periscopeDemo: PlaneMirrorPeriscopeStrings.guidePeriscopeStringProperty.value,
}

const SCENARIO_TRIAD: Record<PlaneScenario, [string, string, string]> = {
  explore: ['Exploring mirrors.', 'A plane mirror forms a virtual image the same distance behind the mirror.', 'Try Periscope mode for two 45° mirrors.'],
  planeDemo: ['Plane mirror.', 'The virtual image is upright and the same size as the object.', 'Switch to Periscope to see light redirected twice.'],
  periscopeDemo: ['Periscope.', 'Two mirrors at 45° let you see over a wall or around a corner.', 'Return to Plane mirror to compare image formation.'],
}

function makeMirrorSegment(a: Vec2, b: Vec2, angleDeg: number): Node {
  const len = Math.hypot(b.x - a.x, b.y - a.y)
  const cx = (a.x + b.x) / 2
  const cy = (a.y + b.y) / 2
  const bg = new Path(new Shape().moveTo(-len / 2, -7).lineTo(len / 2, -7).lineTo(len / 2, 7).lineTo(-len / 2, 7).close(), {
    fill: 'rgba(148,163,184,0.3)',
  })
  const line = new Path(new Shape().moveTo(-len / 2, 0).lineTo(len / 2, 0), {
    stroke: MIRROR_COLOR,
    lineWidth: 4,
    lineCap: 'round',
  })
  const node = new Node({ children: [bg, line], pickable: false })
  node.centerX = cx
  node.centerY = cy
  node.rotation = angleDeg * DEG2RAD
  return node
}

export class PlaneMirrorPeriscopeScreenView extends ScreenView {
  private readonly model: PlaneMirrorPeriscopeModel
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
  private readonly imageLayer: Node
  private readonly captionText: Text
  private readonly titleText: Text
  private readonly scenarioButtons: Record<PlaneScenario, SoftButton>
  private readonly modeButtons: Record<MirrorMode, SoftButton>
  private readonly runningToggleBtn: SoftButton
  private readonly labelsBtn: SoftButton
  private readonly raysBtn: SoftButton
  private readonly imageBtn: SoftButton
  private readonly playPauseBtn: SoftButton
  private readonly soundBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: RichText

  public constructor(model: PlaneMirrorPeriscopeModel, providedOptions?: Options) {
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

    this.guide = new GuidanceBanner(lb.width - m * 2, { title: PlaneMirrorPeriscopeStrings.guideTitleStringProperty.value, body: SCENARIO_GUIDE.explore })
    this.guide.left = m; this.guide.top = my; this.addChild(this.guide)

    const leftCard = new DepthCard(leftW, this.stageH, { variant: 'light' })
    leftCard.left = m; leftCard.top = this.stageTop; this.addChild(leftCard)
    this.teachingTriad = new TeachingTriad(leftW - 24); this.teachingTriad.left = 12; this.teachingTriad.top = 12; leftCard.content.addChild(this.teachingTriad)
    this.leftLearnTip = createPanelTip(PlaneMirrorPeriscopeStrings.learnMoreStringProperty.value, { width: leftW - 24, fontSize: 11, fill: LightColors.panelMuted })
    this.leftLearnTip.left = 12; this.leftLearnTip.top = this.teachingTriad.bottom + 22; leftCard.content.addChild(this.leftLearnTip)

    this.addChild(new StageBackdrop(this.stageLeft, this.stageTop, this.stageW, this.stageH, { top: '#c7d2e0', bottom: '#eef2f7' }))
    this.titleText = new Text(PlaneMirrorPeriscopeStrings.stageTitleStringProperty.value, { font: new PhetFont({ size: 18, weight: 'bold' }), fill: '#0f172a', centerX: this.stageCenterX, top: this.stageTop + 10 })
    this.addChild(this.titleText)
    this.captionText = new Text('', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: LightColors.accent, centerX: this.stageCenterX, top: this.titleText.bottom + 4 })
    this.addChild(this.captionText)
    this.stageLayer = new Node({ pickable: false }); this.raysLayer = new Node({ pickable: false })
    this.imageLayer = new Node({ pickable: false }); this.labelsLayer = new Node({ pickable: false })
    this.addChild(this.stageLayer); this.addChild(this.raysLayer); this.addChild(this.imageLayer); this.addChild(this.labelsLayer)
    this.particles = new ParticleBurst(70); this.addChild(this.particles)

    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = this.stageCenterX; this.tipCard.top = this.stageTop + 12; this.tipCard.visible = false
    this.tipCard.content.addChild(new Text(PlaneMirrorPeriscopeStrings.tipTitleStringProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: LightColors.accent, left: 14, top: 10 }))
    this.tipBodyText = new RichText('', { font: new PhetFont(12), fill: LightColors.ink, lineWrap: 222, leading: 3, left: 14, top: 30, maxWidth: 222 })
    this.tipCard.content.addChild(this.tipBodyText); this.addChild(this.tipCard)
    this.miniQuiz = new MiniQuiz(260); this.miniQuiz.centerX = this.stageCenterX; this.miniQuiz.centerY = this.stageTop + this.stageH * 0.5; this.addChild(this.miniQuiz)

    const card = new DepthCard(rightW, this.stageH); card.left = this.stageLeft + this.stageW + gap; card.top = this.stageTop; this.addChild(card)
    const panelContent = new Node(); const contentW = rightW - 42; const halfW = (contentW - 8) / 2; const btnH = 32; const gridGap = 6

    const modeHeader = controlSection(PlaneMirrorPeriscopeStrings.sectionModeStringProperty.value, contentW); panelContent.addChild(modeHeader)
    this.modeButtons = {} as Record<MirrorMode, SoftButton>
    for (const mode of MODES) {
      const btn = new SoftButton(mode === 'plane' ? PlaneMirrorPeriscopeStrings.modePlaneStringProperty.value : PlaneMirrorPeriscopeStrings.modePeriscopeStringProperty.value,
        () => { model.setMode(mode); sounds.modeChange(mode === 'periscope') },
        { width: halfW, height: btnH, fill: mode === 'plane' ? LightColors.accent : '#64748b', selected: mode === 'plane', fontSize: 11 })
      this.modeButtons[mode] = btn; panelContent.addChild(btn)
    }

    const scenarioHeader = controlSection(PlaneMirrorPeriscopeStrings.sectionScenarioStringProperty.value, contentW); panelContent.addChild(scenarioHeader)
    this.scenarioButtons = {} as Record<PlaneScenario, SoftButton>
    const scenarioLabels: Record<PlaneScenario, string> = { explore: PlaneMirrorPeriscopeStrings.scenarioExploreStringProperty.value, planeDemo: PlaneMirrorPeriscopeStrings.scenarioPlaneStringProperty.value, periscopeDemo: PlaneMirrorPeriscopeStrings.scenarioPeriscopeStringProperty.value }
    for (const scenario of SCENARIOS) {
      const btn = new SoftButton(scenarioLabels[scenario], () => model.setScenario(scenario), { width: contentW, height: btnH, fill: scenario === 'explore' ? LightColors.accent : '#64748b', selected: scenario === 'explore', fontSize: 12, onSound: () => sounds.scenario() })
      this.scenarioButtons[scenario] = btn; panelContent.addChild(btn)
    }

    const conditionsHeader = controlSection(PlaneMirrorPeriscopeStrings.sectionConditionsStringProperty.value, contentW); panelContent.addChild(conditionsHeader)
    this.runningToggleBtn = new SoftButton(PlaneMirrorPeriscopeStrings.runningOnStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: btnH, fill: LightColors.accent, fontSize: 12, selected: true })
    panelContent.addChild(this.runningToggleBtn)
    const distSlider = new DepthSlider(model.objectDistProperty, { min: 0.15, max: 0.55, width: contentW, label: PlaneMirrorPeriscopeStrings.objectDistSliderStringProperty.value, format: (n) => `${(n * 100).toFixed(0)}%`, fill: OBJECT_COLOR, onTick: () => sounds.sliderTick() })
    panelContent.addChild(distSlider)
    const heightSlider = new DepthSlider(model.objectHeightProperty, { min: 0.1, max: 0.4, width: contentW, label: PlaneMirrorPeriscopeStrings.objectHeightSliderStringProperty.value, format: (n) => `${(n * 100).toFixed(0)}%`, fill: RAY_CYAN, onTick: () => sounds.sliderTick() })
    panelContent.addChild(heightSlider)
    const conditionsHint = controlHint(PlaneMirrorPeriscopeStrings.conditionsHintStringProperty.value, contentW)
    panelContent.addChild(conditionsHint)

    const displayHeader = controlSection(PlaneMirrorPeriscopeStrings.sectionDisplayStringProperty.value, contentW); panelContent.addChild(displayHeader)
    this.labelsBtn = new SoftButton(PlaneMirrorPeriscopeStrings.labelsOnStringProperty.value, () => { sounds.softClick(); model.showLabelsProperty.value = !model.showLabelsProperty.value }, { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true })
    this.raysBtn = new SoftButton(PlaneMirrorPeriscopeStrings.raysOnStringProperty.value, () => { sounds.softClick(); model.showRaysProperty.value = !model.showRaysProperty.value }, { width: halfW, height: btnH, fill: '#f59e0b', fontSize: 10, selected: true })
    this.imageBtn = new SoftButton(PlaneMirrorPeriscopeStrings.imageOnStringProperty.value, () => { sounds.softClick(); model.showImageProperty.value = !model.showImageProperty.value }, { width: contentW, height: btnH, fill: '#0ea5e9', fontSize: 12, selected: true })
    panelContent.addChild(this.labelsBtn); panelContent.addChild(this.raysBtn); panelContent.addChild(this.imageBtn)

    const playbackHeader = controlSection(PlaneMirrorPeriscopeStrings.sectionPlaybackStringProperty.value, contentW); panelContent.addChild(playbackHeader)
    this.playPauseBtn = new SoftButton(PlaneMirrorPeriscopeStrings.playButtonStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: 38, fill: LightColors.accent, fontSize: 12 })
    panelContent.addChild(this.playPauseBtn)
    const soundHeader = controlSection(PlaneMirrorPeriscopeStrings.sectionSoundStringProperty.value, contentW); panelContent.addChild(soundHeader)
    this.soundBtn = new SoftButton(PlaneMirrorPeriscopeStrings.soundOnStringProperty.value, () => { sounds.unlock(); const on = !model.soundEnabledProperty.value; model.soundEnabledProperty.value = on; sounds.toggle(on); if (on) sounds.button(); this.soundBtn.setLabel(on ? PlaneMirrorPeriscopeStrings.soundOnStringProperty.value : PlaneMirrorPeriscopeStrings.soundOffStringProperty.value) }, { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 })
    panelContent.addChild(this.soundBtn)
    const statusHeader = controlSection(PlaneMirrorPeriscopeStrings.sectionStatusStringProperty.value, contentW); panelContent.addChild(statusHeader)
    this.starsText = new Text('', { font: new PhetFont({ size: 15, weight: 'bold' }), fill: '#d97706' }); panelContent.addChild(this.starsText)
    this.statusText = new RichText(model.statusProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: LightColors.panelText, lineWrap: contentW, leading: 3 }); panelContent.addChild(this.statusText)
    const learnTip = createPanelTip(PlaneMirrorPeriscopeStrings.learnMoreStringProperty.value, { width: contentW, fontSize: 11 }); panelContent.addChild(learnTip)
    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false }); panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      modeHeader.left = 0; modeHeader.top = py; py = modeHeader.bottom + 6
      this.modeButtons.plane.left = 0; this.modeButtons.plane.top = py; this.modeButtons.periscope.left = halfW + 8; this.modeButtons.periscope.top = py; py = this.modeButtons.plane.bottom + 12
      scenarioHeader.left = 0; scenarioHeader.top = py; py = scenarioHeader.bottom + 6
      for (const s of SCENARIOS) { const btn = this.scenarioButtons[s]; btn.left = 0; btn.top = py; py = btn.bottom + gridGap }
      py += 6; conditionsHeader.left = 0; conditionsHeader.top = py; py = conditionsHeader.bottom + 6
      this.runningToggleBtn.left = 0; this.runningToggleBtn.top = py; py = this.runningToggleBtn.bottom + gridGap
      distSlider.left = 0; distSlider.top = py; py = distSlider.bottom + gridGap
      heightSlider.left = 0; heightSlider.top = py; py = heightSlider.bottom + 6
      conditionsHint.left = 0; conditionsHint.top = py; py = conditionsHint.bottom + 12
      displayHeader.left = 0; displayHeader.top = py; py = displayHeader.bottom + 6
      this.labelsBtn.left = 0; this.labelsBtn.top = py; this.raysBtn.left = halfW + 8; this.raysBtn.top = py; py = this.labelsBtn.bottom + gridGap
      this.imageBtn.left = 0; this.imageBtn.top = py; py = this.imageBtn.bottom + 12
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
    model.modeProperty.link(sync); model.objectDistProperty.link(sync); model.objectHeightProperty.link(sync)
    model.scenarioProperty.link(() => {
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(model.scenarioProperty.value === s)
      this.guide.setGuidance(PlaneMirrorPeriscopeStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[model.scenarioProperty.value])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[model.scenarioProperty.value], () => { this.leftLearnTip.top = this.teachingTriad.bottom + 22 })
      sync()
    })
    model.modeProperty.link(() => { for (const m of MODES) this.modeButtons[m].setSelected(model.modeProperty.value === m); sync() })
    model.runningProperty.link(() => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(running ? PlaneMirrorPeriscopeStrings.pauseButtonStringProperty.value : PlaneMirrorPeriscopeStrings.playButtonStringProperty.value)
      this.runningToggleBtn.setLabel(running ? PlaneMirrorPeriscopeStrings.runningOnStringProperty.value : PlaneMirrorPeriscopeStrings.runningOffStringProperty.value)
      this.runningToggleBtn.setSelected(running)
    })
    model.showLabelsProperty.link(() => { this.labelsBtn.setSelected(model.showLabelsProperty.value); this.labelsBtn.setLabel(model.showLabelsProperty.value ? PlaneMirrorPeriscopeStrings.labelsOnStringProperty.value : PlaneMirrorPeriscopeStrings.labelsOffStringProperty.value); this.labelsLayer.visible = model.showLabelsProperty.value })
    model.showRaysProperty.link(() => { this.raysBtn.setSelected(model.showRaysProperty.value); this.raysBtn.setLabel(model.showRaysProperty.value ? PlaneMirrorPeriscopeStrings.raysOnStringProperty.value : PlaneMirrorPeriscopeStrings.raysOffStringProperty.value); this.raysLayer.visible = model.showRaysProperty.value })
    model.showImageProperty.link(() => { this.imageBtn.setSelected(model.showImageProperty.value); this.imageBtn.setLabel(model.showImageProperty.value ? PlaneMirrorPeriscopeStrings.imageOnStringProperty.value : PlaneMirrorPeriscopeStrings.imageOffStringProperty.value); this.imageLayer.visible = model.showImageProperty.value })
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(() => { this.starsText.string = `${PlaneMirrorPeriscopeStrings.starsStringProperty.value} ${model.starsProperty.value}` })
    model.statusProperty.link((status) => { this.statusText.string = status; relayoutPanel() })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.starsProperty.lazyLink((stars, old) => { if (old !== undefined && stars > old) sounds.celebrate() })
    sync()
  }

  private drawStage(): void {
    const state = this.model.state
    const w = this.stageW; const h = this.stageH; const ox = this.stageLeft; const oy = this.stageTop
    this.stageLayer.removeAllChildren(); this.raysLayer.removeAllChildren(); this.imageLayer.removeAllChildren(); this.labelsLayer.removeAllChildren()

    if (state.mode === 'plane') {
      const mirrorX = ox + w * 0.55; const axisY = oy + h * 0.82
      const objX = mirrorX - state.objectDist * w; const objTop = axisY - state.objectHeight * h
      const imgX = mirrorX + (mirrorX - objX); const imgTop = objTop
      this.stageLayer.addChild(makeDashedLine({ x: ox, y: axisY }, { x: ox + w, y: axisY }, MUTED))
      this.stageLayer.addChild(makeMirrorSegment({ x: mirrorX, y: oy + h * 0.15 }, { x: mirrorX, y: axisY }, 0))
      this.stageLayer.addChild(makeArrowObject({ x: objX, y: axisY }, axisY - objTop, OBJECT_COLOR))
      this.imageLayer.addChild(makeArrowObject({ x: imgX, y: axisY }, axisY - imgTop, RAY_CYAN, true))
      const objMid = { x: objX, y: (axisY + objTop) / 2 }; const mirrorMid = { x: mirrorX, y: (axisY + objTop) / 2 }; const imgMid = { x: imgX, y: (axisY + objTop) / 2 }
      this.raysLayer.addChild(makeRay(objMid, normalize({ x: mirrorMid.x - objMid.x, y: mirrorMid.y - objMid.y }), Math.hypot(mirrorMid.x - objMid.x, mirrorMid.y - objMid.y), RAY_YELLOW, 2))
      this.raysLayer.addChild(makeRay(mirrorMid, normalize({ x: imgMid.x - mirrorMid.x, y: imgMid.y - mirrorMid.y }), Math.hypot(imgMid.x - mirrorMid.x, imgMid.y - mirrorMid.y), RAY_YELLOW, 2))
      this.raysLayer.addChild(makeDashedLine(objMid, imgMid, RAY_WHITE))
      this.labelsLayer.addChild(makeLabel('Mirror', mirrorX + 12, oy + h * 0.22))
      this.labelsLayer.addChild(makeLabel('Object', objX, objTop - 14, true))
      const imgLabel = makeLabel('Virtual image', imgX, imgTop - 14, true, { maxWidth: 88 })
      if (imgLabel.right > ox + w - 8) imgLabel.right = ox + w - 8
      if (imgLabel.left < ox + 8) imgLabel.left = ox + 8
      this.labelsLayer.addChild(imgLabel)
      this.captionText.string = 'Plane mirror — virtual image behind mirror'
    } else {
      const topMirror: Vec2 = { x: ox + w * 0.38, y: oy + h * 0.22 }
      const bottomMirror: Vec2 = { x: ox + w * 0.62, y: oy + h * 0.62 }
      const eye: Vec2 = { x: ox + w * 0.78, y: oy + h * 0.78 }
      const target: Vec2 = { x: ox + w * 0.18, y: oy + h * 0.12 }
      const tubeW = w * 0.12
      this.stageLayer.addChild(new Rectangle(topMirror.x - tubeW / 2, topMirror.y, tubeW, bottomMirror.y - topMirror.y, { fill: 'rgba(30,41,59,0.8)', stroke: '#475569', lineWidth: 2 }))
      this.stageLayer.addChild(new Rectangle(bottomMirror.x - tubeW / 2, bottomMirror.y, tubeW, eye.y - bottomMirror.y, { fill: 'rgba(30,41,59,0.8)', stroke: '#475569', lineWidth: 2 }))
      this.stageLayer.addChild(makeMirrorSegment({ x: topMirror.x - 40, y: topMirror.y }, { x: topMirror.x + 40, y: topMirror.y }, -45))
      this.stageLayer.addChild(makeMirrorSegment({ x: bottomMirror.x - 40, y: bottomMirror.y }, { x: bottomMirror.x + 40, y: bottomMirror.y }, 45))
      this.raysLayer.addChild(makeRay(target, normalize({ x: topMirror.x - target.x, y: topMirror.y - target.y }), Math.hypot(topMirror.x - target.x, topMirror.y - target.y), RAY_YELLOW))
      this.raysLayer.addChild(makeRay(topMirror, { x: 1, y: 0 }, Math.hypot(bottomMirror.x - topMirror.x, bottomMirror.y - topMirror.y), RAY_YELLOW))
      this.raysLayer.addChild(makeRay(bottomMirror, normalize({ x: eye.x - bottomMirror.x, y: eye.y - bottomMirror.y }), Math.hypot(eye.x - bottomMirror.x, eye.y - bottomMirror.y), RAY_CYAN))
      this.stageLayer.addChild(makeLightSource(target.x, target.y, OBJECT_COLOR))
      this.stageLayer.addChild(new Circle(7, { fill: RAY_CYAN, centerX: eye.x, centerY: eye.y }))
      this.labelsLayer.addChild(makeLabel('Object', target.x, target.y - 18, true))
      this.labelsLayer.addChild(makeLabel('Eye', eye.x + 24, eye.y))
      this.labelsLayer.addChild(makeLabel('45°', topMirror.x + 50, topMirror.y - 8))
      this.captionText.string = 'Periscope — two 45° mirrors redirect light'
    }
    this.captionText.centerX = this.stageCenterX
  }

  private showTipCard(text: string): void { this.tipBodyText.string = text; this.tipCard.visible = true; this.tipCard.opacity = 1; this.tipTimer = 4.4 }
  private showQuiz(): void {
    this.miniQuiz.showQuiz(PlaneMirrorPeriscopeStrings.quizQuestionStringProperty.value, [
      { label: PlaneMirrorPeriscopeStrings.quizCorrectStringProperty.value, correct: true },
      { label: PlaneMirrorPeriscopeStrings.quizWrongStringProperty.value, correct: false },
    ], (correct) => { correct ? this.sounds.correct() : this.sounds.wrong(); this.model.onQuiz(correct) })
  }
  public override step(dt: number): void {
    this.model.step(dt); this.particles.step(dt)
    if (this.tipTimer > 0) { this.tipTimer -= dt; if (this.tipTimer < 0.6) this.tipCard.opacity = Math.max(0, this.tipTimer / 0.6); if (this.tipTimer <= 0) this.tipCard.visible = false }
  }
}
