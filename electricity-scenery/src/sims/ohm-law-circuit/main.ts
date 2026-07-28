import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { OhmLawCircuitStrings } from './OhmLawCircuitStrings.js'
import { OhmLawCircuitScreen } from './OhmLawCircuitScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = OhmLawCircuitStrings.titleStringProperty
  const screens = [new OhmLawCircuitScreen()]
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
