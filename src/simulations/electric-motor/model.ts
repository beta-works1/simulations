export interface MotorState {
  current: number
  running: boolean
}

export const DEFAULT_MOTOR_STATE: MotorState = {
  current: 0.6,
  running: true,
}

/** Angular speed (rad/s) from current (0–1 A scale). */
export function motorSpeed(current: number): number {
  return current * 4.5
}

export function resetMotor(): MotorState {
  return { ...DEFAULT_MOTOR_STATE }
}
