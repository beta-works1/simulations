import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Path, Rectangle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { BlackHoleModel } from './model/BlackHoleModel.js'
import { BlackHoleScreenView } from './view/BlackHoleScreenView.js'
import { UniverseConstants } from '../../shared/UniverseConstants.js'
import { BlackHoleStrings } from './BlackHoleStrings.js'
import { UniverseColors } from '../../shared/UniverseColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class BlackHoleScreen extends Screen<BlackHoleModel, BlackHoleScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      UniverseConstants.SCREEN_OPTIONS,
      {
        name: BlackHoleStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: UniverseColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )
    super(() => new BlackHoleModel(), (model) => new BlackHoleScreenView(model), options)
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0d0d0d', cornerRadius: 12 })
  iconNode.addChild(new Circle(18, { fill: '#111', stroke: '#5dade2', lineWidth: 2, centerX: 50, centerY: 52 }))
  iconNode.addChild(
    new Path(
      new Shape()
        .moveTo(18, 52)
        .quadraticCurveTo(34, 38, 50, 52)
        .quadraticCurveTo(66, 66, 82, 52),
      { stroke: '#5dade2', lineWidth: 2, lineCap: 'round' },
    ),
  )
  return new ScreenIcon(iconNode, { fill: UniverseColors.screenBackgroundColorProperty })
}
