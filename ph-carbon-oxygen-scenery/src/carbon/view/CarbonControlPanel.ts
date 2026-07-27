import { Node, Text } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { CarbonConstants } from '../../common/CarbonColors.js'
import { SimTheme } from '../../common/SimTheme.js'
import { DepthCard } from '../../common/ui/DepthCard.js'
import { DepthSlider } from '../../common/ui/DepthSlider.js'
import { SoftButton } from '../../common/ui/SoftButton.js'
import { ScrollableNode } from '../../common/ui/ScrollableNode.js'
import { controlHint, controlSection } from '../../common/ui/controlPanelBits.js'
import { CarbonStrings } from '../../CarbonStrings.js'
import { CarbonOxygenModel } from '../model/CarbonOxygenModel.js'
import { CarbonSounds } from './CarbonSounds.js'

/**
 * Ch2 SoftButton teaching-shell control panel — dark DepthCard with a
 * ScrollableNode of SoftButtons + DepthSliders (nervous reflex-arc parity).
 */
export class CarbonControlPanel extends Node {
  public readonly soundBtn: SoftButton
  public readonly playPauseBtn: SoftButton

  public constructor(model: CarbonOxygenModel, sounds: CarbonSounds, width: number, height: number) {
    super()

    const card = new DepthCard(width, height, { title: CarbonStrings.controlsStringProperty.value })
    this.addChild(card)

    // Leave room for ScrollableNode scrollbar so slider values are not clipped.
    const contentW = width - 42
    const halfW = (contentW - 8) / 2
    const btnH = 32
    const gap = 8

    const panelContent = new Node()

    const netText = new Text('', { font: new PhetFont(11), fill: '#ecf0f1', maxWidth: contentW })
    const balText = new Text(model.balanceProperty, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#a7f3d0',
      maxWidth: contentW,
    })
    panelContent.addChild(netText)
    panelContent.addChild(balText)

    const syncNet = () => {
      const netCo2 = model.netCo2RateProperty.value
      const netO2 = model.netO2RateProperty.value
      const co2Arrow = netCo2 > 0.4 ? '▲' : netCo2 < -0.4 ? '▼' : '●'
      const o2Arrow = netO2 > 0.4 ? '▲' : netO2 < -0.4 ? '▼' : '●'
      netText.string = `Net CO₂ ${co2Arrow}   Net O₂ ${o2Arrow}`
    }
    model.netCo2RateProperty.link(syncNet)
    model.netO2RateProperty.link(syncNet)
    model.balanceProperty.link((s) => {
      balText.fill = s === 'Balanced' ? '#a7f3d0' : s === 'CO₂ rising' ? '#fca5a5' : '#86efac'
    })

    const ratesHeader = controlSection('Process rates', contentW)
    panelContent.addChild(ratesHeader)
    const ratesHint = controlHint('Sliders ↔ environment (plants, animals, factories…)', contentW)
    panelContent.addChild(ratesHint)

    const photoSlider = new DepthSlider(model.photosynthesisRateProperty, {
      min: 0,
      max: CarbonConstants.RATE_PHOTO_MAX,
      width: contentW,
      label: 'Photosynthesis',
      format: (n) => n.toFixed(1),
      fill: '#2ecc71',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(photoSlider)

    const respSlider = new DepthSlider(model.respirationRateProperty, {
      min: 0,
      max: CarbonConstants.RATE_RESP_MAX,
      width: contentW,
      label: 'Respiration',
      format: (n) => n.toFixed(1),
      fill: '#e67e22',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(respSlider)

    const decompSlider = new DepthSlider(model.decompositionRateProperty, {
      min: 0,
      max: CarbonConstants.RATE_DECOMP_MAX,
      width: contentW,
      label: 'Decomposition',
      format: (n) => n.toFixed(1),
      fill: '#d4a017',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(decompSlider)

    const burnSlider = new DepthSlider(model.combustionRateProperty, {
      min: 0,
      max: CarbonConstants.RATE_BURN_MAX,
      width: contentW,
      label: 'Combustion',
      format: (n) => n.toFixed(1),
      fill: '#e74c3c',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(burnSlider)

    const envHeader = controlSection('Environment', contentW)
    panelContent.addChild(envHeader)

    const dayBtn = new SoftButton(
      model.isDayProperty.value ? 'Day: On' : 'Day: Off',
      () => model.toggleDay(),
      {
        width: halfW,
        height: btnH,
        fill: '#f4d03f',
        textFill: '#1c1500',
        selected: model.isDayProperty.value,
        fontSize: 11,
      },
    )
    panelContent.addChild(dayBtn)

    const autoBtn = new SoftButton(
      model.autoDayNightProperty.value ? 'Auto: On' : 'Auto: Off',
      () => model.toggleAutoDayNight(),
      {
        width: halfW,
        height: btnH,
        fill: '#0ea5e9',
        selected: model.autoDayNightProperty.value,
        fontSize: 11,
      },
    )
    panelContent.addChild(autoBtn)

    const sunlightSlider = new DepthSlider(model.sunlightProperty, {
      min: 0,
      max: 100,
      width: contentW,
      label: 'Sunlight %',
      format: (n) => `${Math.round(n)}`,
      fill: '#f4d03f',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(sunlightSlider)

    const plantsSlider = new DepthSlider(model.plantCountProperty, {
      min: 0,
      max: 20,
      width: contentW,
      label: 'Plants',
      format: (n) => `${Math.round(n)}`,
      fill: '#2ecc71',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(plantsSlider)

    const animalsSlider = new DepthSlider(model.animalCountProperty, {
      min: 0,
      max: 12,
      width: contentW,
      label: 'Animals',
      format: (n) => `${Math.round(n)}`,
      fill: '#e67e22',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(animalsSlider)

    const factoriesSlider = new DepthSlider(model.factoryCountProperty, {
      min: 0,
      max: 20,
      width: contentW,
      label: 'Factories',
      format: (n) => `${Math.round(n)}`,
      fill: '#e74c3c',
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(factoriesSlider)

    const speedSlider = new DepthSlider(model.simSpeedProperty, {
      min: 0.25,
      max: 3,
      width: contentW,
      label: 'Speed ×',
      format: (n) => `${n.toFixed(2)}×`,
      fill: SimTheme.accent,
      onTick: () => sounds.sliderTick(),
    })
    panelContent.addChild(speedSlider)

    const simHeader = controlSection('Simulation', contentW)
    panelContent.addChild(simHeader)

    this.soundBtn = new SoftButton(
      model.soundEnabledProperty.value ? 'Sound: On' : 'Sound: Off',
      () => {
        sounds.unlock()
        const on = !model.soundEnabledProperty.value
        model.soundEnabledProperty.value = on
      },
      { width: contentW, height: btnH, fill: '#64748b', fontSize: 12, selected: model.soundEnabledProperty.value },
    )
    panelContent.addChild(this.soundBtn)

    this.playPauseBtn = new SoftButton(
      model.runningProperty.value ? 'Pause' : 'Play',
      () => {
        model.runningProperty.value = !model.runningProperty.value
        sounds.playPause(model.runningProperty.value)
      },
      { width: halfW, height: btnH + 6, fill: '#2980b9', fontSize: 12 },
    )
    panelContent.addChild(this.playPauseBtn)

    const stepOnceBtn = new SoftButton(
      'Step once',
      () => model.stepOnce(),
      { width: halfW, height: btnH + 6, fill: '#475569', fontSize: 11, onSound: () => sounds.button() },
    )
    panelContent.addChild(stepOnceBtn)

    const resetBtn = new SoftButton(
      'Reset',
      () => model.reset(),
      { width: contentW, height: btnH, fill: '#2980b9', fontSize: 12, onSound: () => sounds.resetAll() },
    )
    panelContent.addChild(resetBtn)

    const scenarioHeader = controlSection('Scenarios', contentW)
    panelContent.addChild(scenarioHeader)

    const deforestBtn = new SoftButton(
      'Deforestation + industry',
      () => model.startDeforestationScenario(),
      { width: contentW, height: btnH + 4, fill: '#c0392b', fontSize: 11, onSound: () => sounds.scenario() },
    )
    panelContent.addChild(deforestBtn)

    const reforestBtn = new SoftButton(
      'Reforestation recovery',
      () => model.startReforestationScenario(),
      { width: contentW, height: btnH + 4, fill: '#16a34a', fontSize: 11, onSound: () => sounds.scenario() },
    )
    panelContent.addChild(reforestBtn)

    const relayoutPanel = () => {
      let py = 0
      netText.left = 0
      netText.top = py
      py = netText.bottom + 2
      balText.left = 0
      balText.top = py
      py = balText.bottom + 10

      ratesHeader.left = 0
      ratesHeader.top = py
      py = ratesHeader.bottom + 4
      ratesHint.left = 0
      ratesHint.top = py
      py = ratesHint.bottom + 8
      photoSlider.left = 0
      photoSlider.top = py
      py = photoSlider.bottom + 8
      respSlider.left = 0
      respSlider.top = py
      py = respSlider.bottom + 8
      decompSlider.left = 0
      decompSlider.top = py
      py = decompSlider.bottom + 8
      burnSlider.left = 0
      burnSlider.top = py
      py = burnSlider.bottom + 12

      envHeader.left = 0
      envHeader.top = py
      py = envHeader.bottom + 6
      dayBtn.left = 0
      dayBtn.top = py
      autoBtn.left = halfW + 8
      autoBtn.top = py
      py = dayBtn.bottom + gap
      sunlightSlider.left = 0
      sunlightSlider.top = py
      py = sunlightSlider.bottom + 8
      plantsSlider.left = 0
      plantsSlider.top = py
      py = plantsSlider.bottom + 8
      animalsSlider.left = 0
      animalsSlider.top = py
      py = animalsSlider.bottom + 8
      factoriesSlider.left = 0
      factoriesSlider.top = py
      py = factoriesSlider.bottom + 8
      speedSlider.left = 0
      speedSlider.top = py
      py = speedSlider.bottom + 12

      simHeader.left = 0
      simHeader.top = py
      py = simHeader.bottom + 6
      this.soundBtn.left = 0
      this.soundBtn.top = py
      py = this.soundBtn.bottom + gap
      this.playPauseBtn.left = 0
      this.playPauseBtn.top = py
      stepOnceBtn.left = halfW + 8
      stepOnceBtn.top = py
      py = this.playPauseBtn.bottom + gap
      resetBtn.left = 0
      resetBtn.top = py
      py = resetBtn.bottom + 12

      scenarioHeader.left = 0
      scenarioHeader.top = py
      py = scenarioHeader.bottom + 6
      deforestBtn.left = 0
      deforestBtn.top = py
      py = deforestBtn.bottom + gap
      reforestBtn.left = 0
      reforestBtn.top = py
      py = reforestBtn.bottom + 4
    }
    relayoutPanel()

    model.isDayProperty.link((isDay) => {
      dayBtn.setLabel(isDay ? 'Day: On' : 'Day: Off')
      dayBtn.setSelected(isDay)
    })
    model.autoDayNightProperty.link((on) => {
      autoBtn.setLabel(on ? 'Auto: On' : 'Auto: Off')
      autoBtn.setSelected(on)
    })
    model.isDayProperty.lazyLink((isDay) => sounds.dayNight(isDay))
    model.autoDayNightProperty.lazyLink((on) => sounds.toggle(on))
    model.runningProperty.link((running) => {
      this.playPauseBtn.setLabel(running ? 'Pause' : 'Play')
    })
    model.soundEnabledProperty.link((on) => {
      sounds.setEnabled(on)
      this.soundBtn.setLabel(on ? 'Sound: On' : 'Sound: Off')
      this.soundBtn.setSelected(on)
    })

    const scroller = new ScrollableNode(panelContent, width - 24, height - 56)
    scroller.left = 12
    scroller.top = 38
    card.content.addChild(scroller)
  }
}
