import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Node, Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { IonicCovalentModel } from './model/IonicCovalentModel.js'
import { IonicCovalentScreenView } from './view/IonicCovalentScreenView.js'
import { ReactionsConstants } from '../../shared/ReactionsConstants.js'
import { ReactionsColors } from '../../shared/ReactionsColors.js'
import { IonicCovalentStrings } from './IonicCovalentStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class IonicCovalentScreen extends Screen<IonicCovalentModel, IonicCovalentScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      ReactionsConstants.SCREEN_OPTIONS,
      {
        name: IonicCovalentStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: ReactionsColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new IonicCovalentModel(),
      (model) => new IonicCovalentScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, {
    fill: '#0b1628',
    cornerRadius: 12,
  })

  // Na (left, silver) and Cl (right, green) with an electron mid-transfer.
  iconNode.addChild(new Circle(20, { fill: '#bdc3c7', stroke: '#334155', lineWidth: 2, centerX: 28, centerY: 40 }))
  iconNode.addChild(new Circle(24, { fill: '#27ae60', stroke: '#1e8449', lineWidth: 2, centerX: 74, centerY: 44 }))
  iconNode.addChild(new Circle(5, { fill: '#f1c40f', stroke: '#a16207', lineWidth: 1, centerX: 52, centerY: 40 }))
  iconNode.addChild(new Circle(4, { fill: 'rgba(255,255,255,0.85)', centerX: 22, centerY: 34 }))

  // Small ion-charge accents.
  const charges = new Node()
  charges.addChild(new Circle(3, { fill: '#e74c3c', centerX: 20, centerY: 66 }))
  charges.addChild(new Circle(3, { fill: '#5dade2', centerX: 80, centerY: 70 }))
  iconNode.addChild(charges)

  return new ScreenIcon(iconNode, {
    fill: ReactionsColors.screenBackgroundColorProperty,
  })
}
