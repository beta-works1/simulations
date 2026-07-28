import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Node, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { ShortCircuitFuseModel, FuseScenario } from '../model/ShortCircuitFuseModel.js'
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
import { ShortCircuitFuseStrings } from '../ShortCircuitFuseStrings.js'
import { fuseMainLoop, shortBypass } from '../../../shared/fusePhysics.js'
import { makeBattery, makeBulb, makeChargeDot, makeFuse, makeLabel, makeWireLoop, makeWirePath, pointOnLoop, WIRE, WIRE_DANGER } from '../../../shared/circuitDraw.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions
const SCENARIOS: readonly FuseScenario[] = ['normal', 'short', 'blown']
const SCENARIO_GUIDE: Record<FuseScenario, string> = {
  normal: ShortCircuitFuseStrings.guideNormalStringProperty.value,
  short: ShortCircuitFuseStrings.guideShortStringProperty.value,
  blown: ShortCircuitFuseStrings.guideBlownStringProperty.value,
}
const SCENARIO_TRIAD: Record<FuseScenario, [string, string, string]> = {
  normal: ['Normal load.', 'Current stays below the fuse rating so the load stays powered.', 'Try Short circuit.'],
  short: ['Short circuit.', 'A bypass dumps huge current — the fuse should open.', 'Watch for Fuse blown.'],
  blown: ['Fuse open.', 'The path is broken until you replace the fuse.', 'Clear the short, then Replace fuse.'],
}

export class ShortCircuitFuseScreenView extends ScreenView {
  private readonly model: ShortCircuitFuseModel
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
  private readonly stageLayer: Node; private readonly labelsLayer: Node
  private readonly captionText: Text; private readonly titleText: Text
  private readonly scenarioButtons: Record<FuseScenario, SoftButton>
  private readonly runningToggleBtn: SoftButton; private readonly shortBtn: SoftButton; private readonly replaceBtn: SoftButton
  private readonly labelsBtn: SoftButton; private readonly playPauseBtn: SoftButton; private readonly soundBtn: SoftButton
  private readonly starsText: Text; private readonly statusText: RichText
  private particleTs: number[] = []

  public constructor(model: ShortCircuitFuseModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    const sounds = new ElectricitySounds(); this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })
    const m = ElectricityConstants.SCREEN_VIEW_X_MARGIN; const my = ElectricityConstants.SCREEN_VIEW_Y_MARGIN; const lb = this.layoutBounds
    const leftW = 190; const rightW = 290; const gap = 14
    this.stageLeft = m + leftW + gap; this.stageTop = my + 78
    this.stageW = lb.width - m * 2 - leftW - gap - rightW - gap; this.stageH = lb.height - my * 2 - 78
    this.stageCenterX = this.stageLeft + this.stageW / 2
    this.guide = new GuidanceBanner(lb.width - m * 2, { title: ShortCircuitFuseStrings.guideTitleStringProperty.value, body: SCENARIO_GUIDE.normal })
    this.guide.left = m; this.guide.top = my; this.addChild(this.guide)
    const leftCard = new DepthCard(leftW, this.stageH, { variant: 'light' }); leftCard.left = m; leftCard.top = this.stageTop; this.addChild(leftCard)
    this.teachingTriad = new TeachingTriad(leftW - 24); this.teachingTriad.left = 12; this.teachingTriad.top = 12; leftCard.content.addChild(this.teachingTriad)
    this.leftLearnTip = createPanelTip(ShortCircuitFuseStrings.learnMoreStringProperty.value, { width: leftW - 24, fontSize: 11, fill: ElectricityColors.panelMuted })
    this.leftLearnTip.left = 12; this.leftLearnTip.top = this.teachingTriad.bottom + 22; leftCard.content.addChild(this.leftLearnTip)
    this.addChild(new StageBackdrop(this.stageLeft, this.stageTop, this.stageW, this.stageH, { top: '#c7d2e0', bottom: '#eef2f7' }))
    this.titleText = new Text(ShortCircuitFuseStrings.stageTitleStringProperty.value, { font: new PhetFont({ size: 18, weight: 'bold' }), fill: '#0f172a', centerX: this.stageCenterX, top: this.stageTop + 10 }); this.addChild(this.titleText)
    this.captionText = new Text('', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: ElectricityColors.accent, centerX: this.stageCenterX, top: this.titleText.bottom + 4 }); this.addChild(this.captionText)
    this.stageLayer = new Node({ pickable: false }); this.labelsLayer = new Node({ pickable: false }); this.addChild(this.stageLayer); this.addChild(this.labelsLayer)
    this.particles = new ParticleBurst(70); this.addChild(this.particles)
    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' }); this.tipCard.centerX = this.stageCenterX; this.tipCard.top = this.stageTop + 12; this.tipCard.visible = false
    this.tipCard.content.addChild(new Text(ShortCircuitFuseStrings.tipTitleStringProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: ElectricityColors.accent, left: 14, top: 10 }))
    this.tipBodyText = new RichText('', { font: new PhetFont(12), fill: ElectricityColors.ink, lineWrap: 222, leading: 3, left: 14, top: 30, maxWidth: 222 }); this.tipCard.content.addChild(this.tipBodyText); this.addChild(this.tipCard)
    this.miniQuiz = new MiniQuiz(260); this.miniQuiz.centerX = this.stageCenterX; this.miniQuiz.centerY = this.stageTop + this.stageH * 0.5; this.addChild(this.miniQuiz)

    const card = new DepthCard(rightW, this.stageH); card.left = this.stageLeft + this.stageW + gap; card.top = this.stageTop; this.addChild(card)
    const panelContent = new Node(); const contentW = rightW - 42; const halfW = (contentW - 8) / 2; const btnH = 32; const gridGap = 6
    const scenarioHeader = controlSection(ShortCircuitFuseStrings.sectionScenarioStringProperty.value, contentW); panelContent.addChild(scenarioHeader)
    this.scenarioButtons = {} as Record<FuseScenario, SoftButton>
    const scenarioLabels: Record<FuseScenario, string> = { normal: ShortCircuitFuseStrings.scenarioNormalStringProperty.value, short: ShortCircuitFuseStrings.scenarioShortStringProperty.value, blown: ShortCircuitFuseStrings.scenarioBlownStringProperty.value }
    for (const s of SCENARIOS) {
      const btn = new SoftButton(scenarioLabels[s], () => model.setScenario(s), { width: contentW, height: btnH, fill: s === 'normal' ? ElectricityColors.accent : '#64748b', selected: s === 'normal', fontSize: 12, onSound: () => sounds.scenario() })
      this.scenarioButtons[s] = btn; panelContent.addChild(btn)
    }
    const conditionsHeader = controlSection(ShortCircuitFuseStrings.sectionConditionsStringProperty.value, contentW); panelContent.addChild(conditionsHeader)
    this.runningToggleBtn = new SoftButton(ShortCircuitFuseStrings.runningOnStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: btnH, fill: ElectricityColors.accent, fontSize: 12, selected: true }); panelContent.addChild(this.runningToggleBtn)
    const fuseSlider = new DepthSlider(model.fuseRatingProperty, { min: 1, max: 5, width: contentW, label: ShortCircuitFuseStrings.fuseSliderStringProperty.value, format: (n) => `${n.toFixed(1)} A`, fill: '#ef4444', onTick: () => sounds.sliderTick() }); panelContent.addChild(fuseSlider)
    this.shortBtn = new SoftButton(ShortCircuitFuseStrings.shortOffStringProperty.value, () => { model.toggleShort(); sounds.toggle(model.shortedProperty.value) }, { width: halfW, height: btnH, fill: '#f59e0b', fontSize: 11 }); panelContent.addChild(this.shortBtn)
    this.replaceBtn = new SoftButton(ShortCircuitFuseStrings.replaceFuseStringProperty.value, () => { model.replaceFuse(); sounds.button() }, { width: halfW, height: btnH, fill: '#0ea5e9', fontSize: 11 }); panelContent.addChild(this.replaceBtn)
    const conditionsHint = controlHint(ShortCircuitFuseStrings.conditionsHintStringProperty.value, contentW); panelContent.addChild(conditionsHint)
    const displayHeader = controlSection(ShortCircuitFuseStrings.sectionDisplayStringProperty.value, contentW); panelContent.addChild(displayHeader)
    this.labelsBtn = new SoftButton(ShortCircuitFuseStrings.labelsOnStringProperty.value, () => { sounds.softClick(); model.showLabelsProperty.value = !model.showLabelsProperty.value }, { width: contentW, height: btnH, fill: '#64748b', fontSize: 12, selected: true }); panelContent.addChild(this.labelsBtn)
    const playbackHeader = controlSection(ShortCircuitFuseStrings.sectionPlaybackStringProperty.value, contentW); panelContent.addChild(playbackHeader)
    this.playPauseBtn = new SoftButton(ShortCircuitFuseStrings.playButtonStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: 38, fill: ElectricityColors.accent, fontSize: 12 }); panelContent.addChild(this.playPauseBtn)
    const soundHeader = controlSection(ShortCircuitFuseStrings.sectionSoundStringProperty.value, contentW); panelContent.addChild(soundHeader)
    this.soundBtn = new SoftButton(ShortCircuitFuseStrings.soundOnStringProperty.value, () => { sounds.unlock(); const on = !model.soundEnabledProperty.value; model.soundEnabledProperty.value = on; sounds.toggle(on); if (on) sounds.button(); this.soundBtn.setLabel(on ? ShortCircuitFuseStrings.soundOnStringProperty.value : ShortCircuitFuseStrings.soundOffStringProperty.value) }, { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 }); panelContent.addChild(this.soundBtn)
    const statusHeader = controlSection(ShortCircuitFuseStrings.sectionStatusStringProperty.value, contentW); panelContent.addChild(statusHeader)
    this.starsText = new Text('', { font: new PhetFont({ size: 15, weight: 'bold' }), fill: '#d97706' }); panelContent.addChild(this.starsText)
    this.statusText = new RichText(model.statusProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: ElectricityColors.panelText, lineWrap: contentW, leading: 3 }); panelContent.addChild(this.statusText)
    const learnTip = createPanelTip(ShortCircuitFuseStrings.learnMoreStringProperty.value, { width: contentW, fontSize: 11 }); panelContent.addChild(learnTip)
    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false }); panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      scenarioHeader.left = 0; scenarioHeader.top = py; py = scenarioHeader.bottom + 6
      for (const s of SCENARIOS) { const btn = this.scenarioButtons[s]; btn.left = 0; btn.top = py; py = btn.bottom + gridGap }
      py += 6; conditionsHeader.left = 0; conditionsHeader.top = py; py = conditionsHeader.bottom + 6
      this.runningToggleBtn.left = 0; this.runningToggleBtn.top = py; py = this.runningToggleBtn.bottom + gridGap
      fuseSlider.left = 0; fuseSlider.top = py; py = fuseSlider.bottom + gridGap
      this.shortBtn.left = 0; this.shortBtn.top = py; this.replaceBtn.left = halfW + 8; this.replaceBtn.top = py; py = this.shortBtn.bottom + 6
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
    this.addChild(new ResetAllButton({ listener: () => { sounds.resetAll(); model.reset(); this.particles.clear(); this.particleTs = [] }, right: lb.right - m, bottom: lb.bottom - my }))

    const sync = () => this.drawStage()
    model.fuseRatingProperty.link(sync)
    model.shortedProperty.link(() => { this.shortBtn.setSelected(model.shortedProperty.value); this.shortBtn.setLabel(model.shortedProperty.value ? ShortCircuitFuseStrings.shortOnStringProperty.value : ShortCircuitFuseStrings.shortOffStringProperty.value); sync() })
    model.fuseBlownProperty.link(sync)
    model.scenarioProperty.link(() => {
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(model.scenarioProperty.value === s)
      this.guide.setGuidance(ShortCircuitFuseStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[model.scenarioProperty.value])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[model.scenarioProperty.value], () => { this.leftLearnTip.top = this.teachingTriad.bottom + 22 })
      sync()
    })
    model.runningProperty.link(() => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(running ? ShortCircuitFuseStrings.pauseButtonStringProperty.value : ShortCircuitFuseStrings.playButtonStringProperty.value)
      this.runningToggleBtn.setLabel(running ? ShortCircuitFuseStrings.runningOnStringProperty.value : ShortCircuitFuseStrings.runningOffStringProperty.value)
      this.runningToggleBtn.setSelected(running)
    })
    model.showLabelsProperty.link(() => { this.labelsBtn.setSelected(model.showLabelsProperty.value); this.labelsBtn.setLabel(model.showLabelsProperty.value ? ShortCircuitFuseStrings.labelsOnStringProperty.value : ShortCircuitFuseStrings.labelsOffStringProperty.value); this.labelsLayer.visible = model.showLabelsProperty.value })
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(() => { this.starsText.string = `${ShortCircuitFuseStrings.starsStringProperty.value} ${model.starsProperty.value}` })
    model.statusProperty.link((status) => { this.statusText.string = status; relayoutPanel() })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.starsProperty.lazyLink((stars, old) => { if (old !== undefined && stars > old) sounds.celebrate() })
    this.teachingTriad.setTriad(...SCENARIO_TRIAD.normal, () => { this.leftLearnTip.top = this.teachingTriad.bottom + 22 })
    sync()
  }

  private drawStage(): void {
    const w = this.stageW; const h = this.stageH; const ox = this.stageLeft; const oy = this.stageTop
    const readout = this.model.readout
    const loop = fuseMainLoop(w, h).map(p => ({ x: ox + p.x, y: oy + p.y }))
    this.stageLayer.removeAllChildren(); this.labelsLayer.removeAllChildren()
    const wireColor = this.model.shortedProperty.value && !this.model.fuseBlownProperty.value ? WIRE_DANGER : WIRE
    this.stageLayer.addChild(makeWireLoop(loop, wireColor, 4))
    if (this.model.shortedProperty.value) {
      const bypass = shortBypass(w, h).map(p => ({ x: ox + p.x, y: oy + p.y }))
      this.stageLayer.addChild(makeWirePath(bypass, WIRE_DANGER, 3))
    }
    this.stageLayer.addChild(makeBattery((loop[0]!.x + loop[3]!.x) / 2, (loop[0]!.y + loop[3]!.y) / 2, 8))
    this.stageLayer.addChild(makeFuse((loop[0]!.x + loop[1]!.x) / 2, loop[0]!.y, this.model.fuseBlownProperty.value))
    this.stageLayer.addChild(makeBulb((loop[1]!.x + loop[2]!.x) / 2, (loop[1]!.y + loop[2]!.y) / 2, readout.loadPowered ? 0.7 : 0.05))
    if (this.model.fuseBlownProperty.value) {
      this.stageLayer.addChild(new Rectangle(ox + 20, oy + 40, w - 40, 36, { cornerRadius: 8, fill: 'rgba(127,29,29,0.85)' }))
      this.stageLayer.addChild(new Text('Fuse blown — circuit open', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: '#fecaca', centerX: this.stageCenterX, top: oy + 48 }))
    }
    if (this.model.showLabelsProperty.value) {
      this.labelsLayer.addChild(makeLabel('Fuse', (loop[0]!.x + loop[1]!.x) / 2, loop[0]!.y - 22, true))
      this.labelsLayer.addChild(makeLabel('Load', (loop[1]!.x + loop[2]!.x) / 2 + 28, (loop[1]!.y + loop[2]!.y) / 2))
      this.labelsLayer.addChild(makeLabel('Battery', (loop[0]!.x + loop[3]!.x) / 2 - 36, (loop[0]!.y + loop[3]!.y) / 2 - 40))
    }
    const status = this.model.fuseBlownProperty.value ? 'OPEN' : (readout.fuseIntact ? 'OK' : 'OVERLOAD')
    this.captionText.string = `I = ${readout.current.toFixed(2)} A · fuse ${status} · load ${readout.loadPowered ? 'ON' : 'OFF'}`
    this.captionText.centerX = this.stageCenterX
    if (!this.model.fuseBlownProperty.value) {
      const count = Math.min(28, Math.max(0, Math.round(readout.current * 3)))
      if (this.particleTs.length !== count) this.particleTs = Array.from({ length: count }, (_, i) => i / Math.max(count, 1))
      for (const t of this.particleTs) {
        const p = pointOnLoop(loop, t)
        this.stageLayer.addChild(makeChargeDot(p.x, p.y, this.model.shortedProperty.value))
      }
    } else {
      this.particleTs = []
    }
  }

  private showTipCard(text: string): void { this.tipBodyText.string = text; this.tipCard.visible = true; this.tipCard.opacity = 1; this.tipTimer = 4.4 }
  private showQuiz(): void {
    this.miniQuiz.showQuiz(ShortCircuitFuseStrings.quizQuestionStringProperty.value, [
      { label: ShortCircuitFuseStrings.quizCorrectStringProperty.value, correct: true },
      { label: ShortCircuitFuseStrings.quizWrongStringProperty.value, correct: false },
    ], (correct) => { correct ? this.sounds.correct() : this.sounds.wrong(); this.model.onQuiz(correct) })
  }
  public override step(dt: number): void {
    this.model.step(dt); this.particles.step(dt)
    if (this.model.runningProperty.value && !this.model.fuseBlownProperty.value) {
      const speed = Math.min(1.2, this.model.readout.current * 0.15)
      this.particleTs = this.particleTs.map(t => (t + speed * dt) % 1)
      this.drawStage()
    } else if (this.model.fuseBlownProperty.value) {
      this.drawStage()
    }
    if (this.tipTimer > 0) { this.tipTimer -= dt; if (this.tipTimer < 0.6) this.tipCard.opacity = Math.max(0, this.tipTimer / 0.6); if (this.tipTimer <= 0) this.tipCard.visible = false }
  }
}
