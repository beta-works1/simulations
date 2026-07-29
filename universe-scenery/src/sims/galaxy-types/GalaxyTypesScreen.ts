import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Node, Path, Rectangle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { GalaxyTypesModel } from './model/GalaxyTypesModel.js'
import { GalaxyTypesScreenView } from './view/GalaxyTypesScreenView.js'
import { UniverseConstants } from '../../shared/UniverseConstants.js'
import { GalaxyTypesStrings } from './GalaxyTypesStrings.js'
import { UniverseColors } from '../../shared/UniverseColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class GalaxyTypesScreen extends Screen<GalaxyTypesModel, GalaxyTypesScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      UniverseConstants.SCREEN_OPTIONS,
      {
        name: GalaxyTypesStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: UniverseColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )
    super(() => new GalaxyTypesModel(), (model) => new GalaxyTypesScreenView(model), options)
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0b5345', cornerRadius: 12 })
  const spiral = new Node()
  for (let i = 0; i < 2; i++) {
    const arm = new Path(
      new Shape()
        .moveTo(50, 50)
        .quadraticCurveTo(50 + (i === 0 ? 30 : -30), 20, 50 + (i === 0 ? 38 : -38), 72),
      { stroke: '#a569bd', lineWidth: 3, lineCap: 'round' },
    )
    spiral.addChild(arm)
  }
  iconNode.addChild(spiral)
  iconNode.addChild(new Circle(10, { fill: '#f5deb3', centerX: 50, centerY: 50 }))
  return new ScreenIcon(iconNode, { fill: UniverseColors.screenBackgroundColorProperty })
}
