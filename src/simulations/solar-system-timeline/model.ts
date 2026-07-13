export interface TimelineEvent {
  id: string
  yearLabel: string
  year: number
  title: string
  description: string
  era: 'formation' | 'planets' | 'exploration' | 'modern'
}

export interface SolarSystemTimelineState {
  progress: number
  running: boolean
}

export const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: 'formation',
    yearLabel: '4.6 Bya',
    year: -4_600_000_000,
    title: 'Solar System Forms',
    description: 'A rotating cloud of gas and dust collapses, forming the Sun and a protoplanetary disk.',
    era: 'formation',
  },
  {
    id: 'earth',
    yearLabel: '4.5 Bya',
    year: -4_500_000_000,
    title: 'Earth Accretes',
    description: 'Rocky planetesimals collide and merge; Earth grows in the inner solar system.',
    era: 'formation',
  },
  {
    id: 'moon',
    yearLabel: '4.4 Bya',
    year: -4_400_000_000,
    title: 'Moon Formation',
    description: 'A Mars-sized body collides with early Earth, ejecting debris that forms the Moon.',
    era: 'formation',
  },
  {
    id: 'planets-settle',
    yearLabel: '4.0 Bya',
    year: -4_000_000_000,
    title: 'Planets Settle',
    description: 'The eight planets clear their orbits; the solar system reaches a stable layout.',
    era: 'planets',
  },
  {
    id: 'life',
    yearLabel: '3.8 Bya',
    year: -3_800_000_000,
    title: 'Earliest Life',
    description: 'Simple organisms appear on Earth — the only known life in the solar system so far.',
    era: 'planets',
  },
  {
    id: 'telescope',
    yearLabel: '1609',
    year: 1609,
    title: 'Telescopic Era',
    description: 'Galileo observes Jupiter\'s moons, proving not everything orbits Earth.',
    era: 'exploration',
  },
  {
    id: 'apollo',
    yearLabel: '1969',
    year: 1969,
    title: 'Apollo 11',
    description: 'Humans first walk on the Moon — a giant leap in space exploration.',
    era: 'exploration',
  },
  {
    id: 'voyager',
    yearLabel: '1977',
    year: 1977,
    title: 'Voyager Probes',
    description: 'Voyager 1 & 2 launch to explore the outer planets and interstellar space.',
    era: 'exploration',
  },
  {
    id: 'hubble',
    yearLabel: '1990',
    year: 1990,
    title: 'Hubble Space Telescope',
    description: 'Orbiting above the atmosphere, Hubble revolutionizes our view of the universe.',
    era: 'modern',
  },
  {
    id: 'mars-rovers',
    yearLabel: '2012',
    year: 2012,
    title: 'Curiosity on Mars',
    description: 'NASA\'s Curiosity rover lands in Gale Crater to study Martian habitability.',
    era: 'modern',
  },
  {
    id: 'jwst',
    yearLabel: '2021',
    year: 2021,
    title: 'James Webb Telescope',
    description: 'JWST launches, peering at the earliest galaxies and exoplanet atmospheres.',
    era: 'modern',
  },
]

export const MIN_PROGRESS = 0
export const MAX_PROGRESS = TIMELINE_EVENTS.length - 1

export function eventAtProgress(progress: number): TimelineEvent {
  const idx = Math.round(Math.max(MIN_PROGRESS, Math.min(MAX_PROGRESS, progress)))
  return TIMELINE_EVENTS[idx]
}

export function stepTimeline(state: SolarSystemTimelineState, dt: number): SolarSystemTimelineState {
  if (!state.running) return state
  const speed = 0.35
  let next = state.progress + speed * dt
  if (next >= MAX_PROGRESS) {
    next = MAX_PROGRESS
    return { progress: next, running: false }
  }
  return { ...state, progress: next }
}

export function createInitialState(): SolarSystemTimelineState {
  return { progress: 0, running: false }
}

export function eraColor(era: TimelineEvent['era']): string {
  switch (era) {
    case 'formation':
      return '#f97316'
    case 'planets':
      return '#22c55e'
    case 'exploration':
      return '#38bdf8'
    case 'modern':
      return '#a78bfa'
  }
}
