import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Path, Rectangle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { WindTurbineModel } from './model/WindTurbineModel.js'
import { WindTurbineScreenView } from './view/WindTurbineScreenView.js'
import { TechConstants } from '../../shared/TechConstants.js'
import { WindTurbineStrings } from './WindTurbineStrings.js'
import { TechColors } from '../../shared/TechColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class WindTurbineScreen extends Screen<WindTurbineModel, WindTurbineScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      TechConstants.SCREEN_OPTIONS,
      {
        name: WindTurbineStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: TechColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )
    super(() => new WindTurbineModel(), (model) => new WindTurbineScreenView(model), options)
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, { fill: '#0b1628', cornerRadius: 12 })
  iconNode.addChild(new Path(new Shape().moveTo(48, 78).lineTo(52, 78).lineTo(51, 35).lineTo(49, 35).close(), { fill: '#64748b' }))
  iconNode.addChild(new Circle(6, { fill: '#334155', centerX: 50, centerY: 32 }))
  for (let b = 0; b < 3; b++) {
    const a = (b * Math.PI * 2) / 3 - Math.PI / 2
    iconNode.addChild(new Path(new Shape().moveTo(50, 32).lineTo(50 + Math.cos(a) * 28, 32 + Math.sin(a) * 28), { stroke: '#e2e8f0', lineWidth: 4, lineCap: 'round' }))
  }
  return new ScreenIcon(iconNode, { fill: TechColors.screenBackgroundColorProperty })
}
