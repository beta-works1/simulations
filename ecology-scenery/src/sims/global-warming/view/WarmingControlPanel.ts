import { Range, Dimension2 } from 'scenerystack/dot'
import { EmptySelfOptions, optionize } from 'scenerystack/phet-core'
import { HSlider, Panel, PanelOptions, RectangularPushButton } from 'scenerystack/sun'
import { Text, VBox } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { WarmingModel, WARMING_SCENARIOS } from '../model/WarmingModel.js'
import { ScrollableNode } from './ScrollableNode.js'

type SelfOptions = {
  panelMaxHeight?: number
}

type Options = SelfOptions & EmptySelfOptions & PanelOptions

export class WarmingControlPanel extends Panel {
  public constructor(model: WarmingModel, providedOptions: Options) {
    const w = (providedOptions.maxWidth as number | undefined) ?? 260
    const panelMaxHeight = providedOptions.panelMaxHeight ?? 520
    const options = optionize<Options, SelfOptions, PanelOptions>()(
      {
        panelMaxHeight: 520,
        xMargin: 10,
        yMargin: 10,
        stroke: 'rgba(125, 211, 252, 0.45)',
        lineWidth: 2,
        fill: 'rgba(11, 22, 40, 0.94)',
      },
      providedOptions,
    )

    const mkBtn = (label: string, fn: () => void, baseColor = '#2980b9') =>
      new RectangularPushButton({
        content: new Text(label, { font: new PhetFont(12), fill: 'white', maxWidth: w - 28 }),
        baseColor,
        xMargin: 8,
        yMargin: 6,
        listener: fn,
        minWidth: w - 16,
      })

    const section = (t: string) =>
      new Text(t, { font: new PhetFont({ size: 13, weight: 'bold' }), fill: '#7dcea0', maxWidth: w })

    const help = (t: string) =>
      new Text(t, { font: new PhetFont(12), fill: '#94a3b8', maxWidth: w })

    const tipReadout = new Text(model.tipProperty, {
      font: new PhetFont({ size: 13, weight: 'bold' }),
      fill: '#fde68a',
      maxWidth: w,
    })
    const whyReadout = new Text(model.whyProperty, {
      font: new PhetFont(12),
      fill: '#a7f3d0',
      maxWidth: w,
    })
    const nextReadout = new Text(model.nextHintProperty, {
      font: new PhetFont(12),
      fill: '#e2e8f0',
      maxWidth: w,
    })
    const tempReadout = new Text('', {
      font: new PhetFont({ size: 16, weight: 'bold' }),
      fill: '#fb923c',
      maxWidth: w,
    })
    const gasReadout = new Text('', {
      font: new PhetFont(13),
      fill: '#e2e8f0',
      maxWidth: w,
    })
    const advancedBox = new VBox({ align: 'left', spacing: 6 })

    const refreshMeters = () => {
      tempReadout.string = `Earth temperature: ${model.temperatureProperty.value.toFixed(1)} °C`
      gasReadout.string = `Gas blanket: ${Math.round(model.co2LevelProperty.value * 100)}% thick`
    }
    model.temperatureProperty.link(refreshMeters)
    model.co2LevelProperty.link(refreshMeters)

    const playPauseLabel = new Text(model.runningProperty.value ? 'Pause' : 'Play', {
      font: new PhetFont(12),
      fill: 'white',
      maxWidth: w - 24,
    })
    const playPauseBtn = new RectangularPushButton({
      content: playPauseLabel,
      baseColor: '#16a085',
      xMargin: 8,
      yMargin: 6,
      listener: () => {
        model.runningProperty.value = !model.runningProperty.value
      },
      minWidth: w - 16,
    })
    model.runningProperty.link(running => {
      playPauseLabel.string = running ? 'Pause' : 'Play'
    })

    const tipsLabel = new Text(model.showTipsProperty.value ? 'Tips on screen: On' : 'Tips on screen: Off', {
      font: new PhetFont(12),
      fill: 'white',
      maxWidth: w - 24,
    })
    const tipsBtn = new RectangularPushButton({
      content: tipsLabel,
      baseColor: '#2980b9',
      xMargin: 8,
      yMargin: 6,
      listener: () => {
        model.showTipsProperty.value = !model.showTipsProperty.value
      },
      minWidth: w - 16,
    })
    model.showTipsProperty.link(on => {
      tipsLabel.string = on ? 'Tips on screen: On' : 'Tips on screen: Off'
    })

    const buildAdvanced = () => {
      if (!model.showAdvancedProperty.value) {
        advancedBox.children = [help('Extra stories stay hidden. Learn the gas blanket first.')]
        return
      }
      advancedBox.children = [
        help('Try these after you can explain sunlight → heat → blanket → warmer Earth.'),
        section('What if…?'),
        ...WARMING_SCENARIOS.filter(s => s.id !== 'today').map(s =>
          mkBtn(s.name, () => model.applyScenario(s.id), '#0e6655'),
        ),
      ]
    }
    model.showAdvancedProperty.link(buildAdvanced)

    const advancedLabel = new Text('Show more options', {
      font: new PhetFont(12),
      fill: 'white',
      maxWidth: w - 24,
    })
    const advancedBtn = new RectangularPushButton({
      content: advancedLabel,
      baseColor: '#2980b9',
      xMargin: 8,
      yMargin: 6,
      listener: () => {
        model.showAdvancedProperty.value = !model.showAdvancedProperty.value
      },
      minWidth: w - 16,
    })
    model.showAdvancedProperty.link(on => {
      advancedLabel.string = on ? 'Hide extra options' : 'Show more options'
    })

    const content = new VBox({
      align: 'left',
      spacing: 8,
      children: [
        new Text('Controls', {
          font: new PhetFont({ size: 17, weight: 'bold' }),
          fill: 'white',
          maxWidth: w,
        }),
        help('How to learn: watch the sun and heat rays, then thicken the gas blanket.'),
        section('What is happening'),
        tipReadout,
        whyReadout,
        nextReadout,
        section('Meters'),
        tempReadout,
        gasReadout,
        section('Gas blanket (main control)'),
        help('Thicker = more greenhouse gases = hotter Earth.'),
        new HSlider(model.co2LevelProperty, new Range(0.05, 1), {
          trackSize: new Dimension2(w - 28, 6),
          thumbSize: new Dimension2(16, 24),
          majorTickLength: 0,
          minorTickLength: 0,
        }),
        mkBtn('Start here (today)', () => model.applyScenario('today'), '#f1c40f'),
        section('Simple controls'),
        tipsBtn,
        playPauseBtn,
        advancedBtn,
        advancedBox,
        mkBtn('Reset', () => model.reset(), '#c0392b'),
      ],
    })

    const scrollable = new ScrollableNode(content, w - 4, Math.max(200, panelMaxHeight - 16))
    super(scrollable, options)
  }
}
