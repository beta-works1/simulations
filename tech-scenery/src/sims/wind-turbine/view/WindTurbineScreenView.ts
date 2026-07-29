import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { WindTurbineModel, WindScenario } from '../model/WindTurbineModel.js'
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
import { WindTurbineStrings } from '../WindTurbineStrings.js'
import { MAX_WIND, MIN_WIND, mechanicalPowerKw } from '../../../shared/windPhysics.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SCENARIOS: readonly WindScenario[] = ['explore', 'breezy', 'gale']
const SCENARIO_GUIDE: Record<WindScenario, string> = {
  explore: WindTurbineStrings.guideExploreStringProperty.value,
  breezy: WindTurbineStrings.guideBreezyStringProperty.value,
  gale: WindTurbineStrings.guideGaleStringProperty.value,
}
const SCENARIO_TRIAD: Record<WindScenario, [string, string, string]> = {
  explore: ['Exploring wind power.', 'Wind spins blades; a generator makes electricity.', 'Try Gale for high output.'],
  breezy: ['Light wind.', 'Near cut-in speed, RPM and power stay low.', 'Raise wind toward Gale.'],
  gale: ['Strong wind.', 'Power rises steeply with wind speed.', 'Compare mechanical vs electrical readout.'],
}

function makePillLabel(text: string, x: number, y: number, center = true): Node {
  const t = new Text(text, { font: new PhetFont({ size: 11, weight: 'bold' }), fill: '#0f172a' })
  const bg = new Rectangle(-5, -2, t.width + 10, t.height + 4, { cornerRadius: 4, fill: 'rgba(248,250,252,0.92)', stroke: 'rgba(15,23,42,0.12)', lineWidth: 1 })
  const root = new Node({ children: [bg, t], pickable: false })
  t.left = 0; t.top = 0
  if (center) { root.centerX = x; root.centerY = y } else { root.left = x; root.top = y }
  return root
}

export class WindTurbineScreenView extends ScreenView {
  private readonly model: WindTurbineModel
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
  private readonly stageLayer: Node; private readonly bladesNode: Node; private readonly labelsLayer: Node; private readonly readoutLayer: Node
  private readonly captionText: Text; private readonly titleText: Text
  private readonly scenarioButtons: Record<WindScenario, SoftButton>
  private readonly runningToggleBtn: SoftButton; private readonly labelsBtn: SoftButton; private readonly readoutBtn: SoftButton
  private readonly playPauseBtn: SoftButton; private readonly soundBtn: SoftButton
  private readonly starsText: Text; private readonly statusText: RichText

  public constructor(model: WindTurbineModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    const sounds = new TechSounds(); this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })
    const m = TechConstants.SCREEN_VIEW_X_MARGIN; const my = TechConstants.SCREEN_VIEW_Y_MARGIN; const lb = this.layoutBounds
    const leftW = 190; const rightW = 290; const gap = 14
    this.stageLeft = m + leftW + gap; this.stageTop = my + 78
    this.stageW = lb.width - m * 2 - leftW - gap - rightW - gap; this.stageH = lb.height - my * 2 - 78
    this.stageCenterX = this.stageLeft + this.stageW / 2

    this.guide = new GuidanceBanner(lb.width - m * 2, { title: WindTurbineStrings.guideTitleStringProperty.value, body: SCENARIO_GUIDE.explore })
    this.guide.left = m; this.guide.top = my; this.addChild(this.guide)
    const leftCard = new DepthCard(leftW, this.stageH, { variant: 'light' }); leftCard.left = m; leftCard.top = this.stageTop; this.addChild(leftCard)
    this.teachingTriad = new TeachingTriad(leftW - 24); this.teachingTriad.left = 12; this.teachingTriad.top = 12; leftCard.content.addChild(this.teachingTriad)
    this.leftLearnTip = createPanelTip(WindTurbineStrings.learnMoreStringProperty.value, { width: leftW - 24, fontSize: 11, fill: TechColors.panelMuted })
    this.leftLearnTip.left = 12; this.leftLearnTip.top = this.teachingTriad.bottom + 22; leftCard.content.addChild(this.leftLearnTip)

    this.addChild(new StageBackdrop(this.stageLeft, this.stageTop, this.stageW, this.stageH, { top: '#7dd3fc', bottom: '#fde68a' }))
    this.titleText = new Text(WindTurbineStrings.stageTitleStringProperty.value, { font: new PhetFont({ size: 18, weight: 'bold' }), fill: '#0f172a', centerX: this.stageCenterX, top: this.stageTop + 10 }); this.addChild(this.titleText)
    this.captionText = new Text('', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: TechColors.accent, centerX: this.stageCenterX, top: this.titleText.bottom + 4 }); this.addChild(this.captionText)
    this.stageLayer = new Node({ pickable: false }); this.bladesNode = new Node({ pickable: false }); this.labelsLayer = new Node({ pickable: false }); this.readoutLayer = new Node({ pickable: false })
    this.addChild(this.stageLayer); this.addChild(this.bladesNode); this.addChild(this.readoutLayer); this.addChild(this.labelsLayer)
    this.particles = new ParticleBurst(70); this.addChild(this.particles)

    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' }); this.tipCard.centerX = this.stageCenterX; this.tipCard.top = this.stageTop + 12; this.tipCard.visible = false
    this.tipCard.content.addChild(new Text(WindTurbineStrings.tipTitleStringProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: TechColors.accent, left: 14, top: 10 }))
    this.tipBodyText = new RichText('', { font: new PhetFont(12), fill: TechColors.ink, lineWrap: 222, leading: 3, left: 14, top: 30, maxWidth: 222 }); this.tipCard.content.addChild(this.tipBodyText); this.addChild(this.tipCard)
    this.miniQuiz = new MiniQuiz(260); this.miniQuiz.centerX = this.stageCenterX; this.miniQuiz.centerY = this.stageTop + this.stageH * 0.5; this.addChild(this.miniQuiz)

    const card = new DepthCard(rightW, this.stageH); card.left = this.stageLeft + this.stageW + gap; card.top = this.stageTop; this.addChild(card)
    const panelContent = new Node(); const contentW = rightW - 42; const halfW = (contentW - 8) / 2; const btnH = 32; const gridGap = 6

    const scenarioHeader = controlSection(WindTurbineStrings.sectionScenarioStringProperty.value, contentW); panelContent.addChild(scenarioHeader)
    this.scenarioButtons = {} as Record<WindScenario, SoftButton>
    const scenarioLabels: Record<WindScenario, string> = {
      explore: WindTurbineStrings.scenarioExploreStringProperty.value,
      breezy: WindTurbineStrings.scenarioBreezyStringProperty.value,
      gale: WindTurbineStrings.scenarioGaleStringProperty.value,
    }
    for (const s of SCENARIOS) {
      const btn = new SoftButton(scenarioLabels[s], () => model.setScenario(s), { width: contentW, height: btnH, fill: s === 'explore' ? TechColors.accent : '#64748b', selected: s === 'explore', fontSize: 12, onSound: () => sounds.scenario() })
      this.scenarioButtons[s] = btn; panelContent.addChild(btn)
    }
    const conditionsHeader = controlSection(WindTurbineStrings.sectionConditionsStringProperty.value, contentW); panelContent.addChild(conditionsHeader)
    this.runningToggleBtn = new SoftButton(WindTurbineStrings.runningOnStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: btnH, fill: TechColors.accent, fontSize: 12, selected: true }); panelContent.addChild(this.runningToggleBtn)
    const windSlider = new DepthSlider(model.windSpeedProperty, { min: MIN_WIND, max: MAX_WIND, width: contentW, label: WindTurbineStrings.windSliderStringProperty.value, format: (n) => `${n.toFixed(1)} m/s`, fill: '#38bdf8', onTick: () => sounds.sliderTick() }); panelContent.addChild(windSlider)
    const conditionsHint = controlHint(WindTurbineStrings.conditionsHintStringProperty.value, contentW); panelContent.addChild(conditionsHint)
    const displayHeader = controlSection(WindTurbineStrings.sectionDisplayStringProperty.value, contentW); panelContent.addChild(displayHeader)
    this.labelsBtn = new SoftButton(WindTurbineStrings.labelsOnStringProperty.value, () => { sounds.softClick(); model.showLabelsProperty.value = !model.showLabelsProperty.value }, { width: halfW, height: btnH, fill: '#64748b', fontSize: 11, selected: true }); panelContent.addChild(this.labelsBtn)
    this.readoutBtn = new SoftButton(WindTurbineStrings.readoutOnStringProperty.value, () => { sounds.softClick(); model.showReadoutProperty.value = !model.showReadoutProperty.value }, { width: halfW, height: btnH, fill: '#0ea5e9', fontSize: 10, selected: true }); panelContent.addChild(this.readoutBtn)
    const playbackHeader = controlSection(WindTurbineStrings.sectionPlaybackStringProperty.value, contentW); panelContent.addChild(playbackHeader)
    this.playPauseBtn = new SoftButton(WindTurbineStrings.playButtonStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: 38, fill: TechColors.accent, fontSize: 12 }); panelContent.addChild(this.playPauseBtn)
    const soundHeader = controlSection(WindTurbineStrings.sectionSoundStringProperty.value, contentW); panelContent.addChild(soundHeader)
    this.soundBtn = new SoftButton(WindTurbineStrings.soundOnStringProperty.value, () => { sounds.unlock(); const on = !model.soundEnabledProperty.value; model.soundEnabledProperty.value = on; sounds.toggle(on); if (on) sounds.button(); this.soundBtn.setLabel(on ? WindTurbineStrings.soundOnStringProperty.value : WindTurbineStrings.soundOffStringProperty.value) }, { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 }); panelContent.addChild(this.soundBtn)
    const statusHeader = controlSection(WindTurbineStrings.sectionStatusStringProperty.value, contentW); panelContent.addChild(statusHeader)
    this.starsText = new Text('', { font: new PhetFont({ size: 15, weight: 'bold' }), fill: '#d97706' }); panelContent.addChild(this.starsText)
    this.statusText = new RichText(model.statusProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: TechColors.panelText, lineWrap: contentW, leading: 3 }); panelContent.addChild(this.statusText)
    const learnTip = createPanelTip(WindTurbineStrings.learnMoreStringProperty.value, { width: contentW, fontSize: 11 }); panelContent.addChild(learnTip)
    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false }); panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      scenarioHeader.left = 0; scenarioHeader.top = py; py = scenarioHeader.bottom + 6
      for (const s of SCENARIOS) { const btn = this.scenarioButtons[s]; btn.left = 0; btn.top = py; py = btn.bottom + gridGap }
      py += 6; conditionsHeader.left = 0; conditionsHeader.top = py; py = conditionsHeader.bottom + 6
      this.runningToggleBtn.left = 0; this.runningToggleBtn.top = py; py = this.runningToggleBtn.bottom + gridGap
      windSlider.left = 0; windSlider.top = py; py = windSlider.bottom + 6
      conditionsHint.left = 0; conditionsHint.top = py; py = conditionsHint.bottom + 12
      displayHeader.left = 0; displayHeader.top = py; py = displayHeader.bottom + 6
      this.labelsBtn.left = 0; this.labelsBtn.top = py; this.readoutBtn.left = halfW + 8; this.readoutBtn.top = py; py = this.labelsBtn.bottom + 12
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
    model.windSpeedProperty.link(sync)
    model.bladeAngleProperty.link(() => { this.bladesNode.rotation = (model.bladeAngleProperty.value * Math.PI) / 180 })
    model.scenarioProperty.link(() => {
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(model.scenarioProperty.value === s)
      this.guide.setGuidance(WindTurbineStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[model.scenarioProperty.value])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[model.scenarioProperty.value], () => { this.leftLearnTip.top = this.teachingTriad.bottom + 22 })
      sync()
    })
    model.runningProperty.link(() => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(running ? WindTurbineStrings.pauseButtonStringProperty.value : WindTurbineStrings.playButtonStringProperty.value)
      this.runningToggleBtn.setLabel(running ? WindTurbineStrings.runningOnStringProperty.value : WindTurbineStrings.runningOffStringProperty.value)
      this.runningToggleBtn.setSelected(running)
    })
    model.showLabelsProperty.link(() => { this.labelsBtn.setSelected(model.showLabelsProperty.value); this.labelsBtn.setLabel(model.showLabelsProperty.value ? WindTurbineStrings.labelsOnStringProperty.value : WindTurbineStrings.labelsOffStringProperty.value); this.labelsLayer.visible = model.showLabelsProperty.value })
    model.showReadoutProperty.link(() => { this.readoutBtn.setSelected(model.showReadoutProperty.value); this.readoutBtn.setLabel(model.showReadoutProperty.value ? WindTurbineStrings.readoutOnStringProperty.value : WindTurbineStrings.readoutOffStringProperty.value); this.readoutLayer.visible = model.showReadoutProperty.value })
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(() => { this.starsText.string = `${WindTurbineStrings.starsStringProperty.value} ${model.starsProperty.value}` })
    model.statusProperty.link((status) => { this.statusText.string = status; relayoutPanel() })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.starsProperty.lazyLink((stars, old) => { if (old !== undefined && stars > old) sounds.celebrate() })
    this.teachingTriad.setTriad(...SCENARIO_TRIAD.explore, () => { this.leftLearnTip.top = this.teachingTriad.bottom + 22 })
    sync()
  }

  private drawStage(): void {
    const w = this.stageW; const h = this.stageH; const ox = this.stageLeft; const oy = this.stageTop
    const wind = this.model.windSpeedProperty.value
    const rpm = this.model.rpm
    this.stageLayer.removeAllChildren(); this.bladesNode.removeAllChildren(); this.labelsLayer.removeAllChildren(); this.readoutLayer.removeAllChildren()

    this.stageLayer.addChild(new Rectangle(ox, oy + h * 0.65, w, h * 0.35, { fill: '#4ade80' }))
    for (let i = 0; i < 5; i++) {
      const y = oy + h * 0.28 + i * 14
      this.stageLayer.addChild(new Path(new Shape().moveTo(ox + 20, y).lineTo(ox + 20 + wind * 8 + i * 6, y), { stroke: 'rgba(255,255,255,0.45)', lineWidth: 2 }))
    }

    const towerX = ox + w * 0.38; const towerBase = oy + h * 0.65; const hubY = oy + h * 0.28
    this.stageLayer.addChild(new Path(new Shape().moveTo(towerX - 14, towerBase).lineTo(towerX + 14, towerBase).lineTo(towerX + 6, hubY + 20).lineTo(towerX - 6, hubY + 20).close(), { fill: '#64748b' }))

    if (rpm > 0.5) {
      this.stageLayer.addChild(new Circle(28 + Math.min(rpm, 30) * 0.5, { fill: `rgba(125,211,252,${0.12 + Math.min(rpm, 30) * 0.008})`, centerX: towerX, centerY: hubY }))
    }
    for (let b = 0; b < 3; b++) {
      const blade = new Path(new Shape().moveTo(0, 0).quadraticCurveTo(18, -55, 8, -110).quadraticCurveTo(0, -115, -8, -110).quadraticCurveTo(-18, -55, 0, 0), { fill: '#e2e8f0' })
      blade.rotation = (b * Math.PI * 2) / 3
      this.bladesNode.addChild(blade)
    }
    this.bladesNode.addChild(new Circle(10, { fill: '#334155' }))
    this.bladesNode.x = towerX; this.bladesNode.y = hubY
    this.bladesNode.rotation = (this.model.bladeAngleProperty.value * Math.PI) / 180

    if (this.model.showReadoutProperty.value) {
      const boxX = ox + w * 0.58; const boxY = oy + h * 0.18; const boxW = w * 0.34; const boxH = h * 0.36
      this.readoutLayer.addChild(new Rectangle(boxX, boxY, boxW, boxH, { cornerRadius: 10, fill: 'rgba(15,23,42,0.82)', stroke: 'rgba(56,189,248,0.4)', lineWidth: 1.5 }))
      this.readoutLayer.addChild(new Text('Output', { font: new PhetFont({ size: 13, weight: 'bold' }), fill: '#7dd3fc', left: boxX + 12, top: boxY + 10 }))
      this.readoutLayer.addChild(new Text(`${this.model.powerLabel}`, { font: new PhetFont({ size: 22, weight: 'bold' }), fill: '#f8fafc', left: boxX + 12, top: boxY + 34 }))
      this.readoutLayer.addChild(new Text(`${rpm.toFixed(0)} RPM`, { font: new PhetFont({ size: 14, weight: 'bold' }), fill: '#94a3b8', left: boxX + 12, top: boxY + 68 }))
      this.readoutLayer.addChild(new Text(`Mech ${mechanicalPowerKw(wind).toFixed(0)} kW`, { font: new PhetFont({ size: 12 }), fill: '#cbd5e1', left: boxX + 12, top: boxY + 96 }))
      this.readoutLayer.addChild(new Text(`Wind ${wind.toFixed(1)} m/s`, { font: new PhetFont({ size: 12 }), fill: '#cbd5e1', left: boxX + 12, top: boxY + 116 }))
    }

    if (this.model.showLabelsProperty.value) {
      this.labelsLayer.addChild(makePillLabel('Blades', towerX, hubY - 90))
      this.labelsLayer.addChild(makePillLabel('Tower', towerX + 28, (hubY + towerBase) / 2, false))
      this.labelsLayer.addChild(makePillLabel('Wind →', ox + 40, oy + h * 0.22, false))
    }

    this.captionText.string = wind < 3
      ? 'Below cut-in — no useful power yet'
      : `${wind.toFixed(1)} m/s · ${rpm.toFixed(0)} RPM · ${this.model.powerLabel}`
    this.captionText.centerX = this.stageCenterX
  }

  private showTipCard(text: string): void { this.tipBodyText.string = text; this.tipCard.visible = true; this.tipCard.opacity = 1; this.tipTimer = 4.4 }
  private showQuiz(): void {
    this.miniQuiz.showQuiz(WindTurbineStrings.quizQuestionStringProperty.value, [
      { label: WindTurbineStrings.quizCorrectStringProperty.value, correct: true },
      { label: WindTurbineStrings.quizWrongStringProperty.value, correct: false },
    ], (correct) => { correct ? this.sounds.correct() : this.sounds.wrong(); this.model.onQuiz(correct) })
  }
  public override step(dt: number): void {
    this.model.step(dt); this.particles.step(dt)
    if (this.model.runningProperty.value) this.drawStage()
    if (this.tipTimer > 0) { this.tipTimer -= dt; if (this.tipTimer < 0.6) this.tipCard.opacity = Math.max(0, this.tipTimer / 0.6); if (this.tipTimer <= 0) this.tipCard.visible = false }
  }
}
