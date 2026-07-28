import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { RainbowDispersionStrings } from './RainbowDispersionStrings.js'
import { RainbowDispersionScreen } from './RainbowDispersionScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = RainbowDispersionStrings.titleStringProperty
  const screens = [new RainbowDispersionScreen()]

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
