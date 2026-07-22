// Must run before shared brand → init so splash/sim id is correct.
import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { PredatorPreyStrings } from './PredatorPreyStrings.js'
import { PredatorPreyScreen } from './PredatorPreyScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = PredatorPreyStrings.titleStringProperty
  const screens = [new PredatorPreyScreen()]

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
