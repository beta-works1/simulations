import { init, madeWithSceneryStackSplashDataURI } from 'scenerystack/init'
const name = (globalThis as { __PERIODIC_SIM_NAME__?: string }).__PERIODIC_SIM_NAME__ ?? 'periodic-sim'
init({
  name, version: '1.0.0', brand: 'made-with-scenerystack', locale: 'en',
  availableLocales: ['en'], splashDataURI: madeWithSceneryStackSplashDataURI,
  allowLocaleSwitching: false, supportsSound: true,
})
