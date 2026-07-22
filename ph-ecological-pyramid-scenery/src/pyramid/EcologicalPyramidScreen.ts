import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Rectangle } from 'scenerystack/scenery'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { PyramidColors, PyramidConstants } from '../common/PyramidColors.js'
import { PyramidStrings } from '../PyramidStrings.js'
import { EcologicalPyramidModel } from './model/EcologicalPyramidModel.js'
import { EcologicalPyramidScreenView } from './view/EcologicalPyramidScreenView.js'

type Options = EmptySelfOptions & ScreenOptions

export class EcologicalPyramidScreen extends Screen<EcologicalPyramidModel, EcologicalPyramidScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, EmptySelfOptions, ScreenOptions>()(
      {},
      PyramidConstants.SCREEN_OPTIONS,
      {
        name: PyramidStrings.screen.pyramidStringProperty,
        homeScreenIcon: createIcon(),
        backgroundColorProperty: PyramidColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new EcologicalPyramidModel(),
      (model) => new EcologicalPyramidScreenView(model),
      options,
    )
  }
}

function createIcon(): ScreenIcon {
  const icon = new Rectangle(0, 0, 100, 100, { fill: '#145a32', cornerRadius: 12 })
  icon.addChild(new Rectangle(35, 18, 30, 14, { fill: '#c0392b', cornerRadius: 2 }))
  icon.addChild(new Rectangle(25, 36, 50, 16, { fill: '#e67e22', cornerRadius: 2 }))
  icon.addChild(new Rectangle(15, 56, 70, 16, { fill: '#f1c40f', cornerRadius: 2 }))
  icon.addChild(new Rectangle(8, 76, 84, 16, { fill: '#27ae60', cornerRadius: 2 }))
  return new ScreenIcon(icon, { fill: PyramidColors.screenBackgroundColorProperty })
}
