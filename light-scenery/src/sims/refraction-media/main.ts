import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { RefractionMediaStrings } from './RefractionMediaStrings.js'
import { RefractionMediaScreen } from './RefractionMediaScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = RefractionMediaStrings.titleStringProperty
  const screens = [new RefractionMediaScreen()]

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
