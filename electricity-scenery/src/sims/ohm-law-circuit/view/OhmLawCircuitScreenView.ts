import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Node, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'

import { OhmLawCircuitModel, OhmScenario } from '../model/OhmLawCircuitModel.js'
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

import { OhmLawCircuitStrings } from '../OhmLawCircuitStrings.js'
import {
  batteryCount, bulbBrightness, ohmLoop, PHET_RESISTANCE, PHET_VOLTAGE,
} from '../../../shared/ohmPhysics.js'
import {
  makeBattery, makeBulb, makeChargeDot, makeLabel, makeResistor, makeSwitch, makeWireLoop, pointOnLoop, WIRE,
} from '../../../shared/circuitDraw.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SCENARIOS: readonly OhmScenario[] = ['explore', 'highVoltage', 'highResistance', 'openCircuit']
const SCENARIO_GUIDE: Record<OhmScenario, string> = {
  explore: OhmLawCircuitStrings.guideExploreStringProperty.value,
  highVoltage: OhmLawCircuitStrings.guideHighVoltageStringProperty.value,
  highResistance: OhmLawCircuitStrings.guideHighResistanceStringProperty.value,
  openCircuit: OhmLawCircuitStrings.guideOpenCircuitStringProperty.value,
}
const SCENARIO_TRIAD: Record<OhmScenario, [string, string, string]> = {
  explore: ['Exploring Ohm\'s law.', 'Current I equals voltage V divided by resistance R.', 'Try High voltage to brighten the bulb.'],
  highVoltage: ['High voltage.', 'More V means more I when R is fixed.', 'Try High resistance next.'],
  highResistance: ['High resistance.', 'Larger R reduces current and dimness follows.', 'Open the circuit to stop flow entirely.'],
  openCircuit: ['Open switch.', 'No closed path means I = 0.', 'Close the switch and adjust V or R.'],
}

export class OhmLawCircuitScreenView extends ScreenView {
  private readonly model: OhmLawCircuitModel
  private readonly sounds: ElectricitySounds
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
  private readonly captionText: Text
  private readonly titleText: Text
  private readonly scenarioButtons: Record<OhmScenario, SoftButton>
  private readonly runningToggleBtn: SoftButton
  private readonly switchBtn: SoftButton
  private readonly labelsBtn: SoftButton
  private readonly formulaBtn: SoftButton
  private readonly playPauseBtn: SoftButton
  private readonly soundBtn: SoftButton
  private readonly starsText: Text
  private readonly statusText: RichText
  private particleTs: number[] = []

  public constructor(model: OhmLawCircuitModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    const sounds = new ElectricitySounds(); this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })

    const m = ElectricityConstants.SCREEN_VIEW_X_MARGIN
    const my = ElectricityConstants.SCREEN_VIEW_Y_MARGIN
    const lb = this.layoutBounds
    const leftW = 190; const rightW = 290; const gap = 14
    this.stageLeft = m + leftW + gap; this.stageTop = my + 78
    this.stageW = lb.width - m * 2 - leftW - gap - rightW - gap
    this.stageH = lb.height - my * 2 - 78
    this.stageCenterX = this.stageLeft + this.stageW / 2

    this.guide = new GuidanceBanner(lb.width - m * 2, { title: OhmLawCircuitStrings.guideTitleStringProperty.value, body: SCENARIO_GUIDE.explore })
    this.guide.left = m; this.guide.top = my; this.addChild(this.guide)

    const leftCard = new DepthCard(leftW, this.stageH, { variant: 'light' })
    leftCard.left = m; leftCard.top = this.stageTop; this.addChild(leftCard)
    this.teachingTriad = new TeachingTriad(leftW - 24); this.teachingTriad.left = 12; this.teachingTriad.top = 12; leftCard.content.addChild(this.teachingTriad)
    this.leftLearnTip = createPanelTip(OhmLawCircuitStrings.learnMoreStringProperty.value, { width: leftW - 24, fontSize: 11, fill: ElectricityColors.panelMuted })
    this.leftLearnTip.left = 12; this.leftLearnTip.top = this.teachingTriad.bottom + 22; leftCard.content.addChild(this.leftLearnTip)

    this.addChild(new StageBackdrop(this.stageLeft, this.stageTop, this.stageW, this.stageH, { top: '#c7d2e0', bottom: '#eef2f7' }))
    this.titleText = new Text(OhmLawCircuitStrings.stageTitleStringProperty.value, { font: new PhetFont({ size: 18, weight: 'bold' }), fill: '#0f172a', centerX: this.stageCenterX, top: this.stageTop + 10 })
    this.addChild(this.titleText)
    this.captionText = new Text('', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: ElectricityColors.accent, centerX: this.stageCenterX, top: this.titleText.bottom + 4 })
    this.addChild(this.captionText)
    this.stageLayer = new Node({ pickable: false }); this.labelsLayer = new Node({ pickable: false })
    this.addChild(this.stageLayer); this.addChild(this.labelsLayer)
    this.particles = new ParticleBurst(70); this.addChild(this.particles)

    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' })
    this.tipCard.centerX = this.stageCenterX; this.tipCard.top = this.stageTop + 12; this.tipCard.visible = false
    this.tipCard.content.addChild(new Text(OhmLawCircuitStrings.tipTitleStringProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: ElectricityColors.accent, left: 14, top: 10 }))
    this.tipBodyText = new RichText('', { font: new PhetFont(12), fill: ElectricityColors.ink, lineWrap: 222, leading: 3, left: 14, top: 30, maxWidth: 222 })
    this.tipCard.content.addChild(this.tipBodyText); this.addChild(this.tipCard)
    this.miniQuiz = new MiniQuiz(260); this.miniQuiz.centerX = this.stageCenterX; this.miniQuiz.centerY = this.stageTop + this.stageH * 0.5; this.addChild(this.miniQuiz)

    const card = new DepthCard(rightW, this.stageH); card.left = this.stageLeft + this.stageW + gap; card.top = this.stageTop; this.addChild(card)
    const panelContent = new Node(); const contentW = rightW - 42; const halfW = (contentW - 8) / 2; const btnH = 32; const gridGap = 6

    const scenarioHeader = controlSection(OhmLawCircuitStrings.sectionScenarioStringProperty.value, contentW); panelContent.addChild(scenarioHeader)
    this.scenarioButtons = {} as Record<OhmScenario, SoftButton>
    const scenarioLabels: Record<OhmScenario, string> = {
      explore: OhmLawCircuitStrings.scenarioExploreStringProperty.value,
      highVoltage: OhmLawCircuitStrings.scenarioHighVoltageStringProperty.value,
      highResistance: OhmLawCircuitStrings.scenarioHighResistanceStringProperty.value,
      openCircuit: OhmLawCircuitStrings.scenarioOpenCircuitStringProperty.value,
    }
    for (const s of SCENARIOS) {
      const btn = new SoftButton(scenarioLabels[s], () => model.setScenario(s), { width: contentW, height: btnH, fill: s === 'explore' ? ElectricityColors.accent : '#64748b', selected: s === 'explore', fontSize: 12, onSound: () => sounds.scenario() })
      this.scenarioButtons[s] = btn; panelContent.addChild(btn)
    }

    const conditionsHeader = controlSection(OhmLawCircuitStrings.sectionConditionsStringProperty.value, contentW); panelContent.addChild(conditionsHeader)
    this.runningToggleBtn = new SoftButton(OhmLawCircuitStrings.runningOnStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: btnH, fill: ElectricityColors.accent, fontSize: 12, selected: true })
    panelContent.addChild(this.runningToggleBtn)
    const voltageSlider = new DepthSlider(model.voltageProperty, { min: PHET_VOLTAGE.min, max: PHET_VOLTAGE.max, width: contentW, label: OhmLawCircuitStrings.voltageSliderStringProperty.value, format: (n) => `${n.toFixed(1)} V`, fill: '#f59e0b', onTick: () => sounds.sliderTick() })
    panelContent.addChild(voltageSlider)
    const resistanceSlider = new DepthSlider(model.resistanceProperty, { min: PHET_RESISTANCE.min, max: PHET_RESISTANCE.max, width: contentW, label: OhmLawCircuitStrings.resistanceSliderStringProperty.value, format: (n) => `${n.toFixed(0)} Ω`, fill: '#b45309', onTick: () => sounds.sliderTick() })
    panelContent.addChild(resistanceSlider)
    this.switchBtn = new SoftButton(OhmLawCircuitStrings.switchClosedStringProperty.value, () => { model.toggleSwitch(); sounds.toggle(model.switchClosedProperty.value) }, { width: contentW, height: btnH, fill: '#0ea5e9', fontSize: 12, selected: true })
    panelContent.addChild(this.switchBtn)
    const conditionsHint = controlHint(OhmLawCircuitStrings.conditionsHintStringProperty.value, contentW); panelContent.addChild(conditionsHint)

    const displayHeader = controlSection(OhmLawCircuitStrings.sectionDisplayStringProperty.value, contentW); panelContent.addChild(displayHeader)
    this.labelsBtn = new SoftButton(OhmLawCircuitStrings.labelsOnStringProperty.value, () => { sounds.softClick(); model.showLabelsProperty.value = !model.showLabelsProperty.value }, { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true })
    this.formulaBtn = new SoftButton(OhmLawCircuitStrings.formulaOnStringProperty.value, () => { sounds.softClick(); model.showFormulaProperty.value = !model.showFormulaProperty.value }, { width: halfW, height: btnH, fill: '#0ea5e9', fontSize: 11, selected: true })
    panelContent.addChild(this.labelsBtn); panelContent.addChild(this.formulaBtn)

    const playbackHeader = controlSection(OhmLawCircuitStrings.sectionPlaybackStringProperty.value, contentW); panelContent.addChild(playbackHeader)
    this.playPauseBtn = new SoftButton(OhmLawCircuitStrings.playButtonStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: 38, fill: ElectricityColors.accent, fontSize: 12 })
    panelContent.addChild(this.playPauseBtn)
    const soundHeader = controlSection(OhmLawCircuitStrings.sectionSoundStringProperty.value, contentW); panelContent.addChild(soundHeader)
    this.soundBtn = new SoftButton(OhmLawCircuitStrings.soundOnStringProperty.value, () => { sounds.unlock(); const on = !model.soundEnabledProperty.value; model.soundEnabledProperty.value = on; sounds.toggle(on); if (on) sounds.button(); this.soundBtn.setLabel(on ? OhmLawCircuitStrings.soundOnStringProperty.value : OhmLawCircuitStrings.soundOffStringProperty.value) }, { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 })
    panelContent.addChild(this.soundBtn)
    const statusHeader = controlSection(OhmLawCircuitStrings.sectionStatusStringProperty.value, contentW); panelContent.addChild(statusHeader)
    this.starsText = new Text('', { font: new PhetFont({ size: 15, weight: 'bold' }), fill: '#d97706' }); panelContent.addChild(this.starsText)
    this.statusText = new RichText(model.statusProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: ElectricityColors.panelText, lineWrap: contentW, leading: 3 }); panelContent.addChild(this.statusText)
    const learnTip = createPanelTip(OhmLawCircuitStrings.learnMoreStringProperty.value, { width: contentW, fontSize: 11 }); panelContent.addChild(learnTip)
    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false }); panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      scenarioHeader.left = 0; scenarioHeader.top = py; py = scenarioHeader.bottom + 6
      for (const s of SCENARIOS) { const btn = this.scenarioButtons[s]; btn.left = 0; btn.top = py; py = btn.bottom + gridGap }
      py += 6; conditionsHeader.left = 0; conditionsHeader.top = py; py = conditionsHeader.bottom + 6
      this.runningToggleBtn.left = 0; this.runningToggleBtn.top = py; py = this.runningToggleBtn.bottom + gridGap
      voltageSlider.left = 0; voltageSlider.top = py; py = voltageSlider.bottom + gridGap
      resistanceSlider.left = 0; resistanceSlider.top = py; py = resistanceSlider.bottom + gridGap
      this.switchBtn.left = 0; this.switchBtn.top = py; py = this.switchBtn.bottom + 6
      conditionsHint.left = 0; conditionsHint.top = py; py = conditionsHint.bottom + 12
      displayHeader.left = 0; displayHeader.top = py; py = displayHeader.bottom + 6
      this.labelsBtn.left = 0; this.labelsBtn.top = py; this.formulaBtn.left = halfW + 8; this.formulaBtn.top = py; py = this.labelsBtn.bottom + 12
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
    model.voltageProperty.link(sync); model.resistanceProperty.link(sync); model.switchClosedProperty.link(() => {
      this.switchBtn.setSelected(model.switchClosedProperty.value)
      this.switchBtn.setLabel(model.switchClosedProperty.value ? OhmLawCircuitStrings.switchClosedStringProperty.value : OhmLawCircuitStrings.switchOpenStringProperty.value)
      sync()
    })
    model.scenarioProperty.link(() => {
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(model.scenarioProperty.value === s)
      this.guide.setGuidance(OhmLawCircuitStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[model.scenarioProperty.value])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[model.scenarioProperty.value], () => { this.leftLearnTip.top = this.teachingTriad.bottom + 22 })
      sync()
    })
    model.runningProperty.link(() => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(running ? OhmLawCircuitStrings.pauseButtonStringProperty.value : OhmLawCircuitStrings.playButtonStringProperty.value)
      this.runningToggleBtn.setLabel(running ? OhmLawCircuitStrings.runningOnStringProperty.value : OhmLawCircuitStrings.runningOffStringProperty.value)
      this.runningToggleBtn.setSelected(running)
    })
    model.showLabelsProperty.link(() => { this.labelsBtn.setSelected(model.showLabelsProperty.value); this.labelsBtn.setLabel(model.showLabelsProperty.value ? OhmLawCircuitStrings.labelsOnStringProperty.value : OhmLawCircuitStrings.labelsOffStringProperty.value); this.labelsLayer.visible = model.showLabelsProperty.value })
    model.showFormulaProperty.link(() => { this.formulaBtn.setSelected(model.showFormulaProperty.value); this.formulaBtn.setLabel(model.showFormulaProperty.value ? OhmLawCircuitStrings.formulaOnStringProperty.value : OhmLawCircuitStrings.formulaOffStringProperty.value); sync() })
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(() => { this.starsText.string = `${OhmLawCircuitStrings.starsStringProperty.value} ${model.starsProperty.value}` })
    model.statusProperty.link((status) => { this.statusText.string = status; relayoutPanel() })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.starsProperty.lazyLink((stars, old) => { if (old !== undefined && stars > old) sounds.celebrate() })
    this.teachingTriad.setTriad(...SCENARIO_TRIAD.explore, () => { this.leftLearnTip.top = this.teachingTriad.bottom + 22 })
    sync()
  }

  private drawStage(): void {
    const w = this.stageW; const h = this.stageH; const ox = this.stageLeft; const oy = this.stageTop
    const loop = ohmLoop(w, h).map(p => ({ x: ox + p.x, y: oy + p.y }))
    const mA = this.model.milliamps
    const bright = bulbBrightness(mA)
    const V = this.model.voltageProperty.value
    const R = this.model.resistanceProperty.value
    this.stageLayer.removeAllChildren(); this.labelsLayer.removeAllChildren()
    this.stageLayer.addChild(makeWireLoop(loop, WIRE, 4))
    const left = loop[3]!; const top = loop[0]!; const right = loop[1]!; const bot = loop[2]!
    this.stageLayer.addChild(makeBattery((left.x + top.x) / 2, (left.y + bot.y) / 2, batteryCount(V)))
    const thick = 8 + (R / PHET_RESISTANCE.max) * 14
    this.stageLayer.addChild(makeResistor((top.x + right.x) / 2, top.y, Math.min(w * 0.28, 120), thick))
    this.stageLayer.addChild(makeBulb((right.x + bot.x) / 2, (right.y + bot.y) / 2, this.model.switchClosedProperty.value ? bright : 0))
    this.stageLayer.addChild(makeSwitch((bot.x + left.x) / 2, bot.y, this.model.switchClosedProperty.value))
    if (this.model.showLabelsProperty.value) {
      this.labelsLayer.addChild(makeLabel('Battery', (left.x + top.x) / 2 - 30, (left.y + bot.y) / 2 - 50))
      this.labelsLayer.addChild(makeLabel('Resistor', (top.x + right.x) / 2, top.y - 22, true))
      this.labelsLayer.addChild(makeLabel('Bulb', (right.x + bot.x) / 2 + 24, (right.y + bot.y) / 2 - 8))
      this.labelsLayer.addChild(makeLabel('Switch', (bot.x + left.x) / 2, bot.y + 16, true))
    }
    if (this.model.showFormulaProperty.value) {
      this.captionText.string = `I (${mA.toFixed(1)} mA) = V (${V.toFixed(1)}) / R (${R.toFixed(0)})`
    } else {
      this.captionText.string = this.model.switchClosedProperty.value ? `Current ${mA.toFixed(1)} mA · brightness ${(bright * 100).toFixed(0)}%` : 'Open circuit — I = 0'
    }
    this.captionText.centerX = this.stageCenterX
    // refresh particles
    const count = this.model.switchClosedProperty.value ? Math.min(24, Math.max(0, Math.round(bright * 20))) : 0
    if (this.particleTs.length !== count) this.particleTs = Array.from({ length: count }, (_, i) => i / Math.max(count, 1))
    for (const t of this.particleTs) {
      const p = pointOnLoop(loop, t)
      this.stageLayer.addChild(makeChargeDot(p.x, p.y, bright > 0.7))
    }
  }

  private showTipCard(text: string): void { this.tipBodyText.string = text; this.tipCard.visible = true; this.tipCard.opacity = 1; this.tipTimer = 4.4 }
  private showQuiz(): void {
    this.miniQuiz.showQuiz(OhmLawCircuitStrings.quizQuestionStringProperty.value, [
      { label: OhmLawCircuitStrings.quizCorrectStringProperty.value, correct: true },
      { label: OhmLawCircuitStrings.quizWrongStringProperty.value, correct: false },
    ], (correct) => { correct ? this.sounds.correct() : this.sounds.wrong(); this.model.onQuiz(correct) })
  }
  public override step(dt: number): void {
    this.model.step(dt); this.particles.step(dt)
    if (this.model.runningProperty.value && this.model.switchClosedProperty.value) {
      const speed = bulbBrightness(this.model.milliamps) * 0.55
      this.particleTs = this.particleTs.map(t => (t + speed * dt) % 1)
      this.drawStage()
    }
    if (this.tipTimer > 0) { this.tipTimer -= dt; if (this.tipTimer < 0.6) this.tipCard.opacity = Math.max(0, this.tipTimer / 0.6); if (this.tipTimer <= 0) this.tipCard.visible = false }
  }
}
