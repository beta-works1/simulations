import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Line, Node, Path, Rectangle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { ConservationOfMassModel } from './model/ConservationOfMassModel.js'
import { ConservationOfMassScreenView } from './view/ConservationOfMassScreenView.js'
import { ReactionsConstants } from '../../shared/ReactionsConstants.js'
import { ConservationOfMassStrings } from './ConservationOfMassStrings.js'
import { ReactionsColors } from '../../shared/ReactionsColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class ConservationOfMassScreen extends Screen<ConservationOfMassModel, ConservationOfMassScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      ReactionsConstants.SCREEN_OPTIONS,
      {
        name: ConservationOfMassStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: ReactionsColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new ConservationOfMassModel(),
      (model) => new ConservationOfMassScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, {
    fill: '#0b1628',
    cornerRadius: 12,
  })

  // Small flask
  const flaskShape = new Shape()
    .moveTo(28, 26)
    .lineTo(36, 26)
    .lineTo(36, 34)
    .lineTo(48, 62)
    .lineTo(16, 62)
    .lineTo(28, 34)
    .close()
  iconNode.addChild(new Path(flaskShape, { fill: '#58d68d', stroke: '#0f172a', lineWidth: 2 }))

  // Balance scale
  iconNode.addChild(new Line(70, 30, 70, 52, { stroke: '#94a3b8', lineWidth: 3 }))
  iconNode.addChild(new Line(58, 34, 82, 34, { stroke: '#94a3b8', lineWidth: 3, lineCap: 'round' }))
  iconNode.addChild(new Line(58, 34, 58, 46, { stroke: '#64748b', lineWidth: 2 }))
  iconNode.addChild(new Line(82, 34, 82, 46, { stroke: '#64748b', lineWidth: 2 }))
  iconNode.addChild(new Circle(7, { fill: '#cbd5e1', stroke: '#334155', lineWidth: 1.5, centerX: 58, centerY: 50 }))
  iconNode.addChild(new Circle(7, { fill: '#cbd5e1', stroke: '#334155', lineWidth: 1.5, centerX: 82, centerY: 50 }))
  iconNode.addChild(
    new Node({
      children: [new Line(60, 68, 80, 68, { stroke: '#f1c40f', lineWidth: 3, lineCap: 'round' })],
    }),
  )

  return new ScreenIcon(iconNode, {
    fill: ReactionsColors.screenBackgroundColorProperty,
  })
}
