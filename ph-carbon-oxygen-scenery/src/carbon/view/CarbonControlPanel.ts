import { Range } from 'scenerystack/dot'
import { Dimension2 } from 'scenerystack/dot'
import { EmptySelfOptions, optionize } from 'scenerystack/phet-core'
import { HSlider, Panel, PanelOptions, RectangularPushButton, ToggleSwitch } from 'scenerystack/sun'
import { HBox, Text, VBox } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { CarbonColors } from '../../common/CarbonColors.js'
import { CarbonStrings } from '../../CarbonStrings.js'
import { CarbonOxygenModel } from '../model/CarbonOxygenModel.js'

type Options = EmptySelfOptions & PanelOptions

export class CarbonControlPanel extends Panel {
  public constructor(model: CarbonOxygenModel, providedOptions: Options) {
    const w = (providedOptions.maxWidth as number | undefined) ?? 260
    const options = optionize<Options, EmptySelfOptions, PanelOptions>()(
      {
        xMargin: 10,
        yMargin: 10,
        stroke: CarbonColors.panelBorderProperty,
        lineWidth: 2,
        fill: 'rgba(11, 22, 40, 0.92)',
      },
      providedOptions,
    )

    const mkBtn = (label: string, fn: () => void) =>
      new RectangularPushButton({
        content: new Text(label, { font: new PhetFont(10), fill: 'white', maxWidth: w - 24 }),
        baseColor: CarbonColors.buttonProperty,
        xMargin: 6,
        yMargin: 3,
        listener: fn,
        minWidth: w - 8,
      })

    const section = (t: string) =>
      new Text(t, { font: new PhetFont({ size: 11, weight: 'bold' }), fill: '#7cb068', maxWidth: w })

    const co2Text = new Text('', { font: new PhetFont(12), fill: '#e74c3c', maxWidth: w })
    const o2Text = new Text('', { font: new PhetFont(12), fill: '#3498db', maxWidth: w })
    const netText = new Text('', { font: new PhetFont(10), fill: '#bdc3c7', maxWidth: w })
    const balText = new Text(model.balanceProperty, { font: new PhetFont(11), fill: '#ecf0f1', maxWidth: w })
    const ratesText = new Text('', { font: new PhetFont(9), fill: '#95a5a6', maxWidth: w })

    model.co2Property.link((v) => {
      co2Text.string = `CO₂: ${v.toFixed(1)}%`
    })
    model.o2Property.link((v) => {
      o2Text.string = `O₂: ${v.toFixed(1)}%`
    })
    model.netCo2RateProperty.link((netCo2) => {
      const netO2 = model.netO2RateProperty.value
      const co2Arrow = netCo2 > 0.4 ? '▲' : netCo2 < -0.4 ? '▼' : '●'
      const o2Arrow = netO2 > 0.4 ? '▲' : netO2 < -0.4 ? '▼' : '●'
      netText.string = `Net CO₂ ${co2Arrow}  ·  Net O₂ ${o2Arrow}`
    })
    model.netO2RateProperty.link((netO2) => {
      const netCo2 = model.netCo2RateProperty.value
      const co2Arrow = netCo2 > 0.4 ? '▲' : netCo2 < -0.4 ? '▼' : '●'
      const o2Arrow = netO2 > 0.4 ? '▲' : netO2 < -0.4 ? '▼' : '●'
      netText.string = `Net CO₂ ${co2Arrow}  ·  Net O₂ ${o2Arrow}`
    })
    model.ratesProperty.link((r) => {
      ratesText.string =
        `Photo ${r.photosynthesis.toFixed(1)}  Resp ${r.respiration.toFixed(1)}\n` +
        `Decomp ${r.decomposition.toFixed(1)}  Burn ${r.combustion.toFixed(1)}`
    })

    const sliderRow = (label: string, property: CarbonOxygenModel['sunlightProperty'], range: Range) => {
      const readout = new Text('', { font: new PhetFont(10), fill: '#ecf0f1', maxWidth: 36 })
      property.link((v) => {
        readout.string = String(Math.round(v))
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
            trackSize: new Dimension2(w - 24, 5),
            thumbSize: new Dimension2(14, 22),
            majorTickLength: 0,
            minorTickLength: 0,
          }),
        ],
      })
    }

    const content = new VBox({
      align: 'left',
      spacing: 4,
      children: [
        new Text(CarbonStrings.controlsStringProperty, {
          font: new PhetFont({ size: 15, weight: 'bold' }),
          fill: 'white',
          maxWidth: w,
        }),
        co2Text,
        o2Text,
        netText,
        balText,
        ratesText,
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
        section('Scenarios'),
        mkBtn('Deforestation + industry', () => model.startDeforestationScenario()),
        mkBtn('Reforestation recovery', () => model.startReforestationScenario()),
        mkBtn('Step once', () => model.stepOnce()),
      ],
    })

    const playPauseLabel = new Text(model.runningProperty.value ? 'Pause' : 'Play', {
      font: new PhetFont(10),
      fill: 'white',
      maxWidth: w - 24,
    })
    const playPauseBtn = new RectangularPushButton({
      content: playPauseLabel,
      baseColor: CarbonColors.buttonProperty,
      xMargin: 6,
      yMargin: 3,
      listener: () => {
        model.runningProperty.value = !model.runningProperty.value
      },
      minWidth: w - 8,
    })
    content.addChild(playPauseBtn)

    model.runningProperty.link((running) => {
      playPauseLabel.string = running ? 'Pause' : 'Play'
    })

    super(content, options)
  }
}
