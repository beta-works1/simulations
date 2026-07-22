import { EmptySelfOptions, optionize } from 'scenerystack/phet-core'
import { Panel, PanelOptions, RectangularPushButton } from 'scenerystack/sun'
import { Text, VBox } from 'scenerystack/scenery'
import { PhetFont } from 'scenerystack/scenery-phet'
import { PhLabModel } from '../model/PhLabModel.js'

type SelfOptions = EmptySelfOptions
type Options = SelfOptions & PanelOptions

/**
 * Step-by-step coach panel (Do this / Why / Litmus tip).
 */
export class GuidePanel extends Panel {
  public constructor(model: PhLabModel, providedOptions?: Options) {
    const options = optionize<Options, SelfOptions, PanelOptions>()(
      {
        xMargin: 14,
        yMargin: 12,
        stroke: '#2dd4bf',
        lineWidth: 2,
        fill: 'rgba(15, 23, 42, 0.94)',
        cornerRadius: 12,
      },
      providedOptions,
    )

    const contentWidth = (providedOptions?.maxWidth as number | undefined) ?? 260

    const stepLabel = new Text(model.guideStepLabelProperty, {
      font: new PhetFont(12),
      fill: '#5eead4',
      maxWidth: contentWidth,
    })
    const title = new Text(model.guideTitleProperty, {
      font: new PhetFont({ size: 15, weight: 'bold' }),
      fill: '#f8fafc',
      maxWidth: contentWidth,
    })
    const doThis = new Text(model.guideDoProperty, {
      font: new PhetFont(12),
      fill: '#e2e8f0',
      maxWidth: contentWidth,
    })
    const why = new Text(model.guideWhyProperty, {
      font: new PhetFont(11),
      fill: '#94a3b8',
      maxWidth: contentWidth,
    })
    const tip = new Text(model.guideTipProperty, {
      font: new PhetFont(11),
      fill: '#fbbf24',
      maxWidth: contentWidth,
    })

    const mk = (label: string, listener: () => void, color: string) =>
      new RectangularPushButton({
        content: new Text(label, { font: new PhetFont(11), fill: '#0f172a', maxWidth: contentWidth - 24 }),
        baseColor: color,
        xMargin: 8,
        yMargin: 5,
        listener,
        minWidth: contentWidth - 8,
      })

    const doLabel = new Text('Do this:', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#67e8f9',
    })
    const whyLabel = new Text('Why:', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#94a3b8',
    })
    const tipLabel = new Text('Litmus tip:', {
      font: new PhetFont({ size: 11, weight: 'bold' }),
      fill: '#fbbf24',
    })

    const content = new VBox({
      align: 'left',
      spacing: 5,
      children: [
        stepLabel,
        title,
        doLabel,
        doThis,
        whyLabel,
        why,
        tipLabel,
        tip,
        mk('Start guided lab', () => model.startGuide(), '#5eead4'),
        mk('Next / Skip', () => model.skipGuideStep(), '#a5b4fc'),
        mk('Replay', () => model.replayGuide(), '#fda4af'),
      ],
    })

    super(content, options)
  }
}
