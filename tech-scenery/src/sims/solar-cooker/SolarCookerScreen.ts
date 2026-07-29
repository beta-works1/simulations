import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Path, Rectangle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { SolarCookerModel } from './model/SolarCookerModel.js'
import { SolarCookerScreenView } from './view/SolarCookerScreenView.js'
import { TechConstants } from '../../shared/TechConstants.js'
import { SolarCookerStrings } from './SolarCookerStrings.js'
import { TechColors } from '../../shared/TechColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class SolarCookerScreen extends Screen<SolarCookerModel, SolarCookerScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      TechConstants.SCREEN_OPTIONS,
      {
        name: SolarCookerStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: TechColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )
    super(() => new SolarCookerModel(), (model) => new SolarCookerScreenView(model), options)
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0b1628', cornerRadius: 12 })
  iconNode.addChild(new Circle(14, { fill: '#ffeb3b', centerX: 72, centerY: 28 }))
  iconNode.addChild(new Path(new Shape().moveTo(18, 70).quadraticCurveTo(50, 20, 82, 70).lineTo(82, 78).quadraticCurveTo(50, 32, 18, 78).close(), { fill: '#90a4ae' }))
  iconNode.addChild(new Rectangle(42, 68, 16, 14, { fill: '#37474f' }))
  return new ScreenIcon(iconNode, { fill: TechColors.screenBackgroundColorProperty })
}
