// Must run before brand → splash → init so the sim name is registered.
import './setSimName.js'

// brand.js must load first among SceneryStack entry imports.
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { CarbonOxygenStrings } from './CarbonOxygenStrings.js'
import { CarbonOxygenScreen } from './CarbonOxygenScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = CarbonOxygenStrings.titleStringProperty
  const screens = [new CarbonOxygenScreen()]

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
