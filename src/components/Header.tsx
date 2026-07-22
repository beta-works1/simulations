import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Logo } from './Logo'
import { GRADES, gradeLabel } from '../data/simulations'
import './Header.css'

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <line
        x1="15"
        y1="15"
        x2="21"
        y2="21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

interface HeaderProps {
  onSearch?: (query: string) => void
}

export function Header({ onSearch }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [simsOpen, setSimsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isWide, setIsWide] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchWrapRef = useRef<HTMLDivElement>(null)
  const simsRef = useRef<HTMLDivElement>(null)
  const searchInputId = useId()
  const location = useLocation()
  const reduce = useReducedMotion()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)')
    const apply = () => setIsWide(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen && !isWide)
    return () => document.body.classList.remove('menu-open')
  }, [menuOpen, isWide])

  useEffect(() => {
    if (isWide) setMenuOpen(false)
  }, [isWide])

  useEffect(() => {
    setMenuOpen(false)
    setSimsOpen(false)
    setSearchOpen(false)
    setSearchQuery('')
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!searchOpen) return
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setSearchQuery('')
      }
    }
    const onPointer = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (searchWrapRef.current?.contains(el)) return
      if (el.closest?.('#search-toggle-button')) return
      setSearchOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onPointer)
    }
  }, [searchOpen])

  useEffect(() => {
    if (!simsOpen || !isWide) return
    const onPointer = (e: MouseEvent) => {
      if (!simsRef.current?.contains(e.target as Node)) setSimsOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSimsOpen(false)
    }
    window.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [simsOpen, isWide])

  const closeAll = () => {
    setMenuOpen(false)
    setSimsOpen(false)
  }

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
    setSearchOpen(false)
  }

  const simsLinks = (
    <>
      <NavLink to="/simulations" end onClick={closeAll}>
        All Grades
      </NavLink>
      {GRADES.map((grade) => (
        <NavLink key={grade} to={`/simulations?grade=${grade}`} onClick={closeAll}>
          {gradeLabel(grade)}
        </NavLink>
      ))}
    </>
  )

  return (
    <>
      <div id="skip-nav">
        <a href="#page-content">Skip to Main Content</a>
      </div>

      <motion.header
        id="site-header"
        className={[
          isWide ? 'is-wide' : 'is-narrow',
          scrolled || !isHome ? 'is-solid' : 'is-transparent',
          isHome ? 'on-home' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        initial={reduce ? false : { y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="header-bar">
          <Link to="/" className="brand-link" onClick={closeAll} aria-label="SimLab home">
            <Logo />
          </Link>

          <div className="header-actions">
            {isWide && !searchOpen && (
              <nav className="primary-nav" aria-label="Primary">
                <div className="nav-dropdown" ref={simsRef}>
                  <button
                    type="button"
                    className={`nav-link dropdown-trigger${simsOpen || location.pathname.startsWith('/simulations') ? ' is-active' : ''}`}
                    aria-expanded={simsOpen}
                    aria-haspopup="true"
                    onClick={() => setSimsOpen((o) => !o)}
                  >
                    Simulations
                    <span className="caret" aria-hidden="true" />
                  </button>
                  <AnimatePresence>
                    {simsOpen && (
                      <motion.div
                        className="dropdown-menu"
                        initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                      >
                        {simsLinks}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <NavLink
                  to="/about"
                  className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
                >
                  About
                </NavLink>
              </nav>
            )}

            <div className={`header-search${searchOpen ? ' is-open' : ''}`} ref={searchWrapRef}>
              {searchOpen ? (
                <form className="inline-search-form" role="search" onSubmit={handleSearchSubmit}>
                  <label htmlFor={searchInputId} className="screen-reader-only">
                    Search simulations
                  </label>
                  <input
                    ref={inputRef}
                    id={searchInputId}
                    type="search"
                    placeholder="Search experiments…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoComplete="off"
                    enterKeyHint="search"
                  />
                  <button type="submit" className="icon-button" aria-label="Submit search">
                    <SearchIcon />
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Close search"
                    onClick={() => {
                      setSearchOpen(false)
                      setSearchQuery('')
                    }}
                  >
                    <CloseIcon />
                  </button>
                </form>
              ) : (
                <button
                  id="search-toggle-button"
                  type="button"
                  className="icon-button"
                  aria-label="Open search"
                  aria-expanded={false}
                  onClick={() => {
                    setSearchOpen(true)
                    setMenuOpen(false)
                    setSimsOpen(false)
                  }}
                >
                  <SearchIcon />
                </button>
              )}
            </div>

            {!isWide && (
              <button
                type="button"
                className={`icon-button hamburger${menuOpen ? ' is-open' : ''}`}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                aria-controls="mobile-nav-panel"
                onClick={() => {
                  setMenuOpen((o) => !o)
                  setSearchOpen(false)
                }}
              >
                <span className="hamburger-lines" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {!isWide && menuOpen && (
            <motion.nav
              id="mobile-nav-panel"
              className="mobile-nav"
              aria-label="Primary"
              initial={reduce ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="mobile-nav-label">Simulations</p>
              <div className="mobile-sims-links">{simsLinks}</div>
              <NavLink
                to="/about"
                className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
                onClick={closeAll}
              >
                About
              </NavLink>
            </motion.nav>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  )
}
