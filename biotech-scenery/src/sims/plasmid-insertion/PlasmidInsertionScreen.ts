import { EmptySelfOptions, optionize4 } from 'scenerystack/phet-core'
import { Circle, Node, Path, Rectangle } from 'scenerystack/scenery'
import { Shape } from 'scenerystack/kite'
import { Screen, ScreenIcon, ScreenOptions } from 'scenerystack/sim'
import { Tandem } from 'scenerystack/tandem'
import { PlasmidInsertionModel } from './model/PlasmidInsertionModel.js'
import { PlasmidInsertionScreenView } from './view/PlasmidInsertionScreenView.js'
import { BiotechConstants } from '../../shared/BiotechConstants.js'
import { PlasmidInsertionStrings } from './PlasmidInsertionStrings.js'
import { BiotechColors } from '../../shared/BiotechColors.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & ScreenOptions

export class PlasmidInsertionScreen extends Screen<PlasmidInsertionModel, PlasmidInsertionScreenView> {
  public constructor(providedOptions?: Options) {
    const options = optionize4<Options, SelfOptions, ScreenOptions>()(
      {},
      BiotechConstants.SCREEN_OPTIONS,
      {
        name: PlasmidInsertionStrings.screen.labStringProperty,
        homeScreenIcon: createScreenIcon(),
        backgroundColorProperty: BiotechColors.screenBackgroundColorProperty,
        tandem: Tandem.OPT_OUT,
      },
      providedOptions,
    )

    super(
      () => new PlasmidInsertionModel(),
      (model) => new PlasmidInsertionScreenView(model),
      options,
    )
  }
}

function createScreenIcon(): ScreenIcon {
  const iconNode = new Rectangle(0, 0, 100, 100, {
    fill: '#083344',
    cornerRadius: 12,
  })
  const art = new Node()

  // Plasmid ring with a small gap and a highlighted recombinant seam.
  const ringShape = new Shape().arc(38, 50, 22, 0.5, Math.PI * 2 - 0.5, false)
  art.addChild(new Path(ringShape, { stroke: '#22c55e', lineWidth: 6, lineCap: 'round' }))
  const seamShape = new Shape().arc(38, 50, 22, -0.35, 0.35, false)
  art.addChild(new Path(seamShape, { stroke: '#eab308', lineWidth: 7, lineCap: 'round' }))

  // Target gene bar sliding toward the gap.
  art.addChild(
    new Rectangle(-16, -4.5, 32, 9, {
      cornerRadius: 3,
      fill: '#facc15',
      stroke: '#a16207',
      lineWidth: 1,
      x: 70,
      y: 24,
    }),
  )

  // Bacterium receiving the recombinant plasmid.
  art.addChild(new Circle(15, { fill: '#1abc9c', stroke: '#0e6655', lineWidth: 2, centerX: 70, centerY: 74 }))

  iconNode.addChild(art)
  return new ScreenIcon(iconNode, {
    fill: BiotechColors.screenBackgroundColorProperty,
  })
}
