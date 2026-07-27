import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { FermentationStrings } from './FermentationStrings.js'
import { FermentationScreen } from './FermentationScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = FermentationStrings.titleStringProperty
  const screens = [new FermentationScreen()]

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
