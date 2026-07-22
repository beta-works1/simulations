// brand.js must load first (SceneryStack import order).
import './brand.js'

import { onReadyToLaunch, Sim, SimOptions } from 'scenerystack/sim'
import { PhLabStrings } from './PhLabStrings.js'
import { PhLabScreen } from './phlab/PhLabScreen.js'

onReadyToLaunch(() => {
  const titleStringProperty = PhLabStrings.titleStringProperty
  const screens = [new PhLabScreen()]

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
