import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { GalaxyTypesStrings } from './GalaxyTypesStrings.js'
import { GalaxyTypesScreen } from './GalaxyTypesScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = GalaxyTypesStrings.titleStringProperty
  const screens = [new GalaxyTypesScreen()]
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
