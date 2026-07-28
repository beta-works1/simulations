import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { PlaneMirrorPeriscopeStrings } from './PlaneMirrorPeriscopeStrings.js'
import { PlaneMirrorPeriscopeScreen } from './PlaneMirrorPeriscopeScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = PlaneMirrorPeriscopeStrings.titleStringProperty
  const screens = [new PlaneMirrorPeriscopeScreen()]

  const options: SimOptions = {
    credits: {
      leadDesign: 'SimLab',
      softwareDevelopment: 'SimLab',
      team: 'Built with SceneryStack (PhET framework)',
      thanks: 'Inspired by PhET Interactive Simulations, University of Colorado Boulder.',
    },
  }

  const sim = new Sim(titleStringProperty, screens, options)
  sim.start()
})
