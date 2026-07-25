import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Node, Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { MitosisMeiosisModel } from './model/MitosisMeiosisModel.js'
import { MitosisMeiosisScreenView } from './view/MitosisMeiosisScreenView.js'
import { HeredityConstants } from '../../shared/HeredityConstants.js'
import { MitosisMeiosisStrings } from './MitosisMeiosisStrings.js'
import { HeredityColors } from '../../shared/HeredityColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class MitosisMeiosisScreen extends Screen<MitosisMeiosisModel, MitosisMeiosisScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      HeredityConstants.SCREEN_OPTIONS,
      {
        name: MitosisMeiosisStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: HeredityColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new MitosisMeiosisModel(),
      (model) => new MitosisMeiosisScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, {
    fill: '#0b1628',
    cornerRadius: 12,
  })
  const cells = new Node()
  cells.addChild(new Circle(20, { fill: '#8e44ad', centerX: 32, centerY: 50 }))
  cells.addChild(new Circle(20, { fill: '#0d9488', centerX: 68, centerY: 50 }))
  cells.addChild(new Rectangle(-3, -8, 6, 16, { fill: '#c0392b', centerX: 32, centerY: 46, cornerRadius: 3 }))
  cells.addChild(new Rectangle(-3, -8, 6, 16, { fill: '#e67e22', centerX: 32, centerY: 54, cornerRadius: 3 }))
  cells.addChild(new Rectangle(-3, -8, 6, 16, { fill: '#2980b9', centerX: 68, centerY: 46, cornerRadius: 3 }))
  cells.addChild(new Rectangle(-3, -8, 6, 16, { fill: '#f1c40f', centerX: 68, centerY: 54, cornerRadius: 3 }))
  iconNode.addChild(cells)
  return new ScreenIcon(iconNode, {
    fill: HeredityColors.screenBackgroundColorProperty,
  })
}
