import { Node, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { WarmingModel, WARMING_SCENARIOS } from '../model/WarmingModel.js'
import { WarmingSounds } from './WarmingSounds.js'
import { DepthCard } from '../../../shared/ui/DepthCard.js'
import { DepthSlider } from '../../../shared/ui/DepthSlider.js'
import { SoftButton } from '../../../shared/ui/SoftButton.js'
import { ScrollableNode } from '../../../shared/ui/ScrollableNode.js'
import { controlSection, controlHint } from '../../../shared/ui/controlPanelBits.js'
import { EcologyColors } from '../../../shared/EcologyColors.js'

type Options = {
  width: number
  height: number
  onQuickCheck?: () => void
}

/**
 * Dense, scrollable SoftButton/DepthSlider control panel (Ch2 teaching-shell density).
 * Keeps every original warming knob and adds sky/cloud/albedo, display, and playback controls.
 */
export class WarmingControlPanel extends DepthCard {
  public constructor(model: WarmingModel, sounds: WarmingSounds, options: Options) {
    super(options.width, options.height, {})

    const contentW = options.width - 32
    const halfW = (contentW - 8) / 2
    const btnH = 32
    const gridGap = 6

    const panelContent = new Node()

    const titleText = new Text('Controls', {
      font: new PhetFont({ size: 16, weight: 'bold' }),
      fill: '#ecfeff',
      maxWidth: contentW,
    })
    panelContent.addChild(titleText)

    // ── Section 1 — Gas blanket (CO₂) ─────────────────────────────────────────
    const gasHeader = controlSection('Gas blanket (CO₂)', contentW)
    panelContent.addChild(gasHeader)

    const co2Slider = new DepthSlider(model.co2LevelProperty, {
      min: 0.05,
      max: 1,
      width: contentW,
      label: 'Gas blanket',
      format: n => `${Math.round(n * 100)}%`,
      fill: EcologyColors.co2,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(co2Slider)

    const thinnerBtn = new SoftButton(
      '− Thinner',
      () => {
        model.nudgeCo2(-0.1)
        sounds.button()
      },
      { width: halfW, height: btnH, fill: '#2980b9', fontSize: 12 },
    )
    const thickerBtn = new SoftButton(
      '+ Thicker',
      () => {
        model.nudgeCo2(0.1)
        sounds.button()
      },
      { width: halfW, height: btnH, fill: '#c0392b', fontSize: 12 },
    )
    panelContent.addChild(thinnerBtn)
    panelContent.addChild(thickerBtn)

    // ── Section 2 — Sky & clouds ───────────────────────────────────────────────
    const skyHeader = controlSection('Sky & clouds', contentW)
    panelContent.addChild(skyHeader)

    const cloudSlider = new DepthSlider(model.cloudCoverProperty, {
      min: 0,
      max: 1,
      width: contentW,
      label: 'Cloud cover',
      format: n => `${Math.round(n * 100)}%`,
      fill: EcologyColors.o2,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(cloudSlider)

    const albedoSlider = new DepthSlider(model.albedoProperty, {
      min: 0,
      max: 1,
      width: contentW,
      label: 'Surface albedo',
      format: n => `${Math.round(n * 100)}%`,
      fill: '#94a3b8',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(albedoSlider)

    const reflectionHint = controlHint('More clouds/albedo reflect sunlight → less warming.', contentW)
    panelContent.addChild(reflectionHint)

    // ── Section 3 — Try a story ────────────────────────────────────────────────
    const storyHeader = controlSection('Try a story', contentW)
    panelContent.addChild(storyHeader)

    const storyColors: Record<string, string> = {
      today: '#d4a017',
      clean: '#2980b9',
      factories: '#c0392b',
      trees: '#1e8449',
    }
    const storyButtons = WARMING_SCENARIOS.map(s => {
      const button = new SoftButton(
        s.name.replace(/^\d+\.\s*/, ''),
        () => {
          model.applyScenario(s.id)
          sounds.scenario()
        },
        { width: halfW, height: btnH, fill: storyColors[s.id] ?? EcologyColors.accent, fontSize: 11, selected: model.scenarioIdProperty.value === s.id },
      )
      panelContent.addChild(button)
      return { id: s.id, button }
    })

    // ── Section 4 — Display ────────────────────────────────────────────────────
    const displayHeader = controlSection('Display', contentW)
    panelContent.addChild(displayHeader)

    const labelsBtn = new SoftButton(
      model.showLabelsProperty.value ? 'Labels: On' : 'Labels: Off',
      () => {
        model.showLabelsProperty.value = !model.showLabelsProperty.value
        sounds.softClick()
      },
      { width: halfW, height: btnH, fill: '#64748b', selected: model.showLabelsProperty.value, fontSize: 11 },
    )
    const autoDayBtn = new SoftButton(
      model.autoDayProperty.value ? 'Auto day: On' : 'Auto day: Off',
      () => {
        model.autoDayProperty.value = !model.autoDayProperty.value
        sounds.toggle(model.autoDayProperty.value)
      },
      { width: halfW, height: btnH, fill: '#f59e0b', selected: model.autoDayProperty.value, fontSize: 11 },
    )
    panelContent.addChild(labelsBtn)
    panelContent.addChild(autoDayBtn)

    // ── Section 5 — Playback ───────────────────────────────────────────────────
    const playbackHeader = controlSection('Playback', contentW)
    panelContent.addChild(playbackHeader)

    const simSpeedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: 'Sim speed',
      format: n => `${n.toFixed(2)}×`,
      fill: EcologyColors.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(simSpeedSlider)

    const particleSlider = new DepthSlider(model.particleIntensityProperty, {
      min: 0,
      max: 2,
      width: contentW,
      label: 'Particle intensity',
      format: n => `${n.toFixed(1)}×`,
      fill: '#f97316',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(particleSlider)

    const playPauseBtn = new SoftButton(
      model.runningProperty.value ? 'Pause' : 'Play',
      () => {
        model.runningProperty.value = !model.runningProperty.value
        sounds.playPause(model.runningProperty.value)
      },
      { width: contentW, height: btnH, fill: '#7c3aed', fontSize: 12 },
    )
    panelContent.addChild(playPauseBtn)

    // ── Section 6 — Sound ──────────────────────────────────────────────────────
    const soundHeader = controlSection('Sound', contentW)
    panelContent.addChild(soundHeader)

    const soundBtn = new SoftButton(
      model.soundEnabledProperty.value ? 'Sound: On' : 'Sound: Off',
      () => {
        sounds.unlock()
        model.soundEnabledProperty.value = !model.soundEnabledProperty.value
        sounds.setEnabled(model.soundEnabledProperty.value)
        if (model.soundEnabledProperty.value) sounds.button()
      },
      { width: contentW, height: btnH, fill: '#64748b', selected: model.soundEnabledProperty.value, fontSize: 12 },
    )
    panelContent.addChild(soundBtn)

    // ── Section 7 — Check + status ─────────────────────────────────────────────
    const quickCheckBtn = new SoftButton(
      'Quick check',
      () => {
        sounds.softClick()
        options.onQuickCheck?.()
      },
      { width: contentW, height: btnH, fill: '#0d9488', fontSize: 12 },
    )
    panelContent.addChild(quickCheckBtn)

    const statusText = new Text('', {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#e2e8f0',
      maxWidth: contentW,
    })
    panelContent.addChild(statusText)

    const bottomPad = new Node()
    panelContent.addChild(bottomPad)

    const relayout = (): void => {
      let py = 0
      titleText.left = 0
      titleText.top = py
      py = titleText.bottom + 10

      gasHeader.left = 0
      gasHeader.top = py
      py = gasHeader.bottom + 6
      co2Slider.left = 0
      co2Slider.top = py
      py = co2Slider.bottom + 8
      thinnerBtn.left = 0
      thinnerBtn.top = py
      thickerBtn.left = halfW + 8
      thickerBtn.top = py
      py = thinnerBtn.bottom + 12

      skyHeader.left = 0
      skyHeader.top = py
      py = skyHeader.bottom + 6
      cloudSlider.left = 0
      cloudSlider.top = py
      py = cloudSlider.bottom + 8
      albedoSlider.left = 0
      albedoSlider.top = py
      py = albedoSlider.bottom + 6
      reflectionHint.left = 0
      reflectionHint.top = py
      py = reflectionHint.bottom + 12

      storyHeader.left = 0
      storyHeader.top = py
      py = storyHeader.bottom + 6
      storyButtons.forEach((entry, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        entry.button.left = col === 0 ? 0 : halfW + 8
        entry.button.top = py + row * (btnH + gridGap)
      })
      py += Math.ceil(storyButtons.length / 2) * (btnH + gridGap) - gridGap + 12

      displayHeader.left = 0
      displayHeader.top = py
      py = displayHeader.bottom + 6
      labelsBtn.left = 0
      labelsBtn.top = py
      autoDayBtn.left = halfW + 8
      autoDayBtn.top = py
      py = labelsBtn.bottom + 12

      playbackHeader.left = 0
      playbackHeader.top = py
      py = playbackHeader.bottom + 6
      simSpeedSlider.left = 0
      simSpeedSlider.top = py
      py = simSpeedSlider.bottom + 8
      particleSlider.left = 0
      particleSlider.top = py
      py = particleSlider.bottom + 8
      playPauseBtn.left = 0
      playPauseBtn.top = py
      py = playPauseBtn.bottom + 12

      soundHeader.left = 0
      soundHeader.top = py
      py = soundHeader.bottom + 6
      soundBtn.left = 0
      soundBtn.top = py
      py = soundBtn.bottom + 12

      quickCheckBtn.left = 0
      quickCheckBtn.top = py
      py = quickCheckBtn.bottom + 8
      statusText.left = 0
      statusText.top = py
      py = statusText.bottom + 16

      bottomPad.left = 0
      bottomPad.top = py
    }
    relayout()

    const syncStories = (): void => {
      const id = model.scenarioIdProperty.value
      for (const entry of storyButtons) {
        entry.button.setSelected(entry.id === id)
      }
    }
    const syncLabels = (): void => {
      labelsBtn.setSelected(model.showLabelsProperty.value)
      labelsBtn.setLabel(model.showLabelsProperty.value ? 'Labels: On' : 'Labels: Off')
    }
    const syncAutoDay = (): void => {
      autoDayBtn.setSelected(model.autoDayProperty.value)
      autoDayBtn.setLabel(model.autoDayProperty.value ? 'Auto day: On' : 'Auto day: Off')
    }
    const syncSound = (): void => {
      soundBtn.setSelected(model.soundEnabledProperty.value)
      soundBtn.setLabel(model.soundEnabledProperty.value ? 'Sound: On' : 'Sound: Off')
    }
    const syncPlayPause = (): void => {
      playPauseBtn.setLabel(model.runningProperty.value ? 'Pause' : 'Play')
    }
    const syncStatus = (): void => {
      const reflectPct = Math.round(model.getReflection() * 100)
      statusText.string =
        `Gas blanket: ${Math.round(model.co2LevelProperty.value * 100)}%  •  Reflection: ${reflectPct}%`
      statusText.left = 0
    }

    model.scenarioIdProperty.link(syncStories)
    model.showLabelsProperty.link(syncLabels)
    model.autoDayProperty.link(syncAutoDay)
    model.soundEnabledProperty.link(syncSound)
    model.runningProperty.link(syncPlayPause)
    model.co2LevelProperty.link(syncStatus)
    model.cloudCoverProperty.link(syncStatus)
    model.albedoProperty.link(syncStatus)

    const scroller = new ScrollableNode(panelContent, options.width - 24, options.height - 24)
    scroller.left = 12
    scroller.top = 12
    this.content.addChild(scroller)
  }
}
