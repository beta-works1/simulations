import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Node, Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { EcologyConstants } from '../../shared/EcologyConstants.js'
import { EcologyColors } from '../../shared/EcologyColors.js'
import { FoodWebStrings } from './FoodWebStrings.js'
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
        name: FoodWebStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: EcologyColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new FoodWebModel(),
      model => new FoodWebScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const root = new Node()
  root.addChild(
    new Rectangle(0, 0, 100, 100, {
      fill: '#0f3d2e',
      cornerRadius: 12,
    }),
  )
  root.addChild(new Circle(14, { fill: EcologyColors.producer, centerX: 30, centerY: 68 }))
  root.addChild(new Circle(14, { fill: EcologyColors.herbivore, centerX: 52, centerY: 48 }))
  root.addChild(new Circle(14, { fill: EcologyColors.carnivore, centerX: 72, centerY: 28 }))
  return new ScreenIcon(root, {
    fill: EcologyColors.screenBackgroundColorProperty,
  })
}
