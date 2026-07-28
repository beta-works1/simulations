import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { RegularVsDiffuseStrings } from './RegularVsDiffuseStrings.js'
import { RegularVsDiffuseScreen } from './RegularVsDiffuseScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = RegularVsDiffuseStrings.titleStringProperty
  const screens = [new RegularVsDiffuseScreen()]

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
