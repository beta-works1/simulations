import './registerName.js'
import '../../shared/brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { WaterPressureDepthStrings } from './WaterPressureDepthStrings.js'
import { WaterPressureDepthScreen } from './WaterPressureDepthScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = WaterPressureDepthStrings.titleStringProperty
  const screens = [new WaterPressureDepthScreen()]

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
