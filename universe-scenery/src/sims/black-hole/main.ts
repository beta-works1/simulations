import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { BlackHoleStrings } from './BlackHoleStrings.js'
import { BlackHoleScreen } from './BlackHoleScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = BlackHoleStrings.titleStringProperty
  const screens = [new BlackHoleScreen()]
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
