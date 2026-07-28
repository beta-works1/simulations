import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Path, Rectangle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { SeriesParallelModel } from './model/SeriesParallelModel.js'
import { SeriesParallelScreenView } from './view/SeriesParallelScreenView.js'
import { ElectricityConstants } from '../../shared/ElectricityConstants.js'
import { SeriesParallelStrings } from './SeriesParallelStrings.js'
import { ElectricityColors } from '../../shared/ElectricityColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class SeriesParallelScreen extends Screen<SeriesParallelModel, SeriesParallelScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      ElectricityConstants.SCREEN_OPTIONS,
      {
        name: SeriesParallelStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: ElectricityColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )
    super(() => new SeriesParallelModel(), (model) => new SeriesParallelScreenView(model), options)
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0b1628', cornerRadius: 12 })
  iconNode.addChild(new Path(new Shape().rect(20, 30, 60, 40), { stroke: '#fbbf24', lineWidth: 3 }))
  iconNode.addChild(new Circle(8, { fill: '#fde68a', centerX: 35, centerY: 50 }))
  iconNode.addChild(new Circle(8, { fill: '#fde68a', centerX: 65, centerY: 50 }))
  return new ScreenIcon(iconNode, { fill: ElectricityColors.screenBackgroundColorProperty })
}
