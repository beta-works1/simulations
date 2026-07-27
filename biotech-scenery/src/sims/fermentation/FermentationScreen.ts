import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Node, Path, Rectangle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { FermentationModel } from './model/FermentationModel.js'
import { FermentationScreenView } from './view/FermentationScreenView.js'
import { BiotechConstants } from '../../shared/BiotechConstants.js'
import { FermentationStrings } from './FermentationStrings.js'
import { BiotechColors } from '../../shared/BiotechColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class FermentationScreen extends Screen<FermentationModel, FermentationScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      BiotechConstants.SCREEN_OPTIONS,
      {
        name: FermentationStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: BiotechColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new FermentationModel(),
      (model) => new FermentationScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, {
    fill: '#0b1628',
    cornerRadius: 12,
  })

  const flask = new Node()
  const flaskShape = new Shape()
    .moveTo(42, 18)
    .lineTo(42, 42)
    .lineTo(20, 84)
    .lineTo(80, 84)
    .lineTo(58, 42)
    .lineTo(58, 18)
  flask.addChild(new Path(flaskShape, { stroke: '#d5dbdb', lineWidth: 3, lineJoin: 'round' }))
  flask.addChild(
    new Path(
      new Shape().moveTo(28, 68).lineTo(72, 68).lineTo(60, 46).lineTo(40, 46).close(),
      { fill: '#f4d03f' },
    ),
  )
  flask.addChild(new Circle(3, { fill: '#ecfeff', centerX: 44, centerY: 60 }))
  flask.addChild(new Circle(2.4, { fill: '#ecfeff', centerX: 56, centerY: 54 }))
  flask.addChild(new Circle(2.2, { fill: '#ecfeff', centerX: 50, centerY: 32 }))
  flask.addChild(new Circle(1.8, { fill: 'rgba(236,254,255,0.7)', centerX: 44, centerY: 22 }))
  iconNode.addChild(flask)
  return new ScreenIcon(iconNode, {
    fill: BiotechColors.screenBackgroundColorProperty,
  })
}
