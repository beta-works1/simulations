import { Range, Dimension2 } from 'scenerystack/dot'
import { optionize } from 'scenerystack/phet-core'
import { HSlider, Panel, PanelOptions, RectangularPushButton, ToggleSwitch } from 'scenerystack/sun'
import { HBox, Text, VBox } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { NumberProperty } from 'scenerystack/axon'
import { CarbonColors, CarbonConstants } from '../../common/CarbonColors.js'
import { CarbonStrings } from '../../CarbonStrings.js'
import { CarbonOxygenModel } from '../model/CarbonOxygenModel.js'
import { CarbonSounds } from './CarbonSounds.js'
import { ScrollableNode } from './ScrollableNode.js'

type SelfOptions = {
  panelMaxHeight?: number
}

type Options = SelfOptions & PanelOptions

export class CarbonControlPanel extends Panel {
  public constructor(model: CarbonOxygenModel, sounds: CarbonSounds, providedOptions: Options) {
    const w = (providedOptions.maxWidth as number | undefined) ?? 260
    const panelMaxHeight = providedOptions.panelMaxHeight ?? 420
    const options = optionize<Options, SelfOptions, PanelOptions>()(
      {
        panelMaxHeight: 420,
        xMargin: 10,
        yMargin: 10,
        stroke: CarbonColors.panelBorderProperty,
        lineWidth: 2,
        fill: 'rgba(11, 22, 40, 0.92)',
      },
      providedOptions,
    )

    const mkBtn = (label: string, fn: () => void, baseColor: typeof CarbonColors.buttonProperty) =>
      new RectangularPushButton({
        content: new Text(label, { font: new PhetFont(10), fill: 'white', maxWidth: w - 24 }),
        baseColor,
        xMargin: 6,
        yMargin: 4,
        listener: fn,
        minWidth: w - 8,
      })

    const section = (t: string) =>
      new Text(t, { font: new PhetFont({ size: 11, weight: 'bold' }), fill: '#7cb068', maxWidth: w })

    const netText = new Text('', { font: new PhetFont(11), fill: '#ecf0f1', maxWidth: w })
    const balText = new Text(model.balanceProperty, {
      font: new PhetFont({ size: 12, weight: 'bold' }),
      fill: '#a7f3d0',
      maxWidth: w,
    })

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
      balText.fill =
        s === 'Balanced' ? '#a7f3d0' : s === 'CO₂ rising' ? '#fca5a5' : '#86efac'
    })

    const tickSlider = (property: NumberProperty) => {
      let last = property.value
      property.lazyLink((v) => {
        if (Math.abs(v - last) > 0.05) sounds.sliderTick()
        last = v
      })
    }

    /** Same look as the old rate bars, but interactive — linked to Environment. */
    const rateSlider = (label: string, property: NumberProperty, range: Range, color: string) => {
      tickSlider(property)
      const readout = new Text('', { font: new PhetFont(9), fill: '#ecf0f1', maxWidth: 40 })
      property.link((v) => {
        readout.string = v.toFixed(1)
      })
      return new VBox({
        align: 'left',
        spacing: 2,
        children: [
          new HBox({
            spacing: 6,
            children: [
              new Text(label, { font: new PhetFont(9), fill: '#bdc3c7', maxWidth: w - 50 }),
              readout,
            ],
          }),
          new HSlider(property, range, {
            trackSize: new Dimension2(w - 28, 6),
            thumbSize: new Dimension2(14, 20),
            trackFillEnabled: color,
            thumbFill: color,
            thumbFillHighlighted: color,
            majorTickLength: 0,
            minorTickLength: 0,
          }),
        ],
      })
    }

    const sliderRow = (label: string, property: NumberProperty, range: Range) => {
      tickSlider(property)
      const readout = new Text('', { font: new PhetFont(10), fill: '#ecf0f1', maxWidth: 36 })
      property.link((v) => {
        readout.string = String(Math.round(v * (range.max <= 3 ? 10 : 1)) / (range.max <= 3 ? 10 : 1))
      })
      return new VBox({
        align: 'left',
        spacing: 2,
        children: [
          new HBox({
            spacing: 6,
            children: [
              new Text(label, { font: new PhetFont(10), fill: '#bdc3c7', maxWidth: w - 50 }),
              readout,
            ],
          }),
          new HSlider(property, range, {
            trackSize: new Dimension2(w - 32, 5),
            thumbSize: new Dimension2(14, 22),
            majorTickLength: 0,
            minorTickLength: 0,
          }),
        ],
      })
    }

    const playPauseLabel = new Text(model.runningProperty.value ? 'Pause' : 'Play', {
      font: new PhetFont(10),
      fill: 'white',
      maxWidth: w - 24,
    })
    const playPauseBtn = new RectangularPushButton({
      content: playPauseLabel,
      baseColor: CarbonColors.playbackButtonProperty,
      xMargin: 6,
      yMargin: 4,
      listener: () => {
        model.runningProperty.value = !model.runningProperty.value
        sounds.playPause(model.runningProperty.value)
      },
      minWidth: w - 8,
    })
    model.runningProperty.link((running) => {
      playPauseLabel.string = running ? 'Pause' : 'Play'
    })

    let soundOn = true
    const soundLabel = new Text('Sound: On', {
      font: new PhetFont(10),
      fill: 'white',
      maxWidth: w - 24,
    })
    const soundBtn = new RectangularPushButton({
      content: soundLabel,
      baseColor: CarbonColors.buttonProperty,
      xMargin: 6,
      yMargin: 4,
      listener: () => {
        soundOn = !soundOn
        sounds.setEnabled(soundOn)
        soundLabel.string = soundOn ? 'Sound: On' : 'Sound: Off'
        if (soundOn) sounds.button()
      },
      minWidth: w - 8,
    })

    model.isDayProperty.lazyLink((isDay) => sounds.dayNight(isDay))
    model.autoDayNightProperty.lazyLink((on) => sounds.toggle(on))

    const content = new VBox({
      align: 'left',
      spacing: 5,
      children: [
        new Text(CarbonStrings.controlsStringProperty, {
          font: new PhetFont({ size: 15, weight: 'bold' }),
          fill: 'white',
          maxWidth: w,
        }),
        netText,
        balText,
        section('Process rates'),
        new Text('Sliders ↔ environment (plants, animals, factories…)', {
          font: new PhetFont(8),
          fill: '#95a5a6',
          maxWidth: w,
        }),
        rateSlider(
          'Photosynthesis',
          model.photosynthesisRateProperty,
          new Range(0, CarbonConstants.RATE_PHOTO_MAX),
          '#2ecc71',
        ),
        rateSlider(
          'Respiration',
          model.respirationRateProperty,
          new Range(0, CarbonConstants.RATE_RESP_MAX),
          '#e67e22',
        ),
        rateSlider(
          'Decomposition',
          model.decompositionRateProperty,
          new Range(0, CarbonConstants.RATE_DECOMP_MAX),
          '#d4a017',
        ),
        rateSlider(
          'Combustion',
          model.combustionRateProperty,
          new Range(0, CarbonConstants.RATE_BURN_MAX),
          '#e74c3c',
        ),
        section('Environment'),
        new HBox({
          spacing: 8,
          children: [
            new Text('Day', { font: new PhetFont(10), fill: '#bdc3c7' }),
            new ToggleSwitch(model.isDayProperty, false, true, { scale: 0.55 }),
          ],
        }),
        new HBox({
          spacing: 8,
          children: [
            new Text('Auto cycle', { font: new PhetFont(10), fill: '#bdc3c7', maxWidth: 70 }),
            new ToggleSwitch(model.autoDayNightProperty, false, true, { scale: 0.55 }),
          ],
        }),
        sliderRow('Sunlight %', model.sunlightProperty, new Range(0, 100)),
        sliderRow('Plants', model.plantCountProperty, new Range(0, 20)),
        sliderRow('Animals', model.animalCountProperty, new Range(0, 12)),
        sliderRow('Factories', model.factoryCountProperty, new Range(0, 20)),
        sliderRow('Speed ×', model.simSpeedProperty, new Range(0.25, 3)),
        section('Simulation Controls'),
        soundBtn,
        playPauseBtn,
        mkBtn(
          'Step once',
          () => {
            model.stepOnce()
            sounds.button()
          },
          CarbonColors.playbackButtonProperty,
        ),
        mkBtn(
          'Reset',
          () => {
            model.reset()
            sounds.resetAll()
          },
          CarbonColors.playbackButtonProperty,
        ),
        section('Scenarios'),
        mkBtn(
          'Deforestation + industry',
          () => {
            model.startDeforestationScenario()
            sounds.scenario()
          },
          CarbonColors.buttonProperty,
        ),
        mkBtn(
          'Reforestation recovery',
          () => {
            model.startReforestationScenario()
            sounds.scenario()
          },
          CarbonColors.buttonProperty,
        ),
      ],
    })

    const scrollInnerWidth = w - 4
    const scrollViewport = Math.max(180, panelMaxHeight - 20)
    const scrollable = new ScrollableNode(content, scrollInnerWidth, scrollViewport)

    super(scrollable, options)
  }
}
