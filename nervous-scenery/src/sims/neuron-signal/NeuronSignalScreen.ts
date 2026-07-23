import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Node, Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { NeuronSignalModel } from './model/NeuronSignalModel.js'
import { NeuronSignalScreenView } from './view/NeuronSignalScreenView.js'
import { NervousConstants } from '../../shared/NervousConstants.js'
import { NeuronSignalStrings } from './NeuronSignalStrings.js'
import { NervousColors } from '../../shared/NervousColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class NeuronSignalScreen extends Screen<NeuronSignalModel, NeuronSignalScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      NervousConstants.SCREEN_OPTIONS,
      {
        name: NeuronSignalStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: NervousColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new NeuronSignalModel(),
      (model) => new NeuronSignalScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, {
    fill: '#16324f',
    cornerRadius: 12,
  })
  const dots = new Node()
  dots.addChild(new Circle(10, { fill: '#5dade2', centerX: 28, centerY: 50 }))
  dots.addChild(new Rectangle(38, 44, 42, 12, { cornerRadius: 6, fill: '#f5b041' }))
  dots.addChild(new Circle(6, { fill: '#f4d03f', centerX: 78, centerY: 50 }))
  iconNode.addChild(dots)
  return new ScreenIcon(iconNode, {
    fill: NervousColors.screenBackgroundColorProperty,
  })
}
