import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Logo } from './Logo'
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
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isWide, setIsWide] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchWrapRef = useRef<HTMLDivElement>(null)
  const searchInputId = useId()
  const location = useLocation()

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)')
    const apply = () => setIsWide(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
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
    setSearchOpen(false)
    setSearchQuery('')
  }, [location.pathname])

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

  const closeMenu = () => setMenuOpen(false)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
    setSearchOpen(false)
  }

  return (
    <>
      <div id="skip-nav">
        <a href="#page-content">Skip to Main Content</a>
      </div>

      <header id="site-header" className={isWide ? 'is-wide' : 'is-narrow'}>
        <div className="header-bar">
          <Link
            to="/"
            className="brand-link"
            onClick={closeMenu}
            aria-label="SimLab home"
          >
            <Logo />
          </Link>

          <div className="header-actions">
            {isWide && !searchOpen && (
              <nav className="primary-nav" aria-label="Primary">
                <NavLink
                  to="/simulations"
                  className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
                >
                  Simulations
                </NavLink>
              </nav>
            )}

            <div
              className={`header-search${searchOpen ? ' is-open' : ''}`}
              ref={searchWrapRef}
            >
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

        {!isWide && menuOpen && (
          <nav id="mobile-nav-panel" className="mobile-nav" aria-label="Primary">
            <NavLink
              to="/simulations"
              className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
              onClick={closeMenu}
            >
              Simulations
            </NavLink>
          </nav>
        )}
      </header>
    </>
  )
}
