import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Node, Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { SolarSystemTimelineModel } from './model/SolarSystemTimelineModel.js'
import { SolarSystemTimelineScreenView } from './view/SolarSystemTimelineScreenView.js'
import { UniverseConstants } from '../../shared/UniverseConstants.js'
import { SolarSystemTimelineStrings } from './SolarSystemTimelineStrings.js'
import { UniverseColors } from '../../shared/UniverseColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class SolarSystemTimelineScreen extends Screen<SolarSystemTimelineModel, SolarSystemTimelineScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      UniverseConstants.SCREEN_OPTIONS,
      {
        name: SolarSystemTimelineStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: UniverseColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )
    super(() => new SolarSystemTimelineModel(), (model) => new SolarSystemTimelineScreenView(model), options)
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#1a252f', cornerRadius: 12 })
  iconNode.addChild(new Circle(14, { fill: '#f59e0b', centerX: 28, centerY: 50 }))
  const planets = new Node()
  const orbitColors = ['#38bdf8', '#58d68d', '#a78bfa']
  orbitColors.forEach((fill, i) => {
    planets.addChild(new Circle(4 + i, { fill, centerX: 48 + i * 16, centerY: 50 + (i - 1) * 6 }))
  })
  iconNode.addChild(planets)
  iconNode.addChild(new Rectangle(12, 78, 76, 4, { cornerRadius: 2, fill: '#58d68d' }))
  return new ScreenIcon(iconNode, { fill: UniverseColors.screenBackgroundColorProperty })
}
