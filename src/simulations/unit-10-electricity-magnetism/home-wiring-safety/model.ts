/** Home wiring overload & fuse safety — Unit 10, p.129. */

export interface WiringState {
  overloaded: boolean
  fuseIntact: boolean
  /** True when circuit is overloaded and fuse fails to protect. */
  fireRisk: boolean
  status: string
}

export function wiringSafety(overloaded: boolean, fuseIntact: boolean): WiringState {
  const fireRisk = overloaded && !fuseIntact
  let status: string
  if (!overloaded) {
    status = 'Normal load — safe current.'
  } else if (fuseIntact) {
    status = 'Overload! Fuse melts and breaks the circuit — protects the home.'
  } else {
    status = 'Danger: overload with no fuse — wires can overheat (fire risk).'
  }
  return { overloaded, fuseIntact, fireRisk, status }
}
