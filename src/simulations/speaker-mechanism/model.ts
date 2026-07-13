export interface SpeakerState {
  current: number
  frequency: number
  running: boolean
}

export const DEFAULT_SPEAKER_STATE: SpeakerState = {
  current: 0.7,
  frequency: 120,
  running: true,
}

export function coilOffset(current: number, frequency: number, time: number): number {
  const amplitude = current * 18
  return amplitude * Math.sin(2 * Math.PI * frequency * time)
}

export interface SoundWave {
  radius: number
  birth: number
  maxRadius: number
}

const WAVE_INTERVAL = 0.35

export function spawnWaves(
  waves: SoundWave[],
  time: number,
  lastSpawn: number,
  maxRadius: number,
): { waves: SoundWave[]; lastSpawn: number } {
  if (time - lastSpawn < WAVE_INTERVAL) return { waves, lastSpawn }
  return {
    waves: [...waves, { radius: 8, birth: time, maxRadius }],
    lastSpawn: time,
  }
}

export function advanceWaves(waves: SoundWave[], time: number, speed: number, dt: number): SoundWave[] {
  return waves
    .map((w) => ({ ...w, radius: w.radius + speed * dt }))
    .filter((w) => w.radius < w.maxRadius && time - w.birth < 3)
}

export function resetSpeaker(): SpeakerState {
  return { ...DEFAULT_SPEAKER_STATE }
}
