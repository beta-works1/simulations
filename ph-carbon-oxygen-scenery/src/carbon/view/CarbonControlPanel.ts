import { EmptySelfOptions, optionize } from 'scenerystack/phet-core'
import { Panel, PanelOptions, RectangularPushButton } from 'scenerystack/sun'
import { Text, VBox } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { CarbonColors } from '../../common/CarbonColors.js'
import { CarbonStrings } from '../../CarbonStrings.js'
import { CarbonOxygenModel } from '../model/CarbonOxygenModel.js'

type Options = EmptySelfOptions & PanelOptions

export class CarbonControlPanel extends Panel {
  public constructor(model: CarbonOxygenModel, providedOptions: Options) {
    const w = (providedOptions.maxWidth as number | undefined) ?? 230
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
        content: new Text(label, { font: new PhetFont(11), fill: 'white', maxWidth: w - 24 }),
        baseColor: CarbonColors.buttonProperty,
        xMargin: 6,
        yMargin: 4,
        listener: fn,
        minWidth: w - 8,
      })

    const section = (t: string) =>
      new Text(t, { font: new PhetFont({ size: 12, weight: 'bold' }), fill: '#7cb068', maxWidth: w })

    const co2Text = new Text('', { font: new PhetFont(13), fill: '#e74c3c', maxWidth: w })
    const o2Text = new Text('', { font: new PhetFont(13), fill: '#3498db', maxWidth: w })
    const balText = new Text(model.balanceProperty, { font: new PhetFont(12), fill: '#ecf0f1', maxWidth: w })

    model.co2Property.link((v) => {
      co2Text.string = `CO₂: ${v.toFixed(1)}%`
    })
    model.o2Property.link((v) => {
      o2Text.string = `O₂: ${v.toFixed(1)}%`
    })

    const content = new VBox({
      align: 'left',
      spacing: 5,
      children: [
        new Text(CarbonStrings.controlsStringProperty, {
          font: new PhetFont({ size: 16, weight: 'bold' }),
          fill: 'white',
          maxWidth: w,
        }),
        co2Text,
        o2Text,
        balText,
        section('Environment'),
        mkBtn('Toggle day / night', () => model.toggleDay()),
        mkBtn('Auto day–night cycle', () => model.toggleAutoDayNight()),
        mkBtn('Sunlight +10%', () => model.bumpSunlight(10)),
        mkBtn('Sunlight −10%', () => model.bumpSunlight(-10)),
        section('Ecosystem'),
        mkBtn('More plants (+2)', () => model.bumpPlants(2)),
        mkBtn('Fewer plants (−2)', () => model.bumpPlants(-2)),
        mkBtn('More factories (+2)', () => model.bumpFactories(2)),
        mkBtn('Fewer factories (−2)', () => model.bumpFactories(-2)),
        section('Scenarios'),
        mkBtn('Deforestation scenario', () => model.startDeforestationScenario()),
        mkBtn('Step once', () => model.stepOnce()),
      ],
    })

    const playPauseLabel = new Text(model.runningProperty.value ? 'Pause' : 'Play', {
      font: new PhetFont(11),
      fill: 'white',
      maxWidth: w - 24,
    })
    const playPauseBtn = new RectangularPushButton({
      content: playPauseLabel,
      baseColor: CarbonColors.buttonProperty,
      xMargin: 6,
      yMargin: 4,
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
