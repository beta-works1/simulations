/** Neuron action potential along axon — PTB Ch 2. Model only; Canvas draws state. */

export interface NeuronState {
  t: number
}

export function createNeuronState(): NeuronState {
  return { t: 0 }
}

/** Myelin enables saltatory conduction (faster impulse). */
export function conductionSpeed(myelin: boolean): number {
  return myelin ? 1.35 : 0.38
}

export function stepNeuron(s: NeuronState, dt: number, myelin: boolean, running: boolean): NeuronState {
  if (!running || dt <= 0) return s
  return { t: s.t + dt * conductionSpeed(myelin) }
}
