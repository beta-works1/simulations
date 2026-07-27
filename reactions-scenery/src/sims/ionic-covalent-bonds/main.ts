import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { IonicCovalentStrings } from './IonicCovalentStrings.js'
import { IonicCovalentScreen } from './IonicCovalentScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = IonicCovalentStrings.titleStringProperty
  const screens = [new IonicCovalentScreen()]

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
