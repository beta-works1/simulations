import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { WarmingModel } from './model/WarmingModel.js'
import { WarmingScreenView } from './view/WarmingScreenView.js'
import { EcologyConstants } from '../../shared/EcologyConstants.js'
import { WarmingStrings } from './WarmingStrings.js'
import { EcologyColors } from '../../shared/EcologyColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class WarmingScreen extends Screen<WarmingModel, WarmingScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      EcologyConstants.SCREEN_OPTIONS,
      {
        name: WarmingStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: EcologyColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new WarmingModel(),
      (model) => new WarmingScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, {
    fill: '#38bdf8',
    cornerRadius: 12,
  })
  iconNode.addChild(
    new Rectangle(0, 70, 100, 30, {
      fill: '#ca8a04',
      cornerRadius: 0,
    }),
  )
  iconNode.addChild(
    new Circle(14, {
      fill: '#facc15',
      centerX: 28,
      centerY: 28,
    }),
  )
  iconNode.addChild(
    new Rectangle(20, 42, 60, 14, {
      fill: 'rgba(120,113,108,0.55)',
      cornerRadius: 4,
    }),
  )
  return new ScreenIcon(iconNode, {
    fill: EcologyColors.screenBackgroundColorProperty,
  })
}
