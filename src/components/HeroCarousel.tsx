import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './HeroCarousel.css'

const slides = [
  {
    id: 1,
    title: 'Explore. Experiment. Discover.',
    subtitle: 'Free interactive science experiment simulations',
    cta: 'Browse All Sims',
    href: '/simulations',
    gradient: 'linear-gradient(135deg, #1a5276 0%, #2980b9 50%, #3498db 100%)',
  },
  {
    id: 2,
    title: 'Learn Through Play',
    subtitle: 'Engage students with intuitive, game-like simulations',
    cta: 'Get Started',
    href: '/simulations',
    gradient: 'linear-gradient(135deg, #6c3483 0%, #8e44ad 50%, #a569bd 100%)',
  },
  {
    id: 3,
    title: 'Browse by Subject',
    subtitle: 'Physics, Chemistry, Biology, Earth Science, and Math',
    cta: 'View Physics Sims',
    href: '/simulations/physics',
    gradient: 'linear-gradient(135deg, #1e8449 0%, #27ae60 50%, #2ecc71 100%)',
  },
]

export function HeroCarousel() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="jumbotron-carousel">
      <div className="jumbotron-track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="jumbotron-item"
            style={{ background: slide.gradient }}
          >
            <div className="jumbotron-content">
              <h1>{slide.title}</h1>
              <h2>{slide.subtitle}</h2>
              <Link to={slide.href}>{slide.cta}</Link>
            </div>
          </div>
        ))}
      </div>

      <div className="jumbotron-dots">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={index === current ? 'active' : ''}
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => setCurrent(index)}
          />
        ))}
      </div>
    </div>
  )
}
