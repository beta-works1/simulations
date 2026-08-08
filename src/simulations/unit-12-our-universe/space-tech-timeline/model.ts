/** Space technology timeline — Unit 12, p.158. */

export type TimelineId = 'hubble' | 'probes' | 'tech'

export interface TimelineItem {
  id: TimelineId
  title: string
  yearHint: string
  detail: string
}

export const TIMELINE: TimelineItem[] = [
  {
    id: 'hubble',
    title: 'Hubble Space Telescope',
    yearHint: '1990–',
    detail: 'Orbiting telescope that sharpened our view of galaxies, nebulae, and deep space.',
  },
  {
    id: 'probes',
    title: 'Space probes',
    yearHint: 'Voyager & beyond',
    detail: 'Robotic probes visit planets and leave the solar system, sending data home.',
  },
  {
    id: 'tech',
    title: 'Everyday space tech',
    yearHint: 'Satellites',
    detail: 'GPS, weather forecasts, and communications ride on satellites developed for space.',
  },
]

export function timelineItem(id: TimelineId): TimelineItem {
  return TIMELINE.find((t) => t.id === id) ?? TIMELINE[0]
}
