import { EmptySelfOptions } from 'scenerystack/phet-core'
import { ScreenView, ScreenViewOptions } from 'scenerystack/sim'
import { Circle, Node, Path, Rectangle, RichText, Text } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { PhetFont, ResetAllButton } from 'scenerystack/scenery-phet'
import { GalaxyTypesModel, GalaxyScenario } from '../model/GalaxyTypesModel.js'
import { UniverseConstants } from '../../../shared/UniverseConstants.js'
import { UniverseColors } from '../../../shared/UniverseColors.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { SoftButton } from '../../../shared/ui/SoftButton.js'
import { StageBackdrop } from '../../../shared/ui/StageBackdrop.js'
import { GuidanceBanner } from '../../../shared/ui/GuidanceBanner.js'
import { ParticleBurst } from '../../../shared/ui/ParticleBurst.js'
import { createPanelTip } from '../../../shared/ui/createPanelTip.js'
import { controlHint, controlSection } from '../../../shared/ui/controlPanelBits.js'
import { ScrollableNode } from '../../../shared/ui/ScrollableNode.js'
import { TeachingTriad } from '../../../shared/ui/TeachingTriad.js'
import { MiniQuiz } from '../../../shared/ui/MiniQuiz.js'
import { UniverseSounds } from '../../../shared/UniverseSounds.js'
import { GalaxyTypesStrings } from '../GalaxyTypesStrings.js'
import { GalaxyType } from '../../../shared/galaxyPhysics.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenViewOptions

const SCENARIOS: readonly GalaxyScenario[] = ['explore', 'spiral', 'elliptical', 'irregular']
const SCENARIO_GUIDE: Record<GalaxyScenario, string> = {
  explore: GalaxyTypesStrings.guideExploreStringProperty.value,
  spiral: GalaxyTypesStrings.guideSpiralStringProperty.value,
  elliptical: GalaxyTypesStrings.guideEllipticalStringProperty.value,
  irregular: GalaxyTypesStrings.guideIrregularStringProperty.value,
}
const SCENARIO_TRIAD: Record<GalaxyScenario, [string, string, string]> = {
  explore: ['Comparing galaxy shapes.', 'Galaxies are classified by form: spiral, elliptical, irregular.', 'Try each type.'],
  spiral: ['Spiral galaxy.', 'Rotating arms mark orbits of stars and gas.', 'Compare with elliptical.'],
  elliptical: ['Elliptical galaxy.', 'Smooth oval of older stars, little gas.', 'Try irregular next.'],
  irregular: ['Irregular galaxy.', 'No clear shape — often from collisions.', 'Return to Explore.'],
}

function makePillLabel(text: string, x: number, y: number, center = true): Node {
  const t = new Text(text, { font: new PhetFont({ size: 11, weight: 'bold' }), fill: '#0f172a' })
  const bg = new Rectangle(-5, -2, t.width + 10, t.height + 4, { cornerRadius: 4, fill: 'rgba(248,250,252,0.92)', stroke: 'rgba(15,23,42,0.12)', lineWidth: 1 })
  const root = new Node({ children: [bg, t], pickable: false })
  t.left = 0; t.top = 0
  if (center) { root.centerX = x; root.centerY = y } else { root.left = x; root.top = y }
  return root
}

export class GalaxyTypesScreenView extends ScreenView {
  private readonly model: GalaxyTypesModel
  private readonly sounds: UniverseSounds
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
  private readonly scenarioButtons: Record<GalaxyScenario, SoftButton>
  private readonly runningToggleBtn: SoftButton; private readonly labelsBtn: SoftButton
  private readonly playPauseBtn: SoftButton; private readonly soundBtn: SoftButton
  private readonly starsText: Text; private readonly statusText: RichText

  public constructor(model: GalaxyTypesModel, providedOptions?: Options) {
    super(providedOptions)
    this.model = model
    const sounds = new UniverseSounds(); this.sounds = sounds
    this.addInputListener({ down: () => sounds.unlock() })
    const m = UniverseConstants.SCREEN_VIEW_X_MARGIN; const my = UniverseConstants.SCREEN_VIEW_Y_MARGIN; const lb = this.layoutBounds
    const leftW = 190; const rightW = 290; const gap = 14
    this.stageLeft = m + leftW + gap; this.stageTop = my + 78
    this.stageW = lb.width - m * 2 - leftW - gap - rightW - gap; this.stageH = lb.height - my * 2 - 78
    this.stageCenterX = this.stageLeft + this.stageW / 2

    this.guide = new GuidanceBanner(lb.width - m * 2, { title: GalaxyTypesStrings.guideTitleStringProperty.value, body: SCENARIO_GUIDE.explore })
    this.guide.left = m; this.guide.top = my; this.addChild(this.guide)
    const leftCard = new DepthCard(leftW, this.stageH, { variant: 'light' }); leftCard.left = m; leftCard.top = this.stageTop; this.addChild(leftCard)
    this.teachingTriad = new TeachingTriad(leftW - 24); this.teachingTriad.left = 12; this.teachingTriad.top = 12; leftCard.content.addChild(this.teachingTriad)
    this.leftLearnTip = createPanelTip(GalaxyTypesStrings.learnMoreStringProperty.value, { width: leftW - 24, fontSize: 11, fill: UniverseColors.panelMuted })
    this.leftLearnTip.left = 12; this.leftLearnTip.top = this.teachingTriad.bottom + 22; leftCard.content.addChild(this.leftLearnTip)

    this.addChild(new StageBackdrop(this.stageLeft, this.stageTop, this.stageW, this.stageH, { top: '#070b18', bottom: '#12102a', gloss: false }))
    this.titleText = new Text(GalaxyTypesStrings.stageTitleStringProperty.value, { font: new PhetFont({ size: 18, weight: 'bold' }), fill: '#f8fafc', centerX: this.stageCenterX, top: this.stageTop + 10 }); this.addChild(this.titleText)
    this.captionText = new Text('', { font: new PhetFont({ size: 14, weight: 'bold' }), fill: '#c4b5fd', centerX: this.stageCenterX, top: this.titleText.bottom + 4 }); this.addChild(this.captionText)
    this.stageLayer = new Node({ pickable: false }); this.labelsLayer = new Node({ pickable: false })
    this.addChild(this.stageLayer); this.addChild(this.labelsLayer)
    this.particles = new ParticleBurst(70); this.addChild(this.particles)

    this.tipCard = new DepthCard(250, 108, { cornerRadius: 12, variant: 'light' }); this.tipCard.centerX = this.stageCenterX; this.tipCard.top = this.stageTop + 12; this.tipCard.visible = false
    this.tipCard.content.addChild(new Text(GalaxyTypesStrings.tipTitleStringProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: UniverseColors.accent, left: 14, top: 10 }))
    this.tipBodyText = new RichText('', { font: new PhetFont(12), fill: UniverseColors.ink, lineWrap: 222, leading: 3, left: 14, top: 30, maxWidth: 222 }); this.tipCard.content.addChild(this.tipBodyText); this.addChild(this.tipCard)
    this.miniQuiz = new MiniQuiz(260); this.miniQuiz.centerX = this.stageCenterX; this.miniQuiz.centerY = this.stageTop + this.stageH * 0.5; this.addChild(this.miniQuiz)

    const card = new DepthCard(rightW, this.stageH); card.left = this.stageLeft + this.stageW + gap; card.top = this.stageTop; this.addChild(card)
    const panelContent = new Node(); const contentW = rightW - 42; const btnH = 32; const gridGap = 6

    const scenarioHeader = controlSection(GalaxyTypesStrings.sectionScenarioStringProperty.value, contentW); panelContent.addChild(scenarioHeader)
    this.scenarioButtons = {} as Record<GalaxyScenario, SoftButton>
    const scenarioLabels: Record<GalaxyScenario, string> = {
      explore: GalaxyTypesStrings.scenarioExploreStringProperty.value,
      spiral: GalaxyTypesStrings.scenarioSpiralStringProperty.value,
      elliptical: GalaxyTypesStrings.scenarioEllipticalStringProperty.value,
      irregular: GalaxyTypesStrings.scenarioIrregularStringProperty.value,
    }
    for (const s of SCENARIOS) {
      const btn = new SoftButton(scenarioLabels[s], () => model.setScenario(s), { width: contentW, height: btnH, fill: s === 'explore' ? UniverseColors.accent : '#64748b', selected: s === 'explore', fontSize: 12, onSound: () => sounds.scenario() })
      this.scenarioButtons[s] = btn; panelContent.addChild(btn)
    }
    const conditionsHeader = controlSection('Motion', contentW); panelContent.addChild(conditionsHeader)
    this.runningToggleBtn = new SoftButton(GalaxyTypesStrings.runningOnStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: btnH, fill: UniverseColors.accent, fontSize: 12, selected: true }); panelContent.addChild(this.runningToggleBtn)
    const conditionsHint = controlHint(GalaxyTypesStrings.conditionsHintStringProperty.value, contentW); panelContent.addChild(conditionsHint)
    const displayHeader = controlSection(GalaxyTypesStrings.sectionDisplayStringProperty.value, contentW); panelContent.addChild(displayHeader)
    this.labelsBtn = new SoftButton(GalaxyTypesStrings.labelsOnStringProperty.value, () => { sounds.softClick(); model.showLabelsProperty.value = !model.showLabelsProperty.value }, { width: contentW, height: btnH, fill: '#64748b', fontSize: 11, selected: true }); panelContent.addChild(this.labelsBtn)
    const playbackHeader = controlSection(GalaxyTypesStrings.sectionPlaybackStringProperty.value, contentW); panelContent.addChild(playbackHeader)
    this.playPauseBtn = new SoftButton(GalaxyTypesStrings.playButtonStringProperty.value, () => { model.togglePlay(); sounds.playPause(model.runningProperty.value) }, { width: contentW, height: 38, fill: UniverseColors.accent, fontSize: 12 }); panelContent.addChild(this.playPauseBtn)
    const soundHeader = controlSection(GalaxyTypesStrings.sectionSoundStringProperty.value, contentW); panelContent.addChild(soundHeader)
    this.soundBtn = new SoftButton(GalaxyTypesStrings.soundOnStringProperty.value, () => { sounds.unlock(); const on = !model.soundEnabledProperty.value; model.soundEnabledProperty.value = on; sounds.toggle(on); if (on) sounds.button(); this.soundBtn.setLabel(on ? GalaxyTypesStrings.soundOnStringProperty.value : GalaxyTypesStrings.soundOffStringProperty.value) }, { width: contentW, height: btnH, fill: '#64748b', fontSize: 12 }); panelContent.addChild(this.soundBtn)
    const statusHeader = controlSection(GalaxyTypesStrings.sectionStatusStringProperty.value, contentW); panelContent.addChild(statusHeader)
    this.starsText = new Text('', { font: new PhetFont({ size: 15, weight: 'bold' }), fill: '#d97706' }); panelContent.addChild(this.starsText)
    this.statusText = new RichText(model.statusProperty.value, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: UniverseColors.panelText, lineWrap: contentW, leading: 3 }); panelContent.addChild(this.statusText)
    const learnTip = createPanelTip(GalaxyTypesStrings.learnMoreStringProperty.value, { width: contentW, fontSize: 11 }); panelContent.addChild(learnTip)
    const bottomPad = new Rectangle(0, 0, contentW, 20, { fill: 'rgba(255,255,255,0)', pickable: false }); panelContent.addChild(bottomPad)

    const relayoutPanel = () => {
      let py = 4
      scenarioHeader.left = 0; scenarioHeader.top = py; py = scenarioHeader.bottom + 6
      for (const s of SCENARIOS) { const btn = this.scenarioButtons[s]; btn.left = 0; btn.top = py; py = btn.bottom + gridGap }
      py += 6; conditionsHeader.left = 0; conditionsHeader.top = py; py = conditionsHeader.bottom + 6
      this.runningToggleBtn.left = 0; this.runningToggleBtn.top = py; py = this.runningToggleBtn.bottom + gridGap
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
    this.addChild(new ResetAllButton({ listener: () => { sounds.resetAll(); model.reset(); this.particles.clear() }, right: lb.right - m, bottom: lb.bottom - my }))

    const sync = () => this.drawStage()
    model.rotationProperty.link(sync)
    model.selectedTypeProperty.link(sync)
    model.scenarioProperty.link(() => {
      for (const s of SCENARIOS) this.scenarioButtons[s].setSelected(model.scenarioProperty.value === s)
      this.guide.setGuidance(GalaxyTypesStrings.guideTitleStringProperty.value, SCENARIO_GUIDE[model.scenarioProperty.value])
      this.teachingTriad.setTriad(...SCENARIO_TRIAD[model.scenarioProperty.value], () => { this.leftLearnTip.top = this.teachingTriad.bottom + 22 })
      sync()
    })
    model.runningProperty.link(() => {
      const running = model.runningProperty.value
      this.playPauseBtn.setLabel(running ? GalaxyTypesStrings.pauseButtonStringProperty.value : GalaxyTypesStrings.playButtonStringProperty.value)
      this.runningToggleBtn.setLabel(running ? GalaxyTypesStrings.runningOnStringProperty.value : GalaxyTypesStrings.runningOffStringProperty.value)
      this.runningToggleBtn.setSelected(running)
    })
    model.showLabelsProperty.link(() => { this.labelsBtn.setSelected(model.showLabelsProperty.value); this.labelsBtn.setLabel(model.showLabelsProperty.value ? GalaxyTypesStrings.labelsOnStringProperty.value : GalaxyTypesStrings.labelsOffStringProperty.value); this.labelsLayer.visible = model.showLabelsProperty.value })
    model.soundEnabledProperty.link((on) => sounds.setEnabled(on))
    model.starsProperty.link(() => { this.starsText.string = `${GalaxyTypesStrings.starsStringProperty.value} ${model.starsProperty.value}` })
    model.statusProperty.link((status) => { this.statusText.string = status; relayoutPanel() })
    model.tipTextProperty.lazyLink(() => this.showTipCard(model.tipTextProperty.value))
    model.quizPromptsProperty.lazyLink(() => this.showQuiz())
    model.starsProperty.lazyLink((stars, old) => { if (old !== undefined && stars > old) sounds.celebrate() })
    this.teachingTriad.setTriad(...SCENARIO_TRIAD.explore, () => { this.leftLearnTip.top = this.teachingTriad.bottom + 22 })
    sync()
  }

  private drawStage(): void {
    const w = this.stageW; const h = this.stageH; const ox = this.stageLeft; const oy = this.stageTop
    const cx = ox + w * 0.5; const cy = oy + h * 0.52
    const info = this.model.selectedInfo
    const rot = (this.model.rotationProperty.value * Math.PI) / 180
    this.stageLayer.removeAllChildren(); this.labelsLayer.removeAllChildren()
    for (let i = 0; i < 36; i++) {
      this.stageLayer.addChild(new Circle(0.7 + (i % 3) * 0.4, { fill: 'rgba(255,255,255,0.5)', centerX: ox + 10 + (i * 53) % (w - 20), centerY: oy + 36 + (i * 29) % (h - 70) }))
    }
    this.drawGalaxy(cx, cy, info.id, rot)
    if (this.model.showLabelsProperty.value) {
      this.labelsLayer.addChild(makePillLabel(info.label, cx, cy - 100))
    }
    this.captionText.string = `${info.label} — ${info.description}`
    this.captionText.maxWidth = w - 24
    this.captionText.centerX = this.stageCenterX
  }

  private drawGalaxy(cx: number, cy: number, type: GalaxyType, rot: number): void {
    if (type === 'spiral') {
      this.stageLayer.addChild(new Circle(26, { fill: 'rgba(255,213,79,0.35)', centerX: cx, centerY: cy }))
      this.stageLayer.addChild(new Circle(16, { fill: '#fff8e1', centerX: cx, centerY: cy }))
      for (let arm = 0; arm < 2; arm++) {
        const shape = new Shape()
        for (let t = 0; t <= 1; t += 0.04) {
          const angle = t * Math.PI * 3 + arm * Math.PI + rot
          const r = 10 + t * 70
          const x = cx + Math.cos(angle) * r
          const y = cy + Math.sin(angle) * r * 0.55
          if (t === 0) shape.moveTo(x, y); else shape.lineTo(x, y)
        }
        this.stageLayer.addChild(new Path(shape, { stroke: 'rgba(180,200,255,0.55)', lineWidth: 10, lineCap: 'round' }))
      }
      for (let i = 0; i < 50; i++) {
        const angle = ((i * 137.5) / 180) * Math.PI + rot
        const r = 12 + (i % 18) * 3.5
        this.stageLayer.addChild(new Circle(0.9, { fill: 'rgba(255,255,255,0.65)', centerX: cx + Math.cos(angle) * r, centerY: cy + Math.sin(angle) * r * 0.55 }))
      }
    } else if (type === 'elliptical') {
      this.stageLayer.addChild(new Path(new Shape().ellipse(cx, cy, 70, 42, 0.3), { fill: 'rgba(188,170,164,0.85)' }))
      this.stageLayer.addChild(new Path(new Shape().ellipse(cx, cy, 40, 24, 0.3), { fill: 'rgba(255,224,130,0.7)' }))
    } else {
      const blobs = [{ dx: -40, dy: -10, r: 28, c: 'rgba(129,199,132,0.55)' }, { dx: 30, dy: 15, r: 34, c: 'rgba(100,181,246,0.5)' }, { dx: 5, dy: -35, r: 22, c: 'rgba(206,147,216,0.5)' }]
      for (const b of blobs) this.stageLayer.addChild(new Circle(b.r, { fill: b.c, centerX: cx + b.dx, centerY: cy + b.dy }))
      for (let i = 0; i < 40; i++) {
        this.stageLayer.addChild(new Circle(1.2, { fill: '#fff', centerX: cx + ((i * 37) % 120) - 60, centerY: cy + ((i * 53) % 90) - 45 }))
      }
    }
  }

  private showTipCard(text: string): void { this.tipBodyText.string = text; this.tipCard.visible = true; this.tipCard.opacity = 1; this.tipTimer = 4.4 }
  private showQuiz(): void {
    this.miniQuiz.showQuiz(GalaxyTypesStrings.quizQuestionStringProperty.value, [
      { label: GalaxyTypesStrings.quizCorrectStringProperty.value, correct: true },
      { label: GalaxyTypesStrings.quizWrongStringProperty.value, correct: false },
    ], (correct) => { correct ? this.sounds.correct() : this.sounds.wrong(); this.model.onQuiz(correct) })
  }
  public override step(dt: number): void {
    this.model.step(dt); this.particles.step(dt)
    if (this.model.runningProperty.value) this.drawStage()
    if (this.tipTimer > 0) { this.tipTimer -= dt; if (this.tipTimer < 0.6) this.tipCard.opacity = Math.max(0, this.tipTimer / 0.6); if (this.tipTimer <= 0) this.tipCard.visible = false }
  }
}
