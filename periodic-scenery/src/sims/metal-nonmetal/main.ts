import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { MetalNonmetalStrings } from './MetalNonmetalStrings.js'
import { MetalNonmetalScreen } from './MetalNonmetalScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = MetalNonmetalStrings.titleStringProperty
  const screens = [new MetalNonmetalScreen()]

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
