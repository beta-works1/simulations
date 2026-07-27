import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { NeutralizationModel } from './model/NeutralizationModel.js'
import { NeutralizationScreenView } from './view/NeutralizationScreenView.js'
import { AcidsConstants } from '../../shared/AcidsConstants.js'
import { AcidsColors } from '../../shared/AcidsColors.js'
import { NeutralizationStrings } from './NeutralizationStrings.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class NeutralizationScreen extends Screen<NeutralizationModel, NeutralizationScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      AcidsConstants.SCREEN_OPTIONS,
      {
        name: NeutralizationStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: AcidsColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new NeutralizationModel(),
      (model) => new NeutralizationScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, {
    fill: '#0b1628',
    cornerRadius: 12,
  })

  // Acid beaker (red-ish, left).
  iconNode.addChild(
    new Rectangle(14, 38, 20, 26, { cornerRadius: 4, fill: '#ef4444', stroke: '#f8fafc', lineWidth: 1.5 }),
  )
  // Base beaker (blue-ish, right).
  iconNode.addChild(
    new Rectangle(66, 38, 20, 26, { cornerRadius: 4, fill: '#3b82f6', stroke: '#f8fafc', lineWidth: 1.5 }),
  )
  // Central mixture beaker (green-ish, neutral).
  iconNode.addChild(
    new Rectangle(38, 56, 24, 30, { cornerRadius: 5, fill: '#22c55e', stroke: '#f8fafc', lineWidth: 2 }),
  )
  iconNode.addChild(new Rectangle(43, 50, 14, 8, { cornerRadius: 3, fill: '#f8fafc', opacity: 0.85 }))
  // pH bubbles rising from the mixture.
  iconNode.addChild(new Circle(3, { fill: '#f8fafc', centerX: 46, centerY: 46, opacity: 0.85 }))
  iconNode.addChild(new Circle(2, { fill: '#f8fafc', centerX: 54, centerY: 42, opacity: 0.7 }))

  return new ScreenIcon(iconNode, {
    fill: AcidsColors.screenBackgroundColorProperty,
  })
}
