import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Node, Path, Rectangle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { BrainMappingModel } from './model/BrainMappingModel.js'
import { BrainMappingScreenView } from './view/BrainMappingScreenView.js'
import { NervousConstants } from '../../shared/NervousConstants.js'
import { BrainMappingStrings } from './BrainMappingStrings.js'
import { NervousColors } from '../../shared/NervousColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class BrainMappingScreen extends Screen<BrainMappingModel, BrainMappingScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      NervousConstants.SCREEN_OPTIONS,
      {
        name: BrainMappingStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: NervousColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new BrainMappingModel(),
      (model) => new BrainMappingScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, {
    fill: '#4a235a',
    cornerRadius: 12,
  })
  const lobes = new Node()
  lobes.addChild(new Path(Shape.ellipse(42, 42, 28, 22, 0), { fill: '#e74c3c', opacity: 0.7 }))
  lobes.addChild(new Path(Shape.ellipse(62, 40, 18, 16, 0), { fill: '#3498db', opacity: 0.7 }))
  lobes.addChild(new Circle(8, { fill: '#8e2d5a', centerX: 68, centerY: 68 }))
  iconNode.addChild(lobes)
  return new ScreenIcon(iconNode, {
    fill: NervousColors.screenBackgroundColorProperty,
  })
}
