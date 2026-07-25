import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Node, Path, Rectangle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { DnaZoomModel } from './model/DnaZoomModel.js'
import { DnaZoomScreenView } from './view/DnaZoomScreenView.js'
import { HeredityConstants } from '../../shared/HeredityConstants.js'
import { DnaZoomStrings } from './DnaZoomStrings.js'
import { HeredityColors } from '../../shared/HeredityColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class DnaZoomScreen extends Screen<DnaZoomModel, DnaZoomScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      HeredityConstants.SCREEN_OPTIONS,
      {
        name: DnaZoomStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: HeredityColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new DnaZoomModel(),
      (model) => new DnaZoomScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, {
    fill: '#2e1065',
    cornerRadius: 12,
  })
  const strands = new Node()
  const shapeA = new Shape()
  const shapeB = new Shape()
  for (let i = 0; i <= 40; i++) {
    const t = i / 40
    const x = 18 + t * 64
    const yA = 50 + Math.sin(t * Math.PI * 2.2) * 28
    const yB = 50 + Math.sin(t * Math.PI * 2.2 + Math.PI) * 28
    if (i === 0) {
      shapeA.moveTo(x, yA)
      shapeB.moveTo(x, yB)
    }
    else {
      shapeA.lineTo(x, yA)
      shapeB.lineTo(x, yB)
    }
  }
  strands.addChild(new Path(shapeA, { stroke: '#22d3ee', lineWidth: 5, lineCap: 'round' }))
  strands.addChild(new Path(shapeB, { stroke: '#fb7185', lineWidth: 5, lineCap: 'round' }))
  for (let i = 4; i <= 36; i += 8) {
    const t = i / 40
    const x = 18 + t * 64
    const yA = 50 + Math.sin(t * Math.PI * 2.2) * 28
    const yB = 50 + Math.sin(t * Math.PI * 2.2 + Math.PI) * 28
    strands.addChild(new Circle(3, { fill: '#facc15', centerX: x, centerY: (yA + yB) / 2 }))
  }
  iconNode.addChild(strands)
  return new ScreenIcon(iconNode, {
    fill: HeredityColors.screenBackgroundColorProperty,
  })
}
