import { useMemo, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import { HeroPreview } from './hero/HeroPreview'
import { simulationOpenHref } from './SimulationGrid'
import {
  GRADES,
  getSimulationById,
  getSimulationsByGrade,
  simulations,
} from '../data/simulations'
import './Hero.css'

const ease = [0.22, 1, 0.36, 1] as const

/**
 * Drifting gas motes — the sims' own greenhouse-gas motif, not floating blobs.
 * Animated in CSS rather than JS: these run for the whole visit, so keeping them
 * off the main thread is what protects the hero's frame budget.
 */
const MOTES = [
  { left: 8, top: 62, size: 5, drift: 26, duration: 15, delay: 0 },
  { left: 17, top: 28, size: 3, drift: 34, duration: 19, delay: 1.4 },
  { left: 26, top: 74, size: 4, drift: 30, duration: 17, delay: 0.6 },
  { left: 38, top: 18, size: 3, drift: 38, duration: 22, delay: 2.2 },
  { left: 47, top: 55, size: 6, drift: 24, duration: 16, delay: 1.1 },
  { left: 58, top: 34, size: 3, drift: 32, duration: 20, delay: 3 },
  { left: 66, top: 78, size: 4, drift: 28, duration: 18, delay: 0.3 },
  { left: 74, top: 22, size: 5, drift: 36, duration: 23, delay: 1.9 },
  { left: 83, top: 58, size: 3, drift: 30, duration: 21, delay: 2.6 },
  { left: 92, top: 40, size: 4, drift: 34, duration: 17, delay: 0.9 },
]

export function Hero() {
  const reduce = useReducedMotion()

  const featureSim = useMemo(() => getSimulationById('global-warming'), [])
  const totalSims = simulations.length

  const rise = (delay = 0) =>
    reduce
      ? undefined
      : {
          initial: { opacity: 0, y: 22 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, delay, ease },
        }

  return (
    <section className="hero" aria-labelledby="hero-headline">
      <div className="hero-sky" aria-hidden="true">
        <span className="hero-ray hero-ray-1" />
        <span className="hero-ray hero-ray-2" />
        {!reduce &&
          MOTES.map((mote, i) => (
            <span
              key={i}
              className="hero-mote"
              style={
                {
                  left: `${mote.left}%`,
                  top: `${mote.top}%`,
                  width: mote.size,
                  height: mote.size,
                  '--mote-drift': `${-mote.drift}px`,
                  animationDuration: `${mote.duration}s`,
                  animationDelay: `${mote.delay}s`,
                } as CSSProperties
              }
            />
          ))}
      </div>

      <div className="hero-inner">
        <div className="hero-copy">
          <motion.p className="hero-eyebrow" {...rise(0)}>
            Free to use
            <span aria-hidden="true"> · </span>
            Grades 1–8
            <span aria-hidden="true"> · </span>
            Grade 8 follows the Punjab textbook
          </motion.p>

          <motion.h1 id="hero-headline" className="hero-headline" {...rise(0.08)}>
            Science you can <span className="hero-headline-mark">drag</span>, break,
            <br />
            and run again.
          </motion.h1>

          <motion.p className="hero-lede" {...rise(0.16)}>
            {totalSims} interactive science and math simulations for students and teachers — open
            one, change something, and watch what it does to the result.
          </motion.p>

          <motion.div className="hero-grades" {...rise(0.24)}>
            <p className="hero-grades-label" id="hero-grade-label">
              Jump to your grade
            </p>
            <ul className="hero-grade-chips" aria-labelledby="hero-grade-label">
              {GRADES.map((grade, i) => {
                const count = getSimulationsByGrade(grade).length
                return (
                  <motion.li
                    key={grade}
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.04, ease }}
                    whileHover={reduce ? undefined : { y: -3, scale: 1.04 }}
                    whileTap={reduce ? undefined : { scale: 0.97 }}
                  >
                    <Link
                      to={`/simulations?grade=${grade}`}
                      className="hero-grade-chip"
                      aria-label={`Grade ${grade} — ${count} simulation${count === 1 ? '' : 's'}`}
                    >
                      <span className="hero-grade-num">{grade}</span>
                      <span className="hero-grade-meta">{count}</span>
                    </Link>
                  </motion.li>
                )
              })}
            </ul>
          </motion.div>

          <motion.div className="hero-actions" {...rise(0.34)}>
            <motion.div
              whileHover={reduce ? undefined : { y: -2 }}
              whileTap={reduce ? undefined : { scale: 0.98 }}
            >
              <Link to="/simulations" className="hero-cta">
                Browse every simulation
                <span className="hero-cta-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            </motion.div>
            <a className="hero-jump" href="#subjects">
              What&rsquo;s inside
              <span aria-hidden="true"> ↓</span>
            </a>
          </motion.div>
        </div>

        <motion.div
          className="hero-stage"
          initial={reduce ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease }}
        >
          <HeroPreview
            simHref={featureSim ? simulationOpenHref(featureSim) : '/simulations?grade=8'}
            simLabel={featureSim ? featureSim.title : 'the simulation'}
          />
        </motion.div>
      </div>
    </section>
  )
}
