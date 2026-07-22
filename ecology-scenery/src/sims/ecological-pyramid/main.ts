// Must run before brand → splash → init so the sim name is registered.
import './setSimName.js'

// brand.js must load first among SceneryStack entry imports.
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { PyramidStrings } from './PyramidStrings.js'
import { PyramidScreen } from './PyramidScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = PyramidStrings.titleStringProperty
  const screens = [new PyramidScreen()]

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
