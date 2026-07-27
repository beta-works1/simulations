import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { AcidsPhScaleStrings } from './AcidsPhScaleStrings.js'
import { AcidsPhScaleScreen } from './AcidsPhScaleScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = AcidsPhScaleStrings.titleStringProperty
  const screens = [new AcidsPhScaleScreen()]

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
