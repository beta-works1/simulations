import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { SolarCookerStrings } from './SolarCookerStrings.js'
import { SolarCookerScreen } from './SolarCookerScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = SolarCookerStrings.titleStringProperty
  const screens = [new SolarCookerScreen()]
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
