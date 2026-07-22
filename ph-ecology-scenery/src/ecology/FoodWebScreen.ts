import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { EcologyConstants } from '../common/EcologyConstants.js'
import { EcologyColors } from '../common/EcologyColors.js'
import { EcologyStrings } from '../EcologyStrings.js'
import { FoodWebModel } from './model/FoodWebModel.js'
import { FoodWebScreenView } from './view/FoodWebScreenView.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class FoodWebScreen extends Screen<FoodWebModel, FoodWebScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      EcologyConstants.SCREEN_OPTIONS,
      {
        name: EcologyStrings.screen.foodWebStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: EcologyColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new FoodWebModel(),
      (model) => new FoodWebScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const icon = new Rectangle(0, 0, 100, 100, { fill: '#196f3d', cornerRadius: 12 })
  icon.addChild(new Circle(18, { fill: '#27ae60', centerX: 30, centerY: 70 }))
  icon.addChild(new Circle(14, { fill: '#f1c40f', centerX: 55, centerY: 50 }))
  icon.addChild(new Circle(12, { fill: '#e74c3c', centerX: 75, centerY: 30 }))
  return new ScreenIcon(icon, { fill: EcologyColors.screenBackgroundColorProperty })
}
