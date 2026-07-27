import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { NaturalIndicatorModel } from './model/NaturalIndicatorModel.js'
import { NaturalIndicatorScreenView } from './view/NaturalIndicatorScreenView.js'
import { AcidsConstants } from '../../shared/AcidsConstants.js'
import { NaturalIndicatorStrings } from './NaturalIndicatorStrings.js'
import { AcidsColors } from '../../shared/AcidsColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class NaturalIndicatorScreen extends Screen<NaturalIndicatorModel, NaturalIndicatorScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      AcidsConstants.SCREEN_OPTIONS,
      {
        name: NaturalIndicatorStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: AcidsColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new NaturalIndicatorModel(),
      (model) => new NaturalIndicatorScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, {
    fill: '#0b1628',
    cornerRadius: 12,
  })

  // Dropper above the beaker.
  iconNode.addChild(new Rectangle(46, 10, 8, 30, { cornerRadius: 4, fill: '#94a3b8' }))
  iconNode.addChild(new Circle(9, { fill: '#cbd5e1', stroke: '#64748b', lineWidth: 2, centerX: 50, centerY: 12 }))
  iconNode.addChild(new Circle(3.5, { fill: '#8b5cf6', centerX: 50, centerY: 46 }))

  // Beaker with purple cabbage-juice liquid.
  iconNode.addChild(
    new Rectangle(30, 50, 40, 34, {
      cornerRadius: 6,
      fill: '#7c3aed',
      stroke: '#f8fafc',
      lineWidth: 2,
    }),
  )
  iconNode.addChild(new Rectangle(34, 40, 32, 10, { cornerRadius: 3, fill: '#f8fafc', opacity: 0.85 }))

  return new ScreenIcon(iconNode, {
    fill: AcidsColors.screenBackgroundColorProperty,
  })
}
