import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Node, Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { PredatorPreyModel } from './model/PredatorPreyModel.js'
import { PredatorPreyScreenView } from './view/PredatorPreyScreenView.js'
import { EcologyConstants } from '../../shared/EcologyConstants.js'
import { PredatorPreyStrings } from './PredatorPreyStrings.js'
import { EcologyColors } from '../../shared/EcologyColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class PredatorPreyScreen extends Screen<PredatorPreyModel, PredatorPreyScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      EcologyConstants.SCREEN_OPTIONS,
      {
        name: PredatorPreyStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: EcologyColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new PredatorPreyModel(),
      (model) => new PredatorPreyScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, {
    fill: '#166534',
    cornerRadius: 12,
  })
  const meadow = new Rectangle(8, 55, 84, 37, {
    fill: '#22c55e',
    cornerRadius: 6,
  })
  iconNode.addChild(meadow)
  const dots = new Node()
  dots.addChild(new Circle(5, { fill: '#4ade80', centerX: 32, centerY: 48 }))
  dots.addChild(new Circle(5, { fill: '#4ade80', centerX: 48, centerY: 38 }))
  dots.addChild(new Circle(6, { fill: '#ef4444', centerX: 68, centerY: 44 }))
  iconNode.addChild(dots)
  return new ScreenIcon(iconNode, {
    fill: EcologyColors.screenBackgroundColorProperty,
  })
}
