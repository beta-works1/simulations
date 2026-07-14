/**
 * Grade 6 stub — proves grades[] metadata is not locked to Grade 8.
 * Minimal model/view; replace with a real balance-scale sim later.
 */

export interface BalanceStubState {
  leftMass: number
  rightMass: number
}

export function defaultBalanceStubState(): BalanceStubState {
  return { leftMass: 2, rightMass: 2 }
}

export function tipDirection(s: BalanceStubState): 'left' | 'right' | 'level' {
  const d = s.leftMass - s.rightMass
  if (Math.abs(d) < 0.05) return 'level'
  return d > 0 ? 'left' : 'right'
}
