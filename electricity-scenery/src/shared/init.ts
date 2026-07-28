import { init, madeWithSceneryStackSplashDataURI } from 'scenerystack/init'
const name = (globalThis as { __ELECTRICITY_SIM_NAME__?: string }).__ELECTRICITY_SIM_NAME__ ?? 'electricity-sim'
init({
  name, version: '1.0.0', brand: 'made-with-scenerystack', locale: 'en',
  availableLocales: ['en'], splashDataURI: madeWithSceneryStackSplashDataURI,
  allowLocaleSwitching: false, supportsSound: true,
})
