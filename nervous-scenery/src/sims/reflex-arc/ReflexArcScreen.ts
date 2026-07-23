import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Node, Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { ReflexArcModel } from './model/ReflexArcModel.js'
import { ReflexArcScreenView } from './view/ReflexArcScreenView.js'
import { NervousConstants } from '../../shared/NervousConstants.js'
import { ReflexArcStrings } from './ReflexArcStrings.js'
import { NervousColors } from '../../shared/NervousColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class ReflexArcScreen extends Screen<ReflexArcModel, ReflexArcScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      NervousConstants.SCREEN_OPTIONS,
      {
        name: ReflexArcStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: NervousColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new ReflexArcModel(),
      (model) => new ReflexArcScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, {
    fill: '#6c3483',
    cornerRadius: 12,
  })
  const dots = new Node()
  dots.addChild(new Circle(8, { fill: '#e67e22', centerX: 28, centerY: 55 }))
  dots.addChild(new Circle(7, { fill: '#2f6fed', centerX: 50, centerY: 40 }))
  dots.addChild(new Circle(8, { fill: '#27ae60', centerX: 72, centerY: 55 }))
  iconNode.addChild(dots)
  return new ScreenIcon(iconNode, {
    fill: NervousColors.screenBackgroundColorProperty,
  })
}
