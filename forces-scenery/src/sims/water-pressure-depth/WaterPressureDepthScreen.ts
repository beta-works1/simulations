import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Rectangle, Circle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { WaterPressureDepthModel } from './model/WaterPressureDepthModel.js'
import { WaterPressureDepthScreenView } from './view/WaterPressureDepthScreenView.js'
import { ForcesConstants } from '../../shared/ForcesConstants.js'
import { WaterPressureDepthStrings } from './WaterPressureDepthStrings.js'
import { ForcesColors } from '../../shared/ForcesColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class WaterPressureDepthScreen extends Screen<WaterPressureDepthModel, WaterPressureDepthScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      ForcesConstants.SCREEN_OPTIONS,
      {
        name: WaterPressureDepthStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: ForcesColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new WaterPressureDepthModel(),
      (model) => new WaterPressureDepthScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0b1628', cornerRadius: 12 })
  iconNode.addChild(new Rectangle(28, 22, 44, 56, { fill: 'rgba(52,152,219,0.45)', stroke: '#f8fafc', lineWidth: 2 }))
  iconNode.addChild(new Circle(3, { fill: '#3498db', centerX: 72, centerY: 48 }))
  iconNode.addChild(new Circle(3, { fill: '#3498db', centerX: 78, centerY: 52 }))
  return new ScreenIcon(iconNode, { fill: ForcesColors.screenBackgroundColorProperty })
}
