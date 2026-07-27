import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { PlasmidInsertionStrings } from './PlasmidInsertionStrings.js'
import { PlasmidInsertionScreen } from './PlasmidInsertionScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = PlasmidInsertionStrings.titleStringProperty
  const screens = [new PlasmidInsertionScreen()]

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
