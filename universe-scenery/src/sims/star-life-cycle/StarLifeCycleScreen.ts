import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { StarLifeCycleModel } from './model/StarLifeCycleModel.js'
import { StarLifeCycleScreenView } from './view/StarLifeCycleScreenView.js'
import { UniverseConstants } from '../../shared/UniverseConstants.js'
import { StarLifeCycleStrings } from './StarLifeCycleStrings.js'
import { UniverseColors } from '../../shared/UniverseColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class StarLifeCycleScreen extends Screen<StarLifeCycleModel, StarLifeCycleScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      UniverseConstants.SCREEN_OPTIONS,
      {
        name: StarLifeCycleStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: UniverseColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )
    super(() => new StarLifeCycleModel(), (model) => new StarLifeCycleScreenView(model), options)
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0b1020', cornerRadius: 12 })
  iconNode.addChild(new Circle(22, { fill: '#ffeb3b', centerX: 50, centerY: 50 }))
  iconNode.addChild(new Circle(8, { fill: '#ef5350', centerX: 72, centerY: 28 }))
  return new ScreenIcon(iconNode, { fill: UniverseColors.screenBackgroundColorProperty })
}
