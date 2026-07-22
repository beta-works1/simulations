import { EmptySelfOptions, optionize } from 'scenerystack/phet-core'
import { Panel, PanelOptions, RectangularPushButton } from 'scenerystack/sun'
import { Text, VBox } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { EcologyColors } from '../../common/EcologyColors.js'
import { EcologyStrings } from '../../EcologyStrings.js'
import {
  FoodWebModel,
  grasslandChain,
  grasslandWeb,
} from '../model/FoodWebModel.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & PanelOptions

export class EcologyControlPanel extends Panel {
  public constructor(model: FoodWebModel, providedOptions: Options) {
    const contentWidth = (providedOptions.maxWidth as number | undefined) ?? 220

    const options = optionize<Options, SelfOptions, PanelOptions>()(
      {
        xMargin: 10,
        yMargin: 10,
        stroke: EcologyColors.controlPanelBorderColorProperty,
        lineWidth: 2,
        fill: 'rgba(15, 35, 54, 0.92)',
      },
      providedOptions,
    )

    const mkBtn = (label: string, listener: () => void) =>
      new RectangularPushButton({
        content: new Text(label, { font: new PhetFont(12), fill: 'white', maxWidth: contentWidth - 24 }),
        baseColor: EcologyColors.controlPanelButtonColorProperty,
        xMargin: 8,
        yMargin: 5,
        listener,
        minWidth: contentWidth - 8,
      })

    const section = (label: string) =>
      new Text(label, {
        font: new PhetFont({ size: 12, weight: 'bold' }),
        fill: '#a8d4a0',
        maxWidth: contentWidth,
      })

    const stabilityText = new Text(model.stabilityMessageProperty, {
      font: new PhetFont(11),
      fill: '#ecf0f1',
      maxWidth: contentWidth,
    })

    const scoreText = new Text('', {
      font: new PhetFont({ size: 14, weight: 'bold' }),
      fill: '#f4d03f',
      maxWidth: contentWidth,
    })
    model.stabilityScoreProperty.link((score) => {
      scoreText.string = `Stability: ${score}%`
    })

    const linkBtn = new RectangularPushButton({
      content: new Text('Toggle link mode', { font: new PhetFont(12), fill: 'white', maxWidth: contentWidth - 24 }),
      baseColor: EcologyColors.controlPanelButtonColorProperty,
      xMargin: 8,
      yMargin: 5,
      listener: () => model.toggleLinkMode(!model.linkModeProperty.value),
      minWidth: contentWidth - 8,
    })
    model.linkModeProperty.link((on) => {
      linkBtn.enabled = true
      linkBtn.opacity = on ? 1 : 0.85
    })

    const content = new VBox({
      align: 'left',
      spacing: 6,
      children: [
        new Text(EcologyStrings.controlsStringProperty, {
          font: new PhetFont({ size: 16, weight: 'bold' }),
          fill: 'white',
          maxWidth: contentWidth,
        }),
        scoreText,
        stabilityText,
        linkBtn,
        section('Examples'),
        mkBtn('Food chain', () => model.load(grasslandChain())),
        mkBtn('Grassland web', () => model.load(grasslandWeb())),
        section('Add species'),
        mkBtn('+ Producer', () => model.addSpecies('producer', 'Algae')),
        mkBtn('+ Primary consumer', () => model.addSpecies('herbivore', 'Deer')),
        mkBtn('+ Consumer', () => model.addSpecies('carnivore', 'Hawk')),
        mkBtn('+ Decomposer', () => model.addSpecies('decomposer', 'Bacteria')),
        mkBtn('Remove selected', () => model.removeSelected()),
      ],
    })

    super(content, options)
  }
}
