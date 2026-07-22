import { Range, Dimension2 } from 'scenerystack/dot'
import { EmptySelfOptions, optionize } from 'scenerystack/phet-core'
import { HSlider, Panel, PanelOptions, RectangularPushButton, ToggleSwitch } from 'scenerystack/sun'
import { HBox, Node, Rectangle, Text, VBox } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { CarbonColors } from '../../common/CarbonColors.js'
import { CarbonStrings } from '../../CarbonStrings.js'
import { CarbonOxygenModel, ProcessRates } from '../model/CarbonOxygenModel.js'

type Options = EmptySelfOptions & PanelOptions

function rateBar(label: string, value: number, max: number, color: string, width: number): Node {
  const trackW = width - 8
  const fillW = Math.max(2, Math.min(trackW, (value / Math.max(max, 0.01)) * trackW))
  const row = new Node()
  row.addChild(
    new Text(label, {
      font: new PhetFont(9),
      fill: '#bdc3c7',
      x: 0,
      y: 0,
    }),
  )
  row.addChild(
    new Text(value.toFixed(1), {
      font: new PhetFont(9),
      fill: '#ecf0f1',
      right: width,
      y: 0,
    }),
  )
  row.addChild(new Rectangle(0, 12, trackW, 5, { fill: 'rgba(255,255,255,0.12)', cornerRadius: 2 }))
  row.addChild(new Rectangle(0, 12, fillW, 5, { fill: color, cornerRadius: 2 }))
  return row
}

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

    const ratesBox = new VBox({ align: 'left', spacing: 6 })
    const refreshRates = (r: ProcessRates) => {
      const max = Math.max(r.photosynthesis, r.respiration, r.decomposition, r.combustion, 1)
      ratesBox.children = [
        rateBar('Photosynthesis', r.photosynthesis, max, '#2ecc71', w - 16),
        rateBar('Respiration', r.respiration, max, '#e67e22', w - 16),
        rateBar('Decomposition', r.decomposition, max, '#d4a017', w - 16),
        rateBar('Combustion', r.combustion, max, '#e74c3c', w - 16),
      ]
    }
    model.ratesProperty.link(refreshRates)

    const sliderRow = (label: string, property: CarbonOxygenModel['sunlightProperty'], range: Range) => {
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
            trackSize: new Dimension2(w - 24, 5),
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
      },
      minWidth: w - 8,
    })
    model.runningProperty.link((running) => {
      playPauseLabel.string = running ? 'Pause' : 'Play'
    })

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
        ratesBox,
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
        playPauseBtn,
        mkBtn('Step once', () => model.stepOnce(), CarbonColors.playbackButtonProperty),
        mkBtn('Reset', () => model.reset(), CarbonColors.playbackButtonProperty),
        section('Scenarios'),
        mkBtn('Deforestation + industry', () => model.startDeforestationScenario(), CarbonColors.buttonProperty),
        mkBtn('Reforestation recovery', () => model.startReforestationScenario(), CarbonColors.buttonProperty),
      ],
    })

    super(content, options)
  }
}
