// Must run before shared brand → init so splash/sim id is correct.
import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { WarmingStrings } from './WarmingStrings.js'
import { WarmingScreen } from './WarmingScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = WarmingStrings.titleStringProperty
  const screens = [new WarmingScreen()]

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
