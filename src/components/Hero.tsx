import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import './Hero.css'

const ease = [0.22, 1, 0.36, 1] as const

export function Hero() {
  const reduce = useReducedMotion()

  const rise = (delay = 0) =>
    reduce
      ? undefined
      : {
          initial: { opacity: 0, y: 28 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.75, delay, ease },
        }

  return (
    <section className="hero" aria-labelledby="hero-brand">
      <div className="hero-wash" aria-hidden="true" />

      <div className="hero-content">
        <motion.p id="hero-brand" className="hero-brand" aria-label="SimLab" {...rise(0)}>
          <span className="c-s">S</span>
          <span className="c-i">i</span>
          <span className="c-m">m</span>
          <span className="c-l">L</span>
          <span className="c-a">a</span>
          <span className="c-b">b</span>
        </motion.p>

        <motion.h1 className="hero-headline" {...rise(0.1)}>
          Science you can experiment with.
        </motion.h1>

        <motion.p className="hero-lede" {...rise(0.18)}>
          Free interactive simulations for Grades 1–8 — learn physics, chemistry, and biology by
          discovery.
        </motion.p>

        <motion.div className="hero-ctas" {...rise(0.28)}>
          <Link to="/simulations" className="hero-cta hero-cta-primary">
            Play with Sims
            <span className="hero-cta-arrow" aria-hidden="true">
              →
            </span>
          </Link>
          <Link to="/simulations?grade=8" className="hero-cta hero-cta-secondary">
            Open Grade 8
          </Link>
        </motion.div>

        <motion.p className="hero-scroll-hint" aria-hidden="true" {...rise(0.4)}>
          <span className="hero-scroll-line" />
          Scroll to explore
        </motion.p>
      </div>
    </section>
  )
}
